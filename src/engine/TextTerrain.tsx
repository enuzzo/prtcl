import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

/**
 * Text Terrain — a landscape of random letters on a simplex-noise terrain.
 * Letters fall from the sky and land on the surface, creating a living
 * typographic landscape. Based on prisoner849's TextTerrain demo.
 *
 * Uses InstancedMesh with a canvas-generated letter atlas texture.
 * Custom shader maps each instance to a different letter from the atlas.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const ATLAS_DIM = 8 // 8x8 grid in the atlas texture

// Simple 2D noise using sine combinations (no SimplexNoise import needed)
function noise2D(x: number, z: number): number {
  const n1 = Math.sin(x * 0.73 + z * 0.91) * Math.cos(z * 0.67 - x * 0.43)
  const n2 = Math.sin(x * 0.37 + z * 1.17 + 2.1) * 0.5
  const n3 = Math.cos(x * 1.31 - z * 0.89 + 0.7) * 0.3
  return (n1 + n2 + n3) * 0.6
}

function getTerrainY(x: number, z: number, scale: number): number {
  return noise2D(x * scale, z * scale) * 7.5
}

/** Create the letter atlas texture on a canvas */
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

/** Per-tile state for the falling animation */
interface TileState {
  targetY: number
  targetRot: THREE.Euler
  pos: THREE.Vector3
  inAction: boolean
  animProgress: number // 0 = at height, 1 = landed
  animDelay: number
  animDuration: number
  startRot: THREE.Vector3
}

/** Color palette generators */
const PALETTES = [
  // PRTCL: magenta + lime
  (depth: number) => {
    const c = new THREE.Color()
    c.setHSL(Math.random() < 0.5 ? 0.89 : 0.25, 0.9, 0.3 + depth * 0.4)
    return c
  },
  // Typewriter: near-white (black letters on white bg simulated as bright particles)
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

export function TextTerrain() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const clockRef = useRef(0)

  // Store
  const particleCount = useStore((s) => s.particleCount)
  const controls = useStore((s) => s.controls)

  // Determine grid size from particle count (square grid)
  const tileDim = useMemo(() => Math.max(10, Math.floor(Math.sqrt(Math.min(particleCount, 40000)))), [particleCount])
  const totalTiles = tileDim * tileDim

  // Create atlas texture once
  const atlasTexture = useMemo(() => createAtlasTexture(), [])

  // Per-instance letter indices
  const letterIndices = useMemo(() => {
    return new Float32Array(Array.from({ length: totalTiles }, () =>
      Math.floor(Math.random() * ALPHABET.length)
    ))
  }, [totalTiles])

  // Geometry: a flat plane for each letter tile
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.9, 0.9)
    g.setAttribute('letterIdx', new THREE.InstancedBufferAttribute(letterIndices, 1))
    return g
  }, [letterIndices])

  // Custom material with atlas UV mapping per instance
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

  // Tile states for animation
  const tilesRef = useRef<TileState[]>([])

  // Initialize tile positions on terrain
  useEffect(() => {
    const noiseScale = 0.01
    const tiles: TileState[] = []
    const tri = new THREE.Triangle()
    const normal = new THREE.Vector3()
    const lookAt = new THREE.Vector3()

    for (let z = 0; z < tileDim; z++) {
      for (let x = 0; x < tileDim; x++) {
        const px = -(tileDim - 1) * 0.5 + x
        const pz = -(tileDim - 1) * 0.5 + z

        const y0 = getTerrainY(px, pz, noiseScale)
        const y1 = getTerrainY(px, pz - 1, noiseScale)
        const y2 = getTerrainY(px + 1, pz, noiseScale)

        // Compute terrain normal for tile orientation
        tri.a.set(px, y1, pz - 1)
        tri.b.set(px, y0, pz)
        tri.c.set(px + 1, y2, pz)
        tri.getNormal(normal)

        dummy.position.set(px, y0, pz)
        lookAt.copy(dummy.position).add(normal)
        dummy.lookAt(lookAt)
        dummy.rotation.z = 0

        tiles.push({
          targetY: y0,
          targetRot: dummy.rotation.clone(),
          pos: new THREE.Vector3(px, y0, pz),
          inAction: false,
          animProgress: 1, // start landed
          animDelay: Math.random() * 8, // initial stagger
          animDuration: 8 + Math.random() * 4,
          startRot: new THREE.Vector3(
            (Math.random() - 0.5) * Math.PI * 3,
            (Math.random() - 0.5) * Math.PI * 3,
            (Math.random() - 0.5) * Math.PI * 3,
          ),
        })

        // Set initial matrix
        dummy.updateMatrix()
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

  // Animation loop
  useFrame((_, delta) => {
    if (!meshRef.current) return
    const tiles = tilesRef.current
    if (tiles.length === 0) return

    clockRef.current += delta

    const speed = controls.find(c => c.id === 'speed')?.value ?? 1
    const fallHeight = 30
    const dt = delta * speed

    // Pick random tiles to start falling
    const maxActive = Math.min(Math.floor(totalTiles * 0.12), 5000)
    let activeCount = 0
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i].inAction) activeCount++
    }

    // Start new falling tiles
    if (activeCount < maxActive) {
      const toStart = Math.min(Math.floor(dt * 50), maxActive - activeCount)
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

    // Update all active tiles
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i]
      if (!tile.inAction) continue

      tile.animProgress += dt / tile.animDuration
      if (tile.animProgress >= 1) {
        tile.animProgress = 1
        tile.inAction = false
      }

      const t = tile.animProgress
      // Ease in-out cubic
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

      // Lerp rotation
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

    // Update store metrics
    const store = useStore.getState()
    store.setFps(Math.round(1 / Math.max(delta, 0.001)))
    store.setActualParticleCount(totalTiles)
  })

  return (
    <>
      <fog attach="fog" args={['#08040E', 60, 120]} />
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, totalTiles]}
        frustumCulled={false}
      />
    </>
  )
}
