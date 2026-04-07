import { useEffect, useMemo, useRef, useState } from 'react'
import { setCameraSnapshotProvider } from './camera-bridge'
import { resetHandCamera } from '../tracking/hand-camera'
import { useStore } from '../store'
import { DEFAULT_FLOW_SETTINGS, FLOW_QUALITY_LEVELS, hexToRgbArray } from './flow/config'
import flowCssRaw from '../../incoming/effects/archive/flow-master/flow.css?raw'
import sharedJsRaw from '../../incoming/effects/archive/flow-master/shared.js?raw'
import flowJsRaw from '../../incoming/effects/archive/flow-master/flow.js?raw'

function escapeInlineScript(source: string): string {
  return source.replace(/<\/script/gi, '<\\/script')
}

function buildFlowOverridesScript(): string {
  const qualityLevels = FLOW_QUALITY_LEVELS.map((level) => ({
    resolution: level.resolution,
    diameter: level.diameter,
    alpha: level.alpha,
  }))

  return `
    QUALITY_LEVELS = ${JSON.stringify(qualityLevels)};

    RENDERING_VERTEX_SHADER_SOURCE = [
      'precision highp float;',
      'attribute vec2 a_textureCoordinates;',
      'varying vec3 v_position;',
      'varying float v_opacity;',
      'uniform sampler2D u_particleTexture;',
      'uniform sampler2D u_opacityTexture;',
      'uniform mat4 u_viewMatrix;',
      'uniform mat4 u_projectionMatrix;',
      'uniform mat4 u_lightViewProjectionMatrix;',
      'uniform float u_particleDiameter;',
      'uniform float u_screenWidth;',
      'uniform vec3 u_displayScale;',
      'void main () {',
      '    vec3 position = texture2D(u_particleTexture, a_textureCoordinates).rgb * u_displayScale;',
      '    v_position = position;',
      '    vec2 lightTextureCoordinates = vec2(u_lightViewProjectionMatrix * vec4(position, 1.0)) * 0.5 + 0.5;',
      '    v_opacity = texture2D(u_opacityTexture, lightTextureCoordinates).a;',
      '    vec3 viewSpacePosition = vec3(u_viewMatrix * vec4(position, 1.0));',
      '    vec4 corner = vec4(u_particleDiameter * 0.5, u_particleDiameter * 0.5, viewSpacePosition.z, 1.0);',
      '    float projectedCornerX = dot(vec4(u_projectionMatrix[0][0], u_projectionMatrix[1][0], u_projectionMatrix[2][0], u_projectionMatrix[3][0]), corner);',
      '    float projectedCornerW = dot(vec4(u_projectionMatrix[0][3], u_projectionMatrix[1][3], u_projectionMatrix[2][3], u_projectionMatrix[3][3]), corner);',
      '    gl_PointSize = u_screenWidth * 0.5 * projectedCornerX * 2.0 / projectedCornerW;',
      '    gl_Position = u_projectionMatrix * vec4(viewSpacePosition, 1.0);',
      '    if (position.y < ' + FLOOR_ORIGIN[1].toFixed(8) + ') gl_Position = vec4(9999999.0, 9999999.0, 9999999.0, 1.0);',
      '}'
    ].join('\\n');

    OPACITY_VERTEX_SHADER_SOURCE = [
      'precision highp float;',
      'attribute vec2 a_textureCoordinates;',
      'uniform sampler2D u_particleTexture;',
      'uniform mat4 u_lightViewMatrix;',
      'uniform mat4 u_lightProjectionMatrix;',
      'uniform float u_particleDiameter;',
      'uniform float u_screenWidth;',
      'uniform vec3 u_displayScale;',
      'void main () {',
      '    vec3 position = texture2D(u_particleTexture, a_textureCoordinates).rgb * u_displayScale;',
      '    vec3 viewSpacePosition = vec3(u_lightViewMatrix * vec4(position, 1.0));',
      '    vec4 corner = vec4(u_particleDiameter * 0.5, u_particleDiameter * 0.5, viewSpacePosition.z, 1.0);',
      '    float projectedCornerX = dot(vec4(u_lightProjectionMatrix[0][0], u_lightProjectionMatrix[1][0], u_lightProjectionMatrix[2][0], u_lightProjectionMatrix[3][0]), corner);',
      '    float projectedCornerW = dot(vec4(u_lightProjectionMatrix[0][3], u_lightProjectionMatrix[1][3], u_lightProjectionMatrix[2][3], u_lightProjectionMatrix[3][3]), corner);',
      '    gl_PointSize = u_screenWidth * 0.5 * projectedCornerX * 2.0 / projectedCornerW;',
      '    gl_Position = u_lightProjectionMatrix * vec4(viewSpacePosition, 1.0);',
      '}'
    ].join('\\n');

    SORT_FRAGMENT_SHADER_SOURCE = [
      'precision highp float;',
      'uniform sampler2D u_dataTexture;',
      'uniform vec2 u_resolution;',
      'uniform float pass;',
      'uniform float stage;',
      'uniform vec3 u_cameraPosition;',
      'uniform vec3 u_halfVector;',
      'uniform vec3 u_displayScale;',
      'void main () {',
      '    vec2 normalizedCoordinates = gl_FragCoord.xy / u_resolution;',
      '    vec4 self = texture2D(u_dataTexture, normalizedCoordinates);',
      '    float i = floor(normalizedCoordinates.x * u_resolution.x) + floor(normalizedCoordinates.y * u_resolution.y) * u_resolution.x;',
      '    float j = floor(mod(i, 2.0 * stage));',
      '    float compare = 0.0;',
      '    if ((j < mod(pass, stage)) || (j > (2.0 * stage - mod(pass, stage) - 1.0))) {',
      '        compare = 0.0;',
      '    } else {',
      '        if (mod((j + mod(pass, stage)) / pass, 2.0) < 1.0) {',
      '            compare = 1.0;',
      '        } else {',
      '            compare = -1.0;',
      '        }',
      '    }',
      '    float adr = i + compare * pass;',
      '    vec4 partner = texture2D(u_dataTexture, vec2(floor(mod(adr, u_resolution.x)) / u_resolution.x, floor(adr / u_resolution.x) / u_resolution.y));',
      '    float selfProjectedLength = dot(u_halfVector, self.xyz * u_displayScale);',
      '    float partnerProjectedLength = dot(u_halfVector, partner.xyz * u_displayScale);',
      '    gl_FragColor = (selfProjectedLength * compare < partnerProjectedLength * compare) ? self : partner;',
      '}'
    ].join('\\n');

    FLOOR_FRAGMENT_SHADER_SOURCE = [
      'precision highp float;',
      'varying vec3 v_position;',
      'uniform sampler2D u_opacityTexture;',
      'uniform vec3 u_shadowColor;',
      'uniform mat4 u_lightViewProjectionMatrix;',
      'void main () {',
      '    vec2 lightTextureCoordinates = vec2(u_lightViewProjectionMatrix * vec4(v_position, 1.0)) * 0.5 + 0.5;',
      '    float opacity = texture2D(u_opacityTexture, lightTextureCoordinates).a;',
      '    if (lightTextureCoordinates.x < 0.0 || lightTextureCoordinates.x > 1.0 || lightTextureCoordinates.y < 0.0 || lightTextureCoordinates.y > 1.0) {',
      '        opacity = 0.0;',
      '    }',
      '    float shadowAlpha = opacity * 0.7;',
      '    gl_FragColor = vec4(u_shadowColor * shadowAlpha, shadowAlpha);',
      '}'
    ].join('\\n');

    BACKGROUND_FRAGMENT_SHADER_SOURCE = [
      'precision highp float;',
      'varying vec2 v_position;',
      'uniform vec3 u_backgroundColor;',
      'void main () {',
      '    float dist = length(v_position);',
      '    vec3 color = max(u_backgroundColor - vec3(dist * ' + BACKGROUND_DISTANCE_SCALE.toFixed(8) + '), vec3(0.0));',
      '    gl_FragColor = vec4(color, 1.0);',
      '}'
    ].join('\\n');

    RENDERING_FRAGMENT_SHADER_SOURCE = [
      'precision highp float;',
      'varying vec3 v_position;',
      'varying float v_opacity;',
      'uniform float u_particleAlpha;',
      'uniform float u_sharpness;',
      'uniform vec3 u_particleColor;',
      'uniform bool u_flipped;',
      'void main () {',
      '    float distanceFromCenter = distance(gl_PointCoord.xy, vec2(0.5, 0.5));',
      '    if (distanceFromCenter > 0.5) discard;',
      '    float t = clamp(1.0 - distanceFromCenter * 2.0, 0.0, 1.0);',
      '    float alpha = pow(t, u_sharpness) * u_particleAlpha;',
      '    vec3 color = (1.0 - v_opacity * ' + PARTICLE_OPACITY_SCALE.toFixed(8) + ') * u_particleColor;',
      '    gl_FragColor = vec4(color * alpha, alpha);',
      '}'
    ].join('\\n');

    OPACITY_FRAGMENT_SHADER_SOURCE = [
      'precision highp float;',
      'uniform float u_particleAlpha;',
      'uniform float u_sharpness;',
      'void main () {',
      '    float distanceFromCenter = distance(gl_PointCoord.xy, vec2(0.5, 0.5));',
      '    if (distanceFromCenter > 0.5) discard;',
      '    float t = clamp(1.0 - distanceFromCenter * 2.0, 0.0, 1.0);',
      '    float alpha = pow(t, u_sharpness) * u_particleAlpha;',
      '    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);',
      '}'
    ].join('\\n');
  `
}

