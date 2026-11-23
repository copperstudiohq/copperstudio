import {EYE_HEIGHT,PLAYER_RADIUS} from './terrain.js';
import {getSeabedHeight} from './seabed.js';
import {getJellyfishSpiresFloor,getJellyfishSpiresCollision,JELLYFISH_SPIRES_SPIRES} from './jellyfish-spires.js';

const HEIGHTS=[PLAYER_RADIUS,EYE_HEIGHT/2,EYE_HEIGHT-PLAYER_RADIUS];
function bodyContact(player){
  let deepest=null;
  for(const height of HEIGHTS){
    const hit=getJellyfishSpiresCollision({x:player.x,y:player.y,z:player.z+height},PLAYER_RADIUS);
    if(hit&&(!deepest||hit.penetration>deepest.penetration))deepest=hit;
  }
  return deepest;
}

/** Restore an older swimmer onto the edited floor and outside translated
 * volcanic columns. Already-clear saves retain their exact coordinates.
 * This runs only during restore, never during ordinary movement.
 * @param {{x:number,y:number,z:number,swimming?:boolean}} player
 */
export function clearSpiresLoadPose(player){
  if(!player?.swimming||![player.x,player.y,player.z].every(Number.isFinite))return;
  const floor=getJellyfishSpiresFloor(player.x,player.y);if(floor===null)return;
  player.z=Math.max(player.z,floor);
  for(let attempt=0;attempt<24;attempt++){
    const hit=bodyContact(player);if(!hit||hit.penetration<=.001)return;
    const distance=hit.penetration+.1;
    player.x+=hit.normal.x*distance;player.y+=hit.normal.y*distance;player.z+=hit.normal.z*distance;
    player.z=Math.max(player.z,getSeabedHeight(player.x,player.y));
  }
  // At a meeting of several edited columns, a bounded upward recovery is
  // preferable to trapping the explorer between disagreeing surface normals.
  for(const spire of JELLYFISH_SPIRES_SPIRES){
    const b=spire.bounds;
    if(player.x+PLAYER_RADIUS<b.minX||player.x-PLAYER_RADIUS>b.maxX||player.y+PLAYER_RADIUS<b.minY||player.y-PLAYER_RADIUS>b.maxY)continue;
    player.z=Math.max(player.z,b.maxZ+.1);
  }
  if(bodyContact(player))throw new Error('The saved dive could not be cleared from the edited spires. Its stored data has been kept.');
}
