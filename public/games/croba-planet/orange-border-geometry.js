import * as THREE from './vendor/three.module.js';
import {SEABED_LEVEL} from './terrain.js';
import {getSulfuricGround} from './sulfuric-biome.js';

const SCALE=25,STEP_METERS=5;
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,value)=>{const t=THREE.MathUtils.clamp((value-a)/(b-a),0,1);return t*t*(3-2*t);};

function stripFor(wall){
  if(![wall.x,wall.y,wall.rx,wall.ry,wall.height,wall.baseZ??SEABED_LEVEL].every(Number.isFinite)
    ||wall.rx<=0||wall.ry<=0||wall.height<=(wall.baseZ??SEABED_LEVEL))
    throw new TypeError(`Orange border ${wall.id??'(unnamed)'} needs finite dimensions, positive radii and a crest above its base.`);
  if(wall.start){
    if(![wall.start,wall.end,wall.outerStart,wall.outerEnd].every(point=>point&&Number.isFinite(point.x)&&Number.isFinite(point.y)))
      throw new TypeError(`Orange border ${wall.id??'(unnamed)'} needs four finite strip endpoints.`);
    return{wall,start:wall.start,end:wall.end,outerStart:wall.outerStart,outerEnd:wall.outerEnd};
  }
  const alongX=wall.rx>=wall.ry;
  return{wall,start:{x:wall.x-wall.rx,y:wall.y-wall.ry},
    end:alongX?{x:wall.x+wall.rx,y:wall.y-wall.ry}:{x:wall.x-wall.rx,y:wall.y+wall.ry},
    outerStart:alongX?{x:wall.x-wall.rx,y:wall.y+wall.ry}:{x:wall.x+wall.rx,y:wall.y-wall.ry},
    outerEnd:{x:wall.x+wall.rx,y:wall.y+wall.ry}};
}

function protectedHeight(wall,x,y){
  const ground=wall.region==='sulfur'?getSulfuricGround(x,y):0;
  // The sulfur mouth liner reaches z150; its existing mineral lip must stay
  // flush with the cliff well above that ceiling. Salt is wholly below zero.
  const portal=Math.abs(y+11300)<210&&x>=5900&&x<=6300?260:0;
  return Math.max(portal,ground+61)/SCALE;
}

function crestAt(x,y,high,low,protectedTop){
  const rx=x/SCALE,rz=y/SCALE;
  const weather=.865+.065*Math.sin(rx*.035+rz*.027)+.035*Math.sin(rx*.11-rz*.073);
  const datum=Math.max(low,0),candidate=datum+(high-datum)*weather;
  return Math.min(high,Math.max(protectedTop+1.4,candidate));
}

/** A connected orange cliff with weathered rounded shoulders. Shared endpoint
 * cross-sections remove per-strip square steps; coordinate-based crest fields
 * replace the repeated small RIDGE pattern. All lower inner faces retain the
 * exact authored perimeter, while upper wear recedes only into the rock strip.
 * @param {ReadonlyArray<object>} borders
 * @returns {THREE.BufferGeometry}
 */
