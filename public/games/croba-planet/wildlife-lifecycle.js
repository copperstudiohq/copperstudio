import {WILDLIFE_LIFECYCLES,WILDLIFE_DEATH_SECONDS,MAX_WILDLIFE_YOUNG,getWormNurseryState} from './wildlife-lifecycle-data.js';
import {highestIceAt,getIceSurfaceHeight} from './ice-surface.js';
import {getSeabedHeight} from './seabed.js';
import {getSulfuricGround} from './sulfuric-biome.js';
import {getIceSection,pointInPolygon,WATER_LEVEL} from './terrain.js';
import {hogwongGround} from './tundra-hogwongs.js';
import {releaseHogwongHunt} from './hogwong-hunting.js';
import {attachIsopodToSurface,updateIsopodSurface} from './isopod-surface.js';
import {updateCrabMovement} from './crab-movement.js';
import {poseLifecycleWorm} from './cave-sand-worms.js';
import {woodlonGround,updateWoodlonYoung} from './woodlons.js';
import {EXTENDED_FAMILIES,RED_FISH_BROOD_VARIANTS,isExtendedFamily,sameFamilyHabitat,familyRadius,familyNurseryPoints,updateFamilyYoung} from './wildlife-family-habitats.js';
import {removePenguinOffspring,PENGUIN_CHICK_GROW_SECONDS} from './penguin-lifecycle.js';

const runtimes=new WeakMap(),speciesIds=Object.keys(WILDLIFE_LIFECYCLES);
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const available=a=>a&&!a.lifecycleInactive&&!a.squidHeldBy&&!(a.squidRespawnIn>0);
const finite=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const youngId=(species,index)=>`wildlife-${species}-young-${index}`;
const fail=message=>{throw new Error(`Invalid Croba save: wildlife ${message}`);};
const founders=(world,species)=>(world[WILDLIFE_LIFECYCLES[species].group]??[]).filter(a=>species!=='crobon-bird'||!a.offspringId);
const initialAdult=(animal,species,index)=>({id:animal.id,species,age:WILDLIFE_LIFECYCLES[species].lifespan*(.15+(index%11)*.055),generation:0,cooldown:Math.min(WILDLIFE_LIFECYCLES[species].cooldown,12+(index%6)*9),stage:'adult',remaining:0,mateId:null,courtship:0,successorId:null});
const initialState=world=>({version:1,clock:0,adults:speciesIds.flatMap(species=>founders(world,species).map((a,i)=>initialAdult(a,species,i))),offspring:[]});

function fixedNest(world,animal,species){
 const x=Number.isFinite(animal.homeX)?animal.homeX:animal.x,y=Number.isFinite(animal.homeY)?animal.homeY:animal.y;
 const ice=species==='hogwong'?highestIceAt(world.platforms??[],x,y):null;
 return {id:animal.id,x,y,z:ice?getIceSurfaceHeight(ice,x,y):species==='sand-worm'?(getSulfuricGround(x,y)??animal.z):animal.z,
  platformId:ice?.id??animal.platformId,habitat:animal.habitat,targetBoneId:animal.targetBoneId,variant:animal.variant,lengthMeters:animal.lengthMeters,packId:animal.packId,species};
}

/** Stable render-only young slots share the original species' instanced batches.
 * Authoritative progress lives outside descriptors so prey respawns cannot erase it. */
