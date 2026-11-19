/** The intact 72 × 60 m pit is the only safe ground in the expanded cavern. */
export const ULTRA_ISLAND = Object.freeze({ halfWidth: 36, halfDepth: 30 });

/** The four surviving island tunnels replace the distant cave-wall entrances after Ultra. */
export const ULTRA_RIM_TUNNELS = Object.freeze([
  { id: 'north', spawn: { x: 0, z: -27.5 }, exit: { x: 0, z: -21 }, direction: { x: 0, z: 1 } },
  { id: 'south', spawn: { x: 0, z: 27.5 }, exit: { x: 0, z: 21 }, direction: { x: 0, z: -1 } },
  { id: 'east', spawn: { x: 33.5, z: 0 }, exit: { x: 27, z: 0 }, direction: { x: -1, z: 0 } },
  { id: 'west', spawn: { x: -33.5, z: 0 }, exit: { x: -27, z: 0 }, direction: { x: 1, z: 0 } },
].map(tunnel => Object.freeze({ ...tunnel, width: 8, height: 4.4, depth: 5,
  spawn: Object.freeze(tunnel.spawn), exit: Object.freeze(tunnel.exit), direction: Object.freeze(tunnel.direction) })));

/** Local +Z faces into the island; the mouth remains open and the roof is visual geometry. */
export const ULTRA_TUNNEL_WALLS = Object.freeze(ULTRA_RIM_TUNNELS.flatMap(tunnel =>
  [['left', -tunnel.width / 2 - .3, 0, .6, tunnel.depth], ['right', tunnel.width / 2 + .3, 0, .6, tunnel.depth],
    ['back', 0, -tunnel.depth / 2 + .1, tunnel.width, .2]].map(([role, lateral, forward, width, depth]) => {
    const alongX = Math.abs(tunnel.direction.x) > .5;
    return Object.freeze({ id: `ultra-${tunnel.id}-tunnel-${role}`, tunnelId: tunnel.id, role,
      x: tunnel.spawn.x + tunnel.direction.z * lateral + tunnel.direction.x * forward,
      z: tunnel.spawn.z - tunnel.direction.x * lateral + tunnel.direction.z * forward,
      width: alongX ? depth : width, depth: alongX ? width : depth, height: tunnel.height });
  })));

/** Shared by rendering, actor separation and projectile occlusion. All dimensions are metres. */
export const ULTRA_COVER_BOXES = Object.freeze([
  { x: -22, z: 15, width: 7, depth: 1.5, height: 3.8 },
  { x: 22, z: 15, width: 7, depth: 1.5, height: 3.8 },
  { x: -14, z: 7, width: 1.5, depth: 6, height: 3.3 },
  { x: 14, z: 7, width: 1.5, depth: 6, height: 3.3 },
  { x: -25, z: -6, width: 1.6, depth: 7, height: 4.2 },
  { x: 25, z: -6, width: 1.6, depth: 7, height: 4.2 },
  { x: -15, z: -19, width: 6, depth: 1.6, height: 3.6 },
  { x: 15, z: -19, width: 6, depth: 1.6, height: 3.6 },
  { x: -6, z: 23, width: 4.5, depth: 1.4, height: 3.1 },
  { x: 6, z: 23, width: 4.5, depth: 1.4, height: 3.1 },
].map(box => Object.freeze(box)));
