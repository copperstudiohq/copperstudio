import { POND_LEVEL, VIEW_WIDTH, quarryHeight } from './simulation.js';
import { drawSceneSky, drawTriPortal, drawTriPortalAura, sceneGlow } from './art.js';
import { WATCH_BOUNDS, WATCH_BRIDGE, WATCH_CAMPS, WATCH_PORTALS, WATCH_SIGNAL, WATCH_WISP_REACH, watchGround, watchWispWall } from './watch.js';

function watchRect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
}

function drawWatchSky(ctx, watch) {
  const night = watch.phase === 'night';
  const x = drawSceneSky(ctx, night, watch.phaseProgress);
  const worldX = watch.camera + x;
  const reflectionX = Math.max(WATCH_BRIDGE.left + 39, Math.min(WATCH_BRIDGE.right - 29, worldX));
  for (let row = 0; row < 12; row++) {
    const waveY = POND_LEVEL + row;
    const shimmer = Math.sin(row * 2.2 + watch.tick / 18);
    const width = 6 + row + Math.round((shimmer + 1) * 3);
    const tint = night ? '176,191,247' : '255,197,126';
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
    watchRect(ctx, '#282834', x, y + 3, 4, depth);
    watchRect(ctx, '#776051', x, y + 3, 1, Math.min(20, depth));
    watchRect(ctx, '#605657', x - 4, y + 6, 12, 2);
    for (let brace = 0; brace < Math.min(8, depth - 6); brace++) {
      watchRect(ctx, '#67483f', x - 6 + brace, y + 5 + brace, 2, 1);
      watchRect(ctx, '#4e3f42', x + 8 - brace, y + 5 + brace, 2, 1);
    }
    watchRect(ctx, '#83a7a05e', x - 2, POND_LEVEL, 9, depth > POND_LEVEL - y ? 1 : 0);
  }
  watchRect(ctx, '#3d3338', left, y + 5, right - left + 1, 2);
  watchRect(ctx, '#805542', left, y, right - left + 1, 5);
  watchRect(ctx, '#c28d63', left, y, right - left + 1, 1);
  for (let x = left + 5; x < right; x += 8) {
    watchRect(ctx, '#4c3939', x, y + 2, 1, 3);
    watchRect(ctx, '#a36a4e', x + 1, y + 2, 4, 1);
  }
}

function drawWatchSignal(ctx, watch) {
  const x = WATCH_SIGNAL;
  const y = WATCH_BRIDGE.y;
  for (const offset of [-13, 9]) {
    const pier = x + offset;
    watchRect(ctx, '#343343', pier, y + 2, 6, quarryHeight(pier) - y - 2);
    watchRect(ctx, '#71645d', pier, y + 2, 2, POND_LEVEL - y - 2);
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
  watchRect(ctx, '#574143', x - 4, y - 13, 2, 12);
  watchRect(ctx, '#c48b66', x - 13, y - 24, 26, 2);
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
    watchRect(ctx, '#e1a972', x - 10, y - 55, 2, 10);
    watchRect(ctx, '#ad785c', x + 8, y - 55, 2, 10);
    for (let row = 0; row < 5; row++) {
      watchRect(ctx, '#8febbe55', x - 6 + Math.round(Math.sin(watch.tick / 18 + row) * 4),
        POND_LEVEL + row * 3, 13 - row, 1);
    }
  }
}

function drawWatchPost(ctx, post) {
  const x = post.wallX;
  const y = watchGround(x);
  if (!post.health) {
    watchRect(ctx, '#825b48', x - 4, y - 6, 2, 6);
    watchRect(ctx, '#825b48', x + 3, y - 7, 2, 7);
    watchRect(ctx, '#c0926a', x - 5, y - 6, 11, 2);
  } else {
    const height = post.tier === 2 ? 24 : 18;
    for (let i = -2; i <= 2; i++) {
      const top = y - height + Math.abs(i);
      watchRect(ctx, '#5e4141', x + i * 3 - 2, top + 1, 4, y - top);
      watchRect(ctx, '#b27a58', x + i * 3 - 1, top, 2, y - top);
    }
    watchRect(ctx, post.tier === 2 ? '#afd5ca' : '#754945', x - 9, y - 8, 19, 2);
    const strength = post.health / (post.tier === 2 ? 11 : 6);
    watchRect(ctx, '#221e2b', x - 9, y - height - 4, 18, 2);
    watchRect(ctx, '#86bfa6', x - 9, y - height - 4, Math.ceil(18 * strength), 2);
  }
}

