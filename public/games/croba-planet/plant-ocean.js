import * as THREE from "./vendor/three.module.js";
import { PlantMesh, plantRandom } from "./plant-mesh.js";

export const OCEAN_PLANT_KINDS = Object.freeze([
  "azure-sail-kelp", "tideglass-rosette", "abyss-lantern-reed",
]);

const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const radial = (angle, radius, height = 0) => new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
const path = (segments, pointAt) => Array.from({ length: segments + 1 }, (_value, index) => pointAt(index / segments));

function holdfast(mesh, detail, seed, radius = 0.14) {
  const rng = plantRandom(seed);
  mesh.ellipsoid(new THREE.Vector3(0, .03, 0), new THREE.Vector3(radius, .03, radius), 0x173d56,
    { segments: detail ? 12 : 8, rings: detail ? 5 : 3 });
  for (let root = 0; root < 6; root++) {
    const angle = root / 6 * TAU + rng() * .2, reach = radius * (1.45 + rng() * .4);
    mesh.tube([radial(angle, radius * .35, .04), radial(angle + .07, reach * .65, .025), radial(angle, reach, .012)],
      [.012, .009, .005], 0x254b62, detail ? 5 : 3);
  }
}

/** Broad entire blades have corrugated, cupped membranes and branching raised ribs. */
function sailKelp(detail, variant) {
  const mesh = new PlantMesh(), rng = plantRandom(0xa2e5a11 ^ Math.imul(variant + 1, 0x9e3779b1));
  holdfast(mesh, detail, variant + 441);
  const tint = new THREE.Color(), deep = new THREE.Color(0x15507f), blue = new THREE.Color(0x217fb1);
  const pale = new THREE.Color(0x74bdcf);
  let leafCount = 0;
  for (let stipe = 0; stipe < 3; stipe++) {
    const angle = stipe / 3 * TAU + variant * .39 + rng() * .16;
    const outward = radial(angle, 1), side = radial(angle + Math.PI / 2, 1);
    const lean = .15 + rng() * .13, height = .86 + rng() * .09, phase = rng() * TAU;
    const stemAt = (u) => outward.clone().multiplyScalar(.035 + lean * u * u)
      .addScaledVector(side, Math.sin(u * Math.PI * 1.4 + phase) * .045 * u)
      .addScaledVector(UP, .035 + height * u);
    const stem = path(detail ? 9 : 5, stemAt);
    mesh.tube(stem, stem.map((_p, index) => .018 * (1 - index / (stem.length - 1) * .72)), 0x174c72, detail ? 7 : 4);
    for (let level = 0; level < 2; level++) {
      const fraction = level ? .62 : .29;
      const heading = angle + (level ? -.60 : .66), direction = radial(heading, 1), across = radial(heading + Math.PI / 2, 1);
      const base = stemAt(fraction).addScaledVector(direction, .075);
      const tip = base.clone().addScaledVector(direction, .47 + rng() * .13).addScaledVector(UP, level ? .30 : .39);
      const width = .23 + rng() * .035, curl = .045 + rng() * .035;
      const axis = tip.clone().sub(base), normal = new THREE.Vector3().crossVectors(across, axis).normalize();
      const centerAt = (u) => base.clone().lerp(tip, u)
        .addScaledVector(direction, Math.sin(u * Math.PI) * .11)
        .addScaledVector(across, Math.sin(u * Math.PI * 1.5 + phase) * curl * Math.sin(u * Math.PI))
        .addScaledVector(UP, Math.sin(u * Math.PI) * .075);
      const leafAt = (u, v) => {
        const cross = v * 2 - 1, envelope = Math.sin(u * Math.PI) ** .65;
        const scallop = 1 + Math.sin(u * Math.PI * 6 + phase) * .055;
        return centerAt(u).addScaledVector(across, cross * width * envelope * scallop)
          .addScaledVector(normal, width * envelope * (.22 * cross * cross + .22 * cross * Math.sin(u * TAU))
            + Math.sin(v * Math.PI * 6 + u * 4) * .008 * envelope);
      };
      mesh.grid(detail ? 16 : 8, detail ? 7 : 4, leafAt, (u, v) => {
        tint.copy(deep).lerp(blue, .28 + u * .64);
        return tint.lerp(pale, Math.abs(v - .5) < .09 ? .46 : u * u * .20).getHex();
      }, (u, v) => u > .96 && Math.abs(v - .5) < .3 ? .035 : 0);
      mesh.tube([stemAt(fraction), base.clone().addScaledVector(UP, -.015), base], [.011, .009, .007],
        0x225f85, detail ? 5 : 3);
      const midrib = path(detail ? 9 : 5, (u) => centerAt(u).addScaledVector(normal, .005));
      mesh.tube(midrib, midrib.map((_p, index) => .009 * (1 - index / (midrib.length - 1) * .82)),
        0x54a9c3, detail ? 5 : 3);
      if (detail) for (const u of [.26, .46, .66]) for (const edge of [.07, .93]) {
        const root = centerAt(u).addScaledVector(normal, .008);
        const end = leafAt(Math.min(.92, u + .15), edge).addScaledVector(normal, .006);
        mesh.tube([root, root.clone().lerp(end, .55).addScaledVector(UP, .012), end], [.0035, .0028, .0012], 0x469ab8, 3);
      }
      leafCount++;
    }
  }
  return { mesh, features: { stipes: 3, broadSails: leafCount, lanterns: 0, seedPods: 0 } };
}

