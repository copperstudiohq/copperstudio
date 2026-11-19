import * as THREE from './vendor/three.module.js';

/** Bake rigid details into a few material batches. Independently hidden cut
 * caps stay separate; animation continues to move complete limb groups. */
export function batchSuitParts(group,keep=new Set()){
 const batches=new Map();
 for(const mesh of [...group.children]){
  if(!mesh.isMesh||keep.has(mesh))continue;
  mesh.updateMatrix();const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();geometry.applyMatrix4(mesh.matrix);
  let data=batches.get(mesh.material);if(!data){data={position:[],normal:[],uv:[]};batches.set(mesh.material,data);}
  for(const name of Object.keys(data))data[name].push(...geometry.attributes[name].array);
  geometry.dispose();mesh.geometry.dispose();group.remove(mesh);
 }
 for(const [material,data] of batches){
  const geometry=new THREE.BufferGeometry();
  for(const [name,values] of Object.entries(data))geometry.setAttribute(name,new THREE.Float32BufferAttribute(values,name==='uv'?2:3));
  geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,material);mesh.name='suit-'+material.name+'-batch';mesh.renderOrder=20;mesh.frustumCulled=false;group.add(mesh);
 }
}
