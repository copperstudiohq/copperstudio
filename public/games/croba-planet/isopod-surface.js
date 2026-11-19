import * as THREE from './vendor/three.module.js';
import { getSeabedHeight, getSeabedGridAt } from './seabed.js';
import { getForestHeight } from './forest-terrain.js';
import { ISOPOD_SPINE_Z, isopodLocalToWorld } from './isopod-frame.js';
import { isopodAnatomy } from './isopod-anatomy.js';
import { getIceSurface } from './ice-surface.js';
import { PREPARED_SEABED_STONES, createSeabedStoneGeometry, getSeabedStonePose } from './seabed-stones.js';
import { PREPARED_WORLD_ROCKS } from './world-rock-data.js';
import { createWorldRockGeometry, getWorldRockPose } from './world-rock-geometry.js';
import { getPlatformVertices, getIceDepth, getIceScale, getIceSection, pointInPolygon,
  WATER_LEVEL, WORLD_BOUNDS } from './terrain.js';

/** Surface locomotion uses simulation axes: X/Y horizontal, Z up. The public
 * quaternion alone uses render axes so every optical/body draw shares one pose.
 * @typedef {{x:number,y:number,z:number}} Point
 * @typedef {{a:Point,b:Point,c:Point,normal:Point,kind:string,owner?:object,
 * minX:number,maxX:number,minY:number,maxY:number,minZ:number,maxZ:number}} Face
 */
export const ISOPOD_SURFACE_CLEARANCE = 14;
const CLEARANCE = ISOPOD_SURFACE_CLEARANCE, SPEED = 8, MIN_TURN_RADIUS = 55, CELL = 100, EPS = 1e-7;
const TRAIL_LENGTH = 340, RETREAT_LENGTH = 90, BODY_TRAIL = 82;
const states = new WeakMap(), forests = new WeakMap(), ices = new WeakMap(), spikes = new WeakMap();
const rockRemovals=new WeakMap(),noRemovedRocks=new Set(),worldRockOwners=new Set(PREPARED_WORLD_ROCKS);
const spikeIndexes = new WeakMap();
const terrainCells = new Map();
let seabedStones;
let bodyProbes;
const orientationMatrix = new THREE.Matrix4(), orientationQuaternion = new THREE.Quaternion();
const HEAD_Z = -1.3;
const UP = { x: 0, y: 0, z: 1 };
const add = (a, b, s = 1) => ({ x: a.x + b.x * s, y: a.y + b.y * s, z: a.z + b.z * s });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const length = (a) => Math.hypot(a.x, a.y, a.z);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const unit = (a, fallback = UP) => { const d = length(a); return d > EPS ? add({ x: 0, y: 0, z: 0 }, a, 1 / d) : { ...fallback }; };
const finite = (p) => p && [p.x, p.y, p.z].every(Number.isFinite);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const tangent = (a, normal, fallback) => unit(add(a, normal, -dot(a, normal)), fallback);
const cellKey = (x, y) => `${x}:${y}`;

/** Chipping appends IDs; restore/reset replaces this array. Reuse one small
 * set across all foot, body and route probes without rebuilding facet caches. */
function removedRockIds(world){
  const source=world.crafting?.removedRocks;if(!source?.length)return noRemovedRocks;
  const old=rockRemovals.get(world);if(old?.source===source&&old.length===source.length)return old.ids;
  const ids=new Set(source);rockRemovals.set(world,{source,length:source.length,ids});return ids;
}
const removedRock=(owner,ids)=>worldRockOwners.has(owner)&&ids.has(owner.id);
const removedPhysical=(state,ids)=>Boolean(state&&(removedRock(state.face?.owner,ids)
  ||removedRock(state.pending?.face?.owner,ids)||removedRock(state.stepOver?.owner,ids)));

function rotate(vector, axis, angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return add(add(add({ x: 0, y: 0, z: 0 }, vector, c), cross(axis, vector), s), axis, dot(axis, vector) * (1 - c));
}

/** Parallel transport preserves forward travel when a floor turns into a wall
 * or ceiling. Projecting world-horizontal steering alone would stall on walls.
 */
function transport(vector, from, to, fraction = 1) {
  const d = clamp(dot(from, to), -1, 1), angle = Math.acos(d);
  if (angle < EPS) return { ...vector };
  let axis = cross(from, to);
  if (length(axis) < EPS) axis = tangent(vector, from, { x: 1, y: 0, z: 0 });
  return rotate(vector, unit(axis), angle * fraction);
}

function face(a, b, c, kind, owner, outward) {
  let normal = unit(cross(sub(b, a), sub(c, a)));
  if (outward && dot(normal, outward) < 0) { [b, c] = [c, b]; normal = add({ x: 0, y: 0, z: 0 }, normal, -1); }
  return { a, b, c, normal, kind, owner,
    minX: Math.min(a.x, b.x, c.x), maxX: Math.max(a.x, b.x, c.x),
    minY: Math.min(a.y, b.y, c.y), maxY: Math.max(a.y, b.y, c.y),
    minZ: Math.min(a.z, b.z, c.z), maxZ: Math.max(a.z, b.z, c.z) };
}

/** Closest point includes shared edges/vertices; this is the actual visible
 * triangle, not a smoothed height approximation that closes narrow holes.
 */
function closest(p, f) {
  const ab = sub(f.b, f.a), ac = sub(f.c, f.a), ap = sub(p, f.a);
  const d1 = dot(ab, ap), d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return f.a;
  const bp = sub(p, f.b), d3 = dot(ab, bp), d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return f.b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return add(f.a, ab, d1 / (d1 - d3));
  const cp = sub(p, f.c), d5 = dot(ab, cp), d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return f.c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return add(f.a, ac, d2 / (d2 - d6));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0)
    return add(f.b, sub(f.c, f.b), (d4 - d3) / (d4 - d3 + d5 - d6));
  const inv = 1 / (va + vb + vc);
  return add(add(f.a, ab, vb * inv), ac, vc * inv);
}

const nearby = (f, p, radius) => p.x + radius >= f.minX && p.x - radius <= f.maxX
  && p.y + radius >= f.minY && p.y - radius <= f.maxY && p.z + radius >= f.minZ && p.z - radius <= f.maxZ;

function indexedInsert(cells, f) {
  if (f.minZ > WATER_LEVEL - 2) return;
  for (let x = Math.floor(f.minX / CELL); x <= Math.floor(f.maxX / CELL); x++)
    for (let y = Math.floor(f.minY / CELL); y <= Math.floor(f.maxY / CELL); y++) {
      const key = cellKey(x, y), entries = cells.get(key) ?? [];
      if (!cells.has(key)) cells.set(key, entries); entries.push(f);
    }
}

