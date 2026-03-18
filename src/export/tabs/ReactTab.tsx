import { useMemo } from 'react'
import { generateReactComponent } from '../generators/react-generator'
import { CodeBlock } from '../CodeBlock'
import type { ExportPayload } from '../types'

interface Props { payload: ExportPayload }

export function ReactTab({ payload }: Props) {
  const code = useMemo(() => generateReactComponent(payload), [payload])
  return (
    <div className="flex flex-col h-full">
      <p className="text-xs text-text-muted mb-3 font-mono">
        React Three Fiber component · Requires: three, @react-three/fiber, @react-three/drei
      </p>
      <CodeBlock code={code} language="tsx" filename="PrtclEffect.tsx" />
    </div>
  )
}
