import { getCrabCollider } from "./crab-size.js";
import { EYE_HEIGHT } from "./terrain.js";
import { TREE_STALKER_HEIGHT, TREE_STALKER_EYE_LOCAL } from "./tree-stalker-anatomy.js";
import { getAdultSquidHeadContact } from "./adult-squid.js";
import {penguinGrowthScale} from './penguin-lifecycle.js';
import { isopodLocalToWorld } from './isopod-frame.js';
import {BESTIARY_FIELD_NOTES} from './bestiary-notes.js';
import {tuskjawBodyAxis} from './tuskjaw-shark.js';
import {getSulfurLizardScale} from './sulfur-lizards.js';

export const BESTIARY_RADIUS_METERS = 10;
const RANGE = BESTIARY_RADIUS_METERS * 25;

/** Read-only species definitions; expedition discoveries are stored separately. */
export const BESTIARY_SPECIES = Object.freeze([
  {"id":"woodlon","name":"Woodlon","size":"1.1 m tall"},
  {"id":"three-eye-penguin","name":"Crobon Bird","size":"Adults 1.4 m · newly hatched chicks about 0.5 m"},
  {"id":"tundra-hogwong","name":"Tundra Hogwong","size":"4 m long including whip tail"},
  {"id":"void-fish","name":"Void Fish","size":"3.4 m long"},
  {"id":"frost-hound","name":"Frost Hound","size":"3.4 m long"},
  {"id":"lantern-jellyfish","name":"Purple Lantern Jellyfish","size":"1.2–1.8 m small bell · 4.8–6 m giant bell"},
  {"id":"coral-crab","name":"Red Root Crab","size":"0.79 m leg span · 1.82 m with shell"},
  {"id":"ice-isopod","name":"Gold Rock Bugs","size":"Varies by individual"},
  {"id":"arctic-squid","name":"Artic Crobonic Squid","size":"3 m juvenile · 30 m adult"},
  {"id":"ice-centipede","name":"Ice centipede","size":"60 m long"},
  {id:"tree-stalker",name:"Tree Stalker",size:`${TREE_STALKER_HEIGHT} m tall`},
  {"id":"red-fish","name":"Red Fish","size":"0.5 m red/purple · 1 m gray-patterned · 3 m large"},
  {id:'tuskjaw-shark',name:'Crobonic Tuskon',size:'20 m long'},
  {id:'sulfur-maw-lizard',name:'Sulfur Maw Lizard',size:'0.5 m small · 1 m body + tail large'},
  {id:'sulfur-sand-worm',name:'Crobonic Artic Sulfur Worm',size:'1.9–2.8 m cave form · 100 m adult'},
].map(definition=>Object.freeze({...definition,...BESTIARY_FIELD_NOTES[definition.id]})));

const point = (value) => value && Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
const positive = (value, fallback) => value === undefined ? fallback : Number.isFinite(value) && value > 0 ? value : null;
const list = (value) => Array.isArray(value) ? value : [];
const recorded = (world, id) => {
  const state = world?.bestiary;
  if (!state || typeof state !== "object" || Array.isArray(state)
    || !Object.prototype.hasOwnProperty.call(state, id)) return false;
  const entry = state[id];
  return entry && typeof entry === "object" && Number.isFinite(entry.firstSeenAt) && entry.firstSeenAt >= 0;
};

function nearSphere(eye, center, radius) {
  if (!point(center) || !Number.isFinite(radius) || radius < 0) return false;
  const dx = eye.x - center.x, dy = eye.y - center.y, dz = eye.z - center.z;
  return dx * dx + dy * dy + dz * dz <= (RANGE + radius) ** 2;
}

function nearCapsule(eye, a, b, radius) {
  if (!point(a) || !point(b) || !Number.isFinite(radius) || radius < 0) return false;
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const squared = dx * dx + dy * dy + dz * dz;
  const t = squared ? Math.max(0, Math.min(1,
    ((eye.x - a.x) * dx + (eye.y - a.y) * dy + (eye.z - a.z) * dz) / squared)) : 0;
  const x = a.x + dx * t - eye.x, y = a.y + dy * t - eye.y, z = a.z + dz * t - eye.z;
  return x * x + y * y + z * z <= (RANGE + radius) ** 2;
}

/** Use the same compact cylinder as swimming collision, at the moving body.
 */
