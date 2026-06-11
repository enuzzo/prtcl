import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { Vector3, Color } from 'three'
import { compileEffect } from '../engine/compiler'
import { ALL_PRESETS } from '../effects/presets'

/**
 * Safety net for preset revamps: every built-in effect must
 *  1. pass the validator + compile,
 *  2. produce finite positions/colors across particle indices, times and
 *     control extremes (min/initial/max),
 *  3. have `controls` overrides that reference declared control ids
 *     within their declared ranges.
 */
describe('ALL_PRESETS', () => {
  for (const preset of ALL_PRESETS) {
    describe(preset.name, () => {
      const result = compileEffect(preset)

      it('compiles', () => {
        expect(result.ok, result.ok ? '' : result.error).toBe(true)
      })

      if (!result.ok) return
      const { fn, controls } = result.value

      it('controls overrides reference declared ids within range', () => {
        const byId = new Map(controls.map((c) => [c.id, c]))
        for (const [id, value] of Object.entries(preset.controls ?? {})) {
          const decl = byId.get(id)
          expect(decl, `override "${id}" has no matching addControl`).toBeDefined()
          expect(value).toBeGreaterThanOrEqual(decl!.min)
          expect(value).toBeLessThanOrEqual(decl!.max)
        }
      })

      it('stays finite across time, indices and control extremes', () => {
        const target = new Vector3()
        const color = new Color()
        const count = 5000
        // Text effects read textPoints (6 floats per particle: xyz + rgb)
        const textPoints =
          preset.category === 'text'
            ? new Float32Array(count * 6).map((_, k) => (k % 6 < 3 ? Math.sin(k) * 2 : 1))
            : undefined

        const controlSets: Array<(id: string) => number> = [
          (id) => controls.find((c) => c.id === id)?.initial ?? 0,
          (id) => controls.find((c) => c.id === id)?.min ?? 0,
          (id) => controls.find((c) => c.id === id)?.max ?? 0,
          (id) => preset.controls?.[id] ?? controls.find((c) => c.id === id)?.initial ?? 0,
        ]
        const setInfo = () => {}

        for (const getControl of controlSets) {
          for (const time of [0, 0.5, 7.3, 61.7, 3600]) {
            for (const i of [0, 1, 17, 499, 2500, count - 1]) {
              target.set(0, 0, 0)
              color.set(1, 1, 1)
              fn(i, count, target, color, time, THREE, getControl, setInfo, textPoints, 0, 2, 5, 0, 0, 0, 0, 0, 0, 0, 0)
              expect(isFinite(target.x) && isFinite(target.y) && isFinite(target.z), `non-finite position at i=${i} t=${time}`).toBe(true)
              expect(isFinite(color.r) && isFinite(color.g) && isFinite(color.b), `non-finite color at i=${i} t=${time}`).toBe(true)
            }
          }
        }
      })
    })
  }
})
