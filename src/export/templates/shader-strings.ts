/** Vertex shader — perspective-scaled point sprites with custom color attribute */
export const VERTEX_SHADER = `
attribute vec3 customColor;
varying vec3 vColor;
uniform float uPointSize;

void main() {
  vColor = customColor;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uPointSize * (20.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}`.trim()

/** Fragment shader — soft circle with additive blending */
export const FRAGMENT_SHADER = `
varying vec3 vColor;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;
  float alpha = smoothstep(0.5, 0.1, dist);
  gl_FragColor = vec4(vColor, alpha);
}`.trim()
