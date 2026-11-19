import * as THREE from './vendor/three.module.js';
import {createCopperCargoDecor} from './copper-cargo-decor.js';
import {basinCaveMeshField} from './basin-caves.js';
import {PlantMesh} from './plant-mesh.js';

/** Simulation units, Z up. Offset from the mainland meeting chamber's center
 * so the four passage junctions remain walkable around the spilled cargo. */
export const BASIN_MERCH_CARGO_SITE=Object.freeze({
 id:'basin-rain-and-copper-merch-cargo',platformId:'tundra-continent',
 x:-2625,y:-8335,z:-105.3197848084302,yaw:0,
});

/** Render-local metres, Y up and front +Z, relative to the fixed site above.
 * These are conservative occupied crate/lid volumes; loose cloth and wire
 * remain floor decoration and do not introduce invisible walking barriers. */
export const BASIN_MERCH_CARGO_SOLIDS=Object.freeze([
 {id:'basin-merch-crate',center:[0,.91,0],size:[3.8,1.82,2.1]},
 {id:'basin-merch-tipped-lid',center:[0,.96,-1.73],size:[3.88,1.64,1.64]},
].map(s=>Object.freeze({...s,center:Object.freeze(s.center),size:Object.freeze(s.size)})));

const color=new THREE.Color(),vertex=new THREE.Vector3(),normal=new THREE.Vector3();

/** A handful of shared surfaces keeps the scattered load cheap to render. */
class CargoMeshBuilder{
 constructor(){this.parts=new Map();this.pose=new THREE.Object3D();}
 add(kind,name,source,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1],tint=0xffffff){
  const geometry=source.index?source.toNonIndexed():source.clone();
  this.pose.position.fromArray(position);this.pose.rotation.set(...rotation);this.pose.scale.fromArray(scale);this.pose.updateMatrix();geometry.applyMatrix4(this.pose.matrix);
  if(!geometry.attributes.normal)geometry.computeVertexNormals();
  let batch=this.parts.get(kind);if(!batch){batch={position:[],normal:[],uv:[],color:[],features:[]};this.parts.set(kind,batch);}
  const p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv,sourceColor=geometry.attributes.color,start=batch.position.length/3;
  color.set(tint);
  for(let i=0;i<p.count;i++){
   vertex.fromBufferAttribute(p,i);normal.fromBufferAttribute(n,i);
   batch.position.push(vertex.x,vertex.y,vertex.z);batch.normal.push(normal.x,normal.y,normal.z);
   batch.uv.push(uv?.getX(i)??vertex.x*.4,uv?.getY(i)??vertex.z*.4);
   const wear=kind==='print'?1:.89+.11*Math.sin(vertex.x*9+vertex.y*8+vertex.z*6)**2;
   batch.color.push(color.r*wear*(sourceColor?.getX(i)??1),color.g*wear*(sourceColor?.getY(i)??1),color.b*wear*(sourceColor?.getZ(i)??1));
  }
  batch.features.push({name,start,count:p.count});geometry.dispose();
 }
 own(kind,name,geometry,position,rotation,scale,tint){this.add(kind,name,geometry,position,rotation,scale,tint);geometry.dispose();}
 box(kind,name,position,size,rotation=[0,0,0],tint=0xffffff){this.own(kind,name,new THREE.BoxGeometry(...size),position,rotation,[1,1,1],tint);}
 panel(kind,name,points,tint=0xffffff){
  const positions=[];for(let i=1;i<points.length-1;i++)positions.push(...points[0],...points[i],...points[i+1]);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  this.own(kind,name,geometry,[0,0,0],[0,0,0],[1,1,1],tint);
 }
 finish(materials){
  const group=new THREE.Group();group.name='basin-rain-and-copper-spilled-merch';
  for(const[kind,batch]of this.parts){
   const geometry=new THREE.BufferGeometry();
   for(const[name,size]of[['position',3],['normal',3],['uv',2],['color',3]])geometry.setAttribute(name,new THREE.Float32BufferAttribute(batch[name],size));
   geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.userData.features=batch.features;
   const mesh=new THREE.Mesh(geometry,materials[kind]);mesh.name=`basin-merch-${kind}`;mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
  }
  return group;
 }
}

const localFloor=(x,z)=>{
 const site=BASIN_MERCH_CARGO_SITE,q=basinCaveMeshField(site.x+x*25,site.y+z*25,site.platformId);
 if(!q||q.clearance<=0)throw new Error('Basin merchandise must remain inside the mainland cave chamber.');
 return(q.floor-site.z)/25;
};

/** A broken-open shipping crate with a tipped lid, two cut cloth shirts,
 * recognizable existing concept-art prints and loose copper cargo. All
 * positions are render-local metres; caller owns group.dispose(). */
