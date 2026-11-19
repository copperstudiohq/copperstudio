import * as THREE from './assets/three.module.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const SURFACE = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0.12 });
const GLASS_SURFACE = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .12, metalness: .05,
  transparent: true, opacity: .16, depthWrite: false });
const GHOST_SURFACE = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x32154a, emissiveIntensity: 0.5, transparent: true, opacity: 0.46, roughness: 0.8, depthWrite: false });
const NEIGHBORS = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const keyOf = (x, y, z) => `${x},${y},${z}`;
const temp = new THREE.Object3D();
const VOXEL_FILL = 0.995;
const AXES = ['x', 'y', 'z'];
export const VOXEL_DETAIL = Object.freeze({ creature: 0.075, boss: 0.12, maxVoxels: 32000 });

/** Both segment endpoints and the voxel center are in the part's rest coordinates. */
function segmentCrossesVoxel(origin, target, center, halfSize) {
  let near = 0, far = 1;
  for (const axis of AXES) {
    const delta = target[axis] - origin[axis];
    const low = center[axis] - halfSize, high = center[axis] + halfSize;
    if (Math.abs(delta) < 1e-10) {
      if (origin[axis] < low || origin[axis] > high) return false;
      continue;
    }
    const a = (low - origin[axis]) / delta, b = (high - origin[axis]) / delta;
    near = Math.max(near, Math.min(a, b));
    far = Math.min(far, Math.max(a, b));
    if (near > far) return false;
  }
  return near < 1 - 1e-7;
}

/** Voxel occupancy, skeletal poses and cut connectivity, independent of WebGL. */
export class VoxelBody {
  constructor(model, { voxelSize = model.userData.voxelSize ?? (model.userData.boss ? VOXEL_DETAIL.boss : VOXEL_DETAIL.creature),
    maxVoxels = model.userData.voxelBudget ?? VOXEL_DETAIL.maxVoxels } = {}) {
    if (!(voxelSize > 0) || !Number.isFinite(voxelSize)) throw new RangeError('Voxel size must be positive and finite.');
    if (!Number.isSafeInteger(maxVoxels) || maxVoxels < 1 || maxVoxels > 1000000) throw new RangeError('Voxel budget must be an integer from 1 to 1000000.');
    this.model = model;
    this.ghost = model.userData.type === 'trilom-wraith' || model.userData.spirit === true;
    this.size = voxelSize;
    this.cells = new Map();
    this.parts = new Map();
    this.bridges = [];
    this.severed = new Set();
    this.rootInverse = new THREE.Matrix4();
    this.changed = true;
    this.renderedCells = [];
    this.renderedTransparentCells = [];
    this.transparentMesh = null;
    this.stateRevision = 0;
    this.stateSnapshots = new Map();
    model.updateMatrixWorld(true);
    this.rootInverse.copy(model.matrixWorld).invert();
    const originals = [];
    model.traverse(mesh => { if (mesh.isMesh && mesh.userData.severable) originals.push(mesh); });
    originals.sort((a, b) => (a.userData.detailPriority || 0) - (b.userData.detailPriority || 0));
    if (!originals.length) throw new TypeError('A voxel body needs severable box geometry.');
    for (let attempt = 0; attempt < 8; attempt++) {
      this.cells.clear();
      this.parts.clear();
      for (const mesh of originals) this.rasterize(mesh);
      if (this.cells.size <= maxVoxels) break;
      this.size *= 1.25;
    }
    if (this.cells.size > maxVoxels) throw new RangeError('Creature voxel budget exceeded.');
    this.originalCount = this.cells.size;
    this.criticalCount = [...this.cells.values()].filter(cell => cell.critical).length;
    this.mainBodyCount = [...this.cells.values()].filter(cell => cell.bossMain).length;
    this.buildTopology();
    this.buildAnatomy();
    this.connectRig();
    const transparentCount = this.cellList.reduce((count, cell) => count + Number(cell.transparent), 0);
    this.mesh = new THREE.InstancedMesh(BOX, this.ghost ? GHOST_SURFACE : SURFACE, this.originalCount - transparentCount);
    this.mesh.name = 'cuttable-voxel-surface';
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    this.transparentRenderParts = [];
    this.transparentRenderPositions = new Float64Array(transparentCount * 3);
    if (transparentCount) {
      this.transparentMesh = new THREE.InstancedMesh(BOX, GLASS_SURFACE, transparentCount);
      this.transparentMesh.name = 'cuttable-transparent-voxel-surface';
      this.transparentMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.transparentMesh.castShadow = this.transparentMesh.receiveShadow = false;
      this.transparentMesh.frustumCulled = false;
      model.add(this.transparentMesh);
    }
    for (const mesh of originals) mesh.visible = false;
    model.add(this.mesh);
    this.syncPose();
  }

