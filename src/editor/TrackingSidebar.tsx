import { useStore } from '../store'

export function TrackingSidebar() {
  const enabled = useStore((s) => s.trackingEnabled)
  const ready = useStore((s) => s.trackingReady)
  const gesture = useStore((s) => s.gesture)
  const error = useStore((s) => s.trackingError)

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
          <div style={{ color: gesture === 'open_palm' ? '#7CFF00' : undefined }} className={gesture === 'none' ? 'text-text-muted' : ''}>
            {gesture === 'open_palm' ? 'You are the controller now' : 'Waiting for a hand... any hand'}
          </div>
        </div>
      )}
    </div>
  )
}
