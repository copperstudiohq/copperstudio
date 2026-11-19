import * as THREE from './assets/three.module.js';

const CUBE = new THREE.BoxGeometry(1, 1, 1);
const SURFACE = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85,
  blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
const PHYSICAL_BLUE = new THREE.MeshBasicMaterial({ color: 0x147bff });
const BLUE = new THREE.Color(0x147bff), CYAN = new THREE.Color(0x7adfff);
const MAX_LINKS = 32, PIXELS_PER_LINK = 5;
const posed = new THREE.Matrix4(), inverse = new THREE.Matrix4(), local = new THREE.Matrix4();
const offset = new THREE.Matrix4(), pixel = new THREE.Object3D();

/** Mesh anchors keep invisible physical pixels; Group anchors add visual-only links. */
export function addGolemJoint(model, anchor, adjacentParts, { phase = 0, name, size, offset: at = [0, 0, 0] } = {}) {
  if (!anchor?.isObject3D || !anchor.parent || !Array.isArray(adjacentParts) || !adjacentParts.length || adjacentParts.some(part => !part?.isMesh)) {
    throw new TypeError('A golem magic joint needs an attached anchor and adjacent armour meshes.');
  }
  const links = model.userData.golemMagic ||= [];
  if (links.length >= MAX_LINKS) throw new RangeError('Golem magic joint budget exceeded.');
  let dimensions = size ? new THREE.Vector3().fromArray(size) : new THREE.Vector3(.2, .2, .2);
  if (anchor.isMesh) {
    anchor.userData.renderHidden = true;
    anchor.material = PHYSICAL_BLUE;
    anchor.geometry.computeBoundingBox();
    if (!size) dimensions = anchor.geometry.boundingBox.getSize(dimensions);
  }
  if (![...dimensions.toArray(), ...at, phase].every(Number.isFinite) || dimensions.toArray().some(value => value <= 0) || at.length !== 3) {
    throw new RangeError('Golem magic dimensions, offset and phase must be finite and dimensions positive.');
  }
  if (!model.userData.golemMagicMesh) {
    const mesh = new THREE.InstancedMesh(CUBE, SURFACE, MAX_LINKS * PIXELS_PER_LINK);
    mesh.name = 'blue-golem-joint-magic'; mesh.userData.magicVisual = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false; mesh.count = 0;
    model.userData.golemMagicMesh = mesh;
    model.add(mesh);
  }
  const adjacent = adjacentParts.map(part => part.uuid);
  const link = { name: name || anchor.name + '-magic', anchor, size: dimensions,
    offset: new THREE.Vector3().fromArray(at), phase, adjacent,
    required: anchor.isMesh ? [anchor.uuid, ...adjacent] : adjacent };
  links.push(link);
  animateGolemMagic(model, 0);
  return link;
}

/** Deterministic blue flicker shares the simulation clock; detached links disappear. */
export function animateGolemMagic(model, time, partState) {
  const mesh = model.userData.golemMagicMesh;
  if (!mesh) return;
  const clock = Number.isFinite(time) ? time : 0;
  model.updateMatrixWorld(true);
  inverse.copy(model.matrixWorld).invert();
  let count = 0;
  for (const link of model.userData.golemMagic) {
    if (partState && link.required.some(id => !(partState[id]?.remaining > 0))) continue;
    const pulse = .7 + .17 * Math.sin(clock * 21 + link.phase) + .13 * Math.sin(clock * 47 + link.phase * 2.3);
    offset.makeTranslation(link.offset.x, link.offset.y, link.offset.z);
    posed.multiplyMatrices(inverse, link.anchor.matrixWorld).multiply(offset).scale(link.size);
    for (let index = 0; index < PIXELS_PER_LINK; index++) {
      const t = clock * 31 + link.phase + index * 1.8;
      if (index && Math.sin(t * 1.7) <= -.65) continue;
      pixel.position.set(Math.sin(clock * 39 + link.phase) * .04, 0, Math.sin(clock * 33 + link.phase * 1.7) * .04);
      if (index) {
        pixel.position.x += Math.sin(t) * .26;
        pixel.position.y += (index - 2.5) * .2;
        pixel.position.z += Math.cos(t * .8) * .26;
      }
      pixel.rotation.set(index ? Math.sin(t * .7) * .4 : 0, index ? t * .3 : 0, index ? Math.cos(t) * .5 : 0);
      pixel.scale.set(index ? .095 : .68 * pulse, index ? .36 + .08 * Math.sin(t * 1.3) : .92 * pulse, index ? .095 : .68 * pulse);
      pixel.updateMatrix();
      local.multiplyMatrices(posed, pixel.matrix);
      mesh.setMatrixAt(count, local);
      mesh.setColorAt(count++, index ? CYAN : BLUE);
    }
  }
  mesh.count = count;
  mesh.visible = count > 0;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}
