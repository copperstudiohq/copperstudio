import * as THREE from './assets/three.module.js';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

function atmosphere(fragmentShader, strength) {
  return new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: { uStrength: { value: strength } },
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, toneMapped: false });
}

/** Small visual-only atmosphere batches; the caller owns the returned resources. */
export function createMineSunlight() {
  const group = new THREE.Group(); group.name = 'drill-mine-shining-sunlight'; group.userData.visualOnly = true;
  const beamMaterial = atmosphere(`
varying vec2 vUv;
uniform float uStrength;
void main() {
  float edge = pow(max(0.0, 1.0 - abs(vUv.x * 2.0 - 1.0)), 2.2);
  float heightFade = mix(0.22, 1.0, smoothstep(0.0, 0.16, vUv.y)) * (1.0 - smoothstep(0.88, 1.0, vUv.y));
  float streak = 0.82 + 0.18 * sin(vUv.x * 37.0 + vUv.y * 3.0);
  gl_FragColor = vec4(1.0, 0.96, 0.79, uStrength * edge * heightFade * streak);
}`, .13);
  beamMaterial.name = 'mine-sunlight-soft-beams';
  const poolMaterial = atmosphere(`
varying vec2 vUv;
uniform float uStrength;
void main() {
  float radius = length((vUv - 0.5) * 2.0);
  float pool = 1.0 - smoothstep(0.25, 1.0, radius);
  gl_FragColor = vec4(1.0, 0.94, 0.70, pool * uStrength);
}`, .18);
  poolMaterial.name = 'mine-sunlight-floor-glow';
  const geometries = [], top = new THREE.Vector3(-13, 118, 10), bottom = new THREE.Vector3(9, .065, -10);
  const axes = [[1, 0, 34, 19], [0, 1, 26, 16], [Math.SQRT1_2, Math.SQRT1_2, 32, 18],
    [Math.SQRT1_2, -Math.SQRT1_2, 32, 18]];
  const visual = mesh => {
    mesh.userData.visualOnly = true; mesh.castShadow = mesh.receiveShadow = false;
    // Atmosphere is never a solid surface for placement, camera or weapon rays.
    mesh.raycast = () => {}; group.add(mesh); return mesh;
  };
  axes.forEach(([x, z, upperWidth, lowerWidth], index) => {
    const points = [bottom.x - x * lowerWidth / 2, bottom.y, bottom.z - z * lowerWidth / 2,
      bottom.x + x * lowerWidth / 2, bottom.y, bottom.z + z * lowerWidth / 2,
      top.x + x * upperWidth / 2, top.y, top.z + z * upperWidth / 2,
      top.x - x * upperWidth / 2, top.y, top.z - z * upperWidth / 2];
    const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
      .setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    geometry.setIndex([0, 1, 2, 0, 2, 3]); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    geometries.push(geometry);
    const beam = visual(new THREE.Mesh(geometry, beamMaterial)); beam.name = `mine-sunlight-shaft-${index}`;
  });
  const poolGeometry = new THREE.PlaneGeometry(32, 26); poolGeometry.rotateX(-Math.PI / 2);
  geometries.push(poolGeometry);
  const pool = visual(new THREE.Mesh(poolGeometry, poolMaterial)); pool.name = 'mine-sunlight-floor-pool';
  pool.position.copy(bottom); pool.renderOrder = 2;
  const light = new THREE.SpotLight(0xfff2cf, 14000, 180, .14, .75, 2);
  light.name = 'mine-shaft-daylight'; light.position.copy(top); light.target.position.copy(bottom);
  light.castShadow = false; group.add(light, light.target);
  return { group, geometries, materials: [beamMaterial, poolMaterial], light };
}
