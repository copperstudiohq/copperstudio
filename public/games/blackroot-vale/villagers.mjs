import * as T from './vendor/three.module.js';
import { CHILD_FOOTREST_HEIGHT, FLOOR_LEVEL, TABLE_HEIGHT } from './house-plan.mjs';
import { woolWeave } from './surfaces.mjs';
import { createVillagerHand } from './village-hands.mjs';

const TAU = Math.PI * 2;
const weave = woolWeave();
const sphere = new T.SphereGeometry(1, 16, 12);
const sleeveShape = new T.CylinderGeometry(.84, 1, 1, 12);
const up = new T.Vector3(0, 1, 0);
const axis = new T.Vector3();
const leather = new T.MeshStandardMaterial({ color: '#372c24', roughness: .92 });
const woodsTrousers = fabric('#4c4436');
const hatFelt = fabric('#383137');
const hatBand = new T.MeshStandardMaterial({ color: '#57382b', roughness: .86, side: T.DoubleSide });
const hatBuckle = new T.MeshStandardMaterial({ color: '#ac8451', roughness: .68, metalness: .34 });
const buckleRing = new T.TorusGeometry(.025, .0055, 7, 14);
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

function coat(body, surface, style, seated, shortCoat) {
  const rings = [
    [.145, .226, .154, 0], [.23, .221, .160, -.012], [.40, .201, .147, -.008],
    [.61, .188, .132, -.006], [.83, .173, .126, -.011], [.97, .172, .133, -.015],
    [1.12, .191, .141, -.020], [1.27, .221, .144, -.022],
    [1.35, .198, .131, -.021], [1.43, .127, .105, -.020], [1.47, .083, .089, -.013],
  ];
  if (seated && shortCoat) rings.splice(0, 6, [1.012, .215, .148, -.016], [1.068, .195, .142, -.020]);
  else if (seated) rings.splice(0, 5, [.813, .197, .152, .012], [.885, .181, .143, .002]);
  else if (shortCoat) rings.splice(0, 4, [.55, .244, .167, .006], [.69, .212, .145, -.011]);
  clothShell(body, surface, 'Pleated village coat', rings.length, (row, angle) => {
    const [y, width, depth, z] = rings[row];
    const pleat = 1 + (.081 * Math.sin(8 * angle + y * 1.7) + .028 * Math.cos(15 * angle + style)) * (1 - y * .44);
    const hem = (shortCoat ? .008 : .019) * Math.sin(5 * angle + style)
      * (1 - row / (rings.length - 1)) ** 3;
    return [width * pleat * Math.sin(angle), y + hem, z - depth * pleat * Math.cos(angle)];
  });
  if (!shortCoat) {
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
    const shin = new T.Mesh(sleeveShape, leather);
    trousers.name = 'Seated thigh';
    fitLimb(trousers, new T.Vector3(side * .105 * spacing, seatY + .052, -.026), knee, .083 * width);
    fitLimb(shin, knee, ankle, .051 * width);
    root.add(trousers, shin);
    oval(root, wool, ...knee, .080 * width, .072, .079 * width);
    oval(root, leather, ankle.x, footY + .047, ankle.z + .047, .053 * width, .044, .103 * spacing);
  }
}

