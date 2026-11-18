import { HEIGHT, VIEW_WIDTH } from './simulation.js';
import { WATCH_BOUNDS, WATCH_BRIDGE, WATCH_SIGNAL, watchGround } from './watch.js';

function watchRect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
}

function drawWatchSky(ctx, night) {
  const haze = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  haze.addColorStop(0, night ? 'rgba(21, 18, 48, .63)' : 'rgba(204, 120, 77, .17)');
  haze.addColorStop(0.57, night ? 'rgba(39, 24, 57, .38)' : 'rgba(235, 155, 98, .14)');
  haze.addColorStop(1, night ? 'rgba(22, 16, 38, .43)' : 'rgba(44, 23, 26, .05)');
  watchRect(ctx, haze, 0, 0, VIEW_WIDTH, HEIGHT);
  if (night) {
    watchRect(ctx, '#505572', 310, 24, 17, 13);
    watchRect(ctx, '#abb3c6', 312, 21, 13, 17);
    watchRect(ctx, '#e1d8d5', 315, 23, 9, 12);
    watchRect(ctx, '#687288', 315, 27, 3, 2);
    watchRect(ctx, '#687288', 320, 31, 2, 2);
  }
}

function drawWatchBridge(ctx) {
  const { left, right, y } = WATCH_BRIDGE;
  for (let x = left + 9; x < right - 3; x += 19) {
    watchRect(ctx, '#382b31', x, y + 2, 3, 27);
    watchRect(ctx, '#765649', x, y + 2, 1, 22);
    watchRect(ctx, '#583d38', x - 4, y + 4, 12, 2);
  }
  watchRect(ctx, '#714c3e', left, y, right - left, 5);
  watchRect(ctx, '#b78461', left, y, right - left, 1);
  for (let x = left + 4; x < right; x += 8) watchRect(ctx, '#4a3735', x, y + 2, 1, 2);
}

function drawWatchSignal(ctx, watch) {
  const x = WATCH_SIGNAL;
  const y = watchGround(x);
  watchRect(ctx, '#554044', x - 13, y - 15, 27, 15);
  watchRect(ctx, '#957157', x - 10, y - 17, 20, 17);
  for (let row = 0; row < 5; row++) watchRect(ctx, '#705344', x - 10, y - 16 + row * 3, 20, 1);
  watchRect(ctx, '#332a32', x - 3, y - 10, 7, 10);
  watchRect(ctx, '#6d423b', x - 16, y - 18, 33, 3);
  watchRect(ctx, '#c08357', x - 13, y - 21, 27, 4);
  watchRect(ctx, '#e4a475', x - 10, y - 23, 21, 2);
  watchRect(ctx, '#7f5546', x - 2, y - 38, 5, 18);
  watchRect(ctx, '#c99567', x - 6, y - 34, 13, 3);
  if (watch.signal > 0) {
    const radius = 8 + watch.signal * 0.9;
    const lamp = ctx.createRadialGradient(x, y - 39, 1, x, y - 39, radius);
    lamp.addColorStop(0, '#80e5d78c');
    lamp.addColorStop(1, 'transparent');
    watchRect(ctx, lamp, x - radius, y - 39 - radius, radius * 2, radius * 2);
    watchRect(ctx, '#488f8a', x - 5, y - 39, 11, 6);
    watchRect(ctx, '#86dec8', x - 3, y - 43 - (watch.tick >> 3) % 2, 7, 10);
    watchRect(ctx, '#e4f4d7', x - 1, y - 40, 3, 6);
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

  const camp = post.campX;
  const ground = watchGround(camp);
  watchRect(ctx, '#8b6856', camp - 1, ground - 17, 2, 17);
  watchRect(ctx, '#52616d', camp, ground - 17, 9, 8);
  watchRect(ctx, '#a8d7ca', camp + 2, ground - 15, 4, 3);
  watchRect(ctx, '#73584d', camp - 6, ground - 2, 12, 2);
}

function drawWatchGuard(ctx, x, y, direction) {
  ctx.save();
  ctx.translate(Math.round(x), y);
  ctx.scale(direction, 1);
  watchRect(ctx, '#231e29', -5, -1, 12, 2);
  watchRect(ctx, '#314950', -3, -6, 3, 6);
  watchRect(ctx, '#4f7474', 2, -6, 3, 5);
  watchRect(ctx, '#556675', -4, -15, 10, 10);
  watchRect(ctx, '#a99a7f', -4, -13, 9, 4);
  watchRect(ctx, '#f0bd8e', -3, -19, 8, 5);
  watchRect(ctx, '#829e9e', -4, -21, 9, 3);
  watchRect(ctx, '#39323c', 3, -17, 1, 2);
  watchRect(ctx, '#694f48', 6, -16, 2, 11);
  watchRect(ctx, '#c89666', 7, -13, 2, 5);
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

function drawWatchRaider(ctx, raider, tick) {
  const x = Math.round(raider.x);
  const y = watchGround(x);
  const height = 9 + (tick >> 3) % 2;
  watchRect(ctx, '#2f233c', x - 7, y - 3, 15, 4);
  watchRect(ctx, '#7b3a68', x - 6, y - height, 13, height - 1);
  watchRect(ctx, '#c5629e', x - 4, y - height - 2, 8, 4);
  watchRect(ctx, '#f1c1b0', x - raider.side * 3 - 1, y - height / 2 - 2, 4, 4);
  watchRect(ctx, '#1e2030', x - raider.side * 3, y - height / 2 - 1, 1, 2);
  watchRect(ctx, '#637bc6', x - 6, y - 4, 3, 1);
}

export function drawCreekWatch(ctx, watch) {
  drawWatchSky(ctx, watch.phase === 'night');
  ctx.save();
  ctx.translate(-watch.camera, 0);
  drawWatchBridge(ctx);
  drawWatchSignal(ctx, watch);
  for (const edge of [WATCH_BOUNDS.left + 7, WATCH_BOUNDS.right - 7]) {
    const ground = watchGround(edge);
    watchRect(ctx, '#78645b', edge - 1, ground - 17, 2, 17);
    watchRect(ctx, '#bf9271', edge - 3, ground - 19, 6, 4);
  }
  for (const post of watch.posts) {
    drawWatchPost(ctx, post);
    for (let index = 0; index < post.guards.length; index++) {
      const x = watch.guardX(post, index);
      drawWatchGuard(ctx, x, watchGround(x), post.side);
    }
  }
  for (const coin of watch.loot) {
    const y = watchGround(coin.x) - 4 - (watch.tick >> 4) % 2;
    watchRect(ctx, '#9d573e', coin.x - 2, y - 2, 5, 5);
    watchRect(ctx, '#f1b36a', coin.x - 1, y - 2, 3, 4);
    watchRect(ctx, '#ffe4a8', coin.x, y - 1, 1, 2);
  }
  for (const raider of watch.raiders) drawWatchRaider(ctx, raider, watch.tick);
  ctx.strokeStyle = '#f7d99dba';
  ctx.lineWidth = 1.2;
  for (const shot of watch.shots) {
    ctx.beginPath();
    ctx.moveTo(shot.from, watchGround(shot.from) - 12);
    ctx.lineTo(shot.to, watchGround(shot.to) - 6);
    ctx.stroke();
  }
  const { x, direction, step } = watch.player;
  drawWatchPlayer(ctx, x, watchGround(x), direction, (step >> 2) % 2);
  ctx.restore();
}
