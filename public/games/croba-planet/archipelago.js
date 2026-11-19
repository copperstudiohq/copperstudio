import { getIceDepth, getIceScale, WATER_LEVEL, WORLD_BOUNDS, BLUE_OCEAN_START_X } from "./terrain.js";
import { getSeabedHeight } from "./seabed.js";
import { getIceSpikes } from "./ice-spikes.js";

export const DEFAULT_WORLD_SEED = 0xc70ba;

/** @typedef {{id:string,x:number,y:number,rx:number,ry:number,seed:number,depth?:number,kind?:string,z?:number}} IceVolume */
/** @typedef {{id:string,x:number,y:number,z:number,seed:number,scale:number,habitat:'seabed',heading:number,patrolRadius:number}} Crab */

const CORE_LAYOUT = [
  [0, 0, 165, 148],
  [255, 45, 82, 82],
  [440, -30, 88, 86],
  [645, 25, 96, 98],
  [70, -260, 90, 78],
  [-30, -440, 95, 90],
  [100, -625, 108, 84],
  [-270, 5, 88, 95],
  [-460, 100, 85, 80],
  [-665, 0, 100, 100],
  [90, 265, 95, 85],
  [310, 290, 98, 88],
  [530, 260, 92, 92],
  [-155, 295, 85, 88],
  [-375, 340, 100, 78],
  [-610, 290, 90, 80],
  [310, -245, 80, 85],
  [-260, -230, 78, 90],
  [805, -170, 75, 88],
  [-805, -205, 74, 82],
];

// Keep the established discovery swim and its ascent sites unobstructed.
const RESERVED_WATER_ROUTES = [
  [0, 0, 0, 185, 55],
  [0, 0, 300, 100, 55],
  [300, 100, 180, 170, 55],
  [180, 170, 70, 50, 45],
  [150, 0, 220, 0, 40],
];
const RESERVED_MARKERS = [
  [0, 50, 95],
  [0, -30, 80],
  [0, 0, 90],
  [300, 100, 75],
  [180, 170, 70],
];
const SEABED_CRAB_HOMES = [
  [95, -150],
  [465, 135],
  [-340, -120],
  [730, 80],
  [-560, 300],
  [1250, -600],
  [1500, 450],
  [1850, -1050],
  [2200, 1250],
  [2600, -350],
  [2900, 1800],
  [3350, -1450],
  [3550, 650],
];

/** @param {number} seed */
function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** @param {number} x @param {number} y @param {number[]} segment */
function distanceToSegment(x, y, [ax, ay, bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = Math.max(
    0,
    Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSquared),
  );
  return Math.hypot(x - ax - dx * t, y - ay - dy * t);
}

/** @param {IceVolume} candidate */
function outsideReservedWater(candidate) {
  const radius = Math.max(candidate.rx, candidate.ry);
  return (
    RESERVED_MARKERS.every(
      ([x, y, clearance]) =>
        Math.hypot(candidate.x - x, candidate.y - y) > radius + clearance,
    ) &&
    SEABED_CRAB_HOMES.every(
      ([x, y]) => Math.hypot(candidate.x - x, candidate.y - y) > radius + 85,
    ) &&
    RESERVED_WATER_ROUTES.every(
      (segment) =>
        distanceToSegment(candidate.x, candidate.y, segment) >
        radius + segment[4],
    )
  );
}

/** @param {IceVolume} candidate @param {IceVolume[]} platforms */
function clearOfIceVolumes(candidate, platforms) {
  return platforms.every((floe) => {
    if (candidate.z <= -getIceDepth(floe)) return true;
    const scale = getIceScale(floe, candidate.z);
    return (
      Math.hypot(candidate.x - floe.x, candidate.y - floe.y) >
      Math.max(candidate.rx, candidate.ry) +
        Math.max(floe.rx, floe.ry) * scale +
        20
    );
  });
}

