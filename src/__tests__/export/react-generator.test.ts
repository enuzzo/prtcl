import { describe, it, expect } from 'vitest'
import { generateReactComponent } from '../../export/generators/react-generator'
import type { ExportPayload } from '../../export/types'

const mockPayload: ExportPayload = {
  effect: {
    id: 'frequency', slug: 'frequency', name: 'Fractal Frequency',
    description: 'Audio-reactive fractal', author: 'PRTCL Team',
    code: 'target.set(i * 0.01, 0, 0);', tags: ['math'], category: 'math',
    particleCount: 10000, pointSize: 4, cameraDistance: 5,
    cameraPosition: [0, 0, 5], cameraTarget: [0, 0, 0],
    autoRotateSpeed: 0.5, createdAt: '2026-01-01',
  },
  controls: { speed: 1.0 },
  cameraPosition: [0, 0, 5],
  cameraTarget: [0, 0, 0],
  settings: {
    particleCount: 10000, pointSize: 4, height: '400px',
    backgroundColor: '#08040E', autoRotateSpeed: 0.5,
    orbitControls: true, pointerReactive: false, showBadge: true,
  },
}

describe('generateReactComponent', () => {
  it('includes PRTCL credits comment', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('Made with PRTCL')
    expect(code).toContain('MIT License © enuzzo')
  })

  it('includes dependency comment', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('@react-three/fiber')
    expect(code).toContain('@react-three/drei')
  })

  it('exports a default PrtclEffect component', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('export default function PrtclEffect')
  })

  it('includes PrtclEffectProps interface', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('interface PrtclEffectProps')
    expect(code).toContain('count?: number')
    expect(code).toContain('pointSize?: number')
  })

  it('uses addControl parameter name', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toMatch(/'addControl'/)
  })

  it('includes OrbitControls with camera target', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('<OrbitControls')
    expect(code).toContain('target={[0, 0, 0]}')
  })

  it('omits OrbitControls when disabled', () => {
    const noOrbit = { ...mockPayload, settings: { ...mockPayload.settings, orbitControls: false } }
    const code = generateReactComponent(noOrbit)
    expect(code).not.toContain('<OrbitControls')
  })

  it('bakes control defaults', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('speed: 1')
  })

  it('includes vertex and fragment shaders', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('gl_PointSize')
    expect(code).toContain('gl_PointCoord')
  })

  it('includes NaN guard', () => {
    const code = generateReactComponent(mockPayload)
    expect(code).toContain('isFinite')
  })
})
