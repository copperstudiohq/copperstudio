import { clamp, seededRandom, TREE_GROWTH, treeSpecies } from './model.mjs';
import { projectVolume } from './animal-model.mjs';

const TAU = Math.PI * 2;
const LAND_ELEVATION = Math.sqrt(1 - .84 ** 2);
const projectLandTree = ([east, north, up]) => [east, -north * LAND_ELEVATION - up * .84, up * LAND_ELEVATION - north * .84];

export function globeTreeProjection(point, camera) {
  const longitude = (point.x - .5) * TAU - camera.lon;
  const latitude = (.5 - point.y) * Math.PI;
  const sinLon = Math.sin(longitude);
  const cosLon = Math.cos(longitude);
  const sinLat = Math.sin(latitude);
  const cosLat = Math.cos(latitude);
  const sinTilt = Math.sin(camera.lat);
  const cosTilt = Math.cos(camera.lat);
  return ([east, north, up]) => {
    const equator = up * cosLat - north * sinLat;
    const pole = up * sinLat + north * cosLat;
    const right = east * cosLon + equator * sinLon;
    const forward = equator * cosLon - east * sinLon;
    return [right, forward * sinTilt - pole * cosTilt, pole * sinTilt + forward * cosTilt];
  };
}

const between = (start, end, progress) => start.map((coordinate, axis) => coordinate + (end[axis] - coordinate) * progress);
const extend = ([east, north, up], bearing, reach, rise) =>
  [east + Math.cos(bearing) * reach, north + Math.sin(bearing) * reach, up + rise];

export function treeBranches(seed, profile) {
  const random = seededRandom(seed);
  const height = profile.height * (.79 + random() * .42);
  const branches = [];
  const trunkBearing = random() * TAU;
  let trunk = [0, 0, 0];
  function add(start, end, width, birth, leaves = 0) {
    branches.push({ start, end, width, birth, leaves });
    return end;
  }
  for (let tier = 1; tier <= 5; tier++) {
    const base = trunk;
    const birth = (tier - 1) * .12;
    trunk = add(base, extend(base, trunkBearing + (random() - .5) * 1.7, height * (random() - .18) * .054, height / 5),
      height * (.094 - .011 * tier), birth, tier === 5 ? height * .13 : 0);
    if (tier < 2) continue;
    const count = random() > .45 ? 2 : 1;
    const firstBearing = trunkBearing + tier * 2.4 + (random() - .5) * 1.1;
    for (let i = 0; i < count; i++) {
      const bearing = firstBearing + i * (2.5 + random() * .8);
      const reach = height * profile.spread * (.20 + random() * .26) * (1.16 - tier * .075);
      const start = between(base, trunk, .66);
      const rise = reach * (.16 + profile.rise * (.25 + random() * .48));
      const shoulder = add(start, extend(start, bearing, reach * .57, rise),
        height * (.052 - tier * .004), birth + .10);
      const tipRise = rise * (.14 + profile.rise * .74) - reach * (.32 + random() * .29) * (1 - profile.rise);
      const end = add(shoulder, extend(shoulder, bearing + (random() - .5) * .85, reach * .49, tipRise),
        height * .022, birth + .22, reach * (.21 + random() * .27));
      const tips = 1 + Math.floor(random() * 3);
      for (let tip = 0; tip < tips; tip++) {
        const direction = bearing + (random() - .5) * Math.PI * 1.35;
        const twig = reach * (.26 + random() * .58);
        const joint = tip === 0 ? shoulder : between(shoulder, end, .65);
        add(joint, extend(joint, direction, twig, twig * (random() - .28 + profile.rise * .34)),
          height * .014, birth + .34 + random() * .045, twig * (.31 + random() * .40));
      }
    }
  }
  return branches.sort((a, b) => a.birth - b.birth);
}

const layouts = new WeakMap();

export function drawTree(ctx, tree, planet, x, y, scale, project = projectLandTree) {
  let layout = layouts.get(tree);
  if (!layout) {
    const profile = treeSpecies(planet, tree.variant);
    layout = { profile, branches: treeBranches(tree.seed, profile) };
    layouts.set(tree, layout);
  }
  const { profile, branches } = layout;
  const growth = clamp(tree.age / TREE_GROWTH, .07, 1);
  const height = profile.height;
  const parts = [];
  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  function include(x, y, rx, ry = rx) {
    left = Math.min(left, x - rx);
    right = Math.max(right, x + rx);
    top = Math.min(top, y - ry);
    bottom = Math.max(bottom, y + ry);
  }
  for (const { start, end, width, birth, leaves } of branches) {
    const length = clamp((growth - birth) * 9, 0, 1);
    if (!length) continue;
    const from = project(start);
    const to = project(between(start, end, length));
    const diameter = width * (.59 + growth * .41);
    include(from[0], from[1], diameter / 2);
    include(to[0], to[1], diameter / 2);
    parts.push({ from, to, diameter, birth, depth: (from[2] + to[2]) * .5 });
    const leaf = leaves * 1.24 * clamp((growth - birth - .12) * 6, 0, 1);
    if (leaf < .35) continue;
    const crown = projectVolume(end, [[leaf * 1.26, 0, 0], [0, leaf, 0], [0, 0, leaf * .76]], project);
    const c = Math.cos(crown.angle);
    const s = Math.sin(crown.angle);
    include(crown.x, crown.y, Math.hypot(c * crown.rx, s * crown.ry), Math.hypot(s * crown.rx, c * crown.ry));
    const light = project([end[0] - leaf * .24, end[1] + leaf * .23, end[2] + leaf * .20]);
    parts.push({ crown, light, hue: profile.hue + (end[0] + end[1]) * .5, depth: crown.depth + leaf * .32 });
  }
  parts.sort((a, b) => a.depth - b.depth);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (project === projectLandTree) {
    ctx.fillStyle = '#14231b52';
    ctx.beginPath();
    ctx.ellipse(height * growth * .13, 2, height * growth * .32, height * growth * .12, -.11, 0, TAU);
    ctx.fill();
  }
  ctx.lineCap = 'round';
  for (const part of parts) {
    if (part.crown) {
      const { crown, light, hue } = part;
      ctx.fillStyle = 'hsl(' + hue + ' 53% 29%)';
      ctx.beginPath();
      ctx.ellipse(crown.x, crown.y, crown.rx, crown.ry, crown.angle, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'hsl(' + hue + ' 64% 60%)';
      ctx.beginPath();
      ctx.ellipse(light[0], light[1], crown.rx * .72, crown.ry * .65, crown.angle, 0, TAU);
      ctx.fill();
    } else {
      ctx.lineWidth = part.diameter;
      ctx.strokeStyle = 'hsl(' + (24 + tree.variant * 7) + ' 31% ' + (31 + part.birth * 29) + '%)';
      ctx.beginPath();
      ctx.moveTo(part.from[0], part.from[1]);
      ctx.lineTo(part.to[0], part.to[1]);
      ctx.stroke();
    }
  }
  ctx.restore();
  return { x: x + (left + right) * scale / 2, y: y + (top + bottom) * scale / 2,
    radius: Math.max(right - left, bottom - top) * scale / 2 };
}
