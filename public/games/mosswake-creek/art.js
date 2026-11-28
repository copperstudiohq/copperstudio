import { WIDTH, HEIGHT, VIEW_WIDTH, WORLD_AREAS, START_VIEW, POND_LEVEL, EMPTY, COPPER, SAND, WATER, ICHOR, BASALT, EMBER, PATINA, ROCK, GRASS, WEATHER, SCENERY, BOSSES, CREEK_HUTS, TERROR_SEGMENTS, bossPosition, quarryHeight, pixelNoise, makeRandom, triCoreScale, isLiquid, isSolid } from './simulation.js';
import { SpriteChipper } from './breakage.js';

const SIZE = WIDTH * HEIGHT;
const SKY = new Uint8ClampedArray(SIZE * 4);
const TERRAIN = new Uint32Array(SIZE);
const ATMOSPHERE = new Uint32Array(SIZE);
const RIDGE_PIXELS = new Uint8Array(SIZE);
const TRI_BIRCH_ROOT = new Int32Array(SIZE);
const TRI_BIRCH_COLOR = new Uint32Array(SIZE);
const BIRCH_PIXELS = new Uint8Array(SIZE);
const DISTANT_BIRCH = new Uint32Array(SIZE);
const LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
const RIDGES = [
  { points: [[0, 93], [32, 76], [52, 81], [78, 59], [99, 49], [113, 54], [139, 77], [161, 73], [190, 92], [212, 90], [239, 70], [260, 72], [285, 49], [298, 55], [327, 77], [357, 68], [384, 77]], color: [48, 59, 72] },
  { points: [[0, 85], [27, 81], [51, 93], [77, 91], [96, 78], [116, 77], [135, 67], [154, 79], [171, 84], [195, 106], [223, 100], [238, 85], [255, 92], [288, 80], [313, 59], [340, 69], [366, 87], [384, 79]], color: [38, 47, 60] },
  { points: [[0, 86], [43, 91], [59, 98], [87, 96], [109, 104], [144, 104], [167, 110], [188, 107], [219, 118], [241, 107], [265, 102], [282, 98], [313, 94], [343, 84], [384, 84]], color: [29, 40, 50] }
];
const CLOUDS = [
  [28, 17, 79, 15], [116, 14, 104, 16], [215, 26, 65, 11],
  [310, 15, 91, 17], [367, 27, 69, 14], [159, 44, 69, 9], [269, 42, 52, 8]
];
const PALETTES = {
  [COPPER]: [[124, 64, 44], [175, 91, 57], [202, 116, 72], [230, 146, 93], [251, 174, 116]],
  [SAND]: [[133, 92, 53], [175, 130, 75], [194, 148, 89], [219, 171, 106], [228, 186, 123]],
  [BASALT]: [[42, 42, 53], [54, 54, 65], [60, 59, 70], [71, 70, 82], [90, 85, 94]],
  [EMBER]: [[148, 55, 34], [201, 74, 43], [252, 126, 59], [255, 160, 66], [255, 211, 123]],
  [PATINA]: [[42, 84, 74], [57, 120, 103], [75, 154, 127], [99, 177, 143], [131, 193, 155]],
  [ROCK]: [[45, 30, 31], [58, 38, 36], [74, 48, 42], [94, 61, 49], [121, 79, 59]],
  [GRASS]: [[41, 52, 34], [57, 73, 44], [73, 95, 54], [88, 111, 61], [113, 135, 75]],
  [ICHOR]: [[155, 87, 80], [177, 107, 95], [206, 140, 124], [220, 161, 143], [255, 224, 198]]
};
const DECORATIONS = [
  ...CREEK_HUTS.map((x) => ({ x, type: 'hut' })),
  { x: 253, type: 'posts' },
  { x: VIEW_WIDTH + 164, type: 'houses' },
  { x: START_VIEW + 62, type: 'houses' },
  { x: START_VIEW + 101, type: 'posts' }, { x: START_VIEW + 351, type: 'posts' },
  { x: 4 * VIEW_WIDTH + 90, type: 'posts' }, { x: 4 * VIEW_WIDTH + 291, type: 'houses' }
];
const POND_DOCK = { type: 'dock', x: START_VIEW + 258, y: 128 };
const TRI_IRIS = '#e89147';
const rainRandom = makeRandom(23691);
const streaks = Array.from({ length: WEATHER.storm * WORLD_AREAS.length }, () => ({
  x: rainRandom() * WIDTH, y: rainRandom() * HEIGHT, speed: 1.7 + rainRandom() * 3.8, length: 2 + rainRandom() * 7,
  light: rainRandom()
}));

function rgb(r, g, b) {
  return LITTLE_ENDIAN ? (255 << 24) | (b << 16) | (g << 8) | r : (r << 24) | (g << 16) | (b << 8) | 255;
}

function channels(color) {
  return LITTLE_ENDIAN ? [color & 255, (color >>> 8) & 255, (color >>> 16) & 255]
    : [(color >>> 24) & 255, (color >>> 16) & 255, (color >>> 8) & 255];
}

function triPigment(r, g, b) {
  const light = (3 * r + 5 * g + 2 * b) / 10;
  return [Math.min(255, 34 + 1.28 * light) | 0, (11 + 0.57 * light) | 0, (43 + 0.95 * light) | 0];
}

function ridgeAt(points, x, layer) {
  const localX = x % VIEW_WIDTH;
  const index = Math.max(1, points.findIndex(([edge]) => edge >= localX));
  const [x0, y0] = points[index - 1];
  const [x1, y1] = points[index];
  const crags = (pixelNoise(Math.floor(x / 3), layer * 11 + 2) - 0.5) * 2.5;
  const seam = (points.at(-1)[1] - points[0][1]) * localX / VIEW_WIDTH;
  return y0 + (y1 - y0) * (localX - x0) / (x1 - x0) - seam + crags + Math.sin(x * 0.012 + layer) * 5;
}

function ink(x, y, color, root = 0, triColor = 0) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const pixel = y * WIDTH + x;
  const i = pixel * 4;
  SKY[i] = color[0];
  SKY[i + 1] = color[1];
  SKY[i + 2] = color[2];
  BIRCH_PIXELS[pixel] = 1;
  TRI_BIRCH_ROOT[pixel] = root;
  TRI_BIRCH_COLOR[pixel] = triColor;
}

function inkDistantBirch(x, y, color, root, triColor) {
  ink(x, y, color, root, triColor);
  if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) DISTANT_BIRCH[y * WIDTH + x] = rgb(...color);
}

function drawBirch(x, ground, height, seed, near, copper, plot = ink) {
  const crown = ground - height;
  const lean = seed % 2 ? 1 : -1;
  const width = near ? 2 + Number(height > 38) : 1;
  const trunk = near ? [149, 152, 137] : [86, 106, 108];
  const shade = near ? [106, 112, 107] : [64, 84, 89];
  const bark = near ? [55, 65, 62] : [48, 67, 73];
  for (let y = crown; y <= ground; y++) {
    const offset = Math.round((ground - y) * lean / 14);
    const scar = pixelNoise(seed, y) > 0.72;
    for (let dx = 0; dx < width; dx++) {
      plot(x + dx + offset, y, scar && dx < width - Number(y % 3 === 1) ? bark : dx === 0 ? shade : trunk);
    }
  }
  for (const side of [-1, 1]) {
    const spread = 5 + (seed + side * 2) % 6;
    const base = crown + Math.round(height * (side === 1 ? 0.53 : 0.42));
    for (let step = 1; step <= spread; step++) {
      plot(x + lean + side * step, base - Math.ceil(step * 0.86), step < 4 ? shade : bark);
    }
  }

  const foliage = near && copper
    ? [[44, 45, 39], [58, 53, 41], [75, 65, 45], [96, 77, 51], [113, 89, 53]]
    : near
    ? [[30, 48, 44], [37, 58, 48], [46, 69, 54], [60, 81, 60], [74, 94, 69]]
    : [[30, 48, 49], [35, 54, 53], [41, 61, 58], [48, 68, 63], [55, 76, 68]];
  const triFoliage = near
    ? [rgb(73, 28, 65), rgb(102, 36, 85), rgb(135, 46, 105), rgb(161, 64, 127), rgb(184, 77, 143)]
    : [rgb(63, 35, 61), rgb(75, 40, 72), rgb(91, 44, 84), rgb(111, 50, 95), rgb(123, 55, 105)];
  const root = ground * WIDTH + x + 1;
  const reach = Math.max(5, Math.round(height * 0.23));
  const clumps = [
    [x + lean * 3, crown + 2, reach - 1, 5],
    [x - 5, crown + 7, reach, 6],
    [x + 6, crown + 9, reach, 5],
    [x, crown + 12, reach, 6]
  ];
  for (const [cx, cy, rx, ry] of clumps) {
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let px = cx - rx; px <= cx + rx; px++) {
        const contour = ((px - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        const cluster = pixelNoise(Math.floor(px / 3) + seed, Math.floor(y / 2));
        const detail = pixelNoise(px + seed, y);
        if (contour + cluster * 0.53 > 1.12 || detail < 0.08) continue;
        const light = Math.min(4, Math.floor(cluster * 3 + detail + Number(y < cy)));
        plot(px, y, foliage[light], root, triFoliage[light]);
      }
    }
  }
}

function drawGroves() {
  const random = makeRandom(148971);
  const distant = [7, 22, 36, 49, 64, 75, 90, 103, 122, 132, 150, 162, 177, 192, 207, 226, 242, 257, 274, 288, 298, 322, 337, 349, 363, 378];
  const banks = [11, 24, 38, 54, 77, 91, 116, 265, 279, 293, 330, 344, 362, 377];
  for (let area = 0; area < WORLD_AREAS.length; area++) {
    const start = area * VIEW_WIDTH;
    for (const localX of distant) {
      const x = start + localX;
      const ground = Math.round(84 + Math.sin(x * 0.016) * 24 + random() * 10);
      drawBirch(x, ground, 16 + Math.floor(random() * 17), x, false, false, inkDistantBirch);
    }
    const grove = start === START_VIEW ? banks : distant.filter((_, index) => (index + area) % (area === 0 ? 2 : 3) === 0);
    for (const localX of grove) {
      const x = start + localX;
      const height = 27 + Math.floor(random() * (area === 0 ? 25 : 19));
      drawBirch(x, quarryHeight(x) + 3, height, x, true, area === 1 || area === 4);
    }
  }
}

