import * as THREE from "./vendor/three.module.js";
import {applyMossSurface} from './moss-surface.js';
import {createForestRockGeometry,applyRockWearNormals} from './weathered-rock-geometry.js';
import { updateInstancedWindBounds } from "./render-visibility.js";
import { getForestHeight } from "./forest-terrain.js";
import { WATER_LEVEL, WORLD_BOUNDS } from "./terrain.js";
import {capRenderDistance} from './render-distance.js';

const SCALE = 25;
const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const LOWER_BRANCH = 0.25;
const BRANCH_SPAN = 0.69;
const PURPLES = [0xb49ac5, 0xd1b8e0, 0xe5d0ed, 0xf0dff3];
const point = (p) => new THREE.Vector3(p.x / SCALE, p.z / SCALE, p.y / SCALE);

/** @typedef {{x:number,y:number,z:number,seed:number,height:number,radius:number,id?:string,kind?:string,trunkRadius?:number}} ForestGrowth */
/** @typedef {{x:number,y:number,z:number,seed:number,heading:number,length:number,radius:number}} ForestLog */
/** @typedef {{mesh:{positions:number[],indices:number[],surfaceIndexCount?:number,shoreIndexStart?:number,shoreIndexCount?:number,shoreBlend?:number[]},boundary?:{x:number,y:number}[],trail?:{x:number,y:number}[],trees?:ForestGrowth[],grass?:ForestGrowth[],plants?:ForestGrowth[],rocks?:ForestGrowth[],logs?:ForestLog[]}} PreparedForest */

function random(seed = 1) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** Small merged primitives keep the forest's fine silhouettes in a few shared buffers. */
class Surface {
  constructor() { this.positions = []; this.colors = []; this.uvs = []; }
  triangle(a, b, c, color, uv = [[0, 0], [1, 0], [0.5, 1]]) {
    const tint = new THREE.Color(color);
    for (const [index, vertex] of [a, b, c].entries()) {
      this.positions.push(vertex.x, vertex.y, vertex.z);
      this.colors.push(tint.r, tint.g, tint.b);
      this.uvs.push(...uv[index]);
    }
  }
  leaf(a, b, width, color, lift = 0.02) {
    const axis = b.clone().sub(a), right = new THREE.Vector3(-axis.z, 0, axis.x).normalize();
    const middle = a.clone().lerp(b, 0.48).addScaledVector(UP, lift);
    const left = middle.clone().addScaledVector(right, width);
    const edge = middle.clone().addScaledVector(right, -width);
    this.triangle(a, left, b, color); this.triangle(a, b, edge, color);
  }
  cylinder(a, b, radius, endRadius, color, sides = 6) {
    const axis = b.clone().sub(a), length = axis.length();
    if (length < 0.00001) return;
    const rotation = new THREE.Quaternion().setFromUnitVectors(UP, axis.divideScalar(length));
    const ring = (angle, r, origin) => new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r)
      .applyQuaternion(rotation).add(origin);
    for (let side = 0; side < sides; side++) {
      const angle = side / sides * TAU, next = (side + 1) / sides * TAU;
      const p = ring(angle, radius, a), q = ring(next, radius, a);
      const r = ring(angle, endRadius, b), s = ring(next, endRadius, b);
      const u = side / sides * TAU * radius, v = (side + 1) / sides * TAU * radius;
      // Bark coordinates measure real metres, including every branch and buttress root.
      this.triangle(p, r, q, color, [[u, 0], [u, length], [v, 0]]);
      this.triangle(q, r, s, color, [[v, 0], [u, length], [v, length]]);
    }
  }
  geometry() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(this.colors, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(this.uvs, 2));
    geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    return geometry;
  }
}

function trailDistance(forest, x, y) {
  let nearest = Infinity;
  const trail = forest.trail ?? [];
  for (let index = 1; index < trail.length; index++) {
    const a = trail[index - 1], b = trail[index], dx = b.x - a.x, dy = b.y - a.y;
    const along = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    nearest = Math.min(nearest, Math.hypot(x - a.x - dx * along, y - a.y - dy * along));
  }
  return nearest;
}

/** The baked collision triangles are copied without displacement or a separate visual height function.
 * @param {PreparedForest} forest
 */
export function forestGroundGeometry(forest) {
  const surfaces = [new Surface(), new Surface(), new Surface()], blends = [[], [], []], mesh = forest?.mesh;
  if (!mesh) return surfaces[0].geometry();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const normal = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3();
  const soilColors = new Map(), tint = new THREE.Color(), white = new THREE.Color(0xffffff);
  const read = (target, index) => target.set(mesh.positions[index * 3] / SCALE,
    mesh.positions[index * 3 + 2] / SCALE, mesh.positions[index * 3 + 1] / SCALE);
  for (let face = 0; face < mesh.indices.length; face += 3) {
    // SIM z-up → render y-up swaps handedness, including the outward coastal side faces.
    const vertices = [mesh.indices[face], mesh.indices[face + 2], mesh.indices[face + 1]];
    read(a, vertices[0]); read(b, vertices[1]); read(c, vertices[2]);
    normal.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a)).normalize();
    const top = face < (mesh.surfaceIndexCount ?? mesh.indices.length);
    if (top && normal.y < 0) {
      const swap = b.clone(); b.copy(c); c.copy(swap); normal.negate();
      [vertices[1], vertices[2]] = [vertices[2], vertices[1]];
    }
    const x = (a.x + b.x + c.x) / 3, y = (a.z + b.z + c.z) / 3;
    const path = trailDistance(forest, x * SCALE, y * SCALE) < 36;
    const steep = !top || normal.y < 0.68;
    const shore = top && face >= mesh.shoreIndexStart && face < mesh.shoreIndexStart + mesh.shoreIndexCount;
    const group = shore ? 2 : steep ? 1 : 0;
    const color = shore ? 0xffffff : steep ? 0xf0c49c : path ? 0xb29b8b
      : Math.sin(x * 0.9 + y * 1.7) > 0.4 ? 0x9baf87 : 0xc7a8c6;
    const uv = (p) => steep ? (Math.abs(normal.x) > Math.abs(normal.z) ? [p.z, p.y] : [p.x, p.y]) : [p.x, p.z];
    surfaces[group].triangle(a, b, c, color, [uv(a), uv(b), uv(c)]);
    blends[group].push(...vertices.map((index) => Math.max(0, Math.min(1, mesh.shoreBlend?.[index] ?? 0))));
    if (top && group === 0) for (const index of vertices) {
      if (!soilColors.has(index)) soilColors.set(index, { color: new THREE.Color(0, 0, 0), count: 0 });
      const soil = soilColors.get(index); soil.color.add(tint.setHex(color)); soil.count++;
    }
    if (shore) for (const [corner, index] of vertices.entries()) {
      const soil = soilColors.get(index), blend = blends[group].at(-3 + corner);
      if (soil) tint.copy(soil.color).multiplyScalar(1 / soil.count);
      else if (blend === 1) tint.copy(white);
      else {
        const x = mesh.positions[index * 3] / SCALE, y = mesh.positions[index * 3 + 1] / SCALE;
        tint.setHex(trailDistance(forest, x * SCALE, y * SCALE) < 36 ? 0xb29b8b
          : Math.sin(x * .9 + y * 1.7) > .4 ? 0x9baf87 : 0xc7a8c6);
      }
      tint.lerp(white, blend);
      const offset = surfaces[group].colors.length - 9 + corner * 3;
      surfaces[group].colors.splice(offset, 3, tint.r, tint.g, tint.b);
    }
  }
  const counts = surfaces.map((surface) => surface.positions.length / 3);
  for (const field of ["positions", "colors", "uvs"]) surfaces[0][field] = surfaces.flatMap((surface) => surface[field]);
  const geometry = surfaces[0].geometry();
  geometry.setAttribute("shoreBlend", new THREE.Float32BufferAttribute(blends.flat(), 1));
  geometry.addGroup(0, counts[0], 0);
  geometry.addGroup(counts[0], counts[1], 1);
  if (counts[2]) geometry.addGroup(counts[0] + counts[1], counts[2], 2);
  return geometry;
}

