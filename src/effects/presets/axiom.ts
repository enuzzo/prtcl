import type { Effect } from '../../engine/types'

export const axiom: Effect = {
  id: 'axiom',
  slug: 'axiom',
  name: 'Axiom',
  description: 'An optimization landscape where agents search for truth. They slow down, revisit, and stop. The search space is finite.',
  author: 'PRTCL Team',
  category: 'abstract',
  tags: ['search', 'optimization', 'terrain', 'landscape', 'agents', 'abstract'],
  particleCount: 20000,
  pointSize: 0.5,
  cameraDistance: 8,
  cameraPosition: [3.325, 1.74, -2.006],
  cameraTarget: [0, -0.3, 0],
  autoRotateSpeed: 0.3,
  cameraZoom: 1,
  backgroundPreset: 'electric',
  disturbMode: 'repel',
  createdAt: '2026-03-22',
  controls: { spread: 3, waveHeight: 1, waves: 3, waveSpeed: 0.8, agents: 8, agentSpeed: 1.2, palette: 3 },
  code: `
    var spread = addControl('spread', 'Spread', 1, 30, 3);
    var wh = addControl('waveHeight', 'Wave Height', 0.1, 5, 1);
    var wvs = addControl('waves', 'Waves', 1, 8, 3);
    var ws = addControl('waveSpeed', 'Wave Speed', 0.1, 3, 0.8);
    var agPct = addControl('agents', 'Agents %', 0, 20, 8);
    var agSpd = addControl('agentSpeed', 'Agent Speed', 0.1, 4, 1.2);
    var pal = addControl('palette', 'Palette', 0, 4, 0);

    var aWs = ws + (bass || 0) * 1;
    var aAs = agSpd + (energy || 0) * 2;

    var agentCount = Math.floor(count * agPct * 0.01);
    var terrainCount = count - agentCount;
    var t = time * aWs;
    var wvCount = Math.floor(wvs);
    var freq = 3.0 / spread;
    var palIdx = Math.floor(pal);

    if (i >= agentCount) {
      var j = i - agentCount;
      var gridSize = Math.ceil(Math.sqrt(terrainCount));
      var gx = (j % gridSize) / gridSize - 0.5;
      var gz = Math.floor(j / gridSize) / gridSize - 0.5;
      var tx = gx * spread * 2;
      var tz = gz * spread * 2;

      // Stack waves based on wave count
      var ty = 0;
      for (var w = 1; w <= wvCount; w++) {
        var wf = w * 0.7;
        var wa = 1.0 / w;
        ty = ty + Math.sin(tx * freq * wf + t * (0.3 + w * 0.15)) * wa * 0.5;
        ty = ty + Math.cos(tz * freq * wf * 1.3 - t * (0.2 + w * 0.1)) * wa * 0.4;
      }
      ty = ty * wh;

      target.set(tx, ty, tz);

      var norm = (ty / (wh + 0.01) + 1) * 0.5;
      norm = norm > 1 ? 1 : norm < 0 ? 0 : norm;

      // PALETTES
      var h = 0; var s = 0; var l = 0;
      if (palIdx <= 0) {
        // 0: Deep Ocean — dark navy → cyan → white crests
        h = 0.55 + norm * 0.12;
        s = 0.4 + norm * 0.35;
        l = 0.08 + norm * 0.3;
      } else if (palIdx <= 1) {
        // 1: Magma — black → deep red → orange → yellow peaks
        h = 0.0 + norm * 0.08;
        s = 0.9;
        l = 0.03 + norm * norm * 0.55;
      } else if (palIdx <= 2) {
        // 2: Rainbow — full spectrum mapped to height
        h = norm * 0.85;
        s = 0.8;
        l = 0.15 + norm * 0.4;
      } else if (palIdx <= 3) {
        // 3: Noir — monochrome with subtle blue
        h = 0.6;
        s = 0.08 + norm * 0.08;
        l = 0.03 + norm * 0.45;
      } else {
        // 4: PRTCL — magenta (#FF2BD6) troughs → lime (#7CFF00) peaks
        // magenta hue ~0.89, lime hue ~0.25
        h = 0.89 + norm * 0.36;
        h = h - Math.floor(h);
        s = 0.85 + norm * 0.1;
        l = 0.12 + norm * 0.4;
      }
      color.setHSL(h - Math.floor(h), s > 1 ? 1 : s, l > 1 ? 1 : l);
    } else {
      // Each agent has a deterministic seed
      var seed = i * 1.6180339887;
      var h1 = Math.sin(seed * 127.1) * 43758.5453; h1 = h1 - Math.floor(h1);
      var h2 = Math.sin(seed * 269.5) * 43758.5453; h2 = h2 - Math.floor(h2);
      var h3 = Math.sin(seed * 419.2) * 43758.5453; h3 = h3 - Math.floor(h3);

      // Lifecycle: fall → slide on waves → respawn
      var cycleDur = 5 + h3 * 8;
      var phase = ((time * aAs * 0.25 + h1 * cycleDur) % cycleDur) / cycleDur;

      // Start position for this cycle
      var startX = (h1 - 0.5) * spread * 1.8;
      var startZ = (h2 - 0.5) * spread * 1.8;

      // Compute wave slope at current position → agents slide downhill
      var eps = 0.1;
      var cx = startX;
      var cz = startZ;

      // Accumulate downhill drift over the cycle (simulate sliding)
      var driftTime = phase * cycleDur;
      // Approximate integrated drift: agents slide in the direction
      // of the wave's propagation, accelerating over time
      var slideFactor = driftTime * driftTime * aAs * 0.01;
      // Wave propagation direction varies per agent
      var waveDir = h1 * 6.28;
      cx = cx + Math.cos(waveDir) * slideFactor;
      cz = cz + Math.sin(waveDir) * slideFactor;

      // Wrap
      cx = cx - Math.floor(cx / (spread * 2) + 0.5) * spread * 2;
      cz = cz - Math.floor(cz / (spread * 2) + 0.5) * spread * 2;

      // Surface height at agent XZ
      var surfY = 0;
      for (var w2 = 1; w2 <= wvCount; w2++) {
        var wf2 = w2 * 0.7;
        var wa2 = 1.0 / w2;
        surfY = surfY + Math.sin(cx * freq * wf2 + t * (0.3 + w2 * 0.15)) * wa2 * 0.5;
        surfY = surfY + Math.cos(cz * freq * wf2 * 1.3 - t * (0.2 + w2 * 0.1)) * wa2 * 0.4;
      }
      surfY = surfY * wh;

      // Wave slope → tilt = how steep the wave is here
      var surfDx = 0;
      for (var w3 = 1; w3 <= wvCount; w3++) {
        var wf3 = w3 * 0.7;
        var wa3 = 1.0 / w3;
        surfDx = surfDx + Math.cos(cx * freq * wf3 + t * (0.3 + w3 * 0.15)) * freq * wf3 * wa3 * 0.5;
      }
      // Steeper slope → agent bounces higher above surface (like cresting a wave)
      var bounce = Math.abs(surfDx) * 0.3;

      var ay;
      if (phase < 0.1) {
        // Falling from sky
        var fallP = phase / 0.1;
        ay = (1 - fallP * fallP) * (wh * 4 + h3 * 2) + fallP * fallP * (surfY + bounce);
      } else {
        // Riding — NOT glued: offset above surface, more on peaks, less in troughs
        ay = surfY + bounce + 0.05;
      }

      target.set(cx, ay, cz);

      var pulse = Math.sin(time * 3 + i * 2.1);
      pulse = pulse > 0.7 ? 1.0 : 0.3;
      // Agent color matches palette but brighter
      var ah = 0;
      if (palIdx <= 0) ah = 0.08;
      else if (palIdx <= 1) ah = 0.08;
      else if (palIdx <= 2) ah = 0.3;
      else if (palIdx <= 3) ah = 0.6;
      else ah = 0.9;
      ah = ah + Math.sin(time * 0.5 + i) * 0.06;
      ah = ah - Math.floor(ah);
      color.setHSL(ah, 1.0, pulse * 0.7 + (beat || 0) * 0.3);
    }

    if (i === 0) {
      setInfo('Axiom', 'Agents searching a living optimization landscape.');
    }
  `,
}
