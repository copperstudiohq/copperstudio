/** Fixed starter pose and roof load, shared by scenery and the bird colony. */
export const STARTER_WRECK_SITE=Object.freeze({x:-5720,y:-850,z:0,designVersion:2,lengthMeters:20.5,yaw:.18,heatRadius:440});
export const STARTER_ROOF_CARGO=Object.freeze({x:0,z:-2.6,width:2.4,length:4.4,baseY:4.5,topY:5.45});

/** A restrained, weathered roof crate uses the ship's existing surface batches. */
export function addWreckRoofCargo(ship){
 const c=STARTER_ROOF_CARGO,height=c.topY-c.baseY;
 ship.box('orangeMetal','roof-cargo-crate',[c.x,c.baseY+height/2,c.z],[c.width,height,c.length]);
 ship.box('darkMetal','roof-cargo-crate-lid',[c.x,c.topY-.035,c.z],[c.width+.06,.07,c.length+.06]);
 for(const side of[-1,1]){
  ship.box('whiteMetal','roof-cargo-edge',[side*(c.width/2+.02),c.baseY+height/2,c.z],[.08,height+.04,c.length+.08]);
  for(const z of[c.z-c.length/2,c.z+c.length/2]){
   const roof=4.5-.7*(z+6)/8;
   ship.strut('darkMetal','roof-cargo-mount',[side*.95,roof,z],[side*.95,c.baseY,z],.065);
   ship.box('darkMetal','roof-cargo-strap-anchor',[side*1.3,roof+.035,z],[.19,.07,.22]);
  }
 }
 for(const z of[c.z-1.35,c.z+1.35]){
  ship.box('darkMetal','roof-cargo-tie-down',[0,c.topY+.012,z],[c.width+.12,.025,.11]);
  for(const side of[-1,1])ship.strut('darkMetal','roof-cargo-tie-down',[side*1.24,c.baseY,z],[side*1.24,c.topY,z],.035);
 }
 for(const x of[-.8,-.4,0,.4,.8])ship.box('whiteMetal','roof-crate-rib',[x,c.baseY+height/2,c.z+c.length/2+.015],[.045,height*.8,.04]);
 ship.box('whiteMetal','roof-crate-cargo-label',[0,c.baseY+height*.52,c.z+c.length/2+.04],[.7,.27,.025]);
}
