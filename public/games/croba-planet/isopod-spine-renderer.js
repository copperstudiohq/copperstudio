import * as THREE from './vendor/three.module.js';
import { ISOPOD_SPINE_Z, hasIsopodSpine, isopodSpineCoordinate } from './isopod-frame.js';

/** A small shared pose palette. Two RGBA texels per joint hold its position and
 * orientation in the animal's root frame. Shared meshes keep their nine draws.
 */
export class IsopodSpinePalette {
  constructor(capacity) {
    this.width = ISOPOD_SPINE_Z.length * 2;
    this.height = Math.max(1, capacity);
    this.data = new Float32Array(this.width * this.height * 4);
    this.texture = new THREE.DataTexture(this.data, this.width, this.height, THREE.RGBAFormat, THREE.FloatType);
    this.texture.name = 'gold-rock-bug-surface-spines';
    this.texture.minFilter = this.texture.magFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
    this.texture.needsUpdate = true;
    this.size = new THREE.Vector2(this.width, this.height);
    this.rows = new THREE.InstancedBufferAttribute(new Float32Array(capacity).fill(-1), 1).setUsage(THREE.DynamicDrawUsage);
    this.inverse = new THREE.Matrix4(); this.inverseQ = new THREE.Quaternion();
    this.position = new THREE.Vector3(); this.orientation = new THREE.Quaternion();
    this.disposed = false; this.dirty = false;
  }

  attach(geometry) {
    const pivots = geometry.attributes.isopodSegmentZ;
    const samples = new Float32Array(pivots.count);
    for (let i = 0; i < samples.length; i++) samples[i] = isopodSpineCoordinate(pivots.getX(i));
    geometry.setAttribute('isopodSpineSample', new THREE.BufferAttribute(samples, 1));
    geometry.setAttribute('isopodSpineRow', this.rows);
  }

  /** Reuse the same palette row as the renderer's compacted visible instance.
   * @param {number} index @param {object} pod @param {THREE.Object3D} root
   */
  write(index, pod, root) {
    const active = hasIsopodSpine(pod);
    this.rows.setX(index, active ? index : -1);
    if (!active) return false;
    this.dirty = true;
    this.inverse.copy(root.matrix).invert(); this.inverseQ.copy(root.quaternion).conjugate();
    for (let sample = 0; sample < ISOPOD_SPINE_Z.length; sample++) {
      const pose = pod.surfaceSpine[sample], offset = index * this.width * 4 + sample * 8;
      this.position.set(pose.position.x / 25, pose.position.z / 25, pose.position.y / 25).applyMatrix4(this.inverse);
      this.orientation.fromArray(pose.orientation).normalize().premultiply(this.inverseQ).normalize();
      this.position.toArray(this.data, offset); this.data[offset + 3] = 1;
      this.orientation.toArray(this.data, offset + 4);
    }
    return true;
  }

  commit() { this.rows.needsUpdate = true; if (this.dirty) this.texture.needsUpdate = true; this.dirty = false; }
  dispose() { if (!this.disposed) { this.disposed = true; this.texture.dispose(); } }
}
