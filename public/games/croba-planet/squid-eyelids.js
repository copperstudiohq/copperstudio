import * as THREE from './vendor/three.module.js';
import { ADULT_SQUID_EYE_LAYOUT, ADULT_SQUID_HEAD_Y_SCALE } from './adult-squid-anatomy.js';

/** Seeded blink on the simulation clock. Pausing or redrawing cannot advance it. */
export function getSquidBlink(squid, reducedMotion = false) {
  if (reducedMotion || !(squid.propulsionTime > 0)) return 0;
  const interval = 5 + (squid.seed ?? 0) % 3;
  const phase = (squid.propulsionTime + ((squid.seed ?? 0) % 17) * .07) % interval;
  return phase < .28 ? Math.sin(Math.PI * phase / .28) ** 2 : 0;
}

export function createSquidEyelidGeometry() {
  const geometry = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = geometry.attributes.position;
  const colors = [], blue = new THREE.Color(0x3078bd);
  for (let i=0;i<p.count;i++) {
    const fold = 1 + .045 * Math.sin(Math.acos(Math.min(1,p.getY(i))) * 16);
    p.setZ(i,p.getZ(i)*fold);
    const shade = .88 + .12 * Math.sin(Math.acos(Math.min(1,p.getY(i))) * 16);
    colors.push(blue.r*shade,blue.g*shade,blue.b*shade);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

const transform = new THREE.Object3D(), normal = new THREE.Vector3(), rotation = new THREE.Quaternion();
const local = new THREE.Vector3(), forward = new THREE.Vector3(0,0,1);
/** Two overlapping folded skin lids per eye; closure covers the lens without
 * changing its yellow iris, dark outline or gaze direction. */
export function poseSquidEyelids(mesh, squid, reducedMotion) {
  const closure = .13 + .87 * getSquidBlink(squid,reducedMotion), scale=squid.eyeScale??.55;
  const height=squid.headYScale??ADULT_SQUID_HEAD_Y_SCALE;
  for(const [eye,[x,y]] of ADULT_SQUID_EYE_LAYOUT.entries()) {
    const z=Math.sqrt(1-x*x-y*y);
    normal.set(x,y/height,z).normalize().multiplyScalar(.65).add(forward.clone().multiplyScalar(.35)).normalize();
    rotation.setFromUnitVectors(forward,normal);
    for(const half of [0,1]) {
      const side=half?-1:1;
      local.set(0,side*.12*(1-closure),.020).multiplyScalar(scale).applyQuaternion(rotation);
      transform.position.set(x,y*height,z+.09*scale).add(local);
      transform.quaternion.copy(rotation);
      if(half)transform.rotateZ(Math.PI);
      transform.scale.set(.177*scale,.133*scale*closure,.145*scale);
      // The parent details group stretches its complete anatomy vertically.
      transform.position.y/=height;transform.scale.y/=height;
      transform.updateMatrix();mesh.setMatrixAt(eye*2+half,transform.matrix);
    }
  }
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
}
