import * as T from './vendor/three.module.js';
import { CHILD_FOOTREST_HEIGHT, FLOOR_LEVEL, TABLE_HEIGHT } from './house-plan.mjs';
import { woolWeave } from './surfaces.mjs';
import { createVillagerHand } from './village-hands.mjs';

const TAU = Math.PI * 2;
const weave = woolWeave();
const sphere = new T.SphereGeometry(1, 16, 12);
const sleeveShape = new T.CylinderGeometry(.84, 1, 1, 12);
const woodlandCuffShape = new T.CylinderGeometry(.90, 1, 1, 14);
const bareShinShape = new T.CylinderGeometry(.97, 1, 1, 14, 1, true);
const woodlandThighShape = new T.LatheGeometry([
  new T.Vector2(0, -.5), new T.Vector2(.70, -.5), new T.Vector2(.83, -.38),
  new T.Vector2(1.00, -.16), new T.Vector2(1.02, .08), new T.Vector2(.94, .31),
  new T.Vector2(.85, .5), new T.Vector2(0, .5),
], 14);
const up = new T.Vector3(0, 1, 0);
const axis = new T.Vector3();
const leather = new T.MeshStandardMaterial({ color: '#372c24', roughness: .92 });
const woodsTrousers = fabric('#4c4436');
const robeBinding = fabric('#654438');
const mantleBinding = fabric('#554349');
const woodlandHood = fabric('#42343a');
const woodlandWrap = fabric('#574b43');
const bootLeather = new T.MeshStandardMaterial({ color: '#53392b', roughness: .84, side: T.DoubleSide });
const bootCuff = new T.MeshStandardMaterial({ color: '#3b2923', roughness: .89 });
const bootWelt = new T.MeshStandardMaterial({ color: '#78604a', roughness: .96 });
const bootTread = new T.MeshStandardMaterial({ color: '#2a211c', roughness: .98 });
const bootRing = new T.CylinderGeometry(1, 1, 1, 16);
const soleOutline = new T.Shape().moveTo(-.048, .100)
  .quadraticCurveTo(-.070, .093, -.073, .008)
  .quadraticCurveTo(-.081, -.064, -.079, -.109)
  .quadraticCurveTo(-.063, -.152, 0, -.153)
  .quadraticCurveTo(.066, -.152, .081, -.109)
  .quadraticCurveTo(.079, -.052, .074, .004)
  .quadraticCurveTo(.074, .094, .046, .100).closePath();
const bootSole = new T.ExtrudeGeometry(soleOutline, { depth: 1, bevelEnabled: false, curveSegments: 6 })
  .rotateX(-Math.PI / 2);
const bootToeSeam = new T.TubeGeometry(new T.CatmullRomCurve3([
  new T.Vector3(-.064, .007, .066), new T.Vector3(-.041, .018, .066), new T.Vector3(0, .025, .066),
  new T.Vector3(.041, .018, .066), new T.Vector3(.064, .007, .066),
]), 14, .0021, 5, false);
const woodsSkin = new T.MeshStandardMaterial({ color: '#a48266', roughness: .88 });
const hatFelt = fabric('#342e36');
const hatBand = new T.MeshStandardMaterial({ color: '#624333', roughness: .89, side: T.DoubleSide });
const hatBuckle = new T.MeshStandardMaterial({ color: '#ac8451', roughness: .68, metalness: .34 });
const buckleBar = new T.BoxGeometry(1, 1, 1);
const hoodShadow = new T.MeshBasicMaterial({ color: '#171419' });
const ochre = new T.MeshStandardMaterial({ color: '#8b765b', roughness: .89 });
const breadColor = new T.MeshStandardMaterial({ color: '#ad6836', roughness: .94 });
const crumbColor = new T.MeshStandardMaterial({ color: '#dcbb7a', roughness: .94 });
const dye = new T.Color('#6e675b');

function fabric(color) {
  return new T.MeshStandardMaterial({
    color, map: weave, bumpMap: weave, bumpScale: .008, side: T.DoubleSide, roughness: 1,
  });
}

function oval(parent, surface, x, y, z, sx, sy, sz) {
  const mesh = new T.Mesh(sphere, surface);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  parent.add(mesh);
  return mesh;
}

