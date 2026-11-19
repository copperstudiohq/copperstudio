const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

export const MINE_WALKER_CREW_SEATS = freeze([
  { x: -2.3, y: 10.2, z: 1.4, angle: 0, scale: 1 }, { x: 0, y: 10.2, z: 1.4, angle: 0, scale: 1 },
  { x: 2.3, y: 10.2, z: 1.4, angle: 0, scale: 1 }, { x: -2, y: 10.2, z: -1.1, angle: Math.PI, scale: 1 },
  { x: 2, y: 10.2, z: -1.1, angle: Math.PI, scale: 1 },
]);
export const MINE_WALKER_DRILL_ANGLES = freeze(Array.from({ length: 8 }, (_, index) => Math.PI / 8 + index * Math.PI / 4));
export const MINE_WALKER_DRILL_LENGTH = 2.7;
// Includes every spinning cutter orientation and the rear boarding ladder.
export const MINE_WALKER_FOOTPRINT_RADIUS = 15.7;
export const MINE_WALKER_DRILL_MOUNTS = freeze(MINE_WALKER_DRILL_ANGLES.map((angle, index) => {
  const hip = { x: Math.sin(angle) * 3.6, y: 10.2, z: Math.cos(angle) * 2.8 };
  const knee = { x: Math.sin(angle) * 8.5, y: 11, z: Math.cos(angle) * 8.5 };
  const tip = { x: Math.sin(angle) * 14.5, y: 2.1, z: Math.cos(angle) * 14.5 };
  return { id: `walker-drill-${index}`, angle, hip, knee, tip, mount: hip, elbow: knee };
}));
export const MINE_WALKER_LEG_OFFSETS = freeze(MINE_WALKER_DRILL_MOUNTS.map(shape => ({ ...shape, foot: shape.tip })));
export const MINE_WALKER_FOOT_OFFSETS = freeze(MINE_WALKER_DRILL_MOUNTS.map(shape => ({ ...shape.tip })));
// Legacy endpoint API; these are articulated drill legs, without hover pods.
export const MINE_WALKER_HOVER_STRUTS = freeze(MINE_WALKER_DRILL_MOUNTS.map(shape => ({ ...shape, end: shape.tip })));
export const MINE_WALKER_GUN_MOUNTS = freeze([-2.4, -1.44, -.48, .48, 1.44, 2.4].map((x, index) => ({
  id: `walker-gun-${index}`, weaponId: `walker-machine-gun-${index}`, x, y: 9.15, z: 2.65, angle: 0, muzzleLength: 1.15,
})));

const ladderHeight = 10.2, sectionHeight = ladderHeight / 26;
const ladderSections = Array.from({ length: 26 }, (_, index) => {
  const bottomY = index * sectionHeight, topY = (index + 1) * sectionHeight;
  return { id: `walker-ladder-section-${index}`, index, bottomY, topY,
    rails: [-1, 1].map(side => ({ x: side * .7, y: (bottomY + topY) / 2, z: -3.8,
      width: .14, height: sectionHeight + .01, depth: .18 })),
    rungs: [{ x: 0, y: (bottomY + topY) / 2, z: -3.8, width: 1.4, height: .12, depth: .18 }] };
});
export const MINE_WALKER_LAYOUT = freeze({
  type: 'copper-mine-walker', width: 8.04, depth: 6.6, floorY: 10.2, roofY: 14.7, wallThickness: .3, floorThickness: .2,
  floorId: 'walker-floor', roofId: 'walker-roof', crewSeats: MINE_WALKER_CREW_SEATS,
  entry: { x: 0, z: -3.3, width: 2.4, height: 3.1 },
  ladder: { id: 'walker-ladder', height: ladderHeight, bottomY: 0, topY: ladderHeight, width: 1.4, z: -3.8,
    climbZ: -4.15, exitZ: -2.7, speed: 3, sections: ladderSections,
    landing: { id: 'walker-ladder-landing', x: 0, y: 10.1, z: -3.5, width: 1.6, height: .2, depth: 1.2, topY: 10.2 } },
  machineGuns: MINE_WALKER_GUN_MOUNTS, drills: MINE_WALKER_DRILL_MOUNTS,
  footprint: { minX: -15.7, maxX: 15.7, minZ: -15.7, maxZ: 15.7 },
});

export function mineWalkerLadderHeight(bodyDrop = 0) {
  return Math.max(1.4, ladderHeight - (Number.isFinite(bodyDrop) ? Math.max(0, bodyDrop) : 0));
}

export function mineWalkerLadderSectionPose(index, bodyDrop = 0) {
  const section = MINE_WALKER_LAYOUT.ladder.sections[index];
  if (!section) throw new RangeError('A Mine Walker ladder section index must be from 0 to 25.');
  const scale = mineWalkerLadderHeight(bodyDrop) / ladderHeight;
  const box = value => ({ ...value, y: value.y * scale, height: value.height * scale });
  return { ...section, bottomY: section.bottomY * scale, topY: section.topY * scale,
    rails: section.rails.map(box), rungs: section.rungs.map(box) };
}

export function mineWalkerLadderPose(bodyDrop = 0) {
  const height = mineWalkerLadderHeight(bodyDrop), landing = MINE_WALKER_LAYOUT.ladder.landing;
  return { height, sections: ladderSections.map((_, index) => mineWalkerLadderSectionPose(index, bodyDrop)),
    landing: { ...landing, y: height - landing.height / 2, topY: height } };
}

