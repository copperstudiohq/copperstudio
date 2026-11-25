import {PREPARED_PERIMETER_BORDERS} from './world-perimeter-data.js';
import {WATER_LEVEL,EYE_HEIGHT} from './terrain.js';
import {getSulfuricGround} from './sulfuric-biome.js';
import {isInsidePerimeter} from './world-perimeter.js';
import {ShapeUtils,Vector2} from './vendor/three.module.js';

const caches=new WeakMap(),CELL=200,SURFACE_FEET=WATER_LEVEL-EYE_HEIGHT+9,FOOT=SURFACE_FEET+10;
const WALK_NORMAL=1/Math.sqrt(1+.65*.65),EPS=.06;
// A visible five-metre final fracture exceeds the 48-unit jump and 14-unit
// hand reach. Include neighboring rim segments within the full jump span.
const RIM_RISE=125,RIM_REACH=205;
const U=[0,.14,.20,.40,.47,.67,.73,1],P=[0,.16,.16,.40,.40,.64,.64,1];
const wideIds=new Set(['perimeter-main-67','perimeter-main-68','perimeter-main-69','perimeter-main-70']);
const mix=(a,b,t)=>a+(b-a)*t,key=(x,y)=>`${Math.floor(x/CELL)}:${Math.floor(y/CELL)}`;
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const finite=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
const point=(x,y,z)=>({x:Math.fround(x/25)*25,y:Math.fround(y/25)*25,z:Math.fround(z/25)*25});
const overlap=(a,b)=>a.minX<=b.maxX&&a.maxX>=b.minX&&a.minY<=b.maxY&&a.maxY>=b.minY;
const protectedBoxes=[{minX:4900,maxX:5400,minY:-13200,maxY:-9500},
  {minX:5850,maxX:6350,minY:-13200,maxY:-9500},{minX:4200,maxX:6400,minY:-13930,maxY:-11920}];

function normal(a,b,c){
  const ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z,vx=c.x-a.x,vy=c.y-a.y,vz=c.z-a.z;
  const x=uy*vz-uz*vy,y=uz*vx-ux*vz,z=ux*vy-uy*vx,length=Math.hypot(x,y,z);
  return length>1e-9?{x:x/length,y:y/length,z:z/length}:null;
}

function lowestNearbyRim(x,y,region,segments){
  let lowest=Infinity;
  for(const s of segments){
    if(s.region!==region||x<s.minX||x>s.maxX||y<s.minY||y>s.maxY)continue;
    const t=((x-s.a.x)*s.dx+(y-s.a.y)*s.dy)/s.lengthSq;
    const perpendicularSq=(x-s.a.x-s.dx*t)**2+(y-s.a.y-s.dy*t)**2;
    if(perpendicularSq>RIM_REACH**2)continue;
    const reach=Math.sqrt((RIM_REACH**2-perpendicularSq)/s.lengthSq),lo=Math.max(0,t-reach),hi=Math.min(1,t+reach);
    if(lo<=hi)lowest=Math.min(lowest,mix(s.a.z,s.b.z,lo),mix(s.a.z,s.b.z,hi));
  }
  return lowest;
}

function surface(cache,x,y){
  let result=null,winner=null;
  for(const triangle of cache.cells.get(key(x,y))??[]){
    const {a,b,c,denominator}=triangle;
    const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/denominator;
    const v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/denominator,w=1-u-v;
    if(u< -1e-7||v< -1e-7||w< -1e-7)continue;
    const z=a.z*u+b.z*v+c.z*w;
    if(!result||z>result.z){winner=triangle;result={z,normal:triangle.normal,triangleId:triangle.id,low:triangle.low,region:triangle.region,kind:'orange-cliff'};}
  }
  // Borders follow a sloping buried seabed. Use the visible bottom triangle,
  // rather than a whole-strip minimum, for the solid column's lower surface.
  if(winner)for(const{a,b,c,denominator}of winner.floor){
    const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/denominator;
    const v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/denominator,w=1-u-v;
    if(u>=-1e-7&&v>=-1e-7&&w>=-1e-7){result.low=a.z*u+b.z*v+c.z*w;break;}
  }
  return result;
}

