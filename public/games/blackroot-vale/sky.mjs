import * as T from './vendor/three.module.js';
import { seeded } from './layout.mjs';

const vertex = `
  varying vec3 direction;
  void main() {
    direction = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragment = `
  varying vec3 direction;

  float noise(vec2 p) {
    vec2 k = floor(p);
    vec2 f = smoothstep(0.0, 1.0, fract(p));
    vec4 cell = vec4(k.x + k.y * 197.0) + vec4(0.0, 1.0, 197.0, 198.0);
    vec4 values = fract(sin(cell * 12.723) * 4162.14);
    return mix(mix(values.x, values.y, f.x), mix(values.z, values.w, f.x), f.y);
  }

  void main() {
    vec3 d = normalize(direction);
    vec3 moon = normalize(vec3(0.32, 0.38, -1.0));
    float horizon = max(0.0, d.y);
    vec3 blue = mix(vec3(0.096, 0.154, 0.160), vec3(0.018, 0.037, 0.077), smoothstep(0.0, 0.65, horizon));
    float glimmer = max(0.0, dot(d, moon));
    blue += pow(glimmer, 16.0) * vec3(0.048, 0.071, 0.096);
    blue += pow(glimmer, 108.0) * vec3(0.070, 0.106, 0.120);
    vec2 p = d.xz * 5.2 / (0.32 + horizon) + vec2(d.y * 11.6, 1.6);
    float curtain = 0.59 * noise(p) + 0.27 * noise(p * 2.0 + 4.1) + 0.14 * noise(p * 4.1);
    float layer = smoothstep(0.42, 0.8, curtain) * smoothstep(0.0, 0.12, horizon);
    blue = mix(blue, vec3(0.039, 0.064, 0.084) + vec3(0.052, 0.078, 0.091) * pow(glimmer, 18.0), layer * 0.83);
    vec3 southBank = normalize(vec3(-0.18, 0.22, 1.0));
    float lowCloud = pow(max(0.0, dot(d, southBank)), 34.0) * smoothstep(0.32, 0.64, curtain);
    blue = mix(blue, vec3(0.026, 0.038, 0.051), lowCloud * .40);
    gl_FragColor = vec4(blue, 1.0);
    #include <colorspace_fragment>
  }
`;

function moonTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const haze = ctx.createRadialGradient(128, 128, 24, 128, 128, 128);
  haze.addColorStop(0, '#edffffae');
  haze.addColorStop(.28, '#aff0ff75');
  haze.addColorStop(.61, '#c1eeff20');
  haze.addColorStop(1, '#8ac7eb00');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, 256, 256);
  ctx.beginPath();
  ctx.arc(128, 128, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#fff9da';
  ctx.fill();
  ctx.clip();
  const random = seeded(556);
  for (let i = 0; i < 44; i++) {
    ctx.beginPath();
    ctx.ellipse(100 + random() * 56, 100 + random() * 56, 1 + random() ** 4 * 13, 1 + random() ** 4 * 10, random() * 2, 0, Math.PI * 2);
    ctx.fillStyle = i % 3 ? '#93a0ac18' : '#697d8b13';
    ctx.fill();
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

export function createSky(scene) {
  const sky = new T.Group();
  const dome = new T.Mesh(new T.SphereGeometry(890, 30, 20), new T.ShaderMaterial({
    vertexShader: vertex, fragmentShader: fragment, side: T.BackSide, depthWrite: false, fog: false,
  }));
  dome.frustumCulled = false;
  dome.renderOrder = -2;
  sky.add(dome);
  const moon = new T.Sprite(new T.SpriteMaterial({ map: moonTexture(), transparent: true, depthWrite: false, fog: false, toneMapped: false }));
  moon.position.copy(new T.Vector3(.32, .38, -1).normalize().multiplyScalar(835));
  moon.scale.set(155, 155, 1);
  sky.add(moon);
  scene.add(sky);
  return sky;
}