function patchCameraControls(source: string): string {
  // Add autoRotateSpeed + zoom to Camera
  return source
    .replace(
      'var mouseDown = false;',
      `var mouseDown = false;
    var autoRotateSpeed = 0;
    var zoomFactor = 1.0;

    this.setAutoRotateSpeed = function (speed) {
        autoRotateSpeed = speed;
    };

    this.setZoom = function (z) {
        zoomFactor = Math.max(0.3, Math.min(3.0, z));
        recomputeViewMatrix();
    };

    this.update = function (dt) {
        if (autoRotateSpeed !== 0 && !mouseDown) {
            azimuth += autoRotateSpeed * 0.3 * dt;
            recomputeViewMatrix();
        }
    };`,
    )
    // Replace CAMERA_DISTANCE with dynamic distance in getPosition
    .replace(
      'cameraPosition[0] = CAMERA_DISTANCE * Math.sin(Math.PI / 2 - elevation) * Math.sin(-azimuth) + CAMERA_ORBIT_POINT[0];',
      'cameraPosition[0] = (CAMERA_DISTANCE / zoomFactor) * Math.sin(Math.PI / 2 - elevation) * Math.sin(-azimuth) + CAMERA_ORBIT_POINT[0];',
    )
    .replace(
      'cameraPosition[1] = CAMERA_DISTANCE * Math.cos(Math.PI / 2 - elevation) + CAMERA_ORBIT_POINT[1];',
      'cameraPosition[1] = (CAMERA_DISTANCE / zoomFactor) * Math.cos(Math.PI / 2 - elevation) + CAMERA_ORBIT_POINT[1];',
    )
    .replace(
      'cameraPosition[2] = CAMERA_DISTANCE * Math.sin(Math.PI / 2 - elevation) * Math.cos(-azimuth) + CAMERA_ORBIT_POINT[2];',
      'cameraPosition[2] = (CAMERA_DISTANCE / zoomFactor) * Math.sin(Math.PI / 2 - elevation) * Math.cos(-azimuth) + CAMERA_ORBIT_POINT[2];',
    )
    // Replace CAMERA_DISTANCE in view matrix with dynamic distance
    .replace(
      'distanceTranslationMatrix[14] = -CAMERA_DISTANCE;',
      'distanceTranslationMatrix[14] = -(CAMERA_DISTANCE / zoomFactor);',
    )
}

