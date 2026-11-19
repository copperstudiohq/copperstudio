import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';

/** Literal underground placements. Coordinates, height and collision dimensions
 * are simulation units (25 units = 1 metre); yaw is the render Y rotation.
 * The small trunk collision leaves the existing cave lanes walkable. */
export const CROBAN_MANGO_SITES=Object.freeze([
 {id:'croban-mango-0',platformId:'outer-ice-03',caveId:'basin-cave-1',x:-4739,y:-1626,z:-106.64066104370335,yaw:.42},
 {id:'croban-mango-1',platformId:'tundra-continent',caveId:'basin-cave-2',x:-3461,y:-7296,z:-104.36720268830439,yaw:1.1},
 {id:'croban-mango-2',platformId:'tundra-continent',caveId:'basin-cave-3',x:-1196,y:-7670,z:-105.04394150407956,yaw:2.3},
 {id:'croban-mango-3',platformId:'tundra-continent',caveId:'basin-cave-4',x:-1733,y:-9237,z:-105.92676441920621,yaw:.15},
 {id:'croban-mango-4',platformId:'tundra-continent',caveId:'basin-cave-5',x:-3898,y:-8570,z:-104.22587774569737,yaw:-1},
 {id:'croban-mango-5',platformId:'tundra-continent',caveId:'basin-cave-2',x:-2742,y:-7921,z:-106.42952559109702,yaw:1.9},
 {id:'croban-mango-6',platformId:'tundra-continent',caveId:'basin-cave-3',x:-2020,y:-8139,z:-106.48462565218583,yaw:-.5},
].map(site=>Object.freeze({...site,height:47.5,trunkRadius:7.5,trunkHeight:32,canopyRadius:26.5,food:'croban-mango',kind:'croban-mango'})));

/** Fruit centres in prototype render metres, Y up. One fruit instance contains
 * this whole hanging crop; harvesting a site hides only its fruit batch. */
export const CROBAN_MANGO_FRUIT=Object.freeze([
 [-.70,1.13,.31],[.64,1.26,.31],[-.30,1.33,-.57],[.38,1.10,-.42],
 [.04,1.25,.65],[-.45,1.40,.05],[.45,1.43,-.15],[.06,1.50,-.18],
].map(point=>Object.freeze(point)));

const v=(x,y,z)=>new THREE.Vector3(x,y,z),color=new THREE.Color();
const darkWood=new THREE.Color(0x172a33),frostWood=new THREE.Color(0xc3d9e2),fruitFrost=new THREE.Color(0xbad9ee);
const barkTint=(u,t)=>color.setHex(0x586771).lerp(darkWood,.2+.4*Math.sin(t*44+u*3)**2)
 .lerp(frostWood,Math.max(0,Math.cos(t*44+u*3))*.52).getHex();

/** Deep, irregular grain follows the bends instead of looking painted on. */
function oldWood(mesh,points,radii,sides=6){
 const up=v(0,1,0),frames=points.map((point,index)=>new THREE.Quaternion().setFromUnitVectors(up,
  points[Math.min(points.length-1,index+1)].clone().sub(points[Math.max(0,index-1)]).normalize()));
 mesh.grid(points.length-1,sides,(u,t)=>{
  const index=Math.round(u*(points.length-1)),angle=t*Math.PI*2;
  const radius=radii[index]*(.91+.12*Math.cos(angle*3+u*.8)+.045*Math.sin(angle*7-u*3));
  return v(Math.cos(angle)*radius,0,Math.sin(angle)*radius).applyQuaternion(frames[index]).add(points[index]);
 },barkTint,0,true);
}

function frozenBranchCap(mesh,start,end){
 const axis=end.clone().sub(start).normalize(),side=v(-axis.z,0,axis.x).normalize();
 mesh.grid(1,8,(u,t)=>start.clone().lerp(end,t).addScaledVector(side,(u*2-1)*.034)
  .add(v(0,.027+Math.sin(t*Math.PI)*.018-(u*2-1)**2*.018,0)),0xe4f2fc);
}

function leafBlade(mesh,root,angle,length,width,index){
 const axis=v(Math.cos(angle),.18+.15*Math.sin(index*1.7),Math.sin(angle)).normalize();
 const side=v(-axis.z,0,axis.x).normalize(),tip=root.clone().addScaledVector(axis,length);
 const middle=root.clone().lerp(tip,.53),ridge=middle.clone().add(v(0,.018,0));
 const left=middle.clone().addScaledVector(side,width),right=middle.clone().addScaledVector(side,-width);
 const start=mesh.positions.length/3;
 const points=[root,left,tip,right,ridge,tip.clone().add(v(0,.042,0)),
  tip.clone().lerp(root,.2).addScaledVector(side,.012),tip.clone().lerp(root,.2).addScaledVector(side,-.012)];
 for(let i=0;i<points.length;i++){
  const p=points[i],shade=i===4?0xffffff:i===1||i===3?0xdbe7ed:0xf5f9ff;
  color.setHex(shade);mesh.positions.push(p.x,p.y,p.z);mesh.colors.push(color.r,color.g,color.b);
  mesh.uvs.push(i===2||i===5?1:0,i%2);mesh.glow.push(0);
 }
 for(const tri of[[0,1,4],[1,2,4],[2,3,4],[3,0,4],[2,5,6],[5,2,7],[5,7,6]])mesh.indices.push(...tri.map(i=>start+i));
}

