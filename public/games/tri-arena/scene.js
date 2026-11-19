import * as THREE from './assets/three.module.js';
import { createPlayer, createCreature, createViewWeapon, createBone, animateModel } from './models.js';
import { VoxelBody, createVoxelFragment, bladeSweep } from './voxel-body.js';
import { createLocomotion, advanceLocomotion } from './locomotion.js';
import { createTriGroundMaterial, createWorldMaterial, createSurfaceBoxGeometry, disposeArenaTextures } from './arena-surfaces.js';
import { ARENA_SIZE, getArenaSize } from './arena-config.js';
import { mergeStaticMeshes } from './static-batches.js';
import { buildColosseum } from './colosseum.js';
import { buildDrillMine } from './drill-mine.js';
import { createMineSunlight } from './mine-sunlight.js';
import { MineWalkerLighting } from './mine-walker-lighting.js';
import { UltraControlRoomLighting } from './mech-ultra-control-lighting.js';
import { findShieldContact } from './shield-contact.js';
import { EYE_HEIGHT, SWORD_REACH, SWING_TIME, SWING_ARC, SWING_CONTACT } from './sword-config.js';
import { thirdPersonCameraPose } from './third-person-camera.js';
import { posePlayerSword } from './player-sword-pose.js';
import { createShieldRobotHead } from './copper-siege-enemies.js';
import { partitionExplosionCells } from './voxel-explosion.js';
import { warCameraPose, createWarOverlay, WAR_TEAM_COLORS } from './war-rendering.js';
import { createUltraArena, isUltraArenaActive, updateUltraHeldRobot } from './mech-ultra-arena.js';
import { ULTRA_ROOF_MISSILE_KIND, ULTRA_ROOF_MISSILES } from './mech-ultra-roof-missiles.js';
export { SWING_CONTACT } from './sword-config.js';

const COLORS = { copper: 0xad653e, dark: 0x17282c, cyan: 0x68f5dc, pink: 0xeb3d9e, blue: 0x2fa5f2 };
const ROOF_IMPACT_EFFECT_CAP = 16;
const UP = new THREE.Vector3(0, 1, 0);
const cube = new THREE.BoxGeometry(1, 1, 1);
const OVERVIEW_SCALE = Math.max(ARENA_SIZE.width / 36, ARENA_SIZE.depth / 26);
const OVERVIEW_CAMERA = new THREE.Vector3(25.3, 35.2, 34.1).multiplyScalar(OVERVIEW_SCALE);
const FOG_DENSITY = 0.019;
const fogDensityFor = arenaId => arenaId === 'drill-mine' ? .0045 : FOG_DENSITY * (arenaId === 'colosseum' ? .45 : 1);
const playFarFor = arenaId => arenaId === 'drill-mine' ? 360 : 160;
const AXIS_Z = new THREE.Vector3(0, 0, 1);
const GRIP = new THREE.Vector3(0.44, -0.38, -0.64);
const GRIP_ROLL = new THREE.Quaternion().setFromAxisAngle(AXIS_Z, 0.14);
const scratch = new THREE.Vector3();
const rigidBounds = new THREE.Box3();
const basis = new THREE.Matrix4();
const restQuat = new THREE.Quaternion(), swingQuat = new THREE.Quaternion();
const restPos = new THREE.Vector3(), swingPos = new THREE.Vector3();
const bladeDir = new THREE.Vector3(), bladeEdge = new THREE.Vector3(), bladeFlat = new THREE.Vector3();
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * Camera-space sword pose at swing progress `u` (0..1): the blade pivots inside a plane
 * parallel to the cut plane, edge leading, crossing the aim point at SWING_CONTACT.
 * Writes swingQuat / swingPos and returns how strongly to blend them over the rest pose.
 */
function swingPose(u, tilt, scale) {
  if (!(u >= 0 && u < 1)) return 0;
  const cos = Math.cos(tilt), sin = Math.sin(tilt);
  const phi = -SWING_ARC + 2 * SWING_ARC * smooth(0.08, 0.58, u);
  // Forward is -Z; the blade travels toward (-cos, -sin, 0).
  bladeDir.set(-cos * Math.sin(phi), -sin * Math.sin(phi), -Math.cos(phi));
  bladeEdge.set(-cos * Math.cos(phi), -sin * Math.cos(phi), Math.sin(phi));
  bladeFlat.crossVectors(bladeEdge, bladeDir);
  basis.makeBasis(bladeEdge, bladeDir, bladeFlat);
  swingQuat.setFromRotationMatrix(basis).multiply(GRIP_ROLL);
  // Hold the hand off the cut plane (below or to the right) so the blade is seen side-on.
  const off = (cos > 1e-3 || (Math.abs(cos) <= 1e-3 && sin > 0) ? -1 : 1) * 0.17;
  swingPos.set(0.04 - sin * off, -0.1 + cos * off, -0.34).addScaledVector(bladeDir, 0.3)
    .sub(scratch.copy(GRIP).multiplyScalar(scale).applyQuaternion(swingQuat));
  return smooth(0, 0.12, u) * (1 - smooth(0.64, 1, u));
}

