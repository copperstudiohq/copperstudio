import * as T from './vendor/three.module.js';
import { corruptedHide } from './horse-blight.mjs';
import { seeded } from './layout.mjs';

const pi = Math.PI;
const ball = new T.SphereGeometry(1, 16, 12);
const taper = new T.CylinderGeometry(.69, 1, 1, 8);
const up = new T.Vector3(0, 1, 0);
const axis = new T.Vector3();

function finish(color, roughness, extra = {}) {
  return new T.MeshStandardMaterial({ color, roughness, side: T.DoubleSide, ...extra });
}

function wornSteel() {
  const width = 96;
  const noise = seeded(9481);
  const pixels = new Uint8Array(width * width * 4);
  for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const grain = 202 + 23 * noise() + 10 * Math.sin(x * .29 + y * .12) + 6 * Math.sin(x * 1.46 - y * .51);
    for (let channel = 0; channel < 3; channel++) pixels[i + channel] = grain;
    pixels[i + 3] = 255;
  }
  const texture = new T.DataTexture(pixels, width, width);
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

const steelGrain = wornSteel();
const nostril = finish('#110e12', .67);
const mane = finish('#1c1a20', .89);
const tack = finish('#252024', .86);
const leather = finish('#44302a', .90);
const steel = finish('#62666c', .55, { metalness: .43, map: steelGrain });
const blackened = finish('#444651', .68, { metalness: .38, map: steelGrain });
const trim = finish('#77787c', .52, { metalness: .43 });
const rivet = finish('#6d6458', .62, { metalness: .32 });

export const horseArmor = { plate: steel, dark: blackened, edge: trim };

const BARREL = [
  [1.319, -.995, .071, .115, .111], [1.322, -.913, .238, .228, .194],
  [1.312, -.788, .330, .299, .301], [1.305, -.590, .327, .303, .322],
  [1.280, -.351, .302, .299, .293], [1.257, -.098, .331, .302, .317],
  [1.259, .186, .354, .321, .331], [1.278, .444, .340, .360, .302],
  [1.314, .672, .285, .312, .289], [1.332, .803, .195, .228, .231],
  [1.335, .897, .028, .117, .096],
];

function oval(parent, material, center, scale, pitch = 0) {
  const piece = new T.Mesh(ball, material);
  piece.position.set(...center);
  piece.scale.set(...scale);
  piece.rotation.x = pitch;
  parent.add(piece);
  return piece;
}

function strut(parent, material, start, end, width) {
  const a = new T.Vector3(...start);
  const b = new T.Vector3(...end);
  axis.subVectors(b, a);
  const piece = new T.Mesh(taper, material);
  piece.position.copy(a).lerp(b, .5);
  piece.scale.set(width, axis.length(), width);
  piece.quaternion.setFromUnitVectors(up, axis.normalize());
  parent.add(piece);
  return piece;
}

function sheet(parent, rows, columns, trace, material, sculpt) {
  const vertices = [];
  const uvs = [];
  const indices = [];
  const colors = sculpt ? [] : null;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= columns; col++) {
      const u = col / columns;
      const point = trace(row, u);
      if (sculpt) {
        const shade = sculpt(point);
        colors.push(shade, shade, shade);
      }
      vertices.push(...point);
      uvs.push(u, row / (rows - 1));
    }
    if (!row) continue;
    for (let col = 0; col < columns; col++) {
      const i = (row - 1) * (columns + 1) + col;
      indices.push(i, i + 1, i + columns + 1, i + 1, i + columns + 2, i + columns + 1);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  if (colors) geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new T.Mesh(geometry, material);
  parent.add(mesh);
  return mesh;
}