function nearCrab(eye, crab) {
  if (!point(crab)) return false;
  const scale = positive(crab.scale, 1);
  if (!scale) return false;
  const collider = getCrabCollider(crab);
  const horizontal = Math.max(0, Math.hypot(eye.x - crab.x, eye.y - crab.y) - collider.radius);
  const vertical = Math.max(0, collider.bottom - eye.z, eye.z - collider.top);
  return horizontal * horizontal + vertical * vertical <= RANGE * RANGE;
}

/** A compact body capsule encloses the moving isopod's plated shell/antennae.
 * All dimensions follow the renderer's size multiplier, not its spawn position.
 */
function nearIsopod(eye, pod) {
  if (!point(pod)) return false;
  const size = positive(pod.size, 1);
  if (!size) return false;
  const frame = pod.size === size ? pod : { ...pod, size };
  return nearCapsule(eye, isopodLocalToWorld(frame, 0, .32, -.86),
    isopodLocalToWorld(frame, 0, .32, .86), 15.5 * size);
}

/** Head sphere and every physical arm capsule share the squid physics radii.
 * Conservative link radii use the thicker end of each tapered link.
 */
function nearSquid(eye, squid, adult = false) {
  if (!point(squid)) return false;
  const radius = positive(squid.headRadius, 15);
  if (!radius) return false;
  if (adult) {
    const head = radius === squid.headRadius ? squid : { ...squid, headRadius: radius };
    // The physics query excludes exact tangencies. Query just beyond the edge,
    // then test the true distance so identification remains inclusive at 10 m.
    const contact = getAdultSquidHeadContact(head, eye, RANGE + 1e-6);
    if (contact && contact.distance <= RANGE + 1e-9) return true;
  } else if (nearSphere(eye, squid, radius)) return true;
  for (const arm of list(squid.tentacles)) {
    if (!Array.isArray(arm)) continue;
    for (let link = 0; link < arm.length - 1; link++)
      if (nearCapsule(eye, arm[link], arm[link + 1], 2.7 * (radius / 15) * 0.84 ** link)) return true;
  }
  return false;
}

/** Shift each spine point to the middle of its carapace, following climb slope. */
function carapacePoint(segments, index, width) {
  const current = segments[index];
  if (!point(current)) return null;
  const adjacent = segments[index ? index - 1 : index + 1];
  let ux = 0, uy = 0, uz = 1;
  if (point(adjacent)) {
    const sign = index ? 1 : -1;
    const dx = (adjacent.x - current.x) * sign, dy = (adjacent.y - current.y) * sign;
    const dz = (adjacent.z - current.z) * sign;
    const length = Math.hypot(dx, dy, dz), horizontal = Math.hypot(dx, dy);
    if (horizontal > 1e-8 && length > 1e-8) {
      ux = -dx * dz / (length * horizontal); uy = -dy * dz / (length * horizontal); uz = horizontal / length;
    } else if (length > 1e-8) { ux = 1; uz = 0; }
  }
  return { x: current.x + ux * width * 0.6, y: current.y + uy * width * 0.6, z: current.z + uz * width * 0.6 };
}

function nearCentipede(eye, animal) {
  if (!animal || !Array.isArray(animal.segments)) return false;
  const width = Number.isFinite(animal.lengthMeters) && animal.lengthMeters < 50 ? 7.5 : 21.25;
  let previous = null, previousRadius = 0;
  for (let index = 0; index < animal.segments.length; index++) {
    const center = carapacePoint(animal.segments, index, width);
    const radius = index > animal.segments.length - 5 ? width * 0.58 : width;
    if (center && (nearSphere(eye, center, radius) || (previous && nearCapsule(eye, previous, center, Math.max(previousRadius, radius))))) return true;
    previous = center; previousRadius = radius;
  }
  return false;
}

/** Recognition uses the upright trunk and head, rather than an idle branch sway. */
function nearTreeStalker(eye, animal) {
  if (!point(animal)) return false;
  const height = positive(animal.heightMeters, TREE_STALKER_HEIGHT);
  if (!height) return false;
  const scale = height / TREE_STALKER_HEIGHT;
  return nearCapsule(eye, { x: animal.x, y: animal.y, z: animal.z + 25 * scale },
    { x: animal.x, y: animal.y, z: animal.z + TREE_STALKER_EYE_LOCAL[1] * 25 * scale }, 11.25 * scale);
}

/** Definitions plus expedition state. Reading this view never changes the world. */
export function getBestiaryEntries(world) {
  return BESTIARY_SPECIES.map((definition) => {
    const discovered = Boolean(recorded(world, definition.id));
    return discovered ? { ...definition, discovered, firstSeenAt: world.bestiary[definition.id].firstSeenAt }
      : { ...definition, discovered };
  });
}

