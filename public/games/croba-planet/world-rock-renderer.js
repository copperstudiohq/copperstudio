import * as THREE from './vendor/three.module.js';
import {createWorldRockGeometry,getWorldRockPose} from './world-rock-geometry.js';
import {applyRockWearNormals} from './weathered-rock-geometry.js';
import {BLUE_OCEAN_START_X} from './terrain.js';
import {shellFieldBlend} from './shell-field.js';

const HABITATS=Object.freeze({cold:'cold',forest:'forest',marine:'marine',sulfur:'forest',warm:'forest'});
const TINTS=Object.freeze({cold:[0xd3d9dc,0xe4e2da,0xc9d2d8],forest:[0xe5d1b9,0xd2c2ac,0xf0dcc5],marine:[0xc9d1d2,0xd9d0c2,0xd1c8be]});

function bucket(rock){
 const habitat=HABITATS[rock.habitat];
 if(!habitat)throw new TypeError(`World rock ${rock.id??'(unnamed)'} has an unknown habitat: ${rock.habitat}.`);
 if(!Number.isInteger(rock.style)||rock.style<0||rock.style>2)throw new RangeError(`World rock ${rock.id??'(unnamed)'} needs style 0, 1 or 2.`);
 return `${habitat}:${rock.style}`;
}

/** Opaque static batches use the same shapes on every device. All stone maps
 * remain shared with the existing material library; no textures are allocated.
 */
export class WorldRockRenderer{
 /** @param {THREE.Object3D} scene @param {{rock?:THREE.MeshStandardMaterial}} materials
  * @param {import('./world-rock-geometry.js').WorldRock[]} rocks */
 constructor(scene,materials={},rocks=[]){
  if(!scene?.add||!Array.isArray(rocks))throw new TypeError('World rocks require a scene and an authored rock array.');
  this.group=new THREE.Group();this.group.name='prepared-world-rocks';this.meshes=[];this.materials=[];this.geometries=[];this.disposed=false;
  const pose=new THREE.Object3D(),batches=new Map();
  // Validate before allocating GPU resources, so malformed data fails cleanly.
  for(const rock of rocks){getWorldRockPose(rock,pose);const key=bucket(rock);if(!batches.has(key))batches.set(key,[]);batches.get(key).push(rock);}
  const prototypes=new Map(),surfaces=new Map(),color=new THREE.Color();
  for(const [key,entries]of batches){
   const [habitat,styleText]=key.split(':'),style=Number(styleText);
   let geometry=prototypes.get(style),material=surfaces.get(habitat);
   if(!geometry){geometry=applyRockWearNormals(createWorldRockGeometry(style));prototypes.set(style,geometry);this.geometries.push(geometry);}
   if(!material){
    material=materials.rock?.clone()??new THREE.MeshStandardMaterial({color:0xd88945,roughness:.9,metalness:.01});
    material.name=`world-rock-${habitat}`;material.vertexColors=true;material.transparent=false;material.opacity=1;material.depthWrite=true;
    material.flatShading=false;
    material.roughness=Math.max(.84,material.roughness??.9);material.metalness=Math.min(.04,material.metalness??.01);
    if(habitat==='marine')material.color.setHex(0xffffff);
    surfaces.set(habitat,material);this.materials.push(material);
   }
   const mesh=new THREE.InstancedMesh(geometry,material,entries.length);mesh.name=`world-rocks-${habitat}-${style}`;
   mesh.userData.sourceIds=entries.map(rock=>rock.id);
   for(const [index,rock]of entries.entries()){
    getWorldRockPose(rock,pose);mesh.setMatrixAt(index,pose.matrix);
    const id=String(rock.id),hash=Array.from(id).reduce((value,ch)=>(Math.imul(value,31)+ch.charCodeAt(0))>>>0,0);
    color.setHex(TINTS[habitat][hash%3]);
    if(habitat==='marine'&&rock.x>=BLUE_OCEAN_START_X)color.lerp(new THREE.Color(0x626a73),1-shellFieldBlend(rock.x,rock.y));
    mesh.setColorAt(index,color.multiplyScalar(.96+(hash%9)*.007));
   }
   mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
   mesh.receiveShadow=true;mesh.castShadow=false;mesh.computeBoundingBox();mesh.computeBoundingSphere();
   this.meshes.push(mesh);this.group.add(mesh);
  }
  scene.add(this.group);
 }

 /** Materials own no maps: their textures remain owned by the shared library. */
 dispose(){
  if(this.disposed)return;this.disposed=true;
  for(const mesh of this.meshes)mesh.dispose();for(const geometry of this.geometries)geometry.dispose();for(const material of this.materials)material.dispose();
  this.group.removeFromParent();this.group.clear();
 }
}
