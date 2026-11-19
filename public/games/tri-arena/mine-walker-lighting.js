import * as THREE from './assets/three.module.js';
import { ULTRA_MAIN_ROOMS } from './mech-ultra-layout.js';

/** Two reusable, shadowless lamps illuminate the nearest occupied copper interior. */
export class MineWalkerLighting {
  constructor(scene) {
    if (!scene?.add || !scene?.remove) throw new TypeError('Mine Walker lighting requires a Three.js scene.');
    this.scene = scene;
    this.position = new THREE.Vector3();
    this.local = new THREE.Vector3();
    this.disposed = false;
    this.lights = Array.from({ length: 2 }, (_, index) => {
      const light = new THREE.PointLight(0xff2418, 0, 8, 2);
      light.name = `walker-interior-red-light-${index}`;
      light.castShadow = false; light.visible = false;
      scene.add(light); return light;
    });
  }

  update(records, cameraPosition, { hiddenControlOnly = false } = {}) {
    if (this.disposed) return null;
    if (!records?.[Symbol.iterator]) throw new TypeError('Mine Walker lighting requires an iterable of model records.');
    let nearest = null, distance = Infinity;
    if ([cameraPosition?.x, cameraPosition?.y, cameraPosition?.z].every(Number.isFinite)) {
      for (const record of records) {
        const model = record?.model;
        if (!['copper-mine-walker', 'mech-spider-tank-ultra'].includes(model?.userData?.type) || !model.parent || model.visible === false
          || record.voxels?.disposed || record.hp <= 0 || record.enemy?.hp <= 0 || !model.userData.interiorLights?.length) continue;
        model.getWorldPosition(this.position);
        let gap = this.position.distanceToSquared(cameraPosition);
        if (model.userData.ultra) {
          gap = Infinity;
          for (const fixture of model.userData.interiorLights) {
            fixture.getWorldPosition(this.position);
            gap = Math.min(gap, this.position.distanceToSquared(cameraPosition));
          }
        }
        if (gap < distance) { nearest = record; distance = gap; }
      }
    }
    let fixtures = nearest?.model.userData.interiorLights;
    const parts = nearest?.voxels?.partState?.();
    const ultra = nearest?.model.userData.ultra === true;
    let hiddenControl = false;
    if (ultra) {
      const room = ULTRA_MAIN_ROOMS.at(-1);
      nearest.model.worldToLocal(this.local.copy(cameraPosition));
      hiddenControl = hiddenControlOnly || Math.abs(this.local.x - room.x) < room.width / 2 && Math.abs(this.local.z - room.z) < room.depth / 2
        && this.local.y >= room.floorY && this.local.y < room.roofY;
      if (hiddenControl) {
        // Shadowless lamps from the deck below must not flood the hidden room.
        fixtures = fixtures.filter(fixture => fixture.userData.hiddenControl || fixture.userData.structuralId === `${room.id}-lamp`);
      }
    }
    if (ultra) fixtures = fixtures.filter(fixture => fixture.parent && parts?.[fixture.uuid]?.remaining !== 0)
      .map(fixture => ({ fixture, distance: fixture.getWorldPosition(new THREE.Vector3()).distanceToSquared(cameraPosition) }))
      .sort((a, b) => a.distance - b.distance).map(entry => entry.fixture);
    if (hiddenControl) {
      const lamp = fixtures.find(fixture => fixture.userData.structuralId === 'ultra-bridge-lamp');
      const screen = fixtures.find(fixture => fixture !== lamp);
      // Keep both the faint red room light and the nearest surviving computer glow.
      fixtures = lamp ? [lamp, screen] : fixtures.slice(0, 2);
    }
    for (let index = 0; index < this.lights.length; index++) {
      const light = this.lights[index], fixture = fixtures?.[index];
      if (!fixture?.parent || parts?.[fixture.uuid]?.remaining === 0) {
        light.intensity = 0; light.visible = false; continue;
      }
      // Source meshes become hidden when voxelized, so occupancy—not mesh.visible—gates a lamp.
      fixture.getWorldPosition(this.position);
      this.local.copy(fixture.position);
      if (ultra) { this.local.y -= .4; this.local.z -= .8; }
      else this.local.x -= (Math.sign(this.local.x) || (index ? 1 : -1)) * .35;
      fixture.parent.localToWorld(this.local);
      const config = fixture.userData;
      light.position.copy(this.local);
      light.intensity = Number.isFinite(config.lightIntensity) ? Math.max(0, Math.min(150, config.lightIntensity)) : ultra ? 150 : 80;
      light.distance = Number.isFinite(config.lightDistance) ? Math.max(.1, Math.min(20, config.lightDistance)) : ultra ? 20 : 8;
      light.color.setHex(Number.isInteger(config.lightColor) ? config.lightColor : 0xff2418);
      light.visible = light.intensity > 0;
    }
    return nearest;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const light of this.lights) {
      light.intensity = 0; light.visible = false; this.scene.remove(light); light.dispose();
    }
  }
}
