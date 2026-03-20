import { describe, it, expect } from 'vitest'
import { encodeShareState, parseShareHash } from '../share/serialize'
import type { ShareState } from '../share/types'

describe('encodeShareState', () => {
  it('encodes minimal state (effect only)', () => {
    const hash = encodeShareState({ effect: 'frequency' })
    expect(hash).toContain('effect=frequency')
  })

  it('encodes full state with all fields', () => {
    const state: ShareState = {
      effect: 'perlin-noise',
      p: 20000,
      ps: 2.5,
      ar: 1.5,
      z: 1.2,
      cam: [1.837, 0.5, 3.063],
      tgt: [0, 0.1, 0],
      bg: 'plasma',
      c: { velocity: 0.001, turbulence: 0.5 },
      txt: 'Hello World',
      font: 'Orbitron',
      w: '700',
      ls: 1.5,
    }
    const hash = encodeShareState(state)
    expect(hash).toContain('effect=perlin-noise')
    expect(hash).toContain('p=20000')
    expect(hash).toContain('ps=2.5')
    expect(hash).toContain('bg=plasma')
  })

  it('rounds floats to 3 decimals', () => {
    const hash = encodeShareState({
      effect: 'test',
      ps: 1.23456789,
      cam: [1.111111, 2.222222, 3.333333],
    })
    expect(hash).toContain('ps=1.235')
  })

  it('omits undefined optional fields', () => {
    const hash = encodeShareState({ effect: 'frequency' })
    expect(hash).not.toContain('p=')
    expect(hash).not.toContain('cam=')
    expect(hash).not.toContain('c=')
  })
})

describe('parseShareHash', () => {
  it('returns null for empty hash', () => {
    expect(parseShareHash('')).toBeNull()
    expect(parseShareHash('#')).toBeNull()
  })

  it('returns null if no effect param', () => {
    expect(parseShareHash('#p=20000&ps=2.5')).toBeNull()
  })

  it('parses minimal state', () => {
    const result = parseShareHash('#effect=frequency')
    expect(result).toEqual({ effect: 'frequency' })
  })

  it('parses all fields', () => {
    const hash = '#effect=nebula&p=15000&ps=1.5&ar=2&z=1.2&cam=1,2,3&tgt=0,0.5,0&bg=aurora&c=%7B%22speed%22%3A0.5%7D&txt=Test&font=Pacifico&w=400&ls=1.2'
    const result = parseShareHash(hash)
    expect(result).toEqual({
      effect: 'nebula',
      p: 15000,
      ps: 1.5,
      ar: 2,
      z: 1.2,
      cam: [1, 2, 3],
      tgt: [0, 0.5, 0],
      bg: 'aurora',
      c: { speed: 0.5 },
      txt: 'Test',
      font: 'Pacifico',
      w: '400',
      ls: 1.2,
    })
  })

  it('handles hash with and without leading #', () => {
    const withHash = parseShareHash('#effect=frequency')
    const withoutHash = parseShareHash('effect=frequency')
    expect(withHash).toEqual(withoutHash)
  })

  it('ignores invalid vec3 values', () => {
    const result = parseShareHash('#effect=test&cam=bad,data')
    expect(result?.cam).toBeUndefined()
  })

  it('ignores malformed controls JSON', () => {
    const result = parseShareHash('#effect=test&c=not-json')
    expect(result?.c).toBeUndefined()
  })

  it('ignores negative particleCount', () => {
    const result = parseShareHash('#effect=test&p=-100')
    expect(result?.p).toBeUndefined()
  })
})

describe('round-trip', () => {
  it('encode then decode preserves all values', () => {
    const original: ShareState = {
      effect: 'fractal-frequency',
      p: 20000,
      ps: 1.5,
      ar: 2.5,
      z: 1,
      cam: [1.837, 0, 3.063],
      tgt: [0, 0, 0],
      bg: 'nebula',
      c: { freq: 2.5, amp: 15, pulse: 0.633 },
      txt: 'PRTCL',
      font: 'Orbitron',
      w: '700',
      ls: 1.0,
    }
    const hash = encodeShareState(original)
    const decoded = parseShareHash('#' + hash)
    expect(decoded).toEqual(original)
  })

  it('round-trip with special chars in text', () => {
    const original: ShareState = {
      effect: 'text-wave',
      txt: 'Hello & World!',
    }
    const hash = encodeShareState(original)
    const decoded = parseShareHash('#' + hash)
    expect(decoded?.txt).toBe('Hello & World!')
  })
})
