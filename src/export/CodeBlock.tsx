import { useState, useCallback, useMemo } from 'react'

interface CodeBlockProps {
  code: string
  language: 'html' | 'tsx'
  filename: string
}

/** Single-pass tokenizer for acid-pop syntax highlighting.
 *  Uses a combined regex to yield non-overlapping tokens (avoids cascading corruption). */
function highlightCode(escaped: string): string {
  const TOKEN_RULES: [RegExp, string][] = [
    [/\/\/.*$/gm, 'text-[#A98ED1]'],           // line comments → muted purple
    [/\/\*[\s\S]*?\*\//g, 'text-[#A98ED1]'],   // block comments → muted purple
    [/(&lt;!--[\s\S]*?--&gt;)/g, 'text-[#A98ED1]'],  // HTML comments
    [/(["'`])(?:(?!\1|\\).|\\.)*\1/g, 'text-[#FF2BD6]'],  // strings → hot pink
    [/\b(import|export|from|const|let|var|function|return|if|else|for|new|default|typeof|void|null|undefined|true|false|interface|type)\b/g, 'text-[#7CFF00]'],  // keywords → lime
    [/\b(\d+\.?\d*)\b/g, 'text-[#FFD553]'],    // numbers → gold
  ]

  // Build one combined regex from all rules
  const combined = TOKEN_RULES.map(([re], i) => `(?<t${i}>${re.source})`).join('|')
  const master = new RegExp(combined, 'gm')

  let result = ''
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = master.exec(escaped)) !== null) {
    let colorClass = ''
    for (let i = 0; i < TOKEN_RULES.length; i++) {
      if (match.groups?.[`t${i}`] !== undefined) {
        colorClass = TOKEN_RULES[i]![1]
        break
      }
    }
    result += escaped.slice(lastIndex, match.index)
    result += `<span class="${colorClass}">${match[0]}</span>`
    lastIndex = match.index + match[0].length
  }
  result += escaped.slice(lastIndex)
  return result
}

export function CodeBlock({ code, language: _language, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const lines = code.split('\n')
  const lineCount = lines.length
  const byteSize = new Blob([code]).size
  const sizeStr = byteSize > 1024
    ? `${(byteSize / 1024).toFixed(1)} KB`
    : `${byteSize} B`

  const highlighted = useMemo(() => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return highlightCode(escaped)
  }, [code])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [code, filename])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto bg-bg rounded-lg border border-border">
        <pre className="p-4 text-xs font-mono leading-relaxed text-text">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded text-sm font-mono font-bold transition-colors ${
              copied
                ? 'bg-success/20 text-success border border-success/40'
                : 'bg-accent2/15 text-accent2 border border-accent2/40 hover:bg-accent2/25'
            }`}
          >
            {copied ? 'Copied!' : '📋 Copy to Clipboard'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-2 rounded text-sm font-mono text-text-secondary border border-border hover:bg-elevated transition-colors"
            title={`Download ${filename}`}
          >
            ⬇
          </button>
        </div>
        <span className="text-xs font-mono text-text-muted">
          ~{sizeStr} · {lineCount} lines
        </span>
      </div>
    </div>
  )
}