  rasterize(mesh) {
    mesh.geometry.computeBoundingBox();
    const matrix = new THREE.Matrix4().multiplyMatrices(this.rootInverse, mesh.matrixWorld);
    const inverse = matrix.clone().invert();
    const bounds = mesh.geometry.boundingBox;
    const area = bounds.clone().applyMatrix4(matrix);
    const priority = mesh.userData.detailPriority || 0;
    const cutHits = mesh.userData.cutHits ?? 1;
    if (!Number.isSafeInteger(cutHits) || cutHits < 1) throw new TypeError(`Cut hits for ${mesh.name || 'voxel part'} must be a positive integer.`);
    const color = mesh.material.color.clone();
    if (this.model.userData.spirit) color.lerp(new THREE.Color(0xbb7be4), 0.75);
    if (mesh.material.emissive?.getHex() > 0 && mesh.material.emissiveIntensity > 0) color.lerp(new THREE.Color(0xffffff), 0.12);
    const part = { owner: mesh, restInverse: matrix.clone().invert(), delta: new THREE.Matrix4(), basis: new Float32Array(16), count: 0,
      cells: [], poseDirty: true, poseInitialized: false,
      rigidGroup: this.model.userData.rigidSurfaceCulling === true && typeof mesh.userData.voxelRigidGroup === 'string'
        ? mesh.userData.voxelRigidGroup : mesh.uuid,
      name: mesh.name, anatomy: mesh.userData.anatomicalPart || 'body' };
    this.parts.set(mesh.uuid, part);
    const add = (ix, iy, iz, at) => {
      const key = (part.gridPrefix || '') + keyOf(ix, iy, iz);
      const existing = this.cells.get(key);
      if (existing && existing.priority > priority) return;
      const position = at || new THREE.Vector3(ix * this.size, iy * this.size, iz * this.size);
      const cell = { key, ix, iy, iz, position, part: mesh.uuid, partRef: part, index: -1, priority, feature: mesh.userData.feature,
        color, anatomy: part.anatomy, critical: Boolean(mesh.userData.critical) || part.anatomy === 'eye',
        core: part.anatomy === 'core', cutHits, remainingHits: cutHits, active: true, repairable: false,
        weaponId: mesh.userData.weaponId, structuralId: mesh.userData.structuralId, balanceId: mesh.userData.balanceId, bossMain: mesh.userData.bossMain === true,
        renderHidden: mesh.userData.renderHidden === true };
      cell.transparent = mesh.userData.voxelTransparent === true;
      if (part.gridRestFrame) cell.restPosition = position.clone().applyMatrix4(part.gridRestFrame);
      this.cells.set(key, cell);
      part.count++;
    };
    if (this.model.userData.type === 'copper-tron-1000' && mesh.userData.localVoxelGrid === true) {
      // Tile the complete source cuboid in its own axes. Small per-axis scales
      // preserve exact outer faces while retaining the shared metre-grid OBB API.
      const dimensions = bounds.getSize(new THREE.Vector3());
      const counts = dimensions.clone().multiply(new THREE.Vector3().setFromMatrixScale(matrix)).divideScalar(this.size).ceil();
      counts.max(new THREE.Vector3(1, 1, 1));
      const span = counts.clone().multiplyScalar(this.size);
      const center = bounds.getCenter(new THREE.Vector3());
      part.gridRestFrame = matrix.clone().multiply(new THREE.Matrix4().makeTranslation(center.x, center.y, center.z)).scale(dimensions.divide(span));
      part.gridPrefix = `${mesh.uuid}:`;
      for (let ix = 0; ix < counts.x; ix++) for (let iy = 0; iy < counts.y; iy++) for (let iz = 0; iz < counts.z; iz++) {
        add(ix, iy, iz, new THREE.Vector3((ix + .5) * this.size - span.x / 2,
          (iy + .5) * this.size - span.y / 2, (iz + .5) * this.size - span.z / 2));
      }
      return;
    }
    // Conservatively sample the whole footprint of tiny facial layers, rather than
    // replacing an iris or pupil with one oversized fallback highlight.
    const detail = mesh.userData.surfaceDetail === true;
    const sampleBounds = bounds.clone();
    if (detail) {
      const e = inverse.elements, half = this.size * 0.49;
      const fineMark = mesh.userData.feature === 'pupil' || mesh.userData.feature === 'glint';
      sampleBounds.expandByVector(new THREE.Vector3(
        fineMark ? 0 : (Math.abs(e[0]) + Math.abs(e[4]) + Math.abs(e[8])) * half,
        fineMark ? 0 : (Math.abs(e[1]) + Math.abs(e[5]) + Math.abs(e[9])) * half,
        (Math.abs(e[2]) + Math.abs(e[6]) + Math.abs(e[10])) * half));
      area.expandByScalar(half);
    }
    const local = new THREE.Vector3();
    let count = 0;
    for (let ix = Math.ceil(area.min.x / this.size); ix <= Math.floor(area.max.x / this.size); ix++) {
      for (let iy = Math.ceil(area.min.y / this.size); iy <= Math.floor(area.max.y / this.size); iy++) {
        for (let iz = Math.ceil(area.min.z / this.size); iz <= Math.floor(area.max.z / this.size); iz++) {
          local.set(ix * this.size, iy * this.size, iz * this.size).applyMatrix4(inverse);
          if (sampleBounds.containsPoint(local)) { add(ix, iy, iz); count++; }
        }
      }
    }
    // Thin eyes and armour details remain represented on the common voxel grid.
    if (!count) {
      const center = bounds.getCenter(new THREE.Vector3()).applyMatrix4(matrix);
      add(Math.round(center.x / this.size), Math.round(center.y / this.size), Math.round(center.z / this.size));
    }
  }

