import {SULFURIC_LAND,getSulfuricGround} from './sulfuric-biome.js';
import {SULFURIC_POOLS,SULFURIC_VENTS} from './sulfuric-biome-data.js';
import {getSulfuricGeyserState} from './sulfuric-geysers.js';
import {EYE_HEIGHT} from './terrain.js';

/** @typedef {{id:string,x:number,y:number,z:number,homeX:number,homeY:number,heading:number,phase:number,speed:number,moveBlend:number,pitch:number,bank:number,patrol:number,restTime:number,state:string,headRadius:number,lengthMeters:number,bodyLengthMeters:number,squidHeldBy?:string,squidRespawnIn?:number}} SulfurLizard */
const HOMES=Object.freeze([[6240,-12310],[6600,-12550],[4980,-13480],[5400,-13650],[4840,-13920],[6580,-14180],
  [7040,-14450],[6780,-14700],[5290,-14800],[5790,-15020],[4820,-12600],[7170,-13000],
  [2600,-13800],[1400,-14600],[3800,-15700],[6200,-16600],[1500,-18600],[2200,-19600],[5600,-19400],[6500,-20800]].map(p=>Object.freeze(p)));
const STEP=1/60,clocks=new WeakMap(),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Nose to rump excludes the long tail in the authored 2.8-metre anatomy.
const MODEL_BODY_LENGTH=1.817;

/** The shared authored anatomy is 2.8 metres long; both sizes use the same joints. */
export function getSulfurLizardScale(animal){
  return (Number.isFinite(animal.lengthMeters)&&animal.lengthMeters>0?animal.lengthMeters:1)/2.8;
}

export function initializeSulfurLizards(world){
  world.sulfurLizards=HOMES.map(([x,y],i)=>{
    const lengthMeters=i%2===0?.5:2.8/MODEL_BODY_LENGTH;
    return {id:`sulfur-lizard-${i+1}`,x,y,z:getSulfuricGround(x,y),homeX:x,homeY:y,
      heading:i*.73,phase:i*.8,speed:0,moveBlend:0,pitch:0,bank:0,patrol:0,restTime:i%3,state:'basking',headRadius:12*lengthMeters/2.8,
      lengthMeters,bodyLengthMeters:lengthMeters*MODEL_BODY_LENGTH/2.8};
  });
  return world.sulfurLizards;
}

function clear(world,animal,x,y){
  if(x<SULFURIC_LAND.minX+80||x>SULFURIC_LAND.maxX-80||y<SULFURIC_LAND.minY+80||y>SULFURIC_LAND.maxY-100)return false;
  const floor=getSulfuricGround(x,y);if(floor===null||Math.abs(floor-animal.z)>Math.hypot(x-animal.x,y-animal.y)*.7+2)return false;
  for(const [px,py,r]of SULFURIC_POOLS)if(Math.hypot(x-px,y-py)<r*.82+22)return false;
  for(const [px,py,size]of SULFURIC_VENTS)if(Math.hypot(x-px,y-py)<size*30+15)return false;
  for(const other of world.sulfurLizards)if(other!==animal&&!other.squidHeldBy&&!(other.squidRespawnIn>0)&&Math.hypot(x-other.x,y-other.y)<animal.headRadius+other.headRadius+2)return false;
  return true;
}

/** A fat trunk capsule encloses the head and belly without blocking its tail. */
export function resolveSulfurLizardBodies(world){
  const p=world.player;if(!p||![p.x,p.y,p.z].every(Number.isFinite)||world.squidEncounter||world.treeStalkerEncounter)return;
  for(const animal of world.sulfurLizards??[]){
    const scale=getSulfurLizardScale(animal),radius=12*scale+5;
    if(animal.squidHeldBy||animal.squidRespawnIn>0||p.z>=animal.z+20*scale||p.z+EYE_HEIGHT<animal.z)continue;
    const fx=Math.cos(animal.heading),fy=Math.sin(animal.heading),along=clamp((p.x-animal.x)*fx+(p.y-animal.y)*fy,-12*scale,16*scale);
    const x=animal.x+fx*along,y=animal.y+fy*along,dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);
    if(d<radius){p.x=x+(d?dx/d:-fy)*(radius+.01);p.y=y+(d?dy/d:fx)*(radius+.01);}
  }
}

