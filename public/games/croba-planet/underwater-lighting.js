import {WATER_OPTICS,getWaterFogDensity} from './water-optics.js';

const clamp=value=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;
const mix=(a,b,t)=>a+(b-a)*t;
const linear=value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4;
const rgb=hex=>Object.freeze([linear((hex>>16&255)/255),linear((hex>>8&255)/255),linear((hex&255)/255)]);
const COLORS=Object.freeze({
  shallowOcean:rgb(0x267b99),deepOcean:rgb(0x041526),
  shallowArctic:rgb(0x24596e),deepArctic:rgb(0x123346),
  shellWater:rgb(0x4aa6bc),oceanSky:rgb(0xa4d4e5),arcticSky:rgb(0xa8cfd8),
  oceanGround:rgb(0x203c51),arcticGround:rgb(0x1c3548),sun:rgb(0xe1edf1),
  deepSun:rgb(0x92bed5),shellSky:rgb(0xe0f5ee),shellGround:rgb(0x638d98),shellSun:rgb(0xf2f9e8),
});

/** Reusable underwater illumination, with colors already converted to linear
 * RGB for THREE.Color.setRGB(). No material, light, clock or world is mutated.
 * Depth is camera depth in render metres. Existing cave/sulfur overrides apply
 * after this profile; this is deliberately not an above-water lighting API.
 *
 * @param {string} biome
 * @param {number} [depth]
 * @param {number} [shellBlend]
 * @param {object} [target] Caller-owned reusable profile; its color arrays stay stable.
 * @returns {{background:number[],ambient:number[],ground:number[],key:number[],sunlight:number,
 * fogDensity:number,ambientIntensity:number,keyIntensity:number,environmentIntensity:number,diveLightIntensity:number}}
 */
export function getUnderwaterLighting(biome,depth=0,shellBlend=0,target={}){
  const d=Number.isFinite(depth)?Math.max(0,depth):0,shell=clamp(shellBlend);
  const ocean=biome==='blue-ocean'||biome==='jellyfish-spires'||biome==='shell-field';
  const kelp=biome==='blue-kelp-forest',deep=ocean||kelp;
  const sunlight=Math.exp(-d/WATER_OPTICS.sunlightDepth),distanceBlue=1-Math.exp(-d/(ocean?30:45));
  const near=ocean?COLORS.shallowOcean:COLORS.shallowArctic,far=ocean?COLORS.deepOcean:COLORS.deepArctic;
  const sky=ocean?COLORS.oceanSky:COLORS.arcticSky,ground=ocean?COLORS.oceanGround:COLORS.arcticGround;
  target.background??=[0,0,0];target.ambient??=[0,0,0];target.ground??=[0,0,0];target.key??=[0,0,0];
  for(let channel=0;channel<3;channel++){
    target.background[channel]=mix(mix(near[channel],far[channel],distanceBlue),COLORS.shellWater[channel],shell);
    target.ambient[channel]=mix(sky[channel],COLORS.shellSky[channel],shell);
    target.ground[channel]=mix(ground[channel],COLORS.shellGround[channel],shell);
    target.key[channel]=mix(mix(COLORS.deepSun[channel],COLORS.sun[channel],sunlight),COLORS.shellSun[channel],shell);
  }
  target.sunlight=sunlight;
  target.fogDensity=getWaterFogDensity(biome,d,shell);
  // Keep abyssal ambient baselines low: jelly glow and the existing dive lamp
  // remain the local light sources, instead of brightening all deep materials.
  target.ambientIntensity=mix(deep?.10+1.05*sunlight:.62+.30*sunlight,1.4,shell);
  target.keyIntensity=mix(deep?.025+2.0*sunlight:.65+.75*sunlight,2.2,shell);
  target.environmentIntensity=mix(deep?.025+.70*sunlight:.40+.45*sunlight,.95,shell);
  target.diveLightIntensity=mix(kelp?18+95*(1-sunlight):deep?12+168*(1-sunlight):16+42*(1-sunlight),26,shell);
  return target;
}