function patchFlowSource(source: string): string {
  return patchCameraControls(source)
    // Add camera.update(deltaTime) call in the render loop
    .replace(
      'if (deltaTime > MAX_DELTA_TIME) {\n            deltaTime = 0;\n        }',
      `if (deltaTime > MAX_DELTA_TIME) {
            deltaTime = 0;
        }

        camera.update(deltaTime);`,
    )
    .replace(
      /var options = \{[\s\S]*?alpha: true[\s\S]*?\};/,
      `var options = {
        premultipliedAlpha: false,
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance',
        desynchronized: true
    };`,
    )
    .replace(
      /var hue = 0;\n\s*var timeScale = INITIAL_SPEED;\n\s*var persistence = INITIAL_TURBULENCE;\n\n\s*this\.setHue = function \(newHue\) \{\n\s*hue = newHue;\n\s*\};\n\n\s*this\.setTimeScale = function \(newTimeScale\) \{\n\s*timeScale = newTimeScale;\n\s*\};\n\n\s*this\.setPersistence = function \(newPersistence\) \{\n\s*persistence = newPersistence;\n\s*\};/,
      `var particleColor = [1.0, 0.25, 0.25];
    var shadowColor = [0.0, 0.0, 0.0];
    var backgroundColor = [1.0, 1.0, 1.0];
    var particleSizeScale = 1.0;
    var plumeSpread = 1.0;
    var sharpness = 2.0;
    var timeScale = INITIAL_SPEED;
    var persistence = INITIAL_TURBULENCE;

    this.setColors = function (newParticleColor, newShadowColor, newBackgroundColor) {
        particleColor = newParticleColor;
        shadowColor = newShadowColor;
        backgroundColor = newBackgroundColor;
    };

    this.setParticleSize = function (newParticleSize) {
        particleSizeScale = newParticleSize;
    };

    this.setPlumeSpread = function (newPlumeSpread) {
        plumeSpread = newPlumeSpread;
    };

    this.setTimeScale = function (newTimeScale) {
        timeScale = newTimeScale;
    };

    this.setPersistence = function (newPersistence) {
        persistence = newPersistence;
    };

    this.setAutoRotateSpeed = function (speed) {
        camera.setAutoRotateSpeed(speed);
    };

    this.setZoom = function (z) {
        camera.setZoom(z);
    };

    this.setSharpness = function (s) {
        sharpness = Math.max(0.5, Math.min(5.0, s));
    };`,
    )
    .replace(
      '    this.changeQualityLevel = function (newLevel) {\n        qualityLevel = newLevel;',
      '    this.changeQualityLevel = function (newLevel) {\n        if (newLevel === qualityLevel) return;\n        qualityLevel = newLevel;',
    )
    .replace(
      /var onresize = function \(\) \{[\s\S]*?canvas\.height = window\.innerHeight;\n    \};/,
      `var onresize = function () {
        var cssWidth = Math.max(1, window.innerWidth);
        var cssHeight = Math.max(1, window.innerHeight);
        var pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        var aspectRatio = cssWidth / cssHeight;
        makePerspectiveMatrix(projectionMatrix, PROJECTION_FOV, aspectRatio, PROJECTION_NEAR, PROJECTION_FAR);
        canvas.style.width = cssWidth + 'px';
        canvas.style.height = cssHeight + 'px';
        canvas.width = Math.max(1, Math.floor(cssWidth * pixelRatio));
        canvas.height = Math.max(1, Math.floor(cssHeight * pixelRatio));
    };`,
    )
    .replace(
      /            var colorRGB = hsvToRGB\(hue, PARTICLE_SATURATION, PARTICLE_VALUE\);\n            gl\.uniform3f\(renderingProgramWrapper\.uniformLocations\['u_particleColor'\], colorRGB\[0\], colorRGB\[1\], colorRGB\[2\]\);/,
      "            gl.uniform3f(renderingProgramWrapper.uniformLocations['u_particleColor'], particleColor[0], particleColor[1], particleColor[2]);",
    )
    .replace(
      "            gl.uniform1f(renderingProgramWrapper.uniformLocations['u_particleDiameter'], particleDiameter);",
      "            gl.uniform1f(renderingProgramWrapper.uniformLocations['u_particleDiameter'], particleDiameter * particleSizeScale);",
    )
    .replace(
      "            gl.uniform1f(renderingProgramWrapper.uniformLocations['u_screenWidth'], canvas.width);",
      "            gl.uniform1f(renderingProgramWrapper.uniformLocations['u_screenWidth'], Math.max(1, parseFloat(canvas.style.width) || canvas.width));\n            gl.uniform3f(renderingProgramWrapper.uniformLocations['u_displayScale'], plumeSpread, 1.0, plumeSpread);",
    )
    .replace(
      "            gl.uniform3fv(sortProgramWrapper.uniformLocations['u_halfVector'], halfVector);",
      "            gl.uniform3fv(sortProgramWrapper.uniformLocations['u_halfVector'], halfVector);\n            gl.uniform3f(sortProgramWrapper.uniformLocations['u_displayScale'], plumeSpread, 1.0, plumeSpread);",
    )
    .replace(
      "            gl.uniform1f(opacityProgramWrapper.uniformLocations['u_particleDiameter'], particleDiameter);",
      "            gl.uniform1f(opacityProgramWrapper.uniformLocations['u_particleDiameter'], particleDiameter * particleSizeScale);",
    )
    .replace(
      "            gl.uniform1f(opacityProgramWrapper.uniformLocations['u_screenWidth'], OPACITY_TEXTURE_RESOLUTION);",
      "            gl.uniform1f(opacityProgramWrapper.uniformLocations['u_screenWidth'], OPACITY_TEXTURE_RESOLUTION);\n            gl.uniform3f(opacityProgramWrapper.uniformLocations['u_displayScale'], plumeSpread, 1.0, plumeSpread);",
    )
    .replace(
      "        gl.uniform1i(floorProgramWrapper.uniformLocations['u_opacityTexture'], 0);\n        gl.activeTexture(gl.TEXTURE0);",
      "        gl.uniform1i(floorProgramWrapper.uniformLocations['u_opacityTexture'], 0);\n        gl.uniform3f(floorProgramWrapper.uniformLocations['u_shadowColor'], shadowColor[0], shadowColor[1], shadowColor[2]);\n        gl.activeTexture(gl.TEXTURE0);",
    )
    .replace(
      "        gl.useProgram(backgroundProgramWrapper.program);\n\n        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);",
      "        gl.useProgram(backgroundProgramWrapper.program);\n        gl.uniform3f(backgroundProgramWrapper.uniformLocations['u_backgroundColor'], backgroundColor[0], backgroundColor[1], backgroundColor[2]);\n\n        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);",
    )
    // Set u_sharpness uniform in rendering pass
    .replace(
      "gl.uniform1f(renderingProgramWrapper.uniformLocations['u_particleAlpha'], particleAlpha);",
      "gl.uniform1f(renderingProgramWrapper.uniformLocations['u_particleAlpha'], particleAlpha);\n            gl.uniform1f(renderingProgramWrapper.uniformLocations['u_sharpness'], sharpness);",
    )
    // Set u_sharpness uniform in opacity pass
    .replace(
      "gl.uniform1f(opacityProgramWrapper.uniformLocations['u_particleAlpha'], particleAlpha);",
      "gl.uniform1f(opacityProgramWrapper.uniformLocations['u_particleAlpha'], particleAlpha);\n            gl.uniform1f(opacityProgramWrapper.uniformLocations['u_sharpness'], sharpness);",
    )
}

