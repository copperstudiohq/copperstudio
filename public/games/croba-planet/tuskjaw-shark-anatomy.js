import * as THREE from './vendor/three.module.js';
import { PlantMesh } from './plant-mesh.js';
import {TUSKON_SIPHON_OUTLETS} from './tuskon-propulsion.js';

export const TUSKJAW_SHARK_LENGTH_METERS = 20;
const TAU = Math.PI * 2;
const vector = (x, y, z) => new THREE.Vector3(x, y, z);
const JAW_PIVOT = [0, -.40, 4.9];
const PROFILE = [
  [-12, 0, 0, .12], [-11.5, .055, .060, .12], [-10, .16, .17, .12],
  [-8.5, .29, .31, .13], [-7, .45, .47, .14], [-5.5, .64, .63, .15], [-4.5, .76, .72, .15],
  [-1.7, 1.22, 1.09, .12], [1, 1.53, 1.37, .06], [3, 1.60, 1.48, .02],
  [4.9, 1.48, 1.37, .02], [6.2, 1.43, 1.23, .07], [7.55, 1.30, 1.12, .06],
];

/** Smooth, bounded interpolation avoids overshooting the authored girth. */
function section(z) {
  let index = 1;
  while (index < PROFILE.length - 1 && PROFILE[index][0] < z) index++;
  const a = PROFILE[index - 1], b = PROFILE[index];
  const u = THREE.MathUtils.clamp((z - a[0]) / (b[0] - a[0]), 0, 1);
  const t = u * u * (3 - 2 * u);
  return { width: a[1] + (b[1] - a[1]) * t, height: a[2] + (b[2] - a[2]) * t,
    y: a[3] + (b[3] - a[3]) * t };
}

function skinPoint(z, angle) {
  const s = section(z);
  return vector(Math.sin(angle) * s.width, s.y + Math.cos(angle) * s.height, z);
}

const colors = {
  back: new THREE.Color(0x783451), flank: new THREE.Color(0x9e4f72),
  belly: new THREE.Color(0xc18b9d), shadow: new THREE.Color(0x562b48),
};
const scratch = new THREE.Color();
function skinColor(z, angle) {
  const underside = (1 - Math.cos(angle)) * .5;
  scratch.copy(colors.back).lerp(colors.flank, .28 + .32 * Math.abs(Math.sin(angle)))
    .lerp(colors.belly, underside ** 2 * .84);
  const grain = Math.sin(z * 17 + angle * 11) * Math.sin(z * 31 - angle * 23);
  return scratch.multiplyScalar(.96 + grain * .035).getHex();
}

/** A closed, softly cambered hydrofoil; both skins share the exact thin edge. */
function pectoralPoint(side, u, v, surface) {
  const chord = 1.75 * (1 - u) ** .72 * (1 + .30 * Math.sin(u * Math.PI));
  const centerZ = 2.05 - 5.55 * u - .45 * Math.sin(u * Math.PI);
  const thickness = .15 * (1 - u) ** .8 * Math.sin(v * Math.PI);
  return vector(side * (1.15 + 4.85 * Math.sin(u * Math.PI / 2)),
    -.48 - .15 * u - .25 * Math.sin(u * Math.PI) + .07 * (v - .5) + surface * thickness,
    centerZ + (1 - 2 * v) * chord);
}

/** Raised curved chitin with a distinct bevel and sealed rim. Circumferential
 * gaps expose the darker flexible skin; the long edges overlap the next ring.
 */
function armorPlate(mesh, z, angle, halfLength) {
  const halfAngle = .485;
  const at = (u, v, underside = false) => {
    const a = angle + (v * 2 - 1) * halfAngle;
    const along = z + (u * 2 - 1) * halfLength;
    const point = skinPoint(along, a);
    const relief = .045 + .08 * u + .065 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
    const radius = relief - (underside ? .040 : 0);
    point.x += Math.sin(a) * radius; point.y += Math.cos(a) * radius;
    return point;
  };
  mesh.grid(3, 6, (u, v) => at(u, v), (u, v) => {
    const color = new THREE.Color(skinColor(z, angle + (v * 2 - 1) * halfAngle));
    return color.multiplyScalar(.91 + .17 * u + .06 * Math.sin(v * Math.PI)).getHex();
  }, 0, true);
  mesh.grid(3, 6, (u, v) => at(u, v, true), 0x4c253c);
  const edge = [];
  for (let i = 0; i <= 6; i++) edge.push([0, i / 6]);
  for (let i = 1; i <= 3; i++) edge.push([i / 3, 1]);
  for (let i = 5; i >= 0; i--) edge.push([1, i / 6]);
  for (let i = 2; i >= 0; i--) edge.push([i / 3, 0]);
  mesh.grid(1, edge.length - 1, (u, v) => {
    const [along, across] = edge[Math.round(v * (edge.length - 1))];
    return at(along, across).lerp(at(along, across, true), u);
  }, 0x9a5876);
}

