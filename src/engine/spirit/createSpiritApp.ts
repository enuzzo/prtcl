import orbitControlsSource from '../../../incoming/effects/The-Spirit-master/The-Spirit-master/src/controls/OrbitControls.js?raw'
import shaderParseSource from '../../../incoming/effects/The-Spirit-master/The-Spirit-master/src/helpers/shaderParse.js?raw'
import quadVertRaw from '../../../incoming/effects/The-Spirit-master/The-Spirit-master/src/glsl/quad.vert?raw'
import throughFragRaw from '../../../incoming/effects/The-Spirit-master/The-Spirit-master/src/glsl/through.frag?raw'
import particlesVertRaw from '../../../incoming/effects/The-Spirit-master/The-Spirit-master/src/glsl/particles.vert?raw'
import particlesFragRaw from '../../../incoming/effects/The-Spirit-master/The-Spirit-master/src/glsl/particles.frag?raw'
import particlesDistanceVertRaw from '../../../incoming/effects/The-Spirit-master/The-Spirit-master/src/glsl/particlesDistance.vert?raw'
import particlesDistanceFragRaw from '../../../incoming/effects/The-Spirit-master/The-Spirit-master/src/glsl/particlesDistance.frag?raw'
import trianglesVertRaw from '../../../incoming/effects/The-Spirit-master/The-Spirit-master/src/glsl/triangles.vert?raw'
import trianglesDistanceVertRaw from '../../../incoming/effects/The-Spirit-master/The-Spirit-master/src/glsl/trianglesDistance.vert?raw'
import simplexNoiseDerivatives4Raw from '../../../incoming/effects/The-Spirit-master/The-Spirit-master/src/glsl/helpers/simplexNoiseDerivatives4.glsl?raw'
import curl4Raw from '../../../incoming/effects/The-Spirit-master/The-Spirit-master/src/glsl/helpers/curl4.glsl?raw'
import type { SpiritSettings } from './config'
import { DEFAULT_SPIRIT_SETTINGS, SPIRIT_CAMERA_POSITION, SPIRIT_CAMERA_TARGET } from './config'
import type { LegacyThree } from './loadLegacyThree'
import type { CameraSnapshot } from '../camera-bridge'
import { useStore } from '../../store'

const SPIRIT_HAND_INPUT_ALPHA = 0.12
const SPIRIT_HAND_RETURN_ALPHA = 0.08
const SPIRIT_HAND_DEAD_ZONE = 0.06
const SPIRIT_HAND_X_RANGE = 220
const SPIRIT_HAND_Y_RANGE = 160
const SPIRIT_HAND_Z_RANGE = 280

export interface SpiritApp {
  setSettings: (next: Partial<SpiritSettings>) => void
  setViewport: (next: Partial<SpiritViewportState>) => void
  getSnapshot: () => CameraSnapshot
  resize: () => void
  dispose: () => void
}

export interface SpiritViewportState {
  cameraPosition?: [number, number, number]
  cameraTarget?: [number, number, number]
  autoRotateSpeed?: number
  cameraZoom?: number
  zoom?: number
}

function withGlslifyDefine(source: string): string {
  return `#define GLSLIFY 1\n${source.trim()}\n`
}

