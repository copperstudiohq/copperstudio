import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';
import {centipedeLegPose,centipedeSpikePose,CENTIPEDE_SPIKES} from './centipede-details.js';

const v=(x,y,z)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const IVORY=new THREE.Color(0xd9d3bf),STAIN=new THREE.Color(0x8d8d79),CHITIN=new THREE.Color(0x777e7e);
const paint=new THREE.Color();
const bone=(u,t=0)=>paint.copy(IVORY).lerp(STAIN,.10+.13*Math.sin(u*31+t*19)**2).getHex();
const shellColor=(u,t)=>paint.copy(CHITIN).lerp(STAIN,.20+.18*Math.sin(u*21+t*37)**2).getHex();

function opening(x,y,rx,ry,phase=0){
 const path=new THREE.Path(),points=[];
 for(let index=0;index<16;index++){
  const angle=-index*Math.PI/8,wear=1+.035*Math.sin(angle*3+phase)+.018*Math.sin(angle*7-phase);
  points.push(new THREE.Vector2(x+Math.cos(angle)*rx*wear,y+Math.sin(angle)*ry*wear));
 }
 path.setFromPoints(points);path.closePath();return path;
}

/** Static shared prototypes own no materials, textures, lights or animation.
 * Their callers own/dispose the resulting indexed vertex-color geometry. */
function remainsBuilder(){
 const mesh=new PlantMesh(),point=v(0,0,0),color=new THREE.Color();
 const triangle=(a,b,c,tint=IVORY,shade=1,reverse=false)=>{
  const start=mesh.positions.length/3;
  for(const p of(reverse?[c,b,a]:[a,b,c])){
   color.copy(tint).multiplyScalar(shade*(.95+.05*Math.sin(p.x*37+p.y*23+p.z*29)**2));
   mesh.positions.push(p.x,p.y,p.z);mesh.colors.push(color.r,color.g,color.b);mesh.uvs.push(p.x,p.z);mesh.glow.push(0);
  }
  mesh.indices.push(start,start+1,start+2);
 };
 const tube=(points,radii,tint=bone,sides=6)=>mesh.tube(points,radii,tint,sides);
 const ellipsoid=(center,radii,tint=bone,segments=7,rings=4)=>mesh.ellipsoid(center,radii,tint,{segments,rings});
 const cast=(shape,map,matrix=new THREE.Matrix4(),reverse=false,detail=true,tint=IVORY)=>{
  const source=new THREE.ExtrudeGeometry(shape,{depth:1,steps:1,bevelEnabled:false,curveSegments:10}),p=source.attributes.position;
  const emit=(a,b,c,cap,depth=0)=>{
   if(cap&&detail&&!depth&&Math.max(a.distanceTo(b),b.distanceTo(c),c.distanceTo(a))>.13){
    const ab=a.clone().lerp(b,.5),bc=b.clone().lerp(c,.5),ca=c.clone().lerp(a,.5);
    emit(a,ab,ca,cap,1);emit(ab,b,bc,cap,1);emit(ca,bc,c,cap,1);emit(ab,bc,ca,cap,1);return;
   }
   const vertices=[a,b,c].map(q=>map(q.x,q.y,q.z).applyMatrix4(matrix));
   triangle(...vertices,cap?tint:STAIN,cap?.77+.21*(a.z+b.z+c.z)/3:.87,reverse);
  };
  try{for(let i=0;i<p.count;i+=3){
   const a=v(p.getX(i),p.getY(i),p.getZ(i)),b=v(p.getX(i+1),p.getY(i+1),p.getZ(i+1)),c=v(p.getX(i+2),p.getY(i+2),p.getZ(i+2));
   emit(a,b,c,a.z===b.z&&b.z===c.z);
  }}finally{source.dispose();}
 };
 const hollowCranium=(matrix,{cy,along,height,length,width,eyes,nasal,axis='Z',detail=true,tint=IVORY})=>{
  const surface=(a,y,depth,side)=>{
   const round=Math.sqrt(Math.max(0,1-((a-along)/length)**2-((y-cy)/height)**2));
   const cross=side*(.004+.006*depth+(width-.021+.021*depth)*round);
   return axis==='Z'?v(cross,y,a):v(a,y,cross);
  };
  const contour=[];
  for(let step=0;step<32;step++){
   const angle=step*TAU/32,wear=Math.cos(angle)<-.4?.006*Math.sin(step*2.1):0;
   contour.push(new THREE.Vector2(along+Math.cos(angle)*(length+wear),cy+Math.sin(angle)*(height+wear*.65)));
  }
  for(const side of[-1,1]){
   const shape=new THREE.Shape();shape.setFromPoints(contour);shape.closePath();
   shape.holes.push(...eyes.map(([a,y,ra,ry],index)=>opening(a,y,ra,ry,index*.7)));
   if(nasal)shape.holes.push(opening(...nasal,1.2));
   cast(shape,(a,y,depth)=>surface(a,y,depth,side),matrix,axis==='Z'?side>0:side<0,detail,tint);
  }
  for(let index=0;index<contour.length;index++)for(const depth of[0,1]){
   const a=contour[index],b=contour[(index+1)%contour.length];
   const p=[surface(a.x,a.y,depth,-1),surface(a.x,a.y,depth,1),surface(b.x,b.y,depth,-1),surface(b.x,b.y,depth,1)]
    .map(q=>q.applyMatrix4(matrix));
   const reverse=axis==='Z'?depth===0:depth===1;
   triangle(p[0],p[2],p[1],tint,depth?.95:.75,reverse);triangle(p[1],p[2],p[3],tint,depth?.95:.75,reverse);
  }
 };
 const finish=(name,metadata)=>{
  const geometry=mesh.geometry({normalizeHeight:false}),floor=-geometry.boundingBox.min.y;
  geometry.translate(0,floor,0);
  // Smooth cast cranial surfaces and worn socket lips while retaining the real
  // openings and distinct inner walls. Welding normals never fills a cavity.
  const p=geometry.attributes.position,n=geometry.attributes.normal,seams=new Map();
  for(let index=0;index<p.count;index++){
   const key=[p.getX(index),p.getY(index),p.getZ(index)].map(x=>Math.round(x*1e6)).join(':');
   let seam=seams.get(key);if(!seam)seams.set(key,seam={indices:[],normal:v(0,0,0)});
   seam.indices.push(index);seam.normal.add(point.set(n.getX(index),n.getY(index),n.getZ(index)));
  }
  for(const seam of seams.values()){seam.normal.normalize();for(const index of seam.indices)n.setXYZ(index,seam.normal.x,seam.normal.y,seam.normal.z);}
  geometry.name=name;geometry.userData={...metadata,static:true,grounded:true,floorOffset:floor};
  if(metadata.skull){metadata.skull.matrix=metadata.skull.matrix.slice();metadata.skull.matrix[13]+=floor;}
  return geometry;
 };
 return {mesh,triangle,tube,ellipsoid,cast,hollowCranium,finish};
}

