import {capRenderDistance} from './render-distance.js';
import {SquidThroat,cutSquidMouthOpening} from './squid-throat.js';
import {sharedBitePose} from './shared-bite-pose.js';
import { cutSquidArmorChannel } from './squid-side-armor.js';
import { createSquidEyelidGeometry, poseSquidEyelids } from './squid-eyelids.js';
import { flattenHeadGeometry, headSideRatio } from './adult-head-shape.js';
import { AdultSquidClaws } from "./adult-squid-claws.js";
import { getSquidPropulsionState } from "./squid-propulsion-anatomy.js";
import { createCreatureSurfaceMaps, applyCreatureSurface } from "./creature-materials.js";
import * as THREE from "./vendor/three.module.js";
import { getSquidOrientation } from "./squid-frame.js";
import { ADULT_SQUID_MOUTH_LOCAL, ADULT_SQUID_HEAD_Y_SCALE, getAdultSquidHeadYScale, ADULT_SQUID_EYE_LAYOUT, ADULT_SQUID_EYE_SCALE,
  ADULT_SQUID_MANDIBLE_PATH, CROBONIC_MANDIBLE_PATH, getAdultSquidMandiblePose } from "./adult-squid-anatomy.js";

const SCALE = 25;
const TAU = Math.PI * 2;
const finitePoint = (p) => Boolean(p && [p.x, p.y, p.z].every(Number.isFinite));
const adult = (squid) => finitePoint(squid) && typeof squid.id === "string"
  && Number.isFinite(squid.headRadius) && squid.headRadius > 15 && squid.lengthMeters >= 20;

/** Merged, head-local relief. Radius one is the physical blue head surface. */
class Relief {
  constructor() { this.positions = []; this.colors = []; this.uvs = []; this.indices = []; this.features = []; }

  strip(name, rows, columns, pointAt, colorAt) {
    const start = this.positions.length / 3;
    for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) {
      const u = row / rows, v = column / columns;
      const point = pointAt(u, v), tint = new THREE.Color(colorAt(u, v));
      this.positions.push(point.x, point.y, point.z);
      this.colors.push(tint.r, tint.g, tint.b); this.uvs.push(v, u * 3);
    }
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
      const a = start + row * (columns + 1) + column, b = a + columns + 1;
      this.indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
    this.features.push({ name, start, count: this.positions.length / 3 - start });
  }

  /** Solid plate edges descend to the existing skin/lining floor. Sidewalls
   * share the same merged mesh and material, without another render pass. */
  plate(name, rows, columns, pointAt, colorAt, floorRadius) {
    this.strip(name, rows, columns, pointAt, colorAt);
    const feature = this.features.pop(), wallStart = this.positions.length / 3;
    const edges = [(t) => [0, t], (t) => [1, t], (t) => [t, 0], (t) => [t, 1]];
    for (const [edge, coordinates] of edges.entries()) {
      this.strip(`${name}-wall-${edge}`, edge < 2 ? columns : rows, 1, (along, down) => {
        const [u, v] = coordinates(along), top = pointAt(u, v);
        return top.clone().normalize().multiplyScalar(top.length() * (1 - down) + floorRadius * down);
      }, (along, down) => {
        const [u, v] = coordinates(along);
        return new THREE.Color(colorAt(u, v)).multiplyScalar(.63 - down * .32).getHex();
      });
      this.features.pop();
    }
    this.features.push({ ...feature, wallStart, wallCount: this.positions.length / 3 - wallStart, floorRadius });
  }

  geometry() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(this.colors, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(this.uvs, 2));
    for (let index = 0; index < this.indices.length; index += 3) {
      // Orient the exact Float32 vertices sent to the GPU. Tangential crevice
      // walls otherwise change winding under the final precision conversion.
      const positions = geometry.attributes.position;
      const a = new THREE.Vector3().fromBufferAttribute(positions, this.indices[index]);
      const b = new THREE.Vector3().fromBufferAttribute(positions, this.indices[index + 1]);
      const c = new THREE.Vector3().fromBufferAttribute(positions, this.indices[index + 2]);
      const normal = b.clone().sub(a).cross(c.clone().sub(a));
      if (normal.dot(a.clone().add(b).add(c)) < 0)
        [this.indices[index + 1], this.indices[index + 2]] = [this.indices[index + 2], this.indices[index + 1]];
    }
    geometry.setIndex(this.indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
    geometry.userData.features = this.features;
    return geometry;
  }
}