function stripGlslifyPragmas(source: string): string {
  return source.replace(/^\s*#pragma glslify:.*$/gm, '').trim()
}

const SIMPLEX_NOISE_DERIVATIVES_4 = stripGlslifyPragmas(simplexNoiseDerivatives4Raw)
const CURL_4 = stripGlslifyPragmas(curl4Raw).replaceAll('snoise4', 'simplexNoiseDerivatives')

const QUAD_VERT = withGlslifyDefine(quadVertRaw)
const THROUGH_FRAG = withGlslifyDefine(throughFragRaw)
const PARTICLES_VERT = withGlslifyDefine(particlesVertRaw)
const PARTICLES_FRAG = withGlslifyDefine(particlesFragRaw)
const PARTICLES_DISTANCE_VERT = withGlslifyDefine(particlesDistanceVertRaw)
const PARTICLES_DISTANCE_FRAG = withGlslifyDefine(particlesDistanceFragRaw)
const TRIANGLES_VERT = withGlslifyDefine(trianglesVertRaw)
const TRIANGLES_DISTANCE_VERT = withGlslifyDefine(trianglesDistanceVertRaw)

const POSITION_FRAG = withGlslifyDefine(`
uniform vec2 resolution;
uniform sampler2D texturePosition;
uniform sampler2D textureDefaultPosition;
uniform float time;
uniform float dieSpeed;
uniform float radius;
uniform float attraction;
uniform float motionSpeed;
uniform float initAnimation;
uniform vec3 mouse3d;

${SIMPLEX_NOISE_DERIVATIVES_4}
${CURL_4}

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
        position += delta * (0.005 + life * 0.01) * attraction * motionSpeed * (1.0 - smoothstep(50.0, 350.0, length(delta)));
        position += curl(position * 0.02 + 3.0, time, 0.1 + (1.0 - life) * 0.1) * motionSpeed;
    }

    gl_FragColor = vec4(position, life);

}
`)

function installOrbitControls(THREE: LegacyThree) {
  if (THREE.OrbitControls) return
  const module = { exports: undefined as unknown }
  const exports = module.exports
  // eslint-disable-next-line no-new-func
  new Function('THREE', 'module', 'exports', orbitControlsSource)(THREE, module, exports)
}

function createShaderParse(THREE: LegacyThree): (shader: string) => string {
  const module = { exports: undefined as unknown }
  const exports = module.exports
  const require = (id: string) => {
    if (id === 'three') return THREE
    throw new Error(`Unsupported Spirit shaderParse dependency: ${id}`)
  }
  // eslint-disable-next-line no-new-func
  new Function('require', 'module', 'exports', shaderParseSource)(require, module, exports)
  return module.exports as (shader: string) => string
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function easeOutCubic(t: number): number {
  const c = 1 - t
  return 1 - c * c * c
}

function round(n: number) {
  return Math.round(n * 1000) / 1000
}

function createFloor(THREE: LegacyThree, settings: SpiritSettings) {
  const geometry = new THREE.PlaneBufferGeometry(4500, 4500, 10, 10)
  const material = new THREE.MeshStandardMaterial({
    color: settings.bgColor,
    roughness: 0.4,
    metalness: 0.4,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -1.57
  mesh.castShadow = false
  mesh.receiveShadow = true

  return {
    mesh,
    dispose() {
      geometry.dispose()
      material.dispose()
    },
  }
}

function createLights(THREE: LegacyThree, settings: SpiritSettings) {
  let shadowDarkness = 0.45
  const mesh = new THREE.Object3D()
  mesh.position.set(0, 500, 0)

  const ambient = new THREE.AmbientLight(0x333333)
  mesh.add(ambient)

  const pointLight = new THREE.PointLight(0xffffff, 1, 700)
  pointLight.castShadow = true
  pointLight.shadowCameraNear = 10
  pointLight.shadowCameraFar = 700
  pointLight.shadowBias = 0.1
  pointLight.shadowMapWidth = 4096
  pointLight.shadowMapHeight = 2048
  mesh.add(pointLight)

  return {
    mesh,
    pointLight,
    update() {
      pointLight.shadowDarkness = shadowDarkness += (settings.shadowDarkness - shadowDarkness) * 0.1
    },
  }
}

function createSimulator(
  THREE: LegacyThree,
  renderer: LegacyThree,
  shaderParse: (shader: string) => string,
  settings: SpiritSettings,
) {
  const textureWidth = 256
  const textureHeight = 256
  const amount = textureWidth * textureHeight

  let positionRenderTarget: LegacyThree
  let positionRenderTarget2: LegacyThree
  let textureDefaultPosition: LegacyThree
  let followPointTime = 0

  const followPoint = new THREE.Vector3()
  const scene = new THREE.Scene()
  const camera = new THREE.Camera()
  camera.position.z = 1

  const rawShaderPrefix = `precision ${renderer.capabilities.precision} float;\n`

  const gl = renderer.getContext()
  if (!gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)) {
    throw new Error('The Spirit requires vertex shader texture support')
  }
  if (!gl.getExtension('OES_texture_float')) {
    throw new Error('The Spirit requires OES_texture_float support')
  }

  const copyShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { type: 'v2', value: new THREE.Vector2(textureWidth, textureHeight) },
      texture: { type: 't', value: undefined },
    },
    vertexShader: rawShaderPrefix + shaderParse(QUAD_VERT),
    fragmentShader: rawShaderPrefix + shaderParse(THROUGH_FRAG),
  })

  const positionShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { type: 'v2', value: new THREE.Vector2(textureWidth, textureHeight) },
      texturePosition: { type: 't', value: undefined },
      textureDefaultPosition: { type: 't', value: undefined },
      mouse3d: { type: 'v3', value: new THREE.Vector3() },
      dieSpeed: { type: 'f', value: 0 },
      radius: { type: 'f', value: 0 },
      attraction: { type: 'f', value: 0 },
      motionSpeed: { type: 'f', value: settings.motionSpeed },
      time: { type: 'f', value: 0 },
      initAnimation: { type: 'f', value: 0 },
    },
    vertexShader: rawShaderPrefix + shaderParse(QUAD_VERT),
    fragmentShader: rawShaderPrefix + shaderParse(POSITION_FRAG),
    blending: THREE.NoBlending,
    transparent: false,
    depthWrite: false,
    depthTest: false,
  })

  const mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), copyShader)
  scene.add(mesh)

  positionRenderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight, {
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    depthWrite: false,
    depthBuffer: false,
    stencilBuffer: false,
  })
  positionRenderTarget2 = positionRenderTarget.clone()
  copyTexture(createPositionTexture(), positionRenderTarget)
  copyTexture(positionRenderTarget, positionRenderTarget2)

  function copyTexture(input: LegacyThree, output: LegacyThree) {
    mesh.material = copyShader
    copyShader.uniforms.texture.value = input
    renderer.render(scene, camera, output)
  }

  function updatePosition(dt: number) {
    const tmp = positionRenderTarget
    positionRenderTarget = positionRenderTarget2
    positionRenderTarget2 = tmp

    mesh.material = positionShader
    positionShader.uniforms.textureDefaultPosition.value = textureDefaultPosition
    positionShader.uniforms.texturePosition.value = positionRenderTarget2
    positionShader.uniforms.time.value += dt * 0.001 * settings.motionSpeed
    renderer.render(scene, camera, positionRenderTarget)
  }

  function createPositionTexture() {
    const positions = new Float32Array(amount * 4)
    for (let i = 0; i < amount; i++) {
      const i4 = i * 4
      const r = (0.5 + Math.random() * 0.5) * 50
      const phi = (Math.random() - 0.5) * Math.PI
      const theta = Math.random() * Math.PI * 2
      positions[i4 + 0] = r * Math.cos(theta) * Math.cos(phi)
      positions[i4 + 1] = r * Math.sin(phi)
      positions[i4 + 2] = r * Math.sin(theta) * Math.cos(phi)
      positions[i4 + 3] = Math.random()
    }
    const texture = new THREE.DataTexture(positions, textureWidth, textureHeight, THREE.RGBAFormat, THREE.FloatType)
    texture.minFilter = THREE.NearestFilter
    texture.magFilter = THREE.NearestFilter
    texture.needsUpdate = true
    texture.generateMipmaps = false
    texture.flipY = false
    textureDefaultPosition = texture
    return texture
  }

  return {
    get positionRenderTarget() {
      return positionRenderTarget
    },
    update(dt: number, mouse3d: LegacyThree, initAnimation: number, forceFollowMouse = false) {
      const autoClearColor = renderer.autoClearColor
      const clearColor = renderer.getClearColor().getHex()
      const clearAlpha = renderer.getClearAlpha()

      renderer.autoClearColor = false

      positionShader.uniforms.dieSpeed.value = settings.dieSpeed
      positionShader.uniforms.radius.value = settings.radius
      positionShader.uniforms.attraction.value = settings.attraction
      positionShader.uniforms.motionSpeed.value = settings.motionSpeed
      positionShader.uniforms.initAnimation.value = initAnimation

      if (settings.followMouse || forceFollowMouse) {
        positionShader.uniforms.mouse3d.value.copy(mouse3d)
      } else {
        followPointTime += dt * 0.001 * settings.motionSpeed
        followPoint.set(
          Math.cos(followPointTime) * 160.0,
          Math.cos(followPointTime * 4.0) * 40.0,
          Math.sin(followPointTime * 2.0) * 160.0,
        )
        positionShader.uniforms.mouse3d.value.lerp(followPoint, 0.2)
      }

      updatePosition(dt)

      renderer.setClearColor(clearColor, clearAlpha)
      renderer.autoClearColor = autoClearColor
    },
    dispose() {
      mesh.geometry.dispose()
      copyShader.dispose()
      positionShader.dispose()
      positionRenderTarget.dispose()
      positionRenderTarget2.dispose()
      textureDefaultPosition.dispose()
    },
  }
}

