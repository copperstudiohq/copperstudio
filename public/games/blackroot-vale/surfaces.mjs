import * as T from './vendor/three.module.js';
import { seeded } from './layout.mjs';
import { loadTowerPaintings } from './tower-paintings.mjs';

const baseColors = {
  bark: [107, 89, 73],
  plaster: [176, 153, 123],
  timber: [114, 82, 59],
  slate: [78, 85, 92],
  forest: [104, 93, 69],
  cobble: [123, 116, 100],
  masonry: [136, 125, 113],
  barren: [101, 73, 51],
};

function solidTexture([r, g, b]) {
  return new T.DataTexture(new Uint8Array([r, g, b, 255]), 1, 1);
}

function fallbackSpruce() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.strokeStyle = '#415f39';
  context.lineWidth = 2;
  for (let i = 0; i < 91; i++) {
    const x = 10 + i * 2.56;
    const reach = 42 * (1 - i / 100) * (.69 + .31 * Math.sin(i * 1.9));
    const direction = i % 2 ? -1 : 1;
    context.beginPath();
    context.moveTo(x, 64);
    context.quadraticCurveTo(x + 14, 64 + reach * .6 * direction, x + 19, 64 + reach * direction);
    context.stroke();
  }
  return new T.CanvasTexture(canvas);
}

export async function loadSurfaces(renderer) {
  const loader = new T.TextureLoader();
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const paintings = loadTowerPaintings(loader, anisotropy);
  const entries = await Promise.all([...Object.keys(baseColors), 'spruce'].map(async (name) => {
    const url = new URL('./art/materials/' + name + '.webp', import.meta.url);
    let texture;
    try {
      texture = await loader.loadAsync(url.href);
    } catch (error) {
      console.warn('Blackroot Vale could not load the ' + name + ' texture.', error);
      texture = name === 'spruce' ? fallbackSpruce() : solidTexture(baseColors[name]);
    }
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    texture.needsUpdate = true;
    return [name, texture];
  }));
  return { ...Object.fromEntries(entries), paintings: await paintings };
}

export function repeatSurface(texture, x = 1, y = x) {
  const surface = texture.clone();
  surface.wrapS = surface.wrapT = T.RepeatWrapping;
  surface.repeat.set(x, y);
  surface.needsUpdate = true;
  return surface;
}

export function woolWeave() {
  const size = 128;
  const tau = 2 * Math.PI;
  const random = seeded(64721);
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const strand = (x + y) % 4 < 2 ? x : y;
      const value = 175 + 29 * Math.cos(tau * strand / 4)
        + 12 * Math.sin(x * tau / 32) * Math.cos(y * tau / 64) + 21 * random();
      pixels.set([value, value, value, 255], (y * size + x) * 4);
    }
  }
  const texture = new T.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