/** A shallow, broad mandibular plate drops fifteen degrees from its hinge.
 * The thin leading margin stays a horizontal jaw, with no tubular mouth rim.
 */
function jawPoint(u, across, underside = false) {
  const width = 1.13 + .14 * Math.sin(u * Math.PI);
  const z = 4.9 + 2.85 * u + .15 * (1 - across * across) * u ** 4;
  const y = -.40 - (z - 4.9) * Math.tan(Math.PI / 12)
    + .025 * Math.sin(u * Math.PI) * (1 - across * across);
  return vector(width * across, y - (underside ? .13 : 0), z);
}

/** Tubes use many short spans, with a true zero-radius sharp end. */
function curvedTusk(mesh, controls, baseRadius, metadata, jaw, prominent = false) {
  const curve = new THREE.CatmullRomCurve3(controls.map(p => vector(...p)), false, 'centripetal');
  const points = curve.getPoints(20);
  const radii = points.map((_, i) => baseRadius * (1 - i / 20) ** .85);
  const start = mesh.positions.length / 3;
  mesh.tube(points, radii, (u, v) => {
    const shade = .91 + Math.sin(v * TAU) * .055 - Math.sin(u * 70) ** 2 * .025;
    return new THREE.Color(0xe2c7c0).multiplyScalar(shade).getHex();
  }, 12);
  metadata.push({ jaw, prominent, baseRadius, start, count: mesh.positions.length / 3 - start,
    root: [...controls[0]], tip: [...controls.at(-1)], path: points.map(p => p.toArray()) });
}

/** Recessed bores and thick rims make open biological siphons, not solid cones. */
function rearSiphons(body,face){
  for(const outlet of TUSKON_SIPHON_OUTLETS){
    const side=Math.sign(outlet[0]);
    const ring=(t,radius,angle)=>vector(side*.90+(outlet[0]-side*.90)*t+Math.cos(angle)*radius,
      -.47+(outlet[1]+.47)*t+Math.sin(angle)*radius,-1.55+(outlet[2]+1.55)*t);
    body.grid(4,12,(u,v)=>ring(u,.50-.19*u,v*TAU),
      (u,v)=>new THREE.Color(0x9e4f72).multiplyScalar(.9+.12*Math.cos(v*TAU)+.08*u).getHex(),0,true);
    body.grid(1,12,(u,v)=>ring(1,.31-.075*u,v*TAU),0xb4738c,0,true);
    face.grid(2,12,(u,v)=>ring(.78+.22*u,.20+.035*u,v*TAU),0x40283e);
    face.grid(1,12,(u,v)=>ring(.78,.20*u,v*TAU),0x101622);
  }
}

/** Production anatomy in metres, Y up and +Z forward. The blunt face is +8 and
 * the finless tail tip is -12: the full animal is twenty metres long. All seven
 * buffers retain common body coordinates for shared swimming deformation.
 * No dorsal fin, material, texture, light, or scene state is created here.
 * @returns {{body:THREE.BufferGeometry,face:THREE.BufferGeometry,fins:THREE.BufferGeometry,
 * tail:THREE.BufferGeometry,jaw:THREE.BufferGeometry,tusks:THREE.BufferGeometry,armor:THREE.BufferGeometry}}
 */
