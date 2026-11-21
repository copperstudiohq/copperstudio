import { HEIGHT, POND_LEVEL, VIEW_WIDTH, quarryHeight } from './simulation.js';
import { drawSceneSky, drawTriOpus, drawTriPortal, drawTriPortalAura, sceneGlow, sceneOval } from './art.js';
import { WATCH_BOUNDS, WATCH_BRIDGE, WATCH_CAMPS, WATCH_PIGEONS, WATCH_PORTALS, WATCH_SIGNAL, WATCH_OPUS_REACH, WATCH_SPRAYER_HEALTH, WATCH_SPRAY_FLIGHT, WATCH_SPRAY_SPLASH, WATCH_SWING_TICKS, WATCH_TOWER_BUILDING, WATCH_TOWER_ROOM, WATCH_VENDORS, watchGround, watchIchorLandings, watchRaidWall, watchPigeonPose, watchRecruitPose, watchTowerTarget } from './watch.js';
import { drawVendorPortraitImage } from './vendor-portraits.js';

function watchRect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
}

function drawWatchSky(ctx, watch) {
  const night = watch.phase === 'night';
  const x = drawSceneSky(ctx, night, watch.phaseProgress, watch.bloodMoon);
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

function drawWatchSignal(ctx, watch) {
  if (watch.towerUpgraded) {
    drawUpgradedWatchSignal(ctx, watch);
    return;
  }
  const x = WATCH_SIGNAL;
  const y = WATCH_BRIDGE.y;
  for (const offset of [-13, 9]) {
    const pier = x + offset;
    watchRect(ctx, '#49352f', pier, y + 2, 6, quarryHeight(pier) - y - 2);
    watchRect(ctx, '#8a6349', pier, y + 2, 2, POND_LEVEL - y - 2);
  }
  watchRect(ctx, '#332d35', x - 17, y - 4, 35, 5);
  watchRect(ctx, '#3b343c', x - 13, y - 43, 27, 41);
  watchRect(ctx, '#78665e', x - 12, y - 42, 19, 39);
  watchRect(ctx, '#514b50', x + 7, y - 42, 5, 39);
  for (let row = 0; row < 8; row++) {
    const top = y - 41 + row * 5;
    watchRect(ctx, '#55494a', x - 12, top + 4, 24, 1);
    watchRect(ctx, '#98816b', x - 11 + (row % 2) * 4, top, 9, 1);
    watchRect(ctx, '#55494a', x - 3 + (row % 2) * 4, top, 1, 4);
  }
  watchRect(ctx, '#a28270', x - 7, y - 19, 14, 17);
  watchRect(ctx, '#24232e', x - 5, y - 16, 10, 16);
  watchRect(ctx, '#24232e', x - 3, y - 18, 6, 4);
  watchRect(ctx, '#694c42', x - 4, y - 15, 8, 14);
  watchRect(ctx, '#574143', x - 4, y - 13, 2, 12);
  watchRect(ctx, '#41343a', x + 1, y - 15, 1, 14);
  watchRect(ctx, '#8b746a', x - 3, y - 11, 7, 1);
  watchRect(ctx, '#8b746a', x - 3, y - 5, 7, 1);
  watchRect(ctx, '#dbac73', x + 2, y - 9, 1, 2);
  watchRect(ctx, '#a28270', x - 7, y - 1, 14, 1);
  watchRect(ctx, '#c48b66', x - 13, y - 24, 26, 2);
  for (const offset of [-10, 8]) {
    watchRect(ctx, '#e1b389', x + offset, y - 24, 1, 1);
    watchRect(ctx, '#473b41', x + offset - 1, y - 22, 3, 2);
  }
  watchRect(ctx, '#432f37', x - 18, y - 44, 37, 4);
  watchRect(ctx, '#a86750', x - 17, y - 45, 35, 2);
  watchRect(ctx, '#283441', x - 11, y - 56, 22, 13);
  watchRect(ctx, '#425c60', x - 9, y - 56, 18, 11);
  watchRect(ctx, '#922f44', x - 16, y - 57, 32, 3);
  for (let tier = 0; tier < 5; tier++) {
    watchRect(ctx, tier % 2 ? '#d6966d' : '#b87455', x - 14 + tier * 2, y - 59 - tier * 2, 29 - tier * 4, 2);
  }
  watchRect(ctx, '#e8aa78', x - 1, y - 72, 2, 5);
  if (watch.signal > 0) {
    const flame = ((watch.tick >> 3) % 2);
    sceneGlow(ctx, '#8aecc3ad', x, y - 50, 13 + watch.signal * 1.25);
    watchRect(ctx, '#408a81', x - 7, y - 55, 14, 10);
    watchRect(ctx, '#90e6c2', x - 4, y - 51 - flame, 8, 6 + flame);
    watchRect(ctx, '#f2f8c8', x - 2, y - 51, 4, 5);
    for (let row = 0; row < 5; row++) {
      watchRect(ctx, '#8febbe55', x - 6 + Math.round(Math.sin(watch.tick / 18 + row) * 4),
        POND_LEVEL + row * 3, 13 - row, 1);
    }
  }
  watchRect(ctx, '#e1a972', x - 10, y - 55, 2, 10);
  watchRect(ctx, '#ad785c', x + 8, y - 55, 2, 10);
  watchRect(ctx, '#625358', x, y - 55, 1, 10);
  watchRect(ctx, '#92725e', x - 8, y - 52, 16, 1);
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
  if (watch.signal > 0) {
    const flame = (watch.tick >> 3) % 2;
    sceneGlow(ctx, '#8aecc3ad', x, roofTop + 23, 15 + watch.signal);
    watchRect(ctx, '#408a81', x - 8, roofTop + 16, 17, 14);
    watchRect(ctx, '#90e6c2', x - 5, roofTop + 19 - flame, 11, 10 + flame);
    watchRect(ctx, '#f2f8c8', x - 2, roofTop + 21, 5, 7);
  }
}

function drawWatchPost(ctx, post) {
  const x = post.wallX;
  const y = watchGround(x);
  if (post.forward) {
    watchRect(ctx, '#785d4d', x + 12, y - 26, 2, 26);
    watchRect(ctx, '#bf8a5d', x + 12, y - 27, 10, 2);
    watchRect(ctx, '#6d8f82', x + 14, y - 25, 8, 7);
    watchRect(ctx, '#abd0a7', x + 15, y - 24, 5, 1);
    watchRect(ctx, '#517666', x + 15, y - 18, 4, 2);
  }
  if (!post.health) {
    watchRect(ctx, '#543d3a', x - 7, y - 2, 15, 2);
    watchRect(ctx, '#825b48', x - 4, y - 6, 3, 6);
    watchRect(ctx, '#825b48', x + 3, y - 7, 3, 7);
    watchRect(ctx, '#c0926a', x - 5, y - 6, 12, 2);
    watchRect(ctx, '#e0ae7c', x - 4, y - 6, 1, 1);
    watchRect(ctx, '#e0ae7c', x + 4, y - 6, 1, 1);
  } else {
    const reinforced = post.tier === 2;
    const height = reinforced ? 24 : 18;
    for (let i = -2; i <= 2; i++) {
      const top = y - height + Math.abs(i);
      watchRect(ctx, '#5e4141', x + i * 3 - 2, top + 1, 4, y - top);
      watchRect(ctx, '#b27a58', x + i * 3 - 1, top, 2, y - top);
      watchRect(ctx, '#d0a075', x + i * 3 - 1, top + 1, 1, 4);
    }
    for (const beam of [-height + 7, -6]) {
      watchRect(ctx, '#4c383b', x - 9, y + beam, 19, 3);
      watchRect(ctx, reinforced ? '#7ba99b' : '#967059', x - 8, y + beam, 17, 1);
      watchRect(ctx, reinforced ? '#c1dfbd' : '#c79b72', x - 6, y + beam + 1, 1, 1);
      watchRect(ctx, reinforced ? '#c1dfbd' : '#c79b72', x + 6, y + beam + 1, 1, 1);
    }
    const strength = post.health / (reinforced ? 11 : 6);
    watchRect(ctx, '#221e2b', x - 9, y - height - 4, 18, 2);
    watchRect(ctx, '#86bfa6', x - 9, y - height - 4, Math.ceil(18 * strength), 2);
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
  ctx.save();
  ctx.translate(Math.round(x), y);
  ctx.scale(guard.direction, 1);
  watchRect(ctx, '#252433', -6, -1, 13, 2);
  const stride = guard.walking ? Math.round(3 * Math.sin(guard.stride * Math.PI / 8)) : 0;
  watchRect(ctx, '#354358', -3 - stride, -6, 4, 6 - Number(stride < 0));
  watchRect(ctx, '#68868c', 1 + stride, -6, 4, 6 - Number(stride > 0));
  watchRect(ctx, '#354258', -5, -16, 11, 11);
  watchRect(ctx, '#6489a5', -4, -15, 8, 7);
  watchRect(ctx, veteran ? '#edc28d' : '#ac7d5b', -4, -8, 9, 2);
  watchRect(ctx, '#cda98e', -2, -21, 7, 5);
  watchRect(ctx, '#372e3d', 2, -20, 4, 2);
  watchRect(ctx, '#584447', -5, -23, 11, 3);
  watchRect(ctx, veteran ? '#eebc81' : '#bd845f', -4, -24, 8, 3);
  watchRect(ctx, veteran ? '#a8d8d4' : '#82adc1', -5, -17, 4, 4);
  if (veteran) watchRect(ctx, '#edbf82', -4, -26, 3, 2);
  const bow = shooting ? 9 : 7;
  watchRect(ctx, '#c98859', bow, -17, 1, 12);
  watchRect(ctx, '#e3b283', bow - 2, -18, 2, 2);
  watchRect(ctx, '#e3b283', bow - 2, -6, 2, 2);
  watchRect(ctx, '#b6c9c7', bow - 2, -16, 1, 10);
  watchRect(ctx, '#b6cad4', 2, -13, bow - 2, 2);
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

function drawWatchPlayer(ctx, x, y, direction, hemSway, weapon, swingAge) {
  ctx.save();
  ctx.translate(Math.round(x), y);
  ctx.scale(direction, 1);
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
  if (weapon) {
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
  for (const x of [tableLeft - 5, tableRight + 2]) {
    watchRect(ctx, '#49322c', x, 34, 4, 18);
    watchRect(ctx, '#b58250', x, 34, 4, 2);
    watchRect(ctx, '#bc8d56', x, 38, 1, 14);
    watchRect(ctx, '#a26d42', x, 44, 5, 2);
    watchRect(ctx, '#63432f', x + 3, 46, 1, 6);
  }
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
  drawWatchPlayer(ctx, watch.interiorX, ground, watch.player.direction, (watch.player.step >> 2) % 2, null, 0);
  ctx.restore();
}

export function drawCreekWatch(ctx, watch) {
  if (watch.insideTower) {
    drawTowerDiningRoom(ctx, watch);
    return;
  }
  drawWatchSky(ctx, watch);
  const left = watch.camera;
  const onScreen = (x, margin) => x >= left - margin && x < left + VIEW_WIDTH + margin;
  ctx.save();
  ctx.translate(-left, 0);
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
  for (const wall of watch.forwardWalls) if (onScreen(wall.wallX, 24)) drawWatchPost(ctx, wall);
  for (const post of watch.posts) {
    drawWatchPost(ctx, post);
    for (let index = 0; index < post.guards.length; index++) {
      const x = watch.guardPosition(post, index);
      if (onScreen(x, 12)) drawWatchGuard(ctx, x, watchGround(x), post.guards[index], watch.tick);
    }
  }
  for (const coin of watch.loot) {
    if (!onScreen(coin.x, 3)) continue;
    const y = watchGround(coin.x) - 4 - (watch.tick >> 4) % 2;
    watchRect(ctx, '#9d573e', coin.x - 2, y - 2, 5, 5);
    watchRect(ctx, '#f1b36a', coin.x - 1, y - 2, 3, 4);
    watchRect(ctx, '#ffe4a8', coin.x, y - 1, 1, 2);
  }
  const { sprayer } = watch;
  if (sprayer?.hp > 0 && onScreen(sprayer.x, 54)) drawIchorSprayer(ctx, sprayer, watch.tick);
  if (sprayer?.spray && onScreen(sprayer.spray.from, 104)) drawWatchIchorSpray(ctx, sprayer, watch.tick);
  for (const raider of watch.raiders) {
    if (!onScreen(raider.x, 26)) continue;
    drawWatchOpus(ctx, raider, watch);
  }
  ctx.strokeStyle = '#f7d99dba';
  ctx.lineWidth = 1.2;
  for (const shot of watch.shots) {
    ctx.beginPath();
    ctx.moveTo(shot.from, watchGround(shot.from) - 12);
    ctx.lineTo(shot.to, watchGround(shot.to) - (shot.kind === 'pigeon' ? 6 : 16));
    ctx.stroke();
  }
  const { x, direction, step } = watch.player;
  drawWatchPlayer(ctx, x, watchGround(x), direction, (step >> 2) % 2, watch.weapon, watch.tick - watch.swingAt);
  ctx.restore();
}
