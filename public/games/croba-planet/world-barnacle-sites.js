import {getSeabedHeight} from './seabed.js';
import {getForestHeight} from './forest-terrain.js';
import {getIceSurfaceHeight,highestIceAt} from './ice-surface.js';
import {getSulfuricGround} from './sulfuric-biome.js';
import {getWorldBiome} from './biomes.js';
import {getIceSection,pointInPolygon,WATER_LEVEL} from './terrain.js';
import {PREPARED_SPIRE_BARNACLES} from './prepared-jelly-spires-life-data.js';
import {sampleJellyfishSpireSurface} from './jellyfish-spires.js';

/** Authored underwater colony centers. Individual shells use the fixed offset pattern,
 * not random generation; every new expedition receives the same colonies. */
const COLONIES=Object.freeze([
 ['arctic','seabed',-5347,7],['arctic','seabed',-5297,357],['arctic','seabed',-4917,77],
 ['blue-ocean','seabed',1523,-493],['blue-ocean','seabed',1543,-993],['blue-ocean','seabed',1503,-1593],
 ['blue-ocean','seabed',3800,-5500],['blue-ocean','seabed',6200,-5900],['blue-ocean','seabed',6800,-7200],
 ['shell-field','seabed',2493,-10023],['shell-field','seabed',3343,-8873],['shell-field','seabed',4203,-10343],
 ['blue-kelp-forest','seabed',-1497,-2593],['blue-kelp-forest','seabed',-2077,-2213],['blue-kelp-forest','seabed',-2997,-2193],
 ['orange-grass-field','seabed',-1077,787],['orange-grass-field','seabed',-2237,1227],['orange-grass-field','seabed',-777,1727],
 ['cliff-biome','seabed',-167,-103],['cliff-biome','seabed',83,167],['cliff-biome','seabed',333,-63],
].map(Object.freeze));
const OFFSETS=Object.freeze([[0,0],[-8,2],[8,-3],[-3,9],[5,-10],[-15,-5],[15,5],[-10,13],[13,-12],[-18,7],[18,-6],[-2,-17],[3,17]].map(Object.freeze));

/** Exact terrain or rock-face support, with surface normal in render axes (Y up).
 * Snow is drawn .006 metres above the physical ice top in Scene. */
export function getWorldBarnacleSurface(world,site){
 const {source,x,y}=site;
 if(!Number.isFinite(x)||!Number.isFinite(y))return null;
 if(source==='jelly-spire'){
  try{
   const p=sampleJellyfishSpireSurface(site.spireId,site.triangleIndex,site.u,site.v);
   if(Math.hypot(p.x-x,p.y-y)>.01)return null;
   return{z:p.z,normal:{x:p.normal.x,y:p.normal.z,z:p.normal.y}};
  }catch(error){if(error instanceof RangeError)return null;throw error;}
 }
 const ice=source==='ice'?(site.platformId?(world.platforms??[]).find(p=>p.id===site.platformId):highestIceAt(world.platforms??[],x,y)):null;
 const height=(x,y)=>source==='seabed'?getSeabedHeight(x,y):source==='forest'?getForestHeight(world,x,y):source==='sulfur'?getSulfuricGround(x,y):ice?getIceSurfaceHeight(ice,x,y)+.15:null;
 const z=height(x,y);if(!Number.isFinite(z))return null;
 const epsilon=.001,a=height(x+epsilon,y),b=height(x-epsilon,y),c=height(x,y+epsilon),d=height(x,y-epsilon);
 if(![a,b,c,d].every(Number.isFinite))return null;
 const nx=-(a-b)/(epsilon*2),nz=-(c-d)/(epsilon*2),length=Math.hypot(nx,1,nz);
 return{z,normal:{x:nx/length,y:1/length,z:nz/length}};
}
function coveredByIce(world,x,y,z){
 return(world.platforms??[]).some(p=>Math.abs(x-p.x)<p.rx+5&&Math.abs(y-p.y)<p.ry+5&&pointInPolygon(getIceSection(p,z+4),x,y));
}

export function createWorldBarnacleSites(world){
 const sites=[];
 const addColony=(biome,source,x,y,platformId=null)=>{
  if(source!=='seabed')return;
  for(const [j,[dx,dy]]of OFFSETS.entries()){
   const site={biome,source,x:x+dx,y:y+dy,...(platformId?{platformId}:{})},surface=getWorldBarnacleSurface(world,site);if(!surface||surface.normal.y<.3||surface.z>WATER_LEVEL-12)continue;
   if(source==='seabed'&&coveredByIce(world,site.x,site.y,surface.z))continue;
   const probe={...world,player:{x:site.x,y:site.y,z:surface.z}};
   if(getWorldBiome(probe,site.x,site.y,source==='seabed'&&surface.z<WATER_LEVEL)!==biome)continue;
   sites.push({...site,...surface,scale:.7+(j%4)*.16,angle:j*1.3+sites.length*.37});
  }
 };
 for(const [biome,source,x,y]of COLONIES)addColony(biome,source,x,y);
 for(const anchor of PREPARED_SPIRE_BARNACLES){
  const p=sampleJellyfishSpireSurface(anchor.spireId,anchor.triangleIndex,anchor.u,anchor.v);
  const site={...anchor,biome:'jellyfish-spires',source:'jelly-spire',x:p.x,y:p.y};
  const surface=getWorldBarnacleSurface(world,site);
  if(surface&&surface.z<=WATER_LEVEL-12)sites.push({...site,...surface});
 }
 return sites;
}
