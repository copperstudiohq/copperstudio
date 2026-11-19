import * as THREE from './assets/three.module.js';
import { createCreature, animateModel } from './models.js';
import { createCopperMegaDrill, animateCopperMegaDrill } from './copper-mega-drill.js';
import { createSurfaceBoxGeometry } from './arena-surfaces.js';
import { mergeStaticMeshes } from './static-batches.js';
import { getUltraEncounterPose, getUltraCinematicDrones, getUltraCinematicMiners, getUltraCinematicMegaDrill, MECH_ULTRA_TIMELINE, ULTRA_CRASH_SPOT, ULTRA_CINEMATIC_DURATION, ULTRA_SURFACE_HEIGHT } from './mech-ultra-encounter.js';
import { ULTRA_ORIGIN, ULTRA_ROBOT_TYPES, initializeMechUltra } from './mech-ultra-combat.js';
import { ULTRA_COVER_BOXES, ULTRA_RIM_TUNNELS, ULTRA_TUNNEL_WALLS } from './mech-ultra-cover.js';
export { ULTRA_ISLAND, ULTRA_COVER_BOXES } from './mech-ultra-cover.js';

export const ULTRA_CAVERN = Object.freeze({ halfWidth: 180, halfDepth: 150, height: 600 });
export const ULTRA_LAVA_STRIPS = Object.freeze([
  { x: 0, z: -90, width: 360, depth: 120 }, { x: 0, z: 90, width: 360, depth: 120 },
  { x: -108, z: 0, width: 144, depth: 60 }, { x: 108, z: 0, width: 144, depth: 60 },
].map(strip => Object.freeze(strip)));
const ULTRA_TYPE = 'mech-spider-tank-ultra';
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const stageStart = name => MECH_ULTRA_TIMELINE.find(entry => entry.stage === name).start;
const FLIGHT_PROFILES = Object.freeze({
  'copper-repair-drone': Object.freeze({ focusY: .3, cameraDistance: 5, motorY: -.04, motorZ: -.62,
    motorSpread: .62, ventHalfHeight: .095, motorWidth: .09, motorLength: .28, wakeLength: 1.6, wakeWidth: .075, lightIntensity: 3, lightDistance: 5 }),
  'copper-spider-drone': Object.freeze({ focusY: 2.4, cameraDistance: 20, motorY: 1.55, motorZ: -.7,
    motorSpread: .72, ventHalfHeight: .08, motorWidth: .22, motorLength: .6, wakeLength: 6, wakeWidth: .2, lightIntensity: 30, lightDistance: 15 }),
  'copper-mine-walker': Object.freeze({ focusY: 11.5, cameraDistance: 45, motorY: 9.64, motorZ: -1.8,
    motorSpread: 2.8, ventHalfHeight: .09, motorWidth: .5, motorLength: 1.4, wakeLength: 15, wakeWidth: .45, lightIntensity: 140, lightDistance: 40 }),
});

/** War placements also select the environment, before the battle has started. */
export function isUltraArenaActive(state) {
  return state?.mode !== 'menu' && (Boolean(state?.ultraEncounter)
    || (state?.enemies || []).some(actor => actor.type === ULTRA_TYPE && (actor.hp == null || actor.hp > 0)));
}

/** One plain visual follows the hand until simulation places the independent robot actor. */
export function updateUltraHeldRobot(record, enemy, time = 0) {
  const anchor = record?.model?.userData.heldEnemyAnchor, state = enemy?.ultra;
  const hand = enemy?.weaponState?.['ultra-hand-fabricator'], handAlive = !hand || hand.remaining > 0;
  const type = state?.fabricatedType;
  const active = anchor && enemy?.hp > 0 && handAlive && ULTRA_ROBOT_TYPES.includes(type)
    && ['building', 'placing'].includes(state?.fabricationPhase);
  if (record?.ultraHeldRobot && (!active || record.ultraHeldRobot.type !== type)) {
    const model = record.ultraHeldRobot.model; model.removeFromParent(); model.userData.disposeVisuals?.();
    if (!model.userData.disposeVisuals) model.traverse(part => { if (part.isInstancedMesh) part.dispose(); });
    record.ultraHeldRobot = null;
  }
  if (!active) return null;
  if (!record.ultraHeldRobot) {
    const model = createCreature(type); model.name = `ultra-held-${type}`;
    anchor.add(model); record.ultraHeldRobot = { type, model };
  }
  const model = record.ultraHeldRobot.model;
  const progress = state.fabricationPhase === 'placing' ? 1 : clamp(Number.isFinite(state.fabricationProgress) ? state.fabricationProgress : 0);
  animateModel(model, Number.isFinite(time) ? time : 0, 0, 'chase');
  model.scale.setScalar(progress); model.visible = progress > 0;
  return model;
}

