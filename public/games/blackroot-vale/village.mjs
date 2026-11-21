import * as T from './vendor/three.module.js';
import { DOOR_HEIGHT, DOOR_WIDTH, FLOOR_LEVEL, WALL_THICKNESS } from './house-plan.mjs';
import { FENCES, groundHeight, HOUSES, LAMPS, seeded, WELL } from './layout.mjs';
import { furnishRoom, roomMaterials } from './rooms.mjs';
import { repeatSurface } from './surfaces.mjs';

const cube = new T.BoxGeometry();
const batch = new Map();
const tint = (color) => new T.MeshStandardMaterial({ color, roughness: .85 });
const wood = tint('#a78c76');
const smoothWood = tint('#b1a294');
const darkWood = tint('#7a6d64');
const trim = tint('#9d8b78');
const stone = ['#bcb5ae', '#c2b9a7', '#a09f98', '#b7af99'].map(tint);
const footings = tint('#afa597');
const plaster = ['#dfd0b4', '#c8bea9', '#b6b5a8'].map(tint);
const gold = tint('#9d7547');
const iron = tint('#333b36');
const glass = ['#ce8941', '#f1aa54', '#e79744'].map((color, index) => new T.MeshStandardMaterial({
  color, emissive: color, emissiveIntensity: .64 + index * .19, roughness: .38,
}));
const darkness = new T.MeshBasicMaterial({ color: '#171a17' });
const interiorGlass = new T.MeshStandardMaterial({ color: '#91a8ae', emissive: '#839daa', emissiveIntensity: .31, roughness: .61 });

function box(parent, material, x, y, z, w, h, d, rx = 0, ry = 0, rz = 0) {
  const piece = new T.Object3D();
  piece.position.set(x, y, z);
  piece.scale.set(w, h, d);
  piece.rotation.set(rx, ry, rz);
  parent.add(piece);
  if (!batch.has(material)) batch.set(material, []);
  batch.get(material).push(piece);
}

function makeBatches(scene) {
  scene.updateMatrixWorld(true);
  for (const [material, objects] of batch) {
    const meshes = new T.InstancedMesh(cube, material, objects.length);
    for (const [i, object] of objects.entries()) {
      meshes.setMatrixAt(i, object.matrixWorld);
      object.removeFromParent();
    }
    meshes.castShadow = !glass.includes(material) && material !== interiorGlass;
    meshes.receiveShadow = meshes.castShadow;
    scene.add(meshes);
  }
  batch.clear();
}

function canvasTexture(size, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  paint(canvas.getContext('2d'), size);
  const result = new T.CanvasTexture(canvas);
  result.colorSpace = T.SRGBColorSpace;
  return result;
}

function gable(parent, material, w, d, y, rise) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([
    -w / 2, y, d / 2, w / 2, y, d / 2, 0, y + rise, d / 2,
    w / 2, y, -d / 2, -w / 2, y, -d / 2, 0, y + rise, -d / 2,
  ], 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 2, 0, 1, .95, 0, 0, 2, 0, 1, .95], 2));
  geometry.computeVertexNormals();
  const attic = new T.Mesh(geometry, material);
  attic.castShadow = true;
  attic.receiveShadow = true;
  parent.add(attic);
}

function frontWindow(parent, x, y, z, width, height, lightIndex) {
  box(parent, darkWood, x, y, z, width + .18, height + .19, .15);
  box(parent, glass[lightIndex], x, y, z + .085, width, height, .038);
  box(parent, wood, x, y, z + .14, .072, height, .065);
  box(parent, wood, x, y + .08, z + .14, width, .069, .065);
  for (const [dx, dy, direction] of [[-.25, -.24, 1], [.25, -.24, -1], [-.25, .27, -1], [.25, .27, 1]]) {
    box(parent, iron, x + dx * width, y + dy * height, z + .116, width * .60, .024, .013, 0, 0, direction * .68);
  }
  box(parent, trim, x, y - height / 2 - .06, z + .13, width + .32, .10, .25);
  for (const side of [-1, 1]) {
    const shutter = x + side * (width / 2 + .21);
    box(parent, smoothWood, shutter, y, z + .025, .3, height + .06, .08, 0, side * .18);
    box(parent, darkWood, shutter, y + height * .26, z + .074, .31, .045, .09);
    box(parent, darkWood, shutter, y - height * .26, z + .074, .31, .045, .09);
  }
}

