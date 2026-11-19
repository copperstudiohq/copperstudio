import * as THREE from './vendor/three.module.js';
import {createBarnacleGeometry,createBarnacleMaterial} from './cave-barnacle-renderer.js';
import {createWorldBarnacleSites} from './world-barnacle-sites.js';
import {getSaltCave} from './salt-cave.js';
import {updateInstancedWindBounds} from './render-visibility.js';

const UP=new THREE.Vector3(0,1,0),LIMIT=160,RANGE=38;
const COLORS=Object.freeze({'arctic':0xd8e5ed,'blue-ocean':0xb8b4d7,'shell-field':0xf4dcc0,
 'blue-kelp-forest':0x9cc8dc,'orange-grass-field':0xe3be79,'cliff-biome':0xc5d6dc});

/** One shared nearby batch for submerged colonies. The existing private
 * Salt Cave batch keeps its own water treatment and wall colonies. */
export class WorldBarnacleRenderer{
 constructor(world,materials){
  this.group=new THREE.Group();this.group.name='barnacles-across-croba';this.time={value:0};this.disposed=false;
  this.geometry=createBarnacleGeometry();this.material=createBarnacleMaterial(materials,this.time);this.sites=createWorldBarnacleSites(world);this.visibleSites=[];
  this.mesh=new THREE.InstancedMesh(this.geometry,this.material,LIMIT);this.mesh.name='nearby-world-barnacle-colonies';this.mesh.count=0;this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.group.add(this.mesh);
  const pose=new THREE.Object3D(),normal=new THREE.Vector3(),spin=new THREE.Quaternion();
  this.placements=this.sites.map(site=>{
   normal.set(site.normal.x,site.normal.y,site.normal.z);pose.position.set(site.x/25,site.z/25,site.y/25).addScaledVector(normal,-.025);pose.quaternion.setFromUnitVectors(UP,normal);spin.setFromAxisAngle(UP,site.angle);pose.quaternion.multiply(spin);pose.scale.setScalar(site.scale);pose.updateMatrix();
   return{site,matrix:pose.matrix.clone(),position:pose.position.clone(),color:new THREE.Color(COLORS[site.biome]??0xffffff)};
  });this.lastCamera=new THREE.Vector3(Infinity,Infinity,Infinity);this.visibleKey=null;
 }
 update(camera,time,reducedMotion=false){
  if(this.disposed)return;this.time.value=reducedMotion?0:time;
  if(getSaltCave(camera.x*25,camera.z*25,camera.y*25)){
   this.group.visible=false;this.mesh.count=0;this.visibleSites=[];this.visibleKey=null;this.lastCamera.set(Infinity,Infinity,Infinity);return;
  }
  if(this.lastCamera.distanceToSquared(camera)<.25)return;this.lastCamera.copy(camera);
  const candidates=[];
  for(let index=0;index<this.placements.length;index++){
   const p=this.placements[index],d=p.position.distanceToSquared(camera);if(d<RANGE*RANGE)candidates.push({p,index,d});
  }
  const near=candidates.sort((a,b)=>a.d-b.d).slice(0,LIMIT).sort((a,b)=>a.index-b.index),key=near.map(p=>p.index).join(',');
  this.group.visible=near.length>0;this.visibleSites=near.map(p=>p.p.site);
  if(this.visibleKey===key)return;this.visibleKey=key;this.mesh.count=near.length;
  near.forEach(({p},i)=>{this.mesh.setMatrixAt(i,p.matrix);this.mesh.setColorAt(i,p.color);});
  if(near.length){this.mesh.instanceMatrix.needsUpdate=true;this.mesh.instanceColor.needsUpdate=true;updateInstancedWindBounds(this.mesh,.028,.02);}
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.mesh.dispose();this.geometry.dispose();this.material.dispose();this.group.removeFromParent();this.group.clear();}
}
