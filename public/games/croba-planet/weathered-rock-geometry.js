import * as THREE from './vendor/three.module.js';
import { WEATHERED_ROCK_PROFILES, WEATHERED_ROCK_SHA256 } from './weathered-rock-data.js';

/** Exact irregular convex facets shared by rendering and physical surfaces.
 * Profiles stay inside a unit horizontal circle and use Y 0..1, or -1..1 for
 * the existing seabed/forest centred poses. No runtime random shape generation.
 * @param {number} [style]
 * @param {{centered?:boolean}} [options]
 * @returns {THREE.BufferGeometry}
 */
export function createWeatheredRockGeometry(style=0,{centered=false}={}){
  if(!Number.isInteger(style)||style<0||style>=WEATHERED_ROCK_PROFILES.length)
    throw new RangeError('Weathered rock style must be 0, 1 or 2.');
  const profile=WEATHERED_ROCK_PROFILES[style],positions=[];
  for(const index of profile.indices){
    const first=index*3;positions.push(profile.vertices[first],centered?profile.vertices[first+1]*2-1:profile.vertices[first+1],profile.vertices[first+2]);
  }
  const geometry=new THREE.BufferGeometry();geometry.name=`weathered-convex-rock-${style}`;
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
  const p=geometry.attributes.position,n=geometry.attributes.normal,uv=[];
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=centered?(p.getY(i)+1)*.5:p.getY(i),z=p.getZ(i);
    const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
    uv.push(...(ny>=nx&&ny>=nz?[x*.5+.5,z*.5+.5]:nx>=nz?[z*.5+.5,y]:[x*.5+.5,y]));
  }
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.userData={preparedRockProfile:style,geometrySHA256:WEATHERED_ROCK_SHA256,convex:true};
  geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}

/** The forest renderer and climbing contacts use this exact centred prototype. */
export function createForestRockGeometry(){return createWeatheredRockGeometry(2,{centered:true});}

/** Soften only shallow worn transitions on a renderer-owned prototype. Exact
 * flat factories remain authoritative for collision, sand and attached roots.
 * Non-indexed corners retain separate normals at steep fracture creases.
 * @param {THREE.BufferGeometry} geometry
 * @returns {THREE.BufferGeometry}
 */
export function applyRockWearNormals(geometry){
  const position=geometry?.attributes?.position;
  if(!geometry?.isBufferGeometry||!position||position.itemSize!==3||position.count%3||geometry.index)
    throw new TypeError('Rock wear normals require an unindexed XYZ triangle geometry.');
  const cosine=Math.cos(40*Math.PI/180),welded=new Map(),corners=[],faces=[],edges=new Map();
  const point=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  const edgeKey=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
  for(let vertex=0;vertex<position.count;vertex++){
    point.fromBufferAttribute(position,vertex);
    if(![point.x,point.y,point.z].every(Number.isFinite))throw new TypeError('Rock wear positions must be finite.');
    const key=`${point.x}:${point.y}:${point.z}`;
    if(!welded.has(key))welded.set(key,welded.size);corners.push(welded.get(key));
  }
  for(let vertex=0;vertex<position.count;vertex+=3){
    a.fromBufferAttribute(position,vertex);b.fromBufferAttribute(position,vertex+1);c.fromBufferAttribute(position,vertex+2);
    const areaNormal=new THREE.Vector3().crossVectors(b.sub(a),c.sub(a)),length=areaNormal.length();
    if(length<1e-12)throw new RangeError('Rock wear normals require nondegenerate triangle faces.');
    const face={first:vertex,corners:corners.slice(vertex,vertex+3),areaNormal,normal:areaNormal.clone().multiplyScalar(1/length),adjacent:[]};
    const index=faces.length;faces.push(face);
    for(let side=0;side<3;side++){
      const key=edgeKey(face.corners[side],face.corners[(side+1)%3]);
      if(!edges.has(key))edges.set(key,[]);edges.get(key).push(index);
    }
  }
  for(const indices of edges.values())if(indices.length===2){
    const [a,b]=indices;
    if(faces[a].normal.dot(faces[b].normal)>=cosine){faces[a].adjacent.push(b);faces[b].adjacent.push(a);}
  }
  const values=new Float32Array(position.count*3),sum=new THREE.Vector3();
  for(let index=0;index<faces.length;index++){
    const face=faces[index];
    for(let corner=0;corner<3;corner++){
      const vertex=face.corners[corner],pending=[index],seen=new Set([index]);sum.set(0,0,0);
      while(pending.length){
        const current=faces[pending.pop()];sum.add(current.areaNormal);
        for(const next of current.adjacent){
          if(seen.has(next)||!faces[next].corners.includes(vertex)||face.normal.dot(faces[next].normal)<cosine)continue;
          seen.add(next);pending.push(next);
        }
      }
      sum.normalize();values.set(sum.toArray(),(face.first+corner)*3);
    }
  }
  const normal=new THREE.Float32BufferAttribute(values,3);
  if(geometry.attributes.normal)normal.setUsage(geometry.attributes.normal.usage);
  geometry.setAttribute('normal',normal);return geometry;
}
