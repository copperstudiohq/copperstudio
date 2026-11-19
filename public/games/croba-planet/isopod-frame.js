/** The climbing frame uses render axes: X=world X, Y=world Z, Z=world Y.
 * Old prepared creatures without a surface pose retain their heading yaw.
 * @typedef {{z:number,position:{x:number,y:number,z:number},orientation:number[]}} IsopodSpineSample
 * @typedef {{x:number,y:number,z:number,size:number,heading?:number,surfaceOrientation?:number[],surfaceSpine?:IsopodSpineSample[],squidHeldBy?:string,squidRespawnIn?:number}} IsopodFrame
 */

export const ISOPOD_SPINE_Z = Object.freeze([-1.5, -1.3, -1.05, -.85, -.65, -.45, -.25, 0, .25, .5, .75, 1, 1.2, 1.4, 1.6]);

/** Encode a rest-pose Z as neighboring spine samples for the shared GPU mesh. */
export function isopodSpineCoordinate(z) {
  if (z <= ISOPOD_SPINE_Z[0]) return 0;
  for (let i = 1; i < ISOPOD_SPINE_Z.length; i++) if (z <= ISOPOD_SPINE_Z[i])
    return i - 1 + (z - ISOPOD_SPINE_Z[i - 1]) / (ISOPOD_SPINE_Z[i] - ISOPOD_SPINE_Z[i - 1]);
  return ISOPOD_SPINE_Z.length - 1;
}

export function hasIsopodSpine(pod) {
  return !pod.squidHeldBy && !(pod.squidRespawnIn > 0)
    && pod.surfaceSpine?.length === ISOPOD_SPINE_Z.length && pod.surfaceSpine.every((sample, i) =>
    Math.abs(sample?.z - ISOPOD_SPINE_Z[i]) < 1e-6
    && [sample?.position?.x, sample?.position?.y, sample?.position?.z, ...sample?.orientation ?? []].every(Number.isFinite)
    && sample?.orientation?.length === 4 && Math.hypot(...sample.orientation) > 1e-10);
}

/** A centerline point in simulation axes and its render-axis orientation.
 * Normalized quaternion interpolation matches the GPU, including sign changes.
 * @param {IsopodFrame} pod @param {number} z
 * @param {{position:{x:number,y:number,z:number},orientation:number[]}} [target]
 */
export function getIsopodSpinePose(pod, z, target = { position: { x: 0, y: 0, z: 0 }, orientation: [0, 0, 0, 1] }) {
  const coordinate = isopodSpineCoordinate(z), low = Math.floor(coordinate);
  const a = pod.surfaceSpine[low], b = pod.surfaceSpine[Math.min(low + 1, ISOPOD_SPINE_Z.length - 1)], t = coordinate - low;
  target.position.x = a.position.x + (b.position.x - a.position.x) * t;
  target.position.y = a.position.y + (b.position.y - a.position.y) * t;
  target.position.z = a.position.z + (b.position.z - a.position.z) * t;
  const al = Math.hypot(...a.orientation), bl = Math.hypot(...b.orientation);
  const aq = a.orientation, bq = b.orientation;
  const sign = aq[0] * bq[0] + aq[1] * bq[1] + aq[2] * bq[2] + aq[3] * bq[3] < 0 ? -1 : 1;
  for (let i = 0; i < 4; i++) target.orientation[i] = a.orientation[i] / al * (1 - t) + b.orientation[i] / bl * t * sign;
  const length = Math.hypot(...target.orientation);
  for (let i = 0; i < 4; i++) target.orientation[i] /= length;
  return target;
}

/** Read a normalized, read-only surface pose. The caller can reuse its array.
 * @param {Partial<IsopodFrame>} pod @param {number[]} [target]
 */
export function getIsopodOrientation(pod, target = [0, 0, 0, 1]) {
  const q = pod.surfaceOrientation;
  if (q?.length === 4 && [q[0], q[1], q[2], q[3]].every(Number.isFinite)) {
    const length = Math.hypot(q[0], q[1], q[2], q[3]);
    if (length > 1e-10) {
      for (let i = 0; i < 4; i++) target[i] = q[i] / length;
      return target;
    }
  }
  const half = (-(Number.isFinite(pod.heading) ? pod.heading : 0) - Math.PI / 2) / 2;
  target[0] = 0; target[1] = Math.sin(half); target[2] = 0; target[3] = Math.cos(half);
  return target;
}

/** @param {number[]} q @param {number} x @param {number} y @param {number} z
 * @param {{x:number,y:number,z:number}} target @param {boolean} [inverse]
 */
function rotate(q, x, y, z, target, inverse = false) {
  const sign = inverse ? -1 : 1, qx = q[0] * sign, qy = q[1] * sign, qz = q[2] * sign;
  const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x);
  target.x = x + q[3] * tx + qy * tz - qz * ty;
  target.y = y + q[3] * ty + qz * tx - qx * tz;
  target.z = z + q[3] * tz + qx * ty - qy * tx;
  return target;
}

/** Transform body-local metres into simulation coordinates (25 units/metre).
 * Eyes, discovery capsules and articulated render roots share this exact frame.
 * @param {IsopodFrame} pod @param {number} x @param {number} y @param {number} z
 * @param {{x:number,y:number,z:number}} [target]
 * @param {number} [pivotZ] Fixed armor pivot; flexible surfaces default to their own Z.
 */
export function isopodLocalToWorld(pod, x, y, z, target = { x: 0, y: 0, z: 0 }, pivotZ = z) {
  if (hasIsopodSpine(pod)) {
    return isopodSpineLocalToWorld(pod, x, y, z, target, undefined, pivotZ);
  }
  rotate(getIsopodOrientation(pod), x, y, z, target);
  const scale = 25 * pod.size, up = target.y, forward = target.z;
  target.x = pod.x + target.x * scale;
  target.y = pod.y + forward * scale;
  target.z = pod.z + up * scale;
  return target;
}

/** Fast path for validated palettes and reusable limb scratch storage. */
export function isopodSpineLocalToWorld(pod, x, y, z, target = { x: 0, y: 0, z: 0 }, pose, pivotZ = z) {
  pose = getIsopodSpinePose(pod, pivotZ, pose);
  rotate(pose.orientation, x, y, z - pivotZ, target);
  const scale = 25 * pod.size, up = target.y, forward = target.z;
  target.x = pose.position.x + target.x * scale;
  target.y = pose.position.y + forward * scale;
  target.z = pose.position.z + up * scale;
  return target;
}

/** A simulation-space direction expressed in the surface-aligned local frame.
 * The output retains simulation units; only the coordinate axes rotate.
 * @param {IsopodFrame} pod @param {number} x @param {number} y @param {number} z
 * @param {{x:number,y:number,z:number}} [target]
 * @param {number} [localZ] The head or body cross-section supplying the local frame.
 */
export function isopodWorldVectorToLocal(pod, x, y, z, target = { x: 0, y: 0, z: 0 }, localZ = 0) {
  const orientation = hasIsopodSpine(pod) ? getIsopodSpinePose(pod, localZ).orientation : getIsopodOrientation(pod);
  return rotate(orientation, x, z, y, target, true);
}
