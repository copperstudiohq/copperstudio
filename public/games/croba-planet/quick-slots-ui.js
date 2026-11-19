import{ITEMS}from'./survival.js';
import{itemIcon}from'./backpack-ui.js';
/** A read-only five-slot view. Binding actions remain in the backpack. */
export function createQuickSlotsPanel({world,document,onSelect}){
 const bar=document.getElementById('quick-slots'),buttons=Array.from({length:5},(_,i)=>document.getElementById(`quick-slot-${i}`));let previous='';
 buttons.forEach((button,i)=>button.addEventListener('click',()=>onSelect(i)));
 return{render(visible){
  const slots=world.quickSlots??Array(5).fill(null),key=JSON.stringify([visible,slots,world.activeQuickSlot,slots.map(id=>world.inventory?.[id]??0)]);if(key===previous)return;previous=key;bar.hidden=!visible;
  slots.forEach((id,i)=>{const count=world.inventory?.[id]??0,button=buttons[i];button.classList.toggle('active',i===(world.activeQuickSlot??0));button.classList.toggle('empty',!id||!count);button.setAttribute('aria-pressed',String(i===(world.activeQuickSlot??0)));button.setAttribute('aria-label',`Quick slot ${i+1}: ${id?ITEMS[id].name:'empty'}${count?'':', unavailable'}`);document.getElementById(`quick-slot-icon-${i}`).innerHTML=id?itemIcon(id):'';document.getElementById(`quick-slot-count-${i}`).textContent=count?String(count):'';});
 }};
}
