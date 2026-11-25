import {capRenderDistance} from './render-distance.js';
import * as THREE from './vendor/three.module.js';
import { createRedFishAnatomy } from './red-fish-anatomy.js';
import { createCreatureSurfaceMaps, applyCreatureSurface } from './creature-materials.js';
import { updateInstancedWindBounds } from './render-visibility.js';
import { RedFishTendrilRenderer } from './red-fish-tendril-renderer.js';
import { applyRedFishSkin, redFishAppearance } from './red-fish-skin.js';
import {getWildlifeRenderPopulation} from './wildlife-lifecycle.js';
import {getLifecycleScale} from './lifecycle-scale.js';
import {uploadAttributePrefix} from './dynamic-attribute-upload.js';

const finite = p => p && Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z);
const nearestFirst=(a,b)=>a.distance-b.distance;

/** Smooth flex around an attached base, including its exact normal derivative.
 * Vertex colours and neutral biological relief keep the reference red intact. */
function swimmingMaterial(maps, clock, strength) {
  const material = applyCreatureSurface(new THREE.MeshPhysicalMaterial({ color: 0xffffff,
    vertexColors: true, roughness: .7, clearcoat: .08, clearcoatRoughness: .42,
    ior: 1.28, specularIntensity: .10,
    side: THREE.DoubleSide, forceSinglePass: true }), maps, .10);
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, { redFishTime: clock, redFishStrength: strength });
    shader.vertexShader = `attribute float fishWave,fishWaveSlope;
      uniform float redFishTime,redFishStrength;
      float redFishPhase(){
        #ifdef USE_INSTANCING
          return instanceMatrix[3].x*.31+instanceMatrix[3].z*.17;
        #else
          return 0.;
        #endif
      }
      ${shader.vertexShader}`
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        float fishPhase=redFishTime*1.8+redFishPhase();
        float fishA=fishPhase+position.z*11.,fishB=fishPhase*.83+position.z*9.;
        float fishDx=.018*(fishWaveSlope*sin(fishA)+fishWave*11.*cos(fishA))*redFishStrength;
        float fishDy=.012*(fishWaveSlope*sin(fishB)+fishWave*9.*cos(fishB))*redFishStrength;
        objectNormal.z-=fishDx*objectNormal.x+fishDy*objectNormal.y;objectNormal=normalize(objectNormal);`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed.x+=sin(fishA)*fishWave*.018*redFishStrength;
        transformed.y+=sin(fishB)*fishWave*.012*redFishStrength;`);
  };
  material.customProgramCacheKey = () => 'croba-red-crescent-fish-wave-v1';
  return material;
}

/** Four shared batches draw all variants of the original crescent fish.
 * Simulation coordinates use 25 units/metre and heading=atan2(vy,vx).
 */
