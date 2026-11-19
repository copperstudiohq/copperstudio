import * as THREE from './assets/three.module.js';
import { getArenaSize } from './arena-config.js';

export const WAR_TEAM_COLORS = Object.freeze({ blue: 0x57baff, red: 0xff746a });
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Fit the floor and the tallest boss into the usable viewport before applying spectator zoom. */
export function warCameraPose({ arenaId = 'bonefields', aspect = 1, yaw = 0, pitch = .98, zoom = 1 } = {}) {
  const size = getArenaSize(arenaId), mine = arenaId === 'drill-mine';
  aspect = Math.max(.1, finite(aspect, 1)); yaw = finite(yaw);
  pitch = clamp(finite(pitch, .98), mine ? 1.35 : .45, 1.4); zoom = clamp(finite(zoom, 1), .35, 2.5);
  const tangent = Math.tan(50 * Math.PI / 360), sin = Math.sin(yaw), cos = Math.cos(yaw);
  const sp = Math.sin(pitch), cp = Math.cos(pitch);
  const normal = { x: sin * cp, y: sp, z: cos * cp };
  let distance = 0;
  for (const x of [-size.halfWidth - 2, size.halfWidth + 2]) {
    for (const z of [-size.halfDepth - 2, size.halfDepth + 2]) for (const y of [-2, 10]) {
      const depth = x * normal.x + y * normal.y + z * normal.z;
      const horizontal = Math.abs(x * cos - z * sin) / (tangent * aspect);
      const vertical = Math.abs(-x * sin * sp + y * cp - z * cos * sp) / tangent;
      distance = Math.max(distance, depth + Math.max(horizontal, vertical));
    }
  }
  distance = Math.max(35, distance * 1.06 * zoom);
  let fov = 50;
  if (mine) {
    // Stay below the high roof and inside its opening; widen the lens rather
    // than backing the spectator into an opaque cavern wall on narrow screens.
    distance = Math.min(distance, 98 / sp, 20 / cp);
    let required = 0;
    for (const x of [-size.halfWidth - 2, size.halfWidth + 2]) {
      for (const z of [-size.halfDepth - 2, size.halfDepth + 2]) for (const y of [-2, 10]) {
        const depth = distance - (x * normal.x + y * normal.y + z * normal.z);
        const horizontal = Math.abs(x * cos - z * sin) / (depth * aspect);
        const vertical = Math.abs(-x * sin * sp + y * cp - z * cos * sp) / depth;
        required = Math.max(required, horizontal, vertical);
      }
    }
    fov = clamp(2 * Math.atan(required * 1.06 * zoom) * 180 / Math.PI, 50, 170);
  }
  return { fov, far: Math.max(mine ? 260 : 180, distance + 100), distance,
    position: { x: normal.x * distance, y: 2 + normal.y * distance, z: normal.z * distance },
    target: { x: 0, y: 2, z: 0 } };
}

/** Subtle placement halves remain separate from the cached arena and all cuttable actors. */
export function createWarOverlay(arenaId = 'bonefields') {
  const size = getArenaSize(arenaId);
  const group = new THREE.Group(); group.name = 'war-placement-zones';
  for (const [index, team] of ['blue', 'red'].entries()) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size.halfWidth - .5, size.depth - .6),
      new THREE.MeshBasicMaterial({ color: WAR_TEAM_COLORS[team], transparent: true, opacity: .24, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    mesh.name = `war-${team}-deployment-zone`; mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((index ? 1 : -1) * size.halfWidth / 2, .12, 0); group.add(mesh);
  }
  const points = [];
  for (let z = -size.halfDepth + .5; z < size.halfDepth; z += 1.5) {
    const end = Math.min(z + .8, size.halfDepth);
    points.push(-.09, .14, z, -.09, .14, end, .09, .14, z, .09, .14, z, -.09, .14, end, .09, .14, end);
  }
  const line = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3)),
    new THREE.MeshBasicMaterial({ color: 0xfff4c9, transparent: true, opacity: .95, depthWrite: false }));
  line.name = 'war-deployment-centerline'; group.add(line); group.visible = false;
  let disposed = false;
  group.userData.dispose = () => {
    if (disposed) return; disposed = true;
    group.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
  };
  return group;
}
