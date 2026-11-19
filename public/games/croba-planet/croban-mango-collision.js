import {CROBAN_MANGO_SITES} from './croban-mango.js';

/** Narrow trunks block walking; the spread of leaves never becomes a wall. */
export function resolveCrobanMangoCollision(world){
 const p=world.player;
 for(const tree of CROBAN_MANGO_SITES){
  if(p.z>=tree.z+tree.trunkHeight||p.z+36<=tree.z)continue;
  const dx=p.x-tree.x,dy=p.y-tree.y,reach=tree.trunkRadius+5;
  if(Math.abs(dx)>=reach||Math.abs(dy)>=reach)continue;
  if(!world.platforms?.some(ice=>ice.id===tree.platformId))continue;
  const distance=Math.hypot(dx,dy);if(distance>=reach)continue;
  const nx=distance>1e-8?dx/distance:1,ny=distance>1e-8?dy/distance:0;
  p.x=tree.x+nx*(reach+.01);p.y=tree.y+ny*(reach+.01);
 }
}
