import { EYE_HEIGHT, SWORD_REACH } from './sword-config.js';

const FOLLOW_DISTANCE = 6, SHOULDER_OFFSET = 1.25, CAMERA_HEIGHT = 3.5;
const MAX_PITCH = 1.2, EDGE_INSET = .4;
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

/** @typedef {{x:number,y:number,z:number}} CameraPoint */

/**
 * Follow combat aim from behind the right shoulder: angle zero faces +Z.
 * The target is the sword's tip on the player's eye-origin aim ray.
 * Optional bounds use the arena's {x,z} half extents and constrain only the camera.
 * This function never changes the player or options.
 *
 * @param {{x:number,z:number,angle?:number}} player
 * @param {{angle?:number,pitch?:number,bounds?:{x:number,z:number}}} [options]
 * @returns {{position:CameraPoint,target:CameraPoint}}
 */
export function thirdPersonCameraPose(player, options = {}) {
  if (!player || typeof player !== 'object' || Array.isArray(player)) {
    throw new TypeError('Third-person camera requires a player position.');
  }
  const x = finite(player.x), z = finite(player.z);
  const elevation = Math.max(0, finite(player.elevation));
  const angle = finite(options?.angle, finite(player.angle));
  const pitch = clamp(finite(options?.pitch), -MAX_PITCH, MAX_PITCH);
  const forwardX = Math.sin(angle), forwardZ = Math.cos(angle);
  const position = { x: x - forwardX * FOLLOW_DISTANCE - forwardZ * SHOULDER_OFFSET,
    y: CAMERA_HEIGHT + elevation, z: z - forwardZ * FOLLOW_DISTANCE + forwardX * SHOULDER_OFFSET };
  const bounds = options?.bounds;
  if (bounds != null) {
    if (!Number.isFinite(bounds.x) || !Number.isFinite(bounds.z) || bounds.x < 0 || bounds.z < 0) {
      throw new RangeError('Third-person camera bounds require finite, nonnegative x and z half extents.');
    }
    const halfX = Math.max(0, bounds.x - EDGE_INSET), halfZ = Math.max(0, bounds.z - EDGE_INSET);
    position.x = clamp(position.x, -halfX, halfX);
    position.z = clamp(position.z, -halfZ, halfZ);
  }
  return { position, target: { x: x + forwardX * SWORD_REACH,
    y: clamp(EYE_HEIGHT + elevation + Math.tan(pitch) * SWORD_REACH, .5, 14), z: z + forwardZ * SWORD_REACH } };
}
