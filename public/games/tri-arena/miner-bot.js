import * as THREE from './assets/three.module.js';
import { createColosseumEnemy, animateColosseumEnemy } from './colosseum-enemies.js';
import { registerGroundSupports } from './ground-support.js';

export const MINER_BOT_TYPE = 'miner-bot';
const cube = new THREE.BoxGeometry(1, 1, 1);
const materials = Object.fromEntries(Object.entries({ copper: 0xbc7446, edge: 0xe6a46b, dark: 0x253739,
  wood: 0x68442e, steel: 0xb9d2d0, ore: 0x62b8d5, lamp: 0x8ce8ff }).map(([name, color]) => [name,
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: name === 'wood' ? .9 : .5,
    metalness: name === 'wood' ? 0 : .65 })]));
materials.lamp.emissive.set(0x2fa5f2); materials.lamp.emissiveIntensity = 1.1;

function block(parent, name, material, position, size, anatomy = 'body', weapon = false) {
  const mesh = new THREE.Mesh(cube, materials[material]); mesh.name = name;
  mesh.position.set(...position); mesh.scale.set(...size);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { severable: true, anatomicalPart: anatomy, ...(weapon ? { weaponId: 'sword' } : {}) };
  parent.add(mesh); return mesh;
}

/** Reuse the proven hand/leg rig, with an actual mining tool in the same fist. */
export function createMinerBot() {
  const root = createColosseumEnemy('copper-robot'), data = root.userData;
  root.name = MINER_BOT_TYPE;
  Object.assign(data, { type: MINER_BOT_TYPE, minerBot: true, displayName: 'Miner Bot' });
  const pickaxe = data.sword; pickaxe.name = 'miner-pickaxe';
  for (const part of [...pickaxe.children]) part.removeFromParent();
  const handle = block(pickaxe, 'miner-pickaxe-wooden-handle', 'wood', [0, .2, 0], [.14, 1.1, .16], 'arm', true);
  block(pickaxe, 'miner-pickaxe-grip-wrap', 'dark', [0, -.04, 0], [.16, .33, .18], 'arm', true);
  block(pickaxe, 'miner-pickaxe-copper-neck', 'copper', [0, .78, 0], [.21, .2, .22], 'arm', true);
  const head = block(pickaxe, 'miner-pickaxe-cross-head', 'steel', [0, .94, 0], [.78, .2, .24], 'arm', true);
  const tips = [-1, 1].map(side => {
    const tip = block(pickaxe, `miner-pickaxe-curved-tip-${side < 0 ? 'left' : 'right'}`, 'steel',
      [side * .46, .84, 0], [.34, .14, .2], 'arm', true);
    tip.rotation.z = -side * .5; return tip;
  });
  pickaxe.userData = { grip: handle, handle, head, blade: head, tips };
  data.pickaxe = pickaxe;

  const hat = new THREE.Group(); hat.name = 'miner-hardhat'; data.head.add(hat);
  block(hat, 'miner-hardhat-wide-brim', 'edge', [0, 2.4, 0], [.98, .13, .83], 'head');
  block(hat, 'miner-hardhat-copper-crown', 'copper', [0, 2.5, -.02], [.8, .18, .68], 'head');
  block(hat, 'miner-hardhat-top-ridge', 'edge', [0, 2.61, -.02], [.52, .09, .52], 'head');
  block(hat, 'miner-headlamp-housing', 'dark', [0, 2.49, .43], [.28, .25, .19], 'head');
  const lamp = block(hat, 'miner-headlamp-blue-lens', 'lamp', [0, 2.49, .545], [.17, .15, .055], 'head');
  const pack = new THREE.Group(); pack.name = 'miner-ore-backpack'; data.body.add(pack);
  block(pack, 'miner-backpack-case', 'dark', [0, 1.45, -.46], [.66, .76, .4]);
  for (const side of [-1, 1]) {
    block(pack, 'miner-backpack-copper-rail', 'copper', [side * .29, 1.48, -.69], [.1, .84, .1]);
    block(data.body, 'miner-leather-shoulder-strap', 'wood', [side * .25, 1.5, .29], [.11, .65, .08]);
    const ore = block(pack, 'miner-backpack-blue-ore', 'ore', [side * .17, 1.94, -.47], [.23, .27, .23]);
    ore.rotation.z = side * .24;
  }
  block(pack, 'miner-backpack-lower-band', 'edge', [0, 1.15, -.68], [.74, .12, .12]);
  Object.assign(data, { hardhat: hat, headlamp: lamp, backpack: pack });
  registerGroundSupports(root, data.legs);
  return root;
}

/** Canonical planted walk and smooth anticipation/swing/recovery retain the real pick grip. */
export function animateMinerBot(root, time, speed = 0, phase = 'chase', motion = {}) {
  animateColosseumEnemy(root, time, speed, phase, motion);
}
