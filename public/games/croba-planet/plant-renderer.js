import * as THREE from "./vendor/three.module.js";
import { getPlantSpecies } from "./plant-catalog.js";
import { createArcticPlantGeometry } from "./plant-arctic.js";
import { createOceanPlantGeometry } from "./plant-ocean.js";
import { createForestPlantGeometry } from "./plant-forest.js";
import { createPlantSurfaceMaps } from "./plant-surfaces.js";
import { updateInstancedWindBounds } from "./render-visibility.js";
import {capRenderDistance} from './render-distance.js';

const SCALE = 25;
const UP = new THREE.Vector3(0, 1, 0);
const factories = { arctic: createArcticPlantGeometry, "blue-ocean": createOceanPlantGeometry,
  forest: createForestPlantGeometry };
const finitePoint = (point) => point && [point.x, point.y, point.z].every(Number.isFinite);

/** @typedef {{id:string,kind:string,x:number,y:number,z:number,height:number,width:number,heading:number,seed:number,variant:number,normal?:number[]}} PreparedPlant */

/** A shared-clock material combines biological relief, localized glow, a gentle
 * current/wind bend and distance fading. It remains an ordinary opaque PBR pass.
 */
export function createBotanicalMaterial(species, maps, clock = { value: 0 }, far = { value: 42 }) {
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, map: maps.map,
    normalMap: maps.normalMap, roughnessMap: maps.roughnessMap, roughness: .95,
    normalScale: new THREE.Vector2(.34, .34), metalness: 0, vertexColors: true,
    side: THREE.DoubleSide, forceSinglePass: true, alphaHash: true });
  material.name = `botanical-${species.id}`;
  const wind = { value: species.biome === "forest" ? .024 : .058 };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { botanicalTime: clock, botanicalFar: far, botanicalWind: wind });
    shader.vertexShader = `attribute float plantGlow;
      uniform float botanicalTime,botanicalFar,botanicalWind;
      varying float vBotanicalGlow,vBotanicalFade;
      float botanicalPhase(){
        #ifdef USE_INSTANCING
          return instanceMatrix[3].x*.31+instanceMatrix[3].z*.19;
        #else
          return 0.;
        #endif
      }
      vec2 botanicalBend(float y,float phase){float w=clamp(y,0.,1.);
        return vec2(sin(botanicalTime*.61+phase+y*2.8),cos(botanicalTime*.43+phase+y*2.1))*w*w*botanicalWind;}
      vec2 botanicalSlope(float y,float phase){float w=clamp(y,0.,1.);
        vec2 wave=vec2(sin(botanicalTime*.61+phase+y*2.8),cos(botanicalTime*.43+phase+y*2.1));
        vec2 slope=vec2(cos(botanicalTime*.61+phase+y*2.8)*2.8,-sin(botanicalTime*.43+phase+y*2.1)*2.1);
        return (wave*2.*w+slope*w*w)*botanicalWind;}
      ${shader.vertexShader}`
      .replace("#include <beginnormal_vertex>", `#include <beginnormal_vertex>
        objectNormal.y-=dot(botanicalSlope(position.y,botanicalPhase()),objectNormal.xz);
        objectNormal=normalize(objectNormal);`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        transformed.xz+=botanicalBend(position.y,botanicalPhase());vBotanicalGlow=plantGlow;`)
      .replace("#include <worldpos_vertex>", `#include <worldpos_vertex>
        vec4 botanicalRoot=vec4(0.,0.,0.,1.);
        #ifdef USE_INSTANCING
          botanicalRoot=instanceMatrix*botanicalRoot;
        #endif
        botanicalRoot=modelMatrix*botanicalRoot;
        vBotanicalFade=1.-smoothstep(botanicalFar-5.,botanicalFar,distance(cameraPosition,botanicalRoot.xyz));`);
    shader.fragmentShader = `varying float vBotanicalGlow,vBotanicalFade;\n${shader.fragmentShader}`
      .replace("#include <alphahash_fragment>", `
        if(vBotanicalFade<.9999){
          diffuseColor.a*=vBotanicalFade;
          #include <alphahash_fragment>
        }`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        totalEmissiveRadiance+=diffuseColor.rgb*vBotanicalGlow*.75;`);
  };
  material.customProgramCacheKey = () => "croba-botanical-surface-v2";
  return material;
}

/** Prepared, passable biome flora. Near and far batches share botanical organ
 * counts; distance only reduces surface tessellation and the number in view.
 */
