import { useMemo } from 'react'
import { generateReactComponent } from '../generators/react-generator'
import { CodeBlock } from '../CodeBlock'
import { ReactIcon } from '../icons'
import type { ExportPayload } from '../types'

interface Props { payload: ExportPayload }

export function ReactTab({ payload }: Props) {
  const code = useMemo(() => generateReactComponent(payload), [payload])
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <ReactIcon size={14} className="text-[#61DAFB]" />
        <span className="text-xs text-text-muted font-mono">
          React Three Fiber component · Requires: three, @react-three/fiber, @react-three/drei
        </span>
      </div>
      <CodeBlock code={code} language="tsx" filename="PrtclEffect.tsx" />
    </div>
  )
}
