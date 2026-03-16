import * as THREE from 'three'
import { Vector3, Color } from 'three'
import { validateEffectCode } from './validator'
import type { Effect, CompiledEffect, CompiledEffectFn, Control } from './types'

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export function compileEffect(effect: Effect): Result<CompiledEffect> {
  // Step 1: Static validation (security boundary)
  const validation = validateEffectCode(effect.code)
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join('; ') }
  }

  // Step 2: Compile the function body
  // The raw function accepts addControl (5 args) during dry-run, but at
  // runtime is called with getControl (1 arg). We type the raw form loosely
  // and cast to CompiledEffectFn only in the final output.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawFn: (...args: any[]) => void
  try {
    rawFn = new Function(
      'i', 'count', 'target', 'color', 'time', 'THREE',
      'addControl', 'setInfo', 'textPoints',
      effect.code,
    ) as (...args: unknown[]) => void
  } catch (e) {
    return { ok: false, error: `Compilation error: ${(e as Error).message}` }
  }

  // Step 3: Dry run to collect controls and catch runtime errors
  const controls: Control[] = []
  const controlSet = new Set<string>()
  let info = { title: effect.name, description: effect.description }

  const addControl = (id: string, label: string, min: number, max: number, initial: number): number => {
    if (!controlSet.has(id)) {
      controlSet.add(id)
      controls.push({ id, label, min, max, initial, value: initial })
    }
    return initial
  }

  const setInfo = (title: string, description: string) => {
    info = { title, description }
  }

  const target = new Vector3()
  const color = new Color()

  try {
    for (let i = 0; i < Math.min(effect.particleCount, 100); i++) {
      target.set(0, 0, 0)
      color.set(1, 1, 1)
      rawFn(i, 100, target, color, 0, THREE, addControl, setInfo, undefined)
    }
  } catch (e) {
    return { ok: false, error: `Runtime error: ${(e as Error).message}` }
  }

  // Step 4: NaN guard — run once more and check output
  target.set(0, 0, 0)
  color.set(1, 1, 1)
  try {
    rawFn(0, 100, target, color, 0, THREE, addControl, setInfo, undefined)
  } catch (e) {
    return { ok: false, error: `Runtime error: ${(e as Error).message}` }
  }

  if (!isFinite(target.x) || !isFinite(target.y) || !isFinite(target.z)) {
    return { ok: false, error: 'Effect produces NaN/Infinity positions' }
  }

  return { ok: true, value: { fn: rawFn as CompiledEffectFn, controls, info } }
}
