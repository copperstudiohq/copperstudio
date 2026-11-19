import * as THREE from './assets/three.module.js';

/** Bake static meshes into material/shadow-compatible draws without changing their surface data. */
export function mergeStaticMeshes(root, { exclude = [], ownedGeometries = new Set(), freezeWorld = false } = {}) {
  if (!root?.traverse) throw new TypeError('Static batching requires a Three.js scene or group.');
  const excluded = new Set();
  for (const object of exclude) object?.traverse(part => excluded.add(part));
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(), sources = [], groups = new Map(), namedBounds = new Map();
  root.traverseVisible(mesh => {
    if (!mesh.isMesh || mesh.isInstancedMesh || mesh.isSkinnedMesh || excluded.has(mesh)
      || Array.isArray(mesh.material) || mesh.material.displacementMap || mesh.morphTargetInfluences
      || Object.values(mesh.geometry.attributes).some(attribute => attribute.isInterleavedBufferAttribute)) return;
    const attributes = Object.entries(mesh.geometry.attributes).map(([name, value]) => `${name}:${value.itemSize}:${value.normalized}`).sort().join(',');
    const key = `${mesh.material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}:${mesh.renderOrder}:${mesh.layers.mask}:${attributes}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(mesh); sources.push(mesh);
  });
  const sourceSet = new Set(sources);
  root.traverse(object => {
    if (!object.name || excluded.has(object)) return;
    let containsSource = false;
    object.traverseVisible(child => { if (sourceSet.has(child)) containsSource = true; });
    if (!containsSource) return;
    if (!namedBounds.has(object.name)) namedBounds.set(object.name, []);
    namedBounds.get(object.name).push({ name: object.name, position: object.getWorldPosition(new THREE.Vector3()),
      bounds: new THREE.Box3().setFromObject(object) });
  });
  const batches = [], ranges = [], consumed = new Set();
  let triangles = 0;
  for (const meshes of groups.values()) {
    const pieces = [];
    let count = 0;
    for (const mesh of meshes) {
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      const transform = new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld);
      geometry.applyMatrix4(transform);
      if (transform.determinant() < 0) {
        // Three flips front-face winding for mirrored source objects; preserve that after baking.
        for (const attribute of Object.values(geometry.attributes)) for (let vertex = 0; vertex < attribute.count; vertex += 3) {
          for (let component = 0; component < attribute.itemSize; component++) {
            const a = (vertex + 1) * attribute.itemSize + component, b = (vertex + 2) * attribute.itemSize + component;
            const value = attribute.array[a]; attribute.array[a] = attribute.array[b]; attribute.array[b] = value;
          }
        }
      }
      pieces.push(geometry);
      ranges.push({ sourceId: mesh.uuid, name: mesh.name, firstVertex: count, vertexCount: geometry.attributes.position.count,
        batchIndex: batches.length });
      count += geometry.attributes.position.count;
      consumed.add(mesh.geometry);
    }
    const geometry = new THREE.BufferGeometry();
    for (const [name, template] of Object.entries(pieces[0].attributes)) {
      const values = new template.array.constructor(count * template.itemSize);
      let offset = 0;
      for (const piece of pieces) { values.set(piece.attributes[name].array, offset); offset += piece.attributes[name].array.length; }
      geometry.setAttribute(name, new THREE.BufferAttribute(values, template.itemSize, template.normalized));
    }
    for (const piece of pieces) piece.dispose();
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    ownedGeometries.add(geometry);
    const source = meshes[0], batch = new THREE.Mesh(geometry, source.material);
    batch.name = 'static-world-batch';
    batch.castShadow = source.castShadow; batch.receiveShadow = source.receiveShadow;
    batch.renderOrder = source.renderOrder; batch.layers.mask = source.layers.mask;
    batch.frustumCulled = true;
    root.add(batch); batch.updateMatrixWorld(true);
    batch.matrixAutoUpdate = false; batch.matrixWorldAutoUpdate = !freezeWorld;
    batches.push(batch); triangles += count / 3;
  }
  for (const mesh of sources) mesh.removeFromParent();
  const remaining = new Set();
  root.traverse(object => { if (object.geometry) remaining.add(object.geometry); });
  for (const geometry of consumed) if (ownedGeometries.has(geometry) && !remaining.has(geometry)) {
    geometry.dispose(); ownedGeometries.delete(geometry);
  }
  function prune(group) {
    for (const child of [...group.children]) {
      if (!child.isGroup || excluded.has(child)) continue;
      prune(child);
      if (!child.children.length) group.remove(child);
    }
  }
  prune(root);
  return { sourceMeshCount: sources.length, batchMeshCount: batches.length, triangles, batches, ranges, namedBounds };
}
