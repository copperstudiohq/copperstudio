import {getIceDepth,getIceScale,getPlatformVertices,WATER_LEVEL} from './terrain.js';

/** The exact uncarved glacier rings, shared by visible calving faces and cave
 * clipping. Local render metres, Y up. Keep the triangulation diagonal from
 * upper-next to lower-current when intersecting between two rings. */
export function createGlacierShellSections(floe,vertices=getPlatformVertices(floe)){
 const depth=getIceDepth(floe),seed=floe.seed??0,levels=[0,.035,.11,.25,.43,.5,.70,.88,1];
 const waterFraction=((floe.z??0)-WATER_LEVEL)/depth;
 return levels.map(fraction=>{
  const z=-depth*fraction,scale=getIceScale(floe,z);
  return vertices.flatMap((p,index)=>[0,1/3,2/3].map(along=>{
   const next=vertices[(index+1)%vertices.length],phase=index*1.73+seed*.013;
   const exposed=fraction>0&&fraction<1;
   const wave=waterFraction>0&&waterFraction<1?Math.exp(-(((fraction-waterFraction)/.09)**2))*.008:0;
   const calving=(.006+.009*Math.sin(phase+fraction*8.3)**2)*Math.sin(fraction*Math.PI);
   const hollow=exposed?Math.sin(along*Math.PI)*(calving+wave):0;
   const rounded=1-hollow;
   return[(p.x+(next.x-p.x)*along-floe.x)*scale*rounded/25,z/25,(p.y+(next.y-p.y)*along-floe.y)*scale*rounded/25];
  }));
 });
}
