import * as T from './vendor/three.module.js';
import { FIELD_LINE, groundHeight, MAIN_TRAIL, SIDE_TRAILS, seeded, WORLD_HALF } from './layout.mjs';
import { repeatSurface } from './surfaces.mjs';

function land(scene, soil, barren) {
  const geometry = new T.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2, 272, 272);
  geometry.rotateX(-Math.PI / 2);
  const points = geometry.attributes.position;
  const colors = new Float32Array(points.count * 3);
  const blight = new Float32Array(points.count);
  const shade = new T.Color('#948d77');
  const moss = new T.Color('#babfa4');
  const earth = new T.Color('#b9a994');
  const wasteland = new T.Color('#ceab8a');
  const color = new T.Color();
  const random = seeded(333);
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i);
    const z = points.getZ(i);
    points.setY(i, groundHeight(x, z));
    const village = Math.max(0, 1 - Math.hypot(x * .61, (z - 4) * .38) / 27);
    const patch = .40 + .20 * Math.sin(x * .16 + z * .13) + .16 * Math.cos(x * .39 - z * .31) + random() * .20;
    color.copy(shade).lerp(moss, patch).lerp(earth, village * .82);
    const rot = T.MathUtils.smoothstep(z + 4 * Math.sin(x * .11 + z * .16), FIELD_LINE + 1, FIELD_LINE + 24);
    blight[i] = rot;
    color.lerp(wasteland, rot * (.65 + .31 * patch));
    color.toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
  geometry.setAttribute('blight', new T.BufferAttribute(blight, 1));
  geometry.computeVertexNormals();
  const surface = new T.MeshStandardMaterial({
    vertexColors: true, map: soil, bumpMap: soil, bumpScale: .035, roughness: .93,
  });
  surface.onBeforeCompile = (shader) => {
    shader.uniforms.barrenMap = { value: barren };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float blight;\nvarying float vBlight;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvBlight = blight;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D barrenMap;\nvarying float vBlight;')
      .replace('#include <map_fragment>', `
        vec3 leafLitter = texture2D(map, vMapUv).rgb;
        vec3 dryClay = texture2D(barrenMap, vMapUv * 1.18).rgb;
        diffuseColor.rgb *= mix(leafLitter, dryClay, vBlight);
      `)
      .replace('#include <bumpmap_pars_fragment>', T.ShaderChunk.bumpmap_pars_fragment
        .replace('vec2 dHdxy_fwd() {', `
          float groundRelief(vec2 uv) {
            return mix(texture2D(bumpMap, uv).r, texture2D(barrenMap, uv * 1.18).r, vBlight);
          }
          vec2 dHdxy_fwd() {
        `)
        .replaceAll(/texture2D\( bumpMap, (vBumpMapUv[^)]*?) \)\.x/g, 'groundRelief($1)'));
  };
  const terrain = new T.Mesh(geometry, surface);
  terrain.receiveShadow = true;
  scene.add(terrain);
}

function trail(scene, road, isMain, material) {
  const curve = new T.CatmullRomCurve3(road.map(([x, z]) => new T.Vector3(x, 0, z)));
  const segments = Math.ceil(curve.getLength() / .55);
  const positions = [];
  const shades = [];
  const uvs = [];
  const faces = [];
  const blending = [];
  const random = seeded(33 + road.length);
  const dirt = new T.Color('#b8a790');
  const paving = new T.Color('#d9caba');
  const color = new T.Color();
  const center = new T.Vector3();
  const tangent = new T.Vector3();
  for (let i = 0; i <= segments; i++) {
    curve.getPointAt(i / segments, center);
    curve.getTangentAt(i / segments, tangent);
    const town = T.MathUtils.smoothstep(center.z, -34, -12) * (1 - T.MathUtils.smoothstep(center.z, 39, 68));
    const width = (isMain ? 1.57 + 1.56 * town : 1 + .67 * town) + .18 * Math.sin(i * .25);
    for (const cross of [-1, -.63, 0, .63, 1]) {
      const displacement = (width + random() * .30) * cross;
      const x = center.x - tangent.z * displacement;
      const z = center.z + tangent.x * displacement;
      positions.push(x, groundHeight(x, z) + .065 + (isMain ? .036 : 0), z);
      uvs.push((x + WORLD_HALF) / (WORLD_HALF * 2), (WORLD_HALF - z) / (WORLD_HALF * 2));
      const edge = Math.abs(cross);
      blending.push(town * (1 - edge ** 4 * .74), 1 - edge ** 4);
      color.copy(dirt).lerp(paving, town).multiplyScalar(.81 + random() * .26).toArray(shades, shades.length);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < 4; j++) {
      const a = i * 5 + j;
      faces.push(a, a + 1, a + 5, a + 1, a + 6, a + 5);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(shades, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('trailBlend', new T.Float32BufferAttribute(blending, 2));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  const mesh = new T.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.renderOrder = isMain ? 1 : 0;
  scene.add(mesh);
}

function roadMaterial(soil, cobble) {
  const material = new T.MeshStandardMaterial({
    vertexColors: true, map: soil, bumpMap: soil, bumpScale: .035, roughness: .83,
    transparent: true, alphaTest: .035,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.pavingMap = { value: cobble };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 trailBlend;\nvarying vec2 vTrailBlend;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvTrailBlend = trailBlend;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D pavingMap;\nvarying vec2 vTrailBlend;')
      .replace('#include <bumpmap_pars_fragment>', T.ShaderChunk.bumpmap_pars_fragment
        .replace('vec2 dHdxy_fwd() {', `
          float trailHeight(vec2 uv) {
            return mix(texture2D(bumpMap, uv).r, texture2D(pavingMap, uv * 1.78).r, vTrailBlend.x);
          }
          vec2 dHdxy_fwd() {
        `)
        .replaceAll(/texture2D\( bumpMap, (vBumpMapUv[^)]*?) \)\.x/g, 'trailHeight($1)'))
      .replace('#include <map_fragment>', `
        vec3 litter = texture2D(map, vMapUv).rgb;
        vec3 stones = texture2D(pavingMap, vMapUv * 1.78).rgb;
        float mud = smoothstep(0.0, 0.34, stones.r);
        diffuseColor.rgb *= mix(mix(litter, vec3(0.24, 0.198, 0.149), 0.54), stones, vTrailBlend.x);
        diffuseColor.a *= vTrailBlend.y;
      `)
      .replace('#include <roughnessmap_fragment>', `
        #include <roughnessmap_fragment>
        float wet = 0.55 + 0.45 * sin(vMapUv.x * 1.9 + vMapUv.y * 1.6);
        roughnessFactor = mix(roughnessFactor, mix(0.7, 0.38, wet * mud), vTrailBlend.x);
      `);
  };
  return material;
}

export function createTerrain(scene, surfaces) {
  const soil = repeatSurface(surfaces.forest, 148);
  land(scene, soil, repeatSurface(surfaces.barren));
  const road = roadMaterial(soil, repeatSurface(surfaces.cobble));
  trail(scene, MAIN_TRAIL, true, road);
  for (const route of SIDE_TRAILS) trail(scene, route, false, road);
}