/** Borrow the existing surface maps for one opaque shore pass. The actual beach
 * triangles provide forest/sand weights; elevation adds wet sand and shelf stone.
 * @param {Record<string,THREE.MeshStandardMaterial>} shared @param {{value:number}} clock
 */
export function createShoreMaterial(shared = {}, clock = { value: 0 }) {
  const result = material(shared.sand ?? shared.forestFloor, 0xffffff, { flatShading: false, roughness: .92, metalness: .01 });
  result.name = "graded-forest-sand-stone-shore"; result.color.setHex(0xffffff);
  result.normalScale.set(.42, .42);
  const sand = shared.sand?.map, rock = shared.rock?.map, soil = shared.forestFloor?.map;
  const previous = result.onBeforeCompile.bind(result);
  result.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    Object.assign(shader.uniforms, { shoreTime: clock, shoreSandMap: { value: sand ?? null },
      shoreRockMap: { value: rock ?? null }, shoreSoilMap: { value: soil ?? null },
      shoreSoilTint: { value: shared.forestFloor?.color?.clone() ?? new THREE.Color(0x8f7e8d) },
      shoreMapFlags: { value: new THREE.Vector3(Number(Boolean(sand)), Number(Boolean(rock)), Number(Boolean(soil))) } });
    shader.vertexShader = `attribute float shoreBlend;varying float vShoreBlend;varying vec3 vShoreWorld,vShoreNormal;\n${shader.vertexShader}`
      .replace("#include <worldpos_vertex>", `#include <worldpos_vertex>
        vShoreBlend=shoreBlend;vShoreWorld=(modelMatrix*vec4(transformed,1.)).xyz;
        vShoreNormal=normalize(mat3(modelMatrix)*objectNormal);`);
    shader.fragmentShader = `uniform sampler2D shoreSandMap,shoreRockMap,shoreSoilMap;
      uniform vec3 shoreMapFlags,shoreSoilTint;uniform float shoreTime;
      varying float vShoreBlend;varying vec3 vShoreWorld,vShoreNormal;\n${shader.fragmentShader}`
      .replace("#include <map_fragment>", `
        vec2 shorePoint=vShoreWorld.xz;
        float shoreGrain=sin(shorePoint.x*.73+sin(shorePoint.y*.49))*.5+.5;
        vec2 shoreUV=shorePoint*.8+vec2(shoreGrain*.13);
        vec3 shoreAxis=abs(vShoreNormal);
        vec2 shoreRockUV=shoreAxis.x>shoreAxis.y&&shoreAxis.x>shoreAxis.z?vShoreWorld.zy:
          shoreAxis.y>=shoreAxis.x&&shoreAxis.y>=shoreAxis.z?shorePoint:vShoreWorld.xy;
        vec3 shoreSand=mix(vec3(.68,.57,.40),texture2D(shoreSandMap,shoreUV).rgb,shoreMapFlags.x);
        vec3 shoreStone=mix(vec3(.50,.28,.14),texture2D(shoreRockMap,shoreRockUV*.76).rgb,shoreMapFlags.y);
        vec3 shoreSoil=mix(vec3(1.),texture2D(shoreSoilMap,shorePoint).rgb,shoreMapFlags.z)*shoreSoilTint;
        float shoreMix=smoothstep(0.,1.,vShoreBlend);
        float shoreWater=${(WATER_LEVEL / SCALE).toFixed(4)}+sin(shorePoint.x*.075+shorePoint.y*.031+shoreTime*.7)*.047
          +cos(shorePoint.y*.113-shorePoint.x*.029-shoreTime*.5)*.037;
        float shoreWetness=1.-smoothstep(shoreWater+.04,shoreWater+.34,vShoreWorld.y);
        float shoreDepth=max(0.,shoreWater-vShoreWorld.y);
        float shoreStoneMix=clamp(smoothstep(1.2,7.,shoreDepth)*.92+(1.-shoreAxis.y)*.52,0.,1.);
        vec3 shoreColor=mix(mix(shoreSoil,shoreSand,shoreMix),shoreStone,shoreStoneMix*shoreMix);
        shoreColor*=mix(vec3(1.),vec3(.64,.71,.76),shoreWetness*shoreMix);
        diffuseColor.rgb*=shoreColor*(1.+(shoreGrain-.5)*.10*shoreMix);`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
        roughnessFactor=mix(roughnessFactor,.42,shoreWetness*shoreMix*(1.-shoreStoneMix*.35));`);
  };
  result.customProgramCacheKey = () => "croba-graded-coastal-surface-v1";
  return result;
}

/** One soft foam ribbon follows the actual water-plane intersection with the baked land and cliff triangles.
 * @param {PreparedForest} forest
 */
export function forestShoreGeometry(forest) {
  const surface = new Surface(), mesh = forest?.mesh, seen = new Set(), wash = [];
  if (!mesh) return surface.geometry();
  const read = (index) => new THREE.Vector3().fromArray(mesh.positions, index * 3);
  for (let face = 0; face < mesh.indices.length; face += 3) {
    const triangle = mesh.indices.slice(face, face + 3).map(read), crossings = [];
    for (let edge = 0; edge < 3; edge++) {
      const a = triangle[edge], b = triangle[(edge + 1) % 3];
      const da = a.z - WATER_LEVEL, db = b.z - WATER_LEVEL;
      if (Math.abs(da - db) < 1e-8) continue;
      const along = da / (da - db);
      if (along < 0 || along > 1) continue;
      const crossing = a.clone().lerp(b, along);
      if (!crossings.some((p) => p.distanceToSquared(crossing) < 1e-8)) crossings.push(crossing);
    }
    if (crossings.length !== 2 || crossings[0].distanceToSquared(crossings[1]) < 0.01) continue;
    // These edges join solid world walls, not open water. Drawing a shoreline
    // here would invent an ocean strip along the inland forest boundary.
    if (crossings.every((p) => Math.abs(p.x - WORLD_BOUNDS.maxX) < 0.0001)
      || crossings.every((p) => Math.abs(p.y - WORLD_BOUNDS.maxY) < 0.0001)) continue;
    const key = crossings.map((p) => `${p.x.toFixed(2)}:${p.y.toFixed(2)}`).sort().join("/");
    if (seen.has(key)) continue;
    seen.add(key);
    const normal = new THREE.Vector3().crossVectors(triangle[1].clone().sub(triangle[0]), triangle[2].clone().sub(triangle[0]));
    normal.z = 0;
    if (normal.lengthSq() < 1e-8) continue;
    normal.normalize();
    const steps = Math.max(1, Math.ceil(crossings[0].distanceTo(crossings[1]) / 20));
    const gentle = face < (mesh.surfaceIndexCount ?? mesh.indices.length) ? 1 : 0;
    const render = (p) => new THREE.Vector3(p.x / SCALE, (WATER_LEVEL + 0.35) / SCALE, p.y / SCALE);
    const outer = (p, width) => {
      const result = p.clone().addScaledVector(normal, width);
      const height = getForestHeight(forest, result.x, result.y);
      return height !== null && height > WATER_LEVEL + 0.01 ? null : result;
    };
    for (let part = 0; part < steps; part++) {
      const a = crossings[0].clone().lerp(crossings[1], part / steps);
      const b = crossings[0].clone().lerp(crossings[1], (part + 1) / steps);
      const width = gentle ? 16 + Math.sin(face * .17) * 3 : 5 + Math.sin(face * .17) * 1.5;
      const c = outer(a, width), d = outer(b, width);
      if (!c || !d) continue;
      surface.triangle(render(a), render(b), render(c), 0xffffff, [[0, 0], [1, 0], [0, 1]]);
      surface.triangle(render(c), render(b), render(d), 0xffffff, [[0, 1], [1, 0], [1, 1]]);
      wash.push(gentle, gentle, gentle, gentle, gentle, gentle);
    }
  }
  const geometry = surface.geometry();
  geometry.setAttribute("shoreWash", new THREE.Float32BufferAttribute(wash, 1));
  geometry.boundingSphere.radius += .084;
  return geometry;
}

/** A spruce is nine irregular branch whorls covered in individual pinnate needle sprays. */
function spruceNeedles(detail) {
  const surface = new Surface(), distant = detail === "distant", fine = detail === true;
  const whorls = 9, branches = distant ? 5 : 7;
  for (let level = 0; level < whorls; level++) {
    const height = LOWER_BRANCH + level / whorls * BRANCH_SPAN;
    const reach = ((1 - height) / (1 - LOWER_BRANCH)) ** 0.84;
    for (let branch = 0; branch < branches; branch++) {
      // The exact same branch skeleton survives an LOD change; only its tiny needle density changes.
      const rng = random(0x51ac ^ Math.imul(level + 1, 0x9e3779b1) ^ Math.imul(branch + 1, 0x85ebca6b));
      const angle = branch / branches * TAU + level * 1.47 + rng() * 0.25;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const right = new THREE.Vector3(-direction.z, 0, direction.x);
      const length = reach * (0.78 + rng() * 0.25);
      const sprays = distant ? 1 : fine ? 4 : 2;
      for (let spray = 0; spray < sprays; spray++) {
        const along = distant ? 0.32 : 0.18 + spray / sprays * 0.72;
        const stem = direction.clone().multiplyScalar(length * along);
        stem.y = height - Math.sin(along * Math.PI) * (level ? 0.019 : 0.005) + rng() * 0.008;
        const pinnae = distant ? 1 : fine ? 5 : 3;
        const sprayLength = length * (distant ? 0.55 : 0.28 - along * 0.10);
        for (let pair = 0; pair < pinnae; pair++) for (const side of [-1, 1]) {
          const fraction = pair / pinnae;
          const base = stem.clone().addScaledVector(direction, fraction * sprayLength);
          const tip = base.clone().addScaledVector(direction, sprayLength * 0.5)
            .addScaledVector(right, side * sprayLength * (1 - fraction * 0.55) * (0.65 + rng() * 0.35));
          tip.y -= (level ? 0.025 + (1 - fraction) * 0.045 : 0.005 + (1 - fraction) * 0.014) * (1 - height);
          surface.leaf(base, tip, sprayLength * (distant ? 0.48 : fine ? 0.13 : 0.27),
            PURPLES[Math.min(3, Math.floor(rng() * 3 + fraction))], 0.008);
        }
      }
    }
  }
  // A narrow, ragged leader replaces a smooth conical treetop.
  for (let index = 0; index < 12; index++) {
    const angle = index * 2.4, height = 0.89 + index / 12 * 0.105;
    surface.leaf(new THREE.Vector3(0, height, 0),
      new THREE.Vector3(Math.cos(angle) * (1 - height) * 0.6, height + 0.015,
        Math.sin(angle) * (1 - height) * 0.6), 0.025 * (1 - height) * 4, 0xf4e5f7);
  }
  // The far silhouette includes its trunk, allowing all distant groves to share
  // one opaque draw rather than retaining every fine bark/branch buffer.
  if (distant) surface.cylinder(new THREE.Vector3(), new THREE.Vector3(0, 0.93, 0),
    0.12, 0.015, 0x77606c, 5);
  return surface.geometry();
}

function grassGeometry() {
  const surface = new Surface(), rng = random(0x9a55);
  for (let tuft = 0; tuft < 3; tuft++) for (let blade = 0; blade < 7; blade++) {
    const angle = blade * 2.4 + tuft * 1.7, length = 0.48 + rng() * 0.52;
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const right = new THREE.Vector3(-direction.z, 0, direction.x);
    const root = direction.clone().multiplyScalar(rng() * 0.25)
      .add(new THREE.Vector3(Math.cos(tuft * 2.4) * 0.5, 0, Math.sin(tuft * 2.4) * 0.5));
    let previous = root;
    for (let segment = 1; segment <= 3; segment++) {
      const t = segment / 3, next = root.clone().addScaledVector(direction, t * t * 0.6);
      next.y = Math.sin(t * Math.PI * 0.42) * length;
      const widthA = 0.075 * (1 - (segment - 1) / 3), widthB = 0.075 * (1 - t);
      const a = previous.clone().addScaledVector(right, widthA), b = previous.clone().addScaledVector(right, -widthA);
      const c = next.clone().addScaledVector(right, widthB), d = next.clone().addScaledVector(right, -widthB);
      const color = segment > 2 ? 0x9253aa : segment > 1 ? 0x6d3985 : 0x49304f;
      surface.triangle(a, c, b, color); surface.triangle(b, c, d, color);
      previous = next;
    }
  }
  return surface.geometry();
}

function fernGeometry() {
  const surface = new Surface();
  for (let frond = 0; frond < 7; frond++) {
    const angle = frond * 2.4, direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const right = new THREE.Vector3(-direction.z, 0, direction.x);
    const stemPoint = (t) => direction.clone().multiplyScalar(t * 0.85)
      .addScaledVector(UP, Math.sin(t * Math.PI * 0.78) * (0.65 + (frond % 3) * 0.15));
    for (let pair = 1; pair <= 8; pair++) {
      const t = pair / 9, base = stemPoint(t), length = Math.sin(t * Math.PI) * 0.25;
      for (const side of [-1, 1]) {
        const tip = base.clone().addScaledVector(right, side * length).addScaledVector(direction, length * 0.6);
        surface.leaf(base, tip, length * 0.19, pair > 5 ? 0xc6db9e : 0x9eb18c, 0.025);
      }
      surface.cylinder(stemPoint((pair - 1) / 9), base, 0.012, 0.008, 0x8c9b71, 3);
    }
  }
  return surface.geometry();
}

function flowerGeometry() {
  const surface = new Surface();
  const stem = new THREE.Vector3(0, 0.62, 0);
  surface.cylinder(new THREE.Vector3(), stem, 0.035, 0.018, 0x536c4c, 5);
  for (let leaf = 0; leaf < 5; leaf++) {
    const angle = leaf * 2.4, root = new THREE.Vector3(0, 0.14 + leaf * 0.085, 0);
    const tip = root.clone().add(new THREE.Vector3(Math.cos(angle) * 0.48, 0.13, Math.sin(angle) * 0.48));
    surface.leaf(root, tip, 0.095, leaf % 2 ? 0x738e55 : 0x91a967, 0.065);
    surface.cylinder(root, tip, 0.013, 0.004, 0xb1c383, 3);
  }
  for (let blossom = 0; blossom < 3; blossom++) {
    const angle = blossom * TAU / 3;
    const center = new THREE.Vector3(Math.cos(angle) * 0.24, 0.65 + blossom * 0.17, Math.sin(angle) * 0.24);
    surface.cylinder(stem.clone().multiplyScalar(0.65), center, 0.022, 0.013, 0x536c4c, 5);
    for (let petal = 0; petal < 6; petal++) {
      const theta = petal * TAU / 6 + blossom;
      const outward = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta));
      const across = new THREE.Vector3(-outward.z, 0, outward.x);
      const petalPoint = (t, side) => center.clone().addScaledVector(outward, t * 0.34)
        .addScaledVector(across, side * Math.sin(t * Math.PI) * 0.115)
        .addScaledVector(UP, Math.sin(t * Math.PI) * 0.035 + t * t * 0.15 + side * side * 0.035);
      for (let along = 0; along < 4; along++) for (let width = 0; width < 3; width++) {
        const t = along / 4, next = (along + 1) / 4, side = width / 3 * 2 - 1, edge = (width + 1) / 3 * 2 - 1;
        const color = along > 2 ? 0xd7b2e3 : petal % 2 ? 0xb985cd : 0x88509f;
        surface.triangle(petalPoint(t, side), petalPoint(next, side), petalPoint(next, edge), color);
        surface.triangle(petalPoint(t, side), petalPoint(next, edge), petalPoint(t, edge), color);
      }
      surface.leaf(center.clone().addScaledVector(UP, -0.035), center.clone().addScaledVector(outward, 0.15)
        .addScaledVector(UP, -0.02), 0.04, 0x6c8650, 0.01);
    }
    for (let stamen = 0; stamen < 5; stamen++) {
      const theta = stamen * 2.4;
      const start = center.clone().add(new THREE.Vector3(Math.cos(theta) * 0.04, 0, Math.sin(theta) * 0.04));
      surface.cylinder(start, start.clone().addScaledVector(UP, 0.15), 0.02, 0.035, 0xc7d682, 4);
    }
  }
  return surface.geometry();
}

function coneGeometry() {
  const surface = new Surface();
  for (let ring = 0; ring < 6; ring++) for (let scale = 0; scale < 7; scale++) {
    const angle = scale / 7 * TAU + ring * 0.45, height = ring / 6;
    const radius = Math.sin((height * 0.8 + 0.1) * Math.PI) * 0.45;
    const start = new THREE.Vector3(Math.cos(angle) * radius * 0.7, height, Math.sin(angle) * radius * 0.7);
    surface.leaf(start, start.clone().add(new THREE.Vector3(Math.cos(angle) * 0.17, 0.18, Math.sin(angle) * 0.17)),
      0.11, ring % 2 ? 0x936b76 : 0x68505f, 0.035);
  }
  return surface.geometry();
}

function mossGeometry(rock) {
  const surface = new Surface(), positions = rock.attributes.position;
  let shoots=0;
  for (let vertex = 0; vertex < positions.count; vertex += 3) {
    const points = [0, 1, 2].map((offset) => new THREE.Vector3().fromBufferAttribute(positions, vertex + offset));
    if (points.some((p) => p.y < 0.28)) continue;
    const [a,b,c]=points.map(p=>p.multiplyScalar(1.016));
    surface.triangle(a,b,c,0xc0ce9d);
    const outward=new THREE.Vector3().crossVectors(b.clone().sub(a),c.clone().sub(a)).normalize();
    if(outward.y<0)outward.negate();
    const tangent=b.clone().sub(a).normalize(),across=new THREE.Vector3().crossVectors(outward,tangent).normalize();
    // Fixed tiny leafy shoots soften the cap's silhouette in the same draw.
    // Their geometry is shared by every boulder on every device.
    for(let shoot=0;shoot<12;shoot++){
      const u=Math.sqrt((shoot+.5)/12),v=(shoot*.61803398875+vertex*.037)%1;
      const root=a.clone().multiplyScalar(1-u).addScaledVector(b,u*(1-v)).addScaledVector(c,u*v);
      const height=.022+(shoot%4)*.004;
      for(let leaf=0;leaf<3;leaf++){
        const turn=shoot*2.3999632297+leaf*2.1;
        const reach=tangent.clone().multiplyScalar(Math.cos(turn)).addScaledVector(across,Math.sin(turn));
        const start=root.clone().addScaledVector(outward,leaf*.004);
        const tip=start.clone().addScaledVector(outward,height).addScaledVector(reach,.012);
        surface.leaf(start,tip,.0035,leaf%2?0x99b17d:0xb1c18e,.003);
      }
      shoots++;
    }
  }
  const geometry=surface.geometry();geometry.userData.mossShoots=shoots;return geometry;
}

function material(source, fallback, extra = {}) {
  const result = source?.isMaterial ? source.clone() : new THREE.MeshStandardMaterial({ color: fallback, roughness: 0.88 });
  result.vertexColors = true; result.side = THREE.DoubleSide;
  Object.assign(result, extra);
  return result;
}

function instanced(group, geometry, material, count, name) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = name; mesh.receiveShadow = true;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  group.add(mesh); return mesh;
}

function tipWind(material, clock, name, strength, speed, power) {
  // Match the actual GLSL constants, including its three-decimal amplitudes.
  material.userData.forestWind = { x: Number(strength.toFixed(3)),
    z: Number((strength * .61).toFixed(3)), power: Number(power.toFixed(1)) };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.forestTime = clock;
    shader.vertexShader = `uniform float forestTime;\n${shader.vertexShader}`.replace("#include <begin_vertex>",
      `#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat forestPhase=instanceMatrix[3].x*.17+instanceMatrix[3].z*.11;\nfloat forestBend=pow(max(0.,position.y),${power.toFixed(1)});\ntransformed.x+=sin(forestTime*${speed.toFixed(2)}+forestPhase+position.y*4.)*${strength.toFixed(3)}*forestBend;\ntransformed.z+=cos(forestTime*${(speed * 0.81).toFixed(2)}+forestPhase)*${(strength * 0.61).toFixed(3)}*forestBend;\n#endif`);
  };
  material.customProgramCacheKey = () => `croba-${name}-breeze-v2`;
}

