/** SI units: an 80 g copper disc unwinds on a bearing axle. The release
 * control supplies one hand-tug impulse; it is not a continuous reel motor. */
export const YOYO_SPOOL=Object.freeze({mass:.08,radius:.055,axle:.012,inertia:.000121,minLength:.07,maxLength:.60,throwSpeed:.46,returnKick:120});

export function resetYoyoSpool(y){
 Object.assign(y,{mode:'caught',length:YOYO_SPOOL.minLength,spoolSpeed:0,angularVelocity:0,previousHeld:false,extension:0,velocity:0,spin:0,accumulator:0});
}

export function stepYoyoSpool(y,h,underwater=false){
 const s=YOYO_SPOOL,g=underwater?3.2:9.81;
 const press=y.held&&!y.previousHeld,release=!y.held&&y.previousHeld;
 if(press&&y.mode==='caught'){
  y.mode='unwinding';y.spoolSpeed=s.throwSpeed;y.angularVelocity=s.throwSpeed/s.axle;
 }else if(release&&y.mode!=='caught'){
  y.mode='returning';y.angularVelocity=Math.max(y.angularVelocity,s.returnKick);
 }
 y.previousHeld=Boolean(y.held);
 if(y.mode==='unwinding'){
  const acceleration=g/(1+s.inertia/(s.mass*s.axle*s.axle));
  y.spoolSpeed+=acceleration*h;y.length+=y.spoolSpeed*h;y.angularVelocity=y.spoolSpeed/s.axle;
  if(y.length>=s.maxLength){y.length=s.maxLength;y.spoolSpeed=0;y.mode='sleeping';}
 }else if(y.mode==='sleeping'){
  y.angularVelocity*=Math.exp(-(underwater?2.8:.22)*h);y.spoolSpeed=0;
 }else if(y.mode==='returning'){
  const acceleration=s.mass*g*s.axle/(s.inertia+s.mass*s.axle*s.axle);
  y.angularVelocity=Math.max(0,y.angularVelocity-acceleration*h);
  y.spoolSpeed=-s.axle*y.angularVelocity;y.length+=y.spoolSpeed*h;
  if(y.length<=s.minLength){y.length=s.minLength;y.mode='caught';y.spoolSpeed=0;y.angularVelocity=0;}
  else if(y.angularVelocity<=0){y.mode='unwinding';y.spoolSpeed=0;}
 }
 y.length=Math.max(s.minLength,Math.min(s.maxLength,y.length));
 y.extension=(y.length-s.minLength)/(s.maxLength-s.minLength);y.velocity=y.spoolSpeed/(s.maxLength-s.minLength);
 y.spin=(y.spin+y.angularVelocity*h)%(Math.PI*2);
}
