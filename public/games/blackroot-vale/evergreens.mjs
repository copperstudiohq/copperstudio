import * as T from './vendor/three.module.js';
import { FIELD_LINE, groundHeight, houseContains, seeded, trailDistance, WOODLAND_HOUSE } from './layout.mjs';
import { repeatSurface } from './surfaces.mjs';

const TAU = 2 * Math.PI;
const TILE_SIZE = 32;
const PROFILES = [
  { base: .28, reach: .215, taper: .82 },
  { base: .23, reach: .19, taper: .77 },
  { base: .39, reach: .235, taper: .90 },
];
const stemTint = ['#c4b6a3', '#b5a793', '#aa9e8d', '#c9bcae'];
const leafTint = ['#a0b3a0', '#acb39b', '#9ead9c', '#b0bca6', '#9da898'];
const transform = new T.Object3D();
const tint = new T.Color();

function treeLocations(random) {
  const spots = [
    { x: -19, z: 29 }, { x: 23, z: 27 }, { x: -24, z: 16 }, { x: 27, z: 19 },
    { x: -17, z: -24 }, { x: 15, z: -25 }, { x: -7, z: -29 }, { x: 8, z: -31 },
    { x: -6.5, z: -52 }, { x: 5.2, z: -57 }, { x: 9, z: -66 },
  ];
  for (let z = -264; z < 73; z += 5.4) {
    for (let x = -258; x < 264; x += 5.4) {
      const px = x + (random() - .5) * 5.2;
      const pz = z + (random() - .5) * 5.2;
      if (Math.hypot(px, pz) > 269 || (pz > -25 && Math.abs(px) < 32)
        || (pz > 33 && Math.abs(px) < 15) || (pz > FIELD_LINE && Math.abs(px) < 91)
        || trailDistance(px, pz) < 2.35) continue;
      const density = .36 + .18 * Math.sin(z * .064 + x * .09) + .15 * Math.cos(x * .071 - z * .122);
      if (random() > density || spots.some((point) => Math.abs(px - point.x) < 1.5 && Math.abs(pz - point.z) < 1.5)) continue;
      if (houseContains(px, pz, WOODLAND_HOUSE, 3.1)) continue;
      spots.push({ x: px, z: pz });
    }
  }
  return spots;
}

function stemGeometry() {
  const stem = new T.CylinderGeometry(.04, .43, 1, 11, 9, true);
  const points = stem.attributes.position;
  for (let i = 0; i < points.count; i++) {
    const height = points.getY(i) + .5;
    const mult = .78 + .28 * Math.exp(-height * 17) + .06 * Math.sin(i % 12 * 1.8);
    const bend = .085 * Math.sin(height * 8.3) + .14 * height * height;
    points.setX(i, mult * points.getX(i) + bend);
    points.setZ(i, mult * points.getZ(i) - bend * .36);
  }
  stem.computeVertexNormals();
  return stem;
}

function addSpray(mesh, y, angle, length, width, drop, roll, detail) {
  const points = mesh.coordinates;
  const uvs = mesh.uvs;
  const indices = mesh.indices;
  const base = points.length / 3;
  const segments = detail ? 3 : 1;
  const dx = Math.cos(angle);
  const dz = Math.sin(angle);
  for (let slice = 0; slice <= segments; slice++) {
    const t = slice / segments;
    const reach = t * length;
    const bend = drop * Math.sin(t * 1.85);
    for (const side of [-.5, .5]) {
      const cross = width * side;
      const plane = Math.cos(roll + .34 * t) * cross;
      points.push(dx * reach - dz * plane, y + bend + Math.sin(roll + .34 * t) * cross, dz * reach + dx * plane);
      uvs.push(t, side + .5);
    }
  }
  for (let slice = 0; slice < segments; slice++) {
    const i = base + slice * 2;
    indices.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
  }
}

