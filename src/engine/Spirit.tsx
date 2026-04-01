/**
 * The Spirit — GPGPU curl noise particle simulation
 *
 * Original by Edan Kwan — MIT License
 * https://github.com/edankwan/The-Spirit
 * http://edankwan.com/experiments/the-spirit/
 *
 * Uses noise derivatives and curl noise to create a smoky, ethereal look.
 * Inspired by David Li's "Flow" (http://david.li/flow/) and
 * Simo Santavirta's "New Particle" (http://www.simppa.fi/blog/the-new-particle/).
 *
 * Ported to React Three Fiber for PRTCL by PRTCL Team.
 * All shader code is verbatim from the original.
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

// ─── Original settings (from settings.js module 19) ───────────────
const BG_COLOR = '#dfdfdf'   // light gray — the most critical visual element
const COLOR1 = '#ffffff'
const COLOR2 = '#ffffff'

// ─── Texture dimensions ────────────────────────────────────────────
// 256x256 = 65536 particles (matches original "65k" default)
const TEXTURE_WIDTH = 256
const TEXTURE_HEIGHT = 256
const AMOUNT = TEXTURE_WIDTH * TEXTURE_HEIGHT

// ─── GLSL: 4D Simplex Noise with Derivatives ──────────────────────
// Original: src/glsl/helpers/simplexNoiseDerivatives4.glsl
const simplexNoise4D = /* glsl */ `
vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

float mod289(float x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
}

float permute(float x) {
    return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float taylorInvSqrt(float r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip) {
    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
    vec4 p,s;

    p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
    s = vec4(lessThan(p, vec4(0.0)));
    p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;

    return p;
}

#define F4 0.309016994374947451

vec4 simplexNoiseDerivatives (vec4 v) {
    const vec4  C = vec4( 0.138196601125011,0.276393202250021,0.414589803375032,-0.447213595499958);

    vec4 i  = floor(v + dot(v, vec4(F4)) );
    vec4 x0 = v -   i + dot(i, C.xxxx);

    vec4 i0;
    vec3 isX = step( x0.yzw, x0.xxx );
    vec3 isYZ = step( x0.zww, x0.yyz );
    i0.x = isX.x + isX.y + isX.z;
    i0.yzw = 1.0 - isX;
    i0.y += isYZ.x + isYZ.y;
    i0.zw += 1.0 - isYZ.xy;
    i0.z += isYZ.z;
    i0.w += 1.0 - isYZ.z;

    vec4 i3 = clamp( i0, 0.0, 1.0 );
    vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
    vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

    vec4 x1 = x0 - i1 + C.xxxx;
    vec4 x2 = x0 - i2 + C.yyyy;
    vec4 x3 = x0 - i3 + C.zzzz;
    vec4 x4 = x0 + C.wwww;

    i = mod289(i);
    float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
    vec4 j1 = permute( permute( permute( permute (
             i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
           + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
           + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
           + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));


    vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

    vec4 p0 = grad4(j0,   ip);
    vec4 p1 = grad4(j1.x, ip);
    vec4 p2 = grad4(j1.y, ip);
    vec4 p3 = grad4(j1.z, ip);
    vec4 p4 = grad4(j1.w, ip);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    p4 *= taylorInvSqrt(dot(p4,p4));

    vec3 values0 = vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2));
    vec2 values1 = vec2(dot(p3, x3), dot(p4, x4));

    vec3 m0 = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
    vec2 m1 = max(0.5 - vec2(dot(x3,x3), dot(x4,x4)), 0.0);

    vec3 temp0 = -6.0 * m0 * m0 * values0;
    vec2 temp1 = -6.0 * m1 * m1 * values1;

    vec3 mmm0 = m0 * m0 * m0;
    vec2 mmm1 = m1 * m1 * m1;

    float dx = temp0[0] * x0.x + temp0[1] * x1.x + temp0[2] * x2.x + temp1[0] * x3.x + temp1[1] * x4.x + mmm0[0] * p0.x + mmm0[1] * p1.x + mmm0[2] * p2.x + mmm1[0] * p3.x + mmm1[1] * p4.x;
    float dy = temp0[0] * x0.y + temp0[1] * x1.y + temp0[2] * x2.y + temp1[0] * x3.y + temp1[1] * x4.y + mmm0[0] * p0.y + mmm0[1] * p1.y + mmm0[2] * p2.y + mmm1[0] * p3.y + mmm1[1] * p4.y;
    float dz = temp0[0] * x0.z + temp0[1] * x1.z + temp0[2] * x2.z + temp1[0] * x3.z + temp1[1] * x4.z + mmm0[0] * p0.z + mmm0[1] * p1.z + mmm0[2] * p2.z + mmm1[0] * p3.z + mmm1[1] * p4.z;
    float dw = temp0[0] * x0.w + temp0[1] * x1.w + temp0[2] * x2.w + temp1[0] * x3.w + temp1[1] * x4.w + mmm0[0] * p0.w + mmm0[1] * p1.w + mmm0[2] * p2.w + mmm1[0] * p3.w + mmm1[1] * p4.w;

    return vec4(dx, dy, dz, dw) * 49.0;
}
`