/** Fixed-step local wandering, basking and retreat from swimmers or eruptions. */
export function updateSulfurLizards(world,dt){
  if(!world||!Array.isArray(world.sulfurLizards)||!Number.isFinite(dt)||dt<=0)return;
  let clock=clocks.get(world);if(!clock||clock.population!==world.sulfurLizards){clock={population:world.sulfurLizards,time:Math.max(0,(world.elapsed??0)-Math.min(dt,.1)),accumulator:0,ponds:SULFURIC_POOLS.map(()=>({}))};clocks.set(world,clock);}
  clock.accumulator+=Math.min(dt,.1);
  while(clock.accumulator+1e-10>=STEP){
    clock.accumulator=Math.max(0,clock.accumulator-STEP);clock.time+=STEP;
    SULFURIC_POOLS.forEach((_,i)=>getSulfuricGeyserState(clock.time,i,clock.ponds[i]));
    for(const [i,a]of world.sulfurLizards.entries()){
      if(a.squidHeldBy||a.squidRespawnIn>0)continue;
      const scale=getSulfurLizardScale(a);
      a.phase+=STEP*(1.2+a.speed*.45);a.restTime=Math.max(0,a.restTime-STEP);
      const player=world.player,nearPlayer=player&&Math.hypot(a.x-player.x,a.y-player.y,a.z-player.z)<90;
      let away=nearPlayer?{x:player.x,y:player.y}:null;
      for(let j=0;j<SULFURIC_POOLS.length;j++){
        const [x,y,r]=SULFURIC_POOLS[j];if((clock.ponds[j].active||clock.ponds[j].warning)&&Math.hypot(a.x-x,a.y-y)<r+95)away={x,y};
      }
      const angle=a.patrol*2.1+i*.77,target=away?{x:a.x+(a.x-away.x)*4,y:a.y+(a.y-away.y)*4}
        :{x:a.homeX+Math.cos(angle)*125,y:a.homeY+Math.sin(angle)*115};
      if(!away&&Math.hypot(target.x-a.x,target.y-a.y)<20){a.patrol++;a.restTime=2.5+(i%4);}
      a.state=away?'retreating':a.restTime>0?'basking':'wandering';
      const desired=Math.atan2(target.y-a.y,target.x-a.x),turn=Math.atan2(Math.sin(desired-a.heading),Math.cos(desired-a.heading));
      a.heading+=clamp(turn,-STEP*1.6,STEP*1.6);a.speed=0;
      if(away||a.restTime===0)for(const offset of [0,.6,-.6,1.2,-1.2]){
        const heading=a.heading+offset,speed=(away?32:14)*Math.sqrt(scale),x=a.x+Math.cos(heading)*speed*STEP,y=a.y+Math.sin(heading)*speed*STEP;
        if(!clear(world,a,x,y))continue;Object.assign(a,{x,y,z:getSulfuricGround(x,y),heading,speed});break;
      }
      if(!a.speed&&a.restTime===0){a.patrol++;a.heading+=STEP*.8;}
      a.moveBlend+=(Number(a.speed>0)-a.moveBlend)*.12;
      const sample=12*scale,fx=Math.cos(a.heading)*sample,fy=Math.sin(a.heading)*sample;
      const front=getSulfuricGround(a.x+fx,a.y+fy),rear=getSulfuricGround(a.x-fx,a.y-fy);
      const left=getSulfuricGround(a.x-fy,a.y+fx),right=getSulfuricGround(a.x+fy,a.y-fx);
      a.pitch=clamp(Math.atan2((front??a.z)-(rear??a.z),sample*2),-.55,.55);
      a.bank=-clamp(Math.atan2((left??a.z)-(right??a.z),sample*2),-.45,.45);
    }
  }
  resolveSulfurLizardBodies(world);
}
