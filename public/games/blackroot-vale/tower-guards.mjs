import * as T from './vendor/three.module.js';
import { corruptedHide } from './horse-blight.mjs';
import { seeded } from './layout.mjs';
import { guardCanSee, THRONE_ROOM, TOWER_LEVEL, towerWalkHeight } from './tower-plan.mjs';

export const GUARD_NAME = 'Opsing Guard';
const WINDUP = .64;
const RECOVERY = .74;
const STRIKE_REACH = 1.93;
const routes = [
  { y: 0, path: [[-1.7, -2.85], [1.75, -2.85], [1.75, 1.95], [-1.7, 1.95]] },
  { y: 0, path: [[4.8, 3.32], [4.8, -4.3], [3.4, -4.3], [3.4, 3.32]] },
  { y: TOWER_LEVEL, path: [[-2.88, -5.74], [2.55, -5.74], [2.55, -1.05], [-2.88, -1.05]] },
];
const ellipse = new T.SphereGeometry(1, 16, 11);
const shaft = new T.CylinderGeometry(.91, 1, 1, 10);
const point = new T.ConeGeometry(1, 1, 5);
const block = new T.BoxGeometry();
const hood = new T.SphereGeometry(1, 20, 11, 0, Math.PI * 2, 0, 1.68);
const dark = new T.MeshStandardMaterial({ color: '#2c2521', roughness: .92 });
const cloth = new T.MeshStandardMaterial({ color: '#493026', roughness: .99, side: T.DoubleSide });
const leather = new T.MeshStandardMaterial({ color: '#4d392c', roughness: .89 });
const hollows = new T.MeshBasicMaterial({ color: '#160e0c' });
const ember = new T.MeshBasicMaterial({ color: '#ca6633' });

function pittedIron() {
  const size = 96;
  const random = seeded(172);
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const flake = .51 + .27 * Math.sin(x * .32 + y * .27) * Math.cos(y * .21)
        + .22 * Math.sin(x * .09 - y * .11);
      const grit = 17 * random() - 11 * (random() > .93);
      pixels.set([82 + 52 * flake + grit, 73 + 18 * flake + grit, 66 + grit, 255], 4 * (y * size + x));
    }
  }
  const map = new T.DataTexture(pixels, size, size);
  map.colorSpace = T.SRGBColorSpace;
  map.magFilter = T.LinearFilter;
  map.minFilter = T.LinearMipmapLinearFilter;
  map.generateMipmaps = map.needsUpdate = true;
  return new T.MeshStandardMaterial({ name: 'Pitted iron', map, bumpMap: map, bumpScale: .027, roughness: .83, metalness: .39 });
}

const steel = pittedIron();
const rip = new T.Shape().moveTo(-.22, .22).lineTo(.23, .22).lineTo(.245, -.22)
  .lineTo(.133, -.14).lineTo(.076, -.29).lineTo(.01, -.14).lineTo(-.104, -.23).lineTo(-.219, -.16).closePath();
const tabard = new T.ShapeGeometry(rip);

function piece(group, material, geometry, x, y, z, w, h, d) {
  const mesh = new T.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  group.add(mesh);
  return mesh;
}

