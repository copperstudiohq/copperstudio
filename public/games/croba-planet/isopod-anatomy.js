import * as THREE from "./vendor/three.module.js";
import { PlantMesh } from "./plant-mesh.js";

/** Bathynomus-inspired anatomy: X across the body, Y up, front toward -Z.
 * The alien's red shell, gold borders and single eye are supplied by its renderer.
 * Real references: NOAA /ocean-fact/isopod/; NHM /discover/giant-isopods.html;
 * Aquarium of the Pacific /onlinelearningcenter/species/giant_isopod.
 */
const freezePoints = (points) => Object.freeze(points.map((point) => Object.freeze(point)));
const plate = (z, halfLength, width, height) => Object.freeze({ z, halfLength, width, height });
const vector = (point) => new THREE.Vector3(...point);
const neutral = (shade) => {
  const value = Math.round(Math.max(0, Math.min(1, shade)) * 255);
  return value * 0x010101;
};

export const ISOPOD_THORACIC_PLATES = Object.freeze([
  plate(-.77, .205, .405, .270), plate(-.55, .205, .485, .305),
  plate(-.32, .205, .540, .325), plate(-.09, .205, .560, .330),
  plate(.14, .195, .545, .315), plate(.36, .185, .500, .285),
  plate(.56, .175, .445, .250),
]);

/** Five short abdominal pleonites precede the separate broad tail shield. */
export const ISOPOD_PLEON_PLATES = Object.freeze([
  plate(.735, .088, .395, .215), plate(.825, .080, .365, .193),
  plate(.910, .076, .330, .172), plate(.990, .072, .295, .151),
  plate(1.065, .068, .265, .132),
]);

export const ISOPOD_LEG_ROOTS = Object.freeze(ISOPOD_THORACIC_PLATES.flatMap((segment, index) =>
  [-1, 1].map((side) => Object.freeze({ index, side,
    root: Object.freeze([side * segment.width * .71, -.025, segment.z + .035]) }))));

/** The longer antennae and shorter antennules are both retained. */
export const ISOPOD_ANTENNA_ROOTS = Object.freeze([-1, 1].flatMap((side) => [
  Object.freeze({ side, long: true, root: Object.freeze([side * .225, .170, -1.015]) }),
  Object.freeze({ side, long: false, root: Object.freeze([side * .135, .085, -1.095]) }),
]));
export const ISOPOD_MOUTH_PALP_ROOTS = freezePoints([[-.075, .015, -1.115], [.075, .015, -1.115]]);
export const ISOPOD_TAIL_FANS = Object.freeze([-1, 1].flatMap((side) => [
  Object.freeze({ root: Object.freeze([side * .205, .025, 1.045]),
    tip: Object.freeze([side * .440, -.005, 1.345]), width: .118 }),
  Object.freeze({ root: Object.freeze([side * .155, .015, 1.080]),
    tip: Object.freeze([side * .295, -.005, 1.465]), width: .092 }),
]));
export const ISOPOD_APPENDAGE_RADII = Object.freeze({
  leg: Object.freeze([.046, .032, .018]),
  antenna: Object.freeze([.021, .013, .006]),
  mouthPalp: Object.freeze([.039, .034, .027, .019, .011]),
});

const PLATES = [...ISOPOD_THORACIC_PLATES, ...ISOPOD_PLEON_PLATES];

/** Keep anatomical vertex ranges for inspection and future shell hit effects. */
function anatomySection(shell, gold, sections, kind, index, build) {
  const shellStart = shell.positions.length / 3, goldStart = gold.positions.length / 3;
  build();
  sections.push({ kind, index,
    shell: { start: shellStart, count: shell.positions.length / 3 - shellStart },
    gold: { start: goldStart, count: gold.positions.length / 3 - goldStart } });
}

/** A shared envelope lets overlapping shields sit against the same underbody. */
function crossSection(z) {
  const first = PLATES[0], last = PLATES.at(-1);
  if (z <= first.z) return first;
  if (z >= last.z) return last;
  for (let index = 1; index < PLATES.length; index++) {
    const a = PLATES[index - 1], b = PLATES[index];
    if (z > b.z) continue;
    const t = (z - a.z) / (b.z - a.z);
    return { width: THREE.MathUtils.lerp(a.width, b.width, t),
      height: THREE.MathUtils.lerp(a.height, b.height, t) };
  }
  return last;
}