function makeBackdrop() {
  for (let x = 0; x < WIDTH; x++) {
    const ridges = RIDGES.map(({ points }, layer) => ridgeAt(points, x, layer));
    const ground = quarryHeight(x);
    for (let y = 0; y < HEIGHT; y++) {
      const i = y * WIDTH + x;
      const grain = pixelNoise(x, y);
      const horizon = Math.max(0, 1 - Math.abs(y - 65) / 76);
      const localX = x % VIEW_WIDTH;
      const glow = horizon * (0.76 + Math.cos(x * 0.012) * 0.19);
      let r = 20 + glow * 32 + grain * 2;
      let g = 28 + glow * 35 + grain * 2;
      let b = 39 + glow * 39 + grain * 2;
      for (const [cx, cy, rx, ry] of CLOUDS) {
        const dx = (localX - cx) / rx;
        const edge = Math.sin(x * 0.132 + cx) * 0.22 + (pixelNoise((x / 5) | 0, cy) - 0.5) * 0.22;
        const distance = dx * dx + Math.pow((y - cy) / (y > cy ? ry * 0.8 : ry), 2) + edge;
        if (distance < 1) {
          const shade = (1 - distance) * 5 + (y > cy ? 3 : 0);
          r -= shade;
          g -= shade + 2;
          b -= shade + 3;
        } else if (distance < 1.25 && y > cy) {
          r += 3;
          g += 3;
          b += 4;
        }
      }
      ATMOSPHERE[i] = rgb(r | 0, g | 0, b | 0);
      for (let layer = 0; layer < ridges.length; layer++) {
        const depth = y - ridges[layer];
        if (depth < 0) continue;
        RIDGE_PIXELS[i] = 1;
        const color = RIDGES[layer].color;
        const ridgeLight = Math.max(0, 6 - depth * 0.55);
        const scarp = pixelNoise(Math.floor((x + y * (layer === 1 ? 0.8 : -0.6)) / 4), layer) * 6 + grain * 3;
        r = color[0] + ridgeLight + scarp;
        g = color[1] + ridgeLight + scarp;
        b = color[2] + ridgeLight + scarp;
      }
      SKY.set([r, g, b, 255], i * 4);

      const depth = y - ground;
      const contour = y + Math.sin(x * 0.026) * 10 + Math.sin(x * 0.103) * 2.7;
      const slab = pixelNoise(Math.floor((x + y * 0.65) / 8), Math.floor(contour / 4));
      const fissure = pixelNoise(Math.floor((x + y * 0.50) / 15), Math.floor(contour / 7)) > 0.87;
      const shade = Math.min(1, Math.max(0, depth / 70));
      const cap = depth <= 1 ? 33 : depth <= 4 ? 13 : 0;
      r = 55 - shade * 24 + slab * 24 + grain * 9 + cap;
      g = 37 - shade * 11 + slab * 12 + grain * 7 + cap * 0.55;
      b = 36 - shade * 4 + slab * 9 + grain * 6 + cap * 0.32;
      if (fissure) { r -= 12; g -= 6; b -= 4; }

      const band = Math.abs((contour + x * 0.07 + 28) % 29 - 14);
      const pocket = pixelNoise(Math.floor(x / 14), Math.floor(contour / 27));
      if (depth > 2 && ((band < 1.2 + pocket * 2.7 && pocket > 0.34 && grain > 0.26) ||
          (depth < 9 && grain > 0.9))) {
        r += 24 + grain * 47;
        g += 9 + grain * 22;
        b += 4 + grain * 9;
      }
      if (depth > 8 && band < 1.6 && pocket > 0.68 && grain > 0.84) {
        r = 65 + grain * 15;
        g = 92 + grain * 21;
        b = 81 + grain * 23;
      }
      if (ground < POND_LEVEL - 1 && depth >= 0 && depth < 3 + Math.floor(slab * 3)) {
        const light = depth === 0 ? 24 : depth === 1 ? 12 : 0;
        r = 42 + slab * 19 + grain * 7 + light;
        g = 63 + slab * 23 + grain * 11 + light;
        b = 37 + slab * 9 + grain * 5 + light * 0.54;
      }
      TERRAIN[i] = rgb(r | 0, g | 0, b | 0);
    }
  }
}

makeBackdrop();
const bareSky = new Uint32Array(SKY.buffer).slice();
drawGroves();
const FOREST_FOG_COLORS = [[14, 24, 32], [17, 28, 36], [20, 32, 40], [23, 35, 44]];
const watchForestBackdrop = new Uint32Array(SIZE);
for (let x = 0; x < WIDTH; x++) {
  const treeline = 50 + Math.sin(x * 0.027) * 7 + Math.sin(x * 0.1) * 4;
  for (let y = 0; y < HEIGHT; y++) {
    const index = y * WIDTH + x;
    const birch = DISTANT_BIRCH[index];
    const depth = Math.min(1, Math.max(0, (y - treeline) / 27));
    const blend = birch ? 0.35 + depth * 0.16 : 0.16 + depth * 0.5;
    const [r, g, b] = channels(birch || bareSky[index]);
    const bank = 0.5 + Math.sin(x * 0.068 + y * 0.11) * 0.23 + Math.sin(x * 0.019 - y * 0.2) * 0.17;
    const fleck = pixelNoise(x + 73, y + 17);
    const tone = Math.floor((bank * 0.88 + fleck * 0.12) * FOREST_FOG_COLORS.length);
    const [fr, fg, fb] = FOREST_FOG_COLORS[tone];
    watchForestBackdrop[index] = rgb(
      Math.round(r + (fr - r) * blend),
      Math.round(g + (fg - g) * blend),
      Math.round(b + (fb - b) * blend),
    );
  }
}
const packedSky = new Uint32Array(SKY.buffer);
function tintSky(color) {
  const [r, g, b] = channels(color);
  return rgb(r + 13, (g * 0.84) | 0, b + 10);
}
const triSky = packedSky.map(tintSky);
const triBareSky = bareSky.map(tintSky);
const triAtmosphere = ATMOSPHERE.map(tintSky);

function treePixel(index, triMap) {
  const root = TRI_BIRCH_ROOT[index];
  return root && triMap[root - 1] ? TRI_BIRCH_COLOR[index] : triMap[index] ? triSky[index] : packedSky[index];
}

const triTerrain = TERRAIN.map((color, index) => {
  const x = index % WIDTH;
  const y = Math.floor(index / WIDTH);
  const grain = pixelNoise(x, y);
  const strata = y + Math.sin(x * 0.075) * 5 + Math.sin(x * 0.21) * 2.3;
  if (Math.abs(strata % 17 - 8) < 0.7 && grain > 0.22) {
    return grain > 0.8 ? rgb(87, 163, 231) : rgb(58, 107, 174);
  }
  return rgb(...triPigment(...channels(color)));
});
const particleColors = Object.fromEntries(Object.entries(PALETTES).map(([material, colors]) =>
  [material, colors.map(([r, g, b]) => rgb(r, g, b))]
));
const triParticleColors = Object.fromEntries(Object.entries(PALETTES).map(([material, colors]) =>
  [material, colors.map(([r, g, b]) => rgb(...triPigment(r, g, b)))]
));
const grainMap = Uint8Array.from({ length: SIZE }, (_, i) => (pixelNoise(i % WIDTH, (i / WIDTH) | 0) * 5) | 0);

function waterPixel(x, y, depth, tick, grain) {
  if (depth < 0) return rgb(55 + grain * 4, 88 + grain * 4, 103 + grain * 4);
  if (depth === 0) {
    const ripple = ((x * 11 + (tick >> 1) * 5 + y * 7) % 81) < 9;
    return ripple || (grain === 4 && x % 5 === 0) ? rgb(128, 178, 174) : rgb(72, 135, 143);
  }
  const shade = Math.min(depth, 29);
  const caustic = Math.sin(x * 0.14 + y * 0.29 + tick * 0.022) > 0.83 ? 8 : 0;
  return rgb((40 - shade / 2 + grain + caustic) | 0, 90 - shade + grain + caustic,
    108 - shade + grain + caustic);
}

function ichorPixel(x, y, depth, tick, grain) {
  if (depth < 0) return rgb(198 + grain * 5, 128 + grain * 5, 117 + grain * 5);
  const ripple = Math.sin(x * 0.18 + y * 0.19 - tick * 0.012);
  if (depth === 0) return ripple > 0.54 ? rgb(255, 224, 198) : rgb(233, 177, 158);
  const shade = Math.min(depth, 27);
  const gloss = depth < 5 && ripple > 0.67 ? 17 - depth * 2 : 0;
  return rgb(220 - shade * 2 + gloss, 161 - shade * 2 + gloss, 143 - shade + gloss);
}

const CANOPY_SHADE_FADE = 46;
const CANOPY_HAZE_STEP = 2;

function canopyShadeLevel(level, depth) {
  const progress = Math.min(1, Math.max(0, (depth + 1) / CANOPY_SHADE_FADE));
  return Math.round(level * progress ** 2 * (3 - 2 * progress));
}

function watchBackdropPixel(index, darkness) {
  const normal = DISTANT_BIRCH[index] || bareSky[index];
  if (!darkness) return normal;
  const forest = watchForestBackdrop[index];
  if (darkness === 255 || forest === normal) return forest;
  const [r, g, b] = channels(normal);
  const [fr, fg, fb] = channels(forest);
  const blend = darkness / 255;
  return rgb(
    Math.round(r + (fr - r) * blend),
    Math.round(g + (fg - g) * blend),
    Math.round(b + (fb - b) * blend),
  );
}

