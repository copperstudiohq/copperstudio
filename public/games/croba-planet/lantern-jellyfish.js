import {capRenderDistance} from './render-distance.js';
import {uploadAttributePrefix} from './dynamic-attribute-upload.js';
import * as THREE from './vendor/three.module.js';
import {lanternTentaclePoint} from './lantern-stingers.js';
import {WATER_LEVEL,BLUE_OCEAN_START_X} from './terrain.js';
import {getSeabedHeight} from './seabed.js';
import {getForestHeight} from './forest-terrain.js';
import {preparedLanternDriftClearsSpires} from './jellyfish-spires-life.js';
import {getLanternMotion} from './lantern-motion.js';

const SCALE=25,ARMS=6,LINKS=7,UP=new THREE.Vector3(0,1,0);
const finite=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
const nearestFirst=(a,b)=>a.distance-b.distance;

/** Prepared midwater drifters, including giant stinging individuals. Initial positions are literal prepared data;
 * all motion uses the simulation clock and stops when held or awaiting respawn. */
export function updateLanternJellyfish(world,dt) {
  if(!Number.isFinite(dt)||dt<=0)return;
  for(const fish of world.jellyfish??[]){
    if(!finite(fish)||fish.squidHeldBy||fish.squidRespawnIn>0)continue;
    fish.motionTime=(fish.motionTime??0)+Math.min(.05,dt);
    const t=fish.motionTime,p=fish.phase;
    const x=fish.homeX+(Math.sin(t*.13+p)-Math.sin(p))*30;
    const y=fish.homeY+(Math.cos(t*.11+p)-Math.cos(p))*25;
    const floor=Math.max(getSeabedHeight(x,y),getForestHeight(world,x,y)??-Infinity);
    const minZ=floor+fish.tentacleLength+fish.headRadius,maxZ=WATER_LEVEL-fish.headRadius*2;
    if(x<BLUE_OCEAN_START_X+fish.headRadius||minZ>maxZ)continue;
    const z=Math.max(minZ,Math.min(maxZ,fish.homeZ+(Math.sin(t*.55+p)-Math.sin(p))*8));
    if(fish.habitat==='jellyfish-spires'&&!preparedLanternDriftClearsSpires(fish,x,y,z))continue;
    fish.px=fish.x;fish.py=fish.y;fish.pz=fish.z;
    fish.x=x;fish.y=y;fish.z=z;
  }
}

function bellGeometry() {
  const geometry=new THREE.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI*.58);
  const p=geometry.attributes.position,colors=[],tint=new THREE.Color();
  for(let i=0;i<p.count;i++){
    const angle=Math.atan2(p.getZ(i),p.getX(i)),edge=Math.max(0,1-p.getY(i));
    const rib=1+.035*Math.cos(angle*8)*edge**2;
    p.setX(i,p.getX(i)*rib);p.setZ(i,p.getZ(i)*rib);
    tint.setHex(0x7831bb).lerp(new THREE.Color(0xe5b5ff),Math.min(1,edge*.8)).multiplyScalar(.84+.16*Math.cos(angle*8)**2);
    colors.push(tint.r,tint.g,tint.b);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}

/** Four shared batches: gelatinous bell, luminous rim, internal lantern, and
 * six softly trailing tentacles. No point lights or postprocessing are added. */
