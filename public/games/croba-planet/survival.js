import {getPenguinEggs,alarmPenguinNest} from './penguin-nests.js';
import {CROBAN_MANGO_SITES} from './croban-mango.js';
import {CRAFTING_ITEMS} from './crafting-catalog.js';

/** Identified plants, blue Croban mangoes and Crobon Bird eggs supply food. */
export const FOOD=Object.freeze({
 ration:Object.freeze({name:'Emergency ration',nutrition:35}),
 'glassroot-leaf':Object.freeze({name:'Glassroot leaf',nutrition:18}),
 'kelp-leaf':Object.freeze({name:'Azure kelp leaf',nutrition:22}),
 'crown-frond':Object.freeze({name:'Crown fern frond',nutrition:20}),
 'frost-leaf':Object.freeze({name:'Frozen basin leaf',nutrition:15}),
 'penguin-egg':Object.freeze({name:'Crobon Bird egg',nutrition:30}),
 'croban-mango':Object.freeze({name:'Croban mango',nutrition:26}),
});
export const ITEMS=Object.freeze({...FOOD,'copper-yoyo':Object.freeze({name:'Copper yo-yo',gear:true}),...CRAFTING_ITEMS});
export const BAG_CAPACITY=24,LEAF_REGROW_SECONDS=120;
const edible=Object.freeze({'glassroot-bloom':'glassroot-leaf','azure-sail-kelp':'kelp-leaf','crown-fern':'crown-frond'});
const lookup=new WeakMap();
export function initializeSurvival(world){
 world.player.hunger=100;world.inventory={ration:3};world.harvestedPlants={};world.harvestVersion=0;world.takenPenguinEggs={};world.penguinEggLaying={};
 return world;
}
export function inventoryCount(world){return Object.values(world.inventory??{}).reduce((sum,n)=>sum+n,0);}
export function ediblePlants(world){
 const prior=lookup.get(world);
 if(prior?.plants===world.plants&&prior?.tundra===world.tundra&&prior?.starterPlants===world.starterPlants&&prior?.platforms===world.platforms)return prior.entries;
 const entries=[...(world.plants??[]).filter(p=>edible[p.kind]).map(p=>({...p,food:edible[p.kind]})),
  ...[...(world.tundra?.plants??[]),...(world.starterPlants??[])].filter(p=>p.kind==='flower').map(p=>({...p,food:'frost-leaf'})),
  ...CROBAN_MANGO_SITES.filter(p=>world.platforms?.some(ice=>ice.id===p.platformId))];
 lookup.set(world,{plants:world.plants,tundra:world.tundra,starterPlants:world.starterPlants,platforms:world.platforms,entries});return entries;
}
/** Reach is measured from the player's chest to the leaf crown, in map units. */
export function nearbyEdiblePlant(world){
 const player=world.player;let closest=null,best=65;
 for(const p of ediblePlants(world)){
  if((world.harvestedPlants?.[p.id]??0)>world.elapsed)continue;
  const distance=Math.hypot(p.x-player.x,p.y-player.y,p.z+Math.min(p.height*.45,30)-player.z-22);
  if(distance<best){best=distance;closest=p;}
 }
 return closest;
}
export function harvestLeaf(world){
 const plant=nearbyEdiblePlant(world);if(!plant)return false;
 if(inventoryCount(world)>=BAG_CAPACITY){world.notice='Backpack full. Eat a leaf or ration to make room.';world.noticeTime=4;return false;}
 world.inventory[plant.food]=(world.inventory[plant.food]??0)+1;
 world.harvestedPlants[plant.id]=world.elapsed+LEAF_REGROW_SECONDS;world.harvestVersion++;
 world.notice=plant.food==='croban-mango'?'Picked a blue Croban mango. Open Backpack (I) to eat it.':`Ripped off a ${FOOD[plant.food].name.toLowerCase()}. Open Backpack (I) to eat it.`;world.noticeTime=5;return true;
}
/** Eggs use the same chest-height reach as leaves, including vertical distance. */
export function nearbyPenguinEgg(world){
 const player=world.player;let closest=null,best=65;
 for(const egg of getPenguinEggs(world)){
  if(world.takenPenguinEggs?.[egg.id])continue;
  const distance=Math.hypot(egg.x-player.x,egg.y-player.y,egg.z-player.z-22);
  if(distance<best){best=distance;closest=egg;}
 }
 return closest;
}
export function takePenguinEgg(world){
 const egg=nearbyPenguinEgg(world);if(!egg)return false;
 if(inventoryCount(world)>=BAG_CAPACITY){world.notice='Backpack full. Eat something to make room before taking an egg.';world.noticeTime=4;return false;}
 world.inventory['penguin-egg']=(world.inventory['penguin-egg']??0)+1;
 (world.takenPenguinEggs??={})[egg.id]=true;
 delete world.penguinEggLaying?.[egg.id];
 delete world.penguinBrood?.incubation?.[egg.id];
 alarmPenguinNest(world,egg.nestId);
 world.notice='Stole a Crobon Bird egg. Its parents are defending the nest! Open Backpack (I) to eat it.';world.noticeTime=6;return true;
}
export function eatFood(world,id){
 if(!FOOD[id]||!(world.inventory?.[id]>0)||world.player.hunger>=100||world.squidEncounter||world.centipedeEncounter||world.treeStalkerEncounter)return false;
 world.inventory[id]--;if(world.inventory[id]===0)delete world.inventory[id];
 world.player.hunger=Math.min(100,world.player.hunger+FOOD[id].nutrition);
 world.notice=`Ate ${FOOD[id].name.toLowerCase()}. Hunger restored.`;world.noticeTime=4;return true;
}
/** Simulation time only: pause/title screens never consume hunger or regrow leaves. */
export function updateSurvival(world,dt,moving=false){
 world.player.hunger=Math.max(0,(world.player.hunger??100)-dt*(1/15+(moving?1/45:0)));
 if(world.player.hunger<=0)world.player.health=Math.max(0,world.player.health-dt*1.5);
 for(const [id,until]of Object.entries(world.harvestedPlants??{}))if(until<=world.elapsed){delete world.harvestedPlants[id];world.harvestVersion++;}
}
