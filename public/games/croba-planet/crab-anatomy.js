import * as THREE from './vendor/three.module.js';
import { PlantMesh } from './plant-mesh.js';
import { CRAB_STOCKY_SHAPE } from './crab-size.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const RED = 0xb53528, DARK_RED = 0x74291f, JOINT = 0x985346, HORN = 0x483029;
const point = (values) => Object.freeze(values);
const legZ = [-.095, -.035, .035, .095];
const kneeZ = [-.155, -.070, .075, .155];
const ankleZ = [-.205, -.090, .105, .205];
const footZ = [-.225, -.105, .125, .235];
const LEG_RADII = point([.016, .012, .006].map((radius) => radius * CRAB_STOCKY_SHAPE.legThickness));
const shapePoint = ([x, y, z]) => point([x * CRAB_STOCKY_SHAPE.width,
  y * CRAB_STOCKY_SHAPE.height, z * CRAB_STOCKY_SHAPE.length]);

/** Canonical rest pose in metres: X right, Y up, front -Z. Eight walking legs
 * plus two chelipeds preserve the requested fictional decapod body plan.
 */
const RAW_CRAB_LEG_REST = [-1, 1].flatMap((side) => legZ.map((z, index) => ({
  side, index, hip: point([side * .115, .55, z]),
  knee: point([side * .245, .385, kneeZ[index]]),
  ankle: point([side * .255, .105, ankleZ[index]]),
  foot: point([side * .265, .012, footZ[index]]), radii: LEG_RADII,
})));
export const CRAB_LEG_REST = Object.freeze(RAW_CRAB_LEG_REST.map((leg) => Object.freeze({
  side: leg.side, index: leg.index, hip: shapePoint(leg.hip), knee: shapePoint(leg.knee),
  ankle: shapePoint(leg.ankle), foot: shapePoint(leg.foot), radii: LEG_RADII,
})));
export const CRAB_SHELL_MOUNT = shapePoint([0, .61, .055]);
export const CRAB_CLAW_HINGE = point([0, .027, -.040]);
export const CRAB_CLAW_AXIS = point([1, 0, 0]);
/** Three hinged fingers surround the existing fixed bottom finger. All share
 * the same local-X hinge, rotated into the top/left/right radial frames. */
export const CRAB_PINCER_HINGES = Object.freeze([
  Object.freeze({ name: 'top', position: CRAB_CLAW_HINGE, roll: 0 }),
  Object.freeze({ name: 'left', position: point([-.027, .002, -.040]), roll: Math.PI / 2 }),
  Object.freeze({ name: 'right', position: point([.027, .002, -.040]), roll: -Math.PI / 2 }),
]);
export const CRAB_CLAW_ROOTS = Object.freeze([-1, 1].map((side) => Object.freeze({
  side, yaw: side * .12, scale: (side < 0 ? .92 : 1.04) * 1.22,
  arm: Object.freeze([shapePoint([side * .105, .55, -.115]),
    shapePoint([side * .172, .47, -.155]), shapePoint([side * .170, .49, -.215])]),
  radii: point([.017, .015].map((radius) => radius * CRAB_STOCKY_SHAPE.legThickness)),
  palm: shapePoint([side * .170, .49, -.215]),
})));
// A second pair emerges farther forward below the original pair. Both tiers
// are baked into the existing stalk/eye surfaces, without additional draws.
const EYE_STALKS = [
  { center: [.101, .731, -.171], path: [[.073, .613, -.133], [.085, .646, -.146],
    [.096, .691, -.165], [.101, .725, -.171]] },
  { center: [.101, .663, -.218], path: [[.073, .584, -.149], [.085, .607, -.173],
    [.096, .633, -.200], [.101, .657, -.218]] },
];
export const CRAB_EYES = Object.freeze(EYE_STALKS.flatMap(({ center: [x, y, z] }) =>
  [-1, 1].map(side => shapePoint([side * x, y, z]))));

const tint = new THREE.Color();
const shade = (color, amount) => tint.set(color).multiplyScalar(amount).getHex();

/** Broad front, tapered rear, branchial lobes and a depressed cervical groove.
 * This continuous shield supplies the actual outline rather than a scaled ball.
 */
