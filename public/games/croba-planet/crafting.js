import {CRAFTING_ITEMS,RECIPES} from './crafting-catalog.js';
import {SALVAGE_SITES} from './salvage-sites.js';
import {BAG_CAPACITY,inventoryCount} from './survival.js';
import {PREPARED_WORLD_ROCKS} from './world-rock-data.js';

const sites=new Map(SALVAGE_SITES.map(site=>[site.id,site]));
const rockIds=new Set(PREPARED_WORLD_ROCKS.map(rock=>rock.id));
const safe=world=>!world.squidEncounter&&!world.centipedeEncounter&&!world.treeStalkerEncounter&&!world.sandWormEncounter;
const announce=(world,text)=>{world.notice=text;world.noticeTime=6;};

export function initializeCrafting(world){
 world.crafting={collected:[],identified:[],removedRocks:[]};
 world.structures={version:0,workbenches:[],bases:[]};world.buildPlan='universal-base';world.buildRotation=0;world.buildPreview=null;world.buildPreviewKey=null;return world;
}
/** Only unclaimed cargo is interactive; a closed crate conceals its builder. */
export function getSalvageSites(world){
 const collected=new Set(world.crafting?.collected??[]);
 return SALVAGE_SITES.filter(site=>!collected.has(site.id)&&(!site.crate||world.copperCargo?.opened));
}
export function nearbySalvage(world){
 const p=world.player;let found=null,distance=65;
 for(const site of getSalvageSites(world)){
  const d=Math.hypot(site.x-p.x,site.y-p.y,site.z-p.z-22);
  if(d<distance){found=site;distance=d;}
 }
 return found;
}
/** Keep a newly made/found tool in a free quick slot, retaining existing bindings. */
function bindTool(world,id){
 if(!CRAFTING_ITEMS[id]?.gear)return;
 world.quickSlots??=['ration',null,null,null,null];
 let index=world.quickSlots.indexOf(id);
 if(index<0)index=world.quickSlots.findIndex(item=>!item||!world.inventory?.[item]);
 if(index>=0){world.quickSlots[index]=id;world.activeQuickSlot=index;}
}
export function interactSalvage(world){
 const site=nearbySalvage(world);if(!site||!safe(world))return false;
 if(inventoryCount(world)>=BAG_CAPACITY){announce(world,'Backpack full. Craft something or eat a supply to make room for salvage.');return false;}
 world.crafting??={collected:[],identified:[],removedRocks:[]};
 if(CRAFTING_ITEMS[site.itemId].unique&&world.inventory?.[site.itemId])return false;
 (world.crafting.collected??=[]).push(site.id);
 world.inventory[site.itemId]=(world.inventory[site.itemId]??0)+1;bindTool(world,site.itemId);
 announce(world,site.itemId==='debris'?'Picked up salvaged debris. Open Crafting to make tools.':`Picked up ${site.label}. Assign it in your backpack or use its selected quick slot.`);
 return true;
}
export function nearbyWorkbench(world){
 const p=world.player;
 return(world.structures?.workbenches??[]).find(bench=>Math.hypot(bench.x-p.x,bench.y-p.y,bench.z-p.z)<100)??null;
}
/** A pure availability check used by menu buttons and the actual transaction. */
export function getRecipeState(world,recipeId){
 const recipe=RECIPES.find(entry=>entry.id===recipeId);
 if(!recipe)return{recipe:null,canCraft:false,reason:'Unknown recipe.',ingredients:[]};
 const inventory=world.inventory??{},ingredients=Object.entries(recipe.ingredients).map(([id,needed])=>({id,needed,owned:inventory[id]??0}));
 let reason='';
 if(!safe(world))reason='Wait until the creature encounter ends.';
 else if(CRAFTING_ITEMS[recipe.itemId].unique&&inventory[recipe.itemId])reason=`You already have a ${recipe.name.toLowerCase()}.`;
 else if(recipe.requires.some(id=>!(inventory[id]>0)))reason=`Requires ${recipe.requires.filter(id=>!(inventory[id]>0)).map(id=>CRAFTING_ITEMS[id].name.toLowerCase()).join(' and ')}. Tools are kept.`;
 else if(recipe.station&&!nearbyWorkbench(world))reason='Stand near a placed workbench.';
 else if(ingredients.some(entry=>entry.owned<entry.needed))reason='Gather the missing materials.';
 else if(inventoryCount(world)-ingredients.reduce((n,entry)=>n+entry.needed,0)+recipe.count>BAG_CAPACITY)reason='Your backpack needs more room.';
 return{recipe,canCraft:!reason,reason:reason||'Ready to craft.',ingredients};
}
export function craftRecipe(world,recipeId){
 const state=getRecipeState(world,recipeId);if(!state.canCraft){announce(world,state.reason);return false;}
 const{recipe,ingredients}=state;
 for(const{id,needed}of ingredients){world.inventory[id]-=needed;if(!world.inventory[id])delete world.inventory[id];}
 world.inventory[recipe.itemId]=(world.inventory[recipe.itemId]??0)+recipe.count;bindTool(world,recipe.itemId);
 announce(world,`Crafted ${recipe.name.toLowerCase()}.${recipe.itemId==='workbench'?' Equip and use it on land to place it.':''}`);return true;
}
/** This instrument targets cargo only; no wildlife or bestiary mutation. */
export function scanDebris(world){
 if(!safe(world)||!(world.inventory?.identifier>0))return false;
 const p=world.player;let nearest=null,distance=300;
 for(const site of getSalvageSites(world)){
  if(site.itemId!=='debris')continue;
  const d=Math.hypot(site.x-p.x,site.y-p.y,site.z-p.z-22);if(d<distance){nearest=site;distance=d;}
 }
 if(!nearest){announce(world,'Identifier: no loose debris in range. This instrument identifies cargo, not creatures.');return false;}
 world.crafting??={collected:[],identified:[],removedRocks:[]};
 if(!world.crafting.identified.includes(nearest.id))world.crafting.identified.push(nearest.id);
 announce(world,`Identifier · ${nearest.label}: copper, metal and fasteners. Useful for crafting. ${Math.round(distance/25)} m away.`);return true;
}

/** Saved cargo IDs are whitelisted; no arbitrary objects enter the simulation. */
export function validateCraftingSave(value,inventory={}){
 const fail=message=>{throw new Error(`Invalid Croba save: ${message}`);};
 if(value===undefined)value={collected:[],identified:[],removedRocks:[]};
 if(!value||typeof value!=='object'||Array.isArray(value))fail('crafting progress');
 const copy=(entries,known,label)=>{
  if(!Array.isArray(entries)||entries.length>known.size||entries.some(id=>typeof id!=='string'||!known.has(id))||new Set(entries).size!==entries.length)fail(label);
  return[...entries];
 };
 const collected=copy(value.collected??[],sites,'collected salvage');
 const debrisIds=new Set(SALVAGE_SITES.filter(site=>site.itemId==='debris').map(site=>site.id));
 const identified=copy(value.identified??[],debrisIds,'identified debris');
 const removedRocks=copy(value.removedRocks??[],rockIds,'removed rocks');
 for(const[id,item]of Object.entries(CRAFTING_ITEMS))if(item.unique&&(inventory[id]??0)>1)fail('unique crafting tool');
 for(const site of SALVAGE_SITES.filter(site=>CRAFTING_ITEMS[site.itemId].unique)){
  if(Boolean(inventory[site.itemId])!==collected.includes(site.id))fail('salvaged tool ownership');
 }
 return{collected,identified,removedRocks};
}
