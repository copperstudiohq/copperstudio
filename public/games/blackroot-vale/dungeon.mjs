import * as T from './vendor/three.module.js';
import { CELL, CELL_BED, CELL_ROOMS, GATE, HALL, HALL_WALLS, PALLET, SIDE_HALLS, STAIRS, dungeonFloor } from './dungeon-plan.mjs';
import { seeded } from './layout.mjs';
import { addOrcPrisoner } from './orc-prisoner.mjs';
import { repeatSurface } from './surfaces.mjs';

const unitBox = new T.BoxGeometry();
const iron = new T.MeshStandardMaterial({ color: '#292525', roughness: .61, metalness: .42 });
const rust = new T.MeshStandardMaterial({ color: '#6b4731', roughness: .84, metalness: .24 });
const ember = new T.MeshBasicMaterial({ color: '#f36624' });
const flameCore = new T.MeshBasicMaterial({ color: '#ffe3a0' });

function block(parent, material, x, y, z, width, height, depth) {
  const mesh = new T.Mesh(unitBox, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(width, height, depth);
  parent.add(mesh);
  return mesh;
}

function stoneMaterial(surface, u, v, color) {
  const tile = repeatSurface(surface, u, v);
  return new T.MeshStandardMaterial({ color, map: tile, bumpMap: tile, bumpScale: .062, roughness: .96 });
}

function vault(parent, material, radius, spring, from, to, thickness = 0) {
  const count = 22;
  const positions = [];
  const uv = [];
  const indices = [];
  for (let i = 0; i <= count; i++) {
    const a = i * Math.PI / count;
    const x = radius * Math.cos(a);
    const y = spring + radius * Math.sin(a);
    positions.push(x, y, from, x, y, to);
    uv.push(i / count, 0, i / count, 1);
    if (!i) continue;
    const k = i * 2;
    indices.push(k - 2, k, k - 1, k - 1, k, k + 1);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  parent.add(new T.Mesh(geometry, material));
  if (!thickness) return;

  const front = new T.RingGeometry(radius, radius + thickness, count, 1, 0, Math.PI);
  const rim = new T.Mesh(front, material);
  rim.position.set(0, spring, from);
  parent.add(rim);
  const back = rim.clone();
  back.position.z = to;
  parent.add(back);
}

function bars(scene) {
  const pivot = new T.Group();
  pivot.position.x = -GATE.width / 2;
  scene.add(pivot);
  for (let i = 0; i < 9; i++) {
    const u = .055 + .215 * i;
    const x = u - GATE.width / 2;
    const top = GATE.spring + Math.sqrt((GATE.width / 2) ** 2 - x ** 2);
    block(pivot, iron, u, (top + .14) / 2, .012, .047, top - .14, .062);
    for (const y of [.37, 1.45, 1.86]) block(pivot, rust, u, y, .059, .07, .072, .025);
  }
  for (const y of [.37, 1.45, 1.86]) block(pivot, iron, GATE.width / 2, y, .015, GATE.width, .087, .085);
  block(pivot, rust, 1.62, 1.42, .107, .25, .15, .078);
  block(pivot, iron, 1.72, 1.43, .177, .28, .044, .068).rotation.z = -.19;
  return pivot;
}

function gateWall(scene, material) {
  const half = GATE.width / 2;
  const wall = new T.Shape().moveTo(-half, GATE.spring);
  for (let i = 1; i <= 22; i++) {
    const angle = Math.PI - Math.PI * i / 22;
    wall.lineTo(half * Math.cos(angle), GATE.spring + half * Math.sin(angle));
  }
  wall.lineTo(half, 3.34).lineTo(-half, 3.34).closePath();
  const mesh = new T.Mesh(new T.ExtrudeGeometry(wall, { depth: GATE.depth, bevelEnabled: false }), material);
  mesh.position.z = -GATE.depth / 2;
  scene.add(mesh);
}

function torch(scene, x, y, z, phase) {
  block(scene, iron, x, y - .39, z, .14, .42, .13).rotation.z = x < 0 ? -.22 : .22;
  if (z > 0) block(scene, rust, x, y - .36, z - .16, .09, .10, .34);
  else block(scene, rust, x < 0 ? x - .19 : x + .19, y - .36, z, .37, .10, .09);
  const cage = new T.Mesh(new T.CylinderGeometry(.19, .105, .23, 7, 1, true), iron);
  cage.position.set(x, y - .14, z);
  scene.add(cage);
  const flame = new T.Mesh(new T.SphereGeometry(1, 10, 8), ember);
  flame.position.set(x, y + .015, z);
  scene.add(flame);
  const core = new T.Mesh(new T.ConeGeometry(.10, .36, 9), flameCore);
  core.position.set(x, y + .09, z);
  scene.add(core);
  const light = new T.PointLight('#ff9447', 33, 8, 2);
  light.position.set(x * .85, y + .24, z + .23);
  scene.add(light);
  return (seconds) => {
    const sway = Math.sin(seconds * 7 + phase);
    const flicker = Math.sin(seconds * 12 - phase) * .09 + .12 * sway;
    light.intensity = 37 + flicker * 23;
    flame.scale.set(.111 + flicker * .08, .23 + flicker * .32, .115);
    flame.rotation.z = sway * .21;
    core.rotation.z = sway * .15;
    core.scale.y = 1 + flicker * .62;
  };
}

function sidePassages(scene, walls, floor, ceiling, rib) {
  for (const { axis, line, from, to } of HALL_WALLS) {
    const middle = (from + to) / 2;
    const length = to - from + .16;
    if (axis === 'x') block(scene, walls, line, 2, middle, .28, 4, length);
    else block(scene, walls, middle, 2, line, length, 4, .28);
  }
  for (const { x0, x1, z0, z1 } of [...SIDE_HALLS, ...CELL_ROOMS]) {
    const x = (x0 + x1) / 2;
    const z = (z0 + z1) / 2;
    block(scene, floor, x, -.125, z, x1 - x0, .25, z1 - z0);
    block(scene, ceiling, x, 2.82, z, x1 - x0, .28, z1 - z0);
  }
  for (const [x, z] of [[-7.18, -5.42], [-7.18, -7.15], [6.55, -6.38], [6.55, -8.34]]) {
    block(scene, rib, x, 2.60, z, 2.58, .18, .25);
  }
}

function rowOfCells(scene, wall, rib, planks, straw) {
  const gates = new Map();
  for (const cell of CELL_ROOMS) {
    const frame = new T.Group();
    frame.position.set(cell.wall, 0, cell.z);
    frame.rotation.y = -cell.side * Math.PI / 2;
    scene.add(frame);
    const wing = cell.halfWidth - GATE.width / 2;
    for (const sign of [-1, 1]) {
      block(frame, wall, sign * (GATE.width / 2 + wing / 2), 1.64, 0, wing + .05, 3.28, GATE.depth);
      block(frame, rib, sign * (GATE.width / 2 + .065), GATE.spring / 2, .07, .13, GATE.spring, .30);
    }
    gateWall(frame, wall);
    vault(frame, rib, GATE.width / 2, GATE.spring, .18, -.18, .16);
    gates.set(cell.id, bars(frame));
    const back = cell.wall + cell.side * CELL_BED.depth;
    block(scene, planks, back, .105, cell.z, CELL_BED.width, .21, CELL_BED.length);
    block(scene, straw, back, .23, cell.z, .75, .12, 1.65).rotation.y = .038 * cell.side;
  }
  return gates;
}

export function createDungeon(surfaces) {
  const scene = new T.Scene();
  scene.background = new T.Color('#101315');
  scene.fog = new T.FogExp2('#101315', .034);
  scene.add(new T.HemisphereLight('#adbed5', '#594238', .58));
  const walls = stoneMaterial(surfaces.masonry, 4.2, 2.4, '#8a8380');
  const endWall = stoneMaterial(surfaces.masonry, 2.5, 2.3, '#817a73');
  const floor = stoneMaterial(surfaces.cobble, 3.4, 4.4, '#777374');
  const rib = stoneMaterial(surfaces.masonry, 1.2, .65, '#ada197');
  const ceiling = stoneMaterial(surfaces.masonry, 4.6, 4.3, '#655f5c');
  rib.side = ceiling.side = T.DoubleSide;
  const cellDepth = CELL.back + GATE.depth;
  const cellCenter = CELL.back / 2;
  const mainRibs = [-1.64, -7.31, -10.53];
  block(scene, floor, 0, -.125, cellCenter, 2 * CELL.halfWidth, .25, cellDepth);
  block(scene, walls, 0, 3.38, cellCenter, 2 * CELL.halfWidth, .26, cellDepth);
  block(scene, endWall, 0, 1.66, CELL.back + .2, 2 * CELL.halfWidth + .48, 3.32, .4);
  for (const side of [-1, 1]) {
    block(scene, walls, side * (CELL.halfWidth + .20), 1.66, cellCenter, .4, 3.32, cellDepth);
    const wing = CELL.halfWidth - GATE.width / 2;
    block(scene, endWall, side * (GATE.width / 2 + wing / 2), 1.67, 0, wing, 3.34, GATE.depth);
    block(scene, rib, side * (GATE.width / 2 + .106), GATE.spring / 2, .16, .212, GATE.spring, .31);
    for (const z of mainRibs) {
      block(scene, rib, side * (HALL.halfWidth - .052), 1.02, z, .14, 2.04, .29);
    }
  }
  gateWall(scene, endWall);
  vault(scene, rib, GATE.width / 2, GATE.spring, .30, -.26, .23);
  vault(scene, ceiling, HALL.halfWidth, 2.46, -.12, HALL.end);
  for (const z of mainRibs) vault(scene, rib, HALL.halfWidth - .10, 2.03, z + .15, z - .15, .22);
  sidePassages(scene, walls, floor, ceiling, rib);
  block(scene, floor, 0, -.12, STAIRS.start / 2, HALL.halfWidth * 2, .24, -STAIRS.start);
  for (let i = 0; i < STAIRS.steps; i++) {
    const height = (i + 1) * STAIRS.rise;
    const z = STAIRS.start - (i + .5) * STAIRS.tread;
    block(scene, rib, 0, height - .14, z, HALL.halfWidth * 2, .28, STAIRS.tread + .007);
  }
  const landing = STAIRS.start - STAIRS.steps * STAIRS.tread;
  const top = dungeonFloor(HALL.end);
  block(scene, floor, 0, top - .15, (landing + HALL.end) / 2, 2 * HALL.halfWidth, .30, landing - HALL.end);
  block(scene, endWall, 0, 2.6, HALL.end - .18, 2 * HALL.halfWidth + .4, 5.2, .36);
  const planks = stoneMaterial(surfaces.timber, 1.7, 1, '#666966');
  block(scene, planks, 0, top + 1.075, HALL.end + .045, 1.44, 2.15, .12);
  for (const y of [top + .53, top + 1.6]) block(scene, iron, 0, y, HALL.end + .122, 1.43, .085, .044);
  block(scene, rust, .51, top + 1.1, HALL.end + .182, .17, .05, .08);
  const stairLight = new T.PointLight('#aed2fc', 49, 8, 2);
  stairLight.position.set(.2, 3.6, -14.5);
  scene.add(stairLight);

  block(scene, planks, PALLET.x, .105, PALLET.z, PALLET.width, .21, PALLET.length);
  const straw = stoneMaterial(surfaces.forest, .8, 1.6, '#a68a62');
  block(scene, straw, PALLET.x, .22, PALLET.z, PALLET.width * .94, .10, PALLET.length * .93).rotation.y = .038;
  const random = seeded(216);
  const link = new T.TorusGeometry(.057, .009, 6, 12);
  for (let i = 0; i < 11; i++) {
    const chain = new T.Mesh(link, rust);
    chain.position.set(-2.30 + .007 * i, 1.73 - i * .084, 3.67 - i * .018 + random() * .014);
    chain.rotation.y = i * Math.PI / 2;
    scene.add(chain);
  }
  const gate = bars(scene);
  const gates = rowOfCells(scene, endWall, rib, planks, straw);
  gates.set('gate', gate);
  const prisoner = addOrcPrisoner(scene);
  const cellBounce = new T.PointLight('#c7b7a0', 8.5, 5, 2);
  cellBounce.position.set(.21, 1.72, 3.35);
  scene.add(cellBounce);
  const torches = [
    torch(scene, -1.39, 2.02, .44, 0),
    torch(scene, 1.07, 1.95, -3.1, 2),
    torch(scene, -1.10, 1.94, -6.05, 5),
    torch(scene, -8.07, 1.91, -5.88, 3),
    torch(scene, 7.45, 1.96, -7.18, 6),
  ];
  const openCells = new Set();
  let moving = null;
  return {
    scene,
    prisoner,
    openCells,
    get gateOpen() { return openCells.has('gate'); },
    get opening() { return moving !== null; },
    open(id = 'gate') {
      if (moving === null && gates.has(id) && !openCells.has(id)) moving = id;
    },
    reset() {
      moving = null;
      openCells.clear();
      for (const hinge of gates.values()) hinge.rotation.y = 0;
    },
    animate(time, elapsed) {
      for (const flicker of torches) flicker(time);
      if (moving === null) return;
      const hinge = gates.get(moving);
      hinge.rotation.y = Math.min(Math.PI / 2, hinge.rotation.y + 3.8 * elapsed);
      if (hinge.rotation.y === Math.PI / 2) {
        openCells.add(moving);
        moving = null;
      }
    },
  };
}
