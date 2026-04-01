import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { createSpiritApp, type SpiritApp } from './spirit/createSpiritApp'
import { loadLegacyThree } from './spirit/loadLegacyThree'
import { setCameraSnapshotProvider } from './camera-bridge'

export function Spirit() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<SpiritApp | null>(null)
  const spiritSettings = useStore((s) => s.spiritSettings)
  const selectedEffect = useStore((s) => s.selectedEffect)
  const cameraZoom = useStore((s) => s.cameraZoom)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

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
          cameraPosition: state.selectedEffect?.cameraPosition,
          cameraTarget: state.selectedEffect?.cameraTarget,
          zoom: state.cameraZoom,
        })
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

  return <div ref={containerRef} className="absolute inset-0 z-20" />
}
