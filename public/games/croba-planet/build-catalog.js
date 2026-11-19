/** Prepared build dimensions use simulation units: 25 = one metre. */
const plan=value=>Object.freeze(value);
export const BUILD_PLANS=Object.freeze([
 plan({id:'universal-base',name:'Universal Base',category:'habitat',description:'A reinforced land habitat with automatic foundations, stairs and a sky ceiling.',cost:8,width:300,length:400,height:112.5}),
 plan({id:'workbench',name:'Workbench',category:'habitat',description:'Place one crafted workbench kit to assemble advanced tools.',cost:0,width:44,length:24,height:23}),
 plan({id:'habitat-chair',name:'Habitat chair',category:'furniture',description:'A compact padded chair for your Universal Base.',cost:1,width:20,length:20,height:27.5}),
 plan({id:'habitat-table',name:'Habitat table',category:'furniture',description:'A sturdy table for the habitat interior.',cost:2,width:45,length:25,height:20}),
 plan({id:'habitat-bunk',name:'Habitat bunk',category:'furniture',description:'A single sleeping bunk for the habitat interior.',cost:3,width:25,length:55,height:25}),
 plan({id:'habitat-cabinet',name:'Habitat cabinet',category:'furniture',description:'An upright cabinet for furnishing your habitat.',cost:2,width:22.5,length:15,height:45}),
 plan({id:'habitat-planter',name:'Habitat planter',category:'furniture',description:'A small planted container for the habitat interior.',cost:1,width:22.5,length:22.5,height:20}),
]);
export const FURNITURE_SPECS=Object.freeze(Object.fromEntries(BUILD_PLANS.filter(value=>value.category==='furniture').map(value=>[value.id,value])));
export const getBuildPlan=id=>BUILD_PLANS.find(value=>value.id===id)??null;
