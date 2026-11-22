import * as T from './vendor/three.module.js';
import { DOOR_HEIGHT, DOOR_WIDTH, FLOOR_LEVEL, WALL_THICKNESS } from './house-plan.mjs';
import { FENCES, groundHeight, HOUSES, LAMPS, seeded, WELL, WOODLAND_OUTHOUSE } from './layout.mjs';
import { furnishRoom, roomMaterials } from './rooms.mjs';
import { repeatSurface } from './surfaces.mjs';
import { createDoorKeeper } from './village-door-keeper.mjs';
import { createVillager } from './villagers.mjs';

const cube = new T.BoxGeometry();
const batch = new Map();
const tint = (color) => new T.MeshStandardMaterial({ color, roughness: .85 });
const wood = tint('#a78c76');
const smoothWood = tint('#b1a294');
const darkWood = tint('#7a6d64');
const trim = tint('#9d8b78');
const stone = ['#bcb5ae', '#c2b9a7', '#a09f98', '#b7af99'].map(tint);
const footings = tint('#afa597');
const plaster = ['#dfd0b4', '#c8bea9', '#b6b5a8'].map(tint);
const gold = tint('#9d7547');
const iron = tint('#333b36');
const glass = ['#ce8941', '#f1aa54', '#e79744'].map((color, index) => new T.MeshStandardMaterial({
  color, emissive: color, emissiveIntensity: .64 + index * .19, roughness: .38,
}));
const darkness = new T.MeshBasicMaterial({ color: '#171a17' });
const interiorGlass = new T.MeshStandardMaterial({ color: '#91a8ae', emissive: '#839daa', emissiveIntensity: .31, roughness: .61 });

function box(parent, material, x, y, z, w, h, d, rx = 0, ry = 0, rz = 0) {
  const piece = new T.Object3D();
  piece.position.set(x, y, z);
  piece.scale.set(w, h, d);
  piece.rotation.set(rx, ry, rz);
  parent.add(piece);
  if (!batch.has(material)) batch.set(material, []);
  batch.get(material).push(piece);
}

function makeBatches(scene) {
  scene.updateMatrixWorld(true);
  for (const [material, objects] of batch) {
    const meshes = new T.InstancedMesh(cube, material, objects.length);
    for (const [i, object] of objects.entries()) {
      meshes.setMatrixAt(i, object.matrixWorld);
      object.removeFromParent();
    }
    meshes.castShadow = !glass.includes(material) && material !== interiorGlass;
    meshes.receiveShadow = meshes.castShadow;
    scene.add(meshes);
  }
  batch.clear();
}

function canvasTexture(size, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  paint(canvas.getContext('2d'), size);
  const result = new T.CanvasTexture(canvas);
  result.colorSpace = T.SRGBColorSpace;
  return result;
}

function gable(parent, material, w, d, y, rise) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([
    -w / 2, y, d / 2, w / 2, y, d / 2, 0, y + rise, d / 2,
    w / 2, y, -d / 2, -w / 2, y, -d / 2, 0, y + rise, -d / 2,
  ], 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 2, 0, 1, .95, 0, 0, 2, 0, 1, .95], 2));
  geometry.computeVertexNormals();
  const attic = new T.Mesh(geometry, material);
  attic.castShadow = true;
  attic.receiveShadow = true;
  parent.add(attic);
}

function frontWindow(parent, x, y, z, width, height, lightIndex) {
  box(parent, darkWood, x, y, z, width + .18, height + .19, .15);
  box(parent, glass[lightIndex], x, y, z + .085, width, height, .038);
  box(parent, wood, x, y, z + .14, .072, height, .065);
  box(parent, wood, x, y + .08, z + .14, width, .069, .065);
  for (const [dx, dy, direction] of [[-.25, -.24, 1], [.25, -.24, -1], [-.25, .27, -1], [.25, .27, 1]]) {
    box(parent, iron, x + dx * width, y + dy * height, z + .116, width * .60, .024, .013, 0, 0, direction * .68);
  }
  box(parent, trim, x, y - height / 2 - .06, z + .13, width + .32, .10, .25);
  for (const side of [-1, 1]) {
    const shutter = x + side * (width / 2 + .21);
    box(parent, smoothWood, shutter, y, z + .025, .3, height + .06, .08, 0, side * .18);
    box(parent, darkWood, shutter, y + height * .26, z + .074, .31, .045, .09);
    box(parent, darkWood, shutter, y - height * .26, z + .074, .31, .045, .09);
  }
}

