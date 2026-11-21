import * as T from './vendor/three.module.js';
import { createRider } from './rider.mjs';
import { repeatSurface } from './surfaces.mjs';
import { THRONE_LORD_EYE_Y, THRONE_LORD_HEIGHT_SCALE, throneLord } from './throne-lord.mjs';
import { hangPainting } from './tower-paintings.mjs';
import { inThroneRoom, THRONE_ROOM, TOWER_LEVEL, TOWER_WIDTH } from './tower-plan.mjs';

const box = new T.BoxGeometry();
const base = (color, roughness = .93, metalness = 0) => new T.MeshStandardMaterial({ color, roughness, metalness });
const iron = base('#35323a', .72, .49);
const bronze = base('#916253', .62, .46);
const banner = base('#58222a', .96);
banner.side = T.DoubleSide;
const ember = new T.MeshBasicMaterial({ color: '#ffc088' });
const blue = new T.MeshBasicMaterial({ color: '#93cacd' });

function block(scene, material, x, y, z, width, height, depth) {
  const mesh = new T.Mesh(box, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(width, height, depth);
  scene.add(mesh);
  return mesh;
}

function surface(texture, color, u, v) {
  const map = repeatSurface(texture, u, v);
  return new T.MeshStandardMaterial({ color, map, bumpMap: map, bumpScale: .054, roughness: .94 });
}

function curtain(parent, material, x, y, z, width, length) {
  const geometry = new T.PlaneGeometry(width, length, 16, 9);
  const pos = geometry.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const across = pos.getX(i) / width;
    const t = .5 - pos.getY(i) / length;
    pos.setZ(i, Math.sin(across * 21 - t * 2.1) * .063 * t);
    pos.setY(i, pos.getY(i) + Math.sin(across * 37) * .08 * t ** 6 - .17 * t ** 6);
  }
  geometry.computeVertexNormals();
  const mesh = new T.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  block(parent, bronze, x, y + length / 2 + .038, z, width + .29, .06, .07);
}

function archGeometry(outline, depth) {
  return new T.ExtrudeGeometry(outline, { depth, bevelEnabled: false, curveSegments: 14 });
}

function northArch(scene, wall, trim) {
  const { gate, entryHalf } = THRONE_ROOM;
  const crown = 3.23;
  const spring = 2.05;
  const total = 7.98;
  const portalTop = TOWER_LEVEL + crown;
  const side = TOWER_WIDTH - entryHalf;
  block(scene, wall, 0, TOWER_LEVEL / 2, gate, TOWER_WIDTH * 2 + .55, TOWER_LEVEL, .62);
  block(scene, wall, 0, (portalTop + total) / 2, gate, TOWER_WIDTH * 2 + .55, total - portalTop, .62);
  for (const sign of [-1, 1]) {
    block(scene, wall, sign * (entryHalf + side / 2), TOWER_LEVEL + crown / 2, gate, side + .12, crown, .62);
    block(scene, trim, sign * (entryHalf + .06), TOWER_LEVEL + spring / 2, gate + .29, .18, spring, .18);
  }
  const curve = new T.Shape().moveTo(-entryHalf, spring)
    .quadraticCurveTo(-entryHalf * .89, crown - .31, 0, crown)
    .quadraticCurveTo(entryHalf * .89, crown - .31, entryHalf, spring)
    .lineTo(entryHalf, crown + .025).lineTo(-entryHalf, crown + .025).closePath();
  const stone = new T.Mesh(archGeometry(curve, .62), wall);
  stone.position.set(0, TOWER_LEVEL, gate - .31);
  scene.add(stone);
  const crownBand = new T.Shape().moveTo(-entryHalf, spring)
    .quadraticCurveTo(-entryHalf * .89, crown - .31, 0, crown)
    .quadraticCurveTo(entryHalf * .89, crown - .31, entryHalf, spring)
    .lineTo(entryHalf + .20, spring)
    .quadraticCurveTo(entryHalf * .98, crown - .16, 0, crown + .213)
    .quadraticCurveTo(-entryHalf * .98, crown - .16, -entryHalf - .20, spring).closePath();
  const carved = new T.Mesh(archGeometry(crownBand, .17), trim);
  carved.position.set(0, TOWER_LEVEL, gate + .23);
  scene.add(carved);
}