export function initializeWildlifeLifecycle(world){
 const rt={actors:new Map(),nests:new Map(),young:new Map(),populations:new Map(),sources:new Map(),templates:new Map(),pulse:0};
 const adults=[],pool=[];
 for(const species of speciesIds){
  const spec=WILDLIFE_LIFECYCLES[species],originals=founders(world,species),population=[...originals];
  originals.forEach((animal,index)=>{
   const record=initialAdult(animal,species,index);
   adults.push(record);rt.actors.set(animal.id,animal);rt.nests.set(animal.id,fixedNest(world,animal,species));rt.templates.set(animal.id,structuredClone(animal));
   Object.assign(animal,{lifecycleInactive:false,lifecycleStage:'adult',lifecycleScale:1,lifecycleAge:record.age/spec.lifespan,lifecycleSpeedScale:1,lifecycleCourting:false});
  });
  for(let index=0;index<spec.capacity;index++){
   const template=originals[index%Math.max(1,originals.length)]??{x:0,y:0,z:0,heading:0,size:1,phase:0,seed:index};
   const animal=structuredClone(template);Object.assign(animal,{id:youngId(species,index),species,lifecycleRenderOnly:true,lifecycleInactive:true,lifecycleStage:'inactive',lifecycleScale:spec.birthScale,growth:0});
   delete animal.squidHeldBy;delete animal.squidRespawnIn;delete animal.huntPreyId;delete animal.huntPlatformId;
   rt.young.set(animal.id,animal);pool.push(animal);population.push(animal);
  }
  rt.populations.set(species,population);
  rt.sources.set(species,world[spec.group]);
 }
 world.wildlifeLifecycle={version:1,clock:0,adults,offspring:[]};world.wildlifeYoung=pool;world.wildlifeBroods=[];runtimes.set(world,rt);return world;
}

export function getWildlifeRenderPopulation(world,species){
 if(!runtimes.has(world))return world[WILDLIFE_LIFECYCLES[species]?.group]??[];
 const rt=runtimes.get(world),spec=WILDLIFE_LIFECYCLES[species],population=rt.populations.get(species);if(!spec||!population)return[];
 if(rt.sources.get(species)!==world[spec.group]){
  population.splice(0,population.length,...founders(world,species),...world.wildlifeYoung.filter(a=>a.species===species));rt.sources.set(species,world[spec.group]);
 }
 return population;
}

function clearCourt(animal,nest){
 if(!animal)return;animal.lifecycleCourting=false;delete animal.lifecycleMateId;delete animal.lifecycleTarget;
 if(nest){animal.homeX=nest.x;animal.homeY=nest.y;}
}
function pairDistance(a,b,species){
 if(species!=='sand-worm')return distance(a,b);
 let best=Infinity;
 for(const i of[0,12,24,36,47])for(const j of[0,12,24,36,47]){
  const x=a.segments?.[i],y=b.segments?.[j];
  if(finite(x)&&finite(y)&&x.z<=x.ground&&y.z<=y.ground)best=Math.min(best,distance(x,y));
 }
 return best;
}
const eligible=(record,animal)=>record.stage==='adult'&&record.cooldown<=0&&available(animal)
 &&!animal.huntPreyId&&(record.species!=='sand-worm'||animal.behavior==='patrol')
 &&(record.species!=='sulfur-lizard'||animal.state!=='retreating')
 &&(!['frost-hound','void-fish'].includes(record.species)||['patrolling','courting'].includes(animal.state));

function compatible(world,a,b,rt){
 if(a.species!==b.species||a.id===b.id)return false;
 const aa=rt.actors.get(a.id),bb=rt.actors.get(b.id),spec=WILDLIFE_LIFECYCLES[a.species];
 if(!eligible(a,aa)||!eligible(b,bb))return false;
 if(a.species==='hogwong'&&rt.nests.get(a.id).platformId!==rt.nests.get(b.id).platformId)return false;
 if(a.species==='woodlon'&&(aa.habitat!==bb.habitat||aa.platformId!==bb.platformId||aa.targetBoneId!==bb.targetBoneId))return false;
 if(isExtendedFamily(a.species)&&!sameFamilyHabitat(aa,bb,a.species))return false;
 if(a.species!=='sand-worm'&&Math.abs(aa.z-bb.z)>100)return false;
 return pairDistance(aa,bb,a.species)<=spec.mateRange;
}

function freeYoungSlot(world,record,animal){
 const spec=WILDLIFE_LIFECYCLES[record.species];
 const candidates=record.species==='red-fish'?[youngId(record.species,RED_FISH_BROOD_VARIANTS.indexOf(animal.variant))]:Array.from({length:spec.capacity},(_,i)=>youngId(record.species,i));
 return candidates.find(id=>!world.wildlifeLifecycle.offspring.some(o=>o.id===id));
}

