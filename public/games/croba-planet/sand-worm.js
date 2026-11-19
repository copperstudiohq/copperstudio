import {getSaltCave} from './salt-cave.js';
import {SULFURIC_LAND,getSulfuricGround,isSulfuricLand} from './sulfuric-biome.js';
import {EYE_HEIGHT} from './terrain.js';

export const SAND_WORM_LENGTH_METERS=100;
export const SAND_WORM_WIDTH_METERS=9;
export const SAND_WORM_SEGMENTS=48;
export const SAND_WORM_SPACING_METERS=95.5/(SAND_WORM_SEGMENTS-1);
export const SAND_WORM_PERIOD=36;
const SPEED=350,STEP_DELAY=SAND_WORM_SPACING_METERS*25/SPEED,STEP=1/60;
const runtimes=new WeakMap();
const ROUTE=Object.freeze([[2600,-16500],[3650,-17600],[5000,-18800],[4200,-20500],[2300,-20400],[1600,-18700],[1850,-16500]].map(p=>Object.freeze(p)));
const wrap=(n,max)=>((n%max)+max)%max,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const catmull=(a,b,c,d,t)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);

/** One authored closed route; a small arc-length table keeps burrowing speed even. */
function route(t,target={}){
  const q=wrap(t,ROUTE.length),i=Math.floor(q),u=q-i;
  for(const [axis,key]of [[0,'x'],[1,'y']])target[key]=catmull(ROUTE[wrap(i-1,ROUTE.length)][axis],ROUTE[i][axis],ROUTE[(i+1)%ROUTE.length][axis],ROUTE[(i+2)%ROUTE.length][axis],u);
  return target;
}
const arc=[{t:0,distance:0}],previous=route(0),next={};
for(let i=1;i<=ROUTE.length*48;i++){
  const t=i/48;route(t,next);arc.push({t,distance:arc[i-1].distance+Math.hypot(next.x-previous.x,next.y-previous.y)});Object.assign(previous,next);
}
const routeLength=arc.at(-1).distance;
function routeAtDistance(distance,target){
  const d=wrap(distance,routeLength);let lo=0,hi=arc.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(arc[mid].distance<d)lo=mid;else hi=mid;}
  const a=arc[lo],b=arc[hi],t=a.t+(b.t-a.t)*(d-a.distance)/(b.distance-a.distance);return route(t,target);
}

/** @typedef {{x:number,y:number,z:number,ground:number,radius:number}} WormSegment */
/** @typedef {{id:string,x:number,y:number,z:number,lengthMeters:number,widthMeters:number,headRadius:number,phase:number,state:string,mouthOpen:number,segments:WormSegment[],time:number,heading:number,behavior:string,huntUntil:number,biteCooldown:number,target:{x:number,y:number}|null,squidHeldBy?:string,squidRespawnIn?:number}} SandWorm */

/** Analytic delayed body follows the exact path cut by the head, including dives.
 * No random positions, terrain deformation or frame-dependent spring chains. */
export function sampleSandWormPoint(time,index=0,target={}){
  const clock=(Number.isFinite(time)?time:0)-index*STEP_DELAY,phase=wrap(clock,SAND_WORM_PERIOD);
  routeAtDistance(clock*SPEED,target);
  const ground=getSulfuricGround(target.x,target.y);
  if(ground===null)throw new RangeError('The prepared sand worm route must stay inside Sulfuric Land.');
  const flight=phase>=11&&phase<=24?Math.sin((phase-11)/13*Math.PI):0;
  target.ground=ground;target.z=ground-200+800*flight;
  target.radius=112.5*(index===0?1:1-.85*clamp((index/(SAND_WORM_SEGMENTS-1)-.6)/.4,0,1));
  return target;
}

function describe(worm,time){
  worm.time=time;worm.phase=wrap(time,SAND_WORM_PERIOD);
  const head=worm.segments[0];worm.x=head.x;worm.y=head.y;worm.z=head.z;
  const exposed=worm.segments.some(p=>p.z+p.radius>p.ground);
  worm.state=head.z>head.ground?'leaping':exposed?'diving':worm.phase>=9&&worm.phase<11?'rumbling':'burrowing';
  if(worm.behavior==='windup')worm.state='rumbling';
  worm.mouthOpen=clamp((head.z-head.ground)/55,0,1);
}

