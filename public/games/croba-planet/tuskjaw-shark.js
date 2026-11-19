import {EYE_HEIGHT,WATER_LEVEL} from './terrain.js';
import {isShellField,shellFieldClearance} from './shell-field.js';
import {getSeabedHeight} from './seabed.js';
import {closestSquidSegments} from './squid-collision.js';
import {updateTuskonTail,tuskonTailRadius} from './tuskon-tail-physics.js';
import {tuskonCruiseSpeed} from './tuskon-propulsion.js';

/** @typedef {{id:string,x:number,y:number,z:number,homeX:number,homeY:number,homeZ:number,heading:number,phase:number,pitch:number,bank:number,speed:number,patrol:number,biteCooldown:number,state:string,lengthMeters:number,tailNodes?:import('./tuskon-tail-physics.js').TuskonTailNode[]}} TuskjawShark */
export const TUSKJAW_SHARK_LENGTH_METERS=20;
const STEP=1/60,RADIUS=45,states=new WeakMap();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
const PATROL=[[500,0],[0,400],[-500,0],[0,-400]];

/** Literal home and pose: restarting always restores the same one shark. */
export function initializeTuskjawSharks(world){
  world.tuskjawSharks=[{id:'tuskjaw-shark-1',x:5300,y:-9700,z:-350,homeX:5300,homeY:-9700,homeZ:-350,
    heading:Math.PI/2,phase:.7,pitch:0,bank:0,speed:0,patrol:0,biteCooldown:0,state:'patrolling',lengthMeters:20,headRadius:RADIUS}];
  return world.tuskjawSharks;
}

/** The trunk collider follows the same heading and pitch as the model. */
export function tuskjawBodyAxis(shark){
  const pitch=shark.pitch??0,fx=Math.cos(shark.heading)*Math.cos(pitch),fy=Math.sin(shark.heading)*Math.cos(pitch),fz=Math.sin(pitch);
  return [-162.5,150].map(t=>({x:shark.x+fx*t,y:shark.y+fy*t,z:shark.z+fz*t}));
}

/** Whole-body probes include the long pectoral fins and both ends of the tail. */
export function tuskjawWaterClear(shark,x=shark.x,y=shark.y,z=shark.z,heading=shark.heading){
  if(![x,y,z,heading].every(Number.isFinite)||shellFieldClearance(x,y)<330||z+90>WATER_LEVEL)return false;
  const fx=Math.cos(heading),fy=Math.sin(heading);
  for(const [forward,side] of [[-310,0],[-170,0],[0,0],[100,0],[200,0],[0,-155],[0,155]]){
    const px=x+fx*forward-fy*side,py=y+fy*forward+fx*side;
    if(!isShellField(px,py)||z-90<getSeabedHeight(px,py))return false;
  }
  return true;
}

function waterBand(shark,x,y,heading){
  const fx=Math.cos(heading),fy=Math.sin(heading);let floor=-Infinity;
  for(const [forward,side] of [[-310,0],[-170,0],[0,0],[100,0],[200,0],[0,-155],[0,155]])
    floor=Math.max(floor,getSeabedHeight(x+fx*forward-fy*side,y+fy*forward+fx*side));
  return {low:floor+100,high:WATER_LEVEL-100};
}

/** A player capsule slides off the solid body while the fins retain open space. */
export function resolveTuskjawBodies(world){
  const p=world.player;if(!finite(p)||world.squidEncounter||world.treeStalkerEncounter)return;
  for(const shark of world.tuskjawSharks??[]){
    if(shark.squidHeldBy||shark.squidRespawnIn>0)continue;
    const shapes=[{axis:tuskjawBodyAxis(shark),radius:RADIUS}];
    if(Array.isArray(shark.tailNodes)&&shark.tailNodes.length===9&&shark.tailNodes.every(finite))for(let i=1;i<shark.tailNodes.length;i++)
      shapes.push({axis:[shark.tailNodes[i-1],shark.tailNodes[i]],radius:tuskonTailRadius(i-1)});
    for(let pass=0;pass<2;pass++)for(const shape of shapes){
      const pair=closestSquidSegments({x:p.x,y:p.y,z:p.z+5},{x:p.x,y:p.y,z:p.z+EYE_HEIGHT-5},...shape.axis);
      let dx=pair.a.x-pair.b.x,dy=pair.a.y-pair.b.y,dz=pair.a.z-pair.b.z,distance=Math.hypot(dx,dy,dz);
      if(distance>=shape.radius+5)continue;
      if(distance<1e-8){
        dx=shape.axis[0].y-shape.axis[1].y;dy=shape.axis[1].x-shape.axis[0].x;dz=0;distance=Math.hypot(dx,dy);
        if(distance<1e-8){dx=1;dy=0;distance=1;}
      }
      const push=(shape.radius+5-Math.hypot(pair.a.x-pair.b.x,pair.a.y-pair.b.y,pair.a.z-pair.b.z)+.01)/distance;
      p.x+=dx*push;p.y+=dy*push;p.z+=dz*push;
    }
  }
}

