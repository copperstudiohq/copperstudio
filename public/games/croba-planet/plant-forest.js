import * as THREE from "./vendor/three.module.js";
import { PlantMesh, plantRandom } from "./plant-mesh.js";

export const FOREST_PLANT_KINDS = Object.freeze(["violet-pitcher", "crown-fern", "moonbell-bloom"]);
const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const radial = (angle) => new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
const pointsAlong = (segments, pointAt) => Array.from({ length: segments + 1 }, (_, index) => pointAt(index / segments));
const taper = (points, base, tip) => points.map((_point, index) => base + (tip - base) * index / (points.length - 1));

/** Five separate hollow leaves: inflated bodies, turned green lips and curled hoods. */
function violetPitcher(mesh, detail, rng) {
  const columns = detail ? 12 : 8;
  mesh.ellipsoid(new THREE.Vector3(0, 0.035, 0), new THREE.Vector3(0.065, 0.035, 0.065),
    0x65517a, { segments: detail ? 8 : 6, rings: detail ? 4 : 3 });
  for (let index = 0; index < 5; index++) {
    const angle = index / 5 * TAU + 0.2 + (rng() - 0.5) * 0.18;
    const out = radial(angle), side = radial(angle + Math.PI / 2);
    const height = index === 0 ? 0.96 : 0.64 + rng() * 0.23;
    const lean = 0.22 + rng() * 0.07, phase = rng() * TAU;
    const center = (t) => out.clone().multiplyScalar(0.055 + lean * t ** 1.2)
      .addScaledVector(UP, 0.05 + height * 0.88 * t);
    const normal = (t) => new THREE.Vector3(out.x, -lean * 1.2 * Math.max(0.001, t) ** 0.2 / (height * 0.88), out.z).normalize();
    const radius = (t) => 0.018 + 0.067 * Math.sin(t * Math.PI) ** 0.7 + 0.048 * t ** 3;
    const surface = (t, v, inner = false) => {
      const phi = v * TAU, r = radius(t) * (inner ? 0.84 : 1);
      return center(t).addScaledVector(side, Math.cos(phi) * r).addScaledVector(normal(t), Math.sin(phi) * r);
    };
    const stem = [new THREE.Vector3(0, 0.025, 0), out.clone().multiplyScalar(0.035).setY(0.035), center(0)];
    mesh.tube(stem, [0.014, 0.012, 0.01], 0x697c4f, detail ? 6 : 4);
    mesh.grid(detail ? 10 : 5, columns, (u, v) => surface(u, v), (u, v) => {
      const vein = Math.cos(v * TAU * 6 + phase) > 0.82;
      return u > 0.9 ? 0x9873a5 : vein ? 0xa488b5 : u < 0.3 ? 0x65446f : 0x80558f;
    });
    mesh.grid(detail ? 3 : 2, columns, (u, v) => surface(0.61 + u * 0.39, v, true),
      (u) => u > 0.8 ? 0x7b8660 : 0x44364e, 0, true);
    const mouth = center(1), face = normal(1), lipRadius = radius(1);
    const rim = pointsAlong(columns, (t) => mouth.clone().addScaledVector(side, Math.cos(t * TAU) * lipRadius)
      .addScaledVector(face, Math.sin(t * TAU) * lipRadius));
    mesh.tube(rim, 0.009, 0x99b86f, detail ? 5 : 4);
    // The hood grows from a thickened continuation of the back wall. Its hinge
    // overlaps both the cup and leaf instead of leaving a detached lid above it.
    const hoodRoot = mouth.clone().addScaledVector(face, -lipRadius - 0.012).addScaledVector(UP, 0.052);
    const hinge = [surface(0.9, 0.75), surface(0.97, 0.75),
      mouth.clone().addScaledVector(face, -lipRadius - 0.003).addScaledVector(UP, 0.012),
      mouth.clone().addScaledVector(face, -lipRadius - 0.012).addScaledVector(UP, 0.035), hoodRoot];
    mesh.tube(hinge, taper(hinge, 0.01, 0.006), 0x897395, detail ? 5 : 3);
    const hoodSpine = (u) => hoodRoot.clone().addScaledVector(face, 0.155 * u - 0.016 * Math.sin(u * Math.PI))
      .addScaledVector(UP, 0.095 * Math.sin(u * Math.PI) - 0.023 * u);
    mesh.grid(detail ? 8 : 4, detail ? 6 : 3, (u, v) => {
      const cross = v * 2 - 1, envelope = Math.sin(u * Math.PI);
      const width = 0.004 * (1 - u) + 0.071 * envelope ** 0.7 * (1 + 0.11 * Math.sin(u * Math.PI * 5));
      return hoodSpine(u).addScaledVector(side, cross * width)
        .addScaledVector(UP, 0.022 * cross ** 2 * envelope + 0.006 * Math.cos(u * Math.PI * 3) * Math.abs(cross) ** 3 * envelope);
    }, (_u, v) => Math.abs(v - 0.5) < 0.1 ? 0xbda1c7 : Math.abs(v - 0.5) > 0.4 ? 0x889e71 : 0x92709f);
    if (detail) {
      const midrib = pointsAlong(4, (u) => hoodSpine(u * 0.95).addScaledVector(UP, 0.0015));
      mesh.tube(midrib, taper(midrib, 0.0023, 0.0008), 0xc0a8ca, 3);
    }
    mesh.leaf(new THREE.Vector3(0, 0.02, 0), out.clone().multiplyScalar(0.3).setY(0.11), 0.065,
      (u) => u > 0.65 ? 0x8d659c : 0x627c55,
      { segments: detail ? 5 : 3, columns: detail ? 3 : 2, curve: 0.025, cup: 0.3, twist: 0.18 });
    if (index < 3) {
      const nectar = mouth.clone().addScaledVector(side, lipRadius * 0.85).addScaledVector(UP, 0.012);
      mesh.ellipsoid(nectar, new THREE.Vector3(0.012, 0.009, 0.012), 0xc5d6a1,
        { segments: detail ? 6 : 4, rings: detail ? 4 : 3, glow: 0.04 });
    }
  }
}

