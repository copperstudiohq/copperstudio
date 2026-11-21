import {PREPARED_BASIN_BIRDS} from './basin-expansion-data.js';
import {PREPARED_PENGUINS} from './penguin-data.js';
import {WRECK_WING_NESTS,wreckWingHeight} from './wreck-wings.js';
import {wreckWorldPoint,wreckLocalPoint} from './wreck-interior.js';
import {wreckBodyPenetration,wreckBodyPathClear,wreckWingBodyPathClear} from './wreck-collision.js';
import {highestIceAt,getIceSurfaceHeight} from './ice-surface.js';
import {WATER_LEVEL} from './terrain.js';
import {getPenguinNestSites,PENGUIN_NEST_IDS,PENGUIN_EGG_IDS} from './penguin-nest-sites.js';
import {PREPARED_HAULER_BIRDS,haulerBirdNurseryPoint,stepHaulerBird} from './hauler-birds.js';
import {LARGE_GLACIER_WRECK_SITE} from './large-glacier-wreck.js';

export const PENGUIN_EGG_HATCH_SECONDS=60;
export const PENGUIN_CHICK_GROW_SECONDS=150;
export const MAX_CROBON_OFFSPRING=8;
/** @typedef {{id:string,nestId:string,age:number,localX:number,localZ:number}} PenguinOffspring */
/** @typedef {{incubation:Record<string,number>,offspring:PenguinOffspring[]}} PenguinBrood */
const offspringIds=Array.from({length:MAX_CROBON_OFFSPRING},(_,index)=>`crobon-hatchling-${index}`);
const eggIds=PENGUIN_EGG_IDS;
const available=bird=>bird&&!bird.lifecycleInactive&&!bird.squidHeldBy&&!(bird.squidRespawnIn>0);
const active=(world,bird)=>available(bird)&&Math.hypot(world.player.x-bird.x,world.player.y-bird.y)<=2000;
const wrap=value=>Math.atan2(Math.sin(value),Math.cos(value));
const clamp=(value,max=1)=>Math.max(0,Math.min(max,value));
const validationShip={x:0,y:0,z:0,yaw:0,designVersion:2};
const adultBody={radius:10,height:36};
const turns=[0,.4,-.4,.8,-.8,1.25,-1.25,1.8,-1.8,2.4,-2.4,Math.PI];
const nurseryRadius=3;

/** One shared growth rule drives body size, fur rendering and crowd clearance. */
export function penguinGrowthScale(bird){
 return bird.offspringId&&Number.isFinite(bird.growth) ? .38+.62*clamp(bird.growth) : 1;
}

/** Adults retain their established fifteen-unit social spacing. */
export const penguinBodySeparation=(bird,other)=>7.5*(penguinGrowthScale(bird)+penguinGrowthScale(other));

/** Restorable chick positions must support a complete adult footprint on the
 * right wing and clear the same solid hull and engines as moving wildlife. */
export function isPenguinChickPosition(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z)||x<5.65||x>8.4||z<-6||z>-2.1)return false;
 const height=wreckWingHeight(x,z);if(height===null)return false;
 for(let index=0;index<8;index++)if(wreckWingHeight(x+Math.cos(index*Math.PI/4)*.42,z+Math.sin(index*Math.PI/4)*.42)===null)return false;
 return wreckBodyPenetration(validationShip,{x:x*25,y:z*25,z:(height+.04)*25},adultBody,true)<1e-8;
}

/** Ice records store metre offsets from their own fixed bowl. Support the full
 * adult footprint so growth cannot strand a chick on an edge or steep seam. */
function iceChickPoint(world,nest,localX,localZ){
 if(!Number.isFinite(localX)||!Number.isFinite(localZ)||Math.hypot(localX,localZ)>nurseryRadius)return null;
 const x=nest.x+localX*25,y=nest.y+localZ*25,ice=highestIceAt(world.platforms??[],x,y);
 if(ice?.id!==nest.platformId)return null;
 const z=getIceSurfaceHeight(ice,x,y);if(z<WATER_LEVEL+5)return null;
 for(let index=0;index<8;index++){
  const px=x+Math.cos(index*Math.PI/4)*10.5,py=y+Math.sin(index*Math.PI/4)*10.5,edge=highestIceAt(world.platforms,px,py);
  if(edge?.id!==nest.platformId||Math.abs(getIceSurfaceHeight(edge,px,py)-z)>7)return null;
 }
 const point={x,y,z};return wreckBodyPenetration(world.ship,point,adultBody)<1e-8?point:null;
}

