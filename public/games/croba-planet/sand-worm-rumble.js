/** Small deterministic camera tremor. Menus freeze the simulation clock and
 * explicit reduced motion suppresses camera motion while preserving the hunt. */
export function sampleSandWormShake(world,reducedMotion=false,target={}){
  const strength=reducedMotion?0:Math.max(0,Math.min(1,Number.isFinite(world.wormRumble)?world.wormRumble:0));
  const time=Number.isFinite(world.elapsed)?world.elapsed:0;
  target.x=Math.sin(time*38)*strength*.045;
  target.y=Math.sin(time*47+.8)*strength*.028;
  target.roll=Math.sin(time*35)*strength*.006;return target;
}
