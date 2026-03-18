import type { Effect } from '../../engine/types'

/**
 * Magnetic Dust
 * A shimmering cloud of metallic particles attracted to the cursor.
 * Each particle "glitters" — rapidly oscillating brightness to simulate
 * tiny reflective surfaces (like metallic confetti) catching light.
 * Two colored point lights orbit the cloud for chromatic reflections.
 *
 * Inspired by the attraction cursor concept from threejs-components
 * by Kevin Music (CC BY-NC-SA 4.0). This is an original implementation
 * for the PRTCL effect system — no code was reused.
 */
export const magneticDust: Effect = {
  id: 'magnetic-dust',
  slug: 'magnetic-dust',
  name: 'Magnetic Dust',
  description: 'Twenty thousand metallic particles, magnetically obsessed with your cursor. Don\'t flatter yourself. It\'s physics, not affection.',
  author: 'PRTCL Team',
  category: 'abstract',
  tags: ['cursor', 'interactive', 'glitter', 'attraction', 'metallic', 'mouse', 'touch'],
  particleCount: 20000,
  pointSize: 1.2,
  cameraDistance: 8,
  cameraPosition: [0, 0, 8],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0,
  cameraZoom: 1,
  createdAt: '2026-03-17',
  code: `
// ── Persistent state (survives across frames via closure-free pattern) ──
// We use the particle's "home" position as a hash seed for per-particle randomness.
// No external state needed — everything derives from i, count, time.

var attraction = addControl('attraction', 'Attraction', 0, 2, 0.75);
var spread = addControl('spread', 'Spread', 0.5, 8, 4);
var glitterSpeed = addControl('glitterSpeed', 'Glitter Speed', 1, 20, 8);
var lightIntensity = addControl('lightIntensity', 'Light Intensity', 0, 1, 0.6);

// ── Per-particle pseudo-random (deterministic from index) ──
var hash = (i * 2654435761) >>> 0;
var r1 = ((hash & 0xFFFF) / 65535.0);       // 0..1
var r2 = (((hash >> 8) & 0xFFFF) / 65535.0);
var r3 = (((hash >> 16) & 0xFFFF) / 65535.0);
var r4 = (((hash >> 4) & 0xFFFF) / 65535.0);

// ── Home position: scattered sphere ──
var phi = r1 * Math.PI * 2;
var cosTheta = r2 * 2 - 1;
var sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
var radius = Math.pow(r3, 0.33) * spread;
var homeX = radius * sinTheta * Math.cos(phi);
var homeY = radius * sinTheta * Math.sin(phi);
var homeZ = radius * cosTheta;

// ── Attraction toward pointer ──
var px = pointerX || 0;
var py = pointerY || 0;
var dx = px - homeX;
var dy = py - homeY;
var dist = Math.sqrt(dx * dx + dy * dy + homeZ * homeZ);
var attractFactor = attraction / (1 + dist * 0.5);

// Lerp toward pointer (stronger when closer)
var x = homeX + dx * attractFactor;
var y = homeY + dy * attractFactor;
var z = homeZ * (1 - attractFactor * 0.3); // flatten Z slightly toward pointer

target.set(x, y, z);

// ── Glitter: rapid brightness oscillation ──
// Each particle has its own phase offset and frequency multiplier
var glitterPhase = r4 * Math.PI * 2;
var glitterFreq = 0.7 + r1 * 1.3; // 0.7x to 2x speed variation
var glitter = Math.sin(time * glitterSpeed * glitterFreq + glitterPhase);
// Square-ish response for sharper flashes (like light hitting a flat surface)
glitter = glitter > 0 ? Math.pow(glitter, 0.3) : 0;

// ── Two orbiting colored lights ──
var light1Angle = time * 0.4;
var light2Angle = time * 0.4 + Math.PI;
var lightRadius = spread * 0.6;
var l1x = Math.cos(light1Angle) * lightRadius;
var l1y = Math.sin(light1Angle) * lightRadius;
var l2x = Math.cos(light2Angle) * lightRadius;
var l2y = Math.sin(light2Angle) * lightRadius;

// Distance to each light
var d1 = Math.sqrt((x - l1x) * (x - l1x) + (y - l1y) * (y - l1y) + z * z);
var d2 = Math.sqrt((x - l2x) * (x - l2x) + (y - l2y) * (y - l2y) + z * z);

// Light falloff (inverse square, clamped)
var i1 = lightIntensity / (1 + d1 * d1 * 0.3);
var i2 = lightIntensity / (1 + d2 * d2 * 0.3);

// Light 1: warm teal-green (#00FFB0)
// Light 2: warm pink-magenta (#FF40B0)
var lr = 0.15 + i1 * 0.0 + i2 * 1.0;
var lg = 0.2  + i1 * 1.0 + i2 * 0.25;
var lb = 0.15 + i1 * 0.7 + i2 * 0.7;

// Apply glitter (multiplicative brightness flash)
var brightness = 0.08 + glitter * 0.92;
color.setRGB(lr * brightness, lg * brightness, lb * brightness);
`,
}