function wall(parent, x, z, yaw) {
  const side = new T.Group();
  side.position.set(x, 0, z);
  side.rotation.y = yaw;
  parent.add(side);
  return side;
}

function diagonal(parent, material, x1, y1, x2, y2, z, w = .15) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  box(parent, material, (x1 + x2) / 2, (y1 + y2) / 2, z, Math.hypot(dx, dy), w, .115, 0, 0, Math.atan2(dy, dx));
}

function timberWall(parent, width, height, lower, style, entry = false) {
  const crossbeam = (y, h) => {
    if (!entry || y - h / 2 >= FLOOR_LEVEL + DOOR_HEIGHT) {
      box(parent, wood, 0, y, .159, width + .12, h, .141);
      return;
    }
    const span = (width + .12 - DOOR_WIDTH) / 2;
    for (const side of [-1, 1]) box(parent, wood, side * (span + DOOR_WIDTH) / 2, y, .159, span, h, .141);
  };
  box(parent, trim, 0, height - .12, .08, width + .12, .20, .13);
  crossbeam(lower + .09, .17);
  const step = width / 4;
  for (let column = 0; column <= 4; column++) {
    if (entry && column === 2) continue;
    const x = step * (column - 2);
    box(parent, wood, x, (height + lower) / 2, .157, .19, height - lower, .15);
    if (column % 2 === 1) {
      const outward = Math.sign(x);
      diagonal(parent, wood, x + outward * .13, height - .16, x + outward * (step - .08), height * .51, .157);
    }
  }
  if (style === 2) crossbeam(height * .56, .16);
}

function wallBands(side, width, low, high, material, openings, depth = WALL_THICKNESS, offset = 0) {
  const stops = [-width / 2, ...openings.flatMap((opening) => [opening.left, opening.right]), width / 2].sort((a, b) => a - b);
  for (let i = 1; i < stops.length; i++) {
    const left = stops[i - 1];
    const right = stops[i];
    const x = (left + right) / 2;
    const opening = openings.find((hole) => x > hole.left && x < hole.right);
    const strips = opening ? [[low, Math.min(high, opening.low)], [Math.max(low, opening.high), high]] : [[low, high]];
    for (const [bottom, top] of strips) {
      if (top > bottom) box(side, material, x, (top + bottom) / 2, offset, right - left, top - bottom, depth);
    }
  }
}

function buildWall(side, width, height, style, panes, { entry = false, woodland = false } = {}) {
  const openings = panes.map(({ x, y, w, h }) => ({ left: x - w * .48, right: x + w * .48, low: y - h * .48, high: y + h * .48 }));
  if (entry) openings.push({ left: -DOOR_WIDTH / 2, right: DOOR_WIDTH / 2, low: -.86, high: FLOOR_LEVEL + DOOR_HEIGHT });
  wallBands(side, width + .24, -.64, .80, footings, openings);
  wallBands(side, width + .24, .80, height, woodland ? darkWood : plaster[style], openings);
  if (woodland) {
    for (let row = 0, bottom = .80; bottom < height; row++, bottom += .21) {
      const finish = row % 3 === 1 ? darkWood : wood;
      wallBands(side, width + .21, bottom, Math.min(height, bottom + .199), finish, openings, .044, .144);
    }
  }
  timberWall(side, width, height, .72, style, entry);
  for (const { x, y, w, h, light } of panes) {
    frontWindow(side, x, y, .153, w, h, light);
    box(side, interiorGlass, x, y, -.14, w, h, .036);
    for (const sign of [-1, 1]) {
      box(side, darkWood, x + sign * w * .53, y, -.18, .095, h + .12, .09);
      box(side, wood, x, y + sign * h * .53, -.185, w + .13, .095, .13);
    }
    box(side, wood, x, y, -.184, .038, h, .06);
    box(side, wood, x, y, -.184, w, .039, .06);
  }
}

