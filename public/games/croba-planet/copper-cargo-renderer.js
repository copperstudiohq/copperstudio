import*as THREE from'./vendor/three.module.js';
import{createCopperStudioCargoAnatomy,COPPERSTUDIO_CARGO_ANCHORS as A}from'./copperstudio-cargo-anatomy.js';
import{COPPER_CARGO_SITE,activeQuickItem,COPPER_YOYO_ID}from'./copper-yoyo.js';
import{createCopperCargoDecor}from'./copper-cargo-decor.js';
import{YOYO_GRIP}from'./yoyo-physics.js';
import{createYoyoStringGeometry,updateYoyoStringGeometry,YOYO_REST_NODES}from'./yoyo-string.js';
function labelTexture(){
 if(typeof document==='undefined')return new THREE.DataTexture(new Uint8Array([255,193,87,255]),1,1);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d');
 c.fillStyle='#26333a';c.fillRect(0,0,1024,256);c.fillStyle='#e39850';c.fillRect(12,12,1000,232);c.fillStyle='#32515a';c.fillRect(21,21,982,214);
 c.font='900 103px "Arial Rounded MT Bold", "Comic Sans MS", sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=17;c.strokeStyle='#17272d';c.strokeText('COPPERSTUDIO',512,126);c.fillStyle='#ffe7a2';c.fillText('COPPERSTUDIO',512,126);
 c.font='bold 21px sans-serif';c.fillStyle='#c6d0ca';c.fillText('PERSONAL CARGO / PROPERTY OF THE CREW',512,211);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;return map;
}
/** An interactive single trunk and the first-person yo-yo share the same copper
 * prototype. The lid/string follow simulation clocks, including pause. */
export class CopperCargoRenderer{
 constructor(world,camera){
  this.group=new THREE.Group();this.group.name='copperstudio-unique-cargo';this.cargo=new THREE.Group();this.group.add(this.cargo);this.camera=camera;this.disposed=false;
  const p=COPPER_CARGO_SITE;this.cargo.position.set(p.x/25,p.z/25,p.y/25);this.cargo.rotation.y=Math.PI/2-p.yaw;
  this.geometry=createCopperStudioCargoAnatomy();this.materials={case:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:.25}),copper:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.29,metalness:.93,envMapIntensity:1.2}),hand:new THREE.MeshStandardMaterial({color:0x314f5d,roughness:.85}),string:new THREE.LineBasicMaterial({color:0xe5d9bb})};
  this.base=new THREE.Mesh(this.geometry.base,this.materials.case);this.lid=new THREE.Mesh(this.geometry.lid,this.materials.case);this.lid.position.fromArray(A.lidHinge);this.cargo.add(this.base,this.lid);
  this.decor=createCopperCargoDecor();this.cargo.add(this.decor);
  this.inside=new THREE.Mesh(this.geometry.yoyo,this.materials.copper);this.inside.position.fromArray(A.yoyoInside);this.inside.scale.setScalar(2.0);this.cargo.add(this.inside);this.inside.rotation.y=Math.PI/2;
  this.cargoStringGeometry=new THREE.BufferGeometry();this.cargoStringGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));this.cargoString=new THREE.Line(this.cargoStringGeometry,this.materials.string);this.cargoString.frustumCulled=false;this.cargo.add(this.cargoString);
  this.texture=labelTexture();this.texture.needsUpdate=true;this.labelGeometry=new THREE.PlaneGeometry(...A.label.size);this.labelMaterial=new THREE.MeshBasicMaterial({map:this.texture,toneMapped:false});const label=new THREE.Mesh(this.labelGeometry,this.labelMaterial);label.position.fromArray(A.label.position);this.cargo.add(label);
  this.toy=new THREE.Group();this.toy.name='first-person-copper-yoyo';camera.add(this.toy);
  this.disc=new THREE.Mesh(this.geometry.yoyo,this.materials.copper);this.toy.add(this.disc);
  this.handGeometry=new THREE.SphereGeometry(1,10,7);this.hand=new THREE.Mesh(this.handGeometry,this.materials.hand);this.hand.position.fromArray(YOYO_GRIP);this.hand.position.y+=.052;this.hand.scale.set(.065,.085,.065);this.toy.add(this.hand);
  this.materials.cord=new THREE.MeshStandardMaterial({color:0xf4e5bd,roughness:.94});
  this.lineGeometry=createYoyoStringGeometry();this.line=new THREE.Mesh(this.lineGeometry,this.materials.cord);this.line.frustumCulled=false;this.toy.add(this.line);
  this.ray=new THREE.Raycaster();this.toy.visible=false;
 }
 hitTest(camera,ndc=new THREE.Vector2()){
  this.group.updateMatrixWorld(true);this.ray.setFromCamera(ndc,camera);return this.ray.intersectObject(this.cargo,true).some(hit=>hit.distance<3.2);
 }
 update(world){
  const state=world.copperCargo??{},age=state.openedAt===undefined?1:Math.max(0,(world.elapsed-state.openedAt)/.55),t=state.opened?Math.min(1,age):0;
  this.lid.rotation.x=A.lidOpenAngle*t*t*(3-2*t);this.inside.visible=!state.claimed&&t>.35;this.cargoString.visible=this.inside.visible;
  this.lid.updateMatrix();const hook=new THREE.Vector3(0,-.06,.54).applyMatrix4(this.lid.matrix);this.inside.position.copy(hook).add(new THREE.Vector3(0,-.28,.20));
  const string=this.cargoStringGeometry.attributes.position;string.setXYZ(0,...hook.toArray());string.setXYZ(1,...this.inside.position.toArray());string.needsUpdate=true;
  const y=world.yoyo,visible=activeQuickItem(world)===COPPER_YOYO_ID&&world.inventory?.[COPPER_YOYO_ID]===1&&!world.squidEncounter&&!world.centipedeEncounter&&!world.treeStalkerEncounter;
  this.toy.visible=visible;if(!visible||!y)return;
  const nodes=y.rope?.localNodes??YOYO_REST_NODES,end=nodes.at(-1),previous=nodes.at(-2);
  this.disc.position.set(end.x,end.y,end.z);this.disc.rotation.set(0,.25,Math.atan2(end.x-previous.x,previous.y-end.y));this.disc.rotateX(y.spin);
  updateYoyoStringGeometry(this.lineGeometry,nodes);
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.decor.dispose();this.group.removeFromParent();this.toy.removeFromParent();Object.values(this.geometry).forEach(g=>g.dispose());Object.values(this.materials).forEach(m=>m.dispose());this.handGeometry.dispose();this.lineGeometry.dispose();this.cargoStringGeometry.dispose();this.labelGeometry.dispose();this.labelMaterial.dispose();this.texture.dispose();this.group.clear();this.toy.clear();}
}
