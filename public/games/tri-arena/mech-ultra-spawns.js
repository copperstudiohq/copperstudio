import { ULTRA_ISLAND, ULTRA_RIM_TUNNELS } from './mech-ultra-cover.js';

function tunnelAt(index) {
  if (!Number.isSafeInteger(index) || index < 0 || index >= ULTRA_RIM_TUNNELS.length) throw new RangeError('An island formation needs a tunnel index from 0 to 3.');
  return ULTRA_RIM_TUNNELS[index];
}
function offset(tunnel, point, lateral, forward = 0) {
  return { x: point.x - tunnel.direction.z * lateral + tunnel.direction.x * forward,
    z: point.z + tunnel.direction.x * lateral + tunnel.direction.z * forward };
}
function requireFloor(point, radius) {
  if (Math.abs(point.x) + radius > ULTRA_ISLAND.halfWidth || Math.abs(point.z) + radius > ULTRA_ISLAND.halfDepth) {
    throw new RangeError('An island tunnel spawn must fit entirely on the original pit.');
  }
}

/** Two five-wide rows remain inside the physical tunnel, with the rear row 1.6m closer to the rim. */
export function ultraRimMinerSpawn(tunnelIndex, slot) {
  const tunnel = tunnelAt(tunnelIndex);
  if (!Number.isSafeInteger(slot) || slot < 0 || slot >= 10) throw new RangeError('An island miner slot must be from 0 to 9.');
  const lateral = (slot % 5 - 2) * 1.4, row = -Math.floor(slot / 5) * 1.6;
  const point = offset(tunnel, tunnel.spawn, lateral, row), exit = offset(tunnel, tunnel.exit, lateral, row);
  requireFloor(point, .65); requireFloor(exit, .65);
  return { tunnel, ...point, exit, formationSlot: slot };
}

/** Worms and hounds lead the formation in two lanes, with their long tails still inside the tunnel. */
export function ultraRimSpecialSpawn(index, radius) {
  if (!Number.isSafeInteger(index) || index < 0) throw new RangeError('An island encounter index must be a nonnegative safe integer.');
  if (!Number.isFinite(radius) || radius <= 0 || radius > 2.5) throw new RangeError('An island encounter radius must be greater than 0 and at most 2.5m.');
  const tunnel = tunnelAt(index % ULTRA_RIM_TUNNELS.length), lateral = Math.floor(index / ULTRA_RIM_TUNNELS.length) % 2 ? 1.5 : -1.5;
  const point = offset(tunnel, tunnel.spawn, lateral, 2), exit = offset(tunnel, tunnel.exit, lateral);
  requireFloor(point, radius); requireFloor(exit, radius);
  return { tunnel, ...point, exit };
}
