/** Small, reversible mobile drawers around the existing game controls.
 * No game state, timers, animation frames or duplicate inventory actions.
 * @param {{document:Document,window:Window}} host
 */
export function setupMobileHud({document,window}) {
  const required=id=>{
    const node=document.getElementById(id);
    if(!node)throw new Error(`Mobile HUD control is missing: ${id}`);
    return node;
  };
  const tools=required('mobile-tools-panel'),toolsToggle=required('mobile-tools-toggle');
  const status=required('mission'),statusToggle=required('mobile-hud-toggle');
  const slots=required('quick-slots'),slotsToggle=required('mobile-slots-toggle');
  const toolButtons=['sound','help','backpack-toggle','crafting-toggle','building-toggle','saves-toggle','bestiary-toggle','mobile-map-toggle'].map(required);
  const slotButtons=Array.from({length:5},(_,slot)=>required(`quick-slot-${slot}`));
  const media=window.matchMedia?.('(any-pointer: coarse), (max-width: 900px)');
  const listeners=[];
  let disposed=false,toolsOpen=false,statusOpen=false,slotsOpen=false;
  const listen=(node,type,handler)=>{
    const guarded=event=>{if(!disposed)handler(event);};
    node.addEventListener(type,guarded);
    listeners.push(()=>node.removeEventListener?.(type,guarded));
  };
  function setTools(open){
    toolsOpen=open;document.body.classList.toggle('mobile-tools-open',open);
    toolsToggle.setAttribute('aria-expanded',String(open));
    toolsToggle.setAttribute('aria-label',open?'Close tools':'Open tools');
  }
  function setStatus(open){
    statusOpen=open;status.classList.toggle('mobile-hud-expanded',open);
    statusToggle.setAttribute('aria-expanded',String(open));
    statusToggle.setAttribute('aria-label',open?'Hide full expedition status':'Show full expedition status');
    statusToggle.textContent=open?'−':'＋';
  }
  function setSlots(open){
    slotsOpen=open;slots.classList.toggle('mobile-slots-expanded',open);
    slotsToggle.setAttribute('aria-expanded',String(open));
    slotsToggle.setAttribute('aria-label',open?'Hide other quick slots':'Show all five quick slots');
    slotsToggle.textContent=open?'×':'⋯';
  }
  const closeAll=()=>{setTools(false);setStatus(false);setSlots(false);};
  const isMobile=()=>Boolean(media?.matches);
  listen(toolsToggle,'click',()=>{
    if(!isMobile())return;
    const next=!toolsOpen;closeAll();setTools(next);
    if(next)toolButtons[0].focus({preventScroll:true});
  });
  listen(statusToggle,'click',()=>{
    if(!isMobile())return;
    const next=!statusOpen;closeAll();setStatus(next);
  });
  listen(slotsToggle,'click',()=>{
    if(!isMobile())return;
    const next=!slotsOpen;closeAll();setSlots(next);
  });
  // Existing button handlers still own every action and dialog. Closing a
  // drawer must not steal focus back from the newly opened inventory/menu.
  for(const button of toolButtons)listen(button,'click',()=>setTools(false));
  for(const button of slotButtons)listen(button,'click',()=>setSlots(false));
  const inside=(node,target)=>node===target||Boolean(node.contains?.(target));
  listen(document,'pointerdown',event=>{
    if(toolsOpen&&!inside(tools,event.target)&&!inside(toolsToggle,event.target))setTools(false);
    if(statusOpen&&!inside(status,event.target))setStatus(false);
    if(slotsOpen&&!inside(slots,event.target))setSlots(false);
  });
  listen(document,'keydown',event=>{
    if(event.key!=='Escape'||!(toolsOpen||statusOpen||slotsOpen))return;
    const focus=toolsOpen?toolsToggle:statusOpen?statusToggle:slotsToggle;
    event.preventDefault();event.stopPropagation?.();closeAll();focus.focus({preventScroll:true});
  });
  if(media?.addEventListener)listen(media,'change',closeAll);
  closeAll();
  return{closeAll,dispose(){
    if(disposed)return;
    closeAll();disposed=true;listeners.splice(0).forEach(remove=>remove());
  }};
}
