import{assignQuickSlot}from'./copper-yoyo.js';
import {eatFood} from './survival.js';
import {createBackpackPanel} from './backpack-ui.js';
import {createCraftingPanel} from './crafting-ui.js';
import {createBuildPanel} from './build-ui.js';
import {selectBuildPlan} from './base-building.js';
import {craftRecipe} from './crafting.js';
import {createWorldStore} from './world-saves.js';
import {snapshotExpedition,validateExpeditionSnapshot,restoreExpedition} from './expedition-saves.js';

/** Menus share the controller's pause/encounter gates. Storage writes happen
 * only on explicit saves, safe autosave intervals, and page exit. */
export function setupExpeditionUI({world,look,document,window,pause,resume,load,isPlaying,isEncounter,changed}){
 const el=id=>document.getElementById(id),bag=el('backpack'),saves=el('expeditions'),crafting=el('crafting'),building=el('building');
 const status=message=>{el('expedition-status').textContent=message;};
 let storage;try{storage=window.localStorage??null;}catch{storage=null;}
 const store=createWorldStore({storage,validateSnapshot:validateExpeditionSnapshot});
 let active=null,lastSave=0,pendingDelete=null;
 const safe=()=>isPlaying()&&!isEncounter();
 const feedback=error=>{status(error.message);console.warn('Croba save:',error.message);};
 function open(dialog){pause();bag.close();saves.close();crafting.close();building.close();dialog.showModal();}
 function close(dialog){dialog.close();resume();}
 function updateBag(){
  backpackPanel.render();
 }
 function openBag(){if(!isPlaying()||isEncounter())return;open(bag);updateBag();el('close-backpack').focus();}
 function openCrafting(){if(!safe())return;open(crafting);craftingPanel.render();el('close-crafting').focus();}
 function openBuilding(){if(!safe())return;open(building);buildPanel.render();el('close-building').focus();}
 function saveNow(quiet=false){
  if(!safe()||!active)return false;
  lastSave=world.elapsed;
  try{
   active=store.save(active.id,snapshotExpedition(world,look),{expectedRevision:active.revision});lastSave=world.elapsed;
   el('save-indicator').textContent=`Saved · ${active.name}`;if(!quiet)status(`Saved ${active.name}.`);return true;
  }catch(error){el('save-indicator').textContent='Not saved — open Saves';if(!quiet||saves.open)feedback(error);return false;}
 }
 function renderSaves(){
  const list=el('expedition-list');list.replaceChildren();
  try{
   const result=store.list();
   if(!result.worlds.length){const p=document.createElement('p');p.textContent='No expeditions saved yet. Create a named slot below.';list.append(p);}
   for(const entry of result.worlds){
    const row=document.createElement('article'),title=document.createElement('strong'),details=document.createElement('p'),actions=document.createElement('div');
    title.textContent=entry.name+(active?.id===entry.id?' · current':'');
    details.textContent=`${Math.floor(entry.elapsedSeconds/60)} minutes explored · ${new Date(entry.updatedAt).toLocaleString()}`;
    row.className='expedition-slot';actions.className='slot-actions';
    const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{try{action();}catch(error){feedback(error);}});actions.append(b);};
    button('Load',()=>{if(isEncounter())throw new Error('Finish the creature encounter before loading.');active=store.load(entry.id);restoreExpedition(world,active.snapshot,look);lastSave=world.elapsed;bag.close();saves.close();crafting.close();building.close();load();el('save-indicator').textContent=`Loaded · ${active.name}`;});
    button('Rename',()=>{const name=el('expedition-name').value;const renamed=store.rename(entry.id,name);if(active?.id===entry.id)active=renamed;status('Expedition renamed.');renderSaves();});
    button('Export',()=>{
     const snapshot=active?.id===entry.id&&safe()?snapshotExpedition(world,look):undefined;
     const text=store.exportWorld(entry.id,{snapshot}),blob=new Blob([text],{type:'application/json'}),url=window.URL.createObjectURL(blob),a=document.createElement('a');
     a.href=url;a.download=`croba-${entry.id}.json`;a.click();window.setTimeout(()=>window.URL.revokeObjectURL(url),1000);status('Backup exported.');
    });
    button('Delete',()=>{pendingDelete=entry.id;el('delete-expedition-label').textContent=`Delete “${entry.name}” from this browser? Export a backup first if you want to keep it.`;el('delete-expedition-confirm').hidden=false;});
    row.append(title,details,actions);list.append(row);
   }
   if(result.errors.length)status(`${result.errors.length} saved slot(s) could not be read. Other saves are intact.`);
  }catch(error){feedback(error);}
 }
 function openSaves(){open(saves);renderSaves();el('close-expeditions').focus();}
 const backpackPanel=createBackpackPanel({world,document,canEat:safe,
  getColumns:()=>window.matchMedia?.('(max-width:600px)').matches?4:6,
  onAssign:(id,index)=>{if(!safe()||!assignQuickSlot(world,index,id))return false;changed();saveNow(true);return true;},
  onEat:id=>{if(!safe()||!eatFood(world,id))return false;changed();saveNow(true);return true;}});
 const craftingPanel=createCraftingPanel({world,document,onCraft(id){if(!safe()||!craftRecipe(world,id))return false;changed();saveNow(true);return true;}});
 const buildPanel=createBuildPanel({world,document,onSelect(id){if(!safe()||!selectBuildPlan(world,id))return false;changed();close(building);saveNow(true);return true;}});
 for(const id of ['building-toggle','building-change'])el(id).addEventListener('click',openBuilding);
 el('close-building').addEventListener('click',()=>close(building));
 for(const id of ['crafting-toggle','menu-crafting','bag-open-crafting'])el(id).addEventListener('click',openCrafting);
 el('crafting-open-bag').addEventListener('click',openBag);
 el('close-crafting').addEventListener('click',()=>close(crafting));
 el('backpack-toggle').addEventListener('click',()=>bag.open?close(bag):openBag());
 el('saves-toggle').addEventListener('click',openSaves);el('menu-saves').addEventListener('click',openSaves);el('menu-backpack').addEventListener('click',openBag);
 el('close-backpack').addEventListener('click',()=>close(bag));el('close-expeditions').addEventListener('click',()=>close(saves));
 for(const dialog of [bag,saves,crafting,building])dialog.addEventListener('cancel',event=>{event.preventDefault();close(dialog);});
 el('create-expedition').addEventListener('click',()=>{
  try{if(isEncounter())throw new Error('Finish the encounter before saving.');active=store.create(el('expedition-name').value,snapshotExpedition(world,look));lastSave=world.elapsed;status(`Created ${active.name}. Autosave is on.`);el('save-indicator').textContent=`Saved · ${active.name}`;renderSaves();}
  catch(error){feedback(error);}
 });
 el('save-expedition').addEventListener('click',()=>{if(!active){status('Create or load a named slot first.');return;}if(saveNow())renderSaves();});
 el('delete-expedition-cancel').addEventListener('click',()=>{pendingDelete=null;el('delete-expedition-confirm').hidden=true;});
 el('delete-expedition-accept').addEventListener('click',()=>{try{if(pendingDelete){store.remove(pendingDelete);if(active?.id===pendingDelete)active=null;}pendingDelete=null;el('delete-expedition-confirm').hidden=true;status('Expedition deleted.');renderSaves();}catch(error){feedback(error);}});
 el('import-expedition').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{if(file.size>4*1024*1024+4096)throw new Error('This backup is too large.');store.importWorld(await file.text());status('Backup imported into a new slot.');renderSaves();}catch(error){feedback(error);}finally{event.target.value='';}
 });
 window.addEventListener('pagehide',()=>saveNow(true));
 return {openBag,openSaves,openCrafting,openBuilding,
  begin(){if(active)return;try{active=store.create(el('expedition-name').value,snapshotExpedition(world,look));lastSave=world.elapsed;el('save-indicator').textContent='Saved · '+active.name;}catch(error){el('save-indicator').textContent='Not saved — open Saves';status(error.message);}},
  hasDialog:()=>bag.open||saves.open||crafting.open||building.open,
  close(){if(bag.open)close(bag);else if(saves.open)close(saves);else if(crafting.open)close(crafting);else if(building.open)close(building);},
  tick(){if(safe()&&active&&world.elapsed-lastSave>=30)saveNow(true);},
  fresh(){active=null;lastSave=world.elapsed;el('save-indicator').textContent='Not saved · choose Saves';},
  beforeReset(){saveNow(true);},
  latest(){try{return store.list().worlds[0]??null;}catch{return null;}},
  continueLatest(){try{const latest=store.list().worlds[0];if(!latest)return false;active=store.load(latest.id);restoreExpedition(world,active.snapshot,look);lastSave=world.elapsed;load();el('save-indicator').textContent=`Loaded · ${active.name}`;return true;}catch(error){feedback(error);el('main-menu-status').textContent=error.message;return false;}},
  getActive:()=>active};
}
