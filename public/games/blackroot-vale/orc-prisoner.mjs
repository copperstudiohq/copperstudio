import * as T from './vendor/three.module.js';
import { PRISONER } from './dungeon-plan.mjs';
import { MEAL_SEAT_HEIGHT, TABLE_HEIGHT } from './house-plan.mjs';

const sphere = new T.SphereGeometry(1, 20, 14);
const up = new T.Vector3(0, 1, 0);
const axis = new T.Vector3();
const limb = new T.CylinderGeometry(.77, 1, 1, 12);
const metalLink = new T.TorusGeometry(1, .19, 6, 14);
const material = (color, roughness = .94) => new T.MeshStandardMaterial({ color, roughness });
const wornSkin = material('#666b47');
const wornShadow = material('#4c5135');
const wornEar = material('#61503a');
const wornEyes = material('#9b8249', .5);
const restoredColors = ['#8b995d', '#6d7d4a', '#8c6850', '#ddc390'].map((color) => new T.Color(color));
const hide = material('#403329');
const cloth = material('#6a5d4a');
const grime = material('#4f4831');
const patches = material('#493f31');
const mouth = material('#2b2220');
const ivory = material('#b9a171', .66);
const dark = material('#201b16', .48);
const iron = new T.MeshStandardMaterial({ color: '#534a41', roughness: .67, metalness: .56 });
const tunic = material('#566d64');
const tunicTrim = material('#9a7953');
const bootLeather = material('#544031');
const crust = material('#ab7038');
const breadCrumb = material('#d5ae71');
const BODY_SCALE = .86;
const approach = (value, goal, step) => value + Math.sign(goal - value) * Math.min(Math.abs(goal - value), step);

function oval(parent, surface, center, scale, pitch = 0) {
  const mesh = new T.Mesh(sphere, surface);
  mesh.position.set(...center);
  mesh.scale.set(...scale);
  mesh.rotation.x = pitch;
  parent.add(mesh);
  return mesh;
}

function tapered(parent, shape, surface, start, end, width, depth = width) {
  const a = new T.Vector3(...start);
  const b = new T.Vector3(...end);
  axis.subVectors(b, a);
  const mesh = new T.Mesh(shape, surface);
  mesh.position.copy(a).lerp(b, .5);
  mesh.scale.set(width, axis.length(), depth);
  mesh.quaternion.setFromUnitVectors(up, axis.normalize());
  parent.add(mesh);
  return mesh;
}

