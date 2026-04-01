import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { createSpiritApp, type SpiritApp } from './spirit/createSpiritApp'
import { loadLegacyThree } from './spirit/loadLegacyThree'
import { setCameraSnapshotProvider } from './camera-bridge'
import { resetHandCamera } from '../tracking/hand-camera'

export function Spirit() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<SpiritApp | null>(null)
  const spiritSettings = useStore((s) => s.spiritSettings)
  const selectedEffect = useStore((s) => s.selectedEffect)
  const cameraZoom = useStore((s) => s.cameraZoom)
  const pendingCameraPosition = useStore((s) => s.pendingCameraPosition)
  const pendingCameraTarget = useStore((s) => s.pendingCameraTarget)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    resetHandCamera()

    let disposed = false
    let resizeObserver: ResizeObserver | null = null

    void loadLegacyThree()
      .then((THREE) => {
        if (disposed || !containerRef.current) return
        const app = createSpiritApp(THREE, containerRef.current, spiritSettings, {
          cameraPosition: selectedEffect?.cameraPosition,
          cameraTarget: selectedEffect?.cameraTarget,
          cameraZoom,
        })
        if (disposed) {
          app.dispose()
          return
        }
        appRef.current = app
        const state = useStore.getState()
        app.setViewport({
          cameraPosition: state.pendingCameraPosition ?? state.selectedEffect?.cameraPosition,
          cameraTarget: state.pendingCameraTarget ?? state.selectedEffect?.cameraTarget,
          zoom: state.cameraZoom,
        })
        if (state.pendingCameraPosition) state.setCameraPosition(null)
        if (state.pendingCameraTarget) state.setCameraTarget(null)
        setCameraSnapshotProvider(() => app.getSnapshot())
        resizeObserver = new ResizeObserver(() => app.resize())
        resizeObserver.observe(containerRef.current)
      })
      .catch((error) => {
        console.error('Failed to initialize The Spirit:', error)
        useStore.getState().showToast('The Spirit failed to initialize.')
      })

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      setCameraSnapshotProvider(null)
      resetHandCamera()
      appRef.current?.dispose()
      appRef.current = null
    }
  }, [])

  useEffect(() => {
    appRef.current?.setSettings(spiritSettings)
  }, [spiritSettings])

  useEffect(() => {
    appRef.current?.setViewport({
      cameraPosition: selectedEffect?.cameraPosition,
      cameraTarget: selectedEffect?.cameraTarget,
      zoom: cameraZoom,
    })
  }, [selectedEffect, cameraZoom])

  useEffect(() => {
    if (!pendingCameraPosition && !pendingCameraTarget) return

    appRef.current?.setViewport({
      cameraPosition: pendingCameraPosition ?? undefined,
      cameraTarget: pendingCameraTarget ?? undefined,
    })

    const state = useStore.getState()
    if (pendingCameraPosition) state.setCameraPosition(null)
    if (pendingCameraTarget) state.setCameraTarget(null)
  }, [pendingCameraPosition, pendingCameraTarget])

  return <div ref={containerRef} className="absolute inset-0 z-20" />
}