function lavaTexture() {
  const side = 32, pixels = new Uint8Array(side * side * 4);
  for (let z = 0; z < side; z++) for (let x = 0; x < side; x++) {
    const vein = Math.sin(x * .18 + Math.sin(z * .14) * 1.2) + Math.cos(z * .16 + x * .06);
    const bright = Math.abs(vein) < .18, dark = vein < -.7, at = (z * side + x) * 4;
    pixels.set(bright ? [255, 170, 36, 255] : dark ? [75, 17, 8, 255] : [190, 49, 9, 255], at);
  }
  const texture = new THREE.DataTexture(pixels, side, side); texture.name = 'ultra-pixel-lava';
  texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
  texture.repeat.set(8, 6); texture.needsUpdate = true; return texture;
}

/** Reuse the real models as a few material batches; cinematic props never allocate voxel bodies. */
function compactVisualLibrary(type) {
  const source = createCreature(type), groups = new Map(), copies = [], instance = new THREE.Matrix4();
  source.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(source);
  const visualRadius = bounds.getSize(new THREE.Vector3()).length() / 2;
  source.traverseVisible(mesh => {
    if (!mesh.isMesh || Array.isArray(mesh.material)) return;
    const key = `${mesh.geometry.uuid}:${mesh.material.uuid}`;
    if (!groups.has(key)) groups.set(key, { geometry: mesh.geometry, material: mesh.material, matrices: [] });
    const matrices = groups.get(key).matrices;
    if (mesh.isInstancedMesh) for (let index = 0; index < mesh.count; index++) {
      mesh.getMatrixAt(index, instance); matrices.push(new THREE.Matrix4().multiplyMatrices(mesh.matrixWorld, instance));
    } else matrices.push(mesh.matrixWorld.clone());
  });
  return {
    create() {
      const root = new THREE.Group(); root.name = `ultra-cinematic-${type}`;
      root.userData = { type, visualRadius, flightProfile: FLIGHT_PROFILES[type] };
      for (const { geometry, material, matrices } of groups.values()) {
        const batch = new THREE.InstancedMesh(geometry, material, matrices.length);
        matrices.forEach((matrix, index) => batch.setMatrixAt(index, matrix));
        batch.instanceMatrix.needsUpdate = true; batch.castShadow = false; batch.receiveShadow = true;
        root.add(batch); copies.push(batch);
      }
      return root;
    },
    dispose() {
      for (const batch of copies) batch.dispose();
      source.userData.disposeVisuals?.();
      if (!source.userData.disposeVisuals) source.traverse(mesh => { if (mesh.isInstancedMesh) mesh.dispose(); });
    },
  };
}