function paintTerrain(ctx, frame, quarry, left, distantBirchesOnly, canopyShade) {
  const { grid, tick, surface, triMap, placedTri } = quarry;
  const { pixels, liquidDepth } = frame;
  surface.fill(HEIGHT, left, left + VIEW_WIDTH);
  liquidDepth.fill(0);
  for (let y = 0; y < HEIGHT; y++) {
    const row = y * WIDTH;
    const screenRow = y * VIEW_WIDTH;
    for (let x = left; x < left + VIEW_WIDTH; x++) {
      const i = row + x;
      const j = screenRow + x - left;
      const material = grid[i];
      const grain = grainMap[i];
      const converted = triMap[i] !== 0 || placedTri[i] !== 0;
      const liquid = isLiquid(material);
      if (!liquid) liquidDepth[x] = 0;
      if (material !== EMPTY && material !== EMBER && !liquid && surface[x] === HEIGHT) surface[x] = y;
      if (material === EMPTY) {
        if (distantBirchesOnly) {
          const level = canopyShade?.strength[x];
          const belowCanopy = level && y >= canopyShade.top[x] && y < canopyShade.bottom[x];
          pixels[j] = watchBackdropPixel(i, belowCanopy ? canopyShadeLevel(level, y - canopyShade.top[x]) : 0);
        }
        else if (BIRCH_PIXELS[i] && !frame.birchCuts[i]) pixels[j] = treePixel(i, triMap);
        else if (frame.ridgeCuts[i]) pixels[j] = converted ? triAtmosphere[i] : ATMOSPHERE[i];
        else pixels[j] = converted ? triBareSky[i] : bareSky[i];
      } else if (material === ROCK) {
        pixels[j] = converted ? triTerrain[i] : TERRAIN[i];
        if (!converted && y >= POND_LEVEL && grid[i + 1] === EMPTY && x < WIDTH - 1 && grain > 1) {
          pixels[j] = rgb(87 + grain * 5, 51 + grain * 4, 45 + grain * 3);
        }
      } else if (liquid) {
        const connected = isLiquid(grid[i + WIDTH]) || liquidDepth[x] > 0
          || x > 0 && isLiquid(grid[i - 1]) || x < WIDTH - 1 && isLiquid(grid[i + 1]);
        if (connected && surface[x] === HEIGHT) surface[x] = y;
        const depth = connected ? liquidDepth[x]++ : -1;
        const color = material === ICHOR ? ichorPixel : waterPixel;
        pixels[j] = color(x, y, depth, tick, grain);
      } else {
        const shade = material === EMBER ? Math.min(4, (quarry.heat[i] >> 4) + grain % 2) : grain;
        pixels[j] = (converted ? triParticleColors : particleColors)[material][shade];
      }
    }
  }
  frame.basePixels.set(pixels);
  paintGroundDetails(frame, quarry, left);
  frame.visibleDebris.clear();
  for (const piece of quarry.debris) {
    if (piece.bornAt === tick) continue;
    const x = Math.floor(piece.x);
    const y = Math.floor(piece.y);
    if (x >= left && x < left + VIEW_WIDTH && y >= 0 && y < HEIGHT && !isSolid(quarry.at(x, y))) {
      const index = y * VIEW_WIDTH + x - left;
      pixels[index] = piece.color;
      frame.visibleDebris.set(index, piece);
    }
  }
  ctx.putImageData(frame.data, 0, 0);
}

const GROUND_COLORS = {
  normal: [rgb(82, 105, 70), rgb(117, 134, 91), rgb(142, 155, 104)],
  tri: [rgb(203, 82, 148), rgb(234, 128, 174), rgb(240, 149, 191)],
  fringe: [rgb(158, 58, 119), rgb(234, 113, 171), rgb(204, 82, 149), rgb(244, 151, 193), rgb(99, 179, 255)]
};

function paintGroundDetails(frame, quarry, left) {
  const { detailPixels, detailCuts, pixels } = frame;
  const right = left + VIEW_WIDTH;
  detailPixels.fill(0);
  const paint = (color, x, y, width, height) => {
    for (let row = Math.max(0, y); row < Math.min(HEIGHT, y + height); row++) {
      for (let col = Math.max(left, x); col < Math.min(right, x + width); col++) {
        if (detailCuts[row * WIDTH + col]) continue;
        const index = row * VIEW_WIDTH + col - left;
        pixels[index] = detailPixels[index] = color;
      }
    }
  };
  for (let x = Math.max(3, Math.floor(left / 3) * 3); x < Math.min(right, WIDTH - 3); x += 3) {
    const top = quarry.surface[x];
    const plantedGrass = quarry.at(x, top) === GRASS;
    const y = plantedGrass ? top : quarryHeight(x);
    const tuft = pixelNoise(x, 25);
    if (tuft > 0.34 && (plantedGrass || (y < POND_LEVEL - 1 && quarry.at(x, y) === ROCK))
        && quarry.at(x, y - 1) === EMPTY) {
      const converted = quarry.isTriAt(x, y) || quarry.placedTri[y * WIDTH + x];
      const colors = converted ? GROUND_COLORS.tri : GROUND_COLORS.normal;
      paint(colors[0], x, y - 1, 2, 1);
      if (tuft > 0.64) paint(colors[1], x + 1, y - 2, 1, 1);
      if (tuft > 0.88) paint(colors[2], x, y - 3, 1, 2);
    }
  }
  const colors = GROUND_COLORS.fringe;
  for (let x = left; x < right; x++) {
    const y = quarry.surface[x];
    const material = quarry.at(x, y);
    if ((material !== ROCK && material !== GRASS)
        || (!quarry.isTriAt(x, y) && !quarry.placedTri[y * WIDTH + x])) continue;
    const grain = pixelNoise(x, y);
    const vein = (x + 12 + Math.floor(Math.sin(x * 0.37) * 4)) % 17;
    paint(colors[0], x, y, 1, 2 + Number(grain > 0.55));
    paint(colors[grain > 0.5 ? 1 : 2], x, y - 1, 1, 2);
    if (grain > 0.66) paint(colors[3], x, y - 2, 1, 1);
    if (vein < 2) paint(colors[4], x, y - 1, 1, 2);
  }
}

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function sceneOval(ctx, color, x, y, rx, ry) {
  for (let row = -ry; row <= ry; row++) {
    const half = Math.round(rx * Math.sqrt(1 - (row / ry) ** 2));
    rect(ctx, color, x - half, y + row, half * 2 + 1, 1);
  }
}

export function sceneGlow(ctx, color, x, y, radius) {
  const glow = ctx.createRadialGradient(x, y, 1, x, y, radius);
  glow.addColorStop(0, color);
  glow.addColorStop(1, 'transparent');
  rect(ctx, glow, x - radius, y - radius, radius * 2, radius * 2);
}

const SCENE_STARS = Array.from({ length: 38 }, (_, index) => ({
  x: Math.floor(pixelNoise(index, 71) * VIEW_WIDTH),
  y: 7 + Math.floor(pixelNoise(index, 85) * 41),
  size: index % 7 === 0 ? 2 : 1
}));

const MOON_COLORS = ['#a4b6fa80', '#a2acd0', '#e0e5e9', '#b4bed4', '#bec6d8', '#a5b1d0'];
const BLOOD_MOON_COLORS = ['#f447598f', '#a83e57', '#ff9888', '#d75c65', '#df686c', '#b3445b'];

function sceneHaze(ctx, night, bloodMoon, arc, dayHorizon) {
  const haze = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  haze.addColorStop(0, night ? (bloodMoon ? '#3c142acf' : '#171639cf') : `rgba(90, 150, 163, ${0.24 + arc * 0.28})`);
  haze.addColorStop(0.37, night ? (bloodMoon ? '#7121378c' : '#30264b8c') : dayHorizon);
  haze.addColorStop(1, night ? (bloodMoon ? '#40183172' : '#1e143772') : '#643e3409');
  return haze;
}

function drawCanopyHaze(ctx, haze, forestHaze, { strength, top, bottom }, left) {
  const baseAlpha = ctx.globalAlpha;
  const drawHazeBand = (x, y, width, height, shade) => {
    if (shade < 255) {
      ctx.globalAlpha = baseAlpha * (1 - shade / 255);
      rect(ctx, haze, x, y, width, height);
    }
    if (shade > 0) {
      ctx.globalAlpha = baseAlpha * shade / 255;
      rect(ctx, forestHaze, x, y, width, height);
    }
  };
  ctx.save();
  for (let start = 0; start < VIEW_WIDTH;) {
    const column = left + start;
    const shade = strength[column];
    const upper = top[column];
    const lower = bottom[column];
    let end = start + 1;
    while (end < VIEW_WIDTH && strength[left + end] === shade
        && (!shade || top[left + end] === upper && bottom[left + end] === lower)) end++;
    const width = end - start;
    ctx.globalAlpha = baseAlpha;
    if (!shade || upper >= lower) {
      rect(ctx, haze, start, 0, width, HEIGHT);
    } else {
      rect(ctx, haze, start, 0, width, upper);
      rect(ctx, haze, start, lower, width, HEIGHT - lower);
      const fadeHeight = Math.min(CANOPY_SHADE_FADE - 1, lower - upper);
      for (let y = upper; y < upper + fadeHeight;) {
        const height = Math.min(CANOPY_HAZE_STEP - y % CANOPY_HAZE_STEP, upper + fadeHeight - y);
        const level = canopyShadeLevel(shade, y + (height - 1) / 2 - upper);
        drawHazeBand(start, y, width, height, level);
        y += height;
      }
      if (lower > upper + fadeHeight) {
        drawHazeBand(start, upper + fadeHeight, width, lower - upper - fadeHeight, shade);
      }
    }
    start = end;
  }
  ctx.restore();
}

