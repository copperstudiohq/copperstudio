import * as THREE from './vendor/three.module.js';
import { PlantMesh } from './plant-mesh.js';

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const geometry = mesh => mesh.geometry({ normalizeHeight: false });

/** Distance to the authored cheek edge keeps the dome inside the crescent;
 * unlike a single ellipsoid it cannot fill the mouth or the concave middle. */
function edgeDistance(outline, y, z) {
  let distance = Infinity;
  for (let i = 0; i < outline.length - 1; i++) {
    const a = outline[i], b = outline[i + 1], dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((-z - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    distance = Math.min(distance, Math.hypot(-z - a.x - dx * t, y - a.y - dy * t));
  }
  return distance;
}

/** A closed, rounded volume made from one smooth outline. Front and back
 * converge at the rim; there are no extruded walls, bevel corners or flat caps. */
function roundedCrescentBody(outline, curves) {
  const profile=outline.getPoints(curves), flat=new THREE.ShapeGeometry(outline,curves);
  const p=flat.attributes.position, positions=[],coordinates=[];
  const thickness=(y,z)=>.0012+.0748*Math.sqrt(1-Math.exp(-edgeDistance(profile,y,z)/.044));
  const emit=(a,b,c,side,depth=0)=>{
    const distance=(a,b)=>Math.hypot(a.y-b.y,a.z-b.z);
    if(depth<1&&Math.max(distance(a,b),distance(b,c),distance(c,a))>.043){
      const mid=(a,b)=>({y:(a.y+b.y)/2,z:(a.z+b.z)/2});
      const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);
      emit(a,ab,ca,side,depth+1);emit(ab,b,bc,side,depth+1);emit(ca,bc,c,side,depth+1);emit(ab,bc,ca,side,depth+1);return;
    }
    for(const q of(side>0?[a,b,c]:[c,b,a])){positions.push(side*thickness(q.y,q.z),q.y,q.z);coordinates.push(-q.z,q.y);}
  };
  for(let i=0;i<flat.index.count;i+=3){const points=[0,1,2].map(j=>{const k=flat.index.getX(i+j);return{y:p.getY(k),z:-p.getX(k)};});emit(...points,1);emit(...points,-1);}
  // A two-millimetre rounded seam closes the exact mid-plane, preserving
  // the real mouth opening and avoiding cracks at float precision.
  for(let i=0;i<profile.length-1;i++){
    const a=profile[i],b=profile[i+1],points=[[.0012,a.y,-a.x],[-.0012,a.y,-a.x],[.0012,b.y,-b.x],[-.0012,a.y,-a.x],[-.0012,b.y,-b.x],[.0012,b.y,-b.x]];
    for(const q of points){positions.push(...q);coordinates.push(-q[2],q[1]);}
  }
  flat.dispose();const result=new THREE.BufferGeometry();
  result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));result.setAttribute('uv',new THREE.Float32BufferAttribute(coordinates,2));result.computeVertexNormals();
  const pos=result.attributes.position,norm=result.attributes.normal,seams=new Map();
  for(let i=0;i<pos.count;i++){const key=[pos.getX(i),pos.getY(i),pos.getZ(i)].map(x=>Math.round(x*1e6)).join(':');let seam=seams.get(key);if(!seam)seams.set(key,seam={indices:[],sum:v(0,0,0)});seam.indices.push(i);seam.sum.add(v(norm.getX(i),norm.getY(i),norm.getZ(i)));}
  for(const seam of seams.values()){seam.sum.normalize();for(const i of seam.indices)norm.setXYZ(i,seam.sum.x,seam.sum.y,seam.sum.z);}
  for(let i=0;i<pos.count;i++){
    if(Math.abs(pos.getX(i))<.008)continue;
    const y=pos.getY(i),z=pos.getZ(i),epsilon=.00015;
    const dy=(thickness(y+epsilon,z)-thickness(y-epsilon,z))/(2*epsilon),dz=(thickness(y,z+epsilon)-thickness(y,z-epsilon))/(2*epsilon);
    const n=v(Math.sign(pos.getX(i)),-dy,-dz).normalize();norm.setXYZ(i,n.x,n.y,n.z);
  }
  return result;
}