/** Search only recorded information, so filters cannot reveal unseen species. */
export function selectBestiaryEntries(entries,query='',filter='all'){
  const term=typeof query==='string'?query.trim().toLowerCase():'';
  return entries.filter(entry=>{
    if(filter==='identified'&&!entry.discovered||filter==='unidentified'&&entry.discovered)return false;
    if(!term)return true;
    return entry.discovered&&[entry.name,entry.habitat,entry.description,entry.fieldNote,entry.disposition]
      .filter(Boolean).join(' ').toLowerCase().includes(term);
  });
}

/** Automatically record a species at an inclusive true-3D distance of 10m
 * from the player's eye to its nearest documented body/collider surface.
 * Only world.bestiary is mutated; no storage, notices, health or input changes.
 * @param {object} world @returns {string[]} Newly discovered species IDs.
 */
export function updateBestiary(world) {
  if (!world || !point(world.player)) return [];
  const eye = { x: world.player.x, y: world.player.y, z: world.player.z + EYE_HEIGHT };
  if (!point(eye)) return [];
  const checks = [
    ['woodlon',world.woodlons,(eye,a)=>point(a)&&nearSphere(eye,{...a,z:a.z+13},9)],
    ['three-eye-penguin',world.penguins,(eye,bird)=>{
      if(!point(bird))return false;const scale=penguinGrowthScale(bird);return nearSphere(eye,{...bird,z:bird.z+16*scale},17*scale);
    }],
    ["tundra-hogwong", world.hogwongs, (eye,hog) => point(hog) && nearSphere(eye,{...hog,z:hog.z+25},40)],
    ["void-fish", world.voidFish, (eye,fish) => point(fish) && nearSphere(eye,fish,43)],
    ["frost-hound", world.frostHounds, (eye,hound) => point(hound) && nearSphere(eye,hound,43)],
    ["lantern-jellyfish", world.jellyfish, (eye, fish) => point(fish) && positive(fish.headRadius, null) && positive(fish.tentacleLength, null) && nearCapsule(eye, fish, {...fish, z: fish.z - fish.tentacleLength}, fish.headRadius)],
    ["coral-crab", world.crabs, nearCrab], ["ice-isopod", world.isopods, nearIsopod],
    ["arctic-squid", world.squids, nearSquid],
    ["arctic-squid", world.adultSquids, (eye, squid) => nearSquid(eye, squid, true)],
    ["ice-centipede", world.centipedes, nearCentipede],
    ["tree-stalker", world.treeStalkers, nearTreeStalker],
    ["red-fish", world.redFish, (eye, fish) => point(fish) && positive(fish.lengthMeters, null) && nearSphere(eye, fish, fish.lengthMeters * .64 * 25)],
    ['tuskjaw-shark',world.tuskjawSharks,(eye,shark)=>point(shark)&&nearCapsule(eye,...tuskjawBodyAxis(shark),45)],
    ['sulfur-maw-lizard',world.sulfurLizards,(eye,a)=>{
      if(!point(a)||!Number.isFinite(a.heading))return false;
      const scale=getSulfurLizardScale(a),fx=Math.cos(a.heading)*scale,fy=Math.sin(a.heading)*scale;
      return nearCapsule(eye,{x:a.x-fx*12,y:a.y-fy*12,z:a.z+10*scale},
        {x:a.x+fx*16,y:a.y+fy*16,z:a.z+10*scale},12*scale);
    }],
    ['sulfur-sand-worm',world.caveWorms,(eye,worm)=>list(worm?.segments).some(s=>point(s)&&positive(s.radius,null)&&nearSphere(eye,s,s.radius))],
    ['sulfur-sand-worm',world.sandWorms,(eye,a)=>list(a?.segments).some(s=>point(s)&&positive(s.radius,null)&&Number.isFinite(s.ground)&&s.z+s.radius>s.ground&&nearSphere(eye,s,s.radius))],
  ];
  const found = [];
  for (const [id, animals, near] of checks) {
    if (recorded(world, id) || !list(animals).some((animal) => !(animal?.squidRespawnIn > 0) && near(eye, animal))) continue;
    if (!world.bestiary || typeof world.bestiary !== "object" || Array.isArray(world.bestiary)) world.bestiary = {};
    world.bestiary[id] = { firstSeenAt: Number.isFinite(world.elapsed) ? Math.max(0, world.elapsed) : 0 };
    found.push(id);
  }
  return found;
}