/** A thin, closed shield; the metal border follows its perimeter, leaving a red centre.
 * All vertex colours are neutral shading for the renderer's material pigment.
 * @param {PlantMesh} shell @param {PlantMesh} gold
 * @param {(u:number,v:number)=>THREE.Vector3} pointAt
 * @param {number} rows @param {number} columns @param {number} thickness
 * @param {number} rimRadius @param {number} rimSides
 */
function shield(shell, gold, pointAt, rows, columns, thickness, rimRadius, rimSides) {
  shell.grid(rows, columns, pointAt,
    (u, v) => neutral(.76 + .20 * Math.sin(v * Math.PI) + .04 * u), 0, true);
  shell.grid(rows, columns, (u, v) => pointAt(u, v).add(new THREE.Vector3(0, -thickness, 0)),
    neutral(.72));
  const outline = [];
  for (let x = 0; x <= columns; x++) outline.push(pointAt(0, x / columns));
  for (let z = 1; z <= rows; z++) outline.push(pointAt(z / rows, 1));
  for (let x = columns - 1; x >= 0; x--) outline.push(pointAt(1, x / columns));
  for (let z = rows - 1; z >= 0; z--) outline.push(pointAt(z / rows, 0));
  shell.grid(1, outline.length - 1, (u, v) => {
    const point = outline[Math.round(v * (outline.length - 1))].clone();
    point.y -= thickness * u; return point;
  }, neutral(.68));
  const border = outline.map((point) => point.clone().add(new THREE.Vector3(0, rimRadius * .40, 0)));
  const count = border.length - 1, up = new THREE.Vector3(0, 1, 0);
  const frames = border.map((_, index) => {
    const tangent = border[(index + 1) % count].clone().sub(border[(index + count - 1) % count]).normalize();
    return new THREE.Quaternion().setFromUnitVectors(up, tangent.lengthSq() ? tangent : up);
  });
  // Periodic frames close the metal rim without a twist or an open tube end.
  gold.grid(count, rimSides, (u, v) => {
    const index = Math.round(u * count);
    return new THREE.Vector3(Math.cos(v * Math.PI * 2) * rimRadius, 0,
      Math.sin(v * Math.PI * 2) * rimRadius).applyQuaternion(frames[index]).add(border[index]);
  }, neutral(.97), 0, true);
}

function thoracicShield(shell, gold, segment, rows, columns, rimSides) {
  shield(shell, gold, (u, v) => {
    const cross = v * 2 - 1;
    const x = segment.width * cross * (.95 + .05 * Math.sin(u * Math.PI));
    // The downward lateral flanges form a continuous scalloped skirt over the legs.
    const z = segment.z + segment.halfLength * (u * 2 - 1) + .032 * cross * cross;
    const section = crossSection(z), ratio = Math.min(1, Math.abs(x) / section.width);
    const dome = Math.max(0, 1 - ratio * ratio) ** .42;
    return new THREE.Vector3(x, .018 + section.height * dome + .038 * u, z);
  }, rows, columns, .047, .008, rimSides);
}

function tailFan(shell, gold, rows, columns, rimSides, sections) {
  ISOPOD_TAIL_FANS.forEach((fan, index) => {
    const root = vector(fan.root), tip = vector(fan.tip), axis = tip.clone().sub(root);
    const side = new THREE.Vector3(axis.z, 0, -axis.x).normalize();
    anatomySection(shell, gold, sections, "uropod", index, () =>
      shield(shell, gold, (u, v) => root.clone().lerp(tip, u)
        .addScaledVector(side, (v * 2 - 1) * fan.width * (.10 + .90 * Math.sin(u * Math.PI) ** .6))
        .add(new THREE.Vector3(0, .042 * Math.sin(u * Math.PI), 0)),
      rows, columns, .025, .005, rimSides));
  });
  // The broad pleotelson covers the fan roots; its rear has short, blunt teeth.
  anatomySection(shell, gold, sections, "pleotelson", 0, () => shield(shell, gold, (u, v) => {
    const cross = v * 2 - 1, width = .285 * (.76 + .24 * Math.sin(u * Math.PI));
    return new THREE.Vector3(cross * width,
      .020 + .115 * Math.sin(v * Math.PI) ** .7 * (1 - .45 * u),
      1.065 + u * .365 - .035 * cross * cross
        + .009 * Math.sin(v * Math.PI * 14) ** 2 * u ** 8);
  }, rows, columns, .04, .008, rimSides));
}

