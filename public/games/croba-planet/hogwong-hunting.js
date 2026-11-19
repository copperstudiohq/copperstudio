import {PREPARED_HOGWONGS} from './hogwong-data.js';
import {highestIceAt,getIceSurfaceHeight} from './ice-surface.js';
import {wreckBodyPathClear,wreckBodyPenetration} from './wreck-collision.js';
import {removePenguinOffspring} from './penguin-lifecycle.js';

export const HOGWONG_HUNT_RANGE=1000; // Forty metres in simulation coordinates.
export const HOGWONG_HUNT_SPEED=45;
export const HOGWONG_BITE_SECONDS=.85;
export const HOGWONG_HUNT_COOLDOWN=45;
export const HOGWONG_PREY_RESPAWN_SECONDS=60;
const body=Object.freeze({radius:38,height:55});
const waterStates=new Set(['diving','swimming','surfacing','landing']);
const huntStates=new WeakMap();
const turns=[0,.35,-.35,.7,-.7,1.1,-1.1];
const wrap=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
const finite=point=>point&&Number.isFinite(point.x)&&Number.isFinite(point.y)&&Number.isFinite(point.z);
const ownerId=hog=>`hogwong:${hog.id}`;

/** One fixed predator shares the crash colony's connected ice. The ten authored
 * tundra animals keep their original habitats; no runtime population spawning.
 * Call before constructing the instanced Hogwong renderer, and on world reset.
 */
export function initializeHogwongHunters(world){
 if((world.hogwongs??[]).some(hog=>hog.id==='crash-hogwong-1'))return world;
 const x=-5485,y=-1040,ice=highestIceAt(world.platforms??[],x,y);
 if(ice?.id!=='outer-ice-12'||!PREPARED_HOGWONGS[0])return world;
 const z=getIceSurfaceHeight(ice,x,y);
 if(wreckBodyPenetration(world.ship,{x,y,z},body)>0)return world;
 const hog={...structuredClone(PREPARED_HOGWONGS[0]),id:'crash-hogwong-1',x,y,z,homeX:x,homeY:y,
  heading:1.3,phase:0,seed:39.4,huntPlatformId:ice.id,huntCooldown:8};
 (world.hogwongs??=[]).push(hog);return world;
}

/** Sample an entire connected walking route, not just its destination. Ship
 * sweeps cover the complete four-metre animal, and samples catch ice channels.
 * @param {object} world @param {object} from @param {object} to
 * @param {(world:object,x:number,y:number,platformId?:string)=>number|null} ground
 */
export function hogwongHuntPathClear(world,from,to,ground,platformId){
 const length=Math.hypot(to.x-from.x,to.y-from.y);if(length>HOGWONG_HUNT_RANGE)return false;
 if(!wreckBodyPathClear(world.ship,from,to,body))return false;
 const steps=Math.max(1,Math.ceil(length/18));let previous=from.z;
 for(let step=1;step<=steps;step++){
  const t=step/steps,x=from.x+(to.x-from.x)*t,y=from.y+(to.y-from.y)*t,z=ground(world,x,y,platformId);
  if(z===null||!Number.isFinite(z)||Math.abs(z-previous)>length/steps*.7+.05)return false;
  previous=z;
 }
 return true;
}

function eligible(world,bird,hog){
 if(!finite(bird)||bird.squidHeldBy||bird.squidRespawnIn>0||waterStates.has(bird.state)||Number.isFinite(bird.feetSurfaceZ))return false;
 if(bird.offspringId&&(!Number.isFinite(bird.growth)||bird.growth<1))return false;
 if(Math.abs(bird.z-hog.z)>24||Math.hypot(bird.x-hog.x,bird.y-hog.y)>HOGWONG_HUNT_RANGE)return false;
 const ice=highestIceAt(world.platforms??[],bird.x,bird.y),home=highestIceAt(world.platforms??[],hog.x,hog.y);
 return Boolean(ice&&ice.id===home?.id&&Math.abs(getIceSurfaceHeight(ice,bird.x,bird.y)-bird.z)<2);
}

function clearPose(hog){delete hog.huntPreyId;delete hog.biteProgress;}

/** Interrupting a predator releases only its own claim; squid ownership wins.
 * Claimed birds have not been moved or removed, so release needs no teleport.
 */
export function releaseHogwongHunt(world,hog){
 const state=huntStates.get(hog);if(!state?.prey)return;
 if(state.prey.squidHeldBy===ownerId(hog))delete state.prey.squidHeldBy;
 state.prey=null;state.claimed=false;state.bite=0;state.age=0;state.stalled=0;state.scan=1;clearPose(hog);
}

function choosePrey(world,hog,ground){
 let closest=null,best=Infinity;
 for(const bird of world.penguins??[]){
  if(!eligible(world,bird,hog))continue;
  // Grown offspring free a brood slot. Prefer them over the foundation colony
  // when both are reachable, while juveniles remain wholly ineligible.
  const distance=Math.hypot(bird.x-hog.x,bird.y-hog.y),score=distance-(bird.offspringId?HOGWONG_HUNT_RANGE:0);if(score>=best)continue;
  if(!hogwongHuntPathClear(world,hog,bird,ground,hog.huntPlatformId))continue;
  closest=bird;best=score;
 }
 return closest;
}

