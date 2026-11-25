import * as THREE from './vendor/three.module.js';
import {fogVisibilityDepth,sphereViewDepth} from './render-visibility.js';

/** Reuse one upload descriptor per buffer; Three clears its list after upload. */
function upload(attribute,range,start,count){
 if(!count)return;
 // A culled mesh may not have reached the GPU since its previous update.
 // Preserve every pending edit until Three consumes the upload list.
 let end=start+count;
 for(const pending of attribute.updateRanges){start=Math.min(start,pending.start);end=Math.max(end,pending.start+pending.count);}
 attribute.clearUpdateRanges();range.start=start;range.count=end-start;
 attribute.updateRanges.push(range);attribute.needsUpdate=true;
}

/** Compact explicitly static instance batches from immutable CPU snapshots.
 * Vertex buffers and materials remain borrowed. Original matrices, colors and
 * per-instance attributes are restored when disposed. */
export class InstanceRenderDistance{
 constructor(meshes=[]){
  this.batches=[];this.camera=new THREE.Vector3(Infinity,Infinity,Infinity);this.range=NaN;this.disposed=false;
  this.viewWorld=new THREE.Matrix4();this.projection=new THREE.Matrix4();this.viewEnabled=false;this.fogDepth=NaN;
  this.frustum=new THREE.Frustum();this.viewMatrix=new THREE.Matrix4();this.direction=new THREE.Vector3();
  this.worldSphere=new THREE.Sphere();this.localSphere=new THREE.Sphere();this.invalidated=true;
  const matrix=new THREE.Matrix4(),sphere=new THREE.Sphere();
  for(const mesh of new Set(meshes)){
   if(!mesh?.isInstancedMesh)throw new TypeError('Instance distance culling needs static InstancedMeshes.');
   mesh.updateWorldMatrix(true,false);mesh.geometry.computeBoundingSphere();
   const count=mesh.count,matrices=mesh.instanceMatrix.array.slice(0,count*16),colors=mesh.instanceColor?.array.slice(0,count*3);
   const attributes=Object.values(mesh.geometry.attributes).filter(a=>a.isInstancedBufferAttribute);
   if(attributes.some(a=>a.meshPerAttribute!==1||a.count<count))throw new Error(`Unsupported per-instance attributes on ${mesh.name}.`);
   const extras=attributes.map(attribute=>({attribute,source:attribute.array.slice(),range:{start:0,count:0}})),bounds=[];
   for(let i=0;i<count;i++){
    matrix.fromArray(matrices,i*16);sphere.copy(mesh.geometry.boundingSphere).applyMatrix4(matrix);
    const local={x:sphere.center.x,y:sphere.center.y,z:sphere.center.z,radius:sphere.radius};
    sphere.applyMatrix4(mesh.matrixWorld);
    bounds.push({x:sphere.center.x,y:sphere.center.y,z:sphere.center.z,radius:sphere.radius,local});
   }
   this.batches.push({mesh,count,matrices,colors,extras,bounds,selected:new Uint32Array(count),selectedCount:-1,
    matrixRange:{start:0,count:0},colorRange:{start:0,count:0},sphere:new THREE.Sphere(),originalSphere:mesh.boundingSphere});
  }
 }
 invalidate(){this.invalidated=true;}
 setHiddenIds(ids){
  if(this.disposed)return;this.hiddenIds=ids;this.invalidate();
 }
 /** Optional view/fog gates use complete transformed instance spheres. Without
  * a view camera this retains the original radial-only API.
  * @param {import('./vendor/three.module.js').Vector3} position
  * @param {number} [range]
  * @param {import('./vendor/three.module.js').Camera|null} [camera]
  * @param {number} [fogDensity]
  */
 update(position,range=Infinity,camera=null,fogDensity=0){
  if(this.disposed||!position)return false;
  if(!Number.isFinite(position.x)||!Number.isFinite(position.y)||!Number.isFinite(position.z))
   throw new TypeError('Instance distance culling needs a finite camera position.');
  if(camera&&!camera.isCamera)throw new TypeError('Instance view culling needs a camera.');
  const distance=Number.isFinite(range)&&range>0?range:Infinity;
  const viewEnabled=Boolean(camera),fogDepth=viewEnabled?fogVisibilityDepth(fogDensity):Infinity;
  if(camera)camera.updateMatrixWorld();
  const sameView=viewEnabled===this.viewEnabled&&(!camera||this.viewWorld.equals(camera.matrixWorld)&&this.projection.equals(camera.projectionMatrix));
  if(!this.invalidated&&distance===this.range&&position.equals(this.camera)&&sameView&&fogDepth===this.fogDepth)return false;
  this.invalidated=false;this.range=distance;this.camera.copy(position);this.viewEnabled=viewEnabled;this.fogDepth=fogDepth;
  if(camera){
   this.viewWorld.copy(camera.matrixWorld);this.projection.copy(camera.projectionMatrix);
   this.viewMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
   this.frustum.setFromProjectionMatrix(this.viewMatrix);camera.getWorldDirection(this.direction);
  }
  let changed=false;
  for(const batch of this.batches){
   const {mesh,matrices,colors,extras,selected}=batch;let count=0,firstChanged=Infinity;
   for(let i=0;i<batch.count;i++){
    if(this.hiddenIds?.has(mesh.userData.sourceIds?.[i]))continue;
    const b=batch.bounds[i],dx=position.x-b.x,dy=position.y-b.y,dz=position.z-b.z,limit=distance+b.radius;
    if(dx*dx+dy*dy+dz*dz>limit*limit)continue;
    // Explicitly uncullable batches may billboard or move in their shader.
    // Their original radial gate remains, without assuming rigid view bounds.
    if(camera&&mesh.frustumCulled){
     this.worldSphere.center.set(b.x,b.y,b.z);this.worldSphere.radius=b.radius;
     if(!this.frustum.intersectsSphere(this.worldSphere)
      ||sphereViewDepth(this.worldSphere.center,b.radius,position,this.direction)>fogDepth)continue;
    }
    if(count>=batch.selectedCount||selected[count]!==i)firstChanged=Math.min(firstChanged,count);
    selected[count]=i;
    count++;
   }
   if(count===batch.selectedCount&&firstChanged===Infinity)continue;
   changed=true;batch.selectedCount=count;
   mesh.count=count;
   for(let slot=firstChanged;slot<count;slot++){
    const sourceIndex=selected[slot];
    for(let component=0;component<16;component++)mesh.instanceMatrix.array[slot*16+component]=matrices[sourceIndex*16+component];
    if(colors)for(let component=0;component<3;component++)mesh.instanceColor.array[slot*3+component]=colors[sourceIndex*3+component];
    for(const {attribute,source}of extras){const size=attribute.itemSize;
     for(let component=0;component<size;component++)attribute.array[slot*size+component]=source[sourceIndex*size+component];}
   }
   if(firstChanged<count){
    upload(mesh.instanceMatrix,batch.matrixRange,firstChanged*16,(count-firstChanged)*16);
    if(colors)upload(mesh.instanceColor,batch.colorRange,firstChanged*3,(count-firstChanged)*3);
    for(const extra of extras)upload(extra.attribute,extra.range,firstChanged*extra.attribute.itemSize,(count-firstChanged)*extra.attribute.itemSize);
   }
   // Bounds are mesh-local, whereas visibility spheres above are world-space.
   // Rebuild only on a changed selection, never from the full world population.
   batch.sphere.makeEmpty();
   for(let slot=0;slot<count;slot++){
    const b=batch.bounds[selected[slot]].local;
    this.localSphere.center.set(b.x,b.y,b.z);this.localSphere.radius=b.radius;batch.sphere.union(this.localSphere);
   }
   if(mesh.frustumCulled)mesh.boundingSphere=batch.sphere;
  }
  return changed;
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;
  for(const batch of this.batches){const {mesh,count,matrices,colors,extras}=batch;
   mesh.count=count;mesh.boundingSphere=batch.originalSphere;mesh.instanceMatrix.array.set(matrices);upload(mesh.instanceMatrix,batch.matrixRange,0,matrices.length);
   if(colors){mesh.instanceColor.array.set(colors);upload(mesh.instanceColor,batch.colorRange,0,colors.length);}
   for(const extra of extras){extra.attribute.array.set(extra.source);upload(extra.attribute,extra.range,0,extra.source.length);}
  }
  this.batches.length=0;
 }
}