function build(borders){
  if(!Array.isArray(borders))throw new TypeError('Orange cliff surfaces need the authored border array.');
  let cached=caches.get(borders);if(cached)return cached;
  const walls=borders.filter(w=>w.kind==='stone'&&w.start),nodes=new Map(),areas=[];
  for(const wall of walls){
    if(![wall.start,wall.end,wall.outward].every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y))
      ||!Number.isFinite(wall.height)||!Number.isFinite(wall.baseZ??-280)
      ||wall.height<=(wall.baseZ??-280)||Math.hypot(wall.outward.x,wall.outward.y)<.001
      ||Math.hypot(wall.end.x-wall.start.x,wall.end.y-wall.start.y)<.001)
      throw new TypeError(`Orange cliff ${wall.id??'(unnamed)'} needs finite distinct endpoints, an outward normal and a crest above its base.`);
  }
  const nodeKey=(w,p)=>`${w.region??'custom'}:${p.x}:${p.y}`;
  for(const wall of walls)for(const p of[wall.start,wall.end]){
    const k=nodeKey(wall,p),wide=wideIds.has(wall.id)||!String(wall.id).startsWith('perimeter-');
    let node=nodes.get(k);
    if(!node){node={x:p.x,y:p.y,nx:0,ny:0,high:wall.height,low:wall.baseZ??-280,wide:false,region:wall.region};nodes.set(k,node);}
    node.nx+=wall.outward.x;node.ny+=wall.outward.y;node.high=Math.min(node.high,wall.height);
    node.low=Math.min(node.low,wall.baseZ??-280);node.wide||=wide;
  }
  for(const node of nodes.values()){
    const length=Math.hypot(node.nx,node.ny);node.nx/=length;node.ny/=length;
    node.toe=node.region==='sulfur'?(getSulfuricGround(node.x,node.y)??node.low)+2:FOOT;
    node.crest=Math.max(node.toe+30,node.high*.88);
    node.width=node.wide?(node.crest-node.toe)/.43+54:185+105*(.5+.5*Math.sin(node.x*.007+node.y*.009));
  }
  // Deep offsets can turn inside-out at acute authored coast corners. Narrow
  // only those shared endpoint profiles until the complete apron is simple.
  for(let pass=0;pass<18;pass++){
    let changed=false;
    for(const wall of walls){
      const a=nodes.get(nodeKey(wall,wall.start)),b=nodes.get(nodeKey(wall,wall.end));
      const ax=a.x-a.nx*a.width,ay=a.y-a.ny*a.width,bx=b.x-b.nx*b.width,by=b.y-b.ny*b.width;
      const expected=(b.x-a.x)*wall.outward.y-(b.y-a.y)*wall.outward.x;
      const first=(bx-ax)*(a.y-ay)-(by-ay)*(a.x-ax),second=(bx-a.x)*(b.y-a.y)-(by-a.y)*(b.x-a.x);
      if(first*expected<=0||second*expected<=0){a.width*=.8;b.width*=.8;changed=true;}
    }
    if(!changed)break;
  }
  const rimSegments=walls.map(wall=>{
    const nodesAtEnds=[nodes.get(nodeKey(wall,wall.start)),nodes.get(nodeKey(wall,wall.end))];
    const[a,b]=nodesAtEnds.map(n=>point(n.x-n.nx*30,n.y-n.ny*30,n.crest));
    const dx=b.x-a.x,dy=b.y-a.y;
    return{a,b,dx,dy,lengthSq:dx*dx+dy*dy,region:wall.region,
      minX:Math.min(a.x,b.x)-RIM_REACH,maxX:Math.max(a.x,b.x)+RIM_REACH,
      minY:Math.min(a.y,b.y)-RIM_REACH,maxY:Math.max(a.y,b.y)+RIM_REACH};
  });
  const positions=[],tops=[],cells=new Map(),ranges=[];
  const emit=(a,b,c,outward,top=false,low=0,region,floor)=>{
    let n=normal(a,b,c);if(!n)return;
    if(n.x*outward.x+n.y*outward.y+n.z*outward.z<0){[b,c]=[c,b];n={x:-n.x,y:-n.y,z:-n.z};}
    // Swapping simulation Y/Z reverses handedness in renderer coordinates.
    for(const p of[a,c,b])positions.push(p.x/25,p.z/25,p.y/25);
    if(top){
      const denominator=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
      if(Math.abs(denominator)<1e-7)return;
      const triangle={a,b,c,normal:n,denominator,low,region,floor,id:`orange-cliff-triangle-${tops.length}`};tops.push(triangle);
      const minX=Math.floor(Math.min(a.x,b.x,c.x)/CELL),maxX=Math.floor(Math.max(a.x,b.x,c.x)/CELL);
      const minY=Math.floor(Math.min(a.y,b.y,c.y)/CELL),maxY=Math.floor(Math.max(a.y,b.y,c.y)/CELL);
      for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++){
        const k=`${x}:${y}`;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(triangle);
      }
    }
  };
  for(const wall of walls){
    const left=nodes.get(nodeKey(wall,wall.start)),right=nodes.get(nodeKey(wall,wall.end));
    const candidates=[left,right].flatMap(n=>[{x:n.x,y:n.y},{x:n.x-n.nx*n.width,y:n.y-n.ny*n.width}]);
    const bounds={minX:Math.min(...candidates.map(p=>p.x)),maxX:Math.max(...candidates.map(p=>p.x)),minY:Math.min(...candidates.map(p=>p.y)),maxY:Math.max(...candidates.map(p=>p.y))};
    if(protectedBoxes.some(box=>overlap(bounds,box)))continue;
    const steps=Math.max(1,Math.ceil(Math.hypot(wall.end.x-wall.start.x,wall.end.y-wall.start.y)/120));
    const rows=[],bottoms=[],start=positions.length/3;
    for(let i=0;i<=steps;i++){
      const t=i/steps,x=mix(left.x,right.x,t),y=mix(left.y,right.y,t),nx=mix(left.nx,right.nx,t),ny=mix(left.ny,right.ny,t);
      const width=mix(left.width,right.width,t),toe=mix(left.toe,right.toe,t),crest=mix(left.crest,right.crest,t),low=mix(left.low,right.low,t);
      const ramp=width-54,distances=[0,24,...U.slice(1).map(u=>24+u*ramp),width],heights=[toe,toe,...P.slice(1).map(p=>mix(toe,crest,p)),crest];
      distances[7]=width-50; // Lower lookout; the following20 units are steep rock.
      // The shared world-coordinate field carries ribs and worn notches
      // through adjacent strip endpoints; it never shifts the toe or back.
      const lane=smooth(25,80,Math.abs((x-8788.145019)*.135113205+(y+10153.603197)*.990830168));
      rows.push(distances.map((s,j)=>{
        const u=(s-24)/ramp,interior=j>1&&j<distances.length-2;
        const envelope=interior?Math.sin(Math.PI*Math.max(0,Math.min(1,u))):0;
        const field=Math.sin(x*.023+y*.017+j*1.71)*.65+Math.sin(x*.047-y*.031+j*.83)*.35;
        const shift=envelope*field*Math.min(22,width*.028)*lane;
        const relief=envelope*(Math.sin(x*.031+y*.019+j*2.11)*.7+Math.sin(x*.061-y*.043+j)*.3)*28*lane;
        const p=point(x-nx*(width-s-shift),y-ny*(width-s-shift),heights[j]+relief);
        if(j<8)p.z=Math.min(p.z,Math.fround((lowestNearbyRim(p.x,p.y,wall.region,rimSegments)-RIM_RISE)/25)*25);
        return p;
      }));
      bottoms.push([point(x-nx*width,y-ny*width,low),point(x,y,low)]);
    }
    for(let i=0;i<steps;i++){
      const a=rows[i],b=rows[i+1],low=Math.min(left.low,right.low);
      const floor=[[bottoms[i][0],bottoms[i][1],bottoms[i+1][0]],[bottoms[i+1][0],bottoms[i][1],bottoms[i+1][1]]]
        .map(([a,b,c])=>({a,b,c,denominator:(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y)}));
      for(let j=0;j<a.length-1;j++){emit(a[j],b[j],a[j+1],{x:0,y:0,z:1},true,low,wall.region,floor);emit(a[j+1],b[j],b[j+1],{x:0,y:0,z:1},true,low,wall.region,floor);}
      emit(bottoms[i][0],bottoms[i][1],bottoms[i+1][0],{x:0,y:0,z:-1});emit(bottoms[i+1][0],bottoms[i][1],bottoms[i+1][1],{x:0,y:0,z:-1});
      for(const end of[0,a.length-1]){
        const out={x:wall.outward.x*(end?1:-1),y:wall.outward.y*(end?1:-1),z:0},k=end?1:0;
        emit(a[end],bottoms[i][k],b[end],out);emit(b[end],bottoms[i][k],bottoms[i+1][k],out);
      }
    }
    const length=Math.hypot(wall.end.x-wall.start.x,wall.end.y-wall.start.y),tx=(wall.end.x-wall.start.x)/length,ty=(wall.end.y-wall.start.y)/length;
    for(const end of[0,steps]){
      const polygon=[...rows[end],bottoms[end][1],bottoms[end][0]],out={x:tx*(end?1:-1),y:ty*(end?1:-1),z:0};
      // Terraces make this section concave: a simple fan would overlap its
      // own face and reverse some boundary edges. Ear clipping closes it once.
      const toe=polygon[0],inner=rows[end].at(-1),dx=inner.x-toe.x,dy=inner.y-toe.y,length=Math.hypot(dx,dy);
      const contour=polygon.map(p=>new Vector2(((p.x-toe.x)*dx+(p.y-toe.y)*dy)/length,p.z));
      for(const[a,b,c]of ShapeUtils.triangulateShape(contour,[]))emit(polygon[a],polygon[b],polygon[c],out);
    }
    ranges.push({id:wall.id,start,count:positions.length/3-start});areas.push({wall,rows,bottoms,bounds,left,right});
  }
  cached={positions:new Float32Array(positions),tops,cells,areas,ranges,routes:[]};caches.set(borders,cached);
  const routeArea=areas.find(area=>area.wall.id==='perimeter-main-68')??areas.find(area=>area.left.wide&&area.right.wide);
  if(routeArea){
    const i=Math.floor((routeArea.rows.length-1)/2),t=i/(routeArea.rows.length-1),n={x:mix(routeArea.left.nx,routeArea.right.nx,t),y:mix(routeArea.left.ny,routeArea.right.ny,t)};
    const toe=routeArea.rows[i][0],inner=routeArea.rows[i].at(-1),width=Math.hypot(inner.x-toe.x,inner.y-toe.y),path=[];
    for(let step=0;step<=24;step++){
      const s=mix(8,width-60,step/24),x=toe.x+n.x*s,y=toe.y+n.y*s,support=surface(cached,x,y);
      if(support)path.push({x,y,z:support.z});
    }
    const summitX=toe.x+n.x*(width-20),summitY=toe.y+n.y*(width-20),summit=surface(cached,summitX,summitY);
    if(path.length>2&&summit){
      for(const p of path)Object.freeze(p);
      cached.routes.push(Object.freeze({id:`${routeArea.wall.id}-climb`,region:routeArea.wall.region,
        approach:Object.freeze({x:toe.x-n.x*22,y:toe.y-n.y*22,z:SURFACE_FEET}),
        foot:path[0],lookout:path.at(-1),summit:Object.freeze({x:summitX,y:summitY,z:summit.z}),path:Object.freeze(path)}));
    }
  }
  Object.freeze(cached.routes);
  return cached;
}

