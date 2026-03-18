import { describe, it, expect } from 'vitest'
import { generateIframeEmbed, buildEmbedUrl } from '../../export/generators/iframe-generator'
import type { ExportPayload } from '../../export/types'

const mockPayload: ExportPayload = {
  effect: {
    id: 'nebula', slug: 'nebula', name: 'Nebula', description: '', author: 'PRTCL Team',
    code: '', tags: [], category: 'organic', particleCount: 10000, cameraDistance: 5,
    cameraPosition: [0, 0, 5], cameraTarget: [0, 0, 0], createdAt: '2026-01-01',
  },
  controls: { density: 2.0 },
  cameraPosition: [0, 0, 5],
  cameraTarget: [0, 0, 0],
  settings: {
    particleCount: 8000, pointSize: 3, height: '500px',
    backgroundColor: '#08040E', autoRotateSpeed: 1,
    orbitControls: true, pointerReactive: false, showBadge: true,
  },
}

describe('buildEmbedUrl', () => {
  it('encodes effect id', () => {
    const url = buildEmbedUrl(mockPayload)
    expect(url).toContain('effect=nebula')
  })

  it('encodes particle count', () => {
    const url = buildEmbedUrl(mockPayload)
    expect(url).toContain('particles=8000')
  })

  it('encodes controls as JSON', () => {
    const url = buildEmbedUrl(mockPayload)
    const parsed = new URL(url, 'https://prtcl.es')
    const ctrlParam = parsed.searchParams.get('controls')
    expect(JSON.parse(ctrlParam!)).toEqual({ density: 2.0 })
  })

  it('omits badge param when badge is on (default)', () => {
    const url = buildEmbedUrl(mockPayload)
    expect(url).not.toContain('badge=')
  })

  it('includes badge=0 when badge is off', () => {
    const noBadge = { ...mockPayload, settings: { ...mockPayload.settings, showBadge: false } }
    const url = buildEmbedUrl(noBadge)
    expect(url).toContain('badge=0')
  })
})

describe('generateIframeEmbed', () => {
  it('generates an iframe tag', () => {
    const html = generateIframeEmbed(mockPayload)
    expect(html).toContain('<iframe')
    expect(html).toContain('</iframe>')
  })

  it('includes credits comment', () => {
    const html = generateIframeEmbed(mockPayload)
    expect(html).toContain('Made with PRTCL')
  })

  it('includes the embed URL', () => {
    const html = generateIframeEmbed(mockPayload)
    expect(html).toContain('prtcl.es/embed')
    expect(html).toContain('effect=nebula')
  })

  it('sets height from settings (px value)', () => {
    const html = generateIframeEmbed(mockPayload)
    expect(html).toContain('height="500"')
  })

  it('handles 100vh height as 100%', () => {
    const fullVh = { ...mockPayload, settings: { ...mockPayload.settings, height: '100vh' } }
    const html = generateIframeEmbed(fullVh)
    expect(html).toContain('height="100%"')
  })
})
