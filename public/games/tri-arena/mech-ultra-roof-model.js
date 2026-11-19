import * as THREE from './assets/three.module.js';
import { ULTRA_ROOF_MOUNTS } from './mech-ultra-roof-missiles.js';

const cube = new THREE.BoxGeometry(1, 1, 1);
const materials = {
  copper: new THREE.MeshStandardMaterial({ color: 0xa9673e, roughness: .7, metalness: .65 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x1b2429, roughness: .85, metalness: .4 }),
  edge: new THREE.MeshStandardMaterial({ color: 0xd49b60, roughness: .65, metalness: .7 }),
  ember: new THREE.MeshStandardMaterial({ color: 0xff6c20, emissive: 0xff3b08, emissiveIntensity: 1.4 }),
};

function block(parent, mount, suffix, material, position, size) {
  const mesh = new THREE.Mesh(cube, materials[material]);
  mesh.name = `${mount.id}-${suffix}`; mesh.position.set(...position); mesh.scale.set(...size);
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData = { severable: true, cutHits: 6, anatomicalPart: 'weapon', weaponId: mount.id,
    structuralId: mount.id, detailPriority: 28 };
  parent.add(mesh); return mesh;
}

export function createUltraRoofLaunchers(body) {
  return ULTRA_ROOF_MOUNTS.map(mount => {
    const launcher = new THREE.Group(); launcher.name = mount.id;
    launcher.position.set(mount.x, mount.y, mount.z); body.add(launcher);
    for (const side of [-1, 1]) block(launcher, mount, `support-${side}`, 'copper', [side * 1.25, -1.5, 0], [.5, 3, .5]);
    block(launcher, mount, 'armored-base', 'copper', [0, 0, 0], [3.2, 1.3, 3.2]);
    block(launcher, mount, 'black-launch-well', 'dark', [0, 1.6, 0], [2.2, 3.6, 2.2]);
    block(launcher, mount, 'launch-tube', 'edge', [0, 3, 0], [1.4, 2.6, 1.4]);
    const port = block(launcher, mount, 'ignition-port', 'ember', [0, 4.55, 0], [1.1, .25, 1.1]);
    const flaps = [-1, 1].map(side => {
      const hinge = new THREE.Group(); hinge.position.set(side * 1.35, .8, 0); launcher.add(hinge);
      block(hinge, mount, `hatch-${side}`, 'copper', [-side * .65, 0, 0], [1.4, .45, 2.9]);
      hinge.userData.side = side; return hinge;
    });
    const muzzle = new THREE.Object3D(); muzzle.position.y = mount.muzzleY - mount.y; launcher.add(muzzle);
    launcher.userData = { mount, flaps, port, muzzle }; return launcher;
  });
}

export function animateUltraRoofLaunchers(launchers, state = {}) {
  for (const launcher of launchers) {
    const index = launcher.userData.mount.index;
    const open = Math.max(0, Math.min(1, state.roofOpen?.[index] ?? 0));
    for (const flap of launcher.userData.flaps) flap.rotation.z = -flap.userData.side * open * 1.25;
    launcher.userData.port.scale.y = .25 + Math.max(0, state.roofFlash?.[index] ?? 0) * 2;
  }
}
