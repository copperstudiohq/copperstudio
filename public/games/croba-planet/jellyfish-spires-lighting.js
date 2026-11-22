import { EYE_HEIGHT } from './terrain.js';
import { getSeabedHeight } from './seabed.js';
import { getJellyfishSpiresCollision } from './jellyfish-spires.js';
import {getSpiresSubmarineCollision} from './jelly-spires-submarine.js';

/** Headlamp exposure compensation for the nearby volcanic rock/floor. Call at
 * perception cadence while in Jellyfish Spires; no renderer or light is owned
 * here. Clear upper water keeps full power, close stone retains 20 percent.
 * @param {{x:number,y:number,z:number}} player
 * @param {{x:number,y:number,z:number}} [direction] Forward vector in simulation axes.
 * @returns {number}
 */
export function getJellyfishSpiresDiveLightGain(player,direction) {
  if (!player || !Number.isFinite(player.x) || !Number.isFinite(player.y) || !Number.isFinite(player.z)) return 1;
  const eye = { x: player.x, y: player.y, z: player.z + EYE_HEIGHT };
  let clearance=Infinity;
  if(direction){
    if(![direction.x,direction.y,direction.z].every(Number.isFinite))return 1;
    const length=Math.hypot(direction.x,direction.y,direction.z);if(length<1e-8)return 1;
    // Sample only the central illuminated cone. Nearby floor below the
    // swimmer or a wall behind the camera must not dim a forward-facing lamp.
    for(const distance of [.5,1,2,3,4,5,6,8,10,12,14]){
      const reach=distance*25,radius=Math.max(4,reach*.08);
      const point={x:eye.x+direction.x/length*reach,y:eye.y+direction.y/length*reach,z:eye.z+direction.z/length*reach};
      if(point.z-radius<=getSeabedHeight(point.x,point.y)||getJellyfishSpiresCollision(point,radius)||getSpiresSubmarineCollision(point,radius)){
        clearance=distance;break;
      }
    }
  }else{
    const contact=getJellyfishSpiresCollision(eye,500);
    const metal=getSpiresSubmarineCollision(eye,500);
    clearance=Math.min(contact?(500-contact.penetration)/25:Infinity,metal?(500-metal.penetration)/25:Infinity,(eye.z-getSeabedHeight(eye.x,eye.y))/25);
  }
  const t = Math.max(0, Math.min(1, (clearance - 2) / 12));
  return .2 + .8 * t * t * (3 - 2 * t);
}