function gridFaces(x, y, radius, output) {
  const grids = new Set();
  for (const dx of [-radius, 0, radius]) for (const dy of [-radius, 0, radius]) grids.add(getSeabedGridAt(x + dx, y + dy));
  for (const grid of grids) {
    const left = clamp(Math.floor((x - radius - grid.minX) / grid.step), 0, grid.columns - 2);
    const right = clamp(Math.floor((x + radius - grid.minX) / grid.step), 0, grid.columns - 2);
    const low = clamp(Math.floor((y - radius - grid.minY) / grid.step), 0, grid.rows - 2);
    const high = clamp(Math.floor((y + radius - grid.minY) / grid.step), 0, grid.rows - 2);
    for (let row = low; row <= high; row++) for (let column = left; column <= right; column++) {
      const px = grid.minX + column * grid.step, py = grid.minY + row * grid.step;
      if (getSeabedGridAt(px + grid.step / 2, py + grid.step / 2) !== grid) continue;
      const key = `${grid.minX}:${grid.minY}:${grid.step}:${column}:${row}`;
      let entries = terrainCells.get(key);
      if (!entries) {
        const vertex = (dx, dy) => ({ x: px + dx, y: py + dy, z: getSeabedHeight(px + dx, py + dy) });
        const a = vertex(0, 0), b = vertex(grid.step, 0), c = vertex(0, grid.step), d = vertex(grid.step, grid.step);
        entries = [face(a, b, c, 'seabed', undefined, UP), face(b, d, c, 'seabed', undefined, UP)];
        terrainCells.set(key, entries);
      }
      output.push(...entries);
    }
  }
}

function forestSurfaces(forest) {
  if (!forest) return null;
  let cache = forests.get(forest); if (cache) return cache;
  cache = { cells: new Map(), rocks: [] }; forests.set(forest, cache);
  const mesh = forest.mesh;
  if (mesh?.positions && mesh?.indices) {
    const vertex = (index) => ({ x: mesh.positions[index * 3], y: mesh.positions[index * 3 + 1], z: mesh.positions[index * 3 + 2] });
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const a = vertex(mesh.indices[i]), b = vertex(mesh.indices[i + 1]), c = vertex(mesh.indices[i + 2]);
      if (Math.min(a.z, b.z, c.z) > WATER_LEVEL - 2) continue;
      indexedInsert(cache.cells, face(a, b, c, 'forest', forest, i < (mesh.surfaceIndexCount ?? mesh.indices.length) ? UP : undefined));
    }
  }
  // Match the renderer's low-poly basalt, including its seeded rotation/width.
  const prototype = new THREE.IcosahedronGeometry(1, 1), p = prototype.attributes.position;
  for (const rock of forest.rocks ?? []) {
    if (rock.z - rock.height > WATER_LEVEL - 2) continue;
    let seed = rock.seed >>> 0;
    const rng = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const heading = rock.heading ?? rng() * Math.PI * 2, width = .7 + rng() * .35;
    const vertex = (index) => {
      const x = p.getX(index) * rock.radius, y = p.getZ(index) * rock.radius * width;
      return { x: rock.x + x * Math.cos(heading) + y * Math.sin(heading),
        y: rock.y - x * Math.sin(heading) + y * Math.cos(heading), z: rock.z + p.getY(index) * rock.height };
    };
    const faces = [];
    for (let i = 0; i < p.count; i += 3) {
      const a = vertex(i), b = vertex(i + 1), c = vertex(i + 2);
      const f = face(a, b, c, 'rock', rock, sub(a, rock)); faces.push(f); indexedInsert(cache.cells, f);
    }
    cache.rocks.push({ rock, faces });
  }
  prototype.dispose(); return cache;
}

function stoneSurfaces() {
  if (seabedStones) return seabedStones;
  seabedStones = { cells: new Map(), rocks: [], occluders: new Map() };
  const geometry = createSeabedStoneGeometry(), position = geometry.attributes.position;
  const pose = new THREE.Object3D(), v = new THREE.Vector3();
  for (const stone of PREPARED_SEABED_STONES) {
    getSeabedStonePose(stone, pose);
    const vertex = (i) => { v.fromBufferAttribute(position, geometry.index?.getX(i) ?? i).applyMatrix4(pose.matrix); return { x: v.x * 25, y: v.z * 25, z: v.y * 25 }; };
    const faces = [];
    for (let i = 0; i < (geometry.index?.count ?? position.count); i += 3) {
      const a = vertex(i), b = vertex(i + 1), c = vertex(i + 2), f = face(a, b, c, 'seabed-stone', stone, sub(a, stone));
      faces.push(f); indexedInsert(seabedStones.cells, f);
    }
    seabedStones.rocks.push({ rock: stone, faces, radius: stone.radius * 25 * 1.4, height: stone.radius * 25 * .55,
      top: Math.max(...faces.map((f) => f.maxZ)) });
  }
  geometry.dispose();
  // New underwater boulders expose the very same convex facets uploaded by
  // WorldRockRenderer. Leave the original 140 stone poses unchanged above.
  const prototypes=new Map();
  try {
    for(const rock of PREPARED_WORLD_ROCKS){
      if(rock.habitat!=='marine')continue;
      let prototype=prototypes.get(rock.style);
      if(!prototype){prototype=createWorldRockGeometry(rock.style);prototypes.set(rock.style,prototype);}
      getWorldRockPose(rock,pose);
      const positions=prototype.attributes.position,center={x:rock.x,y:rock.y,z:rock.z+rock.height/2};
      const vertex=i=>{v.fromBufferAttribute(positions,prototype.index?.getX(i)??i).applyMatrix4(pose.matrix);return{x:v.x*25,y:v.z*25,z:v.y*25};};
      const faces=[];
      for(let i=0;i<(prototype.index?.count??positions.count);i+=3){
        const a=vertex(i),b=vertex(i+1),c=vertex(i+2),f=face(a,b,c,'seabed-stone',rock,sub(a,center));
        faces.push(f);indexedInsert(seabedStones.cells,f);
      }
      seabedStones.rocks.push({rock,faces,radius:Math.max(rock.rx,rock.ry),height:rock.height,
        top:Math.max(...faces.map(f=>f.maxZ))});
    }
  }finally{for(const prototype of prototypes.values())prototype.dispose();}
  // Coverage checks need only the point's cell. Keep the same conservative
  // radius gate and exact facet planes, without scanning every world stone.
  for(const entry of seabedStones.rocks){
    const {rock,radius}=entry;
    for(let x=Math.floor((rock.x-radius)/CELL);x<=Math.floor((rock.x+radius)/CELL);x++)
      for(let y=Math.floor((rock.y-radius)/CELL);y<=Math.floor((rock.y+radius)/CELL);y++){
        const key=cellKey(x,y),entries=seabedStones.occluders.get(key)??[];
        if(!seabedStones.occluders.has(key))seabedStones.occluders.set(key,entries);entries.push(entry);
      }
  }
  return seabedStones;
}