export function mineWalkerDrillOffset(progress) {
  const extension = Math.sin(Math.PI * Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0)));
  return { y: -.9 * extension, z: .4 * extension };
}

export function mineWalkerHoverHeight(time) {
  return .12 + .05 * Math.sin((Number.isFinite(time) ? time : 0) * 1.6);
}

export function mineWalkerHoverStrutPose(index, bodyDrop = 0) {
  const pose = mineWalkerLegPose(index, { bodyDrop });
  return { hip: pose.hip, end: pose.tip };
}

/** One shared local pose drives both the physical drill model and its damage contact. */
export function mineWalkerLegPose(index, motion = {}) {
  const shape = MINE_WALKER_DRILL_MOUNTS[index];
  if (!shape) throw new RangeError('A Mine Walker drill leg index must be from 0 to 7.');
  const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const drop = Number.isFinite(motion.bodyDrop) ? Math.max(0, motion.bodyDrop) : 0;
  const active = index === (motion.activeDrill ?? 0) && motion.attackName === 'drill';
  let sweep = 0;
  if (active && motion.phase === 'strike') sweep = (clamp(motion.drillProgress) - .5) * 1.1;
  else if (active && motion.phase === 'windup') sweep = -.55 * clamp(1 - (Number.isFinite(motion.phaseTime) ? motion.phaseTime : 1.2) / 1.2);
  const angle = shape.angle + sweep, sine = Math.sin(angle), cosine = Math.cos(angle);
  const hip = { ...shape.hip, y: shape.hip.y - drop };
  const knee = { x: sine * 8.5, y: 11 - drop, z: cosine * 8.5 };
  const tip = { x: sine * 14.5, y: Math.max(1, 2.1 - drop), z: cosine * 14.5 };
  const dx = tip.x - knee.x, dy = tip.y - knee.y, dz = tip.z - knee.z, length = Math.hypot(dx, dy, dz);
  const axis = { x: dx / length, y: dy / length, z: dz / length };
  const ankle = { x: tip.x - axis.x * MINE_WALKER_DRILL_LENGTH, y: tip.y - axis.y * MINE_WALKER_DRILL_LENGTH,
    z: tip.z - axis.z * MINE_WALKER_DRILL_LENGTH };
  return { hip, knee, ankle, tip, axis, angle };
}

export function mineWalkerBounds(owner) {
  return { minX: owner.x - MINE_WALKER_FOOTPRINT_RADIUS, maxX: owner.x + MINE_WALKER_FOOTPRINT_RADIUS,
    minZ: owner.z - MINE_WALKER_FOOTPRINT_RADIUS, maxZ: owner.z + MINE_WALKER_FOOTPRINT_RADIUS };
}

export function mineWalkerDrillTip(owner, index = owner.activeDrill ?? 0) {
  return worldHoverPoint(owner, mineWalkerLegPose(index, owner).tip);
}

/** The model and engine aim from the same gun pivot to the same world target. */
export function mineWalkerGunMuzzle(owner, index) {
  const mount = MINE_WALKER_GUN_MOUNTS[index];
  if (!mount) throw new RangeError('A Mine Walker gun index must be from 0 to 5.');
  const angle = owner.angle || 0, sine = Math.sin(angle), cosine = Math.cos(angle);
  const origin = { x: owner.x + cosine * mount.x + sine * mount.z,
    y: (owner.elevation || 0) - (owner.bodyDrop || 0) + mount.y, z: owner.z - sine * mount.x + cosine * mount.z };
  let dx = Math.sin(angle + mount.angle), dy = 0, dz = Math.cos(angle + mount.angle);
  if (Number.isFinite(owner.targetX) && Number.isFinite(owner.targetZ)) {
    dx = owner.targetX - origin.x; dy = (Number.isFinite(owner.targetY) ? owner.targetY : 1.3) - origin.y; dz = owner.targetZ - origin.z;
  }
  const length = Math.hypot(dx, dy, dz) || 1;
  return { x: origin.x + dx / length * mount.muzzleLength, y: origin.y + dy / length * mount.muzzleLength,
    z: origin.z + dz / length * mount.muzzleLength };
}

function worldHoverPoint(owner, offset) {
  const sine = Math.sin(owner.angle || 0), cosine = Math.cos(owner.angle || 0);
  return { x: owner.x + cosine * offset.x + sine * offset.z, y: (owner.elevation || 0) + offset.y,
    z: owner.z - sine * offset.x + cosine * offset.z };
}

export function initializeMineWalkerFeet(owner) {
  if (![owner?.x, owner?.z, owner?.angle ?? 0].every(Number.isFinite)) throw new TypeError('Walker feet require a finite world position and heading.');
  owner.walkerFeet = MINE_WALKER_DRILL_MOUNTS.map((_, index) => mineWalkerDrillTip(owner, index));
  delete owner.walkerGait;
  return owner.walkerFeet;
}

/** Compatibility endpoint API: all eight drill legs follow their current articulated pose. */
export function advanceMineWalkerFeet(owner, dt) {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Walker hover needs a nonnegative finite time step.');
  if (owner.walkerFeet?.length !== 8) initializeMineWalkerFeet(owner);
  if (dt === 0) return owner.walkerFeet;
  return initializeMineWalkerFeet(owner);
}
