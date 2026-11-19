import * as THREE from "./vendor/three.module.js";

export const MAX_DRAWING_BUFFER_PIXELS = 1_200_000;

const dimension = (value, fallback) => Number.isFinite(value) && value > 0 ? Math.max(1, value) : fallback;

/** Limit fill work independently of the screen's native pixel density.
 * Dividing before the square roots also avoids overflowing large finite sizes.
 * @param {{width?:number,height?:number,pixelRatio?:number}} [viewport]
 * @returns {number}
 */
export function getRenderPixelRatio({ width = 1280, height = 720, pixelRatio = 1 } = {}) {
  const screenWidth = dimension(width, 1280), screenHeight = dimension(height, 720);
  const nativeRatio = Number.isFinite(pixelRatio) && pixelRatio > 0 ? Math.min(1, pixelRatio) : 1;
  return Math.min(nativeRatio, Math.sqrt(MAX_DRAWING_BUFFER_PIXELS / screenWidth) / Math.sqrt(screenHeight));
}

/** Conservative render budgets selected before allocating textures or shadows. */
export function renderQuality({ width = 1280, height = 720, pixelRatio = 1, coarse = false } = {}) {
  const mobile = coarse || Math.min(dimension(width, 1280), dimension(height, 720)) < 650;
  return {
    mobile,
    pixelRatio: getRenderPixelRatio({ width, height, pixelRatio }),
    textureResolution: mobile ? 256 : 512,
    shadowMapSize: mobile ? 512 : 1024,
    shadows: false,
    transmission: false,
    flakes: mobile ? 520 : 800,
    streaks: mobile ? 150 : 240,
    terrainDistance: mobile ? 90 : 160,
    waterSegments: mobile ? 32 : 64,
  };
}

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function wrap(value, extent) {
  return ((value + extent) % (extent * 2) + extent * 2) % (extent * 2) - extent;
}

function snowTexture() {
  const size = 16, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = Math.abs((x + 0.5) / size * 2 - 1);
    const dy = Math.abs((y + 0.5) / size * 2 - 1);
    const radius = Math.hypot(dx, dy);
    const core = Math.max(0, 1 - radius * 1.7);
    const arms = Math.min(dx, dy, Math.abs(dx - dy)) < 0.12 ? Math.max(0, 1 - radius) * 0.8 : 0;
    pixels.set([235, 247, 255, Math.round(Math.max(core, arms) * 255)], (y * size + x) * 4);
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

/** A permanent two-batch Arctic blizzard, driven by a pausable simulation clock. */
export class Blizzard {
  constructor(quality = renderQuality()) {
    this.group = new THREE.Group();
    this.group.name = "permanent-croba-blizzard";
    this.quality = quality;
    const rng = random(0xb11a20);
    const seed = (count) => Array.from({ length: count }, (_, index) => ({
      x: rng() * 2 - 1, y: rng() * 2 - 1, z: rng() * 2 - 1,
      speed: 2.4 + rng() * 2.5, drift: 0.75 + rng() * 0.5,
      // Close, middle, and distant layers stay dense even at mobile particle counts.
      extent: [8, 18, 34][index % 3],
    }));
    this.flakeSeeds = seed(quality.flakes);
    this.streakSeeds = seed(quality.streaks);
    this.texture = snowTexture();
    this.flakeGeometry = new THREE.BufferGeometry();
    this.flakeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(quality.flakes * 3), 3));
    this.flakeGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    this.flakes = new THREE.Points(this.flakeGeometry, new THREE.PointsMaterial({
      map: this.texture, color: 0xf4faff, size: quality.mobile ? 0.115 : 0.10,
      transparent: true, opacity: 0.95, alphaTest: 0.025, depthWrite: false, toneMapped: false,
    }));
    this.flakes.name = "layered-snowflakes";
    this.flakes.frustumCulled = false;
    this.streakGeometry = new THREE.BufferGeometry();
    this.streakGeometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(quality.streaks * 6), 3));
    this.streakGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    this.streaks = new THREE.LineSegments(this.streakGeometry, new THREE.LineBasicMaterial({
      color: 0xeaf5ff, transparent: true, opacity: quality.mobile ? 0.55 : 0.50,
      depthWrite: false, toneMapped: false,
    }));
    this.streaks.name = "wind-driven-snow-streaks";
    this.streaks.frustumCulled = false;
    this.group.add(this.flakes, this.streaks);
    this.update(new THREE.Vector3(), 0);
  }

  /** Snow surrounds the Arctic camera; underwater and the clear blue ocean hide both layers.
   * boundaryX is the eastern edge in render metres, used to prevent snow spillover.
   */
  update(cameraPosition, time, {
    underwater = false, reducedMotion = false, blueOcean = false, boundaryX = Infinity,
  } = {}) {
    const clock = reducedMotion || !Number.isFinite(time) ? 0 : time;
    const visible = !underwater && !blueOcean;
    this.group.visible = this.flakes.visible = this.streaks.visible = visible;
    this.group.position.copy(cameraPosition);
    if (!visible) return;
    const wind = clock * 6 + Math.sin(clock * 0.22) * 4;
    const crosswind = clock * 1.8 + Math.sin(clock * 0.13) * 3;
    const gust = 1 + Math.sin(clock * 0.22) * 0.18;
    const write = (attribute, seeds, streak) => {
      seeds.forEach((flake, index) => {
        const x = wrap(flake.x * flake.extent + wind * flake.drift, flake.extent);
        const y = wrap(flake.y * 13 - clock * flake.speed, 13);
        const z = wrap(flake.z * flake.extent + crosswind * flake.drift, flake.extent);
        const vertex = index * (streak ? 2 : 1);
        const endX = x + (streak ? 0.50 * gust * flake.drift : 0);
        const inArctic = cameraPosition.x + endX < boundaryX;
        // Mask complete streaks at the biome edge without adding geometry or shaders.
        attribute.setXYZ(vertex, x, inArctic ? y : -10000, z);
        if (streak) attribute.setXYZ(vertex + 1, endX,
          inArctic ? y - 0.28 - flake.speed * 0.075 : -10000, z + 0.13 * flake.drift);
      });
      attribute.needsUpdate = true;
    };
    write(this.flakeGeometry.attributes.position, this.flakeSeeds, false);
    write(this.streakGeometry.attributes.position, this.streakSeeds, true);
  }

  dispose() {
    this.flakeGeometry.dispose(); this.streakGeometry.dispose();
    this.flakes.material.dispose(); this.streaks.material.dispose(); this.texture.dispose();
  }
}
