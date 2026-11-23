import * as THREE from './vendor/three.module.js';
import { CLIFF_SAND_CRACKS } from './cliff-sand-cracks.js';
import { CLIFF_CANYON_GRID } from './cliff-canyon-data.js';
import { KELP_SEABED_PATCHES } from './biome-seabed-data.js';
import { WATER_LEVEL } from './terrain.js';

const smooth = (a,b,value) => { const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t); };
const contains = (grid,x,y) => x>=grid.minX&&x<=grid.maxX&&y>=grid.minY&&y<=grid.maxY;
const FIELDS = Object.freeze([
  { grid:CLIFF_CANYON_GRID, cracks:CLIFF_SAND_CRACKS.map((path,index)=>({path,width:48+index%4*5})) },
  ...KELP_SEABED_PATCHES.map(patch=>({grid:patch.grid,cracks:patch.cracks})),
]);

function pathDistance(x,y,path) {
  let nearest=Infinity;
  for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i],dx=b[0]-a[0],dy=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
    nearest=Math.min(nearest,Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t));
  }
  return nearest;
}

/** Fixed authored crack influence in simulation X/Y; never changes terrain. */
export function canyonSurfaceAt(x,y) {
  if(!Number.isFinite(x)||!Number.isFinite(y))throw new TypeError('Canyon surface coordinates must be finite.');
  let blend=0,recess=0;
  for(const field of FIELDS){
    if(!contains(field.grid,x,y))continue;
    for(const crack of field.cracks){
      const fraction=pathDistance(x,y,crack.path)/crack.width;
      blend=Math.max(blend,1-smooth(.87,1.42,fraction));
      recess=Math.max(recess,1-smooth(.12,1.02,fraction));
    }
  }
  return {blend,recess};
}

/** Two normalized bytes per existing vertex isolate the authored underwater
 * canyons. Positions, normals, UVs, index/group membership and collision stay intact.
 */
export function addCanyonSurfaceMask(geometry) {
  const position=geometry?.attributes?.position;
  if(!geometry?.isBufferGeometry||!position||position.itemSize!==3)
    throw new TypeError('Canyon finish needs an existing XYZ BufferGeometry.');
  const blend=new Uint8Array(position.count),recess=new Uint8Array(position.count);
  for(let i=0;i<position.count;i++){
    const site=canyonSurfaceAt(position.getX(i)*25,position.getZ(i)*25);
    blend[i]=Math.round(site.blend*255);recess[i]=Math.round(site.recess*255);
  }
  geometry.setAttribute('canyonBlend',new THREE.BufferAttribute(blend,1,true));
  geometry.setAttribute('canyonRecess',new THREE.BufferAttribute(recess,1,true));
  return geometry;
}

/** CPU equivalent of the shader's final mask, useful for placement/QA checks.
 * normalY and worldY use renderer Y-up metres. */
export function canyonRockCoverage(normalY,blend,worldY) {
  if(![normalY,blend,worldY].every(Number.isFinite))throw new TypeError('Canyon coverage inputs must be finite.');
  return Math.max(0,Math.min(1,blend))*smooth(.18,.65,1-Math.abs(normalY))
    *(1-smooth(WATER_LEVEL/25-.1,WATER_LEVEL/25+.1,worldY));
}

const DECLARATIONS = `
varying vec3 vCanyonWorld;
varying vec2 vCanyonMask;
float canyonHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float canyonNoise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(canyonHash(i),canyonHash(i+vec2(1.,0.)),f.x),
    mix(canyonHash(i+vec2(0.,1.)),canyonHash(i+vec2(1.)),f.x),f.y);
}
`;

/** Subtle weathering enhances the existing canyon-wall textures and palette.
 * Scalar mineral/crevice shading and additive normal relief share the existing
 * draw. Flat canyon bottoms retain their exact caller-supplied sand finish.
 */
