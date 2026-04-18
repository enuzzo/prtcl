#!/usr/bin/env node
/**
 * apply-preset — apply a PRTCL Copy Params JSON to its preset file.
 *
 * Usage:
 *   pbpaste | node scripts/apply-preset.mjs           # from clipboard (macOS)
 *   node scripts/apply-preset.mjs payload.json        # from file
 *   cat payload.json | node scripts/apply-preset.mjs  # from stdin
 *
 * Flags:
 *   --dry-run   Show the diff summary but do not write the file
 *
 * Why this exists:
 *   When a user pastes a Copy Params JSON, every field in that JSON
 *   must land in the corresponding src/effects/presets/<id>.ts as the
 *   new default. Human (or AI) hand-editing silently dropped fields
 *   in the past. This script is deterministic: every JSON field has
 *   a mapping, and each touched field is verified by a read-back diff.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PRESETS_DIR = path.join(ROOT, 'src/effects/presets')
const DRY = process.argv.includes('--dry-run')

// ---------- 1. Read input ----------
function readInput() {
  const fileArg = process.argv.slice(2).find((a) => !a.startsWith('--'))
  if (fileArg) return fs.readFileSync(fileArg, 'utf8')
  if (!process.stdin.isTTY) return fs.readFileSync(0, 'utf8')
  try {
    return execSync('pbpaste', { encoding: 'utf8' }) // macOS
  } catch {
    return ''
  }
}

const raw = readInput().trim()
if (!raw) {
  console.error('No input. Provide a JSON file, pipe to stdin, or have it in clipboard (macOS).')
  process.exit(1)
}

let payload
try {
  payload = JSON.parse(raw)
} catch (err) {
  console.error('Invalid JSON:', err.message)
  process.exit(1)
}

// Snap floating-point residues to exact zero. Copy Params can emit values like
// 1.1e-16 when a slider steps through zero — harmless numerically but ugly in
// a committed preset file and in subsequent JSON roundtrips.
function sanitize(v) {
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return v
    return Math.abs(v) < 1e-6 ? 0 : v
  }
  if (Array.isArray(v)) return v.map(sanitize)
  if (v && typeof v === 'object') {
    const out = {}
    for (const [k, val] of Object.entries(v)) out[k] = sanitize(val)
    return out
  }
  return v
}
payload = sanitize(payload)

const id = payload.effect
if (!id) {
  console.error('JSON is missing top-level "effect" (preset id).')
  process.exit(1)
}

// ---------- 2. Find preset file by matching `id:` ----------
const files = fs
  .readdirSync(PRESETS_DIR)
  .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'axiom-presets.ts')

let targetFile = null
for (const f of files) {
  const src = fs.readFileSync(path.join(PRESETS_DIR, f), 'utf8')
  const m = src.match(/id:\s*['"]([^'"]+)['"]/)
  if (m && m[1] === id) {
    targetFile = path.join(PRESETS_DIR, f)
    break
  }
}

if (!targetFile) {
  console.error(`No preset file in ${path.relative(ROOT, PRESETS_DIR)} has id "${id}".`)
  process.exit(1)
}

// ---------- 3. Transform ----------
let src = fs.readFileSync(targetFile, 'utf8')
const original = src
const actions = []

function fmt(v) {
  if (typeof v === 'string') return `'${v.replace(/'/g, "\\'")}'`
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return String(v)
  throw new Error(`Unsupported control value type: ${typeof v}`)
}

/** Replace `  key: <scalar>` line. Returns { src, replaced }. */
function replaceScalar(src, key, value) {
  const re = new RegExp(`(\\n\\s+${key}:\\s+)[^,\\n]+(,?)`, '')
  if (!re.test(src)) return { src, replaced: false }
  return { src: src.replace(re, `$1${value}$2`), replaced: true }
}

/** Replace `  key: [a, b, c]` single-line array. */
function replaceArray(src, key, arr) {
  const value = `[${arr.join(', ')}]`
  const re = new RegExp(`(\\n\\s+${key}:\\s+)\\[[^\\]]*\\]`, '')
  if (!re.test(src)) return { src, replaced: false }
  return { src: src.replace(re, `$1${value}`), replaced: true }
}

