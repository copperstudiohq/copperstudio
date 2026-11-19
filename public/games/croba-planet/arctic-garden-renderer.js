import * as THREE from './vendor/three.module.js';
import { PlantMesh, plantRandom } from './plant-mesh.js';
import {surfaceKelpGeometry,surfaceKelpMaterial,SURFACE_KELP_WIND} from './surface-kelp.js';
import { createBotanicalMaterial } from './plant-renderer.js';
import { createPlantSurfaceMaps } from './plant-surfaces.js';
import { updateInstancedWindBounds } from './render-visibility.js';
import {capRenderDistance} from './render-distance.js';

/** Ribbed, curling seagrass blades with dark basal sheaths and amber tips. */
export function orangeGrassGeometry(variant = 0, detail = true) {
  const mesh = new PlantMesh(), rng = plantRandom(0x0a6a55+variant*997);
  const tint = new THREE.Color(), rootColor = new THREE.Color(0x714022);
  const bladeColor = new THREE.Color(0xe18325), tipColor = new THREE.Color(0xf8c26a);
  for (let blade=0; blade<16; blade++) {
    const angle = blade*2.39996+rng()*.5, height = .45+rng()*.55;
    const root = new THREE.Vector3(Math.cos(angle)*.10, .015, Math.sin(angle)*.10);
    const tip = new THREE.Vector3(Math.cos(angle)*(.22+rng()*.35), height, Math.sin(angle)*.44);
    mesh.leaf(root, tip, .060+rng()*.035, (u,v) => {
      tint.copy(rootColor).lerp(bladeColor, Math.min(1,u*4)).lerp(tipColor, Math.max(0,(u-.6)*1.7));
      return tint.clone().multiplyScalar(.82+.18*Math.cos((v-.5)*Math.PI)**2).getHex();
    }, {segments: detail?6:3, columns: detail?3:1, curve: .035+rng()*.08, cup: .32, twist: .4});
    if (detail) mesh.tube([root, root.clone().lerp(tip,.25)], [.018,.008], 0x965227, 4);
  }
  // Interwoven fallen blades cover the basal gaps between the upright leaves.
  for(let i=0;i<8;i++){
    const a=i*2.39996,root=new THREE.Vector3(Math.cos(a)*.62,.008,Math.sin(a)*.62),tip=new THREE.Vector3(-Math.cos(a+.23)*.62,.025,-Math.sin(a+.23)*.62);
    mesh.leaf(root,tip,.085,0x965224,{segments:2,columns:1,curve:.025,cup:.2});
  }
  return mesh.geometry();
}

/** Low interwoven grass blades form the meadow's opaque basal cover. */
export function orangeThatchGeometry(){
 const m=new PlantMesh();for(let i=0;i<6;i++){const a=i*2.39996;
  m.leaf(new THREE.Vector3(Math.cos(a)*.64,.012,Math.sin(a)*.64),new THREE.Vector3(-Math.cos(a+.2)*.64,.035,-Math.sin(a+.2)*.64),.14,i%2?0x945225:0xbc6e2b,{segments:2,columns:1,curve:.02,cup:.3});
 }return m.geometry({normalizeHeight:false});
}

