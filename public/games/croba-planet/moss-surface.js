const applied = new WeakMap();
const clamp = value => Math.max(0, Math.min(1, value));
const fract = value => value - Math.floor(value);
function smooth(a, b, value) { const t = clamp((value - a) / (b - a)); return t * t * (3 - 2 * t); }

/** Millimetre leaf relief fades before it becomes distant sparkling noise. */
export function mossDetailVisibility(footprint) {
  return Number.isFinite(footprint) ? 1 - smooth(.0015, .0055, Math.max(0, footprint)) : 0;
}

/** Numerical reference for the bounded, local-space detail field. It does not
 * move geometry or add colliders; the renderer evaluates this field in GLSL.
 */
export function sampleMossSurface(x, y, z, { footprint = 0, strength = 1, emissionDetail = .35 } = {}) {
  if (![x, y, z, footprint, strength, emissionDetail].every(Number.isFinite)) throw new TypeError('Moss surface coordinates and controls must be finite.');
  const px = (x + y * .49) * 90, pz = (z - y * .37) * 90, cx = Math.floor(px), cz = Math.floor(pz);
  let a = fract(cx * .1031), b = fract(cz * .1030), c = fract(cx * .0973);
  const mix = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
  a += mix; b += mix; c += mix;
  const seed = fract((a + b) * c), u = fract(pz), v = fract(px);
  const along = clamp((u - .10) / .80), envelope = 4 * along * (1 - along);
  const across = v - .5 + (u - .5) * (seed - .5) * .7;
  const blade = (1 - smooth(.82, 1.08, Math.abs(across) / Math.max(.008, envelope * .25)))
    * smooth(.04, .14, u) * (1 - smooth(.86, .96, u));
  const costa = (1 - smooth(.012, .045, Math.abs(across))) * blade;
  const stria = (.5 + .5 * Math.cos(u * 35 + seed * 4)) * blade;
  const rhizoid = (1 - smooth(.02, .055, Math.abs(v - .08 - u * .22 - Math.sin(u * 12 + seed) * .03))) * (1 - blade);
  const amount = clamp(strength), fine = mossDetailVisibility(footprint) * amount;
  const basal = smooth(.005, .075, y), tip = clamp(blade * smooth(.28, .85, u) + costa * .35);
  return { blade, costa, rhizoid,
    height: (blade * .00055 + costa * .00030 + stria * .00008 + rhizoid * .00012) * fine,
    shade: (1 + fine * (blade * .035 + costa * .035 - rhizoid * .08 - (1 - blade) * .035)) * (1 - amount * .10 * (1 - basal)),
    roughnessOffset: (.035 - blade * .09 + rhizoid * .025) * fine,
    emissionMultiplier: (1 - amount * .93 * (1 - basal)) * (1 - clamp(emissionDetail) * fine * (1 - (.16 + tip * .84))),
  };
}

const FIELD_GLSL = `
varying vec3 vMossSurfaceWorld,vMossSurfaceLocal;
uniform float mossSurfaceStrength,mossSurfaceEmissionDetail;
float mossSurfaceSeed(vec2 cell){
  vec3 p=fract(vec3(cell.xyx)*vec3(.1031,.1030,.0973));
  p+=dot(p,p.yzx+33.33);
  return fract((p.x+p.y)*p.z);
}
vec4 mossLeafStructure(vec3 local){
  vec2 p=vec2(local.x+local.y*.49,local.z-local.y*.37)*90.;
  float seed=mossSurfaceSeed(floor(p));vec2 uv=fract(p);
  float along=clamp((uv.y-.10)/.80,0.,1.),envelope=4.*along*(1.-along);
  float across=uv.x-.5+(uv.y-.5)*(seed-.5)*.7;
  float blade=(1.-smoothstep(.82,1.08,abs(across)/max(.008,envelope*.25)))
    *smoothstep(.04,.14,uv.y)*(1.-smoothstep(.86,.96,uv.y));
  float costa=(1.-smoothstep(.012,.045,abs(across)))*blade;
  float stria=(.5+.5*cos(uv.y*35.+seed*4.))*blade;
  float rhizoid=(1.-smoothstep(.02,.055,abs(uv.x-.08-uv.y*.22-sin(uv.y*12.+seed)*.03)))*(1.-blade);
  return vec4(blade,costa,stria,rhizoid);
}
`;

