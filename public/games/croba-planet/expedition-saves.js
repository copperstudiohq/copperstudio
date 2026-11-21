import {getSaltCave} from './salt-cave.js';
import {validateCraftingSave} from './crafting.js';
import {validateStructuresSave} from './base-building.js';
import{validateEquipmentSave}from'./copper-yoyo.js';
import {SULFURIC_PASSAGE,isSulfuricWorldPosition,getSulfuricGround,getSulfuricPassageFloor} from './sulfuric-biome.js';
import {playerIsUnderwater} from './basin-caves.js';
import {PREPARED_STARTER_PLANTS} from './starter-area-data.js';
import {createWorld,resetWorld} from './world.js';
import {ITEMS,BAG_CAPACITY,ediblePlants} from './survival.js';
import {getPenguinEggs,PENGUIN_EGG_LAY_SECONDS} from './penguin-nests.js';
import {snapshotPenguinBrood,restorePenguinBrood,isPenguinOffspringPosition,PENGUIN_EGG_HATCH_SECONDS,PENGUIN_CHICK_GROW_SECONDS,MAX_CROBON_OFFSPRING} from './penguin-lifecycle.js';
import {snapshotWildlifeLifecycle,validateWildlifeLifecycle,restoreWildlifeLifecycle} from './wildlife-lifecycle.js';
import {updateCaveWorms} from './cave-sand-worms.js';
import {WATER_LEVEL,EYE_HEIGHT} from './terrain.js';
import {NEW_PERIMETER_BOUNDS} from './world-perimeter.js';
import {getWorldBiome} from './biomes.js';
import {shellFieldBlend} from './shell-field.js';
import {getSeabedHeight} from './seabed.js';
import {getBestiaryEntries} from './bestiary.js';
const VERSION=1;
const removedStarterPlantIds=new Set(PREPARED_STARTER_PLANTS.map(p=>p.id));
let template;
function base(){
 if(!template){const w=createWorld();template={mapId:w.mapId,plantIds:new Set(ediblePlants(w).map(p=>p.id)),eggIds:new Set(getPenguinEggs(w).map(egg=>egg.id)),nestIds:new Set(w.penguinNests.map(nest=>nest.id)),broodWorld:{ship:w.ship,platforms:w.platforms,penguinNests:w.penguinNests},wildlifeWorld:w,itemIds:new Set(w.items.map(i=>i.id)),species:new Set(getBestiaryEntries(w).map(p=>p.id))};}
 return template;
}
const fail=message=>{throw new Error(`Invalid Croba save: ${message}`);};
const number=(n,min,max,label)=>{if(!Number.isFinite(n)||n<min||n>max)fail(label);return n;};
const record=v=>v&&typeof v==='object'&&!Array.isArray(v);

