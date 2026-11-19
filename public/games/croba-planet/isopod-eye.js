import * as THREE from './vendor/three.module.js';
import { ISOPOD_EYE } from './isopod-gaze.js';

export { ISOPOD_EYE } from './isopod-gaze.js';

const TAU = Math.PI * 2;
const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

/** A convex optical cap (or complete globe) facing -Z. Independent triangles make each small lens
 * facet catch light; UVs keep the shared radial iris map centred on the front.
 */
function eyeCap(radius, angle, segments, rings) {
  const positions = [], uvs = [];
  const point = (ring, segment) => {
    const polar = ring / rings * angle, azimuth = segment / segments * TAU;
    return [Math.sin(polar) * Math.cos(azimuth) * radius,
      Math.sin(polar) * Math.sin(azimuth) * radius, -Math.cos(polar) * radius];
  };
  const triangle = (a, b, c) => {
    for (const p of [a, b, c]) {
      positions.push(...p);
      uvs.push(.75 + Math.atan2(p[0], -p[2]) / TAU, .5 - Math.asin(p[1] / radius) / Math.PI);
    }
  };
  for (let ring = 0; ring < rings; ring++) for (let segment = 0; segment < segments; segment++) {
    const a = point(ring, segment), b = point(ring + 1, segment);
    const c = point(ring + 1, segment + 1), d = point(ring, segment + 1);
    // A complete globe closes at the rear pole without zero-area triangles.
    if (angle < Math.PI || ring < rings - 1) triangle(a, c, b);
    if (ring > 0) triangle(a, d, c);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Four shared geometries, each centred at [0,0,0]. Translate the anchor once.
 * Socket and iris stay fixed; rotate only the pupil and glint by the gaze pose.
 * The pupil is a spherical patch, so looking never pulls it free of the lens.
 */
export function createIsopodEyeGeometries() {
  const socket = new THREE.TorusGeometry(.221, .026, 6, 32);
  // Closed, rounded backing stays in the same draw as the front lens. Most of
  // the rear globe sits inside the head, rather than leaving an open eye bowl.
  const iris = eyeCap(ISOPOD_EYE.radius, Math.PI, 32, 16);
  const pupil = eyeCap(ISOPOD_EYE.pupilRadius, .29, 24, 4);
  const glint = eyeCap(ISOPOD_EYE.glintRadius, .038, 10, 2);
  glint.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(.15, .14, 0, 'YXZ')));
  for (const [kind, geometry] of Object.entries({ socket, iris, pupil, glint })) {
    geometry.name = `single-gold-isopod-eye-${kind}`;
    geometry.userData.isopodEyePart = kind;
    geometry.userData.partsPerBug = 1;
    geometry.computeBoundingSphere();
  }
  return { socket, iris, pupil, glint };
}

/** Read-only local pose; reusing a target avoids per-frame renderer allocation.
 * The quaternion maps front normal [0,0,-1] onto direction. The fixed anchor
 * remains unscaled here because the bug's root matrix already carries size.
 * @param {{gazeYaw?:number,gazePitch?:number}} pod
 * @param {{position:number[],quaternion:number[],direction:number[],yaw:number,pitch:number}} [target]
 */
export function getIsopodEyePose(pod, target = {
  position: [0, 0, 0], quaternion: [0, 0, 0, 1], direction: [0, 0, -1], yaw: 0, pitch: 0,
}) {
  const yaw = Number.isFinite(pod.gazeYaw) ? clamp(pod.gazeYaw, ISOPOD_EYE.maxYaw) : 0;
  const pitch = Number.isFinite(pod.gazePitch) ? clamp(pod.gazePitch, ISOPOD_EYE.maxPitch) : 0;
  const sy = Math.sin(yaw / 2), cy = Math.cos(yaw / 2);
  const sp = Math.sin(pitch / 2), cp = Math.cos(pitch / 2);
  target.position[0] = ISOPOD_EYE.center[0];
  target.position[1] = ISOPOD_EYE.center[1];
  target.position[2] = ISOPOD_EYE.center[2];
  target.quaternion[0] = cy * sp;
  target.quaternion[1] = -sy * cp;
  target.quaternion[2] = sy * sp;
  target.quaternion[3] = cy * cp;
  target.direction[0] = Math.sin(yaw) * Math.cos(pitch);
  target.direction[1] = Math.sin(pitch);
  target.direction[2] = -Math.cos(yaw) * Math.cos(pitch);
  target.yaw = yaw; target.pitch = pitch;
  return target;
}
