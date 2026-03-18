import type { Effect } from '../../engine/types'

export const textVarsity: Effect = {
  id: 'text-varsity',
  slug: 'text-varsity',
  name: 'Text Varsity',
  description: 'Bold 3D lettering with a crisp offset shadow. Straight from the jersey to the particle cloud.',
  category: 'text',
  tags: ['text', '3d', 'varsity', 'bold', 'shadow', 'offset', 'lettering'],
  author: 'PRTCL Team',
  particleCount: 18000,
  pointSize: 0.9,
  autoRotateSpeed: 0,
  cameraDistance: 7,
  cameraPosition: [0, 0, 7] as [number, number, number],
  cameraTarget: [0, 0, 0] as [number, number, number],
  createdAt: '2026-03-18',
  code: `
var depth = addControl("depth", "3D Depth", 0.05, 1.5, 0.45);
var angle = addControl("angle", "Offset Angle", 0.0, 6.28, 3.92);
var layers = addControl("layers", "Layers", 2.0, 8.0, 5.0);
// Style: 0=PRTCL (magenta/lime), 1=Classic (white/navy), 2=Gold (cream/dark), 3=Ice (cyan/deep blue)
var style = addControl("style", "Style", 0.0, 3.0, 0.0);
var shimmer = addControl("shimmer", "Shimmer", 0.0, 1.0, 0.3);
var thickness = addControl("thickness", "Thickness", 0.0, 1.0, 0.4);

if (textPoints && i * 3 + 2 < textPoints.length) {
  var tx = textPoints[i * 3];
  var ty = textPoints[i * 3 + 1];

  // How many discrete depth layers to render
  var numLayers = Math.round(layers);
  // Which layer does this particle belong to?
  var layerIdx = Math.floor((i / count) * numLayers);
  if (layerIdx >= numLayers) layerIdx = numLayers - 1;
  var layerT = numLayers > 1 ? layerIdx / (numLayers - 1) : 1.0; // 0=back, 1=front

  // Offset direction from angle control
  var offX = Math.cos(angle) * depth;
  var offY = Math.sin(angle) * depth;

  // Each layer is progressively offset
  var invertT = 1.0 - layerT;
  var px = tx + offX * invertT;
  var py = ty + offY * invertT;

  // Base Z from layer offset (back layers pushed behind front)
  var baseZ = -depth * invertT * 0.8;

  // ── Volumetric thickness per layer ──
  // Front layer is thickest (4 sub-planes), back layers thinner (2).
  // Gives real 3D solidity — each layer is a slab, not a plane.
  var frontSubs = 4.0;
  var backSubs = 2.0;
  var subPlanes = backSubs + layerT * (frontSubs - backSubs); // 2→4
  var subPlaneCount = Math.round(subPlanes);

  // Deterministic hash to assign this particle to a sub-plane within its layer
  var subHash = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  subHash = subHash - Math.floor(subHash); // 0-1
  var subIdx = Math.floor(subHash * subPlaneCount);

  // Spread sub-planes across the layer's Z thickness
  var layerThickness = thickness * 0.3 * (0.5 + layerT * 0.5); // front thicker
  var subZ = (subPlaneCount > 1)
    ? (subIdx / (subPlaneCount - 1) - 0.5) * layerThickness
    : 0.0;

  var pz = baseZ + subZ;

  // Subtle shimmer on front layers
  if (shimmer > 0.01 && layerT > 0.5) {
    var shimAmt = shimmer * 0.03 * layerT;
    px = px + Math.sin(i * 3.7 + time * 2.0) * shimAmt;
    py = py + Math.cos(i * 2.3 + time * 1.7) * shimAmt;
    pz = pz + Math.sin(i * 5.1 + time * 1.3) * shimAmt * 0.5;
  }

  target.set(px, py, pz);

  // Subtle luminance variation within a layer based on sub-plane depth
  // Front sub-planes slightly brighter, back sub-planes slightly darker
  var subLumBoost = (subPlaneCount > 1)
    ? (subIdx / (subPlaneCount - 1) - 0.5) * 0.08
    : 0.0;

  // Round style to nearest int
  var st = Math.round(style);

  if (st <= 0) {
    // PRTCL — magenta (back) → lime (front)
    var hue = 0.89 + layerT * (-0.65);
    if (hue < 0.0) hue = hue + 1.0;
    var sat = 0.9;
    var lum = 0.25 + layerT * 0.35 + subLumBoost;
    color.setHSL(hue, sat, lum);
  } else if (st <= 1) {
    // Classic — navy (back) → white (front)
    var hue = 0.62;
    var sat = 0.8 - layerT * 0.7;
    var lum = 0.12 + layerT * 0.83 + subLumBoost;
    color.setHSL(hue, sat, lum);
  } else if (st <= 2) {
    // Gold — dark brown (back) → cream (front)
    var hue = 0.08 + layerT * 0.04;
    var sat = 0.7 + layerT * 0.2;
    var lum = 0.1 + layerT * 0.55 + subLumBoost;
    color.setHSL(hue, sat, lum);
  } else {
    // Ice — deep blue (back) → bright cyan (front)
    var hue = 0.6 - layerT * 0.08;
    var sat = 0.9 + layerT * 0.1;
    var lum = 0.08 + layerT * 0.52 + subLumBoost;
    color.setHSL(hue, sat, lum);
  }
} else {
  target.set(0, 0, 0);
  color.setHSL(0, 0, 0.05);
}
`,
}