function buildGuard(scene, hide, index) {
  const model = new T.Group();
  model.name = GUARD_NAME;
  scene.add(model);
  const body = new T.Group();
  model.add(body);
  piece(body, steel, ellipse, 0, 1.315, 0, .30, .35, .168);
  piece(body, dark, shaft, 0, .936, 0, .265, .45, .144);
  piece(body, cloth, tabard, 0, .926, .169, 1, 1, 1);
  piece(body, cloth, tabard, 0, 1.36, -.153, 1.19, 1.14, 1);
  piece(body, leather, shaft, 0, 1.10, 0, .269, .075, .178);
  const helm = new T.Group();
  helm.position.set(0, 1.79, .017);
  helm.rotation.z = (index - 1) * .074;
  body.add(helm);
  piece(helm, hide, ellipse, 0, -.008, .024, .147, .191, .138);
  piece(helm, steel, hood, 0, .037, -.013, .183, .186, .173);
  piece(helm, steel, block, 0, .029, .129, .262, .046, .084).rotation.z = -.059;
  piece(helm, hide, ellipse, 0, -.065, .132, .043, .060, .052).rotation.z = -.14;
  piece(helm, hollows, ellipse, 0, -.112, .111, .061, .022, .038);
  for (const side of [-1, 1]) {
    piece(helm, steel, ellipse, side * .141, -.078, .015, .042, side === 1 ? .177 : .136, .102).rotation.z = side * .16;
    piece(helm, hollows, ellipse, side * .063, -.010, .140, .039, .025, .017).rotation.z = side * .22;
    piece(helm, ember, ellipse, side * .064, -.013, .150, .012, .010, .009);
  }
  const legs = [];
  const arms = [];
  for (const side of [-1, 1]) {
    const leg = new T.Group();
    leg.position.set(side * .143, .91, 0);
    body.add(leg);
    piece(leg, dark, shaft, 0, -.277, 0, .104, .55, .106);
    piece(leg, steel, ellipse, 0, -.47, .034, .109, .117, .098);
    piece(leg, steel, shaft, 0, -.686, 0, .082, .38, .082);
    piece(leg, leather, ellipse, 0, -.863, .053, .086, .061, .156);
    legs.push(leg);
    const arm = new T.Group();
    arm.position.set(side * .29, 1.46, 0);
    body.add(arm);
    piece(arm, steel, ellipse, side * .024, 0, 0, .138, .126, .131);
    piece(arm, steel, point, side * .10, .095, -.023, .059, side === 1 ? .165 : .091, .047).rotation.z = -side * .39;
    piece(arm, dark, shaft, side * .042, -.16, 0, .094, .33, .091);
    piece(arm, steel, shaft, side * .037, -.373, .035, .081, .238, .085).rotation.x = -.22;
    piece(arm, hide, ellipse, side * .032, -.49, .078, .071, .071, .061);
    arms.push(arm);
  }
  const spear = new T.Group();
  spear.position.set(.035, -.49, .078);
  arms[1].add(spear);
  piece(spear, leather, shaft, 0, .31, 0, .020, 1.69, .020);
  piece(spear, steel, point, 0, 1.236, 0, .060, .24, .041);
  return { model, body, legs, arms, spear };
}

function animateGuard(guard, pursuing) {
  const gait = guard.gait ?? 1;
  const swing = Math.sin(guard.cycle) * (pursuing ? .58 : .34) * gait;
  const time = guard.attack ?? 0;
  const draw = T.MathUtils.smoothstep(time, 0, WINDUP - .12);
  const thrust = T.MathUtils.smoothstep(time, WINDUP - .16, WINDUP + .035);
  const end = 1 - T.MathUtils.smoothstep(time, WINDUP + .09, WINDUP + RECOVERY);
  const lean = (.16 * thrust - .11 * draw) * end;
  guard.model.position.set(guard.x, guard.y + .01, guard.z);
  guard.model.rotation.y = guard.yaw;
  guard.body.position.y = .026 * (1 - Math.cos(guard.cycle * 2)) * (1 - draw * end) * gait;
  guard.body.position.z = .18 * thrust * end;
  guard.body.rotation.x = lean;
  guard.legs[0].rotation.x = swing * (1 - draw * end) - .27 * thrust * end;
  guard.legs[1].rotation.x = -swing * (1 - draw * end) + .17 * thrust * end;
  guard.arms[0].rotation.x = -swing * .63 - .25 * draw * end;
  guard.arms[1].rotation.x = -.16 + swing * .24 + (.28 * draw - 1.23 * thrust) * end;
  guard.spear.rotation.x = (.98 * draw + .59 * thrust) * end - guard.arms[1].rotation.x - lean;
}

export function createRoadGuard(scene, earth, index) {
  const guard = buildGuard(scene, corruptedHide(earth), index);
  guard.model.visible = false;
  return {
    pose(frame) {
      guard.model.visible = Boolean(frame);
      if (frame) {
        Object.assign(guard, frame, { gait: frame.walking ? 1 : 0 });
        animateGuard(guard, false);
      }
    },
  };
}

