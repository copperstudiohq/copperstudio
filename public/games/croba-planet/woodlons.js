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
const available=animal=>animal&&!animal.lifecycleInactive&&!animal.squidHeldBy&&!(animal.squidRespawnIn>0);
export const woodlonGrowthScale=animal=>Number.isFinite(animal.lifecycleScale)?Math.max(.05,Math.min(1,animal.lifecycleScale)):1;

function nurseryPathClear(population,animal,x,y,z){
 const scale=woodlonGrowthScale(animal);
 for(const other of population??[]){
  if(other===animal||!available(other)||(!animal.lifecycleRenderOnly&&!other.lifecycleRenderOnly)||other.habitat!==animal.habitat||other.platformId!==animal.platformId)continue;
  const otherScale=woodlonGrowthScale(other);if(z>other.z+27*otherScale||z+27*scale<other.z)continue;
  const gap=Math.hypot(x-other.x,y-other.y);
  if(gap<7*(scale+otherScale)+2&&gap<=Math.hypot(animal.x-other.x,animal.y-other.y))return false;
 }
 return true;
}
function stepWoodlon(world,animal,target,delta,speed,stop=0,population=world.woodlons){
 speed*=animal.lifecycleSpeedScale??1;
 const distance=Math.hypot(target.x-animal.x,target.y-animal.y);animal.speed=0;
 if(distance<=stop)return;
 const heading=Math.atan2(target.y-animal.y,target.x-animal.x),step=Math.min(speed*delta,Math.max(0,distance-stop));
 for(const turn of[0,.55,-.55,1.15,-1.15]){
  const angle=heading+turn,x=animal.x+Math.cos(angle)*step,y=animal.y+Math.sin(angle)*step,z=woodlonGround(world,animal,x,y);
  if(z===null||Math.abs(z-animal.z)>7||!nurseryPathClear(population,animal,x,y,z))continue;
  animal.x=x;animal.y=y;animal.z=z;animal.heading=angle;animal.speed=speed;return;
 }
}

/** Young remain in their parent's authored bone habitat; no eggs or adult AI.
 * Distant growth continues in the lifecycle controller while walking sleeps. */
export function updateWoodlonYoung(world,animal,parent,dt,population=world.woodlons){
 if(!available(animal)||!Number.isFinite(dt)||dt<=0)return;
 const delta=Math.min(dt,.05),growth=animal.growth??0,scale=woodlonGrowthScale(animal);
 animal.phase+=delta*(animal.speed>0?5:1);animal.stateTime+=delta;
 const bone=feedingSites.get(animal.targetBoneId);if(!bone)return;
 const withParent=available(parent)&&parent.habitat===animal.habitat&&parent.platformId===animal.platformId&&parent.targetBoneId===animal.targetBoneId;
 const index=Number(animal.id.split('-').at(-1))||0,side=index%2?1:-1;
 const target=withParent?{x:parent.x-Math.cos(parent.heading)*(22+8*scale)-Math.sin(parent.heading)*side*7,
  y:parent.y-Math.sin(parent.heading)*(22+8*scale)+Math.cos(parent.heading)*side*7}
  :{x:animal.feedSeatX??animal.homeX,y:animal.feedSeatY??animal.homeY};
 animal.state=withParent?'following-parent':'near-bones';
 const gap=Math.hypot(target.x-animal.x,target.y-animal.y);stepWoodlon(world,animal,target,delta,gap>50?9+9*growth:4+8*growth,4,population);
 const feeding=gap<7&&withParent&&parent.feedBlend>.6;
 if(feeding){animal.state='learning-to-feed';animal.feedTarget={x:bone.feedX??bone.x,y:bone.feedY??bone.y,z:bone.feedZ??bone.z+7};}
 animal.feedBlend+=(Number(feeding)-animal.feedBlend)*Math.min(1,delta*3);
 const p=world.player;animal.eyeTarget=Math.hypot(p.x-animal.x,p.y-animal.y,p.z-animal.z)<250?{x:p.x,y:p.y,z:p.z+36}:null;
}
export function updateWoodlons(world,dt,population=world.woodlons){
 if(!Number.isFinite(dt)||dt<=0)return;
 const delta=Math.min(dt,.1);
 for(const animal of world.woodlons??[]){
  if(!available(animal))continue;
  if(Math.hypot(animal.x-world.player.x,animal.y-world.player.y)>2000)continue;
  animal.phase+=delta*(animal.speed>0?5:1);animal.stateTime+=delta;
  if(animal.lifecycleCourting&&animal.lifecycleTarget){
   animal.state='courting';animal.feedBlend+=(0-animal.feedBlend)*Math.min(1,delta*4);
   stepWoodlon(world,animal,animal.lifecycleTarget,delta,10,28,population);continue;
  }
  if(animal.state==='courting'){animal.state='approaching-bones';animal.stateTime=0;}
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
   const heading=Math.atan2(target.y-animal.y,target.x-animal.x),speed=(wander?9:15)*(animal.lifecycleSpeedScale??1);
   for(const turn of[0,.55,-.55,1.15,-1.15]){
    const angle=heading+turn,x=animal.x+Math.cos(angle)*speed*delta,y=animal.y+Math.sin(angle)*speed*delta,z=woodlonGround(world,animal,x,y);
    if(z===null||Math.abs(z-animal.z)>7||!nurseryPathClear(population,animal,x,y,z))continue;
    animal.x=x;animal.y=y;animal.z=z;animal.heading=angle;animal.speed=speed;break;
   }
  }
  const p=world.player;animal.eyeTarget=Math.hypot(p.x-animal.x,p.y-animal.y,p.z-animal.z)<250?{x:p.x,y:p.y,z:p.z+36}:null;
 }
}
/** Soft, short bodies prevent walking through a nearby animal, without bites. */
export function resolveWoodlonBodies(world,population=world.woodlons??[]){
 const p=world.player;
 for(const a of population){
  if(!available(a))continue;
  const scale=woodlonGrowthScale(a);
  if(p.z>a.z+27*scale||p.z+36<a.z)continue;
  const dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy),reach=7*scale+5;
  if(d>=reach)continue;
  p.x=a.x+(d?dx/d:1)*reach;p.y=a.y+(d?dy/d:0)*reach;
 }
}
