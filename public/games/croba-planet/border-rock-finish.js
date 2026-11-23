import * as THREE from './vendor/three.module.js';
import {applyRockWearNormals} from './weathered-rock-geometry.js';

/** Finish the renderer-owned orange coast after both entrance cuts. Clipping
 * can leave zero-area slivers; remove those before smoothing shallow worn
 * edges. Position, colour and texture data on every visible face stay exact.
 * @param {THREE.BufferGeometry} source
 * @returns {THREE.BufferGeometry}
 */
export function finishOrangeBorderGeometry(source){
  const p=source?.attributes?.position;
  if(!source?.isBufferGeometry||source.index||!p||p.itemSize!==3||p.count%3)
    throw new TypeError('Orange border finish needs unindexed XYZ triangles.');
  const valid=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  for(let i=0;i<p.count;i+=3){
    a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);
    if(![...a.toArray(),...b.toArray(),...c.toArray()].every(Number.isFinite))
      throw new TypeError('Orange border positions must be finite.');
    if(b.sub(a).cross(c.sub(a)).lengthSq()>=1e-24)valid.push(i);
  }
  let geometry=source;
  if(valid.length*3!==p.count){
    geometry=new THREE.BufferGeometry();
    for(const [name,attribute]of Object.entries(source.attributes)){
      const values=new attribute.array.constructor(valid.length*3*attribute.itemSize);
      let offset=0;
      for(const first of valid){
        const start=first*attribute.itemSize;
        values.set(attribute.array.subarray(start,start+3*attribute.itemSize),offset);
        offset+=3*attribute.itemSize;
      }
      geometry.setAttribute(name,new THREE.BufferAttribute(values,attribute.itemSize,attribute.normalized));
    }
    geometry.name=source.name;geometry.userData={...source.userData};
    geometry.computeBoundingBox();geometry.computeBoundingSphere();source.dispose();
  }
  return applyRockWearNormals(geometry);
}
