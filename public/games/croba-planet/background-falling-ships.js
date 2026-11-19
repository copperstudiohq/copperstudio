import * as THREE from './vendor/three.module.js';
import {createFallingShipGeometry} from './falling-ship-anatomy.js';
import {BackgroundShipSmoke} from './background-ship-smoke.js';

const FLIGHT_SECONDS=22,SLOT_SECONDS=30,SMOKE_COUNT=24,EMISSION_SECONDS=.24;
const FRONT=new THREE.Vector3(0,0,-1);
const ROUTES=Object.freeze([
 {from:[260,145,-65],to:[285,-35,45]},
 {from:[195,155,-240],to:[260,-35,-180]},
 {from:[190,135,250],to:[260,-35,190]},
].map(route=>Object.freeze({from:Object.freeze(route.from),to:Object.freeze(route.to)})));
const TINTS=Object.freeze({orangeMetal:0x916a51,whiteMetal:0xa8bac2,darkMetal:0x263744,glass:0x214b60});

/** Purely decorative paths in the camera-relative sky, never map coordinates. */
function pathAt(route,age,out){
 const p=Math.max(0,Math.min(1,age/FLIGHT_SECONDS));
 return out.set(route.from[0]+(route.to[0]-route.from[0])*p,
  route.from[1]+(route.to[1]-route.from[1])*(.2*p+.8*p*p),
  route.from[2]+(route.to[2]-route.from[2])*p);
}

/** One distant courier at a time, four hull surfaces and two bounded effect
 * batches. No colliders, lights, terrain changes or gameplay state are added. */
export class BackgroundFallingShips{
 constructor(){
  this.group=new THREE.Group();this.group.name='background-falling-ships';
  this.group.userData.backgroundOnly=true;this.disposed=false;this.lastKey=null;
  this.geometry=createFallingShipGeometry();this.materials={};this.hull=new THREE.Group();
  this.hull.name='distant-burning-courier';this.group.add(this.hull);
  for(const [surface,geometry]of Object.entries(this.geometry)){
   const material=new THREE.MeshBasicMaterial({color:TINTS[surface],vertexColors:true,side:THREE.DoubleSide,
    fog:false,depthWrite:false});this.materials[surface]=material;
   const mesh=new THREE.Mesh(geometry,material);mesh.name=`background-courier-${surface}`;
   mesh.renderOrder=-850;this.hull.add(mesh);
  }
  this.smokeOwner=new BackgroundShipSmoke(SMOKE_COUNT);this.smoke=this.smokeOwner.mesh;
  this.smokeGeometry=this.smokeOwner.geometry;this.smokeMaterial=this.smokeOwner.material;this.smokeTexture=this.smokeOwner.texture;
  this.group.add(this.smoke);
  this.fireGeometry=new THREE.ConeGeometry(1,1,8,1,true);
  this.fireMaterial=new THREE.MeshBasicMaterial({color:0xffffff,fog:false,toneMapped:false,depthWrite:false});
  this.fire=new THREE.InstancedMesh(this.fireGeometry,this.fireMaterial,4);
  this.fire.name='distant-courier-fire';this.fire.renderOrder=-840;
  this.fire.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.group.add(this.fire);
  for(let i=0;i<4;i++)this.fire.setColorAt(i,new THREE.Color(i<2?0xf4893d:0xffe1a2));
  this.enginePose=new THREE.Object3D();
  this.velocity=new THREE.Vector3();this.point=new THREE.Vector3();this.exhaust=new THREE.Vector3();
  this.roll=new THREE.Quaternion();this.matrix=new THREE.Matrix4();
  this.update(new THREE.Color(0x8daab9));
 }

 update(horizon,time=0,reducedMotion=false){
  if(this.disposed)return;
  const clock=reducedMotion?10:Math.max(0,Number.isFinite(time)?time:0)+3;
  const key=`${clock}:${horizon.getHex()}`;if(key===this.lastKey)return;this.lastKey=key;
  const slot=Math.floor(clock/SLOT_SECONDS),age=clock%SLOT_SECONDS;
  this.group.visible=age<FLIGHT_SECONDS;if(!this.group.visible)return;
  const route=ROUTES[slot%ROUTES.length],p=age/FLIGHT_SECONDS;
  this.group.userData.route=slot%ROUTES.length;this.group.userData.flightProgress=p;
  pathAt(route,age,this.hull.position);
  this.velocity.set(route.to[0]-route.from[0],(route.to[1]-route.from[1])*(.2+1.6*p),route.to[2]-route.from[2]).normalize();
  this.hull.quaternion.setFromUnitVectors(FRONT,this.velocity)
   .multiply(this.roll.setFromAxisAngle(FRONT,Math.sin(age*1.3)*.09));
  this.hull.updateMatrix();
  for(const[surface,material]of Object.entries(this.materials))
   material.color.setHex(TINTS[surface]).lerp(horizon,.36);
  const fade=Math.min(1,(FLIGHT_SECONDS-age)/2.5);
  // Each emission has a stable birth position, variation and drift. Older
  // billows spread and thin out instead of forming evenly spaced solid tiers.
  const newest=Math.floor(age/EMISSION_SECONDS);
  let count=0;
  for(let i=0;i<SMOKE_COUNT;i++){
   const birthIndex=newest-i;if(birthIndex<0)break;
   const birth=birthIndex*EMISSION_SECONDS,delay=age-birth,progress=birth/FLIGHT_SECONDS;
   const seed=birthIndex*2.399963+slot*1.71,variation=.5+.5*Math.sin(seed*3.17);
   this.exhaust.set(route.to[0]-route.from[0],(route.to[1]-route.from[1])*(.2+1.6*progress),route.to[2]-route.from[2]).normalize().multiplyScalar(-6.8);
   pathAt(route,birth,this.point).add(this.exhaust);
   this.point.x+=delay*(.30+.16*Math.sin(seed))+Math.sin(delay*.9+seed)*Math.sqrt(delay)*.55;
   this.point.y+=delay*.55;this.point.z+=Math.cos(seed)*delay*.35;
   const size=(2.5+delay*1.05+Math.sqrt(delay)*1.2)*(.82+variation*.32);
   const thinning=Math.max(0,1-(delay/5.8)**2),birthFade=1-Math.exp(-delay*8);
   this.smokeOwner.setBillow(count++,this.point,size,size*(.82+variation*.28),(.38+variation*.16)*thinning*birthFade,seed+delay*.10);
  }
  this.smokeOwner.commit(count,fade,horizon);
  const pulse=reducedMotion?1:.93+Math.sin(age*12)*.07;
  for(let i=0;i<4;i++){
   const core=i>=2,side=i%2?1:-1,length=(core?4:7)*pulse;
   this.enginePose.position.set(side*2.15,-.05,6.4+length/2);
   this.enginePose.rotation.set(Math.PI/2,0,0);
   this.enginePose.scale.set(core?.38:.7,length,core?.38:.7).multiplyScalar(fade);
   this.enginePose.updateMatrix();this.matrix.multiplyMatrices(this.hull.matrix,this.enginePose.matrix);
   this.fire.setMatrixAt(i,this.matrix);
  }
  this.fire.instanceMatrix.needsUpdate=true;this.fire.computeBoundingSphere();
 }

 dispose(){
  if(this.disposed)return;this.disposed=true;this.group.removeFromParent();
  Object.values(this.geometry).forEach(geometry=>geometry.dispose());
  Object.values(this.materials).forEach(material=>material.dispose());
  this.smokeOwner.dispose();
  this.fire.dispose();this.fireGeometry.dispose();this.fireMaterial.dispose();this.group.clear();
 }
}
