import {getSaltCave} from './salt-cave.js';
import {PREPARED_BASIN_CAVES} from './basin-expansion-data.js';
import {EYE_HEIGHT,WATER_LEVEL,getIceSection,pointInPolygon} from './terrain.js';

export const BASIN_CAVES=PREPARED_BASIN_CAVES;
/** Keep the submerged throat open through the calved face's outward bulges.
 * Rendering clips this short reach to the real ice; no exterior tube is built. */
export const BASIN_CAVE_MOUTH_REACH=60;
/** Entrance ramps are measured in simulation units, independently of corridor
 * length. Every mainland branch reaches the same dry central meeting chamber. */
export const BASIN_CAVE_PROFILE=Object.freeze([
 [0,95,-230,-145],[90,110,-225,-145],[230,160,-175,-60],[370,195,-105,-32],
].map(Object.freeze));
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=n=>Math.max(0,Math.min(1,n));

export function basinCaveStation(cave,s){
 if(s<0||s>1)return null;
 const distance=s*cave.length;
 let floor=-105,ceiling=-32,width=180;
 if(distance<370){
  let i=1;while(i<BASIN_CAVE_PROFILE.length-1&&distance>BASIN_CAVE_PROFILE[i][0])i++;
  const a=BASIN_CAVE_PROFILE[i-1],b=BASIN_CAVE_PROFILE[i],t=clamp((distance-a[0])/(b[0]-a[0]));
  width=mix(a[1],b[1],t);floor=mix(a[2],b[2],t);ceiling=mix(a[3],b[3],t);
 }else{
  // Wide, uneven chambers interrupt the passages, rather than circular pipes.
  width=155+65*Math.exp(-(((s-.65)/.10)**2))+95*Math.exp(-(((distance-(cave.length-250))/280)**2));
 }
 width*=cave.widthScale*(1+.09*Math.sin(distance*.012)+.045*Math.sin(distance*.027+1.3));
 return {width,floor,ceiling};
}

/** Signed union of the authored branches, with one continuous floor and roof at
 * junctions. Positive clearance is inside; no wall closes an overlapping hall. */
export function basinCaveField(x,y,platformId){
 let best=null,insideFloor=Infinity,insideRoof=-Infinity;
 for(const cave of BASIN_CAVES){
  if(platformId&&cave.platformId!==platformId)continue;
  const dx=x-cave.x,dy=y-cave.y,distance=dx*cave.nx+dy*cave.ny,s=clamp(distance/cave.length);
  const station=basinCaveStation(cave,s);
  const drift=Math.sin(distance*.005)*55*Math.sin(s*Math.PI)*clamp(distance/300);
  const lateral=-dx*cave.ny+dy*cave.nx-drift;
  const clearance=Math.min(station.width-Math.abs(lateral),distance+BASIN_CAVE_MOUTH_REACH,cave.length-distance);
  const dry=clamp((distance-230)/140),edge=clamp(1-(station.width-Math.abs(lateral))/45);
  const floor=station.floor+dry*(Math.sin(x*.013)*Math.sin(y*.009)*2+edge*edge*3);
  const ceiling=station.ceiling+dry*(Math.sin(x*.018+y*.011)*6+Math.sin(x*.035-y*.017)*3-32*(Math.min(1,Math.abs(lateral)/station.width))**2);
  const section={cave,s,lateral,width:station.width,floor,ceiling,clearance};
  if(!best||clearance>best.clearance)best=section;
  if(clearance>0){insideFloor=Math.min(insideFloor,floor);insideRoof=Math.max(insideRoof,ceiling);}
 }
 if(best&&insideFloor<Infinity){best.floor=insideFloor;best.ceiling=insideRoof;}
 return best;
}


export const BASIN_CAVE_GRID=30;
const meshNodes=new Map();
/** A shared triangle sample prevents collision and the glacier opening from
 * disagreeing with the rendered floor/walls at the boundary of a grid cell. */
export function basinCaveMeshNode(x,y,platformId){
 const key=`${platformId}:${x}:${y}`;let node=meshNodes.get(key);
 if(!node){node=Object.freeze(basinCaveField(x,y,platformId));meshNodes.set(key,node);}
 return node;
}
export function basinCaveMeshField(x,y,platformId){
 const center=basinCaveField(x,y,platformId);if(!center)return null;
 platformId??=center.cave.platformId;
 const x0=Math.floor(x/BASIN_CAVE_GRID)*BASIN_CAVE_GRID,y0=Math.floor(y/BASIN_CAVE_GRID)*BASIN_CAVE_GRID;
 const u=(x-x0)/BASIN_CAVE_GRID,v=(y-y0)/BASIN_CAVE_GRID;
 const a=basinCaveMeshNode(x0,y0,platformId),c=basinCaveMeshNode(x0+BASIN_CAVE_GRID,y0+BASIN_CAVE_GRID,platformId);
 const b=u>=v?basinCaveMeshNode(x0+BASIN_CAVE_GRID,y0,platformId):basinCaveMeshNode(x0,y0+BASIN_CAVE_GRID,platformId);
 const weights=u>=v?[1-u,u-v,v]:[1-v,v-u,u];
 const result={...center};for(const key of['floor','ceiling','clearance'])result[key]=a[key]*weights[0]+b[key]*weights[1]+c[key]*weights[2];
 return result;
}
export function basinCaveVolumeClearance(x,y,z,platformId){
 const field=basinCaveMeshField(x,y,platformId);
 return field?Math.min(field.clearance,z-field.floor,field.ceiling-z):-Infinity;
}

