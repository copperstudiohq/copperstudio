import * as THREE from './vendor/three.module.js';
import {CROBON_TAIL_SEGMENTS,penguinTailRestPoint,penguinTailScale} from './penguin-tail-physics.js';

export const PENGUIN_TAIL_COLORS=Object.freeze({gray:0x424a53,blue:0x398cbe});

/** One short cylinder is reused for all six articulated links. Radius taper is
 * per instance; each link contains one blue vertex-color band, with no map. */
export function penguinTailGeometry(mobile=false){
 const sides=mobile?8:12,rows=8,positions=[],colors=[],uv=[],indices=[],tint=new THREE.Color();
 for(let row=0;row<=rows;row++)for(let side=0;side<=sides;side++){
  const u=row/rows,angle=side/sides*Math.PI*2;
  positions.push(Math.cos(angle),u-.5,Math.sin(angle));uv.push(side/sides,u);
  tint.set(u>=.625&&u<.875?PENGUIN_TAIL_COLORS.blue:PENGUIN_TAIL_COLORS.gray);colors.push(tint.r,tint.g,tint.b);
 }
 for(let row=0;row<rows;row++)for(let side=0;side<sides;side++){
  const a=row*(sides+1)+side,b=a+sides+1;indices.push(a,b,a+1,a+1,b,b+1);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}

/** Simulation owns the chain. Rendering only copies its endpoints into one
 * bounded batch, and uses the same analytic rest pose before its first tick. */
export class PenguinTailRenderer{
 constructor(capacity,quality={}){
  this.geometry=penguinTailGeometry(quality.mobile);
  this.geometry.setAttribute('penguinTailTaper',new THREE.InstancedBufferAttribute(new Float32Array(capacity*CROBON_TAIL_SEGMENTS),1).setUsage(THREE.DynamicDrawUsage));
  this.material=new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,roughness:.79,clearcoat:.12,side:THREE.DoubleSide});
  this.material.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float penguinTailTaper;')
    .replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.xz*=mix(1.,penguinTailTaper,position.y+.5);');
  };
  this.material.customProgramCacheKey=()=> 'penguin-physics-tail-taper-v1';
  this.mesh=new THREE.InstancedMesh(this.geometry,this.material,capacity*CROBON_TAIL_SEGMENTS);this.mesh.name='alien-penguin-physics-tail';this.mesh.count=0;this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  this.tint=new THREE.Color();if(capacity){this.mesh.setColorAt(0,this.tint);this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);}
  this.a=new THREE.Vector3();this.b=new THREE.Vector3();this.direction=new THREE.Vector3();this.up=new THREE.Vector3(0,1,0);this.pose=new THREE.Object3D();this.rest={x:0,y:0,z:0};this.count=0;
 }
 begin(){this.count=0;}
 endpoint(bird,index,target,restOnly=false){
  const node=restOnly?null:bird.tailNodes?.[index];
  const point=node&&Number.isFinite(node.x)&&Number.isFinite(node.y)&&Number.isFinite(node.z)?node:penguinTailRestPoint(bird,index,this.rest);
  return target.set(point.x/25,point.z/25,point.y/25);
 }
 bird(bird,wet=0){
  const scale=penguinTailScale(bird),root=bird.tailNodes?.[0];penguinTailRestPoint(bird,0,this.rest);
  // Ownership freezes simulation nodes while a predator moves the body. Use
  // its current rest pose until physics resumes, also covering teleports.
  const restOnly=!!bird.squidHeldBy||bird.tailNodes?.length!==CROBON_TAIL_SEGMENTS+1||!root||!Number.isFinite(root.x)||!Number.isFinite(root.y)||!Number.isFinite(root.z)||Math.hypot(root.x-this.rest.x,root.y-this.rest.y,root.z-this.rest.z)>.18*25*scale;
  this.tint.setRGB(1-wet*.18,1-wet*.14,1-wet*.08);this.endpoint(bird,0,this.a,restOnly);
  for(let segment=0;segment<CROBON_TAIL_SEGMENTS;segment++){
   this.endpoint(bird,segment+1,this.b,restOnly);
   const length=this.direction.copy(this.b).sub(this.a).length(),radius=.115*(1-segment/CROBON_TAIL_SEGMENTS)**.72*scale,endRadius=.115*(1-(segment+1)/CROBON_TAIL_SEGMENTS)**.72*scale;
   this.pose.position.copy(this.a).add(this.b).multiplyScalar(.5);this.pose.quaternion.setFromUnitVectors(this.up,length>1e-8?this.direction.multiplyScalar(1/length):this.up);
   this.pose.scale.set(radius,Math.max(.0001,length),radius*.68);this.pose.updateMatrix();this.mesh.setMatrixAt(this.count,this.pose.matrix);this.mesh.setColorAt(this.count,this.tint);this.geometry.attributes.penguinTailTaper.setX(this.count,endRadius/radius);this.count++;
   this.a.copy(this.b);
  }
 }
 finish(){this.mesh.count=this.count;this.mesh.visible=this.count>0;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;this.geometry.attributes.penguinTailTaper.needsUpdate=true;if(this.count)this.mesh.computeBoundingSphere();}
 dispose(){this.mesh.dispose();this.geometry.dispose();this.material.dispose();this.mesh.removeFromParent();}
}
