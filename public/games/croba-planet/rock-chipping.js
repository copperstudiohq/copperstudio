import {PREPARED_WORLD_ROCKS} from './world-rock-data.js';
import {BAG_CAPACITY,inventoryCount} from './survival.js';
const cache=new WeakMap();
/** A stable filtered array lets the existing spatial collision cache be reused. */
export function activeWorldRocks(world){
 const removed=world.crafting?.removedRocks??[],key=removed.join('|'),old=cache.get(world);
 if(old?.key===key)return old;
 const ids=new Set(removed),result={key,ids,rocks:ids.size?PREPARED_WORLD_ROCKS.filter(rock=>!ids.has(rock.id)):PREPARED_WORLD_ROCKS};
 cache.set(world,result);return result;
}
export function nearbyChippableRock(world){
 const p=world.player;let nearest=null,best=50;
 for(const rock of activeWorldRocks(world).rocks){
  const dx=Math.max(0,Math.abs(p.x-rock.x)-rock.rx),dy=Math.max(0,Math.abs(p.y-rock.y)-rock.ry);
  const low=rock.z,high=rock.z+rock.height,dz=Math.max(0,low-p.z-22,p.z+22-high);
  const distance=Math.hypot(dx,dy,dz);if(distance<best){best=distance;nearest=rock;}
 }
 return nearest;
}
export function chipRock(world){
 if(!(world.inventory?.['rock-chipper']>0)||world.squidEncounter||world.centipedeEncounter||world.treeStalkerEncounter||world.sandWormEncounter)return false;
 const rock=nearbyChippableRock(world);
 if(!rock){world.notice='Rock chipper: move within 2 m of a loose seabed rock.';world.noticeTime=5;return false;}
 if(inventoryCount(world)>=BAG_CAPACITY){world.notice='Make room in your backpack for the rock debris.';world.noticeTime=4;return false;}
 (world.crafting.removedRocks??=[]).push(rock.id);world.inventory.debris=(world.inventory.debris??0)+1;
 world.notice='Chipped away a loose rock. Recovered one reusable debris.';world.noticeTime=5;return true;
}