function wall(parent, x, z, yaw) {
  const side = new T.Group();
  side.position.set(x, 0, z);
  side.rotation.y = yaw;
  parent.add(side);
  return side;
}

function diagonal(parent, material, x1, y1, x2, y2, z, w = .15) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  box(parent, material, (x1 + x2) / 2, (y1 + y2) / 2, z, Math.hypot(dx, dy), w, .115, 0, 0, Math.atan2(dy, dx));
}

function timberWall(parent, width, height, lower, style, entry = false) {
  const crossbeam = (y, h) => {
    if (!entry || y - h / 2 >= FLOOR_LEVEL + DOOR_HEIGHT) {
      box(parent, wood, 0, y, .159, width + .12, h, .141);
      return;
    }
    const span = (width + .12 - DOOR_WIDTH) / 2;
    for (const side of [-1, 1]) box(parent, wood, side * (span + DOOR_WIDTH) / 2, y, .159, span, h, .141);
  };
  box(parent, trim, 0, height - .12, .08, width + .12, .20, .13);
  crossbeam(lower + .09, .17);
  const step = width / 4;
  for (let column = 0; column <= 4; column++) {
    if (entry && column === 2) continue;
    const x = step * (column - 2);
    box(parent, wood, x, (height + lower) / 2, .157, .19, height - lower, .15);
    if (column % 2 === 1) {
      const outward = Math.sign(x);
      diagonal(parent, wood, x + outward * .13, height - .16, x + outward * (step - .08), height * .51, .157);
    }
  }
  if (style === 2) crossbeam(height * .56, .16);
}

function masonryBands(side, width, low, high, material, openings) {
  const stops = [-width / 2, ...openings.flatMap((opening) => [opening.left, opening.right]), width / 2].sort((a, b) => a - b);
  for (let i = 1; i < stops.length; i++) {
    const left = stops[i - 1];
    const right = stops[i];
    const x = (left + right) / 2;
    const opening = openings.find((hole) => x > hole.left && x < hole.right);
    const strips = opening ? [[low, Math.min(high, opening.low)], [Math.max(low, opening.high), high]] : [[low, high]];
    for (const [bottom, top] of strips) {
      if (top > bottom) box(side, material, x, (top + bottom) / 2, 0, right - left, top - bottom, WALL_THICKNESS);
    }
  }
}

function buildWall(side, width, height, style, panes, entry = false) {
  const openings = panes.map(({ x, y, w, h }) => ({ left: x - w * .48, right: x + w * .48, low: y - h * .48, high: y + h * .48 }));
  if (entry) openings.push({ left: -DOOR_WIDTH / 2, right: DOOR_WIDTH / 2, low: -.86, high: FLOOR_LEVEL + DOOR_HEIGHT });
  masonryBands(side, width + .24, -.64, .80, footings, openings);
  masonryBands(side, width + .24, .80, height, plaster[style], openings);
  timberWall(side, width, height, .72, style, entry);
  for (const { x, y, w, h, light } of panes) {
    frontWindow(side, x, y, .153, w, h, light);
    box(side, interiorGlass, x, y, -.14, w, h, .036);
    for (const sign of [-1, 1]) {
      box(side, darkWood, x + sign * w * .53, y, -.18, .095, h + .12, .09);
      box(side, wood, x, y + sign * h * .53, -.185, w + .13, .095, .13);
    }
    box(side, wood, x, y, -.184, .038, h, .06);
    box(side, wood, x, y, -.184, w, .039, .06);
  }
}