export function basinCaveSection(cave,x,y){
 const section=basinCaveMeshField(x,y,cave.platformId);return section?.clearance>0?section:null;
}

export function getBasinCave(x,y,z,height=0,radius=0){
 if(y> -1000||x>1000)return null;
 const section=basinCaveMeshField(x,y);
 if(!section||section.clearance<=0||z<section.floor-.02||z+height>section.ceiling)return null;
 if(radius&&[[radius,0],[-radius,0],[0,radius],[0,-radius]].some(([dx,dy])=>{
  const edge=basinCaveMeshField(x+dx,y+dy,section.cave.platformId);
  const mouthDistance=(x+dx-section.cave.x)*section.cave.nx+(y+dy-section.cave.y)*section.cave.ny+BASIN_CAVE_MOUTH_REACH;
  const openMouth=mouthDistance<0&&mouthDistance> -radius*2&&Math.abs(-(x+dx-section.cave.x)*section.cave.ny+(y+dy-section.cave.y)*section.cave.nx)<section.width-radius;
  return !openMouth&&(!edge||edge.clearance<=0||z<edge.floor-radius||z+height>edge.ceiling);
 }))return null;
 return section;
}

export function basinCaveBarrier(x,y,z,height=EYE_HEIGHT,radius=5){
 if(getBasinCave(x,y,z,height,radius))return null;
 const section=basinCaveMeshField(x,y);
 if(section&&(x-section.cave.x)*section.cave.nx+(y-section.cave.y)*section.cave.ny< -BASIN_CAVE_MOUTH_REACH)return null;
 return section&&section.clearance> -radius&&z<section.ceiling+7&&z+height>section.floor-7?section.cave:null;
}

export function basinWaterLevel(player){
 return getSaltCave(player.x,player.y,player.z)?.waterLevel??getBasinCave(player.x,player.y,player.z+EYE_HEIGHT)?.cave.waterLevel??WATER_LEVEL;
}
export const playerIsUnderwater=player=>Boolean(player.swimming&&player.z+EYE_HEIGHT<basinWaterLevel(player));
const solidIce=(world,p)=>[...world.platforms,...world.submergedIce??[]]
 .some(ice=>pointInPolygon(getIceSection(ice,p.z+EYE_HEIGHT),p.x,p.y));

/** Normal swimming reaches the flush opening; inside, this handles the sloping
 * shore and walking in the entire union, including every shared junction. */
export function stepBasinCavePlayer(world,input,dx,dy,dt){
 const p=world.player;
 if(p.y> -1000||p.x>1000){delete p.basinCaveId;return false;}
 let current=getBasinCave(p.x,p.y,p.z,EYE_HEIGHT,2);
 // Previous expeditions used a level shelf a few centimetres below the new
 // uneven floor. Seat those dry saves on the supported floor before walking.
 if(!current&&!p.swimming){
  const q=basinCaveMeshField(p.x,p.y);
  if(q?.clearance>12&&q.floor>p.z&&q.floor-p.z<20&&q.ceiling-q.floor>EYE_HEIGHT+3){
   p.z=q.floor;current=getBasinCave(p.x,p.y,p.z,EYE_HEIGHT,2);
  }
 }
 if(!current){delete p.basinCaveId;return false;}
 const cave=current.cave,surface=cave.waterLevel-EYE_HEIGHT+9;
 const swimming=current.floor<surface-1&&p.z<surface+2;
 const vertical=Math.max(-1,Math.min(1,(input.swimVertical??0)+(input.ascend||input.jump?1:0)-(input.dive?1:0)));
 const candidate={x:p.x+dx*(swimming?110:150)*dt,y:p.y+dy*(swimming?110:150)*dt,z:p.z};
 const proposed=basinCaveSection(cave,candidate.x,candidate.y);
 if(proposed){
  candidate.z=swimming?Math.max(proposed.floor,Math.min(surface,p.z+vertical*90*dt)):proposed.floor;
  if(proposed.floor>=surface-1)candidate.z=proposed.floor;
  candidate.z=Math.min(candidate.z,proposed.ceiling-EYE_HEIGHT-3);
 }else candidate.z=p.z+vertical*90*dt;
 const clear=point=>Boolean(getBasinCave(point.x,point.y,point.z,EYE_HEIGHT,5))||
  !basinCaveSection(cave,point.x,point.y)&&!solidIce(world,point);
 if(!clear(candidate)){
  let lo=0,hi=1;for(let i=0;i<16;i++){const t=(lo+hi)/2,q={x:mix(p.x,candidate.x,t),y:mix(p.y,candidate.y,t),z:mix(p.z,candidate.z,t)};if(clear(q))lo=t;else hi=t;}
  candidate.x=mix(p.x,candidate.x,lo);candidate.y=mix(p.y,candidate.y,lo);candidate.z=mix(p.z,candidate.z,lo);
 }
 Object.assign(p,candidate,{jumping:false,falling:false,fallVelocity:0,jumpTime:0});delete p.jumpBaseZ;
 if(dx||dy)p.heading=Math.atan2(dy,dx);world.lastJumpInput=Boolean(input.jump);
 const section=getBasinCave(p.x,p.y,p.z,EYE_HEIGHT,1);
 p.swimming=!section||section.floor<surface-1&&p.z<surface+2;
 if(section)p.basinCaveId=section.cave.id;else delete p.basinCaveId;
 p.underwater=playerIsUnderwater(p);p.wetTime+=dt;
 return true;
}
