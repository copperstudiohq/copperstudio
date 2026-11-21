import * as T from './vendor/three.module.js';
import { seeded } from './layout.mjs';
import { repeatSurface } from './surfaces.mjs';
import { addThroneRoom } from './throne-room.mjs';
import { createTowerGuards } from './tower-guards.mjs';
import { hangPainting } from './tower-paintings.mjs';
import { SERVICE_DOOR, TOWER_LENGTH, TOWER_LEVEL, TOWER_PLATFORMS, TOWER_STAIRS, TOWER_WIDTH } from './tower-plan.mjs';

const box = new T.BoxGeometry();
const flame = new T.MeshBasicMaterial({ color: '#ffbf70' });
const iron = new T.MeshStandardMaterial({ color: '#393233', metalness: .4, roughness: .76 });
const flag = new T.MeshStandardMaterial({ color: '#662f34', roughness: .98, side: T.DoubleSide });

function block(parent, material, x, y, z, w, h, d) {
  const mesh = new T.Mesh(box, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  parent.add(mesh);
  return mesh;
}

function finish(texture, u, v, color) {
  const tile = repeatSurface(texture, u, v);
  return new T.MeshStandardMaterial({ color, map: tile, bumpMap: tile, bumpScale: .048, roughness: .94 });
}

function stairs(scene, stone, wood) {
  const up = new T.Vector3(0, 1, 0);
  for (const { x0, x1, from, to, base, steps, rise, tread } of TOWER_STAIRS) {
    const direction = Math.sign(to - from);
    const center = (x0 + x1) / 2;
    const railX = center < 0 ? x1 : x0;
    for (let i = 0; i < steps; i++) {
      const y = base + (i + 1) * rise;
      const z = from + direction * (i + .5) * tread;
      block(scene, stone, center, y - .12, z, x1 - x0, .24, tread + .008);
      if (i % 3 === 0) block(scene, wood, railX, y + .45, z, .09, .90, .09);
    }
    const start = new T.Vector3(railX, base + .93, from);
    const end = new T.Vector3(railX, base + TOWER_LEVEL + .93, to);
    const beam = block(scene, wood, 0, 0, 0, .11, start.distanceTo(end), .11);
    beam.position.copy(start).lerp(end, .5);
    beam.quaternion.setFromUnitVectors(up, end.sub(start).normalize());
  }
}

function door(parent, wood, stone, x, y, z) {
  block(parent, wood, x, y + 1.08, z, 1.55, 2.16, .158);
  for (const side of [-1, 1]) {
    block(parent, stone, x + side * .89, y + 1.175, z, .22, 2.35, .39);
    block(parent, iron, x, y + 1.14 + side * .65, z + .092, 1.54, .088, .056);
  }
  block(parent, stone, x, y + 2.30, z, 1.99, .30, .39);
  block(parent, iron, x + .50, y + 1.05, z + .135, .18, .063, .075);
}

function brazier(scene, x, y, z, phase) {
  block(scene, iron, x, y + .27, z, .15, .56, .15);
  const bowl = new T.Mesh(new T.CylinderGeometry(.23, .122, .23, 9, 1, true), iron);
  bowl.position.set(x, y + .59, z);
  scene.add(bowl);
  const fire = new T.Mesh(new T.IcosahedronGeometry(.19, 1), flame);
  fire.position.set(x, y + .76, z);
  scene.add(fire);
  const light = new T.PointLight('#ffa658', 38, 12, 2);
  light.position.set(x, y + .94, z);
  scene.add(light);
  return (time) => {
    const sway = Math.sin(time * 8 + phase) * .09 + Math.cos(time * 15 + phase) * .05;
    light.intensity = 40 + sway * 24;
    fire.scale.set(.76, 1.47 + sway, .79);
    fire.rotation.z = sway;
  };
}

function walls(scene, stone, rubble) {
  const chips = seeded(3081);
  const highestFloor = TOWER_LEVEL * 2;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const z = (i - 3) * 2.20;
      const slit = i % 3 === 1 && i > 0 && i < 6;
      if (slit) {
        for (const y of [.87, 3.75, 6.98]) block(scene, stone, side * TOWER_WIDTH, y, z, .58, y === .87 ? 1.74 : 2.12, 2.2);
        for (const direction of [-1, 1]) block(scene, stone, side * TOWER_WIDTH, 4.08, z + direction * .69, .58, 8.16, .81);
      } else {
        const height = 7.86 + chips() * 2.10;
        block(scene, stone, side * TOWER_WIDTH, height / 2, z, .64, height, 2.23);
      }
    }
    if (side > 0) block(scene, stone, 0, 3.99, TOWER_LENGTH, TOWER_WIDTH * 2 + .55, 7.98, .62);
    for (let i = 0; i < 5; i++) {
      const height = .40 + chips() * 1.58;
      block(scene, rubble, (i - 2) * 2.41, 7.98 + height / 2, side * TOWER_LENGTH, 1.62, height, .68);
    }
  }
  for (const [x, z, size] of [[-5.58, -5.1, .50], [5.66, 5.97, .29], [5.56, -4.89, .61]]) {
    const rock = new T.Mesh(new T.DodecahedronGeometry(size, 0), rubble);
    rock.position.set(x, z > 0 ? highestFloor + size * .35 : size * .5, z);
    rock.rotation.set(.4, z, .31);
    scene.add(rock);
  }
}

