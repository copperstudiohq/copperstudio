/** Distance at which Three's exp² fog leaves at most the requested contrast.
 * Fog is measured along the camera's forward axis, rather than radial distance.
 */
export function fogVisibilityDepth(density, remainingContrast = .0001) {
  if (!Number.isFinite(density) || density <= 0 || !Number.isFinite(remainingContrast)
    || remainingContrast <= 0 || remainingContrast >= 1) return Infinity;
  return Math.sqrt(-Math.log(remainingContrast)) / density;
}

/** Conservative nearest view depth of a sphere, including off-axis geometry. */
export function sphereViewDepth(center, radius, camera, direction) {
  return (center.x - camera.x) * direction.x + (center.y - camera.y) * direction.y
    + (center.z - camera.z) * direction.z - radius;
}

/** Conservative nearest view depth of a static world-axis bounding box. */
export function boxViewDepth(box, camera, direction) {
  const x = direction.x >= 0 ? box.min.x : box.max.x;
  const y = direction.y >= 0 ? box.min.y : box.max.y;
  const z = direction.z >= 0 ? box.min.z : box.max.z;
  return (x - camera.x) * direction.x + (y - camera.y) * direction.y + (z - camera.z) * direction.z;
}

/** Rebuild selected instance bounds only when their matrices/count are uploaded.
 * The full local X/Z shader displacement is transformed by each instance's
 * columns, preserving tilted roots and nonuniform scale without sampling time.
 * @param {import('./vendor/three.module.js').InstancedMesh} mesh
 * @param {number} [maxX] Maximum absolute local-X vertex displacement.
 * @param {number} [maxZ] Maximum absolute local-Z vertex displacement.
 */
export function updateInstancedWindBounds(mesh, maxX = 0, maxZ = 0) {
  if (![maxX, maxZ].every((value) => Number.isFinite(value) && value >= 0))
    throw new RangeError("Instance wind bounds need finite nonnegative displacement limits.");
  mesh.computeBoundingSphere();
  if (!mesh.count || (!maxX && !maxZ)) return;
  const matrix = mesh.instanceMatrix.array;
  let padding = 0;
  for (let offset = 0; offset < mesh.count * 16; offset += 16) {
    const x2 = matrix[offset] ** 2 + matrix[offset + 1] ** 2 + matrix[offset + 2] ** 2;
    const z2 = matrix[offset + 8] ** 2 + matrix[offset + 9] ** 2 + matrix[offset + 10] ** 2;
    const xz = matrix[offset] * matrix[offset + 8] + matrix[offset + 1] * matrix[offset + 9]
      + matrix[offset + 2] * matrix[offset + 10];
    padding = Math.max(padding, Math.sqrt(maxX * maxX * x2 + maxZ * maxZ * z2
      + 2 * maxX * maxZ * Math.abs(xz)));
  }
  mesh.boundingSphere.radius += padding;
}