/** Each arching rachis carries sixteen separate cupped pinnae and a terminal leaflet. */
function crownFern(mesh, detail, rng) {
  mesh.ellipsoid(new THREE.Vector3(0, 0.045, 0), new THREE.Vector3(0.065, 0.045, 0.065),
    0x607853, { segments: detail ? 8 : 6, rings: detail ? 4 : 3 });
  for (let frond = 0; frond < 7; frond++) {
    const angle = frond / 7 * TAU + (rng() - 0.5) * 0.16;
    const out = radial(angle), side = radial(angle + Math.PI / 2);
    const height = 0.85 + rng() * 0.12, reach = 0.55 + rng() * 0.1;
    const spine = (t) => out.clone().multiplyScalar(0.025 + reach * t)
      .addScaledVector(UP, 0.04 + height * (Math.sin(t * Math.PI * 0.75) * 0.82 + t * 0.08));
    const rachis = pointsAlong(detail ? 10 : 5, spine);
    mesh.tube(rachis, taper(rachis, 0.012, 0.003), 0x8ca775, detail ? 5 : 4);
    for (let pair = 0; pair < 8; pair++) {
      const t = 0.1 + pair / 8 * 0.79;
      const length = (0.2 * (1 - t) ** 0.55 + 0.026) * (0.92 + rng() * 0.16);
      for (const sign of [-1, 1]) {
        const root = spine(t), tip = root.clone().addScaledVector(side, sign * length)
          .addScaledVector(out, 0.09 * (1 - t)).addScaledVector(UP, -0.025 - t * 0.035);
        mesh.leaf(root, tip, 0.034 * (1 - t * 0.55), (u, v) => u > 0.76 ? 0xa580b5
          : Math.abs(v - 0.5) < 0.1 ? 0xb3cd90 : pair % 2 ? 0x69a77b : 0x4e946a,
        { segments: detail ? 4 : 2, columns: detail ? 2 : 1, curve: 0.009,
          cup: 0.23, twist: sign * 0.14 });
      }
    }
    mesh.leaf(spine(0.89), spine(1).addScaledVector(out, 0.09), 0.035,
      (u) => u > 0.62 ? 0xb195c6 : 0x7bb58b,
      { segments: detail ? 6 : 3, columns: detail ? 3 : 2, curve: 0.009, cup: 0.15 });
  }
  for (let index = 0; index < 2; index++) {
    const out = radial(index * Math.PI + 0.8), side = radial(index * Math.PI + 0.8 + Math.PI / 2);
    const crown = out.clone().multiplyScalar(0.075).setY(0.61 + index * 0.06);
    const coil = pointsAlong(detail ? 14 : 8, (t) => {
      const phi = t * Math.PI * 1.65, radius = 0.095 * (1 - t * 0.85);
      return crown.clone().addScaledVector(side, Math.cos(phi) * radius).addScaledVector(UP, Math.sin(phi) * radius);
    });
    const stem = [new THREE.Vector3(0, 0.035, 0), out.clone().multiplyScalar(0.045).setY(0.3), coil[0], ...coil.slice(1)];
    mesh.tube(stem, taper(stem, 0.014, 0.004), (u) => u > 0.78 ? 0xa68bb7 : 0x8fb580, detail ? 5 : 4);
  }
}

