import * as THREE from './vendor/three.module.js';

export const PENGUIN_JOINT_COLORS=Object.freeze({mantle:0x355566,flipper:0x527f91,leg:0x46616b,foot:0x486879,eye:0x496b7c});
export const PENGUIN_BABY_COAT=0xf6f9fb;

/** One reusable open bellows sleeve. Limb joints use two overlapping sections
 * so their middle bends while both ends remain attached to the live pose. */
function sleeveGeometry(mobile){
 const rows=mobile?8:12,sides=mobile?8:12,p=[],colors=[],uv=[],indices=[],tint=new THREE.Color();
 for(let row=0;row<=rows;row++)for(let side=0;side<=sides;side++){
  const t=row/rows,angle=side/sides*Math.PI*2,rib=.5+.5*Math.cos(t*Math.PI*8),radius=(.84+.16*Math.sin(t*Math.PI))*(1+rib*.08);
  p.push(Math.cos(angle)*radius,t-.5,Math.sin(angle)*radius);uv.push(side/sides,t);
  tint.setRGB(.9+rib*.1,.9+rib*.1,.9+rib*.1);colors.push(tint.r,tint.g,tint.b);
 }
 for(let row=0;row<rows;row++)for(let side=0;side<sides;side++){const a=row*(sides+1)+side,b=a+sides+1;indices.push(a,a+1,b,a+1,b+1,b);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

export class PenguinJoints{
 constructor(capacity,quality={}){
  this.geometry=sleeveGeometry(quality.mobile);
  this.material=new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,roughness:.6,clearcoat:.28,clearcoatRoughness:.25,side:THREE.DoubleSide});
  this.mesh=new THREE.InstancedMesh(this.geometry,this.material,capacity*16);this.mesh.name='penguin-flexible-rubber-joints';this.mesh.count=0;this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  this.tint=new THREE.Color();this.wetTint=new THREE.Color();this.babyCoat=new THREE.Color(PENGUIN_BABY_COAT);this.growth=1;
  if(capacity){this.mesh.setColorAt(0,this.tint);this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);}
  this.pose=new THREE.Object3D();this.direction=new THREE.Vector3();this.mid=new THREE.Vector3();this.up=new THREE.Vector3(0,1,0);this.count=0;
 }
 begin(){this.count=0;}
 setWetness(wet){this.wetTint.setRGB(1-wet*.18,1-wet*.14,1-wet*.08);}
 setGrowth(growth){this.growth=THREE.MathUtils.clamp(growth,0,1);}
 sleeve(a,b,radius,color=PENGUIN_JOINT_COLORS.eye){
  const length=this.direction.copy(b).sub(a).length();
  this.pose.position.copy(a).add(b).multiplyScalar(.5);this.pose.quaternion.setFromUnitVectors(this.up,length?this.direction.multiplyScalar(1/length):this.up);
  this.pose.scale.set(radius,Math.max(.001,length*1.07),radius);this.pose.updateMatrix();this.mesh.setMatrixAt(this.count,this.pose.matrix);
  this.tint.set(color);
  if(color===PENGUIN_JOINT_COLORS.mantle||color===PENGUIN_JOINT_COLORS.flipper||color===PENGUIN_JOINT_COLORS.leg)this.tint.lerp(this.babyCoat,1-this.growth);
  this.mesh.setColorAt(this.count++,this.tint.multiply(this.wetTint));
 }
 bend(a,b,radius,bend,rootColor=PENGUIN_JOINT_COLORS.mantle,limbColor=rootColor){
  this.mid.copy(a).add(b).multiplyScalar(.5).add(bend);
  this.sleeve(a,this.mid,radius,rootColor);this.sleeve(this.mid,b,radius*.85,limbColor);
 }
 finish(){this.mesh.count=this.count;this.mesh.visible=this.count>0;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;if(this.count)this.mesh.computeBoundingSphere();}
 dispose(){this.mesh.dispose();this.geometry.dispose();this.material.dispose();this.mesh.removeFromParent();}
}