function pairAdults(world,rt){
 const records=world.wildlifeLifecycle.adults;
 for(const a of records){
  if(a.mateId||!eligible(a,rt.actors.get(a.id)))continue;
  const spec=WILDLIFE_LIFECYCLES[a.species];
  if(!freeYoungSlot(world,a,rt.actors.get(a.id)))continue;
  const b=records.filter(b=>!b.mateId&&compatible(world,a,b,rt)).sort((b,c)=>pairDistance(rt.actors.get(a.id),rt.actors.get(b.id),a.species)-pairDistance(rt.actors.get(a.id),rt.actors.get(c.id),a.species)||b.id.localeCompare(c.id))[0];
  if(b){a.mateId=b.id;b.mateId=a.id;a.courtship=b.courtship=0;}
 }
}

function updatePairs(world,rt,dt){
 const records=world.wildlifeLifecycle.adults,byId=new Map(records.map(r=>[r.id,r]));
 for(const a of records){
  if(!a.mateId)continue;
  const b=byId.get(a.mateId),aa=rt.actors.get(a.id),bb=b&&rt.actors.get(b.id);
  if(!b||b.mateId!==a.id||!compatible(world,a,b,rt)){
   a.mateId=null;a.courtship=0;clearCourt(aa,rt.nests.get(a.id));
   if(b?.mateId===a.id){b.mateId=null;b.courtship=0;clearCourt(bb,rt.nests.get(b.id));}continue;
  }
  Object.assign(aa,{lifecycleCourting:true,lifecycleMateId:b.id,lifecycleTarget:{x:bb.x,y:bb.y,z:bb.z}});
  if(a.species==='isopod'){aa.homeX=bb.x;aa.homeY=bb.y;}
  if(a.id>b.id)continue;
  const spec=WILDLIFE_LIFECYCLES[a.species],contact=a.species==='red-fish'?familyRadius(aa,a.species)+familyRadius(bb,a.species)+8:spec.contact,close=pairDistance(aa,bb,a.species)<=contact;
  a.courtship=b.courtship=close?a.courtship+dt:Math.max(0,a.courtship-dt*.5);
  if(a.courtship<spec.courtship)continue;
  const slot=freeYoungSlot(world,a,aa);
  if(slot){
   world.wildlifeLifecycle.offspring.push({id:slot,species:a.species,parentIds:[a.id,b.id],nestId:a.id,stage:spec.brood,age:0});
   a.cooldown=b.cooldown=spec.cooldown;
  }
  for(const r of[a,b]){r.mateId=null;r.courtship=0;clearCourt(rt.actors.get(r.id),rt.nests.get(r.id));}
 }
}

/** Hatch sites are offsets from a named fixed home, never imported coordinates.
 * Reject enclosed ice and steep lips instead of moving a newborn through them. */
function* nurseryPoints(world,nest,species,index){
 if(species==='sand-worm'){yield{x:nest.x,y:nest.y,z:nest.z};return;}
 const radii=species==='hogwong'?[90,115,145]:species==='isopod'?[80,105,135,165]:species==='woodlon'?[26,42,62]:[22,38,55,0];
 for(const radius of radii)for(let turn=0;turn<8;turn++){
  const angle=index*.91+turn*Math.PI/4,x=nest.x+Math.cos(angle)*radius,y=nest.y+Math.sin(angle)*radius;
  if(species==='woodlon'){
   const z=woodlonGround(world,nest,x,y);if(z!==null&&Math.abs(z-nest.z)<18)yield{x,y,z};
  }else if(species==='hogwong'){
   const z=hogwongGround(world,x,y);if(z!==null&&highestIceAt(world.platforms??[],x,y)?.id===nest.platformId)yield{x,y,z};
  }
  else {
   const z=getSeabedHeight(x,y);if(z>WATER_LEVEL-50)continue;
   if((world.platforms??[]).some(ice=>z<(ice.z??0)&&pointInPolygon(getIceSection(ice,z-(ice.z??0)),x,y)))continue;
   if(Math.max(...[[12,0],[-12,0],[0,12],[0,-12]].map(([dx,dy])=>Math.abs(getSeabedHeight(x+dx,y+dy)-z)))>18)continue;
   yield{x,y,z};
  }
 }
}

