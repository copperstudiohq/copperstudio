import { DRILL_MINE_BOUNDS as ARENA_BOUNDS } from './arena-config.js';
import { DRILL_MINE_TUNNELS, DRILL_MINE_PIT, separateDrillMineActor } from './drill-mine-layout.js';
import { megaDrillBounds } from './mega-drill-motion.js';

export const MINER_BOT = Object.freeze({ id: 'miner-bot', name: 'Miner Bot', unlockWave: 1, hp: 100, radius: .65,
  speed: 3, range: 2.1, windup: .8, recovery: 1.15, damage: 17, score: 180,
  description: 'A copper mining robot carrying a real pickaxe, emerging from the mine tunnels.',
  attackHelp: 'Sidestep its warned pickaxe swing. Sever every attached pickaxe pixel to stop its attacks.' });
export const DRILL_MINE_MIX = Object.freeze(['miner-bot', 'miner-bot', 'copper-drill-worm', 'copper-drill-hound', 'miner-bot', 'miner-bot']);
export const MINERS_PER_TUNNEL = 10;
export const MINE_MINER_TOTAL = MINERS_PER_TUNNEL * DRILL_MINE_TUNNELS.length;
export const MINE_ACTOR_LIMIT = 60;
const MINER_SPACING = 1.6;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function mineTunnelSpawn(index, radius) {
  const tunnel = DRILL_MINE_TUNNELS[Math.abs(Math.floor(index)) % DRILL_MINE_TUNNELS.length];
  return { tunnel, x: clamp(tunnel.spawn.x, -ARENA_BOUNDS.x + radius + .01, ARENA_BOUNDS.x - radius - .01),
    z: clamp(tunnel.spawn.z, -ARENA_BOUNDS.z + radius + .01, ARENA_BOUNDS.z - radius - .01) };
}

/** Five parallel lanes, with the second row already 1.6m farther into the tunnel. */
export function mineMinerSpawn(tunnelIndex, slot) {
  if (!Number.isInteger(tunnelIndex) || tunnelIndex < 0 || tunnelIndex >= DRILL_MINE_TUNNELS.length) {
    throw new RangeError('A miner formation needs a tunnel index from 0 to 3.');
  }
  if (!Number.isInteger(slot) || slot < 0 || slot >= MINERS_PER_TUNNEL) {
    throw new RangeError('A miner formation slot must be an integer from 0 to 9.');
  }
  const point = mineTunnelSpawn(tunnelIndex, MINER_BOT.radius), tunnel = point.tunnel;
  const length = Math.hypot(tunnel.exit.x - tunnel.spawn.x, tunnel.exit.z - tunnel.spawn.z);
  const dx = (tunnel.exit.x - tunnel.spawn.x) / length, dz = (tunnel.exit.z - tunnel.spawn.z) / length;
  const lateral = (slot % 5 - 2) * MINER_SPACING, depth = Math.floor(slot / 5) * MINER_SPACING;
  const x = -dz * lateral + dx * depth, z = dx * lateral + dz * depth;
  return { tunnel, x: point.x + x, z: point.z + z,
    exit: { x: tunnel.exit.x + x, z: tunnel.exit.z + z }, formationSlot: slot };
}

export function startMineEmergence(actor, tunnel, exit = tunnel.exit) {
  if (![exit?.x, exit?.z].every(Number.isFinite)) throw new TypeError('A mine emergence exit needs finite x and z coordinates.');
  actor.tunnelId = tunnel.id; actor.emerging = true; actor.phase = 'emerge';
  actor.tunnelEntry = { startX: actor.x, startZ: actor.z, exitX: exit.x, exitZ: exit.z, progress: 0 };
  actor.angle = Math.atan2(exit.x - actor.x, exit.z - actor.z); return actor;
}
export function advanceMineEmergence(actor, dt, stats, mobility = 1) {
  const entry = actor.tunnelEntry, previous = { x: actor.x, z: actor.z };
  const dx = entry.exitX - actor.x, dz = entry.exitZ - actor.z, distance = Math.hypot(dx, dz);
  const staggered = actor.phase === 'recover' && actor.phaseTime > 0;
  actor.phaseTime = Math.max(0, actor.phaseTime - dt);
  if (actor.phaseTime === 0) actor.phase = 'emerge';
  const step = staggered ? 0 : Math.min(distance, stats.speed * actor.speedScale * (actor.crippled ? .7 : 1) * mobility * dt);
  if (distance > 1e-8) { actor.x += dx / distance * step; actor.z += dz / distance * step; actor.angle = Math.atan2(dx, dz); }
  actor.x += actor.impulseX * dt; actor.z += actor.impulseZ * dt;
  actor.impulseX *= Math.exp(-7 * dt); actor.impulseZ *= Math.exp(-7 * dt);
  separateDrillMineActor(actor, previous, actor.radius);
  const remaining = Math.hypot(entry.exitX - actor.x, entry.exitZ - actor.z);
  entry.progress = clamp(1 - remaining / Math.max(.01, Math.hypot(entry.exitX - entry.startX, entry.exitZ - entry.startZ)), 0, 1);
  if (remaining < 1e-6) { delete actor.tunnelEntry; actor.emerging = false; actor.phase = 'chase'; }
}

/** Large articulated hulls stay inside the excavation, rather than sweeping through rock. */
export function constrainMineMegaPose(pose) {
  const bounds = megaDrillBounds(pose.angle, pose.wormDistance);
  return { ...pose,
    x: clamp(pose.x, -DRILL_MINE_PIT.halfWidth - bounds.minX + .03, DRILL_MINE_PIT.halfWidth - bounds.maxX - .03),
    z: clamp(pose.z, -DRILL_MINE_PIT.halfDepth - bounds.minZ + .03, DRILL_MINE_PIT.halfDepth - bounds.maxZ - .03) };
}
export function mineMegaPoseAllowed(pose) {
  const bounds = megaDrillBounds(pose.angle, pose.wormDistance);
  return pose.x + bounds.minX >= -DRILL_MINE_PIT.halfWidth && pose.x + bounds.maxX <= DRILL_MINE_PIT.halfWidth
    && pose.z + bounds.minZ >= -DRILL_MINE_PIT.halfDepth && pose.z + bounds.maxZ <= DRILL_MINE_PIT.halfDepth;
}