/** A closed curved horn with one central hook. Its mirrored,
 * slightly shallower instance forms the separate lower bowl in the drawing. */
function jawGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-.19, .015);
  shape.bezierCurveTo(-.18, .13, -.075, .19, 0, .18);
  shape.bezierCurveTo(.075, .19, .18, .13, .19, .015);
  shape.bezierCurveTo(.12, .04, .065, -.01, 0, -.10);
  shape.bezierCurveTo(-.065, -.01, -.12, .04, -.19, .015);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .14, curveSegments: 12, steps: 1,
    bevelEnabled: true, bevelSegments: 1, bevelSize: .006, bevelThickness: .006 }).translate(0, 0, -.07);
  // A central keel curves the horn forward into a single overlapping hook.
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i);
    vertices.setZ(i, vertices.getZ(i) + Math.max(0, 1 - Math.abs(x) / .2) * (.13 - y * .25));
  }
  vertices.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  geometry.userData.features = [{ name: "curved-horn-keel-and-single-hook", start: 0,
    count: geometry.attributes.position.count }];
  return geometry;
}

/** One hooked mandible, mirrored for its partner. Taper closes to a sharp tip. */
function fangGeometry(redesigned = false) {
  const path = new THREE.CatmullRomCurve3((redesigned ? CROBONIC_MANDIBLE_PATH : ADULT_SQUID_MANDIBLE_PATH).map(point => new THREE.Vector3(...point)));
  const geometry = new THREE.TubeGeometry(path, 24, 1, 6, false);
  const points = geometry.attributes.position, colors = [];
  for (let ring = 0; ring <= 24; ring++) {
    const t = ring / 24, center = path.getPointAt(t);
    // Raised hard cuffs flank two narrow, recessed joint bands.
    const joint = ring === 8 || ring === 16;
    const cuff = ring === 7 || ring === 9 || ring === 15 || ring === 17;
    const radius = (redesigned
      ? t < .72 ? (joint ? .145 : .195 - t * .05 + (cuff ? .012 : 0)) : .13 * ((1 - t) / .28) ** 1.6
      : joint ? .060 : t < .72 ? .13 * (1 - t * .32) + (cuff ? .035 : 0)
      : .09 * ((1 - t) / .28) ** .8) + .0005;
    for (let side = 0; side <= 6; side++) {
      const index = ring * 7 + side;
      const point = new THREE.Vector3().fromBufferAttribute(points, index).sub(center).multiplyScalar(radius).add(center);
      points.setXYZ(index, point.x, point.y, point.z);
      const tint = new THREE.Color(t > .73 ? 0x09111c : redesigned
        ? joint ? 0x142e57 : cuff ? 0x5689bf : 0x285c9c
        : joint ? 0x765744 : cuff ? 0xe1c4ac : 0xc49778);
      colors.push(tint.r, tint.g, tint.b);
    }
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  if (redesigned) {
    // Close the armored root. An open tube lets the upper beak show through
    // the hinge even when the two mouth covers are fully shut.
    const center = points.count;
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([...points.array, 0, 0, 0], 3));
    const uv = geometry.attributes.uv;
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute([...uv.array, .5, 0], 2));
    const tint = new THREE.Color(0x285c9c);
    geometry.setAttribute("color", new THREE.Float32BufferAttribute([...colors, tint.r, tint.g, tint.b], 3));
    const indices = Array.from(geometry.index.array);
    for (let side = 0; side < 6; side++) indices.push(center, side + 1, side);
    geometry.setIndex(indices);
    geometry.deleteAttribute("normal");
  }
  points.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

function plateTint(u, v, index) {
  const edge = Math.min(u, 1 - u, v, 1 - v);
  return edge < .12 ? 0xe1c4ab : index % 3 === 0 ? 0xc29373 : index % 3 === 1 ? 0xd4a98a : 0xc9a189;
}

