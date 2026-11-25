import * as THREE from './vendor/three.module.js';

const v=(x,y,z)=>new THREE.Vector3(x,y,z);
function triangle(mesh,points,color,glow=[0,0,0]){
  const first=mesh.positions.length/3,tint=new THREE.Color(color);
  for(let i=0;i<3;i++){
    mesh.positions.push(...points[i].toArray());mesh.colors.push(tint.r,tint.g,tint.b);
    mesh.uvs.push(i===1?1:0,i===2?1:0);mesh.glow.push(glow[i]);
  }
  mesh.indices.push(first,first+1,first+2);
}

/** Large overlapping six-sided shields, with broad faceted crowns and worn
 * bevels. Both species share these exact surfaces and their attachment points.
 */
export function addFrostHoundScutes(mesh,sectionAt){
  const outline=[[-.78,.6],[0,1],[.78,.6],[1,-.3],[0,-1],[-1,-.3]],ranges=[];
  for(let row=0;row<7;row++)for(let column=0;column<7;column++){
    const z=-.84+row*.265,angle=-1.46+column*.475+(row%2)*.065,section=sectionAt(z);
    const before=sectionAt(z-.005),after=sectionAt(z+.005);
    const normal=v(Math.sin(angle)/section.width,Math.cos(angle)/section.height,0);
    normal.z=-(normal.x*Math.sin(angle)*(after.width-before.width)/.01
      +normal.y*((after.y-before.y)+(after.height-before.height)*Math.cos(angle))/.01);
    normal.normalize();
    const rotation=new THREE.Quaternion().setFromUnitVectors(v(0,1,0),normal);
    const center=v(Math.sin(angle)*section.width,section.y+Math.cos(angle)*section.height,z).addScaledVector(normal,.008);
    const width=.135*(.78+.22*Math.sin((row+1)/8*Math.PI)),length=.184;
    const at=(x,y,z)=>v(x,y,z).applyQuaternion(rotation).add(center);
    const inner=outline.map(([x,z])=>at(x*width*.79,.036,z*length*.79));
    const outer=outline.map(([x,z])=>at(x*width,.006,z*length));
    const crown=at(0,.055,0),start=mesh.positions.length/3;
    for(let i=0;i<6;i++){
      const next=(i+1)%6;
      triangle(mesh,[crown,inner[i],inner[next]],(row+column)%3===0?0x6493ab:0x507f9a,[0,.04,.04]);
      triangle(mesh,[inner[i],outer[i],inner[next]],0x8bb0bf,[.04,.8,.04]);
      triangle(mesh,[inner[next],outer[i],outer[next]],0x6e98ad,[.04,.8,.8]);
    }
    ranges.push({start,count:mesh.positions.length/3-start,center:center.toArray(),width:width*2,length:length*2});
  }
  return ranges;
}

/** Broad brow planes fall toward a low snake-like nose, rather than a round
 * seal muzzle. The existing jaw/eye/fang hinges remain in their original pose.
 */
export function addFrostHoundWedge(mesh){
  const rings=[[.78,.27,.37,-.015],[1.04,.35,.36,-.008],[1.32,.32,.23,-.008],[1.58,.225,.12,-.005],[1.64,.06,.07,0]]
    .map(([z,w,top,bottom])=>[v(-w*.65,top,z),v(w*.65,top,z),v(w,top*.45,z),v(w,bottom,z),v(-w,bottom,z),v(-w,top*.45,z)]);
  for(let row=0;row<rings.length-1;row++)for(let side=0;side<6;side++){
    const next=(side+1)%6,color=side===0?0xa8b9bf:side<3?0x899fa9:0x9fb2b8;
    triangle(mesh,[rings[row][side],rings[row+1][side],rings[row][next]],color);
    triangle(mesh,[rings[row][next],rings[row+1][side],rings[row+1][next]],color);
  }
  for(const end of[0,rings.length-1])for(let i=1;i<5;i++)
    triangle(mesh,end?[rings[end][0],rings[end][i+1],rings[end][i]]:[rings[end][0],rings[end][i],rings[end][i+1]],0xa8b9bf);
}