function flame(scene, x, floor, z, cool = false) {
  const pole = new T.Mesh(new T.CylinderGeometry(.060, .104, 1.19, 9), iron);
  pole.position.set(x, floor + .59, z);
  scene.add(pole);
  const dish = new T.Mesh(new T.CylinderGeometry(.28, .112, .23, 9), iron);
  dish.position.set(x, floor + 1.20, z);
  scene.add(dish);
  const coal = new T.Mesh(new T.IcosahedronGeometry(.24, 1), cool ? blue : ember);
  coal.position.set(x, floor + 1.4, z);
  scene.add(coal);
  const light = new T.PointLight(cool ? '#8ab9da' : '#ff9266', cool ? 30 : 39, 11, 2);
  light.position.set(x, floor + 1.92, z + .13);
  scene.add(light);
  return (time) => {
    const pulse = Math.sin(time * 7.6 + x) * .15 + .08 * Math.sin(time * 13.8 + z);
    coal.scale.set(.75 + pulse * .32, 1.36 + pulse, .70);
    coal.rotation.z = .19 * pulse;
    light.intensity = (cool ? 30 : 39) + pulse * 12;
  };
}

export function addStoneThrone(scene, stone, y, z) {
  const { armrestX } = THRONE_ROOM;
  const chair = new T.Group();
  chair.name = 'Stone throne';
  chair.position.set(0, y, z);
  chair.scale.y = THRONE_LORD_HEIGHT_SCALE;
  scene.add(chair);
  block(chair, stone, 0, .43, -.24, 1.99, .86, 1.03);
  block(chair, iron, 0, .91, -.22, 1.86, .16, .95);
  block(chair, stone, 0, 1.89, -.59, 1.75, 2.39, .38);
  const panel = new T.Shape().moveTo(-.97, -.08).lineTo(-.97, .76).lineTo(-.78, 1.68)
    .lineTo(-.48, 1.23).lineTo(-.29, 1.92).lineTo(-.05, 1.57).lineTo(.17, 2.18)
    .lineTo(.33, 1.55).lineTo(.59, 1.87).lineTo(.65, 1.26).lineTo(.98, 1.58).lineTo(.98, -.08).closePath();
  const crown = new T.Mesh(archGeometry(panel, .40), stone);
  crown.position.set(0, 1.38, -.78);
  chair.add(crown);
  for (const side of [-1, 1]) {
    block(chair, stone, side * .87, .61, .11, .34, 1.13, .38);
    block(chair, iron, side * armrestX, 1.18, .12, .40, .18, 1.19).name = 'Throne armrest';
    block(chair, bronze, side * (armrestX - .01), 1.24, .64, .38, .13, .07);
    for (let i = 0; i < 4; i++) {
      block(chair, iron, side * (.743 - i * .136), 2.01 + i * .12, -.342, .064, 1.52 + i * .19, .083);
    }
  }
}

export function addThroneDais(scene, stone, y, seatZ) {
  const { back, seat, dais } = THRONE_ROOM;
  const offset = seatZ - seat;
  for (let step = 0; step < dais.steps; step++) {
    const front = dais.front - step * dais.tread;
    block(scene, stone, 0, y + (step + .5) * dais.rise, offset + (back + front) / 2,
      2 * dais.halfWidth, dais.rise + .014, front - back);
  }
}