function bodyEnvelope(animal,species,scale=animal.lifecycleScale??1){
 if(isExtendedFamily(species))return{radius:familyRadius({...animal,lifecycleScale:scale},species),centerZ:species==='sulfur-lizard'?10*scale:0};
 if(species==='woodlon')return{radius:14*scale,centerZ:13.5*scale};
 if(species==='hogwong')return{radius:55*scale,centerZ:27*scale};
 if(species==='isopod'){const size=animal.size??1;return{radius:54*size,centerZ:0};}
 return{radius:12*scale,centerZ:22*scale};
}
function nurseryClear(rt,animal,species,point,envelope){
 for(const [id,other]of [...rt.actors,...rt.young]){
  if(id===animal.id||!available(other))continue;
  const otherSpecies=other.species??rt.nests.get(id)?.species;if(otherSpecies==='sand-worm')continue;
  const bounds=bodyEnvelope(other,otherSpecies);
  if(Math.hypot(point.x-other.x,point.y-other.y,point.z+envelope.centerZ-other.z-bounds.centerZ)<envelope.radius+bounds.radius+6)return false;
 }
 return true;
}

function activateYoung(world,rt,record){
 const animal=rt.young.get(record.id),nest=rt.nests.get(record.nestId),index=Number(record.id.split('-').at(-1));
 const template=rt.templates.get(record.nestId),spec=WILDLIFE_LIFECYCLES[record.species];
 const growth=clamp(record.age/spec.growth),scale=record.species==='sand-worm'?getWormNurseryState(record.age).scale:spec.birthScale+(1-spec.birthScale)*growth;
 const envelope=bodyEnvelope({...template,size:(template.size??1)*scale},record.species,scale);
 // Keep the pooled object identity intact across repeated births and stages.
 const revision=(animal.lifecycleRevision??0)+1;
 const points=isExtendedFamily(record.species)?familyNurseryPoints(world,nest,record.species,template,scale,index):nurseryPoints(world,nest,record.species,index);
 for(const point of points){
  if(record.species!=='sand-worm'&&!nurseryClear(rt,animal,record.species,point,envelope))continue;
  for(const key of Object.keys(animal))delete animal[key];
  Object.assign(animal,structuredClone(template),point,{id:record.id,species:record.species,homeX:point.x,homeY:point.y,lifecycleRenderOnly:true,lifecycleRevision:revision,lifecycleInactive:false,lifecycleStage:record.stage,lifecycleScale:scale,lifecycleSpeedScale:1,growth,lifecycleCourting:false});
  delete animal.squidHeldBy;delete animal.squidRespawnIn;delete animal.huntPreyId;
  for(const key of['surfaceSpine','surfaceOrientation','surfaceContact','surfaceNormal','surfaceForward'])delete animal[key];
  if(record.species==='isopod'){
   animal.size=(template.size??1)*scale;
   if(!attachIsopodToSurface(world,animal)||Math.hypot(animal.x-nest.x,animal.y-nest.y)>195||!nurseryClear(rt,animal,record.species,animal,envelope)){animal.lifecycleInactive=true;continue;}
  }
  return true;
 }
 animal.lifecycleInactive=true;return false;
}

