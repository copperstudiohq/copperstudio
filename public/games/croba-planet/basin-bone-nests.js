import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';
import {createCrabAnatomy,CRAB_PINCER_HINGES} from './crab-anatomy.js';

const v=(x,y,z)=>new THREE.Vector3(x,y,z);
const IVORY=new THREE.Color(0xd7d1b8),FRESH=new THREE.Color(0xf0ead3),STAIN=new THREE.Color(0x9b967e);
const tint=new THREE.Color();
const boneShade=(u,t=0)=>tint.copy(IVORY).lerp(STAIN,.16+.10*Math.sin(u*31+t*17)**2).getHex();

/** Organic cut-outs are actual holes through the cast bone wall. The small
 * unevenness belongs to a worn lip, rather than a perfectly machined torus. */
function boneOpening(x,y,rx,ry,phase=0,broken=false){
 const path=new THREE.Path(),points=[];
 for(let step=0;step<16;step++){
  const a=-step*Math.PI/8,wear=1+.045*Math.sin(a*3+phase)+.025*Math.sin(a*7-phase)
   +(broken?.12*Math.sin(a*5+phase):0);
  points.push(new THREE.Vector2(x+Math.cos(a)*rx*wear,y+Math.sin(a)*ry*wear));
 }
 path.setFromPoints(points);path.closePath();return path;
}

/** The side projection of a cranium. Its broken occipital edge and rounded
 * forehead define a real braincase; left/right shell halves share this rim. */
function braincaseShape(cy,cz,height,length,holes){
 const shape=new THREE.Shape(),contour=[];
 for(let step=0;step<36;step++){
  const a=step*Math.PI/18,damage=Math.cos(a)<-.45?.014*Math.sin(step*2.3):0;
  contour.push(new THREE.Vector2(cz+Math.cos(a)*(length+damage),cy+Math.sin(a)*(height+damage*.65)));
 }
 shape.setFromPoints(contour);shape.closePath();shape.holes.push(...holes);return {shape,contour};
}

/** One deterministic nest of scavenged Croba skeletons. Render metres, Y up;
 * its caller owns the returned geometry and supplies a vertex-color material.
 * Open skull frameworks and real chela moulds distinguish remains from twigs.
 */