/** Nodding five-lobed bells: separate inner surfaces, sepals, veins and anthers. */
function moonbellBloom(mesh, detail, rng) {
  mesh.ellipsoid(new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0.055, 0.03, 0.055),
    0x607b51, { segments: detail ? 8 : 6, rings: detail ? 4 : 3 });
  for (let flower = 0; flower < 3; flower++) {
    const angle = flower / 3 * TAU + 0.35 + (rng() - 0.5) * 0.16;
    const out = radial(angle), height = flower === 0 ? 1 : 0.75 + rng() * 0.19;
    const reach = 0.25 + rng() * 0.07;
    const stalk = (t) => out.clone().multiplyScalar(reach * Math.sin(t * Math.PI * 0.55))
      .addScaledVector(UP, 0.025 + height * t);
    const stem = pointsAlong(detail ? 8 : 4, stalk);
    mesh.tube(stem, taper(stem, 0.014, 0.006), 0x6b9b67, detail ? 6 : 4);
    for (let leaf = 0; leaf < 2; leaf++) {
      const t = 0.29 + leaf * 0.26, root = stalk(t), direction = radial(angle + (leaf ? 1 : -1) * 0.8);
      mesh.leaf(root, root.clone().addScaledVector(direction, 0.24).addScaledVector(UP, 0.04), 0.065,
        (u, v) => Math.abs(v - 0.5) < 0.1 ? 0xb6cb93 : u > 0.8 ? 0x92ad82 : 0x669a6a,
        { segments: detail ? 4 : 2, columns: detail ? 3 : 2, curve: 0.025, cup: 0.25, twist: 0.14 });
    }
    const origin = stalk(1), axis = radial(angle + Math.PI / 2);
    const tilt = new THREE.Quaternion().setFromAxisAngle(axis, 0.16 + flower * 0.08);
    const intoWorld = (point) => point.applyQuaternion(tilt).add(origin);
    const petal = (index, u, v, inside = false) => {
      const edge = 0.035 * u ** 3, phi = (index + edge + v * (1 - edge * 2)) / 5 * TAU;
      const radius = (0.023 + 0.105 * Math.sin(u * Math.PI / 2) ** 0.8 + 0.028 * u ** 4) * (inside ? 0.94 : 1);
      const y = -0.26 * u - 0.035 * Math.sin(v * Math.PI) * u ** 5;
      return intoWorld(new THREE.Vector3(Math.cos(phi) * radius, y, Math.sin(phi) * radius));
    };
    for (let index = 0; index < 5; index++) {
      mesh.grid(detail ? 7 : 4, detail ? 4 : 2, (u, v) => petal(index, u, v),
        (u, v) => Math.abs(v - 0.5) < 0.08 ? 0xf0e5fa : u < 0.25 ? 0xa68abf : 0xd7c7ec);
      mesh.grid(detail ? 5 : 2, detail ? 3 : 2, (u, v) => petal(index, u, v, true),
        (u) => u < 0.3 ? 0xbaa0ce : 0xe2d4ef, 0, true);
      const phi = (index + 0.5) / 5 * TAU;
      mesh.leaf(intoWorld(new THREE.Vector3(Math.cos(phi) * 0.016, 0.012, Math.sin(phi) * 0.016)),
        intoWorld(new THREE.Vector3(Math.cos(phi) * 0.075, -0.10, Math.sin(phi) * 0.075)), 0.024,
        0x88ad72, { segments: detail ? 3 : 2, columns: detail ? 2 : 1, curve: 0.004, cup: 0.2 });
      const filament = pointsAlong(2, (t) => intoWorld(new THREE.Vector3(Math.cos(phi) * (0.014 + t * 0.02),
        -0.045 - t * 0.22, Math.sin(phi) * (0.014 + t * 0.02))));
      mesh.tube(filament, 0.0026, 0xb2c79b, detail ? 4 : 3);
      mesh.ellipsoid(filament.at(-1), new THREE.Vector3(0.007, 0.017, 0.007), 0xd0d79a,
        { segments: detail ? 6 : 4, rings: detail ? 3 : 2 });
      if (detail) {
        const vein = pointsAlong(4, (t) => petal(index, 0.06 + t * 0.86, 0.5).addScaledVector(out, 0.0015));
        mesh.tube(vein, taper(vein, 0.0017, 0.0008), 0xc4aedb, 3);
      }
    }
    mesh.ellipsoid(intoWorld(new THREE.Vector3(0, -0.06, 0)), new THREE.Vector3(0.011, 0.008, 0.011),
      0xc9d4a3, { segments: detail ? 6 : 4, rings: detail ? 3 : 2, glow: 0.025 });
    mesh.leaf(new THREE.Vector3(0, 0.02, 0), out.clone().multiplyScalar(0.35).setY(0.12), 0.075,
      0x72986b, { segments: detail ? 4 : 3, columns: detail ? 3 : 2, curve: 0.025, cup: 0.24 });
  }
}

/** Detailed forest-floor prototypes. Prepared placement and PBR materials belong
 * to the shared renderer; this creates only deterministic, rooted botanical meshes.
 * @param {string} kind
 * @param {{detail?:boolean,variant?:number}} [options]
 * @returns {THREE.BufferGeometry}
 */
export function createForestPlantGeometry(kind, { detail = true, variant = 0 } = {}) {
  const index = FOREST_PLANT_KINDS.indexOf(kind);
  if (index < 0) throw new RangeError(`Unknown forest plant kind: ${kind}`);
  if (typeof detail !== "boolean") throw new TypeError("Forest plant detail must be a boolean.");
  if (!Number.isInteger(variant) || variant < 0) throw new RangeError("Forest plant variants must be non-negative integers.");
  const mesh = new PlantMesh(), rng = plantRandom(0xf07e57 + index * 7907 + variant * 7919);
  [violetPitcher, crownFern, moonbellBloom][index](mesh, detail, rng);
  const geometry = mesh.geometry({ normalizeHeight: true });
  geometry.name = kind;
  geometry.userData = { plantKind: kind, detail, variant };
  return geometry;
}
