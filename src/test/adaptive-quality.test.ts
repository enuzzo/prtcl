import { describe, it, expect } from 'vitest'
import { AdaptiveQuality } from '../engine/adaptive-quality'

describe('AdaptiveQuality', () => {
  it('returns base count when performance is good', () => {
    const aq = new AdaptiveQuality(15000)
    for (let i = 0; i < 10; i++) aq.update(0.016)
    expect(aq.getParticleCount()).toBe(15000)
  })

  it('reduces count when frame time exceeds threshold', () => {
    const aq = new AdaptiveQuality(15000)
    for (let i = 0; i < 10; i++) aq.update(0.025)
    expect(aq.getParticleCount()).toBeLessThan(15000)
  })

  it('never goes below floor of 1000', () => {
    const aq = new AdaptiveQuality(15000)
    for (let i = 0; i < 200; i++) aq.update(0.1)
    expect(aq.getParticleCount()).toBeGreaterThanOrEqual(1000)
  })

  it('recovers count after sustained good performance', () => {
    const aq = new AdaptiveQuality(15000)
    for (let i = 0; i < 30; i++) aq.update(0.03)
    const reduced = aq.getParticleCount()
    expect(reduced).toBeLessThan(15000)
    for (let i = 0; i < 70; i++) aq.update(0.013)
    expect(aq.getParticleCount()).toBeGreaterThan(reduced)
  })
})
