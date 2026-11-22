import * as T from './vendor/three.module.js';

const ovalShape = new T.SphereGeometry(1, 12, 8);
const nailShape = new T.ConeGeometry(1, 1, 8);
const scaleShape = new T.IcosahedronGeometry(1, 0);
const materials = (color) => new T.MeshStandardMaterial({ color, roughness: .9 });
const shades = {
  woodcutter: { ancestry: 'dwarf', palm: '#b07f62', knuckle: '#96624d', tip: '#d0a481', width: 1.30, length: .80 },
  weaver: { ancestry: 'elf', palm: '#ccb5a2', knuckle: '#b99685', tip: '#f0d7b9', width: .79, length: 1.29 },
  common: { ancestry: 'orc', palm: '#777f46', knuckle: '#586538', tip: '#342f25', width: 1.34, length: 1.04 },
  apothecary: { ancestry: 'lizardfolk', palm: '#45837c', knuckle: '#2a5c56', tip: '#d5c79e', width: 1.02, length: 1.03, claw: .018, finish: 'scales' },
  hunter: { ancestry: 'goblin-orc', palm: '#828b56', knuckle: '#546141', tip: '#b3a077', width: 1.18, length: 1.15, claw: .013, finish: 'calluses' },
  keeper: { ancestry: 'tiefling', palm: '#a95858', knuckle: '#71343e', tip: '#301b2a', width: .93, length: 1.18, claw: .028, finish: 'ridges' },
  croft: { ancestry: 'goblin', palm: '#859653', knuckle: '#59693d', tip: '#a68a54', width: .81, length: 1.09, claw: .014 },
  woodland: { ancestry: 'dwarf', palm: '#49372c', knuckle: '#644b39', tip: '#39291f', width: 1.21, length: .95, gloves: true },
};
const palette = Object.fromEntries(Object.entries(shades).map(([house, tone]) => [house, {
  ...tone, skin: materials(tone.palm), joints: materials(tone.knuckle), nails: materials(tone.tip),
}]));

function piece(parent, shape, finish, x, y, z, width, height, length) {
  const mesh = new T.Mesh(shape, finish);
  mesh.position.set(x, y, z);
  mesh.scale.set(width, height, length);
  parent.add(mesh);
  return mesh;
}

function batchFingers(hand) {
  const batches = new Map();
  for (const part of hand.children) {
    const key = part.geometry.id + ':' + part.material.id + ':' + part.name;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(part);
  }
  for (const parts of batches.values()) {
    if (parts.length < 2) continue;
    const { geometry, material, name } = parts[0];
    const mesh = new T.InstancedMesh(geometry, material, parts.length);
    mesh.name = name;
    parts.forEach((part, index) => {
      part.updateMatrix();
      mesh.setMatrixAt(index, part.matrix);
    });
    hand.remove(...parts);
    hand.add(mesh);
  }
}

export function createVillagerHand(parent, houseId, side) {
  const look = palette[houseId];
  const hand = new T.Group();
  hand.name = look.gloves ? 'Leather glove' : 'Mixed human and ' + look.ancestry + ' hand';
  hand.userData.ancestry = look.ancestry;
  parent.add(hand);
  hand.scale.set(look.width, 1, look.length);
  piece(hand, ovalShape, look.skin, 0, 0, -.014, .042, .022, .048);
  piece(hand, ovalShape, look.skin, -side * .043, -.004, .003, .019, .015, .029).rotation.y = -side * .49;
  if (look.gloves) {
    piece(hand, ovalShape, look.nails, 0, -.002, -.051, .047, .027, .024).name = 'Leather glove cuff';
  } else {
    piece(hand, ovalShape, look.nails, -side * .054, .004, .017, .011, .004, .012).rotation.y = -side * .43;
  }
  const fingerLengths = [.036, .042, .038, .027];
  for (const [index, length] of fingerLengths.entries()) {
    const x = (index - 1.5) * .021 * side;
    const offset = index === 3 ? -.005 : 0;
    const digit = .0097 - index * .0008;
    piece(hand, ovalShape, look.joints, x, .010, .017 + offset, digit * 1.13, .017, .018);
    piece(hand, ovalShape, look.skin, x, -.002, .029 + length * .45 + offset, digit, .011, length * .64).rotation.x = .13;
    if (look.claw) {
      const claw = piece(hand, nailShape, look.nails, x, .000, .028 + length * 1.02 + offset, digit, look.claw, .007);
      claw.rotation.x = Math.PI / 2 + .29;
      claw.name = 'Claw';
    } else if (!look.gloves) {
      piece(hand, ovalShape, look.nails, x, .007, .025 + length + offset, digit * .72, .003, .010);
    }
  }
  if (look.finish === 'scales') {
    for (let row = 0; row < 3; row++) for (let column = -1; column <= 1; column++) {
      const scale = piece(hand, scaleShape, look.joints, column * .021 + (row % 2) * .004,
        .021 - Math.abs(column) * .003, -.035 + row * .021, .012, .005, .013);
      scale.rotation.y = .44;
      scale.name = 'Hand scale';
    }
  }
  if (look.finish === 'calluses') {
    for (let i = 0; i < 4; i++) {
      const risen = piece(hand, ovalShape, look.joints, (i - 1.5) * .020 * side, .026, .018, .009, .005, .012);
      risen.rotation.y = (i - 1.5) * .13;
      risen.name = 'Raised goblin-orc knuckle';
    }
  }
  if (look.finish === 'ridges') {
    for (let i = 0; i < 3; i++) {
      const ridge = piece(hand, ovalShape, look.joints, (i - 1) * .020, .020, -.019, .007, .009, .036);
      ridge.rotation.y = (i - 1) * .14;
      ridge.name = 'Hand ridge';
    }
  }
  batchFingers(hand);
  return hand;
}