function buildFlowBootScript(): string {
  const qualityCounts = FLOW_QUALITY_LEVELS.map((level) => level.count)
  return `
    (function () {
      if (hasWebGLSupportWithExtensions(['OES_texture_float'])) {
        var flow = new Flow(document.getElementById('render'));
        window.__prtclFlow = flow;
        var qualityCounts = ${JSON.stringify(qualityCounts)};
        var currentQualityLevel = 0;
        var findQualityLevel = function (count) {
          for (var i = 0; i < qualityCounts.length; i++) {
            if (count <= qualityCounts[i]) return i;
          }
          return qualityCounts.length - 1;
        };

        var applyState = function (state, deferQualityChange) {
          if (!state) return;
          if (typeof state.backgroundCss === 'string') {
            document.documentElement.style.background = state.backgroundCss;
            document.body.style.background = state.backgroundCss;
            document.getElementById('render').style.background = state.backgroundCss;
          }
          if (typeof state.particleCount === 'number') {
            var nextQualityLevel = findQualityLevel(state.particleCount);
            if (nextQualityLevel !== currentQualityLevel) {
              var applyQualityChange = function () {
                flow.changeQualityLevel(nextQualityLevel);
                currentQualityLevel = nextQualityLevel;
              };
              if (deferQualityChange) {
                requestAnimationFrame(applyQualityChange);
              } else {
                applyQualityChange();
              }
            }
          }
          if (typeof state.particleSize === 'number') flow.setParticleSize(state.particleSize);
          if (typeof state.autoRotateSpeed === 'number') flow.setAutoRotateSpeed(state.autoRotateSpeed);
          if (typeof state.zoom === 'number') { flow.setZoom(state.zoom); flow._zoom = state.zoom; }
          if (typeof state.sharpness === 'number') flow.setSharpness(state.sharpness);
          if (typeof state.spread === 'number') flow.setPlumeSpread(state.spread);
          if (typeof state.speed === 'number') flow.setTimeScale(state.speed);
          if (typeof state.turbulence === 'number') flow.setPersistence(state.turbulence);
          if (state.particleColor && state.shadowColor && state.backgroundColor) {
            flow.setColors(state.particleColor, state.shadowColor, state.backgroundColor);
          }
        };

        applyState({
          particleCount: ${DEFAULT_FLOW_SETTINGS.particleCount},
          particleSize: ${DEFAULT_FLOW_SETTINGS.particleSize},
          autoRotateSpeed: ${DEFAULT_FLOW_SETTINGS.autoRotateSpeed},
          zoom: ${DEFAULT_FLOW_SETTINGS.zoom},
          sharpness: ${DEFAULT_FLOW_SETTINGS.sharpness},
          spread: ${DEFAULT_FLOW_SETTINGS.spread},
          speed: ${DEFAULT_FLOW_SETTINGS.speed},
          turbulence: ${DEFAULT_FLOW_SETTINGS.turbulence},
          particleColor: ${JSON.stringify(hexToRgbArray(DEFAULT_FLOW_SETTINGS.color1))},
          shadowColor: ${JSON.stringify(hexToRgbArray(DEFAULT_FLOW_SETTINGS.color2))},
          backgroundColor: ${JSON.stringify(hexToRgbArray(DEFAULT_FLOW_SETTINGS.bgColor))},
          backgroundCss: ${JSON.stringify(DEFAULT_FLOW_SETTINGS.bgColor)}
        }, true);

        document.getElementById('render').addEventListener('wheel', function (event) {
          event.preventDefault();
          var delta = event.deltaY > 0 ? -0.05 : 0.05;
          var currentZoom = flow._zoom || 1;
          var newZoom = Math.max(0.3, Math.min(3, currentZoom + delta));
          flow._zoom = newZoom;
          flow.setZoom(newZoom);
          window.parent.postMessage({ type: 'prtcl:flow:zoom', zoom: newZoom }, '*');
        }, { passive: false });

        window.addEventListener('message', function (event) {
          var data = event && event.data;
          if (!data || data.type !== 'prtcl:flow:set') return;
          applyState(data, false);
        });
      } else {
        document.getElementById('render').style.display = 'none';
        document.getElementById('error').style.display = 'block';
      }
    })();
  `
}

