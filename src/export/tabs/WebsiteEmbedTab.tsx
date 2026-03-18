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
      <div className="flex items-center gap-4 mb-3">
        <span className="text-sm text-text-secondary font-mono">Works with</span>
        <div className="flex items-center gap-3 text-text-secondary">
          <span className="flex items-center gap-1"><ElementorIcon size={14} /> <span className="text-xs font-mono">Elementor</span></span>
          <span className="flex items-center gap-1"><WebflowIcon size={14} /> <span className="text-xs font-mono">Webflow</span></span>
          <span className="flex items-center gap-1"><WixIcon size={14} /> <span className="text-xs font-mono">Wix</span></span>
          <span className="flex items-center gap-1"><WordPressIcon size={14} /> <span className="text-xs font-mono">WordPress</span></span>
        </div>
        <span className="text-sm text-text-secondary font-mono">&amp; any HTML site</span>
      </div>
      <CodeBlock code={code} language="html" filename={filename} />
    </div>
  )
}