function drawWatchCamp(ctx, camp, tick) {
  const { x, side } = camp;
  const flicker = (tick >> 3) % 2;
  ctx.save();
  ctx.translate(x, watchGround(x));
  ctx.scale(-side, 1);
  watchRect(ctx, '#2b252cb8', -31, -2, 67, 3);
  sceneGlow(ctx, '#ec9e627e', 29, -7, 17 + flicker);

  // A ripped strip of canvas hangs from the remaining sticks.
  for (let row = 0; row < 21; row++) {
    const y = row - 22;
    const spread = Math.floor(row * .81);
    const left = -14 - spread;
    watchRect(ctx, '#353031', left, y, spread + 2, 1);
    const hem = row < 13 ? -7 + Math.floor(row / 4) : -14 - Math.floor((row - 12) / 2);
    if (row < 18) watchRect(ctx, row % 4 ? '#756952' : '#8e7e5d', left + 2, y, hem - left - 1, 1);
    watchRect(ctx, '#b08a61', left, y, 2, 1);
    if (row < 10 || row > 14) watchRect(ctx, row < 10 ? '#a27a58' : '#80593f', -12 + spread, y, 2, 1);
  }
  watchRect(ctx, '#b48c68', -14, -26, 2, 5);
  watchRect(ctx, '#8b654a', -12, -25, 3, 2);
  watchRect(ctx, '#d9b588', -14, -22, 5, 2);
  watchRect(ctx, '#524138', -27, -4, 15, 2);
  watchRect(ctx, '#a77850', -13, -3, 9, 2);
  watchRect(ctx, '#704b35', -5, -2, 8, 2);

  // Bark and end grain frame the seated recruit's bent legs.
  watchRect(ctx, '#382b2b', 7, -7, 16, 7);
  watchRect(ctx, '#77513a', 8, -7, 14, 5);
  watchRect(ctx, '#382c2a', 11, -4, 8, 2);
  watchRect(ctx, '#bd9066', 7, -6, 5, 5);
  watchRect(ctx, '#7e543e', 8, -5, 3, 3);
  watchRect(ctx, '#bf8b5d', 9, -4, 1, 1);
  watchRect(ctx, '#333039', 12, -10, 9, 4);
  watchRect(ctx, '#56535b', 18, -9, 4, 7);
  watchRect(ctx, '#9e7158', 20, -3, 5, 3);
  watchRect(ctx, '#393a39', 10, -18, 7, 9);
  watchRect(ctx, '#637567', 11, -17, 5, 7);
  watchRect(ctx, '#abb199', 13, -15, 4, 3);
  watchRect(ctx, '#cfa183', 16, -13, 4, 2);
  watchRect(ctx, '#b98265', 12, -22, 7, 5);
  watchRect(ctx, '#e4b189', 15, -21, 4, 3);
  watchRect(ctx, '#4b3b3b', 11, -23, 7, 3);
  watchRect(ctx, '#514342', 17, -20, 1, 1);

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
  watchRect(ctx, '#354358', -4, -6, 4, 6);
  watchRect(ctx, '#68868c', 2, -6, 3, 6);
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

function drawWatchPlayer(ctx, x, y, direction, hemSway) {
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
  ctx.restore();
}

function drawWispLeg(ctx, x, ground, direction, hip, phase, walking, near) {
  // During support, the foot moves backward relative to the advancing body.
  const progress = phase % 1;
  const swinging = walking && phase >= 1;
  const offset = walking ? Math.round(swinging ? -6 + progress * 12 : 6 - progress * 12) : 0;
  const foot = hip + offset;
  const footX = Math.max(WATCH_BOUNDS.left, Math.min(WATCH_BOUNDS.right, x + direction * (foot + 1)));
  const lift = swinging ? Math.round(3 * Math.sin(progress * Math.PI)) : 0;
  const sole = watchGround(footX) - ground - lift;
  const knee = Math.round((hip + foot) / 2) + 1;
  const kneeY = Math.round((-9 + sole) / 2);
  const shade = near ? '#a94d71' : '#74334f';
  watchRect(ctx, shade, Math.min(hip, knee) - 1, -10, Math.abs(hip - knee) + 4, kneeY + 12);
  watchRect(ctx, shade, Math.min(knee, foot) - 1, kneeY, Math.abs(knee - foot) + 3, sole - kneeY);
  watchRect(ctx, near ? '#e283a3' : '#b35c7c', foot - 1, sole - 2, 6, 2);
}

function drawWatchWisp(ctx, wisp, watch) {
  const x = Math.round(wisp.x);
  const ground = watchGround(x);
  const direction = -wisp.side;
  const target = watchWispWall(wisp, watch.posts)?.wallX ?? WATCH_SIGNAL;
  const walking = Math.abs(wisp.x - target) > WATCH_WISP_REACH;
  const striking = watch.tick - wisp.struckAt < 9;
  const phase = (wisp.stride % 16) / 8;
  const sway = walking ? Math.round(3 * Math.cos(phase * Math.PI)) : 0;
  const bob = walking ? Math.round(Math.sin(phase * Math.PI) ** 2) : 0;
  watchRect(ctx, '#281a377c', x - 11, ground - 1, 22, 2);
  ctx.save();
  ctx.translate(x, ground);
  ctx.scale(direction, 1);
  drawWispLeg(ctx, x, ground, direction, 1, (phase + 1) % 2, walking, false);
  drawWispLeg(ctx, x, ground, direction, -4, phase, walking, true);
  ctx.translate(0, -bob);

  watchRect(ctx, '#783651', 3, -13, 5, 7);
  watchRect(ctx, '#a65172', 6 + sway, -8, 6, 3);
  watchRect(ctx, '#582641', -9, -16, 16, 8);
  watchRect(ctx, '#8f3b60', -8, -15, 14, 6);
  watchRect(ctx, '#c76188', -6, -17, 13, 7);
  watchRect(ctx, '#e18aa6', -6, -17, 6, 3);

  // The head sits back over the shoulder, with the eye facing forward.
  ctx.save();
  ctx.translate(-9, 1);
  watchRect(ctx, '#582641', -2, -24, 13, 14);
  watchRect(ctx, '#582641', 10, -21, 5, 10);
  watchRect(ctx, '#b04d73', -1, -23, 12, 12);
  watchRect(ctx, '#d87196', 1, -23, 9, 8);
  watchRect(ctx, '#e18cab', 6, -21, 8, 9);
  watchRect(ctx, '#f5aac2', 3, -23, 6, 2);
  watchRect(ctx, '#893958', 9, -20, 5, 8);
  watchRect(ctx, '#ffe4ea', 9, -19, 4, 6);
  watchRect(ctx, striking ? '#f8aa79' : '#7ecee5', 10, -19, 3, 6);
  watchRect(ctx, '#2f2445', 12, -18, 2, 4);
  watchRect(ctx, '#fffaf2', 11, -19, 1, 1);
  ctx.restore();

  const hand = striking ? 13 : 5 - sway;
  watchRect(ctx, '#8d3c61', -4, -14, 5, 8);
  watchRect(ctx, '#c8648b', -2, -12, 4, 6);
  watchRect(ctx, '#df81a2', 0, -7, hand + 3, 3);
  watchRect(ctx, '#f5a6bc', hand + 1, -6, 4, 3);
  if (striking) {
    sceneGlow(ctx, '#ffba9a77', 16, -6, 15);
    watchRect(ctx, '#ffd994', 17, -7, 5, 2);
    watchRect(ctx, '#ffe9b0', 21, -6, 2, 5);
    watchRect(ctx, '#f0a083', 22, -2, 3, 2);
  }
  ctx.restore();
}

export function drawCreekWatch(ctx, watch) {
  drawWatchSky(ctx, watch);
  const left = watch.camera;
  const onScreen = (x, margin) => x >= left - margin && x < left + VIEW_WIDTH + margin;
  ctx.save();
  ctx.translate(-left, 0);
  if (onScreen(WATCH_SIGNAL, 86)) drawWatchBridge(ctx);
  if (onScreen(WATCH_SIGNAL, 36)) drawWatchSignal(ctx, watch);
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
  for (const camp of WATCH_CAMPS) if (onScreen(camp.x, 50)) drawWatchCamp(ctx, camp, watch.tick);
  for (const post of watch.posts) {
    drawWatchPost(ctx, post);
    for (let index = 0; index < post.guards.length; index++) {
      const x = watch.guardX(post, index);
      drawWatchGuard(ctx, x, watchGround(x), post.guards[index], watch.tick);
    }
  }
  for (const coin of watch.loot) {
    if (!onScreen(coin.x, 3)) continue;
    const y = watchGround(coin.x) - 4 - (watch.tick >> 4) % 2;
    watchRect(ctx, '#9d573e', coin.x - 2, y - 2, 5, 5);
    watchRect(ctx, '#f1b36a', coin.x - 1, y - 2, 3, 4);
    watchRect(ctx, '#ffe4a8', coin.x, y - 1, 1, 2);
  }
  for (const raider of watch.raiders) {
    if (!onScreen(raider.x, 26)) continue;
    drawWatchWisp(ctx, raider, watch);
  }
  ctx.strokeStyle = '#f7d99dba';
  ctx.lineWidth = 1.2;
  for (const shot of watch.shots) {
    ctx.beginPath();
    ctx.moveTo(shot.from, watchGround(shot.from) - 12);
    ctx.lineTo(shot.to, watchGround(shot.to) - 16);
    ctx.stroke();
  }
  const { x, direction, step } = watch.player;
  drawWatchPlayer(ctx, x, watchGround(x), direction, (step >> 2) % 2);
  ctx.restore();
}