export function createBasinBoneNestGeometry(){
 const nest=new PlantMesh(),skulls=[];
 const transformed=(geometry,matrix,color=IVORY)=>{
  const position=geometry.attributes.position,start=nest.positions.length/3,point=v(0,0,0);
  for(let index=0;index<position.count;index++){
   point.fromBufferAttribute(position,index).applyMatrix4(matrix);
   tint.copy(color).multiplyScalar(.92+.08*Math.sin(point.x*19+point.y*23+point.z*29)**2);
   nest.positions.push(point.x,point.y,point.z);nest.colors.push(tint.r,tint.g,tint.b);
   nest.uvs.push(point.x*.3,point.z*.3);nest.glow.push(0);
  }
  if(geometry.index)for(const index of geometry.index.array)nest.indices.push(start+index);
  else for(let index=0;index<position.count;index++)nest.indices.push(start+index);
 };
 const pose=(x,y,z,yaw=0,scale=1,pitch=0,roll=0)=>new THREE.Matrix4().compose(v(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,roll)),v(scale,scale,scale));
 const curve=(points,radii,color=boneShade,sides=6)=>nest.tube(points,radii,color,sides);
 const localCurve=(matrix,points,radii,color=boneShade,sides=6)=>curve(points.map(p=>p.clone().applyMatrix4(matrix)),radii,color,sides);
 const join=(point,radius=.065)=>nest.ellipsoid(point,v(radius,radius*.72,radius*.85),boneShade(point.x,point.z),{segments:6,rings:3});
 const triangle=(points,color=IVORY,shade=1,reverse=false)=>{
  const start=nest.positions.length/3;
  for(const point of(reverse?[points[2],points[1],points[0]]:points)){
   tint.copy(color).multiplyScalar(shade*(.94+.06*Math.sin(point.x*37+point.y*29+point.z*31)**2));
   nest.positions.push(point.x,point.y,point.z);nest.colors.push(tint.r,tint.g,tint.b);
   nest.uvs.push(point.x,point.z);nest.glow.push(0);
  }
  nest.indices.push(start,start+1,start+2);
 };
 // Extrusion supplies both caps and every socket wall. Curving those caps
 // creates a hollow volumetric skull, and one subdivision avoids flat facets.
 const cast=(shape,map,matrix,reverse=false,detail=true)=>{
  const source=new THREE.ExtrudeGeometry(shape,{depth:1,steps:1,bevelEnabled:false,curveSegments:12}),p=source.attributes.position;
  const emit=(a,b,c,cap,depth=0)=>{
   if(cap&&detail&&depth===0&&Math.max(a.distanceTo(b),b.distanceTo(c),c.distanceTo(a))>.13){
    const ab=a.clone().lerp(b,.5),bc=b.clone().lerp(c,.5),ca=c.clone().lerp(a,.5);
    emit(a,ab,ca,cap,1);emit(ab,b,bc,cap,1);emit(ca,bc,c,cap,1);emit(ab,bc,ca,cap,1);return;
   }
   const points=[a,b,c].map(point=>map(point.x,point.y,point.z).applyMatrix4(matrix));
   triangle(points,cap?IVORY:STAIN,cap?.76+.22*(a.z+b.z+c.z)/3:.88,reverse);
  };
  for(let i=0;i<p.count;i+=3){
   const a=v(p.getX(i),p.getY(i),p.getZ(i)),b=v(p.getX(i+1),p.getY(i+1),p.getZ(i+1)),c=v(p.getX(i+2),p.getY(i+2),p.getZ(i+2));
   emit(a,b,c,a.z===b.z&&b.z===c.z);
  }
  source.dispose();
 };
 const cranium=(matrix,{cy,cz,height,length,width,eyes,nasal,fracture=false})=>{
  const shell=(z,y,depth,side)=>{
   const round=Math.sqrt(Math.max(0,1-((z-cz)/length)**2-((y-cy)/height)**2));
   return v(side*(.004+.008*depth+(width-.026+.026*depth)*round),y,z);
  };
  let contour;
  for(const side of[-1,1]){
   const holes=eyes.map(([z,y,rz,ry],index)=>boneOpening(z,y,rz,ry,index*.8));
   if(nasal)holes.push(boneOpening(...nasal,1.7));
   if(fracture&&side===-1)holes.push(boneOpening(cz-.18,cy+.14,.06,.065,.7,true));
   const braincase=braincaseShape(cy,cz,height,length,holes);contour=braincase.contour;
   cast(braincase.shape,(z,y,depth)=>shell(z,y,depth,side),matrix,side>0);
  }
  // Continuous crown/back bone bridges the two hemispheres. The inner bridge
  // closes the bone thickness while leaving all recessed orbital paths open.
  for(let index=0;index<contour.length;index++)for(const depth of[0,1]){
   const a=contour[index],b=contour[(index+1)%contour.length];
   const points=[shell(a.x,a.y,depth,-1),shell(a.x,a.y,depth,1),shell(b.x,b.y,depth,-1),shell(b.x,b.y,depth,1)]
    .map(point=>point.applyMatrix4(matrix));
   triangle([points[0],points[2],points[1]],IVORY,depth?.96:.76,depth===0);
   triangle([points[1],points[2],points[3]],IVORY,depth?.96:.76,depth===0);
  }
 };

 // Scavenged ribs form broken, overlapping arcs around an off-centre hollow.
 // These authored placements have unequal gaps, lengths, heights and curls;
 // several ends are snapped off, rather than forming a radial cage.
 const ribs=[
  [.09,1.71,.33,.87,.31,1], [.29,1.82,.47,1.12,-.18,.79],
  [.76,1.57,.28,.75,.43,1], [1.08,1.76,.59,1.10,-.27,.87],
  [1.24,1.63,.24,.82,.12,1], [1.87,1.82,.36,1.16,.37,.72],
  [2.21,1.48,.51,.86,-.36,1], [2.34,1.79,.25,1.04,.16,.90],
  [2.80,1.61,.42,.79,-.30,1], [3.16,1.80,.56,1.19,.26,.76],
  [3.29,1.55,.30,.86,.45,1], [3.78,1.77,.22,1.00,-.19,.89],
  [4.13,1.58,.48,.80,-.41,1], [4.30,1.83,.64,1.10,.32,.74],
  [5.11,1.60,.29,.83,.18,1], [5.67,1.78,.40,1.04,-.34,.84],
 ];
 for(const [rib,placement]of ribs.entries()){
  const [angle,outer,height,inward,curl,remaining]=placement,points=[];
  for(let step=0;step<=6;step++){
   const u=step/6*remaining,radius=outer-inward*Math.sin(u*Math.PI/2),a=angle+curl*Math.sin(u*Math.PI);
   points.push(v(.16+Math.cos(a)*radius,Math.max(.052,height-(height-.09)*Math.sin(u*Math.PI/2)
    +(.10+rib%3*.035)*Math.sin(u*Math.PI)),-.11+Math.sin(a)*radius*.90+.07*Math.sin(rib*1.6)*u));
  }
  curve(points,points.map((_,index)=>(.045+rib%3*.005)*(1-index/6*remaining)**.55+.009));
  join(points[0],.065+rib%4*.007);
 }
 // Uneven pieces of spine lie in two broken clusters, not a necklace. The
 // paired transverse processes and short dorsal processes remain legible.
 const vertebrae=[
  [-1.31,.29,-.66,.41,.08,-.22],[-1.45,.40,-.42,1.02,-.17,.31],[-1.38,.26,-.08,.72,.21,-.14],
  [-1.52,.45,.18,1.35,-.26,.18],[-1.18,.35,.51,.94,.13,.29],
  [.39,.23,1.39,-.71,.18,-.33],[.66,.38,1.32,-1.14,-.21,.17],[.81,.28,1.12,-.89,.30,-.08],
  [1.12,.47,.91,-1.56,.15,.24],[1.20,.31,.62,-1.21,-.29,-.16],
 ];
 for(const [joint,placement]of vertebrae.entries()){
  const [x,y,z,yaw,pitch,roll]=placement,matrix=pose(x,y,z,yaw,1,pitch,roll);
  nest.ellipsoid(v(x,y,z),v(.085,.062,.095),boneShade(joint),{segments:7,rings:4});
  for(const side of[-1,1])localCurve(matrix,[v(0,0,0),v(side*.12,.025,0),v(side*.15,.015,.035)],[.033,.025,.009]);
  localCurve(matrix,[v(0,.035,0),v(.012,.14,-.045)],[.032,.006]);
 }
 // Loose limb bones are skewed and partly piled over the rim. Their unequal
 // spans and heights leave the middle clear instead of crossing at one point.
 const limbs=[[[ -.81,.14,.32],[.65,.29,-.81]], [[-1.47,.24,-.88],[.18,.12,-1.35]], [[-.10,.31,1.31],[1.22,.16,.50]]];
 for(const [index,[a,b]]of limbs.entries()){
  const from=v(...a),to=v(...b),angle=Math.atan2(to.z-from.z,to.x-from.x);
  curve([from,from.clone().lerp(to,.33).add(v(.025,.06+index*.025,-.018)),from.clone().lerp(to,.7).add(v(0,.035,0)),to],[.044,.026,.029,.047]);
  for(const point of[from,to])for(const side of[-1,1])join(point.clone().add(v(Math.cos(angle+Math.PI/2)*side*.032,0,Math.sin(angle+Math.PI/2)*side*.032)),.048);
 }

 // Hogwong skull: its four lateral orbits preserve the living creature's
 // exact two-per-side spacing and its broad, rounded crocodilian beak profile.
 const hog=pose(-.94,.20,-.70,1.20,.95,-.12,.32),hogStart=nest.indices.length/3;
 cranium(hog,{cy:.31,cz:-.05,height:.35,length:.34,width:.32,
  eyes:[[.09,.40,.098,.081],[.11,.19,.092,.074]],fracture:true});
 // The upper beak is a curved, thick bone plate with two real nasal passages.
 const upper=new THREE.Shape();upper.moveTo(-.28,.16);upper.lineTo(.28,.16);
 upper.quadraticCurveTo(.26,.46,.20,.65);upper.quadraticCurveTo(0,.73,-.20,.65);upper.quadraticCurveTo(-.26,.46,-.28,.16);
 upper.closePath();for(const side of[-1,1])upper.holes.push(boneOpening(side*.108,.53,.032,.058,side*.6));
 cast(upper,(x,z,depth)=>{
  const u=THREE.MathUtils.clamp((z-.16)/.52,0,1),width=.28-.035*u-.045*u**4;
  const arch=Math.sqrt(Math.max(.015,1-(x/width)**2))*(.165-.075*u);
  return v(x,.16-.035*u+arch-.027+depth*.027,z);
 },hog,true);
 // A coherent mandibular arch has a true open mouth, a stout rounded chin,
 // and paired rear rami. It is bone volume rather than a U-shaped tube.
 const mandible=new THREE.Shape();mandible.moveTo(-.255,.17);mandible.lineTo(.255,.17);
 mandible.lineTo(.225,.55);mandible.quadraticCurveTo(.20,.70,0,.69);mandible.quadraticCurveTo(-.20,.70,-.225,.55);mandible.closePath();
 mandible.holes.push(boneOpening(0,.425,.164,.175,.4));
 cast(mandible,(x,z,depth)=>v(x,.026+.050*depth-.011*(z-.17)/.52,z),hog,true);
 for(const side of[-1,1]){
  localCurve(hog,[v(side*.25,.07,.19),v(side*.27,.10,.04),v(side*.27,.15,-.04)],[.047,.052,.034],boneShade,8);
  join(v(side*.27,.15,-.04).applyMatrix4(hog),.044);
 }
 for(const side of[-1,1])for(let tooth=0;tooth<4;tooth++){
  const z=.27+tooth*.09,width=.27-tooth*.013;
  localCurve(hog,[v(side*width,.14,z),v(side*width,.095,z+.017)],[.020,0],()=>0xe8dfc5,5);
 }
 skulls.push({species:'Tundra Hogwong',triangleStart:hogStart,triangleCount:nest.indices.length/3-hogStart,
  matrix:hog.elements.slice(),orbitalRows:[[.09,.40],[.11,.19]]});

 // Crobon Bird skull and hooked beak use the live bird's two interlocking
 // horn paths and four orbital positions, without its soft mantle or feathers.
 const bird=pose(-.22,.47,-1.04,-.40,1.08,.16,-.48),birdStart=nest.indices.length/3;
 cranium(bird,{cy:.20,cz:-.025,height:.245,length:.245,width:.235,
  eyes:[[.055,.245,.062,.053],[.055,.10,.060,.052]],nasal:[.17,.165,.024,.029]});
 const birdJaw=new THREE.Shape();birdJaw.moveTo(-.19,-.03);birdJaw.lineTo(.19,-.03);
 birdJaw.quadraticCurveTo(.19,.15,.08,.23);birdJaw.quadraticCurveTo(0,.27,-.08,.23);birdJaw.quadraticCurveTo(-.19,.15,-.19,-.03);
 birdJaw.closePath();birdJaw.holes.push(boneOpening(0,.09,.105,.105,.6));
 cast(birdJaw,(x,z,depth)=>v(x,.025+.028*depth+.035*(x/.19)**2,z),bird,true,false);
 localCurve(bird,[v(0,.154,.205),v(0,.146,.29),v(0,.11,.365),v(0,.056,.395)],[.077,.064,.033,0],()=>0xe2dbc4,8);
 localCurve(bird,[v(0,.06,.215),v(0,.042,.30),v(0,.06,.367)],[.057,.043,0],boneShade,8);
 localCurve(bird,[v(0,.39,-.02),v(0,.52,-.065),v(0,.63,-.16)],[.062,.035,0],boneShade,7);
 skulls.push({species:'Crobon Bird',triangleStart:birdStart,triangleCount:nest.indices.length/3-birdStart,
  matrix:bird.elements.slice(),orbitalRows:[[.055,.245],[.055,.10]]});

 // Actual Red Root Crab exoskeleton geometry: a palm, the fixed bottom finger
 // and three radial hinged pincers. Chitin moults are real remains, not bones.
 const crab=createCrabAnatomy({mobile:true});
 try{
  for(const [x,z,yaw,scale]of[[1.23,.38,-2.1,2.7]]){
   const matrix=pose(x,.21,z,yaw,scale,-.12,.28);
   transformed(crab.clawPalm,matrix);transformed(crab.clawFixedFinger,matrix);
   for(const hinge of CRAB_PINCER_HINGES){
    const rotation=new THREE.Quaternion().setFromAxisAngle(v(0,0,1),hinge.roll)
     .multiply(new THREE.Quaternion().setFromAxisAngle(v(1,0,0),.38));
    const finger=new THREE.Matrix4().compose(v(...hinge.position),rotation,v(1,1,1));
    transformed(crab.clawMovingFinger,new THREE.Matrix4().multiplyMatrices(matrix,finger),FRESH);
   }
  }
 }finally{Object.values(crab).forEach(geometry=>geometry.dispose());}

 const geometry=nest.geometry({normalizeHeight:false});
 const floorOffset=-geometry.boundingBox.min.y;geometry.translate(0,floorOffset,0);
 for(const skull of skulls)skull.matrix[13]+=floorOffset;
 const p=geometry.attributes.position,n=geometry.attributes.normal,seams=new Map();
 for(let index=0;index<p.count;index++){
  const key=[p.getX(index),p.getY(index),p.getZ(index)].map(value=>Math.round(value*1e6)).join(':');
  let seam=seams.get(key);if(!seam)seams.set(key,seam={indices:[],normal:v(0,0,0)});
  seam.indices.push(index);seam.normal.add(v(n.getX(index),n.getY(index),n.getZ(index)));
 }
 for(const seam of seams.values()){seam.normal.normalize();for(const index of seam.indices)n.setXYZ(index,seam.normal.x,seam.normal.y,seam.normal.z);}
 geometry.name='icy-basin-croba-bone-nest';
 geometry.userData={species:['Tundra Hogwong','Crobon Bird','Red Root Crab'],remains:['curved ribs','vertebrae','four-orbit skulls','broad beak','hooked beak','four-pincer chitin moults'],
  openSkullSockets:8,nasalOpenings:4,cranialFractures:1,hollowCranialShells:true,creatureSourceModels:['hogwong-renderer.js','penguin-renderer.js','crab-anatomy.js'],static:true,
  asymmetrical:true,brokenRingCenter:[.16,-.11],skulls};
 return geometry;
}
