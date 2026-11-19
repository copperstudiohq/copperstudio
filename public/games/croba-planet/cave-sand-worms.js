import {saltCaveSection} from './salt-cave.js';

export const CAVE_WORM_COUNT=24;
export const CAVE_WORM_SEGMENTS=12;
/** A fixed circuit through the central, western and eastern halls. Rounded
 * Hermite corners stay near each authored corridor's center line. */
const ROUTE=Object.freeze([[5075,-11770],[5090,-11900],[5130,-11980],[4480,-12180],[4230,-12600],
 [4460,-13020],[5210,-13280],[5280,-13460],[5900,-13150],[6100,-12670],[5810,-12170],[5120,-11920],
 [5210,-11780],[5160,-11680],[5060,-11690]].map(Object.freeze));
const wrap=(n,max)=>(n%max+max)%max;
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
/** Analytic delayed body wave: pausing freezes the entire animal; approaching
 * after a distant excursion resumes the same route without a physics backlog. */
export function poseCaveWorm(worm,time){
 const spacing=worm.lengthMeters*25/(CAVE_WORM_SEGMENTS+1),speed=worm.speed*25,headDistance=worm.offset+time*speed;
 for(let i=0;i<worm.segments.length;i++){
  const p=worm.segments[i],d=headDistance-i*spacing,phase=time*2.6+worm.phase-i*.55;
  sample(d,p);const dx=p.dx,dy=p.dy,length=Math.hypot(dx,dy)||1;
  const bend=Math.sin(phase)*2.2*Math.sin(i/(CAVE_WORM_SEGMENTS-1)*Math.PI);
  p.x-=dy/length*bend;p.y+=dx/length*bend;
  const cave=saltCaveSection(p.x,p.y);if(!cave)throw new Error(`Cave worm ${worm.id} has no supported water volume.`);
  const mid=cave.floor+90+25*Math.sin(time*.31+worm.phase),height=Math.min(cave.roof-18,mid+Math.sin(phase)*2.5);
  p.z=Math.max(cave.floor+18,height);p.radius=worm.widthMeters*12.5*(1-.7*(i/(CAVE_WORM_SEGMENTS-1))**2);
 }
 Object.assign(worm,{x:worm.segments[0].x,y:worm.segments[0].y,z:worm.segments[0].z,time,mouthOpen:.22+.12*Math.sin(time*2+worm.phase)});return worm;
}
export function initializeCaveWorms(world){
 world.caveWorms=Array.from({length:CAVE_WORM_COUNT},(_,i)=>poseCaveWorm({id:`cave-sand-worm-${i+1}`,lengthMeters:1.9+(i%4)*.3,widthMeters:.28+(i%3)*.035,
  speed:.65+(i%4)*.12,phase:i*1.7,offset:i/CAVE_WORM_COUNT*total,segments:Array.from({length:CAVE_WORM_SEGMENTS},()=>({x:0,y:0,z:0,radius:0}))},world.elapsed??0));
 return world.caveWorms;
}
export function updateCaveWorms(world){
 const p=world.player;if(!p||Math.abs(p.x-5200)>3000||p.y> -10500||p.y< -15000)return;
 for(const worm of world.caveWorms??[])poseCaveWorm(worm,world.elapsed);
}