export class BiomePlantRenderer {
  /** @param {{plants?:PreparedPlant[]}} world @param {{mobile?:boolean}} [quality] */
  constructor(world, quality = {}) {
    this.group = new THREE.Group(); this.group.name = "prepared-biome-botany";
    this.clock = { value: 0 }; this.far = { value: capRenderDistance(quality,quality.mobile ? 32 : 48) };
    this.disposed = false; this.batches = []; this.maps = {}; this.materials = new Map();
    this.geometries = []; this.entries = [];
    const transform = new THREE.Object3D(), normal = new THREE.Vector3(), yaw = new THREE.Quaternion();
    for (const patch of world.plants ?? []) {
      const species = getPlantSpecies(patch.kind);
      if (!species || !finitePoint(patch) || ![patch.height, patch.width, patch.heading].every(Number.isFinite)
        || patch.height <= 0 || patch.width <= 0 || ![0, 1].includes(patch.variant))
        throw new TypeError(`Invalid prepared plant: ${patch?.id ?? "unnamed"}`);
      if (!this.materials.has(patch.kind)) {
        this.maps[species.family] ??= createPlantSurfaceMaps(species.family, quality.mobile ? 128 : 256);
        this.materials.set(patch.kind, createBotanicalMaterial(species,
          this.maps[species.family], this.clock, this.far));
      }
      transform.position.set(patch.x / SCALE, patch.z / SCALE, patch.y / SCALE);
      const n = patch.normal ?? [0, 0, 1]; normal.set(n[0], n[2], n[1]);
      if (!finitePoint(normal) || normal.lengthSq() < .5) throw new TypeError(`Invalid plant ground normal: ${patch.id}`);
      transform.quaternion.setFromUnitVectors(UP, normal.normalize())
        .multiply(yaw.setFromAxisAngle(UP, patch.heading));
      transform.scale.set(patch.width / SCALE, patch.height / SCALE, patch.width / SCALE);
      transform.updateMatrix();
      this.entries.push({ id:patch.id, kind: patch.kind, variant: patch.variant, position: transform.position.clone(),
        matrix: transform.matrix.clone(), tint: new THREE.Color([0xffffff, 0xe4ebe8, 0xf0e9e2][patch.seed % 3]) });
    }
    for (const [kind, material] of this.materials) for (const variant of [0, 1]) {
      const entries = this.entries.filter((entry) => entry.kind === kind && entry.variant === variant);
      if (!entries.length) continue;
      const species = getPlantSpecies(kind), batch = { entries, high: null, low: null,
        wind: species.biome === "forest" ? .024 : .058 };
      for (const [level, detail] of [["high", true], ["low", false]]) {
        const geometry = factories[species.biome](kind, { detail, variant }); this.geometries.push(geometry);
        const mesh = new THREE.InstancedMesh(geometry, material, entries.length);
        mesh.name = `${kind}-${variant}-${level}`; mesh.count = 0; mesh.visible = false;
        mesh.frustumCulled = true; mesh.receiveShadow = true; mesh.castShadow = false;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.setColorAt(0, new THREE.Color(0xffffff));
        batch[level] = mesh; this.group.add(mesh);
      }
      this.batches.push(batch);
    }
    this.group.visible = false;
  }

  update(time, reducedMotion = false, cameraPosition, quality = {}, world=null) {
    if (this.disposed) return;
    this.clock.value = reducedMotion || !Number.isFinite(time) ? 0 : time;
    if (!finitePoint(cameraPosition)) return;
    const mobile = Boolean(quality.mobile); this.far.value = capRenderDistance(quality,mobile ? 32 : 48);
    const harvestChanged=this.harvestVersion!==world?.harvestVersion||this.harvestedPlants!==world?.harvestedPlants;
    this.harvestVersion=world?.harvestVersion;this.harvestedPlants=world?.harvestedPlants;
    if (!harvestChanged&&this.lastCamera && this.mobile === mobile && this.cullRange===this.far.value && cameraPosition.distanceToSquared(this.lastCamera) < .16) return;
    this.lastCamera = cameraPosition.clone(); this.mobile = mobile; this.cullRange=this.far.value;
    const near = mobile ? 12 : 22, highBudget = mobile ? 18 : 44, lowBudget = mobile ? 54 : 100;
    const visible = this.entries.map((entry) => ({ entry, distance: entry.position.distanceTo(cameraPosition) }))
      .filter(({ distance }) => distance < this.far.value).sort((a, b) => a.distance - b.distance);
    const selected = new Map(); let highCount = 0, lowCount = 0;
    for (const { entry, distance } of visible) {
      if (distance < near && highCount < highBudget) { selected.set(entry, "high"); highCount++; }
      else if (lowCount < lowBudget) { selected.set(entry, "low"); lowCount++; }
    }
    for (const batch of this.batches) {
      const counts = { high: 0, low: 0 };
      for (const entry of batch.entries) {
        const level = selected.get(entry); if (!level) continue;
        const mesh = batch[level], index = counts[level]++;
        if((world?.harvestedPlants?.[entry.id]??0)>(world?.elapsed??0)){
          this.harvestMatrix??=new THREE.Matrix4();this.harvestMatrix.copy(entry.matrix).scale(new THREE.Vector3(.8,.45,.8));mesh.setMatrixAt(index,this.harvestMatrix);
        }else mesh.setMatrixAt(index, entry.matrix);
        mesh.setColorAt(index, entry.tint);
      }
      for (const level of ["high", "low"]) {
        const mesh = batch[level]; mesh.count = counts[level]; mesh.visible = mesh.count > 0;
        mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
        updateInstancedWindBounds(mesh, batch.wind, batch.wind);
      }
    }
    this.group.visible = highCount + lowCount > 0;
  }

  dispose() {
    if (this.disposed) return; this.disposed = true;
    this.batches.forEach((batch) => { batch.high.dispose(); batch.low.dispose(); });
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    Object.values(this.maps).forEach((maps) => maps.dispose()); this.group.removeFromParent(); this.group.clear();
  }
}
