import {capRenderDistance} from './render-distance.js';
import*as THREE from'./vendor/three.module.js';
import{createWoodlonAnatomy,WOODLON_EYE_LOCAL,WOODLON_PUPIL_LOCAL,WOODLON_MOUTH_LOCAL,WOODLON_ARM_ANCHORS,WOODLON_LEG_ANCHORS}from'./woodlon-anatomy.js';
const UP=new THREE.Vector3(0,1,0);
const INSTANCE_COUNTS=Object.freeze({arms:WOODLON_ARM_ANCHORS.length,legs:WOODLON_LEG_ANCHORS.length,nutrients:2});
const partInstances=kind=>INSTANCE_COUNTS[kind]??1;

/** Seven shared batches animate the same complete model on every device. */
export class WoodlonRenderer{
 constructor(world,materials={}){
  this.group=new THREE.Group();this.group.name='peaceful-basin-woodlons';this.geometry=createWoodlonAnatomy();this.disposed=false;
  const body=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.91,...(materials.bark?.map?{map:materials.bark.map}:{}),...(materials.bark?.normalMap?{normalMap:materials.bark.normalMap}:{})});
  body.normalScale.set(.12,.12);this.materials={body,nutrients:new THREE.MeshBasicMaterial({color:0xd5c68f,toneMapped:false}),eye:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.34}),pupil:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.38})};
  this.geometry.nutrients=new THREE.SphereGeometry(.018,6,4);
  this.meshes={};for(const[kind,geometry]of Object.entries(this.geometry)){
   const mesh=new THREE.InstancedMesh(geometry,this.materials[kind==='nutrients'?'nutrients':kind==='eye'?'eye':kind==='pupil'?'pupil':'body'],(world.woodlons?.length??0)*partInstances(kind));
   mesh.name=`woodlon-${kind}`;mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.group.add(mesh);this.meshes[kind]=mesh;
  }
  this.base=new THREE.Object3D();this.local=new THREE.Object3D();this.matrix=new THREE.Matrix4();this.point=new THREE.Vector3();this.target=new THREE.Vector3();this.direction=new THREE.Vector3();this.inverse=new THREE.Quaternion();
 }
 update(world,_time,reducedMotion=false,camera,quality={}){
  if(this.disposed)return;let count=0;
  for(const a of world.woodlons??[]){
   if(![a.x,a.y,a.z,a.heading,a.phase].every(Number.isFinite))throw new TypeError(`Invalid Woodlon pose: ${a.id}`);
   if(camera&&Math.hypot(a.x/25-camera.x,a.z/25-camera.y,a.y/25-camera.z)>capRenderDistance(quality,48))continue;
   const gait=reducedMotion||!a.speed?0:Math.sin(a.phase)*.28,bob=reducedMotion?0:Math.sin(a.phase*2)*(a.speed ? .012 : .004);
   this.base.position.set(a.x/25,a.z/25+bob,a.y/25);this.base.rotation.set(0,Math.PI/2-a.heading,0);this.base.updateMatrix();this.meshes.body.setMatrixAt(count,this.base.matrix);
   const place=(kind,anchor,index=count,angle=0,spread=0)=>{
    this.local.position.fromArray(anchor);this.local.rotation.set(angle,0,spread);this.local.scale.set(1,1,1);this.local.updateMatrix();this.matrix.multiplyMatrices(this.base.matrix,this.local.matrix);this.meshes[kind].setMatrixAt(index,this.matrix);
   };
   place('eye',WOODLON_EYE_LOCAL);place('pupil',WOODLON_PUPIL_LOCAL);
   if(a.eyeTarget){
    this.target.set(a.eyeTarget.x/25,a.eyeTarget.z/25,a.eyeTarget.y/25).sub(this.base.position);this.inverse.copy(this.base.quaternion).invert();this.target.applyQuaternion(this.inverse);
    const pupil=[WOODLON_PUPIL_LOCAL[0]+THREE.MathUtils.clamp(this.target.x*.02,-.025,.025),WOODLON_PUPIL_LOCAL[1]+THREE.MathUtils.clamp((this.target.y-.71)*.02,-.018,.018),WOODLON_PUPIL_LOCAL[2]];place('pupil',pupil);
   }
   for(let i=0;i<2;i++)place('legs',WOODLON_LEG_ANCHORS[i],count*2+i,gait*(i?1:-1));
   WOODLON_ARM_ANCHORS.forEach((anchor,i)=>{
    const side=Math.sign(anchor[0]),upper=i<2;
    place('arms',anchor,count*4+i,gait*(i%2?1:-1)*(upper?.6:-.45),side*(upper?.58:.23));
   });
   const blend=a.feedBlend??0;this.point.fromArray(WOODLON_MOUTH_LOCAL).applyMatrix4(this.base.matrix);
   if(blend>.005&&a.feedTarget){
    this.target.set(a.feedTarget.x/25,a.feedTarget.z/25,a.feedTarget.y/25);this.direction.subVectors(this.target,this.point);const length=this.direction.length();
    this.local.position.copy(this.point);this.local.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),this.direction.normalize());this.local.scale.set(1,1,length*blend);this.local.updateMatrix();this.meshes.proboscis.setMatrixAt(count,this.local.matrix);
   }else{this.local.position.copy(this.point);this.local.scale.set(0,0,0);this.local.updateMatrix();this.meshes.proboscis.setMatrixAt(count,this.local.matrix);}
   for(let i=0;i<2;i++){
    this.local.position.copy(this.point);this.local.rotation.set(0,0,0);
    if(blend>.005&&a.feedTarget){this.target.set(a.feedTarget.x/25,a.feedTarget.z/25,a.feedTarget.y/25);this.local.position.lerp(this.target,1-((a.phase*.7+i*.5)%1));this.local.scale.setScalar(blend);}
    else this.local.scale.setScalar(0);
    this.local.updateMatrix();this.meshes.nutrients.setMatrixAt(count*2+i,this.local.matrix);
   }
   count++;
  }
  for(const[kind,mesh]of Object.entries(this.meshes)){mesh.count=count*partInstances(kind);mesh.visible=mesh.count>0;mesh.instanceMatrix.needsUpdate=true;if(mesh.count)mesh.computeBoundingSphere();}
 }
 dispose(){if(this.disposed)return;this.disposed=true;Object.values(this.meshes).forEach(m=>m.dispose());Object.values(this.geometry).forEach(g=>g.dispose());Object.values(this.materials).forEach(m=>m.dispose());this.group.removeFromParent();this.group.clear();}
}
