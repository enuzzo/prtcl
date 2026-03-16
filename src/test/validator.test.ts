import { describe, it, expect } from 'vitest'
import { validateEffectCode } from '../engine/validator'

describe('validateEffectCode', () => {
  it('accepts valid effect code', () => {
    const code = `
      const speed = addControl('speed', 'Speed', 0, 5, 1);
      const angle = i / count * Math.PI * 2;
      target.set(Math.cos(angle + time * speed), Math.sin(angle + time * speed), 0);
      color.setHSL(i / count, 0.8, 0.6);
    `
    const result = validateEffectCode(code)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects code with document access', () => {
    const result = validateEffectCode('document.createElement("div")')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('document')
  })

  it('rejects code with window access', () => {
    const result = validateEffectCode('window.location.href')
    expect(result.valid).toBe(false)
  })

  it('rejects code with fetch', () => {
    const result = validateEffectCode('fetch("https://evil.com")')
    expect(result.valid).toBe(false)
  })

  it('rejects code with eval', () => {
    const result = validateEffectCode('eval("alert(1)")')
    expect(result.valid).toBe(false)
  })

  it('rejects code with import statements', () => {
    const result = validateEffectCode('import("malicious")')
    expect(result.valid).toBe(false)
  })

  it('rejects code with Function constructor', () => {
    const result = validateEffectCode('new Function("return this")()')
    expect(result.valid).toBe(false)
  })

  it('rejects code with globalThis', () => {
    const result = validateEffectCode('globalThis.fetch("evil")')
    expect(result.valid).toBe(false)
  })

  it('rejects code with setTimeout', () => {
    const result = validateEffectCode('setTimeout(() => {}, 1000)')
    expect(result.valid).toBe(false)
  })

  it('rejects code with localStorage', () => {
    const result = validateEffectCode('localStorage.getItem("key")')
    expect(result.valid).toBe(false)
  })

  it('allows THREE usage', () => {
    const code = 'target.set(THREE.MathUtils.lerp(0, 1, time), 0, 0)'
    expect(validateEffectCode(code).valid).toBe(true)
  })

  it('allows Math usage', () => {
    const code = 'target.set(Math.sin(time), Math.cos(time), 0)'
    expect(validateEffectCode(code).valid).toBe(true)
  })
})
