import * as THREE from './vendor/three.module.js';

/** Compact explicitly static instance batches from immutable CPU snapshots.
 * Vertex buffers and materials remain borrowed. Original matrices, colors and
 * per-instance attributes are restored when disposed. */
export class InstanceRenderDistance{
 constructor(meshes=[]){
  this.batches=[];this.camera=new THREE.Vector3(Infinity,Infinity,Infinity);this.range=NaN;this.disposed=false;
  const matrix=new THREE.Matrix4(),sphere=new THREE.Sphere();
  for(const mesh of new Set(meshes)){
   if(!mesh?.isInstancedMesh)throw new TypeError('Instance distance culling needs static InstancedMeshes.');
   mesh.updateWorldMatrix(true,false);mesh.geometry.computeBoundingSphere();
   const count=mesh.count,matrices=mesh.instanceMatrix.array.slice(0,count*16),colors=mesh.instanceColor?.array.slice(0,count*3);
   const attributes=Object.values(mesh.geometry.attributes).filter(a=>a.isInstancedBufferAttribute);
   if(attributes.some(a=>a.meshPerAttribute!==1||a.count<count))throw new Error(`Unsupported per-instance attributes on ${mesh.name}.`);
   const extras=attributes.map(attribute=>({attribute,source:attribute.array.slice()})),bounds=[];
   for(let i=0;i<count;i++){
    matrix.fromArray(matrices,i*16).premultiply(mesh.matrixWorld);sphere.copy(mesh.geometry.boundingSphere).applyMatrix4(matrix);
    bounds.push({x:sphere.center.x,y:sphere.center.y,z:sphere.center.z,radius:sphere.radius});
   }
   this.batches.push({mesh,count,matrices,colors,extras,bounds,key:null});
  }
 }
 invalidate(){this.range=NaN;}
 setHiddenIds(ids){
  if(this.disposed)return;this.hiddenIds=ids;this.invalidate();
 }
 update(camera,range=Infinity){
  if(this.disposed||!camera)return;
  const distance=Number.isFinite(range)&&range>0?range:Infinity;
  if(distance===this.range&&camera.distanceToSquared(this.camera)<.16)return;
  this.range=distance;this.camera.copy(camera);
  for(const batch of this.batches){
   const {mesh,matrices,colors,extras}=batch;let count=0,key='';
   for(let i=0;i<batch.count;i++){
    if(this.hiddenIds?.has(mesh.userData.sourceIds?.[i]))continue;
    const b=batch.bounds[i];if(Math.hypot(camera.x-b.x,camera.y-b.y,camera.z-b.z)>distance+b.radius)continue;
    key+=`${i},`;
    mesh.instanceMatrix.array.set(matrices.subarray(i*16,i*16+16),count*16);
    if(colors)mesh.instanceColor.array.set(colors.subarray(i*3,i*3+3),count*3);
    for(const {attribute,source}of extras){const size=attribute.itemSize;attribute.array.set(source.subarray(i*size,i*size+size),count*size);}
    count++;
   }
   mesh.count=count;
   if(batch.key===key)continue;batch.key=key;
   mesh.instanceMatrix.needsUpdate=true;if(colors)mesh.instanceColor.needsUpdate=true;
   for(const {attribute}of extras)attribute.needsUpdate=true;
   // Retain conservative full-population bounds: no per-frame rebuild needed.
  }
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;
  for(const {mesh,count,matrices,colors,extras}of this.batches){
   mesh.count=count;mesh.instanceMatrix.array.set(matrices);mesh.instanceMatrix.needsUpdate=true;
   if(colors){mesh.instanceColor.array.set(colors);mesh.instanceColor.needsUpdate=true;}
   for(const {attribute,source}of extras){attribute.array.set(source);attribute.needsUpdate=true;}
  }
  this.batches.length=0;
 }
}
