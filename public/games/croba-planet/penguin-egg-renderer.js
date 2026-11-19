import {capRenderDistance} from './render-distance.js';
import * as THREE from './vendor/three.module.js';
import {getPenguinEggs} from './penguin-nests.js';
import {PENGUIN_EGG_HATCH_SECONDS} from './penguin-lifecycle.js';
import {PENGUIN_EGG_IDS} from './penguin-nest-sites.js';

const EGG_CAPACITY=PENGUIN_EGG_IDS.length;

/** A small, deterministic shell map shared by every egg, including its speckles. */
function eggShellMap(){
 const size=64,data=new Uint8Array(size*size*4),spots=[];
 let seed=4729;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<36;i++)spots.push({x:random()*size,y:random()*size,r:.65+random()*1.3});
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let speckle=0;
  for(const spot of spots){
   const dx=Math.min(Math.abs(x-spot.x),size-Math.abs(x-spot.x)),dy=y-spot.y;
   speckle=Math.max(speckle,Math.exp(-(dx*dx+dy*dy)/(spot.r*spot.r)));
  }
  const grain=(random()-.5)*3,index=(y*size+x)*4;
  data[index]=222-speckle*37+grain;data[index+1]=237-speckle*29+grain;data[index+2]=231-speckle*24+grain;data[index+3]=255;
 }
 const map=new THREE.DataTexture(data,size,size);map.colorSpace=THREE.SRGBColorSpace;
 map.wrapS=THREE.RepeatWrapping;map.needsUpdate=true;return map;
}

/** All prepared nest eggs share one bounded batch; stealing repacks instances. */
export class PenguinEggRenderer{
 constructor(world,quality={}){
  this.group=new THREE.Group();this.group.name='wreck-wing-penguin-eggs';
  this.geometry=new THREE.SphereGeometry(1,quality.mobile?12:20,quality.mobile?10:14);
  const position=this.geometry.attributes.position;
  for(let i=0;i<position.count;i++){
   const y=position.getY(i),width=.08*(1-y*.16);
   position.setXYZ(i,position.getX(i)*width,y*.12,position.getZ(i)*width);
  }
  this.geometry.computeVertexNormals();this.geometry.computeBoundingSphere();
  this.map=eggShellMap();
  this.material=new THREE.MeshPhysicalMaterial({color:0xffffff,map:this.map,roughness:.67,clearcoat:.14,clearcoatRoughness:.5});
  this.mesh=new THREE.InstancedMesh(this.geometry,this.material,EGG_CAPACITY);this.mesh.name='penguin-speckled-eggs';this.mesh.count=0;
  this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.group.add(this.mesh);
  this.pose=new THREE.Object3D();this.layoutKey=null;this.visibleEggIds=[];this.disposed=false;
  this.update(world);
 }
 update(world,_time,_reducedMotion=false,_camera,_quality={}){
  if(this.disposed)return;
  const eggs=getPenguinEggs(world);
  if(eggs.length>EGG_CAPACITY)throw new RangeError(`Penguin egg batch supports at most ${EGG_CAPACITY} eggs.`);
  const visible=eggs.filter(egg=>!world.takenPenguinEggs?.[egg.id]&&(!_camera||Math.hypot(egg.x/25-_camera.x,egg.z/25-_camera.y,egg.y/25-_camera.z)<=capRenderDistance(_quality,_quality?.mobile?45:70)));
  // Late incubation rocks the shell using brood time, so pausing freezes it.
  const rocking=egg=>Math.max(0,(world.penguinBrood?.incubation?.[egg.id]??0)-(PENGUIN_EGG_HATCH_SECONDS-6));
  const key=`${world.ship?.yaw??0}|`+visible.map(egg=>`${egg.id}:${egg.x}:${egg.y}:${egg.z}:${rocking(egg)}`).join('|');
  if(key===this.layoutKey)return;
  for(const egg of visible)if(![egg.x,egg.y,egg.z].every(Number.isFinite))throw new TypeError(`Penguin egg ${egg.id} needs a finite position.`);
  this.layoutKey=key;this.visibleEggIds=visible.map(egg=>egg.id);
  for(const [index,egg]of visible.entries()){
   this.pose.position.set(egg.x/25,egg.z/25,egg.y/25);
   const side=eggs.indexOf(egg)%2?1:-1;
   const hatch=rocking(egg),wobble=Math.sin(hatch*13)*Math.min(1,hatch/3)*.09;
   this.pose.rotation.set(side*.06+wobble,(world.ship?.yaw??0)+side*.3,side*.1+wobble*.6);this.pose.updateMatrix();this.mesh.setMatrixAt(index,this.pose.matrix);
  }
  this.mesh.count=visible.length;this.mesh.instanceMatrix.needsUpdate=true;
  if(visible.length)this.mesh.computeBoundingSphere();this.group.visible=visible.length>0;
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;
  this.mesh.dispose();this.geometry.dispose();this.material.dispose();this.map.dispose();this.group.removeFromParent();this.group.clear();
 }
}
