import * as T from './vendor/three.module.js';
import { buildHorse, horseArmor } from './horse.mjs';
import { groundHeight } from './layout.mjs';
import { drapeMantle, drapeStandingMantle, dressTorso, sewnSleeve } from './rider-garment.mjs';

export const RIDER_NAME = 'The Opsing Rider';

const sphere = new T.SphereGeometry(1, 16, 12);
const rod = new T.CylinderGeometry(.84, 1, 1, 9);
const hoofForm = new T.LatheGeometry([
  new T.Vector2(0, -.50), new T.Vector2(.97, -.50), new T.Vector2(.95, -.32),
  new T.Vector2(.76, .29), new T.Vector2(.53, .47), new T.Vector2(0, .48),
], 12);
const upperLeg = new T.LatheGeometry([
  new T.Vector2(.89, -.50), new T.Vector2(1.13, -.35), new T.Vector2(1.05, -.12),
  new T.Vector2(.75, .20), new T.Vector2(.52, .51),
], 12);
const lowerLeg = new T.LatheGeometry([
  new T.Vector2(1.23, -.50), new T.Vector2(.88, -.35), new T.Vector2(.65, -.13),
  new T.Vector2(.61, .18), new T.Vector2(.81, .44), new T.Vector2(.70, .50),
], 10);
const lame = new T.CylinderGeometry(.94, 1, 1, 12, 1, true);
const block = new T.BoxGeometry();
const up = new T.Vector3(0, 1, 0);
const axis = new T.Vector3();
const TAU = 2 * Math.PI;

const finish = (color, roughness = .88, extra = {}) => new T.MeshStandardMaterial({ color, roughness, ...extra });
const leather = finish('#3f312c', .91);
const scuffedLeather = finish('#4a372e', .86);
const straps = finish('#1d1b22', .76);
const iron = finish('#626165', .53, { metalness: .38 });
const ironEdge = finish('#827b74', .52, { metalness: .49 });
const steel = finish('#b9c4ca', .33, { metalness: .62 });
const maskLeather = finish('#ac8e70', .86);
const hatLeather = finish('#41362e', .86);
const hatBand = finish('#2d251e', .91);
const hatShape = new T.LatheGeometry([
  new T.Vector2(0, -.018), new T.Vector2(.15, -.018), new T.Vector2(.29, -.033),
  new T.Vector2(.342, -.015), new T.Vector2(.348, -.005), new T.Vector2(.29, .003),
  new T.Vector2(.168, .020), new T.Vector2(.149, .141), new T.Vector2(.136, .163),
  new T.Vector2(.100, .169), new T.Vector2(0, .169),
], 48);
const hatRibbon = new T.CylinderGeometry(.158, .166, .037, 40, 1, true);

function mesh(parent, geometry, material, x, y, z, sx, sy, sz) {
  const piece = new T.Mesh(geometry, material);
  piece.position.set(x, y, z);
  piece.scale.set(sx, sy, sz);
  parent.add(piece);
  return piece;
}

function oval(parent, material, x, y, z, w, h, depth, pitch = 0) {
  const piece = mesh(parent, sphere, material, x, y, z, w, h, depth);
  piece.rotation.x = pitch;
  return piece;
}

function aim(piece, from, to, width) {
  axis.subVectors(to, from);
  piece.position.copy(from).lerp(to, .5);
  piece.scale.set(width, axis.length(), width);
  piece.quaternion.setFromUnitVectors(up, axis.normalize());
}

function beam(parent, material, from, to, width) {
  const piece = new T.Mesh(rod, material);
  aim(piece, new T.Vector3(...from), new T.Vector3(...to), width);
  parent.add(piece);
  return piece;
}

