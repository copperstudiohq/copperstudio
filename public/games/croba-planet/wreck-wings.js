/** Fixed ship-local metres, shared by the wing faces, wildlife and nests. */
export const WRECK_WINGS = [-1,1].map(side=>{
  const tip=side>0?8.7:6.8;
  return {side,points:[[side*2.5,.9,.3],[side*tip,.22,-3],[side*(tip+.3),.17,-6.6],[side*3,.7,-5.8]]};
});

export const WRECK_WING_NESTS = [
  {x:6.05,z:-3.10,radius:.58,phase:.3},
  {x:7.45,z:-5.25,radius:.62,phase:1.4},
];

/** Height on the same two triangles used to render each wing, or null outside. */
export function wreckWingHeight(x,z) {
  for(const {points}of WRECK_WINGS)for(let i=1;i<points.length-1;i++){
    const [a,b,c]=[points[0],points[i],points[i+1]];
    const denominator=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);
    const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/denominator;
    const v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/denominator,w=1-u-v;
    if(Math.min(u,v,w)>=-1e-8)return a[1]*u+b[1]*v+c[1]*w;
  }
  return null;
}

/** Two shallow, woven twig bowls: static geometry sharing one bark draw/map set.
 * @param {{strut:Function}} ship WreckBuilder with ship-local geometry methods.
 */
export function addWreckWingNests(ship) {
  for(const [index,nest]of WRECK_WING_NESTS.entries()){
    const {x,z,radius,phase}=nest;
    const point=(dx,dz,height)=>{
      const surface=wreckWingHeight(x+dx,z+dz);
      if(surface===null)throw new RangeError(`Wing nest ${index} extends past the wing`);
      return [x+dx,surface+height,z+dz];
    };
    // Crossing floor sticks leave a visible hollow bowl rather than a solid disc.
    for(let twig=0;twig<10;twig++){
      const angle=phase+twig*2.39996,offset=((twig%5)-2)*radius*.16;
      const span=Math.sqrt(radius*radius*.67-offset*offset),dx=Math.cos(angle),dz=Math.sin(angle);
      ship.strut('bark',`penguin-nest-${index}-floor`,point(-dx*span-dz*offset,-dz*span+dx*offset,.04+twig%3*.012),point(dx*span-dz*offset,dz*span+dx*offset,.05),.018);
    }
    // Alternating angles interlock the rim, with blunt snapped ends extending out.
    for(let layer=0;layer<3;layer++)for(let twig=0;twig<10;twig++){
      const angle=phase+twig*Math.PI/5+(layer%2)*.27;
      const r=radius*(.86+layer*.065),spread=.39;
      const from=point(Math.cos(angle-spread)*r,Math.sin(angle-spread)*r,.075+layer*.065);
      const to=point(Math.cos(angle+spread)*r,Math.sin(angle+spread)*r,.085+layer*.065);
      ship.strut('bark',`penguin-nest-${index}-woven-rim`,from,to,.021+(twig%3)*.004);
      if(layer===1&&twig%3===0){
        const fork=point(Math.cos(angle+.16)*r*.76,Math.sin(angle+.16)*r*.76,.16);
        ship.strut('bark',`penguin-nest-${index}-fork`,from,fork,.012);
      }
    }
  }
}
