import { axiom } from './axiom'

export interface AxiomPresetCamera {
  autoRotateSpeed: number
  zoom: number
  position: [number, number, number]
  target: [number, number, number]
}

export interface AxiomPresetControls {
  spread: number
  waveHeight: number
  waves: number
  waveSpeed: number
  agents: number
  agentSpeed: number
  palette: number
}

export interface AxiomPreset {
  id: string
  name: string
  particleCount: number
  pointSize: number
  backgroundPreset: string
  camera: AxiomPresetCamera
  controls: AxiomPresetControls
}

export const AXIOM_PRESETS: AxiomPreset[] = [
  {
    id: 'default',
    name: 'Default',
    particleCount: axiom.particleCount,
    pointSize: axiom.pointSize ?? 0.5,
    backgroundPreset: axiom.backgroundPreset ?? 'electric',
    camera: {
      autoRotateSpeed: axiom.autoRotateSpeed ?? 0,
      zoom: axiom.cameraZoom ?? 1,
      position: [...(axiom.cameraPosition ?? [0, 0, 5])] as [number, number, number],
      target: [...(axiom.cameraTarget ?? [0, 0, 0])] as [number, number, number],
    },
    controls: {
      spread: axiom.controls?.spread ?? 3,
      waveHeight: axiom.controls?.waveHeight ?? 1,
      waves: axiom.controls?.waves ?? 3,
      waveSpeed: axiom.controls?.waveSpeed ?? 0.8,
      agents: axiom.controls?.agents ?? 8,
      agentSpeed: axiom.controls?.agentSpeed ?? 1.2,
      palette: axiom.controls?.palette ?? 3,
    },
  },
  {
    id: 'melito',
    name: 'Melito',
    particleCount: 16000,
    pointSize: 1.56,
    backgroundPreset: 'cyan',
    camera: {
      autoRotateSpeed: 0.3,
      zoom: 1,
      position: [-3.177, 1.226, -2.611],
      target: [0, -0.3, 0],
    },
    controls: {
      spread: 4.396,
      waveHeight: 1.056,
      waves: 2.483,
      waveSpeed: 0.86,
      agents: 13.494,
      agentSpeed: 1.861,
      palette: 0,
    },
  },
]

function near(a: number, b: number, epsilon = 0.001): boolean {
  return Math.abs(a - b) <= epsilon
}

function nearVec3(a: [number, number, number], b: [number, number, number], epsilon = 0.001): boolean {
  return near(a[0], b[0], epsilon) && near(a[1], b[1], epsilon) && near(a[2], b[2], epsilon)
}

export function getAxiomPreset(id: string): AxiomPreset | undefined {
  return AXIOM_PRESETS.find((preset) => preset.id === id)
}

export function matchAxiomPreset(input: {
  particleCount: number
  pointSize: number
  backgroundPreset: string
  camera: AxiomPresetCamera
  controls: AxiomPresetControls
}): string {
  const { particleCount, pointSize, backgroundPreset, camera, controls } = input

  return AXIOM_PRESETS.find((preset) =>
    preset.backgroundPreset === backgroundPreset &&
    near(preset.particleCount, particleCount) &&
    near(preset.pointSize, pointSize) &&
    near(preset.camera.autoRotateSpeed, camera.autoRotateSpeed) &&
    near(preset.camera.zoom, camera.zoom) &&
    nearVec3(preset.camera.position, camera.position) &&
    nearVec3(preset.camera.target, camera.target) &&
    near(preset.controls.spread, controls.spread) &&
    near(preset.controls.waveHeight, controls.waveHeight) &&
    near(preset.controls.waves, controls.waves) &&
    near(preset.controls.waveSpeed, controls.waveSpeed) &&
    near(preset.controls.agents, controls.agents) &&
    near(preset.controls.agentSpeed, controls.agentSpeed) &&
    near(preset.controls.palette, controls.palette)
  )?.id ?? 'custom'
}
