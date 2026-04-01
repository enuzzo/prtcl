/**
 * Pre-compiled Fractal Frequency effect for the landing page background.
 *
 * This avoids importing the full compiler + validator + effect presets,
 * keeping the landing page bundle small. The effect function body is
 * identical to src/effects/presets/frequency.ts but pre-wrapped via
 * new Function() with hardcoded default control values.
 *
 * If the Fractal Frequency effect changes, update this file to match.
 */

import type { CompiledEffectFn } from '../engine/types'

const FREQUENCY_CODE = `
var S = 0.06;
var freq = 2.5;
var amp = 15.0;
var pulse = 0.633;
var fractal = 3.0;
var colorSpeed = 1.0;
var t = time * pulse;
var fi = i / count;
var golden = 2.399963229728653;
var r = Math.sqrt(fi);
var theta = i * golden;
var bx = r * Math.cos(theta);
var by = r * Math.sin(theta);
var bz = (fi - 0.5) * 2.0;
var f1 = Math.sin(bx * freq + t) * Math.cos(by * freq - t);
var f2 = Math.sin(by * freq * 2.0 - t * 1.3) * Math.cos(bz * freq * 1.5 + t);
var f3 = Math.sin(bz * freq * 3.0 + t * 0.7) * Math.cos(bx * freq * 2.5 - t);
var wave = (f1 + f2 * 0.5 + f3 * 0.25) / (1.0 + fractal * 0.25);
var pulseWave = Math.sin(r * freq * 10.0 - t * 2.0) * amp * 0.2;
var distortion = wave * amp;
var nx = bx * (amp + distortion + pulseWave);
var ny = by * (amp + distortion + pulseWave);
var nz = bz * (amp + distortion) + wave * amp * 0.5;
var ct = Math.cos(t * 0.2);
var st = Math.sin(t * 0.2);
var rx = nx * ct - ny * st;
var ry = nx * st + ny * ct;
target.set(rx * S, ry * S, nz * S);
var waveEnergy = Math.abs(wave);
var colorT = time * colorSpeed;
var hue = 0.6 + 0.4 * Math.sin(waveEnergy * 3.0 + colorT);
var sat = 0.8 + 0.2 * waveEnergy;
var light = 0.4 + 0.3 * waveEnergy;
color.setHSL(hue, sat, light);
`

// Pre-compile once at module load — no compiler/validator needed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const frequencyFn = new Function(
  'i', 'count', 'target', 'color', 'time', 'THREE',
  'addControl', 'setInfo', 'textPoints',
  'camX', 'camY', 'camZ',
  'pointerX', 'pointerY', 'pointerZ',
  'bass', 'mids', 'highs', 'energy', 'beat',
  FREQUENCY_CODE,
) as CompiledEffectFn

export const frequencyControls: Record<string, number> = {
  freq: 2.5,
  amp: 15.0,
  pulse: 0.633,
  fractal: 3.0,
  colorSpeed: 1.0,
}