export function drawSceneSky(ctx, night, progress, bloodMoon = false, { canopyShade, left = 0 } = {}) {
  const arc = Math.sin(progress * Math.PI);
  const x = Math.round(20 + progress * (VIEW_WIDTH - 40));
  const y = Math.round(42 - arc * 23);
  const haze = sceneHaze(ctx, night, bloodMoon, arc, `rgba(240, 153, 104, ${0.48 - arc * 0.26})`);
  if (!night && canopyShade) {
    const forestHaze = sceneHaze(ctx, false, false, arc, `rgba(118, 142, 152, ${0.18 - arc * 0.09})`);
    drawCanopyHaze(ctx, haze, forestHaze, canopyShade, left);
  } else rect(ctx, haze, 0, 0, VIEW_WIDTH, HEIGHT);
  if (night) {
    for (const star of SCENE_STARS) {
      rect(ctx, star.size === 2 ? '#b7c6dfcb' : '#9caad580', star.x, star.y, star.size, 1);
      if (star.size === 2) rect(ctx, '#a3a6d290', star.x, star.y - 1, 1, 3);
    }
    const [glow, rim, face, crater, basin, shade] = bloodMoon ? BLOOD_MOON_COLORS : MOON_COLORS;
    const radius = bloodMoon ? 15 : 11;
    sceneGlow(ctx, glow, x, y, bloodMoon ? 41 : 29);
    sceneOval(ctx, rim, x, y, radius, radius);
    sceneOval(ctx, face, x - 1, y - 1, radius - 2, radius - 2);
    rect(ctx, crater, x - 6, y - 4, 4, 3);
    rect(ctx, basin, x + 1, y + 2, 5, 3);
    rect(ctx, shade, x + 4, y - 5, 2, 2);
  } else {
    sceneGlow(ctx, '#ffba7eae', x, y, 38);
    sceneOval(ctx, '#f7ab71', x, y, 12, 12);
    sceneOval(ctx, '#ffd78f', x, y - 1, 10, 10);
    sceneOval(ctx, '#ffedba', x - 1, y - 2, 8, 8);
  }

  return x;
}

export function drawTriPortal(ctx, opening) {
  const rise = Math.round(10 * opening);
  rect(ctx, '#281e32', -25, -3, 51, 4);
  sceneOval(ctx, '#3c243c', -2, -13 - Math.round(rise / 2), 22, 13 + Math.floor(rise / 2));
  sceneOval(ctx, '#6d3458', -4, -15 - rise, 18, 15);
  sceneOval(ctx, '#8e4169', 7, -12, 16, 12);
  sceneOval(ctx, '#b75280', -7, -16 - rise, 14, 12);
  sceneOval(ctx, '#ce6894', 3, -22 - rise, 12, 7);
  sceneOval(ctx, '#773152', 12, -7, 10, 7);
  rect(ctx, '#df8ab1', -12, -27 - rise, 10, 2);
  rect(ctx, '#dd87ab', -15, -25 - rise, 4, 2);
  rect(ctx, '#9a4c79', -17, -17, 4, 8);
  rect(ctx, '#514777', -23, -7, 4, 5);
  rect(ctx, '#59669c', -19, -5, 6, 2);
  rect(ctx, '#6b6b9a', 14, -5, 5, 2);
  rect(ctx, '#8e80b2', 21, -3, 4, 2);

  const top = -17 - Math.round(opening * 5);
  const gape = 2 + Math.round(opening * 17);
  sceneOval(ctx, '#e579a4', 2, top, 19, gape + 2);
  sceneOval(ctx, '#8e325d', 2, top, 17, gape);
  sceneOval(ctx, '#25162e', 2, top, 15, Math.max(1, gape - 2));
  if (opening > 0.35) {
    const bottom = top + gape;
    sceneOval(ctx, '#55224e', 2, bottom - 6, 11, 4);
    rect(ctx, '#aa447a', -5, bottom - 5, 14, 2);
    for (const tooth of [-10, -4, 3, 10]) {
      const lift = Math.floor(Math.abs(tooth - 2) * gape / 36);
      const upper = top - gape + 2 + lift;
      const lower = bottom - 4 - lift;
      rect(ctx, '#f2b5bb', tooth, upper, 4, 3);
      rect(ctx, '#ffe1d6', tooth + 1, upper + 3, 2, 2);
      rect(ctx, '#dd929f', tooth + 1, lower, 3, 2);
      rect(ctx, '#ffc6c2', tooth + 2, lower - 1, 1, 2);
    }
  }
}

