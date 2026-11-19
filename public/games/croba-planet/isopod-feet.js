import { hasIsopodSpine, isopodLocalToWorld } from './isopod-frame.js';
import { getIsopodFootSupport } from './isopod-surface.js';

const scratch = { x: 0, y: 0, z: 0 };

/** Pose one visible walking leg in simulation coordinates. Root and knee keep
 * their authored pose; the foot plants on an actual triangle and the ankle
 * bends between knee and foot. Reuse target buffers for every animation frame.
 * @param {object} world @param {object} pod @param {number[][]} localPath
 * @param {number[][]} [target] @returns {number[][]}
 */
export function getIsopodLegWorldPath(world, pod, localPath,
  target = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]) {
  for (let i = 0; i < 4; i++) {
    isopodLocalToWorld(pod, ...localPath[i], scratch);
    target[i][0] = scratch.x; target[i][1] = scratch.y; target[i][2] = scratch.z;
  }
  if (!hasIsopodSpine(pod) || pod.squidHeldBy || pod.squidRespawnIn > 0) return target;
  const foot = target[3]; scratch.x = foot[0]; scratch.y = foot[1]; scratch.z = foot[2];
  const supported = getIsopodFootSupport(world, scratch, pod.size, scratch);
  if (!supported) return target;
  foot[0] = supported.x; foot[1] = supported.y; foot[2] = supported.z;
  for (let axis = 0; axis < 3; axis++) target[2][axis] = target[1][axis] + (foot[axis] - target[1][axis]) * .55;
  return target;
}