function syncViews(world,rt){
 world.wildlifeBroods.length=0;
 for(const record of world.wildlifeLifecycle.offspring){
  const spec=WILDLIFE_LIFECYCLES[record.species],animal=rt.young.get(record.id),nest=rt.nests.get(record.nestId),growing=record.stage==='juvenile'||record.stage==='mature';
  if(!growing){
   animal.lifecycleInactive=true;
   if(record.species==='woodlon'||record.species==='frost-hound'||record.species==='void-fish')continue; // Internal live pregnancy has no egg or pouch model.
   const parent=rt.actors.get(record.nestId),p=spec.brood==='gestating'&&available(parent)?parent:nest;
   world.wildlifeBroods.push({id:record.id,species:record.species,stage:record.stage,parentIds:[...record.parentIds],nestId:nest.id,x:p.x,y:p.y,z:p.z,count:1,progress:clamp(record.age/spec.incubation)});continue;
  }
  if(animal.lifecycleInactive&&!activateYoung(world,rt,record))continue;
  const growth=clamp(record.age/spec.growth),nursery=record.species==='sand-worm'?getWormNurseryState(record.age):null,scale=nursery?.scale??spec.birthScale+(1-spec.birthScale)*growth;
  Object.assign(animal,{lifecycleStage:record.stage,lifecycleScale:scale,growth});
  if(record.species==='woodlon')Object.assign(animal,{lifecycleCoatWhite:1-clamp((growth-.1)/.75),lifecycleFluff:Math.pow(1-growth,.7)});
  if(nursery){Object.assign(animal,{lifecycleAgeSeconds:record.age,lifecycleHabitat:nursery.habitat,lifecyclePhaseProgress:nursery.progress,lifecycleNestX:nest.x,lifecycleNestY:nest.y,lifecycleNestZ:nest.z});poseLifecycleWorm(animal);}
  if(record.species==='isopod')animal.size=(rt.templates.get(record.nestId).size??1)*scale;
 }
 const active=new Set(world.wildlifeLifecycle.offspring.filter(r=>r.stage==='juvenile'||r.stage==='mature').map(r=>r.id));
 for(const animal of world.wildlifeYoung)if(!active.has(animal.id)){animal.lifecycleInactive=true;animal.lifecycleStage='inactive';}
}

function successorFor(world,rt,record,id=null,reservedIds=null){
 const state=world.wildlifeLifecycle,spec=WILDLIFE_LIFECYCLES[record.species],nest=rt.nests.get(record.id),actor=rt.actors.get(record.id);
 const reserved=reservedIds??new Set(state.adults.filter(a=>a!==record&&a.successorId).map(a=>a.successorId));
 if(record.species==='crobon-bird'){
  const child=(world.penguinBrood?.offspring??[]).find(o=>(!id||o.id===id)&&o.age>=PENGUIN_CHICK_GROW_SECONDS&&(!reserved.has(o.id)||o.id===record.successorId)&&available((world.penguins??[]).find(a=>a.id===o.id))&&(world.penguins??[]).find(a=>a.id===o.id)?.colony===actor.colony);
  return child?{record:child,animal:world.penguins.find(a=>a.id===child.id)}:null;
 }
 const child=state.offspring.find(o=>{
  const home=rt.nests.get(o.nestId),young=rt.young.get(o.id);
  return (!id||o.id===id)&&(!reserved.has(o.id)||o.id===record.successorId)&&available(young)&&o.species===record.species&&o.stage==='mature'
   &&(record.species!=='woodlon'||home.targetBoneId===nest.targetBoneId&&home.platformId===nest.platformId&&home.habitat===nest.habitat)
   &&(!isExtendedFamily(record.species)||sameFamilyHabitat(home,nest,record.species))&&Math.hypot(home.x-nest.x,home.y-nest.y)<spec.mateRange*2;
 });
 return child?{record:child,animal:rt.young.get(child.id)}:null;
}