/** @param {number} seed @returns {{seed:number,platforms:IceVolume[],submergedIce:IceVolume[],crabs:Crab[]}} */
export function generateArchipelago(seed = DEFAULT_WORLD_SEED) {
  if (!Number.isFinite(seed))
    throw new TypeError("The archipelago seed must be a finite number.");
  const normalizedSeed = Math.trunc(seed) >>> 0;
  const rng = random(normalizedSeed);
  const platforms = CORE_LAYOUT.map(([x, y, rx, ry], index) => ({
    id: `floe-${index}`,
    x,
    y,
    rx,
    ry,
    seed: index * 47 + 13,
  }));

  // Place large glaciers first so smaller islands cannot crowd them out.
  for (const [kind, count] of [
    ["glacier", 10],
    ["island", 60],
  ]) {
    let placed = 0;
    for (let attempt = 0; placed < count && attempt < 20000; attempt += 1) {
      const angle = rng() * Math.PI * 2;
      const distance = Math.sqrt(900 ** 2 + rng() * (2600 ** 2 - 900 ** 2));
      const large = kind === "glacier";
      const radius = large
        ? 220 + rng() * 110
        : 60 + (rng() < 0.2 ? rng() * 160 : rng() * 90);
      const candidate = {
        id: `${kind}-${placed}`,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rx: radius,
        ry: large
          ? 220 + rng() * 110
          : Math.max(60, radius * (0.72 + rng() * 0.28)),
        depth: large
          ? 155 + Math.floor(rng() * 56)
          : 35 + Math.floor(rng() * 81),
        seed: Math.floor(rng() * 0x100000000),
        kind,
      };
      if (
        platforms.some(
          (floe) =>
            Math.hypot(candidate.x - floe.x, candidate.y - floe.y) <
            Math.max(candidate.rx, candidate.ry) +
              Math.max(floe.rx, floe.ry) +
              32,
        )
      )
        continue;
      platforms.push(candidate);
      placed += 1;
    }
    if (placed !== count)
      throw new Error(
        `Could not place ${count} ${kind}s for archipelago seed ${normalizedSeed}.`,
      );
  }

  const submergedIce = [];
  const nearChunks = [
    [350, -160],
    [-350, 170],
    [540, 250],
  ];
  for (
    let attempt = 0;
    submergedIce.length < 18 && attempt < 10000;
    attempt += 1
  ) {
    const preferred = attempt < nearChunks.length ? nearChunks[attempt] : null;
    const angle = rng() * Math.PI * 2;
    const distance = 500 + rng() * 1850;
    const candidate = {
      id: `submerged-${submergedIce.length}`,
      x: preferred ? preferred[0] : Math.cos(angle) * distance,
      y: preferred ? preferred[1] : Math.sin(angle) * distance,
      z: -(80 + Math.floor(rng() * 71)),
      rx: 75 + rng() * 65,
      ry: 65 + rng() * 55,
      depth: 60 + Math.floor(rng() * 51),
      seed: Math.floor(rng() * 0x100000000),
      kind: "submerged",
    };
    if (
      !outsideReservedWater(candidate) ||
      !clearOfIceVolumes(candidate, platforms)
    )
      continue;
    if (
      submergedIce.some(
        (chunk) =>
          Math.hypot(chunk.x - candidate.x, chunk.y - candidate.y) <
          Math.max(chunk.rx, chunk.ry) +
            Math.max(candidate.rx, candidate.ry) +
            30,
      )
    )
      continue;
    submergedIce.push(candidate);
  }
  if (submergedIce.length !== 18)
    throw new Error(
      `Could not place submerged ice for archipelago seed ${normalizedSeed}.`,
    );

  const undersideTips = new Map();
  const iceBottom = (ice) => {
    if (!undersideTips.has(ice.id)) undersideTips.set(ice.id,
      Math.min((ice.z ?? 0) - getIceDepth(ice), ...getIceSpikes(ice).map((spike) => spike.z - spike.length)));
    return undersideTips.get(ice.id);
  };
  /** @type {Crab[]} */
  const crabs = [];
  for (const [index, [homeX, homeY]] of SEABED_CRAB_HOMES.entries()) {
    const scale = (1.05 + rng() * 0.45) * 0.8;
    // Reserve the animal's full leg span and coral crown, not only its body.
    const clearance = 75 * scale + 6;
    let home;
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const spread = attempt < 100 ? 340 : attempt < 300 ? 1000 : 1800;
      const x = homeX + (attempt ? (rng() - 0.5) * spread : 0);
      const y = homeY + (attempt ? (rng() - 0.5) * spread : 0);
      const z = getSeabedHeight(x, y);
      if (x < WORLD_BOUNDS.minX + clearance || x > WORLD_BOUNDS.maxX - clearance ||
        y < WORLD_BOUNDS.minY + clearance || y > WORLD_BOUNDS.maxY - clearance ||
        z + 90 * scale > WATER_LEVEL - 10) continue;
      if (index >= 5 && x < BLUE_OCEAN_START_X + clearance) continue;
      if (index === 1 && Math.hypot(x, y) > 650) continue;
      if (RESERVED_WATER_ROUTES.some((route) =>
        distanceToSegment(x, y, route) < route[4] + clearance)) continue;
      if (RESERVED_MARKERS.some(([mx, my, radius]) =>
        Math.hypot(x - mx, y - my) < radius + clearance)) continue;
      if ([...platforms, ...submergedIce].some((ice) => {
        if (Math.hypot(x - ice.x, y - ice.y) >= Math.max(ice.rx, ice.ry) + clearance) return false;
        return z + 90 * scale >= iceBottom(ice) - 8;
      })) continue;
      let minimumGround = z, maximumGround = z;
      for (let row = -2; row <= 2; row += 1) {
        for (let column = -2; column <= 2; column += 1) {
          const ground = getSeabedHeight(
            x + column * clearance / 2, y + row * clearance / 2,
          );
          minimumGround = Math.min(minimumGround, ground);
          maximumGround = Math.max(maximumGround, ground);
        }
      }
      // Avoid cliffs that would overextend the legs or lift a crown out of water.
      if (maximumGround - minimumGround > 24 ||
        maximumGround + 90 * scale > WATER_LEVEL - 10) continue;
      if (crabs.some((crab) => Math.hypot(x - crab.x, y - crab.y) <
        clearance + 75 * crab.scale + 20)) continue;
      home = { x, y, z };
      break;
    }
    if (!home) throw new Error(
      `Could not place underwater crab ${index} for archipelago seed ${normalizedSeed}.`,
    );
    crabs.push({
      id: index < 5 ? `seabed-crab-${index}` : `coral-crab-${index - 5}`,
      ...home,
      seed: Math.floor(rng() * 0x100000000),
      scale,
      habitat: "seabed",
      heading: rng() * Math.PI * 2,
      patrolRadius: 6,
    });
  }

  return { seed: normalizedSeed, platforms, submergedIce, crabs };
}