function iceSurfaces(ice) {
  let entries = ices.get(ice); if (entries) return entries;
  const vertices = getPlatformVertices(ice), depth = getIceDepth(ice), base = ice.z ?? 0;
  const sections = [0, .08, .28, .5, .74, 1].map((fraction) => vertices.flatMap((v, i) => [0, .5].map((along) => {
    const next = vertices[(i + 1) % vertices.length], scale = getIceScale(ice, -depth * fraction);
    const cut = ice.iceStyle ? .013 + .012 * Math.sin(i * 1.7 + ice.seed) ** 2 : .025;
    const flute = 1 - cut * Math.sin(along * Math.PI) * Math.sin(fraction * Math.PI);
    return { x: ice.x + (v.x + (next.x - v.x) * along - ice.x) * scale * flute,
      y: ice.y + (v.y + (next.y - v.y) * along - ice.y) * scale * flute, z: base - depth * fraction };
  })));
  entries = [];
  for (let layer = 0; layer < sections.length - 1; layer++) for (let edge = 0; edge < sections[layer].length; edge++) {
    const next = (edge + 1) % sections[layer].length, a = sections[layer][edge], b = sections[layer][next];
    const c = sections[layer + 1][edge], d = sections[layer + 1][next], outward = { x: a.x - ice.x, y: a.y - ice.y, z: .01 };
    entries.push(face(a, b, c, 'ice', ice, outward), face(b, d, c, 'ice', ice, outward));
  }
  const bottom = sections.at(-1), center = { x: ice.x, y: ice.y, z: base - depth };
  for (let edge = 0; edge < bottom.length; edge++) entries.push(face(center, bottom[edge], bottom[(edge + 1) % bottom.length], 'ice', ice, { x: 0, y: 0, z: -1 }));
  const top = getIceSurface(ice), topVertex = (i) => ({ x: top.positions[i * 3], y: top.positions[i * 3 + 1], z: top.positions[i * 3 + 2] });
  for (let i = 0; i < top.indices.length; i += 3)
    entries.push(face(topVertex(top.indices[i]), topVertex(top.indices[i + 1]), topVertex(top.indices[i + 2]), 'ice', ice, UP));
  ices.set(ice, entries); return entries;
}

function nearbySpikes(world, point, radius) {
  const list = world.iceSpikes; if (!list?.length) return [];
  let cells = spikeIndexes.get(list);
  if (!cells) {
    cells = new Map(); spikeIndexes.set(list, cells);
    for (const spike of list) for (let x = Math.floor((spike.x - spike.radius) / CELL); x <= Math.floor((spike.x + spike.radius) / CELL); x++)
      for (let y = Math.floor((spike.y - spike.radius) / CELL); y <= Math.floor((spike.y + spike.radius) / CELL); y++) {
        const key = cellKey(x, y), entries = cells.get(key) ?? [];
        if (!cells.has(key)) cells.set(key, entries); entries.push(spike);
      }
  }
  const found = new Set();
  for (let x = Math.floor((point.x - radius) / CELL); x <= Math.floor((point.x + radius) / CELL); x++)
    for (let y = Math.floor((point.y - radius) / CELL); y <= Math.floor((point.y + radius) / CELL); y++)
      for (const spike of cells.get(cellKey(x, y)) ?? []) found.add(spike);
  return found;
}

function spikeSurfaces(spike) {
  let entries = spikes.get(spike); if (entries) return entries;
  const tip = { x: spike.x, y: spike.y, z: spike.z - spike.length }; entries = [];
  const vertex = (i) => ({ x: spike.x + Math.sin(i / 7 * Math.PI * 2) * spike.radius,
    y: spike.y + Math.cos(i / 7 * Math.PI * 2) * spike.radius, z: spike.z });
  for (let i = 0; i < 7; i++) { const a = vertex(i); entries.push(face(a, vertex(i + 1), tip, 'ice-spike', spike, { x: a.x - spike.x, y: a.y - spike.y, z: -spike.radius / spike.length })); }
  spikes.set(spike, entries); return entries;
}

function gather(world, point, radius) {
  const output = []; gridFaces(point.x, point.y, radius, output);
  const seen = new Set(),removed=removedRockIds(world);
  for (const surfaces of [forestSurfaces(world.forest), stoneSurfaces()]) if (surfaces)
    for (let x = Math.floor((point.x - radius) / CELL); x <= Math.floor((point.x + radius) / CELL); x++)
    for (let y = Math.floor((point.y - radius) / CELL); y <= Math.floor((point.y + radius) / CELL); y++)
      for (const f of surfaces.cells.get(cellKey(x, y)) ?? []) if (!seen.has(f)&&!removedRock(f.owner,removed)) { seen.add(f); output.push(f); }
  for (const ice of [...(world.platforms ?? []), ...(world.submergedIce ?? [])]) {
    const top = ice.z ?? 0;
    if (Math.abs(point.x - ice.x) > ice.rx + radius || Math.abs(point.y - ice.y) > ice.ry + radius
      || point.z + radius < top - getIceDepth(ice) || point.z - radius > top) continue;
    output.push(...iceSurfaces(ice));
  }
  for (const spike of nearbySpikes(world, point, radius)) if (Math.abs(point.x - spike.x) <= spike.radius + radius
    && Math.abs(point.y - spike.y) <= spike.radius + radius && point.z + radius >= spike.z - spike.length && point.z - radius <= spike.z)
    output.push(...spikeSurfaces(spike));
  return output.filter((f) => nearby(f, point, radius));
}

function covered(world, p, owner) {
  const removed=removedRockIds(world);
  if (p.x < WORLD_BOUNDS.minX || p.x > WORLD_BOUNDS.maxX || p.y < WORLD_BOUNDS.minY || p.y > WORLD_BOUNDS.maxY) return true;
  if (p.z < getSeabedHeight(p.x, p.y) - .05) return true;
  if (owner !== world.forest && p.z < (getForestHeight(world.forest, p.x, p.y) ?? -Infinity) - .05) return true;
  for (const ice of [...(world.platforms ?? []), ...(world.submergedIce ?? [])]) {
    if (ice === owner || Math.abs(p.x - ice.x) > ice.rx || Math.abs(p.y - ice.y) > ice.ry) continue;
    const top = ice.z ?? 0;
    if (p.z > top - .05 || p.z < top - getIceDepth(ice) + .05) continue;
    if (pointInPolygon(getIceSection(ice, p.z - top), p.x, p.y)) return true;
  }
  for (const spike of nearbySpikes(world, p, 0)) {
    if (spike === owner || p.z >= spike.z || p.z <= spike.z - spike.length) continue;
    const radius = spike.radius * (p.z - spike.z + spike.length) / spike.length;
    if (Math.hypot(p.x - spike.x, p.y - spike.y) < radius - .05) return true;
  }
  for (const { rock, faces } of forestSurfaces(world.forest)?.rocks ?? []) {
    if (rock === owner || Math.abs(p.x - rock.x) > rock.radius || Math.abs(p.y - rock.y) > rock.radius || Math.abs(p.z - rock.z) > rock.height) continue;
    if (faces.every((f) => dot(sub(p, f.a), f.normal) < -.05)) return true;
  }
  for (const { rock, faces, radius, height } of stoneSurfaces().occluders.get(cellKey(Math.floor(p.x/CELL),Math.floor(p.y/CELL)))??[]) {
    if (removedRock(rock,removed)||rock === owner || Math.abs(p.x - rock.x) > radius || Math.abs(p.y - rock.y) > radius || Math.abs(p.z - rock.z) > height) continue;
    if (faces.every((f) => dot(sub(p, f.a), f.normal) < -.05)) return true;
  }
  return false;
}

