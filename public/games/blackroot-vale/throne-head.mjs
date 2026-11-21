import * as T from './vendor/three.module.js';

const pixelsToUnits = .0061;
const portraitCenter = [240, 128];
const segments = 56;
const cheekMetal = new T.MeshStandardMaterial({ color: '#331a2d', roughness: .82, metalness: .21 });
const faceMetal = new T.MeshStandardMaterial({ color: '#5a253c', roughness: .8, metalness: .24 });
const cyan = new T.MeshBasicMaterial({ color: '#36dff3', toneMapped: false });
const pupil = new T.MeshBasicMaterial({ color: '#171b32' });
const ember = new T.MeshBasicMaterial({ color: '#ff655e', toneMapped: false });
const sphere = new T.SphereGeometry(1, 16, 10);

// Sections are sampled from the dungeon painting. Each gives the pixel row,
// left and right edges, then the center and radius of the section in depth.
const face = [
  [74, 234, 236, -.12, .016],
  [85, 232, 240, -.111, .073],
  [94, 223, 251, -.097, .167],
  [102, 202, 276, -.107, .203],
  [113, 196, 282, -.116, .231],
  [127, 198, 280, -.105, .232],
  [141, 200, 277, -.105, .226],
  [155, 202, 273, -.110, .214],
  [169, 206, 268, -.117, .192],
  [181, 212, 260, -.124, .171],
  [190, 222, 252, -.128, .135],
  [196, 234, 243, -.132, .076],
  [198, 239, 241, -.139, .028],
];

// Trace the portrait's narrow tips, angular side plates, and hooked inner stems.
// Each horn shares a depth axis. Its rows provide the two painted edges and the depth radius.
const horns = [
  ['Outer horn left', -.020, [
    [65, 157.5, 159.5, .006], [73, 158.5, 163, .011], [84, 161, 169.5, .022],
    [95, 164.5, 178.5, .034], [100, 166, 185, .045], [105, 168, 198, .057],
    [110, 169, 205, .076], [115, 171, 207, .083], [122, 174, 206, .079],
    [129, 179, 205, .069], [133, 184, 205, .053], [136, 196, 204, .031],
  ]],
  ['Outer horn right', -.020, [
    [62, 303.5, 305.5, .006], [72, 298.5, 305.5, .012], [84, 292.5, 304, .022],
    [95, 283, 302, .034], [100, 277, 301, .044], [105, 270, 300, .056],
    [110, 265, 299, .075], [115, 264, 298, .083], [121, 267, 293, .078],
    [128, 267, 284, .065], [132, 267, 281, .051], [136, 269, 275, .031],
  ]],
  ['Middle horn left', -.048, [
    [40, 220, 222.5, .006], [45, 220, 223.5, .009], [51, 219.5, 223.5, .015],
    [56, 217.5, 223, .020], [63, 214, 220.5, .025], [74, 208, 218, .036],
    [83, 205, 216, .046], [91, 207, 220, .053], [99, 215, 228, .052], [107, 220, 229, .042],
  ]],
  ['Middle horn right', -.048, [
    [40, 249, 251.5, .006], [45, 248, 252, .009], [51, 248.5, 253, .015],
    [56, 249.5, 256, .020], [63, 252, 259, .025], [74, 255, 263, .036],
    [83, 257, 266, .046], [91, 252, 266, .053], [99, 246, 261, .052], [107, 244, 252, .042],
  ]],
];

function sculptedSurface(name, sections, materials, image, ridge = 0) {
  const positions = [];
  const uv = [];
  const front = [];
  const back = [];
  for (const [row, [y, left, right, centerZ, radius]] of sections.entries()) {
    const middle = (left + right) / 2;
    const width = (right - left) / 2;
    const ridgeHeight = ridge * T.MathUtils.smoothstep(y, 82, 125) * (1 - T.MathUtils.smoothstep(y, 164, 196));
    for (let i = 0; i < segments; i++) {
      const angle = i * 2 * Math.PI / segments - Math.PI / 2;
      const across = Math.sin(angle);
      const x = middle + across * width;
      const forward = Math.cos(angle);
      const z = centerZ + radius * forward + ridgeHeight * Math.max(0, forward) ** 28;
      positions.push((x - portraitCenter[0]) * pixelsToUnits, (portraitCenter[1] - y) * pixelsToUnits, z);
      if (image) uv.push(x / image.width, 1 - y / image.height);
      if (!row) continue;
      const upper = (row - 1) * segments + i;
      const next = (row - 1) * segments + (i + 1) % segments;
      const indices = i < segments / 2 ? front : back;
      indices.push(upper, upper + segments, next, next, upper + segments, next + segments);
    }
  }
  const last = (sections.length - 1) * segments;
  for (let i = 1; i < segments - 1; i++) {
    back.push(0, i, i + 1, last, last + i + 1, last + i);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  if (image) geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(front.concat(back));
  geometry.addGroup(0, front.length, 0);
  geometry.addGroup(front.length, back.length, 1);
  geometry.computeVertexNormals();
  const mesh = new T.Mesh(geometry, materials);
  mesh.name = name;
  return mesh;
}

function fallbackFeatures(parent) {
  function feature(name, material, x, y, z, width, height, depth) {
    const mesh = new T.Mesh(sphere, material);
    mesh.name = name;
    mesh.position.set((x - portraitCenter[0]) * pixelsToUnits, (portraitCenter[1] - y) * pixelsToUnits, z);
    mesh.scale.set(width, height, depth);
    parent.add(mesh);
  }
  for (const [i, [x, y]] of [[218.5, 127], [261.5, 128], [220, 150], [261, 150]].entries()) {
    const z = i < 2 ? .102 : .090;
    feature('Cyan eye ' + (i + 1), cyan, x, y, z, .031, .039, .016);
    feature('Eye slit', pupil, x, y, z + .014, .009, .031, .005);
  }
  feature('Glowing central fissure', ember, 241, 141, .131, .010, .241, .019);
}

export function addThroneHead(parent, painting) {
  const head = new T.Group();
  head.name = 'Four-eyed horned head';
  const image = painting?.image;
  const paintedMetal = image?.width === 600 && image.height === 900 ? new T.MeshStandardMaterial({
    color: '#85747d', map: painting, emissive: '#d8bcc5', emissiveMap: painting, emissiveIntensity: .78,
    roughness: .81, metalness: .13,
  }) : null;
  const materials = [paintedMetal ?? faceMetal, cheekMetal];
  head.add(sculptedSurface('Rounded skull shell', face, materials, paintedMetal && image, .025));
  for (const [name, depth, rows] of horns) {
    const sections = rows.map(([y, left, right, radius]) => [y, left, right, depth, radius]);
    head.add(sculptedSurface(name, sections, materials, paintedMetal && image));
  }
  if (!paintedMetal) fallbackFeatures(head);
  parent.add(head);
  return head;
}
