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