/** Shared physical contact query, also useful for QA. Never returns buried
 * terrain below a boulder or the top surface over a narrow open fissure.
 * @returns {{point:Point,normal:Point,kind:string,face:Face}|null}
 */
export function findIsopodSurfaceContact(world, point, radius = 2) {
  if (!finite(point) || !Number.isFinite(radius) || radius <= 0) return null;
  let result = null, nearest = radius + EPS;
  for (const f of gather(world, point, radius)) {
    const p = closest(point, f), d = distance(point, p);
    if (d >= nearest || covered(world, p, f.owner)) continue;
    result = { point: { ...p }, normal: { ...f.normal }, kind: f.kind, face: f }; nearest = d;
  }
  return result;
}

/** Plant a visible walking foot on the nearest actual face, including lateral
 * terrain curvature that a single spine normal cannot represent. The 2.6cm pad
 * also clears the distal leg's 1.8cm radius. Call only for visible articulated
 * legs; shared cached triangles keep offscreen simulation independent of LOD.
 * @param {object} world @param {Point} point @param {number} size
 * @param {Point} [target] @returns {Point|null}
 */
export function getIsopodFootSupport(world, point, size = 1, target = { x: 0, y: 0, z: 0 }) {
  const hit = findIsopodSurfaceContact(world, point, 15 * size);
  if (!hit) return null;
  const supported = add(hit.point, hit.normal, .65 * size);
  return Object.assign(target, supported);
}

function orientation(forward, normal, target = [0, 0, 0, 1]) {
  const right = unit(cross(forward, normal)), back = add({ x: 0, y: 0, z: 0 }, forward, -1);
  // Swapping simulation Y/Z changes handedness: render right is -sim cross(F,N).
  orientationMatrix.set(-right.x, normal.x, back.x, 0,
    -right.z, normal.z, back.z, 0, -right.y, normal.y, back.y, 0, 0, 0, 0, 1);
  return orientationQuaternion.setFromRotationMatrix(orientationMatrix).normalize().toArray(target);
}

function rootAt(contact, normal, size) { return add(contact, normal, CLEARANCE * size); }
function underwater(contact, normal, forward, size) {
  const root = rootAt(contact, normal, size), right = cross(forward, normal);
  return root.z + (Math.abs(forward.z) * 39 + Math.abs(right.z) * 17 + Math.abs(normal.z) * 12) * size < WATER_LEVEL - 3;
}

function writePose(pod, state, dt) {
  if (!Array.isArray(pod.surfaceSpine) || pod.surfaceSpine.length !== ISOPOD_SPINE_Z.length)
    pod.surfaceSpine = ISOPOD_SPINE_Z.map((z) => ({ z, position: { x: 0, y: 0, z: 0 },
      normal: { ...UP }, forward: { x: 1, y: 0, z: 0 }, orientation: [0, 0, 0, 1], contact: { x: 0, y: 0, z: 0 } }));
  for (let i = 0; i < pod.surfaceSpine.length; i++) {
    const sample = sampleHistory(state, (ISOPOD_SPINE_Z[i] - HEAD_Z) * 25 * pod.size), frame = pod.surfaceSpine[i];
    Object.assign(frame.position, sample.position); Object.assign(frame.normal, sample.normal); Object.assign(frame.forward, sample.forward);
    Object.assign(frame.contact, add(sample.position, sample.normal, -CLEARANCE * pod.size));
    orientation(sample.forward, sample.normal, frame.orientation); frame.kind = sample.kind;
  }
  const center = pod.surfaceSpine[ISOPOD_SPINE_Z.indexOf(0)], root = center.position, oldHeading = pod.heading;
  Object.assign(pod, root);
  pod.surfaceNormal = { ...center.normal }; pod.surfaceForward = { ...center.forward }; pod.surfaceContact = { ...center.contact };
  pod.surfaceOrientation = [...center.orientation]; pod.surfaceKind = center.kind; pod.surfaceTransition = Boolean(state.pending);
  if (Math.hypot(center.forward.x, center.forward.y) > .001) pod.heading = Math.atan2(center.forward.y, center.forward.x);
  const turn = Math.atan2(Math.sin(pod.heading - oldHeading), Math.cos(pod.heading - oldHeading)) / Math.max(dt, .001);
  pod.crawlTurn = (pod.crawlTurn ?? 0) + (clamp(turn, -1.8, 1.8) - (pod.crawlTurn ?? 0)) * -Math.expm1(-6 * dt);
  pod.crawling = !state.blocked; pod.crawlBlocked = Boolean(state.blocked); state.root = { ...root };
}

function headFrame(state, size, backwards = false) {
  return { position: rootAt(state.contact, state.normal, size), normal: { ...state.normal },
    forward: backwards ? add({ x: 0, y: 0, z: 0 }, state.forward, -1) : { ...state.forward }, kind: state.face.kind,
    physical: backwards ? reversePhysical(state) : physicalSnapshot(state) };
}

function physicalSnapshot(state) {
  return { contact: { ...state.contact }, normal: { ...state.normal }, forward: { ...state.forward },
    face: state.face, pending: state.pending, stepOver: state.stepOver, climbSign: state.climbSign };
}

/** Reverse the direction of travel, retaining the same physical surface/arc.
 * The visible forward frame is never flipped while an animal backs out. */
function reversePhysical(state) {
  const reverse = physicalSnapshot(state);
  reverse.forward = add({ x: 0, y: 0, z: 0 }, state.forward, -1);
  reverse.climbSign = state.climbSign === undefined ? undefined : -state.climbSign;
  if (state.pending) {
    reverse.face = state.pending.face;
    reverse.pending = { ...state.pending, face: state.face };
  }
  if (state.stepOver) {
    const plan = state.stepOver, origin = add(plan.origin, plan.forward, plan.length);
    origin.z = plan.endZ;
    reverse.stepOver = { ...plan, origin, forward: add({ x: 0, y: 0, z: 0 }, plan.forward, -1),
      endZ: plan.origin.z, travel: plan.length - plan.travel };
  }
  return reverse;
}