  buildTopology() {
    this.cellList = [...this.cells.values()];
    this.durableCells = this.cellList.filter(cell => cell.cutHits > 1);
    const IndexArray = this.cellList.length < 65535 ? Uint16Array : Uint32Array;
    this.missingNeighbor = IndexArray === Uint16Array ? 65535 : 4294967295;
    this.neighborIndices = new IndexArray(this.cellList.length * 6).fill(this.missingNeighbor);
    this.visitMarks = new Uint32Array(this.cellList.length);
    this.visitGeneration = 0;
    this.traversalQueue = new IndexArray(this.cellList.length);
    this.renderPositions = new Float64Array(this.cellList.length * 3);
    this.renderParts = [];
    this.bridgeLinks = new Map();
    this.poseCandidate = new THREE.Matrix4();
    this.cutPoint = new THREE.Vector3();
    for (const [index, cell] of this.cellList.entries()) {
      cell.index = index;
      cell.partRef.cells.push(cell);
    }
    this.partGroups = new Map([...this.parts].map(([id, part]) => [id, part.cells]));
    this.weaponGroups = new Map();
    this.structureGroups = new Map();
    this.balanceGroups = new Map();
    for (const cell of this.cellList) for (const [id, groups] of [[cell.weaponId, this.weaponGroups], [cell.structuralId, this.structureGroups], [cell.balanceId, this.balanceGroups]]) {
      if (!id) continue;
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(cell);
    }
    for (const cell of this.cellList) for (let direction = 0; direction < 6; direction++) {
      const [x, y, z] = NEIGHBORS[direction];
      const neighbor = this.cells.get((cell.partRef.gridPrefix || '') + keyOf(cell.ix + x, cell.iy + y, cell.iz + z));
      if (neighbor) this.neighborIndices[cell.index * 6 + direction] = neighbor.index;
    }
  }

  buildAnatomy() {
    const data = this.model.userData, body = data.body || this.model;
    const excluded = new Set([data.head, data.eye, ...(data.eyes || []), ...(data.limbs || []), ...(data.legs || []),
      ...(data.arms || []), data.leftArm, data.rightArm, data.leftLeg, data.rightLeg, data.sword, data.shield,
      data.gun, ...(data.fabricators || [])].filter(Boolean));
    for (const part of this.parts.values()) {
      let owner = part.owner, central = ['body', 'core'].includes(part.anatomy);
      while (central && owner && owner !== body) {
        if (excluded.has(owner)) central = false;
        owner = owner.parent;
      }
      central &&= owner === body && !excluded.has(body);
      for (const cell of part.cells) cell.centralBody = central && !cell.weaponId && !cell.balanceId && !cell.structuralId && !cell.renderHidden;
    }
    this.bodyCount = this.cellList.filter(cell => cell.centralBody).length;
    this.structuralFatalExempt = data.structuralFatalExempt === true || data.type === 'copper-tron-1000' || data.type === 'copper-fortress';
  }

