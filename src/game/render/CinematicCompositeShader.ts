import * as THREE from 'three';

/**
 * Restrained final-camera treatment. It operates in linear-sRGB before the
 * OutputPass performs tone mapping and display conversion.
 */
export const CinematicCompositeShader = {
  name: 'VesperaCinematicComposite',
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    resolution: { value: new THREE.Vector2(1, 1) },
    time: { value: 0 },
    grainAmount: { value: 0.018 },
    vignetteStrength: { value: 0.34 },
    sharpenStrength: { value: 0.2 },
    chromaAmount: { value: 0.0007 },
    shadowTint: { value: new THREE.Color(0.89, 0.94, 1.08) },
    highlightTint: { value: new THREE.Color(1.07, 0.96, 0.88) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;

    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float time;
    uniform float grainAmount;
    uniform float vignetteStrength;
    uniform float sharpenStrength;
    uniform float chromaAmount;
    uniform vec3 shadowTint;
    uniform vec3 highlightTint;
    varying vec2 vUv;

    float motvLuminance(vec3 color) {
      return dot(color, vec3(0.2126, 0.7152, 0.0722));
    }

    float hash12(vec2 point) {
      vec3 p3 = fract(vec3(point.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec2 centerVector = vUv - 0.5;
      float edge = dot(centerVector, centerVector);
      vec2 chromaOffset = centerVector * edge * chromaAmount;

      vec3 base = texture2D(tDiffuse, vUv).rgb;
      base.r = texture2D(tDiffuse, vUv + chromaOffset).r;
      base.b = texture2D(tDiffuse, vUv - chromaOffset).b;

      vec2 texel = 1.0 / max(resolution, vec2(1.0));
      vec3 neighbourhood =
        texture2D(tDiffuse, vUv + vec2(texel.x, 0.0)).rgb +
        texture2D(tDiffuse, vUv - vec2(texel.x, 0.0)).rgb +
        texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).rgb +
        texture2D(tDiffuse, vUv - vec2(0.0, texel.y)).rgb;
      base += (base * 4.0 - neighbourhood) * (sharpenStrength * 0.25);

      float luma = motvLuminance(max(base, vec3(0.0)));
      vec3 tint = mix(shadowTint, highlightTint, smoothstep(0.08, 1.35, luma));
      base *= tint;

      float vignette = smoothstep(0.76, 0.13, edge);
      base *= mix(1.0 - vignetteStrength, 1.0, vignette);

      float noiseA = hash12(gl_FragCoord.xy + vec2(time * 71.0, time * 29.0));
      float noiseB = hash12(gl_FragCoord.yx + vec2(time * 43.0, time * 97.0));
      float triangularNoise = noiseA + noiseB - 1.0;
      base += triangularNoise * grainAmount * (0.45 + 0.55 * smoothstep(0.0, 0.45, luma));

      gl_FragColor = vec4(max(base, vec3(0.0)), 1.0);
    }
  `,
};
