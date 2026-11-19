import {wreckWingHeight} from './wreck-wings.js';
import {getPenguinNestSites,getPenguinNestEggs} from './penguin-nest-sites.js';
import {wreckLocalPoint,wreckWorldPoint} from './wreck-interior.js';
import {wreckBodyPathClear,wreckWingBodyPathClear} from './wreck-collision.js';
import {steerPenguin} from './penguin-steering.js';
import {PENGUIN_WATER_STATES} from './penguin-diving.js';
import {penguinBodySeparation,stepPenguinOnWing,isPenguinChickPosition} from './penguin-lifecycle.js';
import {updateHaulerBird} from './hauler-birds.js';

/** @typedef {{id:string,nestId:string,x:number,y:number,z:number}} PenguinEgg */
/** @typedef {{id:string,kind:'wing'|'ice'|'hauler',index:number,localX?:number,localZ?:number,x:number,y:number,z:number,surfaceZ:number,colony:number,platformId:string,exitX?:number,exitY?:number,sitterId:string|null,pendingSitterId:string|null,lastSitterId:string|null,turnTime:number,turnDuration:number}} PenguinNest */
/** @typedef {{nestId:string,colony:number,x:number,y:number,z:number,remaining:number,escapeTime:number,peckCooldown:number}} PenguinNestDefense */

export const PENGUIN_EGG_LAY_SECONDS=45;
const body={radius:10,height:36};
const available=bird=>bird&&!bird.squidHeldBy&&!(bird.squidRespawnIn>0);
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const active=(world,bird)=>available(bird)&&near(world.player,bird)<=2000;
const encounter=world=>world.squidEncounter||world.centipedeEncounter||world.treeStalkerEncounter;
const birdById=(world,id)=>(world.penguins??[]).find(bird=>bird.id===id);
const nestById=(world,id)=>(world.penguinNests??[]).find(nest=>nest.id===id);

/** Fixed wing and island slots are independent of occupancy/taken state.
 * @returns {PenguinEgg[]} */
export function getPenguinEggs(world){
 return getPenguinNestEggs(world);
}

/** Authored access stays outboard of the engines. A short step over the low
 * trailing lip leads onto the actual sloping wing; swaps walk both directions. */
function nestRoute(world,nest,ground){
 const local=[[8.15,-7.35],[8.15,-6.95],[8.15,-6.35],[8.15,-5.95],
  ...(nest.index===0?[[8.2,-4.8],[7.65,-3.6]]:[]),[nest.localX,nest.localZ]];
 return local.map(([x,z],index)=>{
  const p=wreckWorldPoint(world.ship,x,z),surface=wreckWingHeight(x,z);
  return {...p,z:index===0?(ground(world,p.x,p.y,nest.platformId)??(world.ship.z??0)):
   (world.ship.z??0)+(index===1?.31:surface+.04)*25};
 });
}

/** Initialize once per freshly prepared world, before feeding snapshots. */
export function initializePenguinNests(world){
 world.takenPenguinEggs??={};world.penguinEggLaying={};world.penguinNestDefense=null;world.penguinBitten=false;
 const birds=world.penguins??[];
 const sites=getPenguinNestSites(world);
 world.penguinNests=sites.map(nest=>{
  const colony=birds.filter(bird=>bird.colony===nest.colony&&!bird.offspringId);
  const bird=colony[colony.length-sites.filter(site=>site.colony===nest.colony).length+nest.index];
  const record={...nest,
   sitterId:bird?.id??null,pendingSitterId:null,lastSitterId:null,turnTime:0,turnDuration:20+nest.index*3};
  if(bird){
   Object.assign(bird,{x:record.x,y:record.y,z:nest.kind==='ice'?record.surfaceZ:record.z,nestId:record.id,nestRouteIndex:null,
    state:'nesting',nestCrouch:1,pitch:0,speed:0,nestTurns:1,returningHome:false});
   if(nest.kind!=='ice')bird.feetSurfaceZ=bird.z;else delete bird.feetSurfaceZ;
  }
  return record;
 });
 return world;
}

function depart(world,bird,nest){
 if(nest.sitterId===bird.id){nest.sitterId=null;nest.lastSitterId=bird.id;}
 if(nest.pendingSitterId===bird.id)nest.pendingSitterId=null;
 if(nest.kind!=='ice'&&bird.state==='to-nest'&&(bird.nestRouteIndex??0)<=1&&bird.feetSurfaceZ===undefined){finishDeparture(bird);return;}
 if(bird.state==='nesting'||nest.kind==='ice')bird.nestRouteIndex=null;
 bird.state='from-nest';bird.nestId=nest.id;bird.navigation=undefined;
}