export class LanternJellyfishRenderer {
  constructor(world) {
    const fish=world.jellyfish??[];
    for(const f of fish)if(!finite(f)||typeof f.id!=='string'||![f.headRadius,f.tentacleLength,f.phase].every(Number.isFinite)||f.headRadius<=0||f.tentacleLength<=0)
      throw new TypeError('Lantern jellyfish need a named finite pose, phase and positive bell/tentacle dimensions.');
    this.ids=fish.map(f=>f.id);this.group=new THREE.Group();this.group.name='purple-lantern-jellyfish';
    this.animalsById=new Map(this.ids.map(id=>[id,null]));
    this.candidatePool=Array.from({length:this.ids.length},()=>({fish:null,distance:0}));this.candidates=[];
    this.geometries={bell:bellGeometry(),rim:new THREE.TorusGeometry(1,.055,6,32),core:new THREE.SphereGeometry(1,12,10),arm:new THREE.CylinderGeometry(.65,1,1,5,1,true)};
    this.geometries.rim.rotateX(Math.PI/2);
    const rim=this.geometries.rim.attributes.position;
    for(let i=0;i<rim.count;i++)rim.setY(i,rim.getY(i)+Math.sin(Math.atan2(rim.getZ(i),rim.getX(i))*8)*.045);
    this.geometries.rim.computeVertexNormals();
    this.materials={
      bell:new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,roughness:.22,clearcoat:.8,clearcoatRoughness:.24,emissive:0x54207e,emissiveIntensity:.55}),
      rim:new THREE.MeshStandardMaterial({color:0xc18cf4,emissive:0xa243e8,emissiveIntensity:1.3,roughness:.48}),
      core:new THREE.MeshStandardMaterial({color:0xe4b6ff,emissive:0xc87bff,emissiveIntensity:1.8,roughness:.35}),
      arm:new THREE.MeshStandardMaterial({color:0x9a50cd,emissive:0x582582,emissiveIntensity:.65,roughness:.62}),
    };
    this.batches={};
    for(const name of ['bell','rim','core','arm']){
      const mesh=new THREE.InstancedMesh(this.geometries[name],this.materials[name],fish.length*(name==='arm'?ARMS*LINKS:1));
      mesh.name=`lantern-jellyfish-${name}`;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=true;
      this.group.add(mesh);this.batches[name]=mesh;
    }
    this.batchEntries=Object.entries(this.batches);
    this.stingerTint=new THREE.Color(0xffb4e7);this.normalTint=new THREE.Color(0xffffff);this.tentaclePoint={};
    this.transform=new THREE.Object3D();this.a=new THREE.Vector3();this.b=new THREE.Vector3();this.direction=new THREE.Vector3();this.disposed=false;
    this.update(world,0,false);
  }
  pose(mesh,index,position,scaleX,scaleY,scaleZ,rotation) {
    this.transform.position.copy(position);this.transform.scale.set(scaleX,scaleY,scaleZ);
    if(rotation)this.transform.quaternion.copy(rotation);else this.transform.quaternion.identity();
    this.transform.updateMatrix();mesh.setMatrixAt(index,this.transform.matrix);
  }
  point(fish,arm,joint,target,reducedMotion){
    const p=lanternTentaclePoint(fish,arm,joint,this.tentaclePoint,reducedMotion);
    target.set(p.x/SCALE,p.z/SCALE,p.y/SCALE);
  }
  update(world,_time,reducedMotion=false,camera,quality={}) {
    if(this.disposed)return;
    let count=0;
    // Fixed slots preserve authored tie ordering and accept restored actor
    // objects without rebuilding a Map or allocating selection records.
    for(const id of this.ids)this.animalsById.set(id,null);
    for(const fish of world.jellyfish??[])if(this.animalsById.has(fish.id))this.animalsById.set(fish.id,fish);
    const budget=quality.mobile?16:28;
    const range=capRenderDistance(quality,quality.mobile?45:70);
    const ordered=this.candidates;let candidates=0;
    for(const id of this.ids){
      const fish=this.animalsById.get(id);
      if(!fish||fish.squidRespawnIn>0)continue;
      const distance=camera?Math.hypot(fish.x/SCALE-camera.x,fish.z/SCALE-camera.y,fish.y/SCALE-camera.z):0;
      if(!(distance<range))continue;
      const candidate=this.candidatePool[candidates];candidate.fish=fish;candidate.distance=distance;ordered[candidates++]=candidate;
    }
    ordered.length=candidates;ordered.sort(nearestFirst);
    for(let selected=0;selected<Math.min(ordered.length,budget);selected++){
      const fish=ordered[selected].fish;
      const index=count++;
      const r=fish.headRadius/SCALE,motion=getLanternMotion(fish,reducedMotion),width=r*motion.widthScale;
      this.a.set(fish.x/SCALE,fish.z/SCALE,fish.y/SCALE);
      this.pose(this.batches.bell,index,this.a,width,r*motion.heightScale,width);
      this.a.y-=r*.18;this.pose(this.batches.rim,index,this.a,width,width,width);
      this.a.y+=r*.05;this.pose(this.batches.core,index,this.a,r*.26,r*.55,r*.26);
      for(let arm=0;arm<ARMS;arm++)for(let link=0;link<LINKS;link++){
        this.point(fish,arm,link,this.a,reducedMotion);this.point(fish,arm,link+1,this.b,reducedMotion);this.direction.subVectors(this.b,this.a);
        const span=this.direction.length(),thickness=r*.035*(1-link/LINKS*.55);
        this.transform.quaternion.setFromUnitVectors(UP,this.direction.divideScalar(span));
        this.a.add(this.b).multiplyScalar(.5);
        const part=index*ARMS*LINKS+arm*LINKS+link;
        this.pose(this.batches.arm,part,this.a,thickness,span,thickness,this.transform.quaternion);
        this.batches.arm.setColorAt(part,fish.giant&&link>=2?this.stingerTint:this.normalTint);
      }
    }
    this.group.visible=count>0;
    for(const [name,mesh] of this.batchEntries){
      mesh.count=count*(name==='arm'?ARMS*LINKS:1);uploadAttributePrefix(mesh.instanceMatrix,mesh.count);
      if(mesh.instanceColor)uploadAttributePrefix(mesh.instanceColor,mesh.count);
      if(count)mesh.computeBoundingSphere();
    }
  }
  dispose() {
    if(this.disposed)return;this.disposed=true;this.group.removeFromParent();
    for(const mesh of Object.values(this.batches))mesh.dispose();
    for(const geometry of Object.values(this.geometries))geometry.dispose();
    for(const material of Object.values(this.materials))material.dispose();this.group.clear();
  }
}
