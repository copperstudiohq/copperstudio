import * as THREE from './vendor/three.module.js';
import { WATER_LEVEL } from './terrain.js';
import { WATER_OPTICS } from './water-optics.js';

const clamp = value => Math.max(0, Math.min(1, value));
const fract = value => value - Math.floor(value);
function smooth(a, b, value) { const t = clamp((value - a) / (b - a)); return t * t * (3 - 2 * t); }

/** Reference pattern for offline appearance checks. Production evaluates the
 * same field in the existing floor shader, without CPU updates or a texture.
 */
export function sampleCausticWeb(x, z, time = 0) {
  if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(time)) return 0;
  const px = x * 1.35, pz = z * 1.35;
  const flowA = Math.sin(px * .47 + pz * .36 + time * .19);
  const flowB = Math.sin(-px * .33 + pz * .51 - time * .16);
  const qx = px + .24 * Math.sin(px * 1.17 + pz * .83 + time * .43) + .6 * (.36 * flowA + .51 * flowB) + time * .045;
  const qz = pz + .22 * Math.sin(-px * .91 + pz * 1.1 - time * .37) + .6 * (-.47 * flowA + .33 * flowB) - time * .031;
  const ix = Math.floor(qx), iz = Math.floor(qz), fx = fract(qx), fz = fract(qz);
  let first = 8, second = 8, third = 8, localStrength = 0, localWeight = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    let a = fract((ix + i) * .1031), b = fract((iz + j) * .1030), c = fract((ix + i) * .0973);
    const mix = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
    a += mix; b += mix; c += mix;
    const sx = fract((a + b) * c), sz = fract((a + c) * b);
    const dx = i + .04 + sx * .92 - fx, dz = j + .04 + sz * .92 - fz;
    const distance = dx * dx + dz * dz, low = Math.min(first, distance), high = Math.max(first, distance);
    const weight = Math.max(0, 1 - distance) ** 2;
    localStrength += (sx * .6 + sz * .4) * weight; localWeight += weight;
    third = Math.min(third, Math.max(second, high)); second = Math.min(second, high); first = low;
  }
  const nearest = Math.sqrt(first), edge = Math.sqrt(second) - nearest, junction = Math.sqrt(third) - nearest;
  const localFocus = .82 + .18 * localStrength / Math.max(.0001, localWeight);
  return clamp(((1 - smooth(.025, .12, edge)) * .55 + (1 - smooth(.045, .24, edge)) * .22) * localFocus
    + (1 - smooth(.025, .14, junction)) * .06);
}

/** Metre-based visibility envelope shared with the shader's attenuation model.
 * This models a bounded lighting effect, not a full optical simulation.
 */
export function getCausticVisibility({ depth = 0, distance = 0, fogDensity = .027,
  openWater = 1, sunStrength = 1, lightPenetration = WATER_OPTICS.causticDepth } = {}) {
  if (![depth, distance, fogDensity, openWater, sunStrength, lightPenetration].every(Number.isFinite)
    || lightPenetration <= 0) return 0;
  return smooth(.02, .3, depth) * Math.exp(-Math.max(0, depth) / lightPenetration)
    * clamp(openWater) * clamp(sunStrength) * Math.exp(-((Math.max(0, distance) * Math.max(0, fogDensity)) ** 2));
}

/** Organic, advected sunlight folds in the existing single caustic draw.
 * The borrowed waterField supplies ice occlusion; disposal never owns it.
 * Existing UnderwaterField.bind and Scene time/fog updates remain compatible.
 * @param {{waterLevel?:number,lightPenetration?:number,waterFogDensity?:number,sunStrength?:number}} [options]
 */