function doorHinge(front, width) {
  const hinge = new T.Group();
  hinge.position.set(-width / 2, FLOOR_LEVEL, .025);
  front.add(hinge);
  return hinge;
}

// Attach moving pieces to the hinge instead of the static batches.
function movingDoorPart(hinge, material, x, y, z, w, h, d) {
  const mesh = new T.Mesh(cube, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  hinge.add(mesh);
}

function entryDoor(front) {
  const hinge = doorHinge(front, DOOR_WIDTH);
  const part = (...piece) => movingDoorPart(hinge, ...piece);
  const panelW = DOOR_WIDTH - .060;
  part(darkWood, DOOR_WIDTH * .5, DOOR_HEIGHT * .5, 0, panelW, DOOR_HEIGHT - .036, .104);
  const plank = panelW / 7;
  for (let i = 0; i < 7; i++) {
    part(i % 2 ? smoothWood : wood, .032 + (i + .5) * plank, DOOR_HEIGHT * .5, 0, plank - .016, DOOR_HEIGHT - .08, .135);
  }
  for (const sign of [-1, 1]) {
    for (const y of [.58, 1.96]) part(darkWood, DOOR_WIDTH * .5, y, sign * .101, panelW, .17, .078);
    part(iron, panelW - .18, .96, sign * .086, .12, .23, .044);
    part(gold, panelW - .18, .97, sign * .123, .16, .065, .058);
  }
  for (const sign of [-1, 1]) {
    box(front, trim, sign * (DOOR_WIDTH / 2 + .04), FLOOR_LEVEL + DOOR_HEIGHT / 2, 0, .17, DOOR_HEIGHT + .02, .42);
  }
  box(front, trim, 0, FLOOR_LEVEL + DOOR_HEIGHT + .077, 0, DOOR_WIDTH + .28, .15, .43);
  box(front, stone[1], 0, FLOOR_LEVEL - .08, .235, DOOR_WIDTH + .12, .158, .88);
  box(front, stone[2], 0, FLOOR_LEVEL - .191, .597, DOOR_WIDTH + .16, .158, .48);
  return hinge;
}

function boardWithOpening(parent, material, w, h, depth, opening) {
  const face = new T.Shape();
  face.moveTo(-w / 2, -h / 2);
  face.lineTo(w / 2, -h / 2);
  face.lineTo(w / 2, h / 2);
  face.lineTo(-w / 2, h / 2);
  face.closePath();
  face.holes.push(opening);
  const board = new T.Mesh(new T.ExtrudeGeometry(face, { depth, bevelEnabled: false }), material);
  board.castShadow = board.receiveShadow = true;
  parent.add(board);
  return board;
}

function privyDoor(front, { doorWidth: width, doorHeight: height }) {
  const hinge = doorHinge(front, width);
  const panel = width - .045;
  const crescent = new T.Path();
  crescent.moveTo(.066, .69);
  crescent.quadraticCurveTo(-.143, .680, -.098, .553);
  crescent.quadraticCurveTo(-.072, .451, .062, .478);
  crescent.quadraticCurveTo(-.024, .532, -.021, .602);
  crescent.quadraticCurveTo(-.013, .659, .066, .69);
  const board = boardWithOpening(hinge, wood, panel, height - .037, .084, crescent);
  board.position.set(width / 2, height / 2, -.042);
  const part = (...piece) => movingDoorPart(hinge, ...piece);
  for (const seam of [-.3, -.1, .1, .3]) {
    part(darkWood, width / 2 + seam * panel, height / 2, .043, .011, height - .052, .012);
  }
  for (const y of [.35, 1.34]) {
    part(darkWood, width / 2, y, -.065, panel - .06, .122, .057);
    part(iron, .15, y, .050, .254, .059, .034);
  }
  for (const side of [-1, 1]) {
    part(iron, width - .148, .965, side * .057, .072, .165, .034);
    part(iron, width - .148, .968, side * .090, .126, .038, .049);
    box(front, trim, side * (width / 2 + .039), FLOOR_LEVEL + height / 2, .028, .083, height + .06, .24);
  }
  box(front, trim, 0, FLOOR_LEVEL + height + .052, .06, width + .15, .10, .24);
  box(front, stone[1], 0, FLOOR_LEVEL - .079, .21, width + .12, .158, .54);
  return hinge;
}

function woodlandOuthouse(scene, house, roof) {
  const { x, z, w, d, h, yaw, doorWidth, doorHeight } = house;
  const parent = new T.Group();
  parent.position.set(x, house.baseY, z);
  parent.rotation.y = yaw;
  scene.add(parent);
  const rise = .37;
  const slope = rise / d;
  box(parent, footings, 0, -.095, 0, w + .025, .60, d + .025);
  box(parent, darkWood, 0, FLOOR_LEVEL - .066, 0, w - .018, .132, d - .014);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 10; i++) {
      const pz = ((i + .5) / 10 - .5) * d;
      const top = h - rise / 2 + pz * slope;
      box(parent, i % 3 === 1 ? darkWood : wood, side * w / 2, (FLOOR_LEVEL + top) / 2, pz,
        .127, top - FLOOR_LEVEL, d / 10 - .004);
    }
    const width = (w - doorWidth) / 2;
    box(parent, wood, side * (doorWidth / 2 + width / 2), (FLOOR_LEVEL + h) / 2, d / 2,
      width, h - FLOOR_LEVEL, .14);
    for (const end of [-1, 1]) {
      const top = end === 1 ? h : h - rise;
      box(parent, darkWood, side * w / 2, (FLOOR_LEVEL + top) / 2, end * d / 2, .151, top - FLOOR_LEVEL, .164);
    }
  }
  for (let i = 0; i < 9; i++) {
    const back = h - rise;
    box(parent, i % 3 === 1 ? darkWood : wood, ((i + .5) / 9 - .5) * w,
      (FLOOR_LEVEL + back) / 2, -d / 2, w / 9 - .004, back - FLOOR_LEVEL, .139);
  }
  const lintel = FLOOR_LEVEL + doorHeight;
  box(parent, wood, 0, (lintel + h) / 2, d / 2, doorWidth, h - lintel, .14);
  box(parent, roof, 0, h - rise / 2 + .068, 0, w + .47, .134, d + .58, -Math.atan(slope));
  box(parent, darkWood, 0, h + slope * .24, d / 2 + .26, w + .49, .16, .106);

  const seat = house.room.furnishings[0];
  const hole = new T.Path();
  hole.absellipse(0, 0, .162, .137, 0, 2 * Math.PI, true);
  const plank = boardWithOpening(parent, smoothWood, seat.w, seat.d, .062, hole);
  plank.position.set(seat.x, FLOOR_LEVEL + seat.h - .062, seat.z);
  plank.rotation.x = -Math.PI / 2;
  box(parent, darkWood, seat.x, FLOOR_LEVEL + (seat.h - .062) / 2, seat.z + seat.d / 2 - .054,
    seat.w, seat.h - .062, .108);
  box(parent, darkness, seat.x, FLOOR_LEVEL + .013, seat.z, .48, .024, .41);
  const front = wall(parent, 0, d / 2, 0);
  wallLantern(front, { x: .76, y: FLOOR_LEVEL + 1.66, intensity: 8, range: 5 });
  return { house, hinge: privyDoor(front, house), residents: house.room.residents };
}

