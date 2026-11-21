import * as T from './vendor/three.module.js';
import { woolWeave } from './surfaces.mjs';

const TAU = 2 * Math.PI;

const weave = woolWeave();
const wool = new T.MeshStandardMaterial({
  name: 'Woven charcoal wool',
  color: '#393739', roughness: .98, side: T.DoubleSide, vertexColors: true,
  map: weave, bumpMap: weave, bumpScale: .013,
});
const hoodLining = new T.MeshBasicMaterial({ name: 'Recessed hood lining', color: '#161417', side: T.DoubleSide });

function fabric(parent, rows, columns, point, { name, closed = false, liningFrom = rows, moving = false }) {
  const geometry = new T.BufferGeometry();
  const positions = new T.BufferAttribute(new Float32Array(rows * (columns + 1) * 3), 3);
  const uv = [];
  const colors = [];
  const indices = [];
  for (let row = 0; row < rows; row++) {
    const t = row / (rows - 1);
    for (let col = 0; col <= columns; col++) {
      const u = col / columns;
      uv.push(4 * u, 4 * t);
      const dye = .92 + .06 * Math.sin(TAU * (3 * u - t)) + .035 * Math.cos(TAU * (7 * u + .83 * t));
      colors.push(dye, dye * .98, dye * .95);
    }
    if (!row) continue;
    for (let col = 0; col < columns; col++) {
      const i = (row - 1) * (columns + 1) + col;
      indices.push(i, i + 1, i + columns + 1, i + 1, i + columns + 2, i + columns + 1);
    }
  }
  if (liningFrom < rows) {
    const opening = (liningFrom - 1) * columns * 6;
    geometry.addGroup(0, opening, 0);
    geometry.addGroup(opening, indices.length - opening, 1);
  }
  if (moving) positions.setUsage(T.DynamicDrawUsage);
  geometry.setAttribute('position', positions);
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  const piece = new T.Mesh(geometry, liningFrom < rows ? [wool, hoodLining] : wool);
  piece.name = name;
  piece.frustumCulled = !moving;
  parent.add(piece);

  // The duplicated UV column needs a shared normal to keep the joining seam smooth.
  const seamNormal = new T.Vector3();
  const otherNormal = new T.Vector3();
  function shape(phase, pace) {
    for (let row = 0; row < rows; row++) {
      const t = row / (rows - 1);
      for (let col = 0; col <= columns; col++) {
        positions.setXYZ(row * (columns + 1) + col, ...point(row, col / columns, t, phase, pace));
      }
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    if (!closed) return;
    const normals = geometry.getAttribute('normal');
    for (let row = 0; row < rows; row++) {
      const first = row * (columns + 1);
      const last = first + columns;
      seamNormal.fromBufferAttribute(normals, first).add(otherNormal.fromBufferAttribute(normals, last)).normalize();
      for (const i of [first, last]) normals.setXYZ(i, seamNormal.x, seamNormal.y, seamNormal.z);
    }
    normals.needsUpdate = true;
  }
  shape(0, 0);
  return shape;
}

export function dressTorso(torso) {
  const hood = [
    [-.275, 2.403, .003, .004], [-.226, 2.384, .103, .120],
    [-.154, 2.329, .152, .176], [-.060, 2.304, .173, .192],
    [.026, 2.298, .163, .179], [.099, 2.298, .137, .151],
    [.113, 2.297, .126, .146], [.086, 2.300, .112, .135],
    [.023, 2.309, .096, .120], [-.054, 2.319, .067, .088],
    [-.118, 2.319, .003, .004],
  ];
  fabric(torso, hood.length, 44, (row, u) => {
    const [z, y, width, height] = hood[row];
    const a = TAU * u;
    const brow = Math.cos(a);
    const fold = 1 + .025 * Math.cos(5 * a + row * .26) + .017 * Math.sin(9 * a);
    const overhang = T.MathUtils.smoothstep(row, 2, 5) * (1 - T.MathUtils.smoothstep(row, 7, 10));
    return [
      width * Math.sin(a) * fold * (.96 + .092 * brow),
      y + height * brow * fold,
      z + overhang * (.078 * brow - .018 * Math.sin(a)) + .004 * Math.cos(4 * a),
    ];
  }, { name: 'Hood and folded face opening', closed: true, liningFrom: 7 });

  const tunic = [
    [1.48, .337, .255, -.204], [1.57, .321, .259, -.190], [1.66, .282, .244, -.157],
    [1.76, .285, .224, -.146], [1.89, .281, .214, -.132],
    [2.00, .288, .214, -.103], [2.08, .268, .186, -.099], [2.14, .199, .154, -.105],
    [2.18, .143, .134, -.115], [2.22, .126, .106, -.117],
  ];
  fabric(torso, tunic.length, 42, (row, u, t) => {
    const [y, width, depth, z] = tunic[row];
    const a = TAU * u;
    const fold = 1 + (.11 * Math.sin(6 * a + 2.6 * t) + .046 * Math.cos(11 * a - 2.0 * t)) * (1 - .61 * t);
    return [width * fold * Math.sin(a), y + .018 * Math.cos(3 * a + 5 * t), z + depth * fold * Math.cos(a)];
  }, { name: 'Loose riding robe', closed: true });

  for (const side of [-1, 1]) {
    fabric(torso, 16, 24, (_row, u, t) => {
      const fall = Math.sin(Math.PI * u) ** .72;
      const fold = (Math.sin(5 * TAU * u + t * 2.2 + side * .5) * .024
        + Math.cos(3 * TAU * u - t * 3.2) * .021) * t;
      const edge = Math.sin(u * 27 + side) * .019 + Math.sin(u * 55) * .012;
      return [
        side * (.292 + .172 * Math.sqrt(t) + .058 * fall * t + fold),
        1.62 - t * (.38 + fall * .16) + edge * t ** 4,
        -.17 + (u - .47) * (.47 + .71 * t) + .081 * t * fall,
      ];
    }, { name: 'Split robe panel' });
  }
}

export function sewnSleeve(parent, shoulder, elbow, cuff) {
  const path = new T.CatmullRomCurve3([shoulder, elbow, cuff].map((point) => new T.Vector3(...point)));
  const stations = path.computeFrenetFrames(16, false);
  const points = path.getSpacedPoints(16);
  const offset = new T.Vector3();
  fabric(parent, points.length, 30, (row, u, t) => {
    const radius = .113 - .048 * t + .021 * Math.sin(Math.PI * t);
    const angle = TAU * u;
    const crush = Math.sin(t * 37 - 1.6 * Math.sin(angle)) * (.004 + .012 * Math.sin(Math.PI * t) ** 2);
    const wave = radius + crush + .009 * Math.cos(5 * angle + t * 3);
    offset.copy(points[row]).addScaledVector(stations.normals[row], Math.cos(angle) * wave)
      .addScaledVector(stations.binormals[row], Math.sin(angle) * wave);
    return [offset.x, offset.y, offset.z];
  }, { name: 'Gathered wool sleeve', closed: true });
}

export function drapeMantle(parent) {
  return fabric(parent, 20, 28, (_row, u, t, phase, pace) => {
    const across = 2 * u - 1;
    const edge = Math.abs(across);
    const ripple = Math.sin(4.2 * TAU * u + 2.4 * t) * .035 + Math.cos(2 * TAU * u - t) * .031;
    const lift = Math.sin(phase - 6 * t + across * 2.6) * (.014 + .09 * pace) * t ** 2;
    const hem = (.028 * Math.sin(31 * u) + .016 * Math.cos(52 * u)) * t ** 5;
    return [
      across * (.255 + .41 * t) + lift * .6,
      2.16 - .31 * Math.sin(t * Math.PI / 2) - (.28 + .34 * edge ** 1.2) * t ** 2 + ripple * t + lift + hem,
      -.277 - t * (1.01 - .34 * edge - .18 * pace) - ripple * (1 - .72 * t),
    ];
  }, { name: 'Weighted wool mantle', moving: true });
}
