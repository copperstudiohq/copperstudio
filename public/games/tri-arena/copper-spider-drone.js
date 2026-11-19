import * as THREE from './assets/three.module.js';
import { addGolemJoint, animateGolemMagic } from './golem-magic.js';
import { SPIDER_DRILL_ANGLES, spiderDrillPoint } from './spider-drone-combat.js';

export const COPPER_SPIDER_DRONE_TYPE = 'copper-spider-drone';
const cube = new THREE.BoxGeometry(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
const materials = Object.fromEntries(Object.entries({ copper: 0xd18a52, edge: 0xf0bd83, slate: 0x536a73,
  dark: 0x14242d, blue: 0x2fa5f2, steel: 0xa3c3c9 }).map(([name, color]) => [name,
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: .48, metalness: .7 })]));
materials.blue.emissive.set(0x168cf1); materials.blue.emissiveIntensity = .9;
materials.edge.emissive.set(0x60401d); materials.edge.emissiveIntensity = .12;

function joint(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group(); group.name = name; group.position.set(...position); parent.add(group); return group;
}
function block(parent, name, color, position, size, extra = {}) {
  const mesh = new THREE.Mesh(cube, materials[color]); mesh.name = name;
  mesh.position.set(...position); mesh.scale.set(...size); mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { severable: true, anatomicalPart: 'body', ...extra }; parent.add(mesh); return mesh;
}
function shaft(mesh, from, to, width) {
  const direction = to.clone().sub(from);
  mesh.position.copy(from).add(to).multiplyScalar(.5); mesh.scale.set(width, direction.length(), width);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
}
function poseLeg(leg, clock, phase, motion) {
  const data = leg.userData, index = data.index, active = index === (motion.activeDrill ?? 0);
  const striking = active && phase === 'strike' && motion.attackName === 'sweep';
  const sweep = striking ? motion.sweepProgress ?? 0 : .5;
  const tip = spiderDrillPoint({ x: 0, z: 0, angle: 0, elevation: 0,
    phase: striking ? 'strike' : 'chase', attackName: 'sweep', sweepProgress: sweep,
    activeDrill: motion.activeDrill ?? 0 }, index);
  let angle = Math.atan2(tip.x, tip.z);
  if (active && phase === 'windup' && motion.attackName === 'sweep') {
    angle -= .55 * Math.max(0, Math.min(1, 1 - (motion.phaseTime ?? 1.1) / 1.1));
    const radius = Math.hypot(tip.x, tip.z); tip.x = Math.sin(angle) * radius; tip.z = Math.cos(angle) * radius;
  }
  const axis = new THREE.Vector3(Math.sin(angle) * .7, -.5, Math.cos(angle) * .7).normalize();
  const ankle = new THREE.Vector3(tip.x, tip.y, tip.z).addScaledVector(axis, -.9).sub(leg.position);
  const knee = new THREE.Vector3(Math.sin(angle) * 2.65, 2.75 + Math.sin(clock * 1.8 + index * .8) * .09,
    Math.cos(angle) * 2.65).sub(leg.position);
  if (active && phase === 'windup') knee.y += .2;
  shaft(data.upper, new THREE.Vector3(), knee, .39); shaft(data.lower, knee, ankle, .36);
  data.knee.position.copy(knee); data.ankle.position.copy(ankle);
  data.drillMount.quaternion.setFromUnitVectors(up, axis);
  if (motion.weaponState?.[`spider-drill-${index}`]?.remaining !== 0) data.drill.rotation.y = clock * 9 + index * .4;
}

