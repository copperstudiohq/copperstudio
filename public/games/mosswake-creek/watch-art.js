import { HEIGHT, POND_LEVEL, VIEW_WIDTH, pixelNoise, quarryHeight } from './simulation.js';
import { drawSceneSky, drawTriOpus, drawTriPortal, drawTriPortalAura, sceneGlow, sceneOval } from './art.js';
import { WATCH_BOUNDS, WATCH_BRIDGE, WATCH_CAMPS, WATCH_COIN_TOSS_TICKS, WATCH_PIGEONS, WATCH_PORTALS, WATCH_SIGNAL, WATCH_OPUS_REACH, WATCH_FLYER_HEALTH, WATCH_SPRAYER_HEALTH, WATCH_SPRAY_FLIGHT, WATCH_SPRAY_SPLASH, WATCH_SWING_TICKS, WATCH_TOWER_BUILDING, WATCH_TOWER_CHAIRS, WATCH_TOWER_ROOM, WATCH_TREES, WATCH_TREE_FALL_TICKS, WATCH_TREE_HITS, WATCH_VENDORS, WATCH_WALL_TOWER_HEALTH, WATCH_WALL_TOWER_PLATFORM, watchGround, watchIchorLandings, watchRaidWall, watchPigeonPose, watchRecruitPose, watchTowerTarget } from './watch.js';
import { drawVendorPortraitImage } from './vendor-portraits.js';

function watchRect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
}

const BIRCH_LEAF_CLUSTERS = [
  [-15, 23, 10, 9], [1, 26, 13, 10], [15, 23, 12, 10],
  [-18, 16, 10, 9], [12, 14, 13, 11], [0, 10, 13, 12], [-9, 11, 10, 9]
];
const GREEN_BIRCH = ['#2a4035', '#3c5744', '#55704e', '#718957', '#93a96b'];
const GOLD_BIRCH = ['#3e4534', '#565937', '#777347', '#9e8d52', '#c2a76a'];
const PORTAL_VINE_RADIUS = 275;
const PORTAL_VINE_SPANS = WATCH_PORTALS.flatMap(({ x }) => {
  const trees = WATCH_TREES.filter((tree) => Math.abs(tree.x - x) <= PORTAL_VINE_RADIUS);
  return trees.slice(1).map((to, index) => ({ from: trees[index], to }));
});
const PORTAL_VINE_TREES = new Set(PORTAL_VINE_SPANS.flatMap(({ from, to }) => [from.x, to.x]));
const PORTAL_CANOPY_VINES = [
  { left: -22, right: 21, height: 22, wave: 5, phase: 0 },
  { left: -13, right: 16, height: 13, wave: 5, phase: 2 },
  { left: -19, right: 17, height: 27, wave: 4, phase: 4 }
];

const CANOPY_SHADE_REACH = 28;
const CANOPY_SHADE_EDGE = 8;

export function updateWatchCanopyShade(watch, { strength, top, bottom }) {
  strength.fill(0);
  for (const tree of WATCH_TREES) {
    if (watch.treeCuts[tree.x]?.hits === WATCH_TREE_HITS) continue;
    const crown = watchGround(tree.x) - tree.height;
    const start = Math.max(0, tree.x - CANOPY_SHADE_REACH + 1);
    const end = Math.min(strength.length, tree.x + CANOPY_SHADE_REACH);
    for (let x = start; x < end; x++) {
      const distance = Math.abs(x - tree.x);
      const level = Math.round(255 * Math.min(1, (CANOPY_SHADE_REACH - distance) / CANOPY_SHADE_EDGE));
      if (level <= strength[x]) continue;
      strength[x] = level;
      top[x] = crown + 26 + Math.round(8 * (1 - (distance / CANOPY_SHADE_REACH) ** 2));
      bottom[x] = watchGround(x);
    }
  }
  strength.fill(0, WATCH_BRIDGE.left, WATCH_BRIDGE.right + 1);
  for (const { x } of WATCH_CAMPS) strength.fill(0, x - 22, x + 23);
}

function drawWatchPortalVines(ctx, watch, left) {
  for (const { from, to } of PORTAL_VINE_SPANS) {
    if (to.x < left || from.x >= left + VIEW_WIDTH
        || watch.treeCuts[from.x]?.hits === WATCH_TREE_HITS || watch.treeCuts[to.x]?.hits === WATCH_TREE_HITS) continue;
    const startX = from.x + 13;
    const startY = watchGround(from.x) - from.height + 22;
    const endY = watchGround(to.x) - to.height + 21;
    const width = to.x - 13 - startX;
    const sag = 8 + width * 0.18;
    for (let step = 0; step <= width; step++) {
      const t = step / width;
      const bend = 4 * t * (1 - t);
      const x = startX + step;
      const y = Math.round(startY + (endY - startY) * t + bend * sag);
      watchRect(ctx, '#84375f', x, y, 2, 2);
      watchRect(ctx, '#c35f94', x, y, 1, 1);
      if (bend > 0.4) watchRect(ctx, '#a64e7b', x, y + bend * 4, 1, 1);
      if (step < 3 || step > width - 3 || (step + from.x) % 8 !== 0) continue;
      const length = 4 + Math.floor(pixelNoise(from.x, step) * 6);
      const curl = step % 3 === 0 ? 1 : -1;
      for (let drop = 1; drop <= length; drop++) {
        watchRect(ctx, '#9f4475', x + Math.round(curl * (drop / length) ** 2 * 3), y + drop, 2, 1);
      }
      watchRect(ctx, '#df8eb7', x + curl * 3, y + length, 2, 1);
      watchRect(ctx, '#d37da9', x + curl, y + 2, 2, 1);
    }
  }
}

function drawPortalTreeVines(ctx, crown, seed) {
  for (let turn = crown + 25; turn <= -5; turn += 8) {
    for (let x = -4; x <= 3; x++) {
      const y = turn + Math.floor((x + 4) / 2);
      watchRect(ctx, '#85385f', x, y, 2, 2);
      watchRect(ctx, '#cd709f', x, y, 1, 1);
    }
    watchRect(ctx, '#a34c79', 3, turn + 4, 2, 3);
    watchRect(ctx, '#963f6e', -5, turn + 5, 2, 2);
    watchRect(ctx, '#df89b4', 4, turn + 5, 2, 1);
  }

  for (const { left, right, height, wave, phase } of PORTAL_CANOPY_VINES) {
    for (let x = left; x <= right; x++) {
      const y = crown + height + Math.round(wave * Math.sin(x / 6 + phase + (seed % 7) / 8));
      watchRect(ctx, '#803b61', x, y, 2, 2);
      watchRect(ctx, '#bc5f92', x, y, 1, 1);
      if ((x - left + phase) % 7 === 1) {
        watchRect(ctx, '#a94b7d', x - 1, y + 1, 4, 2);
        watchRect(ctx, '#e08bb6', x, y + 1, 2, 1);
        watchRect(ctx, '#b75b90', x + 2, y + 3, 2, 2);
      }
    }
  }
}

function drawWatchBirchCrown(ctx, x, top) {
  const colors = (x < WATCH_BRIDGE.left - 220 && x > 385) || x > 1536 ? GOLD_BIRCH : GREEN_BIRCH;
  for (const [index, [cx, cy, rx, ry]] of BIRCH_LEAF_CLUSTERS.entries()) {
    const leafX = cx + Math.round((pixelNoise(x, index) - 0.5) * 6);
    const leafY = top + cy + Math.round((pixelNoise(x, index + 9) - 0.5) * 6);
    sceneOval(ctx, colors[0], leafX, leafY, rx, ry);
    sceneOval(ctx, colors[1], leafX, leafY - 1, rx - 1, ry - 1);
    sceneOval(ctx, colors[2], leafX - 1, leafY - 3, rx - 3, ry - 3);
    for (let leaf = 0; leaf < 9; leaf++) {
      const seed = index * 31 + leaf;
      const dx = Math.round((pixelNoise(x, seed + 21) * 2 - 1) * (rx - 2));
      const dy = Math.round((pixelNoise(x, seed + 173) * 2 - 1) * (ry - 3));
      const color = dy < 0 ? colors[3 + leaf % 2] : colors[1 + leaf % 2];
      watchRect(ctx, color, leafX + dx, leafY + dy - 2, 2 + leaf % 3, 1);
      watchRect(ctx, color, leafX + dx + 1, leafY + dy - 1, 1 + leaf % 2, 1);
    }
    watchRect(ctx, colors[1], leafX - rx + 1, leafY + 4, 4, 2);
    watchRect(ctx, colors[2], leafX + rx - 3, leafY + 1, 4, 2);
  }
}

function drawWatchBirch(ctx, tree, watch) {
  const { x, height } = tree;
  const ground = watchGround(x);
  const cut = watch.treeCuts[x];
  const age = cut ? watch.tick - cut.at : Infinity;
  const felled = cut?.hits === WATCH_TREE_HITS;
  if (felled) {
    watchRect(ctx, '#56574d', x - 4, ground - 4, 9, 4);
    watchRect(ctx, '#c0b59b', x - 3, ground - 4, 6, 3);
    watchRect(ctx, '#caa27c', x - 3, ground - 5, 7, 2);
    watchRect(ctx, '#efd3a1', x - 2, ground - 5, 4, 1);
    if (age >= WATCH_TREE_FALL_TICKS) return;
  }

  ctx.save();
  ctx.translate(x, ground - (felled ? 4 : 0));
  if (felled) ctx.rotate(cut.direction * (age / WATCH_TREE_FALL_TICKS) ** 1.7 * Math.PI / 2);
  else if (age < 8) ctx.translate(age < 4 ? cut.direction : 0, 0);
  const crown = -height;
  watchRect(ctx, '#555950', -3, crown + 14, 6, height - 14);
  watchRect(ctx, '#a5a58c', -2, crown + 13, 4, height - 14);
  watchRect(ctx, '#ddd0ac', -1, crown + 12, 2, height - 13);
  for (let y = -7; y > crown + 18; y -= 8) {
    const offset = (y + height) % 3;
    watchRect(ctx, '#606059', -2 + offset, y, 2 + (offset === 0 ? 1 : 0), 1);
  }
  for (let reach = 1; reach < 12; reach++) {
    watchRect(ctx, '#918e79', reach - 1, crown + 35 - reach, 2, 2);
    watchRect(ctx, '#777e6e', -reach, crown + 28 - reach, 2, 2);
  }
  drawWatchBirchCrown(ctx, x, crown);
  if (PORTAL_VINE_TREES.has(x)) drawPortalTreeVines(ctx, crown, x);
  if (cut && !felled) {
    watchRect(ctx, '#5f413b', cut.direction > 0 ? -3 : 0, -5, cut.hits + 1, 2);
    watchRect(ctx, '#d6ad7a', cut.direction > 0 ? -3 : 1, -5, 2, 1);
  }
  ctx.restore();

  if (age < 8) {
    for (let chip = 0; chip < 4; chip++) {
      const dx = cut.direction * (3 + chip + Math.round(age * (0.4 + chip / 8)));
      watchRect(ctx, chip % 2 ? '#dfb982' : '#a3674b', x - dx, ground - 6 - chip - Math.round(age / 2), 2, 1);
    }
  }
}

function drawWatchSky(ctx, watch, canopyShade) {
  const night = watch.phase === 'night';
  const x = drawSceneSky(ctx, night, watch.phaseProgress, watch.bloodMoon, { canopyShade, left: watch.camera });
  const worldX = watch.camera + x;
  const reflectionX = Math.max(WATCH_BRIDGE.left + 39, Math.min(WATCH_BRIDGE.right - 29, worldX));
  for (let row = 0; row < 12; row++) {
    const waveY = POND_LEVEL + row;
    const shimmer = Math.sin(row * 2.2 + watch.tick / 18);
    const width = 6 + row + Math.round((shimmer + 1) * 3);
    const tint = watch.bloodMoon ? '242,102,125' : night ? '176,191,247' : '255,197,126';
    const start = Math.round(reflectionX + shimmer * 4 - width / 2);
    if (row % 3 !== 1 && quarryHeight(start) > waveY && quarryHeight(start + width) > waveY) {
      watchRect(ctx, `rgba(${tint}, ${0.34 - row * 0.02})`, start - watch.camera, waveY, width, 1);
    }
  }
}

