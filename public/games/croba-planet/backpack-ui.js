import { FOOD, ITEMS, BAG_CAPACITY, inventoryCount } from './survival.js';
import {craftingIcon} from './crafting-icons.js';

/** Original Croba supplies, drawn in the same illustrated-slot vocabulary as
 * Rain and Copper. Icons contain no remote assets or user-supplied markup. */
export const FOOD_ICONS = Object.freeze({
  ration: '<path d="m11 7 22 2 1 27-24-2z" fill="#ae7951" stroke="#eac695"/><path d="m12 10 18 2 1 21-18-2z" fill="#284b46"/><path d="m16 18 10 1-1 8-9-1z" fill="#e1c99a"/><path d="m10 11 24 2M10 30l24 2" stroke="#d6a76d"/><path d="m20 16-2 7 6-4-2 8" fill="none" stroke="#34554b" stroke-width="1.3"/>',
  'glassroot-leaf': '<path d="M10 35 28 6C11 7 7 17 10 35Z" fill="#89b6a8" stroke="#c7e5ca"/><path d="M11 33C31 32 37 20 29 6L11 33Z" fill="#528a86" stroke="#9bc7b2"/><path d="m10 36 18-29M17 24l-5-6m10-3 7 2m-11 8 9 1" stroke="#d2e2b9" stroke-width="1.2"/>',
  'kelp-leaf': '<path d="M19 37C11 26 28 21 17 5c18 10 11 21 5 32Z" fill="#308ea4" stroke="#82d5d7"/><path d="M21 34C7 32 5 20 12 12c-2 12 13 9 9 22Z" fill="#2e6c91"/><path d="m20 37 3-18-4-11" fill="none" stroke="#b8ddcf" stroke-width="1.2"/>',
  'crown-frond': '<path d="M20 38 22 6" stroke="#b99a73" stroke-width="2"/><path d="m21 10-9-5 1 8 8 4m0-2 12-6-3 10-9 3m0-3L8 14l3 11 10 3m0-4 13-5-5 12-8 2m0-5L8 25l7 10 6 2" fill="#9577b4" stroke="#c1a4ce" stroke-width="1"/>',
  'frost-leaf': '<path d="m20 4 9 7 4 13-11 13L9 27 7 15Z" fill="#d1e7df" stroke="#f2f4e7"/><path d="m20 6 2 31m-1-18-9-7m9 14 9-9m-9 15-8-6" stroke="#8db9c4" stroke-width="1.2"/><path d="m11 11 3 4m14 10 3 2" stroke="#fff"/>',
  'penguin-egg': '<path d="M31 27c0 9-21 12-22 0C8 17 15 5 20 5s12 12 11 22Z" fill="#ddd8bc" stroke="#f0edda"/><path d="M13 29c3 6 11 7 15 1" fill="none" stroke="#aaae9d"/><g fill="#7c9999"><ellipse cx="15" cy="18" rx="2" ry="3"/><ellipse cx="25" cy="25" rx="2.5" ry="2"/><ellipse cx="22" cy="12" rx="1.4" ry="2"/></g>',
  'croban-mango': '<path d="M25 7C37 12 34 30 23 36 12 42 4 29 8 18 11 10 18 8 25 7Z" fill="#236cb9" stroke="#a5d9f6" stroke-width="1.3"/><path d="M23 10C14 14 11 24 14 30" fill="none" stroke="#67b7e8" stroke-width="2"/><path d="m24 9 1-7" stroke="#8d6c54" stroke-width="2"/><path d="m25 5 10-2-6 8Z" fill="#eff8fa" stroke="#b1d0de"/>',
});

const GEAR_ICON='<circle cx="21" cy="22" r="14" fill="#ad632f" stroke="#f2c077" stroke-width="3"/><circle cx="21" cy="22" r="9" fill="#d68a43" stroke="#754324"/><circle cx="21" cy="22" r="3" fill="#754324"/><path d="M21 21C9 10 31 9 21 2" fill="none" stroke="#e5d9b9" stroke-width="1.5"/>';
export function itemIcon(id){return id==='copper-yoyo'?`<svg viewBox="0 0 42 42" aria-hidden="true">${GEAR_ICON}</svg>`:Object.hasOwn(FOOD,id)?foodIcon(id):craftingIcon(id);}

export function foodIcon(id) {
  if (!Object.hasOwn(FOOD_ICONS, id)) throw new TypeError(`Unknown backpack illustration: ${id}.`);
  return `<svg viewBox="0 0 42 42" aria-hidden="true" focusable="false">${FOOD_ICONS[id]}</svg>`;
}

/** The existing save format stores quantities, not slot positions. Each
 * visible cell therefore represents exactly one of the 24 carried items. */
