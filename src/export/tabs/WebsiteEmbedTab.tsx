import { useMemo } from 'react'
import { generateHtmlEmbed } from '../generators/html-generator'
import { CodeBlock } from '../CodeBlock'
import type { ExportPayload } from '../types'

interface Props { payload: ExportPayload }

export function WebsiteEmbedTab({ payload }: Props) {
  const code = useMemo(() => generateHtmlEmbed(payload), [payload])
  const filename = `prtcl-${payload.effect.slug || payload.effect.id}.html`
  return (
    <div className="flex flex-col h-full">
      <p className="text-xs text-text-muted mb-3 font-mono">
        Works with Elementor, Webflow, Wix, WordPress &amp; any HTML site
      </p>
      <CodeBlock code={code} language="html" filename={filename} />
    </div>
  )
}
