import * as THREE from './vendor/three.module.js';
import {MAIN_COLLAR_CELLS,SULFUR_COLLAR_CELLS} from './world-perimeter-data.js';
import {getSeabedHeight} from './seabed.js';
import {getSulfuricGround,SULFURIC_LAND} from './sulfuric-biome.js';

/** Fixed fifty-unit collar cells continue the nearest prepared edge vertices.
 * No map placement or new height field is generated while loading. Cells
 * extend beneath the outward wall thickness, preventing exposed floor cracks. */
export function createPerimeterGround(region){
 const cells=region==='main'?MAIN_COLLAR_CELLS:region==='sulfur'?SULFUR_COLLAR_CELLS:null;
 if(!cells)throw new TypeError('Perimeter ground needs a known region.');
 const positions=[],colors=[],uvs=[],tint=new THREE.Color(),land=SULFURIC_LAND;
 const height=(x,y)=>region==='main'?getSeabedHeight(x,y):getSulfuricGround(Math.max(land.minX,Math.min(land.maxX,x)),Math.max(land.minY,Math.min(land.maxY,y)));
 const emit=(x,y)=>{
  const z=height(x,y);positions.push(x/25,z/25,y/25);uvs.push(x/100,y/100);
  if(region==='main')tint.setHex(0xf2e6cf);
  else{
   const vein=.5+.5*Math.sin(x/130+Math.sin(y/180)*2.3),basalt=THREE.MathUtils.smoothstep(vein,.64,.86);
   tint.setHex(0xc8af43).lerp(new THREE.Color(0xca824e),basalt*.93).multiplyScalar(.86+.10*Math.sin(x/38)*Math.cos(y/43)+Math.min(.2,z/1800));
  }
  colors.push(tint.r,tint.g,tint.b);
 };
 for(const[x,y]of cells)for(const[dx,dy]of[[0,0],[0,50],[50,0],[50,0],[0,50],[50,50]])emit(x+dx,y+dy);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.userData={prepared:true,region,cells:cells.length,step:50};return geometry;
}
