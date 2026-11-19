import{OLD_CARGO_SITES}from'./basin-life-data.js';
import{FOOD,ITEMS,BAG_CAPACITY,inventoryCount,eatFood}from'./survival.js';
import{updateYoyoPhysics,resetYoyoPhysics}from'./yoyo-physics.js';
export const COPPER_YOYO_ID='copper-yoyo';
export const QUICK_SLOT_COUNT=5;
const originalCargo=OLD_CARGO_SITES.find(p=>p.habitat==='land'&&p.kind==='container');
export const COPPER_CARGO_SITE=Object.freeze({...originalCargo,sourceId:originalCargo.id,id:'copperstudio-cargo'});
export function initializeEquipment(world){
 world.quickSlots=['ration',null,null,null,null];world.activeQuickSlot=0;world.copperCargo={opened:false,claimed:false};
 world.yoyo={held:false,useHeld:false};resetYoyoPhysics(world.yoyo);return world;
}
export function activeQuickItem(world){return world.quickSlots?.[world.activeQuickSlot??0]??null;}
export function selectQuickSlot(world,index){
 if(!Number.isInteger(index)||index<0||index>=QUICK_SLOT_COUNT)return false;
 world.activeQuickSlot=index;if(world.yoyo)world.yoyo.held=false;return true;
}
export function assignQuickSlot(world,index,id){
 if(!Object.hasOwn(ITEMS,id)||!(world.inventory?.[id]>0)||!selectQuickSlot(world,index))return false;
 world.quickSlots??=Array(QUICK_SLOT_COUNT).fill(null);world.quickSlots[index]=id;return true;
}
export function nearbyCopperCargo(world){
 const p=world.player,c=COPPER_CARGO_SITE;
 return !world.copperCargo?.claimed&&Math.hypot(p.x-c.x,p.y-c.y,p.z+22-c.z-14)<80?c:null;
}
export function interactCopperCargo(world){
 if(!nearbyCopperCargo(world)||world.squidEncounter||world.centipedeEncounter||world.treeStalkerEncounter)return false;
 if(!world.copperCargo.opened){world.copperCargo.opened=true;world.copperCargo.openedAt=world.elapsed;world.notice='COPPERSTUDIO. A copper yo-yo rests among a Rain and Copper shirt, wire and ingots. Click again or press E to collect the yo-yo.';world.noticeTime=7;return true;}
 if(inventoryCount(world)>=BAG_CAPACITY){world.notice='Backpack full. Make room for the copper yo-yo.';world.noticeTime=4;return false;}
 world.copperCargo.claimed=true;world.inventory[COPPER_YOYO_ID]=1;
 const empty=world.quickSlots.findIndex(id=>id===null);assignQuickSlot(world,empty>=0?empty:world.activeQuickSlot,COPPER_YOYO_ID);
 world.notice='Found a copper yo-yo. Hold F, the left mouse button, or USE to keep it out. Release to reel it in. Keys 1–5 select quick slots.';world.noticeTime=9;return true;
}
export function setQuickUse(world,held){
 const state=world.yoyo;if(!state)return false;const first=held&&!state.useHeld;state.useHeld=Boolean(held);
 const id=activeQuickItem(world),safe=!world.squidEncounter&&!world.centipedeEncounter&&!world.treeStalkerEncounter;
 state.held=Boolean(held&&safe&&id===COPPER_YOYO_ID&&world.inventory?.[id]===1);
 return Boolean(first&&safe&&FOOD[id]&&eatFood(world,id));
}
export function releaseQuickUse(world,instant=false){if(world.yoyo){world.yoyo.held=false;world.yoyo.useHeld=false;if(instant)resetYoyoPhysics(world.yoyo);}}
export function updateEquipment(world,dt,look){
 if(!Number.isFinite(dt)||dt<=0||!world.yoyo)return;
 const y=world.yoyo,d=Math.min(dt,.1),equipped=activeQuickItem(world)===COPPER_YOYO_ID&&world.inventory?.[COPPER_YOYO_ID]===1;
 if(!equipped||world.squidEncounter||world.centipedeEncounter||world.treeStalkerEncounter){y.held=false;resetYoyoPhysics(y);return;}
 updateYoyoPhysics(world,d,look);
}

/** Durable bindings and one unique claim; transient toy physics is excluded. */
export function validateEquipmentSave(value,inventory){
 const fail=message=>{throw new Error(`Invalid Croba save: ${message}`);};
 const quickSlots=value.quickSlots===undefined?['ration',null,null,null,null]:value.quickSlots;
 if(!Array.isArray(quickSlots)||quickSlots.length!==5||quickSlots.some(id=>id!==null&&(typeof id!=='string'||!Object.hasOwn(ITEMS,id))))fail('five quick slots');
 const activeQuickSlot=value.activeQuickSlot??0;if(!Number.isInteger(activeQuickSlot)||activeQuickSlot<0||activeQuickSlot>=5)fail('selected quick slot');
 const copperCargo=value.copperCargo??{opened:false,claimed:false};
 if(!copperCargo||Array.isArray(copperCargo)||typeof copperCargo.opened!=='boolean'||typeof copperCargo.claimed!=='boolean')fail('COPPERSTUDIO cargo');
 const owns=inventory[COPPER_YOYO_ID]??0;
 if(owns>1||Boolean(owns)!==copperCargo.claimed||copperCargo.claimed&&!copperCargo.opened||quickSlots.includes(COPPER_YOYO_ID)&&!owns)fail('unique copper yo-yo ownership');
 return{quickSlots:[...quickSlots],activeQuickSlot,copperCargo:{opened:copperCargo.opened,claimed:copperCargo.claimed}};
}