function wallLantern(front, { x = -1.33, y = FLOOR_LEVEL + 2.14, intensity = 26, range = 8 } = {}) {
  const z = .44;
  box(front, darkWood, x, y + .39, .27, .14, .11, .40);
  box(front, iron, x, y + .24, z, .034, .24, .034);
  box(front, iron, x, y + .145, z, .24, .065, .24);
  box(front, glass[1], x, y, z, .18, .26, .18);
  box(front, iron, x, y - .151, z, .23, .055, .23);
  for (const dx of [-.097, .097]) for (const dz of [-.097, .097]) {
    box(front, iron, x + dx, y, z + dz, .018, .29, .018);
  }
  const light = new T.PointLight('#ffad60', intensity, range, 2);
  light.position.set(x, y - .11, z + .19);
  front.add(light);
}

function dormer(parent, direction, wallHeight, houseWidth, rise, roof) {
  const windowBay = new T.Group();
  const x = direction * houseWidth * .28;
  windowBay.position.set(x, wallHeight + rise * .44 - .14, -.80);
  windowBay.rotation.y = direction * Math.PI / 2;
  parent.add(windowBay);
  const w = 1.57;
  const h = 1.14;
  const d = 1.70;
  const crown = .77;
  const pitch = Math.atan(crown / (w / 2));
  box(windowBay, plaster[1], 0, h / 2, 0, w, h, d);
  gable(windowBay, plaster[1], w, d, h, crown);
  frontWindow(windowBay, 0, .68, d / 2, .63, .76, 0);
  for (const side of [-1, 1]) {
    box(windowBay, roof, side * w / 4, h + crown * .5, 0, 1.35, .10, d + .30, 0, 0, -side * pitch);
    diagonal(windowBay, trim, side * w * .52, h + .02, 0, h + crown + .045, d / 2 + .09, .11);
  }
}

