import {EYE_HEIGHT,WATER_LEVEL} from './terrain.js';

/** Fixed, flooded passage beneath Shell Field's northern cliff and geyser #1.
 * Coordinates and dimensions are simulation units (25 = one metre). */
export const SALT_CAVE=Object.freeze({id:'salt-cave',name:'Salt Cave',mouthY:-11270,endY:-13930});
export const SALT_CAVE_SHAFT=Object.freeze({x:5150,y:-13750,radius:80,sides:24,waterLevel:20,poolIndex:0});
export const SALT_CAVE_STATIONS=Object.freeze([
 [ -11270,5150,130,-810,-235],[-11520,5150,130,-790,-235],
 [-11900,5090,210,-740,-205],[-12300,5180,345,-700,-165],
 [-12700,5270,380,-680,-155],[-13100,5250,240,-660,-205],
 [-13500,5150,165,-640,-235],[-13850,5150,150,-640,-235],
 [-13930,5150,115,-640,-250],
].map(Object.freeze));
const mix=(a,b,t)=>a+(b-a)*t;
export function saltCaveStation(y){
 if(y>SALT_CAVE.mouthY||y<SALT_CAVE.endY)return null;
 let i=1;while(i<SALT_CAVE_STATIONS.length-1&&y<SALT_CAVE_STATIONS[i][0])i++;
 const a=SALT_CAVE_STATIONS[i-1],b=SALT_CAVE_STATIONS[i],t=(y-a[0])/(b[0]-a[0]);
 return {x:mix(a[1],b[1],t),width:mix(a[2],b[2],t),floor:mix(a[3],b[3],t),roof:mix(a[4],b[4],t)};
}
/** The same regular polygon cuts the terrain, cave roof and shaft collision. */
export const SALT_SHAFT_RING=Object.freeze(Array.from({length:SALT_CAVE_SHAFT.sides},(_,i)=>{
 const a=i/SALT_CAVE_SHAFT.sides*Math.PI*2;return Object.freeze([SALT_CAVE_SHAFT.x+Math.cos(a)*SALT_CAVE_SHAFT.radius,SALT_CAVE_SHAFT.y+Math.sin(a)*SALT_CAVE_SHAFT.radius]);
}));
export function saltShaftClearance(x,y){
 let distance=Infinity;
 for(let i=0;i<SALT_SHAFT_RING.length;i++){
  const a=SALT_SHAFT_RING[i],b=SALT_SHAFT_RING[(i+1)%SALT_SHAFT_RING.length],dx=b[0]-a[0],dy=b[1]-a[1];
  distance=Math.min(distance,(dx*(y-a[1])-dy*(x-a[0]))/Math.hypot(dx,dy));
 }
 return distance;
}
/** Two looping halls and a side gallery join the main chamber without wall caps. */
export const SALT_CAVE_HALLS=Object.freeze([
 [[5130,-11980],[4480,-12180],[4230,-12600],[4460,-13020],[5210,-13280]],
 [[5120,-11920],[5810,-12170],[6100,-12670],[5900,-13150],[5150,-13550]],
 [[5990,-13020],[6240,-13300],[6040,-13570]],
].map(hall=>Object.freeze(hall.map(Object.freeze))));
export const SALT_CAVE_GRID=25;
export function saltCaveField(x,y){
 const s=saltCaveStation(Math.max(SALT_CAVE.endY,Math.min(SALT_CAVE.mouthY,y)));
 let clearance=s.width-Math.abs(x-s.x);
 for(const hall of SALT_CAVE_HALLS)for(let i=1;i<hall.length;i++){
  const a=hall[i-1],b=hall[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
  const width=145+20*Math.sin((i+t)*Math.PI*.7)**2;
  clearance=Math.max(clearance,width-Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t));
 }
 const lateralClearance=clearance;
 clearance=Math.min(clearance,y-SALT_CAVE.endY,SALT_CAVE.mouthY-y);
 const edge=Math.max(0,1-lateralClearance/180),noise=Math.sin(x*.017+y*.011)*Math.sin(y*.027);
 const roof=s.roof-260*edge**2+(y>=-11485&&y<=-11298?-3:noise*5);
 return {floor:s.floor+60*edge**4+noise*3,roof,clearance};
}
const nodes=new Map();
export function saltCaveMeshNode(x,y){
 const key=`${x}:${y}`;let q=nodes.get(key);if(!q){q=saltCaveField(x,y);nodes.set(key,q);}return q;
}
/** Collision interpolates the same grid triangles as the visible shell. */
export function saltCaveSection(x,y){
 if(y>SALT_CAVE.mouthY||y<SALT_CAVE.endY||x<3900||x>6500)return null;
 const step=SALT_CAVE_GRID,x0=Math.floor(x/step)*step,y0=Math.floor(y/step)*step,u=(x-x0)/step,v=(y-y0)/step;
 const a=saltCaveMeshNode(x0,y0),c=saltCaveMeshNode(x0+step,y0+step),b=u>=v?saltCaveMeshNode(x0+step,y0):saltCaveMeshNode(x0,y0+step),w=u>=v?[1-u,u-v,v]:[1-v,v-u,u];
 const q={};for(const key of['floor','roof','clearance'])q[key]=a[key]*w[0]+b[key]*w[1]+c[key]*w[2];
 q.ceiling=saltShaftClearance(x,y)>=0?Infinity:q.roof;return q;
}
export function getSaltCave(x,y,z,height=0,radius=0){
 if(![x,y,z,height,radius].every(Number.isFinite)||height<0||radius<0)return null;
 const q=saltCaveSection(x,y);if(!q)return null;
 const openMouth=y>SALT_CAVE.mouthY-radius&&Math.abs(x-5150)<130-radius;
 if((q.clearance<radius&&!openMouth)||z<q.floor-.1||z+height+2>q.ceiling)return null;
 // The open shaft belongs to the cave only below the geyser's waterline.
 if(q.ceiling===Infinity&&z>SALT_CAVE_SHAFT.waterLevel)return null;
 if(radius&&[[radius,0],[-radius,0],[0,radius],[0,-radius]].some(([dx,dy])=>{
  const p=saltCaveSection(x+dx,y+dy);
  return p&& (p.clearance<0||z+height+2>p.ceiling||z<p.floor-radius);
 }))return null;
 return {...q,id:SALT_CAVE.id,waterLevel:saltShaftClearance(x,y)>=0?SALT_CAVE_SHAFT.waterLevel:WATER_LEVEL};
}