function drawWatchBridge(ctx) {
  const { left, right, y } = WATCH_BRIDGE;
  for (let x = left + 11; x < right - 3; x += 21) {
    const depth = quarryHeight(x) - y;
    watchRect(ctx, '#49352f', x, y + 3, 4, depth);
    watchRect(ctx, '#8a6349', x, y + 3, 1, Math.min(20, depth));
    for (let brace = 0; brace < Math.min(8, depth - 6); brace++) {
      watchRect(ctx, '#67483f', x - 6 + brace, y + 5 + brace, 2, 1);
      watchRect(ctx, '#4e3f42', x + 8 - brace, y + 5 + brace, 2, 1);
    }
    watchRect(ctx, '#674835', x - 4, y + 6, 12, 3);
    watchRect(ctx, '#ac7950', x - 3, y + 6, 10, 1);
    watchRect(ctx, '#c29260', x + 1, y + 7, 2, 1);
    watchRect(ctx, '#83a7a05e', x - 2, POND_LEVEL, 9, depth > POND_LEVEL - y ? 1 : 0);
  }
  watchRect(ctx, '#593d31', left, y + 5, right - left + 1, 2);
  watchRect(ctx, '#805542', left, y, right - left + 1, 5);
  watchRect(ctx, '#c28d63', left, y, right - left + 1, 1);
  for (let x = left + 5; x < right; x += 8) {
    watchRect(ctx, '#4c3939', x, y + 2, 1, 3);
    watchRect(ctx, '#a36a4e', x + 1, y + 2, 4, 1);
    watchRect(ctx, '#c39361', x - 2, y + 3, 1, 1);
  }
}

function drawBlueWatchFlame(ctx, x, y, watch, size = 1) {
  if (watch.signal <= 0) return;
  const pulse = Math.floor(watch.tick / 5) % 4;
  sceneGlow(ctx, '#579eff95', x, y - 5 * size, 9 + 9 * size + watch.signal / 2);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  watchRect(ctx, '#283a8f', -5, -4, 11, 4);
  watchRect(ctx, '#3b58be', -4, -7, 9, 6);
  watchRect(ctx, '#4f85f1', -3, -9, 7, 7);
  watchRect(ctx, '#618ffa', -2 + pulse % 2, -12 + Math.abs(pulse - 1), 4, 5);
  watchRect(ctx, '#80ceff', -2, -7, 5, 6);
  watchRect(ctx, '#cbf6ff', 0, -5 - pulse % 2, 2, 4);
  watchRect(ctx, '#8fbfff', -4 + pulse, -14 + pulse % 2, 1, 1);
  watchRect(ctx, '#b2dfff', 4 - pulse, -11 - pulse, 1, 1);
  ctx.restore();
}

function drawWatchSignal(ctx, watch) {
  if (watch.towerUpgraded) {
    drawUpgradedWatchSignal(ctx, watch);
    return;
  }
  const x = WATCH_SIGNAL;
  const y = WATCH_BRIDGE.y;
  if (!watch.signalTent) {
    const fire = x - 13;
    watchRect(ctx, '#3d3034', fire - 11, y - 2, 23, 3);
    watchRect(ctx, '#614339', fire - 7, y - 4, 15, 3);
    watchRect(ctx, '#a36b48', fire - 5, y - 5, 9, 2);
    drawBlueWatchFlame(ctx, fire, y - 3, watch, 1.5);
    for (const [offset, top, width] of [[-10, -3, 4], [-6, -2, 4], [-1, -2, 5], [5, -3, 5]]) {
      watchRect(ctx, '#555768', fire + offset, y + top, width, -top);
      watchRect(ctx, '#9a9a9b', fire + offset + 1, y + top, width - 2, 1);
    }
    return;
  }

  // A ridge tent, a separate torch post, and a chair on the bridge deck.
  for (let row = 0; row < 34; row++) {
    const spread = Math.floor(row * 0.6);
    const left = x - 8 - spread;
    const top = y - 34 + row;
    watchRect(ctx, '#35303c', left, top, spread * 2 + 5, 1);
    watchRect(ctx, '#a58068', left + 2, top, spread + 2, 1);
    watchRect(ctx, '#675969', x - 4, top, spread, 1);
    if (row % 4 !== 0) watchRect(ctx, '#c9aa87', left + 1, top, 1, 1);
  }
  watchRect(ctx, '#725245', x - 8, y - 37, 2, 9);
  watchRect(ctx, '#9f7153', x - 9, y - 35, 6, 1);
  watchRect(ctx, '#352b37', x - 16, y - 18, 15, 18);
  watchRect(ctx, '#493844', x - 14, y - 16, 10, 16);
  watchRect(ctx, '#c9ab89', x - 16, y - 19, 16, 3);
  watchRect(ctx, '#a27c5e', x - 16, y - 17, 2, 17);
  watchRect(ctx, '#ae8970', x - 2, y - 16, 2, 13);
  watchRect(ctx, '#75616c', x + 2, y - 10, 7, 5);
  watchRect(ctx, '#c8a17e', x + 2, y - 10, 6, 1);
  watchRect(ctx, '#58473b', x + 15, y - 18, 3, 18);
  watchRect(ctx, '#b18664', x + 15, y - 16, 1, 15);
  watchRect(ctx, '#ac765c', x + 13, y - 20, 7, 4);
  drawBlueWatchFlame(ctx, x + 16, y - 19, watch);
  watchRect(ctx, '#49353b', x + 24, y - 13, 3, 13);
  watchRect(ctx, '#b6875a', x + 23, y - 14, 5, 3);
  watchRect(ctx, '#9d714e', x + 24, y - 8, 10, 3);
  watchRect(ctx, '#d9a778', x + 25, y - 8, 9, 1);
  watchRect(ctx, '#614239', x + 31, y - 6, 2, 6);
}

function drawUpgradedWatchSignal(ctx, watch) {
  const x = WATCH_SIGNAL;
  const y = WATCH_BRIDGE.y;
  const { width, height, wall } = WATCH_TOWER_BUILDING;
  const half = width / 2;
  const roomHeight = WATCH_TOWER_ROOM.height + wall * 2;
  const roofTop = y - height;
  // The 64-pixel room fits between the four-pixel walls of this wider tower.
  for (const offset of [-34, 26]) {
    const pier = x + offset;
    watchRect(ctx, '#3b2f30', pier, y + 2, 9, quarryHeight(pier) - y - 2);
    watchRect(ctx, '#9d7150', pier + 1, y + 3, 2, POND_LEVEL - y - 3);
  }
  watchRect(ctx, '#302a32', x - 40, y - 4, 81, 7);
  watchRect(ctx, '#51444a', x - half, y - roomHeight, width, roomHeight - 3);
  watchRect(ctx, '#87735e', x - half + 1, y - roomHeight + 1, width - 8, roomHeight - 6);
  watchRect(ctx, '#62545a', x + half - 7, y - roomHeight + 1, 7, roomHeight - 5);
  for (let row = 0; row < 10; row++) {
    const top = y - roomHeight + 2 + row * 6;
    watchRect(ctx, '#584b4c', x - 35, top + 5, 70, 1);
    for (let col = 0; col < 5; col++) {
      const start = x - 34 + col * 14 + (row % 2) * 7;
      if (start + 12 > x + 34) continue;
      watchRect(ctx, '#ae9070', start, top, 11, 1);
      watchRect(ctx, '#685554', start + 12, top + 1, 1, 4);
      if ((row + col) % 3 === 0) watchRect(ctx, '#978266', start + 3, top + 3, 4, 1);
    }
  }
  for (const offset of [-36, 29]) {
    watchRect(ctx, '#b28c69', x + offset, y - roomHeight + 2, 7, roomHeight - 7);
    watchRect(ctx, '#d2a578', x + offset, y - roomHeight + 2, 1, roomHeight - 8);
    for (let top = -roomHeight + 7; top < -4; top += 12) {
      watchRect(ctx, '#68504b', x + offset, y + top, 7, 1);
    }
  }
  watchRect(ctx, '#684c40', x - 39, y - roomHeight + 6, 79, 3);
  watchRect(ctx, '#d89b68', x - 39, y - roomHeight + 6, 79, 1);
  watchRect(ctx, '#684c40', x - 39, y - 8, 79, 3);
  watchRect(ctx, '#c59164', x - 39, y - 8, 79, 1);
  // A full-height oak entrance, without windows in the dining-room walls.
  watchRect(ctx, '#3d3035', x - 13, y - 33, 27, 32);
  watchRect(ctx, '#c49b73', x - 12, y - 32, 25, 31);
  watchRect(ctx, '#342b30', x - 9, y - 29, 19, 28);
  watchRect(ctx, '#7a513c', x - 8, y - 28, 17, 27);
  for (let offset = -7; offset < 9; offset += 4) {
    watchRect(ctx, '#aa7950', x + offset, y - 27, 1, 25);
    watchRect(ctx, '#513832', x + offset + 2, y - 26, 1, 24);
  }
  for (const top of [-24, -9]) {
    watchRect(ctx, '#454246', x - 8, y + top, 17, 2);
    watchRect(ctx, '#a69e86', x - 7, y + top, 1, 1);
    watchRect(ctx, '#a69e86', x + 7, y + top, 1, 1);
  }
  watchRect(ctx, '#efbe7a', x + 4, y - 17, 2, 3);
  watchRect(ctx, '#cca075', x - 14, y - 1, 29, 2);
  // The signal burns in an open belfry above the enlarged stone room.
  watchRect(ctx, '#30323c', x - 26, roofTop + 14, 53, 17);
  watchRect(ctx, '#425450', x - 23, roofTop + 15, 47, 15);
  for (const offset of [-25, -14, 13, 24]) {
    watchRect(ctx, '#976e51', x + offset, roofTop + 14, 3, 17);
    watchRect(ctx, '#dfaa74', x + offset, roofTop + 14, 1, 16);
  }
  watchRect(ctx, '#523940', x - 40, roofTop + 10, 81, 5);
  watchRect(ctx, '#dc9b68', x - 40, roofTop + 10, 81, 1);
  for (let tier = 0; tier < 5; tier++) {
    const roofLeft = -half + tier * 8;
    watchRect(ctx, tier % 2 ? '#b47553' : '#cf8c5b', x + roofLeft, roofTop + 8 - tier * 2, width + 1 - tier * 16, 2);
    if (tier < 4) watchRect(ctx, '#eab17b', x + roofLeft + 1, roofTop + 8 - tier * 2, 10, 1);
  }
  watchRect(ctx, '#769d87', x + 16, roofTop + 6, 6, 1);
  watchRect(ctx, '#67937e', x + 18, roofTop + 7, 3, 1);
  watchRect(ctx, '#e8b980', x - 1, roofTop, 3, 2);
  drawBlueWatchFlame(ctx, x, roofTop + 30, watch, 1.25);
}

