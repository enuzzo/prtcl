import { useMemo } from 'react'
import { generateIframeEmbed } from '../generators/iframe-generator'
import { CodeBlock } from '../CodeBlock'
import { AppWindowIcon } from '../icons'
import type { ExportPayload } from '../types'

interface Props { payload: ExportPayload }

export function IframeTab({ payload }: Props) {
  const code = useMemo(() => generateIframeEmbed(payload), [payload])
  const filename = `prtcl-${payload.effect.slug || payload.effect.id}-embed.html`
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <AppWindowIcon size={14} className="text-text-secondary" />
        <span className="text-xs text-text-muted font-mono">
          Zero-code embed · Works with built-in presets only
        </span>
      </div>
      <CodeBlock code={code} language="html" filename={filename} />
    </div>
  )
}