export function createTowerGuards(scene, earth) {
  const hide = corruptedHide(earth);
  const guards = routes.map(({ y, path }, index) => ({ ...buildGuard(scene, hide, index), y, path }));
  const turn = (from, to, step) => {
    const angle = Math.atan2(Math.sin(to - from), Math.cos(to - from));
    return from + T.MathUtils.clamp(angle, -step, step);
  };
  function reset() {
    for (const guard of guards) {
      const [[x, z], [nextX, nextZ]] = guard.path;
      Object.assign(guard, { x, z, next: 1, yaw: Math.atan2(nextX - x, nextZ - z), cycle: 0,
        alert: 0, target: null, attack: null, attackTarget: null });
      animateGuard(guard, false);
    }
  }
  reset();
  return {
    reset,
    advance(elapsed, player, height, prisoner) {
      let alerted = false;
      let striking = false;
      let caught = false;
      let prisonerCaught = false;
      for (const guard of guards) {
        const nearby = (target, floor) => target && target.z >= THRONE_ROOM.gate && Math.abs(floor - guard.y) < .38;
        const playerOnLevel = nearby(player, height);
        const prisonerOnLevel = nearby(prisoner, prisoner?.y);
        if (playerOnLevel && guardCanSee(guard, player, height)) {
          guard.target = 'player';
          guard.alert = 1.35;
        } else if (prisonerOnLevel && guardCanSee(guard, prisoner, prisoner.y)) {
          guard.target = 'prisoner';
          guard.alert = 1.35;
        } else guard.alert = Math.max(0, guard.alert - elapsed);
        const target = guard.alert > 0 && (guard.target === 'player'
          ? (playerOnLevel && player) : (prisonerOnLevel && prisoner));
        const pursuing = Boolean(target);
        alerted ||= pursuing && guard.target === 'player';
        const [x, z] = pursuing ? [target.x, target.z] : guard.path[guard.next];
        const dx = x - guard.x;
        const dz = z - guard.z;
        const gap = Math.hypot(dx, dz);
        if (guard.attack !== null) {
          const previous = guard.attack;
          guard.attack += elapsed;
          const victim = guard.attackTarget === 'player' ? (playerOnLevel && player) : (prisonerOnLevel && prisoner);
          if (victim) {
            const targetX = victim.x - guard.x;
            const targetZ = victim.z - guard.z;
            const distance = Math.hypot(targetX, targetZ);
            if (previous < .26 && distance > .05) {
              guard.yaw = turn(guard.yaw, Math.atan2(targetX, targetZ), elapsed * 6.4);
            }
            const ahead = targetX * Math.sin(guard.yaw) + targetZ * Math.cos(guard.yaw);
            const hit = previous < WINDUP && guard.attack >= WINDUP
              && distance <= STRIKE_REACH && (distance < .16 || ahead >= distance * .70);
            if (guard.attackTarget === 'player') {
              striking ||= guard.attack < WINDUP && distance < 3.4;
              caught ||= hit;
            } else prisonerCaught ||= hit;
          }
          if (guard.attack > WINDUP + RECOVERY) {
            guard.attack = null;
            guard.attackTarget = null;
          }
        } else if (pursuing && gap <= STRIKE_REACH - .16) {
          guard.attack = 0;
          guard.attackTarget = guard.target;
          striking ||= guard.target === 'player';
          if (gap > .05) guard.yaw = turn(guard.yaw, Math.atan2(dx, dz), elapsed * 6.4);
        } else if (gap > .05) {
          guard.yaw = turn(guard.yaw, Math.atan2(dx, dz), elapsed * 6.4);
          const stride = Math.min(gap, elapsed * (pursuing ? 3.16 : 1.15));
          const nextX = guard.x + dx * stride / gap;
          const nextZ = guard.z + dz * stride / gap;
          if ((guard.y > 0 || nextX >= -3.03) && towerWalkHeight(nextX, nextZ, guard.y) === guard.y) {
            guard.x = nextX;
            guard.z = nextZ;
            guard.cycle += stride * 6.2;
          }
        } else if (!pursuing) {
          guard.next = (guard.next + 1) % guard.path.length;
        }
        animateGuard(guard, pursuing);
      }
      return prisonerCaught ? { alerted, striking, caught, prisonerCaught } : { alerted, striking, caught };
    },
  };
}