function homestead(scene, house, roof, furnishings) {
  const { x, z, w, d, h, yaw, style, woodland } = house;
  const parent = new T.Group();
  scene.add(parent);
  parent.position.set(x, house.baseY, z);
  parent.rotation.y = yaw;
  const rise = w * [.365, .45, .391][style];
  const roofAngle = Math.atan(rise / (w / 2));
  const roofWidth = (w / 2 + .62) / Math.cos(roofAngle);
  gable(parent, woodland ? darkWood : plaster[style], w, d, h, rise);

  for (const sign of [-1, 1]) {
    const roofX = sign * (w / 4 + .19);
    const roofY = h + rise - Math.abs(roofX) * Math.tan(roofAngle);
    box(parent, roof, roofX, roofY, 0, roofWidth, .19, d + 1.32, 0, 0, -sign * roofAngle);
    for (const end of [-1, 1]) {
      box(parent, darkWood, roofX, roofY - .05, end * (d / 2 + .59), roofWidth + .10, .25, .17, 0, 0, -sign * roofAngle);
    }
    box(parent, darkWood, sign * (w / 2 + .49), h - .43, 0, .19, .25, d + 1.45);
    const side = wall(parent, sign * w / 2, 0, sign * Math.PI / 2);
    buildWall(side, d, h, style, [
      { x: -d * .23, y: h * .53, w: .74, h: .84, light: (style + 1) % 3 },
      { x: d * .23, y: h * .48, w: .72, h: .81, light: style },
    ], { woodland });
  }
  box(parent, trim, 0, h + rise + .085, 0, .24, .22, d + 1.48);
  if (style) dormer(parent, x < 0 ? 1 : -1, h, w, rise, roof);
  const front = wall(parent, 0, d / 2, 0);
  const back = wall(parent, 0, -d / 2, Math.PI);
  const paneHeight = woodland ? .74 : 1;
  const panes = [
    { x: -w * (woodland ? .29 : .25), y: h * .55, w: woodland ? .66 : style === 1 ? 1.04 : .87, h: paneHeight, light: style },
    { x: w * .25, y: h * .53, w: woodland ? .67 : .89, h: paneHeight, light: (style + 1) % 3 },
  ];
  buildWall(front, w, h, style, panes, { entry: true, woodland });
  buildWall(back, w, h, style, panes, { woodland });
  for (const end of [front, back]) {
    for (const side of [-1, 1]) {
      diagonal(end, wood, side * w * .29, h + .13, side * w * .085, h + rise * .67, .095, .13);
    }
    box(end, wood, 0, h + rise * .43, .09, .18, rise * .82, .14);
    diagonal(end, trim, -w * .31, h + .17, w * .31, h + .17, .1);
    if (!woodland) frontWindow(end, 0, h + rise * .32, .105, .86, .90, style);
  }

  const chimneyX = w * .24;
  const chimneyZ = -d * .26;
  const chimneyTop = h + rise + .63 + .19 * style;
  box(parent, stone[style], chimneyX, chimneyTop - 1.2, chimneyZ, .83, 2.4, .91);
  box(parent, stone[2], chimneyX, chimneyTop, chimneyZ, 1.04, .16, 1.10);
  box(parent, darkness, chimneyX, chimneyTop + .105, chimneyZ, .61, .02, .66);
  const hinge = entryDoor(front);
  if (woodland) wallLantern(front);
  const residents = house.room.residents.map((resident, index) => createVillager(parent, house, resident, index));
  const room = { house, hinge, residents, ...furnishRoom(parent, house, box, furnishings) };
  if (!residents.length) return room;
  const keeper = createDoorKeeper(house);
  const atHome = residents[keeper.index];
  const { seatHeight, ...stand } = house.room.residents[keeper.index];
  const walking = seatHeight ? createVillager(parent, house, stand, keeper.index) : atHome;
  if (walking !== atHome) walking.root.visible = false;
  return {
    ...room, keeper,
    poseKeeper(seconds) {
      const frame = keeper.pose;
      if (walking !== atHome) {
        walking.root.visible = Boolean(frame);
        atHome.root.visible = !frame;
      }
      walking.standAt(seconds, frame);
    },
  };
}