/** A capped tapered bone. Local Y is [0,1], cross-section radius is one metre;
 * instance scale supplies [radius,length,radius], with origin at the joint.
 */
function appendageBone(sides, tipRadius) {
  const mesh = new PlantMesh();
  mesh.tube([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, .10, 0),
    new THREE.Vector3(0, .87, 0), new THREE.Vector3(0, 1, 0)],
  [.82, 1, tipRadius + .10, tipRadius], neutral(.96), sides);
  for (const end of [0, 1]) mesh.grid(1, sides, (u, v) => new THREE.Vector3(
    Math.cos(v * Math.PI * 2) * u * (end ? tipRadius : .82), end,
    Math.sin(v * Math.PI * 2) * u * (end ? tipRadius : .82)), neutral(.82), 0, !end);
  return mesh.geometry({ normalizeHeight: false });
}

/** Shared geometry for globally batched Gold Rock Bugs. No per-animal meshes.
 * @param {{mobile?:boolean}} [quality]
 * @returns {{shell:THREE.BufferGeometry,gold:THREE.BufferGeometry,
 * underside:THREE.BufferGeometry,leg:THREE.BufferGeometry,
 * antenna:THREE.BufferGeometry,mouthPalp:THREE.BufferGeometry}}
 */
export function isopodAnatomy(quality = {}) {
  const mobile = Boolean(quality.mobile), rows = mobile ? 3 : 4, columns = mobile ? 8 : 12;
  const rimSides = mobile ? 3 : 4, shell = new PlantMesh(), gold = new PlantMesh(), underside = new PlantMesh();
  const sections = [];
  for (const [index, segment] of ISOPOD_THORACIC_PLATES.entries())
    anatomySection(shell, gold, sections, "thorax", index,
      () => thoracicShield(shell, gold, segment, rows, columns, rimSides));
  for (const [index, segment] of ISOPOD_PLEON_PLATES.entries())
    anatomySection(shell, gold, sections, "pleon", index,
      () => thoracicShield(shell, gold, segment, rows, columns, rimSides));
  // The small, recessed cephalon is visibly distinct from the seven thoracic plates.
  anatomySection(shell, gold, sections, "head", 0, () =>
    shell.ellipsoid(new THREE.Vector3(0, .125, -.955), new THREE.Vector3(.285, .175, .225),
      neutral(.88), { segments: columns, rings: mobile ? 5 : 7 }));
  tailFan(shell, gold, rows, mobile ? 6 : 8, rimSides, sections);
  // A flattened dark belly fills the shields, rather than a row of floating rings.
  underside.ellipsoid(new THREE.Vector3(0, .035, -.105), new THREE.Vector3(.485, .118, 1.055),
    neutral(.89), { segments: mobile ? 12 : 18, rings: mobile ? 7 : 9 });
  for (const leg of ISOPOD_LEG_ROOTS) {
    underside.ellipsoid(vector(leg.root), new THREE.Vector3(.071, .056, .079),
      neutral(.95), { segments: 6, rings: 4 });
  }
  // Five paired swimming pleopods under the abdomen: small overlapping paddles.
  for (const segment of ISOPOD_PLEON_PLATES) for (const side of [-1, 1]) {
    underside.ellipsoid(new THREE.Vector3(side * segment.width * .40, -.045, segment.z + .025),
      new THREE.Vector3(segment.width * .30, .022, .080), neutral(.82), { segments: 6, rings: 4 });
  }
  // Compact mouthparts remain visible between the two animated alien feeding palps.
  underside.ellipsoid(new THREE.Vector3(0, .015, -1.107), new THREE.Vector3(.100, .065, .060),
    neutral(.70), { segments: 8, rings: 5 });
  const result = {
    shell: shell.geometry({ normalizeHeight: false }), gold: gold.geometry({ normalizeHeight: false }),
    underside: underside.geometry({ normalizeHeight: false }),
    leg: appendageBone(mobile ? 5 : 6, .64), antenna: appendageBone(mobile ? 4 : 5, .57),
    mouthPalp: appendageBone(mobile ? 5 : 6, .74),
  };
  for (const [name, geometry] of Object.entries(result)) geometry.name = `gold-rock-bug-${name}`;
  for (const name of ["shell", "gold"]) result[name].userData.anatomySections = sections
    .filter((section) => section[name].count)
    .map((section) => ({ kind: section.kind, index: section.index, ...section[name] }));
  return result;
}