export function drawTriPortalAura(ctx, x, y, direction, opening, tick) {
  if (opening <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  sceneGlow(ctx, `rgba(216, 79, 148, ${opening * 0.55})`, 0, -22, 39);
  if (opening > 0.35) {
    const top = -17 - Math.round(opening * 5);
    for (let i = 0; i < 6; i++) {
      const age = (tick + i * 11) % 52;
      const driftX = Math.round(age * 0.75) - 7;
      const driftY = top + Math.round((pixelNoise(i, 87) - 0.5) * (9 + age * 0.4));
      rect(ctx, i % 2 ? '#e881b0bb' : '#89a0debb', driftX, driftY, age < 20 ? 2 : 1, 1);
    }
  }
  ctx.restore();
}

const triCssColors = new Map();

function sceneBrush(ctx, converted) {
  return (color, x, y, width, height) => {
    if (converted) {
      if (!triCssColors.has(color)) {
        const hex = Number.parseInt(color.slice(1), 16);
        const tint = triPigment(hex >>> 16, (hex >>> 8) & 255, hex & 255);
        triCssColors.set(color, `rgb(${tint.join(',')})`);
      }
      color = triCssColors.get(color);
    }
    rect(ctx, color, x, y, width, height);
  };
}

function drawPlacedBirch(paint, x, y) {
  paint('#5e6156', x - 2, y - 29, 5, 29);
  paint('#c0bda2', x - 1, y - 28, 3, 27);
  paint('#e0d8b6', x - 1, y - 27, 1, 24);
  for (let height = 5; height < 23; height += 5) {
    paint('#666358', x - 1 + height % 2, y - height, 2, 1);
  }
  paint('#898779', x + 2, y - 23, 6, 2);
  paint('#898779', x - 7, y - 19, 5, 2);
  paint('#2c403b', x - 13, y - 31, 27, 12);
  paint('#344c3e', x - 8, y - 35, 20, 15);
  paint('#547157', x - 5, y - 38, 11, 9);
  paint('#577357', x - 12, y - 31, 15, 7);
  paint('#6e8860', x - 9, y - 33, 7, 4);
  paint('#425d48', x + 2, y - 28, 12, 7);
  paint('#65805b', x + 4, y - 31, 6, 4);
  paint('#a49b70', x - 6, y - 31, 2, 2);
  paint('#898855', x + 7, y - 29, 3, 1);
}

function drawHut(ctx, paint, x, y, converted) {
  paint('#362c30', x - 19, y - 22, 39, 22);
  paint('#765742', x - 17, y - 20, 34, 18);
  paint('#9c7351', x - 16, y - 19, 26, 16);
  paint('#654638', x + 11, y - 20, 7, 18);
  for (let row = 0; row < 4; row++) {
    const boards = y - 17 + row * 4;
    paint('#614539', x - 16, boards, 33, 1);
    paint('#b98a5d', x - 16, boards + 1, 25, 1);
    paint('#78523c', x + ((row % 2) ? -5 : -12), boards + 1, 1, 3);
  }
  paint('#d3a571', x - 18, y - 21, 2, 19);
  paint('#c59666', x + 16, y - 21, 2, 19);
  paint('#5a4037', x - 12, y - 17, 11, 15);
  paint('#241f28', x - 10, y - 15, 7, 13);
  paint('#77533c', x - 9, y - 14, 5, 11);
  paint('#433131', x - 8, y - 14, 1, 11);
  paint('#d7a46c', x - 5, y - 8, 1, 2);
  paint('#463637', x + 3, y - 17, 12, 11);
  rect(ctx, converted ? '#8eb8e3' : '#f1bd78', x + 5, y - 15, 8, 7);
  rect(ctx, converted ? '#c6e0ef' : '#ffdda3', x + 5, y - 15, 7, 2);
  paint('#6d5246', x + 8, y - 15, 1, 7);
  paint('#6d5246', x + 5, y - 12, 8, 1);
  paint('#c4915a', x + 2, y - 7, 14, 2);

  paint('#47383a', x + 10, y - 34, 8, 11);
  paint('#826253', x + 11, y - 32, 5, 8);
  paint('#c29a78', x + 10, y - 34, 8, 2);
  paint('#513c3b', x + 11, y - 29, 6, 1);
  for (let course = 0; course < 6; course++) {
    const half = 7 + 3 * course;
    const top = y - 33 + course * 2;
    paint('#623b37', x - half, top, half * 2, 2);
    paint(course % 2 ? '#be7953' : '#d39261', x - half + 1, top, half * 2 - 2, 1);
    for (let seam = -half + 5; seam < half - 4; seam += 6) {
      paint('#9d603f', x + seam, top + 1, 1, 1);
    }
  }
  paint('#563b36', x - 24, y - 21, 48, 3);
  paint('#ab7952', x - 23, y - 21, 46, 1);
  paint('#503c38', x - 21, y - 3, 42, 3);
  paint('#cf9a63', x - 21, y - 3, 42, 1);
  paint('#916744', x - 13, y - 2, 14, 2);
}

const ROW_HOUSE_CENTERS = [-17, 0, 17];
const ROW_HOUSE_ROOF = [
  { inset: 5, slate: '#628789', highlight: '#7a9fa0' },
  { inset: 4, slate: '#51797e', highlight: '#658d91' },
  { inset: 2, slate: '#456d73', highlight: '#5b8387' },
  { inset: 1, slate: '#3f646b', highlight: '#52787d' }
];

const ROW_PINK_VINES = [
  { root: -22, rise: 19, lean: 3, bend: 0 },
  { root: -6, rise: 24, lean: -3, bend: 4 },
  { root: 9, rise: 15, lean: 4, bend: 1 },
  { root: 23, rise: 21, lean: -3, bend: 2 }
];
const ROW_PINK_CLUMPS = [
  [-27, -2, 3, 2], [-19, -4, 3, 2], [-11, -22, 3, 2, 0],
  [4, -1, 4, 2, 48], [13, -15, 3, 2], [21, -8, 3, 3, 95], [27, -3, 3, 3]
];
const ROW_HEARTBEAT_PERIOD = 48;
// The stronger beat leads, followed by a smaller beat and a resting interval.
const ROW_HEARTBEAT_SWELL = [0, 0.42, 0.8, 1, 0.95, 0.77, 0.52, 0.26, 0.1, 0,
  0, 0.22, 0.46, 0.72, 0.64, 0.51, 0.3, 0.13];

function rowBreathSwell(tick) {
  const phase = tick % 150;
  const inhaleEnd = 46;
  const exhaleEnd = 126;
  if (phase >= exhaleEnd) return 0;
  const progress = phase < inhaleEnd ? phase / inhaleEnd : (exhaleEnd - phase) / (exhaleEnd - inhaleEnd);
  return (1 - Math.cos(progress * Math.PI)) / 2;
}

function drawHouseGrowth(ctx, x, y, tick) {
  for (const { root, rise, lean, bend } of ROW_PINK_VINES) {
    for (let step = 0; step < rise; step++) {
      const vineX = x + root + Math.round(step / rise * lean + Math.sin((step + bend) / 2.6) * 2);
      const vineY = y - step - 2;
      rect(ctx, '#84375f', vineX, vineY, 2, 2);
      rect(ctx, '#c65d96', vineX, vineY, 1, 1);
      if ((step + bend) % 5 === 2) {
        const side = step % 2 ? 1 : -1;
        rect(ctx, '#ac477e', vineX + side * 2, vineY, 2, 1);
        rect(ctx, '#df81b5', vineX + side * 3, vineY - 1, 1, 1);
      }
    }
  }
  for (const [i, [dx, dy, rx, ry, breathOffset]] of ROW_PINK_CLUMPS.entries()) {
    const breathing = breathOffset !== undefined;
    const swell = breathing ? rowBreathSwell(tick + breathOffset)
      : ROW_HEARTBEAT_SWELL[(tick + i * 2) % ROW_HEARTBEAT_PERIOD] ?? 0;
    const lift = Math.round(swell * (breathing ? 2 : 1));
    const radiusX = rx + Math.round(1.6 * swell);
    const radiusY = ry + lift;
    const centerX = x + dx;
    const centerY = y + dy - lift;
    sceneOval(ctx, '#a14877', centerX, centerY, radiusX, radiusY);
    sceneOval(ctx, '#cb679a', centerX, centerY - 1, radiusX - 1, radiusY - 1);
    rect(ctx, '#e49ab9', centerX - 1, centerY - 1, 2, 1);
  }
}

function drawHouseRow(ctx, paint, x, y, converted, tick) {
  const { width, height } = SCENERY.houses;
  const left = x - width / 2;
  const wallLeft = left + 1;
  paint('#548e96', wallLeft, y - 16, width - 1, 16);
  paint('#42747e', wallLeft, y - 16, width - 1, 2);
  for (let board = 0; board < 5; board++) {
    const seamY = y - 13 + board * 3;
    paint('#477b86', wallLeft, seamY, width - 1, 1);
    for (let mark = 0; mark < 6; mark++) {
      const chipX = wallLeft + 1 + Math.floor(pixelNoise(board, mark) * (width - 5));
      const grain = mark % 3 === 0 ? '#6ca2a5' : '#5d9aa2';
      paint(grain, chipX, seamY - 1, 1 + mark % 3, 1);
    }
  }

  const glass = converted ? '#716d98' : '#56747a';
  const reflection = converted ? '#a4abc1' : '#8ea2a2';
  for (const [unit, offset] of ROW_HOUSE_CENTERS.entries()) {
    const front = x + offset;
    paint('#795a44', front - 2, y - 11, 5, 10);
    paint('#9a7456', front - 2, y - 11, 1, 8);
    paint('#6b503d', front, y - 11, 1, 10);
    paint('#906a50', front + 1, y - 11, 2, 10);
    paint('#ad8765', front + 2, y - 10, 1, 4);
    paint('#9d7758', front - 1, y - 7, 1, 4);
    paint('#c5a476', front + 1, y - 5, 1, 1);
    paint('#687d7a', front - 3, y - 1, 7, 1);
    for (const [side, pane] of [front - 7, front + 5].entries()) {
      rect(ctx, glass, pane, y - 10, 3, 4);
      rect(ctx, reflection, pane, y - 10, 2, 1);
      if ((side + unit) % 2 === 0) {
        paint('#826957', pane - 1, y - 9, 3, 1);
        paint('#947961', pane + 1, y - 10, 3, 1);
      } else {
        paint('#3d545b', pane + 1, y - 9, 2, 3);
        rect(ctx, reflection, pane + 1, y - 7, 1, 1);
      }
      paint('#678c91', pane - 1, y - 6, 5, 1);
    }
  }

  const ridge = y - height;
  for (const [course, { inset, slate, highlight }] of ROW_HOUSE_ROOF.entries()) {
    const start = left + inset;
    const end = left + width - inset;
    const tileY = ridge + course * 2;
    paint(slate, start, tileY, end - start, 2);
    for (let tile = start + (course % 2 ? 2 : 4); tile < end - 2; tile += 6) {
      paint(highlight, tile - 1, tileY, 3, 1);
      paint('#3d676d', tile - 2, tileY + 1, 1, 1);
    }
  }
  paint('#67989d', left, ridge + 8, width, 1);
  paint('#527e84', left, ridge + 9, width, 1);
  drawHouseGrowth(ctx, x, y, tick);
}

function drawScenery(ctx, type, x, y, converted, tick = 0) {
  const paint = sceneBrush(ctx, converted);
  if (type === 'birch') {
    drawPlacedBirch(paint, x, y);
  } else if (type === 'dock') {
    paint('#51403a', x - 9, y + 1, 4, 16);
    paint('#916a4a', x - 9, y + 2, 1, 12);
    paint('#5c463c', x + 6, y + 1, 4, 10);
    paint('#b07a4f', x + 6, y + 2, 1, 8);
    paint('#5a4138', x - 13, y + 4, 25, 2);
    paint('#7a533e', x - 13, y, 27, 3);
    paint('#b78453', x - 13, y - 1, 27, 1);
    for (let seam = -10; seam < 13; seam += 5) {
      paint('#4c3934', x + seam, y, 1, 2);
      paint('#b58450', x + seam + 2, y + 1, 1, 1);
    }
    for (let step = 0; step < 5; step++) {
      paint('#563d36', x + 11 + step * 2, y - 2 - step * 3, 4, 4);
      paint('#ba8556', x + 11 + step * 2, y - 3 - step * 3, 4, 1);
    }
  } else if (type === 'houses') {
    drawHouseRow(ctx, paint, x, y, converted, tick);
  } else if (type === 'hut') {
    drawHut(ctx, paint, x, y, converted);
  } else if (type === 'posts') {
    paint('#6f5140', x - 8, y - 7, 17, 2);
    paint('#946946', x - 8, y - 4, 17, 1);
    for (const offset of [-7, 5]) {
      paint('#513c35', x + offset, y - 10, 3, 10);
      paint('#af8056', x + offset, y - 9, 1, 8);
      paint('#d3ab79', x + offset + 1, y - 7, 1, 1);
    }
  }
}

function drawStructures(ctx, quarry, left, chipper, skipDecoration) {
  const right = left + VIEW_WIDTH;
  for (const decoration of DECORATIONS) {
    const { x, type } = decoration;
    const margin = type === 'houses' ? 33 : 30;
    if (x < left - margin || x >= right + margin || skipDecoration?.(decoration)) continue;
    const y = quarryHeight(x);
    if (quarry.at(x, y) !== ROCK || (type !== 'posts' && quarry.at(x - 3, y + 3) !== ROCK)) continue;
    const converted = quarry.isTriAt(x, y);
    chipper.draw(ctx, decoration, 0, x, y, 1, 1, (sprite) => drawScenery(sprite, type, 0, 0, converted, quarry.tick));
  }
  const bank = POND_DOCK.x + 22;
  if (bank >= left && bank - 34 < right && !skipDecoration?.(POND_DOCK)
      && quarry.at(bank, quarryHeight(bank)) === ROCK) {
    const { x, y, type } = POND_DOCK;
    const converted = quarry.isTriAt(x + 1, y);
    chipper.draw(ctx, POND_DOCK, 0, x, y, 1, 1, (sprite) => drawScenery(sprite, type, 0, 0, converted));
  }
  for (const item of quarry.scenery) {
    const { type, x, y } = item;
    const margin = type === 'houses' ? 33 : 30;
    if (x < left - margin || x >= right + margin) continue;
    const converted = item.converted || quarry.isTriAt(x, y);
    chipper.draw(ctx, item, 0, x, y, 1, 1, (sprite) => drawScenery(sprite, type, 0, 0, converted, quarry.tick));
  }
}

function drawRain(ctx, quarry, left) {
  const { tick, surface } = quarry;
  const total = WEATHER[quarry.weather] * WORLD_AREAS.length;
  for (let i = 0; i < total; i++) {
    const drop = streaks[i];
    const rawY = (drop.y + tick * drop.speed) % (HEIGHT + 12);
    const x = ((drop.x + rawY * 0.25) % WIDTH) | 0;
    if (x < left || x >= left + VIEW_WIDTH) continue;
    const y = rawY | 0;
    const limit = surface[x];
    if (y >= limit) {
      if (y < limit + 4 && i % 3 === 0 && limit < HEIGHT) {
        rect(ctx, '#8ca7b299', x - 1, limit - 1, 3, 1);
        rect(ctx, '#69818eb0', x, limit - 2, 1, 1);
      }
      continue;
    }
    const length = Math.min(drop.length, limit - y);
    ctx.strokeStyle = quarry.isTriAt(x, y) ? (drop.light > 0.76 ? '#eab1e2a0' : '#b588c950')
      : drop.light > 0.76 ? '#a6bfce92' : drop.light > 0.38 ? '#8da9bb5c' : '#7d94ac3a';
    ctx.lineWidth = 0.62;
    ctx.beginPath();
    ctx.moveTo(x - length * 0.27, y);
    ctx.lineTo(x, y + length);
    ctx.stroke();
  }
}

function drawTriCore(ctx, x, y, tick = 0) {
  rect(ctx, '#6d295e', x - 10, y - 4, 21, 4);
  rect(ctx, '#ac397c', x - 9, y - 6, 18, 5);
  rect(ctx, '#d65298', x - 7, y - 8, 14, 5);
  rect(ctx, '#f480b5', x - 5, y - 9, 9, 2);
  rect(ctx, '#dd65a3', x - 8, y - 13, 2, 7);
  rect(ctx, '#ea6daa', x - 1, y - 16, 2, 9);
  rect(ctx, '#c8478f', x + 6, y - 12, 2, 7);
  rect(ctx, '#60afff', x - 8, y - 4, 5, 1);
  rect(ctx, '#60afff', x - 4, y - 6, 2, 2);
  rect(ctx, '#72c6ff', x + 1, y - 7, 1, 4);
  rect(ctx, '#60afff', x + 2, y - 4, 6, 1);

  for (const [dx, dy, size] of [[-7, -13, 5], [0, -16, 7], [7, -12, 5]]) {
    const left = x + dx - (size >> 1);
    const top = y + dy - 2;
    if ((tick + Math.abs(dx) * 7) % 137 >= 131) {
      rect(ctx, '#f687b9', left, top + 2, size, 1);
      continue;
    }
    rect(ctx, '#8b316b', left - 1, top + 1, size + 2, 3);
    rect(ctx, '#ffd4dc', left, top, size, 5);
    rect(ctx, TRI_IRIS, x + dx - 1, top + 1, 3, 3);
    rect(ctx, '#281c44', x + dx, top + 2, 1, 2);
    rect(ctx, '#ffffff', x + dx - 1, top + 1, 1, 1);
  }
}

function drawTri(ctx, quarry, left, chipper) {
  for (const patch of quarry.triPatches) {
    if (patch.x < left - 22 || patch.x >= left + VIEW_WIDTH + 22) continue;
    const scale = triCoreScale(patch.radius);
    const tick = quarry.tick;
    chipper.draw(ctx, patch, 0, patch.x, patch.y, scale, scale, (sprite) => drawTriCore(sprite, 0, 0, tick));
  }
}

function watcherEye(ctx, x, y, size) {
  const half = size >> 1;
  rect(ctx, '#78375f', x - half - 1, y - half, size + 2, size);
  rect(ctx, '#ffd7cd', x - half, y - half, size, size);
  rect(ctx, TRI_IRIS, x - 1, y - half + 1, 3, size - 1);
  rect(ctx, '#321a35', x, y, 1, Math.max(1, half));
  rect(ctx, '#fff2d8', x - 1, y - 1, 1, 1);
}

function drawTriBlobEye(ctx, x, y) {
  rect(ctx, '#733458', x, y, 7, 8);
  rect(ctx, '#ffe3ec', x + 1, y + 1, 6, 6);
  rect(ctx, '#ffe3ec', x + 2, y, 4, 8);
  rect(ctx, TRI_IRIS, x + 4, y + 2, 3, 5);
  rect(ctx, '#291d3b', x + 5, y + 2, 2, 4);
  rect(ctx, '#fff6f9', x + 4, y + 2, 1, 1);
}

export function drawTriBlob(ctx, x, y, direction, stride) {
  const top = -11 + stride % 2;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(direction, 1);
  rect(ctx, '#783359', -8, -3, 17, 3);
  rect(ctx, '#b14983', -7, top + 4, 15, -top - 5);
  rect(ctx, '#d86ca2', -6, top + 2, 13, -top - 4);
  rect(ctx, '#f296bf', -4, top, 8, 3);
  rect(ctx, '#ee8ebd', -6, top + 3, 4, 3);
  rect(ctx, '#c76096', -6, -3, 11, 1);
  drawTriBlobEye(ctx, 0, top + 1);
  ctx.restore();
}

function drawOpusLeg(ctx, hip, phase, walking, near, groundOffset) {
  // During support, the foot moves backward relative to the advancing body.
  const progress = phase % 1;
  const swinging = walking && phase >= 1;
  const offset = walking ? Math.round(swinging ? -6 + progress * 12 : 6 - progress * 12) : 0;
  const foot = hip + offset;
  const lift = swinging ? Math.round(3 * Math.sin(progress * Math.PI)) : 0;
  const sole = (groundOffset?.(foot + 1) ?? 0) - lift;
  const knee = Math.round((hip + foot) / 2) + 1;
  const kneeY = Math.round((-9 + sole) / 2);
  const shade = near ? '#a94d71' : '#74334f';
  rect(ctx, shade, Math.min(hip, knee) - 1, -10, Math.abs(hip - knee) + 4, kneeY + 12);
  rect(ctx, shade, Math.min(knee, foot) - 1, kneeY, Math.abs(knee - foot) + 3, sole - kneeY);
  rect(ctx, near ? '#e283a3' : '#b35c7c', foot - 1, sole - 2, 6, 2);
  if (near) rect(ctx, '#f29ab4', foot + 2, sole - 2, 2, 1);
}

function drawOpusTentacle(ctx, x, y, length, phase, near) {
  const outline = near ? '#254e86' : '#253b66';
  const blue = near ? '#59aaf1' : '#4577b7';
  let tipY = y;
  for (let i = 0; i <= length; i++) {
    const progress = i / length;
    const thickness = 2 + Math.round(3 * (1 - progress));
    tipY = y + Math.round(progress * (7 + 4 * Math.sin(progress * 5 + phase)));
    rect(ctx, outline, x + i, tipY, 2, thickness);
    rect(ctx, blue, x + i, tipY + 1, 1, thickness - 1);
    if (near && i % 4 < 2) rect(ctx, '#a5e3fd', x + i, tipY + 1, 1, 1);
  }
  return tipY;
}

export function drawTriOpus(ctx, { stride, tick, walking = true, striking = false, groundOffset }) {
  const phase = (stride % 16) / 8;
  const sway = walking ? Math.round(3 * Math.cos(phase * Math.PI)) : 0;
  const bob = walking ? Math.round(Math.sin(phase * Math.PI) ** 2) : 0;
  ctx.save();
  drawOpusLeg(ctx, 1, (phase + 1) % 2, walking, false, groundOffset);
  drawOpusLeg(ctx, -4, phase, walking, true, groundOffset);
  ctx.translate(0, -bob);

  const curl = tick / 9 + stride / 16;
  drawOpusTentacle(ctx, 2, -13, 9 + sway, curl + Math.PI, false);
  rect(ctx, '#582641', -8, -15, 15, 7);
  rect(ctx, '#8f3b60', -7, -14, 13, 5);
  rect(ctx, '#c76188', -6, -16, 12, 6);
  rect(ctx, '#e18aa6', -6, -15, 5, 2);
  rect(ctx, '#f5aac2', -5, -15, 2, 1);

  // Blend the side edges into the skin and round only the upper-left corner.
  rect(ctx, '#b04d73', 1, -21, 9, 12);
  rect(ctx, '#b04d73', -1, -20, 12, 11);
  rect(ctx, '#b04d73', -2, -18, 13, 9);
  rect(ctx, '#d87196', 2, -20, 7, 7);
  rect(ctx, '#d87196', 1, -19, 8, 6);
  rect(ctx, '#e18cab', 5, -18, 8, 8);
  rect(ctx, '#f5aac2', 3, -20, 5, 1);
  rect(ctx, '#a94d71', 3, -12, 3, 1);
  rect(ctx, '#d47b9d', 8, -17, 5, 7);
  rect(ctx, '#893958', 8, -17, 5, 1);
  rect(ctx, '#ffe4ea', 8, -16, 4, 5);
  rect(ctx, TRI_IRIS, 9, -16, 3, 5);
  rect(ctx, '#2f2445', 11, -15, 2, 3);
  rect(ctx, '#fffaf2', 10, -16, 1, 1);

  const armX = -4;
  const armLength = striking ? 19 : 14 - sway;
  const tipY = drawOpusTentacle(ctx, armX, -13, armLength, striking ? -1 : curl, true);
  if (striking) {
    const tipX = armX + armLength;
    rect(ctx, '#9fe9ff', tipX + 1, tipY, 4, 2);
    rect(ctx, '#def8ff', tipX + 4, tipY + 1, 2, 4);
    rect(ctx, '#88b4ef', tipX + 5, tipY + 4, 3, 2);
  }
  ctx.restore();
}

function drawTriAnimal(ctx, type, x, y, stride, emergence) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, Math.max(0.08, emergence));
  const bob = stride % 2;
  if (type === 'opus') {
    drawTriOpus(ctx, { stride, tick: stride * 2 });
  } else if (type === 'blob') {
    drawTriBlob(ctx, 0, 0, 1, stride);
  } else if (type === 'brain') {
    const hover = Math.round(1.2 * Math.sin(stride * 0.7));
    ctx.translate(0, hover);
    for (const offset of [-6, -2, 2, 6]) {
      const sway = (offset > 0 ? 1 : -1) * bob;
      rect(ctx, '#405fbc', offset, -12, 2, 5);
      rect(ctx, '#62b5f6', offset + sway, -8, 2, 4 + bob);
      if (Math.abs(offset) === 6) watcherEye(ctx, offset + sway, -4 + bob, 3);
    }
    rect(ctx, '#863461', -9, -20, 19, 8);
    rect(ctx, '#cd5499', -9, -23, 18, 8);
    rect(ctx, '#ee8bb6', -7, -25, 14, 4);
    rect(ctx, '#a74584', -5, -23, 2, 6);
    rect(ctx, '#a74584', 5, -23, 2, 6);
    watcherEye(ctx, 0, -19, 7);
  } else {
    const rise = 7;
    for (const leg of [-5, -2, 2, 5]) {
      const step = leg % 2 === 0 ? bob : 1 - bob;
      const bend = leg < 0 ? -step : step;
      rect(ctx, '#4776cc', leg, -7, 2, 4);
      rect(ctx, '#71c9ff', leg + bend, -4, 2, 4 - step);
    }
    rect(ctx, '#9e3e79', -6, -5 - rise, 13, 5);
    rect(ctx, '#d75f9e', -5, -7 - rise, 11, 4);
    rect(ctx, '#f394be', -3, -8 - rise, 7, 2);
    rect(ctx, '#70bbff', -4, -3 - rise, 3, 1);
    watcherEye(ctx, 1, -5 - rise, 5);
  }
  ctx.restore();
}