/** Pure durable-position validation shared by restore and the save codec.
 * Wing offsets retain the original ship-local meaning; ice offsets are relative
 * to the named nest, never to a roaming adult's current position. */
export function isPenguinOffspringPosition(world,nestId,localX,localZ){
 if(!PENGUIN_NEST_IDS.includes(nestId))return false;
 if(nestId.startsWith('wing-nest-'))return isPenguinChickPosition(localX,localZ);
 const nest=getPenguinNestSites(world).find(site=>site.id===nestId);
 if(nest?.kind==='hauler')return Boolean(haulerBirdNurseryPoint(nest,localX,localZ));
 return Boolean(nest&&iceChickPoint(world,nest,localX,localZ));
}

const wingPoint=(world,x,z)=>({...wreckWorldPoint(world.ship,x,z),z:(world.ship.z??0)+(wreckWingHeight(x,z)+.04)*25});
const wingSites=[];
for(let z=-2.4;z>=-5.8;z-=.4)for(let x=5.8;x<=8.2;x+=.4)if(isPenguinChickPosition(x,z))wingSites.push({x,z});

function safeCrowdStep(world,bird,from,to,margin=0){
 for(const other of world.penguins??[]){
  if(other===bird||!available(other)||Math.abs(other.z-to.z)>18)continue;
  const gap=Math.hypot(to.x-other.x,to.y-other.y),before=Math.hypot(from.x-other.x,from.y-other.y);
  if(gap<penguinBodySeparation(bird,other)+margin&&gap<=before+1e-6)return false;
 }
 return true;
}

function spawnSite(world,nest,bird){
 if(nest.kind==='hauler'){
  for(const z of[-.9,.9,-1.35,1.35,-1.8,1.8]){
   const point=haulerBirdNurseryPoint(nest,0,z);
   if(point&&safeCrowdStep(world,bird,point,point,2))return {x:0,z};
  }
  return null;
 }
 if(nest.kind==='ice'){
  // Near rings leave the sitting parent room while keeping the hatch at its bowl.
  for(const radius of [.65,1,1.4,1.9,2.4,2.8])for(let index=0;index<16;index++){
   const angle=index*Math.PI/8+(nest.index??0)*.3,site={x:Math.cos(angle)*radius,z:Math.sin(angle)*radius};
   const point=iceChickPoint(world,nest,site.x,site.z);
   if(point&&safeCrowdStep(world,bird,point,point,2))return site;
  }
  return null;
 }
 const ordered=wingSites.map(site=>({...site,distance:Math.hypot(site.x-nest.localX,site.z-nest.localZ)})).sort((a,b)=>a.distance-b.distance);
 for(const site of ordered){
  const point=wingPoint(world,site.x,site.z);
  if(safeCrowdStep(world,bird,point,point,2))return site;
 }
 return null;
}

function makeOffspringBird(world,record){
 const index=offspringIds.indexOf(record.id),nest=getPenguinNestSites(world).find(item=>item.id===record.nestId);
 if(!nest)return null;
 const templates=[...PREPARED_PENGUINS,...PREPARED_BASIN_BIRDS,...PREPARED_HAULER_BIRDS].filter(bird=>bird.colony===nest.colony),template=templates[index%templates.length];
 if(!template)return null;
 const bird=structuredClone(template),grown=record.age>=PENGUIN_CHICK_GROW_SECONDS;
 if(nest.kind==='wing'){
  const home=wreckWorldPoint(world.ship,8.2+index%4*1.15,.4+Math.floor(index/4)*1.15),ice=highestIceAt(world.platforms??[],home.x,home.y);
  if(ice?.id===template.platformId){
   const z=getIceSurfaceHeight(ice,home.x,home.y);
   if(wreckBodyPenetration(world.ship,{...home,z},adultBody)<1e-8)Object.assign(bird,{homeX:home.x,homeY:home.y,...home,z});
  }
 }
 Object.assign(bird,{id:record.id,offspringId:record.id,growth:clamp(record.age/PENGUIN_CHICK_GROW_SECONDS),
  phase:index*.71,seed:101+index*2.71,stride:0,speed:0,pitch:0,diveIn:12+index,wetness:0,nestCrouch:0,
  state:grown?'returning':'chick',returningHome:grown});
 if(nest.kind==='hauler'){
  const point=haulerBirdNurseryPoint(nest,record.localX,record.localZ);if(!point)return null;
  Object.assign(bird,point,{feetSurfaceZ:point.z,roostSide:record.localZ<0?-1:1});
 }else if(nest.kind==='ice'){
  const point=iceChickPoint(world,nest,record.localX,record.localZ);if(!point)return null;
  Object.assign(bird,point);delete bird.feetSurfaceZ;
 }else if(!grown){Object.assign(bird,wingPoint(world,record.localX,record.localZ));bird.feetSurfaceZ=bird.z;}
 return bird;
}

