import type { Effect } from '../../engine/types'

export const hyperflower: Effect = {
  id: 'hyperflower',
  slug: 'hyperflower',
  name: 'Hyperflower',
  description: 'Twisted spherical harmonics pretending to be botany. The equations don\'t care about your degree. It blooms anyway.',
  author: 'PRTCL Team',
  tags: ['math', 'attractor', 'bloom', 'harmonics'],
  category: 'math',
  particleCount: 23000,
  pointSize: 0.21,
  cameraDistance: 6,
  cameraPosition: [-0.667, 0.476, 0.985],
  cameraTarget: [0, 0, 0],
  autoRotateSpeed: 0.5,
  backgroundPreset: 'plasma',
  disturbMode: 'swirl',
  code: `
    var sc = addControl('scale', 'Radius', 20, 220, 90);
    var tw = addControl('twist', 'Twist', 0, 8, 2.4);
    var fl = addControl('flow', 'Flow', 0, 4, 1.2);
    var ch = addControl('chaos', 'Chaos', 0, 2, 0.45);
    var bl = addControl('bloom', 'Bloom', 0, 3, 1.1);

    var aSc = sc + (bass || 0) * 30;
    var aFl = fl + (energy || 0) * 1.5;
    var aCh = ch + (beat || 0) * 1.5;

    var u = i / count;
    var a = u * 6.28318530718 * 34.0;
    var b = u * 6.28318530718 * 13.0;
    var t = time * aFl;

    var s1 = Math.sin(a + t);
    var c1 = Math.cos(a - t * 0.7);
    var s2 = Math.sin(b - t * 1.3);
    var c2 = Math.cos(b + t * 0.9);
    var s3 = Math.sin((a + b) * 0.5 - t * 0.5);
    var c3 = Math.cos((a - b) * 0.5 + t * 0.8);

    var ring = 0.58 + 0.24 * s2 + 0.18 * c3;
    var petal = Math.sin(a * 4.0 + t * 0.6) * Math.cos(b * 3.0 - t * 0.4);
    var shell = aSc * (0.28 + 0.72 * u);
    var radial = shell * ring * (1.0 + 0.22 * bl * petal);

    var theta = a + tw * (0.35 + u * 1.65) + 0.55 * s3;
    var phi = b * 0.55 + tw * 0.3 * c1 + 0.35 * Math.sin(t + u * 18.0);

    var cp = Math.cos(phi);
    var sp = Math.sin(phi);
    var ct = Math.cos(theta);
    var st = Math.sin(theta);

    var warp = aCh * aSc * 0.16;
    var x = radial * cp * ct + warp * (0.9 * s2 + 0.5 * c3);
    var y = radial * sp + warp * (0.7 * c1 - 0.6 * s3);
    var z = radial * cp * st + warp * (0.8 * c2 + 0.4 * petal);

    var S = 0.012;
    target.set(x * S, y * S, z * S);

    var hue = 0.52 + 0.22 * Math.sin(theta * 0.35 + phi * 0.6 - t * 0.25) + 0.08 * s2;
    hue = hue - Math.floor(hue);
    var sat = 0.72 + 0.22 * Math.abs(petal);
    sat = sat > 1.0 ? 1.0 : sat;
    var lig = 0.38 + 0.22 * ring + 0.08 * Math.sin(t + u * 12.0);
    lig = lig > 1.0 ? 1.0 : lig;
    color.setHSL(hue, sat, lig);

    if (i === 0) {
      setInfo('Hyperflower', 'Twisted spherical harmonics, orbital drift, and attractor-like warping fused into a living 3D particle field.');
    }
  `,
  controls: { scale: 93.913, twist: 1.357, flow: 0.278, chaos: 0.139, bloom: 0.587 },
  createdAt: '2026-03-22',
}