function crownGeometry(profile, index, detail) {
  const mesh = { coordinates: [], uvs: [], indices: [] };
  const random = seeded(958 + index * 37);
  const rows = detail ? 11 : 7;
  for (let row = 0; row < rows; row++) {
    const progress = row / rows;
    const base = profile.base + (1 - profile.base) * progress;
    const envelope = profile.reach * (1 - progress) ** profile.taper;
    const arms = detail ? 4 + (row % 3 === 0 ? 1 : 0) : 4;
    for (let arm = 0; arm < arms; arm++) {
      const direction = row * 1.52 + TAU * arm / arms + (random() - .5) * .46;
      const length = envelope * (.70 + .47 * random());
      const y = base + (random() - .5) * .052;
      const pitch = length * (progress * .46 - .22 - random() * .24);
      const roll = (random() - .5) * 1.15;
      addSpray(mesh, y, direction, length, length * .73, pitch, roll, detail);
      if (detail || arm % 2 === 0) {
        addSpray(mesh, y + .008, direction + .16, length * .94, length * .74, pitch + length * .29, roll + 1.14, detail);
      }
    }
  }
  for (let i = 0; i < 7; i++) {
    addSpray(mesh, .86 + i * .014, i * 2.39, .05 - i * .004, .025, .032, i * .79, detail);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(mesh.coordinates, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(mesh.uvs, 2));
  geometry.setIndex(mesh.indices);
  geometry.computeVertexNormals();
  return geometry;
}

function place(mesh, i, x, y, z, w, h, yaw, color) {
  transform.position.set(x, y, z);
  transform.scale.set(w, h, w);
  transform.rotation.set(0, yaw, 0);
  transform.updateMatrix();
  mesh.setMatrixAt(i, transform.matrix);
  mesh.setColorAt(i, tint.set(color));
}

function populateTile(tile, spots, geometry, material) {
  const trunks = new T.InstancedMesh(geometry.stem, material.bark, spots.length);
  trunks.castShadow = true;
  trunks.receiveShadow = true;
  tile.add(trunks);
  const high = new T.Group();
  const low = new T.Group();
  for (const [i, point] of spots.entries()) {
    const height = point.height;
    place(trunks, i, point.x - tile.position.x, point.y + .478 * height, point.z - tile.position.z,
      point.thickness, height * .98, point.yaw, point.bark);
  }
  for (const [variant, profile] of geometry.crowns.entries()) {
    const matching = spots.filter((spot) => spot.variant === variant);
    if (!matching.length) continue;
    for (const [model, group] of [[profile.high, high], [profile.low, low]]) {
      const batch = new T.InstancedMesh(model, material.foliage, matching.length);
      batch.castShadow = true;
      batch.receiveShadow = true;
      group.add(batch);
      for (const [i, point] of matching.entries()) {
        place(batch, i, point.x - tile.position.x, point.y, point.z - tile.position.z,
          point.height * point.spread, point.height, point.yaw, point.leaves);
      }
    }
  }
  tile.addLevel(high, 0);
  tile.addLevel(low, 62, .13);
}

function branchesAndRoots(scene, trees, material, random) {
  const length = trees.length * 7;
  const limbs = new T.InstancedMesh(new T.CylinderGeometry(.07, .52, 1, 7, 2), material, length);
  const start = new T.Vector3();
  const end = new T.Vector3();
  const axis = new T.Vector3();
  const up = new T.Vector3(0, 1, 0);
  let instance = 0;
  for (const point of trees) {
    for (let i = 0; i < 7; i++) {
      const root = i < 4;
      const angle = point.yaw + i * 2.04 + random() * .54;
      const radius = root ? point.thickness * (.78 + .60 * random()) : point.height * (.055 + .035 * random());
      const x = point.x + Math.cos(angle) * radius;
      const z = point.z + Math.sin(angle) * radius;
      const y = root ? point.y + point.thickness * (.15 + random() * .18) : point.y + point.height * (.145 + .065 * (i - 4));
      start.set(point.x, y, point.z);
      end.set(x, root ? groundHeight(x, z) - .036 : y + radius * (.49 - .32 * random()), z);
      axis.subVectors(end, start);
      const width = point.thickness * (root ? .36 : .18) * (.8 + random() * .37);
      transform.position.copy(start).lerp(end, .5);
      transform.scale.set(width, axis.length(), width);
      transform.quaternion.setFromUnitVectors(up, axis.normalize());
      transform.updateMatrix();
      limbs.setMatrixAt(instance, transform.matrix);
      limbs.setColorAt(instance++, tint.set(point.bark));
    }
  }
  limbs.castShadow = true;
  limbs.receiveShadow = true;
  scene.add(limbs);
}

export function createEvergreens(scene, surfaces) {
  const random = seeded(731);
  const geometry = {
    stem: stemGeometry(),
    crowns: PROFILES.map((profile, i) => ({ high: crownGeometry(profile, i, true), low: crownGeometry(profile, i, false) })),
  };
  const bark = repeatSurface(surfaces.bark, 2, 5);
  const material = {
    bark: new T.MeshStandardMaterial({ map: bark, bumpMap: bark, bumpScale: .045, roughness: .94 }),
    foliage: new T.MeshStandardMaterial({
      map: surfaces.spruce, alphaTest: .46, alphaToCoverage: true, side: T.DoubleSide,
      emissive: '#34442d', emissiveMap: surfaces.spruce, emissiveIntensity: .20, roughness: .98,
    }),
  };
  const tiles = new Map();
  const landmarks = [];
  const spots = treeLocations(random);
  for (const [index, point] of spots.entries()) {
    point.y = groundHeight(point.x, point.z);
    point.height = (0.47 + random() ** .60 * .89) * (point.z > -31 ? 12.4 : 19.5);
    point.thickness = Math.max(.42, point.height * (.066 + random() * .037));
    point.radius = point.thickness * .44;
    point.yaw = random() * TAU;
    point.variant = Math.floor(random() * PROFILES.length);
    point.spread = .85 + random() * .40;
    point.bark = stemTint[index % stemTint.length];
    point.leaves = leafTint[index % leafTint.length];
    const tx = Math.floor(point.x / TILE_SIZE);
    const tz = Math.floor(point.z / TILE_SIZE);
    const key = tx + ':' + tz;
    if (!tiles.has(key)) tiles.set(key, { x: (tx + .5) * TILE_SIZE, z: (tz + .5) * TILE_SIZE, spots: [] });
    tiles.get(key).spots.push(point);
    if (point.z < -27 && trailDistance(point.x, point.z) < 11) landmarks.push(point);
  }
  for (const entry of tiles.values()) {
    const tile = new T.LOD();
    tile.position.set(entry.x, 0, entry.z);
    populateTile(tile, entry.spots, geometry, material);
    scene.add(tile);
  }
  branchesAndRoots(scene, landmarks, material.bark, random);
  return spots;
}