  components() {
    this.visitGeneration = (this.visitGeneration + 1) >>> 0;
    if (this.visitGeneration === 0) { this.visitMarks.fill(0); this.visitGeneration = 1; }
    const marks = this.visitMarks, generation = this.visitGeneration, queue = this.traversalQueue;
    const result = [];
    for (const first of this.cellList) {
      if (!first.active || marks[first.index] === generation) continue;
      let size = 1;
      queue[0] = first.index; marks[first.index] = generation;
      const component = [];
      for (let cursor = 0; cursor < size; cursor++) {
        const index = queue[cursor], cell = this.cellList[index];
        component.push(cell);
        for (let direction = 0; direction < 6; direction++) {
          const neighbor = this.neighborIndices[index * 6 + direction];
          if (neighbor === this.missingNeighbor || marks[neighbor] === generation || !this.cellList[neighbor].active) continue;
          marks[neighbor] = generation; queue[size++] = neighbor;
        }
        const extra = this.bridgeLinks.get(index);
        if (extra) for (const { bridge, neighbor } of extra) {
          if (!bridge.intact || marks[neighbor] === generation || !this.cellList[neighbor].active) continue;
          marks[neighbor] = generation; queue[size++] = neighbor;
        }
      }
      result.push(component);
    }
    return result;
  }

  connectRig() {
    // Connect intentional gaps between the original rig's joints. These structural
    // links can themselves be sliced; they never make an already-cut limb reconnect.
    if (this.model.userData.type === 'copper-tron-1000' || this.model.userData.explicitRigParents === true) {
      // Local shaft grids cannot infer their assembly from overlapping grid keys.
      // Close declared physical joints first, before any heuristic island links.
      for (const part of this.parts.values()) {
        const parentId = part.owner.userData.rigParent;
        if (parentId === undefined) continue;
        const parent = this.parts.get(parentId);
        if (!parent || parent === part || !parent.cells.length || !part.cells.length) {
          throw new TypeError(`Invalid rig parent for ${part.name || 'voxel part'}.`);
        }
        let bestA, bestB, best = Infinity;
        for (const a of part.cells) for (const b of parent.cells) {
          const distance = (a.restPosition || a.position).distanceToSquared(b.restPosition || b.position);
          if (distance < best) { best = distance; bestA = a; bestB = b; }
        }
        this.addRigBridge(bestA, bestB);
      }
    }
    const islands = this.components().sort((a,b) => b.length-a.length);
    const connected = islands.shift() || [];
    for (const island of islands) {
      let bestA, bestB, best = Infinity;
      const stepA = Math.max(1, Math.floor(connected.length / 240));
      const stepB = Math.max(1, Math.floor(island.length / 90));
      for (let i = 0; i < connected.length; i += stepA) for (let j = 0; j < island.length; j += stepB) {
        const distance = (connected[i].restPosition || connected[i].position).distanceToSquared(island[j].restPosition || island[j].position);
        if (distance < best) { best = distance; bestA = connected[i]; bestB = island[j]; }
      }
      if (bestA) this.addRigBridge(bestA, bestB);
      connected.push(...island);
    }
  }

  addRigBridge(a, b) {
    const bridge = { a: a.key, b: b.key, intact: true, aCell: a, bCell: b };
    this.bridges.push(bridge);
    for (const [cell, neighbor] of [[a, b], [b, a]]) {
      if (!this.bridgeLinks.has(cell.index)) this.bridgeLinks.set(cell.index, []);
      this.bridgeLinks.get(cell.index).push({ bridge, neighbor: neighbor.index });
    }
  }

  updateParts() {
    this.model.updateMatrixWorld(true);
    this.rootInverse.copy(this.model.matrixWorld).invert();
    let dirty = false;
    for (const part of this.parts.values()) {
      if (part.poseDirty) dirty = true;
      this.poseCandidate.multiplyMatrices(this.rootInverse, part.owner.matrixWorld).multiply(part.restInverse);
      if (part.gridRestFrame) this.poseCandidate.multiply(part.gridRestFrame);
      const current = part.delta.elements, next = this.poseCandidate.elements;
      // Root movement cancels algebraically; ignore its sub-pixel roundoff only.
      let changed = !part.poseInitialized;
      for (let index = 0; index < 16 && !changed; index++) changed = Math.abs(current[index] - next[index]) > 1e-10;
      if (!changed) continue;
      part.delta.copy(this.poseCandidate); part.poseDirty = true; part.poseInitialized = true;
      dirty = true;
      part.basis.set(next);
      for (let index = 0; index < 12; index++) part.basis[index] *= this.size * VOXEL_FILL;
    }
    return dirty;
  }

  posedPosition(cell, world = false) {
    const point = cell.position.clone().applyMatrix4(cell.partRef.delta);
    return world ? point.applyMatrix4(this.model.matrixWorld) : point;
  }