/** Fixed simulation steps drive patrol, pursuit, body waves and bite cooldowns. */
export function updateTuskjawSharks(world,dt,options={}){
  if(!world||!Number.isFinite(dt)||dt<=0||!Array.isArray(world.tuskjawSharks))return false;
  let clock=states.get(world);if(!clock||clock.population!==world.tuskjawSharks){clock={time:0,accumulator:0,population:world.tuskjawSharks};states.set(world,clock);}
  if(world.threat?.kind==='tuskjaw-shark')world.threat={active:false,distance:Infinity,message:''};
  clock.accumulator+=Math.min(dt,.1);let bitten=false;
  while(clock.accumulator+1e-10>=STEP){
    clock.accumulator=Math.max(0,clock.accumulator-STEP);clock.time+=STEP;
    const p=world.player,eye=finite(p)?{x:p.x,y:p.y,z:p.z+EYE_HEIGHT*.6}:null;
    for(const shark of world.tuskjawSharks){
      if(shark.squidHeldBy||shark.squidRespawnIn>0||!eye||Math.hypot(shark.x-eye.x,shark.y-eye.y,shark.z-eye.z)>3000)continue;
      shark.biteCooldown=Math.max(0,shark.biteCooldown-STEP);
      const distance=Math.hypot(shark.x-eye.x,shark.y-eye.y,shark.z-eye.z);
      const noticed=p.swimming&&p.underwater&&!world.squidEncounter&&!world.treeStalkerEncounter&&isShellField(p.x,p.y)&&distance<1050;
      const waypoint=PATROL[shark.patrol%PATROL.length];
      const target=noticed?eye:{x:shark.homeX+waypoint[0],y:shark.homeY+waypoint[1],z:shark.homeZ+Math.sin(clock.time*.22)*35};
      if(!noticed&&Math.hypot(target.x-shark.x,target.y-shark.y)<180)shark.patrol=(shark.patrol+1)%PATROL.length;
      const desired=Math.atan2(target.y-shark.y,target.x-shark.x),turn=Math.atan2(Math.sin(desired-shark.heading),Math.cos(desired-shark.heading));
      shark.phase+=STEP*(noticed?5.5:2.5);
      const heading=shark.heading+clamp(turn,-STEP*.65,STEP*.65),speed=tuskonCruiseSpeed(shark.phase,noticed);
      shark.state=noticed?'pursuing':'patrolling';shark.speed=0;
      for(const offset of [0,.35,-.35,.8,-.8]){
        const direction=heading+offset,x=shark.x+Math.cos(direction)*speed*STEP,y=shark.y+Math.sin(direction)*speed*STEP;
        const band=waterBand(shark,x,y,direction);
        if(band.low>band.high)continue;
        const goalZ=clamp(target.z,band.low,band.high),z=shark.z+clamp(goalZ-shark.z,-25*STEP,25*STEP);
        if(!tuskjawWaterClear(shark,x,y,z,direction))continue;
        const dz=z-shark.z;Object.assign(shark,{x,y,z,heading:direction,speed});
        shark.pitch+=(Math.atan2(dz,speed*STEP)-shark.pitch)*.05;shark.pitch=clamp(shark.pitch,-.22,.22);
        shark.bank=clamp(-turn*.13,-.15,.15);break;
      }
      if(!shark.speed){
        const turn=shark.heading+STEP*.8;
        if(tuskjawWaterClear(shark,shark.x,shark.y,shark.z,turn))shark.heading=turn;
        const lift=Math.min(WATER_LEVEL-100,shark.z+STEP*40);
        if(tuskjawWaterClear(shark,shark.x,shark.y,lift))shark.z=lift;
      }
      updateTuskonTail(world,shark,STEP,undefined,!options.reducedMotion);
      if(noticed){
        const mouth={x:shark.x+Math.cos(shark.heading)*190,y:shark.y+Math.sin(shark.heading)*190,z:shark.z};
        if(Math.hypot(mouth.x-eye.x,mouth.y-eye.y,mouth.z-eye.z)<70&&shark.biteCooldown===0){
          p.health=Math.max(0,p.health-35);shark.biteCooldown=3;bitten=true;
        }
        if(!world.threat?.active)world.threat={active:true,kind:'tuskjaw-shark',distance,message:'CROBONIC TUSKON — APPROACHING YOU'};
      }
    }
  }
  resolveTuskjawBodies(world);return bitten;
}
