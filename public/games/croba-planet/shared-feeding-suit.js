import {batchSuitParts} from './suit-geometry.js';
import {createCreatureSurfaceMaps,applyCreatureSurface} from './creature-materials.js';
import * as THREE from './vendor/three.module.js';
import {sharedBitePose} from './shared-bite-pose.js';

/** Reusable first-person suit legs. The beak occludes the boots as they are
 * pulled forward; there are no blood, wound or exposed-anatomy meshes. */
export class SharedFeedingSuit extends THREE.Group {
 constructor(){
  super();this.name='shared-feeding-suit';this.visible=false;
  this.surfaceMaps=createCreatureSurfaceMaps('suit-fabric',128);
  const fabric=new THREE.MeshStandardMaterial({name:'woven-fabric',color:0x9daeb5,roughness:.86,fog:false});
  applyCreatureSurface(fabric,this.surfaceMaps,.24);
  const seal=new THREE.MeshStandardMaterial({name:'rubber-seals',color:0x182b36,roughness:.82,fog:false});
  const panel=new THREE.MeshStandardMaterial({name:'worn-orange-armor',color:0xba793b,roughness:.62,fog:false});
  // First-person suit geometry stays readable inside the surrounding mouth shell.
  for(const material of [fabric,seal,panel]){material.depthTest=false;material.depthWrite=false;}
  this.legs=[];this.cutCaps=[];this.upperLegs=[];
  const instrument=new THREE.MeshStandardMaterial({name:'chest-instruments',color:0x49747b,emissive:0x10252a,roughness:.42,fog:false,depthTest:false,depthWrite:false});
  const segment=(group,geometry,material,x,y,z,rotation=0)=>{
   const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.rotation.x=rotation;mesh.frustumCulled=false;mesh.renderOrder=20;group.add(mesh);
  };
  this.torso=new THREE.Group();this.torso.name='first-person-suit-torso-and-arms';this.add(this.torso);
  segment(this.torso,new THREE.SphereGeometry(1,20,14).scale(.265,.245,.155),fabric,0,-.49,-.53,-.25);
  segment(this.torso,new THREE.BoxGeometry(.235,.16,.035),seal,0,-.38,-.685,-.25);
  segment(this.torso,new THREE.BoxGeometry(.195,.115,.038),panel,0,-.38,-.71,-.25);
  segment(this.torso,new THREE.BoxGeometry(.12,.043,.009),instrument,-.016,-.36,-.736,-.25);
  for(let i=0;i<3;i++)segment(this.torso,new THREE.BoxGeometry(.017,.014,.010),seal,-.045+i*.03,-.41,-.724,-.25);
  for(const side of [-1,1]){
   const path=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.16,-.27,-.55),new THREE.Vector3(side*.17,-.42,-.69),new THREE.Vector3(side*.16,-.61,-.68)]);
   segment(this.torso,new THREE.TubeGeometry(path,12,.018,6,false),seal,0,0,0);
   segment(this.torso,new THREE.BoxGeometry(.065,.05,.024),panel,side*.17,-.48,-.716,-.25);
  }
  segment(this.torso,new THREE.BoxGeometry(.52,.075,.26),seal,0,-.65,-.61,-.25);
  const limb=(a,b,radius)=>{
   const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
   const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(radius,Math.max(.01,delta.length()-radius*2),4,12),fabric);
   mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
   mesh.renderOrder=20;mesh.frustumCulled=false;this.torso.add(mesh);
  };
  for(const side of [-1,1]){
   limb([side*.29,-.30,-.5],[side*.43,-.45,-.8],.085);
   limb([side*.43,-.45,-.8],[side*.34,-.32,-1.15],.073);
   segment(this.torso,new THREE.SphereGeometry(1,12,8).scale(.10,.085,.09),seal,side*.43,-.45,-.8);
   segment(this.torso,new THREE.TorusGeometry(.078,.015,5,14),panel,side*.35,-.34,-1.08,.35);
   segment(this.torso,new THREE.SphereGeometry(1,12,8).scale(.069,.053,.102),seal,side*.34,-.32,-1.19,-.15);
   for(let finger=0;finger<4;finger++)segment(this.torso,new THREE.CapsuleGeometry(.016,.065-finger*.005,3,6),seal,side*.34+(finger-1.5)*.027,-.31,-1.295,-1.35);
   segment(this.torso,new THREE.CapsuleGeometry(.021,.055,3,6),seal,side*.26,-.34,-1.21,-.65);
   segment(this.torso,new THREE.BoxGeometry(.086,.027,.055),panel,side*.34,-.27,-1.16,-.15);
  }
  for(const side of [-1,1]){
   const leg=new THREE.Group();leg.position.x=side*.18;this.add(leg);this.legs.push(leg);
   const upper=new THREE.Group();upper.position.x=side*.18;this.add(upper);this.upperLegs.push(upper);
   segment(upper,new THREE.CylinderGeometry(.105,.105,.22,12),fabric,0,-.76,-.64,-1.15);
   segment(leg,new THREE.CylinderGeometry(.105,.105,.47,14),fabric,0,-.62,-.93,-1.15);
   const cap=new THREE.Mesh(new THREE.CircleGeometry(.103,12),seal);
   cap.position.set(0,-.71,-.72);cap.rotation.x=.42;
   cap.renderOrder=20;leg.add(cap);this.cutCaps.push(cap);
   segment(leg,new THREE.SphereGeometry(1,14,10).scale(.113,.105,.13),seal,0,-.53,-1.14);
   segment(leg,new THREE.CapsuleGeometry(.087,.37,4,12),fabric,0,-.40,-1.4,-1.2);
   segment(leg,new THREE.BoxGeometry(.14,.045,.24),panel,0,-.29,-1.37,-.1);
   segment(leg,new THREE.SphereGeometry(1,14,10).scale(.102,.092,.19),seal,0,-.25,-1.74);
   segment(leg,new THREE.BoxGeometry(.21,.028,.35),seal,0,-.34,-1.74);
   segment(leg,new THREE.TorusGeometry(.09,.012,5,14),panel,0,-.28,-1.58,.4);
   for(let tread=0;tread<5;tread++)segment(leg,new THREE.BoxGeometry(.205,.016,.024),panel,0,-.356,-1.61-tread*.06);
   segment(leg,new THREE.TorusGeometry(.106,.009,5,14),seal,0,-.67,-.83,.42);
   segment(leg,new THREE.BoxGeometry(.035,.21,.014),seal,.071,-.43,-1.385,-.4);
  }
  batchSuitParts(this.torso);
  for(const upper of this.upperLegs)batchSuitParts(upper);
  for(const leg of this.legs)batchSuitParts(leg,new Set(this.cutCaps));
  const legMaterials=new Map([fabric,seal,panel].map(material=>[material,material.clone()]));
  this.legMaterials=[...legMaterials.values()];
  for(const leg of this.legs)leg.traverse(mesh=>{if(mesh.material)mesh.material=legMaterials.get(mesh.material);});
 }
 dispose(){
  const geometries=new Set(),materials=new Set();this.traverse(mesh=>{if(mesh.geometry)geometries.add(mesh.geometry);if(mesh.material)materials.add(mesh.material);});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.surfaceMaps.dispose();this.clear();
 }
 update(encounter,camera){
  this.visible=Boolean((encounter?.partnerId||encounter?.legsEaten||encounter?.sharedFinish)
   &&['grabbed','observing','to-mouth','striking','shared-bite','handoff','eating'].includes(encounter.phase));
  if(!this.visible)return;
  this.position.copy(camera.position);this.quaternion.copy(camera.quaternion);
  const progress=encounter.phase==='shared-bite'?Math.max(0,Math.min(1,encounter.progress)):0;
  const pose=sharedBitePose(progress);
  for(const material of this.legMaterials){material.depthTest=pose.detached;material.depthWrite=pose.detached;}
  this.legs.forEach((leg,index)=>{
   leg.visible=!encounter.legsEaten&&pose.pull<.99;
   leg.traverse(mesh=>{if(mesh.isMesh)mesh.renderOrder=pose.detached?0:20;});
   // Keep the severed legs rigid: translate and roll into the beak, never shrink.
   leg.position.x=(index?1:-1)*.18*(1-pose.pull*.7);
   leg.position.z=-pose.present*.45-pose.pull*6;leg.position.y=pose.present*.16+pose.pull*.48;
   leg.rotation.z=pose.detached?(index?1:-1)*pose.pull*.16:0;
   leg.scale.set(1,1,1);this.cutCaps[index].visible=pose.detached;
   const upper=this.upperLegs[index];upper.position.z=-pose.present*.45;
   upper.position.y=pose.present*.16;upper.visible=true;
  });
 }
}
