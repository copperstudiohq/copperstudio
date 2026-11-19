import * as THREE from "./vendor/three.module.js";

/** @typedef {'snow'|'ice'|'sand'|'rock'|'whiteMetal'|'orangeMetal'|'darkMetal'|'chitin'|'goldCoral'|'bark'|'forestFloor'|'purpleNeedles'|'greenLeaves'|'moss'|'silt'|'blueKelp'} TextureKind */
/** @typedef {{size:number,color:Uint8ClampedArray,normal:Uint8ClampedArray,roughness:Uint8ClampedArray}} TexturePixels */

export const TEXTURE_KINDS = Object.freeze([
  "snow",
  "ice",
  "sand",
  "rock",
  "whiteMetal",
  "orangeMetal",
  "darkMetal",
  "chitin",
  "goldCoral",
  "bark",
  "forestFloor",
  "purpleNeedles",
  "greenLeaves",
  "moss",
  "silt",
  "blueKelp",
]);

const TAU = Math.PI * 2;
const clamp = (value, minimum = 0, maximum = 1) =>
  Math.max(minimum, Math.min(maximum, value));
const mix = (a, b, amount) => a + (b - a) * amount;
const smooth = (value) => value * value * (3 - 2 * value);
const wrap = (value, period) => ((value % period) + period) % period;

/** Stable integer hash; sampling wraps in the noise functions, never at display time. */
function hash(x, y, seed) {
  let value = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

/** Periodic bilinear noise on an integer-sized lattice. */
function noise(u, v, frequency, seed) {
  const px = u * frequency,
    py = v * frequency;
  const ix = Math.floor(px),
    iy = Math.floor(py);
  const tx = smooth(px - ix),
    ty = smooth(py - iy);
  const a = hash(wrap(ix, frequency), wrap(iy, frequency), seed);
  const b = hash(wrap(ix + 1, frequency), wrap(iy, frequency), seed);
  const c = hash(wrap(ix, frequency), wrap(iy + 1, frequency), seed);
  const d = hash(wrap(ix + 1, frequency), wrap(iy + 1, frequency), seed);
  return mix(mix(a, b, tx), mix(c, d, tx), ty);
}

/** Distances to the two nearest cells give seamless fissures and coral pores. */
function cells(u, v, frequency, seed) {
  const px = u * frequency,
    py = v * frequency;
  const ix = Math.floor(px),
    iy = Math.floor(py);
  let first = Infinity,
    second = Infinity;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = ix + dx,
        y = iy + dy;
      const cx =
        x + 0.18 + hash(wrap(x, frequency), wrap(y, frequency), seed) * 0.64;
      const cy =
        y +
        0.18 +
        hash(wrap(x, frequency), wrap(y, frequency), seed + 97) * 0.64;
      const distance = (cx - px) ** 2 + (cy - py) ** 2;
      if (distance < first) {
        second = first;
        first = distance;
      } else if (distance < second) second = distance;
    }
  }
  return {
    distance: Math.sqrt(first),
    edge: Math.sqrt(second) - Math.sqrt(first),
  };
}

/** Randomly oriented fallen needles, tiled by wrapping their cell identities.
 * Finite line segments avoid the regular crosshatch produced by intersecting sines.
 */
function needleLitter(u, v, seed) {
  const frequency = 10, px = u * frequency, py = v * frequency;
  const ix = Math.floor(px), iy = Math.floor(py);
  let coverage = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = ix + dx, y = iy + dy;
      const wx = wrap(x, frequency), wy = wrap(y, frequency);
      const cx = x + 0.15 + hash(wx, wy, seed) * 0.7;
      const cy = y + 0.15 + hash(wx, wy, seed + 17) * 0.7;
      const angle = hash(wx, wy, seed + 29) * TAU;
      const halfLength = 0.22 + hash(wx, wy, seed + 43) * 0.36;
      const axisX = Math.cos(angle), axisY = Math.sin(angle);
      const along = clamp((px - cx) * axisX + (py - cy) * axisY, -halfLength, halfLength);
      const distance = Math.hypot(px - cx - axisX * along, py - cy - axisY * along);
      coverage = Math.max(coverage, clamp((0.045 - distance) * 27));
    }
  }
  return coverage;
}

