/** Shared metre-scale layout; positive local Z points toward the drill tip. */
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const wall = (id, minX, maxX, minZ, maxZ, minY = 1.75, maxY = 6.7) => ({ id, minX, maxX, minZ, maxZ, minY, maxY });
export const MEGA_DRILL_LAYOUT = freeze({
  type: 'copper-mega-drill', unlockWave: 30, health: 1000000, length: 33, fortressLength: 6.6, fortressCount: 5,
  width: 8.04, hullLength: 24, drillLength: 9, rearZ: -16.5, hullFrontZ: 7.5, tipZ: 16.5,
  floorY: 1.75, deckHeight: 1.82, roofY: 6.7, drillAxisY: 4.15,
  reactorIds: Array.from({ length: 4 }, (_, index) => `mega-reactor-${index}`),
  fabricatorIds: ['mega-fabricator-0', 'mega-fabricator-1'], droneFactoryId: 'mega-drone-factory',
  rooms: [
    { id: 'fabricator-1', name: 'Robot Fabricator I', role: 'fabricator', center: [0, 3.6, -13.5] },
    { id: 'fabricator-2', name: 'Robot Fabricator II', role: 'fabricator', center: [0, 3.6, -7.5] },
    { id: 'drone-bay', name: 'Repair Drone Foundry', role: 'drone', center: [0, 3.6, -1.5] },
    { id: 'control', name: 'Forward Control Room', role: 'control', center: [0, 3.6, 4.5] },
  ],
  ramp: { id: 'mega-ramp', x: 0, width: 2.4, minZ: -16.5, maxZ: -13.5, bottomY: 0, topY: 1.82 },
  panelAabbs: [
    wall('mega-near-wall', -4.02, -3.68, -16.5, 7.5), wall('mega-far-wall', 3.68, 4.02, -16.5, 7.5),
    wall('mega-rear-wall', -4.02, -1.2, -16.5, -16.02), wall('mega-rear-wall', 1.2, 4.02, -16.5, -16.02),
    wall('mega-rear-wall', -1.2, 1.2, -16.5, -16.02, 5.35, 6.7),
    wall('mega-front-wall', -4.02, 4.02, 7.02, 7.5),
    ...[-10.5, -4.5, 1.5].flatMap((z, index) => [
      wall(`mega-partition-${index}`, -3.74, -1.24, z - .1, z + .1, 1.75, 6.23),
      wall(`mega-partition-${index}`, 1.24, 3.74, z - .1, z + .1, 1.75, 6.23),
      wall(`mega-partition-${index}`, -1.24, 1.24, z - .12, z + .12, 4.81, 6.33),
    ]),
  ],
});

export function megaDrillLocal(actor, x, z) {
  const dx = x - actor.x, dz = z - actor.z, sine = Math.sin(actor.angle), cosine = Math.cos(actor.angle);
  return { x: cosine * dx - sine * dz, z: sine * dx + cosine * dz };
}
export function megaDrillPoint(actor, point) {
  const sine = Math.sin(actor.angle), cosine = Math.cos(actor.angle);
  return { x: actor.x + cosine * point.x + sine * point.z,
    y: (actor.elevation || 0) + (point.y || 0), z: actor.z - sine * point.x + cosine * point.z };
}