export function backpackSlots(world) {
  const inventory = world.inventory ?? {}, slots = [];
  if (typeof inventory !== 'object' || Array.isArray(inventory)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(inventory)))
    throw new TypeError('Backpack supplies must be a plain food-quantity record.');
  let total = 0;
  for (const [id, count] of Object.entries(inventory)) {
    if (!Object.hasOwn(ITEMS, id) || !Number.isInteger(count) || count < 0)
      throw new TypeError('Backpack supplies must contain known foods with non-negative whole quantities.');
    if(id==='copper-yoyo'&&count>1)throw new RangeError('The copper yo-yo is unique.');
    if (count > BAG_CAPACITY || (total += count) > BAG_CAPACITY)
      throw new RangeError(`The backpack can carry at most ${BAG_CAPACITY} items.`);
  }
  for (const id of Object.keys(ITEMS)) {
    const count = inventory[id] ?? 0;
    for (let i = 0; i < count; i++) slots.push(id);
  }
  return slots.concat(Array(BAG_CAPACITY - slots.length).fill(null));
}

/** Supply grid and selected-item panel; the expedition controller owns dialog
 * pause/resume, consuming food and saving. Render is called only on opening
 * and user actions. No inventory state is duplicated or serialized here.
 * @param {{world:object,document:Document,canEat?:()=>boolean,onEat?:(id:string)=>boolean,getColumns?:()=>number}} options
 */