/** Shared 1.9 m ancient bonsai. Gnarled wood, frost, pointed icy leaves and asymmetric
 * kidney-shaped mangoes remain the same model on desktop and mobile. */
export function createCrobanMangoGeometry(){
 const bark=new PlantMesh(),leaves=new PlantMesh(),fruit=new PlantMesh();
 bark.grid(1,10,(u,t)=>v(Math.cos(t*Math.PI*2)*(.25-u*.04),u*.075,Math.sin(t*Math.PI*2)*(.25-u*.04)),0x657985);
 oldWood(bark,[v(0,.02,0),v(-.08,.28,-.015),v(.12,.49,.045),v(.22,.72,.08),v(-.015,.95,.035),v(-.18,1.14,.02),v(-.085,1.32,-.025),v(.05,1.48,-.015),v(.03,1.64,-.05)],
  [.22,.20,.155,.145,.12,.105,.075,.053,.028],8);
 for(let root=0;root<5;root++){
  const a=root*Math.PI*2/5+.23,dx=Math.cos(a),dz=Math.sin(a);
  oldWood(bark,[v(dx*.12,.14,dz*.12),v(dx*.28,.085,dz*.26),v(dx*.43,.042,dz*.38),v(dx*.57,.018,dz*.48)],
   [.075,.054,.028,.012]);
 }
 for(const [x,y,z,side]of[[.12,.63,.07,1],[-.1,1.08,.02,-1]]){
  oldWood(bark,[v(x,y,z),v(x+side*.15,y+.08,z+.08),v(x+side*.28,y+.13,z+.13),v(x+side*.30,y+.19,z+.12)],
   [.055,.042,.027,.013],5);
 }
 for(const[x,y,z]of[[.10,.48,.19],[-.08,1.13,.12]]){
  bark.grid(1,8,(u,t)=>v(x+Math.cos(t*Math.PI*2)*u*.044,y+Math.sin(t*Math.PI*2)*u*.071,z+Math.sin(u*Math.PI)*.014),
   u=>color.copy(darkWood).lerp(frostWood,u*.66).getHex());
 }
 const crowns=[[-.65,1.45,.28],[.60,1.56,.28],[-.25,1.63,-.58],[.32,1.42,-.46],[.02,1.57,.62],[.02,1.73,-.04]];
 for(const[index,[x,y,z]]of crowns.entries()){
  const center=v(x,y,z),base=v(index%2?.02:-.06,1.02+index*.065,.015);
  oldWood(bark,[base,base.clone().lerp(center,.38).add(v(.06,.1,-.03)),base.clone().lerp(center,.73).add(v(-.02,.06,.045)),center],
   [.067-index*.004,.049,.033,.017]);
  frozenBranchCap(leaves,base.clone().lerp(center,.4).add(v(0,.07,0)),center.clone().add(v(0,.015,0)));
  const drip=base.clone().lerp(center,.76).add(v(0,.015,0));
  leaves.tube([drip,drip.clone().add(v(.012,-.13-index%3*.025,.008))],[.021,.001],0xe2f1fd,4);
  for(let twig=0;twig<5;twig++){
   const a=twig*Math.PI*2/5+index*.47;
   bark.tube([center.clone().add(v(0,-.08,0)),center.clone().add(v(Math.cos(a)*.18,.015,Math.sin(a)*.18))],[.018,.008],barkTint,5);
  }
  for(let leaf=0;leaf<20;leaf++){
   const angle=leaf*2.399963+index*.62,ring=.025+(leaf%4)*.014;
   const root=center.clone().add(v(Math.cos(angle)*ring,((leaf%5)-2)*.022,Math.sin(angle)*ring));
   leafBlade(leaves,root,angle,.21+(leaf%5)*.014,.028+(leaf%3)*.006,leaf+index*20);
  }
 }
 for(const[index,point]of CROBAN_MANGO_FRUIT.entries()){
  const [x,y,z]=point;
  bark.tube([v(x-.025,y+.25,z-.012),v(x-.008,y+.18,z)],[.011,.006],0x7b897c,5);
  fruit.grid(6,10,(u,t)=>{
   const theta=u*Math.PI,a=t*Math.PI*2,s=Math.sin(theta),belly=.105*(.88+.13*Math.cos(theta));
   return v(x+Math.cos(a)*s*belly+.035*s*s+.022*(1-Math.cos(theta)),
    y+Math.cos(theta)*.165,z+Math.sin(a)*s*.086);
  },(u,t)=>color.setHex(0x1765bc).lerp(new THREE.Color(0x8ec8f6),Math.max(0,Math.cos(t*Math.PI*2-.7))*.28)
   .lerp(new THREE.Color(0x063e86),u*.21+.035*Math.sin(t*48+index*1.3)**2)
   .lerp(fruitFrost,Math.max(0,Math.cos(u*Math.PI))**6*.38).getHex());
 }
 const geometry={bark:bark.geometry({normalizeHeight:false}),leaves:leaves.geometry({normalizeHeight:false}),fruit:fruit.geometry({normalizeHeight:false})};
 let triangles=0;
 for(const[kind,mesh]of Object.entries(geometry)){
  mesh.name=`croban-mango-${kind}-prototype`;mesh.userData.prototypePart=kind;mesh.userData.mobileSameModel=true;
  triangles+=(mesh.index?.count??mesh.attributes.position.count)/3;
 }
 geometry.fruit.userData.fruitCount=CROBAN_MANGO_FRUIT.length;
 geometry.bark.userData.trunkRadiusMeters=.3;geometry.bark.userData.trunkHeightMeters=1.28;
 if(triangles>3000){Object.values(geometry).forEach(mesh=>mesh.dispose());throw new RangeError(`Croban Mango exceeds its 3000 triangle budget: ${triangles}`);}
 return geometry;
}

