import { useStore } from '../store'

export function Toast() {
  const message = useStore((s) => s.toastMessage)

  if (!message) return null

  return (
    <div className="fixed top-16 left-0 right-0 mx-auto w-fit z-[100]
      px-5 py-2.5 rounded-lg
      bg-elevated border border-accent/30
      text-text text-sm font-mono
      shadow-[0_4px_24px_rgba(255,43,214,0.15)]
      animate-[toastSlideDown_300ms_ease-out]
      pointer-events-none"
    >
      {message}
    </div>
  )
}
