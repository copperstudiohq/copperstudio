import * as T from './vendor/three.module.js';
import { CHILD_FOOTREST_HEIGHT, FLOOR_LEVEL, MEAL_SEAT_HEIGHT, WALL_THICKNESS } from './house-plan.mjs';
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
const mealBowl = new T.LatheGeometry([
  new T.Vector2(0, 0), new T.Vector2(.075, 0), new T.Vector2(.114, .033), new T.Vector2(.142, .080),
  new T.Vector2(.132, .080), new T.Vector2(.104, .039), new T.Vector2(.062, .012), new T.Vector2(0, .012),
], 20);
const brothSurface = new T.CylinderGeometry(.121, .101, .017, 20);
const loaf = new T.SphereGeometry(1, 14, 9);

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
    broth: finish('#ae6b3e'),
    bread: finish('#b87d44'),
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

function candles(parent, box, m, x, y, z, height = .14) {
  box(parent, m.brass, x, y + .010, z, .12, .020, .12);
  box(parent, m.cream, x, y + height / 2 + .017, z, .038, height, .038);
  mountedMesh(parent, flameGeometry, m.flame[2], x, y + height + .017, z, .033, .059, .033, -.12);
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
  const y = FLOOR_LEVEL + .006;
  box(parent, cloth, x, y, z, w, .011, d);
  for (const sign of [-1, 1]) {
    box(parent, m.brass, x + sign * (w / 2 - .085), y + .006, z, .035, .004, d - .12);
    box(parent, m.brass, x, y + .006, z + sign * (d / 2 - .102), w - .14, .004, .041);
    for (let i = 0; i < 17; i++) {
      box(parent, m.cream, x - w * .46 + i * w * .056, y - .003, z + sign * (d / 2 + .04), .016, .006, .09);
    }
  }
  for (const shift of [-d * .24, 0, d * .24]) {
    box(parent, m.brass, x, y + .006, z + shift, .31, .004, .31, 0, Math.PI / 4);
    box(parent, cloth, x, y + .009, z + shift, .16, .004, .16, 0, Math.PI / 4);
  }
}

function hearth(parent, box, m, item, ceiling, random) {
  const { x, z, w, d, h } = item;
  const y = FLOOR_LEVEL;
  const face = z + d / 2;
  box(parent, m.stone, x, y + .065, z, w, .13, d);
  box(parent, m.soot, x, y + .56, z - d * .34, w - .42, .89, .15);
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row++) {
      box(parent, m.stone, x + side * (.61 + row % 2 * .026), y + .224 + row * .188, z,
        .31, .18, d - .10 + (row % 2) * .042);
    }
  }
  box(parent, m.stone, x, y + h - .15, z, w - .10, .21, d - .025);
  box(parent, m.wood, x, y + h - .039, z, w, .078, d);
  box(parent, m.stone, x, (y + h + ceiling) / 2, z - .11, w * .67, ceiling - (y + h), d * .69);
  for (let log = 0; log < 3; log++) {
    mountedMesh(parent, logGeometry, m.edge, x + (log - 1) * .165, y + .159, face - .28 - log * .06,
      .10, .49, .10, Math.PI / 2 + (log - 1) * .27);
  }
  for (let flame = 0; flame < 9; flame++) {
    const width = .10 + random() * .14;
    mountedMesh(parent, flameGeometry, m.flame[flame % m.flame.length], x + (random() - .5) * .64,
      y + .16 + random() * .08, face - .24 - random() * .20, width, .18 + random() * .27, width, (random() - .5) * .47);
  }
  candles(parent, box, m, x + w * .31, y + h, z + .12, .10);
}

function stool(parent, box, m, x, z, height, width) {
  const thickness = .043;
  box(parent, m.wood, x, FLOOR_LEVEL + height - thickness / 2, z, width, thickness, width);
  for (const sideX of [-1, 1]) for (const sideZ of [-1, 1]) {
    const leg = height - thickness;
    box(parent, m.edge, x + sideX * (width / 2 - .054), FLOOR_LEVEL + leg / 2, z + sideZ * (width / 2 - .054), .047, leg, .047);
  }
}