export function initializePenguinBrood(world){
 world.penguinBrood={incubation:{},offspring:[]};return world;
}

/** Consuming a dynamic offspring frees its fixed pool slot for a later hatch.
 * Prepared colony adults and unrelated wildlife can never be removed here. */
export function removePenguinOffspring(world,id){
 const bird=(world.penguins??[]).find(item=>item.id===id&&item.offspringId===id);
 if(!bird||!offspringIds.includes(id))return false;
 world.penguins=world.penguins.filter(item=>item!==bird);
 if(world.penguinBrood)world.penguinBrood.offspring=world.penguinBrood.offspring.filter(record=>record.id!==id);
 return true;
}

/** Copy only durable bounded fields, never navigation, tail chains or ownership. */
export function snapshotPenguinBrood(world){
 const brood=world.penguinBrood??{incubation:{},offspring:[]};
 return {incubation:Object.fromEntries(eggIds.filter(id=>world.takenPenguinEggs?.[id]!==true&&Number.isFinite(brood.incubation?.[id]))
  .map(id=>[id,clamp(brood.incubation[id],PENGUIN_EGG_HATCH_SECONDS)])),
 offspring:(brood.offspring??[]).slice(0,MAX_CROBON_OFFSPRING).map(({id,nestId,age,localX,localZ})=>({id,nestId,age,localX,localZ}))};
}

/** Rehydrate from prepared adults so loading cannot duplicate pooled birds or
 * retain a stale encounter's navigation/ownership. Adults resume on colony ice. */
export function restorePenguinBrood(world,brood){
 world.penguins=(world.penguins??[]).filter(bird=>!offspringIds.includes(bird.id)&&!bird.offspringId);
 initializePenguinBrood(world);
 const restored=world.penguinBrood,seen=new Set();
 for(const id of eggIds){
  const value=brood?.incubation?.[id];
  if(world.takenPenguinEggs?.[id]!==true&&Number.isFinite(value)&&value>=0&&value<=PENGUIN_EGG_HATCH_SECONDS)restored.incubation[id]=value;
 }
 for(const value of (brood?.offspring??[]).slice(0,MAX_CROBON_OFFSPRING)){
  if(!offspringIds.includes(value?.id)||seen.has(value.id)||!PENGUIN_NEST_IDS.includes(value.nestId)
   ||!Number.isFinite(value.age)||value.age<0||value.age>PENGUIN_CHICK_GROW_SECONDS
   ||!Number.isFinite(value.localX)||!Number.isFinite(value.localZ)
   ||(value.age<PENGUIN_CHICK_GROW_SECONDS||!value.nestId.startsWith('wing-nest-'))
    &&!isPenguinOffspringPosition(world,value.nestId,value.localX,value.localZ))continue;
  const {id,nestId,age,localX,localZ}=value,record={id,nestId,age,localX,localZ},bird=makeOffspringBird(world,record);
  if(!bird)continue;
  seen.add(id);restored.offspring.push(record);world.penguins.push(bird);
 }
 return world;
}

/** Incubation earns seconds only from a nearby, available, actual sitter. A full
 * pool leaves eggs present and edible rather than discarding another hatch. */