function addSkinDetails(body, detail) {
  const indexed = geometry(detail), extra = indexed.toNonIndexed(), joined = new THREE.BufferGeometry();
  indexed.dispose();
  for (const name of ['position', 'normal', 'uv', 'color']) {
    const a = body.attributes[name], b = extra.attributes[name], values = new Float32Array(a.array.length + b.array.length);
    values.set(a.array); values.set(b.array, a.array.length); joined.setAttribute(name, new THREE.BufferAttribute(values, a.itemSize));
  }
  body.dispose(); extra.dispose(); return joined;
}

/** Interpolate the actual rounded triangles before seating an eye or fold.
 * Sampling the analytic dome alone could place a socket above a coarse cap. */
function skinHeight(body, y, z) {
  const p = body.attributes.position; let height = 0;
  for (let i = 0; i < p.count; i += 3) {
    const ay = p.getY(i), az = p.getZ(i), by = p.getY(i + 1), bz = p.getZ(i + 1), cy = p.getY(i + 2), cz = p.getZ(i + 2);
    const divisor = (bz - cz) * (ay - cy) + (cy - by) * (az - cz);
    if (Math.abs(divisor) < 1e-12) continue;
    const a = ((bz - cz) * (y - cy) + (cy - by) * (z - cz)) / divisor;
    const b = ((cz - az) * (y - cy) + (ay - cy) * (z - cz)) / divisor, c = 1 - a - b;
    if (a >= -1e-7 && b >= -1e-7 && c >= -1e-7)
      height = Math.max(height, a * p.getX(i) + b * p.getX(i + 1) + c * p.getX(i + 2));
  }
  return height;
}

/** Original reference-drawing anatomy. Front is −Z, Y is up and the thin
 * cheeks face ±X. One metre spans the nose through the four filament tips.
 * @param {{mobile?:boolean}} [quality]
 */
