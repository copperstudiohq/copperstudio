import { MEGA_DRILL_LAYOUT as LAYOUT } from './mega-drill-layout.js';

export const MEGA_DRILL_JOINT_LAP = .75;

/** Four rigid rooms meet at shared hinges; distance drives the travelling bend. */
export function getMegaDrillSegmentPoses(distance = 0) {
  const travelled = Number.isFinite(distance) ? Math.max(0, distance) : 0;
  const t = Math.min(1, travelled / 2), amplitude = .16 * t * t * (3 - 2 * t);
  const phase = travelled / 3.2, poses = new Array(4);
  poses[3] = { index: 3, x: 0, z: LAYOUT.rooms[3].center[2], angle: 0 };
  for (let index = 2; index >= 0; index--) {
    const next = poses[index + 1], angle = Math.sin(phase - (3 - index) * .9) * amplitude;
    const hingeX = next.x - Math.sin(next.angle) * 3, hingeZ = next.z - Math.cos(next.angle) * 3;
    poses[index] = { index, x: hingeX - Math.sin(angle) * 3, z: hingeZ - Math.cos(angle) * 3, angle };
  }
  return poses;
}

/** Includes each articulated room and the complete rotating drill. */
export function megaDrillBounds(angle = 0, distance = 0) {
  const heading = Number.isFinite(angle) ? angle : 0, sine = Math.sin(heading), cosine = Math.cos(heading);
  const bounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
  const add = (x, z) => {
    const worldX = cosine * x + sine * z, worldZ = -sine * x + cosine * z;
    bounds.minX = Math.min(bounds.minX, worldX); bounds.maxX = Math.max(bounds.maxX, worldX);
    bounds.minZ = Math.min(bounds.minZ, worldZ); bounds.maxZ = Math.max(bounds.maxZ, worldZ);
  };
  for (const pose of getMegaDrillSegmentPoses(distance)) {
    const s = Math.sin(pose.angle), c = Math.cos(pose.angle);
    const ends = [-3 - (pose.index > 0 ? MEGA_DRILL_JOINT_LAP : 0), 3 + (pose.index < 3 ? MEGA_DRILL_JOINT_LAP : 0)];
    for (const x of [-LAYOUT.width / 2, LAYOUT.width / 2]) for (const z of ends) add(pose.x + c * x + s * z, pose.z - s * x + c * z);
  }
  for (const x of [-3.7, 3.7]) add(x, LAYOUT.hullFrontZ);
  // The last square cutter still has a wide diagonal when it rotates.
  for (const x of [-.75, .75]) add(x, LAYOUT.tipZ);
  return bounds;
}

export function megaDrillRoomLocal(actor, pose, x, z) {
  const dx = x - actor.x, dz = z - actor.z, sine = Math.sin(actor.angle), cosine = Math.cos(actor.angle);
  const rootX = cosine * dx - sine * dz - pose.x, rootZ = sine * dx + cosine * dz - pose.z;
  const s = Math.sin(pose.angle), c = Math.cos(pose.angle);
  return { x: c * rootX - s * rootZ, z: s * rootX + c * rootZ };
}
export function megaDrillRoomPoint(actor, pose, x, z) {
  const s = Math.sin(pose.angle), c = Math.cos(pose.angle), rootX = pose.x + c * x + s * z, rootZ = pose.z - s * x + c * z;
  const sine = Math.sin(actor.angle), cosine = Math.cos(actor.angle);
  return { x: actor.x + cosine * rootX + sine * rootZ, z: actor.z - sine * rootX + cosine * rootZ };
}
