/** Fixed shelf at the northern ocean edge, across the water from the forest. */
export const SHELL_FIELD=Object.freeze({
  id:'shell-field',name:'Shell Field',minX:1800,maxX:7500,minY:-11100,maxY:-8100,minDepthMeters:16,maxDepthMeters:40,
  boundary:Object.freeze([
    [1800,-11100],[7500,-11100],[7500,-8900],[6710,-8300],
    [5810,-8600],[4910,-8200],[4010,-8500],[3120,-8100],
    [2220,-8400],[1800,-8900],
  ].map(([x,y])=>Object.freeze({x,y}))),
});
/** Broad rounded stone hills, authored in metres over the descending shelf. */
export const SHELL_FIELD_HILLS=Object.freeze([
  [2050,-10300,360,440,5.5],[2470,-10700,350,400,4.8],
  [2840,-9000,370,420,6.4],[3260,-9800,390,440,7.0],
  [3730,-10600,350,400,5.8],[4180,-9200,380,430,6.5],
  [4660,-10100,390,440,7.8],[5170,-9500,380,430,6.6],
  [5650,-10600,350,420,5.5],[6130,-9400,360,420,7.2],
  [6580,-10100,390,420,6.7],[7080,-9700,360,400,5.5],
].map(([x,y,rx,ry,height])=>Object.freeze({x,y,rx,ry,height})));

/** Signed distance in simulation units; positive inside the authored outline. */
export function shellFieldClearance(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))return -Infinity;
  const boundary=SHELL_FIELD.boundary;let inside=false,distance=Infinity;
  for(let i=0,j=boundary.length-1;i<boundary.length;j=i++){
    const a=boundary[j],b=boundary[i],dx=b.x-a.x,dy=b.y-a.y;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));
    distance=Math.min(distance,Math.hypot(x-a.x-dx*t,y-a.y-dy*t));
    if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return distance<1e-8?0:inside?distance:-distance;
}
export function isShellField(x,y){return shellFieldClearance(x,y)>=0;}

/** A 24 m transition belt blends the shelf into the existing ocean floor. */
export function shellFieldBlend(x,y){
  if(x<1200||x>8100||y<-11700||y>-7500)return 0;
  const t=Math.max(0,Math.min(1,(shellFieldClearance(x,y)+600)/600));
  return t*t*(3-2*t);
}

export function isOceanBiome(biome){return biome==='blue-ocean'||biome==='shell-field';}

/** Pale stone clearings leave about 80% of the floor covered in squid armor. */
export const SHELL_FIELD_STONE_PATCHES=Object.freeze([
  [2450,-10050,441,534],[3300,-8900,513,380],[4200,-10350,513,431],
  [5050,-9350,472,390],[6150,-10300,513,513],[6950,-9400,308,359],
].map(([x,y,rx,ry])=>Object.freeze({x,y,rx,ry})));

/** Calculated once into a byte per terrain vertex, never per animation frame. */
export function shellFieldArmorBlend(x,y){
  if(x<SHELL_FIELD.minX||x>SHELL_FIELD.maxX||y<SHELL_FIELD.minY||y>SHELL_FIELD.maxY||!isShellField(x,y))return 0;
  let stone=0;
  for(const patch of SHELL_FIELD_STONE_PATCHES){
    const radius=((x-patch.x)/patch.rx)**2+((y-patch.y)/patch.ry)**2;
    const edge=radius+.09*Math.sin(x/170)*Math.sin(y/210);
    const t=Math.max(0,Math.min(1,(1-edge)/.38));
    stone=Math.max(stone,t*t*(3-2*t));
  }
  return 1-stone;
}
