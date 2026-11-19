import { EYE_HEIGHT } from './terrain.js';
import { isopodLocalToWorld, isopodWorldVectorToLocal } from './isopod-frame.js';

const SCALE = 25;
const RESPONSE = 9;
const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

/** Dimensions are metres in the bug's render frame: Y up, front along -Z. */
export const ISOPOD_EYE = Object.freeze({
  center: Object.freeze([0, .20, -1.05]),
  radius: .220,
  socketRadius: .247,
  pupilRadius: .224,
  glintRadius: .228,
  maxYaw: .62,
  maxPitch: .52,
  rangeMeters: 10,
});

/** The eye anchor in simulation coordinates (25 units/metre, Z up).
 * Matches the complete climbing render frame, including walls and ceilings.
 * @param {import('./isopod-frame.js').IsopodFrame} pod
 * @param {{x:number,y:number,z:number}} [target]
 */
export function getIsopodEyeOrigin(pod, target = { x: 0, y: 0, z: 0 }) {
  return isopodLocalToWorld(pod, ...ISOPOD_EYE.center, target);
}

/** Simulation-owned, smooth attention. Renderers only read these transient
 * values; held/eaten bugs and paused frames retain their entire existing state.
 * @param {{player?:{x:number,y:number,z:number}}} world
 * @param {{x:number,y:number,z:number,heading:number,size:number,gazeYaw?:number,gazePitch?:number,gazeTracking?:boolean,squidHeldBy?:string,squidRespawnIn?:number}} pod
 * @param {number} dt
 */
export function updateIsopodGaze(world, pod, dt) {
  if (!Number.isFinite(dt) || dt <= 0 || pod.squidHeldBy || pod.squidRespawnIn > 0) return;
  if (![pod.x, pod.y, pod.z, pod.heading, pod.size].every(Number.isFinite) || pod.size <= 0) return;
  const player = world.player;
  let yaw = 0, pitch = 0, tracking = false;
  if (player && [player.x, player.y, player.z].every(Number.isFinite)) {
    const origin = getIsopodEyeOrigin(pod);
    const dx = player.x - origin.x, dy = player.y - origin.y;
    const dz = player.z + EYE_HEIGHT - origin.z;
    const distance = Math.hypot(dx, dy, dz);
    tracking = distance > 1e-6 && distance <= ISOPOD_EYE.rangeMeters * SCALE;
    if (tracking) {
      const local = isopodWorldVectorToLocal(pod, dx, dy, dz, undefined, ISOPOD_EYE.center[2]);
      const right = local.x, forward = -local.z;
      yaw = clamp(Math.atan2(right, forward), ISOPOD_EYE.maxYaw);
      pitch = clamp(Math.atan2(local.y, Math.hypot(right, forward)), ISOPOD_EYE.maxPitch);
    }
  }
  const blend = -Math.expm1(-RESPONSE * Math.min(.05, dt));
  const oldYaw = Number.isFinite(pod.gazeYaw) ? clamp(pod.gazeYaw, ISOPOD_EYE.maxYaw) : 0;
  const oldPitch = Number.isFinite(pod.gazePitch) ? clamp(pod.gazePitch, ISOPOD_EYE.maxPitch) : 0;
  pod.gazeYaw = oldYaw + (yaw - oldYaw) * blend;
  pod.gazePitch = oldPitch + (pitch - oldPitch) * blend;
  pod.gazeTracking = tracking;
}