function finishDeparture(bird){
 delete bird.nestId;delete bird.feetSurfaceZ;delete bird.nestExitIndex;
 bird.nestRouteIndex=null;bird.nestCrouch=0;bird.navigation=undefined;
 bird.state=bird.defendingNestId?'defending':'returning';bird.returningHome=!bird.defendingNestId;bird.diveIn=Math.max(6,bird.diveIn??0);
}

/** Only a successful egg pickup calls this. Colony membership and proximity
 * bound the response; swimming/held/eaten birds keep their existing owner. */
export function alarmPenguinNest(world,nestId){
 const nest=nestById(world,nestId);if(!nest)return false;
 world.penguinNestDefense={nestId,colony:nest.colony,x:nest.x,y:nest.y,z:nest.z,remaining:18,escapeTime:0,
  peckCooldown:world.penguinNestDefense?.peckCooldown??0};
 for(const bird of world.penguins??[]){
  if(!available(bird)||bird.offspringId&&bird.growth<1||bird.colony!==nest.colony||near(bird,nest)>650||PENGUIN_WATER_STATES.has(bird.state))continue;
  bird.defendingNestId=nestId;bird.peckCooldown=0;bird.navigation=undefined;
  if(bird.state==='grown-on-wing')continue;
  const home=nestById(world,bird.nestId);
  if(home)depart(world,bird,home);else bird.state='defending';
 }
 return true;
}

/** Rescue/load cancellation never relocates birds. Wing walkers finish their
 * departure before returning to their usual ice colony. */
export function clearPenguinDefense(world){
 world.penguinNestDefense=null;world.penguinBitten=false;
 for(const bird of world.penguins??[]){
  if(!available(bird)||!bird.defendingNestId&&!(bird.peckTime>0)&&bird.state!=='defending')continue;
  delete bird.defendingNestId;bird.peckTime=0;
  if(bird.state==='defending'){bird.state='returning';bird.returningHome=true;bird.diveIn=Math.max(5,bird.diveIn??0);}
 }
}

function reserveSitter(world,nest){
 const candidate=(world.penguins??[]).filter(bird=>active(world,bird)&&bird.colony===nest.colony&&!bird.nestId&&!bird.defendingNestId
  &&(!bird.offspringId||bird.growth>=1)&&bird.id!==nest.lastSitterId&&!PENGUIN_WATER_STATES.has(bird.state)&&near(bird,nest)<750)
  .sort((a,b)=>(a.nestTurns??0)-(b.nestTurns??0)||a.id.localeCompare(b.id))[0];
 if(!candidate)return false;
 nest.pendingSitterId=candidate.id;
 Object.assign(candidate,{nestId:nest.id,state:'to-nest',nestRouteIndex:0,nestCrouch:0,pitch:0,navigation:undefined});
 return true;
}

/** Each missing slot earns brood time only under an actual available sitter.
 * Progress belongs to the slot, so rotating parents can finish the same egg. */
function layPenguinEggs(world,nest,sitter,dt){
 if(!active(world,sitter)||near(sitter,nest)>4||Math.abs(sitter.z-nest.z)>3)return;
 const progress=world.penguinEggLaying??={};
 for(let slot=0;slot<2;slot++){
  const id=`${nest.id}-egg-${slot}`;
  if(world.takenPenguinEggs?.[id]!==true){delete progress[id];continue;}
  const before=Number.isFinite(progress[id])?Math.max(0,progress[id]):0;
  progress[id]=Math.min(PENGUIN_EGG_LAY_SECONDS,before+dt);
  if(progress[id]>=PENGUIN_EGG_LAY_SECONDS){delete world.takenPenguinEggs[id];delete progress[id];}
 }
}

/** Shared clocks advance once, under the same activity/pause rules as birds. */
export function updatePenguinNests(world,dt,ground){
 if(!Number.isFinite(dt)||dt<=0)return;
 world.penguinBitten=false;
 const defense=world.penguinNestDefense;
 if(defense&&near(world.player,defense)>2000)world.penguinNestDefense=null;
 if(defense&&near(world.player,defense)<=2000){
  if(encounter(world)){clearPenguinDefense(world);}
  else{
   defense.remaining-=dt;defense.peckCooldown=Math.max(0,defense.peckCooldown-dt);
   const escaped=world.player.swimming||near(world.player,defense)>650||Math.abs(world.player.z-defense.z)>150;
   defense.escapeTime=escaped?defense.escapeTime+dt:0;
   if(defense.remaining<=0||defense.escapeTime>=2.5)clearPenguinDefense(world);
  }
 }
 for(const nest of world.penguinNests??[]){
  if(near(world.player,nest)>2000)continue;
  const sitter=birdById(world,nest.sitterId),pending=birdById(world,nest.pendingSitterId);
  if(!available(sitter)||sitter.nestId!==nest.id||sitter.state!=='nesting')nest.sitterId=null;
  if(!available(pending)||pending.nestId!==nest.id||pending.state!=='to-nest')nest.pendingSitterId=null;
  if(world.penguinNestDefense)continue;
  if(nest.sitterId){
   layPenguinEggs(world,nest,sitter,dt);
   nest.turnTime+=dt;
   if(nest.turnTime>=nest.turnDuration&&reserveSitter(world,nest))depart(world,sitter,nest);
  }else if(!nest.pendingSitterId)reserveSitter(world,nest);
 }
}