/** Use the exact rounded GLSL amplitudes for every shader breeze phase. */
function updateDetailBounds(mesh) {
  const wind = mesh.material.userData.forestWind;
  const bend = wind ? Math.max(0, mesh.geometry.boundingBox.max.y) ** wind.power : 0;
  updateInstancedWindBounds(mesh, wind ? wind.x * bend : 0, wind ? wind.z * bend : 0);
}

/** Detailed coast forest. All anchors and ground faces come from the immutable prepared world. */
export class ForestRenderer {
  /** @param {{forest?:PreparedForest}} world @param {Record<string,THREE.MeshStandardMaterial>} [shared] */
  constructor(world, shared = {}) {
    this.group = new THREE.Group(); this.group.name = "violet-spruce-coast";
    this.forest = world.forest;
    this.materials = {}; this.geometries = {}; this.chunks = []; this.details = []; this.debrisChunks = [];
    this.wind = { value: 0 }; this.transform = new THREE.Object3D(); this.disposed = false;
    this.shoreTime = { value: 0 };
    if (!this.forest?.mesh) return;
    this.materials = {
      bark: material(shared.bark, 0x73606b),
      ground: material(shared.forestFloor, 0x8f7e8d),
      shore: createShoreMaterial(shared, this.shoreTime),
      needles: material(shared.purpleNeedles, 0xcbb4d3),
      grass: material(null, 0xffffff),
      green: material(shared.greenLeaves, 0xc8d7b5),
      purple: material(shared.purpleNeedles, 0xe4c9ef),
      flower: material(null, 0xffffff, { emissive: new THREE.Color(0x27182e), emissiveIntensity: 0.12 }),
      rock: material(shared.rock, 0xe4a16b, {flatShading:false}),
      moss: material(shared.moss, 0x688755),
      wood: material(null, 0xd5b78b),
    };
    applyMossSurface(this.materials.moss);
    this.materials.needles.emissive.setHex(0x381e4c);
    this.materials.needles.emissiveIntensity = 0.10;
    // The same pausable breeze bends tips and fronds, leaving every root and collision anchor fixed.
    tipWind(this.materials.needles, this.wind, "spruce", 0.023, 0.72, 3);
    tipWind(this.materials.grass, this.wind, "grass", 0.28, 1.25, 2.3);
    tipWind(this.materials.green, this.wind, "green-fern", 0.07, 0.88, 2);
    tipWind(this.materials.purple, this.wind, "violet-fern", 0.07, 0.88, 2);
    tipWind(this.materials.flower, this.wind, "flower", 0.035, 0.8, 2.2);
    this.geometries = {
      ground: forestGroundGeometry(this.forest), needles: spruceNeedles(true), lowNeedles: spruceNeedles(false),
      distantNeedles: spruceNeedles("distant"),
      grass: grassGeometry(), fern: fernGeometry(), flower: flowerGeometry(), cone: coneGeometry(),
      rock: applyRockWearNormals(createForestRockGeometry()),
    };
    this.geometries.moss = mossGeometry(this.geometries.rock);
    const ground = new THREE.Mesh(this.geometries.ground, [this.materials.ground, this.materials.rock, this.materials.shore]);
    ground.name = "exact-baked-forest-ground"; ground.receiveShadow = true; this.group.add(ground);
    this.addTrees(); this.addUnderstory(); this.addDebris(); this.addShoreFoam();
    this.update(world, 0, true);
  }

