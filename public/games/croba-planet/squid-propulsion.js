import * as THREE from './vendor/three.module.js';
import { getSquidOrientation } from './squid-frame.js';
import { SQUID_SIPHON_ANCHORS, getSquidPropulsionState } from './squid-propulsion-anatomy.js';

const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

function finGeometry() {
  const vertices = [], colors = [], uvs = [], indices = [];
  for (let row = 0; row <= 8; row++) for (let column = 0; column <= 6; column++) {
    const u = row / 8, v = column / 6;
    const span = Math.sqrt(Math.max(0, 1 - u * u));
    const curl = Math.sin(Math.PI * u) * (.06 * Math.sin(Math.PI * v) + .02 * Math.sin(v * Math.PI * 6));
    vertices.push(.70 * u, (v - .5) * .80 * span, -.12 * u + curl);
    const vein = column === 3 ? 1 : .76;
    colors.push(vein, vein, vein); uvs.push(u, v);
    if (row < 8 && column < 6) {
      const a = row * 7 + column, b = a + 7;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

function waterGeometry() {
  const geometry = new THREE.ConeGeometry(1, 1, 10, 1, true);
  const colors = [], positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index++) {
    const along = positions.getY(index) + .5;
    colors.push(1, 1, 1, (1 - along) ** 2);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
  return geometry;
}

/** Rear nozzles and water jets read simulation state; redraws never advance
 * time. The archived side-fin batch stays empty and submits no draw. */
export class SquidPropulsion {
  /** @param {object[]} squids @param {Record<string, THREE.Material>} materials */
  constructor(squids, materials) {
    this.group = new THREE.Group(); this.group.name = 'squid-fins-and-water-jets';
    this.ids = squids.map(squid => squid.id);
    this.transform = new THREE.Object3D(); this.rotation = new THREE.Quaternion();
    this.center = new THREE.Vector3();
    this.geometries = {
      fin: finGeometry(), funnel: new THREE.CylinderGeometry(.12, .19, .26, 12, 1, true),
      rim: new THREE.TorusGeometry(.12, .024, 6, 12), bore: new THREE.SphereGeometry(1, 12, 8),
      water: waterGeometry(),
    };
    const shell = materials.blue.clone(), membrane = materials.blue.clone(), bore = materials.black.clone();
    shell.side = THREE.DoubleSide;
    membrane.side = THREE.DoubleSide; membrane.vertexColors = true; membrane.roughness = .65;
    this.materials = { shell, membrane, bore, water: new THREE.MeshBasicMaterial({
      color: 0x9cdbef, transparent: true, opacity: .13, depthWrite: false,
      side: THREE.DoubleSide, vertexColors: true,
    }) };
    this.materials.water.forceSinglePass = true;
    this.batches = {};
    for (const [name, material] of Object.entries({ fin: membrane, funnel: shell, rim: shell, bore, water: this.materials.water })) {
      const mesh = new THREE.InstancedMesh(this.geometries[name], material, squids.length * 2);
      mesh.name = `squid-${name}`; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.receiveShadow = name !== 'water'; this.group.add(mesh); this.batches[name] = mesh;
    }
    this.batches.fin.visible = false;
    this.disposed = false;
  }

  /** Position, scale and local rotation are normalized to the mantle radius. */
  pose(mesh, index, squid, position, scale, rotation) {
    this.center.set(squid.x / 25, squid.z / 25, squid.y / 25);
    this.transform.position.set(...position).multiplyScalar(squid.headRadius / 25)
      .applyQuaternion(this.rotation).add(this.center);
    this.transform.quaternion.copy(this.rotation);
    this.transform.rotateX(rotation[0]); this.transform.rotateY(rotation[1]); this.transform.rotateZ(rotation[2]);
    this.transform.scale.set(...scale).multiplyScalar(squid.headRadius / 25);
    this.transform.updateMatrix(); mesh.setMatrixAt(index, this.transform.matrix);
  }

  update(world, visible, reducedMotion = false) {
    if (this.disposed) return;
    const squids = [...(world.squids ?? []), ...(world.adultSquids ?? [])];
    let any = false;
    this.ids.forEach((id, index) => {
      const squid = squids.find(entry => entry.id === id), show = squid && !(squid.squidRespawnIn > 0) && visible(id);
      any ||= Boolean(show); this.rotation.copy(getSquidOrientation(squid ?? {}));
      const { moving, pulse, underwater } = getSquidPropulsionState(squid);
      for (let side = 0; side < 2; side++) {
        const slot = index * 2 + side;
        if (!show) {
          for (const mesh of Object.values(this.batches)) mesh.setMatrixAt(slot, ZERO);
          continue;
        }
        const anchor = SQUID_SIPHON_ANCHORS[side];
        this.pose(this.batches.funnel, slot, squid, anchor, [1, 1, 1], [Math.PI / 2, 0, 0]);
        this.pose(this.batches.rim, slot, squid, [anchor[0], anchor[1], -1.15], [1, 1, 1], [0, Math.PI, 0]);
        this.pose(this.batches.bore, slot, squid, [anchor[0], anchor[1], -1.145], [.112, .112, .018], [0, 0, 0]);
        this.batches.fin.setMatrixAt(slot, ZERO);
        if (underwater && moving && (reducedMotion || pulse > .04)) {
          const length = reducedMotion ? .9 : .45 + pulse * 1.3;
          this.pose(this.batches.water, slot, squid, [anchor[0], anchor[1], -1.16 - length / 2],
            [.12, length, .12], [-Math.PI / 2, 0, 0]);
        } else this.batches.water.setMatrixAt(slot, ZERO);
      }
    });
    this.group.visible = any;
    for (const mesh of Object.values(this.batches)) {
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
    }
  }

  /** Material clones borrow maps from the colony; only the colony owns those maps. */
  dispose() {
    if (this.disposed) return; this.disposed = true;
    for (const mesh of Object.values(this.batches)) mesh.dispose();
    Object.values(this.geometries).forEach(geometry => geometry.dispose());
    Object.values(this.materials).forEach(material => material.dispose());
    this.group.removeFromParent(); this.group.clear();
  }
}