/** Lofts are cross-sections in the horse's sagittal plane with offsets from its spine. */
function loftTrace(rings, angleScale) {
  return (row, u) => {
    const [y, z, width, upper, lower] = rings[row];
    const a = rings[Math.max(0, row - 1)];
    const b = rings[Math.min(rings.length - 1, row + 1)];
    const dy = b[0] - a[0];
    const dz = b[1] - a[1];
    const span = Math.hypot(dy, dz);
    const angle = (u - .5) * pi * 2 * angleScale;
    const face = Math.cos(angle);
    const radius = face >= 0 ? upper : lower;
    return [width * Math.sin(angle), y + face * radius * dz / span, z - face * radius * dy / span];
  };
}

function loft(parent, material, rings, angleScale = 1) {
  return sheet(parent, rings.length, 30, loftTrace(rings, angleScale), material);
}

function plate(parent, rows, sample, material = steel, rimWidth = .014) {
  sheet(parent, rows, 18, sample, material);
  for (const row of [0, rows - 1]) {
    let from = sample(row, 0);
    for (let i = 1; i <= 10; i++) {
      const to = sample(row, i / 10);
      strut(parent, trim, from, to, rimWidth);
      from = to;
    }
  }
  for (const edge of [0, 1]) {
    for (let row = 1; row < rows; row++) {
      strut(parent, blackened, sample(row - 1, edge), sample(row, edge), rimWidth);
    }
  }
  for (const edge of [.13, .87]) {
    for (const row of [0, rows - 1]) {
      const [x, y, z] = sample(row, edge);
      oval(parent, rivet, [x * 1.012, y + .008, z], [.016, .015, .016]);
    }
  }
}

function chamfron(neck) {
  const shape = [
    [.889, .388, .112], [.874, .476, .137], [.831, .563, .123],
    [.765, .675, .097], [.693, .771, .072], [.615, .861, .063], [.574, .909, .036],
  ];
  plate(neck, shape.length, (row, u) => {
    const [y, z, w] = shape[row];
    const a = u * 2 - 1;
    return [a * w, y - .046 * Math.abs(a) ** 1.32, z + .019 * a * a];
  });
  for (let row = 1; row < shape.length; row++) {
    const [y0, z0] = shape[row - 1];
    const [y1, z1] = shape[row];
    strut(neck, trim, [0, y0 + .009, z0], [0, y1 + .009, z1], .019 - row * .0012);
  }
  const sideVisor = [
    [.387, .840, .566, .094], [.464, .804, .525, .146], [.522, .709, .495, .153],
    [.611, .712, .485, .132], [.719, .661, .471, .109],
    [.826, .608, .444, .111], [.902, .575, .452, .114], [.938, .554, .473, .071],
  ];
  for (const side of [-1, 1]) {
    plate(neck, sideVisor.length, (row, u) => {
      const [z, top, low, w] = sideVisor[row];
      return [side * w * (.61 + .41 * Math.sin(u * pi * .95)), low + (top - low) * u, z + .016 * Math.sin(u * pi)];
    }, blackened, .009);
    strut(neck, trim, [side * .119, .801, .450], [side * .126, .777, .544], .011);
    strut(neck, trim, [side * .126, .777, .544], [side * .116, .731, .603], .010);
  }
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * .033;
    strut(neck, blackened, [x, .486, .938 - .11 * Math.abs(x)], [x, .568, .960 - .15 * Math.abs(x)], .010);
  }
}

function crinet(neck) {
  const collar = [
    [.132, .157, .241, .303], [.226, .190, .211, .271], [.324, .232, .183, .252],
    [.423, .281, .158, .227], [.521, .346, .139, .197], [.608, .404, .116, .166],
  ];
  for (const [i, [y, z, w, reach]] of collar.entries()) {
    plate(neck, 3, (row, u) => {
      const t = row / 2;
      const a = (u - .5) * 2 * 1.54;
      const side = Math.sin(a);
      return [
        w * side * (1.16 - .11 * t),
        y + .087 * t + .043 * side ** 2,
        z + .034 * t - reach * Math.cos(a),
      ];
    }, i % 2 ? steel : blackened, .009);
    plate(neck, 3, (row, u) => {
      const t = row / 2;
      const a = (u - .5) * 2 * 1.64;
      const side = Math.sin(a);
      return [
        w * side * (1.15 - .09 * t),
        y + .081 * t - .023 * Math.abs(side),
        z + .024 + reach * Math.cos(a) * (.91 - .046 * t),
      ];
    }, i % 2 ? blackened : steel, .008);
  }
}