/** One powered flight wake and bounded debris draws serve the entire serial entrance. */
function createCinematicEffects(parent, ownGeometry, ownMaterial, rock) {
  const group = new THREE.Group(); group.name = 'ultra-entrance-effects'; parent.add(group);
  const cube = ownGeometry(new THREE.BoxGeometry(1, 1, 1));
  const motorMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: 0x9de9ff, toneMapped: false }));
  const wakeMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: 0x44b9ff, transparent: true, opacity: .18, depthWrite: false }));
  const dustMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: 0x817875, transparent: true, opacity: .16, depthWrite: false }));
  const flashMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: 0xffb54e, transparent: true, opacity: .7, depthWrite: false, side: THREE.DoubleSide }));
  const flight = new THREE.Group(); flight.name = 'ultra-active-flight-motors'; group.add(flight);
  const motors = new THREE.Group(); motors.name = 'ultra-flight-motor-anchors'; flight.add(motors);
  const pods = [];
  for (const side of [-1, 1]) for (const depth of [-1, 1]) {
    const motor = new THREE.Mesh(cube, motorMaterial);
    motor.name = 'ultra-underbody-lift-plume'; motor.userData = { side, depth };
    motors.add(motor); pods.push(motor);
  }
  const wake = new THREE.InstancedMesh(cube, wakeMaterial, 12); wake.name = 'ultra-powered-flight-wake'; flight.add(wake);
  const motorLight = new THREE.PointLight(0x70cfff, 95, 35, 1.5); motors.add(motorLight);
  const dust = new THREE.InstancedMesh(cube, dustMaterial, 36); dust.name = 'ultra-assembly-dust'; group.add(dust);
  const rubble = new THREE.InstancedMesh(cube, rock, 24); rubble.name = 'ultra-rumbling-rock-fragments'; group.add(rubble);
  const ringGeometry = ownGeometry(new THREE.RingGeometry(1.8, 2.4, 24)); ringGeometry.rotateX(-Math.PI / 2);
  const impactRing = new THREE.Mesh(ringGeometry, flashMaterial); impactRing.name = 'ultra-wreck-impact'; group.add(impactRing);
  const transform = new THREE.Object3D();
  function hide() {
    flight.visible = dust.visible = rubble.visible = impactRing.visible = false;
    flight.userData.activeDroneId = null;
  }
  function update(active, impact, assembly, rumbling, time) {
    hide();
    if (active) {
      const { descriptor, model } = active;
      flight.visible = true; flight.userData.activeDroneId = descriptor.id;
      flight.position.copy(model.position); flight.rotation.copy(model.rotation);
      const profile = model.userData.flightProfile;
      motors.position.set(0, profile.motorY, 0);
      motorLight.intensity = profile.lightIntensity; motorLight.distance = profile.lightDistance;
      for (const motor of pods) {
        const length = profile.motorLength * (1 + Math.sin(time * 34 + motor.userData.side) * .15);
        motor.position.set(motor.userData.side * profile.motorSpread, -profile.ventHalfHeight - length / 2,
          motor.userData.depth * Math.abs(profile.motorZ));
        motor.scale.set(profile.motorWidth, length, profile.motorWidth);
      }
      wake.visible = Math.abs(descriptor.pitch) < .8 && descriptor.progress < .85;
      for (let index = 0; index < wake.count; index++) {
        const progress = index / (wake.count - 1), pulse = 1 + Math.sin(time * 21 - index) * .1;
        const width = profile.wakeWidth * (1 - progress * .75) * pulse;
        transform.position.set(Math.sin(index * 1.9 + time * 5) * profile.wakeWidth * .18, profile.motorY,
          profile.motorZ - profile.motorLength / 2 - progress * profile.wakeLength);
        transform.rotation.set(0, 0, 0);
        transform.scale.set(width, width, profile.wakeLength / wake.count * (1 - progress * .65));
        transform.updateMatrix(); wake.setMatrixAt(index, transform.matrix);
      }
      wake.instanceMatrix.needsUpdate = true;
    }
    if (impact?.impact > 0) {
      impactRing.visible = true; impactRing.position.set(impact.x, -.58, impact.z);
      impactRing.scale.setScalar(1 + (1 - impact.impact) * 6);
      flashMaterial.opacity = impact.impact * .8;
    }
    if (!rumbling && !(assembly > 0 && assembly < 1)) return;
    dust.visible = rubble.visible = true;
    const centerZ = ULTRA_CRASH_SPOT.z + (ULTRA_ORIGIN.z - ULTRA_CRASH_SPOT.z) * assembly;
    for (let index = 0; index < dust.count; index++) {
      const age = (time * .32 + index * .173) % 1, angle = index * 2.399963;
      const radius = 4 + age * (12 + index % 4);
      transform.position.set(Math.sin(angle) * radius, 1 + age * 15, centerZ + Math.cos(angle) * radius * .6);
      transform.rotation.set(age, angle, age * .3); transform.scale.set(2 + age * 5, 1 + age * 2, 2 + age * 4);
      transform.updateMatrix(); dust.setMatrixAt(index, transform.matrix);
    }
    for (let index = 0; index < rubble.count; index++) {
      const phase = time * 3.2 + index * 1.7, radius = 3 + index % 5;
      transform.position.set(Math.sin(index * 2.4) * radius, .5 + Math.abs(Math.sin(phase)) * 3.5,
        centerZ + Math.cos(index * 2.4) * radius);
      transform.rotation.set(phase * .4, index, phase * .2); transform.scale.setScalar(.35 + index % 4 * .18);
      transform.updateMatrix(); rubble.setMatrixAt(index, transform.matrix);
    }
    dust.instanceMatrix.needsUpdate = rubble.instanceMatrix.needsUpdate = true;
  }
  hide();
  return { update, hide, dispose() { wake.dispose(); dust.dispose(); rubble.dispose(); } };
}

