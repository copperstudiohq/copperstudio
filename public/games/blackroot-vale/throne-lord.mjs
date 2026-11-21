import * as T from './vendor/three.module.js';
import { seeded } from './layout.mjs';
import { woolWeave } from './surfaces.mjs';
import { addThroneHead } from './throne-head.mjs';
import { THRONE_ROOM } from './tower-plan.mjs';

export const THRONE_LORD_HEIGHT_SCALE = 1.21;
export const THRONE_LORD_EYE_Y = 2.163 * THRONE_LORD_HEIGHT_SCALE;
const { armrestX, dais, seat } = THRONE_ROOM;
const daisLip = dais.front - (dais.steps - 1) * dais.tread - seat;

const sphere = new T.SphereGeometry(1, 22, 16);
const tapered = new T.CylinderGeometry(.83, 1, 1, 11);
const vertical = new T.Vector3(0, 1, 0);
const forward = new T.Vector3();
const material = (color, roughness = .87, metalness = 0) => new T.MeshStandardMaterial({ color, roughness, metalness });
const steel = material('#3f3131', .68, .56);
const bronze = material('#816046', .66, .47);
const joint = material('#302126', .94);
const weave = woolWeave();

function hammeredGrain() {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  const random = seeded(4659);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const grain = Math.round(192 + .11 * x * Math.sin(y * .74) + 16 * Math.sin(x * .19 + y * .31) + 42 * random());
      pixels.set([grain, grain, grain, 255], (y * size + x) * 4);
    }
  }
  const map = new T.DataTexture(pixels, size, size);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.magFilter = T.LinearFilter;
  map.minFilter = T.LinearMipmapLinearFilter;
  map.repeat.set(3, 3);
  map.generateMipmaps = true;
  map.needsUpdate = true;
  return map;
}

steel.map = steel.bumpMap = hammeredGrain();
steel.bumpScale = .011;
function piece(parent, geometry, finish, x, y, z, w, h, d) {
  const mesh = new T.Mesh(geometry, finish);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  parent.add(mesh);
  return mesh;
}

function oval(parent, finish, x, y, z, w, h, d) {
  return piece(parent, sphere, finish, x, y, z, w, h, d);
}

function strut(parent, finish, start, end, width, depth = width) {
  const a = new T.Vector3(...start);
  const b = new T.Vector3(...end);
  const mesh = piece(parent, tapered, finish, 0, 0, 0, width, 1, depth);
  aimStrut(mesh, a, b);
  return mesh;
}

function aimStrut(mesh, a, b) {
  forward.subVectors(b, a);
  mesh.scale.y = forward.length();
  mesh.position.copy(a).lerp(b, .5);
  mesh.quaternion.setFromUnitVectors(vertical, forward.normalize());
}

function plate(parent, finish, outline, depth, x, y, z, camber) {
  const shape = new T.Shape();
  shape.moveTo(...outline[0]);
  for (const point of outline.slice(1)) shape.lineTo(...point);
  shape.closePath();
  const geometry = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .012, bevelSize: .013, bevelSegments: 1 });
  const halfWidth = Math.max(...outline.map(([across]) => Math.abs(across))) + .013;
  const vertices = geometry.getAttribute('position');
  for (let i = 0; i < vertices.count; i++) {
    const across = vertices.getX(i) / halfWidth;
    vertices.setZ(i, vertices.getZ(i) + camber * (1 - across ** 2));
  }
  geometry.computeVertexNormals();
  return piece(parent, geometry, finish, x, y, z, 1, 1, 1);
}

function velvet(color) {
  return new T.MeshPhysicalMaterial({
    color, roughness: .96, side: T.DoubleSide, vertexColors: true,
    map: weave, bumpMap: weave, bumpScale: .005,
    sheen: .62, sheenColor: new T.Color(color).multiplyScalar(.68), sheenRoughness: .89,
  });
}

