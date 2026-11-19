import * as THREE from './vendor/three.module.js';

const WINDOW_WIDTH=4.65,WINDOW_LENGTH=3.2,COLUMNS=12,ROWS=8,SKY_BRIGHTNESS=.35;
const FIXTURE_X=Object.freeze([-2.8,2.8]),FIXTURE_Z=Object.freeze([-3.8,3.8]);
const SHADED_SURFACES=new Set(['interior','floor','metal']);
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};

/** Bake a quiet cabin and four broad light pools into local vertex colours.
 * Exterior markings and the sky/emissive surfaces keep their own brightness.
 * Call only for the Universal Base; other structures keep their materials.
 * @param {string} kind @param {number} x @param {number} y @param {number} z
 * @returns {number} Linear-RGB multiplier; one means the surface is unaffected.
 */
export function interiorSurfaceShade(kind,x,y,z){
 if(!SHADED_SURFACES.has(kind)||![x,y,z].every(Number.isFinite)
  ||Math.abs(x)>5.74||Math.abs(z)>7.93||y<0||y>4.51)return 1;
 let pools=0;
 for(const lightX of FIXTURE_X)for(const lightZ of FIXTURE_Z)
  pools+=Math.exp(-(((x-lightX)/2.4)**2+((z-lightZ)/2.6)**2));
 const height=clamp(y/4.5);
 return Math.min(.60,.16+pools*(.29+.08*height));
}

function roundedOutline(width,length,radius){
 const x=width/2,z=length/2,points=[];
 for(const [cx,cz,start]of[[x-radius,-z+radius,-Math.PI/2],[x-radius,z-radius,0],[-x+radius,z-radius,Math.PI/2],[-x+radius,-z+radius,Math.PI]])for(let i=0;i<=2;i++){
  const angle=start+i*Math.PI/4;points.push([cx+Math.cos(angle)*radius,cz+Math.sin(angle)*radius]);
 }
 return points;
}

/** The outer charcoal recess meets a broad white bevel and a softly recessed
 * inner edge. One shared vertex-color surface replaces separate trim boxes. */
function skyWindowFrame(){
 const positions=[],colors=[],indices=[];
 const profiles=[[5.08,3.63,.28,-.072,0x273840],[4.99,3.54,.26,-.118,0xf8faf5],
  [4.72,3.27,.21,-.118,0xfdfcf4],[4.65,3.20,.18,-.075,0xdce5e3]];
 for(const [width,length,radius,y,color]of profiles){
  const tint=new THREE.Color(color);for(const [x,z]of roundedOutline(width,length,radius)){positions.push(x,y,z);colors.push(tint.r,tint.g,tint.b);}
 }
 const count=12;
 for(let ring=0;ring<profiles.length-1;ring++)for(let i=0;i<count;i++){
  const next=(i+1)%count,a=ring*count+i,b=ring*count+next,c=a+count,d=b+count;indices.push(a,b,c,b,d,c);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.userData={framedSkyWindow:true,whiteBevel:true,charcoalRecess:true,widthMeters:5.08,lengthMeters:3.63};return geometry;
}

/** Original low-frequency cloud banks and a broad warm daylight hotspot are
 * baked into each flat pane. No image, noise texture or render pass is used. */
function skyPane(centerX,centerZ,index){
 const positions=[],colors=[],indices=[],blue=new THREE.Color(0x70c3ed),cloud=new THREE.Color(0xfffdf4),warm=new THREE.Color(0xffefce),tint=new THREE.Color();
 for(let row=0;row<=ROWS;row++)for(let column=0;column<=COLUMNS;column++){
  const u=column/COLUMNS,v=row/ROWS,x=(u-.5)*WINDOW_WIDTH,z=(v-.5)*WINDOW_LENGTH;
  const sx=centerX+x,sz=centerZ+z,bank=Math.sin(sx*.76+Math.cos(sz*.54)*1.35)+Math.cos(sx*1.32-sz*.71)*.57+Math.sin(sx*2.13+sz*1.06)*.24;
  const cloudCover=smooth((bank+.13)/1.56),cornerX=centerX<0?.12:.88;
  const daylight=Math.exp(-(((u-cornerX)/.37)**2+((v-.12)/.58)**2));
  tint.copy(blue).lerp(cloud,cloudCover*.94).lerp(warm,daylight*.58).multiplyScalar(SKY_BRIGHTNESS);
  positions.push(x,-.047,z);colors.push(tint.r,tint.g,tint.b);
  if(row<ROWS&&column<COLUMNS){const a=row*(COLUMNS+1)+column,b=a+1,c=a+COLUMNS+1,d=c+1;indices.push(a,b,c,b,d,c);}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.userData={simulatedSkyWindow:true,originalCloudColors:true,warmDaylightEdge:true,linearBrightness:SKY_BRIGHTNESS,window:index,widthMeters:WINDOW_WIDTH,lengthMeters:WINDOW_LENGTH};return geometry;
}

/** Add exactly four dimmed sky fixtures to the existing six material batches.
 * Each framed pane has one narrow emissive diffuser edge. The charcoal backing
 * and local surface shading darken the room without adding lights or passes.
 * @param {{add:Function,box:Function}} builder
 * @param {number} height Interior ceiling height, in render metres.
 */
export function addHabitatLighting(builder,height){
 if(typeof builder?.add!=='function'||typeof builder?.box!=='function'||!Number.isFinite(height)||height<1)throw new TypeError('Habitat lighting requires a mesh builder and a finite ceiling height.');
 builder.box('metal','recessed-charcoal-ceiling-backing',[0,height-.012,0],[11.35,.016,15.35],0x273740);
 let windows=0;
 for(const x of FIXTURE_X)for(const z of FIXTURE_Z){
  const index=++windows;builder.add('sky',`framed-earth-sky-window-${index}`,skyPane(x,z,index),[x,height,z]);
  builder.add('interior',`white-beveled-sky-window-frame-${index}`,skyWindowFrame(),[x,height,z]);
  for(const side of[-1,1])builder.box('metal','recessed-daylight-window-vent',[x,height-.033,z+side*1.85],[.58,.014,.048],0x142831);
  const diffuser=new THREE.BoxGeometry(2.6,.010,.028);
  diffuser.userData={interiorCeilingLight:true,fixture:index,integratedDiffuserEdge:true};
  builder.add('light',`sky-fixture-diffuser-edge-${index}`,diffuser,[x,height-.124,z+1.70],[0,0,0],0xc1d4df);
 }
 return{skyWindows:windows,interiorLightCount:windows,ceilingLightStrips:0,framedSkyWindows:true,
  centralCeilingDiffuser:false,dimmedInterior:true,linearSkyBrightness:SKY_BRIGHTNESS,
  skyWindowTriangles:768,skyFrameAndVentTriangles:396,fixtureDiffuserTriangles:48,ceilingLightingTriangles:1212};
}