/** Add fine leaf, costa and attachment detail over the existing moss finish.
 * Colors, existing maps, roughness property and emission palette/intensity are
 * retained. All derivative operations execute outside divergent branches.
 * No texture, render pass, material clone or per-frame CPU work is introduced.
 * @param {import('./vendor/three.module.js').MeshStandardMaterial} material
 * @param {{strength?:number,emissionDetail?:number}} [options]
 */
export function applyMossSurface(material, { strength = 1, emissionDetail = .35 } = {}) {
  if (!material?.isMeshStandardMaterial) return material;
  if (!Number.isFinite(strength) || !Number.isFinite(emissionDetail)) throw new TypeError('Moss surface controls must be finite.');
  const existing = applied.get(material);
  if (existing) return material;
  const uniforms = { mossSurfaceStrength: { value: clamp(strength) }, mossSurfaceEmissionDetail: { value: clamp(emissionDetail) } };
  const previous = material.onBeforeCompile.bind(material), previousKey = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `varying vec3 vMossSurfaceWorld,vMossSurfaceLocal;\n${shader.vertexShader}`
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vMossSurfaceLocal=position;
        vec4 mossSurfacePoint=vec4(transformed,1.);
        #ifdef USE_BATCHING
          mossSurfacePoint=batchingMatrix*mossSurfacePoint;
        #endif
        #ifdef USE_INSTANCING
          mossSurfacePoint=instanceMatrix*mossSurfacePoint;
        #endif
        vMossSurfaceWorld=(modelMatrix*mossSurfacePoint).xyz;`);
    shader.fragmentShader = `${FIELD_GLSL}\n${shader.fragmentShader}`
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec3 mossDx=dFdx(vMossSurfaceWorld),mossDy=dFdy(vMossSurfaceWorld);
        float mossFootprint=max(length(mossDx),length(mossDy));
        float mossAmount=clamp(mossSurfaceStrength,0.,1.);
        float mossFine=(1.-smoothstep(.0015,.0055,mossFootprint))*mossAmount;
        vec4 mossLeaf=mossLeafStructure(vMossSurfaceLocal);
        float mossBasal=smoothstep(.005,.075,vMossSurfaceLocal.y);
        float mossTip=clamp(mossLeaf.x*smoothstep(.28,.85,fract((vMossSurfaceLocal.z-vMossSurfaceLocal.y*.37)*90.))+mossLeaf.y*.35,0.,1.);
        float mossShade=(1.+mossFine*(mossLeaf.x*.035+mossLeaf.y*.035-mossLeaf.w*.08-(1.-mossLeaf.x)*.035))
          *(1.-mossAmount*.10*(1.-mossBasal));
        diffuseColor.rgb*=mossShade;
        roughnessFactor=mix(roughnessFactor,clamp(roughnessFactor+.035-mossLeaf.x*.09+mossLeaf.w*.025,.72,1.),mossFine);
        totalEmissiveRadiance*=(1.-mossAmount*.93*(1.-mossBasal))
          *(1.-clamp(mossSurfaceEmissionDetail,0.,1.)*mossFine*(1.-(.16+mossTip*.84)));
        float mossHeight=dot(mossLeaf,vec4(.00055,.00030,.00008,.00012))*mossFine;
        vec3 mossGeom=cross(mossDx,mossDy);
        mossGeom*=inversesqrt(max(dot(mossGeom,mossGeom),.000000000001));
        mossGeom*=dot(mat3(viewMatrix)*mossGeom,normal)<0.?-1.:1.;
        vec3 mossR1=cross(mossDy,mossGeom),mossR2=cross(mossGeom,mossDx);
        float mossDet=dot(mossDx,mossR1);
        vec3 mossGradient=sign(mossDet)*(dFdx(mossHeight)*mossR1+dFdy(mossHeight)*mossR2)/max(abs(mossDet),.0000001);
        mossGradient*=min(1.,.30/max(length(mossGradient),.00001));
        normal=normalize(normal-mat3(viewMatrix)*mossGradient);`);
  };
  material.customProgramCacheKey = () => `${previousKey}|croba-leafy-moss-surface-v1`;
  material.userData.mossSurface = true;
  material.needsUpdate = true;
  applied.set(material, uniforms);
  return material;
}
