import { describe, it, expect } from 'vitest'
import { compileEffect } from '../engine/compiler'
import type { Effect } from '../engine/types'

const makeEffect = (code: string): Effect => ({
  id: 'test', slug: 'test', name: 'Test', description: 'Test effect',
  author: 'Test', code, tags: [], category: 'abstract',
  particleCount: 100, cameraDistance: 5, createdAt: new Date().toISOString(),
})

describe('compileEffect', () => {
  it('compiles valid effect code', () => {
    const effect = makeEffect('target.set(Math.cos(i), Math.sin(i), 0); color.setHSL(i / count, 0.8, 0.6);')
    const result = compileEffect(effect)
    expect(result.ok).toBe(true)
    if (result.ok) expect(typeof result.value.fn).toBe('function')
  })

  it('rejects code that fails validation', () => {
    const effect = makeEffect('document.body.innerHTML = "hacked"')
    const result = compileEffect(effect)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('document')
  })

  it('rejects code with runtime errors', () => {
    const effect = makeEffect('undefinedVariable.foo()')
    const result = compileEffect(effect)
    expect(result.ok).toBe(false)
  })

  it('rejects code that produces NaN positions', () => {
    const effect = makeEffect('target.set(NaN, 0, 0)')
    const result = compileEffect(effect)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('NaN')
  })

  it('collects controls from addControl calls', () => {
    const effect = makeEffect(`
      const speed = addControl('speed', 'Speed', 0, 5, 1);
      target.set(speed * i, 0, 0);
      color.set(1, 1, 1);
    `)
    const result = compileEffect(effect)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.controls).toHaveLength(1)
      expect(result.value.controls[0]!.id).toBe('speed')
      expect(result.value.controls[0]!.initial).toBe(1)
    }
  })
})
