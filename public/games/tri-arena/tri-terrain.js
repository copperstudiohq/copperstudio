const DEFAULT_SEED = 0x5241494e;
const MAX_PIXELS = 4_000_000;
const FLESH = [
  [55, 21, 43], [65, 24, 51], [77, 28, 59], [91, 32, 68],
  [108, 36, 79], [128, 42, 92], [148, 48, 106], [169, 57, 121],
];
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function randomStream(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = Math.imul(seed ^ seed >>> 15, seed | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

/** Cache interpolation coordinates so the per-pixel loop only reads and blends values. */
function noiseLayer(width, height, columns, rows, random) {
  const values = new Float32Array((columns + 1) * (rows + 1));
  for (let i = 0; i < values.length; i++) values[i] = random();
  const xIndex = new Uint16Array(width), yIndex = new Uint32Array(height);
  const xBlend = new Float32Array(width), yBlend = new Float32Array(height);
  for (let x = 0; x < width; x++) {
    const position = x / width * columns, cell = Math.floor(position), fraction = position - cell;
    xIndex[x] = cell;
    xBlend[x] = fraction * fraction * (3 - 2 * fraction);
  }
  for (let y = 0; y < height; y++) {
    const position = y / height * rows, cell = Math.floor(position), fraction = position - cell;
    yIndex[y] = cell * (columns + 1);
    yBlend[y] = fraction * fraction * (3 - 2 * fraction);
  }
  return { values, stride: columns + 1, xIndex, yIndex, xBlend, yBlend };
}

function sample(layer, x, y) {
  const index = layer.yIndex[y] + layer.xIndex[x], horizontal = layer.xBlend[x];
  const top = layer.values[index] * (1 - horizontal) + layer.values[index + 1] * horizontal;
  const bottom = layer.values[index + layer.stride] * (1 - horizontal) + layer.values[index + layer.stride + 1] * horizontal;
  return top * (1 - layer.yBlend[y]) + bottom * layer.yBlend[y];
}

function bezier(curve, t) {
  const inverse = 1 - t, a = inverse ** 3, b = 3 * inverse * inverse * t, c = 3 * inverse * t * t, d = t ** 3;
  return [a * curve[0][0] + b * curve[1][0] + c * curve[2][0] + d * curve[3][0],
    a * curve[0][1] + b * curve[1][1] + c * curve[2][1] + d * curve[3][1]];
}

/**
 * One continuous, deterministic Tri infection surface for a 36-by-26-metre arena.
 * Maps are RGBA8; bump and roughness are greyscale, emissive lights only blue veins.
 * @param {{width?:number,height?:number,seed?:number}} options
 * @returns {{width:number,height:number,albedo:Uint8Array,bump:Uint8Array,roughness:Uint8Array,emissive:Uint8Array}}
 */
export function generateTriTerrain({ width = 1024, height = 768, seed = DEFAULT_SEED } = {}) {
  if (!Number.isInteger(width) || width < 1 || width > 2048
    || !Number.isInteger(height) || height < 1 || height > 2048) {
    throw new RangeError('Tri terrain width and height must be integers from 1 to 2048.');
  }
  if (width * height > MAX_PIXELS) throw new RangeError('Tri terrain exceeds the 4,000,000-pixel budget.');
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('Tri terrain seed must be an unsigned 32-bit integer.');

  const random = randomStream(seed);
  const albedo = new Uint8Array(width * height * 4), bump = new Uint8Array(albedo.length);
  const roughness = new Uint8Array(albedo.length), emissive = new Uint8Array(albedo.length);
  const broad = noiseLayer(width, height, 11, 8, random);
  const folds = noiseLayer(width, height, 31, 23, random);
  const tissue = noiseLayer(width, height, 91, 67, random);
  const scale = Math.min(width / 1024, height / 768);

  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const large = sample(broad, x, y), medium = sample(folds, x, y), small = sample(tissue, x, y);
    const lobe = clamp((large - .48) * 2.7 + (medium - .5) * .7, 0, 1);
    const ridge = Math.max(0, 1 - Math.abs(medium - .54) * 5);
    const tone = clamp(Math.floor((large * .47 + medium * .34 + small * .19) * 7 + lobe * 1.7), 0, 7);
    const color = FLESH[tone], index = (y * width + x) * 4;
    albedo[index] = color[0]; albedo[index + 1] = color[1]; albedo[index + 2] = color[2];
    const elevation = Math.round(89 + large * 39 + ridge * 35 + small * 15 + lobe * 19);
    bump[index] = bump[index + 1] = bump[index + 2] = elevation;
    const wetness = clamp((large * .65 + medium * .35 - .43) * 2.2, 0, 1);
    const grit = Math.round(212 - wetness * 88 + (small - .5) * 14);
    roughness[index] = roughness[index + 1] = roughness[index + 2] = grit;
    albedo[index + 3] = bump[index + 3] = roughness[index + 3] = emissive[index + 3] = 255;
  }

  function spot(cx, cy, radius, color, elevation, grit) {
    const left = Math.max(0, Math.floor(cx - radius)), right = Math.min(width - 1, Math.ceil(cx + radius));
    const top = Math.max(0, Math.floor(cy - radius)), bottom = Math.min(height - 1, Math.ceil(cy + radius));
    const squared = radius * radius;
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > squared) continue;
      const index = (y * width + x) * 4;
      albedo[index] = color[0]; albedo[index + 1] = color[1]; albedo[index + 2] = color[2];
      bump[index] = bump[index + 1] = bump[index + 2] = elevation;
      roughness[index] = roughness[index + 1] = roughness[index + 2] = grit;
    }
  }

  // Wrinkled seams follow long organic curves, with a raised pink edge beside the fissure.
  for (let seam = 0; seam < 74; seam++) {
    const x = random() * width, y = random() * height, angle = random() * Math.PI * 2;
    const length = (.025 + random() * .07) * width;
    const curve = [[x, y], [x + Math.cos(angle + .7) * length * .3, y + Math.sin(angle + .7) * length * .3],
      [x + Math.cos(angle - .5) * length * .65, y + Math.sin(angle - .5) * length * .65],
      [x + Math.cos(angle) * length, y + Math.sin(angle) * length]];
    const steps = Math.max(2, Math.ceil(length * 1.3));
    for (let step = 0; step <= steps; step++) {
      const [px, py] = bezier(curve, step / steps);
      spot(px + .7 * scale, py - .7 * scale, Math.max(.55, scale), [140, 54, 94], 185, 172);
      spot(px, py, Math.max(.5, .65 * scale), [48, 20, 39], 58, 198);
    }
  }
  // Pores cluster in damp tissue instead of becoming a layer of independent white noise.
  for (let pore = 0; pore < 2300; pore++) {
    const x = Math.floor(random() * width), y = Math.floor(random() * height);
    if (sample(folds, x, y) < .48) continue;
    const radius = Math.max(.48, (.55 + random() * .8) * scale);
    spot(x + radius * .25, y - radius * .45, radius * 1.3, [123, 48, 86], 178, 175);
    spot(x, y, radius, [57, 24, 48], 44 + Math.floor(random() * 23), 143);
  }
  // Occasional old copper scratches show through beneath the living skin.
  for (let scrape = 0; scrape < 25; scrape++) {
    const x = random() * width, y = random() * height, angle = random() * Math.PI;
    const length = (4 + random() * 11) * scale;
    for (let step = 0; step < length; step += .7) {
      spot(x + Math.cos(angle) * step, y + Math.sin(angle) * step,
        Math.max(.55, scale * (1.2 - step / Math.max(length, 1) * .6)), [135, 83, 57], 117, 204);
    }
  }

  const veinMask = new Uint8Array(width * height);
  function veinSpot(cx, cy, radius, filament) {
    const left = Math.max(0, Math.floor(cx - radius)), right = Math.min(width - 1, Math.ceil(cx + radius));
    const top = Math.max(0, Math.floor(cy - radius)), bottom = Math.min(height - 1, Math.ceil(cy + radius));
    const squared = radius * radius;
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      const distance = ((x - cx) ** 2 + (y - cy) ** 2) / squared;
      if (distance > 1) continue;
      const level = filament && distance < .026 ? 3 : distance < .45 ? 2 : 1;
      const pixel = y * width + x;
      if (veinMask[pixel] > level) continue;
      veinMask[pixel] = level;
      const index = pixel * 4;
      const color = level === 3 ? [101, 210, 234] : level === 2 ? [38, 125, 185] : [26, 43, 66];
      albedo[index] = color[0]; albedo[index + 1] = color[1]; albedo[index + 2] = color[2];
      const elevation = level === 1 ? 152 : level === 2 ? 186 : 201;
      bump[index] = bump[index + 1] = bump[index + 2] = elevation;
      roughness[index] = roughness[index + 1] = roughness[index + 2] = level === 1 ? 142 : 102;
      emissive[index] = level === 3 ? 12 : level === 2 ? 5 : 0;
      emissive[index + 1] = level === 3 ? 53 : level === 2 ? 23 : 0;
      emissive[index + 2] = level === 3 ? 74 : level === 2 ? 36 : 0;
    }
  }

  function vein(curve, radius, taper = .3) {
    const length = Math.hypot(curve[3][0] - curve[0][0], curve[3][1] - curve[0][1]);
    const steps = Math.max(4, Math.ceil(length * 1.9));
    for (let step = 0; step <= steps; step++) {
      const t = step / steps, point = bezier(curve, t);
      veinSpot(point[0], point[1], Math.max(.7, radius * (1 - taper * t)), radius > 1.4 && t % .14 < .105);
    }
  }

  const origin = [width * (.44 + random() * .12), height * (.46 + random() * .09)];
  const destinations = [[.03, .13], [.91, .02], [.99, .67], [.73, .99], [.01, .86]];
  for (const [endX, endY] of destinations) {
    const end = [endX * width, endY * height], dx = end[0] - origin[0], dy = end[1] - origin[1];
    const bend = (random() - .5) * .75;
    const curve = [origin, [origin[0] + dx * .25 - dy * bend, origin[1] + dy * .25 + dx * bend],
      [origin[0] + dx * .68 + dy * bend * .6, origin[1] + dy * .68 - dx * bend * .6], end];
    const radius = (2.9 + random() * 1.25) * scale;
    vein(curve, radius);
    for (const attachment of [.26, .49, .72]) {
      const start = bezier(curve, attachment), next = bezier(curve, attachment + .025);
      const angle = Math.atan2(next[1] - start[1], next[0] - start[0]) + (random() > .5 ? 1 : -1) * (.65 + random() * .55);
      const length = (.08 + random() * .13) * Math.min(width, height);
      const finish = [start[0] + Math.cos(angle) * length, start[1] + Math.sin(angle) * length];
      const branch = [start, [start[0] + Math.cos(angle - .4) * length * .28, start[1] + Math.sin(angle - .4) * length * .28],
        [finish[0] - Math.cos(angle + .5) * length * .3, finish[1] - Math.sin(angle + .5) * length * .3], finish];
      vein(branch, radius * .55, .62);
    }
  }
  return { width, height, albedo, bump, roughness, emissive };
}
