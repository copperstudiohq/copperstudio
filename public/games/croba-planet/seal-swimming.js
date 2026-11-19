const clamp = (value, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, value));
const finite = value => Number.isFinite(value) ? value : 0;

/** Animation follows the simulation's phase and measured propulsion effort.
 * No render clock is integrated, so pause, culling and skipped draws cannot
 * advance a swim stroke. Captured animals keep a quiet resting silhouette. */
export function sealSwimmingParameters(animal, reducedMotion = false, target = {}) {
  target.phase = finite(animal.phase);
  target.power = clamp(.08 + .55 * clamp(finite(animal.speed) / 175) + .4 * clamp(finite(animal.jet)));
  target.motion = reducedMotion || animal.squidHeldBy || animal.squidRespawnIn > 0 ? 0 : 1;
  const downstroke = Math.max(0, -Math.cos(target.phase * 4.8 + 1.15));
  target.jetPulse = target.motion ? .25 + .75 * downstroke * downstroke : .55;
  return target;
}

/** Conservative displacement in metres, including simultaneous body and fin
 * motion. Every species keeps its original six shared rendering batches. */
export const SEAL_SWIMMING_BOUNDS = Object.freeze({ body: .32, fins: .85 });

function terms(point, pose, fin, bodyZ, out) {
  const phase = pose.phase * 4.8, power = pose.power, motion = pose.motion;
  const t = clamp((.7 - bodyZ) / 2), dt = bodyZ > -1.3 && bodyZ < .7 ? -.5 : 0;
  const wave = phase + t * 2.4, a = .075 + .20 * power, b = .025 + .065 * power;
  out.bx = a * t * t * Math.sin(wave) * motion;
  out.by = b * t * t * Math.sin(wave + 1.2) * motion;
  out.dx = a * dt * (2 * t * Math.sin(wave) + t * t * Math.cos(wave) * 2.4) * motion;
  out.dy = b * dt * (2 * t * Math.sin(wave + 1.2) + t * t * Math.cos(wave + 1.2) * 2.4) * motion;
  out.fx = out.fy = out.fz = out.dfx = out.dfy = out.dfz = 0;
  if (!fin) return out;
  const tail = point.z < -.8, root = tail ? .08 : .38, span = tail ? .45 : .57;
  const side = Math.sign(point.x), raw = (Math.abs(point.x) - root) / span;
  const reach = clamp(raw), dr = raw > 0 && raw < 1 ? side / span : 0;
  const p = phase + (tail ? 1.15 : 0), beat = Math.sin(p) + .22 * Math.sin(2 * p);
  const fold = .5 + .5 * Math.cos(p), drive = Math.max(0, -Math.cos(p));
  const spread = tail ? .065 * power * Math.cos(p) : -.12 * power * fold;
  const lift = (.12 + .30 * power) * beat, sweep = -.23 * power * drive * drive + .045 * Math.sin(p);
  out.fx = side * spread * reach * motion;
  out.fy = lift * reach ** 1.5 * motion;
  out.fz = sweep * reach * motion;
  out.dfx = side * spread * dr * motion;
  out.dfy = lift * 1.5 * Math.sqrt(reach) * dr * motion;
  out.dfz = sweep * dr * motion;
  return out;
}

const scratch = {};
/** CPU twin of the GPU surface for bounds and attachment checks.
 * @param {{x:number,y:number,z:number}} point @param {{phase:number,power:number,motion:number}} pose
 */
export function deformSealSwimmingPoint(point, pose, fin = false, target = {}, bodyZ = point.z) {
  const q = terms(point, pose, fin, bodyZ, scratch);
  target.x = point.x + q.bx + q.fx; target.y = point.y + q.by + q.fy; target.z = point.z + q.fz;
  return target;
}