function clothShell(parent, surface, name, rows, vertex) {
  const columns = 36;
  const xyz = [];
  const uv = [];
  const triangles = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column <= columns; column++) {
      const u = column / columns;
      xyz.push(...vertex(row, u * TAU));
      uv.push(u * 3, row / (rows - 1) * 3);
      if (!row || column === columns) continue;
      const index = (row - 1) * (columns + 1) + column;
      triangles.push(index, index + 1, index + columns + 1, index + 1, index + columns + 2, index + columns + 1);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(xyz, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  const mesh = new T.Mesh(geometry, surface);
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function bindHem(body, material, name, vertex, fraction) {
  clothShell(body, material, name, 2, (row, angle) => {
    const [x, y, z] = vertex(0, angle);
    const [nextX, nextY, nextZ] = vertex(1, angle);
    const t = row * fraction;
    return [
      T.MathUtils.lerp(x, nextX, t) + .003 * Math.sin(angle),
      T.MathUtils.lerp(y, nextY, t),
      T.MathUtils.lerp(z, nextZ, t) - .003 * Math.cos(angle),
    ];
  });
}

function coat(body, surface, style, seated, shortCoat) {
  const rings = [
    [.145, .226, .154, 0], [.23, .221, .160, -.012], [.40, .201, .147, -.008],
    [.61, .188, .132, -.006], [.83, .173, .126, -.011], [.97, .172, .133, -.015],
    [1.12, .191, .141, -.020], [1.27, .221, .144, -.022],
    [1.35, .198, .131, -.021], [1.43, .127, .105, -.020], [1.47, .083, .089, -.013],
  ];
  if (seated && shortCoat) rings.splice(0, 6, [1.012, .215, .148, -.016], [1.068, .195, .142, -.020]);
  else if (seated) rings.splice(0, 5, [.813, .197, .152, .012], [.885, .181, .143, .002]);
  else if (shortCoat) rings.splice(0, 5, [.744, .233, .171, .006], [.801, .211, .151, -.006], [.882, .181, .135, -.009]);
  function vertex(row, angle) {
    const [y, width, depth, z] = rings[row];
    const pleat = 1 + (.081 * Math.sin(8 * angle + y * 1.7) + .028 * Math.cos(15 * angle + style)) * (1 - y * .44);
    const hem = (shortCoat ? .008 : .019) * Math.sin(5 * angle + style)
      * (1 - row / (rings.length - 1)) ** 3;
    return [width * pleat * Math.sin(angle), y + hem, z - depth * pleat * Math.cos(angle)];
  }
  clothShell(body, surface, 'Pleated village coat', rings.length, vertex);
  if (shortCoat) {
    bindHem(body, robeBinding, 'Bound robe hem', vertex, .32);
  } else {
    oval(body, leather, 0, .951, -.016, .177, .024, .139);
    oval(body, ochre, .019, .941, .119, .036, .024, .020).rotation.z = -.16;
  }
}

function fitLimb(mesh, start, end, width) {
  axis.subVectors(end, start);
  mesh.position.copy(start).lerp(end, .5);
  mesh.scale.set(width, axis.length(), width);
  mesh.quaternion.setFromUnitVectors(up, axis.normalize());
}

function woodlandBoot(parent, x, y, z) {
  const boot = new T.Group();
  boot.name = 'Woodland leather boot';
  boot.position.set(x, y, z);
  parent.add(boot);
  const last = [
    [-.101, -.013, .003, .048], [-.092, -.008, .054, .056], [-.085, -.005, .063, .065], [-.039, .004, .067, .072],
    [.010, -.010, .057, .074], [.066, -.022, .046, .079], [.110, -.030, .036, .074],
    [.140, -.038, .021, .052], [.149, -.048, .004, .016],
  ];
  clothShell(boot, bootLeather, 'Shaped leather vamp', last.length, (row, angle) => {
    const [along, center, height, width] = last[row];
    return [width * Math.sin(angle), Math.max(-.061, center + height * Math.cos(angle)), along];
  });
  const sole = new T.Mesh(bootSole, bootTread);
  sole.name = 'Stacked boot sole';
  sole.position.y = -.082;
  sole.scale.y = .017;
  const welt = new T.Mesh(bootSole, bootWelt);
  welt.position.y = -.066;
  welt.scale.set(.99, .008, .99);
  const seam = new T.Mesh(bootToeSeam, bootWelt);
  seam.name = 'Stitched toe seam';
  boot.add(sole, welt, seam);
  return boot;
}

function woodlandShin(root) {
  const trousers = new T.Mesh(woodlandCuffShape, woodsTrousers);
  const shin = new T.Mesh(bareShinShape, woodsSkin);
  const boot = new T.Mesh(sleeveShape, bootLeather);
  trousers.name = 'Woodland trouser cuff';
  shin.name = 'Bare lower leg';
  boot.name = 'Leather boot shaft';
  for (const [y, width, height] of [[-.448, 1.033, .104], [.287, .916, .092]]) {
    const band = new T.Mesh(bootRing, bootCuff);
    band.name = 'Reinforced boot band';
    band.position.y = y;
    band.scale.set(width, height, width);
    boot.add(band);
  }
  root.add(trousers, shin, boot);
  const bootTop = new T.Vector3();
  const trouserCuff = new T.Vector3();
  return (knee, ankle) => {
    bootTop.lerpVectors(ankle, knee, .82);
    trouserCuff.lerpVectors(ankle, knee, .922);
    fitLimb(trousers, knee, trouserCuff, .096);
    fitLimb(shin, trouserCuff, bootTop, .083);
    fitLimb(boot, bootTop, ankle, .089);
  };
}

function seatedLegs(root, wool, resident, broad) {
  const footY = resident.child ? CHILD_FOOTREST_HEIGHT / root.scale.y : 0;
  const seatY = resident.seatHeight / root.scale.y;
  const width = broad ? 1.37 : 1;
  const spacing = broad ? 1.19 : 1;
  if (broad) {
    oval(root, wool, 0, seatY + .081, -.025, .209, .111, .139).name = 'Seated trouser waist';
  }
  for (const side of [-1, 1]) {
    const knee = new T.Vector3(side * .109 * spacing, seatY + .014, .333);
    const ankle = new T.Vector3(side * .114 * spacing, footY + .083, .362);
    const trousers = new T.Mesh(sleeveShape, wool);
    trousers.name = 'Seated thigh';
    fitLimb(trousers, new T.Vector3(side * .105 * spacing, seatY + .052, -.026), knee, .083 * width);
    root.add(trousers);
    if (broad) {
      woodlandShin(root)(knee, ankle);
    } else {
      const shin = new T.Mesh(sleeveShape, leather);
      fitLimb(shin, knee, ankle, .051);
      root.add(shin);
    }
    const kneeShape = broad ? knee.clone().lerp(ankle, -.064) : knee;
    oval(root, wool, ...kneeShape, .080 * width, broad ? .035 : .072, .079 * width);
    if (broad) woodlandBoot(root, ankle.x, footY + .084, ankle.z + .034);
    else oval(root, leather, ankle.x, footY + .047, ankle.z + .047, .053, .044, .103);
  }
}

function woodlandLeg(root, side) {
  const x = side * .123;
  // The independent trouser mesh ends inside the hem, below the fitted waist.
  const hip = new T.Vector3(side * .109, .798, .016);
  const knee = new T.Vector3();
  const ankle = new T.Vector3();
  const thigh = new T.Mesh(woodlandThighShape, woodsTrousers);
  thigh.name = 'Thick woodland thigh';
  const fitShin = woodlandShin(root);
  const joint = oval(root, woodsTrousers, x, .484, .017, .095, .036, .099);
  root.add(thigh);
  return (swing, lift, bend = 0) => {
    hip.y = .798 - bend;
    hip.z = .016 + bend * .38;
    knee.set(x, .484 + lift * .5 - bend * .62, .017 + swing * .59 + bend * .30);
    ankle.set(x, .119 + lift, swing + .009);
    fitLimb(thigh, hip, knee, .108);
    fitShin(knee, ankle);
    joint.position.copy(knee).lerp(ankle, -.064);
  };
}

function mealPose(root, body, wool, house, resident, lowered) {
  const tableY = TABLE_HEIGHT / root.scale.y + lowered;
  const reach = .67 / root.scale.z;
  const arms = [];
  for (const side of [-1, 1]) {
    const upper = new T.Mesh(sleeveShape, wool);
    const lower = new T.Mesh(sleeveShape, wool);
    body.add(upper, lower);
    const elbow = oval(body, wool, 0, 0, 0, .064, .068, .063);
    const hand = createVillagerHand(body, house.id, side);
    arms.push({ side, upper, lower, elbow, hand, shoulder: new T.Vector3(side * .171, 1.287, -.006) });
  }
  const bread = new T.Group();
  bread.name = 'Bread in hand';
  oval(bread, breadColor, 0, 0, 0, .049, .030, .048).rotation.x = .32;
  oval(bread, crumbColor, .012, .024, -.016, .031, .009, .021).rotation.y = -.40;
  body.add(bread);
  const elbowPoint = new T.Vector3();
  const handPoint = new T.Vector3();
  return (bite) => {
    for (const { side, upper, lower, elbow, hand, shoulder } of arms) {
      const lift = side > 0 ? bite : 0;
      elbowPoint.set(side * (.238 - lift * .048), 1.14 + .060 * lift, .217 - .04 * lift);
      handPoint.set(side * .122 - .064 * lift, T.MathUtils.lerp(tableY + .046, 1.459, lift),
        T.MathUtils.lerp(reach, .181, lift));
      fitLimb(upper, shoulder, elbowPoint, .069);
      fitLimb(lower, elbowPoint, handPoint, .061);
      elbow.position.copy(elbowPoint);
      hand.position.copy(handPoint);
      hand.rotation.set(.16 + .91 * lift, -side * .20, -.12 * side);
      if (side > 0) {
        bread.position.set(handPoint.x + .014, handPoint.y + .027, handPoint.z + .041);
        bread.rotation.x = -.24 + 1.01 * lift;
      }
    }
  };
}

function sleeve(body, fabricMaterial, house, side, resting) {
  const cuffHeight = resting ? 1.032 : house.style === 1 ? 1.050 : .908;
  const cuff = new T.Vector3(side * .073, cuffHeight, .188);
  const shoulder = new T.Vector3(side * (house.woodland ? .155 : .174), 1.292, -.018);
  const elbow = new T.Vector3(side * .247, 1.042, .014);
  const curve = new T.CatmullRomCurve3([shoulder, elbow, cuff]);
  const cloth = new T.Mesh(new T.TubeGeometry(curve, 12, resting ? .065 : .073, 10, false), fabricMaterial);
  body.add(cloth);
  const hand = createVillagerHand(body, house.id, side);
  hand.position.set(cuff.x * .68, cuff.y - .012, cuff.z + .017 * side);
  hand.rotation.set(.18, -side * .99, -side * .14);
  return { cloth, hand };
}

function latchArm(body, wool, house, rest, knobHeight) {
  const reach = new T.Group();
  reach.name = 'Door-closing arm';
  body.add(reach);
  const upper = new T.Mesh(sleeveShape, wool);
  const forearm = new T.Mesh(sleeveShape, wool);
  const elbow = oval(reach, wool, 0, 0, 0, .064, .069, .065);
  const hand = createVillagerHand(reach, house.id, 1);
  reach.add(upper, forearm);
  const shoulder = new T.Vector3(.175, 1.292, -.006);
  const bent = new T.Vector3();
  const fingers = new T.Vector3();
  const clasp = rest.hand.position;
  let fitted = false;
  return (amount) => {
    reach.visible = amount > .01;
    rest.cloth.visible = rest.hand.visible = !reach.visible;
    if (!reach.visible && fitted) return;
    fitted = true;
    const t = T.MathUtils.smoothstep(amount, 0, 1);
    bent.set(.247, T.MathUtils.lerp(1.049, 1.10, t), T.MathUtils.lerp(.025, .235, t));
    fingers.set(T.MathUtils.lerp(clasp.x, -.017, t), T.MathUtils.lerp(clasp.y, knobHeight, t),
      T.MathUtils.lerp(clasp.z, .539, t));
    fitLimb(upper, shoulder, bent, .071);
    fitLimb(forearm, bent, fingers, .060);
    elbow.position.copy(bent);
    hand.position.copy(fingers);
    hand.rotation.set(.07, -.40 + .33 * t, -.12 - .15 * t);
  };
}

function shawl(body, wool, tailored) {
  const rings = [
    [1.205, .248, .167], [1.255, .254, .163], [1.315, .235, .154],
    [1.39, .177, .133], [1.47, .087, .091],
  ];
  function vertex(row, angle) {
    const [y, width, depth] = rings[row];
    const fall = .041 * Math.cos(angle - .35) + .016 * Math.sin(7 * angle);
    const ease = tailored ? 1 + .16 * (1 - row / 4) : 1;
    return [width * ease * Math.sin(angle), y + fall * (1 - row / 4), -.024 - depth * ease * Math.cos(angle)];
  }
  clothShell(body, wool, 'Shoulder shawl', rings.length, vertex);
  if (tailored) {
    bindHem(body, mantleBinding, 'Mantle edging', vertex, .34);
    const [x, y, z] = vertex(2, Math.PI - .30);
    oval(body, hatBuckle, x, y + .006, z + .008, .027, .022, .011).name = 'Brass mantle clasp';
  }
}

function concealHead(head, wool, wrap) {
  const rows = [
    [-.175, .142, .003, .006], [-.149, .139, .091, .120], [-.101, .125, .127, .158],
    [-.026, .121, .138, .163], [.035, .117, .139, .157],
    [.098, .113, .128, .140], [.110, .109, .112, .129], [.075, .101, .103, .116],
  ];
  clothShell(head, wool, 'Deep wool hood', rows.length, (row, angle) => {
    const [z, y, width, height] = rows[row];
    const brow = Math.cos(angle);
    const fold = 1 + .036 * Math.sin(8 * angle + row * .4);
    return [
      width * fold * Math.sin(angle), y + height * fold * brow,
      z + Math.max(0, (row - 3) / 4) * (.047 * brow + .016 * Math.sin(angle)),
    ];
  });
  oval(head, hoodShadow, 0, .108, .061, .107, .125, .026).name = 'Hood shadow';
  const faceWrap = oval(head, wrap, 0, .067, .091, .109, .070, .048);
  faceWrap.name = 'Face wrap';
  faceWrap.rotation.z = -.063;
  const gathered = oval(head, wrap, -.005, .030, .092, .112, .026, .048);
  gathered.rotation.z = .095;
}

function woodlandWitchHat(head) {
  const hat = new T.Group();
  hat.name = 'Witch hat';
  hat.position.set(0, .206, -.018);
  hat.rotation.z = -.077;
  head.add(hat);

  const brim = [
    [.003, .147, .162, 0], [-.006, .230, .219, .23], [-.012, .328, .285, .68],
    [-.007, .403, .341, 1], [-.014, .411, .347, 1], [-.024, .403, .340, 1],
    [-.027, .330, .287, .68], [-.014, .151, .164, 0],
  ];
  clothShell(hat, hatFelt, 'Wavy felt brim', brim.length, (row, angle) => {
    const [y, width, depth, edge] = brim[row];
    const curl = -.032 * Math.cos(angle) + .045 * Math.sin(angle - .20) + .034 * Math.sin(2 * angle + .34);
    const wear = 1 + edge * (.043 * Math.sin(angle + .6) + .029 * Math.sin(3 * angle + .4));
    return [width * wear * Math.sin(angle), y + edge * curl, depth * wear * Math.cos(angle)];
  });

  const crown = [
    [.001, .159, .174, 0, 0], [.058, .154, .165, -.007, -.006], [.135, .137, .151, -.022, -.012],
    [.210, .112, .126, -.032, -.018], [.268, .084, .099, -.020, -.027],
    [.314, .063, .076, .016, -.039], [.353, .044, .053, .064, -.054],
    [.390, .029, .036, .120, -.071], [.408, .015, .020, .167, -.088],
    [.405, .001, .001, .211, -.111],
  ];
  clothShell(hat, hatFelt, 'Bent pointed crown', crown.length, (row, angle) => {
    const [y, width, depth, x, z] = crown[row];
    const folds = 1 + .025 * Math.sin(6 * angle + row * .88);
    return [x + width * folds * Math.sin(angle), y, z + depth * folds * Math.cos(angle)];
  });

  const band = [[.014, .165, .179], [.048, .161, .175], [.080, .157, .167]];
  clothShell(hat, hatBand, 'Leather hat band', band.length, (row, angle) => {
    const [y, width, depth] = band[row];
    const tilt = .006 * Math.sin(angle + .45);
    return [-.005 + width * Math.sin(angle), y + tilt, -.003 + depth * Math.cos(angle)];
  });
  const buckle = new T.Group();
  buckle.name = 'Brass hat buckle';
  buckle.position.set(.031, .049, .170);
  buckle.rotation.set(-.09, .21, -.075);
  for (const [x, y, width, height] of [
    [0, -.026, .087, .010], [0, .026, .087, .010],
    [-.038, 0, .010, .042], [.038, 0, .010, .042], [.007, -.001, .069, .006],
  ]) {
    const bar = new T.Mesh(buckleBar, hatBuckle);
    bar.position.set(x, y, 0);
    bar.scale.set(width, height, .010);
    buckle.add(bar);
  }
  hat.add(buckle);
}

export function createVillager(room, house, resident, index = 0) {
  const { accent } = house.room;
  const seated = resident.seatHeight !== undefined;
  const root = new T.Group();
  root.name = 'Hooded villager';
  root.position.set(resident.x, resident.y ?? FLOOR_LEVEL, resident.z);
  root.rotation.y = resident.yaw;
  const stature = 1.17 + house.style * .023 - .020 * Math.min(index, 1);
  root.scale.set(.96 + house.style * .035, stature, .99);
  if (house.id === 'hunter') {
    root.scale.x *= 1.04;
    root.scale.y *= .99;
  }
  if (resident.child) {
    root.scale.x *= .78;
    root.scale.y *= .64;
    root.scale.z *= .78;
  }
  room.add(root);
  const cloth = new T.Color(resident.accent ?? accent).lerp(dye, .30);
  if (index === 1) cloth.lerp(new T.Color('#625040'), .44);
  if (resident.child) cloth.lerp(new T.Color('#89765b'), .58);
  const broad = Boolean(house.woodland);
  const wool = fabric(cloth);
  const hood = broad ? woodlandHood : fabric(cloth.clone().multiplyScalar(.58));
  const wrap = broad ? woodlandWrap : fabric(new T.Color('#645649').lerp(cloth, .31));
  const body = new T.Group();
  root.add(body);
  const lowered = seated ? .85 - (resident.seatHeight + .020) / root.scale.y : 0;
  body.position.y = -lowered;
  coat(body, wool, house.style, seated, broad);
  shawl(body, hood, broad);
  if (seated) seatedLegs(root, broad ? woodsTrousers : wool, resident, broad);
  const eat = seated && !resident.resting ? mealPose(root, body, wool, house, resident, lowered) : null;
  const boots = [];
  let reachForDoor;
  if (!seated || resident.resting) {
    for (const side of [-1, 1]) {
      if (!seated) {
        const boot = broad ? woodlandBoot(root, side * .123, .084, .043)
          : oval(root, leather, side * .087, .084, .043, .058, .082, .110);
        const fitLeg = broad ? woodlandLeg(root, side) : null;
        fitLeg?.(0, 0);
        boots.push({ boot, fitLeg });
      }
      const rest = sleeve(body, wool, house, side, resident.resting);
      if (!seated && side > 0) reachForDoor = latchArm(body, wool, house, rest, .99 / root.scale.y);
    }
  }
  const head = new T.Group();
  head.position.set(0, 1.442, .005);
  head.name = 'Concealed head';
  body.add(head);
  concealHead(head, hood, wrap);
  if (house.woodland) woodlandWitchHat(head);

  function pose(seconds, playerLocal = null) {
    const distance = playerLocal ? Math.hypot(playerLocal.x - resident.x, playerLocal.z - resident.z) : 4;
    const hide = 1 - T.MathUtils.smoothstep(distance, 1.1, 2.7);
    const turn = Math.sign(resident.x) * hide;
    const bite = eat ? T.MathUtils.smoothstep(Math.sin(seconds * 1.67 + index * 2.12 + house.style * .63), .25, .95) : 0;
    body.rotation.y = turn * (seated ? .04 : .11);
    body.rotation.x = .035 + Math.sin(seconds * 1.7 + resident.x) * .008;
    head.rotation.set(.055 + .40 * hide + .095 * bite, turn * .35, turn * .10);
    eat?.(bite);
  }
  function standAt(seconds, position, duck = 0) {
    const spot = position ?? resident;
    root.position.set(spot.x, spot.y ?? FLOOR_LEVEL, spot.z);
    root.rotation.y = spot.yaw;
    pose(seconds);
    const bend = duck * .255;
    body.rotation.x += duck * .108;
    head.rotation.x += duck * .43;
    const step = position?.walking ? .119 * Math.sin(position.stride * 9.4) : 0;
    for (const [index, { boot, fitLeg }] of boots.entries()) {
      const swing = index === 0 ? step : -step;
      const lift = Math.max(0, swing * .40, broad ? -.116 * swing : 0);
      boot.position.y = .084 + lift;
      boot.position.z = .043 + swing;
      boot.rotation.x = -.75 * swing;
      fitLeg?.(swing, lift, bend);
    }
    body.position.y = .021 * Math.abs(step) / .119 - bend;
    reachForDoor?.(position?.reach ?? 0);
  }
  pose(0);
  reachForDoor?.(0);
  return { root, pose, standAt };
}