export function updatePenguinBrood(world,dt,ground){
 if(!Number.isFinite(dt)||dt<=0||!world.ship||!world.penguinBrood)return;
 const brood=world.penguinBrood;
 for(const id of eggIds)if(world.takenPenguinEggs?.[id]===true)delete brood.incubation[id];
 if(world.penguinNestDefense||world.squidEncounter||world.centipedeEncounter||world.treeStalkerEncounter)return;
 for(const nest of world.penguinNests??[]){
  const sitter=(world.penguins??[]).find(bird=>bird.id===nest.sitterId);
  if(!active(world,sitter)||sitter.state!=='nesting'||sitter.nestId!==nest.id
   ||Math.hypot(sitter.x-nest.x,sitter.y-nest.y)>4||Math.abs(sitter.z-nest.z)>3)continue;
  for(let slot=0;slot<2;slot++){
   const eggId=`${nest.id}-egg-${slot}`;if(world.takenPenguinEggs?.[eggId]===true)continue;
   const previous=Number.isFinite(brood.incubation[eggId])?Math.max(0,brood.incubation[eggId]):0;
   brood.incubation[eggId]=Math.min(PENGUIN_EGG_HATCH_SECONDS,previous+dt);
   if(brood.incubation[eggId]<PENGUIN_EGG_HATCH_SECONDS||brood.offspring.length>=MAX_CROBON_OFFSPRING)continue;
   const id=offspringIds.find(candidate=>!brood.offspring.some(record=>record.id===candidate));
   const probe={id,offspringId:id,growth:0},site=spawnSite(world,nest,probe);if(!id||!site)continue;
   const record={id,nestId:nest.id,age:0,localX:site.x,localZ:site.z},bird=makeOffspringBird(world,record);if(!bird)continue;
   world.takenPenguinEggs??={};world.takenPenguinEggs[eggId]=true;delete brood.incubation[eggId];
   brood.offspring.push(record);world.penguins.push(bird);
  }
 }
}

/** A deterministic local goal avoids nest bowls and the outboard access lane. */
function chickGoal(world,bird,record){
 const candidates=wingSites.filter(site=>site.x<7.4&&WRECK_WING_NESTS.every(nest=>Math.hypot(site.x-nest.x,site.z-nest.z)>.8));
 const walkers=(world.penguins??[]).filter(other=>other!==bird&&available(other)&&['to-nest','from-nest'].includes(other.state)
  &&other.feetSurfaceZ!==undefined&&Math.hypot(other.x-bird.x,other.y-bird.y)<32);
 if(walkers.length){
  let best=null;
  for(const site of candidates){
   const point=wingPoint(world,site.x,site.z),clearance=Math.min(...walkers.map(other=>Math.hypot(point.x-other.x,point.y-other.y)));
   const score=clearance-Math.hypot(point.x-bird.x,point.y-bird.y)*.25;
   if(!best||score>best.score)best={...site,score};
  }
  if(best)return best;
 }
 const index=(Math.floor((record.age+(bird.wingWaitTime??0))/5)+offspringIds.indexOf(record.id)*7)%candidates.length;
 return candidates[index]??{x:record.localX,z:record.localZ};
}

const iceNurseries=new WeakMap();
function iceChickGoal(world,bird,record,nest){
 let nurseries=iceNurseries.get(world);if(!nurseries){nurseries=new Map();iceNurseries.set(world,nurseries);}
 let candidates=nurseries.get(nest.id);
 if(!candidates){
  const bowls=getPenguinNestSites(world).filter(site=>site.kind==='ice'&&site.colony===nest.colony);
  candidates=[];
  for(const radius of [1.2,2,2.7])for(let index=0;index<16;index++){
   const angle=index*Math.PI/8,site={x:Math.cos(angle)*radius,z:Math.sin(angle)*radius},point=iceChickPoint(world,nest,site.x,site.z);
   if(point&&bowls.every(bowl=>Math.hypot(point.x-bowl.x,point.y-bowl.y)>21))candidates.push({...site,point});
  }
  nurseries.set(nest.id,candidates);
 }
 const neighbours=(world.penguins??[]).filter(other=>other!==bird&&available(other)&&Math.abs(other.z-bird.z)<18
  &&Math.hypot(other.x-bird.x,other.y-bird.y)<24);
 if(neighbours.length){
  let best=null;
  for(const site of candidates){
   const clearance=Math.min(...neighbours.map(other=>Math.hypot(site.point.x-other.x,site.point.y-other.y)));
   const score=clearance-Math.hypot(site.point.x-bird.x,site.point.y-bird.y)*.25;
   if(!best||score>best.score)best={...site,score};
  }
  if(best)return best;
 }
 const index=(Math.floor(record.age/5)+offspringIds.indexOf(record.id)*7)%candidates.length;
 return candidates[index]??{x:record.localX,z:record.localZ};
}