/** Complete 1.43 m Crobon Bird anatomy in the live model's upright frame:
 * +Z is the beak, −Z the long tail. Rotate the whole static specimen to repose.
 * Its four-eye skull has real hollow sockets and nasal bone passages. */
export function createCrobonBirdSkeletonGeometry(){
 const b=remainsBuilder(),{mesh,tube,ellipsoid,cast,hollowCranium}=b;
 const joint=(p,r=.026)=>ellipsoid(p,v(r,r*.8,r*.9),bone,7,4);
 // Twelve centra, neural arches and paired processes form one axial chain.
 const spine=[];
 for(let index=0;index<12;index++){
  const u=index/11,p=v(.008*Math.sin(index*.7),.25+.72*u,-.12-.025*Math.sin(u*Math.PI));spine.push(p);
  ellipsoid(p,v(.033-.006*u,.023,.028),bone,7,4);
  for(const side of[-1,1])tube([p,p.clone().add(v(side*(.055-.023*u),.009,-.006))],[.015,.006]);
  tube([p.clone().add(v(-.022,.015,-.015)),p.clone().add(v(0,.045,-.025)),p.clone().add(v(.022,.015,-.015))],[.010,.012,.010],bone,5);
 }
 tube(spine,spine.map((_,i)=>.018-i*.0004));
 // Eight real paired ribs wrap from the spine to the forward sternum.
 for(let rib=0;rib<8;rib++)for(const side of[-1,1]){
  const y=.36+rib*.063,width=.18+.083*Math.sin((rib+1)/9*Math.PI),depth=.13+.075*Math.sin((rib+1)/9*Math.PI),points=[];
  for(let step=0;step<=7;step++){
   const angle=step*Math.PI/7;points.push(v(side*width*Math.sin(angle),y-.023*Math.sin(angle),-depth*Math.cos(angle)));
  }
  tube(points,points.map((_,i)=>.0145-.0045*Math.sin(i/7*Math.PI)),bone,6);
 }
 mesh.grid(10,4,(u,t)=>v((t*2-1)*(.035+.025*Math.sin(u*Math.PI)),.30+.55*u,.18+.074*Math.sin(u*Math.PI)*(1-(t*2-1)**2)),bone,0,true);
 tube([v(0,.31,.19),v(0,.56,.27),v(0,.83,.18)],[.025,.022,.015]);
 // The broad pelvic girdle has two actual obturator holes, not a filled disc.
 const pelvis=new THREE.Shape();pelvis.absellipse(0,.27,.205,.135,0,TAU,false);
 for(const side of[-1,1])pelvis.holes.push(opening(side*.097,.26,.052,.066,side*.6));
 cast(pelvis,(x,y,depth)=>v(x,y,-.145+depth*.055),new THREE.Matrix4(),false,false);
 for(const side of[-1,1]){
  tube([v(side*.12,.29,-.12),v(side*.20,.39,-.07),v(side*.23,.45,-.04)],[.023,.019,.025]);
  // Two girdles support the two pairs of flippers in the live body plan.
  tube([v(0,.76,-.10),v(side*.15,.79,-.08),v(side*.23,.74,-.01)],[.020,.021,.027]);
  for(let pair=0;pair<2;pair++){
   const scale=pair?.78:1,root=v(side*(pair?.205:.23),pair?.45:.74,pair?-.04:-.01);
   const elbow=root.clone().add(v(side*.055*scale,-.13*scale,.006)),wrist=root.clone().add(v(side*.093*scale,-.32*scale,.022));
   tube([root,root.clone().lerp(elbow,.5).add(v(0,0,-.009)),elbow],[.025*scale,.018*scale,.024*scale]);
   for(const offset of[-.014,.014])tube([elbow.clone().add(v(0,0,offset)),wrist.clone().add(v(0,0,offset*.7))],[.012*scale,.010*scale]);
   for(const p of[root,elbow,wrist])joint(p,.026*scale);
   for(let digit=0;digit<4;digit++){
    const fan=(digit-1.5)*.038*scale,tip=wrist.clone().add(v(side*(.02+.014*digit)*scale,-(.13-.014*Math.abs(digit-1.5))*scale,fan));
    tube([wrist.clone().add(v(0,0,fan*.25)),wrist.clone().lerp(tip,.56),tip],[.009*scale,.007*scale,.0035*scale],bone,5);
   }
  }
  // Short articulated hind legs terminate in the living bird's three toes.
  const hip=v(side*.115,.25,-.05),knee=v(side*.13,.15,.01),ankle=v(side*.105,.065,.02);
  tube([hip,knee,ankle],[.027,.021,.020]);for(const p of[hip,knee,ankle])joint(p,.025);
  for(const offset of[-.055,0,.055]){
   const toe=v(side*.105+offset,.033,.23+(.055-Math.abs(offset))*.25);
   tube([ankle,v(side*.105+offset*.6,.044,.13),toe,toe.clone().add(v(0,-.015,.038))],[.014,.012,.008,0],bone,5);
  }
 }
 // Caudal vertebrae follow the same long .92 m raised tail as the live birds.
 const tail=[];
 for(let index=0;index<=14;index++){
  const u=index/14,p=v(.04*Math.sin(u*Math.PI),.31+.12*u+.04*Math.sin(u*Math.PI),-.18-.92*u);tail.push(p);
  const r=.035*(1-u)**.75+.007;ellipsoid(p,v(r,r*.8,r*.85),bone,6,3);
  for(const side of[-1,1])tube([p,p.clone().add(v(side*(.082*(1-u)+.013),.008,-.010))],[r*.45,r*.16],bone,5);
 }
 tube(tail,tail.map((_,i)=>.021*(1-i/14)+.004),bone,6);

 const skullStart=mesh.indices.length/3,identity=new THREE.Matrix4();
 hollowCranium(identity,{cy:1.0,along:-.025,height:.245,length:.245,width:.235,
  eyes:[[.055,1.045,.062,.053],[.055,.90,.060,.052]],nasal:[.17,.965,.024,.029]});
 const jaw=new THREE.Shape();jaw.moveTo(-.19,-.03);jaw.lineTo(.19,-.03);jaw.quadraticCurveTo(.19,.15,.08,.23);
 jaw.quadraticCurveTo(0,.27,-.08,.23);jaw.quadraticCurveTo(-.19,.15,-.19,-.03);jaw.closePath();jaw.holes.push(opening(0,.09,.105,.105,.6));
 cast(jaw,(x,z,depth)=>v(x,.825+.028*depth+.035*(x/.19)**2,z),identity,true,false);
 // These are the actual two live beak paths and crown horn proportions.
 tube([v(0,.954,.205),v(0,.946,.29),v(0,.91,.365),v(0,.856,.395)],[.077,.064,.033,0],bone,10);
 tube([v(0,.86,.215),v(0,.842,.30),v(0,.86,.367)],[.057,.043,0],bone,10);
 tube([v(0,1.19,-.02),v(0,1.32,-.065),v(0,1.43,-.16)],[.062,.035,0],bone,9);
 const skull={triangleStart:skullStart,triangleCount:mesh.indices.length/3-skullStart,matrix:identity.elements.slice(),orbitalAxis:'X',orbitalRows:[[.055,1.045],[.055,.90]]};
 return b.finish('crobon-bird-complete-skeleton',{species:'Crobon Bird',kind:'intact-skeleton',pose:'upright-neutral',canonicalBodyHeightMeters:1.43,
  eyeSocketCount:4,nasalOpenings:2,flipperCount:4,footCount:2,pairedRibs:8,axialVertebrae:12,caudalVertebrae:15,tailLengthMeters:.92,
  sourceModels:['penguin-renderer.js','penguin-tail-physics.js'],skull});
}