function ageAdults(world,rt,dt){
 const state=world.wildlifeLifecycle,reserved=new Set(state.adults.map(a=>a.successorId).filter(Boolean));
 for(const record of state.adults){
  const animal=rt.actors.get(record.id),spec=WILDLIFE_LIFECYCLES[record.species];
  if(record.stage==='adult'){
   if(!record.mateId)clearCourt(animal,rt.nests.get(record.id));
   animal.lifecycleInactive=false;animal.lifecycleStage='adult';animal.lifecycleScale=1;animal.lifecycleAge=record.age/spec.lifespan;
   animal.lifecycleSpeedScale=1-.4*clamp((animal.lifecycleAge-.75)/.25);
   if(animal.squidHeldBy||animal.squidRespawnIn>0||world.sandWormEncounter?.wormId===animal.id)continue;
   record.age=Math.min(spec.lifespan,record.age+dt);record.cooldown=Math.max(0,record.cooldown-dt);
   if(record.age<spec.lifespan)continue;
   const successor=successorFor(world,rt,record,null,reserved);if(!successor)continue; // Keep a viable local population until a real generation can take over.
   record.successorId=successor.record.id;reserved.add(record.successorId);
   if(record.species==='hogwong')releaseHogwongHunt(world,animal);
   record.stage='dead';record.remaining=WILDLIFE_DEATH_SECONDS;record.mateId=null;record.courtship=0;
   clearCourt(animal,rt.nests.get(record.id));animal.speed=0;
  }
  animal.lifecycleInactive=true;animal.lifecycleStage='dead';record.remaining=Math.max(0,record.remaining-dt);
  if(record.successorId){
   const exists=record.species==='crobon-bird'?(world.penguinBrood?.offspring??[]).some(o=>o.id===record.successorId):state.offspring.some(o=>o.id===record.successorId);
   if(!exists){reserved.delete(record.successorId);record.successorId=null;record.stage='adult';record.remaining=0;animal.lifecycleInactive=false;animal.lifecycleStage='adult';continue;}
  }
  if(record.remaining>0)continue;
  if(animal.squidHeldBy||animal.squidRespawnIn>0)continue;
  const successor=successorFor(world,rt,record,record.successorId,reserved);if(!successor)continue;
  // Original identity and authored home are retained for encounters and feeding.
  for(const key of Object.keys(animal))delete animal[key];Object.assign(animal,structuredClone(rt.templates.get(record.id)));
  reserved.delete(record.successorId);record.age=0;record.generation++;record.stage='adult';record.cooldown=spec.cooldown;record.remaining=0;record.successorId=null;
  Object.assign(animal,{lifecycleInactive:false,lifecycleStage:'adult',lifecycleScale:1,lifecycleAge:0,lifecycleSpeedScale:1,lifecycleCourting:false});
  if(record.species==='crobon-bird'){
   removePenguinOffspring(world,successor.record.id);
   const nest=world.penguinNests?.find(n=>n.id===animal.nestId);if(nest&&!nest.sitterId)nest.sitterId=animal.id;
  }else {successor.animal.lifecycleInactive=true;state.offspring.splice(state.offspring.indexOf(successor.record),1);}
 }
}

/** Simulation-only timers: menus withhold ticks; distant broods still grow.
 * Ownership freezes parents, and encounters cannot finish a courtship offscreen. */
