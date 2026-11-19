import{WOODLON_FEEDING_SITES}from'./basin-life-data.js';
import{basinCaveMeshField}from'./basin-caves.js';
import{highestIceAt,getIceSurfaceHeight}from'./ice-surface.js';
import{nearBasinWall}from'./icy-basin.js';
const feedingSites=new Map(WOODLON_FEEDING_SITES.map(site=>[site.id,site]));

/** Small peaceful bone grazers. All clocks, feeding and gaze belong to the
 * simulation; drawing never advances them or changes an explorer's vitals. */
export function woodlonGround(world,animal,x,y){
 if(animal.habitat==='cave'){
  const q=basinCaveMeshField(x,y,animal.platformId);
  return q&&q.clearance>18&&q.ceiling-q.floor>32?q.floor:null;
 }
 const ice=highestIceAt(world.platforms,x,y);
 return ice?.id===animal.platformId&&!nearBasinWall(world.platforms,x,y,14)?getIceSurfaceHeight(ice,x,y):null;
}
export function updateWoodlons(world,dt){
 if(!Number.isFinite(dt)||dt<=0)return;
 const delta=Math.min(dt,.1);
 for(const animal of world.woodlons??[]){
  if(Math.hypot(animal.x-world.player.x,animal.y-world.player.y)>2000)continue;
  animal.phase+=delta*(animal.speed>0?5:1);animal.stateTime+=delta;
  const bone=feedingSites.get(animal.targetBoneId);if(!bone)continue;
  const nutrientPoint={x:bone.feedX??bone.x,y:bone.feedY??bone.y,z:bone.feedZ??bone.z+7};
  const seat={x:animal.feedSeatX??nutrientPoint.x,y:animal.feedSeatY??nutrientPoint.y};
  const distance=Math.hypot(seat.x-animal.x,seat.y-animal.y);
  if(animal.state==='resting'&&animal.stateTime>1.5){animal.state='approaching-bones';animal.stateTime=0;}
  if(animal.state==='feeding'&&animal.stateTime>7){animal.state='wandering';animal.stateTime=0;}
  if(animal.state==='wandering'&&animal.stateTime>6){animal.state='approaching-bones';animal.stateTime=0;}
  if(animal.state==='approaching-bones'&&distance<3){animal.state='feeding';animal.stateTime=0;}
  const feeding=animal.state==='feeding';
  animal.feedBlend+=(Number(feeding)-animal.feedBlend)*Math.min(1,delta*4);
  animal.speed=0;
  if(feeding){animal.heading=Math.atan2(nutrientPoint.y-animal.y,nutrientPoint.x-animal.x);animal.feedTarget={...nutrientPoint};}
  else if(animal.state==='approaching-bones'||animal.state==='wandering'){
   const wander=animal.state==='wandering';
   const target=wander?{x:animal.homeX+Math.cos(animal.phase*.2)*50,y:animal.homeY+Math.sin(animal.phase*.2)*50}:seat;
   const heading=Math.atan2(target.y-animal.y,target.x-animal.x),speed=wander?9:15;
   for(const turn of[0,.55,-.55,1.15,-1.15]){
    const angle=heading+turn,x=animal.x+Math.cos(angle)*speed*delta,y=animal.y+Math.sin(angle)*speed*delta,z=woodlonGround(world,animal,x,y);
    if(z===null||Math.abs(z-animal.z)>7)continue;
    animal.x=x;animal.y=y;animal.z=z;animal.heading=angle;animal.speed=speed;break;
   }
  }
  const p=world.player;animal.eyeTarget=Math.hypot(p.x-animal.x,p.y-animal.y,p.z-animal.z)<250?{x:p.x,y:p.y,z:p.z+36}:null;
 }
}
/** Soft, short bodies prevent walking through a nearby animal, without bites. */
export function resolveWoodlonBodies(world){
 const p=world.player;
 for(const a of world.woodlons??[]){
  if(p.z>a.z+27||p.z+36<a.z)continue;
  const dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy),reach=12;
  if(d>=reach)continue;
  p.x=a.x+(d?dx/d:1)*reach;p.y=a.y+(d?dy/d:0)*reach;
 }
}