function entryDoor(front) {
  const hinge = new T.Group();
  hinge.position.set(-DOOR_WIDTH / 2, FLOOR_LEVEL, .025);
  front.add(hinge);
  // Attach the moving pieces directly to the hinge; the walls and furniture are batched.
  function part(material, x, y, z, w, h, d) {
    const mesh = new T.Mesh(cube, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    hinge.add(mesh);
  }
  const panelW = DOOR_WIDTH - .060;
  part(darkWood, DOOR_WIDTH * .5, DOOR_HEIGHT * .5, 0, panelW, DOOR_HEIGHT - .036, .104);
  const plank = panelW / 7;
  for (let i = 0; i < 7; i++) {
    part(i % 2 ? smoothWood : wood, .032 + (i + .5) * plank, DOOR_HEIGHT * .5, 0, plank - .016, DOOR_HEIGHT - .08, .135);
  }
  for (const sign of [-1, 1]) {
    for (const y of [.58, 1.96]) part(darkWood, DOOR_WIDTH * .5, y, sign * .101, panelW, .17, .078);
    part(iron, panelW - .18, .96, sign * .086, .12, .23, .044);
    part(gold, panelW - .18, .97, sign * .123, .16, .065, .058);
  }
  for (const sign of [-1, 1]) {
    box(front, trim, sign * (DOOR_WIDTH / 2 + .04), FLOOR_LEVEL + DOOR_HEIGHT / 2, 0, .17, DOOR_HEIGHT + .02, .42);
  }
  box(front, trim, 0, FLOOR_LEVEL + DOOR_HEIGHT + .077, 0, DOOR_WIDTH + .28, .15, .43);
  box(front, stone[1], 0, FLOOR_LEVEL - .08, .235, DOOR_WIDTH + .12, .158, .88);
  box(front, stone[2], 0, FLOOR_LEVEL - .191, .597, DOOR_WIDTH + .16, .158, .48);
  return hinge;
}

function dormer(parent, direction, wallHeight, houseWidth, rise, roof) {
  const windowBay = new T.Group();
  const x = direction * houseWidth * .28;
  windowBay.position.set(x, wallHeight + rise * .44 - .14, -.80);
  windowBay.rotation.y = direction * Math.PI / 2;
  parent.add(windowBay);
  const w = 1.57;
  const h = 1.14;
  const d = 1.70;
  const crown = .77;
  const pitch = Math.atan(crown / (w / 2));
  box(windowBay, plaster[1], 0, h / 2, 0, w, h, d);
  gable(windowBay, plaster[1], w, d, h, crown);
  frontWindow(windowBay, 0, .68, d / 2, .63, .76, 0);
  for (const side of [-1, 1]) {
    box(windowBay, roof, side * w / 4, h + crown * .5, 0, 1.35, .10, d + .30, 0, 0, -side * pitch);
    diagonal(windowBay, trim, side * w * .52, h + .02, 0, h + crown + .045, d / 2 + .09, .11);
  }
}

function homestead(scene, house, roof, furnishings) {
  const { x, z, w, d, h, yaw, style } = house;
  const parent = new T.Group();
  scene.add(parent);
  parent.position.set(x, house.baseY, z);
  parent.rotation.y = yaw;
  const rise = w * [.365, .45, .391][style];
  const roofAngle = Math.atan(rise / (w / 2));
  const roofWidth = (w / 2 + .62) / Math.cos(roofAngle);
  gable(parent, plaster[style], w, d, h, rise);

  for (const sign of [-1, 1]) {
    const roofX = sign * (w / 4 + .19);
    const roofY = h + rise - Math.abs(roofX) * Math.tan(roofAngle);
    box(parent, roof, roofX, roofY, 0, roofWidth, .19, d + 1.32, 0, 0, -sign * roofAngle);
    for (const end of [-1, 1]) {
      box(parent, darkWood, roofX, roofY - .05, end * (d / 2 + .59), roofWidth + .10, .25, .17, 0, 0, -sign * roofAngle);
    }
    box(parent, darkWood, sign * (w / 2 + .49), h - .43, 0, .19, .25, d + 1.45);
    const side = wall(parent, sign * w / 2, 0, sign * Math.PI / 2);
    buildWall(side, d, h, style, [
      { x: -d * .23, y: h * .53, w: .74, h: .84, light: (style + 1) % 3 },
      { x: d * .23, y: h * .48, w: .72, h: .81, light: style },
    ]);
  }
  box(parent, trim, 0, h + rise + .085, 0, .24, .22, d + 1.48);
  if (style) dormer(parent, x < 0 ? 1 : -1, h, w, rise, roof);
  const front = wall(parent, 0, d / 2, 0);
  const back = wall(parent, 0, -d / 2, Math.PI);
  const panes = [
    { x: -w * .25, y: h * .55, w: style === 1 ? 1.04 : .87, h: 1, light: style },
    { x: w * .25, y: h * .53, w: .89, h: 1, light: (style + 1) % 3 },
  ];
  buildWall(front, w, h, style, panes, true);
  buildWall(back, w, h, style, panes);
  for (const end of [front, back]) {
    for (const side of [-1, 1]) {
      diagonal(end, wood, side * w * .29, h + .13, side * w * .085, h + rise * .67, .095, .13);
    }
    box(end, wood, 0, h + rise * .43, .09, .18, rise * .82, .14);
    diagonal(end, trim, -w * .31, h + .17, w * .31, h + .17, .1);
    frontWindow(end, 0, h + rise * .32, .105, .86, .90, style);
  }

  const chimneyX = w * .24;
  const chimneyZ = -d * .26;
  const chimneyTop = h + rise + .63 + .19 * style;
  box(parent, stone[style], chimneyX, chimneyTop - 1.2, chimneyZ, .83, 2.4, .91);
  box(parent, stone[2], chimneyX, chimneyTop, chimneyZ, 1.04, .16, 1.10);
  box(parent, darkness, chimneyX, chimneyTop + .105, chimneyZ, .61, .02, .66);
  const hinge = entryDoor(front);
  return { hinge, ...furnishRoom(parent, house, box, furnishings) };
}

function pavement(scene) {
  const random = seeded(138);
  const stoneTop = new T.DodecahedronGeometry(1, 0);
  const stones = new T.InstancedMesh(stoneTop, tint('#8e877a'), 180);
  const point = new T.Object3D();
  const color = new T.Color();
  for (let i = 0; i < stones.count; i++) {
    const z = 33 - random() * 58;
    const width = z > -11 && z < 5 ? 4.55 : 2.5;
    const x = (random() * 2 - 1) * width + .36 * Math.cos(z * .12);
    point.position.set(x, groundHeight(x, z) + .075, z);
    point.rotation.y = random() * Math.PI;
    point.scale.set(.064 + random() * .13, .025 + random() * .037, .065 + random() * .13);
    point.updateMatrix();
    stones.setMatrixAt(i, point.matrix);
    stones.setColorAt(i, color.setHSL(.088, .08, .56 + random() * .4));
  }
  stones.receiveShadow = true;
  scene.add(stones);
}

function villageWell(scene, roof) {
  const base = new T.Group();
  base.position.set(WELL.x, groundHeight(WELL.x, WELL.z), WELL.z);
  scene.add(base);
  for (let course = 0; course < 3; course++) {
    for (let i = 0; i < 12; i++) {
      const angle = (i + .5 * (course % 2)) / 12 * Math.PI * 2;
      box(base, stone[(i + 2 * course) % stone.length], 1.15 * Math.sin(angle), .15 + course * .24, 1.15 * Math.cos(angle), .61, .235, .40, 0, angle);
    }
  }
  const hole = new T.Mesh(new T.CircleGeometry(1.06, 18), darkness);
  hole.rotation.x = -Math.PI / 2;
  hole.position.y = .27;
  base.add(hole);
  for (const x of [-1.21, 1.21]) box(base, wood, x, 1.51, 0, .16, 2.86, .19);
  box(base, wood, 0, 2.73, 0, 2.65, .20, .19);
  box(base, darkWood, 0, 1.98, 0, 2.50, .13, .13);
  box(base, gold, .03, 1.29, 0, .037, 1.39, .041);
  for (const yaw of [-1, 1]) box(base, roof, 0, 2.79, yaw * .44, 2.9, .1, 1.04, yaw * .42);
}

function lamps(scene) {
  const texture = canvasTexture(96, (ctx, size) => {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, '#ffce6fa0');
    gradient.addColorStop(.27, '#ffad4b52');
    gradient.addColorStop(.68, '#f2852012');
    gradient.addColorStop(1, '#fc921200');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  });
  for (const [i, [x, z]] of LAMPS.entries()) {
    const y = groundHeight(x, z);
    const facing = x < 0 ? 1 : -1;
    const lampX = x + .48 * facing;
    box(scene, darkWood, x, y + 1.56, z, .16, 3.14, .16);
    box(scene, wood, x + .23 * facing, y + 2.92, z, .61, .135, .145);
    box(scene, iron, lampX, y + 2.70, z, .032, .36, .035);
    box(scene, iron, lampX, y + 2.55, z, .31, .10, .31);
    box(scene, glass[1], lampX, y + 2.34, z, .21, .34, .21);
    box(scene, iron, lampX, y + 2.15, z, .27, .078, .27);
    for (const dx of [-.112, .112]) for (const dz of [-.112, .112]) {
      box(scene, iron, lampX + dx, y + 2.34, z + dz, .022, .36, .022);
    }
    const glow = new T.Sprite(new T.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, fog: true, blending: T.AdditiveBlending }));
    glow.position.set(lampX, y + 2.34, z);
    glow.scale.set(1.45, 1.45, 1);
    scene.add(glow);
    if (i !== LAMPS.length - 1) {
      const light = new T.PointLight('#ffac62', 36, 14, 2);
      light.position.set(lampX, y + 2.08, z);
      scene.add(light);
    }
  }
}