function buildSword(arm) {
  const sword = new T.Group();
  sword.name = 'Opsing Rider sword';
  sword.position.set(.159, 1.84, .447);
  sword.rotation.set(.38, .22, -.39);
  const edge = new T.Shape()
    .moveTo(-.034, .073).lineTo(.034, .073).lineTo(.024, .68)
    .lineTo(0, .86).lineTo(-.024, .68).closePath();
  const blade = new T.ExtrudeGeometry(edge, { depth: .009, bevelSize: .006, bevelThickness: .006, bevelSegments: 1 });
  mesh(sword, blade, steel, 0, 0, -.006, 1, 1, 1);
  mesh(sword, rod, straps, 0, -.018, 0, .025, .17, .025);
  beam(sword, iron, [-.11, .073, 0], [.11, .073, 0], .021);
  oval(sword, iron, 0, -.111, 0, .037, .031, .027);
  sword.visible = false;
  arm.add(sword);
  return sword;
}

function buildGauntlet(arm, side, cuff) {
  const hand = [side * .159, 1.839, .409];
  beam(arm, leather, cuff, hand, .057);
  beam(arm, iron, [side * .178, 1.852, .351], [side * .169, 1.850, .393], .056);
  oval(arm, ironEdge, side * .173, 1.857, .374, .058, .032, .023, .11);
  oval(arm, iron, ...hand, .054, .037, .055, .21);
  for (let finger = 0; finger < 4; finger++) {
    const x = side * (.126 + finger * .020);
    const z = .450 - (finger - 1.2) ** 2 * .004;
    oval(arm, iron, x, 1.840, z, .011, .024, .031, -.28);
    oval(arm, leather, x, 1.820, z + .015, .011, .019, .018, -.85);
  }
  oval(arm, iron, side * .112, 1.828, .417, .025, .019, .029, .39);
}

function buildBoot(torso, side) {
  const x = side * .433;
  const upper = beam(torso, leather, [side * .403, 1.29, -.096], [x, 1.065, -.066], .062);
  upper.scale.z *= .83;
  oval(torso, leather, x, 1.036, -.033, .062, .062, .083, -.49);
  oval(torso, scuffedLeather, x, 1.011, .044, .061, .047, .116, .09);
  oval(torso, straps, x, .984, .030, .064, .018, .133, .08);
  oval(torso, iron, x, .962, .039, .078, .013, .064);
}