export function createOrangeBorderGeometry(borders){
  if(!Array.isArray(borders))throw new TypeError('Orange border geometry needs the authored border array.');
  const strips=borders.filter(wall=>wall.kind==='stone').map(stripFor),nodes=new Map();
  const key=(wall,point)=>`${wall.region??'legacy'}:${point.x}:${point.y}`;
  for(const strip of strips)for(const end of[0,1]){
    const {wall}=strip,point=end?strip.end:strip.start,outer=end?strip.outerEnd:strip.outerStart,id=key(wall,point);
    let node=nodes.get(id);
    if(!node){node={point,outer,low:(wall.baseZ??SEABED_LEVEL)/SCALE,high:wall.height/SCALE,protected:protectedHeight(wall,point.x,point.y),owners:0};nodes.set(id,node);}
    node.low=Math.min(node.low,(wall.baseZ??SEABED_LEVEL)/SCALE);node.high=Math.min(node.high,wall.height/SCALE);
    node.protected=Math.max(node.protected,protectedHeight(wall,point.x,point.y));node.owners++;
  }
  for(const node of nodes.values())node.crest=crestAt(node.point.x,node.point.y,node.high,node.low,node.protected);

  const positions=[],colors=[],ranges=[],tint=new THREE.Color(),light=new THREE.Color(0xf1b38c);
  const colorAt=point=>{
    // Keep the existing orange family, without per-facet bands or seed jumps
    // at the small prepared strips. Variation is continuous in world space.
    const frost=smooth(12,39,point[1])*.72;
    tint.setHex(0xca824e).lerp(light,frost);
    const weather=.89+.025*Math.sin(point[1]*1.6+point[0]*.13+point[2]*.11)
      +.018*Math.sin(point[0]*.31-point[2]*.23+point[1]*.42);
    return tint.multiplyScalar(weather).toArray();
  };
  const addTriangle=(triangles,a,b,c)=>{triangles.push([a,b,c]);};
  for(const strip of strips){
    const {wall}=strip,left=nodes.get(key(wall,strip.start)),right=nodes.get(key(wall,strip.end));
    const length=Math.hypot(strip.end.x-strip.start.x,strip.end.y-strip.start.y)/SCALE;
    if(length<1e-6)throw new RangeError(`Orange border ${wall.id??'(unnamed)'} has a zero-length strip.`);
    const steps=Math.max(1,Math.ceil(length/STEP_METERS)),sections=[];
    for(let step=0;step<=steps;step++){
      const t=step/steps,node=step===0?left:step===steps?right:null;
      const x=node?node.point.x:lerp(strip.start.x,strip.end.x,t),y=node?node.point.y:lerp(strip.start.y,strip.end.y,t);
      const ox=node?node.outer.x:lerp(strip.outerStart.x,strip.outerEnd.x,t),oy=node?node.outer.y:lerp(strip.outerStart.y,strip.outerEnd.y,t);
      const low=node?node.low:lerp(left.low,right.low,t),high=lerp(left.high,right.high,t);
      const protectedTop=node?node.protected:Math.max(lerp(left.protected,right.protected,t),protectedHeight(wall,x,y));
      const crest=node?node.crest:crestAt(x,y,high,low,protectedTop),rise=Math.max(.2,crest-protectedTop);
      const weather=.5+.5*Math.sin(x/SCALE*.09+y/SCALE*.07);
      const profile=[[0,low],[0,crest-rise*(.24+weather*.025)],
        [.055,crest-rise*.085],[.22,crest-rise*.018],[.5,crest],
        [.78,crest-rise*.025],[.945,crest-rise*.095],[1,crest-rise*.22],[1,low]];
      sections.push(profile.map(([across,height])=>[(x+(ox-x)*across)/SCALE,height,(y+(oy-y)*across)/SCALE]));
    }
    const triangles=[],count=sections[0].length;
    for(let step=0;step<steps;step++)for(let side=0;side<count;side++){
      const next=(side+1)%count,a=sections[step][side],b=sections[step+1][side],c=sections[step][next],d=sections[step+1][next];
      addTriangle(triangles,a,b,c);addTriangle(triangles,c,b,d);
    }
    for(let side=1;side<count-1;side++){
      addTriangle(triangles,sections[0][0],sections[0][side],sections[0][side+1]);
      addTriangle(triangles,sections[steps][0],sections[steps][side+1],sections[steps][side]);
    }
    // One consistent winding for the complete closed strip is robust even
    // where the irregular top is locally concave alongshore.
    const center=new THREE.Vector3((strip.start.x+strip.end.x+strip.outerStart.x+strip.outerEnd.x)/(4*SCALE),
      (left.low+right.low+left.crest+right.crest)/4,(strip.start.y+strip.end.y+strip.outerStart.y+strip.outerEnd.y)/(4*SCALE));
    let volume=0;
    for(const points of triangles){const [a,b,c]=points.map(point=>new THREE.Vector3(...point).sub(center));volume+=a.dot(b.cross(c))/6;}
    const start=positions.length/3;
    for(const points of triangles)for(const point of volume>=0?points:[points[0],points[2],points[1]]){
      positions.push(...point);colors.push(...colorAt(point));
    }
    ranges.push({id:wall.id,start,count:positions.length/3-start});
  }
  const geometry=new THREE.BufferGeometry();geometry.name='connected-weathered-orange-border';
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  geometry.userData={ranges,sharedCrestEndpoints:[...nodes.values()].filter(node=>node.owners>1).length,
    profileVertices:9,alongshoreStepMeters:STEP_METERS};return geometry;
}