function woodlandLeg(root, side) {
  const x = side * .123;
  // The independent trouser mesh ends inside the hem, below the fitted waist.
  const hip = new T.Vector3(side * .114, .595, .002);
  const knee = new T.Vector3();
  const ankle = new T.Vector3();
  const thigh = new T.Mesh(sleeveShape, woodsTrousers);
  thigh.name = 'Thick woodland thigh';
  const calf = new T.Mesh(sleeveShape, woodsTrousers);
  const joint = oval(root, woodsTrousers, x, .484, .017, .095, .096, .099);
  root.add(thigh, calf);
  return (swing, lift, bend = 0) => {
    hip.y = .595 - bend;
    knee.set(x, .484 + lift * .5 - bend * .62, .017 + swing * .59 + bend * .30);
    ankle.set(x, .119 + lift, swing + .009);
    fitLimb(thigh, hip, knee, .108);
    fitLimb(calf, knee, ankle, .081);
    joint.position.copy(knee);
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
  clothShell(body, wool, 'Shoulder shawl', rings.length, (row, angle) => {
    const [y, width, depth] = rings[row];
    const fall = .041 * Math.cos(angle - .35) + .016 * Math.sin(7 * angle);
    const ease = tailored ? 1 + .16 * (1 - row / 4) : 1;
    return [width * ease * Math.sin(angle), y + fall * (1 - row / 4), -.024 - depth * ease * Math.cos(angle)];
  });
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
    [.003, .147, .162, 0], [-.004, .215, .202, .28], [-.004, .287, .252, .65],
    [.007, .331, .296, 1], [.001, .337, .301, 1], [-.012, .332, .296, 1],
    [-.017, .291, .256, .68], [-.014, .151, .164, 0],
  ];
  clothShell(hat, hatFelt, 'Wavy felt brim', brim.length, (row, angle) => {
    const [y, width, depth, edge] = brim[row];
    const curl = .021 * Math.sin(2 * angle + .85) - .012 * Math.cos(3 * angle - .3);
    return [width * Math.sin(angle), y + edge * curl, depth * Math.cos(angle)];
  });

  const crown = [
    [.001, .157, .172, 0, 0], [.051, .150, .161, -.005, -.008], [.119, .128, .140, -.012, -.014],
    [.183, .103, .116, -.014, -.023], [.240, .075, .086, .003, -.038],
    [.281, .049, .057, .037, -.052], [.310, .025, .031, .074, -.071],
    [.324, .001, .001, .117, -.092],
  ];
  clothShell(hat, hatFelt, 'Bent pointed crown', crown.length, (row, angle) => {
    const [y, width, depth, x, z] = crown[row];
    const folds = 1 + .025 * Math.sin(6 * angle + row * .88);
    return [x + width * folds * Math.sin(angle), y, z + depth * folds * Math.cos(angle)];
  });

  const band = [[.018, .161, .176], [.056, .155, .164], [.066, .152, .159]];
  clothShell(hat, hatBand, 'Leather hat band', band.length, (row, angle) => {
    const [y, width, depth] = band[row];
    return [-.004 + width * Math.sin(angle), y, -.006 + depth * Math.cos(angle)];
  });
  const buckle = new T.Mesh(buckleRing, hatBuckle);
  buckle.name = 'Brass hat buckle';
  buckle.position.set(.047, .044, .154);
  buckle.rotation.y = .30;
  buckle.scale.set(1.15, .77, 1);
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
  const wool = fabric(cloth);
  const hood = fabric(cloth.clone().multiplyScalar(.58));
  const wrap = fabric(new T.Color('#645649').lerp(cloth, .31));
  const body = new T.Group();
  root.add(body);
  const lowered = seated ? .85 - (resident.seatHeight + .020) / root.scale.y : 0;
  body.position.y = -lowered;
  const broad = Boolean(house.woodland);
  coat(body, wool, house.style, seated, broad);
  shawl(body, hood, broad);
  if (seated) seatedLegs(root, broad ? woodsTrousers : wool, resident, broad);
  const eat = seated && !resident.resting ? mealPose(root, body, wool, house, resident, lowered) : null;
  const boots = [];
  let reachForDoor;
  if (!seated || resident.resting) {
    for (const side of [-1, 1]) {
      if (!seated) {
        const boot = oval(root, leather, side * (broad ? .123 : .087), .084, .043,
          broad ? .078 : .058, .082, broad ? .139 : .110);
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
    const bend = duck * .218;
    body.rotation.x += duck * .075;
    head.rotation.x += duck * .24;
    const step = position?.walking ? .119 * Math.sin(position.stride * 9.4) : 0;
    for (const [index, { boot, fitLeg }] of boots.entries()) {
      const swing = index === 0 ? step : -step;
      const lift = Math.max(0, swing * .40);
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