/** @typedef {[number,number,number]} Point */
/** @typedef {{legs:Point[][],antennae:Point[][],mouthPalps:Point[][]}} IsopodAppendagePaths */
/** @param {number} count @param {number} points */
const paths = (count, points) => Array.from({ length: count }, () =>
  Array.from({ length: points }, () => [0, 0, 0]));

/** Folded articulated walking legs, four sensory antennae and two feeding palps.
 * Read the simulation clock, not wall time, so pausing freezes every joint.
 * Reuse the returned target on following frames to avoid animation allocations.
 * @param {number} [time] @param {number} [phase]
 * @param {IsopodAppendagePaths} [target] @returns {IsopodAppendagePaths}
 */
export function getIsopodAppendagePaths(time = 0, phase = 0, target) {
  if (!Number.isFinite(time) || !Number.isFinite(phase)) throw new TypeError("Isopod pose time and phase must be finite.");
  const pose = target ?? { legs: paths(14, 4), antennae: paths(4, 4), mouthPalps: paths(2, 6) };
  const set = (path, index, x, y, z) => {
    path[index][0] = x; path[index][1] = y; path[index][2] = z;
  };
  ISOPOD_LEG_ROOTS.forEach(({ root, side, index }, legIndex) => {
    const path = pose.legs[legIndex], wave = Math.sin(time * 3.8 + phase + index * .82 + side * .55);
    const fore = .105 - index * .025;
    set(path, 0, ...root);
    set(path, 1, root[0] + side * .115, -.105, root[2] + fore + wave * .025);
    set(path, 2, root[0] + side * .053, -.225 + wave * .012, root[2] + .140 + wave * .035);
    set(path, 3, root[0] + side * .135, -.285 + wave * .017, root[2] + .185 + wave * .040);
  });
  ISOPOD_ANTENNA_ROOTS.forEach(({ root, side, long }, index) => {
    const path = pose.antennae[index], sway = Math.sin(time * 1.9 + phase + index * .9);
    set(path, 0, ...root);
    if (long) {
      set(path, 1, side * .355, .180, -1.160);
      set(path, 2, side * (.465 + sway * .010), .155 + sway * .015, -1.325);
      set(path, 3, side * (.545 + sway * .022), .115 + sway * .025, -1.490);
    } else {
      set(path, 1, side * .215, .085, -1.205);
      set(path, 2, side * (.260 + sway * .008), .045 + sway * .012, -1.305);
      set(path, 3, side * (.305 + sway * .013), .010 + sway * .018, -1.390);
    }
  });
  ISOPOD_MOUTH_PALP_ROOTS.forEach((root, index) => {
    const path = pose.mouthPalps[index], side = index ? 1 : -1;
    const curl = Math.sin(time * 2.7 + phase + index * 1.25);
    set(path, 0, ...root);
    set(path, 1, side * .095, -.025, -1.220);
    set(path, 2, side * (.125 + curl * .008), -.060, -1.310);
    set(path, 3, side * (.160 + curl * .016), -.105 + curl * .010, -1.385);
    set(path, 4, side * (.185 + curl * .020), -.145 + curl * .018, -1.415);
    set(path, 5, side * (.205 + curl * .025), -.155 + curl * .020, -1.385 + curl * .012);
  });
  return pose;
}
