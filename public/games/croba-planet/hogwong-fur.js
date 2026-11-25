import * as THREE from './vendor/three.module.js';

/** Fixed, combed guard-hair clumps. Three narrow, bent strands replace broad
 * crossed cards without increasing triangle count or adding draw batches.
 * The supplied surface also excludes the eyes, paws and dorsal spine sockets.
 * @param {import('./plant-mesh.js').PlantMesh} mesh
 * @param {number} count
 * @param {(u:number,t:number,root:THREE.Vector3,normal:THREE.Vector3,flow:THREE.Vector3)=>boolean|void} surface
 * @param {(u:number,t:number)=>number} colorAt
 * @param {{length?:number,width?:number}} [options]
 */
export function addHogwongFur(mesh, count, surface, colorAt, { length = .085, width = .013 } = {}) {
  const vertexStart = mesh.positions.length / 3, root = new THREE.Vector3(), normal = new THREE.Vector3();
  const flow = new THREE.Vector3(), axis = new THREE.Vector3(), side = new THREE.Vector3();
  const point = new THREE.Vector3(), pigment = new THREE.Color(), color = new THREE.Color();
  let tufts = 0;
  for (let index = 0; index < count; index++) {
    const u = (index + .5) / count, t = index * .618033988749895 % 1;
    if (surface(u, t, root, normal, flow) === false) continue;
    normal.normalize(); flow.addScaledVector(normal, -flow.dot(normal));
    if (flow.lengthSq() < 1e-8) flow.set(0, 0, -1).addScaledVector(normal, normal.z);
    flow.normalize(); side.crossVectors(normal, flow).normalize();
    const hairLength = length * (.72 + .42 * (.5 + .5 * Math.sin(index * 2.17)));
    const hairWidth = width * (.7 + .45 * (.5 + .5 * Math.sin(index * 1.31)));
    pigment.set(colorAt(u, t)).multiplyScalar(.86 + .06 * Math.sin(index * 3.7) ** 2);
    tufts++;
    for (let strand = 0; strand < 3; strand++) {
      const start = mesh.positions.length / 3;
      const separation = (strand - 1) * hairWidth * .65;
      const strandLength = hairLength * (.83 + .13 * Math.sin(index * 1.7 + strand) ** 2);
      const strandWidth = hairWidth * (.18 + .05 * Math.sin(index + strand * 2.1) ** 2);
      axis.copy(flow).addScaledVector(side, (strand - 1) * .16).normalize();
      for (let vertex = 0; vertex < 4; vertex++) {
        const along = vertex === 0 ? 0 : vertex === 3 ? 1 : .42;
        const spread = vertex === 1 ? -strandWidth : vertex === 2 ? strandWidth : 0;
        // Most length follows the hide; the middle rises slightly and the tip
        // bends back toward the coat instead of standing like a white quill.
        point.copy(root).addScaledVector(normal, .0015 + Math.sin(along * Math.PI) * strandLength * .35
          + along * along * strandLength * .08)
          .addScaledVector(axis, strandLength * along).addScaledVector(side, separation + spread);
        color.copy(pigment).multiplyScalar(.96 + .03 * along);
        mesh.positions.push(point.x, point.y, point.z); mesh.colors.push(color.r, color.g, color.b);
        mesh.uvs.push(vertex === 1 ? 0 : vertex === 2 ? 1 : .5, along); mesh.glow.push(0);
      }
      mesh.indices.push(start, start + 2, start + 1, start + 1, start + 2, start + 3);
    }
  }
  return { tufts, vertexStart, vertexCount: mesh.positions.length / 3 - vertexStart,
    strands: tufts * 3, triangles: tufts * 6, maximumLength: length * 1.14 };
}

/** Static fibre shading fills the spaces between geometric guard hairs. Only
 * explicitly marked soft coat receives it; keratin and bare paws retain hide.
 * Existing maps and later water-medium shader hooks remain shared/composable.
 */
export function applyHogwongFur(material) {
  const previous = material.onBeforeCompile.bind(material), key = material.customProgramCacheKey.bind(material);
  material.side = THREE.DoubleSide; material.forceSinglePass = true;
  material.onBeforeCompile = shader => {
    previous(shader);
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nattribute float hogwongFurMask; attribute vec3 hogwongCoatColor; varying float vHogwongFur; varying vec3 vHogwongCoat;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHogwongFur=hogwongFurMask;vHogwongCoat=hogwongCoatColor;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
      '#include <common>\nvarying float vHogwongFur; varying vec3 vHogwongCoat;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float furMask=clamp(vHogwongFur,0.,1.);
        float hideShade=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
        vec3 winterCoat=vHogwongCoat*(.94+.06*clamp(hideShade,0.,1.));
        diffuseColor.rgb=mix(diffuseColor.rgb,winterCoat,furMask);`)
      .replace('#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,max(.82,roughnessFactor),furMask);');
  };
  material.customProgramCacheKey = () => key() + '|hogwong-white-winter-fur-v5';
  return material;
}
