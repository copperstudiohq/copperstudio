/** Shared fixed armor dimensions; 25 simulation units equal one metre. */
export const BASE_SIDE_PLANK_BOUNDS=Object.freeze({innerX:147.5,outerX:175,halfLength:190,bottom:19.5,top:69.5});
export const SIDE_ARMOR_TAPER_START=100;
export const SIDE_ARMOR_END_X=148;

/** The middle projects one metre. Near either end it eases back through the
 * wall face, so the tip finishes embedded rather than leaving a raised lip. */
export const SIDE_ARMOR_TAPER_KNOTS=Object.freeze([0,100,115,130,145,160,175,190].map(y=>{
 const t=Math.max(0,Math.min(1,(y-SIDE_ARMOR_TAPER_START)/(BASE_SIDE_PLANK_BOUNDS.halfLength-SIDE_ARMOR_TAPER_START)));
 return Object.freeze({y,outerX:BASE_SIDE_PLANK_BOUNDS.outerX+(SIDE_ARMOR_END_X-BASE_SIDE_PLANK_BOUNDS.outerX)*t*t*(3-2*t)});
}));

/** Interpolate the actual fixed mesh samples for matching movement bounds. */
export function sideArmorOuterXAt(y){
 if(!Number.isFinite(y))throw new TypeError('Side armor position must be finite.');
 const distance=Math.min(Math.abs(y),BASE_SIDE_PLANK_BOUNDS.halfLength);
 for(let i=1;i<SIDE_ARMOR_TAPER_KNOTS.length;i++){
  const a=SIDE_ARMOR_TAPER_KNOTS[i-1],b=SIDE_ARMOR_TAPER_KNOTS[i];
  if(distance<=b.y)return a.outerX+(b.outerX-a.outerX)*(distance-a.y)/(b.y-a.y);
 }
 return SIDE_ARMOR_TAPER_KNOTS.at(-1).outerX;
}