/**
 * Generate matching albedo, tangent-space normal, and roughness maps without DOM or GPU work.
 * All sampled fields are periodic, including the finite-difference normals at tile borders.
 * One texture tile represents one metre when the mesh uses world-projected metre UVs.
 * @param {TextureKind} kind
 * @param {number} [size]
 * @param {number} [seed]
 * @returns {TexturePixels}
 */
export function buildTexturePixels(kind, size = 128, seed = 731) {
  if (!TEXTURE_KINDS.includes(kind))
    throw new TypeError(`Unknown Croba surface texture: ${kind}`);
  if (!Number.isInteger(size) || size < 8 || size > 1024)
    throw new RangeError(
      "Texture size must be an integer between 8 and 1024 pixels.",
    );
  if (!Number.isFinite(seed))
    throw new TypeError("Texture seed must be finite.");

  const color = new Uint8ClampedArray(size * size * 4);
  const normal = new Uint8ClampedArray(color.length);
  const roughness = new Uint8ClampedArray(color.length);
  const heights = new Float32Array(size * size);
  const period = size - 1;
  // Snow, ice and stone retain their pre-v140 grain. Other surfaces keep the
  // updated sampling limit and their existing texture-upgrade appearance.
  const classicSurface=kind==='snow'||kind==='ice'||kind==='rock';
  const grainFrequency=classicSurface?128:Math.max(3,Math.min(61,Math.floor(period/2.5)));
  const scoreFrequency=Math.max(2,Math.min(53,Math.floor(period/3)));
  const isMetal = kind.endsWith("Metal");
  const cellular =
    kind === "ice" ||
    kind === "snow" ||
    kind === "rock" ||
    kind === "chitin" ||
    kind === "goldCoral" ||
    kind === "bark" ||
    kind === "forestFloor";
  const heightMetres = {
    snow: 0.018,
    ice: 0.018,
    sand: 0.035,
    rock: 0.04,
    whiteMetal: 0.006,
    orangeMetal: 0.006,
    darkMetal: 0.008,
    chitin: 0.018,
    goldCoral: 0.03,
    bark: 0.028,
    forestFloor: 0.045,
    purpleNeedles: 0.018,
    greenLeaves: 0.018,
    moss: 0.018,
    silt: 0.016,
    blueKelp: 0.014,
  }[kind];

  for (let y = 0; y < size; y++) {
    const v = y / period;
    for (let x = 0; x < size; x++) {
      const u = x / period;
      const broad = noise(u, v, 4, seed);
      const medium = noise(u, v, 16, seed + 11);
      const grain = noise(u, v, grainFrequency, seed + 23);
      const cell = cellular
        ? cells(
            u,
            v,
            kind === "chitin" ? 11 : kind === "goldCoral" ? 18 : 6,
            seed + 31,
          )
        : null;
      let r, g, b, height, rough;

      if (kind === "snow") {
        const fissure = clamp((0.035 - cell.edge) / 0.035);
        const crust =
          (broad - 0.5) * 13 + (medium - 0.5) * 10 + (grain - 0.5) * 14;
        const crystal = clamp((grain - 0.72) * 5);
        const windCrust = Math.sin(TAU * (u * 9 + Math.sin(v * TAU * 2) * .15));
        r = 224 + crust - fissure * 30 + crystal * 9 - windCrust * 3;
        g = 237 + crust - fissure * 16 + crystal * 9 - windCrust * 2;
        b = 241 + crust - fissure * 7 + crystal * 9;
        height = broad * 0.25 + medium * 0.2 + grain * 0.34 - fissure * 0.15 + windCrust * .035;
        rough = 0.84 + grain * 0.12 - fissure * 0.12;
      } else if (kind === "ice") {
        const fracture = clamp((0.026 - cell.edge) / 0.026);
        const fractureLip = clamp(1 - Math.abs(cell.edge - .038) / .013);
        const micro = cells(u, v, 19, seed + 91);
        const frozenAir = Math.pow(clamp((0.11 - micro.distance) / 0.11), 2);
        const brine = clamp((0.014 - micro.edge) / 0.014) * (.25 + medium * .35);
        // Original compressed layers beneath the fracture network.
        const layers = noise(u, v * 5, 3, seed + 67);
        const frost = .2 + noise(u, v * 4, 3, seed + 113) * .65;
        const shear = Math.pow((Math.cos(TAU * (v * 9 + Math.sin(u * TAU * 2) * .12)) + 1) * .5, 18);
        const tint = (layers - .5) * 22 + (grain - .5) * 3;
        r = 156 + frost * 64 + tint - fracture * 39 - brine * 10 + fractureLip * 11;
        g = 205 + frost * 31 + tint * .7 - fracture * 24 - brine * 6 + fractureLip * 8;
        b = 225 + frost * 18 + tint * .5 - fracture * 12 - brine * 3 + fractureLip * 5;
        height = layers * .10 + grain * .018 + frozenAir * .035 - brine * .05 - fracture * .18 + fractureLip * .055 - shear * .02;
        rough = .23 + frost * .38 + layers * .09 + fractureLip * .10 - fracture * .08;
      } else if (kind === "sand") {
        const warp = noise(u, v, 3, seed + 47) * 0.67 + noise(u, v, 7, seed + 69) * 0.11;
        const phase = TAU * (u * 10 + v * 2 + warp);
        const ripple = Math.sin(phase);
        const ridge = Math.pow((ripple + 1) * 0.5, 3.2)*(.3+.7*clamp((.7-broad)*2));
        const grit = (grain - 0.5) * 37;
        const mineral = noise(u, v, 57, seed + 61);
        const pebble = clamp((mineral - 0.67) * 7);
        const darkGrain = clamp((0.27 - mineral) * 7);
        const shell = clamp((noise(u, v, 31, seed + 97) - 0.74) * 9);
        const sediment = (broad - 0.5) * 29 + (medium - 0.5) * 13;
        r = 186 + sediment + grit + ridge * 10 - pebble * 30 - darkGrain * 22 + shell * 42;
        g = 172 + sediment + grit + ridge * 9 - pebble * 30 - darkGrain * 20 + shell * 40;
        b = 139 + sediment * 0.8 + grit * 0.8 + ridge * 6 - pebble * 24 - darkGrain * 14 + shell * 35;
        height = ridge * 0.24 + grain * 0.06 + medium * 0.07 + pebble * 0.08 + shell * 0.06;
        rough = 0.79 + grain * 0.18 - shell * 0.08;
      } else if (kind === "silt") {
        const grains = noise(u, v, 87, seed + 37);
        const fleck = clamp((grains - 0.69) * 5);
        const seam = clamp((0.22 - noise(u, v, 23, seed + 73)) * 6);
        const deposited=Math.pow((Math.sin(TAU*(v*4+u+(broad-.5)*.34))+1)*.5,5)*(.35+medium*.65);
        const sediment = broad * 0.66 + medium * 0.34;
        r = 79 + sediment * 45 + (grain - 0.5) * 24 + fleck * 23 - seam * 19+deposited*11;
        g = 89 + sediment * 43 + (grain - 0.5) * 25 + fleck * 21 - seam * 18+deposited*12;
        b = 84 + sediment * 34 + (grain - 0.5) * 22 + fleck * 16 - seam * 14+deposited*8;
        height = medium * 0.18 + grain * 0.07 + fleck * 0.05 - seam * 0.07+deposited*.045;
        rough = 0.87 + grains * 0.12;
      } else if (kind === "blueKelp") {
        const ribPhase = u * 7 + Math.sin(v * TAU * 3) * 0.035;
        const ribs = Math.pow((Math.cos(TAU * ribPhase) + 1) * 0.5, 10);
        const veinPhase = u * 21 + v * 4 + Math.sin(v * TAU * 2) * 0.19;
        const veins = Math.pow((Math.cos(TAU * veinPhase) + 1) * 0.5, 16);
        const pigment = broad * 0.65 + medium * 0.35;
        const spots = clamp((noise(u, v, 37, seed + 89) - 0.61) * 5);
        r = 14 + pigment * 23 + ribs * 11 + veins * 7 + spots * 10;
        g = 56 + pigment * 48 + ribs * 19 + veins * 9 + spots * 15;
        b = 107 + pigment * 58 + ribs * 29 + veins * 14 + spots * 17;
        height = medium * 0.10 + ribs * 0.09 + veins * 0.04 + grain * 0.025;
        rough = 0.38 + grain * 0.22 + spots * 0.08 - ribs * 0.07;
      } else if (kind === "rock") {
        const fissure = clamp((0.045 - cell.edge) / 0.045);
        const pit = clamp((0.17 - cell.distance) / 0.17);
        const facet =
          (broad - 0.5) * 46 + (medium - 0.5) * 26 + (grain - 0.5) * 18;
        const mineral = (noise(
          u + Math.sin(v * TAU * 2) * 0.04,
          v + Math.sin(u * TAU * 3) * 0.025,
          9,
          seed + 53,
        ) - 0.5) * 2;
        const copper = clamp((mineral + 0.2) * 0.7);
        const vein = clamp((0.022 - cell.edge) / 0.022) *
          clamp((noise(u, v, 8, seed + 57) - 0.38) * 4);
        const crystal = clamp((noise(u, v, 67, seed + 101) - 0.68) * 5);
        const microPit = clamp((0.25 - grain) * 4);
        r = 189 + facet + copper * 26 - fissure * 60 - pit * 24 + vein * 24 + crystal * 30 - microPit * 18;
        g = 97 + facet * 0.65 + copper * 36 - fissure * 42 - pit * 22 + vein * 15 + crystal * 15 - microPit * 12;
        b = 37 + facet * 0.32 + copper * 8 - fissure * 19 - pit * 13 + vein * 5 + crystal * 7 - microPit * 6;
        height =
          broad * 0.26 +
          medium * 0.22 +
          grain * 0.1 -
          fissure * 0.12 -
          pit * 0.12 +
          mineral * 0.035 +
          vein * 0.03 + crystal * 0.025 - microPit * 0.04;
        rough = 0.76 + medium * 0.19 - copper * 0.055;
      } else if (kind === "bark") {
        const fiber=noise(u*6+Math.sin(v*TAU)*.025,v,4,seed+53);
        const ridge=clamp((fiber-.18)*1.4);
        const split=clamp((.38-fiber)*5)*(.45+medium*.55);
        const lichen =
          clamp((noise(u, v, 11, seed + 71) - 0.65) * 7) *
          clamp((grain - 0.25) * 3);
        const knot = clamp((0.16 - cell.distance) * 5);
        r = 57 + ridge * 34 + medium * 9 - split * 24 + lichen * 28;
        g = 32 + ridge * 22 + medium * 6 - split * 18 + lichen * 38;
        b = 48 + ridge * 24 + medium * 8 - split * 20 + lichen * 28;
        height =
          ridge * .18 + medium * .045 + grain * .025 - split * .12 + knot * .045;
        rough = .84 + grain * .10 - lichen * .10;
      } else if (kind === "forestFloor") {
        const needles = needleLitter(u, v, seed + 127);
        const moss = clamp((broad - 0.52) * 5) * (0.45 + medium * 0.55);
        const pebble = clamp((0.12 - cell.distance) * 9);
        const shade = (medium - 0.5) * 26 + (grain - 0.5) * 19;
        r = 73 + shade + needles * 35 - moss * 24 - pebble * 16;
        g = 39 + shade * 0.55 + needles * 18 + moss * 39 - pebble * 10;
        b = 68 + shade * 0.9 + needles * 29 - moss * 15 - pebble * 13;
        height =
          broad * 0.12 + medium * 0.14 + grain * 0.05 +
          needles * 0.018 + pebble * 0.06;
        rough = 0.83 + grain * 0.13 - moss * 0.15;
      } else if (kind === "purpleNeedles") {
        const fiber = Math.sin(
          TAU * (u * 47 + v * 17 + Math.sin(v * TAU * 3) * 0.1),
        );
        const tip = clamp((medium - 0.48) * 2.6);
        const dew = clamp((grain - 0.78) * 6);
        r = 95 + broad * 38 + tip * 29 + fiber * 6 + dew * 28;
        g = 35 + broad * 19 + tip * 27 + fiber * 3 + dew * 23;
        b = 139 + broad * 42 + tip * 38 + fiber * 9 + dew * 24;
        height = medium * 0.17 + fiber * 0.045 + grain * 0.05 + dew * 0.03;
        rough = 0.57 + grain * 0.22 - dew * 0.22;
      } else if (kind === "greenLeaves") {
        const veins = Math.pow(
          (Math.cos(TAU * (u * 16 + Math.sin(v * TAU * 4) * 0.15)) + 1) * 0.5,
          12,
        );
        const ribs = Math.pow((Math.cos(TAU * u * 3) + 1) * 0.5, 18);
        const light = broad * 0.7 + medium * 0.3;
        r = 22 + light * 27 + veins * 15 + ribs * 25;
        g = 78 + light * 62 + veins * 24 + ribs * 30;
        b = 38 + light * 22 + veins * 6 + ribs * 7;
        height = medium * 0.15 + veins * 0.065 + ribs * 0.1 + grain * 0.03;
        rough = 0.47 + grain * 0.27 - veins * 0.09;
      } else if (kind === "moss") {
        const tufts = Math.pow(clamp(noise(u, v, 32, seed + 81) * 1.6), 2);
        const fibers = Math.pow(clamp((grain - 0.34) * 2), 2);
        const shade = broad * 0.65 + medium * 0.35;
        r = 40 + shade * 38 + tufts * 15 + fibers * 12;
        g = 77 + shade * 52 + tufts * 24 + fibers * 16;
        b = 25 + shade * 26 + tufts * 8 + fibers * 5;
        height = medium * 0.15 + tufts * 0.07 + fibers * 0.045;
        rough = 0.86 + grain * 0.13;
      } else if (isMetal) {
        const scratch = Math.pow(
          clamp((noise(u, v, 64, seed + 67) - 0.7) / 0.3),
          2,
        );
        const brushed = Math.sin(TAU * v * grainFrequency) * .8 + (grain - 0.5) * 3.2;
        const seam =
          Math.min(
            wrap(u * 2, 1),
            1 - wrap(u * 2, 1),
            wrap(v * 2, 1),
            1 - wrap(v * 2, 1),
          ) < 0.006
            ? 1
            : 0;
        const worn = clamp((0.31 - broad) * 6) + scratch * 0.8;
        const score = Math.pow((Math.cos(TAU * (u * scoreFrequency + v * 3 + medium * .15)) + 1) * .5, 14) * clamp((.54 - broad) * 5);
        const runoff=clamp((.32-noise(u*3,v,5,seed+141))*5)*clamp((.64-medium)*3);
        const pit = clamp((.29 - grain) * 6) * clamp((.52 - medium) * 5);
        const panelU = wrap(u * 2, 1), panelV = wrap(v * 2, 1);
        const boltDistance = Math.hypot(Math.min(Math.abs(panelU - .07), Math.abs(panelU - .93)), Math.min(Math.abs(panelV - .07), Math.abs(panelV - .93)));
        const bolt = clamp((.024 - boltDistance) / .012);
        const boltRim = clamp(1 - Math.abs(boltDistance - .027) / .009);
        const dark = kind === "darkMetal";
        const base = dark
          ? [42, 65, 76]
          : kind === "orangeMetal"
            ? [196, 105, 58]
            : [222, 231, 226];
        const exposed = dark ? [84, 113, 121] : [108, 131, 138];
        r =
          mix(base[0], exposed[0], clamp(worn)) +
          (medium - 0.5) * 9 +
          brushed -
          seam * 23;
        g =
          mix(base[1], exposed[1], clamp(worn)) +
          (medium - 0.5) * 9 +
          brushed -
          seam * 23;
        b =
          mix(base[2], exposed[2], clamp(worn)) +
          (medium - 0.5) * 9 +
          brushed -
          seam * 21;
        const oxidation=clamp((broad-.51)*3.4)*clamp((medium-.37)*2.4);
        r=mix(r,dark?85:151,oxidation*.48)-runoff*15;
        g=mix(g,dark?65:91,oxidation*.48)-runoff*17;
        b=mix(b,dark?51:58,oxidation*.48)-runoff*15;
        if (kind === 'orangeMetal') {
          const frost = clamp((broad - .57) * 5) * (.35 + medium * .25);
          r = mix(r, 224, frost); g = mix(g, 237, frost); b = mix(b, 242, frost);
        }
        r -= pit * 20 + score * 26 + bolt * 28; g -= pit * 18 + score * 22 + bolt * 26; b -= pit * 15 + score * 16 + bolt * 23;
        r += boltRim * 9; g += boltRim * 10; b += boltRim * 11;
        height = grain * .04 + medium * .04 - scratch * .07 - seam * .12 - score * .07 - pit * .06 - bolt * .09 + boltRim * .03;
        rough = (dark ? .47 : .65) + medium * .13 - clamp(worn) * .16 + pit * .12 - score * .09+oxidation*.12;
      } else if (kind === "chitin") {
        const ridge = clamp((0.055 - cell.edge) / 0.055);
        const dome = clamp(1 - cell.distance * 1.7);
        const vein = ridge * (0.45 + broad * 0.5);
        const pores = clamp((noise(u, v, 61, seed + 97) - 0.63) * 6);
        const freckles = clamp((0.3 - grain) * 4);
        r = 148 + broad * 38 + medium * 29 + vein * 28 - pores * 24 - freckles * 17;
        g = 25 + broad * 15 + medium * 12 + vein * 15 - pores * 7 - freckles * 5;
        b = 21 + broad * 11 + medium * 10 + vein * 12 - pores * 6 - freckles * 4;
        height = dome * 0.27 + grain * 0.06 + ridge * 0.07 - pores * 0.06;
        rough = 0.3 + medium * 0.24 + ridge * 0.13 + pores * 0.16;
      } else {
        const pore = clamp((0.21 - cell.distance) / 0.16);
        const rim = clamp(1 - Math.abs(cell.distance - 0.24) * 15);
        const patina = clamp((broad - 0.57) * 3.2);
        r = 207 + medium * 24 + rim * 14 - pore * 85 - patina * 25;
        g = 146 + medium * 29 + rim * 20 - pore * 69 - patina * 22;
        b = 51 + medium * 18 + rim * 14 - pore * 33 - patina * 7;
        height = medium * 0.12 + grain * 0.08 + rim * 0.13 - pore * 0.37;
        rough = 0.4 + pore * 0.35 + patina * 0.17 + grain * 0.07;
      }

      // Shared alien-ocean finish: cyan glacial depth, indigo sediment, waxy
      // living tissue and wet mineral highlights. Reuse existing fields/maps.
      if (kind === "ice") { r -= 12 * (1 - broad); g += 5; b += 8; rough *= .86; }
      else if (kind === "silt" || kind === "sand") {
        const film = clamp((broad - .48) * 2) * medium;
        r -= film * 32; g += film * 10; b += film * 28;
        rough -= film * .12;
      } else if (kind === "blueKelp") { r *= .82; g += medium * 16; b += broad * 19; rough *= .7; }
      else if (kind === "greenLeaves" || kind === "purpleNeedles" || kind === "chitin") rough *= .8;
      else if (kind === "rock") rough -= clamp((medium - .5) * 2) * .16;

      const index = (y * size + x) * 4;
      color[index] = r;
      color[index + 1] = g;
      color[index + 2] = b;
      color[index + 3] = 255;
      const roughByte = clamp(rough) * 255;
      roughness[index] = roughByte;
      roughness[index + 1] = roughByte;
      roughness[index + 2] = roughByte;
      roughness[index + 3] = 255;
      heights[y * size + x] = height;
    }
  }

  const sample = (x, y) => heights[wrap(y, period) * size + wrap(x, period)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx =
        (sample(x - 1, y) - sample(x + 1, y)) * period * heightMetres * 0.5;
      const ny =
        (sample(x, y - 1) - sample(x, y + 1)) * period * heightMetres * 0.5;
      const inverse = 1 / Math.hypot(nx, ny, 1);
      const index = (y * size + x) * 4;
      normal[index] = (nx * inverse * 0.5 + 0.5) * 255;
      normal[index + 1] = (ny * inverse * 0.5 + 0.5) * 255;
      normal[index + 2] = (inverse * 0.5 + 0.5) * 255;
      normal[index + 3] = 255;
    }
  }
  return { size, color, normal, roughness };
}

