import * as T from './vendor/three.module.js';
import { FLOOR_LEVEL, WALL_THICKNESS } from './house-plan.mjs';
import { seeded } from './layout.mjs';
import { repeatSurface } from './surfaces.mjs';

const potGeometry = new T.LatheGeometry([
  new T.Vector2(0, 0), new T.Vector2(.31, 0), new T.Vector2(.49, .34), new T.Vector2(.50, .58),
  new T.Vector2(.29, .77), new T.Vector2(.23, .97), new T.Vector2(.29, .99), new T.Vector2(.29, 1.05),
], 10);
const flameGeometry = new T.LatheGeometry([
  new T.Vector2(.07, 0), new T.Vector2(.49, .17), new T.Vector2(.40, .43),
  new T.Vector2(.23, .70), new T.Vector2(.027, 1), new T.Vector2(0, 1.03),
], 7);
const logGeometry = new T.CylinderGeometry(.42, .50, 1, 8);

const finish = (color, map = null, bump = 0) => new T.MeshStandardMaterial({
  color, map, bumpMap: bump ? map : null, bumpScale: bump, roughness: .91,
});
const glow = (color, intensity) => new T.MeshStandardMaterial({
  color, emissive: color, emissiveIntensity: intensity, roughness: .73,
});

export function roomMaterials(surfaces) {
  const grain = repeatSurface(surfaces.timber, .70, 1.52);
  const masonry = repeatSurface(surfaces.masonry, .83);
  return {
    boards: ['#dfac83', '#ba8d70', '#c59c78'].map((color) => finish(color, grain, .025)),
    wood: finish('#b29174', grain, .028),
    edge: finish('#856546', grain, .018),
    stone: finish('#b8ac9e', masonry, .043),
    soot: finish('#29211b', masonry, .015),
    cream: finish('#bfb199'),
    metal: finish('#4f453a'),
    brass: finish('#8f6941'),
    bottles: ['#7d8c63', '#ac744f', '#62776f'].map((color) => finish(color)),
    flame: [glow('#d74e12', 1.08), glow('#ff9c37', 1.62), glow('#ffd283', 2.02)],
    cloth: new Map(),
  };
}

function clothMaterial(materials, accent) {
  if (!materials.cloth.has(accent)) materials.cloth.set(accent, finish(accent));
  return materials.cloth.get(accent);
}

function mountedMesh(parent, geometry, material, x, y, z, sx, sy, sz, rotation = 0) {
  const mesh = new T.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.rotation.z = rotation;
  parent.add(mesh);
  return mesh;
}

function candles(parent, box, m, x, y, z, height = .19) {
  box(parent, m.brass, x, y + .018, z, .18, .036, .18);
  box(parent, m.cream, x, y + height / 2 + .026, z, .055, height, .056);
  mountedMesh(parent, flameGeometry, m.flame[2], x, y + height + .026, z, .055, .098, .055, -.12);
}

function roomShell(parent, house, box, materials, accent) {
  const { w, d, h } = house;
  const width = w - WALL_THICKNESS;
  const depth = d - WALL_THICKNESS;
  const planks = Math.ceil(width / .45);
  for (let i = 0; i < planks; i++) {
    const x = width * ((i + .5) / planks - .5);
    box(parent, materials.boards[i % 3], x, FLOOR_LEVEL - .075, 0, width / planks - .008, .15, depth + .04);
  }
  const ceiling = Math.min(h - .17, 3.62);
  box(parent, materials.boards[1], 0, ceiling + .10, 0, width, .20, depth);
  for (let z = -depth / 2 + .55; z < depth / 2; z += 1.12) {
    box(parent, materials.edge, 0, ceiling - .11, z, width, .23, .16);
  }
  for (const sign of [-1, 1]) {
    const x = sign * (width / 2 - .042);
    box(parent, materials.wood, x, FLOOR_LEVEL + .12, 0, .11, .24, depth);
    box(parent, materials.edge, x, ceiling - .23, 0, .14, .14, depth);
    for (const z of [-depth * .39, depth * .08, depth * .41]) {
      box(parent, materials.wood, x, (FLOOR_LEVEL + ceiling) / 2, z, .13, ceiling - FLOOR_LEVEL, .15);
    }
  }
  rug(parent, box, materials, accent, .12, depth * .12, 1.62, depth * .46);
}

