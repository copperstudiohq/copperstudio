import * as THREE from './assets/three.module.js';
import { bladeSweep } from './voxel-body.js';
import { EYE_HEIGHT, SWORD_REACH, SWING_ARC } from './sword-config.js';

/** Match VoxelBody.cut's world-space plane, kerf, reach and forward arc. */
function firstContact(event, enemy, body) {
  if (!Number.isFinite(event.originX) || !Number.isFinite(event.originZ)) {
    throw new TypeError('Sword contacts require a finite blade origin.');
  }
  body.updateParts();
  const origin = new THREE.Vector3(event.originX, Number.isFinite(event.originY) ? event.originY : EYE_HEIGHT, event.originZ);
  const pitch = Number.isFinite(event.pitch) ? event.pitch : Math.atan2(
    (Number.isFinite(event.cutHeight) ? event.cutHeight : origin.y) - origin.y,
    Math.max(.2, Math.hypot(enemy.x - origin.x, enemy.z - origin.z)));
  const blade = bladeSweep({ angle: event.attackAngle ?? 0, pitch, tilt: event.cutTilt ?? 0 });
  blade.normal.normalize();
  const power = Number.isFinite(event.bladePower) ? event.bladePower : 1;
  const halfWidth = body.size * .72 * Math.min(1.9, Math.sqrt(Math.max(1, power)));
  const reachSquared = (SWORD_REACH + body.size) ** 2, minCos = Math.cos(SWING_ARC);
  const transforms = new Map(), point = new THREE.Vector3();
  const posedPoint = (cell, target) => {
    let transform = transforms.get(cell.partRef);
    if (!transform) {
      transform = new THREE.Matrix4().multiplyMatrices(body.model.matrixWorld, cell.partRef.delta);
      transforms.set(cell.partRef, transform);
    }
    return target.copy(cell.position).applyMatrix4(transform);
  };
  let first = Infinity;
  for (const cell of body.cellList) {
    if (!cell.active) continue;
    posedPoint(cell, point);
    const x = point.x - origin.x, y = point.y - origin.y, z = point.z - origin.z;
    const distance = x * x + y * y + z * z;
    if (distance >= first || distance > reachSquared) continue;
    if (Math.abs(x * blade.normal.x + y * blade.normal.y + z * blade.normal.z) > halfWidth) continue;
    if (distance >= .81 && (x * blade.forward.x + y * blade.forward.y + z * blade.forward.z) / Math.sqrt(distance) < minCos) continue;
    first = distance;
  }
  // Rig gaps are intentionally sliceable even when the plane contains no cells.
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  for (const bridge of body.bridges) {
    if (!bridge.intact || !bridge.aCell.active || !bridge.bCell.active) continue;
    posedPoint(bridge.aCell, a); posedPoint(bridge.bCell, b);
    const da = (a.x - origin.x) * blade.normal.x + (a.y - origin.y) * blade.normal.y + (a.z - origin.z) * blade.normal.z;
    const db = (b.x - origin.x) * blade.normal.x + (b.y - origin.y) * blade.normal.y + (b.z - origin.z) * blade.normal.z;
    if (da * db > 0) continue;
    point.addVectors(a, b).multiplyScalar(.5);
    const x = point.x - origin.x, y = point.y - origin.y, z = point.z - origin.z;
    const distance = x * x + y * y + z * z;
    if (distance >= first || distance > reachSquared) continue;
    if (distance >= .81 && (x * blade.forward.x + y * blade.forward.y + z * blade.forward.z) / Math.sqrt(distance) < minCos) continue;
    first = distance;
  }
  return first;
}

/**
 * Resolve each swing from its closest physical voxel outward. A surviving shield
 * stops the remaining targets of that swing; a later swing queries the new cuts.
 * Preparation must return a current VoxelBody, or null for a retired target.
 * Each enemy receives at most one cut per swing, even if contacts are duplicated.
 *
 * @param {{event: object, enemy: object}[]} contacts
 * @param {{prepare: Function, cut: Function}} callbacks
 * @returns {{event: object, enemy: object, result: object}[]}
 */
export function resolveSwordContacts(contacts, { prepare, cut } = {}) {
  if (!Array.isArray(contacts)) throw new TypeError('Sword contacts must be an array.');
  if (typeof prepare !== 'function' || typeof cut !== 'function') {
    throw new TypeError('Sword contacts require prepare and cut callbacks.');
  }
  const groups = new Map(), results = [];
  for (const contact of contacts) {
    if (!contact?.event || typeof contact.event !== 'object') throw new TypeError('Each sword contact needs an event.');
    if (!contact.enemy) continue;
    const id = contact.event.swingId;
    let group = groups.get(id);
    if (!group) { group = { contacts: [], enemies: new Set() }; groups.set(id, group); }
    const enemyId = contact.enemy.id ?? contact.enemy;
    if (group.enemies.has(enemyId)) continue;
    group.enemies.add(enemyId);
    group.contacts.push(contact);
  }
  for (const group of groups.values()) {
    const ordered = [];
    for (const contact of group.contacts) {
      if (contact.enemy.hp <= 0 || contact.enemy.defeated) continue;
      const body = prepare(contact.event, contact.enemy);
      if (!body) continue;
      const distance = firstContact(contact.event, contact.enemy, body);
      if (Number.isFinite(distance)) ordered.push({ ...contact, distance });
    }
    ordered.sort((a, b) => a.distance - b.distance);
    for (const { event, enemy } of ordered) {
      const result = cut(event, enemy);
      results.push({ event, enemy, result });
      if (result?.absorbedHits?.length) break;
    }
  }
  return results;
}