function drawAnimal(ctx, type, x, y, direction = 1, stride = 0, wet = false, converted = false, emergence = 1) {
  if (type !== 'lizard' && type !== 'duck') {
    drawTriAnimal(ctx, type, x, y, stride, emergence);
    return;
  }
  const paint = sceneBrush(ctx, converted);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  if (type === 'lizard') {
    const tail = stride % 2;
    paint('#254a3f', -8, -2 - tail, 5, 1);
    paint('#467563', -5, -2, 11, 2);
    paint('#689580', -4, -3, 6, 1);
    paint('#b17455', -3, -4, 2, 1);
    paint('#b17455', 0, -4, 2, 1);
    paint('#73a68b', 2, -4, 4, 2);
    paint('#b8b784', 5, -2, 3, 1);
    paint('#efce79', 4, -4, 1, 1);
    if (!wet) {
      paint('#81a995', -2 + tail, 0, 2, 1);
      paint('#81a995', 2 - tail, 0, 2, 1);
    }
  } else if (type === 'duck') {
    const foot = stride % 2;
    paint('#a38f70', -6, -4, 3, 2);
    paint('#b7a98c', -4, -4, 9, 3);
    paint('#e7d9b5', -4, -5, 8, 2);
    paint('#f0e5c7', 1, -8, 5, 4);
    paint('#ddd0b3', 2, -9, 3, 1);
    paint('#393236', 4, -8, 1, 1);
    paint('#df9651', 5, -6, 3, 1);
    if (!wet) {
      paint('#cc9457', -2 + foot, -1, 2, 1);
      paint('#de9f56', 2 - foot, 0, 2, 1);
    }
  }
  if (converted) {
    const eye = type === 'duck' ? -9 : -6;
    rect(ctx, '#ffd2ee', 2, eye, 5, 3);
    rect(ctx, TRI_IRIS, 3, eye, 3, 3);
    rect(ctx, '#382251', 4, eye + 1, 1, 2);
    rect(ctx, '#73baff', -3, -4, 4, 1);
  }
  ctx.restore();
}

