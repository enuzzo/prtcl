import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ALL_PRESETS } from '../effects/presets'
import { compileEffect } from '../engine/compiler'
import { IsolatedParticleSystem } from '../export/IsolatedParticleSystem'

export function EmbedView() {
  const [searchParams] = useSearchParams()

  const effectId = searchParams.get('effect') ?? ''
  const particleCount = parseInt(searchParams.get('particles') ?? '') || undefined
  const pointSize = parseFloat(searchParams.get('pointSize') ?? '') || undefined
  const bgParam = searchParams.get('bg')
  const backgroundColor = bgParam ? `#${bgParam.replace('#', '')}` : '#08040E'
  const autoRotateSpeed = parseFloat(searchParams.get('rotate') ?? '0')
  const orbitEnabled = searchParams.get('orbit') !== '0'
  const showBadge = searchParams.get('badge') !== '0'

  const controlOverrides = useMemo(() => {
    const raw = searchParams.get('controls')
    if (!raw) return {}
    try { return JSON.parse(raw) as Record<string, number> } catch { return {} }
  }, [searchParams])

  const { compiledFn, controlValues, effect } = useMemo(() => {
    const preset = ALL_PRESETS.find((p) => p.id === effectId)
    if (!preset) return { compiledFn: null, controlValues: {}, effect: null }
    const result = compileEffect(preset)
    if (!result.ok) return { compiledFn: null, controlValues: {}, effect: preset }
    const vals: Record<string, number> = {}
    for (const c of result.value.controls) {
      vals[c.id] = controlOverrides[c.id] ?? c.initial
    }
    return { compiledFn: result.value.fn, controlValues: vals, effect: preset }
  }, [effectId, controlOverrides])

  if (!effect) {
    return (
      <div className="flex items-center justify-center h-dvh bg-[#08040E] text-white font-mono">
        <div className="text-center">
          <p className="text-lg mb-2">Effect not found</p>
          <a href="https://prtcl.es" className="text-[#7CFF00] hover:underline">Go to prtcl.es</a>
        </div>
      </div>
    )
  }

  if (!compiledFn) {
    return (
      <div className="flex items-center justify-center h-dvh bg-[#08040E] text-white font-mono">
        <p>Failed to compile effect</p>
      </div>
    )
  }

  const count = particleCount ?? effect.particleCount
  const size = pointSize ?? (effect.pointSize ?? 4)
  const camPos = (effect.cameraPosition ?? [0, 0, 5]) as [number, number, number]
  const camTarget = (effect.cameraTarget ?? [0, 0, 0]) as [number, number, number]

  return (
    <div className="relative w-full h-dvh" style={{ background: backgroundColor }}>
      <Canvas
        camera={{ position: camPos, fov: 60 }}
        gl={{ antialias: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[backgroundColor]} />
        <IsolatedParticleSystem
          compiledFn={compiledFn}
          controls={controlValues}
          particleCount={count}
          pointSize={size}
        />
        {orbitEnabled && (
          <OrbitControls
            target={camTarget}
            autoRotate={autoRotateSpeed > 0}
            autoRotateSpeed={autoRotateSpeed}
            enableDamping
          />
        )}
      </Canvas>
      {showBadge && (
        <a href="https://prtcl.es" target="_blank" rel="noopener"
          className="absolute bottom-2 right-3 font-mono text-[10px] text-white/30 hover:text-white/60 transition-colors no-underline">
          Made with PRTCL
        </a>
      )}
    </div>
  )
}