function fence(scene, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const div = Math.round(Math.hypot(dx, dz) / 2.1);
  const length = Math.hypot(dx, dz) / div;
  const angle = -Math.atan2(dz, dx);
  for (let i = 0; i <= div; i++) {
    const x = ax + dx * i / div;
    const z = az + dz * i / div;
    const y = groundHeight(x, z);
    box(scene, trim, x, y + .55, z, .18, 1.21, .18, 0, angle, Math.sin(i * 3) * .05);
    if (i === div) continue;
    for (const height of [.39, .79]) {
      box(scene, smoothWood, x + dx / div / 2, y + height, z + dz / div / 2, length, .10, .11, 0, angle);
    }
  }
}

function surface(material, texture, bump) {
  material.map = texture;
  material.bumpMap = texture;
  material.bumpScale = bump;
  return material;
}

function weatheredPlaster(material, map) {
  surface(material, map, .032);
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWallPosition;')
      .replace('#include <begin_vertex>', `
        #include <begin_vertex>
        vec4 origin = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        origin = instanceMatrix * origin;
        #endif
        vWallPosition = (modelMatrix * origin).xyz;
      `);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWallPosition;')
      .replace('#include <color_fragment>', `
        #include <color_fragment>
        float streaks = sin(vWallPosition.x * 4.2 + vWallPosition.z * 6.5) * 0.27;
        float damp = smoothstep(0.47, 2.1 + streaks, vWallPosition.y);
        diffuseColor.rgb *= mix(vec3(0.43, 0.49, 0.42), vec3(1.0), damp);
      `);
  };
}

export function createVillage(scene, surfaces) {
  const woodGrain = repeatSurface(surfaces.timber, 1, 1.5);
  for (const beam of [wood, smoothWood, darkWood, trim]) surface(beam, woodGrain, .025);
  const blocks = repeatSurface(surfaces.masonry, .79, .78);
  for (const finish of stone) surface(finish, blocks, .034);
  surface(footings, repeatSurface(surfaces.masonry, 3.3, .67), .051);
  const wallMap = repeatSurface(surfaces.plaster, 2.4, 1);
  for (const walls of plaster) weatheredPlaster(walls, wallMap);
  const texture = repeatSurface(surfaces.slate, 2.25, 2.55);
  texture.center.set(.5, .5);
  texture.rotation = Math.PI / 2;
  const roof = surface(tint('#c5c9cd'), texture, .051);
  roof.roughness = .68;
  const furnishings = roomMaterials(surfaces);
  const rooms = new Map(HOUSES.map((house) => [house.id, homestead(scene, house, roof, furnishings)]));
  villageWell(scene, roof);
  pavement(scene);
  lamps(scene);
  for (const [[ax, az], [bx, bz]] of FENCES) fence(scene, ax, az, bx, bz);
  makeBatches(scene);
  return rooms;
}
