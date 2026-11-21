import * as T from './vendor/three.module.js';
import { seeded } from './layout.mjs';
import { repeatSurface } from './surfaces.mjs';

export const BATTLEFIELD_NAME = 'The Ashen Battlefield';
export const BATTLEFIELD_SPAWN = { x: 0, z: 14.1, yaw: 0, pitch: -.061 };
export const BATTLEFIELD_EXIT = { x: 1.83, z: -64 };
const WIDTH = 330;
const DEPTH = 330;

export function battlefieldHeight(x, z) {
  return Math.sin(x * .041 + z * .032) * .62 + Math.sin(z * .076 - x * .011) * .38
    + Math.cos(x * .111 + z * .043) * .22 + Math.sin(x * .017 - z * .024) * .75;
}

export function canWalkBattlefield(x, z) {
  return Math.hypot(x / 144, z / 144) < 1;
}

export function battlefieldAction({ x, z }) {
  return Math.hypot(x - BATTLEFIELD_EXIT.x, z - BATTLEFIELD_EXIT.z) < 2.25;
}

function brownSurface(texture, u, v, color) {
  const map = repeatSurface(texture, u, v);
  return new T.MeshStandardMaterial({ color, map, roughness: .99, bumpMap: map, bumpScale: .068 });
}

function path(scene, material) {
  const points = [];
  const uv = [];
  const indices = [];
  for (let i = 0; i <= 110; i++) {
    const z = 19 - i * .79;
    const x = BATTLEFIELD_EXIT.x * (1 - i / 110) * Math.sin(i * .17);
    const width = 1.53 + .29 * Math.sin(i * .26);
    for (const side of [-1, 1]) {
      const edge = x + side * width;
      points.push(edge, battlefieldHeight(edge, z) + .095, z);
      uv.push((side + 1) / 2, i / 110);
    }
    if (!i) continue;
    const k = i * 2;
    indices.push(k - 2, k - 1, k, k - 1, k + 1, k);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  scene.add(new T.Mesh(geometry, material));
}

function fallen(scene, earth, weathered) {
  const random = seeded(62932);
  const layout = [[-3.8, 8.8], [4.2, 7.1], [-7.9, 5.6], [8.1, 2.4], [4.5, -2.2], [-5.8, -5.2]];
  for (let i = 0; i < 104; i++) {
    const side = i % 2 ? 1 : -1;
    layout.push([side * (4.2 + random() ** 1.68 * 83), 11 - random() * 127]);
  }
  const round = new T.SphereGeometry(1, 10, 7);
  const segment = new T.CylinderGeometry(.68, 1, 1, 7);
  const torsos = new T.InstancedMesh(round, earth, layout.length * 4);
  const limbs = new T.InstancedMesh(segment, earth, layout.length * 10);
  const armor = new T.InstancedMesh(round, weathered, layout.length * 3);
  torsos.name = 'Earth-stained fallen soldiers';
  scene.add(torsos, limbs, armor);
  const counts = new Map([[torsos, 0], [limbs, 0], [armor, 0]]);
  const transform = new T.Object3D();
  const direction = new T.Vector3();
  const up = new T.Vector3(0, 1, 0);

  for (const [x, z] of layout) {
    const yaw = random() * Math.PI * 2;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const scale = .80 + random() * .25;
    const dye = new T.Color().setScalar(.76 + random() * .34);
    function onEarth(localX, localZ) {
      const px = x + (localX * cos + localZ * sin) * scale;
      const pz = z + (localZ * cos - localX * sin) * scale;
      return new T.Vector3(px, battlefieldHeight(px, pz), pz);
    }
    function put(mesh, at, dimensions) {
      const i = counts.get(mesh);
      transform.position.copy(at);
      transform.scale.set(...dimensions);
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
      mesh.setColorAt(i, dye);
      counts.set(mesh, i + 1);
    }
    function oval(mesh, lx, lz, lift, width, height, length) {
      const at = onEarth(lx, lz);
      at.y += lift * scale;
      transform.rotation.set(.07, yaw, -.16);
      put(mesh, at, [width * scale, height * scale, length * scale]);
    }
    function joint(ax, az, bx, bz, lift, width) {
      const a = onEarth(ax, az);
      const b = onEarth(bx, bz);
      a.y += lift * scale;
      b.y += lift * scale * .89;
      direction.subVectors(b, a);
      const length = direction.length();
      transform.quaternion.setFromUnitVectors(up, direction.normalize());
      put(limbs, a.lerp(b, .5), [width * scale, length + .05, width * scale]);
    }

    oval(torsos, .01, .19, .135, .225, .143, .318);
    oval(torsos, 0, -.15, .105, .17, .114, .185);
    oval(torsos, -.018, .535, .097, .101, .100, .132);
    if (random() < .62) oval(armor, -.02, .573, .115, .112, .115, .124);
    const bent = .16 + random() * .16;
    for (const side of [-1, 1]) {
      joint(side * .15, .365, side * bent, .14, .111, .069);
      joint(side * bent, .14, side * (bent + .14), -.02 - .12 * random(), .076, .055);
      joint(side * .095, -.15, side * .15, -.449, .091, .082);
      joint(side * .15, -.449, side * .16, -.733, .078, .069);
      oval(armor, side * .16, -.787, .061, .073, .070, .125);
    }
  }
  for (const [mesh, count] of counts) mesh.count = count;
}

function remains(scene, surfaces) {
  const random = seeded(426);
  const wood = brownSurface(surfaces.timber, 1, 1, '#715746');
  const stone = brownSurface(surfaces.barren, 1, 1, '#746157');
  const cloth = new T.MeshStandardMaterial({ color: '#584138', roughness: 1, side: T.DoubleSide });
  const plank = new T.BoxGeometry();
  const chunk = new T.DodecahedronGeometry(.67, 0);
  const pennant = new T.Shape().moveTo(0, 0).lineTo(1.04, .02).lineTo(.86, -.46)
    .lineTo(.55, -.29).lineTo(.38, -.48).lineTo(0, -.36).closePath();
  const flag = new T.ShapeGeometry(pennant);
  for (let i = 0; i < 51; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (7.8 + random() * 92);
    const z = 9 - random() * 130;
    const y = battlefieldHeight(x, z);
    const piece = new T.Mesh(i % 3 ? plank : chunk, i % 3 ? wood : stone);
    piece.position.set(x, y + .08, z);
    piece.scale.set(.28 + random() * 1.3, .12 + random() * .48, .12 + random() * .43);
    piece.rotation.set(random() * .78, random() * 6.28, random() * .78);
    scene.add(piece);
  }
  for (const [x, z] of [[-8, 6], [9, -5], [19, -18], [-23, -24], [27, -44], [-13, -59], [52, -77]]) {
    const group = new T.Group();
    group.position.set(x, battlefieldHeight(x, z), z);
    group.rotation.set(.13, random() * Math.PI, -.24);
    scene.add(group);
    const mast = new T.Mesh(plank, wood);
    mast.position.y = 1.31;
    mast.scale.set(.083, 2.63, .093);
    group.add(mast);
    const rag = new T.Mesh(flag, cloth);
    rag.position.set(0, 2.49, .051);
    group.add(rag);
  }
  for (const [x, z, height] of [[-.95, -66.2, 2.95], [3.45, -65.8, 2.08], [-2.25, 17.6, 4.0], [2.35, 17.6, 3.37]]) {
    const masonry = new T.Mesh(plank, brownSurface(surfaces.masonry, 1, 2, '#716057'));
    masonry.position.set(x, battlefieldHeight(x, z) + height * .48, z);
    masonry.scale.set(1.02, height, 1.13);
    masonry.rotation.z = .065;
    scene.add(masonry);
  }
  const marker = new T.Mesh(plank, wood);
  marker.position.set(BATTLEFIELD_EXIT.x, battlefieldHeight(BATTLEFIELD_EXIT.x, BATTLEFIELD_EXIT.z) + .79, BATTLEFIELD_EXIT.z);
  marker.scale.set(.15, 1.62, .18);
  scene.add(marker);
  const lamp = new T.Mesh(new T.SphereGeometry(.13, 9, 7), new T.MeshBasicMaterial({ color: '#f2ba78' }));
  lamp.position.copy(marker.position);
  lamp.position.y += .82;
  scene.add(lamp);
  const light = new T.PointLight('#f9a25e', 19, 10, 2);
  light.position.copy(lamp.position);
  scene.add(light);
}

export function createBattlefield(surfaces) {
  const scene = new T.Scene();
  scene.fog = new T.FogExp2('#635950', .0138);
  scene.add(new T.HemisphereLight('#c0b4a2', '#856858', 1.98));
  const moon = new T.DirectionalLight('#d0c2aa', 1.52);
  moon.position.set(-14, 23, 11);
  scene.add(moon);
  const geometry = new T.PlaneGeometry(WIDTH, DEPTH, 230, 230).rotateX(-Math.PI / 2);
  const vertices = geometry.getAttribute('position');
  for (let i = 0; i < vertices.count; i++) vertices.setY(i, battlefieldHeight(vertices.getX(i), vertices.getZ(i)));
  geometry.computeVertexNormals();
  const earthTint = '#b08f70';
  const ground = brownSurface(surfaces.barren, 97, 97, earthTint);
  scene.add(new T.Mesh(geometry, ground));
  path(scene, brownSurface(surfaces.barren, 1, 32, '#c4a583'));
  fallen(scene, brownSurface(surfaces.barren, 1.2, 1.2, earthTint), brownSurface(surfaces.barren, 1.6, 1.6, '#826553'));
  remains(scene, surfaces);
  return scene;
}
