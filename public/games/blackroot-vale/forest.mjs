import * as T from './vendor/three.module.js';
import { groundHeight, houseContains, seeded, STRUCTURES, trailDistance } from './layout.mjs';

import { createEvergreens } from './evergreens.mjs';
import { repeatSurface } from './surfaces.mjs';
const s = new T.Object3D();
const color = new T.Color();
const TAU = Math.PI * 2;

function setInstance(mesh, index, x, y, z, sx, sy, sz, yaw, tone) {
  s.position.set(x, y, z);
  s.scale.set(sx, sy, sz);
  s.rotation.set(0, yaw, 0);
  s.updateMatrix();
  mesh.setMatrixAt(index, s.matrix);
  mesh.setColorAt(index, tone);
}

function plants(scene, random) {
  const fern = new T.BufferGeometry();
  const positions = [];
  for (let blade = 0; blade < 7; blade++) {
    const angle = blade * TAU / 7;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const tip = .50 + .21 * random();
    const height = .30 + .19 * random();
    const point = (t, side) => [dx * tip * t + dz * side, Math.sin(t * 2.05) * height, dz * tip * t - dx * side];
    for (let leaf = 0; leaf < 6; leaf++) {
      const t = .11 + leaf * .135;
      const leafWidth = .11 * (1 - t) + .02;
      positions.push(...point(t, -.018), ...point(t, .018), ...point(t + .15, 0));
      for (const side of [-1, 1]) {
        positions.push(...point(t, 0), ...point(t + .11, leafWidth * side), ...point(t + .075, 0));
      }
    }
  }
  fern.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  fern.computeVertexNormals();
  const leafMaterial = new T.MeshStandardMaterial({ color: '#b2b9a0', roughness: 1, side: T.DoubleSide });
  const brush = new T.InstancedMesh(fern, leafMaterial, 900);
  const foreground = [[-2.1, -47.5], [-2.65, -47.2], [1.54, -48.6], [2.10, -49.5], [-2.8, -50.15], [-4.2, -53.9], [1.43, -55.45]];
  for (const [i, [x, z]] of foreground.entries()) {
    const size = 1.12 + random() * .83;
    setInstance(brush, i, x, groundHeight(x, z), z, size, size, size, random() * TAU, color.set('#627a46'));
  }
  let placed = foreground.length;
  while (placed < brush.count) {
    const z = 36 - random() * 245;
    const x = (random() - .5) * (z < -30 ? 135 : 63);
    if (trailDistance(x, z) < (z < -30 ? 1.75 : 2.9) || STRUCTURES.some((house) => houseContains(x, z, house, .17))) continue;
    const size = .35 + random() ** 2 * 2.5;
    setInstance(brush, placed, x, groundHeight(x, z) - .016, z, size, size, size, random() * TAU,
      color.setHSL(.20 + random() * .14, .19 + random() * .27, .21 + random() * .26));
    placed++;
  }
  scene.add(brush);
}

function trailStones(scene, random, earth) {
  const stones = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), earth, 195);
  for (let i = 0; i < stones.count; i++) {
    const z = -32 - random() * 107;
    const plot = -6 + 12 * random();
    const x = plot - (.172 * (-z - 36));
    const size = .045 + random() ** 3 * .175;
    setInstance(stones, i, x, groundHeight(x, z) + .04, z, size * 1.23, size * .35, size, random() * TAU,
      color.setHSL(.10 + random() * .18, .10, .22 + random() * .32));
  }
  scene.add(stones);
}

function rocks(scene, random, earth) {
  const instances = new T.InstancedMesh(irregularRock(), earth, 140);
  const places = [
    { x: 5.3, z: -50.15, size: 1.34 }, { x: 6.02, z: -49.7, size: 1.03 }, { x: 7.3, z: -51.3, size: 1.72 },
    { x: -10.8, z: -70, size: 1.6 }, { x: -13, z: -71.5, size: 1.08 },
  ];
  while (places.length < instances.count) {
    const x = (random() - .5) * 159;
    const z = 32 - random() * 250;
    if (trailDistance(x, z) < 2.8 || STRUCTURES.some((house) => houseContains(x, z, house, 1.4))) continue;
    places.push({ x, z, size: .25 + random() ** 2 * 1.37 });
  }
  for (const [i, { x, z, size }] of places.entries()) {
    setInstance(instances, i, x, groundHeight(x, z) + size * .24, z, size, size * (.51 + random() * .35), size * (.59 + random() * .45), random() * TAU,
      color.setHSL(.10 + random() * .21, .04 + random() * .11, .24 + random() * .29));
  }
  instances.castShadow = true;
  instances.receiveShadow = true;
  scene.add(instances);
  return places.filter((rock) => rock.size > .73).map((rock) => ({ ...rock, radius: rock.size * .77 }));
}

function irregularRock() {
  const rock = new T.IcosahedronGeometry(1, 2);
  const vertices = rock.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const y = vertices.getY(i);
    const z = vertices.getZ(i);
    const uneven = .94 + .14 * Math.sin(x * 8.1 + z * 4.7) * Math.cos(y * 9.4 + z);
    vertices.setXYZ(i, x * uneven, Math.min(.85, y * uneven), z * uneven);
  }
  rock.computeVertexNormals();
  return rock;
}

export function createForest(scene, surfaces) {
  const random = seeded(1328);
  const fieldstone = repeatSurface(surfaces.masonry, .52);
  const earth = new T.MeshStandardMaterial({ map: fieldstone, bumpMap: fieldstone, bumpScale: .03, roughness: .94 });
  const obstacles = createEvergreens(scene, surfaces);
  plants(scene, random);
  trailStones(scene, random, earth);
  return obstacles.concat(rocks(scene, random, earth));
}