  syncPose() {
    const posed = this.updateParts();
    if (!this.changed && !posed) return false;
    if (this.changed) {
      this.stateRevision++;
      this.renderedCells = [];
      this.renderedTransparentCells = [];
      for (const cell of this.cellList) {
        if (!cell.active || cell.renderHidden) continue;
        let visible = false;
        for (let direction = 0; direction < 6; direction++) {
          const index = this.neighborIndices[cell.index * 6 + direction];
          if (index === this.missingNeighbor || !this.cellList[index].active
            || this.cellList[index].transparent !== cell.transparent
            || this.cellList[index].partRef.rigidGroup !== cell.partRef.rigidGroup) { visible = true; break; }
        }
        if (visible) (cell.transparent ? this.renderedTransparentCells : this.renderedCells).push(cell);
      }
      for (const [cells, parts, positions] of [[this.renderedCells, this.renderParts, this.renderPositions],
        [this.renderedTransparentCells, this.transparentRenderParts, this.transparentRenderPositions]]) {
        parts.length = cells.length;
        for (let index = 0; index < cells.length; index++) {
          const cell = cells[index], offset = index * 3;
          parts[index] = cell.partRef;
          positions[offset] = cell.position.x; positions[offset + 1] = cell.position.y; positions[offset + 2] = cell.position.z;
        }
      }
    }
    this.syncSurface(this.mesh, this.renderedCells, this.renderParts, this.renderPositions);
    if (this.transparentMesh) this.syncSurface(this.transparentMesh, this.renderedTransparentCells,
      this.transparentRenderParts, this.transparentRenderPositions);
    this.changed = false;
    for (const part of this.parts.values()) part.poseDirty = false;
    return true;
  }