export function createBackpackPanel({ world, document, canEat = () => true, onEat = () => false, onAssign = () => false, getColumns = () => 6 }) {
  const ids = ['backpack-grid', 'bag-capacity', 'bag-capacity-meter', 'bag-hunger-value', 'bag-hunger-fill',
    'bag-selection-empty', 'bag-empty-hint', 'bag-status', 'bag-selected-slot',
    'bag-detail-copper-yoyo','bag-icon-copper-yoyo','gear-count-copper-yoyo','equip-copper-yoyo',
    'bag-detail-tool','bag-icon-tool','bag-tool-name','bag-tool-kind','bag-tool-count','bag-tool-description','equip-tool',
    ...Array.from({length:5},(_,i)=>`bag-quick-${i}`),
    ...Object.keys(FOOD).flatMap(id => [`bag-detail-${id}`, `bag-icon-${id}`, `food-count-${id}`, `eat-${id}`])];
  const elements = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const missing = ids.filter(id => !elements[id]);
  if (missing.length) throw new Error(`Backpack panel is missing: ${missing.join(', ')}.`);
  if (typeof canEat !== 'function' || typeof onEat !== 'function' || typeof getColumns !== 'function')
    throw new TypeError('Backpack actions and column lookup must be functions.');
  const grid = elements['backpack-grid'], buttons = [], listeners = [];
  let selectedIndex = 0, selectedFood, slots = Array(BAG_CAPACITY).fill(null), destroyed = false;
  const listen = (element, event, handler) => {
    element.addEventListener(event, handler); listeners.push(() => element.removeEventListener?.(event, handler));
  };

  function select(index, focus = false) {
    if (destroyed || !Number.isInteger(index) || index < 0 || index >= BAG_CAPACITY) return;
    selectedIndex = index; selectedFood = slots[index];
    render();
    if (focus) buttons[index].focus();
  }

  for (let index = 0; index < BAG_CAPACITY; index++) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'backpack-slot';
    button.dataset.bagSlot = String(index); buttons.push(button);
    listen(button, 'click', () => select(index));
    listen(button, 'keydown', event => {
      const key = event.key ?? event.code, columns = getColumns() === 4 ? 4 : 6;
      const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[key];
      let next;
      if (offset !== undefined) next = (index + offset + BAG_CAPACITY) % BAG_CAPACITY;
      else if (key === 'Home') next = 0;
      else if (key === 'End') next = BAG_CAPACITY - 1;
      else return;
      event.preventDefault(); event.stopPropagation?.(); select(next, true);
    });
  }
  grid.replaceChildren(...buttons);
  for (const id of Object.keys(FOOD)) {
    elements[`bag-icon-${id}`].innerHTML = foodIcon(id);
    listen(elements[`eat-${id}`], 'click', () => {
      if (destroyed || !canEat() || !(world.inventory?.[id] > 0) || world.player.hunger >= 100) return;
      const before = world.player.hunger, focused = document.activeElement === elements[`eat-${id}`];
      if (onEat(id) !== true) return;
      render();
      if (focused && selectedFood !== id) buttons[selectedIndex].focus();
      elements['bag-status'].textContent = `Ate ${FOOD[id].name.toLowerCase()}. Restored ${Math.round(world.player.hunger - before)} hunger.`;
    });
  }

  elements['bag-icon-copper-yoyo'].innerHTML=itemIcon('copper-yoyo');
  const assign=index=>{
    if(!canEat()||!selectedFood||!(world.inventory?.[selectedFood]>0)||onAssign(selectedFood,index)!==true)return;
    render();elements['bag-status'].textContent=`Assigned ${ITEMS[selectedFood].name} to quick slot ${index+1}.`;
  };
  listen(elements['equip-copper-yoyo'],'click',()=>assign(world.activeQuickSlot??0));
  listen(elements['equip-tool'],'click',()=>assign(world.activeQuickSlot??0));
  for(let i=0;i<5;i++)listen(elements[`bag-quick-${i}`],'click',()=>assign(i));

  function render() {
    if (destroyed) return;
    slots = backpackSlots(world);
    const count = inventoryCount(world), hunger = Math.max(0, Math.min(100, world.player.hunger ?? 100));
    if (selectedFood === undefined) selectedFood = slots[selectedIndex];
    else if (selectedFood && slots[selectedIndex] !== selectedFood) {
      const next = slots.indexOf(selectedFood);
      if (next >= 0) selectedIndex = next;
      else {
        selectedIndex = Math.min(selectedIndex, Math.max(0, count - 1)); selectedFood = slots[selectedIndex];
      }
    } else selectedFood = slots[selectedIndex];
    elements['bag-capacity'].textContent = `${count} / ${BAG_CAPACITY} items`;
    elements['bag-capacity-meter'].setAttribute('aria-valuenow', String(count));
    elements['bag-capacity-meter'].style.setProperty('--bag-load', `${count / BAG_CAPACITY * 100}%`);
    elements['bag-hunger-value'].textContent = `${Math.ceil(hunger)}%`;
    elements['bag-hunger-fill'].style.width = `${hunger}%`;
    elements['bag-empty-hint'].hidden = count > 0;
    elements['bag-selection-empty'].hidden = Boolean(selectedFood);
    elements['bag-selected-slot'].textContent = `SPACE ${String(selectedIndex + 1).padStart(2, '0')}`;
    for (const [index, button] of buttons.entries()) {
      const id = slots[index], selected = index === selectedIndex;
      button.classList.toggle('has-item', Boolean(id)); button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected)); button.tabIndex = selected ? 0 : -1;
      button.setAttribute('aria-label', id ? `Space ${index + 1}: ${ITEMS[id].name}. One item; ${world.inventory[id]} in backpack.`
        : `Space ${index + 1}: empty.`);
      button.innerHTML = `${id ? `${itemIcon(id)}<span class="backpack-piece-count" aria-hidden="true">1</span><span class="backpack-item-name">${ITEMS[id].name}</span>` : ''}<span class="backpack-slot-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>`;
    }
    for (const id of Object.keys(FOOD)) {
      elements[`bag-detail-${id}`].hidden = id !== selectedFood;
      elements[`food-count-${id}`].textContent = String(world.inventory?.[id] ?? 0);
      elements[`eat-${id}`].disabled = !canEat() || !(world.inventory?.[id] > 0) || hunger >= 100;
    }
    elements['bag-detail-copper-yoyo'].hidden=selectedFood!=='copper-yoyo';
    elements['gear-count-copper-yoyo'].textContent=String(world.inventory?.['copper-yoyo']??0);
    elements['equip-copper-yoyo'].disabled=!canEat()||!(world.inventory?.['copper-yoyo']>0);
    const tool=Boolean(selectedFood&&selectedFood!=='copper-yoyo'&&!FOOD[selectedFood]);
    elements['bag-detail-tool'].hidden=!tool;
    if(tool){
      elements['bag-icon-tool'].innerHTML=itemIcon(selectedFood);elements['bag-tool-name'].textContent=ITEMS[selectedFood].name;
      elements['bag-tool-kind'].textContent=ITEMS[selectedFood].material?'CRAFTING MATERIAL':'SALVAGED EQUIPMENT';
      elements['bag-tool-count'].textContent=String(world.inventory[selectedFood]);elements['bag-tool-description'].textContent=ITEMS[selectedFood].description;
      elements['equip-tool'].disabled=!canEat();
    }
    for(let i=0;i<5;i++)elements[`bag-quick-${i}`].disabled=!canEat()||!selectedFood||!(world.inventory?.[selectedFood]>0);
    elements['bag-status'].textContent = tool?'Assign this item to a quick slot. F / USE activates equipped tools. Open Crafting to assemble salvage.':selectedFood==='copper-yoyo'?'Solid copper. Assign to any of the five quick slots. Hold F or USE, then release to reel it in.':count === 0 ? 'Your pack is empty. Gather edible leaves or Crobon Bird eggs while exploring.'
      : hunger >= 100 ? 'You are full. Keep your supplies for later.'
        : count >= BAG_CAPACITY ? 'Your pack is full. Eat a supply to make room.' : 'Select a supply to inspect it, then choose Eat.';
  }

  return { render, select, getSelected: () => ({ index: selectedIndex, food: selectedFood ?? null }),
    destroy() { if (destroyed) return; destroyed = true; listeners.forEach(remove => remove()); } };
}