function buildFlowMasterSrcDoc(): string {
  const extraCss = `
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: ${DEFAULT_FLOW_SETTINGS.bgColor};
    }
  `

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Volumetric Particle Flow</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:200,300,400,600,700,900">
    <style>${flowCssRaw}\n${extraCss}</style>
  </head>
  <body>
    <div id="error">This browser can’t run Volumetric Flow.</div>

    <canvas id="render" width="1" height="1" style="background: transparent;"></canvas>

    <script>${escapeInlineScript(sharedJsRaw)}</script>
    <script>${escapeInlineScript(patchFlowSource(flowJsRaw))}</script>
    <script>${escapeInlineScript(buildFlowOverridesScript())}</script>
    <script>${escapeInlineScript(buildFlowBootScript())}</script>
  </body>
</html>`
}

export function FlowMaster() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const postMessageFrameRef = useRef<number | null>(null)
  const latestFlowSettingsRef = useRef(useStore.getState().flowSettings)
  const [loaded, setLoaded] = useState(false)
  const flowSettings = useStore((s) => s.flowSettings)
  const srcDoc = useMemo(() => buildFlowMasterSrcDoc(), [])

  useEffect(() => {
    resetHandCamera()
    setCameraSnapshotProvider(null)

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'prtcl:flow:zoom' && typeof event.data.zoom === 'number') {
        useStore.getState().patchFlowSettings({ zoom: event.data.zoom })
      }
    }
    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
      if (postMessageFrameRef.current != null) {
        cancelAnimationFrame(postMessageFrameRef.current)
        postMessageFrameRef.current = null
      }
      setCameraSnapshotProvider(null)
      resetHandCamera()
    }
  }, [])

  useEffect(() => {
    latestFlowSettingsRef.current = flowSettings
  }, [flowSettings])

  useEffect(() => {
    if (!loaded) return
    if (postMessageFrameRef.current != null) {
      cancelAnimationFrame(postMessageFrameRef.current)
    }
    postMessageFrameRef.current = requestAnimationFrame(() => {
      postMessageFrameRef.current = null
      const frame = iframeRef.current
      if (!frame?.contentWindow) return
      const currentSettings = latestFlowSettingsRef.current
      frame.contentWindow.postMessage({
        type: 'prtcl:flow:set',
        particleCount: currentSettings.particleCount,
        particleSize: currentSettings.particleSize,
        autoRotateSpeed: currentSettings.autoRotateSpeed,
        zoom: currentSettings.zoom,
        sharpness: currentSettings.sharpness,
        spread: currentSettings.spread,
        speed: currentSettings.speed,
        turbulence: currentSettings.turbulence,
        particleColor: hexToRgbArray(currentSettings.color1),
        shadowColor: hexToRgbArray(currentSettings.color2),
        backgroundColor: hexToRgbArray(currentSettings.bgColor),
        backgroundCss: currentSettings.bgColor,
      }, '*')
    })

    return () => {
      if (postMessageFrameRef.current != null) {
        cancelAnimationFrame(postMessageFrameRef.current)
        postMessageFrameRef.current = null
      }
    }
  }, [flowSettings, loaded])

  return (
    <div className="absolute inset-0 z-20" style={{ background: flowSettings.bgColor }}>
      <iframe
        ref={iframeRef}
        title="Volumetric Particle Flow"
        srcDoc={srcDoc}
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 h-full w-full border-0 bg-transparent"
        style={{ background: flowSettings.bgColor }}
      />
    </div>
  )
}
