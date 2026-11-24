const TAU = Math.PI * 2;
const cycle = (turns) => turns - Math.floor(turns);

export function animalPose(cell, pairs, aquatic, fraction) {
  const travel = Math.max(0, cell.stride - cell.pstride);
  const stride = cell.pstride + travel * fraction;
  const effort = Math.min(1, travel * 1.35);
  const phase = stride / (4.4 + cell.anatomy.tissue * 2);
  const wave = phase * TAU;
  const tailSwim = cell.genome.motion === 'tail' || cell.anatomy.tail > cell.anatomy.fins;
  const swimWave = wave * (tailSwim ? 1.25 : .87);
  const bound = pairs === 1 ? footfall(phase, pairs, 0, 1).lift : 0;
  return {
    phase,
    effort,
    lift: aquatic ? 0 : effort * (pairs === 1 ? bound * .24 : Math.sin(wave * 2) * .040),
    sway: aquatic ? Math.sin(swimWave) * effort * (tailSwim ? .19 : .08) : Math.sin(wave) * effort * .08,
    head: aquatic ? Math.sin(swimWave + .9) * effort * (tailSwim ? .20 : .08) : Math.sin(wave) * effort * .11,
    tail: aquatic ? Math.sin(swimWave - 1.25) * effort * (tailSwim ? .57 : .26) : Math.sin(wave - .7) * effort * .25,
    fins: aquatic ? Math.sin(swimWave + .5) * effort * (tailSwim ? .28 : .76) : 0,
  };
}

export function footfall(phase, pairs, pair, side) {
  // A biped bounds with both feet. Four and six legs alternate their support groups.
  const offset = pairs === 1 ? 0 : .5 * ((pair + Number(side < 0)) % 2);
  const position = cycle(phase + offset);
  const stance = pairs === 1 ? .48 : .62;
  if (position < stance) return { reach: 1 - 2 * position / stance, lift: 0 };
  const swing = (position - stance) / (1 - stance);
  return {
    reach: -1 + 2 * swing * swing * (3 - 2 * swing),
    lift: Math.sin(Math.PI * swing),
  };
}

export function paddle(phase, pair, side) {
  const angle = phase * TAU * .85 + pair * .95 + (side < 0 ? Math.PI : 0);
  return { reach: Math.sin(angle), lift: .5 + .5 * Math.cos(angle) };
}