/** Ground chicks use their own bounded nursery, including sideways/backward
 * crowd escapes. Every accepted pose supports an adult on the same island. */
function stepPenguinOnIce(world,bird,nest,target,speed,dt){
 const dx=target.x-bird.x,dy=target.y-bird.y,distance=Math.hypot(dx,dy),heading=Math.atan2(dy,dx),step=Math.min(speed*dt,distance);
 if(step<1e-8)return;
 const scale=penguinGrowthScale(bird),body={radius:10*scale,height:36*scale};let best=null;
 for(const turn of turns){
  const angle=heading+turn;let x=bird.x+Math.cos(angle)*step,y=bird.y+Math.sin(angle)*step;
  let point=iceChickPoint(world,nest,(x-nest.x)/25,(y-nest.y)/25);if(!point)continue;
  const length=Math.hypot(point.x-bird.x,point.y-bird.y,point.z-bird.z);
  if(length>step){
   const fraction=step/length;x=bird.x+(x-bird.x)*fraction;y=bird.y+(y-bird.y)*fraction;
   point=iceChickPoint(world,nest,(x-nest.x)/25,(y-nest.y)/25);if(!point)continue;
  }
  if(Math.abs(point.z-bird.z)>step*.8+.05||!wreckBodyPathClear(world.ship,bird,point,body)
   ||!safeCrowdStep(world,bird,bird,point))continue;
  let escape=0;
  for(const other of world.penguins??[])if(other!==bird&&available(other)&&Math.abs(other.z-bird.z)<18){
   const before=Math.hypot(bird.x-other.x,bird.y-other.y);
   if(before<penguinBodySeparation(bird,other)+3)escape+=Math.hypot(point.x-other.x,point.y-other.y)-before;
  }
  const score=distance-Math.hypot(target.x-point.x,target.y-point.y)+escape*5-Math.abs(wrap(angle-bird.heading))*.025;
  if(!best||score>best.score)best={...point,angle,score};
 }
 if(!best)return;
 Object.assign(bird,{x:best.x,y:best.y,z:best.z,speed:Math.hypot(best.x-bird.x,best.y-bird.y,best.z-bird.z)/dt});
 bird.heading+=Math.max(-dt*4,Math.min(dt*4,wrap(best.angle-bird.heading)));
}

/** Wing-only local steering rejects unsupported steps, solid machinery and
 * closing crowd gaps. A blocked chick waits or takes a safe sideways step. */
export function stepPenguinOnWing(world,bird,target,speed,dt){
 const dx=target.x-bird.x,dy=target.y-bird.y,distance=Math.hypot(dx,dy),heading=Math.atan2(dy,dx),step=Math.min(speed*dt,distance);
 const scale=penguinGrowthScale(bird),body={radius:10*scale,height:36*scale};let best=null;
 for(const turn of turns){
  const angle=heading+turn;let x=bird.x+Math.cos(angle)*step,y=bird.y+Math.sin(angle)*step,local=wreckLocalPoint(world.ship,x,y);
  if(!isPenguinChickPosition(local.x,local.z))continue;
  let point=wingPoint(world,local.x,local.z);
  const length=Math.hypot(point.x-bird.x,point.y-bird.y,point.z-bird.z);
  if(length>step){
   const fraction=step/length;x=bird.x+(x-bird.x)*fraction;y=bird.y+(y-bird.y)*fraction;
   local=wreckLocalPoint(world.ship,x,y);point=wingPoint(world,local.x,local.z);
  }
  if(!wreckWingBodyPathClear(world.ship,bird,point,body)||!safeCrowdStep(world,bird,bird,point))continue;
  let escape=0;
  for(const other of world.penguins??[])if(other!==bird&&available(other)&&Math.abs(other.z-bird.z)<18){
   const before=Math.hypot(bird.x-other.x,bird.y-other.y);
   if(before<penguinBodySeparation(bird,other)+3)escape+=Math.hypot(x-other.x,y-other.y)-before;
  }
  const score=distance-Math.hypot(target.x-x,target.y-y)+escape*5-Math.abs(wrap(angle-bird.heading))*.025;
  if(!best||score>best.score)best={...point,angle,score};
 }
 if(!best)return false;
 Object.assign(bird,{x:best.x,y:best.y,z:best.z,feetSurfaceZ:best.z,speed:step/dt});
 bird.heading+=Math.max(-dt*4,Math.min(dt*4,wrap(best.angle-bird.heading)));
 return Math.hypot(target.x-bird.x,target.y-bird.y,target.z-bird.z)<1e-5;
}