function drawCopperGiant(ctx, x, y, stride, direction, converted) {
  const paint = sceneBrush(ctx, converted);
  const swing = Math.round(Math.sin(stride * 0.76) * 3);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  for (const side of [-1, 1]) {
    const foot = side * swing;
    paint('#75412f', side * 10 - 6, -18 + foot, 12, 16 - foot);
    paint('#c48256', side * 10 - 6, -15 + foot, 10, 9);
    paint('#59353a', side * 10 - 8, -5 + Math.min(0, foot), 17, 5 - Math.min(0, foot));
    paint('#773e33', side * 24 - 6, -36 + foot, 12, 24);
    paint('#ce855b', side * 24 - 6, -24 + foot, 12, 12);
    paint('#9c553e', side * 24 - 7, -17 + foot, 14, 8);
    paint('#713b32', side * 19 - 7, -50, 14, 15);
    paint('#c87650', side * 19 - 6, -47, 11, 10);
    rect(ctx, converted ? '#77a6fb' : '#9ccab4', side * 19 - 6, -52, 12, 5);
  }
  paint('#7d3f38', -19, -41, 39, 24);
  paint('#ca7a51', -17, -38, 34, 15);
  paint('#e29a62', -12, -37, 24, 4);
  paint('#573940', -9, -32, 18, 9);
  rect(ctx, converted ? '#a48cfa' : '#73d2c0', -6, -30, 12, 5);
  paint('#9e523e', -8, -22, 16, 6);
  paint('#6f3836', -8, -56, 17, 17);
  paint('#d38a58', -8, -55, 17, 5);
  paint('#ba6c4a', -6, -46, 13, 7);
  rect(ctx, '#2b2634', -5, -50, 11, 5);
  rect(ctx, converted ? TRI_IRIS : '#ffdc82', 0, -51, 3, 8);
  ctx.restore();
}

function drawTerrorPart(ctx, x, y, index, direction) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  if (index === 0) {
    rect(ctx, '#793357', -12, -6, 25, 14);
    rect(ctx, '#cc578d', -11, -8, 23, 11);
    rect(ctx, '#eb8cb0', -8, -10, 17, 5);
    rect(ctx, '#6fb8f2', -13, -6, 5, 10);
    rect(ctx, '#542c49', 7, 1, 8, 5);
    rect(ctx, '#fac1b2', 8, 1, 4, 2);
    watcherEye(ctx, 4, -3, 9);
  } else {
    const size = index < 10 ? 7 : index < 19 ? 6 : 4;
    rect(ctx, '#883254', -size, -size + 1, size * 2, size * 2 - 2);
    rect(ctx, '#db699e', -size + 1, -size, size * 2 - 2, size + 2);
    rect(ctx, '#569bdf', -size, -size + 1, Math.max(3, size - 1), 4);
    rect(ctx, '#46366f', 0, -size - 2, 2, 3);
  }
  ctx.restore();
}

function drawSkyEye(ctx, x, y, age) {
  ctx.save();
  ctx.translate(x, y);
  for (const offset of [-15, -9, -3, 3, 9, 15]) {
    const length = 29 + Math.abs(offset);
    for (let dy = 11; dy < length; dy++) {
      const sway = Math.round(Math.sin(age * 0.034 + dy * 0.16 + offset * 0.31) * dy * 0.14);
      const width = dy < 25 ? 4 : dy < 34 ? 3 : 2;
      rect(ctx, '#3f58b6', offset + sway, dy, width, 1);
      rect(ctx, '#71c9ff', offset + sway + 1, dy, 1, 1);
    }
    rect(ctx, '#b94687', offset - 1, 11, 6, 6);
  }
  rect(ctx, '#87335e', -22, -11, 45, 24);
  rect(ctx, '#ca568b', -24, -7, 49, 16);
  rect(ctx, '#e988b2', -19, -15, 39, 25);
  rect(ctx, '#f3a6c3', -13, -19, 27, 8);
  rect(ctx, '#993e73', -17, 8, 34, 7);
  rect(ctx, '#63b8ff', -22, -6, 7, 2);
  rect(ctx, '#63b8ff', 16, 4, 6, 2);
  rect(ctx, '#ffe0cb', -17, -5, 34, 12);
  rect(ctx, '#ffe0cb', -11, -10, 22, 20);
  const glance = Math.round(Math.sin(age * 0.033) * 5);
  rect(ctx, TRI_IRIS, glance - 6, -9, 12, 18);
  rect(ctx, '#b8524a', glance - 3, -9, 6, 18);
  rect(ctx, '#392349', glance - 1, -7, 3, 14);
  rect(ctx, '#fff4db', glance - 4, -6, 3, 3);
  ctx.restore();
}

function drawBosses(ctx, quarry, left, chipper) {
  const right = left + VIEW_WIDTH;
  for (const boss of quarry.bosses) {
    if (boss.type === 'lake-terror') {
      for (let index = TERROR_SEGMENTS - 1; index >= 0; index--) {
        const { x, y, direction } = bossPosition(boss, quarry.tick, index);
        if (x >= left - 15 && x < right + 15 && !isSolid(quarry.at(x, y))) {
          chipper.draw(ctx, boss, index, x, y, direction, 1, (sprite) => drawTerrorPart(sprite, 0, 0, index, 1));
        }
      }
      continue;
    }
    const { x, y, direction } = bossPosition(boss, quarry.tick);
    if (x < left - 31 || x >= right + 31) continue;
    if (boss.type === 'copper-giant') {
      const stride = boss.stride;
      const converted = quarry.isTriAt(x, y);
      chipper.draw(ctx, boss, 0, x, y, direction, 1, (sprite) => drawCopperGiant(sprite, 0, 0, stride, 1, converted));
    } else {
      const age = quarry.tick - boss.bornAt;
      chipper.draw(ctx, boss, 0, x, y, 1, 1, (sprite) => drawSkyEye(sprite, 0, 0, age));
    }
  }
}

