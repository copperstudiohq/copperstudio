import {BUILD_PLANS} from './build-catalog.js';
import {getBuildState} from './base-building.js';
import {buildIcon} from './build-icons.js';

const CATEGORIES=[['all','All blueprints'],['habitat','Habitat'],['furniture','Furniture']];
const metres=value=>new Intl.NumberFormat('en',{maximumFractionDigits:1}).format(value/25);

/** Inspect plans without spending materials; only the controller enters placement. */
export function createBuildPanel({world,document,onSelect}){
 const ids=['building-plans','building-categories','building-preview-icon','building-name','building-description','building-dimensions','building-materials','building-requirement','building-select','building-status'];
 const elements=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
 const missing=ids.filter(id=>!elements[id]);
 if(missing.length||typeof onSelect!=='function')throw new Error(`Building menu is missing ${missing.length?missing.join(', '):'its selection callback'}.`);
 const el=id=>elements[`building-${id}`];
 let selected=BUILD_PLANS[0].id,category='all';
 const tabs=CATEGORIES.map(([id,label])=>{
  const button=document.createElement('button');button.type='button';button.className='building-category';button.textContent=label;button.dataset.category=id;
  button.setAttribute('aria-controls','building-plans');button.setAttribute('aria-pressed',String(id===category));
  button.addEventListener('click',()=>{
   category=id;
   if(category!=='all'&&BUILD_PLANS.find(plan=>plan.id===selected).category!==category)selected=BUILD_PLANS.find(plan=>plan.category===category).id;
   render();el('status').textContent=`${label}. ${rows.filter(row=>!row.button.hidden).length} blueprints.`;
  });
  el('categories').append(button);return{id,button};
 });
 const rows=BUILD_PLANS.map(plan=>{
  const button=document.createElement('button');button.type='button';button.className='building-plan';button.dataset.plan=plan.id;
  const icon=document.createElement('span'),name=document.createElement('strong'),cost=document.createElement('span'),availability=document.createElement('span');
  icon.className='building-card-icon';icon.innerHTML=buildIcon(plan.id);name.textContent=plan.name;cost.className='building-card-cost';availability.className='building-card-availability';
  button.append(icon,name,cost,availability);
  button.addEventListener('click',()=>{
   selected=plan.id;render();el('status').textContent=`Inspecting ${plan.name.toLowerCase()}. ${getBuildState(world,plan.id).reason}`;
   if(document.defaultView?.matchMedia?.('(max-width:560px)')?.matches)el('preview-icon').scrollIntoView?.({block:'start',behavior:'auto'});
  });
  el('plans').append(button);return{plan,button,cost,availability};
 });
 function render(){
  for(const tab of tabs)tab.button.setAttribute('aria-pressed',String(tab.id===category));
  for(const row of rows){
   const state=getBuildState(world,row.plan.id);
   row.button.hidden=category!=='all'&&row.plan.category!==category;
   row.button.dataset.available=String(state.canSelect);
   row.button.setAttribute('aria-pressed',String(row.plan.id===selected));
   row.button.setAttribute('aria-label',`${row.plan.name}. ${state.canSelect?'Ready to preview.':'Requirements unmet; select to inspect.'}`);
   row.cost.textContent=state.resource==='workbench'?'1 workbench kit':`${state.cost} debris`;
   row.availability.textContent=state.canSelect?'READY':'VIEW REQUIREMENTS';
  }
  const plan=BUILD_PLANS.find(entry=>entry.id===selected),state=getBuildState(world,selected);
  el('preview-icon').innerHTML=buildIcon(selected);el('name').textContent=plan.name;el('description').textContent=plan.description;
  el('dimensions').textContent=`${metres(plan.width)} × ${metres(plan.length)} × ${metres(plan.height)} m · width / length / height`;
  const material=document.createElement('li'),label=document.createElement('span'),count=document.createElement('strong'),needed=state.resource==='workbench'?1:state.cost;
  material.className=state.owned>=needed?'ready':'missing';label.textContent=state.resource==='workbench'?'Crafted workbench kit':'Salvaged debris';count.textContent=`${state.owned} / ${needed}`;material.append(label,count);el('materials').replaceChildren(material);
  el('requirement').textContent=state.reason;el('requirement').className=`building-requirement ${state.canSelect?'ready':'missing'}`;
  el('select').disabled=!state.canSelect;el('select').textContent='Preview build';el('select').setAttribute('aria-label',`Preview ${plan.name.toLowerCase()}`);
 }
 el('select').addEventListener('click',()=>{
  const state=getBuildState(world,selected);
  if(!state.canSelect){render();el('status').textContent=state.reason;return;}
  const result=onSelect(selected);render();
  el('status').textContent=result===false?(world.notice||getBuildState(world,selected).reason):`${BUILD_PLANS.find(plan=>plan.id===selected).name} blueprint ready. Rotate, check the preview, then place.`;
 });
 return{render};
}
