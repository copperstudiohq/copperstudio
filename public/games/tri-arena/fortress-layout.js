const panel = (id, x, y, z, width, height, depth, cutaway = false) => ({ id, x, y, z, width, height, depth, cutaway,
  minX: x - width / 2, maxX: x + width / 2, minY: y - height / 2, maxY: y + height / 2,
  minZ: z - depth / 2, maxZ: z + depth / 2 });
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };

export const FORTRESS_HOVER_HEIGHT = 1.2;
export const FORTRESS_HATCH_HEIGHT = 4.2;
export const FORTRESS_CANNON_MOUNTS = freeze([
  { x: -2, y: 3.25, z: 1.55, angle: 0 }, { x: 2, y: 3.25, z: 1.55, angle: 0 },
  { x: -2.2, y: 3.25, z: 0, angle: -Math.PI / 2 }, { x: 2.2, y: 3.25, z: 0, angle: Math.PI / 2 },
]);
export const FORTRESS_CREW_SEATS = freeze([
  { x: -2.35, y: 1.45, z: 1.1, angle: 0, scale: .8 }, { x: 2.35, y: 1.45, z: 1.1, angle: 0, scale: .8 },
  { x: -2.35, y: 1.45, z: -1.1, angle: Math.PI, scale: .8 }, { x: 2.35, y: 1.45, z: -1.1, angle: Math.PI, scale: .8 },
]);
export const FORTRESS_LAYOUT = freeze({
  width: 8.04, depth: 6.6, floorY: 1.5, floorThickness: .18, wallTop: 5.88, wallThickness: .479,
  deckHeight: 1.59,
  hoverHeight: FORTRESS_HOVER_HEIGHT, hatchHeight: FORTRESS_HATCH_HEIGHT,
  reactorId: 'fortress-reactor', cannonExtension: 1.45, cannonMuzzle: 1.2,
  ramp: { id: 'fortress-ramp', x: 0, minZ: -6.1, maxZ: -3.3, width: 2.4, bottomY: 0, topY: 1.59 },
  panelAabbs: [
    panel('front-lower', 0, 2.02, 3.06, 8.04, .86, .479), panel('front-upper', 0, 5.065, 3.06, 8.04, 1.63, .479),
    panel('front-center', 0, 3.35, 3.06, 2, 1.8, .479),
    panel('front-left', -3.5, 3.35, 3.06, 1, 1.8, .479), panel('front-right', 3.5, 3.35, 3.06, 1, 1.8, .479),
    ...[-1, 1].flatMap(side => [
      panel(`side-${side}-lower`, side * 3.78, 2.02, 0, .479, .86, 6.6, side < 0),
      panel(`side-${side}-upper`, side * 3.78, 5.065, 0, .479, 1.63, 6.6, side < 0),
      panel(`side-${side}-front`, side * 3.78, 3.35, 2.125, .479, 1.8, 2.35, side < 0),
      panel(`side-${side}-back`, side * 3.78, 3.35, -2.125, .479, 1.8, 2.35, side < 0),
    ]),
    panel('rear-left', -2.55, 2.895, -3.06, 2.9, 2.61, .479, true),
    panel('rear-right', 2.55, 2.895, -3.06, 2.9, 2.61, .479, true),
    panel('rear-upper', 0, 5.04, -3.06, 8.04, 1.68, .479, true),
  ],
  gates: [
    { id: 'fortress-flap-0', x: -2, y: 3.35, z: 3.06, width: 1.9, height: 1.75, angle: 0 },
    { id: 'fortress-flap-1', x: 2, y: 3.35, z: 3.06, width: 1.9, height: 1.75, angle: 0 },
    { id: 'fortress-flap-2', x: -3.78, y: 3.35, z: 0, width: 1.9, height: 1.75, angle: -Math.PI / 2 },
    { id: 'fortress-flap-3', x: 3.78, y: 3.35, z: 0, width: 1.9, height: 1.75, angle: Math.PI / 2 },
    { id: 'fortress-hatch', x: 0, y: 2.895, z: -3.06, width: 2.2, height: 2.61, angle: Math.PI },
  ],
});
