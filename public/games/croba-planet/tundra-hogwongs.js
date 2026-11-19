import { highestIceAt, getIceSurfaceHeight } from './ice-surface.js';
import { EYE_HEIGHT,WATER_LEVEL } from './terrain.js';
import {nearBasinWall} from './icy-basin.js';
import { closestSquidSegments } from './squid-collision.js';
import {wreckBodyPathClear} from './wreck-collision.js';
import {updateHogwongHunt,releaseHogwongHunt} from './hogwong-hunting.js';

export const HOGWONG_FEET=Object.freeze([[-.43,.54],[.43,.54],[-.49,0],[.49,0],[-.43,-.55],[.43,-.55]].map(Object.freeze));

/** A dry, gently sloping footing for the whole four-metre creature. */
export function hogwongGround(world,x,y,platformId) {
  const center=highestIceAt(world.platforms??[],x,y);
  if(!center||(platformId?center.id!==platformId:center.biome!=='iceberg-tundra')||nearBasinWall(world.platforms,x,y,55))return null;
  const z=getIceSurfaceHeight(center,x,y);
  if(z<WATER_LEVEL+5)return null;
  for(const [dx,dy]of [[38,0],[-38,0],[0,38],[0,-38]]){
    const ice=highestIceAt(world.platforms??[],x+dx,y+dy);
    if(!ice||(platformId?ice.id!==platformId:ice.biome!=='iceberg-tundra')||Math.abs(getIceSurfaceHeight(ice,x+dx,y+dy)-z)>24)return null;
  }
  return z;
}

/** Cautious omnivores roam their fixed homes and hunt reachable adult birds.
 * Eating/respawn ownership uses the existing wildlife flags. */
export function updateHogwongs(world,dt) {
  if(!Number.isFinite(dt)||dt<=0)return;
  const delta=Math.min(dt,.05),player=world.player;
  for(const hog of world.hogwongs??[]){
    if(hog.squidHeldBy||hog.squidRespawnIn>0){releaseHogwongHunt(world,hog);continue;}
    hog.phase+=delta;hog.stateTime+=delta;
    if(!updateHogwongHunt(world,hog,delta,hogwongGround)){
      const near=!player.swimming&&Math.hypot(player.x-hog.x,player.y-hog.y)<125;
      let heading=hog.heading,speed=0;
      if(near){
        const gap=Math.hypot(player.x-hog.x,player.y-hog.y);
        hog.state=gap<75?'shying':'watching';
        heading=gap<75?Math.atan2(hog.y-player.y,hog.x-player.x):Math.atan2(player.y-hog.y,player.x-hog.x);speed=gap<75?35:0;
      }else if(Math.sin(hog.phase*.22+hog.seed)>-.2){
        hog.state='walking';speed=15;
        const tx=hog.homeX+Math.cos(hog.phase*.07+hog.seed)*140;
        const ty=hog.homeY+Math.sin(hog.phase*.07+hog.seed)*140;
        heading=Math.atan2(ty-hog.y,tx-hog.x);
      }else hog.state='grazing';
      const turn=Math.atan2(Math.sin(heading-hog.heading),Math.cos(heading-hog.heading));
      const nextHeading=hog.heading+Math.max(-delta,Math.min(delta,turn));
      hog.speed=0;
      if(near&&!speed)hog.heading=nextHeading;
      if(speed>0)for(const offset of [0,.55,-.55,1,-1]){
        const angle=nextHeading+offset,x=hog.x+Math.cos(angle)*speed*delta,y=hog.y+Math.sin(angle)*speed*delta;
        const z=hogwongGround(world,x,y,hog.huntPlatformId);
        if(z===null||Math.abs(z-hog.z)>speed*delta*.7+.05)continue;
        if(!wreckBodyPathClear(world.ship,hog,{x,y,z},{radius:38,height:55}))continue;
        if((world.hogwongs??[]).some(other=>other!==hog&&!other.squidHeldBy&&!(other.squidRespawnIn>0)&&Math.hypot(x-other.x,y-other.y)<65))continue;
        hog.x=x;hog.y=y;hog.z=z;hog.heading=angle;hog.speed=speed;break;
      }
      if(!hog.speed&&speed>0)hog.heading+=delta*.7;
    }
    hog.stridePhase=(hog.stridePhase??0)+hog.speed*delta/25*5;
    hog.walkBlend=(hog.walkBlend??0)+((hog.speed>0?1:0)-(hog.walkBlend??0))*Math.min(1,delta*5);
    const forward={x:Math.cos(hog.heading),y:Math.sin(hog.heading)};
    const sample=(side,front)=>{
      const x=hog.x+forward.y*side*25+forward.x*front*25,y=hog.y-forward.x*side*25+forward.y*front*25;
      const ground=highestIceAt(world.platforms,x,y);return ground?getIceSurfaceHeight(ground,x,y):hog.z;
    };
    hog.feet=HOGWONG_FEET.map(([side,front])=>sample(side,front));
    hog.pitch=-Math.atan2(sample(0,.65)-sample(0,-.65),32.5);
    hog.roll=Math.atan2(sample(.43,0)-sample(-.43,0),21.5);
  }
}

/** A solid body capsule keeps the explorer from walking through the animal. */
export function resolveHogwongBodies(world) {
  const p=world.player;
  for(const hog of world.hogwongs??[]){
    if(hog.squidHeldBy||hog.squidRespawnIn>0||Math.hypot(p.x-hog.x,p.y-hog.y)>65)continue;
    const dx=Math.cos(hog.heading)*18,dy=Math.sin(hog.heading)*18;
    const pair=closestSquidSegments({x:p.x,y:p.y,z:p.z+5},{x:p.x,y:p.y,z:p.z+EYE_HEIGHT-5},
      {x:hog.x-dx,y:hog.y-dy,z:hog.z+27},{x:hog.x+dx,y:hog.y+dy,z:hog.z+27});
    const x=pair.a.x-pair.b.x,y=pair.a.y-pair.b.y,z=pair.a.z-pair.b.z,d=Math.hypot(x,y,z);
    if(d>=22)continue;
    const planar=Math.hypot(x,y),nx=planar>1e-6?x/planar:-Math.sin(hog.heading),ny=planar>1e-6?y/planar:Math.cos(hog.heading);
    const cx=p.x+nx*(22-d+.1),cy=p.y+ny*(22-d+.1),ice=highestIceAt(world.platforms,cx,cy);
    if(!ice||(hog.huntPlatformId?ice.id!==hog.huntPlatformId:ice.biome!=='iceberg-tundra'))continue;
    p.x=cx;p.y=cy;if(!p.swimming&&!p.jumping)p.z=getIceSurfaceHeight(ice,cx,cy);
  }
}

/** Eight tapered links form a whip, driven only by simulation time. */
export function hogwongTailPoint(hog,joint,reducedMotion=false,target={}) {
  const w=joint/8,t=reducedMotion?0:hog.phase;
  target.x=Math.sin(t*1.7-w*3.4)*.32*w*w;
  target.y=1.05-.62*w+Math.sin(t*1.4-w*2)*.08*w;
  target.z=-.86-1.46*w;
  return target;
}