function drawWallTower(ctx, post, x, y) {
  if (!post.health) {
    watchRect(ctx, '#43383b', x - 18, y - 3, 37, 3);
    for (const [left, top, width] of [[-16, -7, 9], [-4, -6, 11], [10, -8, 7]]) {
      watchRect(ctx, '#666664', x + left, y + top, width, -top - 1);
      watchRect(ctx, '#a4a18a', x + left + 1, y + top, width - 2, 1);
    }
    watchRect(ctx, '#6f4e40', x - 12, y - 11, 4, 9);
    watchRect(ctx, '#bb8258', x - 11, y - 11, 1, 7);
    watchRect(ctx, '#a46e4d', x - 8, y - 6, 20, 2);
    watchRect(ctx, '#ddaa73', x + 7, y - 6, 3, 1);
    return;
  }

  const deck = y - WATCH_WALL_TOWER_PLATFORM;
  // A broad stone footing supports the timber fighting platform. The open
  // center leaves room for two archers, with copper-capped merlons at the ends.
  watchRect(ctx, '#322c33', x - 18, y - 3, 37, 4);
  watchRect(ctx, '#414447', x - 16, y - 21, 33, 21);
  for (let row = 0; row < 4; row++) {
    const top = y - 20 + row * 5;
    watchRect(ctx, row % 2 ? '#777970' : '#686f6a', x - 15, top, 31, 4);
    watchRect(ctx, '#9a9b82', x - 14, top, 29, 1);
    for (let seam = -11 + row % 2 * 5; seam < 15; seam += 10) {
      watchRect(ctx, '#464d4c', x + seam, top, 1, 4);
      watchRect(ctx, '#858d7d', x + seam + 2, top + 1, 3, 1);
      watchRect(ctx, '#5d675f', x + seam - 3, top + 3, 2, 1);
    }
  }
  watchRect(ctx, '#303133', x + 11, y - 19, 4, 18);
  watchRect(ctx, '#29272d', x - 5, y - 17, 11, 17);
  watchRect(ctx, '#5d473b', x - 4, y - 16, 9, 16);
  watchRect(ctx, '#866245', x - 3, y - 15, 2, 14);
  watchRect(ctx, '#463730', x + 1, y - 15, 1, 15);
  watchRect(ctx, '#c78c58', x + 2, y - 9, 2, 2);
  watchRect(ctx, '#b2ad8c', x - 6, y - 19, 13, 2);

  watchRect(ctx, '#443137', x - 13, deck + 3, 27, 9);
  for (const left of [-14, 11]) {
    watchRect(ctx, '#493239', x + left, deck + 2, 4, 25);
    watchRect(ctx, '#a5724d', x + left + 1, deck + 3, 2, 22);
    watchRect(ctx, '#d6a16b', x + left + 1, deck + 4, 1, 10);
    for (const top of [deck + 6, deck + 20]) {
      watchRect(ctx, '#b0764b', x + left, top, 4, 2);
      watchRect(ctx, '#e8b778', x + left + 1, top, 1, 1);
    }
  }
  for (let brace = 0; brace < 10; brace++) {
    watchRect(ctx, '#92704e', x - 12 + brace, deck + 5 + brace, 2, 2);
    watchRect(ctx, '#6e5142', x + 11 - brace, deck + 5 + brace, 2, 2);
  }
  watchRect(ctx, '#3e3033', x - 17, deck, 35, 5);
  watchRect(ctx, '#ce9b63', x - 16, deck, 33, 1);
  watchRect(ctx, '#956340', x - 16, deck + 1, 33, 2);
  watchRect(ctx, '#5b4540', x - 15, deck + 3, 31, 1);
  for (const offset of [-14, -7, 0, 7, 14]) {
    watchRect(ctx, '#c28b5d', x + offset, deck + 2, 2, 1);
    watchRect(ctx, '#e1b382', x + offset, deck + 1, 1, 1);
  }
  for (const left of [-17, 11]) {
    watchRect(ctx, '#473a3c', x + left, deck - 9, 7, 10);
    watchRect(ctx, '#858b78', x + left + 1, deck - 8, 5, 8);
    watchRect(ctx, '#c3c2a1', x + left + 1, deck - 8, 1, 7);
    watchRect(ctx, '#b57950', x + left, deck - 10, 7, 2);
    watchRect(ctx, '#e8b67b', x + left + 1, deck - 10, 5, 1);
  }
  const strength = Math.max(0, Math.min(1, post.health / WATCH_WALL_TOWER_HEALTH));
  watchRect(ctx, '#221e2b', x - 15, deck - 30, 30, 2);
  watchRect(ctx, '#86bfa6', x - 15, deck - 30, Math.ceil(30 * strength), 2);
}

function drawWatchPost(ctx, post) {
  const x = post.wallX;
  const y = watchGround(x);
  if (post.forward) {
    const flagX = x + (post.tier === 3 ? 22 : 16);
    const flagY = y - (post.tier === 3 ? 40 : 26);
    watchRect(ctx, '#785d4d', flagX, flagY, 2, y - flagY);
    watchRect(ctx, '#bf8a5d', flagX, flagY - 1, 10, 2);
    watchRect(ctx, '#6d8f82', flagX + 2, flagY + 1, 8, 7);
    watchRect(ctx, '#abd0a7', flagX + 3, flagY + 2, 5, 1);
    watchRect(ctx, '#517666', flagX + 3, flagY + 8, 4, 2);
  }
  if (post.tier === 3) return drawWallTower(ctx, post, x, y);
  if (!post.health) {
    watchRect(ctx, '#543d3a', x - 7, y - 2, 15, 2);
    watchRect(ctx, '#825b48', x - 4, y - 6, 3, 6);
    watchRect(ctx, '#825b48', x + 3, y - 7, 3, 7);
    watchRect(ctx, '#c0926a', x - 5, y - 6, 12, 2);
    watchRect(ctx, '#e0ae7c', x - 4, y - 6, 1, 1);
    watchRect(ctx, '#e0ae7c', x + 4, y - 6, 1, 1);
  } else {
    const reinforced = post.tier === 2;
    const height = reinforced ? 27 : 20;
    const band = reinforced ? '#5c9387' : '#9e6d4e';
    watchRect(ctx, '#423337', x - 14, y - 3, 28, 3);
    for (const [index, offset] of [-10, -6, -2, 2, 6, 10].entries()) {
      const top = y - height + [2, 0, 1, 0, 1, 3][index];
      watchRect(ctx, '#674936', x + offset - 2, top + 3, 5, y - top - 3);
      watchRect(ctx, index % 2 ? '#b68054' : '#9a653f', x + offset - 1, top + 2, 3, y - top - 4);
      watchRect(ctx, reinforced ? '#c4b998' : '#cda06b', x + offset, top, 1, 4);
      watchRect(ctx, '#deb17a', x + offset - 1, top + 4, 1, 6 + index % 3);
      watchRect(ctx, '#714733', x + offset + 1, y - 10, 1, 5);
    }
    for (const beam of [-height + 7, -5]) {
      watchRect(ctx, '#4c383b', x - 14, y + beam, 28, 3);
      watchRect(ctx, band, x - 13, y + beam, 26, 1);
      for (const offset of [-11, -4, 4, 11]) {
        watchRect(ctx, reinforced ? '#d4cc91' : '#d9a26f', x + offset, y + beam + 1, 1, 1);
      }
    }
    const strength = post.health / (reinforced ? 11 : 6);
    watchRect(ctx, '#221e2b', x - 12, y - height - 4, 24, 2);
    watchRect(ctx, '#86bfa6', x - 12, y - height - 4, Math.ceil(24 * strength), 2);
  }
}

function drawMarketSeller(ctx, vendor) {
  const smith = vendor.id === 'arms';
  const coat = smith ? '#607c78' : '#8a6e59';
  const trim = smith ? '#a2aaa0' : '#c39970';
  watchRect(ctx, '#312935', -6, -12, 12, 11);
  watchRect(ctx, coat, -5, -11, 10, 10);
  watchRect(ctx, trim, -5, -11, 4, 2);
  watchRect(ctx, '#57403a', -2, -9, 7, 8);
  watchRect(ctx, '#b6855d', -1, -8, 4, 5);
  watchRect(ctx, '#624539', -5, -3, 11, 2);
  watchRect(ctx, '#deb589', 0, -3, 2, 2);
  watchRect(ctx, '#6f4c41', -5, -21, 10, 10);
  watchRect(ctx, smith ? '#a87765' : '#bf8e6b', -4, -20, 9, 8);
  watchRect(ctx, smith ? '#d7a484' : '#e4b78b', 0, -19, 5, 5);
  watchRect(ctx, '#443137', 2, -17, 2, 1);
  watchRect(ctx, '#63453d', -3, -14, 7, 3);
  watchRect(ctx, '#946a58', -1, -14, 4, 1);
  if (smith) {
    watchRect(ctx, '#3c333b', -5, -23, 9, 4);
    watchRect(ctx, '#908a85', -3, -23, 5, 1);
    watchRect(ctx, '#536b6a', -5, -20, 10, 2);
  } else {
    watchRect(ctx, '#614439', -5, -24, 8, 3);
    watchRect(ctx, '#a57e59', -4, -24, 6, 2);
    watchRect(ctx, '#80573e', -6, -22, 13, 2);
  }
  watchRect(ctx, '#aa7a60', -6, -6, 3, 3);
  watchRect(ctx, '#c49072', 4, -7, 3, 3);
}

export function drawWatchVendorPortrait(canvas, vendor) {
  const ctx = canvas.getContext('2d');
  const backdrop = vendor.id === 'arms' ? '#253a3a' : '#3e2c27';
  watchRect(ctx, backdrop, 0, 0, canvas.width, canvas.height);
  watchRect(ctx, '#795943', 3, 3, canvas.width - 6, 1);
  watchRect(ctx, '#795943', 3, canvas.height - 4, canvas.width - 6, 1);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height - 8);
  const scale = Math.min(canvas.width / 28, canvas.height / 29);
  ctx.scale(scale, scale);
  drawMarketSeller(ctx, vendor);
  ctx.restore();
  drawVendorPortraitImage(canvas, vendor.id);
}

function drawWatchGear(ctx, id) {
  const copper = id !== 'sword';
  if (id === 'repair-kit') {
    watchRect(ctx, '#603e36', 0, -4, 15, 11);
    watchRect(ctx, '#a96d4d', 1, -3, 13, 8);
    watchRect(ctx, '#e0ac79', 1, -3, 13, 2);
    watchRect(ctx, '#6e5242', 4, -7, 7, 3);
    watchRect(ctx, '#dab67e', 6, 0, 3, 2);
    return;
  }
  watchRect(ctx, '#553d3f', -2, -1, 8, 3);
  watchRect(ctx, '#bf8f65', -1, -1, 5, 1);
  if (id === 'copper-hammer') {
    watchRect(ctx, '#88615a', 4, -1, 10, 2);
    watchRect(ctx, '#683f42', 12, -5, 7, 11);
    watchRect(ctx, '#d39163', 13, -4, 5, 9);
    watchRect(ctx, '#f8c487', 17, -5, 2, 11);
    watchRect(ctx, '#7b9d89', 13, -4, 2, 2);
  } else {
    watchRect(ctx, copper ? '#95523e' : '#625a68', 5, -3, 3, 7);
    watchRect(ctx, copper ? '#d68b61' : '#9ba7b2', 8, -2, copper ? 13 : 10, 5);
    watchRect(ctx, copper ? '#ffd091' : '#dae6e0', 8, -2, copper ? 13 : 10, 1);
    watchRect(ctx, copper ? '#ffd091' : '#dae6e0', copper ? 21 : 18, -1, 2, 2);
  }
}

export function drawWatchMarketIcon(canvas, id) {
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.translate(id === 'repair-kit' ? 5 : 7, id === 'repair-kit' ? 12 : 20);
  if (id !== 'repair-kit') ctx.rotate(-Math.PI / 3);
  drawWatchGear(ctx, id);
  ctx.restore();
}