/** Exact rendered triangle support; simulation XYZ, with Z vertical. */
export function getOrangeCliffSurface(x,y,borders=PREPARED_PERIMETER_BORDERS){
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  return surface(build(borders),x,y);
}
/** Static supporting/solid triangles, already converted to renderer X/Y-up/Z. */
export function getOrangeCliffMeshData(borders=PREPARED_PERIMETER_BORDERS){return build(borders);}
/** Read-only lower climbing route and its physically inaccessible upper rim. */
export function getOrangeCliffRoutes(borders=PREPARED_PERIMETER_BORDERS){return build(borders).routes;}

function blocked(cache,p,radius,bodyHeight){
  const center=surface(cache,p.x,p.y),standing=center&&p.z>=center.z-EPS&&center.normal.z>=WALK_NORMAL;
  for(const [dx,dy]of[[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]]){
    const support=surface(cache,p.x+dx,p.y+dy);
    if(support&&p.z+bodyHeight>support.low&&p.z<support.z-EPS&&!(standing&&support.z-p.z<=radius*.65+EPS))return true;
  }
  return false;
}

/** Solid extrusion below the exact top. Descending feet land on a swept top;
 * embedded/swimming bodies escape laterally at current depth, never teleport up.
 */
export function resolveOrangeCliffMovement(from,to,bodyHeight=36,radius=5,borders=PREPARED_PERIMETER_BORDERS){
  if(!finite(from)||!finite(to)||![bodyHeight,radius].every(Number.isFinite)||bodyHeight<=0||radius<0)return{...to};
  const cache=build(borders);if(!cache.tops.length)return{...to};
  if(blocked(cache,from,radius,bodyHeight)){
    const region=surface(cache,from.x,from.y)?.region;
    for(let distance=radius+2;distance<=2400;distance+=10)for(let side=0;side<16;side++){
      const angle=side*Math.PI/8,candidate={x:from.x+Math.cos(angle)*distance,y:from.y+Math.sin(angle)*distance,z:from.z};
      if((!['main','sulfur'].includes(region)||isInsidePerimeter(region,candidate.x,candidate.y,radius))
        &&!blocked(cache,candidate,radius,bodyHeight))return{x:candidate.x,y:candidate.y,z:from.z};
    }
    return{...from};
  }
  const source=surface(cache,from.x,from.y),target=surface(cache,to.x,to.y);
  const walking=source&&target&&Math.abs(from.z-source.z)<EPS&&Math.abs(to.z-target.z)<EPS;
  const mounting=target&&Math.abs(to.z-target.z)<EPS&&to.z>=from.z&&to.z-from.z<=14;
  const length=Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z),steps=Math.min(2048,Math.max(1,Math.ceil(length/5)));
  let previous={...from};
  for(let i=1;i<=steps;i++){
    const t=i/steps,p={x:mix(from.x,to.x,t),y:mix(from.y,to.y,t),z:mix(from.z,to.z,t)},top=surface(cache,p.x,p.y);
    // Grounding supplies exact endpoint heights. Follow the actual intervening
    // triangles across worn slope/terrace joins instead of cutting through them.
    if((walking||mounting)&&top&&top.normal.z>=WALK_NORMAL&&(!mounting||top.z<=from.z+14))p.z=top.z;
    if(top&&top.normal.z>=WALK_NORMAL&&to.z<from.z&&previous.z>=top.z-EPS&&p.z<top.z){return{x:p.x,y:p.y,z:top.z};}
    if(blocked(cache,p,radius,bodyHeight)){
      let safe=(i-1)/steps,hit=t;
      for(let j=0;j<16;j++){
        const q=(safe+hit)/2,candidate={x:mix(from.x,to.x,q),y:mix(from.y,to.y,q),z:mix(from.z,to.z,q)};
        if(blocked(cache,candidate,radius,bodyHeight))hit=q;else safe=q;
      }
      // Keep the complete swept contact pose, including exact underside Z.
      return{x:mix(from.x,to.x,safe),y:mix(from.y,to.y,safe),z:mix(from.z,to.z,safe)};
    }
    previous=p;
  }
  return{...to};
}