  pose(mesh, index, position, scale, rotation = 0, color) {
    this.transform.position.copy(position); this.transform.rotation.set(0, rotation, 0);
    this.transform.scale.copy(scale); this.transform.updateMatrix(); mesh.setMatrixAt(index, this.transform.matrix);
    if (color !== undefined) mesh.setColorAt(index, new THREE.Color(color));
    return this.transform.matrix.clone();
  }

  addTrees() {
    const chunks = new Map();
    this.distantTrees = instanced(this.group, this.geometries.distantNeedles, this.materials.needles,
      this.forest.trees?.length ?? 0, "distant-purple-forest-silhouettes");
    for (const tree of this.forest.trees ?? []) {
      const key = `${Math.floor(tree.x / 500)}:${Math.floor(tree.y / 500)}`;
      if (!chunks.has(key)) chunks.set(key, []);
      chunks.get(key).push(tree);
    }
    for (const [key, trees] of chunks) {
      const group = new THREE.Group(); group.name = `spruce-grove-${key}`; this.group.add(group);
      const high = instanced(group, this.geometries.needles, this.materials.needles, trees.length, "purple-spruce-needle-fans");
      const low = instanced(group, this.geometries.lowNeedles, this.materials.needles, trees.length, "distant-purple-spruce-needles");
      high.castShadow = true;
      const bark = new Surface(), center = new THREE.Vector3(), matrices = [], anchors = [], colors = [];
      let radius = 0;
      for (const [index, tree] of trees.entries()) {
        const rng = random(tree.seed), root = point(tree), height = tree.height / SCALE, reach = tree.radius / SCALE;
        const angle = rng() * TAU, trunkRadius = (tree.trunkRadius ?? tree.radius * 0.12) / SCALE;
        center.add(root);
        const matrix = this.pose(high, index, root, new THREE.Vector3(reach, height, reach), angle,
          [0xffffff, 0xf0e1fa, 0xe2d6e9, 0xfff0fd][Math.floor(rng() * 4)]);
        low.setMatrixAt(index, matrix); low.setColorAt(index, high.instanceColor ? new THREE.Color().fromBufferAttribute(high.instanceColor, index) : new THREE.Color());
        matrices.push(matrix); anchors.push(root.clone());
        colors.push(new THREE.Color().fromBufferAttribute(high.instanceColor, index));
        const crown = root.clone().addScaledVector(UP, height);
        bark.cylinder(root, crown, trunkRadius, trunkRadius * 0.08, 0xc7b9c6, 8);
        for (let buttress = 0; buttress < 6; buttress++) {
          const theta = angle + buttress * TAU / 6;
          const x = tree.x + Math.cos(theta) * tree.radius * 0.48, y = tree.y + Math.sin(theta) * tree.radius * 0.48;
          const floor = getForestHeight(this.forest, x, y);
          if (!Number.isFinite(floor)) continue;
          bark.cylinder(root.clone().addScaledVector(UP, 0.38), new THREE.Vector3(x / SCALE, (floor + 1) / SCALE, y / SCALE),
            trunkRadius * 0.66, 0.025, 0xc6b3bd, 5);
        }
        for (let level = 0; level < 9; level++) for (let branch = 0; branch < 7; branch++) {
          const fraction = LOWER_BRANCH + level / 9 * BRANCH_SPAN;
          const theta = branch / 7 * TAU + level * 1.47 + angle;
          const length = reach * (1 - fraction) ** 0.84 * (0.9 + rng() * 0.2);
          const start = root.clone().addScaledVector(UP, height * fraction);
          const knee = start.clone().add(new THREE.Vector3(Math.cos(theta) * length * 0.55, -height * 0.014, Math.sin(theta) * length * 0.55));
          const tip = start.clone().add(new THREE.Vector3(Math.cos(theta) * length, height * 0.012, Math.sin(theta) * length));
          bark.cylinder(start, knee, trunkRadius * (1 - fraction) * 0.3, 0.022, 0xbba9b5, 5);
          bark.cylinder(knee, tip, 0.022, 0.006, 0xc9b8c7, 4);
        }
      }
      center.divideScalar(trees.length);
      for (const tree of trees) radius = Math.max(radius, center.distanceTo(point(tree)) + tree.height / SCALE);
      const geometry = bark.geometry(); this.geometries[`bark-${key}`] = geometry;
      const trunk = new THREE.Mesh(geometry, this.materials.bark); trunk.name = "furrowed-trunks-branches-and-roots";
      trunk.castShadow = true; trunk.receiveShadow = true; group.add(trunk);
      high.instanceMatrix.needsUpdate = low.instanceMatrix.needsUpdate = true;
      if (high.instanceColor) high.instanceColor.needsUpdate = low.instanceColor.needsUpdate = true;
      for (const foliage of [high, low]) {
        foliage.computeBoundingSphere(); foliage.boundingSphere.radius += 0.5;
        foliage.frustumCulled = true;
      }
      this.chunks.push({ group, high, low, center, radius, matrices, anchors, colors });
    }
  }