/** A floating eight-legged copper machine; every drill has its own physical weapon pixels. */
export function createCopperSpiderDrone() {
  const root = new THREE.Group(); root.name = COPPER_SPIDER_DRONE_TYPE;
  const body = joint(root, 'spider-drone-hovering-chassis');
  const hull = block(body, 'spider-drone-slate-hull', 'slate', [0, 2.4, 0], [2.6, 1.1, 2.35]);
  block(body, 'spider-drone-copper-upper-deck', 'copper', [0, 2.95, -.05], [2.9, .35, 2.6]);
  block(body, 'spider-drone-top-plate', 'edge', [0, 3.2, -.15], [1.9, .2, 1.8]);
  block(body, 'spider-drone-under-chassis', 'copper', [0, 1.91, -.05], [2.1, .3, 1.9]);
  for (const side of [-1, 1]) {
    block(body, 'spider-drone-side-copper-plate', 'copper', [side * 1.27, 2.45, 0], [.22, .78, 1.9]);
    for (const z of [-.7, 0, .7]) block(body, 'spider-drone-slate-deck-vent', 'slate', [side * .75, 3.145, z], [.47, .07, .2]);
    for (const z of [-.7, .7]) {
      block(body, 'spider-drone-thruster-housing', 'dark', [side * .72, 1.75, z], [.52, .35, .52]);
      block(body, 'spider-drone-blue-hover-thrust', 'blue', [side * .72, 1.55, z], [.33, .16, .33]);
    }
  }
  const head = joint(body, 'spider-drone-eye-assembly');
  block(head, 'spider-drone-eye-recess', 'dark', [0, 2.64, 1.21], [.92, .66, .17]);
  const eye = block(head, 'spider-drone-single-blue-eye', 'blue', [0, 2.65, 1.34], [.55, .42, .16],
    { anatomicalPart: 'eye', critical: true, detailPriority: 50 });
  const core = block(body, 'spider-drone-hidden-control-core', 'blue', [0, 2.4, 0], [.15, .16, .16],
    { anatomicalPart: 'core', critical: true, detailPriority: 60 });
  const legs = SPIDER_DRILL_ANGLES.map((angle, index) => {
    const leg = joint(body, `spider-drone-leg-${index}`, [Math.sin(angle) * 1.15, 2.6, Math.cos(angle) * 1.05]);
    const upper = block(leg, 'spider-leg-upper-armor', 'copper', [0, 0, 0], [1, 1, 1], { anatomicalPart: 'arm' });
    const lower = block(leg, 'spider-leg-lower-armor', 'edge', [0, 0, 0], [1, 1, 1], { anatomicalPart: 'arm' });
    const knee = joint(leg, 'spider-leg-articulated-knee');
    block(knee, 'spider-leg-copper-knee-cap', 'edge', [0, 0, 0], [.43, .37, .43], { anatomicalPart: 'arm' });
    const ankle = joint(leg, 'spider-leg-drill-wrist'), drillMount = joint(ankle, 'spider-drill-axis');
    const drill = joint(drillMount, `spider-terminal-drill-${index}`), stages = [];
    for (let stage = 0; stage < 4; stage++) {
      const width = [.62, .47, .32, .17][stage];
      const plate = block(drill, `spider-drill-${index}-stepped-cutter-${stage}`, stage % 2 ? 'steel' : 'edge',
        [0, .115 + stage * .205, 0], [width, .23, width],
        { anatomicalPart: stage === 0 ? 'leg' : 'arm', weaponId: `spider-drill-${index}`, structuralId: `spider-leg-${index}` });
      plate.rotation.y = stage * .42; stages.push(plate);
    }
    const tip = block(drill, `spider-drill-${index}-tip`, 'steel', [0, .9, 0], [.1, .15, .1],
      { anatomicalPart: 'arm', weaponId: `spider-drill-${index}`, structuralId: `spider-leg-${index}` });
    leg.userData = { index, angle, upper, lower, knee, ankle, drillMount, drill, tip, stages };
    poseLeg(leg, 0, 'chase', {}); return leg;
  });
  root.userData = { type: COPPER_SPIDER_DRONE_TYPE, spiderDrone: true, boss: true, body, head, eye, core,
    eyes: [eye], legs, limbs: legs, drills: legs.map(leg => leg.userData.drill), baseBodyY: 0 };
  for (const leg of legs) {
    const data = leg.userData;
    addGolemJoint(root, leg, [hull, data.upper], { name: `spider-blue-hip-${data.index}`, size: [.34, .22, .34] });
    addGolemJoint(root, data.knee, [data.upper, data.lower], { name: `spider-blue-knee-${data.index}`, size: [.34, .23, .34] });
    addGolemJoint(root, data.ankle, [data.lower, data.stages[0]], { name: `spider-blue-drill-wrist-${data.index}`, size: [.3, .22, .3] });
  }
  return root;
}

export function animateCopperSpiderDrone(root, time, speed = 0, phase = 'chase', motion = {}) {
  const clock = Number.isFinite(time) ? time : 0, data = root.userData;
  // Runtime elevation belongs to the engine; standalone model previews may gently hover.
  data.body.position.y = Number.isFinite(motion.elevation) ? 0 : Math.sin(clock * 1.4) * .06;
  for (const leg of data.legs) poseLeg(leg, clock, phase, motion);
  animateGolemMagic(root, clock, motion.partState);
}