function dataTexture(bytes, size, color, anisotropy) {
  const texture = new THREE.DataTexture(bytes, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = anisotropy;
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** A reflection-only lighting texture, never the scene's visible background. */
function reflectionEnvironment() {
  const width = 256,
    height = 128;
  const bytes = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const sky = clamp((0.7 - v) / 0.5);
      const lightDistance = Math.min(
        Math.abs(u - 0.17),
        1 - Math.abs(u - 0.17),
      );
      const light = Math.exp(
        -((lightDistance * lightDistance) / 0.003 + (v - 0.31) ** 2 / 0.013),
      );
      const fillDistance = Math.min(Math.abs(u - 0.64), 1 - Math.abs(u - 0.64));
      const fill = Math.exp(
        -((fillDistance * fillDistance) / 0.012 + (v - 0.43) ** 2 / 0.025),
      );
      const index = (y * width + x) * 4;
      bytes[index] = clamp(0.12 + sky * 0.53 + light * 0.5 + fill * 0.25) * 255;
      bytes[index + 1] =
        clamp(0.2 + sky * 0.53 + light * 0.44 + fill * 0.23) * 255;
      bytes[index + 2] =
        clamp(0.25 + sky * 0.51 + light * 0.32 + fill * 0.2) * 255;
      bytes[index + 3] = 255;
    }
  }
  const environment = new THREE.DataTexture(
    bytes,
    width,
    height,
    THREE.RGBAFormat,
  );
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.SRGBColorSpace;
  environment.magFilter = THREE.LinearFilter;
  environment.minFilter = THREE.LinearFilter;
  environment.needsUpdate = true;
  return environment;
}

