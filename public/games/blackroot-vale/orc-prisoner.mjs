import * as T from './vendor/three.module.js';
import { PRISONER } from './dungeon-plan.mjs';

const sphere = new T.SphereGeometry(1, 20, 14);
const up = new T.Vector3(0, 1, 0);
const axis = new T.Vector3();
const limb = new T.CylinderGeometry(.77, 1, 1, 12);
const metalLink = new T.TorusGeometry(1, .19, 6, 14);
const material = (color, roughness = .94) => new T.MeshStandardMaterial({ color, roughness });
const skin = material('#666b47');
const toughSkin = material('#4c5135');
const ear = material('#61503a');
const hide = material('#403329');
const cloth = material('#6a5d4a');
const grime = material('#4f4831');
const patches = material('#493f31');
const mouth = material('#2b2220');
const ivory = material('#b9a171', .66);
const white = material('#9b8249', .5);
const dark = material('#201b16', .48);
const iron = new T.MeshStandardMaterial({ color: '#534a41', roughness: .67, metalness: .56 });

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

function headShape(head) {
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
}

function buildFace(head) {
  headShape(head);
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
}

export function addOrcPrisoner(scene) {
  const root = new T.Group();
  root.name = 'Orc prisoner';
  root.scale.setScalar(.86);
  scene.add(root);
  const torso = new T.Group();
  root.add(torso);
  oval(torso, skin, [0, .245, -.018], [.162, .279, .096], .075);
  oval(torso, hide, [0, .043, -.013], [.142, .131, .101]);
  oval(torso, toughSkin, [0, .492, -.034], [.071, .13, .077], .21);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const rib = oval(torso, toughSkin, [side * (.062 + .011 * i), .315 - i * .057, .067], [.066, .017, .022]);
      rib.rotation.z = -side * (.12 + .047 * i);
    }
    const rag = oval(torso, cloth, [side * .123, .254, -.026], [.060, .232, .101], -.11);
    rag.rotation.z = side * .182;
    oval(torso, patches, [side * .089, .06, .071], [.065, .116, .031]).rotation.z = side * .17;
    oval(torso, grime, [side * .123, .306, .062], [.044, .058, .018]).rotation.z = side * .34;
  }
  tapered(torso, limb, patches, [-.142, .046, .021], [.142, .074, .025], .024, .092);
  const head = new T.Group();
  head.position.set(.009, .583, .047);
  head.scale.set(.77, .79, .84);
  torso.add(head);
  buildFace(head);
  oval(head, grime, [-.146, -.09, .157], [.028, .049, .013]).rotation.z = -.63;
  oval(head, grime, [.152, .158, .053], [.027, .075, .020]).rotation.z = .26;
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
      upper: tapered(root, limb, toughSkin, empty, end, .043),
      lower: tapered(root, limb, skin, empty, end, .036, .033),
      elbow: oval(root, grime, empty, [.039, .043, .039]),
      hand: oval(root, skin, empty, [.041, .052, .042]),
    });
  }
  const shackle = new T.Mesh(metalLink, iron);
  shackle.rotation.x = Math.PI / 2;
  shackle.scale.set(.060, .061, .086);
  root.add(shackle);
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
  function bone(mesh, start, finish) {
    a.set(...start);
    b.set(...finish);
    axis.subVectors(b, a);
    mesh.position.copy(a).lerp(b, .5);
    mesh.scale.y = axis.length();
    mesh.quaternion.setFromUnitVectors(up, axis.normalize());
  }
  function pose(seconds, position, { seated = false, moving = false, running = false, stride = 0, player } = {}) {
    root.position.set(position.x, position.y + .014, position.z);
    root.rotation.y = position.yaw;
    const swing = moving ? (running ? .205 : .126) : 0;
    const phase = stride * (running ? 8.4 : 10.8);
    torso.position.set(0, seated ? .377 : .741 + .027 * (1 - Math.cos(phase * 2)) * Number(moving), seated ? -.108 : 0);
    torso.rotation.x = seated ? .27 : running ? .24 : .13;
    for (const { side, thigh, shin, knee, foot, upper, lower, elbow, hand } of limbs) {
      const step = side * Math.sin(phase);
      const lift = Math.max(0, step) * swing * .53;
      const hip = [side * .104, torso.position.y + .022, torso.position.z];
      const kneePoint = seated ? [side * .195, .263, .166] : [side * .101, .409 + lift * .62, .016 + step * swing * .38];
      const ankle = seated ? [side * .238, .077, .29] : [side * .105, .074 + lift, step * swing];
      const shoulder = [side * .154, torso.position.y + .429, torso.position.z + .068];
      const elbowPoint = seated ? [side * .218, .436, .098] : [side * .192, torso.position.y + .20, -.01 - step * swing * .62];
      const fingers = seated ? [side * .184, .346, .215] : [side * .173, torso.position.y + .017 + lift * .8, .047 - step * swing * .85];
      bone(thigh, hip, kneePoint);
      bone(shin, kneePoint, ankle);
      bone(upper, shoulder, elbowPoint);
      bone(lower, elbowPoint, fingers);
      knee.position.set(...kneePoint);
      foot.position.set(ankle[0], ankle[1] - .029, ankle[2] + .047);
      elbow.position.set(...elbowPoint);
      hand.position.set(...fingers);
      if (side < 0) shackle.position.set(ankle[0], ankle[1] + .054, ankle[2] - .022);
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
    head.rotation.x = (seated ? -.125 : -.060) + .035 * Math.sin(seconds * 2.2);
    head.rotation.y = T.MathUtils.clamp(angle, -.72, .72) * .74;
  }
  pose(0, { ...PRISONER, y: 0, yaw: .63 }, { seated: true });
  return { root, pose };
}
