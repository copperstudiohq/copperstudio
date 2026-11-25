import { BODY_DEFAULTS, creatureMaturity, creatureSize, extraLimbCount, limbCount, seededRandom } from './model.mjs';
import { animalPose, footfall, paddle } from './locomotion.mjs';
import { rgb } from './colors.mjs';

const TAU = Math.PI * 2;
const PITCH_SIN = .71;
const PITCH_COS = Math.sqrt(1 - PITCH_SIN ** 2);
const EYES = [235, 245, 216];
const PUPIL = [10, 20, 25];
const HORN = [232, 208, 157];
const RAINWATER = [85, 191, 235];
const TONGUE = [238, 137, 151];

const stretch = ([x, y, z], factor) => [x * factor, y * factor, z * factor];
const cross = ([ax, ay, az], [bx, by, bz]) => [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
const unit = (direction) => stretch(direction, 1 / Math.hypot(...direction));
const colorAt = (color, light) => 'rgb(' + color.map((channel) => Math.round(light < 1 ? channel * light :
  channel + (255 - channel) * (light - 1))).join(',') + ')';

function cameraAt(angle) {
  // Keep the direction across the ground aligned with the animal's path after tilting the camera.
  const yaw = Math.atan2(Math.sin(angle) / PITCH_SIN, Math.cos(angle));
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  return ([x, y, z]) => {
    const forward = x * sin + y * cos;
    return [x * cos - y * sin, forward * PITCH_SIN - z * PITCH_COS, forward * PITCH_COS + z * PITCH_SIN];
  };
}

export function projectVolume(center, axes, project) {
  let xx = 0;
  let xy = 0;
  let yy = 0;
  for (const axis of axes) {
    const [x, y] = project(axis);
    xx += x * x;
    xy += x * y;
    yy += y * y;
  }
  const middle = (xx + yy) / 2;
  const spread = Math.hypot((xx - yy) / 2, xy);
  const [x, y, depth] = project(center);
  return { x, y, depth, rx: Math.sqrt(middle + spread), ry: Math.sqrt(Math.max(0, middle - spread)),
    angle: Math.atan2(2 * xy, xx - yy) / 2 };
}

function litVolume(ctx, part) {
  const { x, y, rx, ry, angle, color, tone } = part;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(rx, ry);
  // Keep the highlights in the same light as the world when the animal turns.
  const light = -2.15 - angle;
  const hx = Math.cos(light) * .41;
  const hy = Math.sin(light) * .41;
  const gradient = ctx.createRadialGradient(hx, hy, 0, 0, 0, 1.06);
  gradient.addColorStop(0, colorAt(color, Math.min(1.73, tone + .51)));
  gradient.addColorStop(.35, colorAt(color, tone + .17));
  gradient.addColorStop(.69, colorAt(color, tone * .86));
  gradient.addColorStop(.95, colorAt(color, tone * .55));
  gradient.addColorStop(1, colorAt(color, tone * .64));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function markings(ctx, pattern, project, body, basis, color, size) {
  const { length, width, height, belly, sway } = basis;
  const at = (t, turn) => {
    const radius = Math.sqrt(1 - t * t);
    return project([t * length, sway + Math.sin(turn) * width * radius, belly + Math.cos(turn) * height * radius]);
  };
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(body.x, body.y, body.rx * .991, body.ry * .991, body.angle, 0, TAU);
  ctx.clip();
  if (pattern === 'bands') {
    ctx.strokeStyle = colorAt(color, .63);
    ctx.lineWidth = size * .095;
    ctx.lineCap = 'round';
    for (const t of [-.65, -.27, .12, .52]) {
      ctx.beginPath();
      for (let step = 0; step <= 8; step++) {
        const [x, y] = at(t + .02 * step, (step - 4) * .27);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else {
    const mottled = pattern === 'mottled';
    for (let i = 0; i < (mottled ? 12 : 7); i++) {
      const [x, y] = at(Math.sin(i * 1.74) * .76, Math.cos(i * 2.59) * 1.05);
      const radius = size * (.053 + i % 3 * .020);
      ctx.fillStyle = colorAt(color, mottled && i % 3 === 0 ? 1.25 : .66 + i % 3 * .06);
      ctx.beginPath();
      ctx.ellipse(x, y, radius * (mottled ? 1.72 : 1), radius * .70, body.angle, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawAnimalModel(ctx, cell, x, y, angle, scale, fraction, land, maxRadius = Infinity) {
  const { anatomy, genome } = cell;
  const { width: girth = BODY_DEFAULTS.width, head = BODY_DEFAULTS.head, neck = BODY_DEFAULTS.neck,
    snout = BODY_DEFAULTS.snout, legLength = BODY_DEFAULTS.legLength, horns = 0, frill = 0, ridge = 0 } = anatomy;
  const size = Math.min(maxRadius, (10.5 + anatomy.tissue * 6) * creatureSize(cell) * scale);
  const color = rgb(genome.color);
  const aquatic = !land || cell.submerged || (cell.climb && cell.climb.progress < .25);
  const pairs = limbCount(anatomy) / 2;
  const biped = Boolean(cell.largeLineage) && pairs === 1;
  const gait = biped ? 2 : pairs;
  const pose = animalPose(cell, gait, aquatic, fraction);
  const project = cameraAt(angle);
  const length = size * (.68 + anatomy.length * .64);
  const width = size * (.31 + girth * .37 + anatomy.armor * .16 - anatomy.length * .07);
  const height = size * (.27 + anatomy.tissue * .18 + girth * .17);
  const belly = size * (aquatic ? .60 : .59 + legLength * .51 + (biped ? .19 : 0)) + size * pose.lift;
  const sway = width * pose.sway;
  const parts = [];

  function add(center, axes, pigment, tone) {
    const part = { ...projectVolume(center, axes, project), color: pigment, tone };
    parts.push(part);
    return part;
  }
  function ellipsoid(center, [a, b, c], tone = 1, pigment = color) {
    return add(center, [[a, 0, 0], [0, b, 0], [0, 0, c]], pigment, tone);
  }
  function segment(from, to, girth, thickness = girth, tone = .86) {
    const direction = to.map((value, index) => value - from[index]);
    const axis = unit(direction);
    const normal = unit(cross(axis, Math.abs(axis[2]) < .95 ? [0, 0, 1] : [0, 1, 0]));
    const center = from.map((value, index) => (value + to[index]) / 2);
    add(center, [stretch(axis, Math.hypot(...direction) / 2 + girth * .55),
      stretch(normal, girth), stretch(cross(axis, normal), thickness)], color, tone);
  }
  function plate(vertices, pigment, tone) {
    const points = vertices.map(project);
    parts.push({ points, color: pigment, tone, depth: points.reduce((sum, point) => sum + point[2], 0) / points.length });
  }

  if (anatomy.tail > .12) {
    const span = size * (.28 + anatomy.tail * 1.60);
    const curl = pose.tail * span;
    const root = [-length * .67, sway, belly];
    const joint = [-length - span * .23, sway + curl * .26, belly - size * .12];
    const tip = [-length - span * .77, sway + curl, belly + size * .10];
    segment(root, joint, width * (.35 + anatomy.tail * .15), width * .47, .84);
    segment(joint, tip, width * .22, width * .26, .91);
    if (anatomy.fins > .35) {
      for (const side of [-1, 1]) {
        segment(tip, [tip[0] - span * .26, tip[1] + width * .83 * side, tip[2] + size * .16],
          width * .23, width * .10, 1.13);
      }
    }
  }

  for (const side of [-1, 1]) {
    if (anatomy.fins > .24) {
      const reach = size * anatomy.fins * (aquatic ? 1.17 : .66);
      const root = [length * .19, sway + side * width * .62, belly];
      const tip = [-length * .52 + reach * pose.fins * .52, root[1] + reach * side, belly + reach * (pose.fins * side + .15)];
      segment(root, tip, reach * .36, reach * .11, 1.14);
    }
    for (let pair = 0; pair < pairs; pair++) {
      const front = biped ? -.22 : pairs === 1 ? .15 : .52 - pair * .99 / (pairs - 1);
      const step = aquatic ? paddle(pose.phase, pair, side) : footfall(pose.phase, gait, pair, side);
      const swing = step.reach * pose.effort;
      const lift = step.lift * pose.effort;
      const root = [length * front, sway + side * width * .66, belly - height * .26];
      const knee = [root[0] - size * (.22 - swing * .28), root[1] + side * width * (.41 + girth * .25), belly - size * (.23 + legLength * .22)];
      const foot = [root[0] + size * (.10 + swing * .52), knee[1] + side * width * (.29 - lift * .16),
        size * (aquatic ? .26 + lift * .50 : .09 + lift * .36 + pose.lift * .48)];
      const thickness = size * (.095 + anatomy.legs * .057);
      segment(root, knee, thickness * 1.20, thickness, .90);
      segment(knee, foot, thickness * .76, thickness * .84, .89);
      ellipsoid([foot[0] + size * .075, foot[1], foot[2]], [size * (.15 + anatomy.legs * .09), thickness * 1.03, thickness * .66], 1.04);
    }
  }

  const extra = extraLimbCount(anatomy);
  if (extra) {
    const random = seededRandom(Math.round((anatomy.limbLayout ?? 0) * 0xffffffff));
    const maturity = .38 + creatureMaturity(cell) * .62;
    for (let i = 0; i < extra; i++) {
      const side = random() < .5 ? -1 : 1;
      const root = [length * (random() * 1.28 - .63), sway + side * width * .58, belly + height * (random() * .85 - .30)];
      const span = size * (.40 + random() * .45) * maturity;
      const sweep = span * (random() - .5);
      const raise = span * (.20 + random() * .86);
      const curl = Math.sin(pose.phase * TAU + i * 1.71) * pose.effort * span * .37;
      const joint = [root[0] + sweep, root[1] + side * span * .65, root[2] + raise * .71];
      const tip = [joint[0] + sweep * .71 + curl, root[1] + side * span * 1.22, root[2] + raise];
      segment(root, joint, size * .13, size * .11, .91);
      segment(joint, tip, size * .086, size * .076, 1.06);
      ellipsoid(tip, [size * .12, size * .11, size * .093], 1.14);
    }
  }

  const body = ellipsoid([0, sway, belly], [length, width, height]);
  if (ridge > .22) {
    const count = Math.round(3 + ridge * 4);
    const breadth = (.37 + anatomy.armor * .30) / count;
    for (let i = 0; i < count; i++) {
      const t = -.72 + i * 1.41 / (count - 1);
      const base = belly + height * Math.sqrt(1 - t * t) * .76;
      const peak = base + size * ridge * (.21 + Math.sin((i + 1) / (count + 1) * Math.PI) * .47);
      plate([[length * (t - breadth), sway, base], [length * (t - breadth * .78), sway, peak],
        [length * (t + breadth * .48), sway, base + (peak - base) * (.3 + anatomy.armor * .39)],
        [length * (t + breadth), sway, base]], color, .98 + i % 2 * .26);
    }
  } else if (anatomy.armor > .23) {
    const plates = Math.round(3 + anatomy.armor * 4);
    for (let i = 0; i < plates; i++) {
      const t = -.72 + i * 1.27 / (plates - 1);
      const curve = Math.sqrt(1 - t * t);
      ellipsoid([t * length, sway, belly + height * curve * .87],
        [length * .73 / plates, width * curve * (.32 + anatomy.armor * .27), height * .32], 1.10);
    }
  }
  const extension = neck * (aquatic ? .49 : .89);
  const headX = length * .77 + size * extension * .61;
  const headY = sway + width * pose.head;
  const headZ = belly + size * ((aquatic ? .09 : .15) + extension + (biped ? .19 : 0));
  const jaw = { hunter: .40, omnivore: .34, scavenger: .30, grazer: .27 }[genome.diet] ?? .27;
  const skull = .65 + head * .56;
  if (extension > .16 || biped) {
    const shoulder = [length * .44, sway, belly + height * .12];
    const bend = [headX - size * (.19 + extension * .16), headY, headZ - size * (.13 + extension * .37)];
    segment(shoulder, bend, width * .58, width * .55);
    segment(bend, [headX, headY, headZ], width * .39, width * .32, 1.04);
  } else {
    ellipsoid([headX * .83, headY * .78, headZ - size * .11], [size * .43, width * .72, height * .77], .91);
  }
  if (frill > .21) {
    ellipsoid([headX - size * .26 * skull, headY, headZ + size * frill * .14],
      [size * .14 * skull, width * (.59 + frill * .66), size * (.21 + frill * .35) * skull], .87);
  }
  if (horns > .22) {
    const positions = horns > .96 ? [-1, 0, 1] : horns > .43 ? [-1, 1] : [0];
    const reach = size * horns * .54 * skull;
    for (const side of positions) {
      const root = [headX + (side === 0 ? size * skull * .23 : 0), headY + side * width * skull * .65, headZ + size * .18 * skull];
      plate([root, [root[0] + reach * .26, root[1] - side * reach * .14, root[2] - reach * .23],
        [root[0] + reach * (.76 + snout * .34), root[1] + side * reach * .50, root[2] + reach * (.29 + neck * .37)]], HORN, 1.05);
    }
  }
  const nose = jaw * (.61 + snout * 1.20);
  ellipsoid([headX, headY, headZ], [size * .44 * skull, width * .74 * skull, size * .34 * skull], 1.03);
  ellipsoid([headX + size * (.15 + snout * .31) * skull, headY, headZ - size * .11], [size * nose * skull, width * .53 * skull, size * .17 * skull], 1.13);
  if (anatomy.rainCup > .18) {
    const cup = size * (.17 + anatomy.rainCup * .22) * skull;
    const bottom = headZ + size * .31 * skull;
    const cupX = headX - size * .06;
    ellipsoid([cupX, headY, bottom + cup * .15], [cup, cup * .9, cup * .43], .88);
    ellipsoid([cupX, headY, bottom + cup * .39], [cup * .81, cup * .73, cup * .09], .95, RAINWATER);
  }
  if (anatomy.tongue > .18) {
    const mouth = [headX + size * (nose + .15 + snout * .31) * skull, headY, headZ - size * .14];
    const reach = size * anatomy.tongue * (cell.behavior === 'Drinking' ? .81 : .29);
    segment(mouth, [mouth[0] + reach * .22, mouth[1], mouth[2] - reach * .14], size * .029, size * .024, .9);
    ellipsoid([mouth[0] + reach * .58, mouth[1], mouth[2] - reach * .22], [reach * .49, size * .04, size * .031], .98, TONGUE);
  }
  if (anatomy.eyes > .12) {
    const eye = size * (.056 + anatomy.eyes * .108) * skull;
    for (const side of [-1, 1]) {
      const center = [headX + size * .10 * skull, headY + side * width * .55 * skull, headZ + size * .21 * skull];
      ellipsoid(center, [eye * 1.23, eye, eye * 1.24], .94, EYES);
      const pupil = [center[0] + eye * .60, center[1] + side * eye * .51, center[2] + eye * .49];
      ellipsoid(pupil, [eye * .64, eye * .56, eye * .66], .87, PUPIL);
    }
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.save();
  ctx.translate(size * .16, size * .12);
  ctx.rotate(angle);
  ctx.scale(length * 1.46, width * 1.55);
  const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  shadow.addColorStop(0, aquatic ? '#06283959' : '#141c1596');
  shadow.addColorStop(.54, aquatic ? '#06283936' : '#141c1555');
  shadow.addColorStop(1, 'transparent');
  ctx.fillStyle = shadow;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();

  if (cell.submerged) ctx.globalAlpha *= .80;
  parts.sort((a, b) => a.depth - b.depth);
  for (const part of parts) {
    if (part.points) {
      ctx.beginPath();
      for (const [px, py] of part.points) ctx.lineTo(px, py);
      ctx.closePath();
      ctx.fillStyle = colorAt(part.color, part.tone);
      ctx.strokeStyle = colorAt(part.color, .64);
      ctx.lineWidth = size * .027;
      ctx.fill();
      ctx.stroke();
    } else litVolume(ctx, part);
    if (part === body && size >= 6 && genome.pattern !== 'plain') {
      markings(ctx, genome.pattern, project, body, { length, width, height, belly, sway }, color, size);
    }
  }
  ctx.restore();
  return size;
}
