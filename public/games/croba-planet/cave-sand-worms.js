import {saltCaveSection,SALT_CAVE_SHAFT} from './salt-cave.js';
import {getSulfuricGround} from './sulfuric-biome.js';
import {WORM_NURSERY,getWormNurseryState} from './wildlife-lifecycle-data.js';

export const CAVE_WORM_COUNT=0;
export const CAVE_WORM_CAPACITY=2;
export const CAVE_WORM_SEGMENTS=12;
/** A fixed circuit through the central, western and eastern halls. Rounded
 * Hermite corners stay near each authored corridor's center line. */
const ROUTE=Object.freeze([[5150,-13750],[5150,-13550],[5280,-13460],[5900,-13150],[6100,-12670],
 [5810,-12170],[5120,-11920],[5210,-11780],[5160,-11680],[5060,-11690],[5075,-11770],[5090,-11900],
 [5130,-11980],[4480,-12180],[4230,-12600],[4460,-13020],[5210,-13280],[5150,-13550]].map(Object.freeze));
const wrap=(n,max)=>(n%max+max)%max;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const shaftFloor=saltCaveSection(SALT_CAVE_SHAFT.x,SALT_CAVE_SHAFT.y).floor;
export const WORM_GEYSER_BANK=Object.freeze({x:SALT_CAVE_SHAFT.x+300,y:SALT_CAVE_SHAFT.y});
const journeys=new WeakMap();
function curve(t){
 const i=Math.floor(t)%ROUTE.length,u=t-Math.floor(t),a=ROUTE[i],b=ROUTE[(i+1)%ROUTE.length],p=ROUTE[wrap(i-1,ROUTE.length)],n=ROUTE[(i+2)%ROUTE.length];
 const tangent=(from,to)=>{const dx=to[0]-from[0],dy=to[1]-from[1],d=Math.hypot(dx,dy)||1;return[dx/d*75,dy/d*75];};
 const m=tangent(p,b),k=tangent(a,n),h00=2*u**3-3*u*u+1,h10=u**3-2*u*u+u,h01=-2*u**3+3*u*u,h11=u**3-u*u;
 return{x:a[0]*h00+m[0]*h10+b[0]*h01+k[0]*h11,y:a[1]*h00+m[1]*h10+b[1]*h01+k[1]*h11};
}
const track=[{...curve(0),distance:0}];
for(let i=1;i<=ROUTE.length*40;i++){
 const p=curve(i/40),last=track.at(-1);track.push({...p,distance:last.distance+Math.hypot(p.x-last.x,p.y-last.y)});
 if(!saltCaveSection(p.x,p.y)||saltCaveSection(p.x,p.y).clearance<60)throw new Error('A cave sand worm route leaves the sheltered swimming corridor.');
}
const total=track.at(-1).distance;
function sample(distance,target){
 const d=wrap(distance,total);let lo=0,hi=track.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(track[mid].distance<d)lo=mid;else hi=mid;}
 const a=track[lo],b=track[hi],t=(d-a.distance)/(b.distance-a.distance);target.x=a.x+(b.x-a.x)*t;target.y=a.y+(b.y-a.y)*t;target.dx=b.x-a.x;target.dy=b.y-a.y;return target;
}
/** One continuous age-derived journey: hidden soil ingress, the actual flooded
 * halls, the real geyser shaft, then a short bank burrow. No saved coordinates. */
function nurseryPoint(worm,seconds,target){
 if(seconds<0){
  const dx=SALT_CAVE_SHAFT.x-worm.lifecycleNestX,dy=SALT_CAVE_SHAFT.y-worm.lifecycleNestY,length=Math.hypot(dx,dy)||1;
  target.x=worm.lifecycleNestX+dx/length*seconds*15;target.y=worm.lifecycleNestY+dy/length*seconds*15;target.z=worm.lifecycleNestZ+2.25+seconds*20;return target;
 }
 const age=Math.max(0,seconds),state=getWormNurseryState(age),p=state.progress,shaft=SALT_CAVE_SHAFT;
 if(state.habitat==='burrowing-to-cave'){
  const dive=smooth(age),travel=smooth((age-1)/(WORM_NURSERY.ingressSeconds-1));
  target.x=worm.lifecycleNestX+(shaft.x-worm.lifecycleNestX)*travel;
  target.y=worm.lifecycleNestY+(shaft.y-worm.lifecycleNestY)*travel;
  const start=worm.lifecycleNestZ+2.25-150*dive;
  target.z=start+(shaftFloor+90-start)*travel;
 }else if(state.habitat==='salt-cave'){
  sample(p*total,target);const cave=saltCaveSection(target.x,target.y);
  if(!cave||cave.clearance<30)throw new Error(`Bred worm ${worm.id} left its prepared Salt Cave route.`);
  target.z=cave.floor+90+20*Math.sin(age*.31)*Math.sin(p*Math.PI);
 }else if(state.habitat==='cave-exit'){
  target.x=shaft.x+30*Math.sin(p*Math.PI*2)*Math.sin(p*Math.PI);
  target.y=shaft.y+30*(Math.cos(p*Math.PI*2)-1)*Math.sin(p*Math.PI);
  target.z=shaftFloor+90+30*smooth(p);
 }else if(state.habitat==='geyser-shaft'){
  target.x=shaft.x;target.y=shaft.y;target.z=shaftFloor+120+(shaft.waterLevel-8-shaftFloor-120)*smooth(p);
 }else {
  const t=state.habitat==='sulfur-emergence'?smooth(p):1;
  target.x=shaft.x+(WORM_GEYSER_BANK.x-shaft.x)*t;target.y=shaft.y;
  const ground=getSulfuricGround(target.x,target.y)??0,buried=ground-135*state.scale;
  target.z=(shaft.waterLevel-8)*(1-t)+buried*t;
 }
 return target;
}

