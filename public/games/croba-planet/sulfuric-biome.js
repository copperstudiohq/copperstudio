import {getSaltCave} from './salt-cave.js';
import {WORLD_BOUNDS,EYE_HEIGHT} from './terrain.js';
import {SULFURIC_GRID as GRID,SULFURIC_HEIGHTS,SULFURIC_VENTS} from './sulfuric-biome-data.js';

export const SULFURIC_LAND=Object.freeze({id:'sulfuric-land',name:'Sulfuric Land',...GRID});
export const SULFURIC_PASSAGE=Object.freeze({x:6100,halfWidth:150,floor:-85,ceiling:150,frontY:-11300,innerY:-11300,outerY:-11480});
/** Counter-clockwise arch cross-section in local X / absolute feet height. */
export const SULFURIC_ARCH=Object.freeze([[-150,-85],[150,-85],[150,50],[128,98],[80,135],[0,150],[-80,135],[-128,98],[-150,50]].map(p=>Object.freeze(p)));
export const SULFURIC_MAP_BOUNDS=Object.freeze({...WORLD_BOUNDS,minY:GRID.minY});
const heights=new Float32Array(SULFURIC_HEIGHTS);
if(heights.length!==GRID.columns*GRID.rows||!heights.every(Number.isFinite))throw new Error('Sulfuric terrain needs finite heights matching the prepared grid.');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

export function isSulfuricLand(x,y){return Number.isFinite(x)&&Number.isFinite(y)&&x>=GRID.minX&&x<=GRID.maxX&&y>=GRID.minY&&y<=GRID.maxY;}

/** Exact barycentric height on the same baked triangles used by the renderer. */
export function getSulfuricGround(x,y){
  const p=SULFURIC_PASSAGE;
  if(y>=p.outerY&&y<=p.innerY&&Math.abs(x-p.x)<=p.halfWidth)return getSulfuricPassageFloor(x,y);
  return terrainHeight(x,y);
}

function terrainHeight(x,y){
  if(!isSulfuricLand(x,y))return null;
  const gx=(x-GRID.minX)/GRID.step,gy=(y-GRID.minY)/GRID.step;
  const c=Math.min(GRID.columns-2,Math.floor(gx)),r=Math.min(GRID.rows-2,Math.floor(gy)),u=gx-c,v=gy-r,i=r*GRID.columns+c;
  const a=heights[i],b=heights[i+1],c1=heights[i+GRID.columns],d=heights[i+GRID.columns+1];
  return u+v<=1?a+(b-a)*u+(c1-a)*v:d+(c1-d)*(1-u)+(b-d)*(1-v);
}

/** The same 6-by-10 triangles form the passage floor and its collision surface.
 * The ocean end stops flush at the cliff; the land end meets every baked vertex. */
export function getSulfuricPassageFloor(x,y){
  const p=SULFURIC_PASSAGE,gx=clamp((x-(p.x-p.halfWidth))/50,0,6),gy=clamp((p.innerY-y)/(p.innerY-p.outerY)*10,0,10);
  const c=Math.min(5,Math.floor(gx)),r=Math.min(9,Math.floor(gy)),u=gx-c,v=gy-r;
  const node=(column,row)=>{
    const t=row/10,land=terrainHeight(p.x-p.halfWidth+column*50,p.outerY);
    return p.floor+(land-p.floor)*t*t*(3-2*t);
  };
  const a=node(c,r),b=node(c+1,r),c1=node(c,r+1),d=node(c+1,r+1);
  return u+v<=1?a+(b-a)*u+(c1-a)*v:d+(c1-d)*(1-u)+(b-d)*(1-v);
}

/** Width decreases beneath the arch crown; a full player capsule must fit. */
export function sulfuricPassageWidth(top){
  if(!Number.isFinite(top)||top>SULFURIC_PASSAGE.ceiling)return -1;
  if(top<=50)return 150;
  const levels=[[50,150],[98,128],[135,80],[150,0]];
  for(let i=1;i<levels.length;i++)if(top<=levels[i][0]){
    const [a,aw]=levels[i-1],[b,bw]=levels[i];return aw+(bw-aw)*(top-a)/(b-a);
  }
  return 0;
}

/** Closest point in the union of the original map, real arch and new land.
 * Keeping WORLD_BOUNDS fixed preserves all authored wildlife territories. */
export function confineSulfuricWorld(player,radius=5){
  if(![player?.x,player?.y,player?.z,radius].every(Number.isFinite)||radius<0)return false;
  if(getSaltCave(player.x,player.y,player.z,EYE_HEIGHT,radius))return false;
  let bestX=clamp(player.x,WORLD_BOUNDS.minX+radius,WORLD_BOUNDS.maxX-radius);
  let bestY=clamp(player.y,WORLD_BOUNDS.minY+radius,WORLD_BOUNDS.maxY-radius);
  let distance=(bestX-player.x)**2+(bestY-player.y)**2;
  const consider=(minX,maxX,minY,maxY)=>{
    const x=clamp(player.x,minX,maxX),y=clamp(player.y,minY,maxY),d=(x-player.x)**2+(y-player.y)**2;
    if(d<distance){bestX=x;bestY=y;distance=d;}
  };
  consider(GRID.minX+radius,GRID.maxX-radius,GRID.minY+radius,GRID.maxY-radius);
  const width=sulfuricPassageWidth(player.z+EYE_HEIGHT+radius)-radius;
  if(width>=0&&player.z>=getSulfuricPassageFloor(player.x,player.y)-.001)
    consider(SULFURIC_PASSAGE.x-width,SULFURIC_PASSAGE.x+width,GRID.maxY-radius,WORLD_BOUNDS.minY+radius);
  player.x=bestX;player.y=bestY;return distance>1e-12;
}

/** Save validation shares the playable union, with no player-radius inset. */
export function isSulfuricWorldPosition(player,radius=0){
  if(![player?.x,player?.y,player?.z].every(Number.isFinite))return false;
  const copy={x:player.x,y:player.y,z:player.z};return !confineSulfuricWorld(copy,radius);
}

/** Fixed basalt fumaroles are solid at their visible bases. */
export function resolveSulfuricRocks(player,radius=5){
  if(!isSulfuricLand(player?.x,player?.y))return;
  for(const [x,y,size]of SULFURIC_VENTS){
    const ground=getSulfuricGround(x,y),reach=1.2*size*25+radius;
    if(player.z>=ground+size*50||player.z+EYE_HEIGHT<ground)continue;
    const dx=player.x-x,dy=player.y-y,length=Math.hypot(dx,dy);
    if(length>=reach)continue;
    player.x=x+(length?dx/length:1)*(reach+.01);player.y=y+(length?dy/length:0)*(reach+.01);
  }
  if(!player.swimming&&!player.jumping&&!player.falling)player.z=getSulfuricGround(player.x,player.y)??player.z;
}

export function createSulfuricTerrainData(){
  const positions=new Float32Array(heights.length*3),indices=[];
  for(let r=0;r<GRID.rows;r++)for(let c=0;c<GRID.columns;c++){
    const i=r*GRID.columns+c;positions.set([(GRID.minX+c*GRID.step)/25,heights[i]/25,(GRID.minY+r*GRID.step)/25],i*3);
    if(r<GRID.rows-1&&c<GRID.columns-1)indices.push(i,i+GRID.columns,i+1,i+1,i+GRID.columns,i+GRID.columns+1);
  }
  return {positions,indices:new Uint16Array(indices)};
}