function table(parent, box, m, item, accent, house) {
  const { x, z, w, d, h } = item;
  const y = FLOOR_LEVEL;
  const top = y + h;
  const thickness = .056;
  const legs = h - thickness;
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    box(parent, m.edge, x + a * (w / 2 - .107), y + legs / 2, z + b * (d / 2 - .135), .084, legs, .084);
  }
  box(parent, m.wood, x, top - thickness / 2, z, w, thickness, d);
  box(parent, clothMaterial(m, accent), x, top + .004, z + .035, .29, .008, d - .15);
  candles(parent, box, m, x - w * .29, top, z - d * .28);
  for (const [i, side] of [-1, 1].entries()) {
    mountedMesh(parent, potGeometry, m.bottles[i], x + side * w * .29, top, z + side * d * .19, .16, i ? .185 : .105, .16);
  }
  const seat = house.room.mealSeat;
  if (seat) {
    const bowlX = x + seat.side * (w / 2 - .13);
    mountedMesh(parent, mealBowl, m.edge, bowlX, top, seat.z + .030, .75, .75, .75).name = 'Blub’s meal bowl';
    stool(parent, box, m, seat.x, seat.z, MEAL_SEAT_HEIGHT, .35);
  }
  for (const diner of house.room.residents) {
    if (!diner.seatHeight) continue;
    stool(parent, box, m, diner.x, diner.z, diner.seatHeight, diner.child ? .33 : .39);
    const dx = Math.sin(diner.yaw);
    const dz = Math.cos(diner.yaw);
    const bowlX = diner.x + .75 * dx;
    const bowlZ = diner.z + .75 * dz;
    mountedMesh(parent, mealBowl, m.cream, bowlX, top + .005, bowlZ, .73, .73, .73).name = 'Family stew bowl';
    mountedMesh(parent, brothSurface, m.broth, bowlX, top + .042, bowlZ, .73, .73, .73);
    if (diner.child) {
      const restX = diner.x + .32 * dx;
      const restZ = diner.z + .32 * dz;
      box(parent, m.edge, restX, y + CHILD_FOOTREST_HEIGHT - .024, restZ, .24, .048, .30);
      box(parent, m.wood, restX, y + .061, restZ, .16, .122, .18);
    }
  }
  if (house.room.residents.length > 1) {
    box(parent, m.edge, x, top + .031, z - .029, .30, .032, .27, 0, -.20);
    for (const [dx, dz, scale] of [[-.082, -.045, 1], [.063, .043, .79]]) {
      mountedMesh(parent, loaf, m.bread, x + dx, top + .093, z + dz, .083 * scale, .047 * scale, .064 * scale);
    }
  }
}

function seating(parent, box, m, item, accent) {
  const { kind, x, z, w, d, h } = item;
  const y = FLOOR_LEVEL;
  const mattress = kind === 'bed' ? .15 : .036;
  const board = kind === 'bed' ? .11 : .058;
  const legs = h - mattress - board;
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    box(parent, m.edge, x + a * (w / 2 - .075), y + legs / 2, z + b * (d / 2 - .10), .087, legs, .092);
  }
  box(parent, m.wood, x, y + legs + board / 2, z, w, board, d);
  if (kind === 'bed') {
    box(parent, m.edge, x, y + .64, z - d / 2 + .041, w, .59, .082);
    box(parent, m.cream, x, y + h - mattress / 2, z + .012, w - .054, mattress, d - .126);
    box(parent, clothMaterial(m, accent), x, y + h + .015, z + d * .119, w - .041, .033, d * .675);
    box(parent, m.brass, x, y + h + .034, z + d * .33, w - .054, .006, .024);
    box(parent, m.cream, x, y + h + .043, z - d * .347, w * .55, .086, .275, 0, .025);
  } else {
    const alongWall = kind === 'bench';
    const backX = alongWall ? x + Math.sign(x) * (w / 2 - .034) : x;
    const backZ = alongWall ? z : z - d / 2 + .034;
    box(parent, m.edge, backX, y + h + .205, backZ, alongWall ? .068 : w, .47, alongWall ? d : .068);
    box(parent, clothMaterial(m, accent), x, y + h - mattress / 2, z, w - .105, mattress, d - .105);
  }
}

