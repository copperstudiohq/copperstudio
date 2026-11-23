const applied = new WeakSet();
const clamp = value => Math.max(0, Math.min(1, value));
const fract = value => value - Math.floor(value);
function smooth(a, b, value) { const t = clamp((value - a) / (b - a)); return t * t * (3 - 2 * t); }

export const MOSS_FUZZ_ATTRIBUTES = Object.freeze({ part: 'mossPart', uv: 'mossFiberUV', seed: 'mossFiberSeed' });

/** Reference coverage of one crossed frond, independent of its base texture.
 * The whole solid core remains opaque and receives the full-surface moss maps.
 */
export function sampleMossFuzz(u, v, seed = 0, footprint = .001) {
  if (![u, v, seed, footprint].every(Number.isFinite)) return 0;
  const s = fract(seed), pixel = Math.max(0, footprint), aa = Math.max(.001, Math.min(.06, pixel * .6));
  const center = .5 + Math.sin(v * 4.8 + s * 6.283185) * (.018 + v * .021);
  const cross = u - center, reach = Math.max(.035, (.43 - v * .25) * (.9 + s * .2));
  const radial = Math.abs(cross) / reach, rows = 6 + s * 3;
  const phase = Math.abs(fract(v * rows - radial * .60 + s * .72 + Math.sign(cross) * .13) - .5);
  const width = Math.max(0, .14 * (1 - radial)), phaseAA = Math.min(.25, aa * (rows + .60 / reach));
  const leaf = (1 - smooth(width - phaseAA, width + phaseAA, phase)) * (1 - smooth(1 - aa / reach, 1 + aa / reach, radial));
  const stemWidth = .014 - clamp(v) * .008;
  const stem = 1 - smooth(stemWidth - aa, stemWidth + aa, Math.abs(cross));
  return clamp(Math.max(stem, leaf) * smooth(-aa, aa, v) * (1 - smooth(1 - aa, 1 + aa, v))
    * (1 - smooth(.035, .12, pixel)));
}

const FRAGMENT = `
varying float vMossFuzzPart,vMossFuzzSeed;
varying vec2 vMossFuzzUV;
float mossFrondCoverage(vec2 uv,float seed,float pixel){
  float s=fract(seed),aa=max(.001,min(.06,pixel*.6));
  float center=.5+sin(uv.y*4.8+s*6.283185)*(.018+uv.y*.021);
  float across=uv.x-center,reach=max(.035,(.43-uv.y*.25)*(.9+s*.2));
  float radial=abs(across)/reach,rows=6.+s*3.;
  float phase=abs(fract(uv.y*rows-radial*.60+s*.72+sign(across)*.13)-.5);
  float width=max(0.,.14*(1.-radial)),phaseAA=min(.25,aa*(rows+.60/reach));
  float leaf=(1.-smoothstep(width-phaseAA,width+phaseAA,phase))
    *(1.-smoothstep(1.-aa/reach,1.+aa/reach,radial));
  float stemWidth=.014-clamp(uv.y,0.,1.)*.008;
  float stem=1.-smoothstep(stemWidth-aa,stemWidth+aa,abs(across));
  return clamp(max(stem,leaf)*smoothstep(-aa,aa,uv.y)
    *(1.-smoothstep(1.-aa,1.+aa,uv.y))*(1.-smoothstep(.035,.12,pixel)),0.,1.);
}
// Fixed ordered coverage; no temporal noise, texture or additional blending.
float mossCoverageThreshold(vec2 pixel){
  vec2 p=mod(floor(pixel),4.);
  float fine=mod(2.*mod(p.x,2.)+3.*mod(p.y,2.),4.);
  vec2 coarse=floor(p*.5);
  float broad=mod(2.*coarse.x+3.*coarse.y,4.);
  return(fine*4.+broad+.5)/16.;
}
`;

/** Clip supporting crossed fronds only, after every surface derivative and PBR
 * hook has run. The ordinary opaque core is untouched. Early alphaTest/hash
 * are disabled deliberately; the scene has no MSAA or transparency pass.
 * @param {import('./vendor/three.module.js').MeshStandardMaterial} material
 */
export function applyMossFuzz(material) {
  if (!material?.isMeshStandardMaterial || applied.has(material)) return material;
  const previous = material.onBeforeCompile.bind(material), previousKey = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    shader.vertexShader = `attribute float mossPart,mossFiberSeed;attribute vec2 mossFiberUV;
      varying float vMossFuzzPart,vMossFuzzSeed;varying vec2 vMossFuzzUV;\n${shader.vertexShader}`
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vMossFuzzPart=mossPart;vMossFuzzSeed=mossFiberSeed;vMossFuzzUV=mossFiberUV;`);
    shader.fragmentShader = `${FRAGMENT}\n${shader.fragmentShader}`
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        float mossFuzzPixel=max(length(dFdx(vMossFuzzUV)),length(dFdy(vMossFuzzUV)));
        float mossFrond=mossFrondCoverage(vMossFuzzUV,vMossFuzzSeed,mossFuzzPixel);
        float mossCoverage=mix(1.,mossFrond,step(.5,vMossFuzzPart));
        vec2 mossOrderedPixel=gl_FragCoord.xy+floor(vec2(vMossFuzzSeed*13.,vMossFuzzSeed*17.));
        if(mossCoverage<mossCoverageThreshold(mossOrderedPixel))discard;`);
  };
  material.customProgramCacheKey = () => `${previousKey}|croba-moss-frond-cutout-v1`;
  material.transparent = false; material.depthWrite = true; material.forceSinglePass = true;
  material.alphaTest = 0; material.alphaHash = false; material.alphaToCoverage = false;
  material.userData.mossFuzz = true;
  material.needsUpdate = true; applied.add(material);
  return material;
}