// ─── GLSL: Curl noise from 4D simplex derivatives ─────────────────
// Original: src/glsl/helpers/curl4.glsl
const curlNoise = /* glsl */ `
vec3 curl( in vec3 p, in float noiseTime, in float persistence ) {

    vec4 xNoisePotentialDerivatives = vec4(0.0);
    vec4 yNoisePotentialDerivatives = vec4(0.0);
    vec4 zNoisePotentialDerivatives = vec4(0.0);

    for (int i = 0; i < 3; ++i) {

        float twoPowI = pow(2.0, float(i));
        float scale = 0.5 * twoPowI * pow(persistence, float(i));

        xNoisePotentialDerivatives += simplexNoiseDerivatives(vec4(p * twoPowI, noiseTime)) * scale;
        yNoisePotentialDerivatives += simplexNoiseDerivatives(vec4((p + vec3(123.4, 129845.6, -1239.1)) * twoPowI, noiseTime)) * scale;
        zNoisePotentialDerivatives += simplexNoiseDerivatives(vec4((p + vec3(-9519.0, 9051.0, -123.0)) * twoPowI, noiseTime)) * scale;
    }

    return vec3(
        zNoisePotentialDerivatives[1] - yNoisePotentialDerivatives[2],
        xNoisePotentialDerivatives[2] - zNoisePotentialDerivatives[0],
        yNoisePotentialDerivatives[0] - xNoisePotentialDerivatives[1]
    );

}
`

// ─── GLSL: Fullscreen quad vertex ──────────────────────────────────
// Original: src/glsl/quad.vert
const quadVertexShader = /* glsl */ `
attribute vec3 position;
void main() {
    gl_Position = vec4( position, 1.0 );
}
`

// ─── GLSL: Pass-through copy fragment ──────────────────────────────
// Original: src/glsl/through.frag
const throughFragmentShader = /* glsl */ `
uniform vec2 resolution;
uniform sampler2D texture;
void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    gl_FragColor = texture2D( texture, uv );
}
`

// ─── GLSL: Position update (curl noise simulation) ─────────────────
// Original: src/glsl/position.frag
// FAITHFUL to original: curlSize hardcoded 0.02, NO speed multiplier on curl or attraction
const positionFragmentShader = /* glsl */ `
uniform vec2 resolution;
uniform sampler2D texturePosition;
uniform sampler2D textureDefaultPosition;
uniform float time;
uniform float dieSpeed;
uniform float radius;
uniform float attraction;
uniform float initAnimation;
uniform vec3 mouse3d;

${simplexNoise4D}
${curlNoise}

void main() {

    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec4 positionInfo = texture2D( texturePosition, uv );
    vec3 position = mix(vec3(0.0, -200.0, 0.0), positionInfo.xyz, smoothstep(0.0, 0.3, initAnimation));
    float life = positionInfo.a - dieSpeed;

    vec3 followPosition = mix(vec3(0.0, -(1.0 - initAnimation) * 200.0, 0.0), mouse3d, smoothstep(0.2, 0.7, initAnimation));

    if(life < 0.0) {
        positionInfo = texture2D( textureDefaultPosition, uv );
        position = positionInfo.xyz * (1.0 + sin(time * 15.0) * 0.2 + (1.0 - initAnimation)) * 0.4 * radius;
        position += followPosition;
        life = 0.5 + fract(positionInfo.w * 21.4131 + time);
    } else {
        vec3 delta = followPosition - position;
        position += delta * (0.005 + life * 0.01) * attraction * (1.0 - smoothstep(50.0, 350.0, length(delta)));
        position += curl(position * 0.02 + 3.0, time, 0.1 + (1.0 - life) * 0.1);
    }

    gl_FragColor = vec4(position, life);

}
`