export class RedFishRenderer {
  constructor(world, quality = {}) {
    const fish = getWildlifeRenderPopulation(world,'red-fish');
    this.validationIds=new Set();this.validationOrder=[];
    this.validate(fish); this.capacity = fish.length; this.disposed = false;
    this.group = new THREE.Group(); this.group.name = 'red-crescent-fish';
    this.clock = { value: 0 }; this.strength = { value: 1 };
    this.geometry = createRedFishAnatomy(quality);
    // The anatomy's rest filaments define the complete model dimensions.
    // Gameplay draws one connected tube batch from authoritative physics.
    this.geometry.filaments.dispose(); delete this.geometry.filaments;
    this.surfaceMaps = { skin: createCreatureSurfaceMaps('fish-skin', quality.mobile ? 64 : 128) };
    this.materials = {
      body: applyCreatureSurface(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true,
        // A camera-mounted dive lamp hits these broad cheeks head-on. Subdued
        // wet-tissue Fresnel prevents a white highlight covering their red.
        roughness: .7, clearcoat: .18, clearcoatRoughness: .36,
        ior: 1.28, specularIntensity: .10, metalness: 0 }), this.surfaceMaps.skin, .10),
      eyes: new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true,
        roughness: .16, clearcoat: .7, clearcoatRoughness: .12, metalness: 0, emissiveIntensity: 0 }),
      appendages: swimmingMaterial(this.surfaceMaps.skin, this.clock, this.strength),
    };
    this.materials.tendrils = applyRedFishSkin(this.materials.body.clone(), true);
    applyRedFishSkin(this.materials.body); applyRedFishSkin(this.materials.appendages);
    this.meshes = {};
    for (const [name, geometry] of Object.entries(this.geometry)) {
      if (name !== 'eyes') geometry.setAttribute('fishAppearance', new THREE.InstancedBufferAttribute(new Float32Array(this.capacity), 1).setUsage(THREE.DynamicDrawUsage));
      const material = this.materials[name === 'body' || name === 'eyes' ? name : 'appendages'];
      const mesh = new THREE.InstancedMesh(geometry, material, this.capacity);
      mesh.name = `red-fish-${name}`; mesh.count = 0; mesh.visible = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = true;
      mesh.castShadow = false; mesh.receiveShadow = true; this.meshes[name] = mesh; this.group.add(mesh);
    }
    this.tendrils = new RedFishTendrilRenderer(this.capacity, this.materials.tendrils, quality);
    this.group.add(this.tendrils.mesh);
    this.pose = new THREE.Object3D(); this.selected = [];
    this.candidatePool=Array.from({length:this.capacity},()=>({animal:null,distance:0}));this.candidates=[];
    this.meshList=Object.values(this.meshes);this.meshEntries=Object.entries(this.meshes);
    this.appearanceAttributes=[this.geometry.body.attributes.fishAppearance,this.geometry.fins.attributes.fishAppearance];
  }

  validate(fish) {
    let idsChanged=fish.length!==this.validationOrder.length;
    for (let i=0;i<fish.length;i++) {
      const animal=fish[i];
      if (typeof animal?.id !== 'string' || !finite(animal)
        || !Number.isFinite(animal.heading)||!Number.isFinite(animal.pitch??0)||!Number.isFinite(animal.lengthMeters)
        || animal.lengthMeters <= 0) throw new TypeError('Red fish need unique names, a finite pose and a positive metre length.');
      if(animal.id!==this.validationOrder[i])idsChanged=true;
    }
    if(idsChanged){
      const ids=this.validationIds;ids.clear();
      for(const animal of fish){
        if(ids.has(animal.id))throw new TypeError('Red fish need unique names, a finite pose and a positive metre length.');
        ids.add(animal.id);
      }
      for(let i=0;i<fish.length;i++)this.validationOrder[i]=fish[i].id;
      this.validationOrder.length=fish.length;
    }
  }

  update(world, time, reducedMotion = false, camera, quality = {}) {
    if (this.disposed) return;
    const fish = getWildlifeRenderPopulation(world,'red-fish'); this.validate(fish);
    if (fish.length > this.capacity) throw new RangeError('Red fish population exceeds its prepared render capacity.');
    this.clock.value = Number.isFinite(time) ? time : 0; this.strength.value = reducedMotion ? 0 : 1;
    const mobile = Boolean(quality.mobile), far = capRenderDistance(quality,mobile ? 38 : 70);
    const hasCamera=finite(camera),candidates=this.candidates;let candidateCount=0;
    for(const animal of fish){
      if(animal.lifecycleInactive||animal.squidRespawnIn>0)continue;
      const distance=hasCamera?Math.max(0,Math.hypot(animal.x/25-camera.x,animal.z/25-camera.y,animal.y/25-camera.z)
        -animal.lengthMeters*getLifecycleScale(animal)*.64):0;
      if(distance>=far)continue;
      const candidate=this.candidatePool[candidateCount];candidate.animal=animal;candidate.distance=distance;
      candidates[candidateCount++]=candidate;
    }
    candidates.length=candidateCount;candidates.sort(nearestFirst);
    this.selected.length = 0;
    this.tendrils.begin();
    let small = 0, large = 0, maximumLength = 0;
    for (const { animal } of candidates) {
      const length=animal.lengthMeters*getLifecycleScale(animal),big=length>1;
      if (camera && (big ? large >= (mobile ? 2 : 6) : small >= (mobile ? 20 : 48))) continue;
      big ? large++ : small++; this.selected.push(animal.id);
      this.tendrils.fish(animal, reducedMotion);
      maximumLength = Math.max(maximumLength,length);
      this.pose.position.set(animal.x / 25, animal.z / 25, animal.y / 25);
      this.pose.rotation.set(animal.pitch ?? 0, -animal.heading - Math.PI / 2, 0, 'YXZ');
      this.pose.scale.setScalar(length); this.pose.updateMatrix();
      const index = this.selected.length - 1;
      for (const mesh of this.meshList) mesh.setMatrixAt(index, this.pose.matrix);
      const appearance=redFishAppearance(animal);
      for (const attribute of this.appearanceAttributes) attribute.setX(index,appearance);
    }
    this.group.visible = this.selected.length > 0;
    this.tendrils.finish();
    for (const attribute of this.appearanceAttributes) uploadAttributePrefix(attribute,this.selected.length);
    for (const [name, mesh] of this.meshEntries) {
      mesh.count = this.selected.length; mesh.visible = mesh.count > 0;uploadAttributePrefix(mesh.instanceMatrix,mesh.count);
      if (mesh.count) {
        updateInstancedWindBounds(mesh, name === 'fins' || name === 'filaments' ? .018 : 0, 0);
        if (name === 'fins' || name === 'filaments') mesh.boundingSphere.radius += .012 * maximumLength;
      }
    }
  }

  dispose() {
    if (this.disposed) return; this.disposed = true; this.group.removeFromParent();
    this.tendrils.dispose();
    Object.values(this.meshes).forEach(mesh => mesh.dispose());
    Object.values(this.geometry).forEach(geometry => geometry.dispose());
    Object.values(this.materials).forEach(material => material.dispose());
    Object.values(this.surfaceMaps).forEach(maps => maps.dispose()); this.group.clear();
  }
}
