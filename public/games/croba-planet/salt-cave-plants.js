import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';
import {SALT_CAVE_HALLS,saltCaveStation,saltCaveSection} from './salt-cave.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
/** Four distinct yellow cave plants share the same prepared placement on every
 * device: ribbon kelp, broad fans, cup stalks and soft golden anemones. */
export function createSaltPlantGeometry(kind){
 const plant=new PlantMesh();
 if(kind===0)for(let i=0;i<7;i++){
  const a=i/7*TAU,h=.85+(i%3)*.28;
  plant.leaf(V(0,0,0),V(Math.cos(a)*.35,h,Math.sin(a)*.35),.10+(i%2)*.045,(u,v)=>new THREE.Color(0xf6d94b).multiplyScalar(.7+.3*Math.sin(v*Math.PI)).getHex(),{segments:10,columns:4,curve:.18,cup:.1,twist:.5});
 }else if(kind===1)for(let i=0;i<5;i++){
  const a=(i-2)*.5;
  plant.leaf(V(0,0,0),V(Math.sin(a)*.65,.55+Math.cos(a)*.4,Math.cos(a)*.18),.25,0xe4c538,{segments:8,columns:6,curve:.08,cup:.28,twist:.13});
 }else if(kind===2)for(let i=0;i<4;i++){
  const a=i/4*TAU,x=Math.cos(a)*.17,z=Math.sin(a)*.17,h=.48+(i%3)*.18;
  plant.tube([V(x,0,z),V(x*.8,h*.5,z),V(x,h,z)],[.035,.026,.022],0xb9a72e,6);
  plant.grid(8,12,(u,v)=>{const r=.04+.17*Math.sin(u*Math.PI*.72),angle=v*TAU;return V(x+Math.cos(angle)*r,h+u*.32,z+Math.sin(angle)*r);},(u)=>u>.8?0xffe77b:0xe2ba32);
 }else for(let i=0;i<12;i++){
  const a=i/12*TAU,r=.13+(i%3)*.065,h=.35+(i%4)*.1;
  plant.tube([V(Math.cos(a)*r,0,Math.sin(a)*r),V(Math.cos(a)*r*1.5,h*.7,Math.sin(a)*r*1.5),V(Math.cos(a)*r*1.9,h,Math.sin(a)*r*1.9)],[.045,.035,.012],i%3?0xf0cb37:0xffe67a,6);
 }
 return plant.geometry({normalizeHeight:false});
}
/** Author-defined paths populate hall edges while leaving clear swimming lanes. */
export function saltCavePlantSites(){
 const sites=[],paths=[...SALT_CAVE_HALLS,Array.from({length:12},(_,i)=>{const y=-11500-i*210;return[saltCaveStation(y).x,y];})];
 for(const [k,path]of paths.entries())for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.ceil(length/42),nx=-(b[1]-a[1])/length,ny=(b[0]-a[0])/length;
  for(let j=0;j<count;j++)for(const side of[-1,1]){
   if((j+i+k)%9===1&&side<0)continue;
   const t=(j+.3+.24*Math.sin(j*3+i))/count,offset=side*(70+40*Math.sin(j*2+i+k)),x=a[0]+(b[0]-a[0])*t+nx*offset,y=a[1]+(b[1]-a[1])*t+ny*offset,q=saltCaveSection(x,y);
   if(!q||q.clearance<20)continue;
   sites.push({x,y,z:q.floor,kind:(j+i+k+(side>0?2:0))%4,scale:.7+(j%4)*.19,angle:j*1.7+i+k});
  }
 }
 return sites;
}