/** Closed, thick leaf cross-sections curl back over an upright, overlapping rosette. */
function tideglass(detail, variant) {
  const mesh = new PlantMesh(), rng = plantRandom(0x71de61a5 ^ Math.imul(variant + 1, 0x85ebca6b));
  holdfast(mesh, detail, variant + 832, .16);
  const tint = new THREE.Color(), dark = new THREE.Color(0x104e68), teal = new THREE.Color(0x319fae);
  const light = new THREE.Color(0x83c8cd);
  for (let leaf = 0; leaf < 9; leaf++) {
    const inner = leaf >= 5, angle = leaf * 2.399963 + variant * .43 + rng() * .10;
    const direction = radial(angle, 1), side = radial(angle + Math.PI / 2, 1);
    const root = radial(angle, inner ? .08 : .11, inner ? .065 : .035);
    const length = inner ? .45 + rng() * .06 : .79 + rng() * .08;
    const height = inner ? .98 + rng() * .05 : .62 + rng() * .10;
    const width = inner ? .15 + rng() * .02 : .225 + rng() * .025;
    const centerAt = (u) => root.clone().addScaledVector(direction,
      length * (Math.sin(u * Math.PI * .85) * .90 + u * .10))
      .addScaledVector(UP, Math.sin(u * Math.PI * .72) * height);
    const frameAt = (u) => {
      const tangent = centerAt(Math.min(1, u + .01)).sub(centerAt(Math.max(0, u - .01))).normalize();
      return new THREE.Vector3().crossVectors(side, tangent).normalize();
    };
    mesh.grid(detail ? 12 : 6, detail ? 10 : 6, (u, v) => {
      const envelope = Math.sin(u * Math.PI) ** .58, theta = v * TAU;
      return centerAt(u).addScaledVector(side, Math.cos(theta) * width * envelope)
        .addScaledVector(frameAt(u), Math.sin(theta) * .026 * envelope
          + Math.cos(theta) ** 2 * width * envelope * .20);
    }, (u, v) => {
      tint.copy(dark).lerp(teal, .30 + Math.sin(u * Math.PI) * .62);
      const ridge = Math.abs(Math.cos(v * TAU));
      return tint.lerp(light, ridge > .92 ? .38 : u * .12).getHex();
    }, 0, true);
    const rib = path(detail ? 8 : 4, (u) => centerAt(u).addScaledVector(frameAt(u), .028 * Math.sin(u * Math.PI)));
    mesh.tube(rib, rib.map((_p, index) => .006 * (1 - index / (rib.length - 1) * .7)), 0x65b5bd, 3);
  }
  for (let pod = 0; pod < 3; pod++) {
    const angle = pod / 3 * TAU + variant * .21, top = radial(angle, .14, .76 + pod * .045);
    mesh.tube([new THREE.Vector3(0, .14, 0), radial(angle, .105, .52), top], [.012, .009, .005],
      0x285f75, detail ? 5 : 3);
    mesh.ellipsoid(top, new THREE.Vector3(.038, .065, .038), 0xc79649,
      { segments: detail ? 10 : 6, rings: detail ? 6 : 4, glow: .035 });
    if (detail) for (let seam = 0; seam < 3; seam++) {
      const theta = seam / 3 * TAU;
      mesh.tube(path(4, (u) => top.clone().add(new THREE.Vector3(Math.sin(u * Math.PI) * Math.cos(theta) * .039,
        Math.cos(u * Math.PI) * .066, Math.sin(u * Math.PI) * Math.sin(theta) * .039))), .0019, 0x82663c, 3);
    }
  }
  return { mesh, features: { fleshyLeaves: 9, seedPods: 3, lanterns: 0 } };
}

