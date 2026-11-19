import * as THREE from './vendor/three.module.js';
import { getSquidClawAxis } from './squid-claw-anatomy.js';
const UP = new THREE.Vector3(0, 1, 0);

/** All sixteen paired terminal hooks per adult share one opaque instanced draw. */
export class AdultSquidClaws {
  constructor(adults, material) {
    this.ids = adults.filter(squid => squid.designVersion === 2).map(squid => squid.id);
    const path = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(.30, .60, 0), new THREE.Vector3(.12, 1, 0)]);
    this.geometry = new THREE.TubeGeometry(path, 12, 1, 6, false);
    const positions = this.geometry.attributes.position, colors = [];
    for (let ring = 0; ring <= 12; ring++) {
      const t = ring / 12, center = path.getPointAt(t), radius = .19 * (1 - t) ** .8 + .001;
      for (let side = 0; side <= 6; side++) {
        const index = ring * 7 + side;
        const p = new THREE.Vector3().fromBufferAttribute(positions, index).sub(center).multiplyScalar(radius).add(center);
        positions.setXYZ(index, p.x, p.y, p.z);
        const color = new THREE.Color(t < .35 ? 0x345e9a : 0x101c2b);
        colors.push(color.r, color.g, color.b);
      }
    }
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.geometry.computeVertexNormals(); this.geometry.computeBoundingSphere();
    this.material = material.clone(); this.material.vertexColors = true;
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.ids.length * 16);
    this.mesh.name = 'adult-blue-terminal-pincer-claws';
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.transform = new THREE.Object3D(); this.direction = new THREE.Vector3();
    this.root = new THREE.Vector3(); this.unit = new THREE.Vector3();
    this.rotation = new THREE.Quaternion(); this.hidden = new THREE.Matrix4().makeScale(0, 0, 0);
    this.disposed = false;
  }
  update(world, visible) {
    if (this.disposed) return;
    this.ids.forEach((id, index) => {
      const squid = world.adultSquids?.find(squid => squid.id === id);
      for (let arm = 0; arm < 8; arm++) {
        const axis = squid && visible(id) && getSquidClawAxis(squid, arm);
        if (axis) {
          this.root.set(axis.root.x / 25, axis.root.z / 25, axis.root.y / 25);
          this.direction.set((axis.end.x - axis.root.x) / 25, (axis.end.z - axis.root.z) / 25,
            (axis.end.y - axis.root.y) / 25);
          this.rotation.setFromUnitVectors(UP, this.unit.copy(this.direction).normalize());
        }
        for (let finger = 0; finger < 2; finger++) {
          const slot = index * 16 + arm * 2 + finger;
          if (!axis) { this.mesh.setMatrixAt(slot, this.hidden); continue; }
          this.transform.position.copy(this.root);
          this.transform.quaternion.copy(this.rotation);
          if (finger) this.transform.rotateY(Math.PI);
          // A crab-like fixed finger opposes a hinged moving finger. At full
          // closure their hooked tips meet instead of crossing through each other.
          if (finger) this.transform.rotateZ(.24 * (squid.clawClosure?.[arm] ?? 0));
          this.transform.scale.setScalar(this.direction.length());
          this.transform.updateMatrix(); this.mesh.setMatrixAt(slot, this.transform.matrix);
        }
      }
    });
    this.mesh.instanceMatrix.needsUpdate = true; this.mesh.computeBoundingSphere();
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    this.mesh.dispose(); this.geometry.dispose(); this.material.dispose(); this.mesh.removeFromParent();
  }
}
