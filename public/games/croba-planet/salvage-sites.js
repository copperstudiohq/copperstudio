/** Fixed, ground-checked loose cargo. Map units: 25 = 1 metre.
 * These anchors are authored once, never randomized when an expedition starts. */
const starter=[[-5860,-950,0],[-5820,-1010,0],[-5765,-1025,0],[-5690,-1020,0],[-5610,-1000,0],[-5555,-940,0],[-5540,-870,0],[-5570,-780,0],[-5630,-740,0],[-5695,-725,0],[-5770,-720,0],[-5850,-750,0],[-5900,-800,0],[-5900,-890,0]];
const basin=[[-4976.601,-1592.47,57.412567],[-4961.601,-1627.47,49.958656],[-4911.601,-1642.47,44.987807],[-4861.601,-1612.47,46.565928],[-4836.601,-1562.47,48.617316],[-4861.601,-1507.47,51.789875],[-4911.601,-1487.47,52.984085],[-4966.601,-1507.47,60.341987],[-5006.601,-1542.47,69.812006],[-5006.601,-1617.47,63.795205]];
const truck=[[-2025,-1110,17.5],[-1950,-1122.5,17.5],[-1875,-1098.75,17.5],[-1800,-1122.5,17.5],[-1725,-1097.5,17.5],[-1650,-1122.5,17.5],[-1575,-1097.5,17.5],[-1500,-1122.5,17.5],[-1425,-1097.5,17.5],[-1350,-1122.5,17.5],[-1275,-1097.5,21.203704],[-1200,-1122.5,48.981481]];
const regions=[['starter',starter],['basin',basin],['truck',truck]];
export const SALVAGE_SITES=Object.freeze([
 ...regions.flatMap(([region,points])=>points.map(([x,y,z],index)=>Object.freeze({id:`salvage-${region}-${index}`,itemId:'debris',x,y,z:z+2,yaw:index*1.7,label:'Loose crashed-cargo debris',description:'Reusable copper, metal and fasteners. Gather it for tools, workbenches and reinforced bases.',region}))),
 Object.freeze({id:'truck-identifier',itemId:'identifier',x:-1112.5,y:-1110,z:69.5,yaw:Math.PI/2,label:'Identifier',description:'A cargo-identification instrument from the hauler cabin. It identifies loose debris without scanning wildlife.',region:'truck'}),
 Object.freeze({id:'basin-builder-tool',itemId:'builder-tool',x:-4915.601,y:-1559.47,z:53.227658,yaw:0,label:'Builder tool',description:'A reinforced construction tool stored in the COPPERSTUDIO crate. Build a Universal Base on dry land using 8 debris.',region:'basin',crate:true}),
]);