function ridingReins(body, torso, neck) {
  const strips = 8;
  const positions = new T.BufferAttribute(new Float32Array(2 * (strips + 1) * 2 * 3), 3);
  positions.setUsage(T.DynamicDrawUsage);
  const indices = [];
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < strips; i++) {
      const start = 2 * (side * (strips + 1) + i);
      indices.push(start, start + 1, start + 2, start + 1, start + 3, start + 2);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', positions);
  geometry.setIndex(indices);
  const reins = new T.Mesh(geometry, finish('#322b2a', .94, { side: T.DoubleSide }));
  reins.name = 'Leather reins';
  reins.frustumCulled = false;
  body.add(reins);
  const hand = new T.Vector3();
  const bit = new T.Vector3();
  const point = new T.Vector3();

  return (armed, phase, pace) => {
    torso.updateMatrix();
    neck.updateMatrix();
    for (const [index, side] of [-1, 1].entries()) {
      hand.set((armed ? -1 : side) * .157, 1.820 - 1.47, .459).applyMatrix4(torso.matrix);
      bit.set(side * .133, .533, .830).applyMatrix4(neck.matrix);
      for (let i = 0; i <= strips; i++) {
        const t = i / strips;
        point.copy(hand).lerp(bit, t);
        const slack = Math.sin(Math.PI * t);
        point.x += side * slack * .090;
        point.y -= slack * (.052 + .021 * Math.sin(phase + 4 * t) * pace);
        const k = 2 * (index * (strips + 1) + i);
        positions.setXYZ(k, point.x, point.y - .009, point.z);
        positions.setXYZ(k + 1, point.x, point.y + .009, point.z);
      }
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  };
}

function buildRider(body) {
  const torso = new T.Group();
  torso.name = 'Seated rider';
  const swordArm = new T.Group();
  swordArm.name = 'Sword arm';
  let sword;
  body.add(torso);
  dressTorso(torso);
  for (const side of [-1, 1]) {
    const shoulder = [side * .209, 2.051, -.072];
    const elbow = [side * .291, 1.856, .117];
    const cuff = [side * .182, 1.846, .351];
    const arm = side === 1 ? swordArm : torso;
    sewnSleeve(arm, shoulder, elbow, cuff);
    buildGauntlet(arm, side, cuff);
    if (side === 1) {
      sword = buildSword(swordArm);
      swordArm.position.set(...shoulder);
      for (const piece of swordArm.children) piece.position.sub(swordArm.position);
      torso.add(swordArm);
    }
    buildBoot(torso, side);
  }
  torso.position.y = 1.47;
  for (const piece of torso.children) piece.position.y -= 1.47;
  return { torso, swordArm, sword };
}

function createLeg(body, x, front, gallopPhase, walkPhase, surface) {
  const start = new T.Vector3(x, front ? 1.185 : 1.22, front ? .57 : -.67);
  const knee = new T.Vector3();
  const foot = new T.Vector3();
  const thigh = new T.Mesh(upperLeg, horseArmor.dark);
  const shin = new T.Mesh(lowerLeg, horseArmor.plate);
  const joint = oval(body, horseArmor.edge, 0, 0, 0, .067, .068, .069);
  const shoe = mesh(body, hoofForm, horseArmor.dark, 0, 0, 0, .070, .136, .087);
  for (const [y, radius] of [[-.36, 1.16], [-.17, 1.13], [.04, .96], [.24, .75]]) {
    mesh(thigh, lame, horseArmor.plate, 0, y + .015, 0, radius, .19, radius);
  }
  for (const [y, radius] of [[-.32, .98], [-.13, .73], [.089, .72], [.30, .83]]) {
    mesh(shin, lame, horseArmor.edge, 0, y + .007, 0, radius, .10, radius);
  }
  mesh(shoe, lame, horseArmor.edge, 0, -.32, 0, .969, .16, .969);
  body.add(thigh, shin);

  return (cycle, pace, rise, yaw, worldX, worldZ, altitude) => {
    const gait = T.MathUtils.smoothstep(pace, .68, 1);
    const t = (cycle + T.MathUtils.lerp(walkPhase, gallopPhase, gait)) % 1;
    const contact = T.MathUtils.lerp(.63, .24, gait);
    const stance = t < contact;
    const step = stance ? t / contact : (t - contact) / (1 - contact);
    const lift = stance ? 0 : Math.sin(step * Math.PI) ** .82 * pace * (front ? .43 : .36);
    const stride = (stance ? .47 - step * .95 : -.48 + step * .95) * pace + (front ? .045 : -.045);
    const z = start.z + stride;
    const terrain = surface(worldX + x * Math.cos(yaw) + z * Math.sin(yaw),
      worldZ - x * Math.sin(yaw) + z * Math.cos(yaw)) - altitude;
    const y = .117 - rise + terrain + lift - start.y;
    const upper = front ? .566 : .635;
    const lower = front ? .585 : .644;
    const distance = Math.hypot(y, stride);
    const reach = Math.min(distance, upper + lower - .005);
    const along = (upper ** 2 - lower ** 2 + reach ** 2) / (2 * reach);
    const fold = Math.sqrt(Math.max(0, upper ** 2 - along ** 2));
    const bend = front ? -fold * (stance ? .4 : 1) : fold;
    knee.set(x, start.y + (y * along - stride * bend) / distance, start.z + (stride * along + y * bend) / distance);
    foot.set(x, start.y + y * reach / distance, start.z + stride * reach / distance);
    aim(thigh, start, knee, front ? .089 : .109);
    aim(shin, knee, foot, .053);
    joint.position.copy(knee);
    shoe.position.copy(foot);
    shoe.position.y -= .045;
    shoe.position.z += .028;
    shoe.rotation.x = stance ? 0 : -.60 * pace * Math.sin(step * Math.PI);
  };
}

function groundShadow(root, width = 1.9, depth = 3.35) {
  const length = 24;
  const pixels = new Uint8Array(length * length * 4);
  for (let y = 0; y < length; y++) for (let x = 0; x < length; x++) {
    const dist = Math.hypot((x + .5) / length * 2 - 1, (y + .5) / length * 2 - 1);
    pixels[(y * length + x) * 4 + 3] = 158 * Math.max(0, 1 - dist) ** 1.2;
  }
  const texture = new T.DataTexture(pixels, length, length);
  texture.magFilter = T.LinearFilter;
  texture.needsUpdate = true;
  const shadow = new T.Mesh(new T.PlaneGeometry(width, depth), new T.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  }));
  shadow.position.y = .051;
  shadow.rotation.x = -Math.PI / 2;
  root.add(shadow);
}