// ─── GLSL: Particle vertex (points mode) ───────────────────────────
// Original: src/glsl/particles.vert
const particlesVertexShader = /* glsl */ `
uniform sampler2D texturePosition;

varying float vLife;

void main() {

    vec4 positionInfo = texture2D( texturePosition, position.xy );

    vec4 worldPosition = modelMatrix * vec4( positionInfo.xyz, 1.0 );
    vec4 mvPosition = viewMatrix * worldPosition;

    vLife = positionInfo.w;
    gl_PointSize = 1300.0 / length( mvPosition.xyz ) * smoothstep(0.0, 0.2, positionInfo.w);

    gl_Position = projectionMatrix * mvPosition;

}
`

// ─── GLSL: Particle fragment ───────────────────────────────────────
// Original: src/glsl/particles.frag (without shadow chunks)
const particlesFragmentShader = /* glsl */ `
varying float vLife;
uniform vec3 color1;
uniform vec3 color2;

void main() {

    vec3 outgoingLight = mix(color2, color1, smoothstep(0.0, 0.7, vLife));

    gl_FragColor = vec4( outgoingLight, 1.0 );

}
`

// ─── GLSL: Triangle vertex ─────────────────────────────────────────
// Original: src/glsl/triangles.vert (without shadow chunks)
const trianglesVertexShader = /* glsl */ `
uniform sampler2D texturePosition;

varying float vLife;
attribute vec3 positionFlip;
attribute vec2 fboUV;

uniform float flipRatio;

void main() {

    vec4 positionInfo = texture2D( texturePosition, fboUV );
    vec3 pos = positionInfo.xyz;

    vec4 worldPosition = modelMatrix * vec4( pos, 1.0 );
    vec4 mvPosition = viewMatrix * worldPosition;

    vLife = positionInfo.w;

    mvPosition += vec4((position + (positionFlip - position) * flipRatio) * smoothstep(0.0, 0.2, positionInfo.w), 0.0);
    gl_Position = projectionMatrix * mvPosition;

}
`

// ─── Helper: Create default position texture ───────────────────────
function createDefaultPositionTexture(): THREE.DataTexture {
  const positions = new Float32Array(AMOUNT * 4)
  for (let i = 0; i < AMOUNT; i++) {
    const i4 = i * 4
    const r = (0.5 + Math.random() * 0.5) * 50
    const phi = (Math.random() - 0.5) * Math.PI
    const theta = Math.random() * Math.PI * 2
    positions[i4 + 0] = r * Math.cos(theta) * Math.cos(phi)
    positions[i4 + 1] = r * Math.sin(phi)
    positions[i4 + 2] = r * Math.sin(theta) * Math.cos(phi)
    positions[i4 + 3] = Math.random()
  }
  const texture = new THREE.DataTexture(
    positions,
    TEXTURE_WIDTH,
    TEXTURE_HEIGHT,
    THREE.RGBAFormat,
    THREE.FloatType,
  )
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.needsUpdate = true
  texture.generateMipmaps = false
  return texture
}

// ─── Helper: Create FBO render target ──────────────────────────────
function createRenderTarget(): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(TEXTURE_WIDTH, TEXTURE_HEIGHT, {
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    depthBuffer: false,
    stencilBuffer: false,
  })
}

