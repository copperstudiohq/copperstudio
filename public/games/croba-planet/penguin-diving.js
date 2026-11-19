import {WATER_LEVEL,WORLD_BOUNDS,getIceSection,pointInPolygon} from './terrain.js';
import {getSeabedHeight} from './seabed.js';
import {getForestCollision} from './forest-terrain.js';
import {wreckBodyPenetration,wreckBodyPathClear} from './wreck-collision.js';

const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
export const PENGUIN_WATER_STATES=new Set(['diving','swimming','surfacing','landing']);
// A pitched bird is longer horizontally than a waddling bird. Cover its crown,
// beak and flippers throughout the launch and return rather than testing its feet.
const waterBody={radius:36,height:48,bottom:-12};
const arcPoint=(from,to,t,landing)=>({x:mix(from.x,to.x,t),y:mix(from.y,to.y,t),z:mix(from.z,to.z,t)+Math.sin(t*Math.PI)*(landing?45:30)});
function wreckArcClear(world,from,to,landing){
 let previous=from;
 for(let i=1;i<=24;i++){
  const next=arcPoint(from,to,i/24,landing);
  if(!wreckBodyPathClear(world.ship,previous,next,waterBody))return false;
  previous=next;
 }
 return true;
}

/** A complete swimming body needs water below it and clearance from ice/land. */
export function penguinWaterClear(world,p){
 if(wreckBodyPenetration(world.ship,p,waterBody)>0)return false;
 if(p.x<WORLD_BOUNDS.minX+20||p.x>WORLD_BOUNDS.maxX-20||p.y<WORLD_BOUNDS.minY+20||p.y>WORLD_BOUNDS.maxY-20||p.z<getSeabedHeight(p.x,p.y)+22)return false;
 if(getForestCollision(world.forest,p,20))return false;
 for(const ice of [...world.platforms??[],...world.submergedIce??[]]){
  if(Math.abs(p.x-ice.x)>ice.rx*1.35+20||Math.abs(p.y-ice.y)>ice.ry*1.35+20)continue;
  const section=getIceSection(ice,p.z);
  for(const [dx,dy]of [[0,0],[18,0],[-18,0],[0,18],[0,-18]])if(pointInPolygon(section,p.x+dx,p.y+dy))return false;
 }
 return true;
}

/** Returns true while the dive state owns movement; land steering owns the approach. */
export function updatePenguinDive(world,bird,dt,ground){
 if(!bird.diveRoute)return false;const route=bird.diveRoute;
 if(!PENGUIN_WATER_STATES.has(bird.state)){
  bird.diveIn=Math.max(0,bird.diveIn-dt);
  if(bird.diveIn===0&&!bird.returningHome){
   bird.state='to-water';
   if(Math.hypot(bird.x-route.shore.x,bird.y-route.shore.y)<8){
    if(!wreckArcClear(world,bird,route.water,false)){bird.state='huddling';bird.returningHome=true;bird.diveIn=3;return false;}
    bird.state='diving';bird.tripTime=0;bird.tripStart={x:bird.x,y:bird.y,z:bird.z};return true;
   }
  }
  return false;
 }
 bird.tripTime+=dt;bird.speed=0;bird.wetness=1;
 const water=route.water,shore=route.shore;
 if(bird.state==='diving'||bird.state==='landing'){
  const landing=bird.state==='landing',t=clamp(bird.tripTime/(landing?1.5:1.2)),from=landing?water:bird.tripStart,to=landing?shore:water;
  const candidate=arcPoint(from,to,t,landing);
  if(!wreckBodyPathClear(world.ship,bird,candidate,waterBody)){bird.tripTime-=dt;return true;}
  Object.assign(bird,candidate);
  bird.heading=Math.atan2(to.y-from.y,to.x-from.x);bird.pitch=Math.PI/2*(landing?1-smooth(t):smooth(t));
  if(t===1){
   bird.x=to.x;bird.y=to.y;bird.z=to.z;
   bird.tripTime=0;
   if(landing){bird.state='huddling';bird.pitch=0;bird.returningHome=true;bird.diveIn=18+bird.seed%11;bird.z=ground(world,shore.x,shore.y,bird.platformId)??shore.z;}
   else bird.state='swimming';
  }
 }else if(bird.state==='swimming'){
  const t=clamp(bird.tripTime/(8+bird.seed%3)),dx=water.x-shore.x,dy=water.y-shore.y,length=Math.hypot(dx,dy)||1;
  const candidate={x:water.x-dy/length*Math.sin(t*Math.PI*2)*38+dx/length*Math.sin(t*Math.PI)*25,
   y:water.y+dx/length*Math.sin(t*Math.PI*2)*38+dy/length*Math.sin(t*Math.PI)*25,z:water.z-Math.sin(t*Math.PI)*55};
  if(penguinWaterClear(world,candidate)&&wreckBodyPathClear(world.ship,bird,candidate,waterBody)){bird.heading=Math.atan2(candidate.y-bird.y,candidate.x-bird.x);Object.assign(bird,candidate);}
  bird.pitch=Math.PI/2;
  if(t===1){bird.state='surfacing';bird.tripTime=0;}
 }else{
  const t=clamp(bird.tripTime),candidate={x:water.x,y:water.y,z:water.z+Math.sin(t*Math.PI)*34};
  if(!wreckBodyPathClear(world.ship,bird,candidate,waterBody)){bird.tripTime-=dt;return true;}
  Object.assign(bird,candidate);bird.pitch=Math.PI/2-Math.sin(t*Math.PI)*.3;
  if(t===1){
   const occupied=(world.penguins??[]).some(other=>other!==bird&&!other.squidHeldBy&&!(other.squidRespawnIn>0)
    &&(!PENGUIN_WATER_STATES.has(other.state)||other.state==='landing')
    &&Math.hypot((other.state==='landing'?other.diveRoute.shore.x:other.x)-shore.x,(other.state==='landing'?other.diveRoute.shore.y:other.y)-shore.y)<18);
   if(!occupied&&wreckArcClear(world,water,shore,true)){bird.state='landing';bird.tripTime=0;}
  }
 }
 return true;
}
