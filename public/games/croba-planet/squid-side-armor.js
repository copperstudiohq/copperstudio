import * as THREE from './vendor/three.module.js';

export const SQUID_CENTER_STRIPE_HALF_WIDTH = .36;

/** Keep the stripe in the existing skin draw. It crosses the forehead and crown
 * and continues down the back between the paired rear siphons. */
export function paintSquidMantleStripe(geometry) {
  const points=geometry.attributes.position, colors=[];
  for(let i=0;i<points.count;i++){
    const x=points.getX(i),y=points.getY(i),z=points.getZ(i);
    let angle=Math.atan2(y,z);if(angle<-.42)angle+=Math.PI*2;
    const band=angle>=-.42&&angle<=Math.PI+.18
      ? Math.max(0,Math.min(1,(SQUID_CENTER_STRIPE_HALF_WIDTH+.02-Math.abs(x))/.04)):0;
    colors.push(.65+.30*band,.76+.24*band,.87+.13*band);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  return geometry;
}

/** Cut a real channel through the existing armor batch. Interpolated UVs/colors
 * retain its surface detail; cut faces descend to the blue skin underneath. */
export function cutSquidArmorChannel(source, sideRatio) {
  const attributes=source.attributes, output=Object.fromEntries(Object.keys(attributes).map(name=>[name,[]]));
  const index=source.index, features=source.userData.features??[], records=[];
  const read=i=>Object.fromEntries(Object.entries(attributes).map(([name,attribute])=>
    [name,Array.from(attribute.array.slice(i*attribute.itemSize,(i+1)*attribute.itemSize))]));
  const interpolate=(a,b,t)=>Object.fromEntries(Object.keys(attributes).map(name=>[name,a[name].map((value,i)=>value+(b[name][i]-value)*t)]));
  const push=vertices=>{for(const vertex of vertices)for(const name of Object.keys(attributes))output[name].push(...vertex[name]);};
  for(const feature of features){
    const start=output.position.length/3;
    for(let triangle=0;triangle<(index?.count??attributes.position.count);triangle+=3){
      const ids=[0,1,2].map(corner=>index?index.getX(triangle+corner):triangle+corner);
      if(ids[0]<feature.start||ids[0]>=feature.start+feature.count+(feature.wallCount??0))continue;
      const original=ids.map(read);
      for(const side of [-1,1]){
        const polygon=[],crossings=[];
        for(let i=0;i<3;i++){
          const a=original[i],b=original[(i+1)%3];
          const da=side*a.position[0]-SQUID_CENTER_STRIPE_HALF_WIDTH,db=side*b.position[0]-SQUID_CENTER_STRIPE_HALF_WIDTH;
          if(da>=0)polygon.push(a);
          if((da>=0)!==(db>=0)){const hit=interpolate(a,b,da/(da-db));polygon.push(hit);crossings.push(hit);}
        }
        for(let i=1;i<polygon.length-1;i++)push([polygon[0],polygon[i],polygon[i+1]]);
        if(crossings.length===2&&ids.every(id=>id<(feature.wallStart??Infinity))){
          const [a,b]=crossings;
          const floor=vertex=>{
            const clone=structuredClone(vertex),p=clone.position;
            const amount=1.002/Math.hypot(p[0]*sideRatio,p[1],p[2]);
            clone.position=p.map(v=>v*amount);
            clone.color=clone.color.map(v=>v*.32);
            clone.normal=[-side,0,0];return clone;
          };
          const lowerA=floor(a),lowerB=floor(b);
          const topA={...a,normal:[-side,0,0]},topB={...b,normal:[-side,0,0]};
          // The shell material is double sided; the channel walls remain solid
          // from either view, including a view up from the belly.
          push([topA,lowerA,topB,topB,lowerA,lowerB]);
        }
      }
    }
    records.push({name:feature.name,start,count:output.position.length/3-start});
  }
  const geometry=new THREE.BufferGeometry();
  for(const [name,values]of Object.entries(output))geometry.setAttribute(name,new THREE.Float32BufferAttribute(values,attributes[name].itemSize));
  geometry.userData.features=records;
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return geometry;
}