/** Add a real missing patch to a solid grid; the exposed inner chitin remains
 * visible through its jagged outline instead of hiding damage in a texture. */
function brokenGrid(mesh,rows,columns,pointAt,colorAt,skip,reverse=false){
 const start=mesh.positions.length/3;
 for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
  const u=row/rows,t=col/columns,p=pointAt(u,t),color=new THREE.Color(typeof colorAt==='function'?colorAt(u,t):colorAt);
  mesh.positions.push(p.x,p.y,p.z);mesh.colors.push(color.r,color.g,color.b);mesh.uvs.push(t,u);mesh.glow.push(0);
 }
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  if(skip?.(row,col))continue;
  const a=start+row*(columns+1)+col,b=a+columns+1;
  mesh.indices.push(...(reverse?[a,b,a+1,a+1,b,b+1]:[a,a+1,b,a+1,b+1,b]));
 }
}

/** A coiled ~15 m preserved fragment of Croba's 60 m Ice Centipede. Its armor
 * is chitin, not a vertebrate spine: broken gray tergites reveal pale sterna,
 * empty head sockets and the same mostly tucked walking-leg proportions. */
export function createIceCentipedeRemainsGeometry(){
 const b=remainsBuilder(),{mesh,tube,ellipsoid,hollowCranium}=b,width=.85,count=11,radius=2.60;
 const frames=Array.from({length:count},(_,index)=>{
  const angle=-.8+index*.46,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
  const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(.025*Math.sin(index*1.7),Math.PI/2-angle,.05*Math.sin(index*.9),'YXZ'));
  return new THREE.Matrix4().compose(v(x,.025*Math.sin(index*1.3),z),rotation,v(1,1,1));
 });
 const local=(matrix,point)=>point.clone().applyMatrix4(matrix);
 for(let index=0;index<count;index++){
  const frame=frames[index],taper=index===count-1?.76:1,length=.79*(index%2?.96:1),w=width*taper;
  if(index>0){
   const surface=(u,t,inner=false)=>{
    const x=(u*2-1),cross=Math.sqrt(Math.max(0,1-x*x)),angle=(t-.5)*Math.PI;
    const notch=index%3===0&&t>.5?.018*Math.sin(u*Math.PI*7):0;
    return local(frame,v(x*length,w*.52+(inner?.45:.50)*w*cross*Math.cos(angle)-notch,
     (inner?.94:1)*w*cross*Math.sin(angle)));
   };
   const broken=(row,col)=>index===3&&row>=2&&row<=3&&col>=4&&col<=6||index===7&&row>=3&&col>=7&&col<=9;
   brokenGrid(mesh,6,12,(u,t)=>surface(u,t),shellColor,broken,true);
   brokenGrid(mesh,6,12,(u,t)=>surface(u,t,true),bone,broken,false);
   // Pale broken edges expose the shell thickness, including actual gaps.
   for(const t of[0,1]){
    const points=Array.from({length:7},(_,i)=>surface(i/6,t));tube(points,.018,()=>0xb9baac,5);
   }
   for(const spikeIndex of(index%2?[1,5,8,12,3]:[1,5,8,12])){
    const pose=centipedeSpikePose(CENTIPEDE_SPIKES[spikeIndex],width,taper,length),base=v(...pose.base),tip=v(...pose.tip);
    tip.lerp(base,index%3===0?.67:.30);
    tube([local(frame,base),local(frame,tip)],[pose.radius*.75,index%3===0?pose.radius*.28:0],u=>u>.6?0xb4b7a8:0x727c7c,5);
   }
  }
  // Incomplete white ventral plates survive underneath the shattered shell.
  brokenGrid(mesh,3,8,(u,t)=>local(frame,v((u*2-1)*length*.87,.24*w+.085*w*(1-(t*2-1)**2),
   (t*2-1)*w*.81)),()=>0xd5d8cc,(row,col)=>index===5&&col>=5||index===8&&row===2&&col<3,false);
  for(const side of[-1,1]){
   const leg=centipedeLegPose(index*.31,index,side,width),hip=local(frame,v(...leg.hip)),knee=local(frame,v(...leg.knee)),foot=local(frame,v(...leg.foot));
   tube([hip,knee],[width*.075,width*.064],shellColor,6);
   if(!(index===4&&side===-1))tube([knee,foot],[width*.064,index===8?.025:.009],bone,6);
  }
 }
 const head=frames[0],skullStart=mesh.indices.length/3;
 hollowCranium(head,{cy:.45,along:.15,height:.43,length:1.12,width:.70,axis:'X',detail:false,tint:CHITIN,
  eyes:[[.27,.70,.125,.115],[.73,.59,.125,.108]]});
 for(const side of[-1,1]){
  const start=v(width,width*.45,side*width*.45),middle=v(width*1.8,width*.35,side*width*.65);
  const tip=v(width*(side<0?1.98:2.2),width*.30,side*width*(side<0?.28:.20));
  tube([local(head,start),local(head,middle),local(head,tip)],[width*.16,width*.10,side<0?.025:0],u=>u>.7?0xbbb9a8:0x656f70,7);
  const antenna=[];
  for(let joint=0;joint<5;joint++){
   const u=joint/4*(side<0?.58:1);antenna.push(local(head,v(width*(.65+u*2.0),width*(.92+.12*Math.sin(u*Math.PI)-u*.22),side*width*(.42+u*.8))));
  }
  tube(antenna,antenna.map((_,i)=>.032-i*.005),shellColor,5);
 }
 const skull={triangleStart:skullStart,triangleCount:mesh.indices.length/3-skullStart,matrix:head.elements.slice(),orbitalAxis:'Z',orbitalRows:[[.27,.70],[.73,.59]]};
 // A short torn cut-end collar makes this a fragment rather than a miniature
 // complete centipede. Its visible inner wall is weathered pale chitin.
 const tail=frames.at(-1);
 for(const side of[-1,1])tube([local(tail,v(-.55,.34,side*.45)),local(tail,v(-.88,.30,side*.62)),local(tail,v(-1.05,.17,side*.71))],[.062,.044,.018],bone,6);
 return b.finish('ice-centipede-coiled-decayed-remains',{species:'Ice centipede',kind:'decayed-chitin-fragment',pose:'irregular-coil',
  preservedLengthMeters:15,originalLengthMeters:60,segmentCount:count,legPairCount:count,missingLowerLegs:1,eyeSocketCount:4,
  grayTergites:true,paleSterna:true,brokenSpikes:true,brokenCutEnd:true,sourceModels:['fauna.js','centipede-details.js'],skull});
}
