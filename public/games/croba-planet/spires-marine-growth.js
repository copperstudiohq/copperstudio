import * as THREE from './vendor/three.module.js';
import { PREPARED_SPIRES_MARINE_GROWTH } from './prepared-spires-marine-growth-data.js';
import { createCrobonMossCushionGeometry,
  createSpiresMarinePlantGeometry, createSpiresGrowthMaterial } from './spires-growth-anatomy.js';
import { createBarnacleGeometry, createBarnacleMaterial } from './cave-barnacle-renderer.js';
import { updateInstancedWindBounds } from './render-visibility.js';

const UP = new THREE.Vector3(0, 1, 0);
export const SPIRES_GROWTH_LIMITS = Object.freeze({
  desktop: Object.freeze({ moss: 360, plant: 190, barnacle: 88 }),
  mobile: Object.freeze({ moss: 220, plant: 110, barnacle: 56 }),
});

/** Three nearby pooled draws for a fixed prepared world. All matrices and normal
 * transforms are cached once; only count-limited selection changes while moving.
 * Anchors use simulation axes; their surface normals use renderer XYZ axes.
 */
export class SpiresMarineGrowthRenderer {
  constructor({ materials, decorateMaterial, mobile = false } = {}) {
    this.group = new THREE.Group(); this.group.name = 'spires-fixed-marine-gardens';
    this.time = { value: 0 }; this.mobile = Boolean(mobile); this.disposed = false;
    this.batches = {}; this.placements = {}; this.candidates = {};
    this.lastCamera = new THREE.Vector3(Infinity, Infinity, Infinity);
    this.lastRange = null; this.lastMobile = null; this.bounds = new THREE.Box3();
    const geometries = { moss: createCrobonMossCushionGeometry(),
      plant: createSpiresMarinePlantGeometry(),
      barnacle: createBarnacleGeometry() };
    for (const [kind, geometry] of Object.entries(geometries)) {
      const material = kind === 'barnacle' ? createBarnacleMaterial(materials, this.time)
        : createSpiresGrowthMaterial(kind, this.time);
      decorateMaterial?.(material);
      const mesh = new THREE.InstancedMesh(geometry, material, SPIRES_GROWTH_LIMITS.desktop[kind]);
      mesh.name = `spires-shared-${kind}-batch`; mesh.count = 0;
      mesh.castShadow = false; mesh.receiveShadow = true;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.group.add(mesh);
      this.batches[kind] = mesh;
    }
    const pose = new THREE.Object3D(), spin = new THREE.Quaternion(), normal = new THREE.Vector3();
    for (const kind of ['moss', 'plant', 'barnacle']) {
      this.candidates[kind] = [];
      this.placements[kind] = PREPARED_SPIRES_MARINE_GROWTH.filter(site => site.kind === kind).map((site, index) => {
        normal.fromArray(site.normal);
        pose.position.set(site.x / 25, site.z / 25, site.y / 25).addScaledVector(normal, kind === 'barnacle' ? -.015 : -.012);
        pose.quaternion.setFromUnitVectors(UP, normal).multiply(spin.setFromAxisAngle(UP, site.angle));
        pose.scale.fromArray(site.scale); pose.updateMatrix();
        const sphere = this.batches[kind].geometry.boundingSphere.clone().applyMatrix4(pose.matrix);
        sphere.radius += .09 * Math.max(...site.scale);
        this.bounds.expandByPoint(sphere.center.clone().addScalar(sphere.radius));
        this.bounds.expandByPoint(sphere.center.clone().addScalar(-sphere.radius));
        return { site, index, matrix: pose.matrix.clone(), sphere, distance: Infinity };
      });
    }
    this.sphere = this.bounds.getBoundingSphere(new THREE.Sphere());
    this.visibleSites = []; this.group.visible = false;
    this.group.userData = { prepared: true, surfaceBatches: 3, placements: PREPARED_SPIRES_MARINE_GROWTH.length };
  }

  /** Camera is THREE XYZ in render metres; range is also metres. */
  update(camera, range = 100, time = 0, reducedMotion = false, { mobile = this.mobile } = {}) {
    if (this.disposed) return;
    this.time.value = reducedMotion || !Number.isFinite(time) ? 0 : time;
    const eye = camera?.position ?? camera;
    if (!eye || ![eye.x, eye.y, eye.z].every(Number.isFinite)) {
      this.hide(); this.lastCamera.set(Infinity, Infinity, Infinity); return;
    }
    const distance = Number.isFinite(range) && range > 0 ? Math.min(range, 100) : 100;
    const isMobile = Boolean(mobile);
    if (this.lastCamera.distanceToSquared(eye) < .16 && this.lastRange === distance && this.lastMobile === isMobile) return;
    this.lastCamera.copy(eye); this.lastRange = distance; this.lastMobile = isMobile;
    if (this.sphere.center.distanceToSquared(eye) > (distance + this.sphere.radius) ** 2) { this.hide(); return; }
    const limits = SPIRES_GROWTH_LIMITS[isMobile ? 'mobile' : 'desktop'];
    this.visibleSites.length = 0;
    for (const kind of ['moss', 'plant', 'barnacle']) {
      const candidates = this.candidates[kind]; candidates.length = 0;
      // Barnacle filter arms need only nearby coverage.
      const kindRange = Math.min(distance, kind === 'barnacle' ? 32 : 68);
      for (const placement of this.placements[kind]) {
        placement.distance = placement.sphere.center.distanceToSquared(eye);
        if (placement.distance <= (kindRange + placement.sphere.radius) ** 2) candidates.push(placement);
      }
      candidates.sort((a, b) => a.distance - b.distance || a.index - b.index);
      candidates.length = Math.min(candidates.length, limits[kind]);
      const mesh = this.batches[kind];
      mesh.count = candidates.length; mesh.visible = mesh.count > 0;
      for (const [index, placement] of candidates.entries()) {
        mesh.setMatrixAt(index, placement.matrix);
        this.visibleSites.push(placement.site);
      }
      if (mesh.count) {
        mesh.instanceMatrix.needsUpdate = true;
        updateInstancedWindBounds(mesh, kind === 'plant' ? .045 : .028, kind === 'plant' ? .035 : .02);
      }
    }
    this.group.visible = this.visibleSites.length > 0;
  }

  hide() {
    this.group.visible = false; this.visibleSites.length = 0;
    for (const mesh of Object.values(this.batches)) { mesh.count = 0; mesh.visible = false; }
  }

  /** Geometry/materials are private; borrowed library maps remain untouched. */
  dispose() {
    if (this.disposed) return; this.disposed = true;
    for (const mesh of Object.values(this.batches)) { mesh.dispose(); mesh.geometry.dispose(); mesh.material.dispose(); }
    this.group.removeFromParent(); this.group.clear(); this.visibleSites.length = 0;
  }
}
