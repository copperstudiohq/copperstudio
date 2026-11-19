import {RECIPES} from './crafting-catalog.js';
import {ITEMS} from './survival.js';
import {getRecipeState,nearbyWorkbench} from './crafting.js';
import {craftingIcon} from './crafting-icons.js';

/** A menu view over authoritative inventory transactions; opening pauses play. */
export function createCraftingPanel({world,document,onCraft}){
 const list=document.getElementById('crafting-recipes'),status=document.getElementById('crafting-status');
 if(!list||!status||typeof onCraft!=='function')throw new Error('Crafting menu is missing its controls.');
 const rows=RECIPES.map(recipe=>{
  const row=document.createElement('article');row.className='crafting-recipe';
  const icon=document.createElement('div');icon.className='crafting-item-icon';icon.innerHTML=craftingIcon(recipe.itemId);
  const body=document.createElement('div'),title=document.createElement('h3'),copy=document.createElement('p'),materials=document.createElement('ul'),requires=document.createElement('p'),button=document.createElement('button'),reason=document.createElement('p');
  title.textContent=recipe.name;copy.textContent=recipe.description;requires.className='crafting-requires';reason.className='crafting-reason';
  requires.textContent=[recipe.station?'Placed workbench within 4 m':'Hand crafting',...recipe.requires.map(id=>`${ITEMS[id].name} · kept`)].join(' / ');
  button.type='button';button.textContent=`Craft ${recipe.name.toLowerCase()}`;button.dataset.recipe=recipe.id;
  button.addEventListener('click',()=>{const made=onCraft(recipe.id);render();status.textContent=made?world.notice:getRecipeState(world,recipe.id).reason;});
  body.append(title,copy,materials,requires,button,reason);row.append(icon,body);list.append(row);
  return{recipe,materials,button,reason};
 });
 function render(){
  document.getElementById('crafting-station').textContent=nearbyWorkbench(world)?'WORKBENCH CONNECTED':'HAND CRAFTING';
  for(const row of rows){
   const state=getRecipeState(world,row.recipe.id);row.button.disabled=!state.canCraft;row.reason.textContent=state.reason;
   row.materials.replaceChildren(...state.ingredients.map(({id,needed,owned})=>{
    const li=document.createElement('li');li.textContent=`${ITEMS[id].name} · ${owned} / ${needed}`;li.className=owned>=needed?'ready':'missing';return li;
   }));
  }
 }
 return{render};
}
