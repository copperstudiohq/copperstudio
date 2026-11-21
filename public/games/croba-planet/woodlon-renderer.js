import {capRenderDistance} from './render-distance.js';
import*as THREE from'./vendor/three.module.js';
import{createWoodlonAnatomy,WOODLON_EYE_LOCAL,WOODLON_PUPIL_LOCAL,WOODLON_MOUTH_LOCAL,WOODLON_ARM_ANCHORS,WOODLON_LEG_ANCHORS}from'./woodlon-anatomy.js';
import {getWildlifeRenderPopulation} from './wildlife-lifecycle.js';
import {attachWoodlonCoat,applyWoodlonCoat,createWoodlonFur,applyWoodlonFur} from './woodlon-fur.js';
const FORWARD=new THREE.Vector3(0,0,1),WHITE=new THREE.Color(0xffffff),GROWN_COAT=new THREE.Color(0x7a707e);
const INSTANCE_COUNTS=Object.freeze({arms:WOODLON_ARM_ANCHORS.length,legs:WOODLON_LEG_ANCHORS.length,nutrients:2});
const partInstances=kind=>INSTANCE_COUNTS[kind]??1;

/** Seven shared anatomical batches plus one bounded newborn down batch. */
export class WoodlonRenderer{
 constructor(world,materials={}){
  this.group=new THREE.Group();this.group.name='peaceful-basin-woodlons';this.geometry=createWoodlonAnatomy();this.disposed=false;
  const population=getWildlifeRenderPopulation(world,'woodlon'),capacity=Math.max(1,population.length),hasYoung=population.some(a=>a.lifecycleRenderOnly);
  const body=applyWoodlonCoat(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.91,...(materials.bark?.map?{map:materials.bark.map}:{}),...(materials.bark?.normalMap?{normalMap:materials.bark.normalMap}:{})}));
  body.normalScale.set(.12,.12);this.materials={body,nutrients:new THREE.MeshBasicMaterial({color:0xd5c68f,toneMapped:false}),eye:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.34}),pupil:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.38})};
  this.geometry.nutrients=new THREE.SphereGeometry(.018,6,4);
  if(hasYoung){
   this.geometry.fur=createWoodlonFur();this.geometry.fur.setAttribute('woodlonFluff',new THREE.InstancedBufferAttribute(new Float32Array(capacity),1).setUsage(THREE.DynamicDrawUsage));
   this.materials.fur=applyWoodlonFur(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.97,side:THREE.DoubleSide}));this.materials.fur.forceSinglePass=true;
  }
  this.meshes={};for(const[kind,geometry]of Object.entries(this.geometry)){
   if(!['nutrients','eye','pupil','fur'].includes(kind))attachWoodlonCoat(geometry,kind,capacity*partInstances(kind));
   const mesh=new THREE.InstancedMesh(geometry,this.materials[kind==='nutrients'?'nutrients':kind==='eye'?'eye':kind==='pupil'?'pupil':kind==='fur'?'fur':'body'],capacity*partInstances(kind));
   mesh.name=`woodlon-${kind}`;mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.group.add(mesh);this.meshes[kind]=mesh;
  }
  this.base=new THREE.Object3D();this.local=new THREE.Object3D();this.matrix=new THREE.Matrix4();this.point=new THREE.Vector3();this.target=new THREE.Vector3();this.direction=new THREE.Vector3();this.inverse=new THREE.Quaternion();
  this.coatColor=new THREE.Color();
 }
 update(world,_time,reducedMotion=false,camera,quality={}){
  if(this.disposed)return;let count=0,furCount=0;
  for(const a of getWildlifeRenderPopulation(world,'woodlon')){
   if(a.lifecycleInactive||a.squidHeldBy||a.squidRespawnIn>0)continue;
   if(![a.x,a.y,a.z,a.heading,a.phase].every(Number.isFinite))throw new TypeError(`Invalid Woodlon pose: ${a.id}`);
   if(camera&&Math.hypot(a.x/25-camera.x,a.z/25-camera.y,a.y/25-camera.z)>capRenderDistance(quality,48))continue;
   const gait=reducedMotion||!a.speed?0:Math.sin(a.phase)*.28,bob=reducedMotion?0:Math.sin(a.phase*2)*(a.speed ? .012 : .004);
   const scale=THREE.MathUtils.clamp(Number.isFinite(a.lifecycleScale)?a.lifecycleScale:1,.05,1),coat=THREE.MathUtils.clamp(a.lifecycleCoatWhite??0,0,1);
   this.base.position.set(a.x/25,a.z/25+bob*scale,a.y/25);this.base.rotation.set(0,Math.PI/2-a.heading,0);this.base.scale.setScalar(scale);this.base.updateMatrix();this.meshes.body.setMatrixAt(count,this.base.matrix);
   this.geometry.body.getAttribute('woodlonCoat').setX(count,coat);
   const place=(kind,anchor,index=count,angle=0,spread=0)=>{
    this.local.position.fromArray(anchor);this.local.rotation.set(angle,0,spread);this.local.scale.set(1,1,1);this.local.updateMatrix();this.matrix.multiplyMatrices(this.base.matrix,this.local.matrix);this.meshes[kind].setMatrixAt(index,this.matrix);
    this.geometry[kind].getAttribute('woodlonCoat')?.setX(index,coat);
   };
   place('eye',WOODLON_EYE_LOCAL);place('pupil',WOODLON_PUPIL_LOCAL);
   if(a.eyeTarget){
    this.target.set(a.eyeTarget.x/25,a.eyeTarget.z/25,a.eyeTarget.y/25).sub(this.base.position);this.inverse.copy(this.base.quaternion).invert();this.target.applyQuaternion(this.inverse).divideScalar(scale);
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
    this.local.position.copy(this.point);this.local.quaternion.setFromUnitVectors(FORWARD,this.direction.normalize());this.local.scale.set(scale,scale,length*blend);this.local.updateMatrix();this.meshes.proboscis.setMatrixAt(count,this.local.matrix);
   }else{this.local.position.copy(this.point);this.local.scale.set(0,0,0);this.local.updateMatrix();this.meshes.proboscis.setMatrixAt(count,this.local.matrix);}
   this.geometry.proboscis.getAttribute('woodlonCoat').setX(count,0);
   for(let i=0;i<2;i++){
    this.local.position.copy(this.point);this.local.rotation.set(0,0,0);
    if(blend>.005&&a.feedTarget){this.target.set(a.feedTarget.x/25,a.feedTarget.z/25,a.feedTarget.y/25);this.local.position.lerp(this.target,1-((a.phase*.7+i*.5)%1));this.local.scale.setScalar(blend*scale);}
    else this.local.scale.setScalar(0);
    this.local.updateMatrix();this.meshes.nutrients.setMatrixAt(count*2+i,this.local.matrix);
   }
   const fluff=THREE.MathUtils.clamp(a.lifecycleFluff??0,0,1);
   if(this.meshes.fur&&a.lifecycleRenderOnly&&fluff>.015){
    this.meshes.fur.setMatrixAt(furCount,this.base.matrix);this.meshes.fur.setColorAt(furCount,this.coatColor.copy(GROWN_COAT).lerp(WHITE,coat));
    this.geometry.fur.getAttribute('woodlonFluff').setX(furCount,fluff);furCount++;
   }
   count++;
  }
  for(const[kind,mesh]of Object.entries(this.meshes)){
   mesh.count=kind==='fur'?furCount:count*partInstances(kind);mesh.visible=mesh.count>0;mesh.instanceMatrix.needsUpdate=true;
   for(const key of['woodlonCoat','woodlonFluff']){const attribute=this.geometry[kind].getAttribute(key);if(attribute)attribute.needsUpdate=true;}
   if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;if(mesh.count)mesh.computeBoundingSphere();
  }
 }
 dispose(){if(this.disposed)return;this.disposed=true;Object.values(this.meshes).forEach(m=>m.dispose());Object.values(this.geometry).forEach(g=>g.dispose());Object.values(this.materials).forEach(m=>m.dispose());this.group.removeFromParent();this.group.clear();}
}
