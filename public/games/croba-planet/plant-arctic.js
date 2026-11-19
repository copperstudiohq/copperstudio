import * as THREE from "./vendor/three.module.js";
import { PlantMesh, plantRandom } from "./plant-mesh.js";

const TAU = Math.PI * 2;
export const ARCTIC_PLANT_KINDS = Object.freeze(["frost-feather", "brine-bell", "glassroot-bloom"]);
const point = (x, y, z) => new THREE.Vector3(x, y, z);

/** Shared root crown and fine sediment-gripping holdfasts, rather than a woody trunk. */
function holdfast(mesh, variant, detail, color) {
  const rng = plantRandom(0xa7c710 + variant * 971);
  mesh.ellipsoid(point(0, 0.04, 0), point(0.078, 0.04, 0.078), color,
    { segments: detail ? 10 : 6, rings: detail ? 4 : 3 });
  for (let root = 0; root < 6; root++) {
    const angle = root * TAU / 6 + rng() * 0.25, reach = 0.13 + rng() * 0.08;
    const path = [point(0, 0.028, 0), point(Math.cos(angle) * reach * 0.5, 0.025, Math.sin(angle) * reach * 0.5),
      point(Math.cos(angle) * reach, 0.014, Math.sin(angle) * reach)];
    mesh.tube(path, [0.015, 0.009, 0.003], color, detail ? 5 : 3);
  }
}

function frostFeather(mesh, variant, detail, metadata) {
  holdfast(mesh, variant, detail, 0x416c87);
  const rng = plantRandom(0xf4057 + variant * 2017), fronds = 7, pairs = 8;
  for (let frond = 0; frond < fronds; frond++) {
    const angle = frond * 2.399963 + rng() * 0.28 + variant * 0.17;
    const height = 0.79 + rng() * 0.2, reach = 0.3 + rng() * 0.22;
    const phase = rng() * TAU;
    const forward = point(Math.cos(angle), 0, Math.sin(angle));
    const side = point(-forward.z, 0, forward.x);
    const spine = (t) => forward.clone().multiplyScalar(reach * t ** 1.55)
      .addScaledVector(side, Math.sin(t * Math.PI) * Math.sin(phase) * 0.035)
      .add(point(0, 0.04 + height * t - t ** 4 * 0.035, 0));
    const segments = detail ? 8 : 4;
    const path = Array.from({ length: segments + 1 }, (_, index) => spine(index / segments));
    mesh.tube(path, path.map((_p, index) => 0.016 * (1 - index / segments * 0.78)), 0x6197b1, detail ? 6 : 4);
    for (let pair = 0; pair < pairs; pair++) {
      const t = 0.16 + pair / (pairs - 1) * 0.68;
      const length = (0.08 + Math.sin(t * Math.PI) * 0.15) * (0.92 + rng() * 0.16);
      for (const direction of [-1, 1]) {
        const root = spine(t);
        const tip = root.clone().addScaledVector(side, direction * length)
          .addScaledVector(forward, -length * 0.26).add(point(0, length * 0.25 + 0.014, 0));
        const glow = pair >= 6 && frond % 2 === 0 ? (u) => u > 0.96 ? 0.38 : 0 : 0;
        mesh.leaf(root, tip, length * 0.15,
          (u, v) => u > 0.85 ? 0xd4ebef : Math.abs(v - 0.5) < 0.2 ? 0x78b1c9 : 0x92c3d5,
          { segments: detail ? 5 : 2, columns: detail ? 2 : 1,
            curve: 0.006, cup: 0.18, twist: direction * 0.12, glow });
      }
    }
    mesh.ellipsoid(spine(1), point(0.009, 0.012, 0.009), 0xdaedf1,
      { segments: detail ? 6 : 4, rings: detail ? 3 : 2, glow: 0.5 });
  }
  metadata.parts = { holdfasts: 6, fronds, pinnae: fronds * pairs * 2, tipNodes: fronds };
}