function drapedCloth(parent, name, finish, rows, columns, sample, edgeFinish) {
  const positions = [];
  const colors = [];
  const uv = [];
  const indices = [];
  const edgeIndices = [];
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    for (let column = 0; column <= columns; column++) {
      const u = column / columns;
      const [x, y, z, tone] = sample(u, v);
      positions.push(x, y, z);
      colors.push(tone, tone * .95, tone * .89);
      uv.push(u * 2, (1 - v) * 4);
      if (row === 0 || column === 0) continue;
      const i = row * (columns + 1) + column;
      const across = i - columns - 1;
      const triangles = edgeFinish && column === 1 ? edgeIndices : indices;
      triangles.push(across - 1, i - 1, across, across, i - 1, i);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices.concat(edgeIndices));
  if (edgeFinish) {
    geometry.addGroup(0, indices.length, 0);
    geometry.addGroup(indices.length, edgeIndices.length, 1);
  }
  geometry.computeVertexNormals();
  const mesh = new T.Mesh(geometry, edgeFinish ? [finish, edgeFinish] : finish);
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function cloak(parent, fabric) {
  return drapedCloth(parent, 'Crimson cape', fabric, 32, 42, (u, t) => {
    const across = 2 * u - 1;
    const edge = Math.abs(across);
    const spread = T.MathUtils.smoothstep(t, .62, 1);
    const pleat = Math.sin(u * 34 - 3.5 * t) * .092 + Math.cos(u * 62 + t * 4) * .024;
    return [
      across * (.51 + t * .68 + .56 * spread),
      Math.max(.012, 1.86 - 2.23 * t - edge * .09 + Math.sin(u * 28) * .032 * spread),
      -.216 - .27 * Math.sin(t * Math.PI) + edge ** 3 * t * .48 + pleat * Math.sin(t * 2.17),
      .80 + .19 * Math.sin(u * 41 - 3.5 * t) - .12 * spread,
    ];
  });
}

function robe(parent, fabric, braid) {
  const profile = [
    [.143, .486, 1.868, 1.907, .288, .309],
    [.217, .544, 1.750, 1.717, .375, .356],
    [.228, .517, 1.489, 1.480, .392, .354],
    [.251, .546, 1.366, 1.356, .790, .786],
    [.277, .757, 1.264, 1.181, .940, .896],
    [.361, .850, 1.141, 1.156, .982, .851],
    [.557, .916, .832, .926, 1.001, .782],
    [.594, 1.014, .492, .588, 1.046, .743],
    [.587, 1.100, .173, .258, 1.142, .751],
    [.398, 1.231, .040, .078, 1.400, .840],
    [.281, 1.479, .028, .030, 2.340, 1.041],
  ];
  return [-1, 1].map((side) => {
    function folds(u, t) {
      const row = t * (profile.length - 1);
      const from = Math.min(profile.length - 2, Math.floor(row));
      const [inner, outer, top, edge, front, rear] = profile[from].map((value, i) => (
        T.MathUtils.lerp(value, profile[from + 1][i], row - from)
      ));
      const grain = 28 * u + 2.1 * Math.sin(4.7 * u + .6 * t) - 3.1 * t + side * .42;
      const wave = Math.sin(grain);
      const fine = Math.cos(2.13 * grain + 5.2 * t);
      const folds = (.060 * wave + .017 * fine) * Math.sin(Math.PI * u) * (.28 + .72 * t);
      const pile = T.MathUtils.smoothstep(t, .73, 1);
      const hem = (.052 * Math.sin(grain + side) + .023 * fine) * pile;
      const z = T.MathUtils.lerp(front, rear, u) + folds + hem + .041 * side * pile * (1 - u);
      const handClearance = .132 * T.MathUtils.smoothstep(u, .46, .84)
        * T.MathUtils.smoothstep(t, .28, .38) * (1 - T.MathUtils.smoothstep(t, .44, .56));
      let fall = 0;
      for (let step = 0; step < dais.steps; step++) {
        const lip = daisLip + step * dais.tread;
        fall += T.MathUtils.smoothstep(z, lip + .084, lip + .182) * dais.rise / THRONE_LORD_HEIGHT_SCALE;
      }
      return [
        side * (T.MathUtils.lerp(inner, outer, u) + folds * .48 + .035 * pile * Math.sin(12 * u + side)),
        Math.max(.014, T.MathUtils.lerp(top, edge, u) + pile * (.022 * fine + .019 * wave) - handClearance) - fall,
        z,
        .87 + wave * .10 + fine * .046,
      ];
    }
    return drapedCloth(parent, 'Split-front robe', fabric, 76, 42, folds, braid);
  });
}

function mantle(parent, fabric, braid) {
  for (const side of [-1, 1]) {
    function pleats(u, t) {
      const phase = 22 * t + 2.5 * u + .55 * Math.sin(4 * u);
      const fold = Math.sin(phase) * .031 + Math.cos(phase * 2.17) * .009;
      const shoulder = Math.sin(Math.PI * t) ** .78;
      const shoulderLift = shoulder * (.096 + .124 * Math.sin(Math.PI * u));
      const collar = .063 * (1 - u) ** 2 * T.MathUtils.smoothstep(t, .14, .66);
      return [
        side * (.177 + .669 * u - .026 * (2 * t - 1) ** 2 * u),
        1.794 + shoulderLift - .134 * u ** 3 + collar + fold * (.38 + .62 * shoulder),
        T.MathUtils.lerp(.376 - .121 * u, -.315 + .028 * u, t) + .042 * shoulder + fold * .56,
        .85 + .13 * Math.sin(phase) + .036 * Math.cos(2.17 * phase),
      ];
    }
    drapedCloth(parent, 'Folded shoulder mantle', fabric, 32, 38, (t, u) => pleats(u, t), braid);
    const clasp = plate(parent, bronze, [[-.051, .019], [-.015, .042], [.040, .025], [.054, -.018], [.003, -.042], [-.047, -.024]],
      .018, side * .226, 1.786, .397, .007);
    clasp.rotation.z = side * .22;
  }
}

function gauntlet(parent, wrist, side) {
  const hand = new T.Group();
  hand.name = 'Resting gauntlet';
  hand.position.set(...wrist);
  hand.rotation.set(.19, side * .03, side * .11);
  hand.scale.set(1.14, 1, 1.075);
  parent.add(hand);
  const palm = oval(hand, steel, 0, 0, .053, .097, .047, .110);
  palm.name = 'Resting gauntlet armor';
  for (const [index, length] of [.102, .121, .113, .087].entries()) {
    const x = side * (index - 1.5) * .042;
    const base = [x, .002, .118];
    const knuckle = [x * 1.07, -.021, .118 + length * .44];
    const fingerJoint = [x * 1.04, -.058, .118 + length * .73];
    const tip = [x * 1.04, -.091, .118 + length];
    strut(hand, steel, base, knuckle, .019);
    oval(hand, steel, ...knuckle, .019, .018, .021);
    strut(hand, steel, knuckle, fingerJoint, .016);
    strut(hand, steel, fingerJoint, tip, .014);
    oval(hand, steel, ...tip, .013, .014, .016).name = 'Gauntlet fingertip';
  }
  const thumbJoint = [-side * .086, -.023, .076];
  const thumbTip = [-side * .092, -.049, .121];
  strut(hand, steel, [-side * .056, -.010, .043], thumbJoint, .022);
  strut(hand, steel, thumbJoint, thumbTip, .018);
  oval(hand, steel, ...thumbTip, .017, .017, .021);
}

function bracer(parent, from, to) {
  strut(parent, joint, from, to, .104, .110).name = 'Forearm lining';
  const origin = new T.Vector3(...from);
  const target = new T.Vector3(...to);
  for (let i = 0; i < 5; i++) {
    const a = origin.clone().lerp(target, .075 + i * .165);
    const b = origin.clone().lerp(target, .244 + i * .165);
    strut(parent, steel, a.toArray(), b.toArray(), .123 - i * .008, .129 - i * .007).name = 'Forearm plate';
  }
}

function breastplate(body) {
  const cuirass = oval(body, steel, 0, 1.55, -.014, .443, .387, .257);
  cuirass.name = 'Blackened cuirass';
  for (const [i, y] of [1.74, 1.59, 1.44, 1.285, 1.13, .99].entries()) {
    const width = .352 - Math.max(0, i - 1) * .046;
    const z = [.213, .222, .228, .209, .184, .151][i];
    plate(body, steel, [[-width, .056], [0, -.039], [width, .056], [width * .76, -.078],
      [0, -.160], [-width * .76, -.078]], .021, 0, y, z, .047);
    for (const side of [-1, 1]) {
      strut(body, bronze, [side * .007, y - .119, z + .072], [side * width * .77, y - .055, z + .046],
        i === 0 ? .007 : .005);
    }
  }
}

function greave(body, knee, ankle) {
  strut(body, joint, knee, ankle, .093, .103);
  strut(body, steel, knee, ankle, .109, .117);
  for (let i = 0; i < 5; i++) {
    const drop = .14 + i * .17;
    const width = .124 - i * .010;
    const y = T.MathUtils.lerp(knee[1], ankle[1], drop);
    const z = T.MathUtils.lerp(knee[2], ankle[2], drop);
    plate(body, steel, [[-width, .047], [0, .029], [width, .047], [width * .83, -.050],
      [0, -.134], [-width * .83, -.050]], .018, T.MathUtils.lerp(knee[0], ankle[0], drop), y, z + .081, .035);
  }
}

export function throneLord(scene, x, y, z, headTexture) {
  const figure = new T.Group();
  figure.name = 'Armored throne lord';
  figure.position.set(x, y, z);
  figure.scale.y = THRONE_LORD_HEIGHT_SCALE;
  scene.add(figure);
  const fabric = velvet('#652438');
  const braid = velvet('#8b5c3a');
  braid.name = 'Worn gold robe edging';
  const garments = [cloak(figure, fabric), ...robe(figure, fabric, braid)].map(({ geometry }) => {
    const points = geometry.getAttribute('position');
    points.setUsage(T.DynamicDrawUsage);
    const rest = points.array.slice();
    const weights = new Float32Array(points.count);
    for (let i = 0; i < points.count; i++) weights[i] = T.MathUtils.smoothstep(points.getY(i), 1.35, 1.63);
    return { geometry, points, rest, weights };
  });
  const body = new T.Group();
  figure.add(body);
  const hipY = 1.13;
  const spine = new T.Group();
  const chest = new T.Group();
  spine.position.y = hipY;
  chest.position.y = -hipY;
  spine.add(chest);
  body.add(spine);
  oval(body, joint, 0, 1.13, -.015, .367, .242, .231);
  breastplate(chest);
  oval(chest, joint, 0, 1.851, -.015, .173, .143, .154);
  mantle(chest, velvet('#71263b'), braid);
  const upperArms = [];
  for (const side of [-1, 1]) {
    const elbow = [side * .720, 1.398, .153];
    const wrist = [side * (armrestX - .020), 1.347, .566];
    const shoulder = oval(chest, steel, side * .525, 1.785, .031, .222, .134, .207);
    shoulder.name = 'Shoulder plate';
    for (let i = 0; i < 3; i++) {
      const lame = oval(chest, steel, side * (.558 + i * .033), 1.700 - i * .053, .055 + i * .033,
        .190 - i * .012, .073, .183 - i * .015);
      lame.rotation.z = -side * .37;
    }
    const shoulderJoint = [side * .513, 1.681, .011];
    const arm = strut(body, joint, shoulderJoint, elbow, .152, .154);
    upperArms.push({ arm, shoulder: new T.Vector3(...shoulderJoint), elbow: new T.Vector3(...elbow) });
    bracer(body, elbow, wrist);
    gauntlet(body, wrist, side);
    const knee = [side * .515, 1.155, .637];
    const ankle = [side * .475, .164, .794];
    strut(body, joint, [side * .178, 1.025, -.11], knee, .138);
    oval(body, steel, knee[0], knee[1] - .013, knee[2] + .055, .158, .158, .111).name = 'Knee plate';
    greave(body, knee, ankle);
    const boot = oval(body, steel, ankle[0], .106, .898, .128, .082, .215);
    boot.name = 'Armored boot';
    boot.rotation.y = side * .13;
    for (let i = 0; i < 3; i++) {
      const width = .102 - i * .018;
      const toe = plate(body, steel, [[-width, -.022], [-width * .68, .041], [0, .057], [width * .68, .041],
        [width, -.022], [0, -.042]], .012, ankle[0] + side * i * .006, .114 - i * .011, .948 + i * .052, .018);
      toe.rotation.y = side * .13;
    }
  }
  const head = addThroneHead(chest, headTexture);
  head.position.set(0, THRONE_LORD_EYE_Y / THRONE_LORD_HEIGHT_SCALE, .010);
  head.rotation.order = 'YXZ';
  const anchor = new T.Vector3();
  const gaze = new T.Vector3();
  let lean = 0;
  let drapedLean = 0;
  function drape() {
    const sin = Math.sin(lean);
    const cos = Math.cos(lean);
    for (const { geometry, points, rest, weights } of garments) {
      for (let i = 0; i < points.count; i++) {
        const weight = weights[i];
        if (weight === 0) continue;
        const height = rest[i * 3 + 1] - hipY;
        const depth = rest[i * 3 + 2];
        points.setY(i, hipY + T.MathUtils.lerp(height, height * cos - depth * sin, weight));
        points.setZ(i, T.MathUtils.lerp(depth, height * sin + depth * cos, weight));
      }
      points.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    }
    drapedLean = lean;
  }
  return (time, elapsed, target, leaning = false) => {
    const leanTarget = leaning ? .24 : 0;
    lean = elapsed === undefined ? 0 : T.MathUtils.damp(lean, leanTarget, 5, elapsed);
    if (Math.abs(lean - leanTarget) < .001) lean = leanTarget;
    body.rotation.x = .024 + .009 * Math.sin(time * 1.3);
    spine.rotation.x = lean;
    if (Math.abs(lean - drapedLean) >= .001 || (lean === 0 && drapedLean !== 0)) drape();
    for (const { arm, shoulder, elbow } of upperArms) {
      anchor.copy(shoulder);
      anchor.y -= hipY;
      anchor.applyEuler(spine.rotation);
      anchor.y += hipY;
      aimStrut(arm, anchor, elbow);
    }
    let pitch = -body.rotation.x - lean + .012 * Math.sin(time * .8);
    let yaw = .018 * Math.sin(time * .54);
    if (target) {
      chest.worldToLocal(gaze.copy(target)).sub(head.position);
      pitch = T.MathUtils.clamp(-Math.atan2(gaze.y, Math.hypot(gaze.x, gaze.z)), -.48, .52);
      yaw = T.MathUtils.clamp(Math.atan2(gaze.x, gaze.z), -1.10, 1.10);
    }
    head.rotation.x = elapsed === undefined ? pitch : T.MathUtils.damp(head.rotation.x, pitch, 7, elapsed);
    head.rotation.y = elapsed === undefined ? yaw : T.MathUtils.damp(head.rotation.y, yaw, 7, elapsed);
  };
}