function drawWatchStall(ctx, vendor) {
  const smith = vendor.id === 'arms';
  const cloth = smith ? '#537670' : '#9a6350';
  const stripe = smith ? '#9eaf90' : '#e0af7b';
  ctx.save();
  ctx.translate(vendor.x, watchGround(vendor.x));
  watchRect(ctx, '#382d32', -17, -29, 35, 27);
  watchRect(ctx, '#50433d', -14, -28, 29, 22);
  for (let x = -12; x <= 12; x += 6) {
    watchRect(ctx, '#392e30', x, -27, 1, 17);
    watchRect(ctx, '#70513f', x + 1, -26, 3, 1);
    watchRect(ctx, '#624636', x + 2, -19, 2, 1);
  }
  watchRect(ctx, '#89654e', -16, -28, 3, 28);
  watchRect(ctx, '#89654e', 14, -28, 3, 28);
  watchRect(ctx, '#c49364', -16, -27, 1, 25);
  watchRect(ctx, '#4f3832', 16, -27, 1, 25);
  watchRect(ctx, '#a67850', -13, -15, 26, 2);
  watchRect(ctx, '#d0a16a', -13, -15, 26, 1);
  if (smith) {
    for (const x of [-9, 9]) {
      watchRect(ctx, '#c4c8b6', x, -27, 1, 8);
      watchRect(ctx, '#698480', x + 1, -26, 1, 6);
      watchRect(ctx, '#dcb57a', x - 2, -21, 5, 1);
    }
    watchRect(ctx, '#4b5354', -11, -18, 5, 3);
    watchRect(ctx, '#9eafa3', -12, -19, 7, 2);
  } else {
    for (const x of [-9, 7]) {
      watchRect(ctx, '#af6e45', x, -21, 4, 5);
      watchRect(ctx, '#e0b374', x, -21, 4, 1);
      watchRect(ctx, '#664533', x + 1, -23, 2, 2);
    }
    watchRect(ctx, '#668679', 8, -26, 3, 7);
    watchRect(ctx, '#b3c2a0', 9, -25, 1, 4);
  }
  drawMarketSeller(ctx, vendor);
  watchRect(ctx, '#6a4740', -17, -9, 35, 9);
  watchRect(ctx, '#cf9e71', -18, -11, 37, 3);
  watchRect(ctx, '#ae7f5d', -15, -7, 30, 2);
  for (let x = -12; x < 17; x += 7) {
    watchRect(ctx, '#624239', x, -7, 1, 7);
    watchRect(ctx, '#bf8a60', x + 1, -6, 4, 1);
    watchRect(ctx, '#82523c', x + 2, -3, 3, 1);
    watchRect(ctx, '#f0ba79', x + 2, -8, 1, 1);
  }
  watchRect(ctx, '#704537', -17, -2, 35, 2);
  watchRect(ctx, '#ecc18a', -17, -11, 35, 1);
  watchRect(ctx, '#5a3a31', -17, -8, 35, 1);
  for (const x of [-15, 15]) {
    watchRect(ctx, '#5b3e35', x, -7, 2, 6);
    watchRect(ctx, '#d09b62', x, -6, 1, 1);
    watchRect(ctx, '#d09b62', x, -2, 1, 1);
  }
  watchRect(ctx, '#443137', -19, -30, 39, 3);
  watchRect(ctx, cloth, -18, -35, 37, 6);
  for (let x = -16; x < 18; x += 7) {
    watchRect(ctx, stripe, x, -35, 3, 6);
    watchRect(ctx, '#ffffff25', x, -35, 2, 1);
    watchRect(ctx, '#231d2c44', x + 2, -33, 1, 5);
    watchRect(ctx, cloth, x - 1, -29, 6, 2);
    watchRect(ctx, stripe, x, -29, 3, 2);
    watchRect(ctx, '#231d2c66', x - 1, -27, 6, 1);
  }
  watchRect(ctx, '#e5b67d', -18, -36, 37, 1);
  watchRect(ctx, '#77583e', -7, -44, 15, 9);
  watchRect(ctx, '#e1b783', -5, -43, 11, 1);
  if (smith) {
    watchRect(ctx, '#bdc6bc', -1, -42, 2, 5);
    watchRect(ctx, '#dab587', -3, -40, 6, 1);
  } else {
    watchRect(ctx, '#dab587', -1, -42, 2, 5);
    watchRect(ctx, '#dac49b', -4, -42, 8, 2);
  }
  ctx.restore();
}

const CAMP_TENTS = {
  ridge: { top: -28, peak: -22, ridge: 2, left: -37, right: 3, cloth: '#a08a6b', fold: '#716553', patch: '#b3a07e' },
  'lean-to': { top: -25, peak: -10, ridge: 3, left: -43, right: 3, cloth: '#859071', fold: '#59644f', patch: '#a1a58a' },
  patchwork: { top: -30, peak: -25, ridge: 2, left: -40, right: 3, cloth: '#986e60', fold: '#714d48', patch: '#b5916a' },
  sagging: { top: -21, peak: -25, ridge: 15, left: -42, right: 4, cloth: '#8c8783', fold: '#615c64', patch: '#a89982' }
};

function drawCampTwig(ctx, foot, tip, top) {
  for (let y = top; y < 0; y++) {
    const x = Math.round(foot + (tip - foot) * y / top);
    watchRect(ctx, '#534236', x, y, 2, 1);
    if (y % 5 !== 0) watchRect(ctx, '#a08264', x, y, 1, 1);
  }
  watchRect(ctx, '#a08264', tip - 2, top + 2, 2, 1);
}

function drawCampShelter(ctx, tent, door, hidden) {
  const { top, peak, ridge, left, right, cloth, fold, patch } = tent;
  for (let y = top; y < 0; y++) {
    const depth = (y - top) / -top;
    const hem = y >= -5 ? (y + 5) % 3 : 0;
    const torn = y >= -11 && y <= -8 ? 4 - Math.abs(y + 9) : 0;
    const edge = Math.round(peak + (left - peak) * depth) + hem + torn;
    const end = Math.round(peak + ridge + (right - peak - ridge) * depth) - hem;
    const seam = Math.round(peak + ridge + (right - peak - ridge) * depth * 0.45);
    watchRect(ctx, cloth, edge, y, seam - edge, 1);
    watchRect(ctx, fold, seam, y, end - seam + 1, 1);
  }
  const repair = Math.round((left + peak) / 2) - 1;
  watchRect(ctx, fold, repair, -8, 7, 5);
  watchRect(ctx, patch, repair + 1, -8, 5, 4);
  watchRect(ctx, '#d7c3a0', repair + 1, -8, 1, 1);
  watchRect(ctx, '#d7c3a0', repair + 4, -5, 1, 1);
  watchRect(ctx, fold, repair + 3, -15, 3, 1);
  watchRect(ctx, fold, repair + 2, -14, 2, 2);

  drawCampTwig(ctx, left - 1, peak + 3, top - 4);
  drawCampTwig(ctx, right + 1, peak + ridge - 1, top - 3);
  watchRect(ctx, '#b69d7d', peak + 1, top - 1, ridge > 4 ? ridge - 2 : 4, 2);
  watchRect(ctx, '#483b37', door - 6, -13, 13, 13);
  watchRect(ctx, hidden ? fold : '#2d252d', door - 5, -12, 11, 12);
  watchRect(ctx, patch, door - 6, -14, 13, 2);
  watchRect(ctx, '#866950', door - 7, -10, 2, 10);
  watchRect(ctx, '#866950', door + 6, -10, 1, 9);
  if (hidden) {
    watchRect(ctx, cloth, door - 4, -12, 5, 11);
    watchRect(ctx, '#a7947c', door + 1, -11, 1, 9);
    watchRect(ctx, patch, door + 2, -5, 3, 2);
  } else {
    watchRect(ctx, '#baa687', door + 4, -12, 2, 8);
    watchRect(ctx, '#665247', door + 3, -8, 3, 1);
  }
}

function drawCampRecruit(ctx, x, y, tick, direction, walking) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  if (walking) {
    const stride = (tick >> 2) % 2 ? 2 : -2;
    watchRect(ctx, '#594745', -2 - stride, -6, 2, 6);
    watchRect(ctx, '#7b6553', 1 + stride, -6, 2, 6);
    watchRect(ctx, '#ac8c71', 1 + stride, -1, 3, 1);
  } else {
    watchRect(ctx, '#594745', -1, -7, 5, 2);
    watchRect(ctx, '#7b6553', 3, -6, 2, 5);
    watchRect(ctx, '#ac8c71', 4, -2, 3, 2);
  }
  const bob = walking && (tick & 4) ? -1 : 0;
  ctx.translate(0, bob);
  watchRect(ctx, '#4f4945', -4, -11, 7, 6);
  watchRect(ctx, '#827263', -3, -10, 5, 5);
  watchRect(ctx, '#a79b82', -2, -8, 2, 2);
  watchRect(ctx, '#66574c', -4, -6, 2, 2);
  watchRect(ctx, '#9e8068', 1, -8, 3, 2);
  watchRect(ctx, '#60574d', -3, -16, 5, 3);
  watchRect(ctx, '#918271', -2, -16, 3, 1);
  watchRect(ctx, '#b89373', -1, -14, 4, 3);
  watchRect(ctx, '#51433e', 2, -13, 1, 1);
  ctx.restore();
}

function drawWatchCamp(ctx, camp, watch) {
  const { x, side, style } = camp;
  const { tick } = watch;
  const flicker = (tick >> 3) % 2;
  const tent = CAMP_TENTS[style];
  const door = tent.peak + Math.floor(tent.ridge / 2);
  const retreat = watch.campShelterProgress(camp);
  ctx.save();
  ctx.translate(x, watchGround(x));
  ctx.scale(-side, 1);
  watchRect(ctx, '#2b252cb8', -45, -2, 81, 3);
  sceneGlow(ctx, '#ec9e627e', 29, -7, 17 + flicker);
  drawCampShelter(ctx, tent, door, retreat === 1);

  watchRect(ctx, '#382b2b', 7, -7, 16, 7);
  watchRect(ctx, '#77513a', 8, -7, 14, 5);
  watchRect(ctx, '#382c2a', 11, -4, 8, 2);
  watchRect(ctx, '#bd9066', 7, -6, 5, 5);
  watchRect(ctx, '#7e543e', 8, -5, 3, 3);
  watchRect(ctx, '#bf8b5d', 9, -4, 1, 1);
  if (retreat < 1) {
    const pose = watchRecruitPose(camp, tick);
    const offset = Math.round(pose.x + (door - pose.x) * retreat);
    const walking = pose.walking || retreat > 0;
    const floor = walking ? watchGround(x - side * offset) - watchGround(x) : 0;
    drawCampRecruit(ctx, offset, floor, tick, retreat > 0 ? -1 : pose.direction, walking);
  }

  watchRect(ctx, '#706059', 25, -2, 10, 2);
  watchRect(ctx, '#d9784e', 27, -5, 6, 4);
  watchRect(ctx, '#ffc680', 29, -7 - flicker, 2, 5);
  watchRect(ctx, '#f6d2a191', 30 + flicker, -10 - flicker, 1, 1);
  ctx.restore();
}

function drawWatchGuard(ctx, x, y, guard, tick) {
  const veteran = guard.rank === 1;
  const shooting = tick - guard.shotAt < 8;
  const trim = veteran ? '#edbe7d' : '#a4c1c5';
  ctx.save();
  ctx.translate(Math.round(x), y);
  ctx.scale(guard.direction, 1);
  watchRect(ctx, '#252433', -7, -1, 15, 2);
  const stride = guard.walking ? Math.round(3 * Math.sin(guard.stride * Math.PI / 8)) : 0;
  const rear = -4 - stride;
  const front = 1 + stride;
  watchRect(ctx, '#414d60', rear, -7, 4, 5);
  watchRect(ctx, '#678998', front, -7, 4, 6);
  watchRect(ctx, '#352b32', rear, -3, 5, 3 - Number(stride < 0));
  watchRect(ctx, '#523a38', front, -3, 6, 3 - Number(stride > 0));
  watchRect(ctx, '#aa7955', front, -3, 4, 1);

  watchRect(ctx, '#3d343e', -8, -17, 4, 12);
  watchRect(ctx, '#996f54', -7, -15, 2, 8);
  watchRect(ctx, '#d8c99f', -8, -20, 1, 4);
  watchRect(ctx, '#b8c9c4', -6, -21, 1, 5);
  watchRect(ctx, '#31394e', -6, -16, 12, 10);
  watchRect(ctx, '#5f869f', -5, -15, 10, 7);
  watchRect(ctx, '#385f71', -4, -12, 8, 3);
  watchRect(ctx, trim, -5, -16, 8, 1);
  watchRect(ctx, '#756050', -4, -8, 10, 2);
  watchRect(ctx, trim, 1, -8, 2, 2);
  watchRect(ctx, '#8db2bf', -5, -15, 3, 4);

  watchRect(ctx, '#614456', -3, -22, 9, 6);
  watchRect(ctx, '#bb8f75', -1, -21, 6, 5);
  watchRect(ctx, '#e8bc93', 1, -21, 4, 3);
  watchRect(ctx, '#372e3d', 3, -20, 2, 1);
  watchRect(ctx, '#47424c', -5, -23, 11, 2);
  watchRect(ctx, veteran ? '#c88d56' : '#94654d', -4, -25, 8, 3);
  watchRect(ctx, trim, -3, -25, 5, 1);
  if (veteran) watchRect(ctx, '#e8a96f', -5, -27, 4, 2);

  const bow = shooting ? 11 : 9;
  const draw = shooting ? 4 : bow - 4;
  for (let row = 0; row <= 16; row++) {
    const distance = Math.abs(row - 8);
    const arc = bow - Math.round(distance ** 2 / 18);
    const string = Math.round(draw + (bow - 4 - draw) * distance / 8);
    watchRect(ctx, '#c4cfc5', string, -21 + row, 1, 1);
    watchRect(ctx, '#7d4d3b', arc, -21 + row, 2, 1);
    watchRect(ctx, '#d6a477', arc, -21 + row, 1, 1);
  }
  watchRect(ctx, '#b6cad4', 3, -14, bow - 4, 2);
  watchRect(ctx, '#d9a982', bow - 1, -14, 2, 2);
  if (shooting) watchRect(ctx, '#e5dec0', draw, -15, bow - draw + 4, 1);
  ctx.restore();
}

