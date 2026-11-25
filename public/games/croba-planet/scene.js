import {WorldBarnacleRenderer} from './world-barnacle-renderer.js';
import {JellyfishSpiresRenderer} from './jellyfish-spires-renderer.js';
import {SpiresSubmarineRenderer} from './submarine-renderer.js';
import {SpiresMarineGrowthRenderer} from './spires-marine-growth.js';
import {JELLYFISH_SPIRES} from './jellyfish-spires-data.js';
import {getJellyfishSpiresDiveLightGain} from './jellyfish-spires-lighting.js';
import {GravelPebblesRenderer} from './gravel-pebbles.js';
import {createGravelMaps,addGravelMask,applyGravelSurface,seabedGravelBlend} from './seabed-gravel.js';
import {MarineTextureDetail,applyBasaltDetail} from './marine-texture-detail.js';
import {MossTextureDetail,applyMossTexture} from './moss-texture.js';
import {applyRockWearNormals} from './weathered-rock-geometry.js';
import {finishOrangeBorderGeometry} from './border-rock-finish.js';
import {addNaturalSandMask,applyNaturalSandSurface} from './ocean-sand.js';
import {createOceanCausticsMaterial} from './ocean-caustics.js';
import {getUnderwaterLighting} from './underwater-lighting.js';
import {addCanyonSurfaceMask,applyCanyonRockSurface,canyonSurfaceAt} from './canyon-rock-surface.js';
import {setFirstPersonSubmerged} from './first-person-lighting.js';
import {scheduleWaterShaderWarmup} from './water-shader-warmup.js';
import {sampleDayNight} from './day-night-cycle.js';
import {applyDayNightLighting} from './day-night-lighting.js';
import {getWildlifeRenderPopulation} from './wildlife-lifecycle.js';
import {WildlifeBroodRenderer} from './wildlife-brood-renderer.js';
import {CaveSandWormRenderer} from './cave-sand-worm-renderer.js';
import {SaltCaveRenderer} from './salt-cave-renderer.js';
import {getSaltCave,SALT_CAVE_STATIONS,SALT_CAVE_SHAFT,SALT_CAVE_HALLS} from './salt-cave.js';
import {carveSaltCliffEntrance} from './salt-cave-geometry.js';
import {CopperCargoRenderer} from './copper-cargo-renderer.js';
import {SulfuricBiomeRenderer} from './sulfuric-biome-renderer.js';
import {SulfurLizardRenderer} from './sulfur-lizard-renderer.js';
import {SandWormRenderer} from './sand-worm-renderer.js';
import {sampleSandWormShake} from './sand-worm-rumble.js';
import {carveSulfuricPassage} from './sulfuric-passage-geometry.js';
import {SULFURIC_LAND,SULFURIC_PASSAGE,SULFURIC_MAP_BOUNDS,getSulfuricGround} from './sulfuric-biome.js';
import {LargeGlacierWreckRenderer} from './large-glacier-wreck.js';
import {BasinMerchCargoRenderer} from './basin-merch-cargo.js';
import {CrobanMangoRenderer} from './croban-mango.js';
import {WoodlonRenderer} from './woodlon-renderer.js';
import {BasinDetailsRenderer} from './basin-details-renderer.js';
import {BasinCaveRenderer} from './basin-cave-renderer.js';
import {createFloatingGlacierGeometry} from './floating-glacier-geometry.js';
import {applyGlacialIceFinish} from './glacial-ice-finish.js';
import {getBasinCave,basinWaterLevel} from './basin-caves.js';
import { RedFishRenderer } from './red-fish-renderer.js';
import { creatureModelQuality } from './creature-quality.js';
import {HeldItemRenderer} from './held-item-renderer.js';
import {SalvageRenderer} from './salvage-renderer.js';
import {BaseRenderer} from './base-renderer.js';
import {insideUniversalBase} from './base-building.js';
import {activeWorldRocks} from './rock-chipping.js';
import {SHELL_FIELD,shellFieldBlend,shellFieldArmorBlend} from './shell-field.js';
import {applyShellFieldSurface,addShellFieldBorderMask} from './shell-field-renderer.js';
import {createShellFieldTexture,createShellFieldNormalTexture} from './shell-field-texture.js';
import {PREPARED_SEABED_STONES,createSeabedStoneGeometry,getSeabedStonePose} from './seabed-stones.js';
import {PREPARED_WORLD_ROCKS} from './world-rock-data.js';
import {WorldRockRenderer} from './world-rock-renderer.js';
import {createWorldRockSandGeometry} from './world-rock-sand.js';
import {ROCK_TOP_PLANTS} from './rock-top-plant-data.js';
import {PREPARED_DRIFT_ICE} from './drift-ice-data.js';
import {DriftIceRenderer} from './drift-ice-renderer.js';
import {WATER_OPTICS,getWaterFogDensity} from './water-optics.js';
import {loadRenderDistance,normalizeRenderDistance} from './render-distance-settings.js';
import {StaticRenderDistance} from './static-render-distance.js';
import {InstanceRenderDistance} from './instance-render-distance.js';
import {applyRenderDistanceFade} from './render-distance-fade.js';
import {PenguinRenderer} from './penguin-renderer.js';
import {PenguinEggRenderer} from './penguin-egg-renderer.js';
import {PenguinIslandNestRenderer} from './penguin-island-nest-renderer.js';
import {SharedFeedingSuit} from './shared-feeding-suit.js';
import {colorIslandSurface,createIslandSurfaceMaterial} from './island-ice-style.js';
import { HogwongRenderer } from './hogwong-renderer.js';
import { IcebergTundraRenderer } from './iceberg-tundra.js';
import { FrostHoundRenderer } from './frost-hound-renderer.js';
import {TuskjawSharkRenderer} from './tuskjaw-shark-renderer.js';
import { ArcticGardenRenderer } from './arctic-garden-renderer.js';
import { ARCTIC_GARDEN_REGIONS, getArcticGarden } from './arctic-gardens.js';
import { LanternJellyfishRenderer } from './lantern-jellyfish.js';
import {getIceSurface,getIceSurfaceHeight} from './ice-surface.js';
import {createCrashWreck} from './crash-wreck.js';
import { createMountainRangeGeometry } from './glacial-mountains.js';
import {MAIN_PERIMETER,SULFUR_PERIMETER} from './world-perimeter.js';
import {createPerimeterGround} from './world-perimeter-ground.js';
import { ConceptSky } from './concept-sky.js';
import {createBasinWallGeometry} from './icy-basin.js';
import * as THREE from "./vendor/three.module.js";
import { createMaterials } from "./materials.js";
import { CrabColony } from "./creatures.js";
import { FaunaRenderer } from "./fauna.js";
import { FloraRenderer } from "./flora.js";
import { ForestRenderer } from "./forest-renderer.js";
import { TreeStalkerRenderer } from "./tree-stalker-renderer.js";
import { BlueSeaweedRenderer } from "./seaweed-renderer.js";
import { BiomePlantRenderer } from "./plant-renderer.js";
import { UnderwaterRenderer, createOceanMaterial, applyTerrainSurface, applyWaterMedium } from "./underwater-renderer.js";
import { SquidRenderer } from "./squid-renderer.js";
import { Blizzard, renderQuality, getRenderPixelRatio } from "./weather.js";
import { fogVisibilityDepth, boxViewDepth } from "./render-visibility.js";
import { BLUE_OCEAN_START_X, WORLD_BOUNDS, getBiome, getWorldBiome } from "./biomes.js";
import { createSeabedMeshData, getSeabedHeight, SEABED_GRID } from "./seabed.js";
import { createSeabedBatch, markBuriedSeabedChunks, updateSeabedBatchVisibility } from "./seabed-chunks.js";
import {
  getPlatformVertices,
  getIceDepth,
  getIceScale,
  WATER_LEVEL,
  SEABED_LEVEL,
  EYE_HEIGHT,
  BLUE_OCEAN_DEPTH_METERS,
} from "./terrain.js";

const WORLD_SCALE = 25;
const TAU = Math.PI * 2;
const CAMERA_UP = new THREE.Vector3(0, 1, 0);
const AIR_COLOR = 0x91bcd3;
const BLUE_AIR_COLOR = 0x9ac7dc;
const FOREST_AIR_COLOR = 0xbcbacf;
const FOREST_AIR_TINT = new THREE.Color(FOREST_AIR_COLOR);
const FOREST_SKY_LIGHT = new THREE.Color(0xe9ddf5);
const FOREST_GROUND_LIGHT = new THREE.Color(0x817263);
const FOREST_SUN_LIGHT = new THREE.Color(0xffdfb4);
const SURFACE_SKY_LIGHT = 0xc6e4ff;
const SURFACE_GROUND_LIGHT = 0x2d4868;
const SURFACE_SUN_LIGHT = 0xffefd9;
// Directional daylight and cool sky fill give existing geometry depth in the
// main render pass. Keep shadows/refraction disabled by the quality budget.
const SURFACE_AMBIENT = 1.08;
const SURFACE_SUN = 3.2;
const SURFACE_ENVIRONMENT = .58;

/** Fade the coastal palette over the first 2.8m of actual forest ground. */
function forestLightBlend(forest, x, y) {
  const boundary = forest?.boundary;
  if (!boundary?.length) return 1;
  let distance = Infinity;
  for (let index = 0; index < boundary.length; index++) {
    const a = boundary[index], b = boundary[(index + 1) % boundary.length];
    const dx = b.x - a.x, dy = b.y - a.y;
    const along = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    distance = Math.min(distance, Math.hypot(x - a.x - dx * along, y - a.y - dy * along));
  }
  const fraction = Math.min(1, distance / 70);
  return fraction * fraction * (3 - 2 * fraction);
}

function browserViewport() {
  const viewport = globalThis.window;
  const dimension = (value, fallback) => Number.isFinite(value) && value > 0 ? Math.max(1, value) : fallback;
  return {
    width: dimension(viewport?.innerWidth, 1280),
    height: dimension(viewport?.innerHeight, 720),
    pixelRatio: viewport?.devicePixelRatio ?? 1,
    coarse: viewport?.matchMedia?.("(any-pointer: coarse)")?.matches ?? false,
  };
}

function browserQuality() {
  return renderQuality(browserViewport());
}

/** Context options shared by every expedition, including desktop.
 * @param {HTMLCanvasElement} canvas @returns {THREE.WebGLRendererParameters}
 */
export function createExpeditionRendererOptions(canvas) {
  return { canvas, antialias: false, alpha: false, powerPreference: "low-power" };
}

/** Preserve close ice detail while covering the full ocean descent. */
export function createExpeditionCamera() {
  return new THREE.PerspectiveCamera(76, 1, 0.045, Math.max(600, BLUE_OCEAN_DEPTH_METERS + 400));
}