/** Rendering, posed blade contacts and effects; gameplay state lives in simulation.js. */
export class ArenaScene {
  constructor(canvas, { cameraMode = 'first-person' } = {}) {
    this.canvas = canvas;
    this.thirdPerson = cameraMode === 'third-person';
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x271326);
    this.scene.fog = new THREE.FogExp2(0x29172c, FOG_DENSITY / OVERVIEW_SCALE);
    this.camera = new THREE.PerspectiveCamera(44, 1, 0.1, 160);
    this.camera.position.copy(OVERVIEW_CAMERA);
    this.camera.lookAt(0, 0, 2);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);
    this.look = { angle: 0, pitch: 0 };
    this.firstPerson = false;
    this.weapon = createViewWeapon();
    this.weapon.scale.setScalar(0.65);
    this.camera.add(this.weapon);
    this.weapon.visible = false;
    this.ray = new THREE.Raycaster();
    this.floor = new THREE.Plane(UP, 0);
    this.pointer = new THREE.Vector2();
    this.target = new THREE.Vector3();
    this.materials = new Map();
    this.worldGeometries = new Set();
    this.enemies = new Map();
    this.hazards = new Map();
    this.effects = [];
    this.particles = [];
    this.time = 0;
    this.swingStart = -1;
    this.swingTilt = 0;
    this.swingId = 0;
    this.blockedSwing = null;
    this.kick = 0;
    this.kickTilt = 0;
    this.shake = 0;
    this.buildArena();
    this.player = createPlayer();
    this.player.scale.setScalar(1.12);
    this.scene.add(this.player);
    this.playerRing = this.ring(0.95, COLORS.cyan, 0.035);
    this.playerRing.position.y = 0.045;
    this.scene.add(this.playerRing);
    this.demo = [
      { id: 'demo1', type: 'ling', x: 6, z: 2, angle: -1.6, phase: 'chase', hp: 40, maxHp: 40 },
      { id: 'demo2', type: 'ling', x: 8, z: -1, angle: -1.4, phase: 'chase', hp: 40, maxHp: 40 },
      { id: 'demo3', type: 'brain', x: -7, z: -4, angle: 1, phase: 'chase', hp: 70, maxHp: 70 },
      { id: 'demo4', type: 'gardener', x: 4, z: -7, angle: -0.5, phase: 'chase', hp: 160, maxHp: 160 },
    ];
    this.colosseumDemo = [
      { id: 'robot-demo1', type: 'copper-robot', x: 6, z: 2, angle: -1.6, phase: 'chase', hp: 100, maxHp: 100 },
      { id: 'robot-demo2', type: 'knight', x: 8, z: -1, angle: -1.4, phase: 'chase', hp: 160, maxHp: 160 },
      { id: 'robot-demo3', type: 'copper-robot', x: -7, z: -4, angle: 1, phase: 'chase', hp: 100, maxHp: 100 },
      { id: 'robot-demo4', type: 'copper-robot', x: 4, z: -7, angle: -.5, phase: 'chase', hp: 100, maxHp: 100 },
    ];
    this.mineDemo = [
      { id: 'mine-demo1', type: 'miner-bot', x: 6, z: 2, angle: -1.6, phase: 'chase', hp: 150, maxHp: 150 },
      { id: 'mine-demo2', type: 'miner-bot', x: -5, z: -3, angle: 1, phase: 'chase', hp: 150, maxHp: 150 },
      { id: 'mine-demo3', type: 'copper-drill-worm', x: 8, z: -7, angle: -.5, phase: 'chase', hp: 160, maxHp: 160 },
      { id: 'mine-demo4', type: 'copper-drill-hound', x: -8, z: 6, angle: 1.3, phase: 'chase', hp: 200, maxHp: 200 },
    ];
    this.projectileMeshes = [];
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  material(color, glow = 0) {
    const key = `${color}:${glow}`;
    if (!this.materials.has(key)) this.materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.68, metalness: glow ? 0.2 : 0.52, emissive: color, emissiveIntensity: glow }));
    return this.materials.get(key);
  }

  setCameraMode(mode) {
    if (!['first-person', 'third-person'].includes(mode)) throw new RangeError('Unknown camera view.');
    this.thirdPerson = mode === 'third-person';
    if (this.firstPerson) {
      this.camera.fov = this.thirdPerson ? 64 : 82;
      this.camera.updateProjectionMatrix();
    }
  }

  setWarMode(enabled) {
    this.warMode = enabled === true;
    this.warPossessed = false;
    this.warView ||= { yaw: 0, pitch: .98, zoom: 1, inset: 0 };
    if (this.warMode) Object.assign(this.warView, { yaw: 0, pitch: this.arenaId === 'drill-mine' ? 1.4 : .98, zoom: 1 });
    if (this.warMode) this.ensureWarOverlay();
    if (this.warOverlay) this.warOverlay.visible = this.warMode;
    if (this.warMode) {
      this.firstPerson = false; this.weapon.visible = false; this.player.visible = false; this.playerRing.visible = false;
      this.positionWarCamera();
    } else {
      this.camera.clearViewOffset();
      this.camera.fov = this.firstPerson ? this.thirdPerson ? 64 : 82 : this.canvas.getBoundingClientRect().width < 700 ? 58 : 44;
      this.camera.updateProjectionMatrix();
      if (!this.firstPerson) this.positionOverviewCamera();
      if (this.scene.fog) this.scene.fog.density = fogDensityFor(this.arenaId);
    }
  }

  ensureWarOverlay() {
    if (this.warOverlay?.userData.arenaId !== this.arenaId && this.warOverlay) {
      this.scene.remove(this.warOverlay); this.warOverlay.userData.dispose(); this.warOverlay = null;
    }
    if (!this.warOverlay) {
      this.warOverlay = createWarOverlay(this.arenaId);
      this.warOverlay.userData.arenaId = this.arenaId;
      this.scene.add(this.warOverlay);
    }
  }

  setWarInset(leftPixels = 0) {
    this.warView ||= { yaw: 0, pitch: .98, zoom: 1, inset: 0 };
    const inset = Math.max(0, Number.isFinite(leftPixels) ? leftPixels : 0);
    if (inset === this.warView.inset) return;
    this.warView.inset = inset;
    if (this.warMode && !this.warPossessed) this.positionWarCamera();
  }

  warOrbit(dx, dy) {
    if (!this.warMode || this.warPossessed) return;
    this.warView.yaw -= (Number.isFinite(dx) ? dx : 0) * .006;
    this.warView.pitch = Math.max(this.arenaId === 'drill-mine' ? 1.35 : .45,
      Math.min(1.4, this.warView.pitch + (Number.isFinite(dy) ? dy : 0) * .004));
    this.positionWarCamera();
  }

  warZoom(delta) {
    if (!this.warMode || this.warPossessed) return;
    this.warView.zoom = Math.max(.35, Math.min(2.5, this.warView.zoom * Math.exp(Math.max(-1000, Math.min(1000, Number.isFinite(delta) ? delta : 0)) * .001)));
    this.positionWarCamera();
  }

  positionWarCamera() {
    if (this.warPossessed) return;
    const bounds = this.canvas.getBoundingClientRect(), width = Math.max(1, bounds.width), height = Math.max(1, bounds.height);
    const inset = Math.min(width * .65, this.warView?.inset || 0);
    const pose = warCameraPose({ ...this.warView, arenaId: this.arenaId, aspect: Math.max(1, width - inset) / height });
    const scale = this.ultraArenaActive ? 3 : 1;
    this.camera.aspect = width / height; this.camera.fov = pose.fov;
    this.camera.far = Math.max(playFarFor(this.arenaId), pose.far, this.ultraArenaActive ? 1200 : 0);
    this.camera.setViewOffset(width, height, -inset / 2, 0, width, height);
    this.camera.position.set(pose.target.x + (pose.position.x - pose.target.x) * scale,
      pose.target.y + (pose.position.y - pose.target.y) * scale,
      pose.target.z + (pose.position.z - pose.target.z) * scale);
    this.camera.lookAt(pose.target.x, pose.target.y, pose.target.z);
    this.camera.updateProjectionMatrix(); this.camera.updateMatrixWorld(true);
    if (this.scene.fog) this.scene.fog.density = fogDensityFor(this.arenaId) / Math.max(1.7, pose.distance * scale / 38);
  }

  groundPoint(clientX, clientY) {
    const bounds = this.canvas.getBoundingClientRect();
    if (![clientX, clientY].every(Number.isFinite) || bounds.width <= 0 || bounds.height <= 0
      || clientX < bounds.left || clientX > bounds.left + bounds.width || clientY < bounds.top || clientY > bounds.top + bounds.height) return null;
    this.pointer ||= new THREE.Vector2(); this.ray ||= new THREE.Raycaster();
    this.floor ||= new THREE.Plane(UP, 0); this.target ||= new THREE.Vector3();
    this.pointer.set((clientX - bounds.left) / bounds.width * 2 - 1, -(clientY - bounds.top) / bounds.height * 2 + 1);
    this.camera.updateMatrixWorld(true); this.ray.setFromCamera(this.pointer, this.camera);
    return this.ray.ray.intersectPlane(this.floor, this.target) ? { x: this.target.x, z: this.target.z } : null;
  }

  surfaceMaterial(kind, color) {
    const key = `surface:${kind}:${color}`;
    if (!this.materials.has(key)) this.materials.set(key, createWorldMaterial(kind, color));
    return this.materials.get(key);
  }

  box(x, y, z, w, h, d, color, glow = 0, surface = 'stone') {
    const geometry = glow ? cube : createSurfaceBoxGeometry(w, h, d, surface, x, y, z);
    if (!glow) this.worldGeometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, glow ? this.material(color, glow) : this.surfaceMaterial(surface, color));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.receiveShadow = true;
    mesh.castShadow = h > 0.15;
    this.scene.add(mesh);
    return mesh;
  }

  textureBone(model) {
    model.traverse(part => {
      if (!part.isMesh) return;
      part.material = this.surfaceMaterial('bone', part.material.color.getHex());
      part.geometry = createSurfaceBoxGeometry(part.scale.x, part.scale.y, part.scale.z, 'bone',
        model.position.x + part.position.x, model.position.y + part.position.y, model.position.z + part.position.z);
      this.worldGeometries.add(part.geometry);
    });
  }

  ring(radius, color, thickness = 0.06) {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(radius - thickness, radius, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  squareWarning(color) {
    const outline = new THREE.Shape();
    outline.moveTo(-1, -1); outline.lineTo(1, -1); outline.lineTo(1, 1); outline.lineTo(-1, 1); outline.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-.98, -.98); hole.lineTo(-.98, .98); hole.lineTo(.98, .98); hole.lineTo(.98, -.98); hole.closePath();
    outline.holes.push(hole);
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(outline), new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false,
    }));
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  buildArena() {
    const existing = new Set(this.scene.children);
    const { width, depth, halfWidth, halfDepth } = ARENA_SIZE;
    const sky = new THREE.HemisphereLight(0xd7e8ed, 0x382d3e, 2.8);
    sky.name = 'arena-hemisphere'; this.scene.add(sky);
    const sun = new THREE.DirectionalLight(0xffd7ad, 3.2);
    sun.name = 'arena-sun';
    sun.position.set(-halfWidth * .7, 46, halfDepth * .75);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -52, right: 52, top: 48, bottom: -48, near: 1, far: 160 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias = 0.04;
    this.scene.add(sun);
    const pinkLight = new THREE.PointLight(COLORS.pink, 95, 48);
    pinkLight.name = 'arena-accent-a';
    pinkLight.position.set(-halfWidth * .65, 6, -halfDepth * .65);
    this.scene.add(pinkLight);
    const cyanLight = new THREE.PointLight(COLORS.cyan, 110, 48);
    cyanLight.name = 'arena-accent-b';
    cyanLight.position.set(halfWidth * .65, 6, halfDepth * .65);
    this.scene.add(cyanLight);
    this.box(0, -1.05, 0, width + 3, 1.7, depth + 3, 0x233237).name = 'arena-foundation';
    this.box(0, -0.28, 0, width + 1, 0.4, depth + 1, COLORS.copper, 0, 'copper');
    const groundMaterial = createTriGroundMaterial({ repeatX: width / 36, repeatY: depth / 26 });
    const groundGeometry = new THREE.PlaneGeometry(width, depth, 128, 96);
    groundGeometry.rotateX(-Math.PI / 2);
    this.worldGeometries.add(groundGeometry);
    this.materials.set('tri-ground', groundMaterial);
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.name = 'continuous-living-tri-ground';
    this.ground.position.y = 0.012;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    // Copper raceways and luminous boundary rails frame the playable floor.
    for (const x of [-halfWidth, halfWidth]) {
      this.box(x, 0.3, 0, 0.8, 0.8, depth + 1, 0x74492f, 0, 'copper').name = 'arena-boundary-rail';
      this.box(x, 0.76, 0, 0.16, 0.08, depth + 1, COLORS.cyan, 1.8);
      for (let z = -halfDepth + 1; z <= halfDepth - 1; z += 5.5) this.box(x, 0.83, z, 0.85, 0.12, 0.4, 0xe3a85c, 0, 'copper');
    }
    for (const z of [-halfDepth, halfDepth]) {
      this.box(0, 0.3, z, width, 0.8, 0.8, 0x74492f, 0, 'copper').name = 'arena-boundary-rail';
      this.box(0, 0.76, z, width, 0.08, 0.16, COLORS.cyan, 1.8);
      for (let x = -halfWidth + 1; x <= halfWidth - 1; x += 5.5) this.box(x, 0.83, z, 0.4, 0.12, 0.85, 0xe3a85c, 0, 'copper');
    }
    const center = this.ring(5.2 * OVERVIEW_SCALE, 0x82968d, 0.025);
    center.name = 'arena-centre-ring';
    center.position.y = 0.065;
    center.material.opacity = 0.25;
    this.worldGeometries.add(center.geometry); this.materials.set('centre-ring', center.material);
    this.scene.add(center);
    const inner = this.ring(4.8 * OVERVIEW_SCALE, 0x82968d, 0.02);
    inner.position.y = 0.065;
    inner.material.opacity = 0.18;
    this.worldGeometries.add(inner.geometry); this.materials.set('inner-ring', inner.material);
    this.scene.add(inner);
    for (const x of [-1, 1]) {
      for (const z of [-1, 1]) {
        const px = x * (halfWidth + 2), pz = z * (halfDepth + 2);
        this.box(px, 0.7, pz, 3.2, 2.4, 3.2, 0x26383c).name = 'arena-pylon-base';
        this.box(px, 3.1, pz, 1.7, 4, 1.7, 0x815139, 0, 'copper');
        this.box(px, 5.1, pz, 2.3, 0.55, 2.3, 0xa46e4b, 0, 'copper');
        this.box(px, 5.45, pz, 1.6, 0.15, 1.6, COLORS.cyan, 2);
        this.box(px, 2.9, pz + 0.9, 0.32, 2.6, 0.06, COLORS.cyan, 1);
      }
    }
    // The coliseum has been swallowed by living Tri ground.
    const distantMaterial = createTriGroundMaterial({ repeatX: 180 / 36, repeatY: 180 / 26 });
    const distantGeometry = new THREE.PlaneGeometry(180, 180);
    distantGeometry.rotateX(-Math.PI / 2);
    this.worldGeometries.add(distantGeometry);
    this.materials.set('distant-tri-ground', distantMaterial);
    const distantGround = new THREE.Mesh(distantGeometry, distantMaterial);
    distantGround.position.y = -1.5;
    distantGround.receiveShadow = true;
    this.scene.add(distantGround);
    const toothMaterial = this.surfaceMaterial('bone', 0xe5d6ae);
    const toothGeometry = new THREE.ConeGeometry(0.65, 1, 4);
    this.worldGeometries.add(toothGeometry);
    const tooth = (x, z, height, lean = 0, name = 'distant-tri-tooth') => {
      const mesh = new THREE.Mesh(toothGeometry, toothMaterial);
      mesh.name = name;
      mesh.position.set(x, height / 2 - 0.1, z);
      mesh.scale.set(1.2 + height * 0.12, height, 1.2 + height * 0.12);
      mesh.rotation.z = lean;
      mesh.rotation.y = x + z;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      return mesh;
    };
    for (let i = 0; i < 68; i++) {
      const angle = i / 68 * Math.PI * 2;
      const distance = 3 + (i % 5) * 3.5 + 1 / Math.max(Math.abs(Math.sin(angle)) / (halfWidth + 5), Math.abs(Math.cos(angle)) / (halfDepth + 5));
      const x = Math.sin(angle) * distance;
      const z = Math.cos(angle) * distance;
      const h = 1.5 + (i * 7 % 11) * 0.55;
      this.box(x, h / 2 - 1, z, 3.5 + i % 3, h, 3.5, i % 3 ? 0x803255 : 0xa23a6b, 0, 'flesh');
      tooth(x, z, 2.3 + i % 5, Math.sin(i * 2) * 0.28);
      if (i % 2 === 0) {
        const bone = createBone(2.5 + i % 4);
        bone.position.set(x * 0.96, -0.25, z * 0.96);
        bone.rotation.set(Math.sin(i) * 0.25, i, Math.cos(i) * 0.38);
        this.textureBone(bone);
        this.scene.add(bone);
      }
    }
    // Short bones and teeth erupt from the infected arena rim, leaving the centre walkable.
    for (let i = 0; i < 44; i++) {
      const edge = i % 4;
      const x = edge < 2 ? (edge ? -1 : 1) * (halfWidth + 1.3) : -halfWidth + 2 + (i * 5.7 % (width - 4));
      const z = edge >= 2 ? (edge === 2 ? -1 : 1) * (halfDepth + 1.3) : -halfDepth + 2 + (i * 3.3 % (depth - 4));
      const bone = createBone(0.6 + i % 4 * 0.28);
      bone.name = 'arena-rim-bone';
      bone.position.set(x, -0.1, z);
      bone.rotation.set(Math.sin(i) * 0.5, i, Math.cos(i) * 0.4);
      this.textureBone(bone);
      this.scene.add(bone);
      if (i % 3 === 0) tooth(x * 1.02, z * 1.02, 0.9 + i % 3 * 0.2, 0.15, 'arena-rim-tooth');
    }
    // Watchful eyes are embedded in the distant flesh, between enormous teeth.
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      const group = new THREE.Group();
      const x = Math.sin(a) * (halfWidth + 13), z = Math.cos(a) * (halfDepth + 13);
      group.name = 'distant-watching-eye';
      group.position.set(x, 3.5 + i % 3, z);
      group.rotation.y = a + Math.PI;
      for (const [depth, size, color] of [[0, 2.2, 0x9e2469], [0.18, 1.7, 0xfff0d9], [0.34, 0.9, 0xf47d35], [0.4, 0.35, 0x15282d]]) {
        const eye = new THREE.Mesh(cube, this.material(color));
        eye.position.z = depth;
        eye.scale.set(size, size * 1.1, 0.18);
        group.add(eye);
      }
      this.scene.add(group);
    }
    // Copper silhouettes remain deep behind the infection.
    for (let i = 0; i < 22; i++) {
      const x = (i - 10.5) * 5.4, h = 3 + ((i * 7) % 9), z = -halfDepth - 22 - (i % 3) * 4;
      this.box(x, h / 2 - 2, z, 2.7, h, 2.7, i % 3 ? 0x743150 : 0x614a3a, 0, i % 3 ? 'flesh' : 'copper');
      if (i % 3 === 0) this.box(x, h - 1.9, z + 1.4, 2.8, 0.12, 2.8, COLORS.cyan, 0.5);
    }
    for (let i = 0; i < 30; i++) {
      const x = (i % 2 ? 1 : -1) * (halfWidth - 1.4 + (i % 4) * 0.55);
      const z = -halfDepth + 3 + ((i * 3.7) % (depth - 6));
      const tile = this.box(x, 0.035, z, 0.5 + (i % 3) * 0.22, 0.06, 0.5, i % 3 ? 0x8d305f : 0xa64274, 0, 'flesh');
      tile.rotation.y = i;
    }
    const positions = new Float32Array(840 * 6);
    this.rain = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xb7d4de, transparent: true, opacity: 0.36, depthWrite: false }));
    for (let i = 0; i < positions.length; i += 6) {
      positions[i] = Math.random() * (width + 34) - halfWidth - 17;
      positions[i + 1] = Math.random() * 32;
      positions[i + 2] = Math.random() * (depth + 30) - halfDepth - 15;
      positions[i + 3] = positions[i] - 0.15;
      positions[i + 4] = positions[i + 1] - 1.15;
      positions[i + 5] = positions[i + 2];
    }
    this.rain.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rain.frustumCulled = false;
    this.worldGeometries.add(this.rain.geometry); this.materials.set('rain', this.rain.material);
    this.scene.add(this.rain);
    this.rainLayouts = new Map([[`${width}:${depth}`, this.rain.geometry]]);
    this.staticBatches = mergeStaticMeshes(this.scene, { exclude: [this.camera, this.ground, distantGround],
      ownedGeometries: this.worldGeometries, freezeWorld: true });
    this.staticLayout = this.staticBatches.namedBounds;
    this.arenaId = 'bonefields';
    this.arenaWorlds = new Map([['bonefields', {
      objects: this.scene.children.filter(object => !existing.has(object) && !object.isLight && object !== this.rain),
      ground: this.ground, staticBatches: this.staticBatches, staticLayout: this.staticLayout,
    }]]);
  }

  /** Build each arena once; switching preserves living rigs, weather and owned resources. */
  setArena(arenaId = 'bonefields') {
    if (!['bonefields', 'colosseum', 'drill-mine'].includes(arenaId)) throw new RangeError(`Unknown arena: ${String(arenaId)}`);
    if (this.arenaId === arenaId) return;
    this.setUltraArenaEnabled(false);
    let world = this.arenaWorlds.get(arenaId);
    if (!world) {
      const existing = new Set(this.scene.children);
      const { ground, distantGround } = (arenaId === 'drill-mine' ? buildDrillMine : buildColosseum)(this);
      const group = new THREE.Group(); group.name = `${arenaId}-world`;
      for (const object of [...this.scene.children]) if (!existing.has(object)) group.add(object);
      this.scene.add(group);
      const staticBatches = mergeStaticMeshes(group, { exclude: [ground, distantGround].filter(Boolean),
        ownedGeometries: this.worldGeometries, freezeWorld: true });
      let sunlight = null;
      if (arenaId === 'drill-mine') {
        const atmosphere = createMineSunlight(); sunlight = atmosphere.group; group.add(sunlight);
        for (const geometry of atmosphere.geometries) this.worldGeometries.add(geometry);
        atmosphere.materials.forEach((material, index) => this.materials.set(`mine-sunlight:${index}`, material));
      }
      world = { objects: [group], ground, staticBatches, staticLayout: staticBatches.namedBounds, sunlight };
      this.arenaWorlds.set(arenaId, world);
    }
    for (const [id, entry] of this.arenaWorlds) for (const object of entry.objects) object.visible = id === arenaId;
    this.arenaId = arenaId;
    this.ground = world.ground;
    this.staticBatches = world.staticBatches;
    this.staticLayout = world.staticLayout;
    this.configureRain(arenaId);
    const mine = arenaId === 'drill-mine';
    this.scene.background?.set(mine ? 0xf3fbff : arenaId === 'colosseum' ? 0x98bacb : 0x271326);
    this.scene.fog?.color.set(mine ? 0x29363e : arenaId === 'colosseum' ? 0x9ab6c5 : 0x29172c);
    if (this.scene.fog) this.scene.fog.density = fogDensityFor(arenaId);
    const sky = this.scene.getObjectByName('arena-hemisphere'), sun = this.scene.getObjectByName('arena-sun');
    if (sky) {
      sky.color.setHex(mine ? 0xf0faff : 0xd7e8ed); sky.groundColor.setHex(mine ? 0x111b23 : 0x382d3e);
      sky.intensity = mine ? 1.15 : 2.8;
    }
    const size = getArenaSize(arenaId);
    if (sun) {
      sun.color.setHex(mine ? 0xf5fcff : 0xffd7ad); sun.intensity = mine ? 1.25 : 3.2;
      sun.position.set(-size.halfWidth * .7, mine ? 155 : 46, size.halfDepth * .75);
      Object.assign(sun.shadow.camera, mine ? { left: -100, right: 100, top: 100, bottom: -100, near: 1, far: 400 }
        : { left: -52, right: 52, top: 48, bottom: -48, near: 1, far: 160 });
      sun.shadow.camera.updateProjectionMatrix();
    }
    for (const [name, color, normalColor, sign, intensity] of [
      ['arena-accent-a', 0xf5ad69, COLORS.pink, -1, 95], ['arena-accent-b', 0x69bfcc, COLORS.cyan, 1, 110]]) {
      const light = this.scene.getObjectByName(name);
      if (!light) continue;
      light.color.setHex(mine ? color : normalColor);
      light.position.set(sign * size.halfWidth * .65, mine ? 16 : 6, sign * size.halfDepth * .65);
      light.intensity = mine ? intensity * 1.35 : intensity; light.distance = mine ? 64 : 48;
    }
    if (this.warOverlay) {
      this.scene.remove(this.warOverlay); this.warOverlay.userData.dispose(); this.warOverlay = null;
      if (this.warMode) this.ensureWarOverlay();
    }
    if (this.camera) {
      if (this.warMode && !this.warPossessed) this.positionWarCamera();
      else if (!this.firstPerson) this.positionOverviewCamera();
      else { this.camera.far = playFarFor(arenaId); this.camera.updateProjectionMatrix(); }
    }
  }

  /** Preserve the original Mine world, lighting and floor for menu/arena round trips. */
  setUltraArenaEnabled(enabled) {
    enabled = enabled === true && this.arenaId === 'drill-mine';
    if (!enabled) this.ultraControlRoomLighting?.reset();
    if (enabled === Boolean(this.ultraArenaActive)) return;
    const world = this.arenaWorlds.get('drill-mine');
    if (enabled) {
      this.ultraArena ||= createUltraArena(this);
      this.ultraAtmosphere = { background: this.scene.background?.clone(), fog: this.scene.fog?.color.clone(),
        density: this.scene.fog?.density, far: this.camera?.far };
      for (const object of world.objects) object.visible = false;
      this.ultraArena.group.visible = true; this.ground = this.ultraArena.island;
      this.scene.background?.set(0x201922); this.scene.fog?.color.set(0x39231e);
    } else {
      if (this.ultraArena) this.ultraArena.group.visible = false;
      this.rain?.position.set(0, 0, 0);
      if (this.arenaId === 'drill-mine' && world) {
        for (const object of world.objects) object.visible = true;
        this.ground = world.ground;
        const atmosphere = this.ultraAtmosphere;
        if (atmosphere?.background) this.scene.background?.copy(atmosphere.background);
        if (atmosphere?.fog) this.scene.fog?.color.copy(atmosphere.fog);
        if (this.scene.fog && Number.isFinite(atmosphere?.density)) this.scene.fog.density = atmosphere.density;
        if (this.camera && Number.isFinite(atmosphere?.far)) {
          this.camera.far = atmosphere.far; this.camera.updateProjectionMatrix();
        }
      }
      this.ultraAtmosphere = null;
    }
    this.ultraArenaActive = enabled;
  }

  updateUltraArena(state, time) {
    this.setUltraArenaEnabled(isUltraArenaActive(state));
    if (this.ultraArenaActive) this.ultraArena.update(state.ultraEncounter, time);
  }

  /** Watch mode follows the powered entrance with a continuous, pause-safe camera. */
  positionUltraEntranceCamera(encounter, dt) {
    const pose = this.ultraArenaActive && encounter?.followCamera && !encounter.complete ? this.ultraArena?.cameraPose : null;
    if (!pose) { this.ultraFollowCamera = null; return false; }
    const desiredPosition = new THREE.Vector3(pose.position.x, pose.position.y, pose.position.z);
    const desiredTarget = new THREE.Vector3(pose.target.x, pose.target.y, pose.target.z);
    if (!this.ultraFollowCamera || this.ultraFollowCamera.shotId !== pose.shotId) {
      this.ultraFollowCamera = { position: desiredPosition.clone(), target: desiredTarget.clone(), shotId: pose.shotId };
    }
    // The powered flight is already a smooth path: follow its formation without a speed-dependent lag.
    if (pose.tracking) {
      this.ultraFollowCamera.position.copy(desiredPosition);
      this.ultraFollowCamera.target.copy(desiredTarget);
    } else {
      const weight = 1 - Math.exp(-Math.max(0, dt) * 5);
      this.ultraFollowCamera.position.lerp(desiredPosition, weight);
      this.ultraFollowCamera.target.lerp(desiredTarget, weight);
    }
    this.camera.position.copy(this.ultraFollowCamera.position);
    this.camera.lookAt(this.ultraFollowCamera.target);
    return true;
  }

  /** Keep one rain draw; cached buffers preserve density without reallocating on repeated travel. */
  configureRain(arenaId) {
    const { width, depth, halfWidth, halfDepth } = getArenaSize(arenaId), key = `${width}:${depth}`;
    this.rainLayouts ||= new Map([[`${ARENA_SIZE.width}:${ARENA_SIZE.depth}`, this.rain.geometry]]);
    let geometry = this.rainLayouts.get(key);
    if (!geometry) {
      const count = Math.ceil(840 * (width + 34) * (depth + 30) / ((ARENA_SIZE.width + 34) * (ARENA_SIZE.depth + 30)));
      const positions = new Float32Array(count * 6);
      for (let index = 0; index < positions.length; index += 6) {
        positions[index] = Math.random() * (width + 34) - halfWidth - 17;
        positions[index + 1] = Math.random() * 32;
        positions[index + 2] = Math.random() * (depth + 30) - halfDepth - 15;
        positions[index + 3] = positions[index] - .15;
        positions[index + 4] = positions[index + 1] - 1.15;
        positions[index + 5] = positions[index + 2];
      }
      geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.worldGeometries.add(geometry); this.rainLayouts.set(key, geometry);
    }
    this.rain.geometry = geometry;
  }

  updateRain(dt) {
    const rain = this.rain.geometry.attributes.position;
    const fall = Math.max(0, Number.isFinite(dt) ? dt : 0) * 17;
    for (let index = 0; index < rain.array.length; index += 6) {
      rain.array[index + 1] -= fall;
      if (rain.array[index + 1] < -2) rain.array[index + 1] = 32;
      rain.array[index + 4] = rain.array[index + 1] - 1.15;
    }
    rain.needsUpdate = true;
  }

  /** Reuse the local rain field around elevated Ultra views without diluting its density. */
  updateRainOrigin() {
    if (this.ultraArenaActive) this.rain.position.set(this.camera.position.x, Math.max(0, this.camera.position.y - 16), this.camera.position.z);
    else this.rain.position.set(0, 0, 0);
  }

  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.fov = this.firstPerson ? this.thirdPerson ? 64 : 82 : width < 700 ? 58 : 44;
    if (this.warMode && !this.warPossessed) this.positionWarCamera();
    else if (this.firstPerson) this.camera.far = playFarFor(this.arenaId);
    else this.positionOverviewCamera();
    this.camera.updateProjectionMatrix();
  }

  positionOverviewCamera() {
    const size = getArenaSize(this.arenaId);
    const portraitScale = Math.max(1, Math.pow(1.25 / this.camera.aspect, 0.65));
    if (this.arenaId === 'drill-mine') this.camera.position.set(10, 220, 12).multiplyScalar(portraitScale);
    else this.camera.position.copy(OVERVIEW_CAMERA).multiplyScalar(portraitScale * (this.arenaId === 'colosseum' ? 1.3 : 1));
    this.camera.lookAt(0, 0, 2);
    const overviewScale = Math.max(size.width / 36, size.depth / 26);
    if (this.scene?.fog) this.scene.fog.density = fogDensityFor(this.arenaId) / (overviewScale * portraitScale);
    const far = Math.max(playFarFor(this.arenaId), this.camera.position.length() + Math.hypot(size.width, size.depth)
      + (this.arenaId === 'drill-mine' ? 130 : 30));
    if (this.camera.far !== far) { this.camera.far = far; this.camera.updateProjectionMatrix(); }
  }

  aim(clientX, clientY, player) {
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.set((clientX - bounds.left) / bounds.width * 2 - 1, -(clientY - bounds.top) / bounds.height * 2 + 1);
    this.ray.setFromCamera(this.pointer, this.camera);
    if (this.ray.ray.intersectPlane(this.floor, this.target)) return Math.atan2(this.target.x - player.x, this.target.z - player.z);
    return player.angle;
  }

  screenMovement(x, z) {
    if (this.firstPerson) {
      const yaw = this.look.angle;
      return { x: -x * Math.cos(yaw) - z * Math.sin(yaw), z: x * Math.sin(yaw) - z * Math.cos(yaw) };
    }
    const yaw = Math.atan2(this.camera.position.x, this.camera.position.z);
    return { x: x * Math.cos(yaw) + z * Math.sin(yaw), z: -x * Math.sin(yaw) + z * Math.cos(yaw) };
  }

  updateEnemyTeam(record, enemy) {
    const color = this.warMode ? WAR_TEAM_COLORS[enemy.team] : undefined;
    if (color === undefined) {
      if (record.teamRing) record.teamRing.visible = false;
      record.health.material.color.setHex(COLORS.pink);
      return;
    }
    if (!record.teamRing) {
      const radius = enemy.type === 'octo-nose' ? 1.1 : enemy.radius || .7;
      record.teamRing = this.ring(Math.max(.55, Math.min(5, radius)), color, .065);
      record.teamRing.name = `war-team-ring-${enemy.id}`; this.scene.add(record.teamRing);
    }
    record.teamRing.visible = true; record.teamRing.material.color.setHex(color);
    record.teamRing.position.set(enemy.x, .15, enemy.z);
    record.health.material.color.setHex(color);
  }

  ensureEnemy(enemy) {
    let record = this.enemies.get(enemy.id);
    if (record) return record;
    const model = createCreature(enemy.type);
    model.scale.setScalar(enemy.modelScale ?? 1);
    model.userData.spirit = enemy.spirit === true;
    const healthHeight = new THREE.Box3().setFromObject(model).max.y + 0.35;
    const voxels = new VoxelBody(model);
    const telegraph = this.ring(enemy.boss ? enemy.radius + 1.3 : ['gardener', 'trider'].includes(enemy.type) ? 3.7 : enemy.type === 'spreader' ? 5 : 1.9,
      0xff9a4d, enemy.type === 'mech-spider-tank-ultra' ? .55 : .12);
    const health = new THREE.Mesh(new THREE.PlaneGeometry(enemy.boss ? 2.5 : 1.25, 0.09), new THREE.MeshBasicMaterial({ color: COLORS.pink, depthTest: false }));
    const shield = enemy.boss ? new THREE.Mesh(new THREE.SphereGeometry(enemy.radius + 0.6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xb886ff, transparent: true, opacity: 0.16, wireframe: true, depthWrite: false })) : null;
    this.scene.add(model, telegraph, health);
    if (shield) this.scene.add(shield);
    const motion = createLocomotion(enemy.x, enemy.z, (Number(enemy.id) || 0) * 0.37);
    record = { model, voxels, hp: enemy.hp, telegraph, health, healthHeight, baseModelScale: enemy.modelScale ?? 1, shield, motion };
    this.enemies.set(enemy.id, record);
    return record;
  }

  removeEnemy(id, record = this.enemies.get(id)) {
    if (!record) return;
    updateUltraHeldRobot(record, null);
    this.scene.remove(record.model, record.telegraph, record.health);
    record.voxels.dispose();
    record.model.userData.disposeVisuals?.();
    if (record.shield) {
      this.scene.remove(record.shield);
      record.shield.geometry.dispose(); record.shield.material.dispose();
    }
    record.telegraph.geometry.dispose(); record.telegraph.material.dispose();
    record.health.geometry.dispose(); record.health.material.dispose();
    if (record.teamRing) {
      this.scene.remove(record.teamRing); record.teamRing.geometry.dispose(); record.teamRing.material.dispose();
    }
    this.enemies.delete(id);
  }

  addVoxelPiece(cells, angle, side = 1) {
    if (!cells.length || this.particles.length > 220) return;
    const mesh = createVoxelFragment(cells);
    this.scene.add(mesh);
    this.particles.push({ mesh, vx: Math.cos(angle) * side * 2 + Math.sin(angle),
      vz: -Math.sin(angle) * side * 2 + Math.cos(angle), vy: 1.5 + Math.random(),
      spin: new THREE.Vector3((Math.random() - 0.5) * 4, 0, side * 1.7), life: 9, debris: true, rigid: true });
  }

  /** Release a severed piece where it was struck: dragged along the blade, parted from the cut, then gravity. */
  dropPiece(cells, blade, chip = false) {
    if (!cells.length || this.particles.length > 220) return;
    const mesh = createVoxelFragment(cells);
    this.scene.add(mesh);
    const side = blade.normal.dot(scratch.copy(mesh.position).sub(blade.point)) < 0 ? -1 : 1;
    const velocity = blade.travel.clone().multiplyScalar(chip ? 2.2 + Math.random() * 2.4 : 1.1 + Math.random() * 0.5)
      .addScaledVector(blade.normal, chip ? (Math.random() - 0.5) * 1.6 : side * 0.7)
      .addScaledVector(blade.forward, chip ? Math.random() * 1.2 : 0.35);
    if (chip) velocity.y += 0.6;
    // Topple over in the direction the piece is carried.
    const spin = new THREE.Vector3(velocity.z, 0, -velocity.x).multiplyScalar(chip ? 2.5 : 0.9 + Math.random() * 0.5);
    this.particles.push({ mesh, vx: velocity.x, vy: velocity.y, vz: velocity.z, spin, life: 9, debris: true, rigid: true });
  }

  prepareEnemyCut(event, enemy) {
    const record = this.ensureEnemy(enemy);
    record.model.position.x = enemy.x;
    record.model.position.y = Math.max(0, enemy.elevation || 0) + (record.groundHop || 0);
    record.model.position.z = enemy.z;
    record.model.rotation.y = enemy.legAngle ?? enemy.angle;
    record.model.scale.setScalar(enemy.modelScale ?? 1);
    record.voxels.updateParts();
    return record.voxels;
  }

  cutEnemy(event, enemy) {
    if (!enemy || enemy.shielded) return null;
    this.prepareEnemyCut(event, enemy);
    const record = this.enemies.get(enemy.id);
    const point = new THREE.Vector3(event.originX, Number.isFinite(event.originY) ? event.originY : EYE_HEIGHT, event.originZ);
    const pitch = Number.isFinite(event.pitch) ? event.pitch
      : Math.atan2(event.cutHeight - point.y, Math.max(0.2, Math.hypot(enemy.x - point.x, enemy.z - point.z)));
    const blade = { point, ...bladeSweep({ angle: event.attackAngle, pitch, tilt: event.cutTilt }) };
    record.blade = blade;
    const result = record.voxels.cut({ point, normal: blade.normal, forward: blade.forward, arc: SWING_ARC,
      origin: point, reach: SWORD_REACH, power: event.bladePower || 1 });
    for (const cells of result.fragments) this.dropPiece(cells, blade);
    const impactCells = [...result.chips, ...(result.absorbedHits || [])];
    if (impactCells.length) this.strike(impactCells, blade, result.fragments.length > 0);
    if (result.absorbedHits?.length) {
      record.shieldImpact = 1;
      this.blockSword(event);
    }
    // Only the blade-width voxels become chips. Detached anatomy falls in connected pieces.
    const stride = Math.max(1, Math.ceil(result.chips.length / 20));
    for (let index = 0; index < result.chips.length; index += stride) this.dropPiece([result.chips[index]], blade, true);
    return result;
  }

  /** Resolve an army attack against the defender's current real voxel pose, without moving a player sword. */
  resolveWarHit(event, attacker, defender) {
    if (!defender || !event || defender.hp <= 0 || defender.shielded) return null;
    this.prepareEnemyCut(event, defender);
    const record = this.enemies.get(defender.id);
    const point = new THREE.Vector3(Number.isFinite(event.originX) ? event.originX : attacker?.x || 0,
      Number.isFinite(event.originY) ? event.originY : 1.3 + (attacker?.elevation || 0),
      Number.isFinite(event.originZ) ? event.originZ : attacker?.z || 0);
    const angle = Number.isFinite(event.attackAngle) ? event.attackAngle : Math.atan2(defender.x - point.x, defender.z - point.z);
    const blade = { point, ...bladeSweep({ angle, pitch: Number.isFinite(event.pitch) ? event.pitch : 0,
      tilt: Number.isFinite(event.cutTilt) ? event.cutTilt : 0 }) };
    const result = record.voxels.cut({ point, normal: blade.normal, forward: blade.forward,
      arc: Number.isFinite(event.arc) ? Math.max(0, event.arc) : SWING_ARC,
      origin: point, reach: Number.isFinite(event.reach) ? Math.max(0, event.reach) : SWORD_REACH,
      power: Number.isFinite(event.bladePower) ? Math.max(.1, event.bladePower) : 1 });
    record.blade = blade;
    for (const cells of result.fragments) this.dropPiece(cells, blade);
    const impacts = [...result.chips, ...(result.absorbedHits || [])];
    if (impacts.length) this.strike(impacts, blade, result.fragments.length > 0);
    if (result.absorbedHits?.length) record.shieldImpact = 1;
    const stride = Math.max(1, Math.ceil(result.chips.length / 12));
    for (let index = 0; index < result.chips.length; index += stride) this.dropPiece([result.chips[index]], blade, true);
    return result;
  }

  /** Stop the current swing at its contact pose, then recoil toward its ready pose. */
  blockSword(event) {
    if (event.swingId !== undefined && event.swingId !== this.swingId) return;
    if (!this.blockedSwing) this.blockedSwing = { time: this.time,
      progress: Math.max(0, Math.min(SWING_CONTACT / SWING_TIME, (this.time - this.swingStart) / SWING_TIME)) };
    for (const effect of this.effects) if (effect.swordSlash && effect.swingId === this.swingId) effect.life = 0;
  }

  /** The actual camera-space blade cannot be placed through a surviving shield voxel. */
  constrainViewBlade() {
    if (!this.weapon?.userData.sword || !this.camera) return null;
    const bodies = [...this.enemies.values()].map(record => record.voxels).filter(body => body.durableCells?.length);
    if (!bodies.length) return null;
    let contact = null;
    const sword = this.weapon.userData.sword;
    const base = new THREE.Vector3(), tip = new THREE.Vector3(), delta = new THREE.Vector3();
    const inverseCamera = this.camera.getWorldQuaternion(new THREE.Quaternion()).invert();
    for (let attempt = 0; attempt < 3; attempt++) {
      this.camera.updateMatrixWorld(true);
      base.set(.025, .22, -.006); sword.localToWorld(base);
      tip.set(.025, 1.39, -.006); sword.localToWorld(tip);
      const eye = this.camera.getWorldPosition(new THREE.Vector3());
      let end = tip, hit = findShieldContact(bodies, base, tip, { radius: .06 });
      if (!hit) { hit = findShieldContact(bodies, eye, base, { radius: .06 }); end = base; }
      if (!hit) { hit = findShieldContact(bodies, eye, tip, { radius: .06 }); end = tip; }
      if (!hit) break;
      contact = hit;
      delta.copy(hit.point).addScaledVector(hit.normal, .015).sub(end).applyQuaternion(inverseCamera);
      this.weapon.position.add(delta);
    }
    return contact;
  }

  /** Energy sparks thrown off the wound along the blade's path, a flash on the seam, and a camera kick. */
  strike(chips, blade, severed) {
    const centre = chips.reduce((sum, chip) => sum.add(chip.position), new THREE.Vector3()).multiplyScalar(1 / chips.length);
    const count = Math.min(severed ? 22 : 12, 6 + chips.length);
    for (let i = 0; i < count && this.particles.length < 450; i++) {
      const from = chips[Math.floor(Math.random() * chips.length)].position;
      const mesh = new THREE.Mesh(cube, this.material(i % 3 ? 0xb2fff0 : 0xffd27a, 2.4));
      mesh.scale.setScalar(0.03 + Math.random() * 0.05);
      mesh.position.copy(from);
      this.scene.add(mesh);
      const speed = 3 + Math.random() * 5;
      this.particles.push({ mesh, vx: blade.travel.x * speed + (Math.random() - 0.5) * 2.5,
        vy: blade.travel.y * speed + 1.5 + Math.random() * 2.5, vz: blade.travel.z * speed + (Math.random() - 0.5) * 2.5,
        life: 0.25 + Math.random() * 0.35, spark: true });
    }
    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshBasicMaterial({ color: 0xd8fff6, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
    flash.position.copy(centre);
    this.scene.add(flash);
    this.effects.push({ mesh: flash, life: 0.12, maxLife: 0.12, grow: 7 });
    this.shake = Math.max(this.shake, severed ? 0.11 : 0.06);
    // Follow-through: the view rolls and nudges with the blade.
    this.kick = severed ? 1 : 0.6;
    this.kickTilt = Math.atan2(-blade.travel.y, Math.hypot(blade.travel.x, blade.travel.z)) ;
  }

  burst(x, z, color, count = 16, force = 7, y = .8) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= 450) break;
      const mesh = new THREE.Mesh(cube, this.material(color, 0.3));
      const scale = 0.09 + Math.random() * 0.23;
      mesh.scale.setScalar(scale);
      mesh.position.set(x, y + Math.random(), z);
      this.scene.add(mesh);
      this.particles.push({ mesh, vx: (Math.random() - 0.5) * force, vy: 3 + Math.random() * force, vz: (Math.random() - 0.5) * force, life: 0.6 + Math.random() * 0.6 });
    }
  }

  explodeFortress(record) {
    const cells = record.voxels.collapse().flat();
    const center = record.model.position.clone(); center.y += 3;
    while (this.particles.length > 330) {
      const old = this.particles.shift(); this.scene.remove(old.mesh);
      if (old.mesh.isInstancedMesh) old.mesh.dispose();
    }
    for (const group of partitionExplosionCells(cells)) {
      const mesh = createVoxelFragment(group);
      const dx = mesh.position.x - center.x, dz = mesh.position.z - center.z, distance = Math.max(.2, Math.hypot(dx, dz));
      const force = 6 + Math.random() * 7;
      this.scene.add(mesh);
      this.particles.push({ mesh, vx: dx / distance * force, vz: dz / distance * force, vy: 4 + Math.random() * 6,
        spin: new THREE.Vector3((Math.random() - .5) * 5, (Math.random() - .5) * 4, (Math.random() - .5) * 5),
        life: 5 + Math.random() * 2, debris: true, rigid: true });
    }
    this.shake = .5;
  }

  effect(event) {
    const { type, x = 0, z = 0, angle = 0 } = event;
    if (type === 'repair') {
      const target = this.enemies.get(event.id), source = this.enemies.get(event.sourceId);
      if (!target) return null;
      const repaired = target.voxels.repair({ maxCells: event.cells ?? 16 });
      const from = source ? source.model.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(x, 2, z);
      const to = target.model.getWorldPosition(new THREE.Vector3()); to.y += target.healthHeight * .5;
      const beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]),
        new THREE.LineBasicMaterial({ color: 0x7df5db, transparent: true, opacity: .95, depthWrite: false }));
      this.scene.add(beam); this.effects.push({ mesh: beam, life: .3, maxLife: .3, grow: 0 });
      return repaired;
    } else if (type === 'start') {
      for (const [id, record] of this.enemies) this.removeEnemy(id, record);
      if (this.hazards?.size) this.updateHazards([], this.time);
      for (const p of this.particles) { this.scene.remove(p.mesh); if (p.mesh.isInstancedMesh) p.mesh.dispose(); }
      for (const effect of this.effects) {
        this.scene.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        effect.mesh.material.dispose();
      }
      this.particles = [];
      this.effects = [];
      this.clearProjectileVisuals();
      this.ultraControlRoomLighting?.reset();
      this.swingStart = -1;
      this.blockedSwing = null;
      this.swingId = 0;
      this.kick = 0;
    } else if (type === 'ultraroofimpact') {
      // A volley can land together; retain a fixed number of short-lived blast rings.
      let count = 0, oldest = -1;
      for (let i = 0; i < this.effects.length; i++) if (this.effects[i].roofImpact) {
        if (oldest < 0) oldest = i;
        count++;
      }
      if (count >= ROOF_IMPACT_EFFECT_CAP) this.removeEffect(oldest);
      const y = Number.isFinite(event.y) ? event.y : 0;
      const radius = Number.isFinite(event.radius) ? Math.max(.1, event.radius) : ULTRA_ROOF_MISSILES.impactRadius;
      const mesh = this.ring(radius, event.blocked ? 0xffd49a : 0xff993d, .16);
      mesh.name = 'ultra-roof-impact'; mesh.position.set(x, y + .04, z);
      this.scene.add(mesh);
      this.effects.push({ mesh, life: .48, maxLife: .48, grow: 1.2, roofImpact: true });
      this.burst(x, z, 0xe9a269, event.blocked ? 10 : 18, 6, y);
      this.shake = Math.max(this.shake, event.blocked ? .12 : .2);
    } else if (type === 'slash') {
      // A flash along the real cut line: the arc the blade sweeps through the eye.
      const tilt = Number.isFinite(event.cutTilt) ? event.cutTilt : event.vertical ? Math.PI / 2 : 0;
      const sweep = bladeSweep({ angle, pitch: event.pitch || 0, tilt });
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.035, 3, 28, SWING_ARC * 2), new THREE.MeshBasicMaterial({ color: 0xb2fff0, transparent: true, opacity: 0.9, depthWrite: false }));
      basis.makeBasis(sweep.forward, sweep.travel, scratch.crossVectors(sweep.forward, sweep.travel));
      mesh.quaternion.setFromRotationMatrix(basis).multiply(swingQuat.setFromAxisAngle(AXIS_Z, -SWING_ARC));
      mesh.position.set(x, EYE_HEIGHT, z);
      mesh.visible = false;
      this.scene.add(mesh);
      this.effects.push({ mesh, life: 0.2, maxLife: 0.2, grow: 0.5, delay: SWING_CONTACT * 0.7,
        swordSlash: true, swingId: event.swingId ?? 0 });
      this.swingStart = this.time;
      this.swingTilt = tilt;
      this.swingId = event.swingId ?? 0;
      this.blockedSwing = null;
    } else if (type === 'sever') {
      // The severed anatomy itself falls from the cut; no extra debris is spawned.
      this.shake = Math.max(this.shake, 0.08);
    } else if (type === 'spray') {
      this.burst(x, z, 0xed6e9f, 18, 6);
    } else if (type === 'kick' || type === 'dash' || type === 'spawn') {
      const mesh = this.ring(type === 'kick' ? 2.7 : 0.9, type === 'spawn' ? COLORS.pink : COLORS.cyan, 0.12);
      mesh.position.set(x, 0.08, z);
      this.scene.add(mesh);
      this.effects.push({ mesh, life: 0.35, maxLife: 0.35, grow: type === 'kick' ? 1.8 : 3 });
      if (type === 'dash') this.burst(x, z, COLORS.cyan, 10, 3);
    } else if (type === 'hit' || type === 'kill') {
      const explosiveMachine = ['copper-fortress', 'copper-mega-drill', 'mech-spider-tank-ultra'].includes(event.enemyType);
      if (type === 'kill') {
        const record = this.enemies.get(event.id);
        const blade = event.weapon === 'sword' ? record?.blade : null;
        if (record && explosiveMachine) {
          updateUltraHeldRobot(record, null);
          this.explodeFortress(record);
        } else record?.voxels.collapse().forEach((cells, index) => blade ? this.dropPiece(cells, blade)
          : this.addVoxelPiece(cells, event.attackAngle ?? angle, index % 2 ? -1 : 1));
      }
      // Sword wounds already shed real voxels and sparks at the strike; skip the generic fountain.
      const sword = event.weapon === 'sword';
      if (!sword) this.burst(x, z, explosiveMachine || ['copper-robot', 'knight', 'miner-bot', 'copper-mine-walker', 'copper-spider-drone', 'copper-drill-worm', 'copper-head-catapult', 'copper-drill-hound', 'copper-repair-drone'].includes(event.enemyType) ? COLORS.copper : COLORS.pink, type === 'kill' ? 30 : 8);
      if (type === 'kill' && !sword) this.burst(x, z, COLORS.blue, 12);
      this.shake = type === 'kill' && explosiveMachine ? .5 : type === 'kill' ? .1 : .045;
    } else if (type === 'hurt') {
      this.burst(x, z, 0xffb16b, 12);
      this.shake = 0.22;
    }
  }

  /** Reuse bounded projectile rigs; landing warnings remain independent of hidden armed rockets. */
  updateProjectileVisuals(bolts = [], time = this.time) {
    const count = Math.min(bolts.length, ULTRA_ROOF_MISSILES.projectileCap);
    while (this.projectileMeshes.length < count) {
      const visual = new THREE.Group();
      const geometry = new THREE.IcosahedronGeometry(0.19, 0);
      this.worldGeometries.add(geometry);
      const bolt = new THREE.Mesh(geometry, this.material(0xff86cd, 2));
      const missile = new THREE.Group();
      const body = new THREE.Mesh(cube, this.material(0xba794d));
      body.scale.set(.19, .19, .65);
      const noseGeometry = new THREE.ConeGeometry(.14, .25, 4);
      this.worldGeometries.add(noseGeometry);
      const nose = new THREE.Mesh(noseGeometry, this.material(0xead0a1));
      nose.rotation.x = Math.PI / 2;
      nose.position.z = .44;
      const fins = new THREE.Mesh(cube, this.material(0x467a81));
      fins.scale.set(.43, .06, .23);
      fins.position.z = -.2;
      const flame = new THREE.Mesh(cube, this.material(0x60cfff, 2));
      flame.position.z = -.46;
      flame.scale.set(.09, .09, .24);
      missile.add(body, nose, fins, flame);
      const head = createShieldRobotHead(); head.name = 'catapult-copper-head';
      if (!this.headLandingGeometry) {
        this.headLandingGeometry = new THREE.RingGeometry(.94, 1, 40);
        this.worldGeometries.add(this.headLandingGeometry);
        this.materials.set('copper-head-warning', new THREE.MeshBasicMaterial({ color: 0xffb56c,
          transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false }));
      }
      if (!this.materials.has('ultra-roof-warning')) {
        this.materials.set('ultra-roof-warning', new THREE.MeshBasicMaterial({ color: 0xffb33f,
          transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false }));
      }
      const landing = new THREE.Mesh(this.headLandingGeometry, this.materials.get('copper-head-warning'));
      landing.name = 'catapult-head-landing-warning'; landing.rotation.x = -Math.PI / 2; landing.visible = false;
      visual.add(bolt, missile, head);
      visual.userData = { bolt, missile, flame, head, landing };
      this.projectileMeshes.push(visual);
      this.scene.add(visual, landing);
    }
    for (let i = 0; i < this.projectileMeshes.length; i++) {
      const mesh = this.projectileMeshes[i];
      const projectile = i < count ? bolts[i] : null;
      const roof = projectile?.kind === ULTRA_ROOF_MISSILE_KIND;
      mesh.visible = Boolean(projectile) && (!roof || projectile.age >= 0);
      mesh.userData.landing.visible = false;
      if (projectile) {
        const rocket = roof || projectile.kind === 'copper-missile';
        const head = projectile.kind === 'copper-head';
        mesh.position.set(projectile.x, projectile.y ?? 1.3, projectile.z);
        mesh.userData.bolt.visible = !rocket && !head;
        mesh.userData.missile.visible = rocket && mesh.visible;
        mesh.userData.missile.scale.setScalar(roof ? 3 : 1);
        mesh.userData.head.visible = head;
        mesh.rotation.set(0, 0, 0);
        mesh.userData.bolt.material = this.material(projectile.kind === 'copper' ? 0x70cfff : projectile.kind === 'ice' ? 0x75dfff : projectile.kind === 'ghost' || projectile.kind === 'soul' ? 0xc48aff : 0xff86cd, 2);
        if (rocket) {
          mesh.rotation.set(-Math.atan2(projectile.vy || 0, Math.hypot(projectile.vx, projectile.vz)), Math.atan2(projectile.vx, projectile.vz), 0, 'YXZ');
          mesh.userData.flame.scale.z = .2 + Math.sin(time * 45 + i) * .05;
          if (roof && Number.isFinite(projectile.targetX) && Number.isFinite(projectile.targetZ)) {
            const landing = mesh.userData.landing;
            landing.name = 'ultra-roof-landing-warning';
            landing.visible = true;
            landing.material = this.materials.get('ultra-roof-warning');
            landing.position.set(projectile.targetX, (projectile.targetY ?? 0) + .04, projectile.targetZ);
            landing.scale.setScalar(projectile.impactRadius ?? ULTRA_ROOF_MISSILES.impactRadius);
            landing.material.opacity = .65 + Math.sin(time * 14) * .2;
          }
        } else if (head) {
          const age = projectile.age || 0;
          mesh.userData.head.rotation.set(age * 5, Math.atan2(projectile.vx, projectile.vz) + age * 1.7, age * .8);
          if (Number.isFinite(projectile.targetX) && Number.isFinite(projectile.targetZ)) {
            const landing = mesh.userData.landing;
            landing.name = 'catapult-head-landing-warning';
            landing.material = this.materials.get('copper-head-warning');
            landing.visible = true; landing.position.set(projectile.targetX, .075, projectile.targetZ);
            landing.scale.setScalar(projectile.impactRadius ?? 1.9);
            landing.material.opacity = .65 + Math.sin(time * 14) * .2;
          }
        }
      }
    }
  }

  clearProjectileVisuals(remove = false) {
    for (const mesh of this.projectileMeshes || []) {
      mesh.visible = false; mesh.userData.missile.visible = false; mesh.userData.landing.visible = false;
      if (remove) this.scene.remove(mesh, mesh.userData.landing);
    }
    if (remove && this.projectileMeshes) this.projectileMeshes.length = 0;
  }

  removeEffect(index) {
    const effect = this.effects[index];
    this.scene.remove(effect.mesh);
    effect.mesh.geometry.dispose(); effect.mesh.material.dispose();
    this.effects.splice(index, 1);
  }

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      if (effect.delay > 0) { effect.delay -= dt; continue; }
      effect.mesh.visible = true;
      effect.life -= dt;
      if (effect.life <= 0) {
        this.removeEffect(i);
      } else {
        effect.mesh.material.opacity = effect.life / effect.maxLife;
        effect.mesh.scale.addScalar(dt * effect.grow);
      }
    }
  }

  update(state, dt, inputSpeed = 0) {
    const menu = state.mode === 'menu';
    const war = this.warMode === true || state.playMode === 'war' && !menu;
    if (war && !this.warMode) this.setWarMode(true);
    const possessed = war && state.war?.playerActive === true && ['playing', 'paused'].includes(state.mode);
    if (possessed !== this.warPossessed) {
      this.warPossessed = possessed;
      if (possessed) { this.camera.clearViewOffset(); this.firstPerson = false; }
    }
    if (this.warOverlay) this.warOverlay.visible = war && (state.mode === 'war-setup' || state.war?.phase === 'setup');
    const effectsDt = menu || state.mode === 'playing' ? dt : 0;
    this.time += effectsDt;
    const time = this.time;
    this.updateUltraArena(state, time);
    const fogDensity = this.ultraArenaActive ? .0015 : fogDensityFor(this.arenaId);
    this.scene.fog.density = menu ? fogDensity / OVERVIEW_SCALE : fogDensity;
    if (this.firstPerson !== (!menu && (!war || possessed))) {
      this.firstPerson = !menu && (!war || possessed);
      this.camera.fov = war && !possessed ? 50 : menu ? (innerWidth < 700 ? 58 : 44) : this.thirdPerson ? 64 : 82;
      if (this.firstPerson) this.camera.far = playFarFor(this.arenaId);
      this.camera.updateProjectionMatrix();
    }
    const sourceEnemies = menu && !war ? this.arenaId === 'drill-mine' ? this.mineDemo || [] : this.arenaId === 'colosseum' ? this.colosseumDemo || [] : this.demo : state.enemies || [];
    const enemies = possessed ? sourceEnemies.filter(enemy => enemy.id !== state.war.playerId && enemy !== state.player) : sourceEnemies;
    const player = menu ? { x: -1, z: 1, angle: 0.8, invulnerable: 0, dashTime: 0 } : state.player || { x: 0, z: 0, angle: 0 };
    this.player.position.set(player.x, player.elevation || 0, player.z);
    this.player.rotation.y = player.angle;
    this.playerMotion ||= createLocomotion(player.x, player.z);
    const heroMotion = advanceLocomotion(this.playerMotion, player, dt, { active: menu || state.mode === 'playing' });
    animateModel(this.player, heroMotion.time, heroMotion.speed, 'chase', { distance: heroMotion.distance });
    this.player.visible = (!war || possessed) && (menu || this.thirdPerson === true);
    if (this.player.userData.rightArm) this.player.userData.rightArm.rotation.x = time - this.swingStart < 0.2 ? -1.5 + (this.swingStart + 0.2 - time) * 8 : -0.55;
    if (this.thirdPerson && this.player.userData.rightArm) {
      const blockAge = this.blockedSwing ? Math.max(0, time - this.blockedSwing.time) : 0;
      const progress = this.blockedSwing ? this.blockedSwing.progress * (1 - smooth(0, .16, blockAge)) : (time - this.swingStart) / SWING_TIME;
      posePlayerSword(this.player, { progress, tilt: this.swingTilt, pitch: this.look.pitch, blocking: player.blocking });
    }
    this.playerRing.position.set(player.x, 0.045, player.z);
    this.playerRing.visible = menu && !war || possessed;
    this.playerRing.material.color.setHex(possessed ? WAR_TEAM_COLORS[state.war.playerTeam] ?? COLORS.cyan : COLORS.cyan);
    this.playerRing.material.opacity = player.dashTime > 0 ? 1 : 0.45 + Math.sin(time * 3) * 0.12;
    const living = new Set(enemies.map(e => e.id));
    for (const [id, record] of this.enemies) {
      if (!living.has(id)) {
        this.removeEnemy(id, record);
      }
    }
    for (const enemy of enemies) {
      const record = this.ensureEnemy(enemy);
      record.hp = enemy.hp;
      this.updateEnemyTeam(record, enemy);
      const active = menu || state.mode === 'playing';
      record.shieldImpact = (record.shieldImpact || 0) * Math.exp(-dt * (active ? 14 : 0));
      const motion = advanceLocomotion(record.motion, enemy, dt, { active, previewSpeed: menu ? enemy.type === 'ling' ? 2.8 : 1.5 : 0 });
      const grounded = ['ling', 'trider', 'copper-robot', 'knight', 'miner-bot', 'copper-head-catapult', 'copper-drill-hound', 'copper-giant', 'frost-triram'].includes(enemy.type);
      const hop = grounded && enemy.bodyDrop === undefined && !enemy.mounted && enemy.crippled && motion.speed > 0.05
        ? Math.max(0, Math.sin(motion.distance * 9)) * 0.18 : 0;
      record.groundHop = hop;
      const elevation = record.model.userData.ultra ? enemy.elevation || 0 : Math.max(0, enemy.elevation || 0);
      record.model.position.set(enemy.x, elevation + hop, enemy.z);
      record.model.rotation.y = enemy.legAngle ?? enemy.angle;
      record.model.scale.setScalar(enemy.modelScale ?? 1);
      if (active || !motion.posed) {
        animateModel(record.model, motion.time, motion.speed, enemy.animationPhase || enemy.phase,
          { distance: motion.distance, wormDistance: enemy.wormDistance, legsLost: enemy.legsLost || 0, severedParts: enemy.severedParts || [], attackName: enemy.attackName || '',
            airborne: Boolean(enemy.launch || enemy.jump), mounted: enemy.mounted === true, controlling: enemy.controlling === true,
            guarding: enemy.guarding === true, guardAmount: enemy.guardAmount || 0,
            shieldImpact: record.shieldImpact,
            partState: record.model.userData.golemMagic ? record.voxels.partState() : undefined,
            weaponState: enemy.weaponState, structureState: enemy.structureState,
            supportHeight: enemy.supportHeight, bodyDrop: enemy.bodyDrop || 0,
            balanceTiltX: enemy.balanceTiltX || 0, balanceTiltZ: enemy.balanceTiltZ || 0,
            torsoYaw: enemy.legAngle === undefined ? 0 : enemy.angle - enemy.legAngle,
            gunAvailable: enemy.gunAvailable, fabricating: enemy.fabricating === true,
            fabricationTime: enemy.fabricationTime || 0, retreating: enemy.retreating === true,
            jumping: Boolean(enemy.jump), jumpProgress: enemy.jumpProgress || 0, elevation: enemy.elevation || 0,
            cannonOpen: enemy.cannonOpen, cannonFire: enemy.cannonFire, hatchOpen: enemy.hatchOpen,
            catapultFire: enemy.catapultFire, repairing: enemy.repairTargetId != null,
            octoHelping: enemy.octoHelping === true, repairTargetId: enemy.repairTargetId,
            activeDrill: enemy.activeDrill, sweepProgress: enemy.sweepProgress, diveProgress: enemy.diveProgress,
            phaseTime: enemy.phaseTime, walkerFeet: enemy.walkerFeet, drillProgress: enemy.drillProgress, ultra: enemy.ultra,
            firingGuns: enemy.firingGuns, targetX: enemy.targetX, targetY: enemy.targetY, targetZ: enemy.targetZ });
        motion.posed = true;
      }
      record.voxels.syncPose();
      if (record.model.userData.ultra || record.ultraHeldRobot) updateUltraHeldRobot(record, enemy, time);
      if (record.shield) {
        record.shield.visible = enemy.shielded === true;
        record.shield.position.set(enemy.x, 2, enemy.z);
        record.shield.rotation.y = time * 0.5;
      }
      const lobWarning = enemy.type === 'copper-head-catapult' && enemy.phase === 'windup'
        && Number.isFinite(enemy.targetX) && Number.isFinite(enemy.targetZ);
      const drillWarning = enemy.type === 'copper-mega-drill' && ['windup', 'strike'].includes(enemy.phase)
        && Number.isFinite(enemy.targetX) && Number.isFinite(enemy.targetZ);
      const spiderWarning = enemy.type === 'copper-spider-drone' && ['windup', 'strike'].includes(enemy.phase)
        && Number.isFinite(enemy.targetX) && Number.isFinite(enemy.targetZ);
      const walkerWarning = enemy.type === 'copper-mine-walker' && ['windup', 'strike'].includes(enemy.phase)
        && Number.isFinite(enemy.targetX) && Number.isFinite(enemy.targetZ);
      const ultraWarning = enemy.type === 'mech-spider-tank-ultra' && ['warning', 'slam', 'down'].includes(enemy.ultra?.phase)
        && Number.isFinite(enemy.targetX) && Number.isFinite(enemy.targetZ);
      const targetWarning = lobWarning || drillWarning || spiderWarning || walkerWarning || ultraWarning;
      record.telegraph.position.set(targetWarning ? enemy.targetX : enemy.x, 0.07, targetWarning ? enemy.targetZ : enemy.z);
      record.telegraph.scale.setScalar(ultraWarning ? (enemy.warningRadius || 4) / (enemy.radius + 1.3)
        : drillWarning ? (enemy.warningRadius || 2.7) / (enemy.radius + 1.3)
        : walkerWarning ? (enemy.attackName === 'drill' ? 1.8 : 1.2) / (enemy.radius + 1.3)
          : spiderWarning ? 1.8 / (enemy.radius + 1.3) : lobWarning ? 1.1 / 1.9 : 1);
      record.telegraph.visible = ultraWarning || enemy.phase === 'windup' || enemy.phase === 'strike' || enemy.missileWindup > 0;
      record.telegraph.material.opacity = 0.45 + Math.sin(time * 18) * 0.3;
      if (ultraWarning) {
        const boarding = enemy.ultra.phase === 'down';
        record.telegraph.material.color.set(boarding ? 0x68f5dc : 0xff6b36);
        if (boarding) record.telegraph.material.opacity = .4;
      }
      record.health.visible = enemy.hp < enemy.maxHp && enemy.hp > 0;
      const healthHeight = (record.healthHeight - .35) * (enemy.modelScale ?? 1) / record.baseModelScale + .35;
      const supportDrop = enemy.bodyDrop || 0;
      record.health.position.set(enemy.x, healthHeight + record.model.position.y - supportDrop, enemy.z);
      record.health.quaternion.copy(this.camera.quaternion);
      record.health.scale.x = Math.max(0, enemy.hp / enemy.maxHp);
    }
    this.updateProjectileVisuals(state.projectiles || [], time);
    this.updateHazards(state.hazards || [], time);
    this.updateEffects(effectsDt);
    const physicsDt = state.mode === 'playing' ? dt : 0;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!physicsDt) continue;
      p.life -= physicsDt;
      p.vy -= 19 * physicsDt;
      p.mesh.position.x += p.vx * physicsDt;
      p.mesh.position.y += p.vy * physicsDt;
      p.mesh.position.z += p.vz * physicsDt;
      if (p.rigid) {
        const turn = p.spin.length();
        if (turn > 1e-4) p.mesh.rotateOnWorldAxis(scratch.copy(p.spin).divideScalar(turn), turn * physicsDt);
        p.mesh.updateMatrixWorld();
        const bounds = rigidBounds.copy(p.mesh.boundingBox).applyMatrix4(p.mesh.matrixWorld);
        if (bounds.min.y < 0.04) {
          p.mesh.position.y += 0.04 - bounds.min.y;
          p.vy *= -0.12; p.vx *= 0.8; p.vz *= 0.8; p.spin.multiplyScalar(0.7);
        }
      } else {
        p.mesh.rotation.x += physicsDt * 5;
        p.mesh.rotation.z += physicsDt * 3;
        if (p.mesh.position.y < 0.1) { p.mesh.position.y = 0.1; p.vy *= -0.16; p.vx *= 0.85; p.vz *= 0.85; }
      }
      if (p.spark) p.mesh.scale.multiplyScalar(Math.exp(-physicsDt * 5));
      if (p.debris && p.life < 1) p.mesh.scale.multiplyScalar(Math.exp(-physicsDt * 3));
      if (p.life <= 0) { this.scene.remove(p.mesh); if (p.mesh.isInstancedMesh) p.mesh.dispose(); this.particles.splice(i, 1); }
    }
    this.updateRain(dt);
    this.shake *= Math.exp(-effectsDt * 14);
    this.kick = (this.kick || 0) * Math.exp(-effectsDt * 11);
    this.weapon.visible = (!war || possessed) && !menu && !this.thirdPerson && state.mode !== 'dead';
    if (war && !possessed) {
      this.positionWarCamera();
      this.weaponContact = null;
    } else if (menu) {
      this.positionOverviewCamera();
    } else if (this.thirdPerson) {
      const size = getArenaSize(this.arenaId);
      const pose = thirdPersonCameraPose(player, { angle: player.angle, pitch: this.look.pitch,
        bounds: this.ultraArenaActive ? { x: 179, z: 149 } : { x: size.halfWidth, z: size.halfDepth } });
      if (this.ultraArenaActive) {
        const pitch = Math.max(-1.2, Math.min(1.2, this.look.pitch || 0));
        pose.target.y = Math.max(.5, EYE_HEIGHT + (player.elevation || 0) + Math.tan(pitch) * SWORD_REACH);
      }
      this.camera.position.set(pose.position.x, pose.position.y, pose.position.z);
      this.camera.lookAt(pose.target.x, pose.target.y, pose.target.z);
      this.weaponContact = null;
    } else {
      const bob = state.mode === 'playing' ? Math.sin(time * 12) * inputSpeed * 0.045 : 0;
      const shake = state.mode === 'playing' ? this.shake : 0;
      this.camera.position.set(player.x, EYE_HEIGHT + (player.elevation || 0) + bob + (Math.random() - 0.5) * shake * 0.3, player.z);
      const kick = this.kick || 0, chop = Math.sin(this.kickTilt || 0);
      this.camera.rotation.set(this.look.pitch - kick * chop * 0.035, player.angle + Math.PI + kick * (1 - Math.abs(chop)) * 0.03,
        (Math.random() - 0.5) * shake * 0.04 + kick * (1 - Math.abs(chop)) * 0.03, 'YXZ');
      restQuat.setFromAxisAngle(AXIS_Z, player.blocking ? -0.95 : -0.15);
      restPos.set(0.18, -0.2 - Math.abs(bob) * 0.4, -0.25);
      const blockAge = this.blockedSwing ? Math.max(0, time - this.blockedSwing.time) : 0;
      const progress = this.blockedSwing ? this.blockedSwing.progress * (1 - smooth(0, .16, blockAge)) : (time - this.swingStart) / SWING_TIME;
      const weight = swingPose(progress, this.swingTilt, this.weapon.scale.x) * (this.blockedSwing ? 1 - smooth(.1, .22, blockAge) : 1);
      this.weapon.quaternion.copy(restQuat).slerp(swingQuat, weight);
      this.weapon.position.copy(restPos).lerp(swingPos, weight);
      this.weaponContact = this.constrainViewBlade();
    }
    if (this.positionUltraEntranceCamera(state.ultraEncounter, effectsDt)) {
      this.weapon.visible = false; this.player.visible = true; this.weaponContact = null;
    }
    if (this.ultraArenaActive) {
      if (this.camera.far < 1200) { this.camera.far = 1200; this.camera.updateProjectionMatrix(); }
      if (this.scene.fog) this.scene.fog.density = .0015;
      const encounter = state.ultraEncounter;
      const shake = ['playing', 'paused'].includes(state.mode) && encounter?.shake ? encounter.stage === 'rumble' ? .55 : .24 : 0;
      this.camera.position.x += Math.sin(time * 43) * shake * .45;
      this.camera.position.y += Math.sin(time * 57) * shake;
      this.camera.rotation.z += Math.sin(time * 39) * shake * .008;
    }
    this.updateRainOrigin();
    this.updateMineWalkerLighting();
    this.updateUltraControlRoomLighting(state);
    this.renderer.render(this.scene, this.camera);
  }

  updateMineWalkerLighting() {
    if (!this.scene?.isScene || !this.enemies?.values || !this.camera?.position) return;
    if (!this.mineWalkerLighting) {
      for (const record of this.enemies.values()) {
        if ((record.model.userData.type === 'copper-mine-walker' || record.model.userData.ultra) && record.model.userData.interiorLights?.length) {
          this.mineWalkerLighting = new MineWalkerLighting(this.scene); break;
        }
      }
    }
    this.mineWalkerLighting?.update(this.enemies.values(), this.camera.position);
  }

  updateUltraControlRoomLighting(state) {
    if (!this.scene?.isScene || !this.enemies?.values || !this.camera?.position) return;
    const active = this.ultraArenaActive && (state?.mode === 'playing' || state?.mode === 'paused');
    if (active && !this.ultraControlRoomLighting) this.ultraControlRoomLighting = new UltraControlRoomLighting(this.scene);
    this.ultraControlRoomLighting?.update(this.enemies.values(), this.camera.position, active);
  }

  updateHazards(hazards, time) {
    const active = new Set(hazards.map(hazard => hazard.id));
    for (const [id, record] of this.hazards) if (!active.has(id)) {
      this.scene.remove(record.ring, record.column);
      record.ring.geometry.dispose(); record.ring.material.dispose();
      record.column.geometry.dispose(); record.column.material.dispose();
      this.hazards.delete(id);
    }
    for (const hazard of hazards) {
      let record = this.hazards.get(hazard.id);
      if (!record) {
        const infection = hazard.type === 'infection';
        const color = infection ? 0xff79bc : hazard.type === 'frost' ? 0x75dfff : hazard.type === 'shockwave' ? 0xffb84f : 0xe6b1ff;
        const ring = infection ? this.squareWarning(color) : this.ring(1, color, 0.08);
        const column = new THREE.Mesh(infection ? new THREE.BoxGeometry(1, 1, 1) : new THREE.CylinderGeometry(0.15, 0.32, 9, 5), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: infection ? .2 : .75, depthWrite: false }));
        this.scene.add(ring, column);
        record = { ring, column, infection };
        this.hazards.set(hazard.id, record);
      }
      record.ring.position.set(hazard.x, 0.07, hazard.z);
      record.ring.scale.setScalar(hazard.halfSize ?? hazard.radius);
      record.ring.material.opacity = hazard.delay > 0 ? 0.4 + Math.sin(time * 16) * 0.2 : 0.95;
      if (record.infection) {
        const width = (hazard.halfSize ?? hazard.radius) * 2;
        record.column.position.set(hazard.x, .045, hazard.z);
        record.column.scale.set(width, .025, width);
        record.column.material.opacity = .2 * Math.min(1, hazard.life);
        record.column.visible = hazard.delay <= 0;
      } else {
        record.column.position.set(hazard.x, 4.5, hazard.z);
        record.column.visible = hazard.delay <= 0 && hazard.type === 'lightning';
      }
    }
  }

  dispose() {
    window.removeEventListener('resize', this.resize);
    this.clearProjectileVisuals(true);
    for (let i = (this.effects?.length ?? 0) - 1; i >= 0; i--) this.removeEffect(i);
    for (const record of this.enemies?.values() ?? []) updateUltraHeldRobot(record, null);
    this.ultraArena?.dispose();
    this.mineWalkerLighting?.dispose();
    this.ultraControlRoomLighting?.dispose();
    for (const geometry of this.worldGeometries) geometry.dispose();
    for (const material of this.materials.values()) material.dispose();
    disposeArenaTextures();
    this.warOverlay?.userData.dispose();
    this.renderer.dispose();
  }
}