export function createOceanCausticsMaterial({ waterLevel = WATER_LEVEL / 25,
  lightPenetration = WATER_OPTICS.causticDepth, waterFogDensity = .027, sunStrength = 1 } = {}) {
  if (![waterLevel, lightPenetration, waterFogDensity, sunStrength].every(Number.isFinite)
    || lightPenetration <= 0 || waterFogDensity < 0) throw new RangeError('Caustics need a finite waterline, positive light depth and nonnegative fog.');
  const material = new THREE.ShaderMaterial({
    name: 'organic-ocean-caustics', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      time: { value: 0 }, waterLevel: { value: waterLevel }, lightPenetration: { value: lightPenetration },
      waterFogDensity: { value: waterFogDensity }, sunStrength: { value: clamp(sunStrength) },
      waterField: { value: null }, fieldBounds: { value: new THREE.Vector4() }, fieldReady: { value: 0 },
    },
    vertexShader: `varying vec3 vWorld;
      void main(){
        vec4 point=modelMatrix*vec4(position,1.);
        vWorld=point.xyz;
        gl_Position=projectionMatrix*viewMatrix*point;
      }`,
    fragmentShader: `varying vec3 vWorld;
      uniform float time,waterLevel,lightPenetration,waterFogDensity,sunStrength,fieldReady;
      uniform sampler2D waterField;
      uniform vec4 fieldBounds;

      // Sine-free, stationary cell seeds. Only the continuous wave domain
      // moves: cells never re-roll or jump when crossing a world-space seam.
      vec2 causticSeed(vec2 cell){
        vec3 p=fract(vec3(cell.xyx)*vec3(.1031,.1030,.0973));
        p+=dot(p,p.yzx+33.33);
        return fract((p.xx+p.yz)*p.zy);
      }
      float causticWeb(vec2 world){
        vec2 p=world*1.35;
        float flowA=sin(dot(p,vec2(.47,.36))+time*.19);
        float flowB=sin(dot(p,vec2(-.33,.51))-time*.16);
        // Curl changes shape only. Gentle displacement avoids compressing
        // many cells into narrow corridors; it never gates their brightness.
        vec2 curl=vec2(.36*flowA+.51*flowB,-.47*flowA+.33*flowB);
        vec2 wave=vec2(sin(dot(p,vec2(1.17,.83))+time*.43),
                       sin(dot(p,vec2(-.91,1.1))-time*.37));
        vec2 q=p+wave*vec2(.24,.22)+curl*.6+time*vec2(.045,-.031);
        vec2 cell=floor(q),local=fract(q);
        vec3 nearest=vec3(8.);
        float localStrength=0.,localWeight=0.;
        // Fixed nine candidates; no extra texture, ray march or framebuffer.
        for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
          vec2 offset=vec2(float(x),float(y));
          vec2 seed=causticSeed(cell+offset);
          vec2 delta=offset+.04+seed*.92-local;
          float d=dot(delta,delta),low=min(nearest.x,d),high=max(nearest.x,d);
          // Compact radial weights provide continuous local2D variation from
          // these same nine seeds, including across integer cell boundaries.
          float weight=max(0.,1.-d);weight*=weight;
          localStrength+=dot(seed,vec2(.6,.4))*weight;localWeight+=weight;
          nearest.z=min(nearest.z,max(nearest.y,high));
          nearest.y=min(nearest.y,high);nearest.x=low;
        }
        nearest=sqrt(nearest);
        float edge=nearest.y-nearest.x,junction=nearest.z-nearest.x;
        // Every cell keeps its curved pattern; local focus stays above82%.
        // Dark pockets belong to individual cells, not world-scale bands.
        float aa=min(.075,fwidth(edge)*.65);
        float fine=1.-smoothstep(.025-aa,.12+aa,edge);
        float soft=1.-smoothstep(.045,.24+aa,edge);
        float cusp=1.-smoothstep(.025,.14+aa,junction);
        float localFocus=.82+.18*localStrength/max(.0001,localWeight);
        return clamp((fine*.55+soft*.22)*localFocus+cusp*.06,0.,1.);
      }
      void main(){
        float depth=waterLevel-vWorld.y;
        vec2 uv=clamp((vWorld.xz-fieldBounds.xy)/max(fieldBounds.zw,vec2(1.)),0.,1.);
        float open=mix(1.,clamp(texture2D(waterField,uv).g,0.,1.),clamp(fieldReady,0.,1.));
        float sunlight=exp(-max(0.,depth)/max(.001,lightPenetration))*open
          *smoothstep(.02,.3,depth)*clamp(sunStrength,0.,1.);
        float distanceExtinction=exp(-pow(distance(cameraPosition,vWorld)*waterFogDensity,2.));
        float lace=causticWeb(vWorld.xz+vWorld.y*.17);
        gl_FragColor=vec4(.64,.86,.82,lace*.38*sunlight*distanceExtinction);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  material.userData.causticModel = 'distributed-caustic-web';
  material.userData.borrowedWaterField = true;
  return material;
}