export function initializeSandWorms(world){
  const worm={id:'sulfur-sand-worm-1',x:0,y:0,z:0,lengthMeters:SAND_WORM_LENGTH_METERS,widthMeters:SAND_WORM_WIDTH_METERS,headRadius:112.5,
    phase:0,state:'burrowing',mouthOpen:0,time:0,heading:0,behavior:'patrol',huntUntil:0,biteCooldown:0,target:null,
    segments:Array.from({length:SAND_WORM_SEGMENTS},()=>({x:0,y:0,z:0,ground:0,radius:0}))};
  const time=Number.isFinite(world.elapsed)?world.elapsed:0;worm.segments.forEach((s,i)=>sampleSandWormPoint(time,i,s));describe(worm,time);
  const ahead=sampleSandWormPoint(time+.05);worm.heading=Math.atan2(ahead.y-worm.y,ahead.x-worm.x);
  world.sandWorms=[worm];world.sandWormEncounter=null;world.wormRumble=0;world.sandWormThreat={active:false,distance:Infinity,message:''};return world.sandWorms;
}

/** Only a successful land jump emits a vibration; swimming and other biomes do not. */
export function notifySandWormJump(world){
  const p=world?.player;if(!p||p.swimming||getSaltCave(p.x,p.y,p.z)||!isSulfuricLand(p.x,p.y))return false;
  for(const worm of world.sandWorms??[]){
    worm.huntUntil=world.elapsed+45;worm.target={x:p.x,y:p.y};
    if(worm.behavior==='patrol'||worm.behavior==='searching')worm.behavior='hunting';
  }
  return Boolean(world.sandWorms?.length);
}

export function clearSandWormHunt(world){
  for(const worm of world.sandWorms??[]){worm.huntUntil=0;worm.target=null;worm.behavior='recovering';const rt=runtimes.get(worm);if(rt)rt.modeTime=0;}
  world.wormRumble=0;world.sandWormThreat={active:false,distance:Infinity,message:''};
}

function runtime(worm,time){
  let rt=runtimes.get(worm);
  if(rt&&Math.abs(time-rt.time)<.3)return rt;
  const trail=[];let distance=0,previous=null;
  // Seed more than a full body of continuous history, also on save/load time jumps.
  for(let t=time-20;t<=time+.0001;t+=.04){
    const p=sampleSandWormPoint(t);if(previous)distance+=Math.hypot(p.x-previous.x,p.y-previous.y,p.z-previous.z);
    trail.unshift({x:p.x,y:p.y,z:p.z,distance});previous=p;
  }
  const head=trail[0],ahead=sampleSandWormPoint(time+.02);
  rt={time,accumulator:0,trail,distance,head:{...head},heading:Math.atan2(ahead.y-head.y,ahead.x-head.x),cursor:time*SPEED,
    modeTime:0,outsideTime:0,attack:null,player:null};runtimes.set(worm,rt);return rt;
}

function record(rt){
  const p=rt.head,previous=rt.trail[0],travel=Math.hypot(p.x-previous.x,p.y-previous.y,p.z-previous.z);
  if(travel<.05)return;
  rt.distance+=travel;rt.trail.unshift({x:p.x,y:p.y,z:p.z,distance:rt.distance});
  const limit=rt.distance-(SAND_WORM_LENGTH_METERS+20)*25;
  while(rt.trail.length>2&&(rt.trail.at(-2).distance<limit||rt.trail.length>2048))rt.trail.pop();
}

