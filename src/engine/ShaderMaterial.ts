import { ShaderMaterial, AdditiveBlending } from 'three'

const vertexShader = /* glsl */ `
  attribute vec3 customColor;
  varying vec3 vColor;
  uniform float uPointSize;

  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uPointSize * (20.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, dist);
    gl_FragColor = vec4(vColor, alpha);
  }
`

export function createParticleShaderMaterial(pointSize: number = 4.0): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uPointSize: { value: pointSize } },
    vertexShader,
    fragmentShader,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
}
