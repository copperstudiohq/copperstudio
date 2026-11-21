import * as T from './vendor/three.module.js';

const fissures = `
  uniform sampler2D fieldSoil;
  varying vec2 vDecayUv;

  vec2 decayHash(vec2 cell) {
    return fract(sin(vec2(dot(cell, vec2(117.7, 247.1)), dot(cell, vec2(261.3, 119.9)))) * 43758.5453);
  }

  float decayFissure(vec2 uv) {
    vec2 p = uv + .22 * sin(vec2(uv.y * 3.8, uv.x * 4.2));
    vec2 cell = floor(p);
    vec2 local = fract(p);
    float first = 4.0;
    float second = 4.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 mark = neighbor + .14 + .72 * decayHash(cell + neighbor) - local;
        float d = dot(mark, mark);
        second = min(second, max(first, d));
        first = min(first, d);
      }
    }
    return .60 * (second - first);
  }
`;

export function corruptedHide(earth, vertexColors = false) {
  const material = new T.MeshStandardMaterial({
    color: '#432818', roughness: .97, side: T.DoubleSide, vertexColors,
  });
  material.name = 'Cracked umber hide';
  if (!earth) return material;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.fieldSoil = { value: earth };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vDecayUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvDecayUv = uv;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + fissures)
      .replace('#include <map_fragment>', `
        #include <map_fragment>
        vec2 hideUv = vDecayUv * vec2(1.17, 1.08) + vec2(.11, .23);
        vec3 soil = texture2D(fieldSoil, fract(hideUv)).rgb;
        float crack = decayFissure(vDecayUv * vec2(7.9, 4.8) + vec2(2.12, 3.17));
        float groove = 1.0 - smoothstep(.026, .067, crack);
        float lip = (1.0 - smoothstep(.069, .102, crack)) * smoothstep(.031, .062, crack);
        vec3 hideColor = soil * vec3(.75, .57, .42) + vec3(.014, .0052, .0021);
        hideColor += lip * vec3(.033, .012, .004);
        diffuseColor.rgb = mix(hideColor, vec3(.007, .0026, .0013), groove * .91);
      `);
  };
  return material;
}
