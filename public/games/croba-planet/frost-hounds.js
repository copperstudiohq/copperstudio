import {prepareFrostHoundPacks,frostPackSteering,FROST_PACK_BITE_INTERVAL} from './frost-hound-packs.js';
import { EYE_HEIGHT, WATER_LEVEL, getIceDepth, getIceSection, pointInPolygon } from './terrain.js';
import { getSeabedHeight } from './seabed.js';
import { getArcticGarden } from './arctic-gardens.js';
import { getIceSpikeCollision } from './ice-spikes.js';

export const FROST_HOUND_BITE_DAMAGE = 22;
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

/** @typedef {{id:string,packId?:string,packSlot?:number,packSize?:number,x:number,y:number,z:number,homeX:number,homeY:number,homeZ:number,heading:number,phase:number,state:string,stateTime:number,biteCooldown:number,jet:number,speed:number}} FrostHound */

/** Keep the entire seal-shaped body in open water above its grassy territory. */
export function frostHoundWaterClear(world,x,y,z) {
  if(getArcticGarden(x,y)?.region.id!=='orange-grass-field'
    || z-18<getSeabedHeight(x,y) || z+20>WATER_LEVEL-8) return false;
  for(const ice of [...world.platforms??[],...world.submergedIce??[]]) {
    if(Math.abs(x-ice.x)>ice.rx+45||Math.abs(y-ice.y)>ice.ry+45)continue;
    const top=ice.z??0;
    if(z+20<top-getIceDepth(ice)||z-20>top)continue;
    const section=getIceSection(ice,Math.min(0,z-top));
    for(const [dx,dy]of [[0,0],[42,0],[-42,0],[0,42],[0,-42]])
      if(pointInPolygon(section,x+dx,y+dy))return false;
  }
  return !getIceSpikeCollision(world.iceSpikes??[],x,y,z-18,38,42);
}

function move(world,hound,target,speed,dt,neighbors=[],options={}) {
  const heading=Math.atan2(target.y-hound.y,target.x-hound.x);
  const turn=Math.atan2(Math.sin(heading-hound.heading),Math.cos(heading-hound.heading));
  const desired=hound.heading+Math.max(-dt*2.6,Math.min(dt*2.6,turn));
  const step=Math.min(speed*dt,Math.hypot(target.x-hound.x,target.y-hound.y));
  for(const offset of [0,.65,-.65,1.3,-1.3]) {
    const direction=desired+offset,x=hound.x+Math.cos(direction)*step,y=hound.y+Math.sin(direction)*step;
    const {low,high}=options.boundsAt?.(world,x,y)??{low:getSeabedHeight(x,y)+30,high:WATER_LEVEL-35};
    const z=Math.max(low,Math.min(high,hound.z+Math.max(-speed*dt*.45,Math.min(speed*dt*.45,target.z-hound.z))));
    if(options.boundedVertical&&Math.abs(z-hound.z)>speed*dt*.45+1e-5)continue;
    if(!(options.waterClear??frostHoundWaterClear)(world,x,y,z))continue;
    if(neighbors.some(other=>other.id!==hound.id&&Math.hypot(x-other.x,y-other.y,z-other.z)<48
      &&Math.hypot(x-other.x,y-other.y,z-other.z)<distance(hound,other)-.001))continue;
    hound.x=x;hound.y=y;hound.z=z;hound.heading=direction;hound.speed=dt?step/dt:0;return;
  }
  hound.speed=0;hound.heading+=dt*.8;
}

/** Patrol → notice → jet chase → bite/retreat → search → home.
 * Fixed homes, simulation clocks, and no damage during capture or respawn.
 * Optional habitat callbacks let the deep-ocean relatives share these behaviors
 * while keeping their population, swimming bounds and pack memory independent. */
