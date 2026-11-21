import {steerPenguin} from './penguin-steering.js';
import {updatePenguinDive} from './penguin-diving.js';
import {highestIceAt,getIceSurfaceHeight} from './ice-surface.js';
import {WATER_LEVEL} from './terrain.js';
import {updatePenguinNests,updateNestPenguin} from './penguin-nests.js';
import {updatePenguinBrood,updateChickPenguin,penguinGrowthScale} from './penguin-lifecycle.js';
import {updatePenguinTail} from './penguin-tail-physics.js';

/** A small footprint must be supported by the same prepared ice shelf. */
export function penguinGround(world,x,y,platformId){
 const ice=highestIceAt(world.platforms??[],x,y);if(!ice||ice.id!==platformId)return null;
 const z=getIceSurfaceHeight(ice,x,y);if(z<WATER_LEVEL+5)return null;
 for(const [dx,dy]of [[7,0],[-7,0],[0,7],[0,-7]]){
  const edge=highestIceAt(world.platforms,x+dx,y+dy);
  if(edge?.id!==platformId||Math.abs(getIceSurfaceHeight(edge,x+dx,y+dy)-z)>7)return null;
 }
 return z;
}

/** Social ice birds waddle, dive and take turns guarding the wreck-wing nests. */
export function updatePenguins(world,dt){
 if(!Number.isFinite(dt)||dt<=0)return;const delta=Math.min(.05,dt),player=world.player;
 updatePenguinNests(world,delta,penguinGround);
 updatePenguinBrood(world,delta,penguinGround);
 for(const bird of world.penguins??[]){
  if(bird.lifecycleInactive||bird.squidHeldBy||bird.squidRespawnIn>0||Math.hypot(player.x-bird.x,player.y-bird.y)>2000)continue;
  bird.phase+=delta;bird.speed=0;bird.wetness=Math.max(0,(bird.wetness??0)-delta*.06);
  if(updateChickPenguin(world,bird,delta,penguinGround)||updateNestPenguin(world,bird,delta,penguinGround)||updatePenguinDive(world,bird,delta,penguinGround)){
   updatePenguinTail(world,bird,delta);continue;
  }
  const approaching=bird.state==='to-water';
  if(bird.returningHome&&Math.hypot(bird.x-bird.homeX,bird.y-bird.homeY)<40)bird.returningHome=false;
  const near=!player.swimming&&Math.abs(player.z-bird.z)<50&&Math.hypot(player.x-bird.x,player.y-bird.y)<65;
  const wander=Math.sin(bird.phase*.45+bird.seed)>-.3;
  bird.state=approaching?'to-water':bird.returningHome?'returning':near?'shying':wander?'waddling':'huddling';
  const target=approaching?bird.diveRoute.shore:bird.returningHome?{x:bird.homeX,y:bird.homeY}:near?{x:bird.x+(bird.x-player.x),y:bird.y+(bird.y-player.y)}:
   {x:bird.homeX+Math.cos(bird.phase*.3+bird.seed)*35,y:bird.homeY+Math.sin(bird.phase*.23+bird.seed)*30};
  if(approaching||bird.returningHome||near||wander){
   const speed=approaching||bird.returningHome?20:near?26:12;
   steerPenguin(world,bird,target,speed,delta,penguinGround,!approaching&&!bird.returningHome);
  }
  bird.stride+=bird.speed*delta/25*9;
  updatePenguinTail(world,bird,delta);
 }
}

export function resolvePenguinBodies(world){
 const p=world.player;if(p.swimming)return;
 for(let pass=0;pass<6;pass++)for(const bird of world.penguins??[]){
  const scale=penguinGrowthScale(bird),radius=5+8*scale;
  if(bird.lifecycleInactive||bird.squidHeldBy||bird.squidRespawnIn>0||p.z>bird.z+31*scale||p.z+36<bird.z)continue;
  const dx=p.x-bird.x,dy=p.y-bird.y,gap=Math.hypot(dx,dy);
  if(gap<radius){
   let nx=dx,ny=dy,length=gap;
   if(length<1e-8){
    for(const other of world.penguins??[])if(other!==bird&&Math.hypot(bird.x-other.x,bird.y-other.y)<35){nx+=bird.x-other.x;ny+=bird.y-other.y;}
    length=Math.hypot(nx,ny);if(length<1e-8){nx=1;ny=0;length=1;}
   }
   p.x=bird.x+nx/length*radius;p.y=bird.y+ny/length*radius;
  }
 }
}