function rug(parent, box, m, accent, x, z, w, d) {
  const cloth = clothMaterial(m, accent);
  const y = FLOOR_LEVEL + .014;
  box(parent, cloth, x, y, z, w, .025, d);
  for (const sign of [-1, 1]) {
    box(parent, m.brass, x + sign * (w / 2 - .085), y + .014, z, .035, .006, d - .12);
    box(parent, m.brass, x, y + .014, z + sign * (d / 2 - .102), w - .14, .006, .041);
    for (let i = 0; i < 17; i++) {
      box(parent, m.cream, x - w * .46 + i * w * .056, y - .003, z + sign * (d / 2 + .04), .022, .014, .10);
    }
  }
  for (const shift of [-d * .24, 0, d * .24]) {
    box(parent, m.brass, x, y + .014, z + shift, .31, .006, .31, 0, Math.PI / 4);
    box(parent, cloth, x, y + .019, z + shift, .16, .006, .16, 0, Math.PI / 4);
  }
}

function hearth(parent, box, m, item, ceiling, random) {
  const { x, z, w, d } = item;
  const y = FLOOR_LEVEL;
  const face = z + d / 2;
  box(parent, m.stone, x, y + .105, z, w, .21, d);
  box(parent, m.soot, x, y + .64, z - d * .34, w - .48, .95, .17);
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row++) {
      box(parent, m.stone, x + side * (.69 + row % 2 * .055), y + .28 + row * .228, z,
        .39, .215, d - .10 + (row % 2) * .052);
    }
  }
  box(parent, m.stone, x, y + 1.21, z, w - .13, .28, d - .025);
  box(parent, m.wood, x, y + 1.393, z + .019, w + .06, .11, d + .06);
  box(parent, m.stone, x, (y + 1.46 + ceiling) / 2, z - .14, w * .67, ceiling - (y + 1.46), d * .69);
  for (let log = 0; log < 3; log++) {
    mountedMesh(parent, logGeometry, m.edge, x + (log - 1) * .21, y + .219, face - .29 - log * .08,
      .13, .70, .13, Math.PI / 2 + (log - 1) * .27);
  }
  for (let flame = 0; flame < 9; flame++) {
    const width = .13 + random() * .17;
    mountedMesh(parent, flameGeometry, m.flame[flame % m.flame.length], x + (random() - .5) * .76,
      y + .23 + random() * .09, face - .28 - random() * .24, width, .23 + random() * .33, width, (random() - .5) * .47);
  }
  candles(parent, box, m, x + .64, y + 1.449, z + .13, .13);
}

function table(parent, box, m, item, accent, house) {
  const { x, z, w, d } = item;
  const y = FLOOR_LEVEL;
  const top = y + .835;
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    box(parent, m.edge, x + a * (w / 2 - .15), y + .365, z + b * (d / 2 - .15), .12, .73, .12);
  }
  box(parent, m.wood, x, top - .049, z, w, .098, d);
  box(parent, clothMaterial(m, accent), x, top + .008, z + .10, .35, .015, d - .17);
  candles(parent, box, m, x - .28, top, z - d * .28, .21);
  for (const [i, side] of [-1, 1].entries()) {
    mountedMesh(parent, potGeometry, m.bottles[i], x + side * .29, top, z + side * d * .20, .19, i ? .21 : .13, .19);
  }
  if (house.id === 'apothecary') {
    box(parent, m.cream, x + .17, top + .026, z + .42, .29, .041, .33, 0, .18);
  }
}

function seating(parent, box, m, item, accent) {
  const { kind, x, z, w, d } = item;
  const y = FLOOR_LEVEL;
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    box(parent, m.edge, x + a * (w / 2 - .11), y + .23, z + b * (d / 2 - .12), .13, .46, .14);
  }
  box(parent, m.wood, x, y + .43, z, w, .16, d);
  if (kind === 'bed') {
    box(parent, m.edge, x, y + .73, z - d / 2 + .08, w, .56, .15);
    box(parent, m.cream, x, y + .552, z + .065, w - .10, .20, d - .22);
    box(parent, clothMaterial(m, accent), x, y + .682, z + .31, w - .09, .076, d * .62);
    box(parent, m.brass, x, y + .725, z + d * .32, w - .10, .012, .028);
    box(parent, m.cream, x, y + .709, z - d * .31, w * .61, .121, .31, 0, .02);
  } else {
    box(parent, m.edge, x + w * .41, y + .79, z, .13, .57, d);
    box(parent, clothMaterial(m, accent), x - .06, y + .537, z, w * .69, .07, d - .18);
  }
}