  /** Preserve each batch's public instance-to-cell mapping through cuts and poses. */
  syncSurface(mesh, cells, parts, positions) {
    let index = 0;
    const transforms = mesh.instanceMatrix.array;
    for (; index < cells.length; index++) {
      const part = parts[index], e = part.delta.elements, basis = part.basis, offset = index * 16, position = index * 3;
      const x = positions[position], y = positions[position + 1], z = positions[position + 2];
      transforms[offset] = basis[0]; transforms[offset + 1] = basis[1]; transforms[offset + 2] = basis[2]; transforms[offset + 3] = basis[3];
      transforms[offset + 4] = basis[4]; transforms[offset + 5] = basis[5]; transforms[offset + 6] = basis[6]; transforms[offset + 7] = basis[7];
      transforms[offset + 8] = basis[8]; transforms[offset + 9] = basis[9]; transforms[offset + 10] = basis[10]; transforms[offset + 11] = basis[11];
      transforms[offset + 15] = basis[15];
      transforms[offset + 12] = e[0]*x + e[4]*y + e[8]*z + e[12];
      transforms[offset + 13] = e[1]*x + e[5]*y + e[9]*z + e[13];
      transforms[offset + 14] = e[2]*x + e[6]*y + e[10]*z + e[14];
      if (this.changed) mesh.setColorAt(index, cells[index].color);
    }
    mesh.count = index;
    mesh.instanceMatrix.clearUpdateRanges();
    mesh.instanceMatrix.addUpdateRange(0, index * 16);
    mesh.instanceMatrix.needsUpdate = true;
    if (this.changed && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  snapshot(cells) {
    const scale = this.model.getWorldScale(new THREE.Vector3());
    const size = this.size * Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
    const frames = new Map();
    return cells.map(cell => {
      const result = { position: this.posedPosition(cell, true), color: cell.color.clone(), size, ghost: this.ghost,
        ...(cell.transparent ? { transparent: true } : {}) };
      if (cell.partRef.gridRestFrame) {
        let frame = frames.get(cell.partRef);
        if (!frame) {
          const world = new THREE.Matrix4().multiplyMatrices(this.model.matrixWorld, cell.partRef.delta);
          frame = { quaternion: new THREE.Quaternion(), scale: new THREE.Vector3() };
          world.decompose(new THREE.Vector3(), frame.quaternion, frame.scale);
          frame.scale.multiplyScalar(this.size);
          frames.set(cell.partRef, frame);
        }
        result.quaternion = frame.quaternion.clone(); result.scale = frame.scale.clone();
      }
      return result;
    });
  }

  /** Immutable attached-cell snapshots, rebuilt only when occupancy changes. */
  countedState(key, groups) {
    const previous = this.stateSnapshots.get(key);
    if (previous?.revision === this.stateRevision) return previous.value;
    const value = Object.freeze(Object.fromEntries([...groups].map(([id, cells]) => [id,
      Object.freeze({ remaining: cells.reduce((count, cell) => count + Number(cell.active), 0), total: cells.length })])));
    this.stateSnapshots.set(key, { revision: this.stateRevision, value });
    return value;
  }

  weaponState() { return this.countedState('weapon', this.weaponGroups); }
  structureState() { return this.countedState('structure', this.structureGroups); }
  balanceState() { return this.countedState('balance', this.balanceGroups); }
  partState() { return this.countedState('part', this.partGroups); }

  /** Mend dents and small holes in attached anatomy; detached parts never regrow. */
  repair({ maxCells = 16 } = {}) {
    if (!Number.isSafeInteger(maxCells) || maxCells < 0 || maxCells > 256) {
      throw new RangeError('Voxel repair budget must be an integer from 0 to 256.');
    }
    const attached = new Set(this.cellList.filter(cell => cell.active).map(cell => cell.part));
    let repairedCells = 0, restoredCells = 0;
    for (const cell of this.cellList) {
      if (repairedCells >= maxCells) break;
      if (!attached.has(cell.part) || this.severed.has(cell.part)) continue;
      if (cell.active) {
        if (cell.remainingHits >= cell.cutHits) continue;
        cell.remainingHits++;
      } else {
        if (!cell.repairable) continue;
        let connected = false;
        for (let direction = 0; direction < 6; direction++) {
          const index = this.neighborIndices[cell.index * 6 + direction];
          if (index !== this.missingNeighbor && this.cellList[index].active && this.cellList[index].part === cell.part) {
            connected = true; break;
          }
        }
        if (!connected) continue;
        cell.active = true; cell.remainingHits = cell.cutHits; cell.repairable = false;
        restoredCells++;
      }
      repairedCells++;
    }
    if (restoredCells) { this.changed = true; this.syncPose(); }
    return { repairedCells, restoredCells, weaponState: this.weaponState(), structureState: this.structureState(),
      ...(this.balanceGroups.size ? { balanceState: this.balanceState() } : {}) };
  }

  /** Damage each intersected cell once, then detach islands no longer joined to the torso. */
  cut({ angle = 0, height = 1.5, tilt = 0, origin, reach = 3.6, power = 1, point: through, normal: bladeNormal, forward, arc = Math.PI } = {}) {
    if (![angle,height,tilt,reach,arc].every(Number.isFinite)) throw new TypeError('Cut parameters must be finite.');
    this.updateParts();
    let plane;
    if (through && bladeNormal) {
      // An aimed swing: the plane the blade actually sweeps, through the wielder's eye.
      const aimed = new THREE.Vector3(bladeNormal.x, bladeNormal.y, bladeNormal.z);
      const anchor = new THREE.Vector3(through.x, through.y, through.z);
      if (![...aimed.toArray(), ...anchor.toArray()].every(Number.isFinite) || aimed.lengthSq() < 1e-9) throw new TypeError('Cut parameters must be finite.');
      plane = new THREE.Plane().setFromNormalAndCoplanarPoint(aimed.normalize(), anchor);
    } else {
      const normal = new THREE.Vector3(Math.cos(angle) * Math.sin(tilt), Math.cos(tilt), -Math.sin(angle) * Math.sin(tilt));
      const center = this.model.getWorldPosition(new THREE.Vector3());
      center.y += height;
      plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, center);
    }
    const halfWidth = this.size * 0.72 * Math.min(1.9, Math.sqrt(Math.max(1, Number.isFinite(power) ? power : 1)));
    const minCos = Math.cos(Math.min(Math.PI, Math.max(0, arc)));
    const withinBlade = point => {
      if (!origin) return true;
      const dx = point.x-origin.x, dy = Number.isFinite(origin.y) ? point.y-origin.y : 0, dz = point.z-origin.z;
      const distance = Math.hypot(dx, dy, dz);
      if (distance > reach + this.size) return false;
      // The blade only sweeps an arc in front of the wielder; point-blank cells always count.
      return !forward || distance < 0.9 || (dx*forward.x + dy*forward.y + dz*forward.z) / distance >= minCos;
    };
    const removed = [], absorbed = [];
    // Only durable armour needs a prepass. Its surviving pixels stop this swing
    // reaching cells behind them; the second hit opens precisely those pixels.
    const armourPass = this.durableCells.length > 0 && origin && Number.isFinite(origin.y);
    let occluded = null;
    if (armourPass) {
      for (const cell of this.durableCells) {
        if (!cell.active) continue;
        const point = this.cutPoint.copy(cell.position).applyMatrix4(cell.partRef.delta).applyMatrix4(this.model.matrixWorld);
        if (Math.abs(plane.distanceToPoint(point)) > halfWidth || !withinBlade(point)) continue;
        if (cell.remainingHits > 1) { cell.remainingHits--; absorbed.push(cell); }
        else { cell.remainingHits = 0; cell.active = false; cell.repairable = true; removed.push(cell); }
      }
      if (absorbed.length) {
        const groups = new Map(), target = new THREE.Vector3();
        for (const cell of absorbed) {
          let group = groups.get(cell.partRef);
          if (!group) {
            const inverse = new THREE.Matrix4().multiplyMatrices(this.model.matrixWorld, cell.partRef.delta).invert();
            group = { inverse, origin: new THREE.Vector3(origin.x, origin.y, origin.z).applyMatrix4(inverse), cells: [] };
            groups.set(cell.partRef, group);
          }
          group.cells.push(cell);
        }
        occluded = point => {
          for (const group of groups.values()) {
            target.copy(point).applyMatrix4(group.inverse);
            for (const cell of group.cells) if (segmentCrossesVoxel(group.origin, target, cell.position, this.size * .5)) return true;
          }
          return false;
        };
      }
    }
    for (const cell of this.cellList) {
      if (!cell.active || (armourPass && cell.cutHits > 1)) continue;
      const point = this.cutPoint.copy(cell.position).applyMatrix4(cell.partRef.delta).applyMatrix4(this.model.matrixWorld);
      if (Math.abs(plane.distanceToPoint(point)) <= halfWidth && withinBlade(point)) {
        if (occluded?.(point)) continue;
        if (cell.remainingHits > 1) {
          cell.remainingHits--;
          absorbed.push(cell);
          continue;
        }
        cell.remainingHits = 0;
        cell.active = false;
        cell.repairable = true;
        removed.push(cell);
      }
    }
    let bridgesCut = 0;
    for (const bridge of this.bridges) {
      // An absorbed strike cannot sever an empty rig link behind an intact plate.
      // Real arm cuts still remove cells and can drop the attached shield intact.
      if (absorbed.length && !removed.length) break;
      if (!bridge.intact) continue;
      if (!bridge.aCell.active || !bridge.bCell.active) continue;
      const a = this.posedPosition(bridge.aCell, true);
      const b = this.posedPosition(bridge.bCell, true);
      const da = plane.distanceToPoint(a), db = plane.distanceToPoint(b);
      if (da * db <= 0) {
        const midpoint = a.clone().lerp(b, 0.5);
        if (withinBlade(midpoint) && !occluded?.(midpoint)) { bridge.intact = false; bridgesCut++; }
      }
    }
    if (!removed.length && !bridgesCut) return { removedFraction: 0, critical: false, legsLost: 0, severedParts: [], fragments: [], chips: [], absorbedHits: this.snapshot(absorbed),
      structuralFatal: false, structuralReason: null, bodyDamageFraction: 0,
      weaponState: this.weaponState(), structureState: this.structureState(),
      ...(this.balanceGroups.size ? { balanceState: this.balanceState() } : {}), ...(this.mainBodyCount ? { mainBodyFraction: 0 } : {}) };
    const islands = this.components();
    const weight = cells => cells.reduce((sum, cell) => sum + (cell.core ? 100 : cell.anatomy === 'body' ? 3 : 1), 0);
    islands.sort((a,b) => weight(b)-weight(a));
    const detached = islands.slice(1);
    const dropped = detached.flat();
    for (const cell of dropped) { cell.active = false; cell.repairable = false; }
    const affected = [...removed, ...dropped];
    const bodyAffected = affected.reduce((count, cell) => count + Number(cell.centralBody), 0);
    const bodyDetached = dropped.reduce((count, cell) => count + Number(cell.centralBody), 0);
    const bodyRemaining = (islands[0] || []).reduce((count, cell) => count + Number(cell.centralBody), 0);
    let structuralReason = null;
    if (this.bodyCount && !this.structuralFatalExempt) {
      // The blade consumes the seam itself. Attribute half that torso kerf to
      // each side, but require a real detached torso piece rather than shavings.
      const halfKerf = (bodyAffected - bodyDetached) * .5;
      if (bodyDetached > 0 && bodyDetached + halfKerf >= this.bodyCount * .18 && bodyRemaining + halfKerf >= this.bodyCount * .18) structuralReason = 'torso-severed';
      else if (bodyRemaining <= this.bodyCount * .2) structuralReason = 'torso-destroyed';
    }
    let criticalLost = 0;
    for (const cell of this.cellList) if (!cell.active && cell.critical) criticalLost++;
    const critical = islands.length === 0 || affected.some(cell => cell.core) || (this.criticalCount > 0 && criticalLost / this.criticalCount >= 0.55);
    const severedParts = [];
    let legsLost = 0;
    const affectedParts = new Set(affected.filter(cell => ['leg','arm','tentacle','head'].includes(cell.anatomy)).map(cell => cell.part));
    for (const id of affectedParts) {
      if (this.severed.has(id)) continue;
      const part = this.parts.get(id);
      let remaining = 0;
      for (const cell of part.cells) if (cell.active) remaining++;
      const total = part.cells.length;
      if (remaining > total * 0.2) continue;
      this.severed.add(id);
      severedParts.push(part.name || part.anatomy);
      if (part.anatomy === 'leg' || part.anatomy === 'tentacle') legsLost++;
    }
    this.changed = true;
    this.syncPose();
    return { removedFraction: affected.length / this.originalCount, critical, legsLost, severedParts,
      structuralFatal: structuralReason !== null, structuralReason, bodyDamageFraction: this.bodyCount ? bodyAffected / this.bodyCount : 0,
      fragments: detached.map(cells => this.snapshot(cells)), chips: this.snapshot(removed), absorbedHits: this.snapshot(absorbed.filter(cell => cell.active)),
      weaponState: this.weaponState(), structureState: this.structureState(),
      ...(this.balanceGroups.size ? { balanceState: this.balanceState() } : {}),
      ...(this.mainBodyCount ? { mainBodyFraction: affected.filter(cell => cell.bossMain).length / this.mainBodyCount } : {}) };
  }

  collapse() {
    this.updateParts();
    const pieces = this.components().map(cells => this.snapshot(cells));
    for (const cell of this.cells.values()) { cell.active = false; cell.repairable = false; }
    this.changed = true;
    this.syncPose();
    return pieces;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.model.remove(this.mesh); this.mesh.dispose();
    if (this.transparentMesh) { this.model.remove(this.transparentMesh); this.transparentMesh.dispose(); }
    this.model.userData.golemMagicMesh?.dispose();
  }
}

/**
 * World-space frame of a swing aimed along `angle` (yaw, 0 faces +Z) and `pitch`.
 * `tilt` rolls the swing: 0 sweeps right-to-left, PI/2 chops top-to-bottom.
 * The blade stays in the plane through the eye spanned by `forward` and `travel`.
 */
export function bladeSweep({ angle = 0, pitch = 0, tilt = 0 } = {}) {
  if (![angle,pitch,tilt].every(Number.isFinite)) throw new TypeError('Blade parameters must be finite.');
  const forward = new THREE.Vector3(Math.sin(angle) * Math.cos(pitch), Math.sin(pitch), Math.cos(angle) * Math.cos(pitch));
  const right = new THREE.Vector3(-Math.cos(angle), 0, Math.sin(angle));
  const up = new THREE.Vector3().crossVectors(right, forward);
  const normal = up.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(right, -Math.sin(tilt));
  const travel = right.clone().multiplyScalar(-Math.cos(tilt)).addScaledVector(up, -Math.sin(tilt));
  return { forward, normal, travel };
}

/** A connected piece remains one rigid voxel shape, instead of exploding into cubes. */
export function createVoxelFragment(cells) {
  if (!cells.length) return null;
  const center = cells.reduce((sum, cell) => sum.add(cell.position), new THREE.Vector3()).multiplyScalar(1 / cells.length);
  const opaque = cells.filter(cell => !cell.transparent), glass = cells.filter(cell => cell.transparent);
  const mesh = new THREE.InstancedMesh(BOX, cells[0].ghost ? GHOST_SURFACE : SURFACE, opaque.length);
  mesh.position.copy(center);
  mesh.castShadow = mesh.receiveShadow = opaque.length > 0;
  const surfaces = [[mesh, opaque]];
  if (glass.length) {
    const pane = new THREE.InstancedMesh(BOX, GLASS_SURFACE, glass.length);
    pane.name = 'detached-transparent-voxel-surface';
    mesh.add(pane); surfaces.push([pane, glass]);
    mesh.addEventListener('dispose', () => pane.dispose());
  }
  for (const [surface, voxels] of surfaces) {
    voxels.forEach((cell, index) => {
      temp.position.copy(cell.position).sub(center);
      if (cell.quaternion) temp.quaternion.copy(cell.quaternion);
      else temp.rotation.set(0,0,0);
      if (cell.scale) temp.scale.copy(cell.scale).multiplyScalar(VOXEL_FILL);
      else temp.scale.setScalar(cell.size * VOXEL_FILL);
      temp.updateMatrix();
      surface.setMatrixAt(index, temp.matrix);
      surface.setColorAt(index, cell.color);
    });
    surface.instanceMatrix.needsUpdate = true;
    if (surface.instanceColor) surface.instanceColor.needsUpdate = true;
    surface.computeBoundingBox(); surface.computeBoundingSphere();
  }
  // Rigid debris uses the parent bounds, including panes outside its opaque cells.
  for (const [surface] of surfaces) if (surface !== mesh) mesh.boundingBox.union(surface.boundingBox);
  mesh.boundingBox.getBoundingSphere(mesh.boundingSphere);
  return mesh;
}