function collarGeometry() {
  const surface = new Relief();
  // A recessed continuous armor lining keeps the belly covered beneath seams.
  for (let plate = 0; plate < 10; plate++) surface.strip('ventral-lining-' + plate, 4, 24, (u, v) => {
    const angle = TAU * (plate + u) / 10, y = -.44 - v * .56;
    const reach = Math.sqrt(1 - y * y);
    return new THREE.Vector3(Math.sin(angle) * reach, y, Math.cos(angle) * reach).multiplyScalar(1.016);
  }, () => 0x92705c);
  for (let row = 0; row < 3; row++) for (let plate = 0; plate < 12; plate++) {
    surface.plate('ventral-plate-' + row + '-' + plate, 4, 4, (u, v) => {
      const angle = TAU * (plate + row * .5 + .035 + u * .93) / 12;
      const y = -.44 - ((row + .035 + v * .93) / 3) * .56;
      const reach = Math.sqrt(1 - y * y), bevel = Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
      return new THREE.Vector3(Math.sin(angle) * reach, y, Math.cos(angle) * reach).multiplyScalar(1.035 + bevel * .004);
    }, (u, v) => plateTint(u, v, plate + row), 1.016);
  }
  return surface.geometry();
}

/** Staggered rows of beveled plates. Small real gaps reveal the recessed skin;
 * all relief stays inside the unchanged solid head envelope. */
function carapaceGeometry() {
  const surface = new Relief();
  for (let row = 0; row < 4; row++) for (let panel = 0; panel < 8; panel++) {
    surface.plate('carapace-plate-' + row + '-' + panel, 4, 4, (u, v) => {
      const angle = (panel + row * .5 + .025 + u * .95) * TAU / 8;
      const side = Math.max(0, Math.min(1, (Math.abs(Math.sin(angle)) - .55) / .37));
      const blend = side * side * (3 - 2 * side);
      const lower = Math.cos(angle) > 0 ? .64 - blend : -.36;
      const latitude = (row + .025 + v * .95) / 4;
      const y = lower + latitude * (1 - lower), reach = Math.sqrt(Math.max(0, 1 - y * y));
      const radius = 1.034 + Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * .005;
      return new THREE.Vector3(Math.sin(angle) * reach, y, Math.cos(angle) * reach).multiplyScalar(radius);
    }, (u, v) => Math.min(u, 1 - u, v, 1 - v) < .12 ? 0x678bc1
      : (panel + row) % 3 === 0 ? 0x264b8b : (panel + row) % 3 === 1 ? 0x3268ac : 0x305b99, 1.002);
  }
  return surface.geometry();
}

function scarGeometry(eyeScale = ADULT_SQUID_EYE_SCALE, height = ADULT_SQUID_HEAD_Y_SCALE) {
  const surface = new Relief();
  const scars = [
    [[-.98, -.12, .13], [-.98, .16, .10], [-.89, .43, .08]],
    [[.98, -.1, .13], [.98, .16, .10], [.89, .43, .08]],
  ];
  const directionAt = (path, u) => {
    const fraction = u * (path.length - 1), index = Math.min(path.length - 2, Math.floor(fraction));
    return new THREE.Vector3(...path[index]).normalize()
      .lerp(new THREE.Vector3(...path[index + 1]).normalize(), fraction - index).normalize();
  };
  scars.forEach((path, index) => {
    surface.strip(`healed-scar-seam-${index}`, 28, 2, (u, v) => {
      const center = directionAt(path, u);
      const tangent = directionAt(path, Math.min(1, u + 0.01)).sub(directionAt(path, Math.max(0, u - 0.01)));
      const side = new THREE.Vector3().crossVectors(center, tangent).normalize();
      const width = (0.003 + Math.sin(u * Math.PI) * 0.005) * (v - 0.5) * 2;
      return center.addScaledVector(side, width).normalize().multiplyScalar(1.012 + Math.sin(v * Math.PI) * 0.007);
    }, (_u, v) => v === 0.5 ? 0xe2eee8 : 0xa0b7b0);
  });
  // Complete skin folds recess each narrow lens; no separate eyebrow ridge.
  for (const [eye, [x, y]] of ADULT_SQUID_EYE_LAYOUT.entries()) {
    const z = Math.sqrt(1 - x * x - y * y);
    const normal = new THREE.Vector3(x, y / height, z).normalize()
      .multiplyScalar(.65).add(new THREE.Vector3(0, 0, .35)).normalize();
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    surface.strip(`recessed-eye-socket-${eye}`, 32, 8, (u, v) => {
      const angle = u * TAU, upper = Math.max(0, Math.sin(angle));
      // Broad, asymmetric flesh replaces the narrow circular rim. Radial
      // creases gather around the lid, while its outer edge merges into skin.
      const ripple = Math.sin(angle * 11 + eye * .7) * .0025;
      const fold = Math.sin(v * Math.PI) * (.043 + upper * .038)
        + Math.sin(v * Math.PI * 5) * .009 * Math.sin(v * Math.PI);
      const point = new THREE.Vector3(Math.cos(angle) * (.137 + v * .105 + ripple * v),
        Math.sin(angle) * (.09 + v * (.065 + upper * .018)), .019 + fold - v * .045)
        .multiplyScalar(eyeScale).applyQuaternion(rotation);
      point.add(new THREE.Vector3(x, y * height, z + .09 * eyeScale));
      point.y /= height;
      const blend = v * v * v;
      const surfacePoint = point.clone().normalize().multiplyScalar(1.006);
      return point.lerp(surfacePoint, blend);
    }, (u, v) => v < .13 ? 0x173c70 : v < .38 ? 0x5498c7
      : Math.sin(v * Math.PI * 5) < -.25 ? 0x235dab : 0x307dde);
  }
  return surface.geometry();
}

