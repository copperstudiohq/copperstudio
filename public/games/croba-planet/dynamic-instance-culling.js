import * as THREE from './vendor/three.module.js';
import {fogVisibilityDepth} from './render-visibility.js';
import {uploadAttributePrefix} from './dynamic-attribute-upload.js';

/** Cull freshly posed rigid instance parts, without changing the actor or its
 * animation. Call restore() before the owner writes the next complete pose.
 * Bounds must contain all shader displacement; explicitly uncullable meshes
 * keep their owner's visibility. Geometry/materials remain borrowed.
 */
export class DynamicInstanceCulling {
 constructor(meshes=[]){
  this.entries=[...new Set(meshes)].map(mesh=>{
   if(!mesh?.isInstancedMesh)throw new TypeError('Dynamic view culling requires InstancedMeshes.');
   const extras=Object.values(mesh.geometry.attributes).filter(attribute=>attribute.isInstancedBufferAttribute);
   if(extras.some(attribute=>attribute.meshPerAttribute!==1))throw new TypeError('Dynamic view attributes need one item per instance.');
   return{mesh,extras,hidden:false,inputCount:-1,inputMatrices:new Float32Array(mesh.instanceMatrix.array.length),
    selected:new Uint32Array(mesh.instanceMatrix.count),kept:0,world:new THREE.Matrix4(),tightBounds:new THREE.Sphere(),geometryVersion:-1,viewRevision:-1};
  });
  this.matrix=new THREE.Matrix4();this.projection=new THREE.Matrix4();this.frustum=new THREE.Frustum();
  this.localSphere=new THREE.Sphere();this.worldSphere=new THREE.Sphere();
  this.localBox=new THREE.Box3();this.bounds=new THREE.Box3();this.position=new THREE.Vector3();this.direction=new THREE.Vector3();
  this.previousProjection=new THREE.Matrix4();this.previousDepth=NaN;this.viewRevision=0;
  this.disposed=false;
 }

 restore(){
  if(this.disposed)return;
  for(const entry of this.entries){
   const {mesh,extras}=entry;
   if(entry.hidden){mesh.visible=true;entry.hidden=false;}
   // The owner is about to write a complete new pose. A previous compact
   // prefix may still be pending on an offscreen GPU buffer; it must not
   // restrict a restored larger pose when optional view culling is removed.
   mesh.instanceMatrix.clearUpdateRanges();mesh.instanceColor?.clearUpdateRanges();
   for(const attribute of extras)attribute.clearUpdateRanges();
  }
 }

 update(camera,fogDensity=0){
  if(this.disposed||!camera)return;
  if(!camera.isCamera)throw new TypeError('Dynamic view culling needs a camera.');
  camera.updateWorldMatrix(true,false);this.projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
  const depth=fogVisibilityDepth(fogDensity);
  const sameView=this.previousDepth===depth&&this.previousProjection.equals(this.projection);
  this.previousDepth=depth;this.previousProjection.copy(this.projection);
  if(!sameView){this.frustum.setFromProjectionMatrix(this.projection);this.viewRevision++;}
  camera.getWorldPosition(this.position);camera.getWorldDirection(this.direction);
  for(const entry of this.entries){
   const {mesh,extras}=entry;
   if(!mesh.visible||!mesh.frustumCulled||!mesh.count)continue;
   const geometry=mesh.geometry;
   if(!geometry.boundingSphere)geometry.computeBoundingSphere();
   mesh.updateWorldMatrix(true,false);
   const matrices=mesh.instanceMatrix.array,inputLength=mesh.count*16;
   let samePose=entry.viewRevision===this.viewRevision&&entry.inputCount===mesh.count&&entry.world.equals(mesh.matrixWorld)
    &&entry.geometryVersion===geometry.attributes.position.version;
   if(samePose)for(let i=0;i<inputLength;i++)if(matrices[i]!==entry.inputMatrices[i]){samePose=false;break;}
   if(!samePose){
    entry.inputCount=mesh.count;entry.world.copy(mesh.matrixWorld);entry.geometryVersion=geometry.attributes.position.version;entry.viewRevision=this.viewRevision;
    for(let i=0;i<inputLength;i++)entry.inputMatrices[i]=matrices[i];
    this.bounds.makeEmpty();let kept=0;
    for(let index=0;index<mesh.count;index++){
     this.matrix.fromArray(matrices,index*16);
     this.localSphere.copy(geometry.boundingSphere).applyMatrix4(this.matrix);
     this.worldSphere.copy(this.localSphere).applyMatrix4(mesh.matrixWorld);
     // Padding covers rounding at the clip plane; no visible geometry is cut.
     this.worldSphere.radius+=.1;
     const forward=(this.worldSphere.center.x-this.position.x)*this.direction.x
      +(this.worldSphere.center.y-this.position.y)*this.direction.y+(this.worldSphere.center.z-this.position.z)*this.direction.z;
     if(forward-this.worldSphere.radius>=depth||!this.frustum.intersectsSphere(this.worldSphere))continue;
     entry.selected[kept++]=index;
     this.localSphere.getBoundingBox(this.localBox);this.bounds.union(this.localBox);
    }
    entry.kept=kept;if(kept)this.bounds.getBoundingSphere(entry.tightBounds);
   }
   const kept=entry.kept;
   // A stationary view/pose reuses its exact visibility. Colors, growth and
   // wetness still repack from the owner's freshly written complete pose.
   for(let slot=0;slot<kept;slot++){
    const index=entry.selected[slot];if(slot===index)continue;
    matrices.copyWithin(slot*16,index*16,index*16+16);
    if(mesh.instanceColor)mesh.instanceColor.array.copyWithin(slot*3,index*3,index*3+3);
    for(const attribute of extras){const size=attribute.itemSize;attribute.array.copyWithin(slot*size,index*size,index*size+size);}
   }
   mesh.count=kept;
   if(!kept){mesh.visible=false;entry.hidden=true;continue;}
   (mesh.boundingSphere??=new THREE.Sphere()).copy(entry.tightBounds);
   uploadAttributePrefix(mesh.instanceMatrix,kept);
   if(mesh.instanceColor)uploadAttributePrefix(mesh.instanceColor,kept);
   for(const attribute of extras)uploadAttributePrefix(attribute,kept);
  }
 }

 dispose(){if(this.disposed)return;this.restore();this.disposed=true;this.entries.length=0;}
}