function headShape(head, skin) {
  const rings = [
    [-.228, .058, .066, .01], [-.18, .130, .126, .018],
    [-.105, .196, .151, .025], [-.014, .205, .153, .009],
    [.057, .182, .134, -.009], [.13, .195, .140, -.030],
    [.20, .156, .127, -.032], [.252, .079, .072, -.037], [.266, .003, .003, -.037],
  ];
  const verts = [];
  const indices = [];
  const shades = [];
  const steps = 40;
  for (const [row, [y, width, reach, z]] of rings.entries()) {
    for (let i = 0; i < steps; i++) {
      const a = i * 2 * Math.PI / steps;
      const wave = 1 + .033 * Math.sin(5 * a + row * .9);
      verts.push(width * Math.sin(a) * wave, y, z + reach * Math.cos(a) * wave);
      const shade = .87 + .10 * Math.cos(a * 4 - row) + .035 * Math.cos(a * 17 + row * 2);
      shades.push(shade, shade, shade * .92);
      if (!row) continue;
      const previous = (row - 1) * steps + i;
      const next = (row - 1) * steps + (i + 1) % steps;
      indices.push(previous, next, previous + steps, next, next + steps, previous + steps);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(shades, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const face = skin.clone();
  face.vertexColors = true;
  head.add(new T.Mesh(geometry, face));
  return face;
}

function buildFace(head, skin, toughSkin, ear, white) {
  const face = headShape(head, skin);
  oval(head, toughSkin, [0, -.075, .168], [.098, .065, .062], -.34);
  oval(head, skin, [0, -.026, .161], [.056, .073, .063], -.15);
  oval(head, mouth, [0, -.144, .16], [.124, .022, .039], -.13);
  oval(head, toughSkin, [0, -.171, .143], [.13, .026, .045]);
  const tooth = new T.ConeGeometry(1, 1, 9);
  for (const side of [-1, 1]) {
    oval(head, toughSkin, [side * .143, -.055, .122], [.081, .057, .056]);
    oval(head, mouth, [side * .091, .028, .124], [.056, .036, .040]);
    oval(head, white, [side * .085, .023, .157], [.031, .015, .015]);
    oval(head, dark, [side * .081, .023, .169], [.010, .011, .006]);
    oval(head, skin, [side * .094, .067, .137], [.083, .033, .047]).rotation.z = side * .24;
    oval(head, mouth, [side * .048, -.100, .208], [.020, .010, .010]);
    tapered(head, tooth, ivory, [side * .087, -.172, .169],
      [side * .113, side < 0 ? -.066 : -.102, .196], .020, .017);
    const point = [side * .328, .126, -.048];
    tapered(head, tooth, skin, [side * .165, .016, -.019], point, .071, .036);
    tapered(head, tooth, ear, [side * .180, .018, .014],
      [side * .302, .111, -.020], .043, .015);
  }
  return face;
}

export function addOrcPrisoner(scene) {
  const original = [wornSkin, wornShadow, wornEar, wornEyes];
  const colors = original.map((surface) => surface.clone());
  const [skin, toughSkin, ear, white] = colors;
  const root = new T.Group();
  root.name = 'Orc prisoner';
  root.scale.setScalar(BODY_SCALE);
  scene.add(root);
  const torso = new T.Group();
  root.add(torso);
  oval(torso, skin, [0, .245, -.018], [.162, .279, .096], .075);
  oval(torso, hide, [0, .043, -.013], [.142, .131, .101]);
  oval(torso, toughSkin, [0, .492, -.034], [.071, .13, .077], .21);
  const rags = new T.Group();
  rags.name = 'Dungeon rags and ribs';
  torso.add(rags);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const rib = oval(rags, toughSkin, [side * (.062 + .011 * i), .315 - i * .057, .067], [.066, .017, .022]);
      rib.rotation.z = -side * (.12 + .047 * i);
    }
    const rag = oval(rags, cloth, [side * .123, .254, -.026], [.060, .232, .101], -.11);
    rag.rotation.z = side * .182;
    oval(rags, patches, [side * .089, .06, .071], [.065, .116, .031]).rotation.z = side * .17;
    oval(rags, grime, [side * .123, .306, .062], [.044, .058, .018]).rotation.z = side * .34;
  }
  tapered(rags, limb, patches, [-.142, .046, .021], [.142, .074, .025], .024, .092);
  const cleanClothes = new T.Group();
  cleanClothes.name = 'Clean village clothes';
  torso.add(cleanClothes);
  oval(cleanClothes, tunic, [0, .232, -.008], [.178, .276, .107], .065);
  oval(cleanClothes, bootLeather, [0, .069, .003], [.165, .036, .102]);
  oval(cleanClothes, tunicTrim, [.009, .070, .104], [.026, .026, .009]);
  tapered(cleanClothes, limb, tunicTrim, [0, .30, .101], [0, .452, .066], .008, .010);
  const head = new T.Group();
  head.position.set(.009, .583, .047);
  head.scale.set(.77, .79, .84);
  torso.add(head);
  const face = buildFace(head, skin, toughSkin, ear, white);
  const stains = new T.Group();
  stains.name = 'Dungeon grime';
  head.add(stains);
  oval(stains, grime, [-.146, -.09, .157], [.028, .049, .013]).rotation.z = -.63;
  oval(stains, grime, [.152, .158, .053], [.027, .075, .020]).rotation.z = .26;
  for (let i = 0; i < 4; i++) {
    const hair = oval(head, hide, [-.108 + i * .056, .225 + (i % 2) * .029, -.055], [.028, .088, .043], -.41);
    hair.rotation.z = -.31;
  }
  const limbs = [];
  const empty = [0, 0, 0];
  const end = [0, 1, 0];
  for (const side of [-1, 1]) {
    limbs.push({
      side,
      thigh: tapered(root, limb, patches, empty, end, .061, .055),
      shin: tapered(root, limb, skin, empty, end, .041, .040),
      knee: oval(root, toughSkin, empty, [.051, .055, .052]),
      foot: oval(root, side < 0 ? skin : hide, empty, [.052, .039, .101]),
      bootShaft: tapered(root, limb, bootLeather, empty, end, .061, .058),
      upper: tapered(root, limb, toughSkin, empty, end, .043),
      shoulderCap: oval(root, tunic, empty, [.072, .078, .074], .14),
      lower: tapered(root, limb, skin, empty, end, .036, .033),
      elbow: oval(root, grime, empty, [.039, .043, .039]),
      hand: oval(root, skin, empty, [.041, .052, .042]),
    });
  }
  const shackle = new T.Mesh(metalLink, iron);
  shackle.name = 'Prison cuff';
  shackle.rotation.x = Math.PI / 2;
  shackle.scale.set(.060, .061, .086);
  root.add(shackle);
  const bread = new T.Group();
  bread.name = 'Bread roll';
  root.add(bread);
  oval(bread, crust, [0, 0, 0], [.070, .039, .051], .21);
  oval(bread, breadCrumb, [-.017, .033, .008], [.017, .009, .032], .25).rotation.y = -.48;
  const chain = new T.Group();
  scene.add(chain);
  const links = Array.from({ length: 16 }, (_, i) => {
    const mesh = new T.Mesh(metalLink, iron);
    mesh.rotation.set(i % 2 * Math.PI / 2, .66, 0);
    mesh.scale.set(.047, .038, .035);
    chain.add(mesh);
    return mesh;
  });
  const a = new T.Vector3();
  const b = new T.Vector3();
  const join = new T.Vector3();
  const wallRing = new T.Vector3(-2.37, .23, .88);
  let restored = 0;
  let sit = 0;
  let previousTime = 0;
  function bone(mesh, start, finish) {
    a.set(...start);
    b.set(...finish);
    axis.subVectors(b, a);
    mesh.position.copy(a).lerp(b, .5);
    mesh.scale.y = axis.length();
    mesh.quaternion.setFromUnitVectors(up, axis.normalize());
  }
  function pose(seconds, position, {
    seated = false, eating = null, recovery = 0, moving = false, running = false, stride = 0, player, snap = false,
  } = {}) {
    const dt = Math.max(0, seconds - previousTime);
    previousTime = seconds;
    const dining = eating !== null;
    restored = snap ? recovery : approach(restored, recovery, dt * .9);
    sit = snap ? Number(dining) : approach(sit, Number(dining), dt * 4);
    colors.forEach((surface, i) => surface.color.copy(original[i].color).lerp(restoredColors[i], restored));
    face.color.copy(skin.color);
    rags.visible = restored < .45;
    stains.visible = restored < .45;
    cleanClothes.visible = !rags.visible;
    shackle.visible = restored < .23;
    torso.scale.set(1 + restored * .29, 1, 1 + restored * .24);
    root.position.set(position.x, position.y + .014, position.z);
    root.rotation.y = position.yaw;
    const swing = moving ? (running ? .205 : .126) : 0;
    const phase = stride * (running ? 8.4 : 10.8);
    const bite = dining ? T.MathUtils.smoothstep(Math.sin(eating * 20 - 1.1), -.25, .93) : 0;
    const chairY = MEAL_SEAT_HEIGHT / BODY_SCALE + .058;
    const tableY = TABLE_HEIGHT / BODY_SCALE;
    const kneeY = MEAL_SEAT_HEIGHT / BODY_SCALE + .018;
    const blend = (from, to) => from.map((value, index) => T.MathUtils.lerp(value, to[index], sit));
    torso.position.set(0,
      seated ? .377 : T.MathUtils.lerp(.741 + .027 * (1 - Math.cos(phase * 2)) * Number(moving), chairY, sit),
      seated ? -.108 : 0);
    torso.rotation.x = seated ? .27 : T.MathUtils.lerp(running ? .24 : .13 - .075 * restored, .12 + bite * .09, sit);
    for (const { side, thigh, shin, knee, foot, bootShaft, upper, shoulderCap, lower, elbow, hand } of limbs) {
      const step = side * Math.sin(phase);
      const lift = Math.max(0, step) * swing * .53;
      const hip = [side * .104, torso.position.y + .022, torso.position.z];
      const kneePoint = seated ? [side * .195, .263, .166]
        : blend([side * .101, .409 + lift * .62, .016 + step * swing * .38], [side * .154, kneeY, .338]);
      const ankle = seated ? [side * .238, .077, .29]
        : blend([side * .105, .074 + lift, step * swing], [side * .151, .077, .36]);
      const shoulder = [side * (.154 + .043 * restored), torso.position.y + .429, torso.position.z + .068];
      const elbowPoint = seated ? [side * .218, .436, .098]
        : blend([side * (.192 + .032 * restored), torso.position.y + .20, -.01 - step * swing * .62],
          [side * .24, .831 + (side > 0 ? .09 * bite : 0), .26]);
      const tableHand = side < 0 ? [-.178, tableY + .044, .655]
        : [.148 - .055 * bite, tableY + .042 + .020 * bite, .660 - .43 * bite];
      const fingers = seated ? [side * .184, .346, .215]
        : blend([side * (.173 + .025 * restored), torso.position.y + .017 + lift * .8, .047 - step * swing * .85], tableHand);
      bone(thigh, hip, kneePoint);
      bone(shin, kneePoint, ankle);
      bone(upper, shoulder, elbowPoint);
      bone(lower, elbowPoint, fingers);
      thigh.scale.x = .061 + .023 * restored;
      thigh.scale.z = .055 + .021 * restored;
      shin.scale.x = .041 + .008 * restored;
      shin.scale.z = .040 + .008 * restored;
      upper.scale.x = upper.scale.z = .043 + .015 * restored;
      lower.scale.x = .036 + .010 * restored;
      lower.scale.z = .033 + .010 * restored;
      thigh.material = cleanClothes.visible ? bootLeather : patches;
      upper.material = cleanClothes.visible ? tunic : toughSkin;
      shoulderCap.visible = cleanClothes.visible;
      shoulderCap.position.set(shoulder[0], shoulder[1] - .027, shoulder[2]);
      bootShaft.visible = cleanClothes.visible;
      if (bootShaft.visible) bone(bootShaft, kneePoint.map((value, i) => T.MathUtils.lerp(ankle[i], value, .48)), ankle);
      foot.material = bootShaft.visible ? bootLeather : side < 0 ? skin : hide;
      knee.position.set(...kneePoint);
      foot.scale.set(bootShaft.visible ? .065 : .052, bootShaft.visible ? .052 : .039, bootShaft.visible ? .114 : .101);
      foot.position.set(ankle[0], ankle[1] - (bootShaft.visible ? .012 : .029), ankle[2] + .047);
      elbow.position.set(...elbowPoint);
      hand.position.set(...fingers);
      if (side < 0) shackle.position.set(ankle[0], ankle[1] + .054, ankle[2] - .022);
      else bread.position.set(fingers[0] + .011, fingers[1] + .041, fingers[2] + .030);
    }
    bread.visible = dining;
    if (dining) {
      bread.scale.setScalar(1 - .73 * eating);
      bread.rotation.x = -.20 + .62 * bite;
    }
    chain.visible = seated;
    if (seated) {
      root.updateMatrix();
      join.copy(shackle.position).applyMatrix4(root.matrix);
      for (const [i, link] of links.entries()) {
        const t = i / (links.length - 1);
        link.position.copy(join).lerp(wallRing, t);
        link.position.y = Math.max(.038, link.position.y - .18 * Math.sin(Math.PI * t));
      }
    }
    const facing = player ? Math.atan2(player.x - position.x, player.z - position.z) : root.rotation.y;
    const angle = Math.atan2(Math.sin(facing - root.rotation.y), Math.cos(facing - root.rotation.y));
    head.rotation.x = T.MathUtils.lerp(seated ? -.125 : -.060, .19 + .22 * bite, sit) + .035 * Math.sin(seconds * 2.2);
    head.rotation.y = T.MathUtils.clamp(angle, -.72, .72) * .74 * (1 - sit);
  }
  pose(0, { ...PRISONER, y: 0, yaw: .63 }, { seated: true });
  return { root, pose };
}