function shieldPoint(u, t) {
  const cross = t * 2 - 1;
  const width = .116 + .039 * Math.sin(u * Math.PI) - .025 * u;
  const dome = Math.max(0, 1 - cross * cross) ** .62;
  const groove = Math.exp(-(((u - .34 - .10 * cross * cross) / .028) ** 2));
  const cardiac = .008 * Math.exp(-(((u - .67) / .17) ** 2) - (cross / .36) ** 2);
  const notch = .007 * Math.exp(-(((u - .02) / .07) ** 2) - ((Math.abs(cross) - .62) / .16) ** 2);
  return v(cross * width,
    .548 + dome * (.105 + .020 * Math.sin(u * Math.PI) - .008 * groove) + cardiac - notch,
    -.160 + .290 * u + .007 * cross * cross * Math.sin(u * Math.PI));
}

function carapace(mesh, rows, columns, sides) {
  mesh.grid(rows, columns, shieldPoint, (u, t) => {
    const edge = Math.abs(t * 2 - 1), groove = Math.exp(-(((u - .34 - .10 * edge * edge) / .028) ** 2));
    return shade(RED, .83 + .17 * (1 - edge) - groove * .14);
  }, 0, true);
  const perimeter = [];
  for (let column = 0; column < columns; column++) perimeter.push(shieldPoint(0, column / columns));
  for (let row = 0; row < rows; row++) perimeter.push(shieldPoint(row / rows, 1));
  for (let column = columns; column > 0; column--) perimeter.push(shieldPoint(1, column / columns));
  for (let row = rows; row > 0; row--) perimeter.push(shieldPoint(row / rows, 0));
  mesh.grid(2, perimeter.length, (u, t) => {
    const p = perimeter[Math.round(t * perimeter.length) % perimeter.length];
    return v(p.x * (1 - u * .055), p.y + (.532 - p.y) * u, p.z);
  }, (u) => shade(RED, .82 - u * .12));
  // A boundary-matched fan closes the bottom without a second dense dome.
  const capStart = mesh.positions.length / 3, bottomColor = new THREE.Color(DARK_RED);
  for (const p of [v(0, .532, -.015), ...perimeter.map((p) => v(p.x * .945, .532, p.z))]) {
    mesh.positions.push(p.x, p.y, p.z); mesh.colors.push(bottomColor.r, bottomColor.g, bottomColor.b);
    mesh.uvs.push(p.x / .3 + .5, p.z / .3 + .5); mesh.glow.push(0);
  }
  for (let index = 0; index < perimeter.length; index++)
    mesh.indices.push(capStart, capStart + 1 + index, capStart + 1 + (index + 1) % perimeter.length);
  // Sparse granules and isolated marginal spines, rather than repeated armor balls.
  for (let index = 0; index < 21; index++) {
    const u = .13 + (index * .137 % .71), t = .13 + (index * .381966 % .74), p = shieldPoint(u, t);
    mesh.ellipsoid(p, v(.0028, .0018, .0031), shade(RED, .92 + index % 3 * .055), { segments: 5, rings: 3 });
  }
  for (const side of [-1, 1]) for (let index = 0; index < 3; index++) {
    const u = .26 + index * .19, root = shieldPoint(u, side < 0 ? 0 : 1);
    mesh.tube([root, v(root.x + side * .009, root.y + .007, root.z - .003),
      v(root.x + side * .015, root.y + .010, root.z - .008)], [.0045, .0027, 0], RED, sides);
  }
  const sockets = [];
  // Geometry is still authored in its original frame here. Exported hips are
  // already shaped, so using them would apply the body transform twice.
  for (const leg of RAW_CRAB_LEG_REST) {
    const start = mesh.positions.length / 3;
    mesh.ellipsoid(v(...leg.hip), v(.018, .016, .022), DARK_RED, { segments: sides, rings: 4 });
    sockets.push({ side: leg.side, index: leg.index, start, count: mesh.positions.length / 3 - start });
  }
  return sockets;
}

function underside(mesh, sides) {
  mesh.ellipsoid(v(0, .530, -.015), v(.116, .036, .119), DARK_RED, { segments: sides * 2, rings: 7 });
  for (let index = 0; index < 4; index++) {
    const z = -.089 + index * .048, width = .095 - Math.abs(index - 1.4) * .008;
    mesh.ellipsoid(v(0, .514, z), v(width, .008, .021), index % 2 ? 0x9b5140 : 0xab5c45,
      { segments: sides, rings: 4 });
  }
  // Folded abdominal apron beneath the rear shield leaves the carried-shell seat free.
  mesh.ellipsoid(v(0, .517, .078), v(.046, .011, .039), 0x8b4538, { segments: sides, rings: 5 });
}

