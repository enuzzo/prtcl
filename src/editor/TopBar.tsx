export function TopBar() {
  return (
    <div className="flex items-center justify-between h-12 px-4 bg-surface border-b border-border">
      <span className="font-mono text-accent font-bold tracking-wider">PRTCL</span>
      <button className="px-4 py-1.5 bg-accent/10 text-accent border border-accent/30 rounded text-sm font-mono hover:bg-accent/20 transition-colors">
        Export
      </button>
    </div>
  )
}
