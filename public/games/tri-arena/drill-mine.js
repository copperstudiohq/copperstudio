import * as THREE from './assets/three.module.js';
import { DRILL_MINE_SIZE, DRILL_MINE_CAVERN_HEIGHT, DRILL_MINE_PIT, DRILL_MINE_TUNNELS } from './drill-mine-layout.js';
import { DRILL_MINE_TEXTURE_WORLD_SCALE } from './drill-mine-textures.js';
import { DRILL_MINE_UPPER_TUNNELS, minePortalBounds } from './drill-mine-upper-layout.js';
import { carveMineBox } from './drill-mine-carving.js';

const ROCK = [0x7d8c93, 0x667882, 0x8b979b, 0x556770];
const COPPER = 0xbd7a47, TIMBER = 0x624535, OXIDE = 0x438e8a;
const TUNNEL_BACK = 0x080d12;
export const MINE_SURFACE = 'drill-mine-rock';
export { DRILL_MINE_UPPER_TUNNELS } from './drill-mine-upper-layout.js';

/** An open, rain-filled excavation with four actual ten-metre tunnel openings. */
export function buildDrillMine(arena) {
  if (!arena?.scene?.isScene || typeof arena.box !== 'function' || typeof arena.surfaceMaterial !== 'function'
    || !arena.worldGeometries?.add || !arena.materials?.set) {
    throw new TypeError('A Drill Mine needs a scene, box/surface factories and owned geometry/material collections.');
  }
  function box(name, x, y, z, w, h, d, color = ROCK[0], surface = MINE_SURFACE, parent) {
    const mesh = arena.box(x, y, z, w, h, d, color, 0, surface); mesh.name = name;
    if (parent) parent.add(mesh); return mesh;
  }
  const openings = [...DRILL_MINE_TUNNELS.map(tunnel => ({ ...tunnel, base: 0, depth: 20 })), ...DRILL_MINE_UPPER_TUNNELS].map(minePortalBounds);
  function rockBox(name, x, y, z, w, h, d, color = ROCK[0], metadata = {}) {
    const bounds = { minX: x - w / 2, maxX: x + w / 2, minY: y - h / 2, maxY: y + h / 2, minZ: z - d / 2, maxZ: z + d / 2 };
    return carveMineBox(bounds, openings).map(piece => {
      const mesh = box(name, (piece.minX + piece.maxX) / 2, (piece.minY + piece.maxY) / 2,
        (piece.minZ + piece.maxZ) / 2, piece.maxX - piece.minX, piece.maxY - piece.minY, piece.maxZ - piece.minZ, color);
      mesh.userData = { ...metadata }; return mesh;
    });
  }
  function wallTransform(group, wall, lateral) {
    group.rotation.y = { north: Math.PI, south: 0, east: Math.PI / 2, west: -Math.PI / 2 }[wall];
    group.position.set(wall === 'north' || wall === 'south' ? lateral : 0, 0, wall === 'east' || wall === 'west' ? lateral : 0);
  }
  function emissive(color, intensity) {
    const key = `drill-mine-glow:${color}:${intensity}`;
    if (!arena.materials.has(key)) arena.materials.set(key, new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: intensity, roughness: .55, metalness: .3,
    }));
    return arena.materials.get(key);
  }
  function glow(name, x, y, z, w, h, d, color, intensity, parent) {
    if (!parent && openings.some(hole => x + w / 2 > hole.minX && x - w / 2 < hole.maxX
      && y + h / 2 > hole.minY && y - h / 2 < hole.maxY && z + d / 2 > hole.minZ && z - d / 2 < hole.maxZ)) return null;
    const mesh = box(name, x, y, z, w, h, d, color, 'copper', parent);
    mesh.material = emissive(color, intensity); mesh.castShadow = false; return mesh;
  }
  function floor(name, width, depth, y) {
    const geometry = new THREE.PlaneGeometry(width, depth); geometry.rotateX(-Math.PI / 2);
    const { position, uv } = geometry.attributes;
    for (let vertex = 0; vertex < position.count; vertex++) uv.setXY(vertex, position.getX(vertex) / DRILL_MINE_TEXTURE_WORLD_SCALE, position.getZ(vertex) / DRILL_MINE_TEXTURE_WORLD_SCALE);
    arena.worldGeometries.add(geometry);
    let material = arena.materials.get('drill-mine-wet-shale');
    if (!material) {
      material = arena.surfaceMaterial(MINE_SURFACE, 0x88969b).clone(); material.name = 'rain-darkened-pixel-shale';
      material.roughness = .88; arena.materials.set('drill-mine-wet-shale', material);
    }
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.position.y = y;
    mesh.receiveShadow = true; arena.scene.add(mesh); return mesh;
  }

  box('drill-mine-foundation', 0, -.5, 0, DRILL_MINE_SIZE.width + 2, .9, DRILL_MINE_SIZE.depth + 2, ROCK[0]);
  const ground = floor('drill-mine-excavation-floor', DRILL_MINE_SIZE.width, DRILL_MINE_SIZE.depth, .012);
  const distantGround = floor('drill-mine-distant-shale', 220, 220, -.65);

  // Whole walls fill every old shaft. Carve real portal volumes out of their
  // cores AND their recessed courses, including the projecting high corbels.
  const walls = [
    { minX: -48, maxX: 48, minZ: -40, maxZ: -30, face: 'maxZ' },
    { minX: -48, maxX: 48, minZ: 30, maxZ: 40, face: 'minZ' },
    { minX: 36, maxX: 48, minZ: -30, maxZ: 30, face: 'minX' },
    { minX: -48, maxX: -36, minZ: -30, maxZ: 30, face: 'maxX' },
  ];
  walls.forEach((rock, index) => {
    const core = { ...rock };
    core[rock.face] += rock.face.startsWith('min') ? 1.35 : -1.35;
    rockBox('drill-mine-solid-rock', (core.minX + core.maxX) / 2, DRILL_MINE_CAVERN_HEIGHT / 2,
      (core.minZ + core.maxZ) / 2, core.maxX - core.minX, DRILL_MINE_CAVERN_HEIGHT,
      core.maxZ - core.minZ, ROCK[(index + 3) % ROCK.length]);
    for (const face of [rock.face]) {
      const axis = face.endsWith('X') ? 'x' : 'z', along = axis === 'x' ? 'Z' : 'X';
      const low = rock[`min${along}`], high = rock[`max${along}`], inward = face.startsWith('min') ? 1 : -1;
      const columns = Math.ceil((high - low) / 4.8), span = (high - low) / columns;
      for (let course = 0; course < DRILL_MINE_CAVERN_HEIGHT / 8; course++) for (let column = 0; column < columns; column++) {
        const inset = [.05, .35, .7, .95][(course * 3 + column + index) % 4];
        const cross = rock[face] + inward * (inset + .65), center = low + (column + .5) * span;
        const dimensions = axis === 'x' ? [1.3, 7.84, span - .12] : [span - .12, 7.84, 1.3];
        rockBox('drill-mine-rock-stratum', axis === 'x' ? cross : center, course * 8 + 4,
          axis === 'x' ? center : cross, ...dimensions, ROCK[(course + column + index) % ROCK.length],
          { rockIndex: index, course, recess: inset });
      }
    }
  });

  // A stepped roof ring crowns the 120m cavern. Its 60x48m central sky shaft
  // remains open. Any upper entrance under a projecting arch is carved as well.
  for (const side of [-1, 1]) {
    rockBox('drill-mine-ceiling-crown', 0, 116, side * 32, 96, 8, 16, ROCK[1]);
    rockBox('drill-mine-ceiling-crown', side * 39, 116, 0, 18, 8, 48, ROCK[1]);
    for (let step = 0; step < 3; step++) {
      const y = 104 + step * 4, halfX = 36 - step * 2, halfZ = 30 - step * 2;
      rockBox('drill-mine-stepped-cave-arch', side * (halfX + 1), y + 2, 0, 2, 4, halfZ * 2, ROCK[(step + 1) % ROCK.length]);
      rockBox('drill-mine-stepped-cave-arch', 0, y + 2, side * (halfZ + 1), halfX * 2, 4, 2, ROCK[(step + 1) % ROCK.length]);
    }
  }
  for (const side of [-1, 1]) {
    for (let vein = 0; vein < 10; vein++) {
      const x = (vein < 5 ? -1 : 1) * (8 + vein % 5 * 7.5);
      for (let block = 0; block < 14; block++) {
        const y = 1.3 + block * 8.7 + Math.sin(vein * 2 + block) * .25;
        const px = x + Math.sin(block * 1.8 + vein) * .68;
        rockBox('drill-mine-copper-ore', px, y, side * (DRILL_MINE_PIT.halfDepth - .045),
          .6 + block % 3 * .28, 1.2 + block % 2 * .6, .13, block % 4 ? COPPER : OXIDE);
        if (block % 4 === 1) glow('drill-mine-ore-glint', px, y, side * (DRILL_MINE_PIT.halfDepth - .12), .35, .5, .04, 0x74c9bc, .6);
      }
    }
    for (const z of [-24, -14, 14, 24]) for (let block = 0; block < 12; block++) {
      rockBox('drill-mine-side-ore', side * (DRILL_MINE_PIT.halfWidth - .04), 1.8 + block * 9.5,
        z + Math.sin(block + z) * .55, .12, 1.4, 1.1, block % 3 ? COPPER : OXIDE);
    }
  }

  // Long dark passages extend beyond the playable boundary; their actual spawn
  // points and exits stay inside it. No gate, wall, beam or cart blocks a mouth.
  for (const tunnel of DRILL_MINE_TUNNELS) {
    const horizontal = tunnel.id === 'east' || tunnel.id === 'west';
    const start = horizontal ? DRILL_MINE_PIT.halfWidth : DRILL_MINE_PIT.halfDepth, end = start + 20;
    const group = new THREE.Group(); group.name = `drill-mine-tunnel-${tunnel.id}`;
    group.userData = { tunnel, active: true };
    wallTransform(group, tunnel.wall, tunnel.lateral);
    arena.scene.add(group);
    for (const side of [-1, 1]) box('drill-mine-tunnel-side', side * 6.2, 5.8, (start + end) / 2,
      2.4, 11.6, end - start, ROCK[1], MINE_SURFACE, group);
    box('drill-mine-tunnel-roof', 0, 11.6, (start + end) / 2, 14.8, 3.2, end - start, ROCK[0], MINE_SURFACE, group);
    box('drill-mine-tunnel-floor', 0, -.025, (start + end) / 2, 10, .06, end - start, 0x738188, MINE_SURFACE, group);
    box('drill-mine-tunnel-dark-back', 0, 5, end + .25, 10.4, 10.4, .5, TUNNEL_BACK, MINE_SURFACE, group);
    for (let frame = 0; frame < 4; frame++) {
      const z = start + .7 + frame * 5.4;
      for (const side of [-1, 1]) {
        box('drill-mine-timber-support', side * 5.55, 5.1, z, .8, 10.2, .8, TIMBER, MINE_SURFACE, group);
        box('drill-mine-support-shoe', side * 5.55, .4, z, 1, .8, 1, COPPER, 'copper', group);
        for (const y of [1.2, 4.5, 8.2]) box('drill-mine-support-band', side * 5.55, y, z, .87, .22, .88, COPPER, 'copper', group);
      }
      box('drill-mine-overhead-support', 0, 10.55, z, 11.9, .8, .95, TIMBER, MINE_SURFACE, group);
      box('drill-mine-copper-header', 0, 10.12, z - .48, 11.1, .16, .16, COPPER, 'copper', group);
    }
    for (const side of [-1, 1]) {
      box('drill-mine-rail', side * 1.3, .036, (start + end - 1) / 2, .12, .035, end - start + 1, COPPER, 'copper', group);
      for (let sleeper = start - .5; sleeper < end; sleeper += 1.15) {
        box('drill-mine-flush-sleeper', 0, .022, sleeper, 3.4, .018, .22, TIMBER, MINE_SURFACE, group);
      }
      const z = start + 2.4;
      box('drill-mine-lamp-housing', side * 5.5, 7.7, z, .7, .55, .8, COPPER, 'copper', group);
      glow('drill-mine-work-lamp', side * 5.5, 7.65, z - .43, .45, .3, .08, 0xffcc7b, 2.8, group);
    }
    const light = new THREE.PointLight(0xffc486, 100, 24, 2); light.name = 'drill-mine-tunnel-light';
    light.position.set(0, 7.6, start + 1.2); group.add(light);
    for (const side of [-1, 1]) for (let stripe = 0; stripe < 5; stripe++) {
      box('drill-mine-safety-stripe', side * 5.55, 1.4 + stripe * .55, start + .25,
        .84, .16, .1, stripe % 2 ? 0x252b29 : 0xe6b352, 'copper', group);
    }

  }

  for (const portal of DRILL_MINE_UPPER_TUNNELS) {
    const start = portal.wall === 'east' || portal.wall === 'west' ? DRILL_MINE_PIT.halfWidth : DRILL_MINE_PIT.halfDepth;
    const { width, height, depth } = portal;
    const upper = new THREE.Group(); upper.name = 'drill-mine-inactive-upper-tunnel';
    wallTransform(upper, portal.wall, portal.lateral); upper.position.y = portal.base;
    upper.userData = { ...portal }; arena.scene.add(upper);
    const marker = new THREE.Object3D(); marker.name = 'drill-mine-inactive-tunnel-marker';
    marker.position.set(0, height / 2, start + depth / 2); marker.userData = { ...portal }; upper.add(marker);
    for (const side of [-1, 1]) {
      box('drill-mine-upper-sidewall', side * (width / 2 + .6), height / 2, start + depth / 2, 1.2, height, depth, ROCK[1], MINE_SURFACE, upper);
      box('drill-mine-upper-support', side * (width / 2 + .4), height / 2, start + .55, .65, height, .8, TIMBER, MINE_SURFACE, upper);
      box('drill-mine-upper-copper-rail', side * Math.min(1.3, width / 4), .04, start + depth / 2, .12, .04, depth, COPPER, 'copper', upper);
    }
    box('drill-mine-upper-floor', 0, -.15, start + depth / 2, width, .3, depth, ROCK[0], MINE_SURFACE, upper);
    box('drill-mine-upper-ceiling', 0, height + .18, start + depth / 2, width + 2.4, .36, depth, ROCK[0], MINE_SURFACE, upper);
    box('drill-mine-upper-lintel', 0, height + .35, start + .55, width + 1.5, .7, 1, TIMBER, MINE_SURFACE, upper);
    box('drill-mine-upper-dark-back', 0, height / 2, start + depth + .3, width + .4, height + .4, .6, TUNNEL_BACK, MINE_SURFACE, upper);
    upper.traverse(object => { object.userData.active = false; });
  }

  // Exterior rubble and high copper maintenance gantries give the cliff scale.
  for (const side of [-1, 1]) for (let index = 0; index < 8; index++) {
    const x = -56 + index * 16, height = 24 + index % 4 * 7;
    if (Math.abs(x) < 10) continue;
    box('drill-mine-distant-rock', x, height / 2 - .7, side * (52 + index % 3 * 4),
      13, height, 10, ROCK[index % ROCK.length]);
    if (index % 2) box('drill-mine-upper-rock', x + 1, height + 1.8, side * (52 + index % 3 * 4), 10, 4.3, 8, ROCK[(index + 1) % ROCK.length]);
  }
  for (const x of [-20, 20]) {
    const z = -DRILL_MINE_PIT.halfDepth + .15;
    for (const side of [-1, 1]) box('drill-mine-gantry-post', x + side * 3, 88, z, .9, 14.8, .9, COPPER, 'copper');
    box('drill-mine-gantry-beam', x, 95.3, z, 8, .85, 1.1, COPPER, 'copper');
    box('drill-mine-hanging-chain', x, 91, z, .12, 8, .12, 0x344246, 'copper');
    box('drill-mine-empty-hoist', x, 87, z, 1.8, .35, 1.8, COPPER, 'copper');
  }
  for (let index = 0; index < 18; index++) {
    box('drill-mine-floor-pixel-patch', Math.round(Math.sin(index * 7) * 18) * 1.6, .021,
      Math.round(Math.cos(index * 3) * 14) * 1.6, 1.6, .01, 1.6, ROCK[index % ROCK.length]);
  }
  return { ground, distantGround, tunnels: DRILL_MINE_TUNNELS };
}