function brineBell(mesh, variant, detail, metadata) {
  holdfast(mesh, variant + 17, detail, 0x426f8b);
  const rng = plantRandom(0xb411 + variant * 3917), count = 4;
  metadata.apertures = [];
  for (let index = 0; index < count; index++) {
    const angle = index * TAU / count + rng() * 0.2 + variant * 0.22;
    const direction = point(Math.cos(angle), 0, Math.sin(angle));
    const stemHeight = 0.47 + index * 0.105 + rng() * 0.035;
    const reach = 0.16 + rng() * 0.16;
    const stem = (t) => direction.clone().multiplyScalar(reach * t ** 1.6)
      .add(point(0, 0.045 + stemHeight * t - 0.025 * t ** 3, 0));
    const segments = detail ? 6 : 3;
    const path = Array.from({ length: segments + 1 }, (_, step) => stem(step / segments));
    mesh.tube(path, path.map((_p, step) => 0.017 - step / segments * 0.008), 0x6098b3, detail ? 5 : 4);
    const base = stem(1), cupHeight = 0.18 + rng() * 0.025, radius = 0.12 + rng() * 0.025;
    const tilt = 0.35 + rng() * 0.14;
    const axis = direction.clone().multiplyScalar(Math.sin(tilt)).add(point(0, Math.cos(tilt), 0));
    const across = point(-direction.z, 0, direction.x);
    const forward = new THREE.Vector3().crossVectors(axis, across).normalize();
    const cupPoint = (height, angleAt, inner = false) => {
      const flare = Math.sin(height * Math.PI / 2) ** 0.85;
      const lobes = 1 + Math.cos(angleAt * 6) * 0.045 * height ** 4;
      const r = (0.023 + flare * radius) * lobes - (inner ? 0.011 : 0);
      return base.clone().addScaledVector(axis, cupHeight * height)
        .addScaledVector(across, Math.cos(angleAt) * r).addScaledVector(forward, Math.sin(angleAt) * r);
    };
    const rows = detail ? 6 : 3, columns = detail ? 24 : 12;
    const rimGlow = (u, v) => u > 0.98 && Math.cos(v * TAU * 6) > 0.95 ? 0.32 : 0;
    const outerStart = mesh.positions.length / 3;
    mesh.grid(rows, columns, (u, v) => cupPoint(u, v * TAU),
      (u, v) => u > 0.78 ? 0xdaedf2 : Math.cos(v * TAU * 6) > 0.55 ? 0x7cb4cd : 0x9bc8da, rimGlow);
    const innerStart = mesh.positions.length / 3;
    mesh.grid(rows, columns, (u, v) => cupPoint(u, v * TAU, true),
      (u) => u > 0.7 ? 0xe4f0f1 : u < 0.3 ? 0x4d829c : 0x9fc5d1, rimGlow, true);
    const rimStart = mesh.positions.length / 3;
    // The rim is a narrow annulus, leaving the entire botanical cup mouth open.
    mesh.grid(1, columns, (u, v) => cupPoint(1, v * TAU, true)
      .lerp(cupPoint(1, v * TAU), u), 0xe8f1f0,
    (_u, v) => Math.cos(v * TAU * 6) > 0.95 ? 0.35 : 0, true);
    mesh.grid(1, columns, (u, v) => base.clone().addScaledVector(across, Math.cos(v * TAU) * 0.012 * u)
      .addScaledVector(forward, Math.sin(v * TAU) * 0.012 * u), 0x4d829c, 0, true);
    mesh.ellipsoid(base.clone().addScaledVector(axis, 0.033), point(0.013, 0.012, 0.013), 0xc9dfea,
      { segments: detail ? 5 : 4, rings: detail ? 3 : 2, glow: 0.58 });
    metadata.apertures.push({ center: base.clone().addScaledVector(axis, cupHeight), base, normal: axis,
      radius: radius + 0.012, depth: cupHeight,
      outerRange: [outerStart, innerStart - outerStart], innerRange: [innerStart, rimStart - innerStart] });
  }
  for (let leaf = 0; leaf < 4; leaf++) {
    const angle = leaf * TAU / 4 + variant * 0.3;
    mesh.leaf(point(0, 0.06, 0), point(Math.cos(angle) * 0.3, 0.16, Math.sin(angle) * 0.3), 0.065,
      (u, v) => Math.abs(v - 0.5) < 0.2 ? 0x8eb8ca : u > 0.8 ? 0xb8d8e3 : 0x6399b4,
      { segments: detail ? 6 : 3, columns: detail ? 3 : 1, curve: 0.018, cup: 0.14, twist: 0.1 });
  }
  metadata.parts = { holdfasts: 6, stems: count, hollowBells: count, basalLeaves: 4, nectarNodes: count };
}

