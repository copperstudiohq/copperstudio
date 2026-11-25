import * as THREE from './vendor/three.module.js';
import { PlantMesh } from './plant-mesh.js';
import { crabShellSurfaceAt } from './crab-shell.js';

// Authored flank positions. All grow on the solid shell and remain fixed
// in the shell's local metres; there is no runtime scatter or extra animation.
const PATCHES = [
  [.23, .60, .140, 0x267bb5, 0x75c6d9],
  [.38, 1.90, .150, 0x2d8955, 0x82b780],
  [.51, 3.50, .145, 0x6934a0, 0xa982cf],
  [.64, 5.00, .155, 0x267bb5, 0x75c6d9],
  [.77, 2.60, .135, 0x2d8955, 0x82b780],
  [.89, .10, .120, 0x6934a0, 0xa982cf],
];

/** Six small epibiont patches: physical holdfast roots, stiff stems and cupped
 * blue, green and purple fronds. One shared geometry uses ordinary white,
 * vertex-colour material; its origin matches createCrabCarriedShell exactly.
 * @param {{mobile?:boolean}} [quality] @returns {THREE.BufferGeometry}
 */
export function createCrabShellPlants({ mobile = false } = {}) {
  const mesh = new PlantMesh(), patches = [], color = new THREE.Color(), tip = new THREE.Color();
  const sides = mobile ? 3 : 5, leafSegments = mobile ? 3 : 6, leafColumns = mobile ? 2 : 3;
  const point = (u, angle, inset = 0) => crabShellSurfaceAt(u, angle, { mobile })
    .add(new THREE.Vector3(-Math.sin(angle) * inset, 0, -Math.cos(angle) * inset));
  for (const [u, angle, length, pigment, endPigment] of PATCHES) {
    const surface = point(u, angle), root = point(u, angle, .0025);
    const across = point(u, angle + .001).sub(point(u, angle - .001));
    const along = point(u + .001, angle).sub(point(u - .001, angle));
    const normal = across.cross(along).normalize(), tangent = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
    patches.push({ u, angle, root: root.toArray(), surface: surface.toArray(), normal: normal.toArray() });
    // These short root toes track the exact spiral and enter its outer skin.
    for (const sign of [-1, 0, 1]) {
      mesh.tube([root, point(u + .004, angle + sign * .035, .0015),
        point(u + .008, angle + sign * .07, .001)], [.003, .002, .0008], 0x285d54, mobile ? 3 : 4);
    }
    const crown = root.clone().addScaledVector(normal, .023).add(new THREE.Vector3(0, .025, 0));
    mesh.tube([root, root.clone().lerp(crown, .3), root.clone().lerp(crown, .7), crown],
      [.0033, .0028, .0022, .0015], pigment, sides);
    for (let frond = -1; frond <= 1; frond++) {
      const start = crown.clone().addScaledVector(tangent, frond * .005);
      const end = start.clone().addScaledVector(normal, length * .45)
        .addScaledVector(tangent, frond * length * .42).add(new THREE.Vector3(0, length * .63, 0));
      if (frond) mesh.tube([crown, crown.clone().lerp(start, .5), start], [.0016, .0013, .0008], pigment, mobile ? 3 : 4);
      tip.setHex(endPigment);
      mesh.leaf(start, end, .026, fraction => color.setHex(pigment).lerp(tip, fraction * .8).getHex(),
        { segments: leafSegments, columns: leafColumns, curve: .014, cup: .38, twist: .35 });
    }
  }
  const geometry = mesh.geometry({ normalizeHeight: false });
  geometry.name = 'carried-shell-marine-plants';
  geometry.userData = { shellPlants: true, attachedTo: 'carried-spiral-shell', patches };
  return geometry;
}