function facialParts(stalks, eyes, mouth, sides, mobile) {
  const eyeRanges = [];
  for (const { center: [x, y, z], path } of EYE_STALKS) for (const side of [-1, 1]) {
    const stalk = path.map(([x, y, z]) => v(side * x, y, z));
    stalks.tube(stalk, [.012, .010, .007, .006], RED, sides);
    stalks.ellipsoid(stalk[0], v(.017, .010, .018), JOINT, { segments: sides, rings: mobile ? 4 : 5 });
    const center = v(side * x, y, z), start = eyes.positions.length / 3;
    eyes.ellipsoid(center, v(.0135, .017, .0155), 0x0d1416,
      { segments: mobile ? 8 : 12, rings: mobile ? 4 : 7 });
    // Restrained wet reflection: a tiny gray patch, no emissive eye lamp.
    eyes.ellipsoid(v(center.x + side * .003, center.y + .007, center.z - .011),
      v(.003, .004, .002), 0x526264, { segments: mobile ? 4 : 6, rings: mobile ? 2 : 4 });
    eyeRanges.push({ start, count: eyes.positions.length / 3 - start });
  }
  for (const side of [-1, 1]) {
    const outer = [v(side * .023, .560, -.158), v(side * .035, .548, -.173),
      v(side * .020, .534, -.183)];
    mouth.tube(outer, [.012, .011, .006], 0x823326, sides);
    mouth.ellipsoid(v(side * .013, .545, -.174), v(.010, .014, .006), 0x9e4935, { segments: sides, rings: 5 });
    for (let pair = 0; pair < 2; pair++) mouth.tube([
      v(side * (.026 + pair * .018), .575, -.155),
      v(side * (.037 + pair * .025), .594 + pair * .003, -.180),
      v(side * (.043 + pair * .034), .599 + pair * .004, -.198 - pair * .009),
    ], [.0035, .0021, .0006], 0xb45a38, mobile ? 4 : 5);
  }
  mouth.ellipsoid(v(0, .542, -.172), v(.008, .012, .005), 0x291c18, { segments: sides, rings: 5 });
  return eyeRanges;
}

function interpolate(values, u) {
  const at = Math.min(values.length - 1, u * (values.length - 1)), index = Math.floor(at);
  return values[index] + (values[Math.min(index + 1, values.length - 1)] - values[index]) * (at - index);
}

/** Hard oval chela fingers with ridged cuticle and a genuinely pointed tip. */
function finger(mesh, points, widths, depths, color, rows, sides) {
  const curve = new THREE.CatmullRomCurve3(points), across = v(1, 0, 0), frame = v(0, 0, 0);
  const pigment = new THREE.Color(color), horn = new THREE.Color(HORN), tint = new THREE.Color();
  mesh.grid(rows, sides, (u, t) => {
    const center = curve.getPoint(u), tangent = curve.getTangent(u), angle = t * TAU;
    frame.crossVectors(across, tangent).normalize();
    const ridge = 1 + .10 * Math.cos(angle * 3) * Math.sin(u * Math.PI);
    return center.addScaledVector(across, Math.cos(angle) * interpolate(widths, u) * ridge)
      .addScaledVector(frame, Math.sin(angle) * interpolate(depths, u));
  }, (u) => tint.copy(pigment).lerp(horn, Math.max(0, (u - .76) / .24) ** 2)
    .multiplyScalar(.89 + .11 * Math.sin(u * Math.PI)).getHex(), 0, true);
}