export class QuarryRenderer {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d', { alpha: false });
    if (!this.ctx) throw new Error('This browser could not initialize the quarry canvas.');
    this.ctx.imageSmoothingEnabled = false;
    this.data = this.ctx.createImageData(VIEW_WIDTH, HEIGHT);
    this.pixels = new Uint32Array(this.data.data.buffer);
    this.basePixels = new Uint32Array(this.pixels.length);
    this.detailPixels = new Uint32Array(this.pixels.length);
    this.detailCuts = new Uint8Array(SIZE);
    this.birchCuts = new Uint8Array(SIZE);
    this.ridgeCuts = new Uint8Array(SIZE);
    this.visibleDebris = new Map();
    this.liquidDepth = new Uint8Array(WIDTH);
    this.chipper = new SpriteChipper();
    this.frameTick = -1;
  }

  resetDamage() {
    this.chipper.reset();
    this.detailCuts.fill(0);
    this.birchCuts.fill(0);
    this.ridgeCuts.fill(0);
    this.visibleDebris.clear();
    this.frameTick = -1;
  }

  breakBrush(quarry, x, y, radius, left) {
    if (this.frameTick !== quarry.tick || this.left !== left) this.draw(quarry, null, left);
    const points = [];
    for (let row = Math.max(0, y - radius); row <= Math.min(HEIGHT - 1, y + radius); row++) {
      for (let col = Math.max(left, x - radius); col <= Math.min(left + VIEW_WIDTH - 1, x + radius); col++) {
        if ((col - x) ** 2 + (row - y) ** 2 <= radius * radius) points.push({ x: col, y: row, chipped: false });
      }
    }
    const broken = this.chipper.chip(points, (px, py, r, g, b) => quarry.shedPixel(px, py, rgb(r, g, b)));
    for (const point of points) {
      if (point.chipped) continue;
      const index = point.y * WIDTH + point.x;
      const screen = point.y * VIEW_WIDTH + point.x - left;
      const fragment = this.visibleDebris.get(screen);
      if (fragment) {
        this.visibleDebris.delete(screen);
        quarry.kickFragment(fragment);
      } else if (this.detailPixels[screen] && !this.detailCuts[index]) {
        this.detailCuts[index] = 1;
        quarry.shedPixel(point.x, point.y, this.detailPixels[screen]);
      } else if (quarry.clearPixel(point.x, point.y)) {
        quarry.shedPixel(point.x, point.y, this.basePixels[screen]);
      } else if (BIRCH_PIXELS[index] && !this.birchCuts[index]) {
        this.birchCuts[index] = 1;
        quarry.shedPixel(point.x, point.y, treePixel(index, quarry.triMap));
      } else if (RIDGE_PIXELS[index] && !this.ridgeCuts[index]) {
        this.ridgeCuts[index] = 1;
        quarry.shedPixel(point.x, point.y, quarry.triMap[index] ? triBareSky[index] : bareSky[index]);
      }
    }
    if (broken.size) {
      quarry.removeShattered((owner) => broken.has(owner)
        && this.chipper.isGone(owner, owner.type === 'lake-terror' ? TERROR_SEGMENTS : 1));
    }
  }

  draw(quarry, cursor, left, { skipDecoration, distantBirchesOnly = false, canopyShade } = {}) {
    const ctx = this.ctx;
    this.frameTick = quarry.tick;
    this.left = left;
    this.chipper.parts.length = 0;
    paintTerrain(ctx, this, quarry, left, distantBirchesOnly, canopyShade);
    if (quarry.skyMode !== 'day') drawSceneSky(ctx, quarry.night, quarry.skyProgress);
    ctx.save();
    ctx.translate(-left, 0);
    drawStructures(ctx, quarry, left, this.chipper, skipDecoration);
    const opening = quarry.portalOpening;
    for (const portal of quarry.portals) {
      const { x, y, direction } = portal;
      if (x < left - 40 || x >= left + VIEW_WIDTH + 40) continue;
      drawTriPortalAura(ctx, x, y, direction, opening, quarry.tick);
      this.chipper.draw(ctx, portal, 0, x, y, direction, 1, (sprite) => drawTriPortal(sprite, opening));
    }
    drawTri(ctx, quarry, left, this.chipper);
    for (const creature of quarry.creatures) {
      const margin = creature.type === 'opus' ? 17 : 12;
      if (creature.x < left - margin || creature.x >= left + VIEW_WIDTH + margin) continue;
      const stride = Math.floor(quarry.tick / (creature.type === 'opus' ? 2 : 5) + creature.phase);
      const duration = creature.readyAt - creature.bornAt;
      const emergence = duration ? Math.min(1, (quarry.tick - creature.bornAt) / duration) : 1;
      const { type, x, y, wet } = creature;
      const converted = creature.converted || quarry.isTriAt(x, y);
      const direction = type === 'ling' || type === 'brain' ? 1 : creature.direction;
      this.chipper.draw(ctx, creature, 0, x, y, direction, Math.max(0.08, emergence),
        (sprite) => drawAnimal(sprite, type, 0, 0, 1, stride, wet, converted));
    }
    drawBosses(ctx, quarry, left, this.chipper);
    drawRain(ctx, quarry, left);
    if (cursor) {
      ctx.beginPath();
      ctx.strokeStyle = '#1e1817';
      ctx.lineWidth = 1.6;
      if (cursor.radius === 0) ctx.rect(cursor.x - 0.5, cursor.y - 0.5, 2, 2);
      else ctx.arc(cursor.x + 0.5, cursor.y + 0.5, cursor.radius + 1.2, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.strokeStyle = '#ffe0c2';
      ctx.lineWidth = 0.75;
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawToolIcon(canvas, type, converted = false) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(canvas.width / 24, canvas.height / 24);
  if (type === 'brand') {
    rect(ctx, '#efad81', 7, 4, 12, 2);
    rect(ctx, '#e4956d', 4, 7, 13, 2);
    rect(ctx, '#f0ad82', 2, 10, 13, 2);
    rect(ctx, '#a65d46', 11, 14, 8, 2);
    rect(ctx, '#c77a59', 8, 17, 8, 2);
  } else if (type === 'lizard' || type === 'duck') {
    drawAnimal(ctx, type, 12, type === 'duck' ? 16 : 14, 1, 0, false, converted);
  } else if (type === 'blob' || type === 'ling' || type === 'brain') {
    ctx.translate(12, type === 'brain' ? 22 : 19);
    if (type === 'brain') ctx.scale(0.78, 0.78);
    drawTriAnimal(ctx, type, 0, 0, 0, 1);
  } else if (type === 'opus') {
    ctx.translate(12, 22);
    ctx.scale(0.6, 0.6);
    drawTriOpus(ctx, { stride: 0, tick: 0, walking: false });
  } else if (type === 'portal') {
    ctx.translate(12, 22);
    ctx.scale(0.42, 0.42);
    drawTriPortal(ctx, 1);
  } else if (Object.hasOwn(BOSSES, type)) {
    if (type === 'copper-giant') {
      ctx.translate(12, 22);
      ctx.scale(0.34, 0.34);
      drawCopperGiant(ctx, 0, 0, 0, 1, false);
    } else if (type === 'lake-terror') {
      ctx.translate(11, 12);
      ctx.scale(0.66, 0.66);
      drawTerrorPart(ctx, 0, 0, 0, 1);
    } else {
      ctx.translate(12, 8);
      ctx.scale(0.34, 0.34);
      drawSkyEye(ctx, 0, 0, 0);
    }
  } else if (Object.hasOwn(SCENERY, type)) {
    ctx.translate(type === 'dock' ? 10 : 12, type === 'dock' ? 12 : 21);
    const { width, height } = SCENERY[type];
    const scale = Math.min(0.69, 21 / width, 21 / height);
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;
    drawScenery(ctx, type, 0, 0, converted);
  } else if (type === 'tri') {
    ctx.translate(12, 20);
    ctx.scale(0.78, 0.78);
    drawTriCore(ctx, 0, 0);
  } else if (type === 'erase') {
    ctx.translate(12, 12);
    ctx.rotate(-Math.PI / 4);
    rect(ctx, '#d8c0bd', -6, -4, 12, 8);
    rect(ctx, '#946d73', -6, -4, 5, 8);
  } else if (type === 'break') {
    rect(ctx, '#ae734e', 6, 15, 3, 4);
    rect(ctx, '#ae734e', 8, 12, 3, 5);
    rect(ctx, '#c3a19a', 8, 9, 9, 3);
    rect(ctx, '#eed2b7', 10, 7, 6, 2);
    rect(ctx, '#eeaf80', 17, 8, 1, 2);
    rect(ctx, '#eeaf80', 19, 6, 1, 1);
  } else if (type === 'signal') {
    rect(ctx, '#69544a', 6, 18, 12, 2);
    rect(ctx, '#a47e60', 9, 11, 6, 8);
    rect(ctx, '#d1a77a', 7, 10, 10, 2);
    rect(ctx, '#4f897e', 8, 6, 8, 4);
    rect(ctx, '#8de2c3', 10, 4, 5, 6);
    rect(ctx, '#d9f1d3', 11, 3, 2, 6);
  } else if (type === 'rain') {
    for (const [x, y] of [[6, 9], [13, 5], [18, 12]]) {
      rect(ctx, '#86b9c7', x, y, 2, 5);
      rect(ctx, '#5687a0', x - 1, y + 4, 2, 3);
    }
  } else {
    const base = PALETTES[type] ?? [[35, 79, 97], [52, 113, 130], [72, 149, 163], [103, 181, 190], [143, 205, 208]];
    const colors = converted && type !== ICHOR ? base.map(([r, g, b]) => triPigment(r, g, b)) : base;
    const shape = isLiquid(type)
      ? ['.....2.....', '....232....', '...23332...', '..2343322..', '.234333322.', '.233333322.', '..2333322..', '...2222....']
      : type === GRASS ? ['..4....3...', '3.4.4.331.4', '33434343443', '22222222222', '.111111111.']
      : ['....443....', '..334432...', '.33432322..', '3432332211.', '33224222110', '22122211110', '.211111110.', '...10000...'];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        const value = shape[y][x];
        if (value !== '.') rect(ctx, `rgb(${colors[Number(value)].join(',')})`, x + 7, y + 8, 1, 1);
      }
    }
  }
  ctx.restore();
}