function lanternNode(mesh, center, detail, violet) {
  const height = .108, radius = .034;
  const lanternAt = (u, v, padding = 0) => center.clone().add(new THREE.Vector3(
    Math.cos(v * TAU) * (radius + padding) * Math.sin(u * Math.PI) ** .72 * (.65 + u * .35),
    (.5 - u) * height,
    Math.sin(v * TAU) * (radius + padding) * Math.sin(u * Math.PI) ** .72 * (.65 + u * .35)));
  mesh.grid(detail ? 6 : 4, detail ? 8 : 6, lanternAt, (u, v) => {
    if (u < .12 || u > .88 || Math.cos(v * TAU * 3) > .62) return 0x173b60;
    return violet ? 0x967acb : 0x5dbfdb;
  }, (u, v) => Math.sin(u * Math.PI) ** 8 * (.45 + (.5 - Math.cos(v * TAU * 3) * .5) * .49));
  for (let guard = 0; guard < 3; guard++) {
    mesh.tube(path(detail ? 4 : 2, (u) => lanternAt(u, guard / 3, .006)), .0028, 0x244b70, 3);
  }
}

/** A sparse reed bundle carries small closed lanterns; the dark stems themselves do not glow. */
function lanternReed(detail, variant) {
  const mesh = new PlantMesh(), rng = plantRandom(0xab7551a7 ^ Math.imul(variant + 1, 0xc2b2ae35));
  holdfast(mesh, detail, variant + 1294);
  let nodes = 0;
  for (let reed = 0; reed < 6; reed++) {
    const angle = reed / 6 * TAU + variant * .31 + rng() * .12, direction = radial(angle, 1), side = radial(angle + Math.PI / 2, 1);
    const height = reed === 0 ? .97 : .66 + rng() * .26, lean = .15 + rng() * .16;
    const reedAt = (u) => direction.clone().multiplyScalar(.075 + lean * u * u)
      .addScaledVector(side, Math.sin(u * Math.PI * 1.6) * .035)
      .addScaledVector(UP, .035 + height * u);
    const stem = path(11, reedAt);
    mesh.tube(stem, stem.map((_p, index) => (.010 - index / (stem.length - 1) * .006)
      * (index % 2 ? .92 : 1.07)), 0x122c4c, detail ? 6 : 3);
    for (let leaf = 0; leaf < 2; leaf++) {
      const root = reedAt(.25 + leaf * .27);
      const target = root.clone().addScaledVector(radial(angle + (leaf ? -.7 : .65), 1), .31 + rng() * .09)
        .addScaledVector(UP, .16 + rng() * .07);
      mesh.leaf(root, target, .045 + rng() * .01, (u, v) => Math.abs(v - .5) < .1 ? 0x35658a : u > .75 ? 0x214d73 : 0x153b61,
        { segments: detail ? 8 : 5, columns: detail ? 4 : 2, curve: .025, cup: .20, twist: .28 });
    }
    for (const fraction of reed % 2 === 0 ? [.53, .82] : [.71]) {
      const branch = reedAt(fraction), center = branch.clone().addScaledVector(direction, .13).addScaledVector(UP, -.025);
      const top = center.clone().addScaledVector(UP, .054);
      mesh.tube([branch, branch.clone().lerp(top, .5).addScaledVector(UP, .035), top], [.0065, .0055, .0038],
        0x214665, detail ? 4 : 3);
      lanternNode(mesh, center, detail, (reed + variant + nodes) % 3 === 0); nodes++;
    }
  }
  return { mesh, features: { reeds: 6, narrowBlades: 12, lanterns: nodes, seedPods: 0 } };
}

/** Pure indexed prototypes. Placement, physical scale, materials and animation belong to the shared plant renderer.
 * @param {string} kind @param {{detail?:boolean,variant?:number}} [options]
 * @returns {THREE.BufferGeometry}
 */
export function createOceanPlantGeometry(kind, { detail = true, variant = 0 } = {}) {
  if (!OCEAN_PLANT_KINDS.includes(kind)) throw new RangeError(`Unknown ocean plant: ${String(kind)}.`);
  if (typeof detail !== "boolean") throw new TypeError("Ocean plant detail must be a boolean.");
  if (!Number.isInteger(variant) || variant < 0) throw new RangeError("Ocean plant variant must be a non-negative integer.");
  const create = { "azure-sail-kelp": sailKelp, "tideglass-rosette": tideglass, "abyss-lantern-reed": lanternReed }[kind];
  const { mesh, features } = create(detail, variant), geometry = mesh.geometry({ normalizeHeight: true });
  geometry.name = `${kind}:${variant}:${detail ? "high" : "low"}`;
  geometry.userData.species = kind; geometry.userData.detail = detail; geometry.userData.variant = variant;
  geometry.userData.features = features;
  return geometry;
}