function claws(palm, fixed, moving, sides, mobile) {
  palm.grid(mobile ? 8 : 12, sides * 2, (u, t) => {
    const angle = t * TAU, taper = u === 0 || u === 1 ? 0 : Math.sin(u * Math.PI) ** .36;
    const groove = 1 - .07 * Math.exp(-(((u - .28) / .045) ** 2));
    return v(Math.sin(angle) * (.019 + .020 * Math.sin(u * Math.PI)) * taper * groove,
      Math.cos(angle) * (.030 + .017 * Math.sin(u * Math.PI)) * taper, .035 - u * .092);
  }, (u, t) => shade(RED, .87 + .13 * Math.max(0, Math.cos(t * TAU))), 0, false);
  for (const side of [-1, 1]) palm.ellipsoid(v(side * .016, .027, -.040), v(.007, .008, .008),
    JOINT, { segments: sides, rings: 5 });
  finger(fixed, [v(0, -.021, -.024), v(0, -.032, -.067), v(0, -.019, -.105), v(0, .002, -.124)],
    [.014, .013, .0065, 0], [.012, .010, .005, 0], RED, mobile ? 9 : 14, sides);
  moving.ellipsoid(v(0, 0, 0), v(.017, .010, .011), JOINT, { segments: sides, rings: 5 });
  finger(moving, [v(0, 0, 0), v(0, .004, -.024), v(0, -.003, -.056), v(0, -.025, -.078)],
    [.015, .014, .008, 0], [.010, .010, .006, 0], RED, mobile ? 3 : 6, sides);
  // Unequal opposing tubercles are part of the inner cutting surfaces.
  for (let index = 0; index < 3; index++) {
    const z = -.058 - index * .017, y = -.020 + index * .003;
    fixed.tube([v(0, y, z), v(0, y + [.005, .0035, .0045][index], z - .002)], [.0035, 0], HORN, 5);
    moving.tube([v(0, -.003 - index * .003, -.020 - index * .016),
      v(0, -.007 - index * .004, -.022 - index * .016)], [.003, 0], HORN, 5);
  }
}

function legBone(sides, pointed = false) {
  const mesh = new PlantMesh();
  if (pointed) mesh.grid(6, sides, (u, t) => {
    const angle = t * TAU, radius = (1 - u) ** .7 * (.70 + .25 * Math.sin(u * Math.PI));
    return v(Math.cos(angle) * radius, u, Math.sin(angle) * radius + .65 * u * u);
  }, (u) => u > .76 ? HORN : RED, 0, true);
  else mesh.tube([v(0, 0, 0), v(0, .12, 0), v(0, .30, 0), v(0, .82, 0), v(0, 1, 0)],
    [.64, .92, 1, .63, .48], RED, sides);
  const geometry = mesh.geometry({ normalizeHeight: false });
  geometry.userData.axis = 'Y'; geometry.userData.jointOrigin = [0, 0, 0]; geometry.userData.jointEnd = [0, 1, 0];
  return geometry;
}

/** Shared baked parts, in real metres. Use white vertex-color materials for
 * the authored red pigment. Every animated bone spans local Y=[0,1]; fingers
 * hinge about local X at CRAB_CLAW_HINGE. No per-animal meshes or lights.
 * @param {{mobile?:boolean}} [quality] @returns {Record<string,THREE.BufferGeometry>}
 */
export function createCrabAnatomy({ mobile = false } = {}) {
  const sides = mobile ? 6 : 8;
  const meshes = Object.fromEntries(['carapace', 'underside', 'eyestalks', 'eyes', 'mouthparts',
    'clawPalm', 'clawFixedFinger', 'clawMovingFinger', 'joint'].map((name) => [name, new PlantMesh()]));
  const hipSockets = carapace(meshes.carapace, mobile ? 12 : 20, mobile ? 18 : 28, sides);
  underside(meshes.underside, sides);
  const eyeRanges = facialParts(meshes.eyestalks, meshes.eyes, meshes.mouthparts, sides, mobile);
  claws(meshes.clawPalm, meshes.clawFixedFinger, meshes.clawMovingFinger, sides, mobile);
  meshes.joint.ellipsoid(v(0, 0, 0), v(1, .75, 1), JOINT, { segments: sides, rings: mobile ? 4 : 6 });
  const parts = Object.fromEntries(Object.entries(meshes).map(([name, mesh]) =>
    [name, mesh.geometry({ normalizeHeight: false })]));
  parts.legSegment = legBone(sides); parts.legTip = legBone(sides, true);
  const fixedParts = new Set(['carapace', 'underside', 'eyestalks', 'eyes', 'mouthparts']);
  for (const [name, geometry] of Object.entries(parts)) {
    if (fixedParts.has(name)) geometry.scale(CRAB_STOCKY_SHAPE.width, CRAB_STOCKY_SHAPE.height, CRAB_STOCKY_SHAPE.length);
    geometry.name = `red-root-crab-${name}`;
    geometry.userData.crabPart = name; geometry.userData.bakedPigment = true;
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  }
  parts.carapace.userData.hipSocketRanges = hipSockets;
  parts.eyes.userData.eyeRanges = eyeRanges;
  return parts;
}