function detailMaterial(source, color, name) {
  const material = source?.isMeshStandardMaterial ? source.clone()
    : new THREE.MeshStandardMaterial({ roughness: 0.95 });
  material.name = name; material.color.setHex(color);
  material.vertexColors = true; material.flatShading = false; material.side = THREE.DoubleSide;
  material.roughness = Math.max(0.9, material.roughness); material.metalness = 0.04;
  return material;
}

/** Adult-only drawing details share parent PBR maps and follow the physical
 * head quaternion. Shell, collar, scars, jaws and paired mandibles use five draws.
 */
export class AdultSquidDetails {
  constructor(world = {}, materials = {}) {
    this.group = new THREE.Group(); this.group.name = "adult-squid-drawing-details";
    this.renderers = new Map(); this.geometries = {}; this.materials = {}; this.disposed = false;
    const adults = Array.isArray(world?.adultSquids) ? world.adultSquids.filter(adult) : [];
    if (!adults.length) return;
    this.geometries = { jaw: jawGeometry(), fang: fangGeometry(adults[0].designVersion === 2), collar: collarGeometry(),
      scars: scarGeometry(adults[0].eyeScale ?? ADULT_SQUID_EYE_SCALE, getAdultSquidHeadYScale(adults[0])), carapace: carapaceGeometry() };
    if (headSideRatio(adults[0]) < 1) for (const name of ['collar', 'carapace'])
      flattenHeadGeometry(this.geometries[name], headSideRatio(adults[0]));
    if(adults[0].designVersion===2)for(const name of ['collar','carapace'])cutSquidMouthOpening(this.geometries[name]);
    if (adults.some(squid => squid.designVersion === 2)) this.geometries.eyelid = createSquidEyelidGeometry();
    if (adults[0].designVersion === 2) {
      const previous = this.geometries.carapace;
      this.geometries.carapace = cutSquidArmorChannel(previous, headSideRatio(adults[0]));
      previous.dispose();
    }
    this.materials = {
      jaw: detailMaterial(materials.beak ?? materials.gray, 0x897158, "adult-scalloped-horn-mouth"),
      collar: detailMaterial(materials.armor, 0xffffff, "adult-scarred-flesh-ventral-armor"),
      scars: detailMaterial(materials.gray, 0xb5cbc3, "adult-pale-healed-scar-seams"),
      shell: detailMaterial(materials.gray, 0xffffff, "adult-scarred-flesh-carapace-and-mandibles"),
    };
    this.throatMaps = createCreatureSurfaceMaps("throat",128);
    this.hornMaps = createCreatureSurfaceMaps("collector-horn", 128, 'classic-squid');
    applyCreatureSurface(this.materials.jaw, this.hornMaps, .65);
    this.materials.jaw.roughness = .48;
    this.materials.jaw.color.setHex(0x18202d);
    this.materials.shell.emissive.setHex(0); this.materials.shell.emissiveIntensity = 0;
    this.armorMaps = createCreatureSurfaceMaps("scarred-armor", 128, 'classic-squid');
    for (const material of [this.materials.shell, this.materials.collar]) {
      applyCreatureSurface(material, this.armorMaps, .85);
      material.roughness = .98; material.metalness = 0;
      material.emissive.setHex(0); material.emissiveIntensity = 0;
    }
    if (adults.some(squid => squid.designVersion === 2)) {
      this.materials.mandibles = this.materials.shell.clone();
      this.materials.mandibles.name = "hard-faceted-blue-mandibles";
      this.materials.mandibles.flatShading = true;
      this.materials.mandibles.normalScale.set(.35, .35);
      this.materials.mandibles.roughness = .9;
    }
    // Extrusion UVs are world coordinates; normalize the visible cap so the
    // growth ridges read across the small beak instead of sampling one texel.
    const uv = this.geometries.jaw.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + .23) / .46, (uv.getY(i) + .11) / .29);
    uv.needsUpdate = true;
    this.materials.jaw.vertexColors = false; this.materials.jaw.side = THREE.FrontSide;
    this.materials.scars.metalness = 0;
    this.materials.scars.normalScale.set(0.12, 0.12);
    for (const squid of adults) {
      const root = new THREE.Group(); root.name = `adult-squid-details:${squid.id}`;
      for (const name of ["collar", "scars", "carapace"]) {
        const mesh = new THREE.Mesh(this.geometries[name], name === "carapace" ? this.materials.shell : this.materials[name]);
        mesh.name = `adult-squid-${name}`; mesh.receiveShadow = true;
        mesh.castShadow = name !== "scars"; root.add(mesh);
      }
      const jaws = new THREE.InstancedMesh(this.geometries.jaw, this.materials.jaw, 2);
      jaws.name = "adult-scalloped-mouth-halves"; jaws.receiveShadow = true; jaws.castShadow = true;
      jaws.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(jaws);
      const fangs = new THREE.InstancedMesh(this.geometries.fang,
        squid.designVersion === 2 ? this.materials.mandibles : this.materials.shell, 2);
      fangs.name = "adult-mandible-fangs"; fangs.receiveShadow = true; fangs.castShadow = true;
      fangs.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(fangs);
      if (squid.designVersion === 2) {
        const lids = new THREE.InstancedMesh(this.geometries.eyelid, this.materials.shell, 8);
        lids.name = 'folded-blue-squid-eyelids'; lids.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        root.add(lids);
      }
      const throat=new SquidThroat({surfaces:this.throatMaps});throat.position.set(0,ADULT_SQUID_MOUTH_LOCAL[1],1.04);throat.scale.set(.24,.18,.20);root.add(throat);
      this.group.add(root); this.renderers.set(squid.id, root);
    }
    if (adults.some(squid => squid.designVersion === 2)) {
      this.claws = new AdultSquidClaws(adults, this.materials.shell); this.group.add(this.claws.mesh);
    }
    this.jaws = this.renderers.values().next().value.getObjectByName("adult-scalloped-mouth-halves");
    this.transform = new THREE.Object3D();
    this.update(world);
  }

  /** @param {object} world @param {THREE.Vector3} [cameraPosition] @param {{mobile?:boolean}} [quality] */
  update(world = {}, cameraPosition, quality, reducedMotion = false) {
    if (this.disposed) return;
    const adults = Array.isArray(world?.adultSquids) ? world.adultSquids : [];
    let visible = false;
    for (const [id, root] of this.renderers) {
      const squid = adults.find((entry) => entry?.id === id && adult(entry));
      if (!squid || squid.squidRespawnIn > 0) { root.visible = false; continue; }
      root.position.set(squid.x / SCALE, squid.z / SCALE, squid.y / SCALE);
      root.quaternion.copy(getSquidOrientation(squid));
      root.scale.set(squid.headRadius / SCALE, squid.headRadius / SCALE * getAdultSquidHeadYScale(squid), squid.headRadius / SCALE);
      const lids = root.getObjectByName('folded-blue-squid-eyelids');
      if (lids) poseSquidEyelids(lids, squid, reducedMotion);
      const breath = getSquidPropulsionState(squid).breath * (reducedMotion ? .2 : 1);
      root.getObjectByName("adult-squid-collar").scale.set(1 + breath * .008, 1 + breath * .015, 1 + breath * .008);
      const encounter = world?.squidEncounter?.squidId === squid.id ? world.squidEncounter : squid.feeding;
      const eating = encounter?.squidId === squid.id && (encounter.phase === "eating"||encounter.phase === "shared-bite");
      const striking = encounter?.squidId === squid.id && encounter.phase === "striking";
      const progress = eating && Number.isFinite(encounter.progress) ? Math.max(0, Math.min(1, encounter.progress)) : 0;
      const throat=root.getObjectByName('crobonic-toothed-throat');
      const swallow=eating&&!reducedMotion?Math.sin(progress*Math.PI*2)**2*.018:0;
      throat.scale.set(.24*(1+breath*.006+swallow),.18*(1-breath*.006-swallow*.6),.20);
      const redesigned = squid.designVersion === 2;
      const heldInBeak=striking&&Boolean(encounter.partnerId);
      const shared=encounter?.phase==="shared-bite",bite=shared?sharedBitePose(progress):null;
      const open = heldInBeak ? .6 : shared ? bite.opening : eating ? .16 + progress * .58 : redesigned ? 0 : squid.noticedPlayer ? .12 : 0;
      const strikeProgress = striking && Number.isFinite(encounter.progress) ? Math.max(0, Math.min(1, encounter.progress)) : 0;
      const stab = striking && !heldInBeak ? Math.sin(Math.PI * Math.max(0, Math.min(1, (strikeProgress - .22) / .65))) ** 2 : 0;
      const retraction = redesigned ? .015 * (1 - (eating ? 1 : stab)) : 0;
      const jaws = root.getObjectByName("adult-scalloped-mouth-halves");
      for (const half of [0, 1]) {
        this.transform.position.set(0, ADULT_SQUID_MOUTH_LOCAL[1] + (half ? -.08 - open * .04 : .11 + open * .025),
          redesigned ? (shared||heldInBeak?1.18:1.08) + breath * .02 - retraction : ADULT_SQUID_MOUTH_LOCAL[2] - .10 - retraction);
        this.transform.rotation.set(half ? open : -open, 0, half ? Math.PI : 0);
        this.transform.scale.set((half ? .94 : 1) * (redesigned ? .83 : 1), (half ? .65 : .82) * (redesigned ? .9 : 1), redesigned ? .8 : 1);
        this.transform.updateMatrix(); jaws.setMatrixAt(half, this.transform.matrix);
      }
      jaws.instanceMatrix.needsUpdate = true; jaws.computeBoundingSphere();
      // Slow opening, quick inward strike, then withdrawal before the beak closes.
      // A single smooth motion also works with reduced motion: no camera jerk or flashes.
      const fangs = root.getObjectByName("adult-mandible-fangs");
      for (const [index, side] of [[0, -1], [1, 1]]) {
        const pose = getAdultSquidMandiblePose(side, stab, squid, shared||heldInBeak ? 1.8 : eating ? .9 : striking ? stab : 0);
        this.transform.position.set(pose.x, pose.y, pose.z);
        this.transform.rotation.set(pose.pitch, pose.yaw, pose.roll ?? 0); this.transform.scale.set(1, 1, 1);
        this.transform.updateMatrix(); fangs.setMatrixAt(index, this.transform.matrix);
      }
      fangs.instanceMatrix.needsUpdate = true; fangs.computeBoundingSphere();
      const cutoff = capRenderDistance(quality,quality?.mobile ? 60 : 100) + squid.lengthMeters;
      root.visible = !finitePoint(cameraPosition) || root.position.distanceToSquared(cameraPosition) < cutoff * cutoff;
      visible ||= root.visible;
    }
    this.claws?.update(world, id => this.renderers.get(id)?.visible);
    this.group.visible = visible;
  }

  /** Only material clones and geometry are owned here; all maps stay borrowed. */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const root of this.renderers.values()) {
      root.getObjectByName("crobonic-toothed-throat")?.dispose();
      root.getObjectByName("adult-scalloped-mouth-halves").dispose();
      root.getObjectByName("adult-mandible-fangs").dispose();
      root.getObjectByName("folded-blue-squid-eyelids")?.dispose();
    }
    Object.values(this.geometries).forEach((geometry) => geometry.dispose());
    Object.values(this.materials).forEach((material) => material.dispose());
    this.claws?.dispose();
    this.throatMaps?.dispose(); this.hornMaps?.dispose(); this.armorMaps?.dispose();
    this.group.removeFromParent(); this.group.clear(); this.renderers.clear();
  }
}