function chase(world,hog,prey,dt,ground){
 const direction=Math.atan2(prey.y-hog.y,prey.x-hog.x),turn=wrap(direction-hog.heading);
 const heading=hog.heading+Math.max(-dt*2.8,Math.min(dt*2.8,turn));
 const distance=Math.hypot(prey.x-hog.x,prey.y-hog.y),speed=distance>180?28:HOGWONG_HUNT_SPEED,step=Math.min(speed*dt,Math.max(0,distance-39));
 hog.heading=heading;hog.speed=0;
 if(step<=0)return false;
 for(const offset of turns){
  const angle=heading+offset,x=hog.x+Math.cos(angle)*step,y=hog.y+Math.sin(angle)*step,z=ground(world,x,y,hog.huntPlatformId);
  if(z===null||Math.abs(z-hog.z)>step*.7+.05)continue;
  const ahead={x:hog.x+Math.cos(angle)*Math.max(12,step),y:hog.y+Math.sin(angle)*Math.max(12,step),z};
  if(!hogwongHuntPathClear(world,hog,ahead,ground,hog.huntPlatformId))continue;
  if((world.hogwongs??[]).some(other=>other!==hog&&!other.squidHeldBy&&!(other.squidRespawnIn>0)&&Math.hypot(x-other.x,y-other.y)<65))continue;
  // A detour must still make progress, keeping blocked hunters bounded.
  if(Math.hypot(x-prey.x,y-prey.y)>=distance-.001)continue;
  hog.x=x;hog.y=y;hog.z=z;hog.heading=angle;hog.speed=speed;return true;
 }
 return false;
}

/** Return true when stalking/chasing/biting owns movement this frame. Scans run
 * once per simulation second, hunts time out, and a completed meal has a long
 * cooldown. Juveniles, swimmers, wing residents and claimed prey are excluded.
 * The shared wildlife respawn loop restores original birds; mature offspring
 * are removed from the bounded brood only after the visible bite finishes.
 * @param {object} world @param {object} hog @param {number} dt
 * @param {(world:object,x:number,y:number,platformId?:string)=>number|null} ground
 */
export function updateHogwongHunt(world,hog,dt,ground){
 if(!Number.isFinite(dt)||dt<=0)return false;
 if(hog.squidHeldBy||hog.squidRespawnIn>0){releaseHogwongHunt(world,hog);return false;}
 if(!finite(hog))return false;
 const delta=Math.min(.05,dt);
 let state=huntStates.get(hog);
 if(!state){state={prey:null,claimed:false,scan:0,age:0,stalled:0,bite:0};huntStates.set(hog,state);}
 hog.huntCooldown=Math.max(0,(hog.huntCooldown??0)-delta);
 const player=world.player,near=player&&!player.swimming&&Math.hypot(player.x-hog.x,player.y-hog.y)<125;
 if(near||player&&Math.hypot(player.x-hog.x,player.y-hog.y)>2000){releaseHogwongHunt(world,hog);return false;}
 if(state.prey){
  const prey=state.prey,claimed=prey.squidHeldBy===ownerId(hog);
  if(!(world.penguins??[]).includes(prey)||prey.squidRespawnIn>0||state.claimed&&!claimed||hog.huntPreyId!==prey.id||prey.squidHeldBy&&!claimed||!claimed&&!eligible(world,prey,hog)||(state.age+=delta)>24){
   releaseHogwongHunt(world,hog);hog.huntCooldown=Math.max(hog.huntCooldown,3);return false;
  }
  if(claimed){
   hog.speed=0;hog.state='biting';state.bite+=delta;hog.biteProgress=Math.min(1,state.bite/HOGWONG_BITE_SECONDS);
   if(state.bite+1e-9>=HOGWONG_BITE_SECONDS){
    delete prey.squidHeldBy;
    if(!removePenguinOffspring(world,prey.id))prey.squidRespawnIn=HOGWONG_PREY_RESPAWN_SECONDS;
    state.prey=null;state.claimed=false;state.bite=0;state.scan=1;clearPose(hog);hog.huntCooldown=HOGWONG_HUNT_COOLDOWN;hog.state='grazing';
   }
   return true;
  }
 }else{
  if(hog.huntCooldown>0)return false;
  state.scan-=delta;if(state.scan>0)return false;state.scan=1;
  state.prey=choosePrey(world,hog,ground);if(!state.prey)return false;
  state.age=0;state.stalled=0;hog.huntPreyId=state.prey.id;
 }
 const prey=state.prey,distance=Math.hypot(prey.x-hog.x,prey.y-hog.y),direction=Math.atan2(prey.y-hog.y,prey.x-hog.x);
 hog.state=distance>180?'stalking':'chasing';
 if(distance<=46&&Math.abs(wrap(direction-hog.heading))<.4&&hogwongHuntPathClear(world,hog,prey,ground,hog.huntPlatformId)){
  // Claim synchronously. A second Hogwong or squid cannot consume this bird.
  if(!prey.squidHeldBy&&!(prey.squidRespawnIn>0)){prey.squidHeldBy=ownerId(hog);state.claimed=true;state.bite=0;hog.biteProgress=0;hog.speed=0;hog.state='biting';}
  return true;
 }
 if(chase(world,hog,prey,delta,ground))state.stalled=0;else state.stalled+=delta;
 if(state.stalled>2){releaseHogwongHunt(world,hog);hog.huntCooldown=3;return false;}
 return true;
}
