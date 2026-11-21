import {capRenderDistance} from './render-distance.js';
import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';
import {buildSandWormAnatomy,SAND_WORM_PLATE_HINGE_RADIUS,SAND_WORM_MOUTH_Z} from './sand-worm-anatomy.js';
import {CAVE_WORM_SEGMENTS,CAVE_WORM_CAPACITY} from './cave-sand-worms.js';
import {createCreatureSurfaceMaps,applyCreatureSurface} from './creature-materials.js';
const X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
/** Short plated ring with recessed dark joints, sized for small aquatic worms. */
function miniRing(){
 const mesh=new PlantMesh();
 mesh.grid(3,16,(u,v)=>{const a=v*Math.PI*2,r=.96+.04*Math.sin(u*Math.PI);return new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,u-.5);},0x494438);
 for(let i=0;i<8;i++)mesh.grid(3,3,(u,v)=>{
  const a=i/8*Math.PI*2+(v-.5)*.69,r=1.03+.09*u+.015*Math.sin(v*Math.PI);return new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,-.36+u*.82);
 },(u)=>u>.8?0xc3a464:0x9f8149);
 return mesh.geometry({normalizeHeight:false});
}
/** The adult's real hollow head and four hinged mouth shields are reused at
 * miniature scale. Three instanced draws cover every visible swimming animal. */
export class CaveSandWormRenderer{
 constructor(world,maps=null){
  this.group=new THREE.Group();this.group.name='mini-aquatic-sand-worms';this.disposed=false;
  this.geometry=buildSandWormAnatomy();this.geometry.segment.dispose();this.geometry.segment=miniRing();
  this.maps=maps??createCreatureSurfaceMaps('scarred-armor',128);this.ownsMaps=!maps;
  this.material=applyCreatureSurface(new THREE.MeshStandardMaterial({color:0xd1c39b,vertexColors:true,roughness:.64}),this.maps,.3);this.material.userData.waterMedium='sulfuric';
  this.meshes={};const count=CAVE_WORM_CAPACITY;
  for(const [name,geometry]of Object.entries(this.geometry)){
   const mesh=new THREE.InstancedMesh(geometry,this.material,Math.max(1,count*(name==='segment'?CAVE_WORM_SEGMENTS-1:name==='plate'?4:1)));mesh.count=0;mesh.name=`mini-cave-worm-${name}`;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.meshes[name]=mesh;this.group.add(mesh);
  }
  this.pose=new THREE.Object3D();this.direction=new THREE.Vector3();this.headRotation=new THREE.Quaternion();this.petal=new THREE.Quaternion();this.open=new THREE.Quaternion();this.pivot=new THREE.Vector3();this.lastTime=null;
 }
 update(world,_animation,_reducedMotion,camera,quality={}){
  if(this.disposed)return;
  const visible=(world.caveWorms??[]).filter(w=>!w.lifecycleInactive&&w.lifecycleHabitat!=='sulfuric-land'&&(!camera||Math.hypot(camera.x-w.x/25,camera.y-w.z/25,camera.z-w.y/25)<capRenderDistance(quality,38))).slice(0,CAVE_WORM_CAPACITY);
  this.group.visible=visible.length>0;
  const key=visible.map(w=>`${w.id}:${w.lifecycleAgeSeconds}:${w.lifecycleScale}:${w.lifecycleRevision??0}`).join(',');if(this.lastTime===world.elapsed&&this.visibility===key)return;this.lastTime=world.elapsed;this.visibility=key;
  let rings=0,heads=0,plates=0;
  const place=(mesh,index)=>{this.pose.updateMatrix();mesh.setMatrixAt(index,this.pose.matrix);};
  for(const worm of visible){
   const segments=worm.segments,radial=worm.widthMeters/2.3,spacing=worm.lengthMeters/(CAVE_WORM_SEGMENTS+1);
   for(let i=1;i<segments.length;i++){
    const p=segments[i],a=segments[i-1],b=segments[Math.min(segments.length-1,i+1)],taper=1-.78*(i/(segments.length-1))**2;
    const linkLength=Math.hypot(a.x-p.x,a.y-p.y,a.z-p.z)/25;
    this.direction.set(a.x-b.x,a.z-b.z,a.y-b.y).normalize();this.pose.position.set(p.x/25,p.z/25,p.y/25);this.pose.quaternion.setFromUnitVectors(Z,this.direction);this.pose.scale.set(radial*taper,radial*taper,Math.max(spacing,linkLength)*1.12);place(this.meshes.segment,rings++);
   }
   const p=segments[0],back=segments[1];this.direction.set(p.x-back.x,p.z-back.z,p.y-back.y).normalize();this.headRotation.setFromUnitVectors(Z,this.direction);
   this.pose.position.set(p.x/25,p.z/25,p.y/25);this.pose.quaternion.copy(this.headRotation);this.pose.scale.setScalar(radial);place(this.meshes.head,heads++);
   for(let j=0;j<4;j++){
    this.petal.setFromAxisAngle(Z,j*Math.PI/2);this.open.setFromAxisAngle(X,-worm.mouthOpen*1.15);
    this.pivot.set(0,SAND_WORM_PLATE_HINGE_RADIUS,SAND_WORM_MOUTH_Z).multiplyScalar(radial).applyQuaternion(this.petal).applyQuaternion(this.headRotation);
    this.pose.position.set(p.x/25,p.z/25,p.y/25).add(this.pivot);this.pose.quaternion.copy(this.headRotation).multiply(this.petal).multiply(this.open);this.pose.scale.setScalar(radial);place(this.meshes.plate,plates++);
   }
  }
  for(const [name,count]of Object.entries({segment:rings,head:heads,plate:plates})){const mesh=this.meshes[name];mesh.count=count;if(count){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}}
 }
 dispose(){if(this.disposed)return;this.disposed=true;Object.values(this.meshes).forEach(m=>m.dispose());Object.values(this.geometry).forEach(g=>g.dispose());this.material.dispose();if(this.ownsMaps)this.maps.dispose();this.group.removeFromParent();this.group.clear();}
}