function shelf(parent, box, m, item) {
  const { x, z, w, d, h } = item;
  const y = FLOOR_LEVEL;
  for (const side of [-1, 1]) {
    box(parent, m.edge, x + side * (w / 2 - .022), y + h / 2, z, .045, h, d);
  }
  for (let level = 0; level < 4; level++) {
    const height = y + .12 + level * .414;
    box(parent, m.wood, x, height, z, w, .038, d);
    for (const side of [-1, 1]) {
      mountedMesh(parent, potGeometry, m.bottles[(level + Number(side > 0)) % 3], x + side * w * .24,
        height + .020, z + .020, .176, .15 + level % 2 * .096, .176);
    }
  }
}

function tradeFurniture(parent, box, m, item, accent) {
  const { kind, x, z, w, d, h } = item;
  const y = FLOOR_LEVEL;
  if (kind === 'woodpile') {
    for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) {
      const diameter = h * .41;
      const log = mountedMesh(parent, logGeometry, m.wood, x + (i - (3 - row) / 2) * w * .197,
        y + diameter * .5 + row * (h - diameter) / 2, z, diameter, d * (.79 + i * .048), diameter);
      log.rotation.x = Math.PI / 2;
    }
    return;
  }
  if (kind === 'loom') {
    for (const side of [-1, 1]) {
      box(parent, m.edge, x + side * (w / 2 - .058), y + h / 2, z, .115, h, .17);
      box(parent, m.wood, x + side * (w / 2 - .073), y + .045, z, .143, .089, d);
    }
    for (const height of [.52, h - .16]) box(parent, m.wood, x, y + height, z, w - .13, .095, .127);
    for (let i = 0; i < 18; i++) box(parent, m.cream, x + (i - 8.5) * .052, y + 1.03, z + .055, .009, .91, .012);
    box(parent, clothMaterial(m, accent), x, y + .82, z + .066, .9, .53, .013);
    return;
  }
  if (kind === 'desk' || kind === 'workbench') {
    const top = kind === 'desk' ? .052 : .069;
    const legs = h - top;
    for (const side of [-1, 1]) box(parent, m.edge, x + side * (w / 2 - .116), y + legs / 2, z, .10, legs, d - .11);
    box(parent, m.wood, x, y + h - top / 2, z, w, top, d);
    for (let i = 0; i < 4; i++) {
      mountedMesh(parent, potGeometry, m.bottles[i % 3], x + w * (-.37 + i * .223),
        y + h, z - .14, .135, .115 + i % 2 * .083, .135);
    }
    box(parent, m.cream, x + w * .185, y + h + .014, z + .11, .30, .027, .219, 0, -.09);
    return;
  }
  if (kind === 'crates') {
    for (const side of [-1, 1]) box(parent, m.wood, x + side * w * .259, y + h / 2, z, w * .478, h, d);
    box(parent, m.edge, x - w * .218, y + h + .143, z, w * .435, .286, d * .75, 0, -.08);
    return;
  }
  box(parent, m.wood, x, y + (h - .056) / 2, z, w - .014, h - .056, d - .02);
  box(parent, m.edge, x, y + h - .029, z, w, .058, d);
  for (const side of [-1, 1]) {
    box(parent, m.edge, x + side * w * .384, y + h * .462, z + d / 2 - .005, .059, h * .916, .011);
  }
  box(parent, m.brass, x, y + h * .70, z + d / 2 + .006, .08, .095, .015);
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
      case 'settle':
      case 'bed': seating(parent, box, materials, item, accent); break;
      case 'shelf': shelf(parent, box, materials, item); break;
      case 'stool': stool(parent, box, materials, item.x, item.z, item.h, item.w); break;
      default: tradeFurniture(parent, box, materials, item, accent);
    }
  }
  const fireplace = furnishings[0];
  const dining = furnishings[1];
  return {
    hearth: parent.localToWorld(new T.Vector3(fireplace.x, FLOOR_LEVEL + .64, fireplace.z + .54)),
    lamp: parent.localToWorld(new T.Vector3(dining.x - dining.w * .29, FLOOR_LEVEL + dining.h + .33, dining.z - dining.d * .28)),
  };
}
