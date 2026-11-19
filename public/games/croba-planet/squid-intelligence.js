import {EYE_HEIGHT,WATER_LEVEL,WORLD_BOUNDS,BLUE_OCEAN_START_X} from './terrain.js';
import {getSeabedHeight} from './seabed.js';
import {getForestCollision} from './forest-terrain.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const copy=p=>({x:p.x,y:p.y,z:p.z});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

/** Bounded terrain probes, evaluated at perception cadence rather than each physics step. */
export function squidCanSee(world,from,to,floor=getSeabedHeight){
 const steps=Math.max(1,Math.ceil(distance(from,to)/40));
 for(let i=1;i<=steps;i++){
  const t=i/steps,p={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t,z:from.z+(to.z-from.z)*t};
  if(p.z<floor(p.x,p.y)||getForestCollision(world.forest,p,0))return false;
 }
 return true;
}

/** A sampled observation never reads an unseen target to update search memory.
 * Velocity is capped so a rescue/teleport cannot create a distant interception goal. */
export function observeSquidPlayer(world,squid,brain,dt){
 brain.searchLeft=Math.max(0,(brain.searchLeft??0)-dt);
 brain.sightClock=(brain.sightClock??0)-dt;brain.sampleAge=(brain.sampleAge??0)+dt;
 const p=world.player,eligible=p?.swimming===true&&p.x>=BLUE_OCEAN_START_X
  &&Math.hypot(squid.x-p.x,squid.y-p.y,squid.z-p.z-EYE_HEIGHT)<=1500;
 if(!eligible){brain.visible=false;return false;}
 if(brain.sightClock>0)return Boolean(brain.visible);
 const elapsed=brain.sampleAge??.2;
 brain.sightClock=.2;brain.sampleAge=0;
 const target={x:p.x,y:p.y,z:p.z+EYE_HEIGHT};
 brain.visible=distance(squid,target)<=1500&&squidCanSee(world,squid,target);
 if(brain.visible){
  const old=brain.lastSeen,velocity=old&&brain.searchLeft>0?{x:(target.x-old.x)/elapsed,y:(target.y-old.y)/elapsed,z:(target.z-old.z)/elapsed}:{x:0,y:0,z:0};
  const speed=Math.hypot(velocity.x,velocity.y,velocity.z),scale=speed>250?250/speed:1;
  brain.preyVelocity={x:velocity.x*scale,y:velocity.y*scale,z:velocity.z*scale};
  const lead=clamp(distance(squid,target)/450,0,.8);
  brain.intercept={x:clamp(target.x+brain.preyVelocity.x*lead,BLUE_OCEAN_START_X+1,WORLD_BOUNDS.maxX-1),
   y:clamp(target.y+brain.preyVelocity.y*lead,WORLD_BOUNDS.minY+1,WORLD_BOUNDS.maxY-1),
   z:clamp(target.z+brain.preyVelocity.z*lead,getSeabedHeight(target.x,target.y)+30,Math.max(target.z,WATER_LEVEL-5))};
  brain.lastSeen=target;brain.searchLeft=6;
 }
 return brain.visible;
}

/** Check the last sighting, then sweep outward instead of camping at one coordinate. */
export function squidSearchGoal(squid,brain){
 const age=6-brain.searchLeft;
 if(age<1.5)return copy(brain.lastSeen);
 const angle=(squid.seed??0)*.37+Math.floor((age-1.5)/1.1)*Math.PI*.65;
 const radius=80+Math.min(180,(age-1.5)*40);
 return {x:brain.lastSeen.x+Math.cos(angle)*radius,y:brain.lastSeen.y+Math.sin(angle)*radius,z:brain.lastSeen.z};
}

/** Juveniles remember a nearby threat briefly, giving a sustained escape jet. */
export function juvenileEscapeGoal(world,squid,motion,dt){
 motion.escapeLeft=Math.max(0,(motion.escapeLeft??0)-dt);
 motion.threatClock=(motion.threatClock??0)-dt;
 if(motion.threatClock<=0){
  motion.threatClock=.25;
  const threats=[...(world.adultSquids??[]).filter(a=>!a.squidHeldBy&&!(a.squidRespawnIn>0)),...(world.player?.swimming?[world.player]:[])];
  let nearest=null,gap=Infinity;
  for(const threat of threats){const d=distance(squid,threat),reach=threat===world.player?150:(threat.headRadius??100)+230;if(d<reach&&d<gap){nearest=threat;gap=d;}}
  if(nearest){
   const d=Math.max(1,gap),dx=(squid.x-nearest.x)/d,dy=(squid.y-nearest.y)/d,dz=(squid.z-nearest.z)/d;
   motion.escapeGoal={x:squid.x+(dx||(!dy&&!dz?1:0))*240,y:squid.y+dy*240,z:squid.z+dz*160};motion.escapeLeft=1.5;
  }
 }
 return motion.escapeLeft>0?motion.escapeGoal:null;
}
