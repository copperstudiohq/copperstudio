import * as THREE from './assets/three.module.js';
import { ARENA_SIZE } from './arena-config.js';

const COPPER_BODY = 0xb96e43;
const COPPER_EDGE = 0xdb9b64;
const COPPER_DARK = 0x784b35;
const COPPER = 0x497c73;
const WALL_BAYS = 40;
const SEAT_SEGMENTS = 56;
const TAU = Math.PI * 2;
export const COL_SURFACE = 'colosseum-copper';
const COURSE_SIZE = .55;
const COURSE_SEAM = .026;
const VAULT_STEP = .5;

/** Add an empty Roman amphitheatre; the parent owns batching, weather and disposal. */
export function buildColosseum(arena) {
  if (!arena?.scene?.isScene || typeof arena.box !== 'function'
    || typeof arena.surfaceMaterial !== 'function' || !arena.worldGeometries?.add || !arena.materials?.set) {
    throw new TypeError('A Colosseum needs a scene, box/surface material factories and owned geometry/material collections.');
  }

  function box(name, x, y, z, width, height, depth, color = COPPER_BODY, surface = COL_SURFACE, parent) {
    const mesh = arena.box(x, y, z, width, height, depth, color, 0, surface);
    mesh.name = name;
    if (parent) parent.add(mesh);
    return mesh;
  }

  function floor(name, width, depth, y) {
    const geometry = new THREE.PlaneGeometry(width, depth);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position, uv = geometry.attributes.uv;
    for (let vertex = 0; vertex < positions.count; vertex++) {
      uv.setXY(vertex, positions.getX(vertex) / 2.8, positions.getZ(vertex) / 2.8);
    }
    uv.needsUpdate = true;
    arena.worldGeometries.add(geometry);
    let material = arena.materials.get('colosseum-wet-copper');
    if (!material) {
      material = arena.surfaceMaterial(COL_SURFACE, 0xc47b4d).clone();
      material.name = 'rain-soaked-copper';
      material.roughness = .68;
      material.metalness = .7;
      material.bumpScale = .035;
      arena.materials.set('colosseum-wet-copper', material);
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.y = y;
    mesh.receiveShadow = true;
    arena.scene.add(mesh);
    return mesh;
  }

  function ellipse(angle, radiusX, radiusZ) {
    return { x: Math.cos(angle) * radiusX, z: Math.sin(angle) * radiusZ,
      rotation: Math.atan2(radiusZ * Math.cos(angle), radiusX * Math.sin(angle)) };
  }

  // Shared shallow faces make square copper courses with actual recessed seams.
  // A solid backing keeps the piers closed without thousands of separate cube objects.
  const courseGeometries = new Map();
  function coursedPier(x, height, depth, parent) {
    const width = 1.55, columns = 3, rows = Math.ceil(height / COURSE_SIZE);
    const key = `${height}:${depth}`;
    if (!courseGeometries.has(key)) {
      const positions = [], normals = [], uvs = [], indices = [];
      for (const side of [-1, 1]) for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
        const left = -width / 2 + column * width / columns + (column ? COURSE_SEAM / 2 : 0);
        const right = -width / 2 + (column + 1) * width / columns - (column < columns - 1 ? COURSE_SEAM / 2 : 0);
        const bottom = -height / 2 + row * height / rows + (row ? COURSE_SEAM / 2 : 0);
        const top = -height / 2 + (row + 1) * height / rows - (row < rows - 1 ? COURSE_SEAM / 2 : 0);
        const offset = positions.length / 3;
        for (const [px, py] of [[left, bottom], [right, bottom], [right, top], [left, top]]) {
          positions.push(px, py, side * depth / 2);
          normals.push(0, 0, side);
          uvs.push(px / 2.8, py / 2.8);
        }
        indices.push(...(side > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]).map(index => offset + index));
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeBoundingBox(); geometry.computeBoundingSphere();
      geometry.userData = { columns, rows, courseWidth: width / columns, courseHeight: height / rows, seam: COURSE_SEAM, recess: .03 };
      courseGeometries.set(key, geometry);
      arena.worldGeometries.add(geometry);
    }
    const pier = new THREE.Group();
    pier.name = 'colosseum-arch-pier'; pier.position.x = x; parent.add(pier);
    box('colosseum-pier-recess', 0, height / 2, 0, width, height, depth - .06, COPPER_DARK, COL_SURFACE, pier);
    const faces = new THREE.Mesh(courseGeometries.get(key), arena.surfaceMaterial(COL_SURFACE, COPPER_BODY));
    faces.name = 'colosseum-pier-copper-courses'; faces.position.y = height / 2;
    faces.castShadow = faces.receiveShadow = true;
    pier.add(faces);
  }

  function ringSegments(name, radiusX, radiusZ, y, depth, height, color, surface = COL_SURFACE, count = SEAT_SEGMENTS) {
    for (let index = 0; index < count; index++) {
      const angle = index / count * TAU, half = Math.PI / count;
      const point = ellipse(angle, radiusX, radiusZ);
      const chord = Math.hypot(radiusX * (Math.cos(angle + half) - Math.cos(angle - half)),
        radiusZ * (Math.sin(angle + half) - Math.sin(angle - half)));
      const mesh = box(name, point.x, y, point.z, chord * 1.035, height, depth, color, surface);
      mesh.rotation.y = point.rotation;
    }
  }

  /** Stepped copper vaults leave genuine open air below, including between the piers. */
  function arch(name, x, z, rotation, base, pitch, height, depth, story) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(x, base, z);
    group.rotation.y = rotation;
    const opening = pitch - 1.45;
    const spring = Math.round(height * .49 / VAULT_STEP) * VAULT_STEP, rise = height * .36;
    group.userData = { openingWidth: opening, springHeight: spring, story, vaultStep: VAULT_STEP };
    arena.scene.add(group);
    for (const side of [-1, 1]) {
      coursedPier(side * pitch / 2, height, depth, group);
      box('colosseum-pier-plinth', side * pitch / 2, .25, 0, 1.9, .5, depth + .35, COPPER_DARK, COL_SURFACE, group);
      box('colosseum-pier-capital', side * pitch / 2, spring, 0, 1.9, .4, depth + .25, COPPER_EDGE, COL_SURFACE, group);
    }
    for (let column = 0; column < 7; column++) {
      const localX = (column - 3) * opening / 7;
      const normalized = (column - 3) / 3.5;
      const bottom = Math.floor((spring + rise * Math.sqrt(1 - normalized * normalized)) / VAULT_STEP) * VAULT_STEP;
      box('colosseum-stepped-arch-stone', localX, (bottom + height) / 2, 0,
        opening / 7 + .07, height - bottom, depth, column % 2 ? COPPER_EDGE : COPPER_BODY, COL_SURFACE, group);
    }
    // A square copper keystone accents the vault without filling its opening.
    box('colosseum-keystone', 0, height * .865, -.12, .65, .95, depth + .35, COPPER_EDGE, COL_SURFACE, group);
    return group;
  }

  const ground = floor('colosseum-arena-floor', ARENA_SIZE.width, ARENA_SIZE.depth, .012);
  const distantGround = floor('colosseum-surrounding-sand', 170, 145, -.08);
  box('colosseum-arena-foundation', 0, -.5, 0, ARENA_SIZE.width + 2, .8, ARENA_SIZE.depth + 2, COPPER_DARK);

  // A readable rectangular kerb follows the actual combat bounds, inside the oval auditorium.
  for (const side of [-1, 1]) {
    box('colosseum-playable-kerb', side * ARENA_SIZE.halfWidth, .22, 0, 1.2, .55, ARENA_SIZE.depth + 1.2, COPPER_EDGE);
    box('colosseum-kerb-copper-cap', side * ARENA_SIZE.halfWidth, .52, 0, .82, .09, ARENA_SIZE.depth + 1.2, COPPER, COL_SURFACE);
    box('colosseum-playable-kerb', 0, .22, side * ARENA_SIZE.halfDepth, ARENA_SIZE.width - 1.2, .55, 1.2, COPPER_EDGE);
    box('colosseum-kerb-copper-cap', 0, .52, side * ARENA_SIZE.halfDepth, ARENA_SIZE.width - 1.2, .09, .82, COPPER, COL_SURFACE);
  }

  // Nine broad seat rows form three concentric, stepped grandstands with four empty aisles.
  for (let tier = 0; tier < 3; tier++) {
    for (let row = 0; row < 3; row++) {
      const index = tier * 3 + row;
      const radiusX = 46 + index * 1.65 + tier * .5;
      const radiusZ = 36 + index * 1.65 + tier * .5;
      const height = .7 + index * .68;
      for (let segment = 0; segment < SEAT_SEGMENTS; segment++) {
        if (segment % (SEAT_SEGMENTS / 4) === 0) continue;
        const angle = segment / SEAT_SEGMENTS * TAU, half = Math.PI / SEAT_SEGMENTS;
        const point = ellipse(angle, radiusX, radiusZ);
        const chord = Math.hypot(radiusX * (Math.cos(angle + half) - Math.cos(angle - half)),
          radiusZ * (Math.sin(angle + half) - Math.sin(angle - half)));
        const seat = box('colosseum-grandstand-step', point.x, height / 2 - .06, point.z,
          chord * 1.025, height, 1.75, row === 2 ? COPPER_EDGE : COPPER_BODY);
        seat.rotation.y = point.rotation;
        seat.userData = { tier, row, radiusX, radiusZ };
      }
    }
    ringSegments('colosseum-grandstand-copper-trim', 49.4 + tier * 5.45, 39.4 + tier * 5.45,
      2.09 + tier * 2.04, .18, .13, COPPER, COL_SURFACE);
  }

  // Two complete arcades, cornices and a crenellated upper parapet give the unmistakable oval facade.
  for (let story = 0; story < 2; story++) {
    for (let bay = 0; bay < WALL_BAYS; bay++) {
      const angle = bay / WALL_BAYS * TAU, half = Math.PI / WALL_BAYS;
      const point = ellipse(angle, 63, 53);
      const pitch = Math.hypot(63 * (Math.cos(angle + half) - Math.cos(angle - half)),
        53 * (Math.sin(angle + half) - Math.sin(angle - half)));
      arch('colosseum-arcade', point.x, point.z, point.rotation, story * 7.8, pitch, 7.3, 2.1, story);
    }
    ringSegments('colosseum-cornice', 63, 53, story * 7.8 + 7.55, 2.65, .55, COPPER_EDGE);
    ringSegments('colosseum-cornice-copper', 63, 53, story * 7.8 + 7.94, 2.8, .16, COPPER, COL_SURFACE);
  }
  ringSegments('colosseum-parapet-base', 63, 53, 16.3, 2.2, 1.1, COPPER_BODY);
  for (let bay = 0; bay < WALL_BAYS; bay++) {
    const point = ellipse(bay / WALL_BAYS * TAU, 63, 53);
    const cap = box('colosseum-parapet-block', point.x, 17.3, point.z, 1.6, 1.3, 2.5, COPPER_EDGE);
    cap.rotation.y = point.rotation;
  }

  const bannerGeometry = new THREE.BoxGeometry(1, 1, 1);
  arena.worldGeometries.add(bannerGeometry);
  const bannerMaterials = [0x782d40, 0x286b70].map(color => {
    const key = `colosseum-banner:${color}`;
    if (!arena.materials.has(key)) arena.materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .78, metalness: .08 }));
    return arena.materials.get(key);
  });
  // Cardinal entrance portals sit beyond the kerbs and line up with the four grandstand aisles.
  for (let entrance = 0; entrance < 4; entrance++) {
    const angle = entrance / 4 * TAU, point = ellipse(angle, 40.5, 30.5);
    const gate = arch('colosseum-entrance-gate', point.x, point.z, point.rotation, 0, 10, 7.2, 2, -1);
    for (const side of [-1, 1]) {
      const banner = new THREE.Mesh(bannerGeometry, bannerMaterials[entrance % 2]);
      banner.name = 'colosseum-entrance-banner';
      banner.position.set(side * 5.5, 4.2, -1.25);
      banner.scale.set(1.4, 3.2, .12);
      banner.castShadow = banner.receiveShadow = true;
      gate.add(banner);
      box('colosseum-banner-hanger', side * 5.5, 5.9, -1.25, 1.9, .16, .24, COPPER, COL_SURFACE, gate);
      box('colosseum-banner-stripe', side * 5.5, 4.2, -1.34, .15, 3.15, .04, COPPER, COL_SURFACE, gate);
    }
    // The solid gate bars make entrances recognizable without implying another walkable arena.
    for (let bar = -3; bar <= 3; bar++) box('colosseum-gate-bar', bar * .9, 2.6, .25, .18, 5.2, .2, COPPER, COL_SURFACE, gate);
    box('colosseum-gate-crossbar', 0, 2.3, .25, 6.2, .22, .22, COPPER, COL_SURFACE, gate);
  }

  return { ground, distantGround };
}