/** Terrain triangles are sorted into two material batches: sand and steep rock. */
export function seabedGeometry() {
  const { positions, indices } = createSeabedMeshData();
  const faces = [[], []];
  const tint = [[], []];
  const normals = [[], []], occlusion = [[], []],shellMasks=[[],[]],armorMasks=[[],[]];
  const indexed = new THREE.BufferGeometry();
  indexed.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  indexed.setIndex(new THREE.BufferAttribute(indices, 1)); indexed.computeVertexNormals();
  const smoothNormals = indexed.attributes.normal;
  const concavity = new Float32Array(positions.length / 3);
  const { columns, rows } = SEABED_GRID;
  for (let row = 1; row < rows - 1; row++) for (let column = 1; column < columns - 1; column++) {
    const vertex = row * columns + column;
    const neighbour = (positions[(vertex - 1) * 3 + 1] + positions[(vertex + 1) * 3 + 1]
      + positions[(vertex - columns) * 3 + 1] + positions[(vertex + columns) * 3 + 1]) / 4;
    concavity[vertex] = Math.min(1, Math.max(0, neighbour - positions[vertex * 3 + 1]) * 0.28);
  }
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), normal = new THREE.Vector3();
  const color = new THREE.Color(),wallNormal=new THREE.Vector3(),smoothWall=new THREE.Vector3();
  for (let index = 0; index < indices.length; index += 3) {
    a.fromArray(positions, indices[index] * 3);
    b.fromArray(positions, indices[index + 1] * 3);
    c.fromArray(positions, indices[index + 2] * 3);
    normal.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a)).normalize();
    const steep = normal.y < 0.7 ? 1 : 0;
    faces[steep].push(...a, ...b, ...c);
    color.setHex(steep ? 0xf0c9ab : 0xf2e6cf);
    for (let corner = 0; corner < 3; corner++) {
      const vertex = indices[index + corner];
      const habitat=getArcticGarden(positions[vertex*3]*25,positions[vertex*3+2]*25);
      const groundTint=color.clone();
      if(habitat&&!steep)groundTint.lerp(new THREE.Color(habitat.region.color),habitat.blend*.28);
      tint[steep].push(groundTint.r, groundTint.g, groundTint.b); occlusion[steep].push(concavity[vertex]);
      shellMasks[steep].push(Math.round(255*shellFieldBlend(positions[vertex*3]*25,positions[vertex*3+2]*25)));
      armorMasks[steep].push(Math.round(255*shellFieldArmorBlend(positions[vertex*3]*25,positions[vertex*3+2]*25)));
      wallNormal.fromBufferAttribute(smoothNormals,vertex);
      if(steep){
        const weathering=canyonSurfaceAt(positions[vertex*3]*25,positions[vertex*3+2]*25).blend*.72;
        wallNormal.copy(normal).lerp(smoothWall.fromBufferAttribute(smoothNormals,vertex),weathering).normalize();
      }
      normals[steep].push(wallNormal.x,wallNormal.y,wallNormal.z);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([...faces[0], ...faces[1]], 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute([...tint[0], ...tint[1]], 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute([...normals[0], ...normals[1]], 3));
  geometry.setAttribute("sedimentOcclusion", new THREE.Float32BufferAttribute([...occlusion[0], ...occlusion[1]], 1));
  geometry.setAttribute('shellFieldBlend',new THREE.Uint8BufferAttribute([...shellMasks[0],...shellMasks[1]],1,true));
  geometry.setAttribute('shellFieldArmor',new THREE.Uint8BufferAttribute([...armorMasks[0],...armorMasks[1]],1,true));
  geometry.addGroup(0, faces[0].length / 3, 0);
  geometry.addGroup(faces[0].length / 3, faces[1].length / 3, 1);
  indexed.dispose();
  return addCanyonSurfaceMask(addNaturalSandMask(addGravelMask(projectSurfaceUVs(geometry))));
}

/** Border faces follow the same authored polygon edges used by movement. */
export function borderGeometry(borders, kind) {
  const range=createMountainRangeGeometry(borders,kind);
  const geometry=projectSurfaceUVs(kind==='stone'?carveSaltCliffEntrance(carveSulfuricPassage(range)):range);
  // Restore the original four-metre texture tiles on the tall ice faces.
  if(kind==='iceberg'){const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.25,uv.getY(i)*.25);}
  return geometry;
}

/** Project surface coordinates in metres so texture grain stays consistent. */
export function projectSurfaceUVs(source) {
  const geometry = source.index ? source.toNonIndexed() : source;
  const position = geometry.attributes.position;
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const normal = geometry.attributes.normal;
  const uv = new Float32Array(position.count * 2);
  for (let triangle = 0; triangle < position.count; triangle += 3) {
    const nx = Math.abs(normal.getX(triangle));
    const ny = Math.abs(normal.getY(triangle));
    const nz = Math.abs(normal.getZ(triangle));
    for (
      let vertex = triangle;
      vertex < Math.min(triangle + 3, position.count);
      vertex++
    ) {
      uv[vertex * 2] =
        nx > ny && nx > nz ? position.getZ(vertex) : position.getX(vertex);
      uv[vertex * 2 + 1] =
        ny >= nx && ny >= nz ? position.getZ(vertex) : position.getY(vertex);
    }
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geometry;
}

/** @param {number} seed */
function random(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

/** @param {number} color @param {Record<string, unknown>} [options] */
function matte(color, options = {}) {
  return new THREE.MeshLambertMaterial({
    color,
    flatShading: true,
    ...options,
  });
}

/** @param {THREE.Group} parent @param {THREE.BufferGeometry} geometry @param {THREE.Material | THREE.Material[]} material @param {number[]} position */
function mesh(parent, geometry, material, position = [0, 0, 0]) {
  if (
    [
      "BoxGeometry",
      "ExtrudeGeometry",
      "BufferGeometry",
      "TetrahedronGeometry",
      "DodecahedronGeometry",
    ].includes(geometry.type)
  )
    geometry = projectSurfaceUVs(geometry);
  if (material?.vertexColors && !geometry.attributes.color)
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(
        new Float32Array(geometry.attributes.position.count * 3).fill(1),
        3,
      ),
    );
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  parent.add(object);
  object.receiveShadow = true;
  object.castShadow = true;
  return object;
}

function groupAt(parent, name, position, rotation = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  group.rotation.set(...rotation);
  parent.add(group);
  return group;
}

/** A horizontal prism; points are local X/Z coordinates. */
function wingGeometry(points, height = 0.08) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) =>
    index ? shape.lineTo(x, -z) : shape.moveTo(x, -z),
  );
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

/** Sculpted ice shares the physical top, taper, base and real cave cuts. */
export function glacierGeometry(floe,vertices){return createFloatingGlacierGeometry(floe,vertices);}

