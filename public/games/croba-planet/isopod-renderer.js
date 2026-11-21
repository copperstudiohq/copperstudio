import {capRenderDistance} from './render-distance.js';
import * as THREE from './vendor/three.module.js';
import {isopodAnatomy,getIsopodAppendagePaths,ISOPOD_APPENDAGE_RADII} from './isopod-anatomy.js';
import {createIsopodEyeGeometries,getIsopodEyePose,ISOPOD_EYE} from './isopod-eye.js';
import {applyCreatureSurface} from './creature-materials.js';
import {addIsopodSegmentPivots,applyIsopodBending,bendIsopodPoint,getIsopodBodyBend} from './isopod-bending.js';
import {getIsopodOrientation,getIsopodSpinePose,isopodSpineLocalToWorld} from './isopod-frame.js';
import {IsopodSpinePalette} from './isopod-spine-renderer.js';
import {getIsopodLegWorldPath} from './isopod-feet.js';
import {getWildlifeRenderPopulation} from './wildlife-lifecycle.js';

/** Merge the fixed eye socket into the existing gold edging draw. */
function mergeSocket(armor,socket,center){
 const data={position:[],normal:[],uv:[],color:[],isopodSegmentZ:[]};
 for(const [geometry,offset]of [[armor,[0,0,0]],[socket,center]]){
  const p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv,color=geometry.attributes.color;
  for(let vertex=0;vertex<(geometry.index?.count??p.count);vertex++){
   const i=geometry.index?geometry.index.getX(vertex):vertex;
   data.position.push(p.getX(i)+offset[0],p.getY(i)+offset[1],p.getZ(i)+offset[2]);
   data.normal.push(n?.getX(i)??0,n?.getY(i)??1,n?.getZ(i)??0);
   data.uv.push(uv?.getX(i)??0,uv?.getY(i)??0);
   data.color.push(color?.getX(i)??1,color?.getY(i)??1,color?.getZ(i)??1);
   data.isopodSegmentZ.push(geometry.attributes.isopodSegmentZ?.getX(i)??ISOPOD_EYE.center[2]);
  }
 }
 const merged=new THREE.BufferGeometry();
 for(const [name,size]of [['position',3],['normal',3],['uv',2],['color',3],['isopodSegmentZ',1]])merged.setAttribute(name,new THREE.Float32BufferAttribute(data[name],size));
 merged.userData={...armor.userData,eyeSocket:true};merged.computeBoundingSphere();return merged;
}

/** Nine shared batches render the whole population. Detailed shell sections are
 * baked once; legs, antennae, feeding palps and the single eye remain articulated.
 * Borrowed textures stay owned by FaunaRenderer's surface library. */