function sampleHistory(state, behind) {
  const history = state.history, newest = history.at(-1), target = state.travel - behind;
  if (target >= newest.s) return { ...newest, position: add(newest.position, newest.forward, target - newest.s) };
  if (target <= history[0].s) return { ...history[0], position: add(history[0].position, history[0].forward, target - history[0].s) };
  let low = 0, high = history.length - 1;
  while (high - low > 1) { const mid = (low + high) >> 1; if (history[mid].s < target) low = mid; else high = mid; }
  const a = history[low], b = history[high], fraction = (target - a.s) / (b.s - a.s);
  const normal = unit(add(a.normal, sub(b.normal, a.normal), fraction));
  return { position: add(a.position, sub(b.position, a.position), fraction), normal,
    forward: tangent(add(a.forward, sub(b.forward, a.forward), fraction), normal, b.forward), kind: fraction < .5 ? a.kind : b.kind };
}

function recordHead(state, size) {
  const current = headFrame(state, size), previous = state.history.at(-1), d = distance(current.position, previous.position);
  if (d < 1e-6) return;
  state.travel += d; current.s = state.travel; state.history.push(current);
  let trimmed = false;
  while (state.history.length > 2 && state.history[1].s < state.travel - TRAIL_LENGTH * size) { state.history.shift(); trimmed = true; }
  if (trimmed) state.tailState = reversePhysical(state.history[0].physical);
}

/** The leading point reserves the full carapace width, not only its small head.
 * Every later armor section follows this same trail. A narrow side bank must
 * therefore be rejected before the wide thorax reaches it. The small extra
 * margin also covers interpolation between the fifteen render spine samples.
 */
function profileClear(world, root, forward, normal, size, sideOnly = 0) {
  const right = cross(normal, forward);
  for (const side of sideOnly ? [sideOnly] : [-1, 1]) for (const along of [-1, 1])
    for (const up of sideOnly ? [-.10] : [-.10, .42]) {
      const point = add(add(add(root, right, side * .62 * 25 * size), forward, along * .23 * 25 * size), normal, up * 25 * size);
      if (covered(world, point)) return false;
    }
  return true;
}

/** Low pebbles fit between the walking feet. Following their partly buried
 * lower facets would roll the shell into the seabed, so step across their
 * exposed upper profile instead. The real triangle contacts still plant feet.
 */
function pebbleStep(world, state, size) {
  if (state.normal.z < .985) return null;
  const root = rootAt(state.contact, state.normal, size), forward = unit({ x: state.forward.x, y: state.forward.y, z: 0 });
  let best = null, nearest = Infinity;const removed=removedRockIds(world);
  for (const stone of stoneSurfaces().rocks) {
    if(removedRock(stone.rock,removed))continue;
    const delta = sub(stone.rock, root), along = dot(delta, forward);
    const across = Math.abs(delta.x * forward.y - delta.y * forward.x), reach = stone.radius + 8 * size;
    if (along < stone.radius * .5 || along > reach + SPEED * .05 || across > stone.radius + 10 * size || along >= nearest) continue;
    const floor = getSeabedHeight(stone.rock.x, stone.rock.y), height = stone.top - floor;
    if (height <= 0 || height > CLEARANCE * size * 2) continue;
    const length = along + reach, end = add(root, forward, length), endZ = getSeabedHeight(end.x, end.y) + CLEARANCE * size;
    if (Math.abs(endZ - root.z) > 5 * size) continue;
    const rise = Math.max(0, stone.top + 5 * size - (root.z + endZ) * .5);
    best = { origin: root, forward, length, endZ, rise, travel: 0,owner:stone.rock }; nearest = along;
  }
  return best;
}

function advancePebble(world, state, size, step) {
  const plan = state.stepOver, baseSlope = (plan.endZ - plan.origin.z) / plan.length;
  const maximumSlope = Math.abs(baseSlope) + plan.rise * Math.PI / plan.length;
  const travel = Math.min(plan.length, plan.travel + step / Math.sqrt(1 + maximumSlope * maximumSlope));
  const t = travel / plan.length, root = add(plan.origin, plan.forward, travel);
  root.z = plan.origin.z + (plan.endZ - plan.origin.z) * t + plan.rise * Math.sin(Math.PI * t) ** 2;
  const slope = baseSlope + plan.rise * Math.PI / plan.length * Math.sin(2 * Math.PI * t);
  const forward = unit({ x: plan.forward.x, y: plan.forward.y, z: slope });
  const normal = unit({ x: -plan.forward.x * slope, y: -plan.forward.y * slope, z: 1 });
  const support = findIsopodSurfaceContact(world, root, CLEARANCE * size + plan.rise + 6 * size);
  state.contact = add(root, normal, -CLEARANCE * size); state.normal = normal; state.forward = forward;
  if (support) state.face = support.face;
  state.stepOver = travel >= plan.length ? null : { ...plan, travel };
}

function fitsBody(world, pod) {
  if (!bodyProbes) {
    const anatomy = isopodAnatomy(), p = anatomy.shell.attributes.position; bodyProbes = [];
    for (const section of anatomy.shell.userData.anatomySections) {
      let lo = Infinity, hi = -Infinity;
      for (let i = section.start; i < section.start + section.count; i++) { lo = Math.min(lo, p.getZ(i)); hi = Math.max(hi, p.getZ(i)); }
      const pivot = section.kind === 'head' ? -1.05 : (lo + hi) * .5;
      for (let i = section.start; i < section.start + section.count; i += Math.max(1, Math.floor(section.count / 12)))
        bodyProbes.push([p.getX(i), p.getY(i), p.getZ(i), pivot]);
    }
    for (const geometry of Object.values(anatomy)) geometry.dispose();
  }
  const point = { x: 0, y: 0, z: 0 };
  for (const [x, y, z, pivot] of bodyProbes) {
    isopodLocalToWorld(pod, x, y, z, point, pivot);
    if (point.z > WATER_LEVEL - 2 || covered(world, point)) return false;
  }
  return true;
}

function seededState(world, pod, hit, forward) {
  const state = { face: hit.face, contact: hit.point, normal: hit.normal, forward, root: rootAt(hit.point, hit.normal, pod.size), pending: null, reverseUntil: 0, travel: 0, history: [] };
  const initial = headFrame(state, pod.size); initial.s = 0; state.history.push(initial);
  const back = { ...state, forward: add({ x: 0, y: 0, z: 0 }, forward, -1), pending: null };
  let travelled = 0;
  for (let i = 0; i < 600 && travelled < 85 * pod.size; i++) {
    const before = headFrame(back, pod.size, true);
    advanceContact(world, back, pod, 0, .25, true);
    const frame = headFrame(back, pod.size, true), d = distance(frame.position, before.position);
    if (d < 1e-5) return null; // Choose a safer initial pose instead of coiling a tail in place.
    travelled += d; frame.s = -travelled; state.history.unshift(frame);
  }
  state.tailState = back;
  return travelled >= 75 * pod.size ? state : null;
}

