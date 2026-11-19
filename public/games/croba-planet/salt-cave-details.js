import * as THREE from './vendor/three.module.js';
import {saltCaveSection} from './salt-cave.js';

const MOUTH_Y=-11298,MOUTH_X=5150,MOUTH_WIDTH=130;

/** Only the cliff mouth receives exterior rock framing. The cave shell and
 * original geyser pond supply their own natural stone without added strips. */
export function createSaltCaveDetailsGeometry(){
 const positions=[],colors=[],uvs=[],color=new THREE.Color();
 const emit=(a,b,c,hex,grain=1)=>{
  color.setHex(hex).multiplyScalar(grain);
  for(const p of[a,b,c]){
   positions.push(p[0]/25,p[2]/25,p[1]/25);colors.push(color.r,color.g,color.b);
   uvs.push(p[0]/85,(p[1]+p[2])/85);
  }
 };
 const quad=(a,b,c,d,hex,grain=1)=>{emit(a,b,c,hex,grain);emit(b,d,c,hex,grain);};

 // The inner bevel follows the actual floor and roof, not a second analytic
 // arch. Its two-unit stone-side inset covers the cliff cut's small grid seam.
 const profile=[];
 for(const kind of['floor','roof'])for(let i=0;i<=32;i++){
  const x=MOUTH_X-MOUTH_WIDTH+(kind==='floor'?i:32-i)/32*MOUTH_WIDTH*2;
  const q=saltCaveSection(x,MOUTH_Y);profile.push({x,z:q[kind],kind});
 }
 const outward=profile.map((p,i)=>{
  const a=profile[(i+profile.length-1)%profile.length],b=profile[(i+1)%profile.length];
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);return[dz/length,-dx/length];
 });
 const collars=[
  {offset:2,y:-11320,color:0xc9bba3},{offset:2,y:-11296,color:0xdbcfbb},
  {offset:9,y:-11294,color:0xe7ddcd},{offset:22,y:-11296,color:0xf1eadf},
  {offset:46,y:-11300,color:0xfaf7f1},{offset:76,y:-11310,color:0xffffff},
 ];
 const mouthRing=(layer,index)=>profile.map((p,i)=>{
  const [nx,nz]=outward[i],rough=index<2?0:layer.offset*(Math.sin(i*.31)*.18+Math.sin(i*.79)*.08);
  const distance=layer.offset+rough,x=p.x+nx*distance,y=layer.y+Math.sin(i*.41)*(index<2?.3:2);
  const source=saltCaveSection(p.x,y),q=saltCaveSection(x,y);
  let z=source[p.kind]+nz*distance;
  if(q?.clearance>=0)z=p.kind==='roof'?Math.max(z,q.roof+2):Math.min(z,q.floor-2);
  return[x,y,z];
 });
 const mouth=collars.map(mouthRing);
 for(let ring=1;ring<mouth.length;ring++)for(let i=0;i<profile.length;i++){
  const next=(i+1)%profile.length;
  quad(mouth[ring-1][i],mouth[ring-1][next],mouth[ring][i],mouth[ring][next],collars[ring].color);
 }
 const mouthVertexCount=positions.length/3;

 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.computeVertexNormals();geometry.computeBoundingSphere();
 geometry.userData.saltCaveDetails=true;geometry.userData.mouthVertexCount=mouthVertexCount;
 return geometry;
}