/** Compact progress, independent of the immutable map and transient wildlife AI. */
export function snapshotExpedition(world,look){
 if(world.sandWormEncounter||world.squidEncounter||world.centipedeEncounter||world.treeStalkerEncounter)throw new Error('Wait until the creature encounter ends before saving.');
 const p=world.player;
 return validateExpeditionSnapshot({version:VERSION,level:world.mapId,state:{elapsed:world.elapsed,respawns:world.respawns},
  player:{x:p.x,y:p.y,z:p.z,health:p.health,oxygen:p.oxygen,warmth:p.warmth,hunger:p.hunger,swimming:p.swimming},
  look:{yaw:look.yaw,pitch:look.pitch},inventory:world.inventory,quickSlots:world.quickSlots,activeQuickSlot:world.activeQuickSlot,copperCargo:world.copperCargo,crafting:world.crafting,structures:world.structures,harvestedPlants:world.harvestedPlants,takenPenguinEggs:world.takenPenguinEggs,penguinEggLaying:world.penguinEggLaying,penguinBrood:snapshotPenguinBrood(world),wildlifeLifecycle:snapshotWildlifeLifecycle(world),
  discoveries:world.items.filter(i=>i.collected).map(i=>i.id),bestiary:world.bestiary});
}
/** Whitelist fields and IDs before any imported state reaches the simulation. */
export function validateExpeditionSnapshot(value){
 const initial=base();
 if(!record(value)||value.version!==VERSION||value.level!==initial.mapId)fail('wrong world or version');
 if(!record(value.player)||!record(value.state)||!record(value.look)||!record(value.inventory)||!record(value.harvestedPlants)||!record(value.bestiary))fail('missing progress fields');
 const p=value.player,state={elapsed:number(value.state.elapsed,0,1e9,'elapsed time'),respawns:number(value.state.respawns,0,1e7,'rescue count')};
 if(!Number.isInteger(state.respawns)||typeof p.swimming!=='boolean')fail('player state');
 const player={x:number(p.x,NEW_PERIMETER_BOUNDS.minX,NEW_PERIMETER_BOUNDS.maxX,'position X'),y:number(p.y,NEW_PERIMETER_BOUNDS.minY,NEW_PERIMETER_BOUNDS.maxY,'position Y'),z:number(p.z,-4000,5000,'height'),swimming:p.swimming};
 // Existing swimmers saved on the former flat floor rise onto the repaired
 // surface. Keep this migration inside the original portal's valid volume.
 const passage=SULFURIC_PASSAGE;
 if(player.swimming&&Math.abs(player.x-passage.x)<=passage.halfWidth&&player.y>=passage.outerY&&player.y<=passage.innerY&&player.z>=passage.floor)
  player.z=Math.max(player.z,getSulfuricPassageFloor(player.x,player.y));
 if(!isSulfuricWorldPosition(player))fail('position outside the playable terrain');
 for(const key of ['health','oxygen','warmth','hunger'])player[key]=number(p[key],0,100,key);
 const look={yaw:number(value.look.yaw,-Math.PI,Math.PI,'view yaw'),pitch:number(value.look.pitch,-1.25,1.25,'view pitch')};
 const inventory={};let total=0;
 for(const [id,n]of Object.entries(value.inventory)){if(!Object.hasOwn(ITEMS,id)||!Number.isInteger(n)||n<0||n>BAG_CAPACITY)fail('inventory');if(n)inventory[id]=n;total+=n;}
 if(total>BAG_CAPACITY)fail('backpack capacity');
 const equipment=validateEquipmentSave(value,inventory);
 const crafting=validateCraftingSave(value.crafting,inventory),structures=validateStructuresSave(value.structures);
 if(inventory['builder-tool']&&!equipment.copperCargo.opened)fail('closed builder cargo');
 const takenPenguinEggs={};
 // Saves made before penguin nests existed have no stolen eggs.
 if(value.takenPenguinEggs!==undefined){
  if(!record(value.takenPenguinEggs))fail('taken penguin eggs');
  for(const [id,taken]of Object.entries(value.takenPenguinEggs)){if(!initial.eggIds.has(id)||taken!==true)fail('taken penguin egg');takenPenguinEggs[id]=true;}
 }
 const penguinEggLaying={};
 if(value.penguinEggLaying!==undefined){
  if(!record(value.penguinEggLaying))fail('penguin egg laying');
  for(const [id,seconds]of Object.entries(value.penguinEggLaying)){
   if(!initial.eggIds.has(id)||!takenPenguinEggs[id])fail('penguin egg laying slot');
   penguinEggLaying[id]=number(seconds,0,PENGUIN_EGG_LAY_SECONDS,'penguin egg laying time');
  }
 }
 const penguinBrood={incubation:{},offspring:[]};
 if(value.penguinBrood!==undefined){
  const brood=value.penguinBrood;
  if(!record(brood)||!record(brood.incubation)||!Array.isArray(brood.offspring)||brood.offspring.length>MAX_CROBON_OFFSPRING)fail('Crobon Bird brood');
  for(const [id,seconds]of Object.entries(brood.incubation)){
   if(!initial.eggIds.has(id)||takenPenguinEggs[id])fail('incubating egg');
   penguinBrood.incubation[id]=number(seconds,0,PENGUIN_EGG_HATCH_SECONDS,'egg incubation time');
  }
  const seen=new Set();
  for(const chick of brood.offspring){
   if(!record(chick)||!/^crobon-hatchling-[0-7]$/.test(chick.id)||seen.has(chick.id)||!initial.nestIds.has(chick.nestId))fail('Crobon Bird chick identity');
   if(!Number.isFinite(chick.localX)||!Number.isFinite(chick.localZ)||!isPenguinOffspringPosition(initial.broodWorld,chick.nestId,chick.localX,chick.localZ))fail('Crobon Bird nursery position');
   seen.add(chick.id);penguinBrood.offspring.push({id:chick.id,nestId:chick.nestId,age:number(chick.age,0,PENGUIN_CHICK_GROW_SECONDS,'chick growth'),localX:chick.localX,localZ:chick.localZ});
  }
 }
 const wildlifeLifecycle=validateWildlifeLifecycle(value.wildlifeLifecycle,{...initial.wildlifeWorld,elapsed:state.elapsed,penguinBrood});
 const plantIds=initial.plantIds,harvestedPlants={};
 for(const [id,until]of Object.entries(value.harvestedPlants)){if(!plantIds.has(id)){if(removedStarterPlantIds.has(id))continue;fail('harvested plant');}harvestedPlants[id]=number(until,0,state.elapsed+120.001,'regrowth time');}
 const itemIds=initial.itemIds;if(!Array.isArray(value.discoveries)||value.discoveries.length>itemIds.size||value.discoveries.some(id=>!itemIds.has(id)))fail('discoveries');
 const species=initial.species,bestiary={};
 for(const [id,entry]of Object.entries(value.bestiary)){if(!species.has(id)||!record(entry))fail('bestiary');bestiary[id]={firstSeenAt:number(entry.firstSeenAt,0,state.elapsed,'discovery time')};}
 return {version:VERSION,level:initial.mapId,state,player,look,inventory,...equipment,crafting,structures,harvestedPlants,takenPenguinEggs,penguinEggLaying,penguinBrood,wildlifeLifecycle,discoveries:[...new Set(value.discoveries)],bestiary};
}
export function restoreExpedition(world,value,look){
 const save=validateExpeditionSnapshot(value);resetWorld(world);
 Object.assign(world.player,save.player);world.player.underwater=playerIsUnderwater(world.player);
 // Old saves may be below the newly raised shelf; keep them above its real
 // collision surface without changing cave or other biome restore positions.
 const saltCave=getSaltCave(world.player.x,world.player.y,world.player.z,EYE_HEIGHT);
 if(saltCave)world.player.saltCaveId='salt-cave';
 if(!saltCave&&shellFieldBlend(world.player.x,world.player.y)>0)world.player.z=Math.max(world.player.z,getSeabedHeight(world.player.x,world.player.y));
 const sulfurGround=getSulfuricGround(world.player.x,world.player.y);
 if(!saltCave&&sulfurGround!==null)world.player.z=Math.max(world.player.z,sulfurGround);
 if(!saltCave&&sulfurGround!==null&&sulfurGround>=WATER_LEVEL-EYE_HEIGHT+9&&world.player.z<=sulfurGround+.001)world.player.swimming=false;
 world.player.underwater=playerIsUnderwater(world.player);
 Object.assign(world,{...save.state,inventory:save.inventory,quickSlots:save.quickSlots,activeQuickSlot:save.activeQuickSlot,copperCargo:save.copperCargo,crafting:save.crafting,structures:save.structures,harvestedPlants:save.harvestedPlants,takenPenguinEggs:save.takenPenguinEggs,penguinEggLaying:save.penguinEggLaying,bestiary:save.bestiary});
 Object.assign(world,{buildPlan:'universal-base',buildRotation:0,buildPreview:null,buildPreviewKey:null});
 restorePenguinBrood(world,save.penguinBrood);
 restoreWildlifeLifecycle(world,save.wildlifeLifecycle);
 updateCaveWorms(world);
 for(const item of world.items)item.collected=save.discoveries.includes(item.id);
 world.collected=save.discoveries.length;world.complete=world.collected===world.items.length;world.harvestVersion++;
 world.biome=getWorldBiome(world,world.player.x,world.player.y,world.player.underwater);
 Object.assign(look,save.look);world.notice='Expedition restored. Wildlife resumes from its prepared homes.';world.noticeTime=6;return world;
}