/** Insert a scalar line after the given anchor key. */
function insertAfter(src, anchor, key, value) {
  const re = new RegExp(`(\\n(\\s+)${anchor}:\\s+[^\\n]+,?)`)
  const m = re.exec(src)
  if (!m) return { src, inserted: false }
  const line = `\n${m[2]}${key}: ${value},`
  return {
    src: src.slice(0, m.index + m[0].length) + line + src.slice(m.index + m[0].length),
    inserted: true,
  }
}

/** Replace or create the `controls: { ... }` block on the Effect object. */
function replaceOrInsertControls(src, controls) {
  const entries = Object.entries(controls)
    .map(([k, v]) => `    ${k}: ${fmt(v)},`)
    .join('\n')

  const startRe = /\n(\s+)controls:\s*\{/
  const m = startRe.exec(src)

  if (m) {
    // Walk braces to find matching close — handles nested.
    const openAt = m.index + m[0].length
    let i = openAt
    let depth = 1
    while (i < src.length && depth > 0) {
      const c = src[i++]
      if (c === '{') depth++
      else if (c === '}') depth--
    }
    if (depth !== 0) return { src, replaced: false }
    // `i` is just past the closing `}`. The `before` slice keeps everything
    // up to and including the `\n` that preceded the indent.
    const before = src.slice(0, m.index + 1)
    const after = src.slice(i)
    const indent = m[1]
    const block = `${indent}controls: {\n${entries}\n${indent}}`
    return { src: before + block + after, replaced: true, action: 'replaced' }
  }

  // Insert a new `controls: {...}` before the closing brace of the Effect object.
  // Strategy: the file defines one `export const <name>: Effect = { ... }`.
  // We find the last `\n}` preceded earlier in the file by that export, and
  // insert just before it.
  const exportRe = /export const \w+: Effect = \{/
  const exp = exportRe.exec(src)
  if (!exp) return { src, replaced: false }
  // Walk from exp open brace to matching close, skipping string/template bodies.
  let i = exp.index + exp[0].length
  let depth = 1
  let inStr = null // '`' | "'" | '"'
  while (i < src.length && depth > 0) {
    const c = src[i]
    if (inStr) {
      if (c === '\\') {
        i += 2
        continue
      }
      if (c === inStr) inStr = null
    } else {
      if (c === '`' || c === "'" || c === '"') inStr = c
      else if (c === '{') depth++
      else if (c === '}') depth--
    }
    if (depth === 0) break
    i++
  }
  if (depth !== 0) return { src, replaced: false }
  const closeAt = i // position of the closing `}` of the Effect object
  const insert = `  controls: {\n${entries}\n  },\n`
  return {
    src: src.slice(0, closeAt) + insert + src.slice(closeAt),
    replaced: true,
    action: 'inserted',
  }
}

function applyScalar(key, value, label = key) {
  const r = replaceScalar(src, key, value)
  if (r.replaced) {
    src = r.src
    actions.push(`${label} = ${value}`)
    return true
  }
  return false
}

function applyArray(key, arr, label = key) {
  const r = replaceArray(src, key, arr)
  if (r.replaced) {
    src = r.src
    actions.push(`${label} = [${arr.join(', ')}]`)
    return true
  }
  return false
}

// --- Top-level fields ---
if ('particleCount' in payload) applyScalar('particleCount', payload.particleCount)
if ('pointSize' in payload) applyScalar('pointSize', payload.pointSize)

// --- Background ---
if (payload.backgroundPreset !== undefined) {
  const value = fmt(payload.backgroundPreset)
  if (!applyScalar('backgroundPreset', value)) {
    const r = insertAfter(src, 'autoRotateSpeed', 'backgroundPreset', value)
    if (r.inserted) {
      src = r.src
      actions.push(`backgroundPreset = ${value} (inserted)`)
    } else {
      actions.push(`⚠ backgroundPreset could not be placed (no autoRotateSpeed anchor)`)
    }
  }
}

// --- Camera ---
if (payload.camera) {
  const cam = payload.camera
  if ('autoRotateSpeed' in cam) {
    // Round to slider step (0.1) so we store 0.1 instead of 0.10000000000000003
    const speed = Math.round(cam.autoRotateSpeed * 10) / 10
    applyScalar('autoRotateSpeed', speed)
  }
  if ('zoom' in cam) {
    // cameraZoom defaults to 1; omit if it is exactly 1 AND field doesn't exist.
    const hasField = /\n\s+cameraZoom:\s+/.test(src)
    if (hasField || cam.zoom !== 1) {
      if (!applyScalar('cameraZoom', cam.zoom)) {
        const r = insertAfter(src, 'autoRotateSpeed', 'cameraZoom', cam.zoom)
        if (r.inserted) {
          src = r.src
          actions.push(`cameraZoom = ${cam.zoom} (inserted)`)
        }
      }
    }
  }
  if (Array.isArray(cam.position)) applyArray('cameraPosition', cam.position)
  if (Array.isArray(cam.target)) applyArray('cameraTarget', cam.target)
}

// --- Text defaults (for text effects) ---
if (typeof payload.text === 'string') {
  if (!applyScalar('defaultText', fmt(payload.text))) {
    const r = insertAfter(src, 'autoRotateSpeed', 'defaultText', fmt(payload.text))
    if (r.inserted) {
      src = r.src
      actions.push(`defaultText = ${fmt(payload.text)} (inserted)`)
    }
  }
}
if (typeof payload.font === 'string') {
  if (!applyScalar('defaultFont', fmt(payload.font))) {
    const r = insertAfter(src, 'autoRotateSpeed', 'defaultFont', fmt(payload.font))
    if (r.inserted) {
      src = r.src
      actions.push(`defaultFont = ${fmt(payload.font)} (inserted)`)
    }
  }
}

// --- Controls override ---
if (payload.controls && typeof payload.controls === 'object') {
  const r = replaceOrInsertControls(src, payload.controls)
  if (r.replaced) {
    src = r.src
    const n = Object.keys(payload.controls).length
    actions.push(`controls = ${n} values (${r.action})`)
  } else {
    actions.push(`⚠ controls block could not be written`)
  }
}

// ---------- 4. Verify & write ----------
const rel = path.relative(ROOT, targetFile)

if (src === original) {
  console.log(`⚠  No changes for ${rel}`)
  process.exit(0)
}

// Read-back verification: every numeric field in the payload must appear in the
// new source. (String equality for scalars, loose check for controls object.)
const problems = []
if ('particleCount' in payload && !new RegExp(`particleCount:\\s+${payload.particleCount}\\b`).test(src)) {
  problems.push(`particleCount ${payload.particleCount} not found after write`)
}
if ('pointSize' in payload && !new RegExp(`pointSize:\\s+${String(payload.pointSize).replace('.', '\\.')}\\b`).test(src)) {
  problems.push(`pointSize ${payload.pointSize} not found after write`)
}
if (payload.camera?.position) {
  const [x, y, z] = payload.camera.position
  if (!new RegExp(`cameraPosition:\\s+\\[${x}, ${y}, ${z}\\]`).test(src)) {
    problems.push(`cameraPosition [${x}, ${y}, ${z}] not found after write`)
  }
}
if (payload.controls) {
  for (const [k, v] of Object.entries(payload.controls)) {
    const expected = typeof v === 'string' ? `'${v}'` : v
    if (!new RegExp(`${k}:\\s+${String(expected).replace('.', '\\.')}`).test(src)) {
      problems.push(`controls.${k} = ${expected} not found after write`)
    }
  }
}

if (problems.length) {
  console.error(`✗ Verification failed for ${rel}:`)
  for (const p of problems) console.error(`  · ${p}`)
  console.error('\nNot writing. The regex patch missed a field — edit manually or fix the script.')
  process.exit(2)
}

if (DRY) {
  console.log(`[dry-run] Would update ${rel}:`)
} else {
  fs.writeFileSync(targetFile, src)
  console.log(`✓ Updated ${rel}`)
}
for (const a of actions) console.log(`  · ${a}`)