/** Chicks own movement until full growth. Ice chicks immediately join adult
 * steering; wing chicks queue for the same outboard departure as sitters. */
export function updateChickPenguin(world,bird,dt,ground){
 if(!bird.offspringId||!world.penguinBrood)return false;
 const record=world.penguinBrood.offspring.find(item=>item.id===bird.offspringId);
 if(!record||record.age>=PENGUIN_CHICK_GROW_SECONDS&&!['chick','grown-on-wing'].includes(bird.state))return false;
 if(!active(world,bird)||!Number.isFinite(dt)||dt<=0)return true;
 const nest=world.penguinNests?.find(item=>item.id===record.nestId)??getPenguinNestSites(world).find(item=>item.id===record.nestId);
 if(!nest)return true;
 record.age=Math.min(PENGUIN_CHICK_GROW_SECONDS,record.age+dt);bird.growth=record.age/PENGUIN_CHICK_GROW_SECONDS;
 if(nest.kind==='hauler'){
  bird.pitch=0;bird.nestCrouch=0;bird.returningHome=false;
  if(record.age>=PENGUIN_CHICK_GROW_SECONDS){bird.state='huddling';delete bird.nestId;return true;}
  bird.state='chick';
  const side=record.localZ<0?-1:1,target=haulerBirdNurseryPoint(nest,0,side*(1.1+.2*Math.sin(record.age*.4)));
  if(target)stepHaulerBird(world,bird,nest,target,8+5*bird.growth,dt);
  const local=wreckLocalPoint(nest.shipPose??LARGE_GLACIER_WRECK_SITE,bird.x,bird.y);
  record.localX=local.x-nest.localX;record.localZ=local.z-nest.localZ;bird.stride+=bird.speed*dt/25*9;
  return true;
 }
 if(nest.kind==='ice'){
  delete bird.feetSurfaceZ;bird.pitch=0;bird.nestCrouch=0;
  if(record.age>=PENGUIN_CHICK_GROW_SECONDS){
   // Keep the last supported nursery offsets durable while the adult roams.
   delete bird.nestId;bird.navigation=undefined;bird.state='returning';bird.returningHome=true;bird.diveIn=Math.max(6,bird.diveIn??0);
   return true;
  }
  bird.state='chick';bird.returningHome=false;
  const goal=iceChickGoal(world,bird,record,nest),target=iceChickPoint(world,nest,goal.x,goal.z);
  if(target)stepPenguinOnIce(world,bird,nest,target,8+5*bird.growth,dt);
  record.localX=(bird.x-nest.x)/25;record.localZ=(bird.y-nest.y)/25;bird.stride+=bird.speed*dt/25*9;
  return true;
 }
 bird.pitch=0;bird.nestCrouch=0;bird.state=record.age>=PENGUIN_CHICK_GROW_SECONDS?'grown-on-wing':'chick';bird.returningHome=false;
 if(bird.state==='grown-on-wing')bird.wingWaitTime=(bird.wingWaitTime??0)+dt;
 const goal=chickGoal(world,bird,record);stepPenguinOnWing(world,bird,wingPoint(world,goal.x,goal.z),8+5*bird.growth,dt);
 const local=wreckLocalPoint(world.ship,bird.x,bird.y);record.localX=local.x;record.localZ=local.z;
 bird.stride+=bird.speed*dt/25*9;
 if(record.age>=PENGUIN_CHICK_GROW_SECONDS){
  bird.nestId=record.nestId;
  const departing=(world.penguins??[]).some(other=>other!==bird&&available(other)&&other.state==='from-nest'
   &&other.nestId?.startsWith('wing-nest-')&&other.nestExitIndex===undefined);
  const arriving=(world.penguins??[]).some(other=>other!==bird&&available(other)&&other.state==='to-nest'&&other.nestId?.startsWith('wing-nest-'));
  const earlier=(world.penguins??[]).some(other=>other!==bird&&available(other)&&other.state==='grown-on-wing'&&other.id<bird.id);
  if(!departing&&!arriving&&!earlier){
   Object.assign(bird,{state:'from-nest',nestRouteIndex:null,navigation:undefined});delete bird.wingWaitTime;
  }
 }
 return true;
}
