import { useMemo } from 'react'
import { generateHtmlEmbed } from '../generators/html-generator'
import { CodeBlock } from '../CodeBlock'
import { ElementorIcon, WebflowIcon, WixIcon, WordPressIcon } from '../icons'
import type { ExportPayload } from '../types'

interface Props { payload: ExportPayload }

export function WebsiteEmbedTab({ payload }: Props) {
  const code = useMemo(() => generateHtmlEmbed(payload), [payload])
  const filename = `prtcl-${payload.effect.slug || payload.effect.id}.html`
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-text-muted font-mono">Works with</span>
        <div className="flex items-center gap-2 text-text-secondary">
          <ElementorIcon size={14} />
          <WebflowIcon size={14} />
          <WixIcon size={14} />
          <WordPressIcon size={14} />
        </div>
        <span className="text-xs text-text-muted font-mono">&amp; any HTML site</span>
      </div>
      <CodeBlock code={code} language="html" filename={filename} />
    </div>
  )
}