export function updateWildlifeLifecycle(world,dt){
 if(!Number.isFinite(dt)||dt<=0)return;
 if(!runtimes.has(world))initializeWildlifeLifecycle(world);
 const delta=Math.min(dt,.05),rt=runtimes.get(world),state=world.wildlifeLifecycle;state.clock+=delta;
 ageAdults(world,rt,delta);
 for(const record of [...state.offspring]){
  const spec=WILDLIFE_LIFECYCLES[record.species];
  if(record.stage==='gestating'){
   const mother=state.adults.find(a=>a.id===record.nestId);
   if(mother?.stage==='dead'){state.offspring.splice(state.offspring.indexOf(record),1);continue;}
   if(!available(rt.actors.get(record.nestId)))continue;
  }
  record.age+=delta;
  if((record.stage==='gestating'||record.stage==='incubating')&&record.age>=spec.incubation){
   const age=record.age;record.stage='juvenile';record.age=0;
   if(!activateYoung(world,rt,record)){record.stage=spec.brood;record.age=Math.min(age,spec.incubation);}
   else if((world.noticeTime??0)<=0&&distance(world.player,rt.young.get(record.id))<250){const names={'crab':'Red Root Crab','isopod':'Gold Rock Bug','hogwong':'Hogwong','woodlon':'Woodlon','sand-worm':'Crobonic Artic Sulfur Worm','sulfur-lizard':'Sulfur Maw Lizard','red-fish':'Red Fish','frost-hound':'Frost Hound','void-fish':'Void Fish'};world.notice=`A young ${names[record.species]} has ${spec.brood==='gestating'&&record.species!=='isopod'?'been born':'hatched'}.`;world.noticeTime=6;}
  }else if(record.stage==='juvenile'&&record.age>=spec.growth){record.stage='mature';record.age=spec.growth;}
  else if(record.stage==='mature'&&record.age>=spec.growth+spec.lifespan){
   if(state.adults.some(a=>a.successorId===record.id))record.age=spec.growth+spec.lifespan;
   else {rt.young.get(record.id).lifecycleInactive=true;state.offspring.splice(state.offspring.indexOf(record),1);}
  }
 }
 const encounter=world.squidEncounter||world.centipedeEncounter||world.treeStalkerEncounter||world.sandWormEncounter;
 if(!encounter){rt.pulse-=delta;if(rt.pulse<=0){pairAdults(world,rt);rt.pulse=1;}updatePairs(world,rt,delta);}
 else for(const animal of rt.actors.values())clearCourt(animal,rt.nests.get(animal.id));
 syncViews(world,rt);
 // Bounded young use existing safe locomotion, never adult hunting or attacks.
 const near=animal=>distance(world.player,animal)<2000;
 const crabs=world.wildlifeYoung.filter(a=>a.species==='crab'&&!a.lifecycleInactive&&near(a));
 if(crabs.length)updateCrabMovement({...world,crabs},delta);
 for(const young of world.wildlifeYoung){
  if(young.lifecycleInactive||!near(young))continue;
  if(young.species==='isopod')updateIsopodSurface(world,young,state.clock,delta);
  else if(isExtendedFamily(young.species)){
   const record=state.offspring.find(o=>o.id===young.id);updateFamilyYoung(world,young,rt.actors.get(record.nestId),young.species,delta,rt.populations.get(young.species));
  }
  else if(young.species==='woodlon'){
   const record=state.offspring.find(o=>o.id===young.id);updateWoodlonYoung(world,young,rt.actors.get(record.nestId),delta,rt.populations.get('woodlon'));
  }
  else if(young.species==='hogwong'){
   const angle=state.clock*.15+Number(young.id.split('-').at(-1)),x=young.x+Math.cos(angle)*4*delta,y=young.y+Math.sin(angle)*4*delta,z=hogwongGround(world,x,y);
   if(z!==null&&Math.hypot(x-young.homeX,y-young.homeY)<65){young.x=x;young.y=y;young.z=z;young.heading=angle;young.phase=(young.phase??0)+delta;young.speed=4;young.stridePhase=(young.stridePhase??0)+delta*.8;}
  }
 }
}

export function snapshotWildlifeLifecycle(world){
 if(!runtimes.has(world))initializeWildlifeLifecycle(world);
 return structuredClone(world.wildlifeLifecycle);
}