function drawWatchBuilder(ctx, builder, tick) {
  const { x, direction, walking, working } = builder;
  const stride = walking ? Math.round(2 * Math.sin(builder.stride * Math.PI / 8)) : 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(watchGround(x)));
  ctx.scale(direction, 1);
  watchRect(ctx, '#252433', -7, -1, 15, 2);
  watchRect(ctx, '#453e3b', -4 - stride, -6, 4, 5);
  watchRect(ctx, '#68624e', 1 + stride, -6, 4, 5);
  watchRect(ctx, '#352c2d', -5 - stride, -2, 5, 2);
  watchRect(ctx, '#4d3830', 1 + stride, -2, 5, 2);

  // Ochre work clothes, a leather apron and a worn side bag distinguish the
  // builders from blue-coated bowmen without changing their human scale.
  watchRect(ctx, '#392d32', -6, -16, 12, 11);
  watchRect(ctx, '#9b6e37', -5, -15, 10, 9);
  watchRect(ctx, '#cea45e', -4, -15, 8, 3);
  watchRect(ctx, '#795039', -3, -14, 7, 9);
  watchRect(ctx, '#ad7545', -2, -14, 5, 8);
  watchRect(ctx, '#d6a15d', -2, -14, 1, 5);
  watchRect(ctx, '#604333', -1, -10, 4, 3);
  watchRect(ctx, '#c68d50', -1, -10, 4, 1);
  watchRect(ctx, '#3f302d', -6, -8, 12, 2);
  watchRect(ctx, '#d8a264', 0, -8, 2, 2);
  watchRect(ctx, '#49332d', -8, -10, 4, 7);
  watchRect(ctx, '#8b5e3b', -8, -9, 3, 5);
  watchRect(ctx, '#d09a5a', -7, -10, 2, 2);
  watchRect(ctx, '#bd8d61', -6, -13, 2, 5);
  watchRect(ctx, '#ddb18b', -6, -8, 2, 2);

  watchRect(ctx, '#46312f', -3, -22, 9, 7);
  watchRect(ctx, '#b57e55', -2, -21, 7, 6);
  watchRect(ctx, '#e0ac7d', 1, -21, 4, 4);
  watchRect(ctx, '#30272b', 3, -20, 2, 1);
  watchRect(ctx, '#8f5f42', 1, -16, 4, 1);
  watchRect(ctx, '#5d3e32', -5, -23, 12, 3);
  watchRect(ctx, '#b87548', -4, -24, 10, 3);
  watchRect(ctx, '#dca56a', -3, -25, 8, 2);
  watchRect(ctx, '#f0c58b', -2, -25, 3, 1);
  watchRect(ctx, '#8d5f40', -5, -22, 12, 1);

  const pose = working ? Math.floor(tick / 4) % 3 : 3;
  const [handX, handY, headX, headY] = [
    [4, -19, 7, -25], [8, -14, 13, -17], [8, -8, 14, -8], [6, -10, 9, -5]
  ][pose];
  for (let step = 0; step <= 4; step++) {
    const armX = 4 + (handX - 4) * step / 4;
    const armY = -14 + (handY + 14) * step / 4;
    watchRect(ctx, step < 3 ? '#d0a15b' : '#ddb18b', armX, armY, 2, 2);
  }
  // Whole-pixel wooden handle and an iron head, held in a visible bare hand.
  for (let step = 0; step <= 6; step++) {
    watchRect(ctx, '#a17a50', handX + (headX - handX) * step / 6,
      handY + (headY - handY) * step / 6, 1, 2);
  }
  watchRect(ctx, '#e3b88b', handX, handY, 2, 2);
  watchRect(ctx, '#42484b', headX - 2, headY - 1, 6, 3);
  watchRect(ctx, '#a5b6ab', headX - 2, headY - 1, 5, 1);
  watchRect(ctx, '#6b807b', headX + 2, headY, 2, 2);
  ctx.restore();
}

function drawWatchPigeon(ctx, { x, direction, walking }, tick) {
  const stride = walking ? ((tick >> 2) % 2 ? 1 : -1) : 0;
  const nod = walking ? Number(stride < 0) : 1;
  ctx.save();
  ctx.translate(x, watchGround(x));
  ctx.scale(direction, 1);
  watchRect(ctx, '#322a3824', -8, -1, 16, 2);
  watchRect(ctx, '#b7737c', -2 - stride, -3, 2, 3 - Number(stride > 0));
  watchRect(ctx, '#da8e93', 1 + stride, -3, 2, 3 - Number(stride < 0));
  watchRect(ctx, '#4d5064', -10, -6, 6, 2);
  watchRect(ctx, '#57596e', -7, -8, 14, 5);
  watchRect(ctx, '#767585', -6, -9, 12, 6);
  watchRect(ctx, '#818398', -4, -5, 10, 3);
  watchRect(ctx, '#aba9b1', -5, -8, 9, 4);
  watchRect(ctx, '#606477', -5, -6, 7, 1);
  watchRect(ctx, '#66677b', -3, -4, 4, 1);
  watchRect(ctx, '#638980', 4, -8, 3, 4);
  watchRect(ctx, '#82869d', 5, -11 + nod, 4, 4);
  watchRect(ctx, '#e2a477', 7, -10 + nod, 1, 1);
  watchRect(ctx, '#d8b799', 9, -8 + nod, 2, 1);
  ctx.restore();
}

const WATCH_AXE_POSES = [
  [3, -9, 1.04], [3, -15, -1.55], [4, -19, -2.20],
  [8, -11, 0.14], [7, -8, 0.39], [4, -8, 0.95]
];

function drawWatchAxe(ctx, [handX, handY, angle]) {
  for (let step = 0; step <= 5; step++) {
    watchRect(ctx, step < 3 ? '#a86149' : '#c78460', 3 + (handX - 3) * step / 5,
      -13 + (handY + 13) * step / 5, 3, 2);
  }
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(angle);
  watchRect(ctx, '#674839', -3, -1, 15, 3);
  watchRect(ctx, '#bd9060', -2, -1, 14, 1);
  watchRect(ctx, '#4a565d', 8, -2, 5, 7);
  watchRect(ctx, '#75878c', 9, 1, 5, 5);
  watchRect(ctx, '#a9b8b6', 8, 5, 7, 3);
  watchRect(ctx, '#d6e4de', 8, 7, 7, 1);
  ctx.restore();
  watchRect(ctx, '#e3a97d', handX - 1, handY - 1, 3, 3);
}

function drawWatchPlayer(ctx, watch) {
  const { x, direction, step } = watch.player;
  const { weapon, lastChop } = watch;
  const chopPose = lastChop && WATCH_AXE_POSES[Math.floor((watch.tick - lastChop.at) / 2)];
  const hemSway = (step >> 2) % 2;
  ctx.save();
  ctx.translate(Math.round(x), watchGround(x));
  ctx.scale(chopPose ? lastChop.direction : direction, 1);
  watchRect(ctx, '#231e29', -8, -1, 16, 2);

  const edge = '#372634';
  watchRect(ctx, edge, -5, -15, 11, 14);
  watchRect(ctx, edge, -6, -10, 13, 9);
  watchRect(ctx, edge, -8 - hemSway, -4, 15 + hemSway, 4);
  watchRect(ctx, '#753e3c', -5, -13, 10, 12);
  watchRect(ctx, '#915040', -3, -15, 8, 13);
  watchRect(ctx, '#753e3c', -7 - hemSway, -3, 13 + hemSway, 2);
  watchRect(ctx, '#b66d4d', -1, -14, 5, 8);
  watchRect(ctx, '#b66d4d', 0, -6, 5, 4);
  watchRect(ctx, '#9e5946', -4, -7, 1, 5);
  watchRect(ctx, '#4e3037', -2, -10, 1, 8);
  watchRect(ctx, '#d08a61', 4, -13, 1, 5);

  watchRect(ctx, edge, -2, -25, 6, 2);
  watchRect(ctx, edge, -5, -23, 11, 9);
  watchRect(ctx, edge, 5, -21, 2, 5);
  watchRect(ctx, '#a66047', -4, -22, 9, 7);
  watchRect(ctx, '#ca825b', -2, -24, 5, 2);
  watchRect(ctx, '#d89265', 2, -22, 3, 1);
  watchRect(ctx, '#d89265', 5, -21, 1, 5);
  watchRect(ctx, '#231c29', 1, -21, 4, 5);
  watchRect(ctx, '#231c29', 2, -16, 3, 1);
  if (chopPose) {
    drawWatchAxe(ctx, chopPose);
  } else if (weapon) {
    const swingAge = watch.tick - watch.swingAt;
    const swinging = swingAge < WATCH_SWING_TICKS;
    const angle = swinging ? -1.6 + 2.45 * swingAge / WATCH_SWING_TICKS : -0.74;
    ctx.translate(5, -10);
    if (swinging) {
      ctx.strokeStyle = weapon === 'sword' ? '#ddeaeebc' : '#ffd091bc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22, angle - 0.65, angle + 0.12);
      ctx.stroke();
    }
    ctx.rotate(angle);
    drawWatchGear(ctx, weapon);
  }
  ctx.restore();
}

function drawWatchOpus(ctx, opus, watch) {
  const x = Math.round(opus.x);
  const ground = watchGround(x);
  const direction = -opus.side;
  const target = watchRaidWall(opus, watch.posts, watch.forwardWalls)?.wallX ?? watchTowerTarget(watch, opus.side);
  const groundOffset = (offset) => watchGround(Math.max(WATCH_BOUNDS.left,
    Math.min(WATCH_BOUNDS.right, x + direction * offset))) - ground;
  watchRect(ctx, '#281a377c', x - 11, ground - 1, 22, 2);
  ctx.save();
  ctx.translate(x, ground);
  ctx.scale(direction, 1);
  drawTriOpus(ctx, { stride: opus.stride, tick: watch.tick, groundOffset,
    walking: Math.abs(opus.x - target) > WATCH_OPUS_REACH, striking: watch.tick - opus.struckAt < 9 });
  ctx.restore();
}

