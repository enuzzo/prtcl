import { useStore } from '../store'

const GESTURE_LABELS: Record<string, string> = {
  none: 'No hand detected',
  open_palm: 'Open Palm \u2014 Magnet',
  pinch: 'Pinch \u2014 Scale',
  fist: 'Fist \u2014 Explode',
}

const FIST_PHASE_LABELS: Record<string, string> = {
  idle: '',
  contracting: 'Contracting...',
  exploding: 'Exploding!',
  reassembling: 'Reassembling...',
}

export function TrackingSidebar() {
  const enabled = useStore((s) => s.trackingEnabled)
  const ready = useStore((s) => s.trackingReady)
  const gesture = useStore((s) => s.gesture)
  const fistPhase = useStore((s) => s.fistPhase)
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
          Loading...
        </div>
      ) : (
        <div className="font-mono" style={{ fontSize: 10 }}>
          <div style={{ color: gesture !== 'none' ? '#7CFF00' : undefined }} className={gesture === 'none' ? 'text-text-muted' : ''}>
            {GESTURE_LABELS[gesture]}
          </div>
          {fistPhase !== 'idle' && (
            <div className="text-accent mt-1" style={{ fontSize: 9 }}>
              {FIST_PHASE_LABELS[fistPhase]}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