function peytral(body) {
  const tiers = [
    [1.025, .728, .178, .105], [1.113, .851, .260, .158], [1.247, .951, .323, .207],
    [1.384, .974, .332, .222], [1.516, .934, .264, .181], [1.606, .860, .175, .114],
  ];
  plate(body, tiers.length, (row, u) => {
    const [y, z, w, wrap] = tiers[row];
    const a = u * 2 - 1;
    return [w * a, y + .034 * a ** 2, z - wrap * a ** 2];
  });
  for (let i = 1; i < tiers.length; i++) {
    const [y0, z0] = tiers[i - 1];
    const [y1, z1] = tiers[i];
    strut(body, blackened, [0, y0, z0 + .007], [0, y1, z1 + .008], .021);
  }
}

function croupiere(body) {
  const scales = [
    [-.933, -.758, .309, .337], [-.781, -.603, .362, .346], [-.623, -.431, .365, .354],
  ];
  for (const [i, [from, to, width, height]] of scales.entries()) {
    plate(body, 4, (row, u) => {
      const t = row / 3;
      const angle = (u * 2 - 1) * 1.78;
      const span = Math.sin(angle);
      const rise = Math.cos(angle);
      return [
        span * width * (.95 + t * .05) + Math.sign(span) * .017,
        1.297 + rise * height + .011 * Math.sin(t * pi),
        from + (to - from) * t + .045 * span ** 2,
      ];
    }, i % 2 ? blackened : steel, .011);
  }
}

function flankArmor(body) {
  loft(body, blackened, BARREL.map(([y, z, w, upper, lower]) => [y, z, w + .033, upper + .034, lower + .032]), .59);
  for (const [part, start] of [1, 3, 5, 7].entries()) {
    for (const side of [-1, 1]) {
      plate(body, 3, (row, u) => {
        const [y, z, w, top, low] = BARREL[start + row];
        const angle = .17 + u * 1.80;
        const rise = Math.cos(angle);
        return [
          side * (w + .048 - .005 * row) * Math.sin(angle),
          y + rise * (rise >= 0 ? top + .049 : low + .045),
          z + .031 * row - .045 * Math.sin(u * pi),
        ];
      }, part % 2 ? steel : blackened, .010);
    }
  }
}

function carveSocket(point) {
  const [x, y, z] = point;
  const distance = Math.hypot((y - .743) / .047, (z - .521) / .053);
  const depth = 1 - T.MathUtils.smoothstep(distance, .16, 1.0);
  point[0] = x * (1 - depth * .67);
  return 1 - depth * .98;
}