export function createRedFishAnatomy({ mobile = false } = {}) {
  // A real concave crescent, including a small front mouth notch. Extrusion
  // closes the cap with triangles rather than filling its open inner curve.
  const outline = new THREE.Shape();
  outline.moveTo(.40, .026);
  outline.bezierCurveTo(.34, .13, .22, .31, -.13, .35);
  outline.bezierCurveTo(-.22, .36, -.25, .32, -.22, .28);
  outline.bezierCurveTo(-.08, .23, .015, .15, .035, .035);
  outline.bezierCurveTo(.045, .01, .045, -.01, .035, -.035);
  outline.bezierCurveTo(.015, -.15, -.08, -.23, -.22, -.28);
  outline.bezierCurveTo(-.25, -.32, -.22, -.36, -.13, -.35);
  outline.bezierCurveTo(.22, -.31, .34, -.13, .40, -.026);
  outline.bezierCurveTo(.393,-.028,.362,-.013,.345,-.015); outline.quadraticCurveTo(.33,0,.345,.015); outline.bezierCurveTo(.362,.013,.393,.028,.40,.026); outline.closePath();
  const curves = mobile ? 12 : 20;
  let body = roundedCrescentBody(outline, curves);
  const pigment = [], red = new THREE.Color(0xb51b18), dark = new THREE.Color(0x781112), tint = new THREE.Color();
  const bp = body.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i);
    const grain = .5 + .5 * Math.sin(z * 101 + y * 67) * Math.sin(y * 123 - x * 71);
    tint.copy(red).lerp(dark, Math.max(0, -y) * .65 + grain * .13);
    pigment.push(tint.r, tint.g, tint.b);
  }
  body.setAttribute('color', new THREE.Float32BufferAttribute(pigment, 3));

  const eyes = new PlantMesh(), fins = new PlantMesh(), filaments = new PlantMesh(), details = new PlantMesh();
  const eyeCenters = [];
  for (const side of [-1, 1]) for (const [y, z] of [[.225, -.205], [.105, -.277], [-.105, -.277], [-.225, -.205]]) {
    const height = skinHeight(body, y, z), center = v(side * (height - .002), y, z); eyeCenters.push(center.toArray());
    // Red orbital folds partly cover a shallow black cornea. The eye's back
    // actually intersects the cheek rather than floating outside its face.
    details.grid(mobile ? 10 : 14, mobile ? 3 : 4, (u, t) => {
      const angle = u * Math.PI * 2, cross = t * Math.PI * 2;
      return v(side * (height + .001 + Math.sin(cross) * .003),
        y + Math.cos(angle) * (.029 + Math.cos(cross) * .003),
        z + Math.sin(angle) * (.028 + Math.cos(cross) * .003));
    }, 0x921917);
    eyes.ellipsoid(center, v(.013, .026, .025), 0x080f12,
      { segments: mobile ? 10 : 16, rings: mobile ? 4 : 6 });
    eyes.ellipsoid(center.clone().add(v(side * .0115, .007, -.006)), v(.0022, .0032, .0028), 0x718485,
      { segments: 6, rings: 3 });
  }
  // Narrow paired gill folds and a raised lip stay in the shared skin batch.
  for (const side of [-1, 1]) for (let slit = 0; slit < (mobile ? 2 : 3); slit++) {
    const z = -.161 + slit * .017, points = [0, .5, 1].map(u => {
      const y = -.052 + u * .104, along = z + Math.sin(u * Math.PI) * .008;
      return v(side * (skinHeight(body, y, along) + .0008), y, along);
    });
    details.tube(points, .0015, 0x651013, 8);
  }
  for (const side of [-1, 1]) details.tube([v(-.032, side * .025, -.392), v(0, side * .027, -.397), v(.032, side * .025, -.392)],
    .0025, 0xb51b18, 8);
  body = addSkinDetails(body, details);
  // Two broad flexible fins occupy the crescent's open middle, with narrow
  // attached bases and rounded tips, exactly as in the supplied side profile.
  for (const side of [-1, 1]) fins.grid(mobile ? 8 : 12, mobile ? 4 : 6, (u, t) => {
    const width = Math.sin(Math.PI * u) ** .55;
    const ribs = Math.cos((t * 2 - 1) * Math.PI * 2) * .0025 * width;
    return v(Math.sin(u * Math.PI) * side * (.012 + ribs), side * .083 + (t * 2 - 1) * .043 * width,
      -.055 + u * .367);
  }, u => tint.setHex(0x8d171b).lerp(new THREE.Color(0xc62f25), u * .7).getHex());
  for (const side of [-1, 1]) for (const pair of [0, 1]) {
    const root = v((pair - .5) * .025, side * (.285 + pair * .038), .18), steps = mobile ? 6 : 10;
    const points = Array.from({ length: steps + 1 }, (_, i) => {
      const u = i / steps;
      return root.clone().add(v(Math.sin(u * Math.PI * 3 + pair) * .010 * u,
        side * Math.sin(u * Math.PI * 5 + pair * .7) * .014 * u, .40 * u));
    });
    filaments.tube(points, points.map((_, i) => .011 * (1 - i / steps) ** .7 + .0018),
      u => tint.setHex(0xb02520).lerp(new THREE.Color(0xd43c2f), u * .45).getHex(), mobile ? 4 : 5);
  }
  const result = { body, eyes: geometry(eyes), fins: geometry(fins), filaments: geometry(filaments) };
  for (const [name, g] of Object.entries(result)) {
    g.name = `red-crescent-fish-${name}`;
    if (name === 'fins' || name === 'filaments') {
      const p = g.attributes.position, weight = [], slope = [], start = name === 'fins' ? -.055 : .18;
      const span = name === 'fins' ? .367 : .40;
      for (let i = 0; i < p.count; i++) {
        const u = Math.max(0, Math.min(1, (p.getZ(i) - start) / span));
        weight.push(u * u); slope.push(2 * u / span);
      }
      g.setAttribute('fishWave', new THREE.Float32BufferAttribute(weight, 1));
      g.setAttribute('fishWaveSlope', new THREE.Float32BufferAttribute(slope, 1));
    }
    g.computeBoundingBox();
  }
  const bounds = new THREE.Box3();
  for (const g of Object.values(result)) bounds.union(g.boundingBox);
  const length = bounds.max.z - bounds.min.z, center = (bounds.max.z + bounds.min.z) * .5;
  for (const g of Object.values(result)) {
    g.translate(0, 0, -center).scale(1 / length, 1 / length, 1 / length);
    const slope = g.attributes.fishWaveSlope;
    if (slope) for (let i = 0; i < slope.count; i++) slope.setX(i, slope.getX(i) * length);
    g.computeBoundingBox(); g.computeBoundingSphere();
  }
  const normalized = p => [p[0] / length, p[1] / length, (p[2] - center) / length];
  result.body.userData = { crescent: true, canonicalLengthMeters: 1, mouthNotch: true,
    eyeCenters: eyeCenters.map(normalized), filamentRoots: [[-.01261,-.28755,.0957],[.01261,-.3259,.0957],[-.01261,.28755,.0957],[.01261,.3259,.0957]],
    finRoots: [normalized([0, .083, -.055]), normalized([0, -.083, -.055])], finCount: 2 };
  return result;
}