export function createBasinMerchCargo(materials={}){
 const source=createCopperCargoDecor(),builder=new CargoMeshBuilder();
 const shirt=source.getObjectByName('shirt-cloth-sleeves-and-open-neckline');
 const print=source.getObjectByName('rain-and-copper-concept-art-print');
 const ingot=source.getObjectByName('copper-ingot-1');
 if(!shirt||!print||!ingot){source.dispose();throw new Error('Rain and Copper cargo decorations are incomplete.');}
 const skin=materials.orangeMetal?.clone()??new THREE.MeshStandardMaterial({roughness:.86,metalness:.2});
 const trim=materials.darkMetal?.clone()??new THREE.MeshStandardMaterial({roughness:.73,metalness:.5});
 const cloth=new THREE.MeshStandardMaterial({roughness:.98,metalness:0,side:THREE.DoubleSide});
 const copper=new THREE.MeshStandardMaterial({roughness:.33,metalness:.91});
 const art=print.material.clone();
 for(const material of[skin,trim,cloth,copper,art]){material.vertexColors=true;material.side=THREE.DoubleSide;material.forceSinglePass=true;}
 const ownedMaterials=[skin,trim,cloth,copper,art];

 // The crate is recognizable as an old strapped freight box, rather than a
 // featureless cube. The missing front exposes its packed and spilled load.
 builder.box('skin','crate-heavy-bottom',[0,.18,0],[3.8,.24,2.1],[0,0,0],0xa57852);
 builder.box('skin','crate-rear-wall',[0,.99,-1.0],[3.8,1.62,.12],[0,0,0],0x9d754f);
 for(const side of[-1,1]){
  builder.box('skin','crate-side-wall',[side*1.84,.98,-.05],[.12,1.60,2.0],[0,0,side*.025],0xa17f60);
  for(const z of[-.94,.93])builder.box('trim','crate-corner-protector',[side*1.86,.99,z],[.17,1.78,.17],[0,0,0],0x46545a);
  builder.box('trim','crate-lower-skid',[side*1.19,.045,-.05],[.30,.09,2.35],[0,0,0],0x344249);
 }
 builder.panel('skin','splintered-front-left',[[-1.9,.29,1.04],[-.8,.29,1.04],[-.95,.48,1.04],[-1.31,.63,1.04],[-1.37,.94,1.04],[-1.9,1.20,1.04]],0x9c7654);
 builder.panel('skin','splintered-front-right',[[.78,.29,1.04],[1.9,.29,1.04],[1.9,1.15,1.04],[1.61,.89,1.04],[1.47,.51,1.04],[1.03,.59,1.04]],0xa17b57);
 for(const y of[.48,.90,1.34])builder.box('skin','recessed-rear-board-seam',[0,y,-.925],[3.55,.025,.015],[0,0,0],0x675446);
 for(const x of[-1.24,1.24]){
  builder.box('trim','broken-cargo-restraint',[x,.31,.48],[.11,.045,1.25],[0,0,0],0x364246);
  builder.panel('trim','dangling-restraint-end',[[x-.055,.32,1.05],[x+.055,.32,1.05],[x+.13,localFloor(x,1.9)+.025,1.9],[x+.02,localFloor(x,1.9)+.025,1.9]],0x38464b);
  for(const z of[-.92,.85])builder.box('trim','strap-ratchet-buckle',[x,.40,z],[.19,.15,.13],[.1,0,0],0x5c665f);
 }
 for(const side of[-1,1])for(const y of[.38,1.55])for(const z of[-.95,.9]){
  builder.own('trim','recessed-crate-fastener',new THREE.CylinderGeometry(.033,.033,.016,6),[side*1.914,y,z],[0,0,Math.PI/2],[1,1,1],0x93968b);
 }
 // An entire detached lid tips against the back wall, below the cave roof.
 builder.box('skin','tipped-open-crate-lid',[0,.96,-1.73],[3.86,.13,2.05],[-.75,0,.018],0x9b7959);
 for(const x of[-1.23,1.23])builder.box('trim','lid-steel-reinforcement',[x,.99,-1.73],[.13,.18,2.12],[-.75,0,.018],0x435057);
 builder.box('trim','lid-recessed-handle',[0,1.54,-1.14],[.70,.12,.15],[-.75,0,0],0x657169);

 // Only the existing cut-shirt and concept-print assets are copied into
 // merged batches; factory-only source meshes never add renderer draws.
 const addShirt=(name,position,rotation,scale,tint)=>{
  builder.add('cloth',name,shirt.geometry,position,rotation,[scale,scale,scale],tint);
  const pose=new THREE.Object3D();pose.position.fromArray(position);pose.rotation.set(...rotation);pose.scale.setScalar(scale);pose.updateMatrix();
  const transform=new THREE.Matrix4().makeTranslation(0,.32,0).premultiply(pose.matrix);
  const geometry=print.geometry.clone();geometry.applyMatrix4(transform);builder.add('print',name+'-rain-and-copper-art',geometry);geometry.dispose();
 };
 addShirt('shirt-spilling-over-broken-front',[-.61,.14,1.46],[-.65,.08,-.18],1.23,0x405e70);
 addShirt('shirt-spread-across-cave-floor',[.43,localFloor(.43,2.15)+.10,2.15],[-Math.PI/2,0,.31],1.12,0x405366);
 for(const[x,z,angle]of[[-1.13,-.39,-.13],[.05,-.30,.17],[1.02,.18,-.23]]){
  builder.box('cloth','folded-merchandise-bundle',[x,.42,z],[.66,.23,.55],[.025,angle,.02],0x435d68);
  builder.box('cloth','folded-shirt-collar',[x,.555,z-.12],[.18,.025,.09],[0,angle,0],0x7a8787);
 }
 for(const[x,y,z,angle]of[[-1.11,.58,-.38,-.13],[.04,.58,-.30,.17]]){
  builder.own('print','folded-merch-concept-print',new THREE.PlaneGeometry(.43,.258),[x,y,z],[-Math.PI/2,0,angle],[1,1,1]);
 }
 for(const[x,z,angle]of[[1.08,1.74,.25],[1.35,2.1,-.22],[.92,2.42,.56]]){
  builder.add('copper','spilled-copper-ingot',ingot.geometry,[x,localFloor(x,z)+.09,z],[0,angle,0],[1.15,1.15,1.15],0xffffff);
 }
 const spoolFloor=localFloor(-1.3,1.98);
 builder.own('trim','spilled-wire-spool-core',new THREE.CylinderGeometry(.10,.10,.25,12),[-1.3,spoolFloor+.20,1.98],[0,0,.18],[1,1,1],0x61716a);
 for(const sign of[-1,1])builder.own('trim','wire-spool-end-flange',new THREE.CylinderGeometry(.18,.18,.022,12),[-1.3,spoolFloor+.20+sign*.125,1.98],[0,0,0],[1,1,1],0x758477);
 const wire=new PlantMesh(),path=[];
 for(let i=0;i<=48;i++){const t=i/48,a=t*Math.PI*10;path.push(new THREE.Vector3(-1.3+Math.cos(a)*.14,spoolFloor+.10+t*.20,1.98+Math.sin(a)*.14));}
 wire.tube(path,.008,0xbf7d47,4);
 wire.tube([new THREE.Vector3(-1.16,spoolFloor+.10,1.98),new THREE.Vector3(-.93,localFloor(-.93,2.25)+.035,2.25),new THREE.Vector3(-.69,localFloor(-.69,2.53)+.035,2.53),new THREE.Vector3(-.32,localFloor(-.32,2.67)+.035,2.67)],.008,0xb97542,4);
 builder.own('copper','unwound-copper-wire-trailing-on-floor',wire.geometry({normalizeHeight:false}));
 for(const[x,z,angle]of[[1.06,-.57,.08],[-1.4,.38,-.2]]){
  builder.box('skin','small-merchandise-carton',[x,.65,z],[.59,.67,.61],[0,angle,0],0x827256);
  builder.box('trim','carton-packing-band',[x,.99,z],[.07,.022,.63],[0,angle,0],0xa79d83);
 }
 for(const[x,z]of[[-1.92,1.31],[1.79,1.24],[-.34,2.85]]){
  builder.box('skin','broken-packing-board',[x,localFloor(x,z)+.035,z],[.52,.055,.19],[.03,x*.31,.02],0x886c50);
 }
 const group=builder.finish({skin,trim,cloth,copper,print:art});
 group.userData={decorative:true,crateLengthMeters:3.8,shirtCount:2,foldedMerchCount:3,copperIngotCount:3,
  surfaceBatches:group.children.length,siteId:BASIN_MERCH_CARGO_SITE.id,solids:BASIN_MERCH_CARGO_SOLIDS,
  triangleCount:group.children.reduce((sum,m)=>sum+m.geometry.attributes.position.count/3,0)};
 let disposed=false;group.dispose=()=>{
  if(disposed)return;disposed=true;group.removeFromParent();for(const mesh of group.children)mesh.geometry.dispose();
  ownedMaterials.forEach(m=>m.dispose());source.dispose();group.clear();
 };
 return group;
}

/** One static, bounded cargo vignette in the connected mainland cave hall. */
export class BasinMerchCargoRenderer{
 constructor(world,materials={}){
  const site=BASIN_MERCH_CARGO_SITE;
  if(!world.platforms?.some(p=>p.id===site.platformId))throw new Error('Missing mainland glacier for Basin merchandise cargo.');
  this.group=createBasinMerchCargo(materials);this.group.position.set(site.x/25,site.z/25,site.y/25);this.group.rotation.y=site.yaw;this.disposed=false;
 }
 update(camera){
  if(this.disposed)return;
  const p=this.group.position;this.group.visible=camera.y<2&&Math.hypot(camera.x-p.x,camera.z-p.z)<55;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.group.dispose();}
}