function head(neck, hide, faceHide) {
  const shape = [
    [.755, .317, .017, .043, .036], [.769, .377, .094, .110, .112], [.740, .454, .126, .114, .161],
    [.731, .480, .129, .112, .169], [.719, .505, .130, .109, .172], [.707, .530, .130, .104, .172],
    [.695, .550, .127, .101, .173], [.675, .586, .117, .093, .144],
    [.630, .661, .096, .088, .104], [.573, .770, .087, .079, .076],
    [.529, .863, .101, .082, .071], [.516, .924, .091, .067, .053], [.521, .958, .034, .033, .027],
  ];
  const face = sheet(neck, shape.length, 60, loftTrace(shape, 1), faceHide, carveSocket);
  face.name = 'Horse hide with hollow eye sockets';
  oval(neck, hide, [0, .515, .881], [.104, .073, .086], -.23);
  for (const side of [-1, 1]) {
    oval(neck, hide, [side * .084, .587, .575], [.038, .123, .163], -.44);
    oval(neck, nostril, [side * .093, .537, .913], [.014, .021, .034], -.46);
    const tip = [side * .152, 1.085, .376];
    strut(neck, blackened, [side * .091, .861, .416], [side * .132, .985, .393], .054);
    const ear = new T.Mesh(new T.ConeGeometry(.044, .128, 12), steel);
    const base = new T.Vector3(side * .132, .979, .393);
    const top = new T.Vector3(...tip);
    axis.subVectors(top, base);
    ear.position.copy(base).lerp(top, .49);
    ear.quaternion.setFromUnitVectors(up, axis.normalize());
    ear.scale.z = .59;
    neck.add(ear);
    oval(neck, tack, [side * .119, .532, .825], [.017, .017, .043]);
    strut(neck, leather, [side * .122, .752, .444], [side * .107, .564, .817], .017);
    oval(neck, rivet, [side * .121, .53, .838], [.021, .023, .019]);
  }
  oval(neck, tack, [0, .535, .817], [.115, .051, .036], -.35);
  chamfron(neck);
}

function batchDetails(parent) {
  const batches = new Map();
  for (const child of parent.children) {
    if (child.geometry !== taper && child.geometry !== ball) continue;
    const key = child.geometry.id + ':' + child.material.id;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(child);
  }
  for (const parts of batches.values()) {
    if (parts.length < 3) continue;
    const first = parts[0];
    const batch = new T.InstancedMesh(first.geometry, first.material, parts.length);
    for (const [i, part] of parts.entries()) {
      part.updateMatrix();
      batch.setMatrixAt(i, part.matrix);
      part.removeFromParent();
    }
    parent.add(batch);
  }
}

export function buildHorse(body, earth) {
  const hide = corruptedHide(earth);
  const faceHide = corruptedHide(earth, true);
  loft(body, hide, BARREL);
  flankArmor(body);

  // A girth wraps below the armor and the saddle sits above the barrel.
  oval(body, tack, [0, 1.232, -.024], [.351, .324, .055]);
  oval(body, leather, [0, 1.528, -.202], [.286, .086, .404]);
  oval(body, tack, [0, 1.569, -.265], [.248, .085, .322]);
  peytral(body);
  croupiere(body);

  const neck = new T.Group();
  neck.position.set(0, 1.465, .546);
  body.add(neck);
  loft(neck, hide, [
    [-.164, -.060, .203, .249, .286], [-.059, .036, .248, .266, .306],
    [.109, .132, .217, .270, .291], [.284, .224, .185, .244, .245],
    [.482, .309, .142, .187, .196], [.664, .411, .104, .141, .161],
    [.779, .445, .043, .074, .116],
  ]);
  for (let i = 0; i < 7; i++) {
    const z = .343 + i * .021;
    strut(neck, mane, [-.023 + i * .007, .874 - i * .012, z],
      [.019 + i * .010, .780 - i * .011, z + .074], .018);
  }
  crinet(neck);
  head(neck, hide, faceHide);

  const tail = new T.Group();
  tail.position.set(0, 1.456, -.948);
  body.add(tail);
  loft(tail, blackened, [
    [.007, .012, .062, .064, .064], [-.068, -.132, .082, .075, .075],
    [-.174, -.335, .072, .064, .057], [-.254, -.547, .056, .052, .048],
    [-.330, -.735, .044, .039, .039], [-.387, -.852, .018, .015, .019],
  ]);
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * .032;
    const z = -.11 - .15 * i;
    oval(tail, steel, [0, -.045 - .061 * i, z], [.081 - i * .009, .078 - i * .010, .042], -.43);
    strut(tail, mane, [x * .43, -.355, -.797], [x, -.397 - i * .010, -.903 - (i % 2) * .018], .010);
  }
  for (const part of [body, neck, tail]) batchDetails(part);
  return { neck, tail };
}