function routeStep(world,bird,target,speed,dt){
 const dx=target.x-bird.x,dy=target.y-bird.y,dz=target.z-bird.z,length=Math.hypot(dx,dy,dz),step=Math.min(speed*dt,length);
 if(length<1e-7)return true;
 const candidate={x:bird.x+dx/length*step,y:bird.y+dy/length*step,z:bird.z+dz/length*step};
 const around=()=>{
  const local=wreckLocalPoint(world.ship,bird.x,bird.y),destination=wreckLocalPoint(world.ship,target.x,target.y);
  return isPenguinChickPosition(local.x,local.z)&&isPenguinChickPosition(destination.x,destination.z)
   ?stepPenguinOnWing(world,bird,target,speed,dt):false;
 };
 if(!wreckWingBodyPathClear(world.ship,bird,candidate,body))return around();
 for(const other of world.penguins??[]){
  if(other===bird||!available(other)||PENGUIN_WATER_STATES.has(other.state)||Math.abs(other.z-candidate.z)>18)continue;
  if(near(candidate,other)<penguinBodySeparation(bird,other)&&near(candidate,other)<=near(bird,other)+1e-5){
   return around();
  }
 }
 Object.assign(bird,candidate);bird.feetSurfaceZ=bird.z;bird.speed=step/dt;
 if(Math.hypot(dx,dy)>1e-7){const heading=Math.atan2(dy,dx),turn=Math.atan2(Math.sin(heading-bird.heading),Math.cos(heading-bird.heading));bird.heading+=Math.max(-dt*4,Math.min(dt*4,turn));}
 return step===length;
}

function peck(world,bird,wing=false){
 const defense=world.penguinNestDefense,player=world.player;if(!defense)return;
 const clear=wing?wreckWingBodyPathClear:wreckBodyPathClear;
 if(!encounter(world)&&!player.swimming&&player.health>0&&Math.abs(player.z-bird.z)<35&&near(player,bird)<27
  &&defense.peckCooldown<=0&&clear(world.ship,bird,{x:player.x,y:player.y,z:bird.z},body)){
  player.health=Math.max(0,player.health-9);world.penguinBitten=true;defense.peckCooldown=.9;bird.peckTime=1;
 }
}

/** Island bowls have wide, supported ground approaches and independent outer
 * departure lanes. They never borrow the wreck's narrow elevated access route. */
function updateIceNestPenguin(world,bird,nest,dt,ground){
 delete bird.feetSurfaceZ;
 if(bird.state==='nesting'){
  bird.nestCrouch=Math.min(1,bird.nestCrouch+dt*6);return;
 }
 const outgoing=bird.state==='from-nest';
 if(outgoing&&bird.defendingNestId){
  finishDeparture(bird);
  steerPenguin(world,bird,world.player,39,dt,ground,false);peck(world,bird);
 }else{
  bird.nestRouteIndex??=0;
  const route=outgoing?[{x:nest.exitX,y:nest.exitY}]:[{x:nest.x,y:nest.y-24},nest];
  const target=route[bird.nestRouteIndex];
  const previous=birdById(world,nest.lastSitterId);
  // A replacement waits outside the bowl until its previous sitter clears it.
  const occupied=!outgoing&&bird.nestRouteIndex===1&&previous?.state==='from-nest'&&near(previous,nest)<22;
  if(!occupied)steerPenguin(world,bird,target,25,dt,ground,false);
  if(!occupied&&near(bird,target)<1e-5){
   bird.navigation=undefined;bird.nestRouteIndex++;
   if(bird.nestRouteIndex>=route.length){
    if(outgoing)finishDeparture(bird);
    else{
     bird.state='nesting';bird.nestTurns=(bird.nestTurns??0)+1;bird.nestRouteIndex=null;
     nest.sitterId=bird.id;nest.pendingSitterId=null;nest.turnTime=0;
    }
   }
  }
 }
 bird.stride+=bird.speed*dt/25*9;
}

