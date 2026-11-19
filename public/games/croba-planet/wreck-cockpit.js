/** Compact concept-art canopy: two broad slanted front panes, paired angular
 * side windows, a solid orange roof and heavy structural frames. Metres. */
export function addCompactCockpit(ship){
 const top=[0,3.35,4.6],bottom=[0,1.55,6.9],edges=new Set();
 const frame=(a,b)=>{
  const key=[a.join(','),b.join(',')].sort().join('|');if(edges.has(key))return;edges.add(key);
  ship.strut('darkMetal','cockpit-mullion',a,b,.075);
 };
 const pane=points=>{
  ship.panel('glass','framed-cockpit-pane',points);
  for(let i=0;i<points.length;i++)frame(points[i],points[(i+1)%points.length]);
 };
 for(const side of [-1,1]){
  const rearRoof=[side*1.35,3.8,2],frontRoof=[side*1.55,3.35,4.6];
  const rearBase=[side*2.55,1.65,2],midBase=[side*2.15,1.6,4.6],frontBase=[side*1.8,1.55,6.9];
  pane([rearRoof,frontRoof,midBase,rearBase]);
  pane([frontRoof,frontBase,midBase]);
  pane([frontRoof,top,bottom,frontBase]);
  ship.panel('orangeMetal','armored-cockpit-cheek',[rearBase,midBase,frontBase,[side*1.35,1.05,8.5],[side*1.15,.28,8.5],[side*2.45,.5,2]]);
  ship.strut('whiteMetal','cockpit-cheek-edge',rearBase,frontBase,.045);
  ship.panel('orangeMetal','short-cockpit-nose',[frontBase,bottom,[0,1.05,8.5],[side*1.35,1.05,8.5]]);
 }
 ship.panel('orangeMetal','solid-cockpit-roof',[[-1.35,3.8,2],[1.35,3.8,2],[1.55,3.35,4.6],[-1.55,3.35,4.6]]);
 ship.panel('orangeMetal','closed-short-nose',[[-1.35,1.05,8.5],[1.35,1.05,8.5],[1.15,.28,8.5],[-1.15,.28,8.5]]);
 ship.panel('darkMetal','recessed-nose-intake',[[-.95,.43,8.51],[.95,.43,8.51],[1.0,.77,8.51],[-1.0,.77,8.51]]);
 ship.strut('whiteMetal','armored-nose-bumper',[-1.15,.29,8.5],[1.15,.29,8.5],.065);
 for(const x of [-.55,0,.55])ship.strut('orangeMetal','nose-intake-divider',[x,.43,8.53],[x,.77,8.53],.025);
 ship.strut('whiteMetal','roof-leading-frame',[-1.55,3.35,4.6],[1.55,3.35,4.6],.04);
}
