import * as THREE from './vendor/three.module.js';
import {WATER_LEVEL} from './terrain.js';

const SCALE=25,LEVEL=WATER_LEVEL/SCALE,UP=new THREE.Vector3(0,1,0);
const OUTLINES=Object.freeze([
 [[-1,-.45],[-.62,-.92],[.35,-.83],[.92,-.38],[.76,.53],[.05,.89],[-.73,.67]],
 [[-.95,-.25],[-.72,-.75],[-.13,-.92],[.64,-.71],[.98,-.05],[.61,.68],[-.08,.92],[-.81,.54]],
 [[-.93,-.43],[-.43,-.88],[.16,-.96],[.72,-.64],[.96,-.07],[.75,.48],[.24,.88],[-.36,.78],[-.91,.29]],
]);
/** @typedef {{id:string,x:number,y:number,rx:number,ry:number,thickness:number,heading:number,phase:number,speed:number,driftX:number,driftY:number}} DriftIceEntry */

/** Thin closed angular fragments. The normalized top is Y=0; the blue body
 * lies below it. These decorative pieces never enter the island/collider data.
 * @param {number} [style] @returns {THREE.BufferGeometry}
 */
export function createDriftIceGeometry(style=0){
 if(!Number.isInteger(style)||style<0||style>2)throw new RangeError('Drift ice style must be 0, 1 or 2.');
 const outline=OUTLINES[style],radius=Math.max(...outline.map(p=>Math.hypot(...p))),positions=[],colors=[],uvs=[];
 const rings=[{radius:.94,y:0,offset:0},{radius:1,y:-.18,offset:0},{radius:.82,y:-1,offset:.025}]
  .map(ring=>outline.map(([x,z])=>new THREE.Vector3(x/radius*ring.radius+ring.offset,ring.y,z/radius*ring.radius-ring.offset*.5)));
 const top=new THREE.Vector3(0,0,0),bottom=new THREE.Vector3(.025,-1,-.0125),center=new THREE.Vector3(0,-.5,0);
 const pale=new THREE.Color(0xeaf3f6),edge=new THREE.Color(0x77b7cf),deep=new THREE.Color(0x5893ad),normal=new THREE.Vector3(),direction=new THREE.Vector3();
 const triangle=(a,b,c,tint)=>{
  normal.subVectors(b,a).cross(direction.subVectors(c,a));direction.copy(a).add(b).add(c).multiplyScalar(1/3).sub(center);
  const points=normal.dot(direction)>=0?[a,b,c]:[a,c,b];
  for(const point of points){
   positions.push(point.x,point.y,point.z);uvs.push(point.x*.5+.5,point.z*.5+.5);
   const grain=.97+.03*Math.sin(point.x*9+point.z*7+style*2);colors.push(tint.r*grain,tint.g*grain,tint.b*grain);
  }
 };
 for(let i=0;i<outline.length;i++){
  const next=(i+1)%outline.length;triangle(top,rings[0][i],rings[0][next],pale);
  for(let layer=0;layer<2;layer++){
   const a=rings[layer][i],b=rings[layer][next],c=rings[layer+1][i],d=rings[layer+1][next];
   triangle(a,c,b,layer?deep:edge);triangle(b,c,d,layer?deep:edge);
  }
  triangle(bottom,rings[2][next],rings[2][i],deep);
 }
 const geometry=new THREE.BufferGeometry();geometry.name=`thin-chipped-drift-ice-${style}`;
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return geometry;
}

function validate(entry){
 if(!entry||typeof entry.id!=='string'||!entry.id||!['x','y','rx','ry','thickness','heading','phase','speed','driftX','driftY'].every(key=>Number.isFinite(entry[key]))
   ||entry.rx<=0||entry.ry<=0||entry.thickness<=0||entry.speed<0)
  throw new TypeError(`Drift ice ${entry?.id??'(unnamed)'} requires a named finite pose, positive dimensions and nonnegative speed.`);
}

/** Three opaque dynamic instance batches share one existing ice material.
 * Motion uses the same wave field and animation clock as the ocean shader.
 */