/** Visible chambers match the shared spawn lanes and solid side/back walls. */
function createRimTunnels(parent, arena, geometries, ownGeometry, ownMaterial, rock) {
  const group = new THREE.Group(); group.name = 'ultra-island-rim-tunnels'; parent.add(group);
  const cube = ownGeometry(new THREE.BoxGeometry(1, 1, 1));
  const copper = ownMaterial(arena.surfaceMaterial('copper', 0xad653e).clone());
  const dark = ownMaterial(new THREE.MeshBasicMaterial({ color: 0x080d12 }));
  function box(name, x, y, z, width, height, depth, material) {
    const mesh = new THREE.Mesh(cube, material); mesh.name = name;
    mesh.position.set(x, y, z); mesh.scale.set(width, height, depth);
    mesh.castShadow = material !== dark; mesh.receiveShadow = true; group.add(mesh);
  }
  for (const wall of ULTRA_TUNNEL_WALLS) {
    const material = wall.role === 'back' ? dark : rock;
    box(`ultra-rim-tunnel-wall-${wall.id}`, wall.x, wall.height / 2, wall.z, wall.width, wall.height, wall.depth, material);
  }
  for (const tunnel of ULTRA_RIM_TUNNELS) {
    const { spawn, direction, width, height, depth } = tunnel;
    const lateral = { x: direction.z, z: -direction.x };
    const sideways = Math.abs(direction.x) === 1;
    function frame(name, localX, y, localZ, w, h, d, material) {
      box(`ultra-rim-tunnel-${tunnel.id}-${name}`, spawn.x + lateral.x * localX + direction.x * localZ, y,
        spawn.z + lateral.z * localX + direction.z * localZ, sideways ? d : w, h, sideways ? w : d, material);
    }
    frame('rock-roof', 0, height + .3, 0, width + 1.2, .6, depth, rock);
    for (const side of [-1, 1]) frame(`copper-upright-${side}`, side * (width / 2 + .09), height / 2,
      depth / 2 - .12, .18, height, .22, copper);
    frame('copper-lintel', 0, height + .09, depth / 2 - .12, width + .36, .18, .22, copper);
    const mouth = new THREE.Object3D(); mouth.name = `ultra-rim-tunnel-mouth-${tunnel.id}`;
    mouth.position.set(spawn.x + direction.x * depth / 2, 0, spawn.z + direction.z * depth / 2);
    mouth.userData.tunnel = tunnel; group.add(mouth);
  }
  const batches = mergeStaticMeshes(group, { ownedGeometries: geometries, freezeWorld: true });
  return { group, layout: batches.namedBounds, batches };
}

