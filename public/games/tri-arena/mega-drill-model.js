import * as THREE from './assets/three.module.js';
import { createCopperMegaDrill, animateCopperMegaDrill } from './copper-mega-drill.js';
import { MEGA_DRILL_LAYOUT as LAYOUT } from './mega-drill-layout.js';

/** Expand preview batches into physical source parts before voxelization, preserving every transform. */
export function createCuttableMegaDrill() {
  const root = createCopperMegaDrill(), batches = [];
  // Preview operators represent independent game actors, with their own normal voxel bodies.
  for (const room of root.userData.rooms) {
    for (const crew of room.userData.crew || []) {
      crew.userData.disposeVisuals?.(); crew.removeFromParent();
    }
    room.userData.crew = [];
  }
  const rigidFrames = new Set([...root.userData.segments, root.userData.drillGroup,
    ...root.userData.reactors, ...root.userData.drones,
    ...root.userData.manufacturingArms.flatMap(arm => [arm.userData.shoulder, arm.userData.elbow])]);
  root.traverse(part => { if (part.isInstancedMesh) batches.push(part); });
  const instance = new THREE.Matrix4(), posed = new THREE.Matrix4();
  for (const batch of batches) {
    batch.updateMatrix();
    for (let index = 0; index < batch.count; index++) {
      batch.getMatrixAt(index, instance); posed.multiplyMatrices(batch.matrix, instance);
      const part = new THREE.Mesh(batch.geometry, batch.material);
      part.name = `${batch.name}-${index}`; part.applyMatrix4(posed);
      part.castShadow = part.receiveShadow = true;
      part.userData = { ...batch.userData }; batch.parent.add(part);
    }
    batch.removeFromParent(); batch.dispose();
  }
  root.traverse(part => {
    if (!part.isMesh || !part.userData.severable) return;
    const names = []; let ancestor = part;
    while (ancestor && ancestor !== root) { names.push(ancestor.name); ancestor = ancestor.parent; }
    const roomIndex = LAYOUT.rooms.findIndex(room => names.includes(room.id));
    let rigidFrame = part.parent;
    while (rigidFrame && !rigidFrames.has(rigidFrame)) rigidFrame = rigidFrame.parent;
    Object.assign(part.userData, { anatomicalPart: 'body', critical: false, bossMain: roomIndex < 0, cutHits: 5,
      voxelRigidGroup: (rigidFrame || part).uuid, voxelTransparent: part.material.transparent === true });
    // Solid copper fittings win any shared raster cells at the edge of a pane.
    if (part.userData.voxelTransparent) part.userData.detailPriority = -1;
    if (names.includes('rotating-massive-stepped-drill')) {
      Object.assign(part.userData, { weaponId: 'mega-drill', anatomicalPart: 'arm', bossMain: false });
    } else if (part.userData.reactorCube) {
      const index = root.userData.reactors.findIndex(core => core.userData.cube === part);
      Object.assign(part.userData, { structuralId: LAYOUT.reactorIds[index], detailPriority: 25, bossMain: false });
    } else if (names.some(name => name.startsWith('fabricator-arm-'))) {
      Object.assign(part.userData, { structuralId: roomIndex < 2 ? LAYOUT.fabricatorIds[roomIndex] : LAYOUT.droneFactoryId,
        anatomicalPart: 'arm', bossMain: false });
    } else {
      let id;
      const role = part.userData.hullRole;
      if (role && role !== 'frame') id = role === 'ramp' ? LAYOUT.ramp.id : `mega-${role}`;
      else if (names.includes('mega-drill-entry-ramp')) id = LAYOUT.ramp.id;
      else if (part.name.startsWith('armored-grated-floor-')) id = 'mega-floor';
      else if (names.includes('near-side-removable-armor')) id = 'mega-near-wall';
      else if (names.includes('far-side-armor')) id = 'mega-far-wall';
      else if (names.includes('removable-armored-roof')) id = 'mega-roof';
      else if (names.includes('removable-front-cabin-panels')) id = 'mega-front-wall';
      else if (part.name.startsWith('rear-entry-')) id = 'mega-rear-wall';
      else if (part.name.startsWith('connected-room-doorway-')) {
        const index = [-10.5, -4.5, 1.5].findIndex(z => Math.abs(part.position.z - z) < .5);
        if (index >= 0) id = `mega-partition-${index}`;
      }
      if (id) part.userData.structuralId = id;
    }
  });
  Object.assign(root.userData, { previewOnly: false, boss: true, megaDrill: true, structuralFatalExempt: true,
    cutHits: 5, voxelSize: .09, voxelBudget: 768000, rigidSurfaceCulling: true });
  return root;
}

export function animateCuttableMegaDrill(root, time, speed = 0, phase = 'chase', motion = {}) {
  animateCopperMegaDrill(root, time, { wormDistance: motion.wormDistance ?? 0 });
}