function createParticles(
  THREE: LegacyThree,
  shaderParse: (shader: string) => string,
  settings: SpiritSettings,
  simulator: ReturnType<typeof createSimulator>,
  camera: LegacyThree,
) {
  const textureWidth = 256
  const textureHeight = 256
  const amount = textureWidth * textureHeight

  const container = new THREE.Object3D()
  const tmpColor = new THREE.Color()
  const color1 = new THREE.Color(settings.color1)
  const color2 = new THREE.Color(settings.color2)
  const meshes: LegacyThree[] = []

  const particleMesh = createParticleMesh()
  const triangleMesh = createTriangleMesh()
  triangleMesh.visible = false
  particleMesh.visible = false
  meshes.push(triangleMesh, particleMesh)

  function createParticleMesh() {
    const position = new Float32Array(amount * 3)
    for (let i = 0; i < amount; i++) {
      const i3 = i * 3
      position[i3 + 0] = (i % textureWidth) / textureWidth
      position[i3 + 1] = Math.floor(i / textureWidth) / textureHeight
    }

    const geometry = new THREE.BufferGeometry()
    geometry.addAttribute('position', new THREE.BufferAttribute(position, 3))

    const material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.shadowmap,
        {
          texturePosition: { type: 't', value: undefined },
          color1: { type: 'c', value: undefined },
          color2: { type: 'c', value: undefined },
        },
      ]),
      vertexShader: shaderParse(PARTICLES_VERT),
      fragmentShader: shaderParse(PARTICLES_FRAG),
      blending: THREE.NoBlending,
      fog: false,
    })

    material.uniforms.color1.value = color1
    material.uniforms.color2.value = color2

    const mesh = new THREE.Points(geometry, material)

    mesh.customDistanceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        lightPos: { type: 'v3', value: new THREE.Vector3(0, 0, 0) },
        texturePosition: { type: 't', value: undefined },
      },
      vertexShader: shaderParse(PARTICLES_DISTANCE_VERT),
      fragmentShader: shaderParse(PARTICLES_DISTANCE_FRAG),
      depthTest: true,
      depthWrite: true,
      side: THREE.BackSide,
      blending: THREE.NoBlending,
      fog: false,
    })

    mesh.castShadow = true
    mesh.receiveShadow = true
    container.add(mesh)

    return mesh
  }

  function createTriangleMesh() {
    const position = new Float32Array(amount * 3 * 3)
    const positionFlip = new Float32Array(amount * 3 * 3)
    const fboUV = new Float32Array(amount * 2 * 3)
    const PI = Math.PI
    const angle = (PI * 2) / 3
    const angles: [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ] = [
      Math.sin(angle * 2 + PI),
      Math.cos(angle * 2 + PI),
      Math.sin(angle + PI),
      Math.cos(angle + PI),
      Math.sin(angle * 3 + PI),
      Math.cos(angle * 3 + PI),
      Math.sin(angle * 2),
      Math.cos(angle * 2),
      Math.sin(angle),
      Math.cos(angle),
      Math.sin(angle * 3),
      Math.cos(angle * 3),
    ]

    for (let i = 0; i < amount; i++) {
      const i6 = i * 6
      const i9 = i * 9

      if (i % 2) {
        position[i9 + 0] = angles[0]
        position[i9 + 1] = angles[1]
        position[i9 + 3] = angles[2]
        position[i9 + 4] = angles[3]
        position[i9 + 6] = angles[4]
        position[i9 + 7] = angles[5]

        positionFlip[i9 + 0] = angles[6]
        positionFlip[i9 + 1] = angles[7]
        positionFlip[i9 + 3] = angles[8]
        positionFlip[i9 + 4] = angles[9]
        positionFlip[i9 + 6] = angles[10]
        positionFlip[i9 + 7] = angles[11]
      } else {
        positionFlip[i9 + 0] = angles[0]
        positionFlip[i9 + 1] = angles[1]
        positionFlip[i9 + 3] = angles[2]
        positionFlip[i9 + 4] = angles[3]
        positionFlip[i9 + 6] = angles[4]
        positionFlip[i9 + 7] = angles[5]

        position[i9 + 0] = angles[6]
        position[i9 + 1] = angles[7]
        position[i9 + 3] = angles[8]
        position[i9 + 4] = angles[9]
        position[i9 + 6] = angles[10]
        position[i9 + 7] = angles[11]
      }

      fboUV[i6 + 0] = fboUV[i6 + 2] = fboUV[i6 + 4] = (i % textureWidth) / textureWidth
      fboUV[i6 + 1] = fboUV[i6 + 3] = fboUV[i6 + 5] = Math.floor(i / textureWidth) / textureHeight
    }

    const geometry = new THREE.BufferGeometry()
    geometry.addAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.addAttribute('positionFlip', new THREE.BufferAttribute(positionFlip, 3))
    geometry.addAttribute('fboUV', new THREE.BufferAttribute(fboUV, 2))

    const material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.shadowmap,
        {
          texturePosition: { type: 't', value: undefined },
          flipRatio: { type: 'f', value: 0 },
          color1: { type: 'c', value: undefined },
          color2: { type: 'c', value: undefined },
          cameraMatrix: { type: 'm4', value: undefined },
        },
      ]),
      vertexShader: shaderParse(TRIANGLES_VERT),
      fragmentShader: shaderParse(PARTICLES_FRAG),
      blending: THREE.NoBlending,
      fog: false,
    })

    material.uniforms.color1.value = color1
    material.uniforms.color2.value = color2
    material.uniforms.cameraMatrix.value = camera.matrixWorld

    const mesh = new THREE.Mesh(geometry, material)

    mesh.customDistanceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        lightPos: { type: 'v3', value: new THREE.Vector3(0, 0, 0) },
        texturePosition: { type: 't', value: undefined },
        flipRatio: { type: 'f', value: 0 },
      },
      vertexShader: shaderParse(TRIANGLES_DISTANCE_VERT),
      fragmentShader: shaderParse(PARTICLES_DISTANCE_FRAG),
      depthTest: true,
      depthWrite: true,
      side: THREE.BackSide,
      blending: THREE.NoBlending,
      fog: false,
    })

    mesh.castShadow = true
    mesh.receiveShadow = true
    container.add(mesh)

    return mesh
  }

  return {
    container,
    update(lightWorldPosition: LegacyThree) {
      triangleMesh.visible = settings.useTriangleParticles
      particleMesh.visible = !settings.useTriangleParticles

      tmpColor.setStyle(settings.color1)
      color1.lerp(tmpColor, 0.05)

      tmpColor.setStyle(settings.color2)
      color2.lerp(tmpColor, 0.05)

      for (const mesh of meshes) {
        const distanceUniforms = mesh.customDistanceMaterial.uniforms
        const lightPos = distanceUniforms.lightPos?.value
        if (lightPos) lightPos.copy(lightWorldPosition)

        if (mesh.material.uniforms.cameraMatrix) {
          mesh.material.uniforms.cameraMatrix.value = camera.matrixWorld
        }

        mesh.material.uniforms.texturePosition.value = simulator.positionRenderTarget
        distanceUniforms.texturePosition.value = simulator.positionRenderTarget

        if (mesh.material.uniforms.flipRatio) {
          mesh.material.uniforms.flipRatio.value ^= 1
          distanceUniforms.flipRatio.value ^= 1
        }
      }
    },
    dispose() {
      for (const mesh of meshes) {
        mesh.geometry.dispose()
        mesh.material.dispose()
        mesh.customDistanceMaterial.dispose()
      }
    },
  }
}

