import {EYE_HEIGHT,PLAYER_RADIUS} from './terrain.js';
import {getSeabedHeight} from './seabed.js';
import {getSpiresSubmarineCollision} from './jelly-spires-submarine.js';
import {getJellyfishSpiresCollision} from './jellyfish-spires.js';

const BODY_HEIGHTS=[PLAYER_RADIUS,EYE_HEIGHT/2,EYE_HEIGHT-PLAYER_RADIUS];
const clearsVolcanicRock=point=>BODY_HEIGHTS.every(height=>!getJellyfishSpiresCollision({...point,z:point.z+height},PLAYER_RADIUS));

/** Query actual metal, retaining the flooded breach and aft opening.
 * @param {number} x @param {number} y @param {number} z */
export function submarineBlocksPlayer(x,y,z){
  return BODY_HEIGHTS.some(height=>getSpiresSubmarineCollision({x,y,z:z+height},PLAYER_RADIUS)?.penetration>.001);
}

/** A new wreck must not trap an older save that happened to intersect its
 * metal. Clear interior saves are preserved exactly; only overlapping poses
 * move to a nearby clear point, above the existing physical seabed.
 * @param {{x:number,y:number,z:number,swimming?:boolean}} player
 * @returns {boolean} Whether the restored pose needed repair.
 */
export function clearSubmarineLoadPose(player){
  if(!player?.swimming||![player.x,player.y,player.z].every(Number.isFinite)||!submarineBlocksPlayer(player.x,player.y,player.z))return false;
  const original={x:player.x,y:player.y,z:player.z},candidate={...original};
  for(let attempt=0;attempt<16;attempt++){
    let contact=null;
    for(const height of BODY_HEIGHTS){
      const hit=getSpiresSubmarineCollision({...candidate,z:candidate.z+height},PLAYER_RADIUS);
      if(hit&&(!contact||hit.penetration>contact.penetration))contact=hit;
    }
    if(!contact||contact.penetration<=.001){if(clearsVolcanicRock(candidate)){Object.assign(player,candidate);return true;}break;}
    const distance=contact.penetration+.05;
    candidate.x+=contact.normal.x*distance;candidate.y+=contact.normal.y*distance;candidate.z+=contact.normal.z*distance;
    candidate.z=Math.max(candidate.z,getSeabedHeight(candidate.x,candidate.y));
  }
  // This bounded fallback also handles an old pose at the meeting of ribs,
  // deck and plating, where successive nearest-surface pushes can disagree.
  for(const radius of[12.5,25,50,100,200,400,800])for(let step=0;step<16;step++){
    const angle=step*Math.PI/8,x=original.x+Math.cos(angle)*radius,y=original.y+Math.sin(angle)*radius;
    const z=Math.max(original.z,getSeabedHeight(x,y));
    if(!submarineBlocksPlayer(x,y,z)&&clearsVolcanicRock({x,y,z})){Object.assign(player,{x,y,z});return true;}
  }
  throw new Error('The old expedition position could not be cleared from the submarine wreck. Its saved data has been kept.');
}
