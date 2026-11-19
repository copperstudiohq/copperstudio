import {activeQuickItem,setQuickUse} from './copper-yoyo.js';
import {scanDebris} from './crafting.js';
import {harvestLeaf} from './survival.js';
import {chipRock} from './rock-chipping.js';
import {placeStructure,previewStructure,placeBuild,previewBuild} from './base-building.js';
import {getBuildPlan} from './build-catalog.js';

/** Food and yo-yo keep their original hold behavior; tools fire on press only. */
export function useQuickItem(world,held,look){
 const first=Boolean(held&&!world.yoyo?.useHeld),foodUsed=setQuickUse(world,held);
 if(!first||world.squidEncounter||world.centipedeEncounter||world.treeStalkerEncounter||world.sandWormEncounter)return foodUsed;
 const id=activeQuickItem(world);if(!(world.inventory?.[id]>0))return false;
 let used=false;
 if(id==='identifier')used=scanDebris(world);
 else if(id==='rock-chipper')used=chipRock(world);
 else if(id==='rusty-copper-knife'){
  used=harvestLeaf(world);if(!used){world.notice='Copper knife: move beside an edible plant, then use to cut a leaf.';world.noticeTime=5;}
 }else if(id==='workbench')used=placeStructure(world,'workbench',look,world.buildRotation??0);
 else if(id==='builder-tool')used=placeBuild(world,world.buildPlan??'universal-base',look);
 else if(id==='broken-hammer'){world.notice='Broken hammer equipped. Open Crafting (K) to assemble a workbench.';world.noticeTime=6;}
 if(world.crafting)world.crafting.lastToolUseAt=world.elapsed;
 return used||foodUsed;
}
export function updateBuildPreview(world,look){
 const item=activeQuickItem(world),kind=item==='builder-tool'?(world.buildPlan??'universal-base'):item==='workbench'?'workbench':null;
 if(!kind||!world.inventory?.[item]||world.player.swimming){world.buildPreview=null;world.buildPreviewKey=null;return;}
 const p=world.player,key=[item,kind,world.buildRotation??0,Math.round(p.x/5),Math.round(p.y/5),Math.round(p.z*10),Math.round((look?.yaw??0)*16),world.structures?.version,world.inventory.debris,world.inventory.workbench].join(':');
 if(world.buildPreview&&world.buildPreviewKey===key)return;world.buildPreviewKey=key;
 world.buildPreview=item==='builder-tool'?previewBuild(world,kind,look):previewStructure(world,kind,look,world.buildRotation??0);
}
export function equippedHint(world){
 const id=activeQuickItem(world);if(!(world.inventory?.[id]>0))return '';
 if(id==='builder-tool'||id==='workbench'){
  const plan=getBuildPlan(id==='workbench'?'workbench':world.buildPlan??'universal-base');
  return `${plan?.name??'Build plan'} · ${world.buildPreview?.valid?'F / USE to place':world.buildPreview?.reason??'Choose a clear place'}${plan?.cost?` · ${plan.cost} debris`:''} · R rotate · Q reclaim`;
 }
 if(id==='identifier')return 'Identifier · F / USE to identify nearby debris';
 if(id==='rock-chipper')return 'Rock chipper · F / USE beside a loose rock';
 if(id==='rusty-copper-knife')return 'Copper knife · F / USE beside an edible plant';
 if(id==='broken-hammer')return 'Broken hammer · K / CRAFT to make a workbench';
 return '';
}