/** Extend only the tail end of the continuous trail, one bounded physical step
 * at a time. This also lets a recently spawned bug back out before it has
 * accumulated a body length of forward travel. No attachment search is used. */
function extendReverseTrail(world, state, pod) {
  const back = state.tailState, previous = physicalSnapshot(back), before = headFrame(back, pod.size, true);
  advanceContact(world, back, pod, 0, .05, true);
  const current = headFrame(back, pod.size, true), d = distance(current.position, before.position);
  const progress = dot(sub(current.position, before.position), add(previous.forward, back.forward));
  // Reaching an exact shared edge can prepare a roll without moving the root
  // until the next bounded step. Preserve that connected-face transition.
  if (!back.blocked && d < 1e-6 && back.pending && back.pending !== previous.pending) return true;
  if (back.blocked || d < 1e-6 || d > SPEED * .05 * 1.011 || progress < -d * .5) {
    Object.assign(back, previous); return false;
  }
  current.s = state.history[0].s - d; state.history.unshift(current); return true;
}

function beginRecovery(state, pod) {
  state.recovery = { remaining: RETREAT_LENGTH * pod.size, obstacle: rootAt(state.contact, state.normal, pod.size) };
  state.route = null; state.stalled = 0;
}

/** Reject a head route before it crosses a distant, still-occupied body span.
 * Near neighbors naturally bend around a shared edge; the exclusion starts
 * beyond 1.4m of trail and reserves one metre between non-neighbor centers. */
function clearsOwnTrail(state, size) {
  if (!state.history) return true;
  const head = rootAt(state.contact, state.normal, size);
  for (let i = state.history.length - 1; i >= 0; i--) {
    const frame = state.history[i], behind = state.travel - frame.s;
    if (behind < 35 * size) continue;
    if (behind > 85 * size) break;
    if (distance(head, frame.position) < 25 * size) return false;
  }
  return true;
}

/** Probe a small fixed number of full-body, body-radius arcs only when a
 * retreat ends. Steady patrol never performs this search. */
function chooseEscapeRoute(world, state, pod, time) {
  const sign = ((pod.seed ?? 0) + (state.recoveries ?? 0)) % 2 ? 1 : -1;
  let best = null, bestScore = -Infinity;
  const angles = [sign * Math.PI * .5, -sign * Math.PI * .5, sign * Math.PI];
  if (state.recoveries > 0) angles.push(sign * Math.PI / 6, -sign * Math.PI / 6,
    sign * Math.PI / 4, -sign * Math.PI / 4);
  for (const angle of angles) {
    const direction = rotate(state.forward, state.normal, angle);
    const target = add(state.contact, direction, 190 * pod.size);
    const trial = { ...state, ...physicalSnapshot(state), history: [...state.history],
      recovery: null, escapeGuard: true, route: { target, end: state.travel + 125 * pod.size }, reverseUntil: 0 };
    const preview = { ...pod, surfaceSpine: undefined };
    let travelled = 0, validated = 0, safe = true;
    for (let i = 0; i < 65; i++) {
      const previous = rootAt(trial.contact, trial.normal, pod.size);
      advanceContact(world, trial, pod, time + i * .25, .25);
      const d = distance(previous, rootAt(trial.contact, trial.normal, pod.size));
      if (trial.blocked || d < .01) { safe = false; break; }
      travelled += d; recordHead(trial, pod.size);
      if (i % 10 === 0 || i === 64) {
        writePose(preview, trial, .25);
        if (!fitsBody(world, preview)) { safe = false; break; }
        validated = travelled;
      }
    }
    const score = validated + distance(state.recovery.obstacle, rootAt(trial.contact, trial.normal, pod.size)) * .5;
    if ((safe || validated > 24 * pod.size) && score > bestScore) {
      best = { target, end: state.travel + Math.max(24 * pod.size, validated - 4 * pod.size) }; bestScore = score;
    }
  }
  return best;
}

function recoverAlongTrail(world, state, pod, time, delta) {
  if (time < (state.planAfter ?? 0)) { state.blocked = true; return; }
  const recovery = state.recovery, step = SPEED * delta;
  // Finish on an existing exact frame before selecting a new forward route.
  const older = state.history.findLast(frame => frame.s < state.travel - EPS);
  let next = recovery.remaining > EPS ? state.travel - Math.min(step, recovery.remaining)
    : Math.max(older?.s ?? state.travel, state.travel - step);
  for (let i = 0; i < 2 && state.history[0].s > next - BODY_TRAIL * pod.size; i++) {
    if (extendReverseTrail(world, state, pod)) continue;
    recovery.remaining = 0; next = Math.max(older?.s ?? state.travel, state.travel - step); break;
  }
  const available = state.history[0].s + (ISOPOD_SPINE_Z.at(-1) - HEAD_Z) * 25 * pod.size + 1;
  next = Math.max(next, available);
  const previousTravel = state.travel;
  state.travel = Math.min(state.travel, next); recovery.remaining -= previousTravel - state.travel;
  state.blocked = previousTravel - state.travel < 1e-6;
  const current = sampleHistory(state, 0);
  state.contact = add(current.position, current.normal, -CLEARANCE * pod.size);
  state.normal = current.normal; state.forward = current.forward;
  const exact = state.history.find(frame => Math.abs(frame.s - state.travel) < EPS);
  if ((recovery.remaining <= EPS && exact) || state.blocked) {
    if (exact) Object.assign(state, physicalSnapshot(exact.physical));
    state.history = state.history.filter(frame => frame.s <= state.travel + EPS);
    if (!exact) { const frame = headFrame(state, pod.size); frame.s = state.travel; state.history.push(frame); }
    const route = chooseEscapeRoute(world, state, pod, time);
    state.recoveries = (state.recoveries ?? 0) + 1;
    if (route) { state.route = route; state.recovery = null; state.stalled = 0; state.reverseUntil = 0; }
    else { recovery.remaining = MIN_TURN_RADIUS * pod.size; state.planAfter = time + 1; }
  }
}

/** Initialize only once (or after an external carry/respawn moved the animal).
 * Existing shallow swimming saves settle onto a real surface; ordinary patrol
 * frames never run this relocation search or jump across a gap.
 */
