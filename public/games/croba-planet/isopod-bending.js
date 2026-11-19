import * as THREE from './vendor/three.module.js';
import { ISOPOD_EYE } from './isopod-gaze.js';

const HEAD_Z = ISOPOD_EYE.center[2];
const MAX_BEND = .28;
const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

/** Curvature in radians/metre. Turn into a curve, with a small walking sway.
 * This is a read-only render pose; capture and reduced motion hold a straight body.
 * @param {{seed?:number,crawlTurn?:number,squidHeldBy?:string}} pod
 */
export function getIsopodBodyBend(pod, time, reducedMotion = false) {
  if (reducedMotion || pod.squidHeldBy) return 0;
  const turn = Number.isFinite(pod.crawlTurn) ? pod.crawlTurn : 0;
  const phase = (Number.isFinite(time) ? time : 0) * 2.3 + (Number.isFinite(pod.seed) ? pod.seed : 0) * Math.PI * 2;
  return clamp(turn * .20 + Math.sin(phase) * .055, MAX_BEND);
}

/** Match the GPU centreline for appendage roots, without allocating per frame.
 * The head stays fixed, while the abdomen curves behind it. Y stays on the floor.
 * @param {number[]} point @param {number} bend @param {number[]} [target]
 */
export function bendIsopodPoint(point, bend, target = [0, 0, 0]) {
  const [x, y, z] = point, along = Math.max(0, z - HEAD_Z);
  const angle = bend * along, c = Math.cos(angle), s = Math.sin(angle);
  const offsetX = Math.abs(bend) > 1e-5 ? (1 - c) / bend : 0;
  const offsetZ = Math.abs(bend) > 1e-5 ? s / bend - along : 0;
  target[0] = c * x + offsetX;
  target[1] = y;
  target[2] = z - s * x + offsetZ;
  return target;
}

/** Each armor plate rotates as a hard segment, rather than stretching its skin.
 * The belly uses continuous pivots to bridge the articulated shields.
 * @param {THREE.BufferGeometry} geometry @param {boolean} [continuous]
 */
export function addIsopodSegmentPivots(geometry, continuous = false) {
  const position = geometry.attributes.position;
  const pivots = new Float32Array(position.count).fill(HEAD_Z);
  if (continuous) {
    for (let i = 0; i < pivots.length; i++) pivots[i] = position.getZ(i);
  } else for (const section of geometry.userData.anatomySections ?? []) {
    if (section.kind === 'head') continue;
    let min = Infinity, max = -Infinity;
    for (let i = section.start; i < section.start + section.count; i++) {
      const z = position.getZ(i); min = Math.min(min, z); max = Math.max(max, z);
    }
    pivots.fill((min + max) * .5, section.start, section.start + section.count);
  }
  geometry.setAttribute('isopodSegmentZ', new THREE.BufferAttribute(pivots, 1));
  return geometry;
}

/** One instanced curvature float bends the shared geometry on the GPU. Normals
 * rotate with the hard plates; no per-animal geometry or extra draw calls.
 * @param {THREE.Material} material
 */
export function applyIsopodBending(material, palette) {
  const previousCompile = material.onBeforeCompile;
  material.onBeforeCompile = function (shader, renderer) {
    previousCompile.call(this, shader, renderer);
    shader.uniforms.isopodSpines = { value: palette.texture };
    shader.uniforms.isopodSpineSize = { value: palette.size };
    const common = '#include <common>', normals = '#include <beginnormal_vertex>', vertices = '#include <begin_vertex>';
    if (![common, normals, vertices].every((marker) => shader.vertexShader.includes(marker)))
      throw new Error('Gold Rock Bug bending requires the standard Three.js vertex shader chunks.');
    shader.vertexShader = shader.vertexShader.replace(common, `${common}
attribute float isopodSegmentZ;
attribute float isopodBend;
attribute float isopodSpineSample;
attribute float isopodSpineRow;
uniform sampler2D isopodSpines;
uniform vec2 isopodSpineSize;
vec4 isopodSpineTexel(float sampleIndex, float part) {
  return texture2D(isopodSpines, vec2((sampleIndex * 2.0 + part + 0.5) / isopodSpineSize.x,
    (isopodSpineRow + 0.5) / isopodSpineSize.y));
}
void isopodReadSpine(out vec3 p, out vec4 q) {
  float lo = floor(isopodSpineSample), hi = min(lo + 1.0, 14.0), t = fract(isopodSpineSample);
  p = mix(isopodSpineTexel(lo, 0.0).xyz, isopodSpineTexel(hi, 0.0).xyz, t);
  vec4 a = isopodSpineTexel(lo, 1.0), b = isopodSpineTexel(hi, 1.0);
  if (dot(a, b) < 0.0) b = -b;
  q = normalize(mix(a, b, t));
}
vec3 isopodRotateSpine(vec3 p, vec4 q) {
  return p + 2.0 * cross(q.xyz, cross(q.xyz, p) + q.w * p);
}
float isopodAlong() { return max(0.0, isopodSegmentZ - (${HEAD_Z.toFixed(6)})); }
mat3 isopodRotation() {
  float angle = isopodBend * isopodAlong(), c = cos(angle), s = sin(angle);
  return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}
vec3 isopodPosition(vec3 p) {
  float along = isopodAlong(), angle = isopodBend * along;
  vec3 offset = vec3(0.0);
  if (abs(isopodBend) > 0.00001)
    offset = vec3((1.0 - cos(angle)) / isopodBend, 0.0, sin(angle) / isopodBend - along);
  vec3 pivot = vec3(0.0, 0.0, isopodSegmentZ);
  return isopodRotation() * (p - pivot) + pivot + offset;
}`)
      .replace(normals, `${normals}
bool isopodArticulated = isopodSpineRow >= 0.0;
vec3 isopodCenter = vec3(0.0);
vec4 isopodFrameQuaternion = vec4(0.0, 0.0, 0.0, 1.0);
if (isopodArticulated) {
  isopodReadSpine(isopodCenter, isopodFrameQuaternion);
  objectNormal = isopodRotateSpine(objectNormal, isopodFrameQuaternion);
} else objectNormal = isopodRotation() * objectNormal;`)
      .replace(vertices, `${vertices}
if (isopodArticulated)
  transformed = isopodRotateSpine(transformed - vec3(0.0, 0.0, isopodSegmentZ), isopodFrameQuaternion) + isopodCenter;
else transformed = isopodPosition(transformed);`);
  };
  material.customProgramCacheKey = () => 'gold-rock-bug-surface-spines-v2';
  material.needsUpdate = true;
}