/** Swimming stays inside the real shell; the geyser shaft opens onto its bank.
 * A prospective sample lets an ordinary swimmer enter either flush opening. */
export function stepSaltCavePlayer(world,input,dx,dy,dt,groundAt){
 const p=world.player,speed=110;
 const current=getSaltCave(p.x,p.y,p.z,EYE_HEIGHT,4.8);
 const next={x:p.x+dx*speed*dt,y:p.y+dy*speed*dt,z:p.z};
 if(!current&&!getSaltCave(next.x,next.y,next.z,EYE_HEIGHT,5)){delete p.saltCaveId;return false;}
 const vertical=Math.max(-1,Math.min(1,(input.swimVertical??0)+(input.ascend||input.jump?1:0)-(input.dive?1:0)));
 const level=current?.waterLevel??(saltShaftClearance(next.x,next.y)>=0?20:WATER_LEVEL),surface=level-EYE_HEIGHT+9;
 next.z=Math.min(surface,p.z+vertical*90*dt);
 const exit=saltShaftClearance(p.x,p.y)>0&&p.z>=surface-.5&&saltShaftClearance(next.x,next.y)<5;
 if(exit){
  const ax=next.x-SALT_CAVE_SHAFT.x,ay=next.y-SALT_CAVE_SHAFT.y,length=Math.hypot(ax,ay);
  next.x=SALT_CAVE_SHAFT.x+ax/length*(SALT_CAVE_SHAFT.radius+6);next.y=SALT_CAVE_SHAFT.y+ay/length*(SALT_CAVE_SHAFT.radius+6);
  const ground=groundAt(next.x,next.y);
  if(ground!==null&&ground<level+24){Object.assign(p,next,{z:ground,swimming:false,underwater:false});delete p.saltCaveId;world.lastJumpInput=Boolean(input.jump);return true;}
 }
 const fit=point=>{
  if(point.y>SALT_CAVE.mouthY)return point.y<SALT_CAVE.mouthY+25;
  const q=saltCaveSection(point.x,point.y);if(!q)return false;
  const edges=[[5,0],[-5,0],[0,5],[0,-5]].map(([dx,dy])=>saltCaveSection(point.x+dx,point.y+dy)).filter(Boolean);
  const top=Math.min(q.ceiling,...edges.map(edge=>edge.ceiling))-EYE_HEIGHT-3;
  if(point.z>top&&p.z>top+.2)return false;
  const z=Math.max(q.floor+.1,Math.min(point.z,top));
  if(!getSaltCave(point.x,point.y,z,EYE_HEIGHT,5))return false;
  point.z=z;return true;
 };
 if(!fit(next)){
  const slideX={x:next.x,y:p.y,z:next.z},slideY={x:p.x,y:next.y,z:next.z};
  if(fit(slideX))Object.assign(next,slideX);else if(fit(slideY))Object.assign(next,slideY);else{next.x=p.x;next.y=p.y;fit(next);}
 }
 Object.assign(p,next,{swimming:true,jumping:false,falling:false,fallVelocity:0,jumpTime:0});delete p.jumpBaseZ;
 if(dx||dy)p.heading=Math.atan2(dy,dx);
 const section=getSaltCave(p.x,p.y,p.z,EYE_HEIGHT,1);
 if(section)p.saltCaveId=SALT_CAVE.id;else delete p.saltCaveId;
 p.wetTime+=dt;world.lastJumpInput=Boolean(input.jump);return true;
}
