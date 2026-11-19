import{BASIN_CAVES,basinCaveStation,basinCaveSection}from'./basin-caves.js';

/** Shared nest transforms keep feeding animals attached to the visible bones.
 * These are fixed authoring controls, never randomized during play. */
export const BASIN_BONE_NEST_SITES=Object.freeze([...new Set(BASIN_CAVES.map(c=>c.platformId))].flatMap(platformId=>
 BASIN_CAVES.filter(c=>c.platformId===platformId).flatMap((cave,index)=>[0,1].map(i=>{
  const s=i?.76:.61,lateral=(i?-1:1)*basinCaveStation(cave,s).width*.42;
  const x=cave.x+cave.nx*s*cave.length-cave.ny*lateral,y=cave.y+cave.ny*s*cave.length+cave.nx*lateral;
  const rotation=i*2.13+index*.83+Math.atan2(cave.nx,cave.ny);
  return Object.freeze({id:`bone-nest-${cave.id}-${i}`,kind:'nest',x,y,z:basinCaveSection(cave,x,y).floor+.375,
   yaw:Math.PI/2-rotation,rotation,habitat:'cave',platformId,caveId:cave.id});
 }))));