export function createTower(surfaces) {
  const scene = new T.Scene();
  scene.background = new T.Color('#1c2730');
  scene.fog = new T.FogExp2('#26232a', .020);
  scene.add(new T.HemisphereLight('#c4dafa', '#6b5250', 1.09));
  const moon = new T.DirectionalLight('#b1ccff', 1.20);
  moon.position.set(-5, 12, -7.5);
  scene.add(moon);
  const stone = finish(surfaces.masonry, 2.8, 5.4, '#7f7b81');
  const stair = finish(surfaces.masonry, 1.5, .7, '#8e7770');
  const floor = finish(surfaces.cobble, 7, 7, '#837b74');
  const wood = finish(surfaces.timber, 1.6, 1, '#5a4138');
  const rubble = finish(surfaces.masonry, 1.3, 1.4, '#605b61');

  for (const { x0, x1, z0, z1, y } of TOWER_PLATFORMS) {
    block(scene, floor, (x0 + x1) / 2, y - .157, (z0 + z1) / 2, x1 - x0, .315, z1 - z0);
  }
  walls(scene, stone, rubble);
  stairs(scene, stair, wood);
  hangPainting(scene, surfaces.paintings, 'dungeon', -5.86, 1.91, 2.69, Math.PI / 2, 1.37);
  hangPainting(scene, surfaces.paintings, 'battlefield', 3.85, TOWER_LEVEL + 1.88, -7.13, 0, 1.49);
  for (const x of [-2.74, 1.83]) {
    block(scene, flag, x, 4.66, -7.20, .85, 2.32, .035);
    block(scene, iron, x, 5.89, -7.18, 1.06, .058, .052);
  }
  // Raised ledges border the open shaft between the two flights.
  block(scene, stone, -3.04, TOWER_LEVEL + .24, .03, .18, .48, 7.18);
  block(scene, stone, 3.04, 2 * TOWER_LEVEL + .27, .56, .20, .54, 7.86);
  block(scene, stone, -4.72, 2 * TOWER_LEVEL + .29, SERVICE_DOOR.z, 2.92, .58, .17);
  block(scene, stone, -.03, 2 * TOWER_LEVEL + .29, SERVICE_DOOR.z, 6.29, .58, .17);
  door(scene, wood, stair, 0, 0, TOWER_LENGTH - .31);
  door(scene, wood, stair, SERVICE_DOOR.x, TOWER_LEVEL * 2, SERVICE_DOOR.z - .08);
  const marks = [
    brazier(scene, -4.91, 0, 5.2, 0), brazier(scene, 4.86, 0, -.87, 1), brazier(scene, .6, 0, -5.9, 2),
    brazier(scene, -4.62, TOWER_LEVEL, -5.3, 3), brazier(scene, 4.67, TOWER_LEVEL, -4.87, 4),
    brazier(scene, -4.91, TOWER_LEVEL * 2, -2.61, 5),
  ];
  const guards = createTowerGuards(scene, surfaces.barren);
  const court = addThroneRoom(scene, surfaces, stone);
  return {
    scene,
    reset() {
      guards.reset();
      court(0);
    },
    animate(time, elapsed, player, height, moving = false, prisoner) {
      for (const flicker of marks) flicker(time);
      court(time, elapsed, player, height, moving);
      return guards.advance(elapsed, player, height, prisoner);
    },
  };
}
