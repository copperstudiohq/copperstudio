import {capRenderDistance} from './render-distance.js';
import * as THREE from './vendor/three.module.js';
import {buildTuskjawSharkAnatomy} from './tuskjaw-shark-anatomy.js';
import {createCreatureSurfaceMaps,applyCreatureSurface} from './creature-materials.js';
import {createTuskonTailPose,updateTuskonTailPose,applyTuskonSwimming} from './tuskon-tail-skinning.js';
import {TuskonJetRenderer} from './tuskon-jet-renderer.js';

/** One detailed model on every device, bounded draws and no added lights. */
export class TuskjawSharkRenderer{
  constructor(world){
    this.group=new THREE.Group();this.group.name='tuskjaw-sharks';this.disposed=false;
    this.geometry=buildTuskjawSharkAnatomy();
    this.maps=createCreatureSurfaceMaps('armor',128);
    this.phase={value:0};this.motion={value:1};this.tailPose=createTuskonTailPose();
    const skin=()=>applyCreatureSurface(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.72}),this.maps,.24);
    this.materials={body:applyTuskonSwimming(skin(),this.phase,this.motion,this.tailPose),
      fins:applyTuskonSwimming(skin(),this.phase,this.motion,this.tailPose,true),
      face:applyTuskonSwimming(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.31}),this.phase,this.motion,this.tailPose)};
    this.roots=new Map();
    for(const animal of world.tuskjawSharks??[]){
      if(typeof animal.id!=='string'||![animal.x,animal.y,animal.z,animal.heading].every(Number.isFinite))throw new TypeError('Crobonic Tuskon needs an id and finite pose.');
      const root=new THREE.Group();root.name=animal.id;
      for(const [kind,geometry] of Object.entries(this.geometry)){
        const material=this.materials[kind==='fins'?'fins':['face','tusks'].includes(kind)?'face':'body'];
        const mesh=new THREE.Mesh(geometry,material);mesh.name=`tuskjaw-${kind}`;mesh.frustumCulled=false;root.add(mesh);
      }
      this.roots.set(animal.id,root);this.group.add(root);
    }
    this.jets=new TuskonJetRenderer(world);this.group.add(this.jets.group);
  }
  update(world,_time,reducedMotion=false,camera,quality={}){
    if(this.disposed)return;
    for(const animal of world.tuskjawSharks??[]){
      const root=this.roots.get(animal.id);if(!root)continue;
      root.visible=!(animal.squidRespawnIn>0)&&(!camera||Math.hypot(animal.x/25-camera.x,animal.z/25-camera.y,animal.y/25-camera.z)<capRenderDistance(quality,quality.mobile?65:85));
      if(!root.visible)continue;
      root.position.set(animal.x/25,animal.z/25,animal.y/25);
      root.rotation.set(-(animal.pitch??0),Math.PI/2-animal.heading,animal.bank??0,'YXZ');
      this.phase.value=animal.phase??0;this.motion.value=reducedMotion||animal.squidHeldBy?0:1;
      updateTuskonTailPose(animal,root,this.tailPose,this.motion.value>0);
    }
    this.jets.update(world,this.roots,reducedMotion);
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;
    Object.values(this.geometry).forEach(g=>g.dispose());Object.values(this.materials).forEach(m=>m.dispose());
    this.jets.dispose();this.maps.dispose();this.group.removeFromParent();this.group.clear();this.roots.clear();
  }
}
