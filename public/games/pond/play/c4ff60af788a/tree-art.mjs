import { clamp, seededRandom, TREE_GROWTH, treeSpecies } from './model.mjs';

export function treeBranches(seed, profile) {
  const random = seededRandom(seed);
  const height = profile.height * (.79 + random() * .42);
  const branches = [];
  let trunk = [0, 0];
  function add(start, end, width, birth, leaves = 0) {
    branches.push({ start, end, width, birth, leaves });
    return end;
  }
  for (let tier = 1; tier <= 5; tier++) {
    const base = trunk;
    const birth = (tier - 1) * .10;
    trunk = add(base, [base[0] + (random() - .5) * height * .095, -height * tier / 5],
      height * (.094 - .011 * tier), birth, tier === 5 ? height * .12 : 0);
    if (tier < 2) continue;
    const count = random() > .45 ? 2 : 1;
    const firstSide = random() < .5 ? -1 : 1;
    for (let i = 0; i < count; i++) {
      const side = i ? -firstSide : firstSide;
      const reach = height * profile.spread * (.12 + random() * .22) * (1.16 - tier * .075);
      const start = [base[0] * .34 + trunk[0] * .66, base[1] * .34 + trunk[1] * .66];
      const angle = -.08 - profile.rise * (.20 + random() * .74) + (random() - .5) * .54;
      const shoulder = add(start, [start[0] + side * reach * .58, start[1] + Math.sin(angle) * reach * .67],
        height * (.052 - tier * .004), birth + .14);
      const end = add(shoulder, [start[0] + side * reach, shoulder[1] + reach * (Math.sin(angle) + random() * .54 - .23) * .53],
        height * .022, birth + .27, reach * (.24 + random() * .34));
      const tips = 1 + Math.floor(random() * 3);
      for (let tip = 0; tip < tips; tip++) {
        const direction = (random() - .28) * Math.PI;
        const twig = reach * (.26 + random() * .58);
        const joint = tip === 0 ? shoulder : [shoulder[0] * .35 + end[0] * .65, shoulder[1] * .35 + end[1] * .65];
        add(joint, [joint[0] + side * Math.cos(direction) * twig, joint[1] - Math.sin(direction) * twig],
          height * .014, birth + .36 + random() * .11, twig * (.36 + random() * .46));
      }
    }
  }
  return branches.sort((a, b) => a.birth - b.birth);
}

const layouts = new WeakMap();

export function drawTree(ctx, tree, planet, x, y, scale) {
  let layout = layouts.get(tree);
  if (!layout) {
    const profile = treeSpecies(planet, tree.variant);
    layout = { profile, branches: treeBranches(tree.seed, profile) };
    layouts.set(tree, layout);
  }
  const { profile, branches } = layout;
  const growth = clamp(tree.age / TREE_GROWTH, .07, 1);
  const height = profile.height;
  let top = 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#14231b52';
  ctx.beginPath();
  ctx.ellipse(height * growth * .13, 2, height * growth * .32, height * growth * .12, -.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineCap = 'round';
  for (const { start, end, width, birth } of branches) {
    const length = clamp((growth - birth) * 7, 0, 1);
    if (!length) continue;
    const tipY = start[1] + (end[1] - start[1]) * length;
    top = Math.min(top, start[1], tipY);
    ctx.lineWidth = width * (.59 + growth * .41);
    ctx.strokeStyle = 'hsl(' + (24 + tree.variant * 7) + ' 31% ' + (31 + birth * 29) + '%)';
    ctx.beginPath();
    ctx.moveTo(...start);
    ctx.lineTo(start[0] + (end[0] - start[0]) * length, tipY);
    ctx.stroke();
  }
  for (const { end, leaves, birth } of branches) {
    const leaf = leaves * 1.24 * clamp((growth - birth - .13) * 6, 0, 1);
    if (leaf < .35) continue;
    top = Math.min(top, end[1] - leaf * 1.22);
    const hue = profile.hue + (end[0] + end[1]) * .40;
    ctx.fillStyle = 'hsl(' + hue + ' 53% 29% / .98)';
    ctx.beginPath();
    ctx.ellipse(end[0], end[1], leaf * 1.22, leaf, end[0] * .13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'hsl(' + hue + ' 67% 62% / .92)';
    ctx.beginPath();
    ctx.ellipse(end[0] - leaf * .23, end[1] - leaf * .31, leaf * .82, leaf * .64, .2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  return -top * scale;
}