export function drawInfectedGuard(ctx, enemy, watch) {
  const x = Math.round(enemy.x), ground = watchGround(x);
  const target = watchRaidWall(enemy, watch.posts, watch.forwardWalls)?.wallX ?? watchTowerTarget(watch, enemy.side);
  const stride = Math.abs(enemy.x - target) > WATCH_OPUS_REACH ? Math.round(2 * Math.sin(enemy.stride / 3)) : 0;
  const striking = watch.tick - enemy.struckAt < 9;
  ctx.save();
  ctx.translate(x, ground);
  ctx.scale(-enemy.side, 1);
  watchRect(ctx, '#281a377c', -10, -1, 23, 2);
  // The old uniform and bent hat remain visible beneath the pink growth.
  watchRect(ctx, '#45304b', -5 - stride, -7, 4, 7);
  watchRect(ctx, '#9a547a', 2 + stride, -6, 4, 6);
  watchRect(ctx, '#293044', -6 - stride, -1, 6, 2);
  watchRect(ctx, '#293044', 2 + stride, -1, 6, 2);
  sceneOval(ctx, '#60334f', -2, -12, 10, 9);
  sceneOval(ctx, '#bd6495', -4, -14, 8, 8);
  sceneOval(ctx, '#ed95b8', -6, -16, 5, 5);
  watchRect(ctx, '#75465e', -6, -10, 13, 6);
  watchRect(ctx, '#ba7c71', -5, -6, 11, 2);
  watchRect(ctx, '#5f5273', -8, -12, 5, 7);
  watchRect(ctx, '#f0a1c1', -7, -15, 3, 4);
  watchRect(ctx, '#b96d95', -1, -12, 4, 7);
  watchRect(ctx, '#6d80ac', 1, -7, 3, 6);
  watchRect(ctx, '#adcae0', 2, -2, 4, 1);
  sceneOval(ctx, '#dd83aa', 7, -13, 7, 5);
  watchRect(ctx, '#67354e', 3, -18, 11, 3);
  watchRect(ctx, enemy.rank ? '#e9b782' : '#b58065', 3, -19, 8, 2);
  if (enemy.rank) watchRect(ctx, '#d8a37d', 0, -20, 4, 2);
  watchRect(ctx, '#713b63', 9, -15, 5, 3);
  watchRect(ctx, '#ffba76', 10, -15, 3, 2);
  watchRect(ctx, '#392c44', 12, -15, 1, 2);
  watchRect(ctx, '#713b63', 12, -10, 3, 1);
  watchRect(ctx, '#d68bba', 8, -9, 3, 7);
  watchRect(ctx, '#6d80ac', 10, -3, 3, 3);
  if (striking) sceneGlow(ctx, '#f78cbd80', 13, -10, 9 + (watch.tick - enemy.struckAt) * 1.2);
  ctx.restore();
}

function flyerLine(ctx, color, fromX, fromY, toX, toY) {
  const steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY), 1);
  for (let step = 0; step <= steps; step++) {
    const progress = step / steps;
    watchRect(ctx, color, fromX + (toX - fromX) * progress, fromY + (toY - fromY) * progress, 1, 1);
  }
}

const FLYER_PIXEL_CONTEXTS = new WeakMap();

function flyerPixelContext(target) {
  let pixels = FLYER_PIXEL_CONTEXTS.get(target);
  if (pixels) return pixels;
  // Snap both edges before drawing: fractional canvas scaling blurs even when
  // image smoothing is disabled. This tiny fill-only adapter is reused per view.
  pixels = {
    get fillStyle() { return target.fillStyle; },
    set fillStyle(color) { target.fillStyle = color; },
    fillRect(x, y, width, height) {
      const left = Math.round(x * 0.65), top = Math.round(y * 0.65);
      const right = Math.round((x + width) * 0.65), bottom = Math.round((y + height) * 0.65);
      if (right > left && bottom > top) target.fillRect(left, top, right - left, bottom - top);
    }
  };
  FLYER_PIXEL_CONTEXTS.set(target, pixels);
  return pixels;
}

