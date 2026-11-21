import * as THREE from './vendor/three.module.js';
import {capRenderDistance} from './render-distance.js';
import {MAX_WILDLIFE_YOUNG} from './wildlife-lifecycle-data.js';
import {isopodLocalToWorld,getIsopodOrientation} from './isopod-frame.js';

const COLORS={crab:0xe8b36e,isopod:0xe3bd73,'sand-worm':0xe6d1a3,'sulfur-lizard':0xd3b989,'red-fish':0xd7747f};
const SIZES={crab:.12,isopod:.10,'sand-worm':1.15,'sulfur-lizard':.06,'red-fish':.035};

/** Bounded eggs, low nest rims and maternal pouches share three simple batches.
 * Simulation owns incubation and visibility; rendering never advances a clock. */
export class WildlifeBroodRenderer{
 constructor(){
  this.group=new THREE.Group();this.group.name='wildlife-eggs-and-broods';this.disposed=false;
  this.geometries={egg:new THREE.SphereGeometry(1,12,8),rim:new THREE.TorusGeometry(1,.085,5,16),pouch:new THREE.SphereGeometry(1,12,6)};
  this.materials={egg:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.45}),rim:new THREE.MeshStandardMaterial({color:0x685d52,roughness:.96}),pouch:new THREE.MeshStandardMaterial({color:0xb17b61,roughness:.65})};
  this.meshes={};
  for(const kind of Object.keys(this.geometries)){
   const mesh=new THREE.InstancedMesh(this.geometries[kind],this.materials[kind],MAX_WILDLIFE_YOUNG);
   mesh.name=`wildlife-brood-${kind}`;mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.meshes[kind]=mesh;this.group.add(mesh);
  }
  this.pose=new THREE.Object3D();this.color=new THREE.Color();this.point={x:0,y:0,z:0};this.orientation=[0,0,0,1];
 }
 update(world,_time,_reducedMotion=false,camera,quality={}){
  if(this.disposed)return;let eggs=0,rims=0,pouches=0;
  const range=capRenderDistance(quality,quality.mobile?45:70);
  for(const brood of world.wildlifeBroods??[]){
   if(eggs>=MAX_WILDLIFE_YOUNG||!Object.hasOwn(SIZES,brood.species)||![brood.x,brood.y,brood.z].every(Number.isFinite))continue;
   // Hogwongs bear live young. Isopods brood inside a small ventral pouch.
   const maternal=brood.species==='isopod';
   if(!maternal&&brood.stage!=='incubating')continue;
   let size=SIZES[brood.species],x=brood.x,y=brood.y,z=brood.z;
   const mother=maternal?(world.isopods??[]).find(animal=>animal.id===brood.parentIds?.[0]):null;
   if(maternal){
    if(!mother||mother.lifecycleInactive||mother.squidHeldBy||mother.squidRespawnIn>0)continue;
    const point=isopodLocalToWorld(mother,0,.14,.02,this.point);({x,y,z}=point);size*=mother.size;
   }
   if(camera&&Math.hypot(x/25-camera.x,z/25-camera.y,y/25-camera.z)>range)continue;
   this.pose.position.set(x/25,z/25+(maternal?0:size*.72),y/25);this.pose.rotation.set(0,0,0);
   if(maternal)this.pose.quaternion.fromArray(getIsopodOrientation(mother,this.orientation));
   this.pose.scale.set(size*.72,size,size*.72);this.pose.updateMatrix();this.meshes.egg.setMatrixAt(eggs,this.pose.matrix);
   this.meshes.egg.setColorAt(eggs++,this.color.setHex(COLORS[brood.species]));
   if(maternal){
    this.pose.position.y-=size*.35;this.pose.scale.set(size*1.55,size*.45,size*1.75);this.pose.updateMatrix();this.meshes.pouch.setMatrixAt(pouches++,this.pose.matrix);
   }else{
    this.pose.position.y=brood.z/25+size*.1;this.pose.rotation.set(Math.PI/2,0,0);this.pose.scale.setScalar(size*1.5);this.pose.updateMatrix();this.meshes.rim.setMatrixAt(rims++,this.pose.matrix);
   }
  }
  for(const[kind,count]of Object.entries({egg:eggs,rim:rims,pouch:pouches})){
   const mesh=this.meshes[kind];mesh.count=count;
   if(count){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();}
  }
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;
  for(const mesh of Object.values(this.meshes))mesh.dispose();
  for(const geometry of Object.values(this.geometries))geometry.dispose();
  for(const material of Object.values(this.materials))material.dispose();this.group.removeFromParent();this.group.clear();
 }
}
