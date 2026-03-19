import { useStore } from '../store'
import type { TrackingMode } from '../tracking/types'

const MODE_LABELS: Record<TrackingMode, { label: string; hint: string }> = {
  control: { label: 'Control', hint: 'Move the camera' },
  disturb: { label: 'Disturb', hint: 'Touch the particles' },
}

export function TrackingSidebar() {
  const enabled = useStore((s) => s.trackingEnabled)
  const ready = useStore((s) => s.trackingReady)
  const gesture = useStore((s) => s.gesture)
  const error = useStore((s) => s.trackingError)
  const mode = useStore((s) => s.trackingMode)

  if (!enabled) return null

  return (
    <div
      className="mx-2 mb-2 p-3 rounded-lg transition-all duration-200"
      style={{
        background: 'rgba(124,255,0,0.06)',
        border: '1px solid rgba(124,255,0,0.25)',
      }}
    >
      <div
        className="font-mono uppercase mb-2"
        style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          color: '#7CFF00',
        }}
      >
        {'\u270B'} Tracking
      </div>

      {error ? (
        <div className="font-mono text-danger" style={{ fontSize: 10 }}>
          {error}
        </div>
      ) : !ready ? (
        <div className="font-mono text-text-muted animate-pulse" style={{ fontSize: 10 }}>
          Waking up MediaPipe...
        </div>
      ) : (
        <div className="font-mono" style={{ fontSize: 10 }}>
          {/* Mode toggle */}
          <div className="flex gap-1 mb-2">
            {(Object.keys(MODE_LABELS) as TrackingMode[]).map((m) => (
              <button
                key={m}
                onClick={() => useStore.getState().setTrackingMode(m)}
                className="px-2 py-0.5 rounded font-mono uppercase transition-colors"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.05em',
                  background: mode === m ? 'rgba(124,255,0,0.2)' : 'rgba(255,255,255,0.04)',
                  color: mode === m ? '#7CFF00' : '#A98ED1',
                  border: mode === m ? '1px solid rgba(124,255,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}
                title={MODE_LABELS[m].hint}
              >
                {MODE_LABELS[m].label}
              </button>
            ))}
          </div>

          {/* Status */}
          <div style={{ color: gesture === 'open_palm' ? '#7CFF00' : undefined }} className={gesture === 'none' ? 'text-text-muted' : ''}>
            {gesture === 'open_palm'
              ? mode === 'control' ? 'You are the controller now' : 'Reach into the particles'
              : 'Waiting for a hand... any hand'}
          </div>
        </div>
      )}
    </div>
  )
}