function shelf(parent, box, m, item) {
  const { x, z, w, d } = item;
  const y = FLOOR_LEVEL;
  for (const side of [-1, 1]) {
    box(parent, m.edge, x + side * (w / 2 - .044), y + .91, z, .087, 1.82, d);
  }
  for (let level = 0; level < 4; level++) {
    const height = y + .14 + level * .50;
    box(parent, m.wood, x, height, z, w, .077, d);
    for (const side of [-1, 1]) {
      mountedMesh(parent, potGeometry, m.bottles[(level + Number(side > 0)) % 3], x + side * .235,
        height + .04, z + .039, .23, .20 + level % 2 * .10, .23);
    }
  }
}

function tradeFurniture(parent, box, m, item, accent) {
  const { kind, x, z, w, d } = item;
  const y = FLOOR_LEVEL;
  if (kind === 'woodpile') {
    for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) {
      const log = mountedMesh(parent, logGeometry, m.wood, x + (i - (3 - row) / 2) * .244,
        y + .115 + row * .17, z, .24, d * (.82 + i * .04), .24);
      log.rotation.x = Math.PI / 2;
    }
    return;
  }
  if (kind === 'loom') {
    for (const side of [-1, 1]) {
      box(parent, m.edge, x + side * .56, y + .85, z, .14, 1.7, .22);
      box(parent, m.wood, x + side * .56, y + .07, z, .18, .14, d);
    }
    for (const height of [.53, 1.49]) box(parent, m.wood, x, y + height, z, 1.13, .11, .14);
    for (let i = 0; i < 18; i++) box(parent, m.cream, x + (i - 8.5) * .052, y + 1.03, z + .055, .009, .91, .012);
    box(parent, clothMaterial(m, accent), x, y + .82, z + .066, .9, .53, .013);
    return;
  }
  if (kind === 'desk' || kind === 'workbench') {
    for (const side of [-1, 1]) box(parent, m.edge, x + side * .52, y + .386, z, .14, .77, d - .10);
    box(parent, m.wood, x, y + .80, z, w, .12, d);
    for (let i = 0; i < 4; i++) {
      mountedMesh(parent, potGeometry, m.bottles[i % 3], x - .46 + i * .27, y + .86, z - .13, .16, .17 + i % 2 * .11, .16);
    }
    box(parent, m.cream, x + .22, y + .884, z + .14, .36, .025, .28, 0, -.09);
    return;
  }
  const height = kind === 'settle' ? .47 : .57;
  box(parent, m.wood, x, y + height / 2, z, w, height, d);
  box(parent, m.edge, x, y + height, z, w + .04, .085, d + .04);
  for (const side of [-1, 1]) box(parent, m.edge, x + side * .47, y + height / 2, z + d / 2 + .012, .075, height, .029);
  if (kind === 'chest') box(parent, m.brass, x, y + height * .70, z + d / 2 + .033, .11, .13, .045);
  if (kind === 'crates') box(parent, m.wood, x - .28, y + height + .25, z, .54, .41, d * .81, 0, -.13);
  if (kind === 'settle') box(parent, clothMaterial(m, accent), x, y + height + .07, z, w - .17, .08, d - .12);
}

export function furnishRoom(parent, house, box, materials) {
  const { accent, furnishings } = house.room;
  const random = seeded(991 + house.x * 50);
  roomShell(parent, house, box, materials, accent);
  for (const item of furnishings) {
    switch (item.kind) {
      case 'hearth': hearth(parent, box, materials, item, Math.min(house.h - .17, 3.62), random); break;
      case 'table': table(parent, box, materials, item, accent, house); break;
      case 'bench':
      case 'bed': seating(parent, box, materials, item, accent); break;
      case 'shelf': shelf(parent, box, materials, item); break;
      default: tradeFurniture(parent, box, materials, item, accent);
    }
  }
  const fireplace = furnishings[0];
  const dining = furnishings[1];
  return {
    hearth: parent.localToWorld(new T.Vector3(fireplace.x, FLOOR_LEVEL + .76, fireplace.z + .70)),
    lamp: parent.localToWorld(new T.Vector3(dining.x - .28, FLOOR_LEVEL + 1.23, dining.z - dining.d * .28)),
  };
}