export function attachIsopodToSurface(world, pod) {
  if (!finite(pod) || !Number.isFinite(pod.size) || pod.size <= 0) return false;
  const lead = -HEAD_Z * 25 * pod.size;
  const origin = { x: pod.x + Math.cos(pod.heading) * lead, y: pod.y + Math.sin(pod.heading) * lead };
  let preferred = null, preferredForward = null;
  const center = pod.surfaceSpine?.[ISOPOD_SPINE_Z.indexOf(0)];
  const validPose = center && finite(center.position) && distance(pod, center.position) < 3;
  const leading = validPose ? isopodLocalToWorld(pod, 0, 0, HEAD_Z)
    : { x: origin.x, y: origin.y, z: pod.z };
  preferred = findIsopodSurfaceContact(world, leading, CLEARANCE * pod.size + 2);
  preferredForward = validPose && finite(pod.surfaceForward) ? pod.surfaceForward
    : finite(pod.surfaceNormal) && finite(pod.surfaceContact) && distance(pod, rootAt(pod.surfaceContact, pod.surfaceNormal, pod.size)) < 3 && finite(pod.surfaceForward)
      ? pod.surfaceForward : { x: Math.cos(pod.heading), y: Math.sin(pod.heading), z: 0 };
  // A valid nearby wall/underside has priority over a distant seabed. Existing
  // surface poses and carried/released animals can therefore remain attached.
  const tryCandidate = (candidate, initialForward) => {
    if (!candidate) return false;
    const forward = tangent(initialForward, candidate.normal,
      tangent(UP, candidate.normal, { x: 1, y: 0, z: 0 }));
    if (!underwater(candidate.point, candidate.normal, forward, pod.size)
      || covered(world, add(rootAt(candidate.point, candidate.normal, pod.size), candidate.normal, 10 * pod.size))) return false;
    const state = seededState(world, pod, candidate, forward);
    if (!state) return false;
    const preview = { ...pod, surfaceSpine: undefined, crawlTurn: 0 }; writePose(preview, state, .05);
    if (!fitsBody(world, preview)) return false;
    states.set(pod, state); pod.crawlTurn = 0; writePose(pod, state, .05); pod.crawlTurn = 0; return true;
  };
  if (tryCandidate(preferred, preferredForward)) return true;
  for (let ring = 0; ring <= 16; ring++) for (let sample = 0; sample < (ring ? 12 : 1); sample++) {
    const angle = sample / 12 * Math.PI * 2 + pod.seed, x = origin.x + Math.cos(angle) * ring * 30, y = origin.y + Math.sin(angle) * ring * 30;
    const z = Math.max(getSeabedHeight(x, y), getForestHeight(world.forest, x, y) ?? -Infinity);
    const candidate = findIsopodSurfaceContact(world, { x, y, z }, 2);
    if (!candidate) continue;
    if (tryCandidate(candidate, { x: Math.cos(pod.heading), y: Math.sin(pod.heading), z: 0 })) return true;
  }
  return false;
}

/** Follow actual connected triangles through holes, steep sides and ceilings.
 * At a hard edge the feet hold the real shared hinge while the shell rolls
 * around it at bounded speed; it never snaps its root to a different face.
 */
