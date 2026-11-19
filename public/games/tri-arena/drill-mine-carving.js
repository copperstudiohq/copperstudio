const AXES = ['X', 'Y', 'Z'];
const valid = box => AXES.every(axis => Number.isFinite(box?.[`min${axis}`])
  && Number.isFinite(box?.[`max${axis}`]) && box[`max${axis}`] > box[`min${axis}`]);

/** Remove an AABB as at most six disjoint slabs, preserving all remaining volume. */
export function subtractMineBox(box, opening) {
  if (!valid(box) || !valid(opening)) throw new RangeError('Mine carving requires finite positive-volume boxes.');
  const clip = {};
  for (const axis of AXES) {
    clip[`min${axis}`] = Math.max(box[`min${axis}`], opening[`min${axis}`]);
    clip[`max${axis}`] = Math.min(box[`max${axis}`], opening[`max${axis}`]);
    if (clip[`max${axis}`] <= clip[`min${axis}`]) return [box];
  }
  const pieces = [], remainder = { ...box };
  for (const axis of AXES) {
    if (remainder[`min${axis}`] < clip[`min${axis}`] - 1e-8) pieces.push({ ...remainder, [`max${axis}`]: clip[`min${axis}`] });
    if (remainder[`max${axis}`] > clip[`max${axis}`] + 1e-8) pieces.push({ ...remainder, [`min${axis}`]: clip[`max${axis}`] });
    remainder[`min${axis}`] = clip[`min${axis}`]; remainder[`max${axis}`] = clip[`max${axis}`];
  }
  return pieces;
}

export function carveMineBox(box, openings) {
  let pieces = [box];
  for (const opening of openings) pieces = pieces.flatMap(piece => subtractMineBox(piece, opening));
  return pieces;
}
