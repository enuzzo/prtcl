import { describe, it, expect } from 'vitest'
import { generateHtmlEmbed } from '../../export/generators/html-generator'
import type { ExportPayload } from '../../export/types'

const mockPayload: ExportPayload = {
  effect: {
    id: 'test-effect',
    slug: 'test-effect',
    name: 'Test Effect',
    description: 'A test',
    author: 'PRTCL Team',
    code: 'target.set(Math.sin(i + time), Math.cos(i + time), 0); color.set(1, 0.5, 0);',
    tags: ['test'],
    category: 'math',
    particleCount: 5000,
    pointSize: 3,
    cameraDistance: 5,
    cameraPosition: [0, 0, 5],
    cameraTarget: [0, 0, 0],
    autoRotateSpeed: 0.5,
    createdAt: '2026-01-01',
  },
  controls: { speed: 1.2, size: 0.5 },
  cameraPosition: [0, 2, 8],
  cameraTarget: [0, 0, 0],
  settings: {
    particleCount: 5000,
    pointSize: 3,
    height: '400px',
    backgroundColor: '#08040E',
    autoRotateSpeed: 0.5,
    orbitControls: true,
    pointerReactive: false,
    showBadge: true,
  },
}

describe('generateHtmlEmbed', () => {
  it('includes PRTCL credits comment', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('Made with PRTCL')
    expect(html).toContain('github.com/enuzzo/prtcl')
    expect(html).toContain('MIT License © enuzzo')
  })

  it('generates a self-contained div with unique id', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('<div id="prtcl-test-effect"')
    expect(html).toContain('</div>')
  })

  it('includes Three.js CDN import pinned to v0.170.0', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('cdn.jsdelivr.net/npm/three@0.170.0')
    expect(html).toContain('three.module.min.js')
  })

  it('includes OrbitControls import when enabled', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('OrbitControls')
    expect(html).toContain('controls/OrbitControls.js')
  })

  it('omits OrbitControls when disabled', () => {
    const noOrbit = {
      ...mockPayload,
      settings: { ...mockPayload.settings, orbitControls: false },
    }
    const html = generateHtmlEmbed(noOrbit)
    expect(html).not.toContain('OrbitControls')
  })

  it('inlines the vertex and fragment shaders', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('gl_PointSize')
    expect(html).toContain('gl_PointCoord')
    expect(html).toContain('smoothstep')
  })

  it('bakes effect code into a new Function()', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('new Function(')
    expect(html).toContain("'addControl'")
    expect(html).toContain(mockPayload.effect.code)
  })

  it('bakes control values', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('"speed": 1.2')
    expect(html).toContain('"size": 0.5')
  })

  it('sets camera position and target', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('0, 2, 8')
    expect(html).toContain('target.set(0, 0, 0)')
  })

  it('includes container height and background', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('height:400px')
    expect(html).toContain('#08040E')
  })

  it('includes PRTCL badge when enabled', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('prtcl.es')
    expect(html).toContain('Made with PRTCL')
  })

  it('omits badge when disabled', () => {
    const noBadge = {
      ...mockPayload,
      settings: { ...mockPayload.settings, showBadge: false },
    }
    const html = generateHtmlEmbed(noBadge)
    expect(html).not.toContain('target="_blank"')
  })

  it('includes NaN guard in render loop', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('isFinite')
  })

  it('includes ResizeObserver', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('ResizeObserver')
  })

  it('uses addControl parameter name', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toMatch(/'addControl'/)
    expect(html).toContain('const addControl = (id')
  })

  it('includes auto-rotate speed when set', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).toContain('autoRotate = true')
    expect(html).toContain('autoRotateSpeed = 0.5')
  })

  it('includes pointer tracking when enabled', () => {
    const withPointer = {
      ...mockPayload,
      settings: { ...mockPayload.settings, pointerReactive: true },
    }
    const html = generateHtmlEmbed(withPointer)
    expect(html).toContain('Raycaster')
    expect(html).toContain('mousemove')
  })

  it('omits pointer tracking when disabled', () => {
    const html = generateHtmlEmbed(mockPayload)
    expect(html).not.toContain('Raycaster')
    expect(html).not.toContain('mousemove')
  })
})