/** Returns true whenever nesting/defense owns movement, before dive steering. */
export function updateNestPenguin(world,bird,dt,ground){
 if(!active(world,bird)||!Number.isFinite(dt)||dt<=0)return false;
 bird.peckTime=Math.max(0,(bird.peckTime??0)-dt/.32);
 bird.nestCrouch=Math.max(0,(bird.nestCrouch??0)-dt*3);
 if(bird.defendingNestId&&!world.penguinNestDefense){
  delete bird.defendingNestId;
  if(bird.state==='defending'){bird.state='returning';bird.returningHome=true;}
 }
 let nest=nestById(world,bird.nestId);
 if(nest&&bird.state==='nesting'&&nest.sitterId!==bird.id)depart(world,bird,nest);
 if(bird.haulerNestId)return updateHaulerBird(world,bird,dt);
 if(nest&&['nesting','to-nest','from-nest'].includes(bird.state)){
  bird.pitch=0;
  if(nest.kind==='ice'){updateIceNestPenguin(world,bird,nest,dt,ground);return true;}
  if(bird.state==='nesting'){bird.nestCrouch=Math.min(1,bird.nestCrouch+dt*6);bird.feetSurfaceZ=bird.z;return true;}
  const route=nestRoute(world,nest,ground),outgoing=bird.state==='from-nest';
  if(outgoing&&bird.defendingNestId&&world.penguinNestDefense&&!world.player.swimming){
   const local=wreckLocalPoint(world.ship,world.player.x,world.player.y),surface=wreckWingHeight(local.x,local.z);
   const here=wreckLocalPoint(world.ship,bird.x,bird.y),floor=wreckWingHeight(here.x,here.z);
   if(surface!==null&&floor!==null&&Math.abs(world.player.z-((world.ship.z??0)+surface*25))<35){
    const target={x:world.player.x,y:world.player.y,z:(world.ship.z??0)+(surface+.04)*25};
    if(near(bird,target)>18)routeStep(world,bird,target,42,dt);
    peck(world,bird,true);bird.stride+=bird.speed*dt/25*9;return true;
   }
  }
  if(outgoing&&bird.nestExitIndex!==undefined){
   const exit=wreckWorldPoint(world.ship,10.3,bird.nestExitIndex===0?-7.4:-1.3);
   steerPenguin(world,bird,exit,25,dt,ground,false);
   if(near(bird,exit)<2&&++bird.nestExitIndex>1)finishDeparture(bird);
   bird.stride+=bird.speed*dt/25*9;return true;
  }
  if(bird.nestRouteIndex===null||bird.nestRouteIndex===undefined)bird.nestRouteIndex=outgoing?route.length-2:0;
  if(!outgoing&&bird.nestRouteIndex===0){
   const departing=(world.penguins??[]).some(other=>available(other)&&other.state==='from-nest'&&other.colony===nest.colony&&other.nestExitIndex===undefined);
   const target=departing?wreckWorldPoint(world.ship,11.4+nest.index*.7,-7.8-nest.index*.8):route[0];
   steerPenguin(world,bird,target,25,dt,ground,false);
   if(!departing&&near(bird,route[0])<1.5)bird.nestRouteIndex=1;
  }else if(!outgoing&&bird.nestRouteIndex===1&&(world.penguins??[]).some(other=>available(other)&&other.state==='from-nest'&&other.colony===nest.colony&&other.nestExitIndex===undefined)){
   // One narrow access lane: let departing sitters reach the ice first.
  }else if(routeStep(world,bird,route[bird.nestRouteIndex],bird.defendingNestId?42:25,dt)){
   bird.nestRouteIndex+=outgoing?-1:1;
   if(outgoing&&bird.nestRouteIndex<0){
    delete bird.feetSurfaceZ;
    if(bird.defendingNestId)finishDeparture(bird);else bird.nestExitIndex=0;
   }else if(!outgoing&&bird.nestRouteIndex>=route.length){
    bird.state='nesting';bird.nestTurns=(bird.nestTurns??0)+1;nest.sitterId=bird.id;nest.pendingSitterId=null;nest.turnTime=0;bird.nestRouteIndex=null;
   }
  }
  bird.stride+=bird.speed*dt/25*9;return true;
 }
 if(bird.defendingNestId&&world.penguinNestDefense){
  bird.state='defending';bird.returningHome=false;bird.pitch=0;
  steerPenguin(world,bird,world.player,39,dt,ground,false);bird.stride+=bird.speed*dt/25*9;
  peck(world,bird);
  return true;
 }
 if(bird.defendingNestId){delete bird.defendingNestId;bird.state='returning';bird.returningHome=true;}
 if(bird.feetSurfaceZ!==undefined)delete bird.feetSurfaceZ;
 return false;
}