function pavement(scene) {
  const random = seeded(138);
  const stoneTop = new T.DodecahedronGeometry(1, 0);
  const stones = new T.InstancedMesh(stoneTop, tint('#8e877a'), 180);
  const point = new T.Object3D();
  const color = new T.Color();
  for (let i = 0; i < stones.count; i++) {
    const z = 33 - random() * 58;
    const width = z > -11 && z < 5 ? 4.55 : 2.5;
    const x = (random() * 2 - 1) * width + .36 * Math.cos(z * .12);
    point.position.set(x, groundHeight(x, z) + .075, z);
    point.rotation.y = random() * Math.PI;
    point.scale.set(.064 + random() * .13, .025 + random() * .037, .065 + random() * .13);
    point.updateMatrix();
    stones.setMatrixAt(i, point.matrix);
    stones.setColorAt(i, color.setHSL(.088, .08, .56 + random() * .4));
  }
  stones.receiveShadow = true;
  scene.add(stones);
}

function villageWell(scene, roof) {
  const base = new T.Group();
  base.position.set(WELL.x, groundHeight(WELL.x, WELL.z), WELL.z);
  scene.add(base);
  for (let course = 0; course < 3; course++) {
    for (let i = 0; i < 12; i++) {
      const angle = (i + .5 * (course % 2)) / 12 * Math.PI * 2;
      box(base, stone[(i + 2 * course) % stone.length], 1.15 * Math.sin(angle), .15 + course * .24, 1.15 * Math.cos(angle), .61, .235, .40, 0, angle);
    }
  }
  const hole = new T.Mesh(new T.CircleGeometry(1.06, 18), darkness);
  hole.rotation.x = -Math.PI / 2;
  hole.position.y = .27;
  base.add(hole);
  for (const x of [-1.21, 1.21]) box(base, wood, x, 1.51, 0, .16, 2.86, .19);
  box(base, wood, 0, 2.73, 0, 2.65, .20, .19);
  box(base, darkWood, 0, 1.98, 0, 2.50, .13, .13);
  box(base, gold, .03, 1.29, 0, .037, 1.39, .041);
  for (const yaw of [-1, 1]) box(base, roof, 0, 2.79, yaw * .44, 2.9, .1, 1.04, yaw * .42);
}

