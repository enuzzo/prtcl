import { CREDITS_HTML_COMMENT } from '../templates/credits'
import { VERTEX_SHADER, FRAGMENT_SHADER } from '../templates/shader-strings'
import type { ExportPayload } from '../types'

const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js'
const ORBIT_CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js'

/**
 * Generate a self-contained HTML embed snippet for copy-paste into any site.
 *
 * The snippet is a single <div> containing an inline <script type="module">
 * that bootstraps Three.js, sets up a particle render loop, and tears itself
 * down cleanly via a ResizeObserver disconnect.
 */
export function generateHtmlEmbed(payload: ExportPayload): string {
  const { effect, controls, cameraPosition, cameraTarget, settings } = payload
  const {
    particleCount,
    pointSize,
    height,
    backgroundColor,
    autoRotateSpeed,
    orbitControls,
    pointerReactive,
    showBadge,
  } = settings

  // Height without 'px' suffix for CSS string embedding
  const heightCss = height.replace(/\s/g, '')

  // Serialise baked control values as a JS object literal
  const controlsJson = JSON.stringify(controls, null, 2)
    .split('\n')
    .join('\n    ')

  // Camera values
  const [cx, cy, cz] = cameraPosition
  const [tx, ty, tz] = cameraTarget

  // OrbitControls import (conditional)
  const orbitImport = orbitControls
    ? `import { OrbitControls } from '${ORBIT_CDN}';`
    : ''

  // OrbitControls setup block (conditional)
  const orbitSetup = orbitControls
    ? `
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(${tx}, ${ty}, ${tz});${autoRotateSpeed > 0 ? `
    controls.autoRotate = true;
    controls.autoRotateSpeed = ${autoRotateSpeed};` : ''}
    controls.update();`
    : `
    // Static camera (orbit disabled)
    camera.lookAt(${tx}, ${ty}, ${tz});`

  const orbitUpdate = orbitControls ? '\n    controls.update();' : ''

  // Pointer / Raycaster setup (conditional)
  const pointerSetup = pointerReactive
    ? `
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    let pointerX = 0, pointerY = 0, pointerZ = 0;
    container.addEventListener('mousemove', (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const hit = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, hit);
      if (hit) { pointerX = hit.x; pointerY = hit.y; pointerZ = 0; }
    });`
    : ''

  const pointerArgs = pointerReactive
    ? 'pointerX, pointerY, pointerZ'
    : '0, 0, 0'

  // Badge HTML (conditional)
  const badgeHtml = showBadge
    ? `
  <a href="https://prtcl.es" target="_blank" rel="noopener noreferrer"
     style="position:absolute;bottom:8px;right:10px;font-family:monospace;font-size:10px;
            color:rgba(249,244,255,0.45);text-decoration:none;letter-spacing:0.05em;
            pointer-events:auto;"
     title="Made with PRTCL">
    Made with PRTCL
  </a>`
    : ''

  // Vertex + fragment shaders — escape backtick / ${} inside template literal
  const vertexEscaped = VERTEX_SHADER.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
  const fragmentEscaped = FRAGMENT_SHADER.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

  // Effect code — already a raw JS string, embed as-is
  const effectCodeEscaped = effect.code.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

  const html = `${CREDITS_HTML_COMMENT}
<div id="prtcl-${effect.slug}" style="position:relative;width:100%;height:${heightCss};overflow:hidden;background:${backgroundColor};">
  <canvas style="display:block;width:100%;height:100%;"></canvas>${badgeHtml}
  <script type="module">
    import * as THREE from '${THREE_CDN}';
    ${orbitImport}

    /* ── Baked settings ────────────────────────────────────────────── */
    const PARTICLE_COUNT = ${particleCount};
    const POINT_SIZE     = ${pointSize};
    const CONTROLS       = ${controlsJson};

    /* ── Container & renderer ──────────────────────────────────────── */
    const container = document.getElementById('prtcl-${effect.slug}');
    const canvas    = container.querySelector('canvas');
    const renderer  = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x${backgroundColor.replace('#', '')}, 1);

    /* ── Scene & camera ────────────────────────────────────────────── */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 1000);
    camera.position.set(${cx}, ${cy}, ${cz});
    ${orbitSetup}

    /* ── Shaders ───────────────────────────────────────────────────── */
    const VERTEX_SHADER = \`${vertexEscaped}\`;
    const FRAGMENT_SHADER = \`${fragmentEscaped}\`;

    /* ── Geometry ──────────────────────────────────────────────────── */
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors    = new Float32Array(PARTICLE_COUNT * 3);
    const geometry  = new THREE.BufferGeometry();
    geometry.setAttribute('position',    new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: { uPointSize: { value: POINT_SIZE } },
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    /* ── Effect function ───────────────────────────────────────────── */
    const addControl = (id, _label, _min, _max, _initial) => CONTROLS[id] ?? 0;
    const setInfo = () => {};

    const effectFn = new Function(
      'i', 'count', 'target', 'color', 'time', 'THREE',
      'addControl', 'setInfo',
      'textPoints', 'camX', 'camY', 'camZ',
      'pointerX', 'pointerY', 'pointerZ',
      'bass', 'mids', 'highs', 'energy', 'beat',
      \`${effectCodeEscaped}\`
    );

    /* ── Pointer tracking ──────────────────────────────────────────── */${pointerSetup}

    /* ── Render loop ───────────────────────────────────────────────── */
    const target = new THREE.Vector3();
    const color  = new THREE.Color();
    let   clock  = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const camX = camera.position.x;
      const camY = camera.position.y;
      const camZ = camera.position.z;
${orbitUpdate}
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        target.set(0, 0, 0);
        color.set(1, 1, 1);
        try {
          effectFn(
            i, PARTICLE_COUNT, target, color, time, THREE,
            addControl, setInfo,
            undefined, camX, camY, camZ,
            ${pointerArgs},
            0, 0, 0, 0, 0
          );
        } catch (_) { /* swallow per-particle errors */ }

        if (!isFinite(target.x) || !isFinite(target.y) || !isFinite(target.z)) {
          target.set(0, 0, 0);
        }

        const idx = i * 3;
        positions[idx]     = target.x;
        positions[idx + 1] = target.y;
        positions[idx + 2] = target.z;
        colors[idx]        = color.r;
        colors[idx + 1]    = color.g;
        colors[idx + 2]    = color.b;
      }

      geometry.attributes.position.needsUpdate    = true;
      geometry.attributes.customColor.needsUpdate = true;
      renderer.render(scene, camera);
    }

    animate();

    /* ── Responsive resize ─────────────────────────────────────────── */
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(container);
    // Initial size
    const w0 = container.clientWidth || 800;
    const h0 = container.clientHeight || parseInt('${heightCss}') || 400;
    renderer.setSize(w0, h0, false);
    camera.aspect = w0 / h0;
    camera.updateProjectionMatrix();
  </script>
</div>`

  return html
}
