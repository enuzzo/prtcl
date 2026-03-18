import { useMemo } from 'react'
import { generateIframeEmbed } from '../generators/iframe-generator'
import { CodeBlock } from '../CodeBlock'
import type { ExportPayload } from '../types'

interface Props { payload: ExportPayload }

export function IframeTab({ payload }: Props) {
  const code = useMemo(() => generateIframeEmbed(payload), [payload])
  const filename = `prtcl-${payload.effect.slug || payload.effect.id}-embed.html`
  return (
    <div className="flex flex-col h-full">
      <p className="text-xs text-text-muted mb-3 font-mono">
        Zero-code embed · Works with built-in presets only
      </p>
      <CodeBlock code={code} language="html" filename={filename} />
    </div>
  )
}