/** A closed, fleshy blade with cupped edges and a raised central fold. */
function rosetteBlade(mesh, root, tip, width, detail, inner, seed, glowing) {
  const axis = tip.clone().sub(root), side = point(-axis.z, 0, axis.x).normalize();
  const normal = new THREE.Vector3().crossVectors(side, axis).normalize();
  const rows = detail ? inner ? 8 : 10 : 4, columns = detail ? inner ? 6 : 8 : 4;
  mesh.grid(rows, columns, (u, v) => {
    const angle = v * TAU, envelope = Math.sin(u * Math.PI) ** 0.65;
    const center = root.clone().lerp(tip, u).addScaledVector(normal, Math.sin(u * Math.PI) * (inner ? 0.055 : 0.085));
    return center.addScaledVector(side, Math.cos(angle) * width * envelope)
      .addScaledVector(normal, Math.sin(angle) * (0.018 + width * 0.13) * envelope
        + Math.sin(u * Math.PI * 2 + seed) * 0.009 * envelope);
  }, (u, v) => u > 0.83 ? 0xb7a8db : Math.sin(v * TAU) < -0.15 ? 0x527f9d
    : Math.abs(Math.cos(v * TAU)) < 0.25 ? 0x9bc9d9 : 0x7aa9c4,
  (u) => glowing && u > 0.96 ? 0.32 : 0, true);
}

function glassrootBloom(mesh, variant, detail, metadata) {
  holdfast(mesh, variant + 31, detail, 0x526d99);
  const rng = plantRandom(0x61a5500 + variant * 1319), rings = [8, 6, 5];
  for (let ring = 0; ring < rings.length; ring++) for (let leaf = 0; leaf < rings[ring]; leaf++) {
    const angle = leaf * TAU / rings[ring] + ring * 0.43 + variant * 0.19;
    const reach = ring === 0 ? 0.94 + rng() * 0.16 : ring === 1 ? 0.59 + rng() * 0.13 : 0.23 + rng() * 0.13;
    const height = ring === 0 ? 0.18 + rng() * 0.08 : ring === 1 ? 0.5 + rng() * 0.1 : 0.85 + rng() * 0.12;
    rosetteBlade(mesh, point(0, 0.07 + ring * 0.025, 0), point(Math.cos(angle) * reach, height, Math.sin(angle) * reach),
      ring === 0 ? 0.14 : ring === 1 ? 0.12 : 0.085, detail, ring === 2, rng() * TAU,
      (ring + leaf) % 3 === 0);
  }
  for (let node = 0; node < 3; node++) {
    const angle = node * TAU / 3 + variant * 0.2;
    mesh.ellipsoid(point(Math.cos(angle) * 0.075, 0.22, Math.sin(angle) * 0.075), point(0.022, 0.03, 0.022), 0xc2b7e4,
      { segments: detail ? 6 : 4, rings: detail ? 4 : 3, glow: 0.55 });
  }
  metadata.parts = { holdfasts: 6, rosetteRings: 3, fleshyBlades: 19, nectarNodes: 3 };
}

/** Three authored Arctic underwater species, built only as reusable geometry.
 * Prepared placement, dimensions and habitat lighting belong to the caller.
 * @param {'frost-feather'|'brine-bell'|'glassroot-bloom'} kind
 * @param {{detail?:boolean,variant?:number}} [options]
 * @returns {THREE.BufferGeometry}
 */
export function createArcticPlantGeometry(kind, { detail = true, variant = 0 } = {}) {
  if (!ARCTIC_PLANT_KINDS.includes(kind)) throw new TypeError(`Unknown Arctic plant kind: ${kind}`);
  if (!Number.isInteger(variant) || variant < 0 || variant > 255)
    throw new RangeError("Arctic plant variant must be an integer from 0 to 255.");
  const mesh = new PlantMesh(), metadata = { kind, variant, detail: Boolean(detail) };
  if (kind === "frost-feather") frostFeather(mesh, variant, detail, metadata);
  else if (kind === "brine-bell") brineBell(mesh, variant, detail, metadata);
  else glassrootBloom(mesh, variant, detail, metadata);
  let minimum = Infinity, maximum = -Infinity;
  for (let index = 1; index < mesh.positions.length; index += 3) {
    minimum = Math.min(minimum, mesh.positions[index]); maximum = Math.max(maximum, mesh.positions[index]);
  }
  const offset = -Math.min(0, minimum), height = maximum + offset;
  const geometry = mesh.geometry({ normalizeHeight: true });
  if (metadata.apertures) metadata.apertures = metadata.apertures.map((aperture) => {
    const normal = point(aperture.normal.x, aperture.normal.y * height, aperture.normal.z);
    const normalScale = normal.length(); normal.normalize();
    return {
      center: [aperture.center.x, (aperture.center.y + offset) / height, aperture.center.z],
      base: [aperture.base.x, (aperture.base.y + offset) / height, aperture.base.z],
      normal: normal.toArray(), radius: aperture.radius, depth: aperture.depth / normalScale,
      outerRange: aperture.outerRange, innerRange: aperture.innerRange,
    };
  });
  geometry.name = `${kind}-${variant}-${detail ? "high" : "low"}`;
  geometry.userData.botany = metadata;
  return geometry;
}
