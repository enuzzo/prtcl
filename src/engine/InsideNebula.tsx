import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

/**
 * Inside Nebula — Volumetric raymarching nebula with star particles.
 * Ported from CodePen "Inside Nebula" (incoming/effects/inside-nebula).
 * Aggressively optimized for 60fps on desktop:
 * - 2 octave noise everywhere
 * - 14 steps, 0.7 step size
 * - Precomputed hue rotation outside march loop
 * - Dithered ray start to hide banding
 * - DPR capped at 1.0 while mounted
 */

// ── Color palettes: [core, mid, outer] ──────────────────────
const NEBULA_PALETTES: [THREE.Color, THREE.Color, THREE.Color][] = [
  /* 0 PRTCL   */ [new THREE.Color('#FFFFFF'), new THREE.Color('#FF2BD6'), new THREE.Color('#7CFF00')],
  /* 1 Classic  */ [new THREE.Color('#FFE6F2'), new THREE.Color('#2A70B2'), new THREE.Color('#FFFFFF')],
  /* 2 Inferno  */ [new THREE.Color('#FFFF80'), new THREE.Color('#FF4400'), new THREE.Color('#880000')],
  /* 3 Arctic   */ [new THREE.Color('#FFFFFF'), new THREE.Color('#00DDFF'), new THREE.Color('#0044AA')],
  /* 4 Toxic    */ [new THREE.Color('#7CFF00'), new THREE.Color('#AA00FF'), new THREE.Color('#110022')],
  /* 5 Void     */ [new THREE.Color('#8844CC'), new THREE.Color('#330066'), new THREE.Color('#0A0014')],
]

// ── Fragment shader — fully optimized ───────────────────────
const volumeFragmentShader = /* glsl */ `
  varying vec3 vWorldPosition;

  uniform vec3 uColorCore;
  uniform vec3 uColorMid;
  uniform vec3 uColorOuter;
  uniform float uTime;
  uniform float uRidgeTime;
  uniform float uVeinTime;
  uniform float uDensityMult;
  uniform float uStructure;
  // Precomputed hue rotation components (set from JS)
  uniform float uCosHue;
  uniform float uSinHue;
  uniform float uSaturation;
  uniform float uBrightness;

  // ── Fast hash + noise (inlined, no function call overhead) ──
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  // 2-octave fbm — 2 noise evals
  float fbm2(vec3 p) {
    return 0.5 * noise(p) + 0.25 * noise(p * 2.2);
  }

  // 2-octave ridge — 2 noise evals
  float ridge2(vec3 p) {
    float n0 = 1.0 - abs(noise(p) * 2.0 - 1.0);
    float n1 = 1.0 - abs(noise(p * 2.2) * 2.0 - 1.0);
    return 0.5 * n0 + 0.25 * n1;
  }

  // Single-pass vein — 1 noise eval
  float vein(vec3 p) {
    float n = 1.0 - abs(noise(p) * 2.0 - 1.0);
    return n * n * n; // cheaper than pow(n, 5.0), visually close
  }

  vec2 hitBox(vec3 ro, vec3 rd, vec3 extents) {
    vec3 t0 = (-extents - ro) / rd;
    vec3 t1 = (extents - ro) / rd;
    vec3 tmin = min(t0, t1);
    vec3 tmax = max(t0, t1);
    return vec2(max(max(tmin.x, tmin.y), tmin.z),
                min(min(tmax.x, tmax.y), tmax.z));
  }

  void main() {
    vec3 ro = cameraPosition;
    vec3 rd = normalize(vWorldPosition - cameraPosition);

    vec2 hit = hitBox(ro, rd, vec3(5.0));
    if(hit.x > hit.y || hit.y < 0.0) discard;

    // Dithered ray start — hides banding from large step size
    float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);

    float stepSize = 0.7;
    float t = max(hit.x, 0.0) + dither * stepSize;
    float tmx = min(hit.y, 15.0);
    float str3 = uStructure * 3.0;

    // Precompute hue rotation matrix (Rodrigues, axis = (1,1,1)/sqrt(3))
    vec3 k = vec3(0.57735);

    vec4 sum = vec4(0.0);

    for(int i = 0; i < 14; i++) {
      if(t >= tmx || sum.a >= 0.95) break;

      vec3 p = ro + rd * t;
      float r = length(p);

      if(r < 4.8) {
        vec3 q = (p - vec3(0.0, uTime * 0.15, uTime * 0.05)) * str3;
        vec3 qR = (p - vec3(0.0, uRidgeTime * 0.15, uRidgeTime * 0.05)) * str3;

        float n1 = fbm2(q);
        float n2 = ridge2(qR * 1.5 + n1 * 0.5);

        float falloff = smoothstep(4.5, 0.5, r);
        float density = (n1 * 0.6 + n2 * 0.4) * falloff;
        density = max(density - 0.15, 0.0) * uDensityMult;

        if(density > 0.01) {
          // Veins only computed when we know we'll use the pixel
          vec3 qV = (p - vec3(0.0, uVeinTime * 0.15, uVeinTime * 0.05)) * str3;
          float veins = vein(qV * 2.0 - vec3(uVeinTime * 0.1));

          vec3 c = mix(uColorOuter, uColorMid, smoothstep(4.5, 1.5, r));
          c = mix(c, uColorCore, smoothstep(2.5, 0.0, r) * density);
          c = mix(c, vec3(0.0, 0.8, 1.0), smoothstep(0.6, 1.0, n2) * 0.4);
          c += mix(uColorMid, vec3(0.5, 0.9, 1.0), n1) * veins * 2.5 * falloff;
          c *= mix(0.1, 1.0, n1);

          // Saturation
          c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, uSaturation);
          // Hue rotation (precomputed cos/sin)
          c = c * uCosHue + cross(k, c) * uSinHue + k * dot(k, c) * (1.0 - uCosHue);
          // Brightness
          c *= uBrightness;

          sum += vec4(c * density * 1.2, density * 0.15 * 1.2) * (1.0 - sum.a);
        }
      }
      t += stepSize;
    }

    gl_FragColor = sum;
  }
`

const volumeVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

// ── Star particle shaders ───────────────────────────────────
const starVertexShader = /* glsl */ `
  attribute float size;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = max(size * (10.0 / -mvPosition.z), 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starFragmentShader = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor * 1.5, smoothstep(0.5, 0.1, d));
  }
`

/** Max stars we ever allocate — geometry is created once at this size */
const MAX_STARS = 30000

/** Raymarching DPR — cap pixel ratio for fragment-heavy volume */
const VOLUME_DPR = 1.0

export function InsideNebula() {
  const volumeRef = useRef<THREE.Mesh>(null)
  const starsRef = useRef<THREE.Points>(null)
  const { gl } = useThree()

  // Lower pixel ratio while mounted — one-shot, restore on unmount
  const originalDpr = useRef(gl.getPixelRatio())
  useEffect(() => {
    originalDpr.current = gl.getPixelRatio()
    gl.setPixelRatio(VOLUME_DPR)
    return () => { gl.setPixelRatio(originalDpr.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const gasTime = useRef(0)
  const ridgeTime = useRef(0)
  const veinTime = useRef(0)
  const lastPalette = useRef(-1)
  const lastStarCount = useRef(0)

  // ── Volume mesh ────────────────────────────────────────────
  const { volumeGeo, volumeMat } = useMemo(() => {
    const geo = new THREE.BoxGeometry(10, 10, 10)
    const mat = new THREE.ShaderMaterial({
      vertexShader: volumeVertexShader,
      fragmentShader: volumeFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uRidgeTime: { value: 0 },
        uVeinTime: { value: 0 },
        uDensityMult: { value: 0.5 },
        uStructure: { value: 0.14 },
        uColorCore: { value: NEBULA_PALETTES[0]![0].clone() },
        uColorMid: { value: NEBULA_PALETTES[0]![1].clone() },
        uColorOuter: { value: NEBULA_PALETTES[0]![2].clone() },
        uCosHue: { value: 1.0 },
        uSinHue: { value: 0.0 },
        uSaturation: { value: 1.0 },
        uBrightness: { value: 1.0 },
      },
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    })
    return { volumeGeo: geo, volumeMat: mat }
  }, [])

  // ── Star particles — pre-allocated at MAX_STARS ────────────
  const { starGeo, starMat } = useMemo(() => {
    const positions = new Float32Array(MAX_STARS * 3)
    const colors = new Float32Array(MAX_STARS * 3)
    const sizes = new Float32Array(MAX_STARS)

    for (let i = 0; i < MAX_STARS; i++) {
      const r = 0.5 + Math.random() * 8.0
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1
      sizes[i] = Math.random() * 1.0 + 0.2
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    // Start with draw range — updated in useFrame from store.particleCount
    geo.setDrawRange(0, 600)

    const mat = new THREE.ShaderMaterial({
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    return { starGeo: geo, starMat: mat }
  }, [])

  // ── Animation loop ─────────────────────────────────────────
  useFrame((_state, delta) => {
    const store = useStore.getState()
    const controls = store.controls

    // Build control map — zero-alloc would need a persistent ref,
    // but this object is tiny and short-lived (no GC pressure)
    const cm: Record<string, number> = {}
    for (const c of controls) cm[c.id] = c.value

    const paletteIdx = Math.round(cm['nebPalette'] ?? 0)
    const hueShift = cm['hueShift'] ?? 0
    const gasSpeed = cm['gasSpeed'] ?? 1.0
    const plasmaSpeed = cm['plasmaSpeed'] ?? 0.3

    // Accumulate time
    gasTime.current += delta * gasSpeed
    ridgeTime.current += delta * plasmaSpeed
    veinTime.current += delta * 1.0

    // Update uniforms
    const u = volumeMat.uniforms
    u['uTime']!.value = gasTime.current
    u['uRidgeTime']!.value = ridgeTime.current
    u['uVeinTime']!.value = veinTime.current
    u['uDensityMult']!.value = cm['density'] ?? 0.5
    u['uStructure']!.value = cm['structure'] ?? 0.14
    u['uCosHue']!.value = Math.cos(hueShift)
    u['uSinHue']!.value = Math.sin(hueShift)
    u['uSaturation']!.value = cm['saturation'] ?? 1.0
    u['uBrightness']!.value = cm['brightness'] ?? 1.0

    // Palette colors
    const pal = NEBULA_PALETTES[paletteIdx] ?? NEBULA_PALETTES[0]!
    u['uColorCore']!.value.copy(pal[0])
    u['uColorMid']!.value.copy(pal[1])
    u['uColorOuter']!.value.copy(pal[2])

    // Star count from store (reactive to Particles slider)
    const starCount = Math.min(store.particleCount, MAX_STARS)
    if (starCount !== lastStarCount.current) {
      lastStarCount.current = starCount
      starGeo.setDrawRange(0, starCount)
    }

    // Star colors when palette changes
    if (paletteIdx !== lastPalette.current) {
      lastPalette.current = paletteIdx
      const cols = (starGeo.getAttribute('color') as THREE.BufferAttribute).array as Float32Array
      for (let i = 0; i < MAX_STARS; i++) {
        const pc = pal[i % 3]!
        cols[i * 3] = pc.r; cols[i * 3 + 1] = pc.g; cols[i * 3 + 2] = pc.b
      }
      ;(starGeo.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true
    }

    // Slow star rotation
    if (starsRef.current) starsRef.current.rotation.y += delta * 0.02 * gasSpeed
  })

  return (
    <group>
      <mesh ref={volumeRef} geometry={volumeGeo} material={volumeMat} />
      <points ref={starsRef} geometry={starGeo} material={starMat} />
    </group>
  )
}
