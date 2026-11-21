import {EYE_HEIGHT} from './terrain.js';

export const WORM_CAPTURE_SECONDS=1.1;
export const WORM_SWALLOW_SECONDS=2.5;
const states=new WeakMap(),finite=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
const copy=p=>({x:p.x,y:p.y,z:p.z});
const smooth=t=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v);};
const blend=(a,b,t)=>{const u=smooth(t);return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u};};
/** @typedef {{wormId:string,phase:'grabbed'|'eating',elapsed:number,progress:number,target:{x:number,y:number,z:number},cameraPosition:{x:number,y:number,z:number},darkness:number}} SandWormEncounter */

/** The frozen head faces along its heading; the forebody is posed to that same frame. */
export function sandWormMouthPoint(worm,forward=52,up=0){
  const head=worm?.segments?.[0];if(!finite(head)||!Number.isFinite(worm.heading))return null;
  return {x:head.x+Math.cos(worm.heading)*forward,y:head.y+Math.sin(worm.heading)*forward,z:head.z+up};
}

/** A fatal strike becomes a short, mutually exclusive swallowing sequence. */
export function beginSandWormEncounter(world,worm){
  if(!finite(world?.player)||typeof worm?.id!=='string'||worm.lifecycleInactive||worm.lifecycleScale<.99||!worm?.segments?.length||!worm.segments.every(finite)
    ||![worm.heading,worm.headRadius,worm.segments[0].ground].every(Number.isFinite)||worm.headRadius<=0||world.sandWormEncounter
    ||world.squidEncounter||world.centipedeEncounter||world.treeStalkerEncounter)return false;
  const head=worm.segments[0],start={x:world.player.x,y:world.player.y,z:world.player.z+EYE_HEIGHT};
  const encounter={wormId:worm.id,phase:'grabbed',elapsed:0,progress:0,target:sandWormMouthPoint(worm,-45),cameraPosition:copy(start),darkness:0};
  if(!encounter.target)return false;
  world.sandWormEncounter=encounter;world.player.health=0;world.wormRumble=0;worm.behavior='feeding';worm.mouthOpen=1;
  states.set(world,{encounter,start,age:0,finished:false,body:worm.segments.map(copy),heading:worm.heading,
    lift:Math.max(0,head.ground+worm.headRadius+65-head.z)});return true;
}

export function releaseSandWormEncounter(world){
  if(!world||typeof world!=='object')return;const id=world.sandWormEncounter?.wormId,worm=world.sandWorms?.find(w=>w.id===id);
  if(worm){worm.behavior='recovering';worm.biteCooldown=Math.max(worm.biteCooldown??0,4);worm.mouthOpen=0;}
  world.sandWormEncounter=null;states.delete(world);
}

/** Keep the physical feet safe while the cinematic eye passes between the four
 * shields and into the real hollow throat. Completion is reported exactly once. */
export function updateSandWormEncounter(world,dt){
  const e=world?.sandWormEncounter;if(!e||!Number.isFinite(dt)||dt<=0)return false;
  const worm=world.sandWorms?.find(w=>w.id===e.wormId),state=states.get(world);
  if(!worm||!state||state.encounter!==e){releaseSandWormEncounter(world);return false;}
  if(state.finished)return false;state.age+=Math.min(dt,.05);
  const lift=smooth(state.age/.55),fx=Math.cos(state.heading),fy=Math.sin(state.heading);
  worm.segments.forEach((s,i)=>{
    const original=state.body[i],weight=i<2?1:Math.max(0,1-(i-1)/9);s.z=original.z+state.lift*lift*weight;
    if(i===1){s.x=state.body[0].x-fx*51;s.y=state.body[0].y-fy*51;s.z=worm.segments[0].z;}
  });
  Object.assign(worm,copy(worm.segments[0]));worm.heading=state.heading;
  const outside=sandWormMouthPoint(worm,255,8),throat=sandWormMouthPoint(worm,-45),inside=sandWormMouthPoint(worm,-18);
  e.target=throat;
  if(state.age<WORM_CAPTURE_SECONDS){
    e.phase='grabbed';e.elapsed=state.age;e.progress=Math.min(1,state.age/WORM_CAPTURE_SECONDS);
    const raised={...state.start,z:Math.max(state.start.z,worm.segments[0].z+20)};
    e.cameraPosition=e.progress<.45?blend(state.start,raised,e.progress/.45):blend(raised,outside,(e.progress-.45)/.55);
    worm.mouthOpen=1;e.darkness=0;
  }else{
    e.phase='eating';e.elapsed=state.age-WORM_CAPTURE_SECONDS;e.progress=Math.min(1,e.elapsed/WORM_SWALLOW_SECONDS);
    e.cameraPosition=blend(outside,inside,e.progress);worm.mouthOpen=1-smooth((e.progress-.28)/.55);
    e.darkness=smooth((e.progress-.45)/.5);
  }
  if(state.age+1e-9>=WORM_CAPTURE_SECONDS+WORM_SWALLOW_SECONDS){state.finished=true;e.progress=1;e.darkness=1;return true;}
  return false;
}