export function addThroneRoom(scene, surfaces, towerWall) {
  const { gate, entryHalf, entryEnd, halfWidth, back, height, seat, dais, riders } = THRONE_ROOM;
  const floorY = TOWER_LEVEL;
  const depth = entryEnd - back;
  const center = (entryEnd + back) / 2;
  const walls = surface(surfaces.masonry, '#736879', 4.1, 2.7);
  const floor = surface(surfaces.cobble, '#706171', 6.1, 6.4);
  const trim = surface(surfaces.masonry, '#a58a91', 1.8, 2.6);
  const basalt = surface(surfaces.slate, '#655866', 1.1, 1.42);
  const firstWall = scene.children.length;
  northArch(scene, towerWall, trim);
  block(scene, floor, 0, floorY - .16, center, halfWidth * 2, .32, depth);
  block(scene, floor, 0, floorY - .16, (gate + entryEnd) / 2, entryHalf * 2, .32, gate - entryEnd);
  block(scene, walls, 0, floorY + height + .22, center, halfWidth * 2 + .46, .44, depth);
  block(scene, walls, 0, floorY + height / 2, back - .23, halfWidth * 2 + .52, height, .46);
  const wing = halfWidth - entryHalf;
  for (const side of [-1, 1]) {
    block(scene, walls, side * (halfWidth + .21), floorY + height / 2, center, .42, height, depth);
    block(scene, walls, side * (entryHalf + wing / 2), floorY + height / 2, entryEnd, wing, height, .44);
    block(scene, walls, side * (entryHalf + .22), floorY + 1.65, (gate + entryEnd) / 2, .44, 3.3, gate - entryEnd);
    curtain(scene, banner, side * 4.29, floorY + 3.26, back + .28, 1.01, 2.94);
    for (const z of [-11.7, -15.28, -18.77, -22.15]) {
      block(scene, trim, side * (halfWidth - .18), floorY + 2.57, z, .68, 5.14, .58);
      block(scene, basalt, side * (halfWidth - .26), floorY + .23, z, .82, .46, .76);
      block(scene, basalt, side * (halfWidth - .24), floorY + 4.96, z, .80, .23, .78);
    }
  }
  block(scene, walls, 0, floorY + 3.47, (gate + entryEnd) / 2, entryHalf * 2 + .45, .33, gate - entryEnd);
  for (const z of [-11.7, -15.28, -18.77, -22.15]) block(scene, trim, 0, floorY + 5.05, z, halfWidth * 2, .30, .49);
  const carpet = surface(surfaces.timber, '#752638', 1.25, 3.8);
  block(scene, carpet, 0, floorY + .014, (entryEnd + dais.front) / 2, 2.18, .028, entryEnd - dais.front);
  for (const x of [-1.025, 1.025]) {
    block(scene, bronze, x, floorY + .03, (entryEnd + dais.front) / 2, .044, .014, entryEnd - dais.front);
  }
  addThroneDais(scene, basalt, floorY, seat);
  const sightBlockers = scene.children.slice(firstWall);
  for (const blocker of sightBlockers) blocker.updateMatrixWorld();
  const raised = floorY + dais.steps * dais.rise;
  hangPainting(scene, surfaces.paintings, 'court', -2.77, floorY + 3.02, back + .15, 0, 1.56);
  hangPainting(scene, surfaces.paintings, 'storm', 2.77, floorY + 3.02, back + .15, 0, 1.56);
  addStoneThrone(scene, basalt, raised, seat);
  const lord = throneLord(scene, 0, raised, seat, surfaces.paintings?.dungeon);
  const faceLight = new T.PointLight('#ffc4a2', 24, 8, 2);
  faceLight.position.set(-1.21, raised + 2.65 * THRONE_LORD_HEIGHT_SCALE, seat + 1.93);
  scene.add(faceLight);
  const fire = [
    flame(scene, -2.63, floorY, -13.15), flame(scene, 2.63, floorY, -13.15),
    flame(scene, -2.67, floorY, -19.61, true), flame(scene, 2.67, floorY, -19.61, true),
  ];
  const attendants = riders.map((position) => ({ position, actor: createRider(scene, surfaces.barren, () => floorY) }));
  const riderCover = riders.flatMap(({ x, z }) => [
    new T.Box3(new T.Vector3(x - .45, floorY + .70, z - 1.24), new T.Vector3(x + .45, floorY + 1.99, z + 1.28)),
    new T.Box3(new T.Vector3(x - .30, floorY + 1.73, z - .40), new T.Vector3(x + .30, floorY + 3.12, z + .30)),
  ]);
  const eye = new T.Vector3(0, raised + THRONE_LORD_EYE_Y, seat + .16);
  const target = new T.Vector3();
  const direction = new T.Vector3();
  const coverHit = new T.Vector3();
  const sight = new T.Raycaster(eye, direction, .05);
  const intersections = [];
  let motionHold = 0;

  function visiblePlayer(player, height) {
    if (!player || height < floorY - .02 || height > raised + .02) return null;
    target.set(player.x, height + 1.7, player.z);
    direction.subVectors(target, eye);
    const distance = direction.length();
    if (distance > 18 || direction.z < .4 || Math.abs(direction.x) > direction.z * 1.9) return null;
    sight.set(eye, direction.normalize());
    sight.far = distance - .06;
    intersections.length = 0;
    if (sight.intersectObjects(sightBlockers, false, intersections).length) return null;
    if (riderCover.some((box) => sight.ray.intersectBox(box, coverHit) && coverHit.distanceTo(eye) < sight.far)) return null;
    return target;
  }

  function animate(time, elapsed, player, standingHeight, moving) {
    motionHold = player && inThroneRoom(player.z, standingHeight)
      ? (moving ? .42 : Math.max(0, motionHold - elapsed)) : 0;
    lord(time, elapsed, visiblePlayer(player, standingHeight), motionHold > 0);
    if (player && player.z >= -3) return;
    for (const update of fire) update(time);
    for (const [index, { position, actor }] of attendants.entries()) {
      actor.pose(position.x, position.z, position.yaw, time, { cycle: time * .31 + index * .42, pace: 0, armed: true });
    }
  }
  animate(0);
  return animate;
}
