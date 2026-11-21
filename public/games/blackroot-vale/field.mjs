import * as T from './vendor/three.module.js';
import { DISTANT_TOWER, FIELD_LINE, groundHeight, seeded, trailDistance } from './layout.mjs';

function ridgeHeight(x, profile) {
  return profile.base + Math.sin(x * .008 + profile.phase) * profile.roll
    + Math.sin(x * .017 - profile.phase) * profile.roll * .32
    + Math.sin(x * .043 + profile.phase) * profile.roll * .10;
}

function ridge(scene, profile) {
  const vertices = [];
  const colors = [];
  const indices = [];
  const haze = new T.Color('#394c53');
  const earth = new T.Color(profile.color);
  const surface = new T.Color();
  for (let i = 0; i <= 192; i++) {
    const x = -1536 + i * 16;
    vertices.push(x, -35, profile.z, x, ridgeHeight(x, profile), profile.z);
    haze.toArray(colors, colors.length);
    surface.copy(earth).multiplyScalar(.93 + .08 * Math.sin(i * .65) + .05 * Math.cos(i * .21));
    surface.toArray(colors, colors.length);
    if (i) {
      const j = i * 2;
      indices.push(j - 2, j - 1, j, j - 1, j + 1, j);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  const material = new T.MeshBasicMaterial({
    vertexColors: true, fog: false, toneMapped: false, side: T.DoubleSide,
  });
  scene.add(new T.Mesh(geometry, material));
}

function shatteredWall(parent, face, inside, height) {
  const edge = [1, .97, .98, .90, .86, .97, .94, .91, .88, .92, .79, .61, .56, .64, .79, .95];
  const segments = edge.length;
  const bones = [];
  for (const [i, crown] of edge.entries()) {
    const angle = i * Math.PI * 2 / segments + .13;
    const radius = 18.5 - (crown - .44) * 8.9;
    const spike = i % 3 === 0 ? 3.2 : 0;
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    bones.push({
      foot: [x * 18.6, .439 * height, z * 18.6],
      top: [x * radius, crown * height + spike, z * radius],
      innerFoot: [x * 15.7, .438 * height, z * 15.7],
      innerTop: [x * (radius - 2.65), crown * height + spike - 1.2, z * (radius - 2.65)],
    });
  }
  const stones = [];
  const hollows = [];
  const quad = (buffer, a, b, c, d) => buffer.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (let i = 0; i < segments; i++) {
    const a = bones[i];
    const b = bones[(i + 1) % segments];
    const high = Math.max(a.top[1], b.top[1]);
    const low = Math.min(a.top[1], b.top[1]);
    const slope = Math.abs(high - low) > height * .1;
    const chip = [
      (a.top[0] + b.top[0]) / 2,
      (a.top[1] + b.top[1]) / 2 - (slope ? 1.6 : 3.2 + i % 4 * 1.22),
      (a.top[2] + b.top[2]) / 2,
    ];
    stones.push(...a.foot, ...a.top, ...chip, ...a.foot, ...chip, ...b.foot, ...b.foot, ...chip, ...b.top);
    quad(hollows, a.innerFoot, b.innerFoot, b.innerTop, a.innerTop);
    quad(hollows, a.top, a.innerTop, b.innerTop, b.top);
  }
  for (const [positions, material] of [[stones, face], [hollows, inside]]) {
    const geom = new T.BufferGeometry();
    geom.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    parent.add(new T.Mesh(geom, material));
  }
}

function tower(scene, base) {
  const { x, z, height } = DISTANT_TOWER;
  const makeStone = (color) => {
    const material = new T.MeshBasicMaterial({ color, fog: false, toneMapped: false, side: T.DoubleSide });
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vTowerHeight;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTowerHeight = (modelMatrix * vec4(transformed, 1.0)).y;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vTowerHeight;')
        .replace('#include <color_fragment>', `
          #include <color_fragment>
          float distantMist = (1.0 - smoothstep(15.0, 77.0, vTowerHeight)) * 0.73;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.073, 0.071, 0.067), distantMist);
        `);
    };
    return material;
  };
  const strong = makeStone('#302d2d');
  const shaded = makeStone('#232425');
  const ridgeStone = makeStone('#393638');
  const recess = makeStone('#191a1b');
  const ember = makeStone('#a25848');
  const silhouette = new T.Group();
  silhouette.position.set(x, base - 3.5, z);
  silhouette.rotation.y = -.04;
  silhouette.scale.set(1.58, 1, 1.58);
  scene.add(silhouette);

  function ring(material, top, bottom, h, y) {
    const ring = new T.Mesh(new T.CylinderGeometry(top, bottom, h, 8), material);
    ring.position.y = y;
    silhouette.add(ring);
  }

  function pinnacle(material, radius, size, y, angle, h, broken = false) {
    const buttress = new T.Group();
    buttress.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    buttress.rotation.y = .8 - angle;
    const masonry = new T.Mesh(new T.CylinderGeometry(size * .96, size * 1.32, h * .72, 5), material);
    masonry.position.y = h * .36;
    const cap = new T.Mesh(new T.CylinderGeometry(broken ? size * .46 : .17, size * 1.17, h * .32, 5), shaded);
    cap.position.set(broken ? size * .20 : 0, h * .83, 0);
    if (broken) cap.rotation.z = -.31;
    buttress.add(masonry, cap);
    silhouette.add(buttress);
  }

  ring(shaded, 24.5, 30.5, 19, 5.2);
  ring(strong, 18.9, 23.7, height * .41, height * .25);
  ring(ridgeStone, 20.3, 20.2, 2.45, height * .443);
  shatteredWall(silhouette, strong, recess, height);

  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4 + .12;
    pinnacle(i % 2 ? strong : shaded, i % 2 ? 17.8 : 21.9, i % 2 ? 3.15 : 5.2, 4.1, angle,
      height * ([.62, .53, .66, .47, .61, .25, .38, .57][i]), i !== 1 && i !== 4);
  }
  pinnacle(ridgeStone, 12.1, 4.25, height * .91, .19, height * .21, true);
  pinnacle(shaded, 12.4, 4.90, height * .85, Math.PI + .19, height * .26, false);
  pinnacle(shaded, 12.75, 3.38, height * .83, 1.79, height * .13, true);
  const rubble = new T.IcosahedronGeometry(1, 0);
  const random = seeded(3575);
  for (let i = 0; i < 31; i++) {
    const angle = random() * Math.PI * 2;
    const distance = 23 + random() * 30;
    const debris = new T.Mesh(rubble, i % 3 ? strong : shaded);
    debris.position.set(Math.cos(angle) * distance, random() * 3 + .7, Math.sin(angle) * distance);
    const mass = 2.1 + random() ** 2 * 9.1;
    debris.scale.set(mass * (1.1 + random()), mass * .68, mass);
    debris.rotation.set(random(), random(), random());
    silhouette.add(debris);
  }
  const arch = new T.Shape();
  arch.moveTo(-.5, 0);
  arch.lineTo(.5, 0);
  arch.lineTo(.5, .66);
  arch.quadraticCurveTo(.43, .88, 0, 1);
  arch.quadraticCurveTo(-.43, .88, -.5, .66);
  arch.closePath();
  const opening = new T.ShapeGeometry(arch);

  function window(angle, y, radial, w, h, lit) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const frame = new T.Mesh(opening, recess);
    frame.scale.set(w, h, 1);
    frame.position.set(s * radial, y, c * radial);
    frame.rotation.y = angle;
    silhouette.add(frame);
    if (!lit) return;
    const light = new T.Mesh(opening, ember);
    light.scale.set(w * .40, h * .73, 1);
    light.position.set(s * (radial + .18), y + h * .07, c * (radial + .18));
    light.rotation.y = angle;
    silhouette.add(light);
  }

  for (const [i, angle] of [Math.PI - .72, Math.PI - .11, Math.PI + .65].entries()) {
    window(angle, height * .48, 18.3, 2.9, 13.0, i !== 2);
    if (i !== 1) window(angle, height * .64, 16.9, 2.15, 10.4, false);
  }
}

