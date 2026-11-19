import * as THREE from './vendor/three.module.js';
import {SALVAGE_SITES} from './salvage-sites.js';
import {createToolModel} from './tool-models.js';

/** Fixed collectible scraps use one instanced mesh. Unique tools stay distinct,
 * with the builder revealed only after opening the original Basin cargo. */
export class SalvageRenderer {
 constructor(world,{decorateMaterial}={}){
  this.group=new THREE.Group();this.group.name='collectible-salvage';this.disposed=false;this.unique=[];
  this.debrisSites=SALVAGE_SITES.filter(site=>site.itemId==='debris');
  this.prototype=createToolModel('debris');const source=this.prototype.children[0];
  this.debris=new THREE.InstancedMesh(source.geometry,source.material,this.debrisSites.length);this.debris.name='small-pickup-metal-scraps';this.debris.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.debris.frustumCulled=false;this.group.add(this.debris);
  this.pose=new THREE.Object3D();this.origin=new THREE.Vector3();this.lastKey='';this.lastCamera=new THREE.Vector3(Infinity,Infinity,Infinity);this.lastRange=NaN;
  for(const site of SALVAGE_SITES.filter(site=>site.itemId!=='debris')){
   const model=createToolModel(site.itemId);model.name=`pickup-${site.itemId}`;model.position.set(site.x/25,site.z/25+.01,site.y/25);model.rotation.set(-Math.PI/2,0,site.yaw??0);this.group.add(model);this.unique.push({site,model});
  }
  if(decorateMaterial){const materials=new Set();this.group.traverse(object=>{if(object.isMesh)materials.add(object.material);});for(const material of materials)decorateMaterial(material);}
 }
 update(world,camera,range=Infinity){
  if(this.disposed)return;const position=camera?.position??camera;if(!position)return;
  const collected=new Set(world.crafting?.collected??[]),open=Boolean(world.copperCargo?.opened),distance=Number.isFinite(range)&&range>0?range:Infinity;
  const key=[...collected].sort().join('|')+`:${open}`;
  if(key===this.lastKey&&distance===this.lastRange&&position.distanceToSquared(this.lastCamera)<.16)return;
  this.lastKey=key;this.lastRange=distance;this.lastCamera.copy(position);let count=0;
  for(const site of this.debrisSites){
   this.origin.set(site.x/25,site.z/25,site.y/25);if(collected.has(site.id)||this.origin.distanceTo(position)>distance+.3)continue;
   this.pose.position.copy(this.origin);this.pose.position.y+=.04;this.pose.rotation.set(-Math.PI/2,(site.id.length%3-.9)*.15,site.yaw??0);this.pose.scale.setScalar(1.4);this.pose.updateMatrix();this.debris.setMatrixAt(count++,this.pose.matrix);
  }
  this.debris.count=count;this.debris.instanceMatrix.needsUpdate=true;
  for(const {site,model}of this.unique)model.visible=!collected.has(site.id)&&(!site.crate||open)&&model.position.distanceTo(position)<=distance+.4;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.group.removeFromParent();this.debris.dispose();this.prototype.dispose();for(const {model}of this.unique)model.dispose();this.unique.length=0;this.group.clear();}
}
