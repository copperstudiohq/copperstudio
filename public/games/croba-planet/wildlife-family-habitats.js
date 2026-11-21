import {getSulfurLizardGround,getSulfurLizardScale} from './sulfur-lizards.js';
import {redFishWaterClear,getRedFishRadius} from './red-fish.js';
import {updateRedFishTendrils} from './red-fish-tendril-physics.js';
import {frostHoundWaterClear} from './frost-hounds.js';
import {voidFishWaterClear} from './void-fish.js';

export const EXTENDED_FAMILIES=Object.freeze(['sulfur-lizard','red-fish','frost-hound','void-fish']);
export const RED_FISH_BROOD_VARIANTS=Object.freeze(['small','large','gray','glow']);
export const isExtendedFamily=species=>EXTENDED_FAMILIES.includes(species);
const available=a=>a&&!a.lifecycleInactive&&!a.squidHeldBy&&!(a.squidRespawnIn>0);

/** Founders, pairings, replacement and imports share the same local cohort. */
export function sameFamilyHabitat(a,b,species){
 if(species==='red-fish')return a.variant===b.variant&&a.habitat===b.habitat;
 if(species==='sulfur-lizard')return Math.abs(a.lengthMeters-b.lengthMeters)<.01;
 if(species==='frost-hound'||species==='void-fish')return Boolean(a.packId)&&a.packId===b.packId;
 return true;
}
export function familyRadius(animal,species){
 if(species==='red-fish')return getRedFishRadius(animal);
 if(species==='sulfur-lizard')return 30*getSulfurLizardScale(animal);
 return 48*(animal.lifecycleScale??1);
}
export function familyWaterClear(world,animal,species,x,y,z){
 if(species==='red-fish')return redFishWaterClear(world,animal,x,y,z);
 if(species==='frost-hound')return frostHoundWaterClear(world,x,y,z);
 if(species==='void-fish')return voidFishWaterClear(world,x,y,z);
 return getSulfurLizardGround(world,animal,x,y)!==null;
}

/** Finite authored-home offsets; every candidate uses real terrain/biome tests. */
export function* familyNurseryPoints(world,nest,species,template,_birthScale,index){
 // A quiet, distant baby can mature before its next navigation update. Reserve
 // terrain clearance for the complete adult while keeping its real small body.
 const probe={...template,lifecycleScale:1};
 for(const radius of[28,50,80,115,150])for(let turn=0;turn<12;turn++){
  const angle=index*.71+turn*Math.PI/6,x=nest.x+Math.cos(angle)*radius,y=nest.y+Math.sin(angle)*radius;
  if(species==='sulfur-lizard'){
   const z=getSulfurLizardGround(world,probe,x,y);if(z!==null)yield{x,y,z};
  }else for(const dz of[0,15,-15,30,-30]){
   const z=nest.z+dz;if(familyWaterClear(world,probe,species,x,y,z))yield{x,y,z};
  }
 }
}

/** Juveniles follow a reachable parent without joining pack attacks or hunts. */
export function updateFamilyYoung(world,animal,parent,species,dt,population){
 if(!available(animal))return;
 const scale=animal.lifecycleScale??1,withParent=available(parent)&&sameFamilyHabitat(animal,parent,species),radius=familyRadius(animal,species);
 const phase=(animal.phase??0)+dt;animal.phase=phase;animal.stateTime=(animal.stateTime??0)+dt;animal.speed=0;
 const distance=withParent?familyRadius(parent,species)+radius+12:40;
 const target=withParent?{x:parent.x-Math.cos(parent.heading)*distance,y:parent.y-Math.sin(parent.heading)*distance,z:parent.z}
  :{x:animal.homeX+Math.cos(phase*.14)*35,y:animal.homeY+Math.sin(phase*.14)*35,z:animal.homeZ??animal.z};
 const dx=target.x-animal.x,dy=target.y-animal.y,dz=target.z-animal.z,gap=Math.hypot(dx,dy,dz);
 animal.state=withParent?'following-parent':'nursery';animal.jet=0;
 if(gap>5){
  const speed=(species==='red-fish'?14:species==='sulfur-lizard'?12:24)*(.5+.5*scale),step=Math.min(gap-4,speed*dt),heading=Math.atan2(dy,dx);
  for(const turn of[0,.55,-.55,1.1,-1.1]){
   const angle=heading+turn,x=animal.x+Math.cos(angle)*step,y=animal.y+Math.sin(angle)*step;
   const z=species==='sulfur-lizard'?getSulfurLizardGround(world,animal,x,y):animal.z+Math.max(-step*.5,Math.min(step*.5,dz));
   if(z===null||!familyWaterClear(world,animal,species,x,y,z))continue;
   if(population.some(other=>other!==animal&&available(other)&&Math.hypot(x-other.x,y-other.y,z-other.z)<radius+familyRadius(other,species)+2&&Math.hypot(x-other.x,y-other.y,z-other.z)<=Math.hypot(animal.x-other.x,animal.y-other.y,animal.z-other.z)))continue;
   animal.vx=(x-animal.x)/dt;animal.vy=(y-animal.y)/dt;animal.vz=(z-animal.z)/dt;
   Object.assign(animal,{x,y,z,heading,speed,jet:species.includes('hound')||species==='void-fish'?.12:0});break;
  }
 }
 animal.moveBlend=(animal.moveBlend??0)+(Number(animal.speed>0)-(animal.moveBlend??0))*Math.min(1,dt*5);
 if(species==='red-fish')updateRedFishTendrils(world,animal,dt);
}
