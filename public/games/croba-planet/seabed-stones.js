import * as THREE from './vendor/three.module.js';
import {createWeatheredRockGeometry} from './weathered-rock-geometry.js';
import {PREPARED_SEABED_STONES as ORIGINAL_STONES} from './seabed-stone-data.js';
import {SHELL_FIELD_STONES} from './shell-field-placements.js';
export const PREPARED_SEABED_STONES=Object.freeze(ORIGINAL_STONES.map(stone=>SHELL_FIELD_STONES[stone.id]
  ?Object.freeze({...stone,...SHELL_FIELD_STONES[stone.id]}):stone));

/** Rendering and climbing use the same exact low-poly stone prototype. */
export function createSeabedStoneGeometry(){return createWeatheredRockGeometry(1,{centered:true});}

/** Immutable authored pose; a reused Object3D avoids per-contact allocations.
 * @param {{x:number,y:number,z:number,radius:number,heading:number}} stone
 * @param {THREE.Object3D} [target]
 */
export function getSeabedStonePose(stone,target=new THREE.Object3D()){
 if(![stone.x,stone.y,stone.z,stone.radius,stone.heading].every(Number.isFinite)||stone.radius<=0)
  throw new TypeError('Seabed stones require a finite position, heading and positive radius.');
 target.position.set(stone.x/25,stone.z/25,stone.y/25);
 target.scale.set(stone.radius*1.4,stone.radius*.55,stone.radius);
 target.rotation.set(0,stone.heading,0);target.updateMatrix();return target;
}