function lamps(scene) {
  const texture = canvasTexture(96, (ctx, size) => {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, '#ffce6fa0');
    gradient.addColorStop(.27, '#ffad4b52');
    gradient.addColorStop(.68, '#f2852012');
    gradient.addColorStop(1, '#fc921200');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  });
  for (const [i, [x, z]] of LAMPS.entries()) {
    const y = groundHeight(x, z);
    const facing = x < 0 ? 1 : -1;
    const lampX = x + .48 * facing;
    box(scene, darkWood, x, y + 1.56, z, .16, 3.14, .16);
    box(scene, wood, x + .23 * facing, y + 2.92, z, .61, .135, .145);
    box(scene, iron, lampX, y + 2.70, z, .032, .36, .035);
    box(scene, iron, lampX, y + 2.55, z, .31, .10, .31);
    box(scene, glass[1], lampX, y + 2.34, z, .21, .34, .21);
    box(scene, iron, lampX, y + 2.15, z, .27, .078, .27);
    for (const dx of [-.112, .112]) for (const dz of [-.112, .112]) {
      box(scene, iron, lampX + dx, y + 2.34, z + dz, .022, .36, .022);
    }
    const glow = new T.Sprite(new T.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, fog: true, blending: T.AdditiveBlending }));
    glow.position.set(lampX, y + 2.34, z);
    glow.scale.set(1.45, 1.45, 1);
    scene.add(glow);
    if (i !== LAMPS.length - 1) {
      const light = new T.PointLight('#ffac62', 36, 14, 2);
      light.position.set(lampX, y + 2.08, z);
      scene.add(light);
    }
  }
}

function fence(scene, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const div = Math.round(Math.hypot(dx, dz) / 2.1);
  const length = Math.hypot(dx, dz) / div;
  const angle = -Math.atan2(dz, dx);
  for (let i = 0; i <= div; i++) {
    const x = ax + dx * i / div;
    const z = az + dz * i / div;
    const y = groundHeight(x, z);
    box(scene, trim, x, y + .55, z, .18, 1.21, .18, 0, angle, Math.sin(i * 3) * .05);
    if (i === div) continue;
    for (const height of [.39, .79]) {
      box(scene, smoothWood, x + dx / div / 2, y + height, z + dz / div / 2, length, .10, .11, 0, angle);
    }
  }
}

function surface(material, texture, bump) {
  material.map = texture;
  material.bumpMap = texture;
  material.bumpScale = bump;
  return material;
}

function weatheredPlaster(material, map) {
  surface(material, map, .032);
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWallPosition;')
      .replace('#include <begin_vertex>', `
        #include <begin_vertex>
        vec4 origin = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        origin = instanceMatrix * origin;
        #endif
        vWallPosition = (modelMatrix * origin).xyz;
      `);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWallPosition;')
      .replace('#include <color_fragment>', `
        #include <color_fragment>
        float streaks = sin(vWallPosition.x * 4.2 + vWallPosition.z * 6.5) * 0.27;
        float damp = smoothstep(0.47, 2.1 + streaks, vWallPosition.y);
        diffuseColor.rgb *= mix(vec3(0.43, 0.49, 0.42), vec3(1.0), damp);
      `);
  };
}

export function createVillage(scene, surfaces) {
  const woodGrain = repeatSurface(surfaces.timber, 1, 1.5);
  for (const beam of [wood, smoothWood, darkWood, trim]) surface(beam, woodGrain, .025);
  const blocks = repeatSurface(surfaces.masonry, .79, .78);
  for (const finish of stone) surface(finish, blocks, .034);
  surface(footings, repeatSurface(surfaces.masonry, 3.3, .67), .051);
  const wallMap = repeatSurface(surfaces.plaster, 2.4, 1);
  for (const walls of plaster) weatheredPlaster(walls, wallMap);
  const texture = repeatSurface(surfaces.slate, 2.25, 2.55);
  texture.center.set(.5, .5);
  texture.rotation = Math.PI / 2;
  const roof = surface(tint('#c5c9cd'), texture, .051);
  roof.roughness = .68;
  const woodlandRoof = roof.clone();
  woodlandRoof.color.set('#a0aa8c');
  const furnishings = roomMaterials(surfaces);
  const rooms = new Map(HOUSES.map((house) => [
    house.id, homestead(scene, house, house.woodland ? woodlandRoof : roof, furnishings),
  ]));
  rooms.set(WOODLAND_OUTHOUSE.id, woodlandOuthouse(scene, WOODLAND_OUTHOUSE, woodlandRoof));
  villageWell(scene, roof);
  pavement(scene);
  lamps(scene);
  for (const [[ax, az], [bx, bz]] of FENCES) fence(scene, ax, az, bx, bz);
  makeBatches(scene);
  return rooms;
}
