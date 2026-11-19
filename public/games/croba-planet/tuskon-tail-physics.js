import {WATER_LEVEL} from './terrain.js';
import {getSeabedHeight} from './seabed.js';

export const TUSKON_TAIL_SEGMENTS=8;
export const TUSKON_TAIL_ROOT_Z=-4.7;
export const TUSKON_TAIL_LENGTH=7.3;
const SCALE=25,STEP=1/120,LINK=TUSKON_TAIL_LENGTH*SCALE/TUSKON_TAIL_SEGMENTS;
const states=new WeakMap(),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const centers=[[-12,.12],[-10,.12],[-8.5,.13],[-7,.14],[-5.5,.15],[-4.7,.15]];
const finite=p=>p&&['x','y','z','px','py','pz'].every(key=>Number.isFinite(p[key]));
/** @typedef {{x:number,y:number,z:number,px:number,py:number,pz:number}} TuskonTailNode */

export function tuskonTailCenterY(z){
  for(let i=1;i<centers.length;i++)if(z<=centers[i][0]){
    const a=centers[i-1],b=centers[i],t=clamp((z-a[0])/(b[0]-a[0]),0,1),s=t*t*(3-2*t);
    return a[1]+(b[1]-a[1])*s;
  }
  return .15;
}
export function tuskonBodyWave(z,phase){const t=clamp((2-z)/14,0,1);return .9*t*t*Math.sin(phase-t*3);}
export function tuskonBodySlope(z,phase){
  if(z<=-12||z>=2)return 0;
  const t=(2-z)/14;return -.9/14*(2*t*Math.sin(phase-t*3)-3*t*t*Math.cos(phase-t*3));
}
export const tuskonTailRadius=index=>(.025+.875*(1-clamp(index/TUSKON_TAIL_SEGMENTS,0,1))**.9)*SCALE;

/** Same YXZ body frame as the renderer, converted to simulation coordinates. */
export function tuskonLocalToWorld(animal,x,y,z,target={}){
  const b=animal.bank??0,p=animal.pitch??0,cb=Math.cos(b),sb=Math.sin(b),cp=Math.cos(p),sp=Math.sin(p);
  const side=x*cb-y*sb,up=x*sb+y*cb,height=up*cp+z*sp,along=-up*sp+z*cp;
  const ch=Math.cos(animal.heading),sh=Math.sin(animal.heading);
  target.x=animal.x+(side*sh+along*ch)*SCALE;
  target.y=animal.y+(-side*ch+along*sh)*SCALE;target.z=animal.z+height*SCALE;return target;
}

function reset(animal,state,motion){
  animal.tailNodes=Array.from({length:TUSKON_TAIL_SEGMENTS+1},(_,i)=>{
    const z=TUSKON_TAIL_ROOT_Z-TUSKON_TAIL_LENGTH*i/TUSKON_TAIL_SEGMENTS;
    const p=tuskonLocalToWorld(animal,motion?tuskonBodyWave(z,animal.phase??0):0,tuskonTailCenterY(z),z);
    return {...p,px:p.x,py:p.y,pz:p.z};
  });
  state.nodes=animal.tailNodes;state.step=STEP;state.reset=false;state.motion=motion;
  state.x=animal.x;state.y=animal.y;state.z=animal.z;
  Object.assign(state.root,animal.tailNodes[0]);
}

function constrain(parent,node,length,previous,radius,floorAt,first){
  let dx=node.x-parent.x,dy=node.y-parent.y,dz=node.z-parent.z,d=Math.hypot(dx,dy,dz);
  if(d<1e-9){dx=previous.x;dy=previous.y;dz=previous.z;d=1;}
  dx/=d;dy/=d;dz/=d;
  const cosine=Math.cos(first ? .4 : .6),dot=dx*previous.x+dy*previous.y+dz*previous.z;
  if(dot<cosine){
    let sx=dx-previous.x*dot,sy=dy-previous.y*dot,sz=dz-previous.z*dot,s=Math.hypot(sx,sy,sz);
    if(s<1e-9){sx=-previous.y;sy=previous.x;sz=0;s=Math.hypot(sx,sy)||1;}
    const sine=Math.sqrt(1-cosine*cosine);
    dx=previous.x*cosine+sx/s*sine;dy=previous.y*cosine+sy/s*sine;dz=previous.z*cosine+sz/s*sine;
  }
  node.x=parent.x+dx*length;node.y=parent.y+dy*length;node.z=parent.z+dz*length;
  // Project the link sphere against the seabed and water surface. Mid-link
  // sampling also retains thin ridges between the physics nodes.
  for(let pass=0;pass<2;pass++){
    const floor=Math.max(floorAt(node.x,node.y),floorAt((parent.x+node.x)/2,(parent.y+node.y)/2))+radius;
    const height=clamp(node.z,floor,WATER_LEVEL-radius);
    if(height===node.z)break;
    dz=clamp(height-parent.z,-length,length);const horizontal=Math.sqrt(Math.max(0,length*length-dz*dz));
    dx=node.x-parent.x;dy=node.y-parent.y;d=Math.hypot(dx,dy);
    if(d<1e-9){dx=previous.x;dy=previous.y;d=Math.hypot(dx,dy)||1;}
    node.x=parent.x+dx/d*horizontal;node.y=parent.y+dy/d*horizontal;node.z=parent.z+dz;
    node.pz=node.z; // Water/ground contact removes vertical impact velocity.
  }
  previous.x=(node.x-parent.x)/length;previous.y=(node.y-parent.y)/length;previous.z=(node.z-parent.z)/length;
}

