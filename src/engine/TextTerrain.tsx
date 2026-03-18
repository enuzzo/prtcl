import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

/**
 * Text Terrain — a landscape of letters on a noise terrain.
 * Letters fall from the sky tumbling and spinning, then settle onto the
 * surface. Faithful port of prisoner849's TextTerrain demo adapted
 * for the PRTCL dark-background aesthetic.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const ATLAS_DIM = 8

const MANIFESTO = "Here's to the ones who never read the manual. The tinkerers. The overthinkers. The dangerously caffeinated. The ones with solder burns and beautiful ideas. The square pegs who 3D-printed their own holes. They ship things that don't scale. They build things nobody asked for. They mass-produce prototypes of problems that don't exist yet. You can ignore them. You can fund them. You can ask them why they didn't just use Canva. About the only thing you can't do is get them to stop making another version. Because they don't optimize they obsess. They don't consume they void warranties. They don't dream they compile. They stare at a blank terminal and see a universe. They look at a datasheet and see a sculpture. They buy one LED and end up with a thousand. They're the reason there's flux on the kitchen table and a Raspberry Pi doing something gorgeous that no one will ever see. Maybe they have to be unreasonable. How else do you turn noise into music code into light or a weekend into a working prototype of something the world didn't know it was missing. We don't make tools for the reasonable ones. We make tools for these idiots. Because the ones absurd enough to think a single particle can change how you see the world are usually right."

const AURELIUS = "The happiness of your life depends upon the quality of your thoughts. Waste no more time arguing about what a good man should be. Be one. The best revenge is to be unlike him who performed the injury. Very little is needed to make a happy life. It is all within yourself in your way of thinking. You have power over your mind not outside events. Realize this and you will find strength. The soul becomes dyed with the color of its thoughts. When you arise in the morning think of what a privilege it is to be alive to think to enjoy to love."

/** Attempt at decent 2D noise from layered sine — produces visible rolling hills */
function noise2D(x: number, z: number): number {
  // Layer 1: big rolling hills
  const n1 = Math.sin(x * 0.8 + 1.3) * Math.cos(z * 0.6 + 0.7)
  // Layer 2: medium bumps
  const n2 = Math.sin(x * 1.7 + z * 1.3 + 2.1) * 0.4
  // Layer 3: small ripples
  const n3 = Math.cos(x * 3.1 - z * 2.3 + 0.7) * 0.15
  return n1 + n2 + n3
}

function getTerrainY(x: number, z: number): number {
  return noise2D(x * 0.04, z * 0.04) * 7.5
}

function createAtlasTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!
  const texSize = 2048
  c.width = texSize
  c.height = texSize
  ctx.clearRect(0, 0, texSize, texSize)

  const dimStep = texSize / ATLAS_DIM
  for (let i = 0; i < ALPHABET.length; i++) {
    const tileX = i % ATLAS_DIM
    const tileY = Math.floor(i / ATLAS_DIM)
    const x = (tileX + 0.5) * dimStep
    const y = texSize - (tileY + 0.5) * dimStep
    ctx.fillStyle = 'rgba(255, 255, 255, 1)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `bold ${dimStep * 0.9}px Arial`
    ctx.fillText(ALPHABET[i], x, y)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Map a character to its atlas index */
function charToIdx(ch: string): number {
  const idx = ALPHABET.indexOf(ch)
  return idx >= 0 ? idx : Math.floor(Math.random() * ALPHABET.length)
}

/** Build letter indices from text content for the grid */
function textToLetterIndices(text: string, count: number): Float32Array {
  const arr = new Float32Array(count)
  // Filter to only alphabetic chars
  const chars = text.split('').filter(c => ALPHABET.includes(c))
  if (chars.length === 0) {
    // Fallback to random
    for (let i = 0; i < count; i++) arr[i] = Math.floor(Math.random() * ALPHABET.length)
  } else {
    for (let i = 0; i < count; i++) {
      arr[i] = charToIdx(chars[i % chars.length])
    }
  }
  return arr
}

interface TileState {
  targetY: number
  targetRot: THREE.Euler
  pos: THREE.Vector3
  inAction: boolean
  animProgress: number
  animDuration: number
  startRot: THREE.Vector3
}

const PALETTES = [
  // PRTCL: magenta + lime
  (depth: number) => {
    const c = new THREE.Color()
    c.setHSL(Math.random() < 0.5 ? 0.89 : 0.25, 0.9, 0.3 + depth * 0.4)
    return c
  },
  // Typewriter: near-white
  (depth: number) => {
    const c = new THREE.Color()
    c.setHSL(0.1, 0.05, 0.6 + depth * 0.35)
    return c
  },
  // Vintage: sepia/amber
  (depth: number) => {
    const c = new THREE.Color()
    c.setHSL(0.08 + Math.random() * 0.04, 0.5, 0.25 + depth * 0.35)
    return c
  },
  // Matrix: phosphor green
  (depth: number) => {
    const c = new THREE.Color()
    c.setHSL(0.33, 0.8, 0.15 + depth * 0.5)
    return c
  },
]

// Text content presets
const TEXT_CONTENTS: Record<number, string> = {
  0: '', // Custom — use random
  1: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  2: MANIFESTO,
  3: AURELIUS,
}

export function TextTerrain() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const clockRef = useRef(0)

  const particleCount = useStore((s) => s.particleCount)
  const controls = useStore((s) => s.controls)

  const tileDim = useMemo(() => Math.max(10, Math.floor(Math.sqrt(Math.min(particleCount, 40000)))), [particleCount])
  const totalTiles = tileDim * tileDim

  const atlasTexture = useMemo(() => createAtlasTexture(), [])

  // Determine text content from control
  const contentIdx = Math.round(controls.find(c => c.id === 'terrainText')?.value ?? 2)
  const textContent = TEXT_CONTENTS[contentIdx] ?? ''

  // Per-instance letter indices — from text content or random
  const letterIndices = useMemo(() => {
    if (textContent) {
      return textToLetterIndices(textContent, totalTiles)
    }
    return new Float32Array(Array.from({ length: totalTiles }, () =>
      Math.floor(Math.random() * ALPHABET.length)
    ))
  }, [totalTiles, textContent])

  // Geometry
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.9, 0.9)
    g.setAttribute('letterIdx', new THREE.InstancedBufferAttribute(letterIndices, 1))
    return g
  }, [letterIndices])

  // Custom material with atlas UV mapping
  const material = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      map: atlasTexture,
      transparent: true,
      alphaTest: 0.01,
      side: THREE.DoubleSide,
    })

    m.onBeforeCompile = (shader) => {
      shader.vertexShader = `
        attribute float letterIdx;
        varying float vLetterIdx;
        ${shader.vertexShader}
      `.replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        vLetterIdx = letterIdx;`
      )

      shader.fragmentShader = `
        varying float vLetterIdx;
        ${shader.fragmentShader}
      `.replace(
        '#include <map_fragment>',
        `
        float lIdx = floor(vLetterIdx + 0.1);
        float tileStep = 1.0 / 8.0;
        float u = mod(lIdx, 8.0);
        float v = floor(lIdx / 8.0);
        vec2 iUv = (vec2(u, v) + vMapUv) * tileStep;
        vec4 sampledDiffuseColor = texture2D(map, iUv);
        diffuseColor *= sampledDiffuseColor;
        `
      )
    }

    return m
  }, [atlasTexture])

  const tilesRef = useRef<TileState[]>([])

  // Initialize terrain + start many tiles falling immediately (like the reference)
  useEffect(() => {
    const tiles: TileState[] = []
    const tri = new THREE.Triangle()
    const normal = new THREE.Vector3()
    const la = new THREE.Vector3()

    for (let z = 0; z < tileDim; z++) {
      for (let x = 0; x < tileDim; x++) {
        const px = -(tileDim - 1) * 0.5 + x
        const pz = -(tileDim - 1) * 0.5 + z

        const y0 = getTerrainY(px, pz)
        const y1 = getTerrainY(px, pz - 1)
        const y2 = getTerrainY(px + 1, pz)

        // Normal for tile orientation on terrain surface
        tri.a.set(px, y1, pz - 1)
        tri.b.set(px, y0, pz)
        tri.c.set(px + 1, y2, pz)
        tri.getNormal(normal)

        dummy.position.set(px, y0, pz)
        la.copy(dummy.position).add(normal)
        dummy.lookAt(la)
        dummy.rotation.z = 0

        // Stagger: most tiles start in-flight, landing over first ~10s
        const startLanded = Math.random() > 0.7 // 30% start already placed
        tiles.push({
          targetY: y0,
          targetRot: dummy.rotation.clone(),
          pos: new THREE.Vector3(px, y0, pz),
          inAction: !startLanded,
          animProgress: startLanded ? 1 : Math.random() * 0.3, // in-flight tiles at random early progress
          animDuration: 8 + Math.random() * 4,
          startRot: new THREE.Vector3(
            (Math.random() - 0.5) * Math.PI * 3,
            (Math.random() - 0.5) * Math.PI * 3,
            (Math.random() - 0.5) * Math.PI * 3,
          ),
        })

        // Set initial matrix — landed tiles at terrain, flying tiles at height
        if (startLanded) {
          dummy.updateMatrix()
        } else {
          const earlyProgress = tiles[tiles.length - 1].animProgress
          dummy.position.y = 30 * (1 - earlyProgress) + y0 * earlyProgress
          dummy.rotation.set(
            tiles[tiles.length - 1].startRot.x * (1 - earlyProgress),
            tiles[tiles.length - 1].startRot.y * (1 - earlyProgress),
            tiles[tiles.length - 1].startRot.z * (1 - earlyProgress),
          )
          dummy.updateMatrix()
        }
        if (meshRef.current) {
          meshRef.current.setMatrixAt(z * tileDim + x, dummy.matrix)
        }
      }
    }

    tilesRef.current = tiles
    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true
    }
  }, [tileDim, dummy])

  // Apply palette colors
  useEffect(() => {
    if (!meshRef.current) return
    const paletteIdx = Math.round(controls.find(c => c.id === 'terrainPalette')?.value ?? 0)
    const paletteFn = PALETTES[paletteIdx] ?? PALETTES[0]

    for (let i = 0; i < totalTiles; i++) {
      const depth = Math.random()
      meshRef.current.setColorAt(i, paletteFn(depth))
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [controls, totalTiles])

  // Animation loop — faithful to the reference's tween pattern
  useFrame((_, delta) => {
    if (!meshRef.current) return
    const tiles = tilesRef.current
    if (tiles.length === 0) return

    clockRef.current += delta

    const speed = controls.find(c => c.id === 'speed')?.value ?? 1
    const fallHeight = 30
    const dt = delta * speed

    // Count active and spawn new falling tiles continuously
    const maxActive = Math.min(Math.floor(totalTiles * 0.15), 5000)
    let activeCount = 0
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i].inAction) activeCount++
    }

    // Continuously respawn — like the reference which chains action→delay→action
    if (activeCount < maxActive) {
      const toStart = Math.min(Math.ceil(dt * 200), maxActive - activeCount)
      for (let n = 0; n < toStart; n++) {
        const idx = Math.floor(Math.random() * tiles.length)
        const tile = tiles[idx]
        if (!tile.inAction) {
          tile.inAction = true
          tile.animProgress = 0
          tile.animDuration = 8 + Math.random() * 4
          tile.startRot.set(
            (Math.random() - 0.5) * Math.PI * 3,
            (Math.random() - 0.5) * Math.PI * 3,
            (Math.random() - 0.5) * Math.PI * 3,
          )
        }
      }
    }

    // Update all tiles
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i]
      if (!tile.inAction) continue

      tile.animProgress += dt / tile.animDuration
      if (tile.animProgress >= 1) {
        tile.animProgress = 1
        tile.inAction = false
      }

      const t = tile.animProgress
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

      // Lerp rotation from random tumble to terrain-aligned
      const rx = tile.startRot.x * (1 - eased) + tile.targetRot.x * eased
      const ry = tile.startRot.y * (1 - eased) + tile.targetRot.y * eased
      const rz = tile.startRot.z * (1 - eased) + tile.targetRot.z * eased

      dummy.position.copy(tile.pos)
      dummy.position.y = fallHeight * (1 - eased) + tile.targetY * eased
      dummy.rotation.set(rx, ry, rz)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true

    const store = useStore.getState()
    store.setFps(Math.round(1 / Math.max(delta, 0.001)))
    store.setActualParticleCount(totalTiles)
  })

  return (
    <>
      <fog attach="fog" args={['#08040E', 50, 110]} />
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, totalTiles]}
        frustumCulled={false}
      />
    </>
  )
}
