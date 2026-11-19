import * as THREE from "./vendor/three.module.js";
import { boxViewDepth, fogVisibilityDepth } from "./render-visibility.js";
import { getForestHeight } from "./forest-terrain.js";
import { pointInPolygon } from "./terrain.js";

export const SEABED_CHUNK_METERS = 64;

/** @typedef {{id:string,geometry?:THREE.BufferGeometry,sourceIndices:Map<number,Uint32Array>,bounds:THREE.Box3,visible?:boolean,buried?:boolean}} SeabedChunk */

/** Partition complete source triangles without changing positions, normals, UVs
 * or material membership. Collision keeps the same prepared heightfield.
 * @param {THREE.BufferGeometry} source @param {number} [size] Chunk width in metres.
 * @param {{copyAttributes?:boolean}} [options] Offline meshes can retain their own attributes; live batches use source indices only.
 * @returns {SeabedChunk[]}
 */
export function partitionSeabedGeometry(source, size = SEABED_CHUNK_METERS, { copyAttributes = true } = {}) {
  if (!Number.isFinite(size) || size <= 0) throw new RangeError("Seabed chunks need a finite positive width.");
  const position = source?.attributes?.position;
  if (!source?.isBufferGeometry || source.index || position?.itemSize !== 3 || position.count % 3)
    throw new TypeError("Seabed chunks need complete non-indexed terrain triangles.");
  const attributes = Object.entries(source.attributes);
  if (attributes.some(([, attribute]) => attribute.isInterleavedBufferAttribute || attribute.count !== position.count))
    throw new TypeError("Seabed attributes must have one non-interleaved value for every terrain vertex.");
  const buckets = new Map();
  const groups = source.groups.length ? source.groups : [{ start: 0, count: position.count, materialIndex: 0 }];
  for (const group of groups) {
    if (group.start % 3 || group.count % 3 || group.start < 0 || group.start + group.count > position.count)
      throw new RangeError("Seabed material groups must contain complete in-range triangles.");
    for (let start = group.start; start < group.start + group.count; start += 3) {
      const x = (position.getX(start) + position.getX(start + 1) + position.getX(start + 2)) / 3;
      const z = (position.getZ(start) + position.getZ(start + 1) + position.getZ(start + 2)) / 3;
      const id = `${Math.floor(x / size)}:${Math.floor(z / size)}`;
      if (!buckets.has(id)) buckets.set(id, new Map());
      const materials = buckets.get(id), material = group.materialIndex ?? 0;
      if (!materials.has(material)) materials.set(material, []);
      materials.get(material).push(start, start + 1, start + 2);
    }
  }
  const chunks = [];
  const point = new THREE.Vector3();
  for (const [id, materials] of buckets) {
    const vertices = [...materials.values()].flat(), bounds = new THREE.Box3();
    for (const vertex of vertices) bounds.expandByPoint(point.fromBufferAttribute(position, vertex));
    let geometry;
    if (copyAttributes) {
      geometry = new THREE.BufferGeometry(); geometry.name = `seabed-chunk:${id}`;
      for (const [name, attribute] of attributes) {
        const values = new attribute.array.constructor(vertices.length * attribute.itemSize);
        for (let index = 0; index < vertices.length; index++) {
          const sourceOffset = vertices[index] * attribute.itemSize;
          for (let component = 0; component < attribute.itemSize; component++)
            values[index * attribute.itemSize + component] = attribute.array[sourceOffset + component];
        }
        geometry.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize, attribute.normalized));
      }
      let start = 0;
      for (const [material, entries] of materials) {
        geometry.addGroup(start, entries.length, material); start += entries.length;
      }
      geometry.boundingBox = bounds.clone(); geometry.computeBoundingSphere();
    }
    bounds.max.y += 0.012; // Include the matching caustic layer's vertical offset.
    chunks.push({ id, geometry, bounds,
      sourceIndices: new Map([...materials].map(([material, entries]) => [material, new Uint32Array(entries)])) });
  }
  return chunks;
}

/** One terrain vertex buffer, two material draws and one matching caustic draw.
 * Only the pooled index prefix changes when the camera's visible tiles change.
 * @param {THREE.BufferGeometry} geometry
 */
export function createSeabedBatch(geometry) {
  const materialIndices = [...new Set(geometry.groups.map((group) => group.materialIndex ?? 0))];
  if (!materialIndices.length) materialIndices.push(0);
  const chunks = partitionSeabedGeometry(geometry, SEABED_CHUNK_METERS, { copyAttributes: false });
  const index = new THREE.BufferAttribute(new Uint32Array(geometry.attributes.position.count), 1);
  for (let vertex = 0; vertex < index.count; vertex++) index.array[vertex] = vertex;
  index.setUsage(THREE.DynamicDrawUsage); geometry.setIndex(index);
  geometry.setDrawRange(0, index.count); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  const caustics = new THREE.BufferGeometry();
  caustics.setAttribute("position", geometry.attributes.position); caustics.setIndex(index); caustics.setDrawRange(0, index.count);
  caustics.boundingBox = geometry.boundingBox.clone(); caustics.boundingSphere = geometry.boundingSphere.clone();
  return { geometry, caustics, chunks, index, materialIndices, initialized: false };
}