/** Inverse-transpose of the combined deformation's exact Jacobian. */
export function deformSealSwimmingNormal(point, normal, pose, fin = false, target = {}, bodyZ = point.z) {
  const q = terms(point, pose, fin, bodyZ, scratch), determinant = 1 + q.dfx - q.dfz * q.dx;
  const x = (normal.x - (q.dfy - q.dfz * q.dy) * normal.y - q.dfz * normal.z) / determinant;
  const y = normal.y, z = normal.z - q.dx * x - q.dy * y, length = Math.hypot(x, y, z) || 1;
  target.x = x / length; target.y = y / length; target.z = z / length; return target;
}

/** Wrap rather than replace species surface hooks, including Void Fish rims.
 * All solid batches receive identical body motion; head-local jaw/fang geometry
 * supplies its body-space Z so the stabilized head and hinge stay connected. */
export function applySealSwimming(material) {
  const previous = material.onBeforeCompile.bind(material), key = material.customProgramCacheKey.bind(material);
  material.onBeforeCompile = shader => {
    previous(shader);
    shader.vertexShader = `attribute float sealPhase,sealPower,sealMotion,sealBodyZ,sealFin;
      float sealStroke(float p){return sin(p)+.22*sin(2.*p);}
      void sealMotionTerms(vec3 p,out vec3 body,out vec3 bd,out vec3 fin,out vec3 fd){
        float cycle=sealPhase*4.8,t=clamp((.7-sealBodyZ)/2.,0.,1.);
        float dt=sealBodyZ> -1.3&&sealBodyZ<.7?-.5:0.,wave=cycle+t*2.4;
        float a=.075+.20*sealPower,b=.025+.065*sealPower;
        body=vec3(0.);bd=vec3(0.);
        if(t>0.&&sealMotion>0.){
          body=vec3(a*t*t*sin(wave),b*t*t*sin(wave+1.2),0.)*sealMotion;
          bd=vec3(a*dt*(2.*t*sin(wave)+t*t*cos(wave)*2.4),b*dt*(2.*t*sin(wave+1.2)+t*t*cos(wave+1.2)*2.4),0.)*sealMotion;
        }
        fin=vec3(0.);fd=vec3(0.);
        if(sealFin>.5&&sealMotion>0.){
          bool tail=p.z<-.8;float root=tail?.08:.38,span=tail?.45:.57;
          float raw=(abs(p.x)-root)/span,reach=clamp(raw,0.,1.),dr=raw>0.&&raw<1.?sign(p.x)/span:0.;
          float phase=cycle+(tail?1.15:0.),fold=.5+.5*cos(phase),drive=max(0.,-cos(phase));
          float spread=tail?.065*sealPower*cos(phase):-.12*sealPower*fold;
          float lift=(.12+.30*sealPower)*sealStroke(phase),sweep=-.23*sealPower*drive*drive+.045*sin(phase);
          fin=vec3(sign(p.x)*spread*reach,lift*pow(reach,1.5),sweep*reach)*sealMotion;
          fd=vec3(sign(p.x)*spread*dr,lift*1.5*sqrt(reach)*dr,sweep*dr)*sealMotion;
        }
      }
      ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        vec3 sealBody,sealBodyD,sealFinDelta,sealFinD;
        sealMotionTerms(position,sealBody,sealBodyD,sealFinDelta,sealFinD);
        float sealDet=1.+sealFinD.x-sealFinD.z*sealBodyD.x;
        float sealNormalX=(objectNormal.x-(sealFinD.y-sealFinD.z*sealBodyD.y)*objectNormal.y-sealFinD.z*objectNormal.z)/sealDet;
        objectNormal.z-=sealBodyD.x*sealNormalX+sealBodyD.y*objectNormal.y;
        objectNormal.x=sealNormalX;objectNormal=normalize(objectNormal);`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed.x+=sealBody.x+sealFinDelta.x;
        transformed.y+=sealBody.y+sealFinDelta.y;
        transformed.z+=sealFinDelta.z;`);
  };
  material.customProgramCacheKey = () => key() + '|seal-swimming-v3';
  return material;
}