export function buildTuskjawSharkAnatomy() {
  const body = new PlantMesh(), face = new PlantMesh(), fins = new PlantMesh();
  const tail = new PlantMesh(), jaw = new PlantMesh(), tusks = new PlantMesh(), armor = new PlantMesh();
  const eyes = [], tuskMetadata = [];
  // The armor-bearing torso and open upper jaw meet a wide, shallow face cap.
  // There is no pointed snout projecting in front of the eyes and oral rim.
  body.grid(36, 44, (u, v) => skinPoint(-4.9 + 9.8 * u, v * TAU),
    (u, v) => new THREE.Color(skinColor(-4.9 + 9.8 * u, v * TAU)).multiplyScalar(.57).getHex(), 0, true);
  body.grid(25, 40, (u, v) => skinPoint(4.9 + 2.65 * u, -2.02 + 4.04 * v),
    (u, v) => skinColor(4.9 + 2.65 * u, -2.02 + 4.04 * v), 0, true);
  body.grid(12, 40, (u, v) => {
    const edge = skinPoint(7.55, -2.02 + v * 4.04);
    const p = vector(0, -.40, 8).lerp(edge, u);
    p.z = 7.55 + .45 * Math.cos(u * Math.PI / 2); return p;
  }, (u, v) => skinColor(7.55, -2.02 + v * 4.04));

  const armorRings = [-6, -5, -4, -2.8, -1.6, -.4, .8, 2, 3.2, 4.4];
  for (const z of armorRings) for (let band = 0; band < 6; band++)
    armorPlate(armor, z, band * TAU / 6, z < -4 ? .58 : .69);

  // A closed muscular throat surrounds the old torso opening and disappears
  // inside the lower jaw. Both poles are buried in existing flesh: there is no
  // exposed tube end or hanging cuff. Broad shoulder sections narrow smoothly
  // into the mandible, while shallow ventral folds retain soft organic relief.
  const throatSections = [
    [3.25, 0, 0, -.30], [3.45, .55, .45, -.40], [3.70, 1.10, .86, -.45],
    [3.95, 1.30, .95, -.48], [4.20, 1.39, .97, -.48], [4.45, 1.42, .97, -.48],
    [4.70, 1.43, .96, -.48], [4.90, 1.42, .94, -.48], [5.10, 1.36, .82, -.52],
    [5.30, 1.26, .49, -.60], [5.48, 1.17, .23, -.64], [5.62, .80, .12, -.67],
    [5.75, 0, 0, -.675],
  ];
  const throatStart = body.positions.length / 3;
  body.grid(12, 24, (u, v) => {
    const index = Math.round(u * 12), [z, width, height, centerY] = throatSections[index];
    const angle = v * TAU, ventral = Math.max(0, -Math.cos(angle));
    const fold = .018 * Math.sin(u * Math.PI) * Math.sin(u * Math.PI * 6) * ventral ** 3;
    return vector(Math.sin(angle) * width, centerY + Math.cos(angle) * height - fold, z);
  }, (u, v) => new THREE.Color(skinColor(3.25 + u * 2.5, v * TAU))
    .multiplyScalar(.96 + .04 * Math.cos(v * TAU * 2)).getHex(), 0, true);
  const throatRange = { start: throatStart, count: body.positions.length / 3 - throatStart };

  // Flat palate and dark cheeks define a real shallow gape rather than an oval
  // opening pasted onto the forehead. The lower jaw is a thin closed volume.
  face.grid(14, 20, (u, v) => {
    const across = v * 2 - 1, z = 4.9 + 2.65 * u;
    const edge = skinPoint(z, 2.02);
    return vector(across * edge.x, edge.y + .025 * (1 - across * across),
      z + .40 * (1 - across * across) * u ** 4);
  }, 0x2e1d30);
  jaw.grid(14, 20, (u, v) => jawPoint(u, v * 2 - 1),
    (u, v) => Math.abs(v - .5) < .25 ? 0x6d354d : 0x87445f, 0, true);
  jaw.grid(14, 20, (u, v) => jawPoint(u, v * 2 - 1, true), skinColor(6.5, Math.PI));
  const jawEdge = [];
  for (let i = 0; i <= 20; i++) jawEdge.push([0, i / 20]);
  for (let i = 1; i <= 14; i++) jawEdge.push([i / 14, 1]);
  for (let i = 19; i >= 0; i--) jawEdge.push([1, i / 20]);
  for (let i = 13; i >= 0; i--) jawEdge.push([i / 14, 0]);
  jaw.grid(1, jawEdge.length - 1, (u, v) => {
    const [along, across] = jawEdge[Math.round(v * (jawEdge.length - 1))];
    return jawPoint(along, across * 2 - 1).lerp(jawPoint(along, across * 2 - 1, true), u);
  }, 0xb47690);
  const frontMargin = Array.from({ length: 21 }, (_, i) => {
    const across = i / 10 - 1;
    return vector(across * section(7.55).width * Math.sin(2.02), -.41,
      7.55 + .42 * (1 - across * across));
  });
  body.tube(frontMargin, .026, 0xa86380, 6);
  for (const side of [-1, 1]) {
    const lip = Array.from({ length: 21 }, (_, i) => skinPoint(4.9 + i / 20 * 2.65, side * 2.02));
    body.tube(lip, .026, 0xaa647e, 6);
    face.grid(16, 4, (u, v) => {
      const z = 4.9 + u * 2.65, edge = skinPoint(z, side * 2.02);
      const lower = jawPoint((z - 4.9) / 2.85, side);
      return vector(edge.x * .97 + (lower.x - edge.x * .97) * v,
        edge.y + (lower.y - edge.y) * v, z);
    }, 0x352036, 0, side < 0);

    // Five recessed gill slits on each shoulder; a lit fleshy rear edge gives
    // them depth without placing decorative panels over the shark's skin.
    for (let slit = 0; slit < 5; slit++) {
      const z = 4.2 - slit * .39;
      const groove = Array.from({ length: 13 }, (_, i) => {
        const a = side * (.86 + i / 12 * 1.07), p = skinPoint(z + Math.sin(i / 12 * Math.PI) * .16, a);
        p.x += side * .025; return p;
      });
      face.tube(groove, groove.map((_, i) => .018 + .029 * Math.sin(i / 12 * Math.PI)), 0x342038, 6);
      const fold = groove.map(p => p.clone().add(vector(side * .012, .012, -.085)));
      body.tube(fold, fold.map((_, i) => .013 + .025 * Math.sin(i / 12 * Math.PI)), 0xb06a86, 6);
    }

    // Two lateral eyes per cheek, looking sideways along +/-X. Their shallow
    // sockets intersect the real cheek instead of becoming frontal eye stalks.
    for (const [height, z] of [[.47, 6.12], [.29, 7.17]]) {
      const s = section(z), x = side * s.width * Math.sqrt(1 - ((height - s.y) / s.height) ** 2);
      const center = vector(x, height, z); eyes.push(center.toArray());
      body.ellipsoid(center.clone().add(vector(-side * .02, 0, 0)), vector(.14, .22, .29), 0x97516d,
        { segments: 12, rings: 8 });
      face.ellipsoid(center, vector(.105, .18, .25), 0x281d32, { segments: 16, rings: 8 });
      face.ellipsoid(center.clone().add(vector(side * .085, 0, .018)), vector(.062, .125, .183),
        (u, v) => new THREE.Color(0xd5a778).multiplyScalar(.80 + .20 * Math.sin(v * 76 + u * 11) ** 2).getHex(),
        { segments: 18, rings: 8 });
      face.ellipsoid(center.clone().add(vector(side * .138, 0, .032)), vector(.018, .104, .040),
        0x090f1b, { segments: 12, rings: 8 });
      face.ellipsoid(center.clone().add(vector(side * .151, .047, .074)), vector(.011, .027, .023),
        0xf0e5d7, { segments: 8, rings: 4 });
      const brow = Array.from({ length: 11 }, (_, i) => {
        const t = i / 10 * Math.PI;
        return center.clone().add(vector(side * .04, Math.sin(t) * .19, Math.cos(t) * .25));
      });
      body.tube(brow, .030, 0xad6580, 8);
    }
    const nostril = vector(side * .40, -.15, 7.982);
    face.ellipsoid(nostril, vector(.085, .025, .012), 0x3d263c, { segments: 10, rings: 6 });

    for (const surface of [-1, 1]) fins.grid(28, 12,
      (u, v) => pectoralPoint(side, u, v, surface),
      (u, v) => new THREE.Color(surface > 0 ? 0x873d63 : 0xb3748e)
        .multiplyScalar(.88 + .12 * Math.sin(v * Math.PI)).getHex(), 0, side * surface > 0);
    // Fine cartilage ridges lie against the upper hydrofoil, not outside it.
    for (const chord of [.16, .38, .61, .83]) {
      const points = Array.from({ length: 13 }, (_, i) => {
        const u = .08 + i / 12 * .82, p = pectoralPoint(side, u, chord, 1);
        p.y += .008; return p;
      });
      fins.tube(points, points.map((_, i) => .017 * (1 - i / 13)), 0xa76283, 5);
    }

    // Exactly four tusks per jaw. Their roots are external to the gum and the
    // hooks sweep back inward into the gape, with no disconnected cone tips.
    for (let index = 0; index < 2; index++) {
      const z = 6.05 + index * 1.05, root = skinPoint(z, side * 2.02);
      const width = Math.abs(root.x) + .018, y = root.y - .015;
      curvedTusk(tusks, [[side * width, y, z], [side * (width + .06), y - .18, z + .04],
        [side * (width - .02), y - .43, z + .10], [side * (width - .17), y - .55, z + .17],
        [side * (width - .35), y - .37, z + .24]], index ? .115 : .145, tuskMetadata, 'upper');
      const lowerZ = 6.28 + index * .95, lower = jawPoint((lowerZ - 4.9) / 2.85, side);
      const lowerWidth = Math.abs(lower.x) + .01, lowerY = lower.y + .012;
      const prominent = index === 1;
      const lowerPath = prominent ? [
        [side * lowerWidth, lowerY, lowerZ],
        [side * (lowerWidth + .17), lowerY + .22, lowerZ + .11],
        [side * (lowerWidth + .25), lowerY + .70, lowerZ + .19],
        [side * (lowerWidth + .22), lowerY + 1.02, lowerZ + .17],
        [side * (lowerWidth - .02), lowerY + .89, lowerZ + .02],
        [side * (lowerWidth - .33), lowerY + .54, lowerZ - .18],
      ] : [[side * lowerWidth, lowerY, lowerZ],
        [side * (lowerWidth + .05), lowerY + .18, lowerZ + .04],
        [side * (lowerWidth - .03), lowerY + .43, lowerZ + .10],
        [side * (lowerWidth - .18), lowerY + .56, lowerZ + .17],
        [side * (lowerWidth - .35), lowerY + .37, lowerZ + .24]];
      // The front pair rises outside the cheek, then hooks back through the
      // horizontal gape. Its tips never project beyond the existing blunt face.
      curvedTusk(tusks, lowerPath, prominent ? .18 : .135, tuskMetadata, 'lower', prominent);
      jaw.ellipsoid(vector(side * lowerWidth, lowerY - .015, lowerZ),
        prominent ? vector(.23, .12, .26) : vector(.17, .075, .21), 0x9b5874,
        { segments: 10, rings: 6 });
      body.ellipsoid(vector(side * width, y + .015, z), vector(.17, .075, .21), 0x97516d,
        { segments: 10, rings: 6 });
    }
  }

  // A long muscular appendage narrows continuously to one flexible point.
  // It has no broad caudal web, fork, lobe, or upper/lower tail fin.
  tail.grid(44, 28, (u, v) => skinPoint(-12 + 7.3 * u, v * TAU),
    (u, v) => skinColor(-12 + 7.3 * u, v * TAU), 0, true);
  rearSiphons(body,face);

  const geometry = Object.fromEntries(Object.entries({ body, face, fins, tail, jaw, tusks, armor })
    .map(([name, mesh]) => [name, mesh.geometry({ normalizeHeight: false })]));
  const metadata = { lengthMeters: TUSKJAW_SHARK_LENGTH_METERS, eyeCount: 4, eyeCenters: eyes,
    upperTusks: 4, lowerTusks: 4, largeFrontTusks: 2, dorsalFinCount: 0, sideFinCount: 2, gillsPerSide: 5,
    caudalFinCount: 0, noseProjection: 0, armored: true, armorPlateCount: armorRings.length * 6,
    rearSiphonCount:2,siphonOutlets:TUSKON_SIPHON_OUTLETS.map(outlet=>[...outlet]),
    eyeLayout: 'lateral', mouthShape: 'horizontal-jaws', jawGapeDegrees: 15,
    underNeckClosed: true, throatStyle: 'continuous-gular', throatRange, throatZ: [3.25, 5.75],
    tailStyle: 'finless-taper', jawPivot: [...JAW_PIVOT], frontAxis: '+Z', noseZ: 8, tailTipZ: -12 };
  geometry.body.userData.anatomy = metadata;
  Object.assign(geometry.body.userData, metadata);
  geometry.face.userData.eyeCenters = eyes.map(center => [...center]);
  geometry.jaw.userData.jawPivot = [...JAW_PIVOT];
  geometry.tusks.userData.tusks = tuskMetadata;
  const tuskJaw = new Float32Array(geometry.tusks.attributes.position.count);
  for (const tusk of tuskMetadata) tuskJaw.fill(tusk.jaw === 'lower' ? 1 : 0, tusk.start, tusk.start + tusk.count);
  geometry.tusks.setAttribute('tuskJaw', new THREE.Float32BufferAttribute(tuskJaw, 1));
  for (const [name, buffer] of Object.entries(geometry)) {
    buffer.name = `tuskjaw-shark-${name}`;
    buffer.userData.lengthMeters = TUSKJAW_SHARK_LENGTH_METERS;
    buffer.userData.triangleCount = buffer.index.count / 3;
  }
  geometry.body.userData.totalTriangles = Object.values(geometry).reduce((sum, buffer) => sum + buffer.userData.triangleCount, 0);
  return geometry;
}
