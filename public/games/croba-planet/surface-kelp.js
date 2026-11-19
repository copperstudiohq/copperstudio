import * as THREE from './vendor/three.module.js';
import {PlantMesh,plantRandom} from './plant-mesh.js';
import {createBotanicalMaterial} from './plant-renderer.js';

export const SURFACE_KELP_WIND=.22;
export const SURFACE_KELP_TIP_GAP=3; // Simulation units: twelve centimetres.
const HEIGHT=32,TAU=Math.PI*2;

/** Canonical metre-scale stipes with short separate fronds at uneven nodes.
 * Only the stem spacing spans the water column; individual leaves stay compact
 * instead of turning into thirty-metre blades under nonuniform instance scale.
 * @param {number} [variant] @param {boolean} [detail]
 */
export function surfaceKelpGeometry(variant=0,detail=true){
 const mesh=new PlantMesh(),point=(x,y,z)=>new THREE.Vector3(x,y,z);
 const base=new THREE.Color(0x184d75),tip=new THREE.Color(0x67b0ce),tint=new THREE.Color();
 const stems=3,segments=detail?14:6,levels=detail?24:12,frondSections=[];let bladderNodes=0;
 // Six-point, eight-face bladders retain a closed round-volume silhouette at
 // distance, without adding a draw or hundreds of tiny far-detail triangles.
 const bladder=(center,radius)=>{
  const start=mesh.positions.length/3,color=new THREE.Color(0x629daf);
  for(const[x,y,z]of[[0,1.25,0],[1,0,0],[0,0,1],[-1,0,0],[0,0,-1],[0,-1.25,0]]){
   mesh.positions.push(center.x+x*radius,center.y+y*radius,center.z+z*radius);
   mesh.colors.push(color.r,color.g,color.b);mesh.uvs.push(x*.5+.5,y*.4+.5);mesh.glow.push(0);
  }
  for(const[a,b,c]of[[0,2,1],[0,3,2],[0,4,3],[0,1,4],[5,1,2],[5,2,3],[5,3,4],[5,4,1]])
   mesh.indices.push(start+a,start+b,start+c);
  bladderNodes++;
 };
 for(let root=0;root<(detail?6:5);root++){
  const angle=root*2.39996+variant;
  mesh.tube([point(0,.04,0),point(Math.cos(angle)*.17,.015,Math.sin(angle)*.17),point(Math.cos(angle)*.35,0,Math.sin(angle)*.35)],
   [.035,.022,.002],0x285772,detail?5:4);
 }
 for(let stem=0;stem<stems;stem++){
  // Independent stem seeds keep the near/far trunks aligned even though
  // nearby plants carry twice as many growth nodes and fronds.
  const random=plantRandom(0x51face+variant*919+stem*7349);
  const phase=random()*TAU,height=HEIGHT-(stem===0?0:random()*.45),offset=(stem-1)*.11;
  const at=f=>point(offset+Math.sin(f*4.1+phase)*.23*f,f*height+.025,
   Math.cos(f*3.6+phase)*.25*f);
  const path=Array.from({length:segments+1},(_,i)=>at(i/segments));
  const stemUV=mesh.uvs.length;
  mesh.tube(path,path.map((_,i)=>.068*(1-i/segments*.65)),0x28638a,detail?6:4);
  for(let i=stemUV+1;i<mesh.uvs.length;i+=2)mesh.uvs[i]*=height/2;
  for(let level=0;level<levels;level++){
   const fraction=.045+level/(levels-1)*.94+(level&&level<levels-1?(random()-.5)*.013:0),root=at(fraction);
   const angle=phase+level*2.39996+stem*.7+(random()-.5)*.42,length=.61+random()*.25;
   const end=root.clone().add(point(Math.cos(angle)*length,-.045-random()*.10,Math.sin(angle)*length));
   const axis=end.clone().sub(root),across=point(-axis.z,0,axis.x).normalize(),normal=new THREE.Vector3().crossVectors(across,axis).normalize();
   const width=.13+random()*.075,wave=phase+level*.79;
   const start=mesh.positions.length/3;
   mesh.grid(detail?4:3,detail?4:2,(u,v)=>{
    const cross=v*2-1,envelope=Math.sin(u*Math.PI)**.76;
    const edge=1+.13*Math.sin(u*TAU*2.3+wave)*Math.abs(cross)**3;
    return root.clone().addScaledVector(axis,u)
     .addScaledVector(across,cross*width*envelope*edge+.028*Math.sin(u*TAU+wave)*envelope)
     .addScaledVector(normal,envelope*(.035+.038*(1-Math.abs(cross))**3
      +width*.19*cross*cross+.027*cross*Math.sin(u*TAU+wave)));
   },(u,v)=>{
    const midrib=Math.exp(-(((v-.5)/.10)**2)),veins=Math.sin(u*40+Math.abs(v-.5)*11+wave)**2;
    tint.copy(base).lerp(tip,.18+u*.64).multiplyScalar(.89+.07*midrib+.04*veins);return tint.getHex();
   });
   frondSections.push({start,count:mesh.positions.length/3-start});
   if(level%3===2)bladder(root.clone().add(point(Math.cos(angle)*.052,.018,Math.sin(angle)*.052)),.053);
  }
  const crown=at(.992);
  mesh.ellipsoid(crown,new THREE.Vector3(.060,.075,.060),0x66a8be,{segments:detail?6:4,rings:detail?4:2});
 }
 const geometry=mesh.geometry();geometry.name=`surface-blue-kelp-${variant}-${detail?'high':'low'}`;
 geometry.userData={surfaceKelp:true,stipes:stems,fronds:stems*levels,frondSections,canonicalHeightMeters:HEIGHT,
  bladderNodes,raisedMidribs:true,wavyFrondEdges:true,irregularNodes:true};
 return geometry;
}

/** The fade follows the whole upright column, matching CPU volume selection.
 * A surface swimmer remains near a canopy even when its root is forty metres
 * below. Current motion stays horizontal, so tips never pierce the water plane.
 */
export function surfaceKelpMaterial(maps,clock,far){
 const material=createBotanicalMaterial({id:'surface-blue-kelp',biome:'arctic'},maps,clock,far);
 const compile=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=function(shader,renderer){
  compile.call(this,shader,renderer);shader.uniforms.botanicalWind.value=SURFACE_KELP_WIND;
  const marker='vBotanicalFade=1.-smoothstep(botanicalFar-5.,botanicalFar,distance(cameraPosition,botanicalRoot.xyz));';
  if(!shader.vertexShader.includes(marker))throw new Error('Surface kelp requires the botanical column fade shader.');
  shader.vertexShader=shader.vertexShader.replace(marker,`
    float kelpHeight=0.,kelpRadius=0.;
    #ifdef USE_INSTANCING
      kelpHeight=length((modelMatrix*vec4(instanceMatrix[1].xyz,0.)).xyz);
      kelpRadius=max(length(instanceMatrix[0].xyz),length(instanceMatrix[2].xyz))*1.6;
    #endif
    vec3 kelpNearest=vec3(botanicalRoot.x,clamp(cameraPosition.y,botanicalRoot.y,botanicalRoot.y+kelpHeight),botanicalRoot.z);
    float kelpDistance=max(0.,distance(cameraPosition,kelpNearest)-kelpRadius);
    vBotanicalFade=1.-smoothstep(botanicalFar-5.,botanicalFar,kelpDistance);`);
 };
 material.customProgramCacheKey=()=>key()+'|surface-kelp-column-v1';return material;
}
