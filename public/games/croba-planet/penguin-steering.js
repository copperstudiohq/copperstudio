import {PENGUIN_WATER_STATES} from './penguin-diving.js';
import {wreckBodyPathClear} from './wreck-collision.js';
import {penguinBodySeparation} from './penguin-lifecycle.js';

const angles=[0,.35,-.35,.7,-.7,1.15,-1.15,1.65,-1.65,2.25,-2.25,Math.PI];
const wrap=n=>Math.atan2(Math.sin(n),Math.cos(n));
const body={radius:10,height:36};

/** Local steering can back away and escape an existing overlap. Landing birds
 * reserve their destination instead of blocking the shore with their airborne pose. */
export function steerPenguin(world,bird,target,speed,dt,ground,limitHome){
 speed*=bird.lifecycleSpeedScale??1;
 const nav=bird.navigation??={stalled:0,sideTime:0,sideGoal:null};
 nav.sideTime=Math.max(0,nav.sideTime-dt);
 const goal=nav.sideTime>0?nav.sideGoal:target,dx=goal.x-bird.x,dy=goal.y-bird.y,length=Math.hypot(dx,dy)||1;
 const heading=Math.atan2(dy,dx),step=Math.min(speed*dt,length);
 const obstacles=[];
 for(const other of world.penguins??[]){
  if(other===bird||other.lifecycleInactive||other.squidHeldBy||other.squidRespawnIn>0)continue;
  const landing=other.state==='landing';
  if(!landing&&(PENGUIN_WATER_STATES.has(other.state)||Math.abs(other.z-bird.z)>18))continue;
  const p=landing?other.diveRoute.shore:other;
  if(Math.hypot(p.x-bird.x,p.y-bird.y)<45)obstacles.push({point:p,gap:penguinBodySeparation(bird,other)});
 }
 let best=null;
 for(const offset of angles){
  const angle=heading+offset,x=bird.x+Math.cos(angle)*step,y=bird.y+Math.sin(angle)*step;
  if(limitHome&&Math.hypot(x-bird.homeX,y-bird.homeY)>85)continue;
  const z=ground(world,x,y,bird.platformId);if(z===null||Math.abs(z-bird.z)>step*.8+.05)continue;
  const probe=Math.min(9,length),ahead=ground(world,bird.x+Math.cos(angle)*probe,bird.y+Math.sin(angle)*probe,bird.platformId);
  if(ahead===null)continue;
  if(!wreckBodyPathClear(world.ship,bird,{x,y,z},body,true))continue;
  let clearance=30,escape=0,blocked=false;
  for(const {point:other,gap} of obstacles){
   const before=Math.hypot(bird.x-other.x,bird.y-other.y),after=Math.hypot(x-other.x,y-other.y);
   if(after<gap&&after<=before+.0001){blocked=true;break;}
   clearance=Math.min(clearance,after);if(before<gap)escape+=after-before;
  }
  if(blocked)continue;
  const progress=length-Math.hypot(goal.x-x,goal.y-y);
  const score=progress+escape*5+clearance*.035-Math.abs(wrap(angle-bird.heading))*.025;
  if(!best||score>best.score)best={x,y,z,angle,score,progress};
 }
 if(best){
  bird.x=best.x;bird.y=best.y;bird.z=best.z;bird.speed=speed;
  bird.heading+=Math.max(-dt*4,Math.min(dt*4,wrap(best.angle-bird.heading)));
  nav.stalled=best.progress>.01?0:nav.stalled+dt;
 }else nav.stalled+=dt;
 if(nav.stalled>1.4){
  const side=bird.seed%2>1?1:-1;
  for(const turn of [side*Math.PI/2,-side*Math.PI/2,Math.PI]){
   const x=bird.x+Math.cos(heading+turn)*22,y=bird.y+Math.sin(heading+turn)*22;
   if(ground(world,x,y,bird.platformId)===null||limitHome&&Math.hypot(x-bird.homeX,y-bird.homeY)>85)continue;
   nav.sideGoal={x,y};nav.sideTime=1.2;break;
  }
  nav.stalled=0;
 }
}