function bodyPose(worm,rt){
  let cursor=0;
  worm.segments.forEach((s,i)=>{
    const distance=rt.distance-i*SAND_WORM_SPACING_METERS*25;
    while(cursor<rt.trail.length-2&&rt.trail[cursor+1].distance>distance)cursor++;
    const a=rt.trail[cursor],b=rt.trail[Math.min(cursor+1,rt.trail.length-1)];
    const mix=clamp((a.distance-distance)/Math.max(.001,a.distance-b.distance),0,1);
    s.x=a.x+(b.x-a.x)*mix;s.y=a.y+(b.y-a.y)*mix;s.z=a.z+(b.z-a.z)*mix;
    s.ground=getSulfuricGround(s.x,s.y)??a.z;s.radius=112.5*(1-.85*clamp((i/(SAND_WORM_SEGMENTS-1)-.6)/.4,0,1));
  });
  worm.heading=rt.heading;describe(worm,rt.time);
}

function boundedTarget(p){return {x:clamp(p.x,SULFURIC_LAND.minX+150,SULFURIC_LAND.maxX-150),y:clamp(p.y,SULFURIC_LAND.minY+150,SULFURIC_LAND.maxY-150)};}

function huntStep(world,worm,rt){
  rt.time+=STEP;rt.modeTime+=STEP;worm.biteCooldown=Math.max(0,worm.biteCooldown-STEP);
  const p=world.player,inside=p&&!p.swimming&&!getSaltCave(p.x,p.y,p.z)&&isSulfuricLand(p.x,p.y),head=rt.head;
  const distance=p?Math.hypot(head.x-p.x,head.y-p.y):Infinity;
  const moving=inside&&rt.player&&Math.hypot(p.x-rt.player.x,p.y-rt.player.y)>.05;
  if(worm.huntUntil>rt.time&&inside){
    if(moving&&distance<2250)worm.huntUntil=Math.max(worm.huntUntil,rt.time+8);
    if(moving||p.jumping||!worm.target)worm.target=boundedTarget(p);
    rt.outsideTime=0;
  }else rt.outsideTime+=STEP;
  rt.player=p?{x:p.x,y:p.y}:null;
  if(rt.outsideTime>4){worm.huntUntil=0;worm.target=null;}
  if((worm.huntUntil<=rt.time||rt.outsideTime>4)&&worm.behavior!=='patrol'&&worm.behavior!=='recovering'&&worm.behavior!=='striking'){
    worm.target=null;worm.huntUntil=0;worm.behavior='recovering';rt.modeTime=0;
  }
  if(worm.behavior==='recovering'&&rt.modeTime>4){
    worm.behavior=worm.huntUntil>rt.time&&inside?'hunting':'patrol';rt.modeTime=0;
    let best=Infinity;for(const point of arc){const sample=route(point.t),d=Math.hypot(head.x-sample.x,head.y-sample.y);if(d<best){best=d;rt.cursor=point.distance;}}
  }
  let target=worm.target,speed=worm.behavior==='patrol'?SPEED:450,offset=-200;
  if(worm.behavior==='patrol'){
    rt.cursor+=SPEED*STEP;target=routeAtDistance(rt.cursor+400,{});
    const phase=wrap(rt.time,SAND_WORM_PERIOD);offset+=phase>=11&&phase<=24?800*Math.sin((phase-11)/13*Math.PI):0;
  }
  if(worm.behavior==='hunting'&&target&&distance<1500&&head.z<(getSulfuricGround(head.x,head.y)??0)-130){
    worm.behavior='windup';rt.modeTime=0;rt.attack={target:boundedTarget(target)};
  }
  if(worm.behavior==='windup'){
    target=rt.attack.target;speed=200;
    if(rt.modeTime>=2){
      const dx=target.x-head.x,dy=target.y-head.y,d=Math.max(1,Math.hypot(dx,dy));
      rt.attack={start:{x:head.x,y:head.y},end:boundedTarget({x:target.x+dx*.14,y:target.y+dy*.14})};
      rt.heading=Math.atan2(dy,dx);worm.behavior='striking';rt.modeTime=0;
    }
  }
  if(worm.behavior==='striking'){
    const u=clamp(rt.modeTime/7,0,1),a=rt.attack.start,b=rt.attack.end;
    head.x=a.x+(b.x-a.x)*u;head.y=a.y+(b.y-a.y)*u;offset=-200+800*Math.sin(u*Math.PI);
    head.z=(getSulfuricGround(head.x,head.y)??0)+offset;
    if(u===1){worm.behavior='recovering';rt.modeTime=0;}
  }else{
    if(target){const desired=Math.atan2(target.y-head.y,target.x-head.x),turn=Math.atan2(Math.sin(desired-rt.heading),Math.cos(desired-rt.heading));rt.heading+=clamp(turn,-STEP,STEP);}
    const next=boundedTarget({x:head.x+Math.cos(rt.heading)*speed*STEP,y:head.y+Math.sin(rt.heading)*speed*STEP});
    head.x=next.x;head.y=next.y;
    const desired=(getSulfuricGround(head.x,head.y)??0)+offset;
    head.z+=clamp(desired-head.z,-300*STEP,300*STEP);
  }
  record(rt);bodyPose(worm,rt);
  if(inside&&worm.behavior==='striking'&&!worm.biteCooldown&&worm.mouthOpen>.2
    &&Math.hypot(worm.x-p.x,worm.y-p.y,worm.z-(p.z+EYE_HEIGHT/2))<worm.headRadius+16){
    p.health=Math.max(0,p.health-65);worm.biteCooldown=3;return true;
  }
  return false;
}