  detail(name, entries, geometry, material, dimensions, tint) {
    const mesh = instanced(this.group, geometry, material, entries.length, name);
    const matrices = [], anchors = [];
    for (const [index, item] of entries.entries()) {
      const rng = random(item.seed), rotation = item.heading ?? rng() * TAU;
      const position = point(item), scale = dimensions(item, rng);
      matrices.push(this.pose(mesh, index, position, scale, rotation, tint?.(item, index)));
      anchors.push(position);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.details.push({ mesh, matrices, anchors, colors: mesh.instanceColor?.array.slice() });
    return mesh;
  }

  addUnderstory() {
    this.detail("purple-grass-blade-clusters", this.forest.grass ?? [], this.geometries.grass, this.materials.grass,
      (p) => new THREE.Vector3(p.radius / SCALE, p.height / SCALE, p.radius / SCALE));
    const plants = this.forest.plants ?? [], ferns = plants.filter((p) => p.kind !== "flower");
    const size = (p) => new THREE.Vector3(p.radius / SCALE, p.height / SCALE, p.radius / SCALE);
    this.detail("emerald-coastal-fern-fronds", ferns.filter((p) => (p.seed >>> 0) % 3 !== 0),
      this.geometries.fern, this.materials.green, size);
    this.detail("violet-fern-fronds", ferns.filter((p) => (p.seed >>> 0) % 3 === 0),
      this.geometries.fern, this.materials.purple, size);
    this.detail("alien-lavender-flowers-and-lime-stamens", plants.filter((p) => p.kind === "flower"),
      this.geometries.flower, this.materials.flower, size);
  }

  addDebris() {
    const rocks = this.forest.rocks ?? [];
    this.detail("orange-basalt-forest-boulders", rocks, this.geometries.rock, this.materials.rock,
      (p, rng) => new THREE.Vector3(p.radius / SCALE, p.height / SCALE, p.radius / SCALE * (0.7 + rng() * 0.35)),
      (_p, i) => [0xf2b07a, 0xcc8755, 0xe7a46c][i % 3]);
    this.detail("moss-caps-on-orange-basalt", rocks, this.geometries.moss, this.materials.moss,
      (p, rng) => new THREE.Vector3(p.radius / SCALE, p.height / SCALE, p.radius / SCALE * (0.7 + rng() * 0.35)));
    const litter = [], twigChunks = new Map();
    for (const tree of this.forest.trees ?? []) {
      const rng = random(tree.seed ^ 0x1177e2);
      for (let item = 0; item < 5; item++) {
        const angle = rng() * TAU, reach = tree.radius * (0.3 + rng() * 0.9);
        const x = tree.x + Math.cos(angle) * reach, y = tree.y + Math.sin(angle) * reach;
        const z = getForestHeight(this.forest, x, y);
        if (!Number.isFinite(z) || trailDistance(this.forest, x, y) < 30) continue;
        litter.push({ x, y, z: z + 1, radius: 2.5 + rng() * 2, height: 5 + rng() * 4, seed: rng() * 0xffffffff });
        const a = new THREE.Vector3(x / SCALE, (z + 2) / SCALE, y / SCALE);
        const b = a.clone().add(new THREE.Vector3(Math.cos(angle) * 0.4, 0.035, Math.sin(angle) * 0.4));
        const key = `${Math.floor(x / 1000)}:${Math.floor(y / 1000)}`;
        if (!twigChunks.has(key)) twigChunks.set(key, new Surface());
        const twigs = twigChunks.get(key);
        twigs.cylinder(a, b, 0.025, 0.01, 0xceb7c8, 4);
        twigs.cylinder(b.clone().lerp(a, 0.4), b.clone().add(new THREE.Vector3(0.15, 0.02, -0.12)), 0.013, 0.005, 0xceb7c8, 4);
      }
    }
    this.detail("fallen-spruce-cones", litter, this.geometries.cone, this.materials.wood,
      (p) => new THREE.Vector3(p.radius / SCALE, p.height / SCALE, p.radius / SCALE));
    for (const [key, twigs] of twigChunks)
      this.addDebrisChunk(`twigs-${key}`, twigs, this.materials.bark, "scattered-forked-twigs");
    const logChunks = new Map();
    for (const log of this.forest.logs ?? []) {
      const key = `${Math.floor(log.x / 1000)}:${Math.floor(log.y / 1000)}`;
      if (!logChunks.has(key)) logChunks.set(key, []);
      logChunks.get(key).push(log);
    }
    for (const [key, logs] of logChunks) {
      const bark = new Surface(), cuts = new Surface();
      for (const log of logs) {
        const radius = log.radius / SCALE, length = log.length / SCALE, center = point(log).addScaledVector(UP, radius);
        const axis = new THREE.Vector3(Math.cos(log.heading), 0, Math.sin(log.heading));
        bark.cylinder(center.clone().addScaledVector(axis, -length / 2), center.clone().addScaledVector(axis, length / 2),
          radius, radius * 0.92, 0xcabdc6, 10);
        for (const side of [-1, 1]) {
          const end = center.clone().addScaledVector(axis, side * length * 0.502);
          const across = new THREE.Vector3(-axis.z, 0, axis.x).normalize();
          for (let ring = 0; ring < 9; ring++) for (let wedge = 0; wedge < 20; wedge++) {
            const a = wedge / 20 * TAU, b = (wedge + 1) / 20 * TAU;
            const at = (angle, fraction) => end.clone().addScaledVector(across, Math.cos(angle) * radius * fraction * 0.9)
              .addScaledVector(UP, Math.sin(angle) * radius * fraction * 0.9);
            const inner = ring / 9, outer = (ring + 1) / 9, color = ring % 2 ? 0x9a785b : 0xd2b58a;
            cuts.triangle(at(a, inner), at(a, outer), at(b, outer), color);
            cuts.triangle(at(a, inner), at(b, outer), at(b, inner), color);
          }
        }
      }
      this.addDebrisChunk(`logs-${key}`, bark, this.materials.bark, "fallen-bark-logs");
      this.addDebrisChunk(`cuts-${key}`, cuts, this.materials.wood, "visible-cut-log-end-grain");
    }
  }

  /** Small ground details use their own exact spatial bounds. A larger prepared
   * forest must not draw every remote twig and log's end grain each frame. */
  addDebrisChunk(key, surface, material, name) {
    const geometry = surface.geometry(); this.geometries[key] = geometry;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name; mesh.castShadow = name === "fallen-bark-logs";
    mesh.receiveShadow = true; this.group.add(mesh);
    this.debrisChunks.push({ mesh, bounds: geometry.boundingSphere.clone() });
  }

  addShoreFoam() {
    this.geometries.foam = forestShoreGeometry(this.forest);
    this.materials.foam = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true,
      uniforms: { time: this.shoreTime },
      vertexShader: `uniform float time;attribute float shoreWash;
        varying vec3 vWorld; varying vec2 vBand; varying float vDepth,vWash;
        void main(){ vec4 world=modelMatrix*vec4(position,1.);
          world.y+=sin(world.x*.075+world.z*.031+time*.7)*.047
            +cos(world.z*.113-world.x*.029-time*.5)*.037;
          vWorld=world.xyz;vBand=uv;vWash=shoreWash;
          vec4 view=viewMatrix*world; vDepth=-view.z; gl_Position=projectionMatrix*view; }`,
      fragmentShader: `uniform float time; varying vec3 vWorld; varying vec2 vBand; varying float vDepth,vWash;
        void main(){
          float beads=sin(vWorld.x*19.+vWorld.z*15.)*.5+.5;
          float lace=sin(vWorld.x*5.7+vWorld.z*4.3-time*.48)*.5+.5;
          float wash=.43+.18*sin(time*.62+vWorld.x*.71+vWorld.z*.57);
          float edge=smoothstep(0.,.10,vBand.y)*(1.-smoothstep(wash,wash+.34,vBand.y));
          float broken=smoothstep(.16,.73,beads+sin(vWorld.z*31.-vWorld.x*17.)*.23);
          float curl=1.-smoothstep(.025,.12,abs(vBand.y-wash));
          float alpha=edge*broken*(.12+lace*.19+curl*.11)*mix(.55,1.,vWash)
            *(1.-smoothstep(40.,75.,vDepth));
          gl_FragColor=vec4(mix(vec3(.66,.77,.78),vec3(.88,.94,.91),beads),alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.foam = new THREE.Mesh(this.geometries.foam, this.materials.foam);
    this.foam.name = "baked-waterline-coastal-foam"; this.foam.renderOrder = 3;
    this.group.add(this.foam);
  }

  /** @param {{forest?:PreparedForest}} world @param {number} time @param {boolean} [reducedMotion]
   * @param {THREE.Vector3} [cameraPosition] @param {{mobile?:boolean}} [quality]
   */
  update(world, time, reducedMotion = false, cameraPosition, quality = {}) {
    if (!this.forest || this.disposed) return;
    this.wind.value = reducedMotion || !Number.isFinite(time) ? 0 : time;
    // Scene passes its pausable animation clock, including the held phase in
    // reduced motion, so foam and wet sand stay aligned with the water plane.
    this.shoreTime.value = Number.isFinite(time) ? time : 0;
    const range = capRenderDistance(quality,quality?.mobile?105:165);
    const needsCull = !this.lastCamera || !cameraPosition || cameraPosition.distanceToSquared(this.lastCamera) > 2.25
      || this.mobile !== Boolean(quality?.mobile) || this.cullRange!==range;
    if (!needsCull) return;
    this.mobile = Boolean(quality?.mobile); this.lastCamera = cameraPosition?.clone();
    this.cullRange=range;
    const detailRange = this.mobile ? 18 : 20;
    const fullGroveRange = Math.min(16,range);
    // The cached selection can be reused within 1.5 m of this camera. A small
    // conservative root margin prevents a newly nearby tree disappearing
    // before the next pack, without extending visibility by an entire grove.
    const rootCullRange=range+1.5;
    // Keep one close grove's individual needles on every device. Beyond that,
    // branch silhouettes retain the prepared trees without drawing dense needles and
    // detailed bark across the entire biome each frame.
    const nearestGrove = cameraPosition ? this.chunks.reduce((nearest, chunk) =>
      !nearest || chunk.center.distanceToSquared(cameraPosition) < nearest.center.distanceToSquared(cameraPosition)
        ? chunk : nearest, null) : null;
    let distant = 0;
    for (const chunk of this.chunks) {
      const distance = cameraPosition ? chunk.center.distanceTo(cameraPosition) : 0;
      const visible = distance < range + chunk.radius;
      const near = !cameraPosition || chunk.anchors.some((anchor) => anchor.distanceToSquared(cameraPosition) < fullGroveRange ** 2);
      chunk.group.visible = visible && near;
      chunk.high.visible = !cameraPosition || chunk === nearestGrove && distance < detailRange;
      chunk.low.visible = !chunk.high.visible;
      if (visible && !near) for (let index = 0; index < chunk.matrices.length; index++) {
        if(cameraPosition&&chunk.anchors[index].distanceToSquared(cameraPosition)>rootCullRange**2)continue;
        this.distantTrees.setMatrixAt(distant, chunk.matrices[index]);
        this.distantTrees.setColorAt(distant, chunk.colors[index]); distant++;
      }
    }
    this.distantTrees.count = distant; this.distantTrees.visible = distant > 0;
    this.distantTrees.instanceMatrix.needsUpdate = true;
    if (this.distantTrees.instanceColor) this.distantTrees.instanceColor.needsUpdate = true;
    updateDetailBounds(this.distantTrees); this.distantTrees.frustumCulled = true;
    const detailDistance = capRenderDistance(quality,this.mobile ? 19 : 21);
    for (const chunk of this.debrisChunks) chunk.mesh.visible = !cameraPosition
      || cameraPosition.distanceToSquared(chunk.bounds.center) < (detailDistance + chunk.bounds.radius) ** 2;
    for (const detail of this.details) {
      let visible = 0;
      for (let index = 0; index < detail.matrices.length; index++) {
        if (cameraPosition && detail.anchors[index].distanceToSquared(cameraPosition) > detailDistance ** 2) continue;
        if (this.mobile && detail.mesh.name === "purple-grass-blade-clusters" && index % 2 === 0) continue;
        detail.mesh.setMatrixAt(visible, detail.matrices[index]);
        if (detail.colors) detail.mesh.instanceColor.setXYZ(visible, ...detail.colors.slice(index * 3, index * 3 + 3));
        visible++;
      }
      detail.mesh.count = visible; detail.mesh.instanceMatrix.needsUpdate = true;
      if (detail.mesh.instanceColor) detail.mesh.instanceColor.needsUpdate = true;
      updateDetailBounds(detail.mesh);
      detail.mesh.frustumCulled = true;
    }
  }

  /** Shared library textures remain owned by Materials; only this renderer's buffers/material clones are freed. */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.group.traverse((object) => { if (object.isInstancedMesh) object.dispose(); });
    new Set(Object.values(this.geometries)).forEach((geometry) => geometry.dispose());
    new Set(Object.values(this.materials)).forEach((value) => value.dispose());
    this.group.clear(); this.chunks = []; this.details = []; this.debrisChunks = [];
    this.geometries = {}; this.materials = {}; this.forest = null; this.lastCamera = null; this.distantTrees = null;
  }
}