function drawFlyerWing(ctx, arm) {
  const { shoulder, elbow, wrist, fingers, far } = arm;
  // The wing is the arm: one shoulder, a bent elbow, a clawed hand and three
  // long webbed fingers. On the ground the fingers fold behind the planted hand.
  const armPoint = (t) => [
    Math.round((1 - t) ** 2 * shoulder[0] + 2 * (1 - t) * t * elbow[0] + t * t * wrist[0]),
    Math.round((1 - t) ** 2 * shoulder[1] + 2 * (1 - t) * t * elbow[1] + t * t * wrist[1])
  ];
  const points = [shoulder, armPoint(0.25), armPoint(0.5), armPoint(0.75), wrist, fingers[0],
    [Math.round((fingers[0][0] + fingers[1][0]) / 2), Math.min(fingers[0][1], fingers[1][1]) - 4],
    fingers[1], [Math.round((fingers[1][0] + fingers[2][0]) / 2), Math.min(fingers[1][1], fingers[2][1]) - 3],
    fingers[2], [shoulder[0], shoulder[1] + 5]];
  const top = Math.min(...points.map((point) => point[1]));
  const bottom = Math.max(...points.map((point) => point[1]));
  const tones = far ? ['#965f84', '#8e587e', '#855178', '#7d4b70', '#754569']
    : ['#e29dbb', '#d991b3', '#cf85aa', '#c47aa1', '#b86f98', '#ad648f'];
  for (let y = top; y < bottom; y++) {
    const cuts = [];
    for (let index = 0; index < points.length; index++) {
      const a = points[index], b = points[(index + 1) % points.length];
      if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) {
        cuts.push(a[0] + (y + 0.5 - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
    }
    cuts.sort((a, b) => a - b);
    for (let index = 0; index + 1 < cuts.length; index += 2) {
      const left = Math.ceil(cuts[index]), right = Math.floor(cuts[index + 1]);
      const width = right - left + 1;
      if (width < 1) continue;
      watchRect(ctx, '#4c2c48', left, y, width, 1);
      const shade = Math.min(tones.length - 1, Math.floor((y - top) * tones.length / Math.max(1, bottom - top)));
      if (width > 2) watchRect(ctx, tones[shade], left + 1, y, width - 2, 1);
    }
  }
  for (const finger of fingers) {
    flyerLine(ctx, far ? '#705d89' : '#935f9d', wrist[0], wrist[1], finger[0], finger[1]);
    if (!far) flyerLine(ctx, '#d597b7', wrist[0], wrist[1] - 1, finger[0], finger[1] - 1);
  }
  const length = Math.max(12, Math.abs(wrist[0] - shoulder[0]) + Math.abs(wrist[1] - shoulder[1]));
  for (let step = 0; step <= length; step++) {
    const t = step / length, [x, y] = armPoint(t), thickness = 2 + Math.round(3 * (1 - t));
    watchRect(ctx, far ? '#253b66' : '#254e86', x - 1, y - 1, 3, thickness);
    watchRect(ctx, far ? '#4577b7' : '#59aaf1', x, y, 2, Math.max(1, thickness - 2));
    if (!far) watchRect(ctx, '#83c5f3', x, y, 1, 1);
  }
  watchRect(ctx, far ? '#4577b7' : '#59aaf1', wrist[0] - 2, wrist[1] - 2, 5, 3);
  for (const offset of [-2, 0, 2]) {
    watchRect(ctx, far ? '#b6a3ac' : '#fae2cb', wrist[0] + offset, wrist[1], 1, 2);
  }
}

export function drawTriFlyer(ctx, flyer, tick) {
  const x = Math.round(flyer.x), ground = watchGround(x), altitude = Math.round(flyer.altitude);
  const crawling = flyer.mode === 'crawl';
  const diving = flyer.mode === 'dive';
  const beat = Math.sin(tick / 4 + flyer.side * 2);
  const stride = crawling ? Math.round(4 * Math.sin(flyer.stride / 4)) : 0;
  const target = ctx;
  target.save();
  try {
    watchRect(target, altitude ? '#281a373d' : '#281a377c', x - 18, ground - 1, 37, 2);
    target.translate(x, ground - altitude);
    target.scale(flyer.direction, 1);
    ctx = flyerPixelContext(target);
    const armPose = (side, far) => {
      const shoulder = [side < 0 ? -7 : 2, -13 - Number(far) * 3];
      let elbow, wrist;
      if (crawling || diving) {
        const step = side * (far ? -stride : stride);
        const reach = far ? 20 : 28;
        elbow = [side * (far ? 14 : 18), -12 - Number(far) * 3];
        wrist = [side * reach + step, far ? -3 : -1];
        if (crawling && (far ? -step : step) > 1) wrist[1] -= 3;
        if (diving) wrist[0] += side * 3;
      } else {
        elbow = [side * (far ? 20 : 25), -26 + Math.round(beat * (far ? -4 : 5))];
        wrist = [side * (far ? 31 : 41), (far ? -39 : -19) + Math.round(beat * (far ? -7 : 10))];
      }
      const folded = crawling || diving;
      const fingers = folded ? [
        [wrist[0] - side * 5, wrist[1] - 3],
        [wrist[0] - side * 11, wrist[1] - 5],
        [shoulder[0] + side * 2, shoulder[1] + 7]
      ] : [
        [wrist[0] - side * 6, wrist[1] + 17],
        [wrist[0] - side * 17, wrist[1] + 24],
        [shoulder[0] + side * 4, shoulder[1] + 13]
      ];
      return { shoulder, elbow, wrist, fingers, far };
    };
    // Two far arms remain separated from the two nearer arms in every pose.
    drawFlyerWing(ctx, armPose(-1, true));
    drawFlyerWing(ctx, armPose(1, true));
    // The familiar Opus torso leans into a small raised back, supported by arms.
    watchRect(ctx, '#582641', -13, -19, 15, 9);
    watchRect(ctx, '#a65379', -12, -21, 12, 10);
    watchRect(ctx, '#b04d73', -10, -23, 8, 10);
    watchRect(ctx, '#c76a91', -9, -22, 8, 7);
    watchRect(ctx, '#d98aa9', -8, -22, 4, 2);
    watchRect(ctx, '#e8a1bc', -7, -22, 2, 1);
    watchRect(ctx, '#582641', -8, -15, 15, 7);
    watchRect(ctx, '#a65379', -7, -14, 13, 5);
    watchRect(ctx, '#c76a91', -6, -16, 12, 6);
    watchRect(ctx, '#d98aa9', -6, -15, 5, 2);
    watchRect(ctx, '#e8a1bc', -5, -15, 2, 1);
    drawFlyerWing(ctx, armPose(-1, false));
    drawFlyerWing(ctx, armPose(1, false));
    // Canonical Opus head, including its rounded upper-left corner. The normal
    // eye position holds a tooth-lined mouth instead; this creature has no eye.
    watchRect(ctx, '#b04d73', 1, -21, 9, 12);
    watchRect(ctx, '#b04d73', -1, -20, 12, 11);
    watchRect(ctx, '#b04d73', -2, -18, 13, 9);
    watchRect(ctx, '#cf769b', 2, -20, 7, 7);
    watchRect(ctx, '#cf769b', 1, -19, 8, 6);
    watchRect(ctx, '#db8caf', 5, -18, 8, 8);
    watchRect(ctx, '#e8a1bc', 3, -20, 5, 1);
    watchRect(ctx, '#b66287', 3, -12, 3, 1);
    watchRect(ctx, '#ce7e9f', 8, -17, 5, 7);
    watchRect(ctx, '#893958', 8, -17, 7, 8);
    watchRect(ctx, '#2f2445', 9, -16, 5, diving ? 7 : 6);
    watchRect(ctx, '#a94470', 10, -11, 3, 2);
    watchRect(ctx, '#fae3dc', 9, -16, 1, 2);
    watchRect(ctx, '#fae3dc', 12, -16, 1, 2);
    watchRect(ctx, '#fae3dc', 10, -11, 1, 1);
    watchRect(ctx, '#fae3dc', 13, -11, 1, 2);
    watchRect(ctx, '#f1a1ba', 8, -9, 7, 1);
    if (flyer.hp < WATCH_FLYER_HEALTH) {
      watchRect(ctx, '#342039', -10, -41, 20, 3);
      watchRect(ctx, '#f295bc', -9, -40, Math.ceil(18 * flyer.hp / WATCH_FLYER_HEALTH), 1);
    }
  } finally {
    target.restore();
  }
}

const SPRAYER_MOUTH = { x: 9, y: -31 };
// Each row starts a section of the silhouette from the tilted crest to the foot.
const SPRAYER_PROFILE = [
  [-53, -22, -10], [-50, -26, -5], [-46, -26, 3], [-42, -23, 12],
  [-38, -21, 19], [-32, -22, 23], [-26, -26, 24], [-20, -31, 23],
  [-14, -39, 26], [-9, -46, 32], [-4, -51, 34], [0, -54, 30]
];

function drawIchorSprayer(ctx, sprayer, tick) {
  const x = Math.round(sprayer.x);
  const ground = watchGround(x);
  const contracting = Math.round(4 * Math.sin(tick / 8));
  const spraying = sprayer.spray && tick - sprayer.spray.at < WATCH_SPRAY_FLIGHT;
  const lean = spraying ? -3 : Math.round(contracting / 2);
  ctx.save();
  ctx.translate(x, ground);
  ctx.scale(-sprayer.side, 1);

  watchRect(ctx, '#3a2339a6', -54 - contracting, -2, 89 + contracting, 3);
  for (let section = 1; section < SPRAYER_PROFILE.length; section++) {
    const [top, startLeft, startRight] = SPRAYER_PROFILE[section - 1];
    const [bottom, endLeft, endRight] = SPRAYER_PROFILE[section];
    for (let y = top; y < bottom; y++) {
      const depth = (y - top) / (bottom - top);
      const sway = Math.round(lean * (-y / 53));
      const left = Math.round(startLeft + (endLeft - startLeft) * depth + sway - contracting * (1 + y / 53));
      const right = Math.round(startRight + (endRight - startRight) * depth + sway);
      const width = right - left;
      watchRect(ctx, '#482845', left, y, width, 1);
      if (y === -53 || y === -1) continue;
      watchRect(ctx, y > -6 ? '#435685' : '#9f3e70', left + 1, y, width - 2, 1);
      watchRect(ctx, y > -6 ? '#6595c3' : '#cc6498', left + 3, y, width - 9, 1);
    }
  }
  // Folds run through the crest and down into the same soft body.
  for (let row = 0; row < 31; row++) {
    const x = Math.round(-21 + (row < 13 ? row * 0.85 : 11 - (row - 13) * 0.45) + lean * (1 - row / 40));
    watchRect(ctx, '#b44d83', x - 1, -49 + row, 17, 1);
    watchRect(ctx, '#e88ab4', x, -49 + row, 5 + Math.floor(row / 8), 1);
    if (row < 15) watchRect(ctx, '#f3a6c6', x + 2, -49 + row, 2, 1);
  }
  for (const [x, y, width] of [[-26, -16, 14], [-37, -10, 13], [-17, -9, 16], [3, -12, 17]]) {
    const pull = Math.round(contracting * (x - 18) / 74);
    watchRect(ctx, '#b14a80', x + pull, y, width, 3);
    watchRect(ctx, '#e58ab3', x + pull + 2, y, width - 5, 1);
  }
  watchRect(ctx, '#8ab9d5', -37 - contracting, -4, 25, 1);
  watchRect(ctx, '#8ab9d5', 1, -4, 19, 1);

  const mouthX = SPRAYER_MOUTH.x;
  const mouthY = SPRAYER_MOUTH.y;
  const gape = spraying ? 9 : 5;
  sceneOval(ctx, '#ed92b5', mouthX, mouthY, 13, gape + 3);
  sceneOval(ctx, '#35192f', mouthX, mouthY - 1, 11, gape + 1);
  sceneOval(ctx, '#b74d6e', mouthX + 1, mouthY + 2, 9, gape - 2);
  watchRect(ctx, '#ef8a87', mouthX - 4, mouthY + 1, 10, 2);
  watchRect(ctx, '#f6b4a1', mouthX + 2, mouthY + 2, 5, 1);
  watchRect(ctx, '#d46e78', mouthX + 8, mouthY + 4, 2, 5);
  if (spraying) watchRect(ctx, '#faa49c', mouthX + 11, mouthY, 8, 4);

  watchRect(ctx, '#281925', -23, -66, 46, 4);
  watchRect(ctx, '#f17d89', -22, -65, Math.ceil(44 * sprayer.hp / WATCH_SPRAYER_HEALTH), 2);
  ctx.restore();
}

function drawWatchIchorSpray(ctx, sprayer, tick) {
  const { from, at } = sprayer.spray;
  const age = tick - at;
  const startX = from - sprayer.side * (SPRAYER_MOUTH.x + 9);
  const startY = watchGround(from) + SPRAYER_MOUTH.y;
  for (const [index, landing] of watchIchorLandings(sprayer).entries()) {
    const ground = watchGround(landing);
    if (age >= WATCH_SPRAY_FLIGHT) {
      const splash = (age - WATCH_SPRAY_FLIGHT) / WATCH_SPRAY_SPLASH;
      const spread = 3 + Math.round(5 * splash);
      watchRect(ctx, '#ac5268', landing - spread, ground - 1, spread * 2, 2);
      watchRect(ctx, '#f0a390', landing - spread, ground - 1, spread, 1);
      watchRect(ctx, '#f0a390', landing + spread, ground - 3 - Math.round(14 * splash * (1 - splash)), 2, 2);
      continue;
    }
    for (let trail = 2; trail >= 0; trail--) {
      const progress = (age - 3 * trail) / WATCH_SPRAY_FLIGHT;
      if (progress < 0) continue;
      const x = Math.round(startX + (landing - startX) * progress);
      const arch = (17 + index * 7) * 4 * progress * (1 - progress);
      const y = Math.round(startY + (ground - 2 - startY) * progress - arch);
      sceneOval(ctx, trail ? '#ba5b75' : '#e27985', x, y, 5 - trail, 3 - trail);
      if (!trail) watchRect(ctx, '#ffd0b4', x - 2, y - 1, 3, 1);
    }
  }
}

function drawTowerChair(ctx, chair, watch) {
  const occupied = watch.seatedChair === chair.id;
  const nearby = !watch.seatedChair && Math.abs(watch.interiorX - chair.x) <= 5;
  const trim = occupied ? '#ffe4b6' : nearby ? '#ffc18b' : '#df9568';
  ctx.save();
  ctx.translate(chair.x, WATCH_TOWER_ROOM.ground);
  ctx.scale(chair.direction, 1);
  // A slim, slightly reclined back is on the outer side; the seat faces inward.
  watchRect(ctx, '#542f31', -6, -21, 3, 13);
  watchRect(ctx, trim, -6, -22, 3, 2);
  watchRect(ctx, '#be714e', -5, -19, 1, 10);
  watchRect(ctx, '#ffe0ac', -5, -18, 1, 4);
  watchRect(ctx, '#542f31', -5, -12, 3, 7);
  watchRect(ctx, '#e69c6a', -4, -12, 1, 5);
  watchRect(ctx, '#743d35', -5, -8, 11, 3);
  watchRect(ctx, trim, -4, -8, 9, 1);
  watchRect(ctx, '#be704c', -4, -7, 8, 1);
  watchRect(ctx, '#542f31', -5, -5, 2, 6);
  watchRect(ctx, '#e69c6a', -5, -5, 1, 5);
  watchRect(ctx, '#542f31', 3, -5, 2, 6);
  watchRect(ctx, '#f4b17b', 3, -5, 1, 5);
  watchRect(ctx, '#a65e45', -3, -3, 6, 1);
  watchRect(ctx, '#d18a60', -6, 0, 3, 1);
  watchRect(ctx, '#d18a60', 3, 0, 3, 1);
  // Sharp metal glints and copper rivets replace the old wood grain.
  watchRect(ctx, '#ffe8bb', -5, -21, 1, 1);
  watchRect(ctx, '#ffe8bb', -4, -8, 2, 1);
  watchRect(ctx, '#ffd39a', 4, -8, 1, 1);
  watchRect(ctx, '#5f8c7e', -5, -13, 1, 1);
  watchRect(ctx, '#5f8c7e', 4, -1, 1, 1);
  ctx.restore();
}

function drawSeatedWatchPlayer(ctx, chair) {
  ctx.save();
  ctx.translate(chair.x, WATCH_TOWER_ROOM.ground);
  ctx.scale(chair.direction, 1);
  const edge = '#372634';
  watchRect(ctx, '#231e29', -5, 0, 16, 1);
  // The robe folds over the lap; knees bend forward toward the table.
  watchRect(ctx, edge, -5, -15, 10, 10);
  watchRect(ctx, '#753e3c', -4, -14, 8, 8);
  watchRect(ctx, '#915040', -2, -15, 6, 9);
  watchRect(ctx, '#b66d4d', -1, -14, 4, 6);
  watchRect(ctx, '#4e3037', -3, -12, 1, 7);
  watchRect(ctx, edge, -3, -8, 13, 5);
  watchRect(ctx, '#915040', -2, -8, 11, 3);
  watchRect(ctx, '#c07a53', -1, -8, 9, 1);
  watchRect(ctx, '#753e3c', 4, -6, 5, 2);
  for (const leg of [2, 7]) {
    watchRect(ctx, '#362933', leg, -4, 3, 4);
    watchRect(ctx, '#6d4438', leg, -3, 1, 3);
    watchRect(ctx, '#2d2530', leg, -1, 4, 2);
    watchRect(ctx, '#9b694b', leg + 1, -1, 2, 1);
  }
  // Keep the copper hood and dark face of the standing watchkeeper.
  watchRect(ctx, edge, -2, -23, 6, 2);
  watchRect(ctx, edge, -5, -21, 11, 9);
  watchRect(ctx, edge, 5, -19, 2, 5);
  watchRect(ctx, '#a66047', -4, -20, 9, 7);
  watchRect(ctx, '#ca825b', -2, -22, 5, 2);
  watchRect(ctx, '#d89265', 2, -20, 3, 1);
  watchRect(ctx, '#d89265', 5, -19, 1, 5);
  watchRect(ctx, '#231c29', 1, -19, 4, 5);
  watchRect(ctx, '#231c29', 2, -14, 3, 1);
  watchRect(ctx, edge, 2, -13, 8, 3);
  watchRect(ctx, '#b66d4d', 3, -13, 6, 2);
  watchRect(ctx, '#d08a61', 8, -13, 2, 2);
  ctx.restore();
}

function drawTowerDiningRoom(ctx, watch) {
  const { width, height, scale, ground, door } = WATCH_TOWER_ROOM;
  const wall = WATCH_TOWER_BUILDING.wall;
  watchRect(ctx, '#171722', 0, 0, VIEW_WIDTH, HEIGHT);
  ctx.save();
  // The room and player share one scale: this is a close view of the real room.
  ctx.translate((VIEW_WIDTH - width * scale) / 2, (HEIGHT - height * scale) / 2);
  ctx.scale(scale, scale);
  watchRect(ctx, '#332c2e', -wall, -wall, width + wall * 2, height + wall * 2);
  watchRect(ctx, '#56392c', 0, 0, width, ground);
  // Tall oak boards have staggered joints, fine grain, and dark little knots.
  const oak = ['#8a5938', '#986541', '#805032', '#a16d46'];
  for (let x = 0, board = 0; x < width; x += 6, board++) {
    const boardWidth = Math.min(6, width - x);
    watchRect(ctx, oak[board % oak.length], x, 0, boardWidth, ground - 3);
    watchRect(ctx, '#bc8754', x, 0, 1, ground - 3);
    watchRect(ctx, '#503528', x + boardWidth - 1, 0, 1, ground - 3);
    if (boardWidth < 5) continue;
    const joint = 18 + board % 3 * 9;
    watchRect(ctx, '#65412d', x + 1, joint, boardWidth - 2, 1);
    watchRect(ctx, '#b17a4a', x + 1, joint + 1, boardWidth - 2, 1);
    for (let y = 3 + board % 4; y < ground - 6; y += 13) {
      watchRect(ctx, '#74482f', x + 2, y, 1, 6);
      watchRect(ctx, '#b07b4d', x + 3, y + 3, 1, 7);
    }
    if (board % 3 === 1) {
      const knot = 9 + board * 7 % 30;
      watchRect(ctx, '#b18150', x + 1, knot - 1, 3, 3);
      watchRect(ctx, '#5f3b2b', x + 1, knot, 3, 1);
      watchRect(ctx, '#75452e', x + 2, knot - 1, 1, 3);
    }
  }
  // Thick oak edges and a worn plank floor enclose the windowless room.
  for (const x of [-wall, width]) {
    watchRect(ctx, '#4a342d', x, -wall, wall, height + wall * 2);
    watchRect(ctx, '#ad7c4f', x, 0, 1, height);
    for (const y of [8, 43]) {
      watchRect(ctx, '#55504a', x, y, wall, 2);
      watchRect(ctx, '#bca477', x + 1, y, 1, 1);
    }
  }
  watchRect(ctx, '#54392e', 0, -wall, width, wall);
  watchRect(ctx, '#bc8958', 0, -3, width, 1);
  watchRect(ctx, '#5b3d2f', 0, ground - 3, width, height - ground + 3);
  for (let y = ground - 2; y < height; y += 3) {
    watchRect(ctx, '#98643f', 0, y, width, 2);
    for (let x = (y % 2) * 9; x < width; x += 17) {
      if (x + 1 < width) watchRect(ctx, '#c08a53', x + 1, y, Math.min(8, width - x - 1), 1);
      if (x + 12 < width) watchRect(ctx, '#60402f', x + 12, y, 1, 2);
    }
  }
  // The taller, wider doorway sits directly in the center of the room.
  watchRect(ctx, '#392d2b', door - 10, ground - 36, 21, 36);
  watchRect(ctx, '#392d2b', door - 8, ground - 38, 17, 2);
  watchRect(ctx, '#c39b6b', door - 9, ground - 35, 19, 35);
  watchRect(ctx, '#c39b6b', door - 7, ground - 37, 15, 2);
  watchRect(ctx, '#5d3c2d', door - 7, ground - 34, 15, 34);
  for (let x = door - 6; x < door + 7; x += 3) {
    watchRect(ctx, '#a37547', x, ground - 33, 1, 31);
    watchRect(ctx, '#51372e', x + 1, ground - 32, 1, 32);
  }
  for (const y of [ground - 27, ground - 9]) {
    watchRect(ctx, '#47413b', door - 7, y, 15, 2);
    watchRect(ctx, '#aaa07d', door - 6, y, 1, 1);
    watchRect(ctx, '#aaa07d', door + 6, y + 1, 1, 1);
  }
  watchRect(ctx, '#f3c477', door + 4, ground - 18, 2, 3);
  watchRect(ctx, '#c29964', door - 10, ground, 21, 1);
  // A wall shelf holds plates and a small copper kettle.
  watchRect(ctx, '#4c352e', 52, 24, 24, 3);
  watchRect(ctx, '#b98650', 52, 24, 24, 1);
  for (const x of [54, 58]) {
    watchRect(ctx, '#ddd0a8', x, 20, 3, 4);
    watchRect(ctx, '#f6e4b8', x, 20, 2, 1);
  }
  watchRect(ctx, '#a55d3c', 69, 19, 5, 5);
  watchRect(ctx, '#e5a66c', 70, 19, 3, 4);
  watchRect(ctx, '#6e4932', 70, 17, 2, 2);
  watchRect(ctx, '#ca8a52', 74, 19, 2, 1);
  // The dining table sits in front of the centered door.
  const tableWidth = Math.floor(width * 0.8);
  const tableLeft = Math.round(door - tableWidth / 2);
  const tableRight = tableLeft + tableWidth;
  for (const x of [tableLeft + 3, door - 1, tableRight - 4]) {
    watchRect(ctx, '#6a442f', x, 40, 2, 12);
    watchRect(ctx, '#c38a52', x, 41, 1, 10);
  }
  watchRect(ctx, '#62352f', tableLeft + 1, 36, tableWidth - 2, 5);
  watchRect(ctx, '#bd4945', tableLeft, 36, tableWidth, 8);
  watchRect(ctx, '#e7745b', tableLeft + 1, 36, tableWidth - 2, 1);
  watchRect(ctx, '#9e353b', tableLeft, 39, tableWidth, 5);
  for (let x = tableLeft + 2; x < tableRight - 2; x += 5) {
    watchRect(ctx, '#d65b4e', x, 39, 1, 4);
    watchRect(ctx, '#6e2b34', x + 2, 39, 1, 5);
  }
  watchRect(ctx, '#e5b576', tableLeft, 43, tableWidth, 1);
  for (const x of [tableLeft + 5, tableLeft + 19, tableRight - 24, tableRight - 10]) {
    watchRect(ctx, '#d7c5a0', x, 34, 5, 2);
    watchRect(ctx, '#f5e2b7', x + 1, 34, 3, 1);
    watchRect(ctx, '#d1a66a', x - 2, 34, 1, 2);
  }
  watchRect(ctx, '#a77543', door - 1, 34, 3, 2);
  watchRect(ctx, '#f1d9a1', door, 30, 1, 4);
  watchRect(ctx, '#f2ae61', door, 28, 1, 2);
  watchRect(ctx, '#ffedab', door, 29, 1, 1);
  for (const x of [18, width - 8]) {
    sceneGlow(ctx, '#f3b86c38', x, 13, 12);
    watchRect(ctx, '#53372b', x - 1, 9, 3, 9);
    watchRect(ctx, '#c99253', x - 2, 10, 5, 7);
    watchRect(ctx, '#f1bd6b', x - 1, 11, 3, 5);
    watchRect(ctx, '#fff0b5', x, 11, 1, 3);
    watchRect(ctx, '#785134', x - 2, 16, 5, 1);
  }
  for (const chair of WATCH_TOWER_CHAIRS) drawTowerChair(ctx, chair, watch);
  const seat = WATCH_TOWER_CHAIRS.find(({ id }) => id === watch.seatedChair);
  if (seat) drawSeatedWatchPlayer(ctx, seat);
  else drawWatchPlayer(ctx, watch.interiorX, ground, watch.player.direction, (watch.player.step >> 2) % 2, null, 0);
  ctx.restore();
}

function drawWatchArrow(ctx, shot, watch) {
  if (shot.end <= watch.tick) return;
  let { x, y, vx, vy } = shot;
  if (!shot.ballistic) {
    // Older saves contain a short-lived trace, not a physical projectile. Show
    // only its moving arrowhead while that legacy visual finishes expiring.
    const startY = watchGround(shot.from) - 12;
    const targetY = watchGround(shot.to) - (shot.kind === 'pigeon' ? 6 : 16) - (shot.altitude ?? 0);
    const progress = Math.max(0, Math.min(1, 1 - (shot.end - watch.tick) / 9));
    vx = shot.to - shot.from;
    vy = targetY - startY;
    x = shot.from + vx * progress;
    y = startY + vy * progress;
  }
  if (![x, y, vx, vy].every(Number.isFinite) || x < watch.camera - 12
      || x >= watch.camera + VIEW_WIDTH + 12 || y < -12 || y > HEIGHT + 12) return;
  const speed = Math.hypot(vx, vy);
  const dx = speed > 0 ? vx / speed : shot.to >= shot.from ? 1 : -1;
  const dy = speed > 0 ? vy / speed : 0;
  const featherX = x - dx * 6, featherY = y - dy * 6;
  const shaft = shot.stuck ? '#b88b58' : '#d3a56b';
  // The model's x/y is the tip. A short wooden shaft follows its current
  // velocity, so rising, falling and grounded arrows share the same anatomy.
  for (let step = 1; step <= 7; step++) {
    const shaftX = x - dx * step, shaftY = y - dy * step;
    watchRect(ctx, '#785637', shaftX - dy, shaftY + dx, 1, 1);
    watchRect(ctx, shaft, shaftX, shaftY, 1, 1);
  }
  watchRect(ctx, '#d8ddd1', featherX - dy, featherY + dx, 1, 1);
  watchRect(ctx, '#a1b5b5', featherX + dy, featherY - dx, 1, 1);
  watchRect(ctx, '#d5cdb8', x - dx - dy, y - dy + dx, 1, 1);
  watchRect(ctx, '#f8edd0', x, y, 1, 1);
}

export function drawCreekWatch(ctx, watch, canopyShade) {
  if (watch.insideTower) {
    drawTowerDiningRoom(ctx, watch);
    return;
  }
  drawWatchSky(ctx, watch, canopyShade);
  const left = watch.camera;
  const onScreen = (x, margin) => x >= left - margin && x < left + VIEW_WIDTH + margin;
  ctx.save();
  ctx.translate(-left, 0);
  drawWatchPortalVines(ctx, watch, left);
  for (const tree of WATCH_TREES) if (onScreen(tree.x, tree.height + 24)) drawWatchBirch(ctx, tree, watch);
  if (onScreen(WATCH_SIGNAL, 86)) drawWatchBridge(ctx);
  if (onScreen(WATCH_SIGNAL, 46)) drawWatchSignal(ctx, watch);
  if (watch.marketOpen) {
    for (const vendor of WATCH_VENDORS) if (onScreen(vendor.x, 23)) drawWatchStall(ctx, vendor);
  }
  for (const portal of WATCH_PORTALS) {
    if (!onScreen(portal.x, 46)) continue;
    const { x, side } = portal;
    const y = watchGround(x);
    drawTriPortalAura(ctx, x, y, -side, watch.portalOpening, watch.tick);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-side, 1);
    drawTriPortal(ctx, watch.portalOpening);
    ctx.restore();
  }
  for (const camp of WATCH_CAMPS) if (onScreen(camp.x, 50)) drawWatchCamp(ctx, camp, watch);
  if (watch.phase === 'day') {
    for (const [bird, pigeon] of WATCH_PIGEONS.entries()) {
      if (watch.huntedPigeons & (1 << bird)) continue;
      const pose = watchPigeonPose(pigeon, watch.tick);
      if (onScreen(pose.x, 11)) drawWatchPigeon(ctx, pose, watch.tick);
    }
  }
  for (const wall of watch.forwardWalls) if (onScreen(wall.wallX, 34)) drawWatchPost(ctx, wall);
  for (const post of watch.posts) {
    drawWatchPost(ctx, post);
    for (let index = 0; index < post.guards.length; index++) {
      const x = watch.guardPosition(post, index);
      if (onScreen(x, 18)) drawWatchGuard(ctx, x, watchGround(x) - watch.guardElevation(post, index), post.guards[index], watch.tick);
    }
  }
  for (const builder of watch.builders ?? []) {
    if (onScreen(builder.x, 18)) drawWatchBuilder(ctx, builder, watch.tick);
  }
  for (const coin of watch.loot) {
    const flight = coin.tossAt === undefined ? 1 : Math.min(1, (watch.tick - coin.tossAt) / WATCH_COIN_TOSS_TICKS);
    const x = flight === 1 ? coin.x : coin.tossFrom + (coin.x - coin.tossFrom) * flight;
    if (!onScreen(x, 3)) continue;
    const y = watchGround(x) - 4 - (watch.tick >> 4) % 2 - Math.round(Math.sin(flight * Math.PI) * 15);
    watchRect(ctx, '#9d573e', x - 2, y - 2, 5, 5);
    watchRect(ctx, '#f1b36a', x - 1, y - 2, 3, 4);
    watchRect(ctx, '#ffe4a8', x, y - 1, 1, 2);
  }
  for (const sprayer of watch.sprayers ?? (watch.sprayer ? [watch.sprayer] : [])) {
    if (sprayer.hp > 0 && onScreen(sprayer.x, 54)) drawIchorSprayer(ctx, sprayer, watch.tick);
    if (sprayer.spray && onScreen(sprayer.spray.from, 104)) drawWatchIchorSpray(ctx, sprayer, watch.tick);
  }
  for (const raider of watch.raiders) {
    if (!onScreen(raider.x, 26)) continue;
    if (raider.kind === 'infected') drawInfectedGuard(ctx, raider, watch);
    else drawWatchOpus(ctx, raider, watch);
  }
  for (const flyer of watch.flyers ?? []) if (flyer.hp > 0 && onScreen(flyer.x, 48)) drawTriFlyer(ctx, flyer, watch.tick);
  for (const shot of watch.shots) drawWatchArrow(ctx, shot, watch);
  const { x } = watch.player;
  if (watch.tick - watch.playerHurtAt < 10) sceneGlow(ctx, '#ff877caa', x, watchGround(x) - 13, 17);
  drawWatchPlayer(ctx, watch);
  ctx.restore();
}