/** Reject arbitrary species, identities, stages, parents and coordinates before restore. */
export function validateWildlifeLifecycle(value,world){
 if(value===undefined)return initialState(world);
 if(!value||value.version!==1||!Number.isFinite(value.clock)||value.clock<0||value.clock>1e9||!Array.isArray(value.adults)||!Array.isArray(value.offspring)||value.offspring.length>MAX_WILDLIFE_YOUNG)fail('state');
 const known=new Map();for(const species of speciesIds)for(const a of founders(world,species))known.set(a.id,species);
 // Add only wholly absent later populations; partial cohorts remain invalid.
 const woodlons=world.woodlons??[],sources=[...value.adults];
 for(const species of['woodlon',...EXTENDED_FAMILIES,'crobon-bird'])if(!sources.some(a=>a?.species===species)){
  if(value.offspring.some(o=>o?.species===species))fail('young progress without parents');
  sources.push(...founders(world,species).map((a,i)=>initialAdult(a,species,i)));
 }
 if(sources.length!==known.size)fail('adult population');
 const seen=new Set(),adults=sources.map(source=>{
  const spec=WILDLIFE_LIFECYCLES[source?.species];
  if(!spec||known.get(source.id)!==source.species||seen.has(source.id)||!['adult','dead'].includes(source.stage))fail('adult identity');seen.add(source.id);
  for(const [key,max]of [['age',spec.lifespan],['generation',1e6],['cooldown',spec.cooldown],['remaining',WILDLIFE_DEATH_SECONDS],['courtship',spec.courtship]])if(!Number.isFinite(source[key])||source[key]<0||source[key]>max)fail(`adult ${key}`);
  if(!Number.isInteger(source.generation)||source.mateId!==null&&(known.get(source.mateId)!==source.species||source.mateId===source.id))fail('mate');
  if(source.successorId!==undefined&&source.successorId!==null&&typeof source.successorId!=='string')fail('successor identity');
  return{id:source.id,species:source.species,age:source.age||0,generation:source.generation,cooldown:source.cooldown||0,stage:source.stage,remaining:source.remaining||0,mateId:source.mateId,courtship:source.courtship||0,successorId:source.successorId??null};
 });
 const byId=new Map(adults.map(a=>[a.id,a]));for(const adult of adults)if(adult.mateId&&(adult.stage!=='adult'||byId.get(adult.mateId)?.mateId!==adult.id))fail('asymmetric courtship');
 const slots=new Set(),offspring=value.offspring.map(source=>{
  const spec=WILDLIFE_LIFECYCLES[source?.species];
  if(!spec||!Array.from({length:spec.capacity},(_,i)=>youngId(source.species,i)).includes(source.id)||slots.has(source.id))fail('young identity');slots.add(source.id);
  if(!Array.isArray(source.parentIds)||source.parentIds.length!==2||source.parentIds[0]===source.parentIds[1]||source.parentIds.some(id=>known.get(id)!==source.species)||!source.parentIds.includes(source.nestId))fail('parent or nest');
  if(source.species==='woodlon'){
   const [a,b]=source.parentIds.map(id=>woodlons.find(a=>a.id===id));
   if(a.targetBoneId!==b.targetBoneId||a.platformId!==b.platformId||a.habitat!==b.habitat)fail('Woodlon family habitat');
  }
  if(isExtendedFamily(source.species)){
   const parents=source.parentIds.map(id=>founders(world,source.species).find(a=>a.id===id));
   if(!sameFamilyHabitat(...parents,source.species)||source.species==='red-fish'&&source.id!==youngId('red-fish',RED_FISH_BROOD_VARIANTS.indexOf(parents[0].variant)))fail('family habitat or variant');
  }
  if(![spec.brood,'juvenile','mature'].includes(source.stage)||!Number.isFinite(source.age)||source.age<0||source.age>(source.stage===spec.brood?spec.incubation:source.stage==='juvenile'?spec.growth:spec.growth+spec.lifespan)||source.stage==='mature'&&source.age<spec.growth)fail('young age or stage');
  return{id:source.id,species:source.species,parentIds:[...source.parentIds],nestId:source.nestId,stage:source.stage,age:source.age||0};
 });
 const reservations=new Set();
 for(const adult of adults)if(adult.successorId){
  const child=adult.species==='crobon-bird'?(world.penguinBrood?.offspring??[]).find(o=>o.id===adult.successorId&&o.age>=PENGUIN_CHICK_GROW_SECONDS):offspring.find(o=>o.id===adult.successorId&&o.species===adult.species&&o.stage==='mature');
  if(adult.stage!=='dead'||!child||reservations.has(adult.successorId))fail('successor reservation');reservations.add(adult.successorId);
  const actor=founders(world,adult.species).find(a=>a.id===adult.id);
  if(adult.species==='crobon-bird'){
   if(world.penguinNests?.find(n=>n.id===child.nestId)?.colony!==actor.colony)fail('successor colony');
  }else {
   const parent=founders(world,adult.species).find(a=>a.id===child.nestId);
   if(isExtendedFamily(adult.species)&&!sameFamilyHabitat(actor,parent,adult.species)||adult.species==='woodlon'&&actor.targetBoneId!==parent.targetBoneId)fail('successor habitat');
  }
 }
 return{version:1,clock:value.clock||0,adults,offspring};
}

export function restoreWildlifeLifecycle(world,value){
 const valid=validateWildlifeLifecycle(value,world);initializeWildlifeLifecycle(world);world.wildlifeLifecycle=valid;
 const rt=runtimes.get(world);
 for(const record of valid.adults){const age=record.age/WILDLIFE_LIFECYCLES[record.species].lifespan;Object.assign(rt.actors.get(record.id),{lifecycleInactive:record.stage==='dead',lifecycleStage:record.stage,lifecycleScale:1,lifecycleAge:age,lifecycleSpeedScale:1-.4*clamp((age-.75)/.25)});}
 syncViews(world,rt);return world;
}