/**
 * Matching PBR surfaces. Standard mesh UVs also work; world-projected UVs should use metres.
 * Ice preserves existing vertex-color depth bands. Sand supplies its own warm albedo.
 * DataTextures make generation available in Node tests as well as browsers, without image downloads.
 * @param {{maxAnisotropy?:number,resolution?:number}} [options]
 */
export function createMaterials({ maxAnisotropy = 4, resolution = 512 } = {}) {
  if (!Number.isInteger(resolution) || resolution < 32 || resolution > 1024)
    throw new RangeError(
      "Material resolution must be an integer between 32 and 1024 pixels.",
    );
  const anisotropy = clamp(
    Number.isFinite(maxAnisotropy) ? maxAnisotropy : 4,
    1,
    8,
  );
  const textures = new Set();
  const library = {};
  const definitions = {
    snow: { roughness: 0.88, metalness: 0.015, normal: 0.65 },
    ice: { roughness: 0.44, metalness: 0.08, normal: 0.65, vertexColors: true },
    sand: { roughness: 0.96, metalness: 0, normal: 0.8 },
    rock: { roughness: 0.88, metalness: 0.04, normal: 0.85 },
    whiteMetal: { roughness: 0.6, metalness: 0.25, normal: 0.55 },
    orangeMetal: { roughness: 0.62, metalness: 0.25, normal: 0.55 },
    darkMetal: { roughness: 0.5, metalness: 0.68, normal: 0.6 },
    chitin: { roughness: 0.56, metalness: 0.15, normal: 0.7 },
    goldCoral: { roughness: 0.57, metalness: 0.72, normal: 0.9 },
    bark: { roughness: 0.88, metalness: 0, normal: 0.85 },
    forestFloor: { roughness: 0.96, metalness: 0, normal: 0.8 },
    purpleNeedles: { roughness: 0.73, metalness: 0.025, normal: 0.45 },
    greenLeaves: { roughness: 0.64, metalness: 0, normal: 0.5 },
    moss: { roughness: 0.98, metalness: 0, normal: 0.55 },
    silt: { roughness: 0.97, metalness: 0, normal: 0.65 },
    blueKelp: { roughness: 0.7, metalness: 0, normal: 0.42 },
  };
  for (const [index, kind] of TEXTURE_KINDS.entries()) {
    const size = ["snow", "ice", "sand", "silt"].includes(kind)
      ? resolution
      : Math.max(32, Math.floor(resolution / 2));
    const pixels = buildTexturePixels(kind, size, 731 + index * 79);
    const map = dataTexture(pixels.color, size, true, anisotropy);
    const normalMap = dataTexture(pixels.normal, size, false, anisotropy);
    const roughnessMap = dataTexture(pixels.roughness, size, false, anisotropy);
    [map, normalMap, roughnessMap].forEach((texture) => textures.add(texture));
    const definition = definitions[kind];
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map,
      normalMap,
      normalScale: new THREE.Vector2(definition.normal, definition.normal),
      roughnessMap,
      roughness: definition.roughness,
      metalness: definition.metalness,
      vertexColors: Boolean(definition.vertexColors),
      flatShading: !['blueKelp','purpleNeedles','greenLeaves','moss','bark','chitin','goldCoral'].includes(kind),
      envMapIntensity: kind === "goldCoral" ? 1.35 : 0.65,
    });
    material.name = `croba-${kind}`;
    if (["blueKelp", "purpleNeedles", "greenLeaves"].includes(kind)) {
      material.emissive.setHex(kind === "blueKelp" ? 0x18b8d8 : kind === "purpleNeedles" ? 0x7d31c9 : 0x286e38);
      material.emissiveMap = map;
      material.emissiveIntensity = kind === "blueKelp" ? .10 : .07;
    }
    material.userData.textureMetres = 1;
    if(kind==='ice'||kind==='snow')material.userData.glacialRole=kind;
    library[kind] = material;
  }
  library.coralTips = new THREE.MeshStandardMaterial({
    color: 0xffdb9a,
    metalness: 0.56,
    roughness: 0.53,
    normalMap: library.goldCoral.normalMap,
    roughnessMap: library.goldCoral.roughnessMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    emissive: 0x301600,
    emissiveIntensity: 0.12,
    flatShading: true,
    envMapIntensity: 1.2,
  });
  library.coralTips.name = "croba-coralTips";
  library.eyeGlow = new THREE.MeshStandardMaterial({
    color: 0x9cfff0,
    emissive: 0x53f6df,
    emissiveIntensity: 2.1,
    roughness: 0.18,
    metalness: 0.1,
  });
  library.eyeGlow.name = "croba-eyeGlow";
  library.glass = new THREE.MeshPhysicalMaterial({
    color: 0x39788e,
    metalness: 0.03,
    roughness: 0.12,
    transmission: 0.15,
    thickness: 0.1,
    transparent: true,
    opacity: 0.85,
    envMapIntensity: 1.4,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  });
  library.glass.name = "croba-glass";
  library.environment = reflectionEnvironment();
  textures.add(library.environment);
  let disposed = false;
  library.dispose = () => {
    if (disposed) return;
    disposed = true;
    Object.values(library).forEach((entry) => {
      if (entry?.isMaterial) entry.dispose();
    });
    textures.forEach((texture) => texture.dispose());
  };
  return library;
}
