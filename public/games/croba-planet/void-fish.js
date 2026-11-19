import { BLUE_OCEAN_START_X, WATER_LEVEL } from './terrain.js';
import { getSeabedHeight } from './seabed.js';
import { getForestHeight } from './forest-terrain.js';
import { updateFrostHounds } from './frost-hounds.js';

export const VOID_FISH_MIN_DEPTH=84;
export const VOID_FISH_BOTTOM_BAND=130; // 5.2 m above the actual ocean floor.

export function voidFishFloor(world,x,y) {
  return Math.max(getSeabedHeight(x,y),getForestHeight(world,x,y)??-Infinity);
}

/** The whole body stays in the deep blue ocean, clear of the bottom's slopes. */
export function voidFishWaterClear(world,x,y,z) {
  if(![x,y,z].every(Number.isFinite)||x-45<BLUE_OCEAN_START_X)return false;
  const floor=voidFishFloor(world,x,y);
  if(floor>WATER_LEVEL-VOID_FISH_MIN_DEPTH*25||z>floor+VOID_FISH_BOTTOM_BAND)return false;
  for(const [dx,dy]of [[0,0],[42,0],[-42,0],[0,42],[0,-42]])
    if(z-20<voidFishFloor(world,x+dx,y+dy))return false;
  return true;
}

const habitat=Object.freeze({populationKey:'voidFish',packStateKey:'voidFishPackState',boundedVertical:true,
  waterClear:voidFishWaterClear,
  boundsAt:(world,x,y)=>{const floor=voidFishFloor(world,x,y);return {low:floor+32,high:floor+VOID_FISH_BOTTOM_BAND};},
  preyInHabitat:(world,prey)=>{
    const floor=voidFishFloor(world,prey.x,prey.y);
    return prey.x>=BLUE_OCEAN_START_X&&floor<=WATER_LEVEL-VOID_FISH_MIN_DEPTH*25&&prey.z>=floor+5&&prey.z<=floor+VOID_FISH_BOTTOM_BAND;
  },
});

/** Black, bottom-dwelling relatives inherit the hounds' pack and jet behavior,
 * with separate territory, memories and attack cadence. */
export function updateVoidFish(world,dt) {
  return updateFrostHounds(world,dt,habitat);
}
