/** Fixed shoreline controls, shared by the offline terrain bake and water mesh.
 * Heights and distances here use simulation units (25 per metre). */
export const SULFURIC_POND_LEVEL=20;
export const SULFURIC_POND_ASPECT=.74;
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

export function sulfuricPondRadius(angle,index){
  return 1+.055*Math.sin(angle*3+index*1.7)+.028*Math.sin(angle*7-index*.8)+.015*Math.cos(angle*11+index);
}

export function sulfuricPondDistance(x,y,[cx,cy,radius],index){
  const dx=(x-cx)/radius,dy=(y-cy)/(radius*SULFURIC_POND_ASPECT);
  return Math.hypot(dx,dy)/sulfuricPondRadius(Math.atan2(dy,dx),index);
}

/** Shallow walkable floor, then a low natural crust lip above the waterline. */
export function sulfuricPondFloor(distance){
  return SULFURIC_POND_LEVEL-15+13*smooth(.18,.96,distance)+7*Math.exp(-(((distance-1.09)/.08)**2))+8*smooth(1,1.35,distance);
}