/** Omit only seabed hidden inside the prepared forest's solid, hole-free land.
 * A circle enclosing the complete tile must lie strictly inside the coastline,
 * and even the lowest forest top must exceed the tile's highest terrain point.
 * Coastal tiles are retained, including concave shorelines and submerged beaches.
 * @param {SeabedChunk[]|undefined} chunks @param {object} forest
 */
export function markBuriedSeabedChunks(chunks, forest) {
  if (!chunks?.length) return;
  for (const chunk of chunks) chunk.buried = false;
  const boundary = forest?.coast?.coreBoundary ?? forest?.boundary;
  if (!forest?.mesh || !boundary?.length) return;
  const { positions, indices } = forest.mesh;
  // The submerged coastal apron remains visible. Only solid inland ground can
  // hide floor tiles; its original minimum is independent of the new deep ramp.
  const surfaceIndexCount = forest.coast?.coreSurfaceIndexCount
    ?? forest.mesh.surfaceIndexCount ?? indices.length;
  let minimumTop = Infinity;
  for (let index = 0; index < surfaceIndexCount; index++)
    minimumTop = Math.min(minimumTop, positions[indices[index] * 3 + 2]);
  for (const chunk of chunks) {
    if (!Number.isFinite(minimumTop) || minimumTop <= chunk.bounds.max.y * 25) continue;
    const x = (chunk.bounds.min.x + chunk.bounds.max.x) * 12.5;
    const y = (chunk.bounds.min.z + chunk.bounds.max.z) * 12.5;
    const radius = Math.hypot(chunk.bounds.max.x - chunk.bounds.min.x, chunk.bounds.max.z - chunk.bounds.min.z) * 12.5;
    if (!pointInPolygon(boundary, x, y) || getForestHeight(forest, x, y) === null) continue;
    let clearance = Infinity;
    for (let index = 0; index < boundary.length; index++) {
      const a = boundary[index], b = boundary[(index + 1) % boundary.length];
      const dx = b.x - a.x, dy = b.y - a.y;
      const along = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
      clearance = Math.min(clearance, Math.hypot(x - a.x - along * dx, y - a.y - along * dy));
    }
    chunk.buried = clearance > radius + 0.01;
  }
}

const cameras = new WeakMap();

/** Keep matching seabed and caustic chunks in the same conservative camera/fog
 * visibility set. Cached camera math avoids temporary allocations every draw.
 * @param {SeabedChunk[]|undefined} chunks @param {THREE.Camera} camera @param {number} density
 */
export function updateSeabedChunkVisibility(chunks, camera, density, maxDistance = Infinity) {
  if (!chunks?.length) return false;
  if (typeof maxDistance !== 'number' || Number.isNaN(maxDistance) || maxDistance < 0)
    throw new RangeError('Seabed render distance must be nonnegative.');
  let state = cameras.get(camera);
  if (!state) {
    state = { matrix: new THREE.Matrix4(), frustum: new THREE.Frustum(), position: new THREE.Vector3(), direction: new THREE.Vector3() };
    cameras.set(camera, state);
  }
  camera.updateMatrixWorld();
  state.matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  state.frustum.setFromProjectionMatrix(state.matrix);
  camera.getWorldPosition(state.position); camera.getWorldDirection(state.direction);
  const depth = fogVisibilityDepth(density);
  let changed = false;
  for (const chunk of chunks) {
    const visible = !chunk.buried && chunk.bounds.distanceToPoint(state.position) <= maxDistance
      && boxViewDepth(chunk.bounds, state.position, state.direction) < depth
      && state.frustum.intersectsBox(chunk.bounds);
    changed ||= visible !== chunk.visible;
    chunk.visible = visible;
  }
  return changed;
}

/** @param {ReturnType<typeof createSeabedBatch>|undefined} batch @param {THREE.Camera} camera @param {number} density */
export function updateSeabedBatchVisibility(batch, camera, density, maxDistance = Infinity) {
  if (!batch) return;
  const changed = updateSeabedChunkVisibility(batch.chunks, camera, density, maxDistance);
  if (!changed && batch.initialized) return;
  batch.initialized = true;
  let count = 0;
  batch.geometry.clearGroups();
  for (const material of batch.materialIndices) {
    const start = count;
    for (const chunk of batch.chunks) {
      if (!chunk.visible) continue;
      const entries = chunk.sourceIndices.get(material);
      if (entries) { batch.index.array.set(entries, count); count += entries.length; }
    }
    if (count > start) batch.geometry.addGroup(start, count - start, material);
  }
  batch.geometry.setDrawRange(0, count); batch.caustics.setDrawRange(0, count);
  batch.index.clearUpdateRanges();
  if (count) { batch.index.addUpdateRange(0, count); batch.index.needsUpdate = true; }
}
