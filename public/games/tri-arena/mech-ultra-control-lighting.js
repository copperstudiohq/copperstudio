import * as THREE from './assets/three.module.js';
import { ULTRA_MAIN_ROOMS } from './mech-ultra-layout.js';

const CONTROL_ROOM = ULTRA_MAIN_ROOMS.find(room => room.hiddenControl);
const EXTERIOR_LIGHTS = Object.freeze([
  { name: 'arena-hemisphere', factor: .04 },
  { name: 'arena-sun', factor: .015 },
]);

/** Approximate the sealed room's missing ambient occlusion without adding shadow lights. */
export class UltraControlRoomLighting {
  constructor(scene) {
    if (!scene?.isScene) throw new TypeError('Ultra control lighting requires a Three.js scene.');
    this.scene = scene;
    this.local = new THREE.Vector3();
    this.saved = [];
    this.active = false;
    this.disposed = false;
  }

  update(records, cameraPosition, enabled = true) {
    if (this.disposed) return null;
    let occupied = null;
    if (enabled && records?.[Symbol.iterator] && Number.isFinite(cameraPosition?.x)
      && Number.isFinite(cameraPosition?.y) && Number.isFinite(cameraPosition?.z)) {
      for (const record of records) {
        const model = record?.model;
        if (!model?.userData.ultra || !model.parent || !model.visible || record.hp <= 0
          || record.enemy?.hp <= 0 || record.voxels?.disposed) continue;
        const frame = model.userData.body || model;
        frame.worldToLocal(this.local.copy(cameraPosition));
        if (Math.abs(this.local.x - CONTROL_ROOM.x) < CONTROL_ROOM.width / 2
          && Math.abs(this.local.z - CONTROL_ROOM.z) < CONTROL_ROOM.depth / 2
          && this.local.y >= CONTROL_ROOM.floorY && this.local.y < CONTROL_ROOM.roofY) {
          occupied = record; break;
        }
      }
    }
    if (!occupied) { this.reset(); return null; }
    if (!this.active) {
      for (const config of EXTERIOR_LIGHTS) {
        const light = this.scene.getObjectByName(config.name);
        if (light?.isLight && Number.isFinite(light.intensity)) {
          this.saved.push({ light, intensity: light.intensity, factor: config.factor });
        }
      }
      this.active = true;
    }
    for (const entry of this.saved) entry.light.intensity = entry.intensity * entry.factor;
    return occupied;
  }

  reset() {
    for (const entry of this.saved) entry.light.intensity = entry.intensity;
    this.saved.length = 0;
    this.active = false;
  }

  dispose() {
    if (this.disposed) return;
    this.reset(); this.disposed = true;
  }
}