function blades() {
  const random = seeded(8662);
  const points = [];
  const colors = [];
  const lower = new T.Color('#63432e');
  const upper = new T.Color('#b99264');
  for (let i = 0; i < 11; i++) {
    const angle = random() * Math.PI * 2;
    const length = .14 + random() ** 1.45 * .52;
    const bend = .095 + random() * .18;
    const width = .016 + random() * .027;
    const sx = (random() - .5) * .31;
    const sz = (random() - .5) * .31;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const tx = sx + dx * bend;
    const tz = sz + dz * bend;
    points.push(
      sx - dz * width, 0, sz + dx * width,
      sx + dz * width, 0, sz - dx * width,
      tx, length, tz,
    );
    const tip = lower.clone().lerp(upper, .34 + random() * .53);
    for (const color of [lower, lower, tip]) color.toArray(colors, colors.length);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function deadScrub(scene) {
  const geometry = blades();
  const material = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide });
  const random = seeded(2481);
  const transform = new T.Object3D();
  const color = new T.Color();
  for (let startZ = FIELD_LINE; startZ <= 230; startZ += 20) {
    for (let startX = -110; startX < 110; startX += 22) {
      const nearOverlook = Math.abs(startX + 11) <= 33 && startZ >= FIELD_LINE + 20 && startZ < 133;
      const capacity = nearOverlook ? 437 : 132;
      const foliage = new T.InstancedMesh(geometry, material, capacity);
      foliage.count = 0;
      for (let i = 0; i < capacity; i++) {
        const x = startX + random() * 22;
        const z = startZ + random() * 20;
        if (Math.hypot(x, z) > 274 || trailDistance(x, z) < 2.36) continue;
        const patch = .50 + .28 * Math.sin(x * .25 + z * .39) + .17 * Math.cos(x * .39 - z * .31);
        if (random() > patch) continue;
        const s = .64 + random() * .61;
        const dense = .72 + .30 * Math.sin(x * .29 + z * .43);
        transform.position.set(x, groundHeight(x, z) - .018, z);
        transform.rotation.y = random() * Math.PI * 2;
        transform.scale.set(s, s * dense * (.74 + random() * .70), s);
        transform.updateMatrix();
        const j = foliage.count++;
        foliage.setMatrixAt(j, transform.matrix);
        foliage.setColorAt(j, color.setHSL(.057 + random() * .071, .24 + random() * .13, .62 + random() * .21));
      }
      if (foliage.count) scene.add(foliage);
    }
  }
}