function buildPlagueMask(parent) {
  const mask = new T.Group();
  mask.name = 'Plague doctor mask';
  parent.add(mask);

  const face = new T.Shape().moveTo(0, .121)
    .quadraticCurveTo(.101, .123, .115, .061).quadraticCurveTo(.136, -.020, .079, -.074)
    .quadraticCurveTo(.025, -.112, 0, -.111).quadraticCurveTo(-.025, -.112, -.079, -.074)
    .quadraticCurveTo(-.136, -.020, -.115, .061).quadraticCurveTo(-.101, .123, 0, .121);
  for (const side of [-1, 1]) {
    const eye = new T.Path();
    eye.absellipse(side * .066, .062, .032, .021, 0, TAU, true, side * .24);
    face.holes.push(eye);
  }
  const shell = new T.ExtrudeGeometry(face, { depth: .026, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 2 });
  const positions = shell.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const temple = positions.getX(i) / .118;
    positions.setZ(i, positions.getZ(i) - .048 * temple ** 2);
  }
  shell.computeVertexNormals();
  mesh(mask, shell, maskLeather, 0, 2.292, .095, 1, 1, 1).name = 'Plain mask shell';
  const profile = [
    [.083, 2.252, .090, .074], [.133, 2.255, .095, .076], [.182, 2.254, .082, .071],
    [.239, 2.241, .068, .059], [.294, 2.220, .050, .046], [.348, 2.191, .032, .034],
    [.397, 2.157, .016, .022], [.434, 2.135, .004, .007], [.442, 2.132, 0, 0],
  ];
  const sides = 32;
  const vertices = [];
  const triangles = [];
  for (const [ring, [z, y, width, height]] of profile.entries()) {
    for (let side = 0; side < sides; side++) {
      const angle = TAU * side / sides;
      const x = width * Math.sin(angle);
      vertices.push(x, y + height * Math.cos(angle), z);
      if (ring === profile.length - 1) continue;
      const a = ring * sides + side;
      const b = ring * sides + (side + 1) % sides;
      triangles.push(a, a + sides, b, b, a + sides, b + sides);
    }
  }
  const curvedBeak = new T.BufferGeometry();
  curvedBeak.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  curvedBeak.setIndex(triangles);
  curvedBeak.computeVertexNormals();
  const beak = new T.Mesh(curvedBeak, maskLeather);
  beak.name = 'Hooked leather beak';
  mask.add(beak);

  const hat = new T.Group();
  hat.name = 'Wide-brimmed plague hat';
  hat.position.set(0, 2.468, -.028);
  hat.rotation.set(.055, 0, -.065);
  parent.add(hat);
  mesh(hat, hatShape, hatLeather, 0, 0, 0, 1, 1, .88);
  mesh(hat, hatRibbon, hatBand, 0, .037, 0, 1, 1, .89);
}

