import {PREPARED_PENGUINS} from './penguin-data.js';
import {LARGE_GLACIER_WRECK_SITE as SITE} from './large-glacier-wreck.js';
import {LARGE_WRECK_CAB,LARGE_WRECK_SOLIDS,largeWreckCabRoofHeight} from './large-glacier-wreck-anatomy.js';
import {wreckWorldPoint,wreckLocalPoint} from './wreck-interior.js';
import {STARTER_WRECK_SITE,STARTER_ROOF_CARGO} from './wreck-roof-cargo.js';

/** Literal, stable colonies: two roof bowls, two cabin bowls and two cargo bowls. */
export const HAULER_BIRD_NESTS=Object.freeze([
 {id:'hauler-roof-nest-0',zone:'roof',localX:-2.2,localZ:15.5},
 {id:'hauler-roof-nest-1',zone:'roof',localX:2.2,localZ:15.5},
 {id:'hauler-cabin-nest-0',zone:'cabin',localX:-3.3,localZ:13.6},
 {id:'hauler-cabin-nest-1',zone:'cabin',localX:3.3,localZ:13.6},
 {id:'hauler-cargo-nest-0',zone:'cargo',localX:-1.5,localZ:-2.3},
 {id:'hauler-cargo-nest-1',zone:'cargo',localX:1.5,localZ:-2.3},
].map((nest,index)=>Object.freeze({...nest,kind:'hauler',index:0,colony:80+index,platformId:SITE.platformId,radius:.58,phase:index*.73})));
export const STARTER_ROOF_NEST=Object.freeze({id:'starter-roof-crate-nest',kind:'hauler',zone:'starter-roof',shipPose:STARTER_WRECK_SITE,index:0,colony:86,platformId:'outer-ice-12',radius:.58,phase:1.9,localX:STARTER_ROOF_CARGO.x,localZ:STARTER_ROOF_CARGO.z});
export const SHIP_BIRD_NESTS=Object.freeze([...HAULER_BIRD_NESTS,STARTER_ROOF_NEST]);

/** Actual supporting height in render metres, restricted to safe roost floors. */
export function haulerBirdSurface(nest,x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))return null;
 if(nest.zone==='starter-roof')return Math.abs(x)<=.75&&Math.abs(z-STARTER_ROOF_CARGO.z)<=1.8?STARTER_ROOF_CARGO.topY:null;
 if(nest.zone==='roof')return Math.abs(x)<=3.7&&z>=12&&z<=20.8?largeWreckCabRoofHeight(x,z):null;
 const side=Math.sign(nest.localX)*x;
 if(nest.zone==='cabin')return side>=2.4&&side<=3.9&&z>=11.8&&z<=15.7?LARGE_WRECK_CAB.topY:null;
 return side>=.75&&side<=4.45&&z>=-5.2&&z<=.6?1.61:null;
}

export function haulerBirdPoint(nest,x,z){
 const surface=haulerBirdSurface(nest,x,z);if(surface===null)return null;
 const pose=nest.shipPose??SITE;return {...wreckWorldPoint(pose,x,z),z:(pose.z??0)+surface*25+1};
}

/** Full adult clearance keeps growing chicks away from walls, furniture and edges. */
export function haulerBirdNurseryPoint(nest,dx,dz){
 if(![dx,dz].every(Number.isFinite)||Math.hypot(dx,dz)>2)return null;
 const x=nest.localX+dx,z=nest.localZ+dz,point=haulerBirdPoint(nest,x,z);if(!point)return null;
 if(nest.zone==='cargo'&&(Math.sign(nest.localX)*x<1.2||Math.sign(nest.localX)*x>1.8||z< -4.7||z>.1))return null;
 if(nest.zone==='starter-roof')return point;
 const feet=(point.z-SITE.z)/25;
 for(const solid of LARGE_WRECK_SOLIDS){
  const [cx,cy,cz]=solid.center,[sx,sy,sz]=solid.size;
  if(feet>=cy+sy/2-1e-5||feet+1.44<=cy-sy/2)continue;
  if(Math.abs(x-cx)<sx/2+.4&&Math.abs(z-cz)<sz/2+.4)return null;
 }
 return point;
}

export const PREPARED_HAULER_BIRDS=SHIP_BIRD_NESTS.flatMap((nest,index)=>[0,1].map(slot=>{
 const point=haulerBirdPoint(nest,nest.localX,nest.localZ+(slot?0:1.65));
 return {...structuredClone(PREPARED_PENGUINS[0]),id:`hauler-crobon-bird-${index}-${slot}`,colony:nest.colony,
  platformId:nest.platformId,haulerNestId:nest.id,...point,homeX:point.x,homeY:point.y,feetSurfaceZ:point.z,
  phase:index*.7+slot,seed:91+index*2.71+slot,heading:SITE.yaw,roostSide:1};
}));