export function createSpiritApp(
  THREE: LegacyThree,
  container: HTMLDivElement,
  initialSettings: SpiritSettings,
  initialViewport?: SpiritViewportState,
): SpiritApp {
  installOrbitControls(THREE)
  const shaderParse = createShaderParse(THREE)
  const settings: SpiritSettings = { ...DEFAULT_SPIRIT_SETTINGS, ...initialSettings }
  const initialTarget = initialViewport?.cameraTarget ?? SPIRIT_CAMERA_TARGET
  const initialPosition = initialViewport?.cameraPosition ?? SPIRIT_CAMERA_POSITION
  const initialZoom = initialViewport?.zoom ?? initialViewport?.cameraZoom ?? 1

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setClearColor(settings.bgColor)
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.shadowMap.enabled = true
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(settings.bgColor, 0.001)

  const camera = new THREE.PerspectiveCamera(45, 1, 10, 3000)
  camera.position.set(initialPosition[0], initialPosition[1], initialPosition[2])

  const floor = createFloor(THREE, settings)
  floor.mesh.position.y = -100
  scene.add(floor.mesh)

  const lights = createLights(THREE, settings)
  scene.add(lights.mesh)

  const simulator = createSimulator(THREE, renderer, shaderParse, settings)
  const particles = createParticles(THREE, shaderParse, settings, simulator, camera)
  scene.add(particles.container)

  const controls = new THREE.OrbitControls(camera, renderer.domElement)
  controls.target.set(initialTarget[0], initialTarget[1], initialTarget[2])
  controls.maxDistance = 1000
  controls.minPolarAngle = 0.3
  controls.maxPolarAngle = Math.PI / 2 - 0.1
  controls.noPan = true
  controls.autoRotate = false
  controls.autoRotateSpeed = 0
  controls.update()

  const baseZoomDistance = camera.position.clone().sub(controls.target).length()

  function applyZoom(zoom: number) {
    const dir = camera.position.clone().sub(controls.target)
    const dist = dir.length()
    if (dist <= 0.01) return
    dir.normalize()
    const newDist = baseZoomDistance / Math.max(0.2, Math.min(3, zoom))
    camera.position.copy(controls.target.clone().add(dir.multiplyScalar(newDist)))
    camera.updateMatrixWorld()
  }

  applyZoom(initialZoom)

  const bgColor = new THREE.Color(settings.bgColor)
  const mouse = new THREE.Vector2(0, 0)
  const mouse3d = new THREE.Vector3()
  const neutralMouse3d = new THREE.Vector3()
  const handOffset = new THREE.Vector3()
  const desiredHandOffset = new THREE.Vector3()
  const viewForward = new THREE.Vector3()
  const viewRight = new THREE.Vector3()
  const viewUp = new THREE.Vector3()
  const ray = new THREE.Ray()
  const rayOffset = new THREE.Vector3()
  const lightWorldPosition = new THREE.Vector3()

  let rafId = 0
  let lastTime = Date.now()
  let initAnimation = 0
  let disposed = false
  let didLogFogGuard = false
  let handEngaged = false
  let wasOpenPalm = false
  let baselineHandSize = 0
  let smoothPalmX = 0.5
  let smoothPalmY = 0.5
  let smoothHandSize = 0
  let anchorX = 0.5
  let anchorY = 0.5

  function sanitizeFogMaterial(material: LegacyThree) {
    if (!material) return
    if (!(material instanceof THREE.ShaderMaterial) && !(material instanceof THREE.RawShaderMaterial)) return
    if (!material.fog) return

    const uniforms = material.uniforms
    const hasFogUniforms =
      Boolean(uniforms?.fogColor) &&
      (Boolean(uniforms?.fogNear && uniforms?.fogFar) || Boolean(uniforms?.fogDensity))

    if (hasFogUniforms) return

    material.fog = false
    if (!didLogFogGuard) {
      didLogFogGuard = true
      console.warn('The Spirit: disabled unexpected fog on a legacy shader material.')
    }
  }

  function sanitizeFogMaterials() {
    scene.traverse((object: LegacyThree) => {
      sanitizeFogMaterial(object.material)
      sanitizeFogMaterial(object.customDistanceMaterial)
      sanitizeFogMaterial(object.customDepthMaterial)
    })
  }

  function handlePointerMove(clientX: number, clientY: number) {
    const rect = container.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1
  }

  function onMouseMove(evt: MouseEvent) {
    handlePointerMove(evt.clientX, evt.clientY)
  }

  function onTouchMove(evt: TouchEvent) {
    const touch = evt.changedTouches[0]
    if (!touch) return
    if (evt.cancelable) evt.preventDefault()
    handlePointerMove(touch.clientX, touch.clientY)
  }

  function resize() {
    const width = Math.max(container.clientWidth, 1)
    const height = Math.max(container.clientHeight, 1)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  function updateHandSpiritTarget(tracking: ReturnType<typeof useStore.getState>) {
    const handVisible =
      tracking.trackingEnabled &&
      tracking.trackingMode === 'control' &&
      tracking.gesture === 'open_palm' &&
      tracking.palmPosition != null

    if (handVisible) {
      if (!handEngaged) {
        handEngaged = true
        baselineHandSize = tracking.handSize
        smoothPalmX = tracking.palmPosition!.x
        smoothPalmY = tracking.palmPosition!.y
        smoothHandSize = tracking.handSize
      }

      if (!wasOpenPalm) {
        anchorX = smoothPalmX
        anchorY = smoothPalmY
      }
      wasOpenPalm = true

      smoothPalmX += (tracking.palmPosition!.x - smoothPalmX) * SPIRIT_HAND_INPUT_ALPHA
      smoothPalmY += (tracking.palmPosition!.y - smoothPalmY) * SPIRIT_HAND_INPUT_ALPHA
      smoothHandSize += (tracking.handSize - smoothHandSize) * SPIRIT_HAND_INPUT_ALPHA

      const dx = anchorX - smoothPalmX
      const dy = anchorY - smoothPalmY
      const mag = Math.sqrt(dx * dx + dy * dy)

      let normDx = 0
      let normDy = 0

      if (mag > SPIRIT_HAND_DEAD_ZONE) {
        const scale = Math.min((mag - SPIRIT_HAND_DEAD_ZONE) / (0.5 - SPIRIT_HAND_DEAD_ZONE), 1)
        normDx = (dx / mag) * scale
        normDy = (dy / mag) * scale
      }

      const sizeRatio = baselineHandSize > 0.01 ? smoothHandSize / baselineHandSize : 1
      const zoomOffset = Math.max(-1, Math.min(1, sizeRatio - 1))

      viewForward.copy(controls.target).sub(camera.position).normalize()
      viewRight.crossVectors(viewForward, camera.up).normalize()
      viewUp.crossVectors(viewRight, viewForward).normalize()

      desiredHandOffset.copy(viewRight).multiplyScalar(normDx * SPIRIT_HAND_X_RANGE)
      desiredHandOffset.add(viewUp.copy(viewUp).multiplyScalar(normDy * SPIRIT_HAND_Y_RANGE))
      desiredHandOffset.add(viewForward.copy(viewForward).multiplyScalar(zoomOffset * SPIRIT_HAND_Z_RANGE))
      handOffset.lerp(desiredHandOffset, 0.14)
    } else {
      wasOpenPalm = false
      desiredHandOffset.set(0, 0, 0)
      handOffset.lerp(desiredHandOffset, SPIRIT_HAND_RETURN_ALPHA)
      if (handOffset.lengthSq() < 1) {
        handOffset.set(0, 0, 0)
        handEngaged = false
        baselineHandSize = 0
      }
    }

    mouse3d.copy(neutralMouse3d).add(handOffset)
    return true
  }

  function render(dt: number) {
    const tracking = useStore.getState()
    const spiritHandControl = tracking.trackingEnabled && tracking.trackingMode === 'control'
    const handVisible =
      tracking.trackingEnabled &&
      tracking.trackingMode === 'disturb' &&
      tracking.gesture === 'open_palm' &&
      tracking.palmPosition != null

    let pointerX = mouse.x
    let pointerY = mouse.y

    if (handVisible) {
      pointerX = (1 - tracking.palmPosition!.x) * 2 - 1
      pointerY = -(tracking.palmPosition!.y * 2 - 1)
    } else if (spiritHandControl) {
      pointerX = 0
      pointerY = 0
    }

    sanitizeFogMaterials()

    bgColor.setStyle(settings.bgColor)
    const floorColor = floor.mesh.material.color
    floorColor.lerp(bgColor, 0.05)
    scene.fog.color.copy(floorColor)
    renderer.setClearColor(floorColor.getHex())

    initAnimation = Math.min(initAnimation + dt * 0.00025, 1)
    controls.maxDistance = initAnimation === 1 ? 1000 : lerp(1000, 450, easeOutCubic(initAnimation))
    controls.update()

    lights.update()

    camera.updateMatrixWorld()
    ray.origin.setFromMatrixPosition(camera.matrixWorld)
    ray.direction.set(pointerX, pointerY, 0.5).unproject(camera).sub(ray.origin).normalize()
    const distance = ray.origin.length() / Math.cos(Math.PI - ray.direction.angleTo(ray.origin))
    rayOffset.copy(ray.direction).multiplyScalar(distance)
    neutralMouse3d.copy(ray.origin).add(rayOffset)
    mouse3d.copy(neutralMouse3d)

    const handControlOverride = spiritHandControl && updateHandSpiritTarget(tracking)

    simulator.update(dt, mouse3d, initAnimation, handControlOverride || handVisible)
    lightWorldPosition.setFromMatrixPosition(lights.pointLight.matrixWorld)
    particles.update(lightWorldPosition)
    renderer.render(scene, camera)
  }

  function loop() {
    if (disposed) return
    const newTime = Date.now()
    rafId = window.requestAnimationFrame(loop)
    try {
      render(newTime - lastTime)
      lastTime = newTime
    } catch (error) {
      disposed = true
      window.cancelAnimationFrame(rafId)
      console.error('The Spirit render loop crashed:', error)
      throw error
    }
  }

  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false })
  resize()
  loop()

  return {
    setSettings(next) {
      Object.assign(settings, next)
    },
    setViewport(next) {
      if (next.cameraTarget) {
        controls.target.set(next.cameraTarget[0], next.cameraTarget[1], next.cameraTarget[2])
      }
      if (next.cameraPosition) {
        camera.position.set(next.cameraPosition[0], next.cameraPosition[1], next.cameraPosition[2])
      }
      const nextZoom = next.zoom ?? next.cameraZoom
      if (nextZoom != null) {
        applyZoom(nextZoom)
      }
      controls.autoRotate = false
      controls.autoRotateSpeed = 0
      controls.update()
    },
    getSnapshot() {
      return {
        position: [round(camera.position.x), round(camera.position.y), round(camera.position.z)],
        target: [round(controls.target.x), round(controls.target.y), round(controls.target.z)],
      }
    },
    resize,
    dispose() {
      disposed = true
      window.cancelAnimationFrame(rafId)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('touchmove', onTouchMove)
      particles.dispose()
      simulator.dispose()
      floor.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    },
  }
}