export class GoldRockBugRenderer{
 constructor(world,materials={},surfaceMaps={},quality={}){
  this.group=new THREE.Group();this.group.name='gold-rock-bugs';this.disposed=false;
  const anatomy=isopodAnatomy(quality),eye=createIsopodEyeGeometries();
  addIsopodSegmentPivots(anatomy.shell);addIsopodSegmentPivots(anatomy.gold);addIsopodSegmentPivots(anatomy.underside,true);
  const gold=mergeSocket(anatomy.gold,eye.socket,ISOPOD_EYE.center);anatomy.gold.dispose();eye.socket.dispose();
  this.geometry={shell:anatomy.shell,gold,underside:anatomy.underside,legs:anatomy.leg,antennae:anatomy.antenna,mouthPalps:anatomy.mouthPalp,iris:eye.iris,pupil:eye.pupil,glint:eye.glint};
  const borrow=(name,color,roughness)=>{
   const material=materials[name]?.clone()??new THREE.MeshStandardMaterial({color,roughness});
   material.vertexColors=true;material.side=THREE.DoubleSide;return material;
  };
  this.materials={shell:borrow('shell',0xbc2028,.48),gold:borrow('gold',0xffcd46,.28),underside:borrow('dark',0x284752,.62),
   iris:new THREE.MeshPhysicalMaterial({color:0xffc344,roughness:.2,metalness:.25,clearcoat:.85,clearcoatRoughness:.13,emissive:0x9d6c09,emissiveIntensity:.12}),
   pupil:new THREE.MeshPhysicalMaterial({color:0x050a0d,roughness:.16,clearcoat:1,clearcoatRoughness:.1}),
   glint:new THREE.MeshStandardMaterial({color:0xfff2c4,roughness:.15,emissive:0x493410,emissiveIntensity:.2})};
  if(surfaceMaps.iris)applyCreatureSurface(this.materials.iris,surfaceMaps.iris,.06);
  this.capacity=getWildlifeRenderPopulation(world,'isopod').length;this.meshes={};this.visiblePodIds=[];
  this.spines=new IsopodSpinePalette(this.capacity);
  this.bends=new THREE.InstancedBufferAttribute(new Float32Array(this.capacity),1).setUsage(THREE.DynamicDrawUsage);
  for(const name of ['shell','gold','underside']){
   this.geometry[name].setAttribute('isopodBend',this.bends);this.spines.attach(this.geometry[name]);applyIsopodBending(this.materials[name],this.spines);
   // GPU bending moves the tail sideways; keep frustum bounds conservative.
   this.geometry[name].computeBoundingSphere();this.geometry[name].boundingSphere.radius+=.95;
  }
  const multipliers={shell:1,gold:1,underside:1,legs:42,antennae:12,mouthPalps:10,iris:1,pupil:1,glint:1};
  this.multipliers=multipliers;
  for(const [name,geometry]of Object.entries(this.geometry)){
   const material=this.materials[name]??this.materials.underside;
   const mesh=new THREE.InstancedMesh(geometry,material,this.capacity*multipliers[name]);
   mesh.name=`gold-rock-bug-${name}`;mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
   this.group.add(mesh);this.meshes[name]=mesh;
  }
  this.paths=new Map();for(const pod of getWildlifeRenderPopulation(world,'isopod'))this.paths.set(pod.id,getIsopodAppendagePaths(0,pod.seed));
  this.base=new THREE.Object3D();this.local=new THREE.Object3D();this.matrix=new THREE.Matrix4();
  this.start=new THREE.Vector3();this.end=new THREE.Vector3();this.direction=new THREE.Vector3();this.up=new THREE.Vector3(0,1,0);
  this.bentStart=[0,0,0];this.bentEnd=[0,0,0];
  this.surfaceQuaternion=[0,0,0,1];
  this.surfaceStart={x:0,y:0,z:0};this.surfaceEnd={x:0,y:0,z:0};
  this.spinePose={position:{x:0,y:0,z:0},orientation:[0,0,0,1]};this.gazeQuaternion=new THREE.Quaternion();
  this.worldLegPath=Array.from({length:4},()=>[0,0,0]);
  this.eyePose=getIsopodEyePose({gazeYaw:0,gazePitch:0});this.update(world,0,true);
 }
 bone(mesh,index,a,b,radius,size,bend,pod,articulated,worldSpace=false){
  if(worldSpace){
   this.start.set(a[0]/25,a[2]/25,a[1]/25);this.end.set(b[0]/25,b[2]/25,b[1]/25);
  }else if(articulated){
   const start=isopodSpineLocalToWorld(pod,...a,this.surfaceStart,this.spinePose);
   const end=isopodSpineLocalToWorld(pod,...b,this.surfaceEnd,this.spinePose);
   this.start.set(start.x/25,start.z/25,start.y/25);this.end.set(end.x/25,end.z/25,end.y/25);
  }else{
   this.start.fromArray(bendIsopodPoint(a,bend,this.bentStart)).applyMatrix4(this.base.matrix);this.end.fromArray(bendIsopodPoint(b,bend,this.bentEnd)).applyMatrix4(this.base.matrix);
  }
  this.direction.subVectors(this.end,this.start);const length=this.direction.length();
  this.local.position.copy(this.start);this.local.quaternion.setFromUnitVectors(this.up,this.direction.multiplyScalar(1/(length||1)));
  this.local.scale.set(radius*size,length,radius*size);this.local.updateMatrix();mesh.setMatrixAt(index,this.local.matrix);
 }
 update(world,time,reducedMotion=false,camera,quality={}){
  if(this.disposed)return;let count=0;this.visiblePodIds.length=0;
  for(const pod of getWildlifeRenderPopulation(world,'isopod')){
   if(count>=this.capacity)break;
   if(pod.lifecycleInactive||pod.squidRespawnIn>0||camera&&Math.hypot(pod.x/25-camera.x,pod.z/25-camera.y,pod.y/25-camera.z)>capRenderDistance(quality,quality.mobile?65:80))continue;
   if(![pod.x,pod.y,pod.z,pod.heading,pod.size].every(Number.isFinite)||pod.size<=0)continue;
   this.base.position.set(pod.x/25,pod.z/25,pod.y/25);this.base.quaternion.fromArray(getIsopodOrientation(pod,this.surfaceQuaternion));this.base.scale.setScalar(pod.size);this.base.updateMatrix();
   for(const name of ['shell','gold','underside'])this.meshes[name].setMatrixAt(count,this.base.matrix);
   const bend=getIsopodBodyBend(pod,time,reducedMotion||pod.crawlBlocked);this.bends.setX(count,bend);
   const articulated=this.spines.write(count,pod,this.base);
   let paths=this.paths.get(pod.id);
   if(!pod.crawlBlocked||reducedMotion||pod.squidHeldBy)paths=getIsopodAppendagePaths(reducedMotion||pod.squidHeldBy?0:time,pod.seed,paths);
   if(!paths)paths=getIsopodAppendagePaths(0,pod.seed);this.paths.set(pod.id,paths);
   for(const [name,points,radii]of [['legs',paths.legs,ISOPOD_APPENDAGE_RADII.leg],['antennae',paths.antennae,ISOPOD_APPENDAGE_RADII.antenna],['mouthPalps',paths.mouthPalps,ISOPOD_APPENDAGE_RADII.mouthPalp]]){
    let instance=count*this.multipliers[name];
    for(const path of points){
     const footIK=name==='legs'&&articulated;
     const posed=footIK?getIsopodLegWorldPath(world,pod,path,this.worldLegPath):path;
     for(let segment=0;segment<posed.length-1;segment++)this.bone(this.meshes[name],instance++,posed[segment],posed[segment+1],radii[segment],pod.size,bend,pod,articulated,footIK);
    }
   }
   const eye=getIsopodEyePose(pod,this.eyePose);
   if(articulated){
    const origin=isopodSpineLocalToWorld(pod,...ISOPOD_EYE.center,this.surfaceStart,this.spinePose);
    this.local.position.set(origin.x/25,origin.z/25,origin.y/25);this.local.quaternion.fromArray(this.spinePose.orientation);this.local.scale.setScalar(pod.size);this.local.updateMatrix();
    this.meshes.iris.setMatrixAt(count,this.local.matrix);
    this.local.quaternion.multiply(this.gazeQuaternion.fromArray(eye.quaternion));this.local.updateMatrix();this.matrix.copy(this.local.matrix);
   }else{
    this.local.position.fromArray(ISOPOD_EYE.center);this.local.quaternion.identity();this.local.scale.setScalar(1);this.local.updateMatrix();
    this.matrix.multiplyMatrices(this.base.matrix,this.local.matrix);this.meshes.iris.setMatrixAt(count,this.matrix);
    this.local.quaternion.fromArray(eye.quaternion);this.local.updateMatrix();this.matrix.multiplyMatrices(this.base.matrix,this.local.matrix);
   }
   this.meshes.pupil.setMatrixAt(count,this.matrix);this.meshes.glint.setMatrixAt(count,this.matrix);
   this.visiblePodIds.push(pod.id);count++;
  }
  this.bends.needsUpdate=true;
  this.spines.commit();
  for(const [name,mesh]of Object.entries(this.meshes)){
   mesh.count=count*this.multipliers[name];mesh.instanceMatrix.needsUpdate=true;if(mesh.count)mesh.computeBoundingSphere();
  }
  this.group.visible=count>0;
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;
  this.spines.dispose();
  for(const mesh of Object.values(this.meshes))mesh.dispose();
  for(const geometry of Object.values(this.geometry))geometry.dispose();
  for(const material of Object.values(this.materials))material.dispose();
  this.paths.clear();this.group.removeFromParent();this.group.clear();
 }
}