function advanceContact(world, state, pod, time, delta, fixedForward = false, refinement = 0) {
  const step = SPEED * delta;
  const previous = { contact: state.contact, normal: state.normal, forward: state.forward, face: state.face,
    pending: state.pending, climbSign: state.climbSign, stepOver: state.stepOver };
  state.blocked = false;
  if (state.stepOver) advancePebble(world, state, pod.size, step);
  else if (state.pending) {
    if (state.route && !fixedForward) {
      const desire = tangent(sub(state.route.target, state.contact), state.normal, state.forward);
      const limit = Math.min(1.1, SPEED / (MIN_TURN_RADIUS * pod.size)) * delta;
      const turn = clamp(Math.atan2(dot(cross(state.forward, desire), state.normal), dot(state.forward, desire)), -limit, limit);
      state.forward = tangent(rotate(state.forward, state.normal, turn), state.normal, state.forward);
    }
    const pending = state.pending, angle = Math.acos(clamp(dot(state.normal, pending.face.normal), -1, 1));
    const axis = unit(cross(state.normal, pending.face.normal));
    const parallel = angle > EPS ? clamp(dot(state.forward, axis), -1, 1) : 0;
    const slide = step * parallel, rollStep = step * Math.sqrt(Math.max(0, 1 - parallel * parallel));
    const fraction = angle > EPS ? Math.min(1, rollStep / (CLEARANCE * pod.size * angle)) : 1;
    // Crossing an oblique triangle edge is a helix, not a stationary roll:
    // retain forward travel along the hinge while transporting its normal.
    // The orthogonal slide/roll components share the same bounded speed.
    if (Math.abs(slide) > EPS) {
      if (pending.arc) {
        const center = add(pending.arc.center, axis, slide);
        const end = add(center, pending.face.normal, -2 * CLEARANCE * pod.size);
        const correction = dot(sub(closest(end, pending.face), end), axis);
        const amount = clamp(slide + correction, Math.min(0, slide), Math.max(0, slide));
        state.pending = { ...pending, arc: { center: add(pending.arc.center, axis, amount) } };
      } else {
        const projected = closest(closest(add(state.contact, axis, slide), pending.face), state.face);
        const amount = clamp(dot(sub(projected, state.contact), axis), Math.min(0, slide), Math.max(0, slide));
        state.contact = add(state.contact, axis, amount);
      }
    }
    state.forward = transport(state.forward, state.normal, pending.face.normal, fraction);
    state.normal = unit(transport(state.normal, state.normal, pending.face.normal, fraction));
    if (pending.arc) {
      const head = add(state.pending.arc.center, state.normal, -CLEARANCE * pod.size);
      state.contact = add(head, state.normal, -CLEARANCE * pod.size);
    }
    if (fraction === 1) {
      state.face = pending.face;
      if (pending.arc) state.contact = closest(state.contact, pending.face);
      state.pending = null;
    }
  } else {
    const pebble = pebbleStep(world, state, pod.size);
    if (pebble) { state.stepOver = pebble; advancePebble(world, state, pod.size, step); }
    else {
    const phase = time * .02 + pod.seed;
    const tx = state.route?.target.x ?? pod.homeX + Math.cos(phase) * 130;
    const ty = state.route?.target.y ?? pod.homeY + Math.sin(phase * .83) * 110;
    const tz = state.route?.target.z ?? Math.max(getSeabedHeight(tx, ty), getForestHeight(world.forest, tx, ty) ?? -Infinity);
    let desire = fixedForward ? state.forward : tangent(sub({ x: tx, y: ty, z: tz }, state.contact), state.normal, state.forward);
    // Commit to the vertical route until reaching the next rim/floor. Steering
    // repeatedly toward the destination's height would turn a descending bug
    // back up the same wall before it ever reached the bottom of a deep hole.
    if (!fixedForward && state.normal.z < .65) {
      if (state.normal.z < -.65) desire = state.forward;
      else {
        const climb = tangent(UP, state.normal, state.forward);
        state.climbSign ??= dot(state.forward, climb) < 0 ? -1 : 1;
        const side = unit(cross(state.normal, UP), state.forward);
        desire = unit(add(add({ x: 0, y: 0, z: 0 }, climb, state.climbSign), side,
          clamp(dot(sub({ x: tx, y: ty, z: tz }, state.contact), side) / 200, -.2, .2)));
      }
    } else if (state.normal.z > .8) state.climbSign = undefined;
    if (!fixedForward && !state.route && time < state.reverseUntil) desire = add({ x: 0, y: 0, z: 0 }, desire, -1);
    if (!fixedForward && state.normal.z > .9) {
      // Warn early enough to turn a body-sized arc away from an encroaching
      // side bank. Symmetric obstacles remain climbable straight ahead.
      const ahead = add(rootAt(state.contact, state.normal, pod.size), state.forward, MIN_TURN_RADIUS * pod.size);
      const leftClear = profileClear(world, ahead, state.forward, state.normal, pod.size, -1);
      const rightClear = profileClear(world, ahead, state.forward, state.normal, pod.size, 1);
      if (leftClear !== rightClear) desire = unit(add(state.forward, cross(state.normal, state.forward), leftClear ? -1 : 1));
    }
    // The whole 3m animal follows this trail. A tight head orbit folds several
    // armour plates through each other, so yaw needs a body-sized turn radius.
    // Pitch transport around real climbing surfaces remains independent.
    const turnLimit = Math.min(1.1, SPEED / (MIN_TURN_RADIUS * pod.size)) * delta;
    const turn = clamp(Math.atan2(dot(cross(state.forward, desire), state.normal), dot(state.forward, desire)), -turnLimit, turnLimit);
    state.forward = tangent(rotate(state.forward, state.normal, turn), state.normal, state.forward);
    // Anticipate a concave floor/wall junction with the leading head, not the
    // body centre. This rounded offset path stays outside both solids. A raw
    // hinge roll here would move backwards and bury the head in the floor.
    const r = CLEARANCE * pod.size, head = rootAt(state.contact, state.normal, pod.size);
    let concave = null, nearestGap = Infinity;
    for (const f of gather(world, head, r * 2 + step)) {
      const facing = dot(state.forward, f.normal), d = dot(state.normal, f.normal);
      if (facing > -EPS || d > .999 || d < -.95) continue;
      const p = closest(head, f), gap = dot(sub(head, p), f.normal), startGap = r * (2 - d);
      if (gap < r - .1 || gap > startGap + step || distance(head, p) > startGap + step || gap >= nearestGap) continue;
      const along = (startGap - gap) / facing;
      if (Math.abs(along) > step * 1.01) continue;
      const start = add(head, state.forward, along), center = add(start, state.normal, r);
      const endContact = add(center, f.normal, -2 * r);
      if (distance(endContact, closest(endContact, f)) > .05 || covered(world, p, f.owner)) continue;
      concave = { face: f, contact: add(state.contact, state.forward, along), center }; nearestGap = gap;
    }
    if (concave) {
      state.contact = concave.contact; state.pending = { face: concave.face, arc: { center: concave.center } };
    } else {
    const desired = add(state.contact, state.forward, step), candidates = gather(world, state.contact, step * 2 + .1);
    let chosen = null, score = Infinity;
    for (const f of candidates) {
      const travel = transport(state.forward, state.normal, f.normal), probe = add(state.contact, travel, step);
      const p = closest(f === state.face ? desired : probe, f), movement = distance(p, state.contact);
      if (movement > step * 1.01 || covered(world, p, f.owner)) continue;
      const progress = dot(sub(p, state.contact), travel), miss = distance(p, f === state.face ? desired : probe);
      if (progress < -1e-5) continue;
      const candidateScore = miss + Math.max(0, step - progress) * .1 + (f === state.face ? 0 : 1e-6);
      if (candidateScore < score) { score = candidateScore; chosen = { face: f, point: p }; }
    }
    if (chosen) {
      const angle = Math.acos(clamp(dot(state.normal, chosen.face.normal), -1, 1));
      if (angle > 1e-5) {
        const hinge = closest(state.contact, chosen.face), gap = distance(hinge, state.contact);
        if (gap <= step * 1.01) {
          state.contact = { ...hinge };
          state.pending = { face: chosen.face };
        }
      } else { state.contact = { ...chosen.point }; state.face = chosen.face; }
    } else state.reverseUntil = time + 3;
    }
    }
  }
  const movement = sub(rootAt(state.contact, state.normal, pod.size), rootAt(previous.contact, previous.normal, pod.size));
  if (length(movement) > step + 1e-6) {
    Object.assign(state, previous);
    if (refinement < 3) advanceContact(world, state, pod, time, delta * .5, fixedForward, refinement + 1);
    else state.blocked = true;
  } else if ((!fixedForward && !clearsOwnTrail(state, pod.size))
    || (!fixedForward && (state.escapeGuard || state.recoveries > 0)
      && dot(movement, add(previous.forward, state.forward)) < -length(movement) * .3 - EPS)
    || !underwater(state.contact, state.normal, state.forward, pod.size)
    || !profileClear(world, rootAt(state.contact, state.normal, pod.size), state.forward, state.normal, pod.size)) {
    // Rejected steps cannot accumulate stationary yaw. The caller detects the
    // stall and backs the whole animal along its continuous recorded trail.
    Object.assign(state, previous); state.blocked = true; state.reverseUntil = time + 4;
  }
}

export function updateIsopodSurface(world, pod, time, dt) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  if (pod.squidHeldBy || pod.squidRespawnIn > 0) { pod.crawling = false; pod.crawlTurn = 0; return; }
  const delta = Math.min(.05, dt);
  let state = states.get(pod);const removed=removedRockIds(world);
  if(state&&state.removedRocks!==removed){
    state.removedRocks=removed;
    if(removedPhysical(state,removed)||removedPhysical(state.tailState,removed)
      ||state.history?.some(frame=>removedPhysical(frame.physical,removed))){states.delete(pod);state=null;}
  }
  if (!state || distance(pod, state.root) > 3) {
    if (!attachIsopodToSurface(world, pod)) { pod.crawling = false; pod.crawlTurn = 0; return; }
    state = states.get(pod);
    state.removedRocks=removed;
  }
  if (state.recovery) recoverAlongTrail(world, state, pod, time, delta);
  else {
    const before = rootAt(state.contact, state.normal, pod.size);
    advanceContact(world, state, pod, time, delta);
    const progress = distance(before, rootAt(state.contact, state.normal, pod.size));
    state.stalled = progress < SPEED * delta * .02 ? (state.stalled ?? 0) + delta : 0;
    recordHead(state, pod.size);
    if (state.route && state.travel >= state.route.end) state.route = null;
    if (state.stalled >= .5) beginRecovery(state, pod);
  }
  writePose(pod, state, delta);
}
