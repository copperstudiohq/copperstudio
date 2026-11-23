import * as THREE from './vendor/three.module.js';
import { SEABED_LEVEL,WATER_LEVEL } from './terrain.js';
import {createOrangeBorderGeometry} from './orange-border-geometry.js';

const SCALE=25;
const RIDGE=[.42,.90,.64,.46,.91,1,.62,.43,.93,.68,.40];

/** Closed serrated ranges stay inside each authored border footprint. Layered
 * faces, recessed flutes and three crests replace the old single pyramid.
 * All ranges still share one ice draw and one orange-stone draw.
 * @param {import('./biomes.js').Border[]} borders @param {'iceberg'|'stone'} kind */
export function createMountainRangeGeometry(borders,kind) {
  if(kind==='stone')return createOrangeBorderGeometry(borders);
  const positions=[],colors=[],ranges=[];
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3();
  const tint=new THREE.Color();
  for(const wall of borders.filter(border=>border.kind===kind)){
    if(![wall.x,wall.y,wall.rx,wall.ry,wall.height,wall.baseZ??SEABED_LEVEL].every(Number.isFinite)
      ||wall.rx<=0||wall.ry<=0||wall.height<=(wall.baseZ??SEABED_LEVEL))
      throw new TypeError(`Mountain border ${wall.id??'(unnamed)'} needs finite dimensions, positive radii and a crest above its base.`);
    const low=(wall.baseZ??SEABED_LEVEL)/SCALE,high=wall.height/SCALE;
    const frostColor=new THREE.Color(kind==='iceberg'?0xe7f4f7:0xf1b38c);
    const center=new THREE.Vector3(wall.x/SCALE,(low+high)/2,wall.y/SCALE);
    const alongX=wall.rx>=wall.ry,seed=wall.seed??0,start=positions.length/3;
    const tangent=wall.start?new THREE.Vector2(wall.end.x-wall.start.x,wall.end.y-wall.start.y).normalize():new THREE.Vector2(alongX?1:0,alongX?0:1);
    const outwardAxis=wall.outward??{x:alongX?0:1,y:alongX?1:0};
    const coordinates=(t,across,y)=>{
      if(wall.start){
        const x=wall.start.x+(wall.end.x-wall.start.x)*t,z=wall.start.y+(wall.end.y-wall.start.y)*t;
        const outerX=wall.outerStart.x+(wall.outerEnd.x-wall.outerStart.x)*t,outerZ=wall.outerStart.y+(wall.outerEnd.y-wall.outerStart.y)*t;
        return[(x+(outerX-x)*(across+1)/2)/SCALE,y,(z+(outerZ-z)*(across+1)/2)/SCALE];
      }
      return alongX?[(wall.x+(t*2-1)*wall.rx)/SCALE,y,(wall.y+across*wall.ry)/SCALE]
        :[(wall.x+across*wall.rx)/SCALE,y,(wall.y+(t*2-1)*wall.ry)/SCALE];
    };
    const colorAt=(point,facet)=>{
      const above=Math.max(0,point[1])/Math.max(1,high);
      const frost=Math.max(0,Math.min(1,(above-.44)/.48));
      tint.setHex(kind==='iceberg'?0x69aec5:0xca824e)
        .lerp(frostColor,frost*.93);
      const strata=Math.sin(point[1]*3.3+point[0]*.27+point[2]*.19+seed)*.025;
      const glacierBand=kind==='iceberg'?Math.sin(point[1]*.9+Math.sin(point[0]*.17+point[2]*.13))* .045:0;
      tint.multiplyScalar(.86+facet*.05+strata+glacierBand);
      return tint.toArray();
    };
    const triangle=(p,q,r,facet=0)=>{
      a.fromArray(q).sub(c.fromArray(p));b.fromArray(r).sub(c);normal.crossVectors(a,b);
      const outward=a.fromArray(p).add(b.fromArray(q)).add(c.fromArray(r)).multiplyScalar(1/3).sub(center);
      const points=normal.dot(outward)>=0?[p,q,r]:[p,r,q];
      for(const point of points){positions.push(...point);colors.push(...colorAt(point,facet));}
    };
    const ridge=RIDGE.map((height,i)=>{
      const t=i/(RIDGE.length-1),crest=height===1?1:height+Math.sin(seed*.17+i*2.3)*.035;
      const across=Math.sin(seed*.11+i*1.8)*Math.sin(t*Math.PI)*.22;
      return coordinates(t,across,high*crest);
    });
    const faces=[];
    if(kind==='iceberg'){
      // Broad tabular shoulders and fractured calving columns retain the
      // authored wall footprint. Wave scour undercuts the waterline slightly;
      // the cap rolls back into compact blue ice rather than a pointed ridge.
      const tops=[.74,.91,.92,.76,.97,1,.81,.94,.95,.78,.73];
      const dense=new THREE.Color(0x79a9be),bubbly=new THREE.Color(0xb4d0db),snow=new THREE.Color(0xe8eff0);
      const iceColor=point=>{
        const above=Math.max(0,point[1])/Math.max(1,high),frost=THREE.MathUtils.smoothstep(above,.46,.94);
        const cloud=.18+.10*Math.sin(point[0]*.13+point[2]*.09+seed*.017);
        tint.copy(dense).lerp(bubbly,cloud).lerp(snow,frost);
        return tint.multiplyScalar(.95+.035*Math.sin(point[0]*.31+point[1]*.37+point[2]*.17+seed*.013)).toArray();
      };
      const iceTriangle=(p,q,r,outward)=>{
        a.fromArray(q).sub(c.fromArray(p));b.fromArray(r).sub(c);normal.crossVectors(a,b);
        for(const point of normal.dot(outward)>=0?[p,q,r]:[p,r,q]){
          positions.push(...point);colors.push(...iceColor(point));
        }
      };
      const sides=[-1,1].map(side=>[0,1,2,3].map(layer=>tops.map((top,i)=>{
        const t=i/(tops.length-1),interior=Math.sin(t*Math.PI)**2;
        const weather=.5+.5*Math.sin(seed*.037+i*1.71+side),joint=.5+.5*Math.sin(seed*.013+i*2.73+side*.4);
        const crestFraction=top===1?1:Math.min(.985,top+Math.sin(seed*.017+i*1.73+side)*.025*Math.sin(t*Math.PI));
        const datum=Math.max(low,Math.min(high,0)),crest=datum+(high-datum)*crestFraction;
        const notch=THREE.MathUtils.clamp(WATER_LEVEL/SCALE-.035,low+(crest-low)*.10,crest-(crest-low)*.42);
        const levels=[low,notch,crest-(crest-notch)*(.28+weather*.06),crest];
        const recess=interior*[0,.045+weather*.085,.02+joint*.065,.10+weather*.12+joint*.025][layer];
        return coordinates(t,wall.start&&side===-1&&layer<3?-1:side*(1-recess),levels[layer]);
      })));
      for(let side=0;side<2;side++){
        const layers=sides[side],outward=new THREE.Vector3(outwardAxis.x*(side*2-1),0,outwardAxis.y*(side*2-1));
        for(let layer=0;layer<3;layer++)for(let i=0;i<10;i++){
          iceTriangle(layers[layer][i],layers[layer+1][i],layers[layer][i+1],outward);
          iceTriangle(layers[layer][i+1],layers[layer+1][i],layers[layer+1][i+1],outward);
        }
      }
      const up=new THREE.Vector3(0,1,0),down=new THREE.Vector3(0,-1,0);
      for(let i=0;i<10;i++){
        iceTriangle(sides[0][3][i],sides[1][3][i],sides[0][3][i+1],up);
        iceTriangle(sides[0][3][i+1],sides[1][3][i],sides[1][3][i+1],up);
        // Matching every side segment avoids long bottom triangles with
        // unmatched intermediate edges along the submerged base.
        iceTriangle(sides[0][0][i],sides[0][0][i+1],sides[1][0][i],down);
        iceTriangle(sides[0][0][i+1],sides[1][0][i+1],sides[1][0][i],down);
      }
      for(const end of [0,10]){
        const sign=end===0?-1:1,outward=new THREE.Vector3(tangent.x*sign,0,tangent.y*sign);
        for(let layer=0;layer<3;layer++){
          iceTriangle(sides[0][layer][end],sides[1][layer][end],sides[0][layer+1][end],outward);
          iceTriangle(sides[0][layer+1][end],sides[1][layer][end],sides[1][layer+1][end],outward);
        }
      }
      ranges.push({id:wall.id,start,count:positions.length/3-start});
      continue;
    }
    for(const side of [-1,1]){
      const layers=[0,.42,.76,1].map(fraction=>RIDGE.map((_,i)=>{
        const t=i/(RIDGE.length-1);
        const shoulder=wall.start?high*.82:high*(.40+.13*(.5+.5*Math.sin(seed*.13+i*2.1+side)));
        // Alternate fractured recesses and projecting shelves. The bottom and
        // end caps remain on their original footprint, enclosing the map.
        const interior=Math.sin(t*Math.PI)**2;
        const chipped=.5+.5*Math.sin(i*2.7+seed*.37+side);
        const recess=wall.start&&side===-1?0:fraction===0?0:interior*(fraction===.76?.035+chipped*.055:.08+chipped*.25);
        const split=fraction===0||fraction===1?0:interior*Math.sin(i*2.3+seed+side)*.065;
        return coordinates(t,side*(1-recess),low+(shoulder-low)*(fraction+split));
      }));
      for(let layer=0;layer<layers.length-1;layer++)for(let i=0;i<RIDGE.length-1;i++){
        triangle(layers[layer][i],layers[layer+1][i],layers[layer][i+1],layer);
        triangle(layers[layer][i+1],layers[layer+1][i],layers[layer+1][i+1],layer);
      }
      const edge=layers.at(-1);faces.push({bottom:layers[0],edge});
      for(let i=0;i<RIDGE.length-1;i++){
        triangle(edge[i],ridge[i],edge[i+1],3);
        triangle(edge[i+1],ridge[i],ridge[i+1],3);
      }
    }
    for(const end of [0,RIDGE.length-1]){
      const front=faces[0],back=faces[1];
      triangle(front.bottom[end],back.bottom[end],front.edge[end]);
      triangle(front.edge[end],back.bottom[end],back.edge[end]);
      triangle(front.edge[end],back.edge[end],ridge[end],2);
    }
    triangle(faces[0].bottom[0],faces[0].bottom.at(-1),faces[1].bottom[0]);
    triangle(faces[1].bottom[0],faces[0].bottom.at(-1),faces[1].bottom.at(-1));
    ranges.push({id:wall.id,start,count:positions.length/3-start});
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.userData.ranges=ranges;
  return geometry;
}