/** Damped, length-constrained Verlet chain. Nine transient nodes follow the
 * body through turns, muscular strokes, water drag and physical floor contact.
 * No rendering clock, frame-specific mesh allocation, or saved state is used.
 * @param {object} world @param {object} animal @param {number} dt
 * @param {(x:number,y:number)=>number} [floorAt] */
export function updateTuskonTail(world,animal,dt,floorAt=getSeabedHeight,motion=true){
  if(!Number.isFinite(dt)||dt<=0)return;
  let state=states.get(animal);
  if(animal.squidHeldBy||animal.squidRespawnIn>0){if(state)state.reset=true;return;}
  if(!['x','y','z','heading','phase'].every(key=>Number.isFinite(animal[key])))return;
  if(world.player&&Math.hypot(world.player.x-animal.x,world.player.y-animal.y)>3000){if(state)state.reset=true;return;}
  if(!state){state={root:{},target:{},backward:{},direction:{},rest:Array.from({length:9},()=>({})),reset:true};states.set(animal,state);}
  const nodes=animal.tailNodes;
  if(state.reset||state.motion!==motion||state.nodes!==nodes||!Array.isArray(nodes)||nodes.length!==9||nodes.some(p=>!finite(p))
    ||nodes.some((p,i)=>i>0&&Math.hypot(p.x-nodes[i-1].x,p.y-nodes[i-1].y,p.z-nodes[i-1].z)>LINK*3)
    ||Math.hypot(animal.x-state.x,animal.y-state.y,animal.z-state.z)>TUSKON_TAIL_LENGTH*SCALE*.65)reset(animal,state,motion);
  const chain=animal.tailNodes,phase=animal.phase,rootWave=motion?tuskonBodyWave(TUSKON_TAIL_ROOT_Z,phase):0,slope=motion?tuskonBodySlope(TUSKON_TAIL_ROOT_Z,phase):0;
  tuskonLocalToWorld(animal,rootWave,.15,TUSKON_TAIL_ROOT_Z,state.target);
  const sx=state.root.x,sy=state.root.y,sz=state.root.z;
  tuskonLocalToWorld(animal,rootWave-slope,.15,TUSKON_TAIL_ROOT_Z-1,state.backward);
  state.backward.x-=state.target.x;state.backward.y-=state.target.y;state.backward.z-=state.target.z;
  const backwardLength=Math.hypot(state.backward.x,state.backward.y,state.backward.z);
  for(const axis of ['x','y','z'])state.backward[axis]/=backwardLength;
  const amplitude=motion?(animal.state==='pursuing'?2.8:2.35):0;
  for(let i=1;i<=TUSKON_TAIL_SEGMENTS;i++){
    const t=i/TUSKON_TAIL_SEGMENTS,z=TUSKON_TAIL_ROOT_Z-TUSKON_TAIL_LENGTH*t;
    const side=rootWave-slope*TUSKON_TAIL_LENGTH*t*(1-t)**2+amplitude*t*t*Math.sin(phase-t*3);
    tuskonLocalToWorld(animal,side,tuskonTailCenterY(z)+(motion ? .16*t*t*Math.sin(phase-t*2+.7) : 0),z,state.rest[i]);
  }
  const delta=Math.min(.05,dt),steps=Math.ceil(delta/STEP),h=delta/steps,damping=Math.exp(-4*h);
  for(let step=1;step<=steps;step++){
    const t=step/steps,root=chain[0];root.x=sx+(state.target.x-sx)*t;root.y=sy+(state.target.y-sy)*t;root.z=sz+(state.target.z-sz)*t;
    root.px=root.x;root.py=root.y;root.pz=root.z;
    for(let i=1;i<=TUSKON_TAIL_SEGMENTS;i++){
      const node=chain[i],target=state.rest[i],oldX=node.x,oldY=node.y,oldZ=node.z;
      let vx=(node.x-node.px)*h/state.step*damping,vy=(node.y-node.py)*h/state.step*damping,vz=(node.z-node.pz)*h/state.step*damping;
      const speed=Math.hypot(vx,vy,vz),limit=LINK*.4;
      if(speed>limit){const ratio=limit/speed;vx*=ratio;vy*=ratio;vz*=ratio;}
      node.x+=vx+(target.x-node.x)*22*h*h;node.y+=vy+(target.y-node.y)*22*h*h;node.z+=vz+(target.z-node.z)*22*h*h;
      node.px=oldX;node.py=oldY;node.pz=oldZ;
    }
    for(let pass=0;pass<3;pass++){
      Object.assign(state.direction,state.backward);
      for(let i=1;i<=TUSKON_TAIL_SEGMENTS;i++)constrain(chain[i-1],chain[i],LINK,state.direction,tuskonTailRadius(i),floorAt,i===1);
    }
    state.step=h;
  }
  state.x=animal.x;state.y=animal.y;state.z=animal.z;Object.assign(state.root,chain[0]);
}