/** Three shared instanced draws; no added lights, glow, texture allocations or
 * shadow passes. Fruit regrowth reads the existing harvestedPlants timestamps. */
export class CrobanMangoRenderer{
 constructor(world,materials={}){
  this.group=new THREE.Group();this.group.name='underground-croban-mango-bonsai';this.disposed=false;
  this.geometry=createCrobanMangoGeometry();this.batches=[];this.visibleFruitSiteIds=[];
  const bark=materials.bark?.clone()??new THREE.MeshStandardMaterial({color:0xffffff,roughness:.93});
  // Authored frost colours replace the warm bark albedo; borrowed normal and
  // roughness maps still provide the weathered surface without new textures.
  bark.map=null;bark.color.setHex(0xffffff);bark.vertexColors=true;
  const leaves=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.61,metalness:0,side:THREE.DoubleSide});
  leaves.forceSinglePass=true;
  const fruit=new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,roughness:.4,metalness:0,clearcoat:.3,clearcoatRoughness:.28});
  this.materials={bark,leaves,fruit};
  const platforms=new Set((world.platforms??[]).map(p=>p.id));
  this.sites=CROBAN_MANGO_SITES.filter(site=>platforms.has(site.platformId));
  this.fruitSiteIds=this.sites.map(site=>site.id);
  this.entries=this.sites.map(site=>{
   if(![site.x,site.y,site.z,site.yaw].every(Number.isFinite))throw new TypeError(`Croban Mango ${site.id} needs a finite prepared pose.`);
   const pose=new THREE.Object3D();pose.position.set(site.x/25,site.z/25,site.y/25);pose.rotation.y=site.yaw;pose.updateMatrix();
   return {site,position:pose.position.clone(),matrix:pose.matrix.clone()};
  });
  for(const kind of['bark','leaves','fruit']){
   const mesh=new THREE.InstancedMesh(this.geometry[kind],this.materials[kind],Math.max(1,this.entries.length));
   mesh.name=`croban-mango-${kind}`;mesh.count=0;mesh.castShadow=false;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
   this.group.add(mesh);this.batches.push({kind,mesh,key:null});
  }
  this.group.userData.prototypeTriangles=Object.values(this.geometry).reduce((sum,mesh)=>sum+(mesh.index?.count??mesh.attributes.position.count)/3,0);
  this.group.userData.fruitPerTree=CROBAN_MANGO_FRUIT.length;this.update(world);
 }
 update(world,camera){
  if(this.disposed)return;
  const entries=this.entries.filter(entry=>!camera||entry.position.distanceToSquared(camera)<=45*45);
  let visible=false;
  for(const batch of this.batches){
   const picked=batch.kind==='fruit'?entries.filter(entry=>!(world.harvestedPlants?.[entry.site.id]>(world.elapsed??0))):entries;
   const key=picked.map(entry=>entry.site.id).join('|');
   if(batch.kind==='fruit')this.visibleFruitSiteIds=picked.map(entry=>entry.site.id);
   if(key!==batch.key){
    batch.key=key;picked.forEach((entry,index)=>batch.mesh.setMatrixAt(index,entry.matrix));
    batch.mesh.count=picked.length;batch.mesh.visible=picked.length>0;batch.mesh.instanceMatrix.needsUpdate=true;
    if(picked.length)batch.mesh.computeBoundingSphere();
   }
   visible||=picked.length>0;
  }
  this.group.visible=visible;
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;
  for(const batch of this.batches){batch.mesh.dispose();batch.mesh.geometry.dispose();}
  Object.values(this.materials).forEach(material=>material.dispose());this.group.removeFromParent();this.group.clear();
 }
}