// ─── Helper: Create point particle geometry ────────────────────────
function createPointGeometry(): THREE.BufferGeometry {
  const position = new Float32Array(AMOUNT * 3)
  for (let i = 0; i < AMOUNT; i++) {
    const i3 = i * 3
    position[i3 + 0] = (i % TEXTURE_WIDTH) / TEXTURE_WIDTH
    position[i3 + 1] = ~~(i / TEXTURE_WIDTH) / TEXTURE_HEIGHT
    position[i3 + 2] = 0
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
  return geometry
}

// ─── Helper: Create triangle particle geometry ─────────────────────
function createTriangleGeometry(): THREE.BufferGeometry {
  const position = new Float32Array(AMOUNT * 3 * 3)
  const positionFlip = new Float32Array(AMOUNT * 3 * 3)
  const fboUV = new Float32Array(AMOUNT * 2 * 3)

  const PI = Math.PI
  const angle = PI * 2 / 3
  const angles: [number, number, number, number, number, number, number, number, number, number, number, number] = [
    Math.sin(angle * 2 + PI), Math.cos(angle * 2 + PI),
    Math.sin(angle + PI), Math.cos(angle + PI),
    Math.sin(angle * 3 + PI), Math.cos(angle * 3 + PI),
    Math.sin(angle * 2), Math.cos(angle * 2),
    Math.sin(angle), Math.cos(angle),
    Math.sin(angle * 3), Math.cos(angle * 3),
  ]

  for (let i = 0; i < AMOUNT; i++) {
    const i6 = i * 6
    const i9 = i * 9
    if (i % 2) {
      position[i9 + 0] = angles[0]; position[i9 + 1] = angles[1]
      position[i9 + 3] = angles[2]; position[i9 + 4] = angles[3]
      position[i9 + 6] = angles[4]; position[i9 + 7] = angles[5]
      positionFlip[i9 + 0] = angles[6]; positionFlip[i9 + 1] = angles[7]
      positionFlip[i9 + 3] = angles[8]; positionFlip[i9 + 4] = angles[9]
      positionFlip[i9 + 6] = angles[10]; positionFlip[i9 + 7] = angles[11]
    } else {
      positionFlip[i9 + 0] = angles[0]; positionFlip[i9 + 1] = angles[1]
      positionFlip[i9 + 3] = angles[2]; positionFlip[i9 + 4] = angles[3]
      positionFlip[i9 + 6] = angles[4]; positionFlip[i9 + 7] = angles[5]
      position[i9 + 0] = angles[6]; position[i9 + 1] = angles[7]
      position[i9 + 3] = angles[8]; position[i9 + 4] = angles[9]
      position[i9 + 6] = angles[10]; position[i9 + 7] = angles[11]
    }
    fboUV[i6 + 0] = fboUV[i6 + 2] = fboUV[i6 + 4] = (i % TEXTURE_WIDTH) / TEXTURE_WIDTH
    fboUV[i6 + 1] = fboUV[i6 + 3] = fboUV[i6 + 5] = ~~(i / TEXTURE_WIDTH) / TEXTURE_HEIGHT
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
  geometry.setAttribute('positionFlip', new THREE.BufferAttribute(positionFlip, 3))
  geometry.setAttribute('fboUV', new THREE.BufferAttribute(fboUV, 2))
  return geometry
}

// ─── The Spirit Component ──────────────────────────────────────────
export function Spirit() {
  const { gl } = useThree()

  // Refs for simulation state
  const fboSceneRef = useRef<THREE.Scene>(null!)
  const fboCameraRef = useRef<THREE.Camera>(null!)
  const fboMeshRef = useRef<THREE.Mesh>(null!)
  const copyMatRef = useRef<THREE.RawShaderMaterial>(null!)
  const positionMatRef = useRef<THREE.RawShaderMaterial>(null!)
  const rt1Ref = useRef<THREE.WebGLRenderTarget>(null!)
  const rt2Ref = useRef<THREE.WebGLRenderTarget>(null!)
  const defaultPosTexRef = useRef<THREE.DataTexture>(null!)

  // Particle rendering refs
  const pointMeshRef = useRef<THREE.Points>(null!)
  const triMeshRef = useRef<THREE.Mesh>(null!)
  const pointMatRef = useRef<THREE.ShaderMaterial>(null!)
  const triMatRef = useRef<THREE.ShaderMaterial>(null!)

  // Animation state
  const initAnimRef = useRef(0)
  const followPointRef = useRef(new THREE.Vector3())
  const followPointTimeRef = useRef(0)
  const mouse3dRef = useRef(new THREE.Vector3())
  const flipRatioRef = useRef(0)

  // Floor color lerp (original: tmpColor starts at bgColor and lerps toward it)
  const floorColorRef = useRef(new THREE.Color(BG_COLOR))

  const rawPrefix = useMemo(() => {
    return 'precision ' + gl.capabilities.precision + ' float;\n'
  }, [gl])

  // ─── One-time setup ────────────────────────────────────────────
  const resources = useMemo(() => {
    // FBO scene + camera
    const fboScene = new THREE.Scene()
    const fboCamera = new THREE.Camera()
    fboCamera.position.z = 1

    // Copy shader
    const copyMat = new THREE.RawShaderMaterial({
      uniforms: {
        resolution: { value: new THREE.Vector2(TEXTURE_WIDTH, TEXTURE_HEIGHT) },
        texture: { value: null },
      },
      vertexShader: rawPrefix + quadVertexShader,
      fragmentShader: rawPrefix + throughFragmentShader,
    })

    // Position update shader — NO curlSize or speed uniforms (hardcoded in GLSL)
    const positionMat = new THREE.RawShaderMaterial({
      uniforms: {
        resolution: { value: new THREE.Vector2(TEXTURE_WIDTH, TEXTURE_HEIGHT) },
        texturePosition: { value: null },
        textureDefaultPosition: { value: null },
        mouse3d: { value: new THREE.Vector3() },
        dieSpeed: { value: 0.015 },
        radius: { value: 0.6 },
        attraction: { value: 1.0 },
        time: { value: 0.0 },
        initAnimation: { value: 0.0 },
      },
      vertexShader: rawPrefix + quadVertexShader,
      fragmentShader: rawPrefix + positionFragmentShader,
      blending: THREE.NoBlending,
      transparent: false,
      depthWrite: false,
      depthTest: false,
    })

    // Fullscreen quad
    const fboMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      copyMat,
    )
    fboScene.add(fboMesh)

    // Render targets
    const rt1 = createRenderTarget()
    const rt2 = createRenderTarget()

    // Default position texture
    const defaultPosTex = createDefaultPositionTexture()

    // --- Initialize: copy default positions into both render targets ---
    fboMesh.material = copyMat
    copyMat.uniforms.texture!.value = defaultPosTex
    gl.setRenderTarget(rt1)
    gl.render(fboScene, fboCamera)
    gl.setRenderTarget(rt2)
    gl.render(fboScene, fboCamera)
    gl.setRenderTarget(null)

    // --- Point particle material ---
    const pointMat = new THREE.ShaderMaterial({
      uniforms: {
        texturePosition: { value: null },
        color1: { value: new THREE.Color(COLOR1) },
        color2: { value: new THREE.Color(COLOR2) },
      },
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      blending: THREE.NoBlending,
    })

    // --- Triangle particle material ---
    const triMat = new THREE.ShaderMaterial({
      uniforms: {
        texturePosition: { value: null },
        flipRatio: { value: 0 },
        color1: { value: new THREE.Color(COLOR1) },
        color2: { value: new THREE.Color(COLOR2) },
      },
      vertexShader: trianglesVertexShader,
      fragmentShader: particlesFragmentShader,
      blending: THREE.NoBlending,
    })

    // --- Geometries ---
    const pointGeo = createPointGeometry()
    const triGeo = createTriangleGeometry()

    // --- Floor (from floor.js module 14) ---
    // Original: PlaneBufferGeometry(4500, 4500, 10, 10), roughness 0.4, metalness 0.4
    const floorGeo = new THREE.PlaneGeometry(4500, 4500, 10, 10)
    const floorMat = new THREE.MeshStandardMaterial({
      color: BG_COLOR,
      roughness: 0.4,
      metalness: 0.4,
    })

    return {
      fboScene, fboCamera, copyMat, positionMat, fboMesh,
      rt1, rt2, defaultPosTex,
      pointMat, triMat, pointGeo, triGeo,
      floorGeo, floorMat,
    }
  }, [gl, rawPrefix])

  // Store refs for useFrame access
  useEffect(() => {
    fboSceneRef.current = resources.fboScene
    fboCameraRef.current = resources.fboCamera
    fboMeshRef.current = resources.fboMesh
    copyMatRef.current = resources.copyMat
    positionMatRef.current = resources.positionMat
    rt1Ref.current = resources.rt1
    rt2Ref.current = resources.rt2
    defaultPosTexRef.current = resources.defaultPosTex
    pointMatRef.current = resources.pointMat
    triMatRef.current = resources.triMat
  }, [resources])

  // Cleanup
  useEffect(() => {
    return () => {
      resources.rt1.dispose()
      resources.rt2.dispose()
      resources.defaultPosTex.dispose()
      resources.pointGeo.dispose()
      resources.triGeo.dispose()
      resources.copyMat.dispose()
      resources.positionMat.dispose()
      resources.pointMat.dispose()
      resources.triMat.dispose()
      resources.floorGeo.dispose()
      resources.floorMat.dispose()
    }
  }, [resources])

  // Override scene.background with #dfdfdf on mount, restore on unmount
  // Uses backgroundOverride flag to prevent SceneBackground from fighting us
  const { scene } = useThree()
  const prevBackground = useRef<THREE.Color | THREE.Texture | null>(null)
  const prevFog = useRef<THREE.Fog | THREE.FogExp2 | null>(null)
  useEffect(() => {
    // Tell SceneBackground to yield control
    useStore.getState().setBackgroundOverride(true)

    // Save current scene state
    prevBackground.current = scene.background as THREE.Color | THREE.Texture | null
    prevFog.current = scene.fog

    // Original: setClearColor(bgColor), scene background = bgColor, fog = bgColor
    scene.background = new THREE.Color(BG_COLOR)
    scene.fog = new THREE.FogExp2(BG_COLOR, 0.001)

    return () => {
      scene.fog = prevFog.current
      scene.background = prevBackground.current
      useStore.getState().setBackgroundOverride(false)
    }
  }, [scene])

  // Enable shadows + set clear color (original: PCFSoftShadowMap, setClearColor(bgColor))
  useEffect(() => {
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
    gl.setClearColor(BG_COLOR, 1)
    return () => {
      gl.shadowMap.enabled = false
      gl.setClearColor(0x000000, 0)
    }
  }, [gl])

  // ─── Per-frame simulation + rendering ──────────────────────────
  useFrame((_, delta) => {
    const store = useStore.getState()
    const controls = store.controls
    const cm: Record<string, number> = {}
    for (const c of controls) cm[c.id] = c.value

    // Read controls — matching original dat.GUI exactly
    const dieSpeed = cm.dieSpeed ?? 0.015
    const radius = cm.radius ?? 0.6
    const attraction = cm.attraction ?? 1
    const useTriangles = (cm.useTriangles ?? 1) >= 0.5

    const bgColorObj = new THREE.Color(BG_COLOR)

    // Clamp delta to avoid huge jumps (original: no clamp, but we need it for R3F)
    const dt = Math.min(delta * 1000, 50)

    // Init animation: original _initAnimation += dt * 0.00025, max 1.0
    initAnimRef.current = Math.min(initAnimRef.current + dt * 0.00025, 1)

    // Follow point orbit — exact original values from simulator.js:
    // _followPointTime += dt * 0.001 (NO speed multiplier)
    followPointTimeRef.current += dt * 0.001
    followPointRef.current.set(
      Math.cos(followPointTimeRef.current) * 160.0,
      Math.cos(followPointTimeRef.current * 4.0) * 40.0,
      Math.sin(followPointTimeRef.current * 2.0) * 160.0,
    )
    // Original: mouse3d.lerp(followPoint, 0.2)
    mouse3dRef.current.lerp(followPointRef.current, 0.2)

    // ─── GPU simulation step ─────────────────────────────────
    // Swap render targets
    const tmp = rt1Ref.current
    rt1Ref.current = rt2Ref.current
    rt2Ref.current = tmp

    const u = positionMatRef.current.uniforms
    u.textureDefaultPosition!.value = defaultPosTexRef.current
    u.texturePosition!.value = rt2Ref.current.texture
    // Original: time += dt * 0.001 (no speed multiplier)
    u.time!.value += dt * 0.001
    // Original: dieSpeed is set directly from settings (no deltaRatio scaling)
    u.dieSpeed!.value = dieSpeed
    u.radius!.value = radius
    u.attraction!.value = attraction
    u.initAnimation!.value = initAnimRef.current
    u.mouse3d!.value.copy(mouse3dRef.current)

    fboMeshRef.current.material = positionMatRef.current
    const autoClear = gl.autoClear
    gl.autoClear = false
    gl.setRenderTarget(rt1Ref.current)
    gl.render(fboSceneRef.current, fboCameraRef.current)
    gl.setRenderTarget(null)
    gl.autoClear = autoClear

    // ─── Update particle material uniforms ───────────────────
    const posTexture = rt1Ref.current.texture

    if (pointMeshRef.current && pointMatRef.current) {
      pointMatRef.current.uniforms.texturePosition!.value = posTexture
      pointMeshRef.current.visible = !useTriangles
    }

    if (triMeshRef.current && triMatRef.current) {
      triMatRef.current.uniforms.texturePosition!.value = posTexture
      flipRatioRef.current = flipRatioRef.current === 0 ? 1 : 0
      triMatRef.current.uniforms.flipRatio!.value = flipRatioRef.current
      triMeshRef.current.visible = useTriangles
    }

    // Force scene.background + fog every frame (SceneBackground can race us)
    if (!(scene.background instanceof THREE.Color) || scene.background.getHexString() !== 'dfdfdf') {
      scene.background = new THREE.Color(BG_COLOR)
    }
    if (!scene.fog) {
      scene.fog = new THREE.FogExp2(BG_COLOR, 0.001)
    }

    // Floor color lerp (original: tmpColor.lerp(bgColor, 0.05), fog.color = tmpColor)
    const floorMesh = scene.getObjectByName('spirit-floor') as THREE.Mesh | undefined
    if (floorMesh) {
      const mat = floorMesh.material as THREE.MeshStandardMaterial
      floorColorRef.current.lerp(bgColorObj, 0.05)
      mat.color.copy(floorColorRef.current)
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(floorColorRef.current)
      }
      ;(scene.background as THREE.Color).copy(floorColorRef.current)
    }

    // Also force renderer clear color to match (original: renderer.setClearColor(tmpColor))
    gl.setClearColor(floorColorRef.current)
  })

  return (
    <group>
      {/* Point particles */}
      <points
        ref={pointMeshRef as React.Ref<THREE.Points>}
        geometry={resources.pointGeo}
        material={resources.pointMat}
        frustumCulled={false}
        visible={false}
      />

      {/* Triangle particles */}
      <mesh
        ref={triMeshRef as React.Ref<THREE.Mesh>}
        geometry={resources.triGeo}
        material={resources.triMat}
        frustumCulled={false}
        castShadow
        receiveShadow
      />

      {/* Floor (from floor.js module 14):
          PlaneBufferGeometry(4500, 4500, 10, 10)
          rotation.x = -1.57, position.y = -100
          receiveShadow = true, castShadow = false */}
      <mesh
        name="spirit-floor"
        geometry={resources.floorGeo}
        material={resources.floorMat}
        position={[0, -100, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      />

      {/* Lights (from lights.js module 15):
          Position: (0, 500, 0)
          AmbientLight(0x333333)
          PointLight(0xffffff, 1, 700) with castShadow
          Shadow map: 4096x2048, near 10, far 700, bias 0.1
          NO directional lights in the original */}
      <ambientLight color={0x333333} />
      <pointLight
        position={[0, 500, 0]}
        color={0xffffff}
        intensity={1}
        distance={700}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={700}
        shadow-bias={0.1}
      />
    </group>
  )
}
