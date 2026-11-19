import * as THREE from './vendor/three.module.js';
import {boxViewDepth,fogVisibilityDepth} from './render-visibility.js';

const CELL_SIZE=32;

function prepare(mesh){
 const geometry=mesh?.geometry,p=geometry?.attributes?.position;
 if(!mesh?.isMesh||mesh.isInstancedMesh||mesh.isSkinnedMesh||!geometry?.isBufferGeometry
  ||p?.itemSize!==3||p.isInterleavedBufferAttribute||p.usage!==THREE.StaticDrawUsage||geometry.morphAttributes.position?.length)
  throw new TypeError('Render-distance terrain requires a static, non-instanced mesh with ordinary position attributes.');
 const sourceIndex=geometry.index,sourceCount=sourceIndex?.count??p.count;
 const originalGroups=geometry.groups.map(group=>({...group})),originalRange={...geometry.drawRange};
 const rangeStart=originalRange.start,rangeCount=originalRange.count;
 if(!Number.isInteger(rangeStart)||rangeStart<0||rangeStart%3
  ||(rangeCount!==Infinity&&(!Number.isInteger(rangeCount)||rangeCount<0||rangeCount%3))||sourceCount%3)
  throw new RangeError('Static terrain draw ranges must contain complete triangles.');
 // Three.js uses material groups only for material arrays. A single material
 // draws the whole range; an array without groups draws nothing.
 const rangeEnd=Math.min(sourceCount,rangeStart+rangeCount),groups=Array.isArray(mesh.material)?originalGroups:[{start:0,count:sourceCount,materialIndex:0}];
 for(const group of groups)if(!Number.isInteger(group.start)||!Number.isInteger(group.count)||group.start<0||group.count<0
  ||group.start%3||group.count%3||group.start+group.count>sourceCount||!Number.isInteger(group.materialIndex)||group.materialIndex<0)
  throw new RangeError('Static terrain material groups must contain in-range complete triangles.');
 mesh.updateWorldMatrix(true,false);
 const cells=new Map(),materials=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 const sourceAt=i=>sourceIndex?sourceIndex.getX(i):i;let selectedCount=0;
 for(const group of groups){
  if(!materials.includes(group.materialIndex))materials.push(group.materialIndex);
  for(let i=Math.max(group.start,rangeStart);i<Math.min(group.start+group.count,rangeEnd);i+=3){
   const indices=[sourceAt(i),sourceAt(i+1),sourceAt(i+2)];
   if(indices.some(index=>!Number.isInteger(index)||index<0||index>=p.count))throw new RangeError('Static terrain contains an invalid vertex index.');
   a.fromBufferAttribute(p,indices[0]).applyMatrix4(mesh.matrixWorld);
   b.fromBufferAttribute(p,indices[1]).applyMatrix4(mesh.matrixWorld);
   c.fromBufferAttribute(p,indices[2]).applyMatrix4(mesh.matrixWorld);
   if(![a,b,c].every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y)&&Number.isFinite(point.z)))throw new TypeError('Static terrain needs finite world-space vertices.');
   const id=`${Math.floor((a.x+b.x+c.x)/(3*CELL_SIZE))}:${Math.floor((a.z+b.z+c.z)/(3*CELL_SIZE))}`;
   let chunk=cells.get(id);if(!chunk){chunk={bounds:new THREE.Box3(),indices:new Map(),visible:undefined};cells.set(id,chunk);}
   chunk.bounds.expandByPoint(a).expandByPoint(b).expandByPoint(c);
   if(!chunk.indices.has(group.materialIndex))chunk.indices.set(group.materialIndex,[]);
   chunk.indices.get(group.materialIndex).push(...indices);selectedCount+=3;
  }
 }
 for(const chunk of cells.values())for(const [material,indices]of chunk.indices)chunk.indices.set(material,new Uint32Array(indices));
 const index=new THREE.BufferAttribute(new Uint32Array(Math.max(sourceCount,selectedCount)),1).setUsage(THREE.DynamicDrawUsage);
 for(let i=0;i<sourceCount;i++)index.array[i]=sourceAt(i);
 return{mesh,geometry,sourceIndex,sourceCount,originalGroups,originalRange,materials,index,chunks:[...cells.values()],initialized:false};
}

/** Cull explicit static terrain without duplicating vertices or adding draws.
 * Source triangles are assigned to 32-metre world cells; their complete bounds
 * make distance, fog and frustum tests conservative even at a cell boundary.
 * Register each geometry once, before its first render, and leave moving or
 * dynamically repacked meshes with their own renderer's visibility handling.
 */