function feedback(world){
  const p=world.player;let nearest=Infinity,hunting=null,rumble=0;
  if(p&&!p.swimming&&isSulfuricLand(p.x,p.y))for(const worm of world.sandWorms??[]){
    if(worm.squidHeldBy||worm.squidRespawnIn>0)continue;
    for(const s of worm.segments)nearest=Math.min(nearest,Math.hypot(p.x-s.x,p.y-s.y));
    if(worm.huntUntil>world.elapsed)hunting=worm;
    rumble=Math.max(rumble,clamp(1-nearest/2250,0,1)*(worm.state==='rumbling'||worm.behavior==='striking'?1:.72));
  }
  world.wormRumble=rumble;
  world.sandWormThreat={active:Boolean(hunting),kind:'sand-worm',distance:nearest,message:hunting?.behavior==='windup'?'GROUND SWELLING — DODGE SIDEWAYS':hunting?.behavior==='striking'?'CROBONIC ARTIC SULFUR WORM — STRIKE':'CROBONIC ARTIC SULFUR WORM — HUNTING'};
}

/** Visible sections are solid; buried sections never block a walk over the sand. */
export function resolveSandWormBodies(world){
  const p=world.player;if(!p||![p.x,p.y,p.z].every(Number.isFinite)||world.sandWormEncounter||world.squidEncounter||world.treeStalkerEncounter)return;
  for(const worm of world.sandWorms??[])if(!worm.squidHeldBy&&!(worm.squidRespawnIn>0))for(const s of worm.segments){
    if(s.z+s.radius<=s.ground||p.z>=s.z+s.radius||p.z+EYE_HEIGHT<=s.z-s.radius)continue;
    const dz=clamp(p.z+EYE_HEIGHT/2-s.z,-s.radius,s.radius),reach=Math.sqrt(Math.max(0,s.radius*s.radius-dz*dz))+5;
    const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy);
    if(d<reach){p.x=s.x+(d?dx/d:1)*(reach+.01);p.y=s.y+(d?dy/d:0)*(reach+.01);}
  }
  if(!p.swimming&&!p.jumping&&!p.falling)p.z=getSulfuricGround(p.x,p.y)??p.z;
}

/** Read the expedition clock so pause, reload and different frame rates agree. */
export function updateSandWorms(world,dt){
  if(!world||world.sandWormEncounter||!Number.isFinite(dt)||dt<=0||!Number.isFinite(world.elapsed))return false;
  let bitten=false;
  for(const worm of world.sandWorms??[])if(!worm.squidHeldBy&&!(worm.squidRespawnIn>0)){
    const rt=runtime(worm,Math.max(0,world.elapsed-Math.min(dt,.1)));rt.accumulator+=Math.min(dt,.1);
    while(rt.accumulator+1e-10>=STEP){rt.accumulator=Math.max(0,rt.accumulator-STEP);bitten=huntStep(world,worm,rt)||bitten;}
  }
  feedback(world);resolveSandWormBodies(world);return bitten;
}
