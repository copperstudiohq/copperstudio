/** Durable salvage and tools. The catalogue is independent of inventory/UI. */
export const CRAFTING_ITEMS=Object.freeze({
 debris:Object.freeze({name:'Salvaged debris',material:true,description:'A small piece of crashed cargo: bent metal, copper wire and reusable fasteners.'}),
 'broken-hammer':Object.freeze({name:'Broken hammer',gear:true,unique:true,description:'A battered metal head bound with tough frozen basin leaves. Required to assemble a workbench.'}),
 workbench:Object.freeze({name:'Workbench',gear:true,description:'A folded salvage workbench. Equip and use it on clear, dry land to set it down.'}),
 'rusty-copper-knife':Object.freeze({name:'Rusty copper knife',gear:true,unique:true,description:'An old copper blade sharpened at a workbench. Use beside an edible plant to harvest its leaves.'}),
 'rock-chipper':Object.freeze({name:'Rock chipper',gear:true,unique:true,description:'A reinforced chisel for breaking nearby loose seabed rocks into reusable debris.'}),
 identifier:Object.freeze({name:'Identifier',gear:true,unique:true,description:'A cargo-analysis tool recovered from the truck wreck. It identifies debris and its uses; it does not scan creatures.'}),
 'builder-tool':Object.freeze({name:'Builder tool',gear:true,unique:true,description:'A reinforced construction tool from the basin cargo crate. Open BUILD (V) to choose a Universal Base or furniture. Rotate with R, then use F / USE to place the preview.'}),
});

const recipe=(value)=>Object.freeze({...value,ingredients:Object.freeze(value.ingredients),requires:Object.freeze(value.requires??[])});
export const RECIPES=Object.freeze([
 recipe({id:'broken-hammer',itemId:'broken-hammer',count:1,name:'Broken hammer',description:'Bind a salvaged hammer head with frozen basin leaves.',ingredients:{debris:3,'frost-leaf':2}}),
 recipe({id:'workbench',itemId:'workbench',count:1,name:'Workbench',description:'Assemble a folding workbench. Your hammer is kept.',ingredients:{debris:6},requires:['broken-hammer']}),
 recipe({id:'rusty-copper-knife',itemId:'rusty-copper-knife',count:1,name:'Rusty copper knife',description:'Shape and sharpen a copper blade at a placed workbench.',ingredients:{debris:3},requires:['broken-hammer'],station:'workbench'}),
 recipe({id:'rock-chipper',itemId:'rock-chipper',count:1,name:'Rock chipper',description:'Reinforce a chisel for breaking loose underwater rocks.',ingredients:{debris:4},requires:['broken-hammer'],station:'workbench'}),
]);