export class DriftIceRenderer{
 /** @param {object} world @param {{ice?:THREE.MeshStandardMaterial,snow?:THREE.MeshStandardMaterial}} materials
  * @param {ReadonlyArray<DriftIceEntry>} entries */
 constructor(world,materials={},entries=[]){
  if(!Array.isArray(entries))throw new TypeError('Drift ice requires a prepared fragment array.');
  const ids=new Set();for(const entry of entries){validate(entry);if(ids.has(entry.id))throw new TypeError(`Duplicate drift ice id: ${entry.id}.`);ids.add(entry.id);}
  this.group=new THREE.Group();this.group.name='loose-drifting-surface-ice';this.meshes=[];this.geometries=[];this.instances=[];this.disposed=false;this.lastTime=NaN;
  this.pose=new THREE.Object3D();this.normal=new THREE.Vector3();this.tilt=new THREE.Quaternion();this.yaw=new THREE.Quaternion();
  this.lastCamera=new THREE.Vector3(Infinity,Infinity,Infinity);this.lastRange=NaN;this.counts=[0,0,0];
  this.material=(materials.ice??materials.snow)?.clone()??new THREE.MeshStandardMaterial({color:0xffffff,roughness:.74});
  this.material.name='frosted-drift-ice-and-blue-edges';this.material.color.setHex(0xffffff);this.material.vertexColors=true;
  this.material.transparent=false;this.material.opacity=1;this.material.depthWrite=true;this.material.roughness=.74;this.material.metalness=.015;
  this.material.userData.glacialRole='ice';
  for(let style=0;style<3;style++){
   const count=Math.floor((entries.length+2-style)/3);if(!count)continue;
   const geometry=createDriftIceGeometry(style),mesh=new THREE.InstancedMesh(geometry,this.material,count);mesh.name=`drifting-ice-fragments-${style}`;
   mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.receiveShadow=true;mesh.castShadow=false;
   this.geometries.push(geometry);this.meshes.push(mesh);this.group.add(mesh);
   for(let index=style,slot=0;index<entries.length;index+=3,slot++)this.instances.push({entry:entries[index],mesh,slot,style});
  }
  this.update(0);
  // Independent drift frequencies can reach opposite extremes. Bound their
  // entire envelopes once, including every yaw, tilt and wave crest/trough.
  for(const mesh of this.meshes){
   const box=new THREE.Box3();
   for(const item of this.instances){
    if(item.mesh!==mesh)continue;
    const e=item.entry,radius=Math.hypot(e.rx,e.ry)/SCALE,dx=Math.abs(e.driftX)/SCALE,dy=Math.abs(e.driftY)/SCALE;
    box.expandByPoint(new THREE.Vector3(e.x/SCALE-dx-radius,LEVEL-.084-e.thickness/SCALE-radius*.025,e.y/SCALE-dy-radius));
    box.expandByPoint(new THREE.Vector3(e.x/SCALE+dx+radius,LEVEL+.084+.05+radius*.025,e.y/SCALE+dy+radius));
   }
   mesh.boundingBox=box;mesh.boundingSphere=box.getBoundingSphere(new THREE.Sphere());
  }
 }

 /** Repeated clock values do not upload matrices. Pausing retains the scene
  * clock; reduced motion explicitly returns to the stable time-zero pose. */
 update(time,reducedMotion=false,cameraPosition,renderDistance=Infinity){
  if(this.disposed)return;
  const t=reducedMotion||!Number.isFinite(time)?0:Math.max(0,time),range=Number.isFinite(renderDistance)&&renderDistance>0?renderDistance:Infinity;
  if(t===this.lastTime&&range===this.lastRange&&(!cameraPosition||cameraPosition.distanceToSquared(this.lastCamera)<.16))return;
  this.lastTime=t;this.lastRange=range;if(cameraPosition)this.lastCamera.copy(cameraPosition);this.counts.fill(0);
  for(let i=0;i<this.instances.length;i++){
   const {entry:e,mesh,style}=this.instances[i],phase=t*e.speed+e.phase;
   const x=(e.x+Math.sin(phase)*e.driftX)/SCALE,z=(e.y+Math.sin(t*e.speed*.73+e.phase*1.7)*e.driftY)/SCALE;
   const a=x*.075+z*.031+t*.7,b=z*.113-x*.029-t*.5,wave=Math.sin(a)*.047+Math.cos(b)*.037;
   const sx=Math.cos(a)*.003525+Math.sin(b)*.001073+Math.sin(t*.37+e.phase)*.002;
   const sz=Math.cos(a)*.001457-Math.sin(b)*.004181+Math.cos(t*.31+e.phase*1.3)*.002;
   this.normal.set(-sx,1,-sz).normalize();this.tilt.setFromUnitVectors(UP,this.normal);
   this.yaw.setFromAxisAngle(UP,e.heading+Math.sin(t*e.speed*.52+e.phase)*.11);
   this.pose.quaternion.copy(this.tilt).multiply(this.yaw);
   this.pose.position.set(x,LEVEL+wave+Math.max(.025,e.thickness/SCALE*.18)+Math.sin(t*.43+e.phase)*.004,z);
   this.pose.scale.set(e.rx/SCALE,e.thickness/SCALE,e.ry/SCALE);this.pose.updateMatrix();
   if(cameraPosition&&cameraPosition.distanceTo(this.pose.position)>range+Math.hypot(e.rx,e.ry)/SCALE)continue;
   const slot=this.counts[style]++;mesh.setMatrixAt(slot,this.pose.matrix);
  }
  for(let i=0;i<this.meshes.length;i++){const mesh=this.meshes[i],style=Number(mesh.name.split('-').at(-1));mesh.count=this.counts[style];mesh.instanceMatrix.needsUpdate=true;}
 }

 dispose(){
  if(this.disposed)return;this.disposed=true;
  for(const mesh of this.meshes)mesh.dispose();for(const geometry of this.geometries)geometry.dispose();this.material.dispose();this.group.removeFromParent();this.group.clear();
 }
}