/** A separate, owned world makes the original cached Mine completely reversible. */
export function createUltraArena(arena) {
  if (!arena?.scene?.isScene || typeof arena.surfaceMaterial !== 'function') throw new TypeError('Ultra arena needs a scene and surface materials.');
  const group = new THREE.Group(); group.name = 'mech-ultra-expanded-cavern';
  const shell = new THREE.Group(); shell.name = 'ultra-fivefold-cave-shell'; group.add(shell);
  const geometries = new Set(), materials = new Set(), libraries = new Map();
  const ownGeometry = geometry => { geometries.add(geometry); return geometry; };
  const ownMaterial = material => { materials.add(material); return material; };
  const rock = ownMaterial(arena.surfaceMaterial('drill-mine-rock', 0x6a747b).clone());
  rock.name = 'ultra-distant-pixel-rock'; rock.roughness = .94;
  const coverMaterial = ownMaterial(arena.surfaceMaterial('drill-mine-rock', 0x4f5d63).clone());
  const floorMaterial = ownMaterial(arena.surfaceMaterial('drill-mine-rock', 0x88969b).clone());
  const box = (parent, name, x, y, z, width, height, depth, material = rock) => {
    const geometry = ownGeometry(createSurfaceBoxGeometry(width, height, depth, 'drill-mine-rock', x, y, z));
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name;
    mesh.position.set(x, y, z); mesh.scale.set(width, height, depth);
    mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  // Geometry is authored once at the old pit size, then the walls AND roof expand fivefold.
  for (const side of [-1, 1]) {
    box(shell, 'ultra-distant-cave-wall', side * 37.2, 60, 0, 2.4, 120, 64.8);
    box(shell, 'ultra-distant-cave-wall', 0, 60, side * 31.2, 72, 120, 2.4);
  }
  const hole = { minX: -6, maxX: 6, minZ: ULTRA_CRASH_SPOT.z / 5 - 4.8, maxZ: ULTRA_CRASH_SPOT.z / 5 + 4.8 };
  for (const [x, z, width, depth] of [
    [(-38.4 + hole.minX) / 2, 0, hole.minX + 38.4, 64.8],
    [(hole.maxX + 38.4) / 2, 0, 38.4 - hole.maxX, 64.8],
    [0, (-32.4 + hole.minZ) / 2, 12, hole.minZ + 32.4],
    [0, (hole.maxZ + 32.4) / 2, 12, 32.4 - hole.maxZ],
  ]) box(shell, 'ultra-cave-roof-around-crash-hole', x, 120.8, z, width, 1.6, depth);

  const floorGeometry = ownGeometry(new THREE.PlaneGeometry(72, 60)); floorGeometry.rotateX(-Math.PI / 2);
  const uv = floorGeometry.attributes.uv, position = floorGeometry.attributes.position;
  for (let index = 0; index < uv.count; index++) uv.setXY(index, position.getX(index) / 4, position.getZ(index) / 4);
  const island = new THREE.Mesh(floorGeometry, floorMaterial); island.name = 'ultra-original-pit-island';
  island.position.y = .012; island.receiveShadow = true; group.add(island);
  box(group, 'ultra-original-pit-foundation', 0, -2, 0, 72, 4, 60, coverMaterial);
  for (const cover of ULTRA_COVER_BOXES) {
    const wall = box(group, 'ultra-sharp-cover-wall', cover.x, cover.height / 2, cover.z,
      cover.width, cover.height, cover.depth, coverMaterial);
    wall.userData.cover = cover;
  }
  const rimTunnels = createRimTunnels(group, arena, geometries, ownGeometry, ownMaterial, coverMaterial);
  const spikeGeometry = ownGeometry(new THREE.ConeGeometry(1, 1, 4));
  const spikes = new THREE.InstancedMesh(spikeGeometry, coverMaterial, ULTRA_COVER_BOXES.length * 3 + 16);
  spikes.name = 'ultra-sharp-rock-spikes'; spikes.castShadow = spikes.receiveShadow = true;
  const transform = new THREE.Object3D(); let spikeIndex = 0;
  for (const cover of ULTRA_COVER_BOXES) for (let index = 0; index < 3; index++) {
    const along = (index - 1) * .3, height = .8 + index % 2 * .6;
    transform.position.set(cover.x + (cover.width > cover.depth ? along * cover.width : 0), cover.height + height / 2,
      cover.z + (cover.depth > cover.width ? along * cover.depth : 0));
    transform.rotation.set(0, index * .73, 0); transform.scale.set(.8, height, .8); transform.updateMatrix();
    spikes.setMatrixAt(spikeIndex++, transform.matrix);
  }
  for (let index = 0; index < 16; index++) {
    const side = index % 4, along = -22 + Math.floor(index / 4) * 14;
    transform.position.set(side < 2 ? (side ? -35 : 35) : along, .7, side >= 2 ? (side === 2 ? -29 : 29) : along);
    transform.scale.set(.7, 1.4, .7); transform.updateMatrix(); spikes.setMatrixAt(spikeIndex++, transform.matrix);
  }
  spikes.instanceMatrix.needsUpdate = true; group.add(spikes);

  const texture = lavaTexture();
  const lavaMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: 0xff8632, map: texture,
    emissive: 0xff4b0d, emissiveMap: texture, emissiveIntensity: 2.2, roughness: .45, metalness: .1, side: THREE.DoubleSide }));
  for (const strip of ULTRA_LAVA_STRIPS) {
    const geometry = ownGeometry(new THREE.PlaneGeometry(strip.width, strip.depth)); geometry.rotateX(-Math.PI / 2);
    const lava = new THREE.Mesh(geometry, lavaMaterial); lava.name = 'ultra-lava-strip';
    lava.position.set(strip.x, -.7, strip.z); lava.userData.bounds = strip; group.add(lava);
  }
  const lavaFill = new THREE.PointLight(0xff6b1d, 220, 105, 1.3);
  lavaFill.name = 'ultra-lava-light'; lavaFill.position.set(0, 10, -35); group.add(lavaFill);
  const wreckFill = new THREE.PointLight(0xb9d5e6, 380, 95, 1.5);
  wreckFill.name = 'ultra-wreckage-light'; wreckFill.position.set(12, 28, -48); group.add(wreckFill);
  const cinematic = new THREE.Group(); cinematic.name = 'ultra-encounter-props'; group.add(cinematic);
  const effects = createCinematicEffects(group, ownGeometry, ownMaterial, coverMaterial);
  const revealOwner = { ...ULTRA_ORIGIN };
  initializeMechUltra(revealOwner);
  let drones = null, miners = null, megaDrill = null, reveal = null, revealRest = null, cameraPose = null, disposed = false;
  const library = type => { if (!libraries.has(type)) libraries.set(type, compactVisualLibrary(type)); return libraries.get(type); };
  const hide = () => { for (const child of cinematic.children) child.visible = false; };
  function update(encounter, time = 0) {
    if (disposed) return;
    const elapsed = encounter?.elapsed ?? ULTRA_CINEMATIC_DURATION, pose = { ...getUltraEncounterPose(elapsed), ...encounter };
    const scale = Number.isFinite(pose.caveScale) ? pose.caveScale : 5; shell.scale.setScalar(scale);
    texture.offset.set(Math.sin(time * .08) * .018, time * .004);
    lavaMaterial.emissiveIntensity = 1.45 + Math.sin(time * 2.1) * .1;
    hide(); effects.hide(); cameraPose = null;
    if (!encounter || pose.complete) return;
    const assembly = clamp((elapsed - stageStart('drill-arm')) / (ULTRA_CINEMATIC_DURATION - stageStart('drill-arm')));
    let activeFlight = null, impact = null, focusedShot = null;
    let focus = { x: ULTRA_CRASH_SPOT.x, y: 8, z: ULTRA_CRASH_SPOT.z };
    if (elapsed >= stageStart('roof-drones')) {
      const poses = getUltraCinematicDrones(elapsed);
      drones ||= poses.map(item => { const model = library(item.type).create(); cinematic.add(model); return model; });
      poses.forEach((item, index) => {
        const model = drones[index], sourceIndex = index % 5;
        const progress = index < 5 ? pose.drillArmReveal : index < 10 ? pose.fabricatorArmReveal : (pose.headReveal + pose.legsReveal) / 2;
        const consumed = item.crashed ? ease(clamp((progress - sourceIndex * .08) / .68)) : 0;
        model.visible = item.visible && consumed < 1;
        model.userData.cinematicState = item.active ? 'flying' : item.crashed ? 'wreck' : 'waiting';
        model.position.set(item.x, item.y, item.z);
        const crashBlend = item.active ? ease((item.progress - .85) / .15) : 1;
        const hoverPitch = Math.max(-.25, Math.min(.25, -item.pitch));
        const hoverRoll = Math.max(-.15, Math.min(.15, item.roll));
        model.rotation.set(hoverPitch + (-item.pitch - hoverPitch) * crashBlend, item.yaw,
          hoverRoll + (item.roll - hoverRoll) * crashBlend, 'YXZ');
        model.scale.setScalar(Math.max(.001, 1 - consumed));
        if (consumed > 0) {
          model.position.x += ((index % 2 ? -1 : 1) * 10 - item.x) * consumed;
          model.position.y += consumed * 10;
          model.position.z += (ULTRA_ORIGIN.z - item.z) * consumed;
        }
        if (item.active) {
          activeFlight = { descriptor: item, model };
          const point = model.localToWorld(new THREE.Vector3(0, model.userData.flightProfile.focusY, 0));
          focus = { x: point.x, y: point.y, z: point.z };
        }
        if (item.impact > (impact?.impact || 0)) impact = item;
      });
    }
    if (elapsed >= stageStart('rim-miners')) {
      const poses = getUltraCinematicMiners(elapsed);
      miners ||= poses.map(() => { const model = library('miner-bot').create(); cinematic.add(model); return model; });
      poses.forEach((item, index) => {
        const model = miners[index]; model.visible = item.visible && !item.fallen;
        model.position.set(item.x, item.y, item.z);
        model.rotation.set(.32 + item.progress * 1.4, 0, item.progress * (index % 2 ? -.65 : .65));
        model.userData.cinematicState = item.active ? 'falling' : item.fallen ? 'fallen' : 'watching';
      });
      if (pose.stage === 'rim-miners') {
        focusedShot = { position: { x: 42, y: ULTRA_SURFACE_HEIGHT + 42, z: -108 }, target: { x: 0, y: ULTRA_SURFACE_HEIGHT + 1, z: -56 },
          shotId: 'miners-roof-lip', tracking: false };
      } else if (pose.stage === 'falling-miners') {
        const firstFalling = poses.find(item => item.active);
        if (firstFalling) {
          const target = { x: firstFalling.x, y: firstFalling.y + 1.1, z: firstFalling.z };
          focusedShot = { position: { x: target.x + 9, y: target.y + 6, z: target.z + 9 }, target,
            shotId: `miner-fall-${firstFalling.id}`, tracking: true };
        }
      }
    }
    if (elapsed >= stageStart('mega-drill') && assembly < .85) {
      if (!megaDrill) { megaDrill = createCopperMegaDrill(); cinematic.add(megaDrill); }
      const item = getUltraCinematicMegaDrill(elapsed);
      megaDrill.visible = item.visible;
      megaDrill.position.set(item.x, item.y, item.z);
      megaDrill.rotation.set(-item.pitch, item.yaw, item.roll, 'YXZ');
      megaDrill.scale.setScalar(Math.max(.05, 1 - assembly));
      megaDrill.userData.cinematicState = item.phase;
      animateCopperMegaDrill(megaDrill, elapsed, { wormDistance: 0 });
      megaDrill.userData.body.position.y = 0;
      if (pose.stage === 'mega-drill') {
        const point = megaDrill.localToWorld(new THREE.Vector3(0, 4, -3));
        const target = { x: point.x, y: point.y, z: point.z };
        const position = { x: point.x + 35, y: point.y + 18, z: point.z + 30 };
        if (target.y > 550 && target.y < ULTRA_SURFACE_HEIGHT) {
          position.x = Math.max(-25, Math.min(25, position.x));
          position.z = Math.max(ULTRA_CRASH_SPOT.z - 20, Math.min(ULTRA_CRASH_SPOT.z + 20, position.z));
          const horizontalSquared = (position.x - target.x) ** 2 + (position.z - target.z) ** 2;
          position.y = target.y + Math.sqrt(Math.max(0, 50 ** 2 - horizontalSquared));
        }
        focusedShot = { position, target,
          shotId: `mega-drill-${item.phase}`, tracking: true };
        if (item.impact > (impact?.impact || 0)) impact = { ...item, x: item.tip.x, z: item.tip.z };
      }
    }
    if (elapsed >= stageStart('rumble')) {
      if (!reveal) {
        reveal = createCreature(ULTRA_TYPE); reveal.name = 'ultra-cosmetic-boss-reveal'; cinematic.add(reveal);
        const data = reveal.userData;
        revealRest = new Map([data.body, data.drillArm, data.fabricatorArm, ...(data.legs || [])]
          .filter(Boolean).map(part => [part, part.position.clone()]));
      }
      reveal.visible = true; reveal.position.set(revealOwner.x, revealOwner.elevation, revealOwner.z);
      reveal.rotation.y = revealOwner.angle;
      const data = reveal.userData;
      for (const [part, position] of revealRest) part.position.copy(position);
      animateModel(reveal, elapsed, 0, 'chase', { ultra: revealOwner.ultra });
      for (const [part, progress] of [[data.drillArm, pose.drillArmReveal], [data.fabricatorArm, pose.fabricatorArmReveal],
        [data.body, pose.headReveal], ...(data.legs || []).map(leg => [leg, pose.legsReveal])]) {
        if (!part) continue;
        const raised = ease(progress);
        part.visible = progress > 0;
        part.position.x = (ULTRA_CRASH_SPOT.x - ULTRA_ORIGIN.x) * (1 - raised) + part.position.x * raised;
        part.position.y -= 50 * (1 - raised);
        part.position.z += (ULTRA_CRASH_SPOT.z - ULTRA_ORIGIN.z) * (1 - raised);
      }
      focus = { x: ULTRA_ORIGIN.x, y: 8 + pose.headReveal * 20, z: ULTRA_CRASH_SPOT.z + (ULTRA_ORIGIN.z - ULTRA_CRASH_SPOT.z) * assembly };
    }
    effects.update(activeFlight, impact, assembly, pose.stage === 'rumble', time);
    if (activeFlight) {
      const { descriptor, model } = activeFlight, distance = model.userData.flightProfile.cameraDistance;
      const offset = new THREE.Vector3(.78, .28, -.55).normalize().multiplyScalar(distance);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), descriptor.yaw);
      const position = { x: focus.x + offset.x, y: Math.max(2.5, focus.y + offset.y), z: focus.z + offset.z };
      // Keep the trailing camera inside the real sky shaft while either subject crosses the roof.
      if (focus.y > 550) {
        position.x = Math.max(-25, Math.min(25, position.x));
        position.z = Math.max(ULTRA_CRASH_SPOT.z - 20, Math.min(ULTRA_CRASH_SPOT.z + 20, position.z));
        const horizontalSquared = (position.x - focus.x) ** 2 + (position.z - focus.z) ** 2;
        position.y = focus.y + Math.sqrt(Math.max(0, distance ** 2 - horizontalSquared));
      }
      cameraPose = { position, target: focus, shotId: `drone-${descriptor.id}`, tracking: true };
    } else if (focusedShot) {
      cameraPose = focusedShot;
    } else {
      cameraPose = { position: { x: focus.x + 30, y: Math.min(585, Math.max(24, focus.y + 16)), z: focus.z + 36 },
        target: focus, shotId: `stage-${pose.stage}`, tracking: false };
    }
  }
  function dispose() {
    if (disposed) return; disposed = true; group.removeFromParent();
    for (const entry of libraries.values()) entry.dispose(); effects.dispose();
    megaDrill?.userData.disposeVisuals?.(); reveal?.userData.disposeVisuals?.(); spikes.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose(); texture.dispose();
  }
  group.visible = false; arena.scene.add(group);
  return { group, shell, island, cinematic, update, dispose, geometries, materials, rimTunnels,
    get cameraPose() { return cameraPose; } };
}