/** First-person WebGL renderer. Physics and rendering share the same ice polygons. */
export class Scene {
  /** @param {HTMLCanvasElement} canvas @param {{onInvalidate?:()=>void}} [options] */
  constructor(canvas,{onInvalidate}={}) {
    this.canvas = canvas;
    this.invalidate=typeof onInvalidate==='function'?onInvalidate:null;
    this.disposed = false;
    this.quality = browserQuality();
    this.renderDistance=loadRenderDistance(undefined,this.quality.mobile?40:80);
    this.quality.renderDistance=this.renderDistance;this.quality.terrainDistance=this.renderDistance;
    this.renderDistanceUniform={value:this.renderDistance};
    try {
      this.renderer = new THREE.WebGLRenderer(createExpeditionRendererOptions(canvas));
    } catch (error) {
      throw Object.assign(new Error(
        "This first-person expedition needs WebGL 2. Please try a browser with hardware acceleration enabled.",
        { cause: error },
      ),{code:'CROBA_WEBGL_UNAVAILABLE'});
    }
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.03;
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.materials = createMaterials({
      resolution: this.quality.textureResolution,
      maxAnisotropy: Math.min(this.quality.mobile ? 2 : 8, this.renderer.capabilities.getMaxAnisotropy()),
    });
    this.materials.glass.transmission = 0;
    this.scene = new THREE.Scene();
    if (this.materials.environment)
      this.scene.environment = this.materials.environment;
    this.scene.background = new THREE.Color(AIR_COLOR);
    this.scene.fog = new THREE.FogExp2(AIR_COLOR, 0.009);
    this.camera = createExpeditionCamera();
    this.sharedFeedingSuit=new SharedFeedingSuit();this.scene.add(this.sharedFeedingSuit);
    this.camera.rotation.order = "YXZ";
    this.playing = false;
    this.yaw = 0;
    this.pitch = -0.08;
    this.bob = 0;
    this.worldReady = false;
    this.parts = new Map();
    this.heatLights = [];
    this.reducedMotion = globalThis.window?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    this.clock = 0;
    this.addEnvironment();
    this.resize();
    this.contextLost = false;
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.contextLost = true;
      this.cancelWaterShaderWarmup?.();
    });
    canvas.addEventListener("webglcontextrestored", () => {
      this.contextLost = false;
      this.waterShadersScheduled = false;
    });
  }

  resize() {
    const viewport = browserViewport(), width = viewport.width;
    this.height = viewport.height;
    this.renderer.setPixelRatio(getRenderPixelRatio(viewport));
    this.renderer.setSize(
      width,
      this.height,
      false,
    );
    this.camera.aspect =
      width / this.height;
    this.camera.updateProjectionMatrix();
  }

  /** yaw 0 faces north; positive yaw turns east. Positive pitch looks up. */
  setLook(yaw, pitch) {
    if (Number.isFinite(yaw)) this.yaw = yaw;
    if (Number.isFinite(pitch))
      this.pitch = Math.max(-1.25, Math.min(1.25, pitch));
  }

  resetView() {
    this.bob = 0;
    this.encounterView = null;
  }

  /** Apply a device preference without recreating the world or its creatures. */
  setRenderDistance(value){
    this.renderDistance=normalizeRenderDistance(value);
    this.quality??={};this.quality.renderDistance=this.renderDistance;this.quality.terrainDistance=this.renderDistance;
    this.renderDistanceUniform??={value:this.renderDistance};this.renderDistanceUniform.value=this.renderDistance;
    this.staticRenderDistance?.invalidate();this.instanceRenderDistance?.invalidate();
    return this.renderDistance;
  }

  /** Keep tinted cockpit glass in the main pass; refraction redraws the opaque world. */
  updateGlassBudget() {
    const glass = this.materials?.glass;
    if (!glass || !Number.isFinite(glass.transmission)) return;
    // MeshPhysicalMaterial's setter invalidates its shader only when crossing zero.
    if (glass.transmission !== 0) glass.transmission = 0;
  }

  /** Aim at the captor's actual encounter target, following a separate cinematic eye path when supplied. */
  aimAtSquidEncounter(world, dt) {
    const stalker = world.treeStalkerEncounter;
    const centipede = world.centipedeEncounter;
    const worm=world.sandWormEncounter;
    if(worm&&this.reducedMotion){this.encounterView=null;return;}
    const encounter = worm ?? stalker ?? centipede ?? world.squidEncounter;
    const target = encounter?.cameraTarget ?? encounter?.target;
    const phases = worm?['grabbed','eating']:stalker ? ["grabbed", "feeding"] : centipede ? ["bitten", "eating"] : ["grabbed", "observing", "to-mouth", "striking", "shared-bite", "handoff", "eating"];
    if (!encounter || !phases.includes(encounter.phase)
      || !target || ![target.x, target.y, target.z].every(Number.isFinite)) {
      this.encounterView = null;
      return;
    }
    const eye = (worm ?? stalker ?? centipede)?.cameraPosition;
    if (eye && [eye.x, eye.y, eye.z].every(Number.isFinite))
      this.camera.position.set(eye.x / WORLD_SCALE, eye.z / WORLD_SCALE, eye.y / WORLD_SCALE);
    const id = worm?`sand-worm:${encounter.wormId}`:stalker ? `tree-stalker:${encounter.stalkerId}`
      : centipede ? `centipede:${encounter.hunterId}` : `squid:${encounter.squidId}`;
    if (this.encounterView?.id !== id) this.encounterView = {
      id, rotation: this.camera.quaternion.clone(),
      desired: new THREE.Quaternion(), target: new THREE.Vector3(), matrix: new THREE.Matrix4(),
    };
    const view = this.encounterView;
    view.target.set(target.x / WORLD_SCALE, target.z / WORLD_SCALE, target.y / WORLD_SCALE);
    const delta = Number.isFinite(dt) ? Math.max(0, Math.min(0.05, dt)) : 0;
    if (this.camera.position.distanceToSquared(view.target) > 0.0025) {
      view.matrix.lookAt(this.camera.position, view.target, CAMERA_UP);
      view.desired.setFromRotationMatrix(view.matrix);
      view.rotation.slerp(view.desired, 1 - Math.exp(-delta * (stalker||worm ? 8 : 3.5)));
    }
    this.camera.quaternion.copy(view.rotation);
    if (!this.reducedMotion && encounter.phase === "eating") {
      const progress = Number.isFinite(encounter.progress) ? Math.max(0, Math.min(1, encounter.progress)) : 0;
      this.camera.rotateZ(Math.sin(progress * Math.PI) * 0.035);
    }
  }

  addEnvironment() {
    this.conceptSky = new ConceptSky();
    this.scene.add(this.conceptSky.group);
    const quality = this.quality ?? renderQuality();
    this.ambient = new THREE.HemisphereLight(SURFACE_SKY_LIGHT, SURFACE_GROUND_LIGHT, SURFACE_AMBIENT);
    this.keyLight = new THREE.DirectionalLight(SURFACE_SUN_LIGHT, SURFACE_SUN);
    this.keyLight.position.set(-40, 55, -80);
    this.keyLight.castShadow = quality.shadows;
    this.keyLight.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
    Object.assign(this.keyLight.shadow.camera, {
      left: -18,
      right: 18,
      top: 18,
      bottom: -18,
      near: 0.5,
      far: 150,
    });
    this.keyLight.shadow.camera.updateProjectionMatrix();
    this.keyLight.shadow.bias = -0.0002;
    this.keyLight.shadow.normalBias = 0.035;
    this.scene.add(this.keyLight.target);
    this.scene.add(this.ambient, this.keyLight);
    this.diveLight = new THREE.SpotLight(0xc4e4ff, 0, 42, Math.PI * 0.28, 0.65, 1.4);
    this.diveLight.name = "suit-dive-light";
    // Keep the light layout stable: changing visibility recompiles every lit
    // material on the first dive. Zero intensity turns the lamp off on land.
    this.diveLight.visible = true;
    this.scene.add(this.diveLight, this.diveLight.target);
    this.diveDirection = new THREE.Vector3();
    this.waterMaterial = createOceanMaterial(this.scene.fog.color);
    this.water = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 900, quality.waterSegments, quality.waterSegments),
      this.waterMaterial,
    );
    this.water.name = "water-surface";
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = WATER_LEVEL / WORLD_SCALE;
    this.water.renderOrder = 2;
    this.scene.add(this.water);
    this.addSeabed();
    this.addParticles();
  }

  addSeabed() {
    this.gravelMaps??=createGravelMaps();
    this.marineDetails??=new MarineTextureDetail({gravelMaps:this.gravelMaps,onReady:()=>{if(!this.disposed)this.invalidate?.();}});
    this.shellFieldMap??=createShellFieldTexture();
    this.shellFieldNormalMap??=createShellFieldNormalTexture();
    const floor = seabedGeometry();
    const sand = this.materials?.sand?.clone() ?? matte(0xffffff);
    const rock = this.materials?.rock?.clone() ?? matte(0xffffff);
    sand.flatShading = false;
    rock.flatShading = false; // Explicit face normals retain hard cliffs; canyon normals can soften.
    for (const material of [sand, rock]) {
      material.vertexColors = true;
      applyTerrainSurface(material, this.materials, this.waterMaterial?.uniforms.time ?? { value: 0 });
      applyNaturalSandSurface(material);
      applyShellFieldSurface(material,this.shellFieldMap,this.shellFieldNormalMap,true);
      applyGravelSurface(material,this.gravelMaps);
      applyCanyonRockSurface(material);
      applyWaterMedium(material);
    }
    this.seabedBatch = createSeabedBatch(floor);
    this.seabedChunks = this.seabedBatch.chunks;
    this.seabed = new THREE.Mesh(floor, [sand, rock]);
    this.seabed.name = "sandy-seabed";
    this.seabed.receiveShadow = true;
    this.scene.add(this.seabed);

    this.causticsMaterial = createOceanCausticsMaterial({waterLevel:WATER_LEVEL/WORLD_SCALE,
      lightPenetration:WATER_OPTICS.causticDepth,waterFogDensity:this.scene.fog?.density??.027});
    this.seabedCaustics = new THREE.Mesh(this.seabedBatch.caustics, this.causticsMaterial);
    this.seabedCaustics.name = "terrain-caustics";
    this.seabedCaustics.position.y = 0.012; this.seabedCaustics.renderOrder = 1;
    this.scene.add(this.seabedCaustics);

    const stoneGeometry=applyRockWearNormals(createSeabedStoneGeometry());
    stoneGeometry.setAttribute('shellFieldBlend',new THREE.InstancedBufferAttribute(
      Uint8Array.from(PREPARED_SEABED_STONES,stone=>Math.round(255*shellFieldBlend(stone.x,stone.y))),1,true));
    stoneGeometry.setAttribute('gravelBlend',new THREE.InstancedBufferAttribute(
      Uint8Array.from(PREPARED_SEABED_STONES,stone=>Math.round(255*seabedGravelBlend(stone.x,stone.y))),1,true));
    const stoneMaterial=this.materials?.rock?.clone()??matte(0xd88945);
    stoneMaterial.flatShading=false;
    const rocks = new THREE.InstancedMesh(
      stoneGeometry,
      applyGravelSurface(applyShellFieldSurface(stoneMaterial,this.shellFieldMap,this.shellFieldNormalMap),this.gravelMaps),
      PREPARED_SEABED_STONES.length,
    );
    rocks.name = "seabed-stones";
    const transform = new THREE.Object3D();
    for (const [index,stone] of PREPARED_SEABED_STONES.entries()) {
      getSeabedStonePose(stone,transform);rocks.setMatrixAt(index,transform.matrix);
    }
    rocks.receiveShadow = true;
    this.scene.add(rocks);
  }

  addParticles() {
    const rng = random(918);
    this.blizzard = new Blizzard(this.quality ?? renderQuality());
    this.snow = this.blizzard.group;
    this.scene.add(this.snow);
    this.bubbleSeeds = Array.from({ length: 60 }, () => ({
      x: rng() * 10 - 5,
      y: rng() * 12,
      z: rng() * 10 - 5,
      speed: 0.35 + rng() * 0.4,
    }));
    this.bubbleGeometry = new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        new Float32Array(this.bubbleSeeds.length * 3),
        3,
      ),
    );
    this.bubbles = new THREE.Points(
      this.bubbleGeometry,
      new THREE.PointsMaterial({
        color: 0xc6f1ec,
        size: 0.04,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    );
    this.bubbles.material.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <logdepthbuf_vertex>',
        'gl_PointSize=min(gl_PointSize,3.5);\n#include <logdepthbuf_vertex>');
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_particle_fragment>',
        '#include <map_particle_fragment>\ndiffuseColor.a*=1.-smoothstep(.12,.5,length(gl_PointCoord-vec2(.5)));');
    };
    this.bubbles.material.customProgramCacheKey=()=> 'croba-soft-diver-bubbles-v1';
    this.scene.add(this.bubbles);
  }

  /** @param {import('./world.js').World} world */
  addWorld(world) {
    markBuriedSeabedChunks(this.seabedChunks, world.forest);
    const terrain = new THREE.Group();
    terrain.name = "ice-field";
    this.terrainChunks = [];
    for (const floe of world.platforms) {
      this.addFloe(terrain, floe);
      this.terrainChunks.push({ group: terrain.children.at(-1), volume: floe });
    }
    this.scene.add(terrain);
    this.driftIce=new DriftIceRenderer(world,this.materials,PREPARED_DRIFT_ICE);
    this.scene.add(this.driftIce.group);
    const submerged = new THREE.Group();
    submerged.name = "submerged-ice-field";
    for (const chunk of world.submergedIce ?? []) {
      this.addSubmergedIce(submerged, chunk);
      this.terrainChunks.push({ group: submerged.children.at(-1), volume: chunk });
    }
    this.scene.add(submerged);
    this.addBorders(world.borders ?? []);
    this.addIceSpikes(world.iceSpikes ?? []);
    // Cache actual static geometry, including edge details and attached cones.
    const chunksById = new Map();
    for (const chunk of this.terrainChunks) {
      chunk.group.updateWorldMatrix(true, true);
      chunk.worldBounds = new THREE.Box3().setFromObject(chunk.group, true);
      chunksById.set(chunk.volume.id, chunk);
    }
    const spikeCorner = new THREE.Vector3();
    for (const spike of world.iceSpikes ?? []) {
      const marker = spike.id.lastIndexOf("-underside-spike-");
      if (marker < 0) continue;
      const chunk = chunksById.get(spike.id.slice(0, marker));
      if (!chunk) continue;
      chunk.worldBounds.expandByPoint(spikeCorner.set((spike.x - spike.radius) / WORLD_SCALE,
        (spike.z - spike.length) / WORLD_SCALE, (spike.y - spike.radius) / WORLD_SCALE));
      chunk.worldBounds.expandByPoint(spikeCorner.set((spike.x + spike.radius) / WORLD_SCALE,
        spike.z / WORLD_SCALE, (spike.y + spike.radius) / WORLD_SCALE));
    }
    this.underwaterFx = new UnderwaterRenderer(world, this.quality);
    this.underwaterFx.bind(this.waterMaterial); this.underwaterFx.bind(this.causticsMaterial);
    this.scene.add(this.underwaterFx.group);
    this.seaweed = new BlueSeaweedRenderer({...world,seaweed:[...(world.seaweed??[]),...ROCK_TOP_PLANTS]}, this.materials);
    this.scene.add(this.seaweed.group);
    this.plants = new BiomePlantRenderer(world, this.quality);
    this.scene.add(this.plants.group);
    this.forest = new ForestRenderer(world, this.materials);
    this.mossTexture??=new MossTextureDetail({resolution:this.quality?.mobile?256:512,onReady:()=>{if(!this.disposed)this.invalidate?.();}});
    applyMossTexture(this.forest.materials.moss,this.mossTexture,'green');
    this.scene.add(this.forest.group);
    this.worldRocks=new WorldRockRenderer(this.scene,this.materials,PREPARED_WORLD_ROCKS);
    const boulderSandMaterial=this.materials.sand.clone();
    boulderSandMaterial.color.setHex(0xd8c49b);
    boulderSandMaterial.vertexColors=true;boulderSandMaterial.roughness=.96;boulderSandMaterial.metalness=0;
    const boulderSand=new THREE.Mesh(createWorldRockSandGeometry(PREPARED_WORLD_ROCKS),boulderSandMaterial);
    boulderSand.name='underwater-boulder-sand';boulderSand.receiveShadow=true;this.scene.add(boulderSand);
    this.worldBarnacles=new WorldBarnacleRenderer(world,this.materials);this.scene.add(this.worldBarnacles.group);
    this.jellyfishSpires=new JellyfishSpiresRenderer(world,{material:this.materials.rock,decorateMaterial:material=>{
      material.normalMap=null;
      applyBasaltDetail(material,this.marineDetails.basaltMaps);applyWaterMedium(material);return material;
    }});this.scene.add(this.jellyfishSpires.group);
    this.spiresSubmarine=new SpiresSubmarineRenderer(this.materials);this.scene.add(this.spiresSubmarine.group);
    this.spiresGrowth=new SpiresMarineGrowthRenderer({materials:this.materials,mobile:this.quality?.mobile,
      decorateMaterial:material=>{if(material.name==='spires-moss')applyMossTexture(material,this.mossTexture,'purple');}});this.scene.add(this.spiresGrowth.group);
    this.gravelPebbles=new GravelPebblesRenderer(world,{mobile:this.quality?.mobile,decorateMaterial:material=>applyWaterMedium(material)});
    this.scene.add(this.gravelPebbles.group);
    const cliffSurface={map:this.shellFieldMap,normalMap:this.shellFieldNormalMap};
    this.saltCave=new SaltCaveRenderer(this.materials,cliffSurface);this.scene.add(this.saltCave.group);
    this.sulfuric=new SulfuricBiomeRenderer(this.materials,cliffSurface);this.scene.add(this.sulfuric.group);
    for(const region of['main','sulfur']){
      const geometry=createPerimeterGround(region),material=(region==='main'?this.materials?.sand:this.materials?.rock)?.clone()??matte(0xffffff);
      material.vertexColors=true;material.color.setHex(0xffffff);
      if(region==='main'){addGravelMask(geometry);applyGravelSurface(material,this.gravelMaps);applyWaterMedium(material);}
      if(region==='sulfur')material.map=null;
      const collar=new THREE.Mesh(geometry,material);collar.name=`perimeter-${region}-ground`;collar.receiveShadow=true;this.scene.add(collar);
      if(region==='main'&&this.causticsMaterial){const caustics=new THREE.Mesh(geometry.clone(),this.causticsMaterial);caustics.name='perimeter-main-caustics';caustics.position.y=.012;caustics.renderOrder=1;this.scene.add(caustics);}
    }
    this.flora = new FloraRenderer(world, this.materials);
    this.scene.add(this.flora.group);
    this.tundra = new IcebergTundraRenderer(world, this.quality);
    this.scene.add(this.tundra.group);
    const basinWalls=new THREE.Mesh(projectSurfaceUVs(createBasinWallGeometry(world.platforms)),this.materials.ice.clone());
    basinWalls.material.side=THREE.DoubleSide;basinWalls.name='icy-basin-pressure-ridges';this.scene.add(basinWalls);
    this.arcticGardens = new ArcticGardenRenderer(world, this.quality);
    this.scene.add(this.arcticGardens.group);
    this.basinCaves=new BasinCaveRenderer(world,this.materials);this.scene.add(this.basinCaves.group);
    this.basinDetails=new BasinDetailsRenderer(world,this.materials);this.scene.add(this.basinDetails.group);
    this.scene.add(this.camera);
    this.copperCargo=new CopperCargoRenderer(world,this.camera);this.scene.add(this.copperCargo.group);
    this.copperCargo.hand.visible=false;
    this.heldItems=new HeldItemRenderer(this.camera);
    this.salvage=new SalvageRenderer(world);this.scene.add(this.salvage.group);
    this.renderDistanceUniform??={value:this.renderDistance??this.quality?.terrainDistance??160};
    this.playerBases=new BaseRenderer(world,{finishMaterial:material=>{
      applyWaterMedium(material);if(this.scene.fog)applyRenderDistanceFade(material,this.renderDistanceUniform);
    }});this.scene.add(this.playerBases.group);
    this.largeGlacierWreck=new LargeGlacierWreckRenderer(world,this.materials);this.scene.add(this.largeGlacierWreck.group);
    this.basinMerchCargo=new BasinMerchCargoRenderer(world,this.materials);this.scene.add(this.basinMerchCargo.group);
    this.crobanMango=new CrobanMangoRenderer(world,this.materials);this.scene.add(this.crobanMango.group);
    this.addCreatures(world);
    this.shuttle = this.createShip(world.ship);
    this.shuttle.position.set(
      world.ship.x / WORLD_SCALE,
      (world.ship.z ?? 0) / WORLD_SCALE,
      world.ship.y / WORLD_SCALE,
    );
    this.shuttle.rotation.y = world.ship.yaw ?? 0;
    this.scene.add(this.shuttle);
    this.addSunkenWreck(world.ship);
    for (const beacon of world.beacons) this.addBeacon(beacon);
    for (const item of world.items) this.addPart(item);
    this.renderDistanceUniform??={value:this.renderDistance??this.quality?.terrainDistance??160};
    const exemptMaterials=new Set();
    for(const backdrop of[this.borderGroup,this.conceptSky?.group])backdrop?.traverse(object=>{
      for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)exemptMaterials.add(material);
    });
    const staticMeshes=[];
    terrain.traverse(object=>{if(object.isMesh&&!object.isInstancedMesh)staticMeshes.push(object);});
    submerged.traverse(object=>{if(object.isMesh&&!object.isInstancedMesh)staticMeshes.push(object);});
    for(const name of['exact-baked-forest-ground','sulfuric-authored-ground','icy-basin-pressure-ridges','underwater-boulder-sand','perimeter-main-ground','perimeter-sulfur-ground','perimeter-main-caustics']){
      const mesh=this.scene.getObjectByName(name);if(mesh)staticMeshes.push(mesh);
    }
    for(const room of this.basinCaves?.rooms??[])if(room.shell)staticMeshes.push(room.shell);
    const saltShell=this.saltCave?.group?.getObjectByName('salt-cavern-continuous-floor-walls-roof');if(saltShell?.isMesh)staticMeshes.push(saltShell);
    this.staticRenderDistance=new StaticRenderDistance(staticMeshes);
    const staticInstances=[...(this.worldRocks?.meshes??[]),...Object.values(this.flora?.tubes??{}),this.flora?.ridges,
      this.scene.getObjectByName('seabed-stones'),this.scene.getObjectByName('ice-island-underside-spikes'),...(this.sulfuric?.instances??[])].filter(Boolean);
    this.instanceRenderDistance=new InstanceRenderDistance(staticInstances);
    this.distanceGroups=[this.shuttle,this.largeGlacierWreck?.group,this.spiresSubmarine?.group,this.basinMerchCargo?.group,this.crobanMango?.group,
      ...(this.heatLights??[]).map(light=>light.parent),...(this.parts?.values()??[])].filter(group=>group&&group!==this.scene).map(group=>{
      group.updateWorldMatrix(true,true);return{group,bounds:new THREE.Box3().setFromObject(group,true)};
    });
    this.scene.traverse((object) => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach(material=>{
        if(material.userData?.firstPerson)return;
        const role=material.userData?.glacialRole;
        if(role==='ice'||role==='snow')applyGlacialIceFinish(material,{snow:role==='snow'});
        applyWaterMedium(material);
        if(this.scene.fog&&!exemptMaterials.has(material))applyRenderDistanceFade(material,this.renderDistanceUniform);
      });
    });
    this.worldReady = true;
  }

  /** Geometry and anatomy stay identical on phones and desktop. Keeping the
   * construction boundary explicit prevents a visibility flag from silently
   * selecting low-detail fur, joints, eyes, shells or tentacles. */
  addCreatures(world) {
    const quality = creatureModelQuality(this.quality);
    this.creatureQuality = quality;
    this.treeStalkers = new TreeStalkerRenderer(world, this.materials);
    this.penguins = new PenguinRenderer(world, quality);
    this.penguinEggs = new PenguinEggRenderer(world, quality);
    this.penguinIslandNests = new PenguinIslandNestRenderer(world, this.materials);
    this.hogwongs = new HogwongRenderer(world, quality);
    this.wildlifeBroods=new WildlifeBroodRenderer();
    this.woodlons = new WoodlonRenderer(world, this.materials);
    this.voidFish = new FrostHoundRenderer(world, quality, { populationKey: "voidFish", black: true });
    this.frostHounds = new FrostHoundRenderer(world, quality);
    this.redFish = new RedFishRenderer(world, quality);
    this.tuskjawSharks = new TuskjawSharkRenderer(world);
    this.sulfurLizards=new SulfurLizardRenderer(world);
    this.sandWorms=new SandWormRenderer(world);
    this.caveWorms=new CaveSandWormRenderer(world,this.sandWorms.maps);
    this.jellyfish = new LanternJellyfishRenderer(world);
    this.fauna = new FaunaRenderer(world, this.materials, quality);
    this.squids = new SquidRenderer(world, this.materials);
    this.crabColony = new CrabColony(getWildlifeRenderPopulation(world,'crab'), this.materials, quality);
    this.crabColony.group.traverse((object) => {
      if (object.isMesh && object.name !== "soft-contact-shadow") {
        object.castShadow = true; object.receiveShadow = true;
      }
    });
    for (const name of ["woodlons", "treeStalkers", "penguins", "penguinEggs", "penguinIslandNests", "hogwongs", "voidFish",
      "frostHounds", "redFish", "tuskjawSharks", "sulfurLizards", "sandWorms", "caveWorms", "jellyfish", "fauna", "squids", "crabColony", "wildlifeBroods"]) this.scene.add(this[name].group);
  }

  /** Device budgets cull distant creatures but never disable their animation.
   * Reduced motion is the explicit accessibility preference, independent of
   * screen size, touch controls or the mobile visibility budget. */
  updateCreatures(world, animation, dt) {
    const reducedMotion = this.reducedMotion === true, camera = this.camera.position, quality = this.quality;
    if(quality){quality.viewCamera=this.camera?.isCamera?this.camera:null;quality.fogDensity=this.scene?.fog?.density??0;}
    this.crabColony?.update(animation, dt, reducedMotion, camera, quality, this.crabVisibility,getWildlifeRenderPopulation(world,'crab'));
    this.wildlifeBroods?.update(world,animation,reducedMotion,camera,quality);
    for (const name of ["woodlons", "fauna", "squids", "jellyfish", "treeStalkers", "frostHounds", "voidFish", "redFish", "tuskjawSharks", "sulfurLizards", "sandWorms", "caveWorms", "hogwongs",
      "penguins", "penguinEggs", "penguinIslandNests"]) this[name]?.update(world, animation, reducedMotion, camera, quality);
  }

  /** Two merged meshes keep the entire enclosing cliff range inexpensive. */
  addBorders(borders) {
    this.shellFieldMap??=createShellFieldTexture();
    this.shellFieldNormalMap??=createShellFieldNormalTexture();
    const group = new THREE.Group();
    group.name = "world-border";
    this.borderGroup=group;
    for (const kind of ["iceberg", "stone"]) {
      if (!borders.some((entry) => entry.kind === kind)) continue;
      const material = kind === "iceberg"
        ? (this.materials?.ice ?? matte(0xffffff, { vertexColors: true }))
        : applyShellFieldSurface(this.materials?.rock?.clone() ?? matte(0xe28b45),this.shellFieldMap,this.shellFieldNormalMap);
      const geometry=kind==='stone'?finishOrangeBorderGeometry(borderGeometry(borders,kind)):borderGeometry(borders,kind);
      if(kind==='stone')material.flatShading=false;
      if(kind==='stone')addShellFieldBorderMask(geometry);
      const cliffs = new THREE.Mesh(geometry, material);
      cliffs.name = `${kind}-border`;
      cliffs.receiveShadow = true;
      group.add(cliffs);
    }
    this.scene.add(group);
  }

  /** Shared downward cones use exactly the simulation's spike positions and sizes. */
  addIceSpikes(spikes) {
    if (!spikes.length) return;
    const geometry = new THREE.ConeGeometry(1, 1, 7, 1, true);
    geometry.rotateZ(Math.PI);
    geometry.translate(0, -0.5, 0);
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(
      new Float32Array(geometry.attributes.position.count * 3).fill(1), 3));
    const material = this.materials?.ice ?? matte(0x91cfe4, { vertexColors: true });
    const mesh = new THREE.InstancedMesh(geometry, material, spikes.length);
    mesh.name = "ice-island-underside-spikes";
    const transform = new THREE.Object3D();
    spikes.forEach((spike, index) => {
      transform.position.set(spike.x / WORLD_SCALE, spike.z / WORLD_SCALE, spike.y / WORLD_SCALE);
      transform.scale.set(spike.radius / WORLD_SCALE, spike.length / WORLD_SCALE, spike.radius / WORLD_SCALE);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    });
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);
  }

  addFloe(parent, floe) {
    const group = new THREE.Group();
    group.name = floe.id;
    group.position.set(floe.x / WORLD_SCALE, 0, floe.y / WORLD_SCALE);
    const vertices = getPlatformVertices(floe);
    const body = mesh(
      group,
      glacierGeometry(floe, vertices),
      this.materials?.ice ?? matte(0xffffff, { vertexColors: true }),
    );
    body.name = "glacier-body";
    const points = vertices.map((p) => [
      (p.x - floe.x) / WORLD_SCALE,
      (p.y - floe.y) / WORLD_SCALE,
    ]);
    const top = mesh(
      group,
      floe.relief ? (() => {
        const surface=getIceSurface(floe),geometry=new THREE.BufferGeometry(),positions=[];
        for(const index of surface.indices)positions.push((surface.positions[index*3]-floe.x)/WORLD_SCALE,
          surface.positions[index*3+2]/WORLD_SCALE+.006,(surface.positions[index*3+1]-floe.y)/WORLD_SCALE);
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
        return geometry;
      })() : wingGeometry(points, 0.006),
      this.materials?.snow ?? matte(0xe7f1ee),
    );
    top.name = "snow-top";
    if(!floe.iceStyle&&(floe.biome==='iceberg-tundra'||floe.refinedIce)){
      const positions=top.geometry.attributes.position,colors=[],tint=new THREE.Color();
      for(let i=0;i<positions.count;i++){
        const shade=.97+.03*Math.sin(positions.getX(i)*.7+positions.getZ(i)*.9)**2;
        tint.setRGB(shade,shade,1);colors.push(tint.r,tint.g,tint.b);
      }
      top.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));projectSurfaceUVs(top.geometry);
      this.tundraGroundMaterial??=(this.materials?.snow?.clone()??matte(0xffffff));
      this.tundraGroundMaterial.vertexColors=true;this.tundraGroundMaterial.color.setHex(0xffffff);
      if(top.material!==this.materials?.snow)top.material.dispose();
      top.material=this.tundraGroundMaterial;
    }
    if(floe.iceStyle){
      colorIslandSurface(top.geometry,floe);projectSurfaceUVs(top.geometry);
      this.islandSurfaceMaterials??=new Map();
      if(!this.islandSurfaceMaterials.has(floe.iceStyle))this.islandSurfaceMaterials.set(floe.iceStyle,createIslandSurfaceMaterial(this.materials,floe.iceStyle));
      const material=this.islandSurfaceMaterials.get(floe.iceStyle);
      if(top.material!==this.materials?.snow&&top.material!==this.materials?.ice)top.material.dispose();
      top.material=material;
    }
    parent.add(group);
  }

  /** Chunks have their own submerged top; they share the physical taper. */
  addSubmergedIce(parent, chunk) {
    const group = new THREE.Group();
    group.name = chunk.id;
    group.position.set(
      chunk.x / WORLD_SCALE,
      chunk.z / WORLD_SCALE,
      chunk.y / WORLD_SCALE,
    );
    const vertices = getPlatformVertices(chunk);
    const body = mesh(
      group,
      glacierGeometry(chunk, vertices),
      this.materials?.ice ?? matte(0xffffff, { vertexColors: true }),
    );
    body.name = "submerged-ice-body";
    const cap = mesh(
      group,
      wingGeometry(
        vertices.map((p) => [
          (p.x - chunk.x) / WORLD_SCALE,
          (p.y - chunk.y) / WORLD_SCALE,
        ]),
        0.006,
      ),
      this.materials?.ice ?? matte(0xd3edf0),
    );
    cap.name = "submerged-ice-cap";
    parent.add(group);
  }

  /** Broken sections stay separate; there is no repaired or lift-off form. */
  createShip(design) {
    if (design?.designVersion === 2) return createCrashWreck(this.materials);
    const wreck = new THREE.Group();
    wreck.name = "surface-wreckage";
    wreck.userData.wreckage = true;
    const white = this.materials?.whiteMetal ?? matte(0xe7eae0),
      orange = this.materials?.orangeMetal ?? matte(0xd38a62),
      dark = this.materials?.darkMetal ?? matte(0x334e5d),
      metal = this.materials?.darkMetal ?? matte(0x839da5);
    const hull = groupAt(
      wreck,
      "split-fuselage",
      [0, 0.05, -0.05],
      [0.03, -0.11, 0.06],
    );
    mesh(hull, new THREE.BoxGeometry(0.95, 0.12, 1.45), dark, [0, 0.17, 0]);
    for (const side of [-1, 1]) {
      mesh(hull, new THREE.BoxGeometry(0.08, 0.57, 1.3), white, [
        side * 0.48,
        0.46,
        -0.08,
      ]);
      mesh(hull, new THREE.BoxGeometry(0.085, 0.15, 0.7), orange, [
        side * 0.48,
        0.52,
        0.15,
      ]);
      for (const z of [-0.55, 0, 0.45])
        mesh(hull, new THREE.BoxGeometry(0.1, 0.64, 0.045), metal, [
          side * 0.41,
          0.44,
          z,
        ]);
    }
    const tornPanel = mesh(
      hull,
      wingGeometry(
        [
          [-0.4, -0.68],
          [0.34, -0.65],
          [0.52, -0.35],
          [0.2, -0.12],
          [-0.1, -0.35],
        ],
        0.035,
      ),
      white,
      [0, 0.58, -0.15],
    );
    tornPanel.rotation.z = -0.3;
    for (let i = 0; i < 3; i++) {
      const wire = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.3 + i * 0.15, 0.4, 0.65),
        new THREE.Vector3(-0.25 + i * 0.17, 0.17, 1),
        new THREE.Vector3(-0.13 + i * 0.2, 0.1, 1.25),
      ]);
      hull.add(
        new THREE.Line(
          wire,
          new THREE.LineBasicMaterial({ color: i === 1 ? 0xc48e65 : 0x2e414b }),
        ),
      );
    }
    const nose = groupAt(
      wreck,
      "detached-cockpit",
      [0.3, 0.11, -1.9],
      [0.12, 0.33, -0.13],
    );
    const cone = mesh(
      nose,
      new THREE.ConeGeometry(0.54, 1.05, 12),
      white,
      [0, 0.4, -0.25],
    );
    cone.rotation.x = -Math.PI / 2;
    mesh(nose, new THREE.BoxGeometry(0.7, 0.16, 0.5), orange, [0, 0.55, 0.04]);
    const glass = mesh(
      nose,
      new THREE.SphereGeometry(0.42, 16, 10, 0, Math.PI * 1.35, 0, Math.PI / 2),
      this.materials?.glass ??
        new THREE.MeshPhongMaterial({
          color: 0x275969,
          shininess: 70,
          side: THREE.DoubleSide,
          flatShading: true,
        }),
      [0, 0.64, -0.2],
    );
    glass.scale.set(0.9, 0.6, 1.25);
    const exposed = mesh(
      nose,
      new THREE.CircleGeometry(0.44, 5),
      dark,
      [0, 0.41, 0.3],
    );
    exposed.rotation.y = 0;
    const left = groupAt(
      wreck,
      "detached-port-wing",
      [-2, 0.1, 0.25],
      [0.08, 0.45, 0.12],
    );
    mesh(
      left,
      wingGeometry([
        [-0.8, 0.6],
        [-0.2, -0.5],
        [0.9, -0.7],
        [0.65, 0.8],
        [0.1, 0.55],
      ]),
      white,
    );
    mesh(
      left,
      wingGeometry(
        [
          [-0.6, 0.5],
          [-0.3, 0.05],
          [0.55, 0.15],
          [0.5, 0.45],
        ],
        0.012,
      ),
      orange,
      [0, 0.1, 0],
    );
    const right = groupAt(
      wreck,
      "broken-starboard-wing",
      [2.1, 0.14, -1.1],
      [-0.12, -0.8, -0.1],
    );
    mesh(
      right,
      wingGeometry([
        [-0.7, 0.3],
        [-0.3, -0.65],
        [0.8, -0.2],
        [0.42, 0.7],
        [0.16, 0.3],
      ]),
      white,
    );
    mesh(right, new THREE.BoxGeometry(0.2, 0.13, 0.45), orange, [0.3, 0.11, 0]);
    const engine = groupAt(
      wreck,
      "detached-engine",
      [1.2, 0.27, 1.1],
      [0.18, 0.7, -0.1],
    );
    const casing = mesh(
      engine,
      new THREE.CylinderGeometry(0.28, 0.36, 0.7, 8, 1, true),
      metal,
    );
    casing.rotation.x = Math.PI / 2;
    const core = mesh(
      engine,
      new THREE.CircleGeometry(0.24, 8),
      dark,
      [0, 0, 0.36],
    );
    core.rotation.y = 0;
    mesh(engine, new THREE.BoxGeometry(0.55, 0.1, 0.18), orange, [0, 0.27, 0]);
    this.addShipDetails(hull);
    for (const [x, z, angle] of [
      [-1, 1.1, 0.5],
      [1.4, -2.3, -0.6],
      [-1.4, -1.4, 0.9],
    ]) {
      const scrap = mesh(
        wreck,
        wingGeometry(
          [
            [-0.25, -0.2],
            [0.35, -0.15],
            [0.21, 0.27],
            [-0.1, 0.15],
          ],
          0.03,
        ),
        white,
        [x, 0.04, z],
      );
      scrap.rotation.y = angle;
    }
    const heat = new THREE.PointLight(0xffb475, 1.2, 4.5, 2);
    heat.position.set(0, 0.55, 0.6);
    wreck.add(heat);
    return wreck;
  }

  /** Rivets, warning markings, windows, panel seams and exposed cables in four batches. */
  addShipDetails(hull) {
    const detail = new THREE.Group();
    detail.name = "wreck-engineering-details";
    hull.add(detail);
    const transform = new THREE.Object3D();
    const rivets = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.013, 1),
      this.materials?.darkMetal ?? matte(0x3d535d), 52);
    rivets.name = "hull-rivet-rows";
    let index = 0;
    for (const side of [-1, 1]) for (const y of [0.21, 0.72]) for (let bolt = 0; bolt < 13; bolt++) {
      transform.position.set(side * 0.526, y, -0.66 + bolt * 0.097);
      transform.scale.set(0.6, 1, 1);
      transform.updateMatrix(); rivets.setMatrixAt(index++, transform.matrix);
    }
    const warnings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65 }), 20);
    warnings.name = "diagonal-hazard-stripes";
    index = 0;
    const yellow = new THREE.Color(0xffbc42), dark = new THREE.Color(0x172d37);
    for (const side of [-1, 1]) for (let stripe = 0; stripe < 10; stripe++) {
      transform.position.set(side * 0.528, 0.52, -0.18 + stripe * 0.055);
      transform.rotation.set(0.35, 0, 0);
      transform.scale.set(0.008, 0.13, 0.026);
      transform.updateMatrix(); warnings.setMatrixAt(index, transform.matrix);
      warnings.setColorAt(index++, stripe % 2 ? dark : yellow);
    }
    const windows = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x235b72, emissive: 0x0e3247,
        emissiveIntensity: 0.22, roughness: 0.2, metalness: 0.42 }), 6);
    windows.name = "recessed-cabin-windows";
    index = 0;
    for (const side of [-1, 1]) for (const z of [-0.43, -0.1, 0.23]) {
      transform.position.set(side * 0.528, 0.65, z);
      transform.rotation.set(0, 0, 0); transform.scale.set(0.01, 0.10, 0.19);
      transform.updateMatrix(); windows.setMatrixAt(index++, transform.matrix);
    }
    const seams = [];
    for (const side of [-1, 1]) for (const z of [-0.59, -0.26, 0.08, 0.4])
      seams.push(side * 0.531, 0.19, z, side * 0.531, 0.735, z);
    for (let cable = 0; cable < 7; cable++) {
      const x = -0.3 + cable * 0.09, z = 0.54 + cable * 0.02;
      seams.push(x, 0.42, z, x + 0.04, 0.21, z + 0.35,
        x + 0.04, 0.21, z + 0.35, x - 0.03, 0.11, z + 0.54);
    }
    const lines = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position",
      new THREE.Float32BufferAttribute(seams, 3)), new THREE.LineBasicMaterial({ color: 0x243c49 }));
    lines.name = "panel-seams-and-torn-cable-bundle";
    detail.add(rivets, warnings, windows, lines);
  }

  addSunkenWreck(ship) {
    const wreck = new THREE.Group();
    wreck.name = "submerged-wreckage";
    const white = this.materials?.whiteMetal ?? matte(0xc9d8d5),
      orange = this.materials?.orangeMetal ?? matte(0xb88866),
      dark = this.materials?.darkMetal ?? matte(0x365363);
    const engine = groupAt(
      wreck,
      "sunken-engine",
      [
        ship.x / WORLD_SCALE + 7.2,
        SEABED_LEVEL / WORLD_SCALE + 0.5,
        ship.y / WORLD_SCALE - 0.8,
      ],
      [0.7, 0.5, 1],
    );
    mesh(
      engine,
      new THREE.CylinderGeometry(0.35, 0.45, 0.85, 7, 1, true),
      white,
    );
    mesh(
      engine,
      new THREE.TorusGeometry(0.41, 0.055, 4, 8),
      orange,
      [0, 0.35, 0],
    ).rotation.x = Math.PI / 2;
    const wing = groupAt(
      wreck,
      "seabed-wing",
      [
        ship.x / WORLD_SCALE + 9.5,
        SEABED_LEVEL / WORLD_SCALE + 0.12,
        ship.y / WORLD_SCALE + 4.2,
      ],
      [0.04, -0.5, 0.02],
    );
    mesh(
      wing,
      wingGeometry([
        [-1.3, -0.8],
        [-0.7, -1],
        [1.5, 0.5],
        [1.1, 1.1],
        [0.35, 0.8],
        [0.1, 0.5],
      ]),
      white,
    );
    mesh(
      wing,
      wingGeometry(
        [
          [-0.7, -0.2],
          [-0.3, -0.3],
          [1.1, 0.6],
          [0.8, 0.8],
        ],
        0.02,
      ),
      orange,
      [0, 0.1, 0],
    );
    for (const [x, z] of [
      [5.4, 2.7],
      [8.1, 6.3],
      [-4.5, -3.8],
    ]) {
      const panel = mesh(
        wreck,
        wingGeometry(
          [
            [-0.5, -0.3],
            [0.4, -0.2],
            [0.55, 0.3],
            [-0.2, 0.5],
          ],
          0.045,
        ),
        dark,
        [
          ship.x / WORLD_SCALE + x,
          SEABED_LEVEL / WORLD_SCALE + 0.08,
          ship.y / WORLD_SCALE + z,
        ],
      );
      panel.rotation.y = x;
    }
    this.scene.add(wreck);
  }

  addBeacon(beacon) {
    const group = new THREE.Group();
    group.position.set(beacon.x / WORLD_SCALE, (beacon.z??0) / WORLD_SCALE, beacon.y / WORLD_SCALE);
    mesh(
      group,
      new THREE.CylinderGeometry(0.1, 0.21, 0.7, 6),
      this.materials?.darkMetal ?? matte(0x587b88),
      [0, 0.35, 0],
    );
    mesh(
      group,
      new THREE.CylinderGeometry(0.12, 0.12, 0.36, 6),
      new THREE.MeshBasicMaterial({ color: 0xffd1a1 }),
      [0, 0.74, 0],
    );
    mesh(
      group,
      new THREE.CylinderGeometry(0.16, 0.16, 0.05, 6),
      this.materials?.darkMetal ?? matte(0x496c7b),
      [0, 0.94, 0],
    );
    const light = new THREE.PointLight(0xffb475, 2.4, 5.5, 2);
    light.position.y = 0.8;
    group.add(light);
    this.heatLights.push(light);
    this.scene.add(group);
  }

  /** Anchored scanner glyphs mark discoveries, rather than floating repair parts. */
  addPart(item) {
    const group = new THREE.Group();
    group.name = `discovery-${item.id}`;
    group.position.set(
      item.x / WORLD_SCALE,
      (item.z || 0) / WORLD_SCALE,
      item.y / WORLD_SCALE,
    );
    const color = item.kind === "wreck" ? 0xf0b888 : 0x9fe0db;
    const metal = matte(0x547c84);
    mesh(
      group,
      new THREE.CylinderGeometry(0.07, 0.15, 0.4, 5),
      metal,
      [0, 0.2, 0],
    );
    const glyph = groupAt(group, "scanner-glyph", [0, 0.8, 0]);
    const lineMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: item.kind === "wreck" ? 0.35 : 0.7,
    });
    const ring = mesh(
      glyph,
      new THREE.TorusGeometry(0.22, 0.012, 3, 16),
      lineMaterial,
    );
    ring.rotation.y = Math.PI / 4;
    mesh(glyph, new THREE.BoxGeometry(0.015, 0.6, 0.015), lineMaterial);
    mesh(glyph, new THREE.BoxGeometry(0.6, 0.015, 0.015), lineMaterial);
    const label = this.makeLabel(item.label.toUpperCase());
    label.name = "discovery-label";
    label.position.y = 1.35;
    label.visible = false;
    group.add(label);
    const light = new THREE.PointLight(color, 0.8, 3, 2);
    light.position.y = 0.6;
    group.add(light);
    this.parts.set(item.id, group);
    this.scene.add(group);
  }

  makeLabel(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "rgba(15, 43, 57, 0.8)";
      context.fillRect(0, 8, 512, 80);
      context.strokeStyle = "rgba(218, 238, 236, 0.25)";
      context.strokeRect(1, 9, 510, 78);
      context.font = "500 30px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#e4e9d7";
      context.fillText(text, 256, 49);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        fog: true,
      }),
    );
    sprite.scale.set(2.9, 0.54, 1);
    return sprite;
  }

  /** @param {import('./world.js').World} world */
  draw(world, time, dt, moving) {
    if (this.disposed || this.contextLost) return;
    if (!this.worldReady) this.addWorld(world);
    this.marineDetails?.update(world.player,this.renderDistance??80);
    for(const entry of this.distanceGroups??[]){if(entry.hidden){entry.group.visible=true;entry.hidden=false;}}
    if (dt > 0 && !this.reducedMotion) this.clock += dt;
    const animation = this.clock;
    // The saved simulation clock pauses with the expedition, independently of
    // reduced-motion animation and the page's lifetime.
    const cycle = sampleDayNight(world.elapsed, this.dayNight ??= {});
    const saltSection=getSaltCave(world.player.x,world.player.y,world.player.z,EYE_HEIGHT);
    const caveSection=saltSection??getBasinCave(world.player.x,world.player.y,world.player.z+EYE_HEIGHT);
    const activeWaterLevel=basinWaterLevel(world.player);
    const underwater = world.player.z+EYE_HEIGHT<activeWaterLevel;
    setFirstPersonSubmerged(underwater);
    const saltSurfaceAir=Boolean(saltSection&&!underwater&&world.player.z+EYE_HEIGHT>(getSulfuricGround(world.player.x,world.player.y)??Infinity));
    const caveAir=Boolean(caveSection&&!underwater&&!saltSurfaceAir);
    const biome = getWorldBiome(world, world.player.x, world.player.y, underwater);
    const sulfuricAir=(biome==='sulfuric-land'||saltSurfaceAir)&&!underwater;
    const blueOcean = !sulfuricAir&&(biome === "blue-ocean" || getBiome(world.player.x) === "blue-ocean");
    const forestAir = biome === "purple-forest";
    if(forestAir||biome==='jellyfish-spires')this.mossTexture?.start();
    // Physical perimeter cliffs remain visible at the ocean surface as well.
    if(this.borderGroup)this.borderGroup.visible=true;
    const forestBlend = forestAir ? forestLightBlend(world.forest, world.player.x, world.player.y) : 0;
    const depth = Math.max(0, (activeWaterLevel - world.player.z - EYE_HEIGHT) / WORLD_SCALE);
    const inBlueWater = underwater && blueOcean;
    const inDeepWater = inBlueWater || (underwater && biome === "blue-kelp-forest");
    const sunlight = (underwater ? Math.exp(-depth / WATER_OPTICS.sunlightDepth) : 1) * cycle.daylight;
    const shellLight = underwater ? shellFieldBlend(world.player.x,world.player.y) : 0;
    const waterLighting=underwater?getUnderwaterLighting(biome,depth,shellLight,this.waterLighting??={}):null;
    if(waterLighting){
      this.scene.background.setRGB(...waterLighting.background);
      this.scene.fog.density=waterLighting.fogDensity;
      this.ambient.color.setRGB(...waterLighting.ambient);
      this.ambient.groundColor.setRGB(...waterLighting.ground);
      this.keyLight.color.setRGB(...waterLighting.key);
      this.ambient.intensity=waterLighting.ambientIntensity;
      this.keyLight.intensity=waterLighting.keyIntensity;
      this.scene.environmentIntensity=waterLighting.environmentIntensity;
    }else{
      this.scene.background.setHex(blueOcean?BLUE_AIR_COLOR:AIR_COLOR);
      if(forestAir)this.scene.background.lerp(FOREST_AIR_TINT,forestBlend);
      this.scene.fog.density=(blueOcean?.0045:.0105)*(1-forestBlend)+.006*forestBlend;
      this.ambient.color.setHex(SURFACE_SKY_LIGHT).lerp(FOREST_SKY_LIGHT,forestBlend);
      this.ambient.groundColor.setHex(SURFACE_GROUND_LIGHT).lerp(FOREST_GROUND_LIGHT,forestBlend);
      this.keyLight.color.setHex(SURFACE_SUN_LIGHT).lerp(FOREST_SUN_LIGHT,forestBlend);
      this.ambient.intensity=SURFACE_AMBIENT-.18*forestBlend;
      this.keyLight.intensity=SURFACE_SUN-.65*forestBlend;
      this.scene.environmentIntensity=SURFACE_ENVIRONMENT-.08*forestBlend;
    }
    this.scene.fog.color.copy(this.scene.background);
    if(caveAir){this.scene.background.setHex(0x112733);this.scene.fog.color.copy(this.scene.background);this.scene.fog.density=.012;this.ambient.intensity=.55;this.keyLight.intensity=.3;this.scene.environmentIntensity=.3;}
    if(saltSection&&!saltSurfaceAir){
      this.scene.background.setHex(0x585b36);this.scene.fog.color.copy(this.scene.background);this.scene.fog.density=underwater?getWaterFogDensity('salt-cave',depth,0,true):.025;
      this.ambient.color.setHex(0xd7c794);this.ambient.groundColor.setHex(0x3c4029);this.keyLight.color.setHex(0xe9c681);
      this.ambient.intensity=.72;this.keyLight.intensity=.32;this.scene.environmentIntensity=.32;
    }
    if(sulfuricAir){
      this.scene.background.setHex(0xc8bd83);this.scene.fog.color.copy(this.scene.background);this.scene.fog.density=.008;
      this.ambient.color.setHex(0xffedc6);this.ambient.groundColor.setHex(0x766c45);this.keyLight.color.setHex(0xffe8b0);
    }
    if(!caveAir&&(!saltSection||saltSurfaceAir))applyDayNightLighting(this,cycle,underwater);
    this.waterMaterial.uniforms.time.value = animation;
    this.waterMaterial.uniforms.underwater.value = underwater ? 1 : 0;
    this.waterMaterial.uniforms.viewerDepth.value = depth;
    this.waterMaterial.uniforms.daylight.value = cycle.daylight;
    this.waterMaterial.uniforms.sunDirection.value.set(cycle.sunX,cycle.sunY,cycle.sunZ);
    this.causticsMaterial.uniforms.time.value = animation;
    this.causticsMaterial.uniforms.waterLevel.value = activeWaterLevel/WORLD_SCALE;
    this.causticsMaterial.uniforms.waterFogDensity.value = this.scene.fog.density;
    this.causticsMaterial.uniforms.sunStrength.value = cycle.daylight;
    this.water.position.x = world.player.x / WORLD_SCALE;
    this.water.position.z = world.player.y / WORLD_SCALE;
    const walking =
      moving &&
      !world.player.jumping &&
      !world.player.falling &&
      !world.player.swimming &&
      world.player.z >= -0.01;
    // The eye is exactly simulation feet + eye height, including underwater.
    this.camera.position.set(
      world.player.x / WORLD_SCALE,
      (EYE_HEIGHT + world.player.z) / WORLD_SCALE,
      world.player.y / WORLD_SCALE,
    );
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.y = -this.yaw;
    this.camera.rotation.z =
      walking && !this.reducedMotion ? Math.sin(animation * 5.5) * 0.002 : 0;
    this.driftIce?.update(animation,this.reducedMotion,this.camera.position,this.renderDistance??Infinity);
    const tremor=sampleSandWormShake(world,this.reducedMotion);
    this.camera.position.x+=tremor.x;this.camera.position.y+=tremor.y;this.camera.rotation.z+=tremor.roll;
    this.conceptSky?.update(this.camera, this.scene.background, underwater, blueOcean, forestBlend, forestAir,animation,this.reducedMotion,cycle);
    if(sulfuricAir&&this.conceptSky){
      this.conceptSky.material.uniforms.zenith.value.setHex(0x827849).multiplyScalar(.13+.87*cycle.daylight);
      this.conceptSky.mountains.mesh.visible=false;
    }
    if(this.conceptSky&&Math.abs(world.player.x-SULFURIC_PASSAGE.x)<400&&world.player.y<SULFURIC_PASSAGE.frontY+300)
      this.conceptSky.mountains.mesh.visible=false;
    if(caveSection&&!saltSurfaceAir)this.conceptSky.group.visible=false;
    this.aimAtSquidEncounter(world, dt);
    this.sharedFeedingSuit.update(world.squidEncounter,this.camera);
    this.updateGlassBudget();
    const lightX = Math.round(this.camera.position.x * 2) / 2;
    const lightZ = Math.round(this.camera.position.z * 2) / 2;
    const lightY = underwater ? this.camera.position.y : 0;
    const moon = cycle.sunY < 0 ? -1 : 1;
    if(caveAir||(saltSection&&!saltSurfaceAir))this.keyLight.position.set(lightX-40,lightY+55,lightZ-80);
    else this.keyLight.position.set(lightX + cycle.sunX * moon * 100, lightY + Math.max(.04,cycle.sunY * moon) * 100,
      lightZ + cycle.sunZ * moon * 100);
    this.keyLight.target.position.set(lightX, lightY, lightZ);
    this.diveLight.color.setHex(saltSection&&!saltSurfaceAir?0xffdda0:0xc4e4ff);
    this.diveLight.intensity=caveAir?18:(waterLighting?.diveLightIntensity??0);
    // Existing close-surface exposure correction also protects the new canyon
    // views. It samples the real floor at perception cadence; no new light.
    if(underwater&&!saltSection){
      const p=world.player,last=this.spireLightSample;
      this.camera.getWorldDirection(this.diveDirection);
      if(!last||Math.hypot(p.x-last.x,p.y-last.y,p.z-last.z)>30||Math.abs(this.yaw-last.yaw)+Math.abs(this.pitch-last.pitch)>.04||world.elapsed-last.time>.25)
        this.spireLightSample={x:p.x,y:p.y,z:p.z,time:world.elapsed,yaw:this.yaw,pitch:this.pitch,
          gain:getJellyfishSpiresDiveLightGain(p,{x:this.diveDirection.x,y:this.diveDirection.z,z:this.diveDirection.y})};
      const targetGain=this.spireLightSample.gain;
      this.spireLightGain=dt>0?THREE.MathUtils.lerp(this.spireLightGain??targetGain,targetGain,1-Math.exp(-dt*8)):targetGain;
      this.diveLight.intensity*=this.spireLightGain;
    }
    if(saltSection&&!saltSurfaceAir)this.diveLight.intensity=28;
    this.diveLight.position.copy(this.camera.position);
    this.camera.getWorldDirection(this.diveDirection);
    this.diveLight.target.position.copy(this.camera.position).addScaledVector(this.diveDirection, 14);
    this.crabVisibility ??= { cameraDirection: this.diveDirection, fogDensity: 0 };
    this.crabVisibility.fogDensity = this.scene.fog.density;
    this.updateCreatures(world, animation, dt);
    this.basinCaves?.update(this.camera.position);
    this.saltCave?.update(this.camera.position,animation,this.reducedMotion);
    this.worldBarnacles?.update(this.camera.position,animation,this.reducedMotion);
    this.basinDetails?.update(this.camera.position,animation,this.reducedMotion);
    this.copperCargo?.update(world);
    this.heldItems?.update(world,animation,dt,moving,this.quality);
    if(this.heldItems)this.heldItems.group.visible&&=Boolean(this.playing);
    this.salvage?.update(world,this.camera.position,this.renderDistance??Infinity);
    this.playerBases?.update(world,this.camera.position,this.renderDistance??Infinity);
    const activeRocks=activeWorldRocks(world);
    if(this.activeRockKey!==activeRocks.key){
      this.activeRockKey=activeRocks.key;this.instanceRenderDistance?.setHiddenIds(activeRocks.ids);
      this.quality.removedRockIds=activeRocks.ids;
      const cap=this.scene.getObjectByName('underwater-boulder-sand');
      if(cap)this.staticRenderDistance?.setHiddenVertexRanges(cap,(cap.geometry.userData.rockRanges??[]).filter(range=>activeRocks.ids.has(range.id)));
    }
    this.largeGlacierWreck?.update(this.camera.position);
    this.basinMerchCargo?.update(this.camera.position);
    this.crobanMango?.update(world,this.camera.position);
    this.flora?.update(animation, this.reducedMotion, this.camera.position,this.quality);
    this.forest?.update(world, animation, this.reducedMotion, this.camera.position, this.quality);
    this.sulfuric?.update(this.camera.position,animation,this.reducedMotion,world.elapsed);
    this.jellyfishSpires?.update(world,this.camera.position,this.renderDistance??80);
    this.gravelPebbles?.update(this.camera.position,this.quality,this.renderDistance??80);
    this.spiresGrowth?.update(this.camera,this.renderDistance??80,animation,this.reducedMotion,{mobile:this.quality?.mobile});
    this.seaweed?.update(animation, this.reducedMotion, this.camera.position, this.quality);
    this.arcticGardens?.update(animation, this.reducedMotion, this.camera.position, this.quality);
    this.plants?.update(animation, this.reducedMotion, this.camera.position, this.quality,world);
    this.tundra?.update(animation, this.reducedMotion, this.camera.position, this.quality,world);
    this.underwaterFx?.update(this.camera.position, animation, {
      underwater, reducedMotion: this.reducedMotion, depth, direction: this.diveDirection,
      waterLevel:activeWaterLevel/WORLD_SCALE,turbidity:Math.max(.8,Math.min(1.6,this.scene.fog.density/.05)),
      daylight:cycle.daylight,
    });
    const fogDepth = fogVisibilityDepth(this.scene.fog.density, .0001);
    let shadowFrustum;
    for (const { group, volume, worldBounds } of this.terrainChunks ?? []) {
      const distance = Math.hypot(this.camera.position.x - volume.x / WORLD_SCALE,
        this.camera.position.z - volume.y / WORLD_SCALE);
      group.visible = distance < (this.quality?.terrainDistance ?? 160)
        + Math.max(volume.rx, volume.ry) / WORLD_SCALE;
      if (!group.visible || !worldBounds
        || boxViewDepth(worldBounds, this.camera.position, this.diveDirection) < fogDepth) continue;
      // A fog-hidden island can still shade visible ground. Retain possible
      // casters in the light's own frustum, independently of the viewer.
      if (this.keyLight.castShadow && !shadowFrustum) {
        this.keyLight.updateWorldMatrix(true, false);
        this.keyLight.target.updateWorldMatrix(true, false);
        this.keyLight.shadow.updateMatrices(this.keyLight);
        shadowFrustum = this.keyLight.shadow.getFrustum();
      }
      group.visible = Boolean(shadowFrustum?.intersectsBox(worldBounds));
    }
    updateSeabedBatchVisibility(this.seabedBatch, this.camera, this.scene.fog.density,this.renderDistance??Infinity);
    this.staticRenderDistance?.update(this.camera,this.renderDistance??Infinity,this.scene.fog.density);
    this.instanceRenderDistance?.update(this.camera.position,this.renderDistance??Infinity,this.camera,this.scene.fog.density);
    for (const item of world.items) {
      const object = this.parts.get(item.id);
      if (!object) continue;
      object.visible = !item.collected;
      const label = object.getObjectByName("discovery-label");
      if (label) {
        label.visible = this.playing;
        const distance = this.camera.position.distanceTo(
          label.getWorldPosition(new THREE.Vector3()),
        );
        const viewHeight =
          2 *
          distance *
          Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
        const width = Math.min(
          2.9,
          Math.max(0.001, (viewHeight * 120) / (this.height || 720)),
        );
        label.scale.set(width, width * 0.1875, 1);
      }
      const glyph = object.getObjectByName("scanner-glyph");
      if (glyph) {
        glyph.rotation.y = animation * 0.4;
        glyph.position.y = 0.8 + Math.sin(animation * 1.5 + item.x) * 0.035;
      }
    }
    this.heatLights.forEach((light, index) => {
      light.intensity = 2.25 + Math.sin(animation * 2 + index) * 0.12;
    });
    this.blizzard.update(this.camera.position, animation, {
      underwater:underwater||Boolean(caveSection)||Boolean(insideUniversalBase(world)), blueOcean: blueOcean || forestAir || sulfuricAir, reducedMotion: this.reducedMotion,
      boundaryX: BLUE_OCEAN_START_X / WORLD_SCALE,
    });
    this.bubbles.visible = underwater;
    this.bubbles.material.opacity = inDeepWater ? 0.12 + 0.23 * sunlight : 0.35;
    const bubblePositions = this.bubbleGeometry.attributes.position;
    this.bubbleSeeds.forEach((bubble, index) => {
      bubblePositions.setXYZ(
        index,
        bubble.x + Math.sin(animation + index) * 0.06,
        ((bubble.y + animation * bubble.speed) % 12) - 6,
        bubble.z,
      );
    });
    bubblePositions.needsUpdate = true;
    this.bubbles.position.copy(this.camera.position);
    for(const entry of this.distanceGroups??[])if(entry.group.visible&&entry.bounds.distanceToPoint(this.camera.position)>(this.renderDistance??Infinity)){entry.group.visible=false;entry.hidden=true;}
    this.renderer.render(this.scene, this.camera);
    if (!this.waterShadersScheduled && this.renderer.compile) {
      this.waterShadersScheduled = true;
      this.cancelWaterShaderWarmup = scheduleWaterShaderWarmup(
        this.renderer, this.camera, this.scene, [this.underwaterFx?.group, this.bubbles].filter(Boolean),
      );
    }
  }

  /** Map outlines use the same chipped ice polygons as the 3D world. */
  drawMap(canvas, world) {
    const context = canvas.getContext("2d");
    if (!context) return;
    const width = canvas.width,
      height = canvas.height,
      scale = Math.min(
        (width - 24) / (SULFURIC_MAP_BOUNDS.maxX - SULFURIC_MAP_BOUNDS.minX),
        (height - 36) / (SULFURIC_MAP_BOUNDS.maxY - SULFURIC_MAP_BOUNDS.minY),
      );
    const centerX = (SULFURIC_MAP_BOUNDS.minX + SULFURIC_MAP_BOUNDS.maxX) / 2;
    const centerY = (SULFURIC_MAP_BOUNDS.minY + SULFURIC_MAP_BOUNDS.maxY) / 2;
    const point = (x, y) => ({
      x: width * 0.5 + (x - centerX) * scale,
      y: height * 0.53 + (y - centerY) * scale,
    });
    context.clearRect(0, 0, width, height);
    const northwest = point(SULFURIC_MAP_BOUNDS.minX, SULFURIC_MAP_BOUNDS.minY);
    const southeast = point(SULFURIC_MAP_BOUNDS.maxX, SULFURIC_MAP_BOUNDS.maxY);
    const boundary = point(BLUE_OCEAN_START_X, 0).x;
    const fillPolygon=(polygon,color)=>{context.beginPath();polygon.forEach((v,i)=>{const p=point(v.x,v.y);i?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y);});context.closePath();context.fillStyle=color;context.fill();};
    const half=(east)=>{
      const result=[];
      for(let i=0;i<MAIN_PERIMETER.length;i++){
        const a=MAIN_PERIMETER[i],b=MAIN_PERIMETER[(i+1)%MAIN_PERIMETER.length],ain=east?a.x>=BLUE_OCEAN_START_X:a.x<=BLUE_OCEAN_START_X,bin=east?b.x>=BLUE_OCEAN_START_X:b.x<=BLUE_OCEAN_START_X;
        if(ain)result.push(a);if(ain!==bin){const t=(BLUE_OCEAN_START_X-a.x)/(b.x-a.x);result.push({x:BLUE_OCEAN_START_X,y:a.y+(b.y-a.y)*t});}
      }
      return result;
    };
    fillPolygon(half(false),'#99bfc315');fillPolygon(half(true),'#102e6399');
    fillPolygon(JELLYFISH_SPIRES.boundary,'#595b778c');
    const spireLabel=point((JELLYFISH_SPIRES.minX+JELLYFISH_SPIRES.maxX)/2,(JELLYFISH_SPIRES.minY+JELLYFISH_SPIRES.maxY)/2);
    context.font='7px sans-serif';context.textAlign='center';context.fillStyle='#d4b3ed';context.fillText('JELLYFISH SPIRES',spireLabel.x,spireLabel.y);
    context.beginPath();SHELL_FIELD.boundary.forEach((vertex,index)=>{
      const p=point(vertex.x,vertex.y);index?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y);
    });
    context.closePath();context.fillStyle='#d8b6a58c';context.fill();
    context.strokeStyle='#e2c5b3b3';context.stroke();
    const shellLabel=point(4550,-9850);context.save();context.translate(shellLabel.x,shellLabel.y);
    context.font='7px sans-serif';context.textAlign='center';context.fillStyle='#f2d9c8';
    context.fillText('SHELL FIELD',0,0);context.restore();
    fillPolygon(SULFUR_PERIMETER,'#cab74b99');
    const sulfurLabel=point((SULFURIC_LAND.minX+SULFURIC_LAND.maxX)/2,(SULFURIC_LAND.minY+SULFURIC_LAND.maxY)/2);context.font='7px sans-serif';context.textAlign='center';context.fillStyle='#f6df75';context.fillText('SULFURIC LAND',sulfurLabel.x,sulfurLabel.y);
    context.strokeStyle = "#9ec3c610";
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    if(world.arcticGardens)for(const region of ARCTIC_GARDEN_REGIONS){
      context.beginPath();region.boundary.forEach((v,i)=>{const p=point(v.x,v.y);i?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y);});
      context.closePath();context.fillStyle=region.id==='blue-kelp-forest'?'#398dd252':'#e798434a';context.fill();
    }
    for (const floe of world.platforms) {
      context.beginPath();
      getPlatformVertices(floe).forEach((vertex, index) => {
        const p = point(vertex.x, vertex.y);
        index ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y);
      });
      context.closePath();
      context.fillStyle = floe.biome === "iceberg-tundra" ? "#e7f4f9d9" : floe.biome === "cliff-biome" ? "#c9e3efc0" : "#9bc2c12d";
      context.fill();
      context.strokeStyle = "#b3d2cc35";
      context.stroke();
    }
    for (const border of world.borders ?? []) {
      if(border.start){fillPolygon([border.start,border.end,border.outerEnd,border.outerStart],border.kind==='iceberg'?'#b7dae58c':'#e79857c0');continue;}
      const p = point(border.x - border.rx, border.y - border.ry);
      context.fillStyle = border.kind === "iceberg" ? "#b7dae58c" : "#e79857c0";
      context.fillRect(p.x, p.y, border.rx * 2 * scale, border.ry * 2 * scale);
    }
    context.beginPath();SALT_CAVE_STATIONS.forEach(([y,x],i)=>{const p=point(x,y);i?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y);});context.strokeStyle='#f4d7e2';context.lineWidth=2;context.stroke();
    for(const [x,y]of[[5150,-11300],[SALT_CAVE_SHAFT.x,SALT_CAVE_SHAFT.y]]){const p=point(x,y);context.fillStyle='#fff1ed';context.beginPath();context.arc(p.x,p.y,3,0,TAU);context.fill();}
    for(const hall of SALT_CAVE_HALLS){context.beginPath();hall.forEach(([x,y],i)=>{const p=point(x,y);i?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y);});context.strokeStyle='#f4d7e2';context.lineWidth=1;context.stroke();}
    const saltLabel=point(5680,-12500);context.font='7px sans-serif';context.fillStyle='#f1dce5';context.fillText('SALT CAVE',saltLabel.x,saltLabel.y);
    const arch=point(SULFURIC_PASSAGE.x,SULFURIC_PASSAGE.innerY);context.fillStyle='#f6df75';context.beginPath();context.arc(arch.x,arch.y,3,0,TAU);context.fill();
    if (world.forest?.boundary?.length) {
      context.beginPath();
      world.forest.boundary.forEach((vertex, index) => {
        const p = point(vertex.x, vertex.y);
        index ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y);
      });
      context.closePath(); context.fillStyle = "#8763a6c0"; context.fill();
      context.strokeStyle = "#d0a6decc"; context.lineWidth = 1; context.stroke();
      if (world.forest.trail?.length) {
        context.beginPath();
        world.forest.trail.forEach((waypoint, index) => {
          const p = point(waypoint.x, waypoint.y);
          index ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y);
        });
        context.strokeStyle = "#f1d6a4b3"; context.lineWidth = 1.2; context.stroke();
      }
      for (const tree of (world.forest.trees ?? []).filter((_tree, index) => index % 8 === 0)) {
        const p = point(tree.x, tree.y);
        context.fillStyle = "#c7a6d9"; context.fillRect(p.x - 0.6, p.y - 0.6, 1.2, 1.2);
      }
      const anchor = world.forest.trail?.[Math.floor(world.forest.trail.length / 2)] ?? world.forest.boundary[0];
      const label = point(anchor.x, anchor.y);
      context.font = "7px sans-serif"; context.textAlign = "center";
      context.fillStyle = "#e3cbed"; context.fillText("VIOLET FOREST", label.x, label.y - 8);
      context.textAlign = "left";
    }
    for (const item of world.items) {
      if (item.collected) continue;
      const p = point(item.x, item.y);
      context.strokeStyle = item.z < WATER_LEVEL ? "#9fe0db" : "#efb57f";
      context.strokeRect(p.x - 2.5, p.y - 2.5, 5, 5);
    }
    for (const crab of world.crabs ?? []) {
      if (crab.lifecycleInactive || crab.squidRespawnIn > 0) continue;
      const p = point(crab.x, crab.y);
      context.beginPath();
      context.arc(p.x, p.y, 2, 0, TAU);
      context.fillStyle = "#d8b85d";
      context.fill();
    }
    for(const lizard of world.sulfurLizards??[]){
      if(lizard.squidRespawnIn>0)continue;const p=point(lizard.x,lizard.y);context.fillStyle='#91c1ae';context.fillRect(p.x-1,p.y-1,2,2);
    }
    for(const worm of world.sandWorms??[]){
      if(worm.squidRespawnIn>0)continue;const p=point(worm.x,worm.y);context.fillStyle='#e5a460';context.beginPath();context.arc(p.x,p.y,2.5,0,TAU);context.fill();
    }
    for (const isopod of world.isopods ?? []) {
      if (isopod.squidRespawnIn > 0) continue;
      const p = point(isopod.x, isopod.y);
      context.fillStyle = "#74d9f6";
      context.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
    for (const squid of world.squids ?? []) {
      if (squid.squidRespawnIn > 0) continue;
      const p = point(squid.x, squid.y);
      context.beginPath();
      context.arc(p.x, p.y, 2.2, 0, TAU);
      context.strokeStyle = "#77aaff";
      context.lineWidth = 1.3;
      context.stroke();
    }
    for (const squid of world.adultSquids ?? []) {
      if (squid.squidRespawnIn > 0) continue;
      const p = point(squid.x, squid.y);
      context.beginPath();
      context.arc(p.x, p.y, 4.5, 0, TAU);
      context.fillStyle = "#e96d68";
      context.fill();
      context.beginPath();
      context.arc(p.x, p.y, 7, 0, TAU);
      context.strokeStyle = "#e96d68a0";
      context.lineWidth = 1.3;
      context.stroke();
    }
    for (const hunter of world.centipedes ?? []) {
      if (hunter.squidRespawnIn > 0) continue;
      if (hunter.segments?.length) {
        context.beginPath();
        hunter.segments.forEach((segment, index) => {
          const s = point(segment.x, segment.y);
          index ? context.lineTo(s.x, s.y) : context.moveTo(s.x, s.y);
        });
        context.strokeStyle = "#ee887db3";
        context.lineWidth = 1.5;
        context.stroke();
      }
      const p = point(hunter.x, hunter.y);
      context.beginPath();
      context.arc(p.x, p.y, 2.5, 0, TAU);
      context.fillStyle = "#ee887d";
      context.fill();
    }
    const wreck = point(world.ship.x, world.ship.y);
    context.strokeStyle = "#81b7bc";
    context.strokeRect(wreck.x - 3, wreck.y - 3, 6, 6);
    const player = point(world.player.x, world.player.y);
    context.save();
    context.translate(player.x, player.y);
    context.rotate(this.yaw);
    context.beginPath();
    context.moveTo(0, -6);
    context.lineTo(4, 4);
    context.lineTo(0, 2);
    context.lineTo(-4, 4);
    context.closePath();
    context.fillStyle = "#f5f5ed";
    context.fill();
    context.restore();
    context.strokeStyle = "#f5f5ed55";
    context.beginPath();
    context.arc(player.x, player.y, 9, 0, TAU);
    context.stroke();
    context.fillStyle = "#789ba6";
    context.font = "8px sans-serif";
    context.textAlign = "center";
    context.fillText("N", width * 0.5, 12);
    context.fillStyle = "#b9d3d9";
    context.fillText("ARCTIC", (northwest.x + boundary) * 0.5, height - 3);
    context.fillStyle = "#87aade";
    context.fillText("BLUE OCEAN", (boundary + southeast.x) * 0.5, height - 3);
    context.textAlign = "left";
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelWaterShaderWarmup?.();
    const managedTextures=new Set([...(this.marineDetails?.ownedTextures??[]),...(this.mossTexture?.ownedTextures??[])]);
    this.mossTexture?.dispose();this.mossTexture=null;
    this.marineDetails?.dispose();this.marineDetails=null;
    this.jellyfishSpires?.dispose();this.jellyfishSpires=null;
    this.gravelPebbles?.dispose();this.gravelPebbles=null;
    this.spiresGrowth?.dispose();this.spiresGrowth=null;
    this.staticRenderDistance?.dispose();this.instanceRenderDistance?.dispose();
    for (const name of ["heldItems", "salvage", "playerBases", "driftIce", "worldRocks", "worldBarnacles", "spiresSubmarine", "saltCave", "caveWorms", "sandWorms", "sulfurLizards", "sulfuric", "crobanMango", "basinMerchCargo", "largeGlacierWreck", "copperCargo", "basinDetails", "woodlons", "basinCaves", "penguinIslandNests", "penguinEggs", "penguins", "hogwongs", "wildlifeBroods", "tundra", "redFish", "tuskjawSharks", "voidFish", "frostHounds", "arcticGardens", "jellyfish", "conceptSky", "forest", "treeStalkers", "seaweed", "plants", "underwaterFx", "crabColony", "fauna", "squids", "flora", "blizzard"]) {
      const owner = this[name], group = owner?.group;
      owner?.dispose(); group?.removeFromParent(); this[name] = null;
    }
    const geometries = new Set(),
      materials = new Set();
    this.scene.traverse((object) => {
      if (object.isInstancedMesh) object.dispose();
      if (object.geometry) geometries.add(object.geometry);
      const list = Array.isArray(object.material)
        ? object.material
        : [object.material];
      list.filter(Boolean).forEach((material) => materials.add(material));
    });
    geometries.forEach((geometry) => geometry.dispose());
    const shared = new Set(
      Object.values(this.materials ?? {}).filter((value) => value?.isMaterial),
    );
    const materialTextures = (material) => Object.values(material).filter((value) => value?.isTexture);
    const sharedTextures = new Set([
      ...managedTextures,
      ...Object.values(this.materials ?? {}).filter((value) => value?.isTexture),
      ...[...shared].flatMap(materialTextures),
    ]);
    const textures = new Set();
    materials.forEach((material) => {
      if (shared.has(material)) return;
      materialTextures(material).forEach((texture) => {
        if (!sharedTextures.has(texture)) textures.add(texture);
      });
      material.dispose();
    });
    textures.forEach((texture) => texture.dispose());
    this.materials?.dispose();
    this.renderer.dispose();
  }
}
