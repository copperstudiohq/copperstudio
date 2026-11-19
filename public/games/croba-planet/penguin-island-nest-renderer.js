import {capRenderDistance} from './render-distance.js';
import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';
import {getPenguinNestSites} from './penguin-nest-sites.js';
import {getIceSurfaceHeight} from './ice-surface.js';
import {haulerBirdSurface} from './hauler-birds.js';
import {LARGE_GLACIER_WRECK_SITE as SITE} from './large-glacier-wreck.js';
import {wreckLocalPoint} from './wreck-interior.js';

/** Prepared twig bowls follow the real snow surface. Each island shares one
 * static bark draw and the world's existing bark maps, without new textures. */
export class PenguinIslandNestRenderer{
 constructor(world,materials){
  this.group=new THREE.Group();this.group.name='crobon-island-nests';this.disposed=false;
  this.material=materials?.bark?.clone()??new THREE.MeshStandardMaterial({color:0x725747,roughness:.88});
  this.material.vertexColors=true;this.material.side=THREE.DoubleSide;
  const colonies=new Map();
  for(const nest of getPenguinNestSites(world).filter(site=>site.kind!=='wing')){
   const key=nest.kind==='hauler'?(nest.zone==='starter-roof'?'starter-roof':'cargo-hauler'):nest.colony;
   let batch=colonies.get(key);
   if(!batch){batch={builder:new PlantMesh(),nests:[],twigs:[]};colonies.set(key,batch);}
   const {x,y,radius,phase}=nest,platform=world.platforms.find(ice=>ice.id===nest.platformId);
   const point=(dx,dy,height)=>{
    const px=x+dx*25,py=y+dy*25;
    const pose=nest.shipPose??SITE,local=nest.kind==='hauler'?wreckLocalPoint(pose,px,py):null;
    const surface=local?(pose.z??0)/25+haulerBirdSurface(nest,local.x,local.z):getIceSurfaceHeight(platform,px,py)/25;
    return new THREE.Vector3(px/25,surface+height,py/25);
   };
   const twig=(from,to,width,shade=1)=>{
    const color=new THREE.Color(0xffffff).multiplyScalar(shade);
    batch.builder.tube([from,to],[width,width*.78],color.getHex(),6);
    batch.twigs.push({from:from.toArray(),to:to.toArray(),radius:width,nestId:nest.id});
   };
   for(let stick=0;stick<10;stick++){
    const angle=phase+stick*2.39996,offset=((stick%5)-2)*radius*.16;
    const span=Math.sqrt(radius*radius*.67-offset*offset),dx=Math.cos(angle),dy=Math.sin(angle);
    twig(point(-dx*span-dy*offset,-dy*span+dx*offset,.04+stick%3*.012),point(dx*span-dy*offset,dy*span+dx*offset,.05),.018,.86+stick%3*.06);
   }
   for(let layer=0;layer<3;layer++)for(let stick=0;stick<10;stick++){
    const angle=phase+stick*Math.PI/5+(layer%2)*.27,r=radius*(.86+layer*.065),spread=.39;
    const from=point(Math.cos(angle-spread)*r,Math.sin(angle-spread)*r,.075+layer*.065);
    const to=point(Math.cos(angle+spread)*r,Math.sin(angle+spread)*r,.085+layer*.065);
    twig(from,to,.021+(stick%3)*.004,.82+stick%4*.05);
    if(layer===1&&stick%3===0)twig(from,point(Math.cos(angle+.16)*r*.76,Math.sin(angle+.16)*r*.76,.16),.012,.86);
   }
   batch.nests.push(nest);
  }
  for(const [colony,batch]of colonies){
   const geometry=batch.builder.geometry({normalizeHeight:false});geometry.computeBoundingSphere();
   geometry.userData.nestIds=batch.nests.map(nest=>nest.id);geometry.userData.twigs=batch.twigs;
   const mesh=new THREE.Mesh(geometry,this.material);mesh.name=`crobon-island-${colony}-nests`;
   mesh.userData.center=geometry.boundingSphere.center.clone();mesh.userData.radius=geometry.boundingSphere.radius;
   this.group.add(mesh);
  }
 }
 update(_world,_time,_reducedMotion=false,camera,quality={}){
  if(this.disposed)return;
  let visible=false;
  for(const mesh of this.group.children){
   mesh.visible=!camera||camera.distanceTo(mesh.userData.center)-mesh.userData.radius<=capRenderDistance(quality,quality.mobile?45:70);
   visible||=mesh.visible;
  }
  this.group.visible=visible;
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;
  for(const mesh of this.group.children)mesh.geometry.dispose();
  this.material.dispose();this.group.removeFromParent();this.group.clear();
 }
}
