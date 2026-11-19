const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
export const SHARED_BITE_CUT=.48;

/** The beak closes before the leg pieces detach. Both renderers use this clock. */
export function sharedBitePose(progress){
 const p=clamp(progress),closed=smooth((p-.34)/.14);
 return {opening:p<.48?.6+.12*smooth(p/.24)-.69*closed:.03+.24*smooth((p-.58)/.25),
  detached:p>=SHARED_BITE_CUT,pull:smooth((p-SHARED_BITE_CUT)/.44),
  present:smooth(p/.30)};
}
