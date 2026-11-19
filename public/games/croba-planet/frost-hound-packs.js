export const FROST_PACK_BITE_INTERVAL = 1.1;
const range=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export const frostPackId=hound=>hound.packId??hound.id;

/** One snapshot per simulation step: alerts never relay themselves indefinitely,
 * and assigning an attacker never depends on the population's array order. */
export function prepareFrostHoundPacks(world,hounds,sightings,prey,dt,stateKey="frostHoundPackState") {
  const states=world[stateKey]??(world[stateKey]={});
  const groups=new Map(),plans=new Map();
  for(const h of hounds){const id=frostPackId(h);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(h);}
  for(const id of Object.keys(states))if(!groups.has(id))delete states[id];
  for(const [id,members]of groups){
    const sorted=[...members].sort((a,b)=>a.id.localeCompare(b.id));
    const state=states[id]??(states[id]={phase:0,memory:0,biteCooldown:0});
    state.phase+=dt;state.memory=Math.max(0,state.memory-dt);state.biteCooldown=Math.max(0,state.biteCooldown-dt);
    const observers=sorted.filter(h=>sightings.get(h.id));
    if(observers.length){state.target={...prey};state.memory=4;}
    const alerted=sorted.filter(h=>state.memory>0&&state.target
      && Math.hypot(state.target.x-h.homeX,state.target.y-h.homeY)<1100
      && (!observers.length||observers.some(observer=>range(h,observer)<1000)));
    const eligible=alerted.filter(h=>h.biteCooldown<=0&&h.state!=='retreating'&&(!observers.length||sightings.get(h.id)));
    if(!eligible.some(h=>h.id===state.attacker))state.attacker=eligible.sort((a,b)=>range(a,prey)-range(b,prey)||a.id.localeCompare(b.id))[0]?.id;
    const center=sorted.reduce((p,h)=>({x:p.x+h.homeX/sorted.length,y:p.y+h.homeY/sorted.length}),{x:0,y:0});
    const flankers=sorted.filter(h=>h.id!==state.attacker);
    const neighbors=sorted.map(h=>({id:h.id,x:h.x,y:h.y,z:h.z}));
    sorted.forEach((hound,index)=>{
      const slot=hound.packSlot??index,formation=slot*Math.PI*2/(hound.packSize??sorted.length);
      const patrol={x:center.x+Math.cos(state.phase*.13)*120+Math.cos(formation)*95,
        y:center.y+Math.sin(state.phase*.13)*120+Math.sin(formation)*95,z:hound.homeZ};
      const active=alerted.includes(hound),attacker=state.attacker===hound.id;
      let target=state.target;
      if(active&&!attacker){
        const bearing=Math.atan2(state.target.y-center.y,state.target.x-center.x);
        const flank=bearing+([1.3,-1.3,Math.PI][flankers.indexOf(hound)%3]);
        target={x:state.target.x+Math.cos(flank)*125,y:state.target.y+Math.sin(flank)*125,z:state.target.z};
      }
      plans.set(hound.id,{state,active,attacker,target,patrol,neighbors});
    });
  }
  return plans;
}

/** Gentle separation steers the formation around its companions. */
export function frostPackSteering(hound,target,neighbors) {
  const result={...target};
  for(const other of neighbors){
    if(other.id===hound.id)continue;
    const dx=hound.x-other.x,dy=hound.y-other.y,gap=Math.hypot(dx,dy);
    if(gap>=90)continue;
    const angle=gap>1e-5?Math.atan2(dy,dx):(hound.packSlot??0)*2.39996;
    result.x+=Math.cos(angle)*(90-gap)*1.8;result.y+=Math.sin(angle)*(90-gap)*1.8;
  }
  return result;
}