const available=bird=>!bird.squidHeldBy&&!(bird.squidRespawnIn>0);
const scale=bird=>bird.offspringId ? .38+.62*Math.max(0,Math.min(1,bird.growth??0)) : 1;

/** Bounded, surface-aware waddling uses the existing bird pose and tail physics. */
export function stepHaulerBird(world,bird,nest,target,speed,dt){
 const dx=target.x-bird.x,dy=target.y-bird.y,dz=target.z-bird.z,length=Math.hypot(dx,dy,dz),step=Math.min(speed*dt,length);
 if(length<1e-6)return true;
 const x=bird.x+dx/length*step,y=bird.y+dy/length*step,local=wreckLocalPoint(nest.shipPose??SITE,x,y);
 const point=haulerBirdNurseryPoint(nest,local.x-nest.localX,local.z-nest.localZ);if(!point)return false;
 for(const other of world.penguins??[]){
  if(other===bird||!available(other)||Math.abs(other.z-point.z)>18)continue;
  const gap=Math.hypot(point.x-other.x,point.y-other.y),before=Math.hypot(bird.x-other.x,bird.y-other.y);
  if(gap<7.5*(scale(bird)+scale(other))&&gap<=before+1e-6)return false;
 }
 Object.assign(bird,point,{feetSurfaceZ:point.z,speed:step/dt});
 const turn=Math.atan2(Math.sin(Math.atan2(dy,dx)-bird.heading),Math.cos(Math.atan2(dy,dx)-bird.heading));
 bird.heading+=Math.max(-dt*4,Math.min(dt*4,turn));
 return length<=step+1e-5;
}

/** Ship residents stay on their own elevated floor rather than diving through it. */
export function updateHaulerBird(world,bird,dt){
 const site=SHIP_BIRD_NESTS.find(nest=>nest.id===bird.haulerNestId);if(!site)return false;
 const nest=world.penguinNests?.find(nest=>nest.id===site.id);if(!nest)return true;
 bird.pitch=0;bird.feetSurfaceZ=bird.z;
 if(bird.state==='nesting'&&nest.sitterId===bird.id){bird.nestCrouch=Math.min(1,bird.nestCrouch+dt*6);return true;}
 if(bird.state==='from-nest'){
  if(!bird.roostExitSide){
   const pending=world.penguins.find(other=>other.id===nest.pendingSitterId),local=pending&&wreckLocalPoint(site.shipPose??SITE,pending.x,pending.y);
   bird.roostExitSide=local&&local.z<site.localZ?1:-1;
  }
  const target=haulerBirdPoint(site,site.localX,site.localZ+bird.roostExitSide*1.65);
  if(stepHaulerBird(world,bird,site,target,25,dt)){
   bird.roostSide=bird.roostExitSide;delete bird.roostExitSide;delete bird.nestId;bird.state='huddling';
  }
 }else if(bird.state==='to-nest'){
  const previous=world.penguins.find(other=>other.id===nest.lastSitterId);
  if(!(previous?.state==='from-nest'&&Math.hypot(previous.x-nest.x,previous.y-nest.y)<24)
   &&stepHaulerBird(world,bird,site,nest,25,dt)){
   bird.state='nesting';bird.nestTurns=(bird.nestTurns??0)+1;nest.sitterId=bird.id;nest.pendingSitterId=null;nest.turnTime=0;bird.nestRouteIndex=null;
  }
 }else{
  const target=haulerBirdPoint(site,site.localX,site.localZ+(bird.roostSide??1)*(1.55+.1*Math.sin(bird.phase*.7)));
  stepHaulerBird(world,bird,site,target,12,dt);bird.state=bird.speed>.1?'waddling':'huddling';
 }
 if(bird.defendingNestId&&world.penguinNestDefense&&!world.squidEncounter&&!world.centipedeEncounter&&!world.treeStalkerEncounter){
  const player=world.player,near=Math.hypot(player.x-bird.x,player.y-bird.y)<27&&Math.abs(player.z-bird.z)<35;
  if(near&&!player.swimming&&world.penguinNestDefense.peckCooldown<=0){
   player.health=Math.max(0,player.health-9);world.penguinBitten=true;world.penguinNestDefense.peckCooldown=.9;bird.peckTime=1;
  }
 }
 bird.stride+=bird.speed*dt/25*9;return true;
}
