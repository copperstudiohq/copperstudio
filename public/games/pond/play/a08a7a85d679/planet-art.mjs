import { rgb } from './colors.mjs';
import { clamp, noise, planetPalette, seededRandom, TERRAIN_H, TERRAIN_W } from './model.mjs';

const SKY_BLUE = [151, 215, 255];

const rgba = (color, opacity) => `rgba(${color.join(',')},${opacity})`;

export function atmosphereColor(planet) {
  return rgb(planetPalette(planet).water).map((channel, index) => Math.round(SKY_BLUE[index] * .64 + channel * .36));
}

export function drawAtmosphere(ctx, x, y, radius, color, strength) {
  const halo = ctx.createRadialGradient(x, y, radius * .93, x, y, radius * 1.19);
  halo.addColorStop(0, rgba(color, 0));
  halo.addColorStop(.26, rgba(color, strength * .62));
  halo.addColorStop(.48, rgba(color, strength * .27));
  halo.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(x - radius * 1.2, y - radius * 1.2, radius * 2.4, radius * 2.4);
}

export function shorelineMask(terrain) {
  const carved = Uint8Array.from(terrain, (height) => height < 0 ? 1 : 0);
  const mask = new Float32Array(carved.length);
  for (let row = 0; row < TERRAIN_H; row++) {
    const current = row * TERRAIN_W;
    const north = Math.max(0, row - 1) * TERRAIN_W;
    const south = Math.min(TERRAIN_H - 1, row + 1) * TERRAIN_W;
    for (let column = 0; column < TERRAIN_W; column++) {
      const west = column === 0 ? TERRAIN_W - 2 : column - 1;
      const east = column === TERRAIN_W - 1 ? 1 : column + 1;
      const sides = carved[current + west] + carved[current + east] + carved[north + column] + carved[south + column];
      const corners = carved[north + west] + carved[north + east] + carved[south + west] + carved[south + east];
      mask[current + column] = carved[current + column] * .52 + sides * .09 + corners * .03;
    }
  }
  return mask;
}

export function cloudTracks(seed) {
  const random = seededRandom(seed ^ 0xd1feb27c);
  return Array.from({ length: 8 }, (_, index) => ({
    x: (index + random() * .74) / 8,
    y: .22 + random() * .56,
    width: .30 + random() * .28,
    aspect: .34 + random() * .24,
    angle: (random() - .5) * .85,
    sprite: index % 3,
  }));
}

export function cloudSprite(seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const u = x / canvas.width * 2 - 1;
      const v = y / canvas.height * 2 - 1;
      const folds = noise(u * 3.3 + 2, v * 2.8 + 3, seed);
      const tangle = noise(u * 8.1, v * 8.6, seed + 90);
      const edge = u ** 2 + (v - .28 * Math.sin(u * 2.9)) ** 2 * 1.55;
      const opacity = clamp((.80 - edge + folds * .39 + tangle * .14) * 2.9, 0, 1);
      const shade = clamp((.4 - v) * .43 + folds * .18, 0, 1);
      const index = (y * canvas.width + x) * 4;
      image.data[index] = 180 + shade * 75;
      image.data[index + 1] = 207 + shade * 48;
      image.data[index + 2] = 231 + shade * 24;
      image.data[index + 3] = 255 * opacity * clamp((1 - Math.max(Math.abs(u), Math.abs(v))) * 6, 0, 1);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
