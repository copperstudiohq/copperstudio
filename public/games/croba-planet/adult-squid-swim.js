import { getSquidOrientation } from './squid-frame.js';

const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

/** Physical orientation, shared by the head, mouth, sockets and solid contact.
 * A slow capped turn lets the attached ragdoll limbs follow the mantle. */
export function adultSwimmingOrientation(squid, target, alert, dt) {
  const current=getSquidOrientation(squid);
  const dx=squid.x-squid.px,dy=squid.y-squid.py,dz=squid.z-squid.pz;
  const horizontal=Math.hypot(dx,dy),moving=Math.hypot(horizontal,dz)>1e-6;
  const currentYaw=Math.atan2(2*(current.w*current.y+current.x*current.z),1-2*(current.x**2+current.y**2));
  const yaw=alert ? Math.atan2(target.x-squid.x,target.y-squid.y)
    : horizontal>1e-6 ? Math.atan2(dx,dy) : currentYaw;
  const strength=moving?Math.min(1,Math.hypot(horizontal,dz)/(dt*75)):0;
  const pitch=moving?clamp(.12*strength-.45*Math.atan2(dz,horizontal),-.3,.3):0;
  const turn=Math.atan2(Math.sin(yaw-currentYaw),Math.cos(yaw-currentYaw));
  const roll=clamp(-turn*.05,-.065,.065)*strength;
  const sx=Math.sin(pitch/2),cx=Math.cos(pitch/2),sy=Math.sin(yaw/2),cy=Math.cos(yaw/2),sz=Math.sin(roll/2),cz=Math.cos(roll/2);
  let next={x:cy*sx*cz+sy*cx*sz,y:sy*cx*cz-cy*sx*sz,
    z:cy*cx*sz-sy*sx*cz,w:cy*cx*cz+sy*sx*sz};
  let dot=current.x*next.x+current.y*next.y+current.z*next.z+current.w*next.w;
  if(dot<0){next={x:-next.x,y:-next.y,z:-next.z,w:-next.w};dot=-dot;}
  const angle=Math.acos(clamp(dot,-1,1));
  const amount=angle<1e-8?1:Math.min(1,dt*.24/(2*angle));
  const sine=Math.sin(angle),a=sine>1e-6?Math.sin((1-amount)*angle)/sine:1-amount;
  const b=sine>1e-6?Math.sin(amount*angle)/sine:amount;
  return getSquidOrientation({orientation:{x:current.x*a+next.x*b,y:current.y*a+next.y*b,
    z:current.z*a+next.z*b,w:current.w*a+next.w*b}});
}
