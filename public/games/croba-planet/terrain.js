/** @typedef {{x:number,y:number}} Point */
/** @typedef {{id:string,x:number,y:number,rx:number,ry:number,seed:number,depth?:number,kind?:string}} Platform */

export const WATER_LEVEL = -15;
export const SEABED_LEVEL = -280;
export const EYE_HEIGHT = 36;
export const PLAYER_RADIUS = 5;
export const BLUE_OCEAN_START_X = 1100;
export const BLUE_OCEAN_DEPTH_METERS = 100;
export const BLUE_OCEAN_FLOOR = WATER_LEVEL - BLUE_OCEAN_DEPTH_METERS * 25;
export const WORLD_BOUNDS = Object.freeze({
  minX: -6000, maxX: 8000, minY: -11300, maxY: 5700,
});

const MAIN_OUTLINE = [
  [-0.95, -0.38],
  [-0.68, -0.93],
  [-0.2, -0.98],
  [0.1, -0.8],
  [0.64, -0.9],
  [0.96, -0.4],
  [0.78, 0.08],
  [0.9, 0.48],
  [0.48, 0.91],
  [0.1, 0.82],
  [-0.28, 1],
  [-0.86, 0.58],
  [-0.75, 0.12],
];
const FLOE_OUTLINES = [
  [
    [-0.95, -0.44],
    [-0.44, -0.95],
    [0.48, -0.85],
    [0.97, -0.2],
    [0.77, 0.7],
    [-0.15, 0.95],
    [-0.85, 0.52],
  ],
  [
    [-0.88, -0.73],
    [0.36, -0.96],
    [0.95, -0.27],
    [0.72, 0.8],
    [-0.32, 0.97],
    [-0.96, 0.24],
  ],
  [
    [-0.97, -0.16],
    [-0.51, -0.9],
    [0.67, -0.78],
    [0.98, 0.43],
    [0.03, 0.97],
    [-0.77, 0.61],
  ],
];

/** Angular top outlines in absolute world x/y, shared by rendering and collision. @param {Platform} floe @returns {Point[]} */
export function getPlatformVertices(floe) {
  if (Array.isArray(floe.outline)) return floe.outline.map(([x,y])=>({x:floe.x+x*floe.rx,y:floe.y+y*floe.ry}));
  const seed = Math.abs(Math.trunc(floe.seed || 0));
  if (!floe.id.startsWith("floe-")) {
    let state = seed >>> 0;
    const next = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const count = floe.kind === "glacier" ? 10 + (seed % 3) : 5 + (seed % 4);
    const phase = next() * Math.PI * 2;
    return Array.from({ length: count }, (_, index) => {
      const angle =
        phase + ((index + (next() - 0.5) * 0.25) / count) * Math.PI * 2;
      const radius = 0.76 + next() * 0.24;
      return {
        x: floe.x + Math.cos(angle) * floe.rx * radius,
        y: floe.y + Math.sin(angle) * floe.ry * radius,
      };
    });
  }
  const outline = floe.outline ?? (
    floe.id === "floe-0"
      ? MAIN_OUTLINE
      : FLOE_OUTLINES[seed % FLOE_OUTLINES.length]);
  return outline.map(([x, y]) => ({
    x: floe.x + x * floe.rx,
    y: floe.y + y * floe.ry,
  }));
}

/** Positive distance from the ice surface to its submerged base. @param {Platform} floe */
export function getIceDepth(floe) {
  if (Number.isFinite(floe.depth) && floe.depth > 0) return floe.depth;
  return floe.id === "floe-0"
    ? 195
    : 35 + (Math.abs(Math.trunc(floe.seed || 0)) % 31);
}

/**
 * Footprint scale at an absolute vertical world z: surface 0, underwater negative.
 * The glacier tapers from 1 at the surface, through .9 at half depth, to .4 at its base.
 * @param {Platform} floe @param {number} z
 */
export function getIceScale(floe, z) {
  const depth = getIceDepth(floe);
  if (z < -depth) return 0;
  const fraction = Math.max(0, Math.min(1, -z / depth));
  return fraction <= 0.5 ? 1 - fraction * 0.2 : 0.9 - (fraction - 0.5);
}

/** Boundary points count as inside, so walking and ledge collision agree. @param {Point[]} vertices @param {number} x @param {number} y */
export function pointInPolygon(vertices, x, y) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const a = vertices[j];
    const b = vertices[i];
    const cross = (x - a.x) * (b.y - a.y) - (y - a.y) * (b.x - a.x);
    if (
      Math.abs(cross) < 1e-7 &&
      x >= Math.min(a.x, b.x) - 1e-7 &&
      x <= Math.max(a.x, b.x) + 1e-7 &&
      y >= Math.min(a.y, b.y) - 1e-7 &&
      y <= Math.max(a.y, b.y) + 1e-7
    )
      return true;
    if (
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

/** @param {Platform} floe @param {number} z @returns {Point[]} */
export function getIceSection(floe, z) {
  const scale = getIceScale(floe, z);
  return getPlatformVertices(floe).map((point) => ({
    x: floe.x + (point.x - floe.x) * scale,
    y: floe.y + (point.y - floe.y) * scale,
  }));
}