/** Shared opaque PBR batches with bounded near/far instance budgets. */
export class ArcticGardenRenderer {
  constructor(world, quality = {}) {
    this.group = new THREE.Group(); this.group.name = 'arctic-underwater-gardens';
    this.clock = {value:0}; this.far = {value:capRenderDistance(quality,quality.mobile?36:58)};
    this.maps = createPlantSurfaceMaps('frond',quality.mobile?128:256);
    this.materials = []; this.geometries = []; this.batches = []; this.disposed=false;
    const transform = new THREE.Object3D();
    for (const kind of ['kelp','grass']) {
      const material = kind==='kelp'?surfaceKelpMaterial(this.maps,this.clock,this.far):
        createBotanicalMaterial({id:`arctic-${kind}`,biome:'arctic'},this.maps,this.clock,this.far);
      material.roughness=kind==='kelp' ? .64 : .82;
      this.materials.push(material);
      for (const variant of [0,1]) {
        const entries=(world.arcticGardens?.[kind]??[]).filter(p=>p.variant===variant).map(p=>{
          if (![p.x,p.y,p.z,p.width,p.height,p.heading].every(Number.isFinite)||p.width<=0||p.height<=0)
            throw new TypeError(`Invalid Arctic garden plant: ${p.id??'unnamed'}`);
          transform.position.set(p.x/25,p.z/25,p.y/25);transform.rotation.set(0,p.heading,0);
          transform.scale.set(p.width/25,p.height/25,p.width/25);transform.updateMatrix();
          return {id:p.id,position:transform.position.clone(),matrix:transform.matrix.clone()};
        });
        const batch={kind,entries};
        for (const [level,detail] of [['high',true],['low',false]]) {
          const geometry=kind==='grass'?orangeGrassGeometry(variant,detail):surfaceKelpGeometry(variant,detail);
          this.geometries.push(geometry);
          const mesh=new THREE.InstancedMesh(geometry,material,entries.length);
          mesh.name=`arctic-${kind}-${variant}-${level}`;mesh.count=0;mesh.visible=false;
          mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=true;
          batch[level]=mesh;this.group.add(mesh);
        }
        if(kind==='kelp'){
          const bounds=batch.high.geometry.boundingBox.clone().union(batch.low.geometry.boundingBox);
          for(const entry of entries){
            entry.bounds=bounds.clone().applyMatrix4(entry.matrix);
            const padding=SURFACE_KELP_WIND*Math.max(new THREE.Vector3().setFromMatrixColumn(entry.matrix,0).length(),
              new THREE.Vector3().setFromMatrixColumn(entry.matrix,2).length());
            entry.bounds.min.x-=padding;entry.bounds.max.x+=padding;
            entry.bounds.min.z-=padding;entry.bounds.max.z+=padding;
          }
        }
        this.batches.push(batch);
      }
    }
    const grassMaterial=this.materials[1],entries=this.batches.filter(b=>b.kind==='grass').flatMap(b=>b.entries),geometry=orangeThatchGeometry();
    this.geometries.push(geometry);this.thatch=new THREE.InstancedMesh(geometry,grassMaterial,entries.length);this.thatch.name='dense-orange-grass-understory';this.thatch.count=0;this.thatch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.group.add(this.thatch);this.thatchEntries=entries;
  }

  update(time,reducedMotion=false,camera,quality={}) {
    if(this.disposed)return;
    this.clock.value=reducedMotion||!Number.isFinite(time)?0:time;
    if(!camera)return;
    const mobile=Boolean(quality.mobile);this.far.value=capRenderDistance(quality,mobile?36:58);
    if(this.lastCamera&&this.mobile===mobile&&this.cullRange===this.far.value&&camera.distanceToSquared(this.lastCamera)<.36)return;
    this.lastCamera=camera.clone();this.mobile=mobile;this.cullRange=this.far.value;
    const thatch=this.thatchEntries.map(entry=>({entry,d:camera.distanceToSquared(entry.position)})).filter(p=>p.d<this.far.value**2).sort((a,b)=>a.d-b.d).slice(0,mobile?700:1600);
    thatch.forEach(({entry},i)=>this.thatch.setMatrixAt(i,entry.matrix));this.thatch.count=thatch.length;this.thatch.visible=thatch.length>0;this.thatch.instanceMatrix.needsUpdate=true;if(thatch.length)this.thatch.computeBoundingSphere();
    for(const batch of this.batches) {
      const candidates=batch.entries.map(entry=>({entry,distance:batch.kind==='kelp'?entry.bounds.distanceToPoint(camera):camera.distanceTo(entry.position)}))
        .filter(p=>p.distance<this.far.value).sort((a,b)=>a.distance-b.distance);
      let high=0,low=0;
      const highBudget=mobile?12:24,lowBudget=batch.kind==='grass'?(mobile?90:160):(mobile?45:100);
      for(const {entry,distance} of candidates) {
        const near=distance<(mobile?12:22)&&high<highBudget;
        if(!near&&low>=lowBudget)continue;
        const mesh=near?batch.high:batch.low,index=near?high++:low++;
        mesh.setMatrixAt(index,entry.matrix);
      }
      for(const [mesh,count] of [[batch.high,high],[batch.low,low]]) {
        mesh.count=count;mesh.visible=count>0;mesh.instanceMatrix.needsUpdate=true;
        const wind=batch.kind==='kelp'?SURFACE_KELP_WIND:.058;
        updateInstancedWindBounds(mesh,wind,wind);
      }
    }
  }

  dispose() {
    if(this.disposed)return;this.disposed=true;this.group.removeFromParent();
    this.group.children.forEach(mesh=>mesh.dispose());
    this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());
    this.maps.dispose();this.group.clear();
  }
}