export function createStandingRider(scene, { x, z, yaw, plagueMask = false }, floor) {
  const root = new T.Group();
  root.name = RIDER_NAME;
  root.position.set(x, floor, z);
  root.rotation.y = yaw;
  scene.add(root);
  groundShadow(root, 1.35, 1.25);
  dressTorso(root, { onFoot: true });
  drapeStandingMantle(root);
  if (plagueMask) buildPlagueMask(root);

  for (const side of [-1, 1]) {
    const bootX = side * .171;
    oval(root, leather, bootX, .177, -.004, .068, .169, .081);
    oval(root, scuffedLeather, bootX, .082, .100, .076, .061, .169).name = 'Standing rider boot';
    oval(root, straps, bootX, .028, .109, .079, .028, .166);

    const wrist = [side * .317, 1.25, .133];
    sewnSleeve(root, [side * .205, 2.058, -.057], [side * .325, 1.64, -.092], wrist);
    const hand = new T.Group();
    const cuff = [side * .182, 1.846, .351];
    buildGauntlet(hand, side, cuff);
    hand.rotation.x = 1.12;
    hand.position.set(...wrist).sub(new T.Vector3(...cuff).applyQuaternion(hand.quaternion));
    root.add(hand);
  }
  const sword = buildSword(root);
  sword.position.set(.300, 1.154, .169);
  sword.rotation.set(Math.PI - .12, -.14, .065);
  sword.visible = true;
  return root;
}

export function createRider(scene, earth, surface = groundHeight) {
  const root = new T.Group();
  root.name = RIDER_NAME;
  root.visible = false;
  scene.add(root);
  groundShadow(root);
  const body = new T.Group();
  root.add(body);
  const { neck, tail } = buildHorse(body, earth);
  const { torso, swordArm, sword } = buildRider(body);
  const cape = drapeMantle(body);
  const reins = ridingReins(body, torso, neck);
  const legs = [
    createLeg(body, -.229, true, .04, .25, surface), createLeg(body, .229, true, .19, .75, surface),
    createLeg(body, -.257, false, .53, 0, surface), createLeg(body, .257, false, .68, .50, surface),
  ];

  return {
    hide() { root.visible = false; },
    pose(x, z, yaw, seconds, { cycle = seconds * 2.8, pace = 1, swing = null, armed = false } = {}) {
      const altitude = surface(x, z);
      const phase = TAU * cycle;
      const rise = .042 + pace * (.035 + .11 * Math.sin(phase + .28));
      root.visible = true;
      root.position.set(x, altitude, z);
      root.rotation.y = yaw;
      body.position.y = rise;
      neck.rotation.x = .085 * pace * Math.sin(phase + .63) - .026;
      tail.rotation.y = .18 * Math.sin(phase * .48);
      tail.rotation.x = .105 + .13 * Math.sin(phase);
      sword.visible = armed;
      const raise = T.MathUtils.smoothstep(swing ?? 0, 0, .48);
      const cut = T.MathUtils.smoothstep(swing ?? 0, .46, .72);
      const settle = 1 - T.MathUtils.smoothstep(swing ?? 0, .73, 1);
      torso.rotation.set(
        .026 - .061 * pace * Math.sin(phase + .52) + .13 * cut * settle,
        (.18 * raise - .38 * cut) * settle,
        .033 * pace * Math.sin(phase * .5) - .10 * cut * settle,
      );
      swordArm.rotation.set(
        armed ? .53 + (-1.50 * raise + 1.38 * cut) * settle : 0,
        armed ? .72 + (.66 * raise - 2.37 * cut) * settle : 0,
        armed ? .06 + (.57 * raise - .58 * cut) * settle : 0,
      );
      cape(phase, pace);
      reins(armed, phase, pace);
      for (const leg of legs) leg(cycle, pace, rise, yaw, x, z, altitude);
    },
  };
}
