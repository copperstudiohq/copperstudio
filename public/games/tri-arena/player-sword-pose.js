import * as THREE from './assets/three.module.js';
import { bladeSweep } from './voxel-body.js';
import { SWING_ARC } from './sword-config.js';

const frame = new THREE.Matrix4();
const direction = new THREE.Vector3(), edge = new THREE.Vector3(), flat = new THREE.Vector3();
const rootQuaternion = new THREE.Quaternion(), parentQuaternion = new THREE.Quaternion();
const desired = new THREE.Quaternion(), swing = new THREE.Quaternion();
const idle = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), .35);
const smooth = (a, b, value) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Aim the hand-held world sword through the same frame as its timed voxel contact. */
export function posePlayerSword(model, { progress = -1, tilt = 0, pitch = 0, blocking = false } = {}) {
  const { rightArm: arm, sword } = model?.userData || {};
  if (!arm || !sword?.parent) throw new TypeError('Player sword pose requires an attached sword and right arm.');
  if (![tilt, pitch].every(Number.isFinite)) throw new TypeError('Player sword angles must be finite.');
  const active = Number.isFinite(progress) && progress >= 0 && progress < 1 && !blocking;
  const weight = active ? smooth(0, .12, progress) * (1 - smooth(.64, 1, progress)) : 0;
  const phi = -SWING_ARC + 2 * SWING_ARC * smooth(.08, .58, active ? progress : 0);
  arm.rotation.set(-.55 + weight * (-1.07 + pitch * .25 + .1 * Math.sin(phi)),
    -.18 * Math.sin(phi) * Math.cos(tilt) * weight, .15 * Math.sin(phi) * Math.sin(tilt) * weight);
  if (blocking) arm.rotation.set(-1.1, -.35, -.45);

  const { forward, travel } = bladeSweep({ pitch, tilt });
  direction.copy(forward).multiplyScalar(Math.cos(phi)).addScaledVector(travel, Math.sin(phi));
  edge.copy(travel).multiplyScalar(Math.cos(phi)).addScaledVector(forward, -Math.sin(phi));
  flat.crossVectors(edge, direction);
  frame.makeBasis(edge, direction, flat);
  swing.setFromRotationMatrix(frame);
  desired.copy(idle).slerp(swing, weight);
  // Counter the arm's rotation at the wrist, leaving the grip attached to the human hand.
  model.updateWorldMatrix(true, true);
  model.getWorldQuaternion(rootQuaternion);
  sword.parent.getWorldQuaternion(parentQuaternion);
  desired.premultiply(rootQuaternion);
  sword.quaternion.copy(parentQuaternion.invert().multiply(desired));
  sword.updateWorldMatrix(false, true);
}
