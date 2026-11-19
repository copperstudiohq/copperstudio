import * as THREE from './vendor/three.module.js';
import { PlantMesh, plantRandom } from './plant-mesh.js';
import { createPlantSurfaceMaps } from './plant-surfaces.js';
import { createBotanicalMaterial } from './plant-renderer.js';
import { updateInstancedWindBounds } from './render-visibility.js';
import {nearBasinWall} from './icy-basin.js';
import {capRenderDistance} from './render-distance.js';

const point=(x,y,z)=>new THREE.Vector3(x,y,z);

/** Low rooted frost grass and small pale flowers grow above the waterline. */
export function tundraPlantGeometry(kind,detail=true) {
  const plant=new PlantMesh(),rng=plantRandom(kind==='grass'?0x72a11:0x72b22);
  if(!['grass','flower'].includes(kind))throw new TypeError(`Unknown tundra plant: ${kind}`);
  for(let stem=0;stem<(kind==='grass'?9:3);stem++){
    const angle=stem*2.39996,height=.55+rng()*.4;
    const root=point(Math.cos(angle)*.05,0,Math.sin(angle)*.05);
    const tip=point(Math.cos(angle)*.28,height,Math.sin(angle)*.25);
    if(kind==='grass')plant.leaf(root,tip,.03+rng()*.02,(u)=>u>.8?0xffffff:0xe6f1f7,
      {segments:detail?8:4,columns:2,curve:.025,cup:.3,twist:.2});
    else{
      plant.tube([root,root.clone().lerp(tip,.5),tip],[.018,.013,.008],0xe2edf4,detail?6:4);
      plant.ellipsoid(tip,point(.045,.05,.045),0xf6f9fc,{segments:8,rings:4});
      for(let petal=0;petal<5;petal++){
        const a=petal*Math.PI*2/5;
        plant.leaf(tip,tip.clone().add(point(Math.cos(a)*.14,.045,Math.sin(a)*.14)),.045,
          0xf6faff,{segments:detail?5:3,columns:2,curve:.015,cup:.4});
      }
      plant.leaf(root,root.clone().add(point(Math.cos(angle+.7)*.18,.27,Math.sin(angle+.7)*.18)),.055,0xe8f2f8,{segments:4,columns:2});
    }
  }
  return plant.geometry();
}

/** Four shared batches, no lights or shadows, and an explicit visible budget. */
export class IcebergTundraRenderer {
  constructor(world,quality={}) {
    this.group=new THREE.Group();this.group.name='iceberg-tundra-plants';
    this.clock={value:0};this.far={value:capRenderDistance(quality,quality.mobile?32:48)};this.disposed=false;
    this.maps=createPlantSurfaceMaps('frond',quality.mobile?128:256);
    const pixels=this.maps.map.image.data;
    for(let i=0;i<pixels.length;i+=4){const frost=242+Math.round(pixels[i]/255*13);pixels[i]=frost;pixels[i+1]=Math.min(255,frost+2);pixels[i+2]=255;}
    this.maps.map.needsUpdate=true;
    this.material=createBotanicalMaterial({id:'tundra',biome:'forest'},this.maps,this.clock,this.far);
    this.batches=[];const transform=new THREE.Object3D();
    for(const kind of ['grass','flower']){
      const entries=[...(world.tundra?.plants??[]),...(world.starterPlants??[])].filter(p=>p.kind===kind&&!nearBasinWall(world.platforms,p.x,p.y,12)).map(p=>{
        if(![p.x,p.y,p.z,p.heading,p.height,p.width].every(Number.isFinite)||p.width<=0||p.height<=0)throw new TypeError(`Invalid tundra plant: ${p.id}`);
        transform.position.set(p.x/25,p.z/25,p.y/25);transform.rotation.set(0,p.heading,0);
        transform.scale.set(p.width/25,p.height/25,p.width/25);transform.updateMatrix();
        return {id:p.id,position:transform.position.clone(),matrix:transform.matrix.clone()};
      });
      const batch={entries};
      for(const [level,detail]of [['high',true],['low',false]]){
        const mesh=new THREE.InstancedMesh(tundraPlantGeometry(kind,detail),this.material,entries.length);
        mesh.name=`tundra-${kind}-${level}`;mesh.count=0;mesh.visible=false;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.group.add(mesh);batch[level]=mesh;
      }
      this.batches.push(batch);
    }
  }
  update(time,reducedMotion=false,camera,quality={},world=null) {
    if(this.disposed)return;this.clock.value=0;
    if(!camera)return;const mobile=Boolean(quality.mobile);this.far.value=capRenderDistance(quality,mobile?32:48);
    const harvestChanged=this.harvestVersion!==world?.harvestVersion||this.harvestedPlants!==world?.harvestedPlants;
    this.harvestVersion=world?.harvestVersion;this.harvestedPlants=world?.harvestedPlants;
    if(!harvestChanged&&this.lastCamera&&this.mobile===mobile&&this.cullRange===this.far.value&&camera.distanceToSquared(this.lastCamera)<.25)return;
    this.lastCamera=camera.clone();this.mobile=mobile;this.cullRange=this.far.value;
    for(const batch of this.batches){
      let high=0,low=0;
      const candidates=batch.entries.map(entry=>({entry,distance:entry.position.distanceTo(camera)}))
        .filter(p=>p.distance<this.far.value).sort((a,b)=>a.distance-b.distance);
      for(const {entry,distance}of candidates){
        const near=distance<(mobile?10:18)&&high<(mobile?18:36);
        if(!near&&low>=(mobile?40:90))continue;
        let matrix=entry.matrix;
        if((world?.harvestedPlants?.[entry.id]??0)>(world?.elapsed??0)){
          this.harvestMatrix??=new THREE.Matrix4();matrix=this.harvestMatrix.copy(entry.matrix).scale(new THREE.Vector3(.8,.45,.8));
        }
        (near?batch.high:batch.low).setMatrixAt(near?high++:low++,matrix);
      }
      for(const [mesh,count]of [[batch.high,high],[batch.low,low]]){
        mesh.count=count;mesh.visible=count>0;mesh.instanceMatrix.needsUpdate=true;
        updateInstancedWindBounds(mesh,.024,.024);
      }
    }
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.group.removeFromParent();
    this.group.children.forEach(mesh=>{mesh.dispose();mesh.geometry.dispose();});this.material.dispose();this.maps.dispose();this.group.clear();}
}
