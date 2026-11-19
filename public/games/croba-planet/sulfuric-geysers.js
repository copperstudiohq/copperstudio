import {SULFURIC_POOLS} from './sulfuric-biome-data.js';

export const GEYSER_PERIOD_SECONDS=24;
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

/** Pond cycles read the simulation clock, so pause and reload stay coherent. */
export function getSulfuricGeyserState(time,index,target={}){
  const clock=Number.isFinite(time)?Math.max(0,time):0,slot=Number.isInteger(index)&&index>=0&&index<SULFURIC_POOLS.length?index:0;
  const phase=(clock+(slot%3)*8)%GEYSER_PERIOD_SECONDS;
  target.phase=phase;target.strength=smooth(2,3,phase)*(1-smooth(6,7.5,phase));
  target.warning=phase<2;target.active=target.strength>.02;target.heightMeters=(8.5+(slot%3)*1.5)*target.strength;
  return target;
}
