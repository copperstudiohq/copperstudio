import*as THREE from'./vendor/three.module.js';
import{YOYO_ROPE_LINKS,YOYO_GRIP}from'./yoyo-physics.js';
const SIDES=6;
/** A visible cotton cord, rather than a one-pixel line. One small dynamic mesh
 * follows the simulated chain; the caller owns its geometry and material. */
export function createYoyoStringGeometry(){
 const geometry=new THREE.BufferGeometry(),vertices=(YOYO_ROPE_LINKS+1)*SIDES,indices=[];
 geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(vertices*3),3));
 geometry.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(vertices*3),3));
 for(let i=0;i<YOYO_ROPE_LINKS;i++)for(let side=0;side<SIDES;side++){
  const a=i*SIDES+side,b=i*SIDES+(side+1)%SIDES,c=a+SIDES,d=b+SIDES;indices.push(a,b,c,b,d,c);
 }
 geometry.setIndex(indices);geometry.name='physical-cotton-yoyo-cord';
 geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);geometry.attributes.normal.setUsage(THREE.DynamicDrawUsage);return geometry;
}
const tangent=new THREE.Vector3(),across=new THREE.Vector3(),up=new THREE.Vector3(),normal=new THREE.Vector3();
export const YOYO_REST_NODES=Array.from({length:YOYO_ROPE_LINKS+1},(_,i)=>({x:YOYO_GRIP[0],y:YOYO_GRIP[1]-.07*i/YOYO_ROPE_LINKS,z:YOYO_GRIP[2]}));
export function updateYoyoStringGeometry(geometry,nodes=YOYO_REST_NODES){
 const positions=geometry.attributes.position,normals=geometry.attributes.normal;
 for(let i=0;i<nodes.length;i++){
  const from=nodes[Math.max(0,i-1)],to=nodes[Math.min(nodes.length-1,i+1)],p=nodes[i];
  tangent.set(to.x-from.x,to.y-from.y,to.z-from.z).normalize();
  if(tangent.lengthSq()<.001)tangent.set(0,-1,0);
  across.set(Math.abs(tangent.y)>.9?1:0,Math.abs(tangent.y)>.9?0:1,0).cross(tangent).normalize();up.crossVectors(tangent,across).normalize();
  for(let side=0;side<SIDES;side++){
   const angle=side/SIDES*Math.PI*2;normal.copy(across).multiplyScalar(Math.cos(angle)).addScaledVector(up,Math.sin(angle));
   positions.setXYZ(i*SIDES+side,p.x+normal.x*.0025,p.y+normal.y*.0025,p.z+normal.z*.0025);normals.setXYZ(i*SIDES+side,normal.x,normal.y,normal.z);
  }
 }
 positions.needsUpdate=true;normals.needsUpdate=true;geometry.computeBoundingSphere();
}