export class StaticRenderDistance{
 /** @param {import('./vendor/three.module.js').Mesh[]} [meshes] */
 constructor(meshes=[]){
  if(!Array.isArray(meshes))throw new TypeError('Static render distance requires a mesh array.');
  const seen=new Set();
  for(const mesh of meshes){if(seen.has(mesh?.geometry))throw new TypeError('Registered static meshes must not share geometry.');seen.add(mesh?.geometry);}
  // Validate every source before mutating any registered geometry.
  this.entries=meshes.map(prepare);this.disposed=false;
  this.matrix=new THREE.Matrix4();this.frustum=new THREE.Frustum();this.position=new THREE.Vector3();this.direction=new THREE.Vector3();
  for(const entry of this.entries)entry.geometry.setIndex(entry.index);
 }

 /** @param {import('./vendor/three.module.js').Camera} camera @param {number} [maxDistance] @param {number} [fogDensity] */
 update(camera,maxDistance=Infinity,fogDensity=0){
  if(this.disposed)return false;
  if(!camera?.isCamera)throw new TypeError('Static render distance requires a camera.');
  if(typeof maxDistance!=='number'||Number.isNaN(maxDistance)||maxDistance<0)throw new RangeError('Render distance must be nonnegative.');
  camera.updateMatrixWorld();this.matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
  this.frustum.setFromProjectionMatrix(this.matrix);camera.getWorldPosition(this.position);camera.getWorldDirection(this.direction);
  const fogDepth=fogVisibilityDepth(fogDensity);let uploaded=false;
  for(const entry of this.entries){
   let changed=!entry.initialized;
   for(const chunk of entry.chunks){
    const visible=chunk.bounds.distanceToPoint(this.position)<=maxDistance
     &&boxViewDepth(chunk.bounds,this.position,this.direction)<fogDepth&&this.frustum.intersectsBox(chunk.bounds);
    if(visible!==chunk.visible)changed=true;chunk.visible=visible;
   }
   if(!changed)continue;
   const {geometry,index}=entry;let count=0;geometry.clearGroups();
   for(const material of entry.materials){
    const start=count;
    for(const chunk of entry.chunks){if(!chunk.visible)continue;const indices=chunk.indices.get(material);if(!indices)continue;
     if(!entry.hiddenVertices){index.array.set(indices,count);count+=indices.length;continue;}
     for(let i=0;i<indices.length;i+=3){if(entry.hiddenVertices[indices[i]]||entry.hiddenVertices[indices[i+1]]||entry.hiddenVertices[indices[i+2]])continue;
      index.array[count++]=indices[i];index.array[count++]=indices[i+1];index.array[count++]=indices[i+2];}
    }
    if(count>start)geometry.addGroup(start,count-start,material);
   }
   geometry.setDrawRange(0,count);index.clearUpdateRanges();
   if(count){index.addUpdateRange(0,count);index.needsUpdate=true;}
   entry.initialized=true;uploaded=true;
  }
  return uploaded;
 }

 /** Force the next visibility selection to be uploaded without changing data. */
 invalidate(){if(!this.disposed)for(const entry of this.entries)entry.initialized=false;}
 /** Removed boulder caps stop drawing without rebuilding borrowed terrain. */
 setHiddenVertexRanges(mesh,ranges=[]){
  const entry=this.entries.find(entry=>entry.mesh===mesh);if(!entry||this.disposed)return;
  entry.hiddenVertices=ranges.length?new Uint8Array(entry.geometry.attributes.position.count):null;
  for(const {start,count}of ranges)entry.hiddenVertices.fill(1,start,start+count);
  entry.initialized=false;
 }

 /** Restore full source selection in the same index pool. The active buffer
  * remains attached for Scene's normal geometry disposal; borrowed vertex
  * attributes, materials and textures are never disposed by this helper. */
 dispose(){
  if(this.disposed)return;this.disposed=true;
  for(const entry of this.entries){
   const {geometry,index,sourceIndex,sourceCount,originalRange,originalGroups}=entry;
   for(let i=0;i<sourceCount;i++)index.array[i]=sourceIndex?sourceIndex.getX(i):i;
   index.clearUpdateRanges();if(sourceCount){index.addUpdateRange(0,sourceCount);index.needsUpdate=true;}
   geometry.clearGroups();for(const group of originalGroups)geometry.addGroup(group.start,group.count,group.materialIndex);
   geometry.setDrawRange(originalRange.start,originalRange.count);
  }
  this.entries.length=0;
 }
}
