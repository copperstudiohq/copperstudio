import * as THREE from './vendor/three.module.js';

const TAU = Math.PI * 2;

/** Two longitudinal rows cover the entire gray back and both side arches.
 * The lower white ventral plates deliberately remain clear. */
export const CENTIPEDE_SPIKES = Object.freeze([-.34, .34].flatMap(row =>
  [-1.36, -.92, -.46, 0, .46, .92, 1.36].map(angle => Object.freeze({ row, angle }))));

export function centipedeSpikePose(spike, width, taper, plateLength) {
  const cross = Math.sqrt(1 - spike.row * spike.row), sine = Math.sin(spike.angle), cosine = Math.cos(spike.angle);
  const normal = [-.18, cosine * 1.4, sine], norm = Math.hypot(...normal);
  const length = width * taper * (.32 - .07 * Math.abs(sine));
  const skin = [spike.row * plateLength, width * (.52 + .50 * taper * cross * cosine), width * taper * cross * sine];
  const base = skin.map((value, axis) => value - normal[axis] / norm * width * .018);
  const tip = skin.map((value, axis) => value + normal[axis] / norm * length);
  return { base, tip, radius: width * taper * .075 };
}

/** A black cornea with a white annular iris, baked into one colored prototype.
 * The exposed centre is still black; there is no emissive orange eye layer. */
export function createCentipedeEyeGeometry() {
  const sphere = new THREE.SphereGeometry(1, 16, 10), torus = new THREE.TorusGeometry(.52, .065, 8, 24).translate(0, 0, .85);
  const globe = sphere.toNonIndexed(), ring = torus.toNonIndexed(); sphere.dispose(); torus.dispose();
  const result = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) {
    const a = globe.attributes[name], b = ring.attributes[name], values = new Float32Array(a.array.length + b.array.length);
    values.set(a.array); values.set(b.array, a.array.length); result.setAttribute(name, new THREE.BufferAttribute(values, a.itemSize));
  }
  const colors = new Float32Array(result.attributes.position.count * 3);
  colors.fill(1, globe.attributes.position.count * 3); result.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  result.userData = { blackVertexCount: globe.attributes.position.count, whiteRingStart: globe.attributes.position.count,
    ringRadius: .52, ringTube: .065, ringZ: .85 };
  result.name = 'centipede-black-eye-with-white-ring'; result.computeBoundingBox(); result.computeBoundingSphere();
  globe.dispose(); ring.dispose(); return result;
}

/** A long stance sweeps backwards against the ice; a shorter, raised recovery
 * travels forward. The wave advances along the single leg pair per tergite. */
export function centipedeLegPose(phase, index, side, width) {
  const cycle = ((phase - index * .82 + (side < 0 ? Math.PI : 0)) / TAU % 1 + 1) % 1;
  const stance = .68, swing = cycle < stance ? cycle / stance : (cycle - stance) / (1 - stance);
  const fore = cycle < stance ? .38 - swing * .76 : -.38 + (1 - Math.cos(swing * Math.PI)) * .38;
  const lift = cycle < stance ? 0 : Math.sin(swing * Math.PI) * .18;
  const hip = [0, .38 * width, side * .60 * width];
  const foot = [fore * width, (.045 + lift) * width, side * 1.10 * width];
  const dx = foot[0] - hip[0], dy = foot[1] - hip[1], dz = foot[2] - hip[2];
  const distance = Math.hypot(dx, dy, dz), upper = .46 * width, lower = .60 * width;
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, upper * upper - along * along));
  const nx = dx / distance, ny = dy / distance, nz = dz / distance;
  let bx = -nx * ny, by = 1 - ny * ny, bz = -nz * ny;
  const length = Math.hypot(bx, by, bz); bx /= length; by /= length; bz /= length;
  const knee = [hip[0] + nx * along + bx * bend, hip[1] + ny * along + by * bend,
    hip[2] + nz * along + bz * bend];
  return { hip, knee, foot, stance: cycle < stance };
}

/** Green seams are part of the shell surface, rather than luminous geometry or
 * lights. The normal-based mask keeps the white belly and joints unpainted. */
export function applyCentipedePatterns(material) {
  const previous = material.onBeforeCompile.bind(material), key = material.customProgramCacheKey.bind(material);
  material.onBeforeCompile = shader => {
    previous(shader);
    shader.vertexShader = 'varying vec3 vCentipedeShell;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvCentipedeShell=position;');
    shader.fragmentShader = `varying vec3 vCentipedeShell;
      float centipedeMark(vec3 p){
        float fork=abs(abs(p.z)-(.35+.12*sin(p.x*7.)));
        float veins=1.-smoothstep(.022,.055,fork);
        float saddle=(1.-smoothstep(.018,.055,abs(p.x+.38+.075*cos(p.z*8.))))
          *smoothstep(.20,.40,abs(p.z));
        float pores=(1.-smoothstep(.025,.065,abs(abs(p.z)-.85)))
          *(1.-smoothstep(.06,.13,abs(p.x-.25)));
        return max(max(veins,saddle),pores)*smoothstep(.08,.32,p.y);
      }
      ${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\nfloat centipedePattern=centipedeMark(vCentipedeShell);\n'
      + 'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.095,.38,.12),centipedePattern*.78);');
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(.07,.85,.12)*centipedePattern;');
  };
  material.customProgramCacheKey = () => key() + '|centipede-green-seams-v1';
  return material;
}