function journey(worm){
 const key=[worm.lifecycleNestX,worm.lifecycleNestY,worm.lifecycleNestZ,worm.lifecycleRevision??0].join(':');
 let cached=journeys.get(worm);if(cached?.key===key)return cached;
 const points=[];let distance=0;
 for(let step=-40;step<=WORM_NURSERY.emergeUntil*10;step++){
  const time=step/10,point=nurseryPoint(worm,time,{}),previous=points.at(-1);
  if(previous)distance+=Math.hypot(point.x-previous.x,point.y-previous.y,point.z-previous.z);
  points.push({...point,time,distance});
 }
 cached={key,points};journeys.set(worm,cached);return cached;
}
function before(points,value,key){
 let low=0,high=points.length-1;
 while(high-low>1){const middle=(low+high)>>1;if(points[middle][key]<value)low=middle;else high=middle;}
 return low;
}
function atDistance(points,distance,target){
 const index=before(points,distance,'distance'),a=points[index],b=points[index+1],t=clamp((distance-a.distance)/Math.max(.0001,b.distance-a.distance));
 target.x=a.x+(b.x-a.x)*t;target.y=a.y+(b.y-a.y)*t;target.z=a.z+(b.z-a.z)*t;return target;
}

/** Called by lifecycle sync on hatch, restore and each bounded simulation tick.
 * The same pooled descriptor changes habitat; there is no second cave animal. */
export function poseLifecycleWorm(worm){
 const age=Math.max(0,Number.isFinite(worm.lifecycleAgeSeconds)?worm.lifecycleAgeSeconds:0),state=getWormNurseryState(age);
 if(![worm.lifecycleNestX,worm.lifecycleNestY,worm.lifecycleNestZ].every(Number.isFinite))throw new TypeError('A bred sulfur worm needs its fixed parent nest.');
 Object.assign(worm,{lifecycleHabitat:state.habitat,lifecyclePhaseProgress:state.progress,lifecycleScale:state.scale,lengthMeters:100*state.scale,widthMeters:9*state.scale,headRadius:112.5*state.scale});
 if(state.habitat==='sulfuric-land'){
  worm.x=WORM_GEYSER_BANK.x;worm.y=WORM_GEYSER_BANK.y;worm.z=getSulfuricGround(worm.x,worm.y)-135*state.scale;worm.heading=0;return worm;
 }
 if(worm.segments?.length!==CAVE_WORM_SEGMENTS)worm.segments=Array.from({length:CAVE_WORM_SEGMENTS},()=>({x:0,y:0,z:0,radius:0}));
 const spacing=worm.lengthMeters*25/(CAVE_WORM_SEGMENTS+1),points=journey(worm).points,headPoint=nurseryPoint(worm,age,{}),prior=points[before(points,age,'time')];
 const distance=prior.distance+Math.hypot(headPoint.x-prior.x,headPoint.y-prior.y,headPoint.z-prior.z);
 for(let i=0;i<worm.segments.length;i++){
  const segment=worm.segments[i];if(i===0)Object.assign(segment,headPoint);else atDistance(points,distance-i*spacing,segment);
  segment.radius=worm.widthMeters*12.5*(1-.7*(i/(CAVE_WORM_SEGMENTS-1))**2);
 }
 const head=worm.segments[0],back=worm.segments[1];
 Object.assign(worm,{x:head.x,y:head.y,z:head.z,heading:Math.atan2(head.y-back.y,head.x-back.x),time:age,mouthOpen:.22+.12*Math.sin(age*2)});return worm;
}
export function poseCaveWorm(worm){return poseLifecycleWorm(worm);}
export function initializeCaveWorms(world){
 world.caveWorms=[];return world.caveWorms;
}
export function updateCaveWorms(world){
 const worms=world.caveWorms??(world.caveWorms=[]);worms.length=0;
 for(const young of world.wildlifeYoung??[]){
  if(young.species!=='sand-worm'||young.lifecycleInactive||young.lifecycleHabitat==='sulfuric-land')continue;
  if(worms.length>=CAVE_WORM_CAPACITY)break;
  poseLifecycleWorm(young);worms.push(young);
 }
}
