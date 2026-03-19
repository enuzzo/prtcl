import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import { getBackgroundPreset } from './background-presets'
import type { BackgroundPreset } from './background-presets'

const TEX_SIZE = 512

/**
 * Renders a gradient preset to an offscreen canvas and returns a CanvasTexture.
 * The texture is square — Three.js stretches it to fill the viewport as scene.background.
 */
function createGradientTexture(preset: BackgroundPreset): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_SIZE
  canvas.height = TEX_SIZE
  const ctx = canvas.getContext('2d')!
  const g = preset.gradient!

  let grad: CanvasGradient

  if (g.type === 'linear') {
    // angle: 0 = bottom→top, 90 = left→right
    const rad = ((g.angle ?? 0) * Math.PI) / 180
    const dx = Math.sin(rad)
    const dy = -Math.cos(rad)
    const half = TEX_SIZE / 2
    grad = ctx.createLinearGradient(
      half - dx * half, half - dy * half,
      half + dx * half, half + dy * half,
    )
  } else {
    // radial
    const cx = ((g.center?.[0] ?? 50) / 100) * TEX_SIZE
    const cy = ((g.center?.[1] ?? 50) / 100) * TEX_SIZE
    const radius = TEX_SIZE * 0.7
    grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
  }

  for (const stop of g.stops) {
    grad.addColorStop(stop.position, stop.color)
  }

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Renders a pattern preset via its custom renderToCanvas function.
 */
function createPatternTexture(preset: BackgroundPreset): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_SIZE
  canvas.height = TEX_SIZE
  const ctx = canvas.getContext('2d')!

  preset.renderToCanvas!(ctx, TEX_SIZE, TEX_SIZE)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Sets scene.background based on the current backgroundPreset / backgroundColor.
 * Solid → THREE.Color. Gradient → CanvasTexture. Pattern → CanvasTexture via renderToCanvas.
 */
export function SceneBackground() {
  const { scene } = useThree()
  const backgroundPreset = useStore((s) => s.backgroundPreset)
  const backgroundColor = useStore((s) => s.backgroundColor)
  const texRef = useRef<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    // Dispose previous texture
    if (texRef.current) {
      texRef.current.dispose()
      texRef.current = null
    }

    const preset = getBackgroundPreset(backgroundPreset)

    if (preset?.renderToCanvas) {
      // Pattern — custom Canvas2D render
      const tex = createPatternTexture(preset)
      texRef.current = tex
      scene.background = tex
    } else if (preset?.category === 'gradient' && preset.gradient) {
      // Gradient — Canvas2D gradient
      const tex = createGradientTexture(preset)
      texRef.current = tex
      scene.background = tex
    } else {
      // Solid color (preset or custom hex)
      const hex = preset?.baseColor ?? backgroundColor
      scene.background = new THREE.Color(hex)
    }

    return () => {
      if (texRef.current) {
        texRef.current.dispose()
        texRef.current = null
      }
    }
  }, [backgroundPreset, backgroundColor, scene])

  return null
}
