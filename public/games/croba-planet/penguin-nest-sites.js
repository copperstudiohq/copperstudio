import {PREPARED_BASIN_NESTS} from './basin-expansion-data.js';
import {WRECK_WING_NESTS,wreckWingHeight} from './wreck-wings.js';
import {wreckWorldPoint} from './wreck-interior.js';
import {getIceSurfaceHeight} from './ice-surface.js';
import {SHIP_BIRD_NESTS,haulerBirdPoint} from './hauler-birds.js';

/** Stable save keys. Wing entries retain their original order and spelling. */
export const PENGUIN_NEST_IDS=Object.freeze([
 'wing-nest-0','wing-nest-1',
 'island-nest-1-0','island-nest-1-1',
 'island-nest-2-0','island-nest-2-1',
 'island-nest-3-0','island-nest-3-1',
 ...PREPARED_BASIN_NESTS.map(nest=>nest.id),
 ...SHIP_BIRD_NESTS.map(nest=>nest.id),
]);
export const PENGUIN_EGG_IDS=Object.freeze([
 'wing-nest-0-egg-0','wing-nest-0-egg-1','wing-nest-1-egg-0','wing-nest-1-egg-1',
 'island-nest-1-0-egg-0','island-nest-1-0-egg-1','island-nest-1-1-egg-0','island-nest-1-1-egg-1',
 'island-nest-2-0-egg-0','island-nest-2-0-egg-1','island-nest-2-1-egg-0','island-nest-2-1-egg-1',
 'island-nest-3-0-egg-0','island-nest-3-0-egg-1','island-nest-3-1-egg-0','island-nest-3-1-egg-1',
 ...PREPARED_BASIN_NESTS.flatMap(nest=>[0,1].map(slot=>`${nest.id}-egg-${slot}`)),
 ...SHIP_BIRD_NESTS.flatMap(nest=>[0,1].map(slot=>`${nest.id}-egg-${slot}`)),
]);

/** Prepared, fully supported bowls, north of the colonies' shared dive lanes.
 * Departure waypoints use the outer side of each bowl so a departing parent
 * leaves space for its replacement approaching from the colony to the south. */
const ICE_NESTS=Object.freeze([
 {id:'island-nest-1-0',colony:1,index:0,platformId:'floe-0',x:-30,y:0,exitX:-56,exitY:25,phase:.7},
 {id:'island-nest-1-1',colony:1,index:1,platformId:'floe-0',x:38,y:0,exitX:64,exitY:25,phase:1.8},
 {id:'island-nest-2-0',colony:2,index:0,platformId:'floe-4',x:45,y:-245,exitX:24,exitY:-226,phase:1.1},
 {id:'island-nest-2-1',colony:2,index:1,platformId:'floe-4',x:100,y:-245,exitX:119,exitY:-226,phase:2.2},
 {id:'island-nest-3-0',colony:3,index:0,platformId:'floe-9',x:-690,y:0,exitX:-716,exitY:23,phase:1.5},
 {id:'island-nest-3-1',colony:3,index:1,platformId:'floe-9',x:-635,y:0,exitX:-609,exitY:23,phase:2.6},
]);

const siteCache=new WeakMap(),eggCache=new WeakMap();

/** Nest positions use simulation x/y/z; radius and phase use render metres and
 * radians. surfaceZ is the actual supporting surface, z its twig floor (+.04m).
 * @returns {Array<{id:string,kind:'wing'|'ice'|'hauler',index:number,colony:number,platformId:string,x:number,y:number,z:number,surfaceZ:number,radius:number,phase:number,localX?:number,localZ?:number,exitX?:number,exitY?:number}>} */
export function getPenguinNestSites(world){
 const previous=siteCache.get(world),ship=world.ship;
 const shipPose=ship?[ship.x,ship.y,ship.z??0,ship.yaw??0].join(':'):'';
 if(previous&&previous.platforms===world.platforms&&previous.platformCount===world.platforms?.length&&previous.ship===ship&&previous.shipPose===shipPose)return previous.sites;
 const wings=world.ship?WRECK_WING_NESTS.map((nest,index)=>{
  const surfaceZ=(world.ship.z??0)+wreckWingHeight(nest.x,nest.z)*25;
  return {id:PENGUIN_NEST_IDS[index],kind:'wing',index,colony:0,platformId:'outer-ice-12',
   localX:nest.x,localZ:nest.z,...wreckWorldPoint(world.ship,nest.x,nest.z),
   surfaceZ,z:surfaceZ+1,radius:nest.radius,phase:nest.phase};
 }):[];
 const ice=[...ICE_NESTS,...PREPARED_BASIN_NESTS].flatMap(nest=>{
  const platform=(world.platforms??[]).find(platform=>platform.id===nest.platformId);
  if(!platform)return [];
  const surfaceZ=getIceSurfaceHeight(platform,nest.x,nest.y);
  return [{...nest,kind:'ice',surfaceZ,z:surfaceZ+1,radius:.58}];
 });
 const hauler=SHIP_BIRD_NESTS.filter(nest=>world.platforms?.some(ice=>ice.id===nest.platformId)).map(site=>{
  const nest=site.zone==='starter-roof'?{...site,shipPose:world.ship??site.shipPose}:site;
  const point=haulerBirdPoint(nest,nest.localX,nest.localZ);return {...nest,...point,surfaceZ:point.z-1};
 });
 const sites=[...wings,...ice,...hauler].map(Object.freeze);siteCache.set(world,{platforms:world.platforms,platformCount:world.platforms?.length,ship,shipPose,sites});return sites;
}

/** Fixed egg slots remain addressable when collected or hatched. */
export function getPenguinNestEggs(world){
 const sites=getPenguinNestSites(world),previous=eggCache.get(world);if(previous?.sites===sites)return previous.eggs;
 const eggs=sites.flatMap(nest=>[-.11,.11].map((offset,slot)=>{
  if(nest.kind==='hauler'){
   const point=haulerBirdPoint(nest,nest.localX+offset,nest.localZ);
   return {id:`${nest.id}-egg-${slot}`,nestId:nest.id,...point,z:point.z+3};
  }
  if(nest.kind==='wing'){
   const x=nest.localX+offset,z=nest.localZ;
   return {id:`${nest.id}-egg-${slot}`,nestId:nest.id,...wreckWorldPoint(world.ship,x,z),
    z:(world.ship.z??0)+(wreckWingHeight(x,z)+.16)*25};
  }
  const x=nest.x+offset*25,y=nest.y,platform=world.platforms.find(platform=>platform.id===nest.platformId);
  return {id:`${nest.id}-egg-${slot}`,nestId:nest.id,x,y,z:getIceSurfaceHeight(platform,x,y)+.16*25};
 }));
 eggCache.set(world,{sites,eggs});return eggs;
}
