const CHIP_ORIGIN_X = 36;
const CHIP_ORIGIN_Y = 62;
const CHIP_WIDTH = 72;
const CHIP_HEIGHT = 112;
const CHIP_ALPHA = 128;

function localPixel(part, x, y) {
  const localX = Math.floor((x + 0.5 - part.x) / part.scaleX) + CHIP_ORIGIN_X;
  const localY = Math.floor((y + 0.5 - part.y) / part.scaleY) + CHIP_ORIGIN_Y;
  return localX >= 0 && localX < CHIP_WIDTH && localY >= 0 && localY < CHIP_HEIGHT
    ? localY * CHIP_WIDTH + localX : -1;
}

export class SpriteChipper {
  parts = [];
  damage = new WeakMap();

  constructor(canvas = document.createElement('canvas')) {
    this.canvas = canvas;
    this.canvas.width = CHIP_WIDTH;
    this.canvas.height = CHIP_HEIGHT;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  reset() {
    this.parts.length = 0;
    this.damage = new WeakMap();
  }

  state(owner, id) {
    return this.damage.get(owner)?.get(id);
  }

  rasterize(part, state) {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, CHIP_WIDTH, CHIP_HEIGHT);
    ctx.save();
    ctx.translate(CHIP_ORIGIN_X, CHIP_ORIGIN_Y);
    part.paint(ctx);
    ctx.restore();
    if (state) {
      for (const index of state.holes) ctx.clearRect(index % CHIP_WIDTH, Math.floor(index / CHIP_WIDTH), 1, 1);
    }
  }

  draw(ctx, owner, id, x, y, scaleX, scaleY, paint) {
    const state = this.state(owner, id);
    if (state?.gone) return;
    const part = { owner, id, x, y, scaleX, scaleY, paint };
    this.parts.push(part);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX, scaleY);
    if (state) {
      this.rasterize(part, state);
      ctx.drawImage(this.canvas, -CHIP_ORIGIN_X, -CHIP_ORIGIN_Y);
    } else {
      paint(ctx);
    }
    ctx.restore();
  }

  chip(points, shed) {
    const shattered = new Set();
    // Check the frontmost sprite first and rasterize only the parts the brush overlaps.
    for (let index = this.parts.length - 1; index >= 0; index--) {
      const part = this.parts[index];
      let state = this.state(part.owner, part.id);
      if (state?.gone) continue;
      const hits = [];
      for (const point of points) {
        if (point.chipped) continue;
        const local = localPixel(part, point.x, point.y);
        if (local >= 0) hits.push({ point, local });
      }
      if (hits.length === 0) continue;
      this.rasterize(part, state);
      const pixels = this.ctx.getImageData(0, 0, CHIP_WIDTH, CHIP_HEIGHT).data;
      const detached = new Set();
      for (const { point, local } of hits) {
        if (detached.has(local)) {
          point.chipped = true;
          continue;
        }
        const pixel = local * 4;
        if (pixels[pixel + 3] < CHIP_ALPHA) continue;
        if (!state) {
          state = { holes: new Set(), gone: false };
          if (!this.damage.has(part.owner)) this.damage.set(part.owner, new Map());
          this.damage.get(part.owner).set(part.id, state);
        }
        state.holes.add(local);
        detached.add(local);
        pixels[pixel + 3] = 0;
        point.chipped = true;
        shed(point.x, point.y, pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]);
      }
      if (detached.size && !pixels.some((channel, offset) => offset % 4 === 3 && channel >= CHIP_ALPHA)) {
        state.gone = true;
        shattered.add(part.owner);
      }
    }
    return shattered;
  }

  isGone(owner, parts = 1) {
    for (let index = 0; index < parts; index++) {
      if (!this.state(owner, index)?.gone) return false;
    }
    return true;
  }
}