export function applyCanyonRockSurface(material) {
  if(!material?.isMeshStandardMaterial)return material;
  if(material.userData.canyonRockSurface)return material;
  const previous=material.onBeforeCompile.bind(material),cache=material.customProgramCacheKey.bind(material);
  material.onBeforeCompile=shader=>{
    previous(shader);
    shader.vertexShader=`attribute float canyonBlend;attribute float canyonRecess;
      varying vec3 vCanyonWorld;varying vec2 vCanyonMask;\n${shader.vertexShader}`
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        vec4 canyonPosition=vec4(transformed,1.);
        #ifdef USE_INSTANCING
          canyonPosition=instanceMatrix*canyonPosition;
        #endif
        vCanyonWorld=(modelMatrix*canyonPosition).xyz;
        vCanyonMask=vec2(canyonBlend,canyonRecess);`);
    shader.fragmentShader=`${DECLARATIONS}\n${shader.fragmentShader}`
      // Enhance the completed base texture and normals before physical lighting.
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        vec3 canyonDx=dFdx(vCanyonWorld),canyonDy=dFdy(vCanyonWorld);
        vec3 canyonGeom=normalize(cross(canyonDx,canyonDy));
        float canyonWall=smoothstep(.18,.65,1.-abs(canyonGeom.y));
        float canyonWet=1.-smoothstep(${(WATER_LEVEL/25-.1).toFixed(4)},${(WATER_LEVEL/25+.1).toFixed(4)},vCanyonWorld.y);
        float canyonAmount=clamp(vCanyonMask.x,0.,1.)*canyonWall*canyonWet;
        float canyonHeight=0.;
        if(canyonAmount>.001){
        float canyonMacro=canyonNoise(vCanyonWorld.xz*.43+vCanyonWorld.y*.11);
        vec2 canyonUV=vec2(vCanyonWorld.x+vCanyonWorld.z*.73,vCanyonWorld.y);
        float canyonMeso=canyonNoise(canyonUV*3.7+vec2(canyonMacro*.65));
        float canyonFootprint=max(length(canyonDx),length(canyonDy));
        float canyonFine=.5+(canyonNoise(canyonUV*24.)-.5)*(1.-smoothstep(.025,.10,canyonFootprint));
        float canyonLayer=abs(sin(vCanyonWorld.y*13.5+canyonMacro*3.2+canyonNoise(vCanyonWorld.xz*1.8)*.8));
        float canyonSeam=(1.-smoothstep(.03,.19,canyonLayer))*(.35+canyonMeso*.65)*(1.-smoothstep(.08,.32,canyonFootprint));
        float canyonPores=1.-smoothstep(.17,.29,canyonFine);
        float canyonShade=1.+(canyonMacro-.5)*.12+(canyonMeso-.5)*.08
          -canyonSeam*.08-canyonPores*.025-clamp(vCanyonMask.y,0.,1.)*.045;
        diffuseColor.rgb*=mix(1.,canyonShade,canyonAmount);
        roughnessFactor=mix(roughnessFactor,.96,canyonAmount);
        canyonHeight=(canyonMeso*.014+canyonFine*.0035-canyonSeam*.012-canyonPores*.004)*canyonAmount;
        }
        // Every fragment in a derivative quad supplies a height, including the
        // zero-height exterior. Expensive mineral noise remains mask-bounded.
        vec3 canyonViewGeom=normalize(mat3(viewMatrix)*canyonGeom);
        canyonGeom*=dot(canyonViewGeom,normal)<0.?-1.:1.;
        vec3 canyonR1=cross(canyonDy,canyonGeom),canyonR2=cross(canyonGeom,canyonDx);
        float canyonDet=dot(canyonDx,canyonR1);
        vec3 canyonGradient=sign(canyonDet)*(dFdx(canyonHeight)*canyonR1+dFdy(canyonHeight)*canyonR2)/max(abs(canyonDet),.00001);
        normal=normalize(normal-mat3(viewMatrix)*canyonGradient*canyonAmount);`);
  };
  material.customProgramCacheKey=()=>`${cache()}|reef-canyon-rock-v213-original-textures`;
  material.userData.canyonRockSurface=true;
  material.needsUpdate=true;return material;
}