export function updateFrostHounds(world,dt,options={}) {
  if(!Number.isFinite(dt)||dt<=0)return false;
  const delta=Math.min(dt,.05),player=world.player;
  let bitten=false;
  const active=(world[options.populationKey??"frostHounds"]??[]).filter(h=>!h.lifecycleInactive&&!h.squidHeldBy&&!(h.squidRespawnIn>0));
  const prey={x:player.x,y:player.y,z:player.z+EYE_HEIGHT*.5},sightings=new Map();
  for(const hound of active){
    hound.phase+=delta;hound.stateTime+=delta;hound.biteCooldown=Math.max(0,hound.biteCooldown-delta);
    const range=distance(hound,prey),homeRange=Math.hypot(player.x-hound.homeX,player.y-hound.homeY);
    let sees=player.swimming&&player.underwater&&homeRange<1100&&range<600
      &&(options.preyInHabitat?options.preyInHabitat(world,prey):getArcticGarden(player.x,player.y)?.region.id==='orange-grass-field');
    if(sees)for(let sample=1;sample<=Math.ceil(range/45);sample++){
      const t=sample/(Math.ceil(range/45)+1);
      if(!(options.waterClear??frostHoundWaterClear)(world,hound.x+(prey.x-hound.x)*t,hound.y+(prey.y-hound.y)*t,hound.z+(prey.z-hound.z)*t)){sees=false;break;}
    }
    sightings.set(hound.id,sees);
    if(sees&&hound.lifecycleCourting)hound.lifecycleCourting=false; // A real hunt interrupts courtship; the canonical pair clears next tick.
  }
  const plans=prepareFrostHoundPacks(world,active,sightings,prey,delta,options.packStateKey);
  for(const hound of active){
    const plan=plans.get(hound.id),sees=sightings.get(hound.id),range=distance(hound,prey);
    if(sees){hound.lastSeen={...prey};hound.memory=4;}
    else hound.memory=Math.max(0,(hound.memory??0)-delta);
    const setState=state=>{if(hound.state!==state){hound.state=state;hound.stateTime=0;}};
    let target,speed;
    if(hound.lifecycleCourting&&hound.lifecycleTarget){
      setState('courting');target=hound.lifecycleTarget;speed=26;
    }else if(hound.state==='retreating'&&hound.stateTime<1.2){
      target={x:hound.x+Math.cos(hound.heading)*100,y:hound.y+Math.sin(hound.heading)*100,z:hound.homeZ};speed=90;
    }else if(sees||plan.active&&plan.state.memory>3.8){
      if(hound.state!=='pursuing'&&hound.state!=='noticing')setState('noticing');
      if(hound.state==='noticing'&&hound.stateTime>.55)setState('pursuing');
      target=plan.active?plan.target:prey;speed=hound.state==='pursuing'?175*(.65+.35*Math.sin(hound.phase*5)**2):18;
    }else if(plan.active||hound.memory>0&&hound.lastSeen){setState('searching');target=plan.active?plan.target:hound.lastSeen;speed=65;}
    else{
      setState('patrolling');
      target=plan.patrol;speed=26;
    }
    const prior={x:hound.x,y:hound.y,z:hound.z,heading:hound.heading};
    move(world,hound,hound.lifecycleCourting?target:frostPackSteering(hound,target,plan.neighbors),speed*(hound.lifecycleSpeedScale??1),delta,plan.neighbors,options);
    const travelled=Math.hypot(hound.x-prior.x,hound.y-prior.y);
    const pitch=travelled>.001?-Math.atan2(hound.z-prior.z,travelled):0;
    const turn=Math.atan2(Math.sin(hound.heading-prior.heading),Math.cos(hound.heading-prior.heading))/delta;
    hound.swimPitch=(hound.swimPitch??0)+(Math.max(-.18,Math.min(.18,pitch))-(hound.swimPitch??0))*delta*3;
    hound.swimBank=(hound.swimBank??0)+(Math.max(-.12,Math.min(.12,-turn*.06))-(hound.swimBank??0))*delta*4;
    hound.jet=hound.state==='pursuing'?hound.speed/175:Math.min(.25,hound.speed/120);
    if(!hound.lifecycleCourting&&sees&&plan.attacker&&plan.state.biteCooldown<=1e-8&&range<51&&hound.state==='pursuing'&&hound.biteCooldown<=0&&!bitten){
      player.health=Math.max(0,player.health-FROST_HOUND_BITE_DAMAGE);hound.biteCooldown=2.2;plan.state.biteCooldown=FROST_PACK_BITE_INTERVAL;
      hound.heading+=Math.PI*.65;setState('retreating');bitten=true;
    }
  }
  return bitten;
}
