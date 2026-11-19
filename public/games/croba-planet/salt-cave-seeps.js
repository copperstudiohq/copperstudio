import {EYE_HEIGHT} from './terrain.js';
import {getSaltCave,saltCaveSection} from './salt-cave.js';

/** Fixed geothermal seams at hall margins; both entrances and routes stay open. */
export const SALT_CAVE_SEEPS=Object.freeze([
 [5000,-11790,65],[4335,-12590,60],[4460,-12950,65],[5480,-12500,70],
 [5980,-12830,65],[6030,-13420,60],[5270,-13480,65],
].map(([x,y,radius])=>{
 const ground=saltCaveSection(x,y);
 if(!ground||ground.clearance<35)throw new Error(`Sulfur seep at ${x}, ${y} needs a supported cave floor.`);
 return Object.freeze({x,y,z:ground.floor,radius});
}));

/** Local hot plumes, rather than unavoidable damage throughout the biome.
 * Swimming above or around a marked bubbling patch immediately clears exposure. */
export function saltSeepExposure(player){
 if(!player||!getSaltCave(player.x,player.y,player.z,EYE_HEIGHT))return 0;
 let exposure=0;
 for(const seep of SALT_CAVE_SEEPS){
  const distance=Math.hypot(player.x-seep.x,player.y-seep.y,(player.z+EYE_HEIGHT*.5-seep.z-22)*.8);
  exposure=Math.max(exposure,Math.max(0,1-distance/seep.radius));
 }
 return exposure;
}