function deadwood(scene, far) {
  const branch = new T.CylinderGeometry(.13, .57, 1, 6);
  const timber = new T.MeshStandardMaterial({ color: '#4c3426', roughness: 1 });
  const remote = new T.MeshBasicMaterial({ color: '#3b3533', fog: false, toneMapped: false });
  const random = seeded(2045);
  const roots = [];
  const axis = new T.Vector3();
  const up = new T.Vector3(0, 1, 0);

  function limb(a, b, width, material) {
    const wood = new T.Mesh(branch, material);
    axis.subVectors(b, a);
    wood.position.copy(a).lerp(b, .5);
    wood.scale.set(width, axis.length(), width);
    wood.quaternion.setFromUnitVectors(up, axis.normalize());
    scene.add(wood);
  }

  function snag(x, z, y, height, material) {
    const start = new T.Vector3(x, y - .16, z);
    const elbow = new T.Vector3(x + (random() - .5) * height * .20, y + height * .58, z + height * .06);
    const tip = new T.Vector3(elbow.x - height * .14, y + height, elbow.z - height * .12);
    limb(start, elbow, height * .105, material);
    limb(elbow, tip, height * .079, material);
    for (const sign of [-1, 1]) {
      const join = start.clone().lerp(elbow, .83 + .16 * sign);
      const knuckle = join.clone().add(new T.Vector3(height * .22 * sign, height * .12, -.10 * height));
      const end = knuckle.clone().add(new T.Vector3(height * .16 * sign, height * (.08 + random() * .15), .026 * height));
      limb(join, knuckle, height * .046, material);
      limb(knuckle, end, height * .023, material);
      const split = knuckle.clone().add(new T.Vector3(height * .040 * sign, height * .15, -.055 * height));
      limb(knuckle, split, height * .019, material);
    }
  }

  for (const [x, z, height] of [[16.2, 108, 5.8], [-15.2, 124, 4.25], [9, 144, 3.6], [-23, 151, 5.4], [34.5, 160, 4.3], [-8, 191, 4.1]]) {
    snag(x, z, groundHeight(x, z), height, timber);
    roots.push({ x, z, radius: height * .06 });
  }
  for (const [x, height] of [[-266, 14], [-229, 11], [-192, 16], [-58, 15], [7, 12], [64, 17]]) {
    snag(x, far.z - 13, ridgeHeight(x, far) - 4, height, remote);
  }
  return roots;
}

export function createSouthField(scene) {
  const far = { z: DISTANT_TOWER.z + 9, base: 17, roll: 8, phase: .81, color: '#57504d' };
  ridge(scene, { z: 959, base: 26, roll: 13.4, phase: 3.3, color: '#625b57' });
  ridge(scene, far);
  ridge(scene, { z: 492, base: 8, roll: 5.1, phase: 1.7, color: '#4e413b' });
  tower(scene, ridgeHeight(DISTANT_TOWER.x, far));
  deadScrub(scene);
  return deadwood(scene, far);
}
