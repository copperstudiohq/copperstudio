import {getIceSurfaceHeight,highestIceAt} from './ice-surface.js';
import { getPlatformVertices, pointInPolygon } from "./terrain.js";

const MAX_GAP = 300;
const TRAIL_SAMPLE = 6;
const graphCache = new WeakMap();
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
const point = (p, z = 0) => ({ x: p.x, y: p.y, z });

function project(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1,
    ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return { x: a.x + dx * t, y: a.y + dy * t };
}

/** Closest polygon edges provide real footholds, rather than radius-based links. */
function portals(a, b) {
  let best = { gap: Infinity, from: a[0], to: b[0] };
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      const candidates = [
        [a[i], project(a[i], b[j], b[(j + 1) % b.length])],
        [project(b[j], a[i], a[(i + 1) % a.length]), b[j]],
      ];
      for (const [from, to] of candidates) {
        const gap = distance(from, to);
        if (gap < best.gap) best = { gap, from, to };
      }
    }
  }
  return best;
}

/** Shared, deterministic island graph. Gaps are at most one fifth of body length. */
export function getCentipedeGraph(platforms) {
  if (graphCache.has(platforms)) return graphCache.get(platforms);
  const nodes = platforms.filter(platform=>platform.biome!=="iceberg-tundra").map((platform) => ({
    id: platform.id, platform, vertices: getPlatformVertices(platform), links: [],
  }));
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      if (distance(a.platform, b.platform) > Math.max(a.platform.rx, a.platform.ry)
        + Math.max(b.platform.rx, b.platform.ry) + MAX_GAP) continue;
      const crossing = portals(a.vertices, b.vertices);
      if (crossing.gap > MAX_GAP) continue;
      const cost = distance(a.platform, b.platform);
      a.links.push({ to: j, from: crossing.from, toPoint: crossing.to, gap: crossing.gap, cost });
      b.links.push({ to: i, from: crossing.to, toPoint: crossing.from,
        gap: crossing.gap, cost });

    }
  }
  // Patrol within the cyclic core instead of repeatedly doubling back at tiny dead ends.
  const degree = nodes.map((node) => node.links.length);
  const leaves = degree.flatMap((count, index) => count < 2 ? [index] : []);
  for (let cursor = 0; cursor < leaves.length; cursor++) {
    const leaf = leaves[cursor];
    for (const link of nodes[leaf].links)
      if (degree[link.to] > 1 && --degree[link.to] === 1) leaves.push(link.to);
    degree[leaf] = 0;
  }
  nodes.forEach((node, index) => { node.patrolCore = degree[index] > 1; });
  const graph = { nodes, byId: new Map(nodes.map((node, index) => [node.id, index])) };
  graphCache.set(platforms, graph);
  return graph;
}

function routesFrom(graph, start, avoid = -1) {
  graph.paths ??= new Map();
  const key = `${start}:${avoid}`;
  if (graph.paths.has(key)) return graph.paths.get(key);
  const costs = graph.nodes.map(() => Infinity), previous = graph.nodes.map(() => null);
  costs[start] = 0;
  const pending = new Set(graph.nodes.map((_, index) => index));
  while (pending.size) {
    let next = -1;
    for (const index of pending) if (next === -1 || costs[index] < costs[next]) next = index;
    if (!Number.isFinite(costs[next])) break;
    pending.delete(next);
    for (const link of graph.nodes[next].links) {
      if (next === start && link.to === avoid) continue;
      if (costs[next] + link.cost >= costs[link.to]) continue;
      costs[link.to] = costs[next] + link.cost;
      previous[link.to] = { node: next, link };
    }
  }
  const result = { costs, previous };
  graph.paths.set(key, result);
  return result;
}

function longestChord(platform, vertices) {
  const horizontal = platform.rx >= platform.ry;
  const primary = horizontal ? "x" : "y", cross = horizontal ? "y" : "x";
  const min = Math.min(...vertices.map((p) => p[cross]));
  const max = Math.max(...vertices.map((p) => p[cross]));
  let best = null;
  for (let sample = 1; sample < 50; sample++) {
    const line = min + (max - min) * sample / 50;
    const intersections = [];
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i], b = vertices[(i + 1) % vertices.length];
      if ((a[cross] > line) === (b[cross] > line)) continue;
      const t = (line - a[cross]) / (b[cross] - a[cross]);
      intersections.push(a[primary] + (b[primary] - a[primary]) * t);
    }
    intersections.sort((a, b) => a - b);
    for (let i = 0; i + 1 < intersections.length; i += 2) {
      const length = intersections[i + 1] - intersections[i];
      if (!best || length > best.length) best = {
        length, from: { [primary]: intersections[i], [cross]: line },
        to: { [primary]: intersections[i + 1], [cross]: line },
      };
    }
  }
  if (!best) throw new Error(`No centipede spawn corridor on ${platform.id}.`);
  return best;
}

/** An extended spine begins on a long glacier chord, with no circular/coiled pose. */
export function createCentipede(platform, lengthMeters, seed) {
  const vertices = getPlatformVertices(platform);
  const chord = longestChord(platform, vertices);
  const length = lengthMeters * 25;
  if (chord.length < length + 25)
    throw new Error(`Glacier ${platform.id} needs a ${lengthMeters}m centipede corridor.`);
  const heading = Math.atan2(chord.to.y - chord.from.y, chord.to.x - chord.from.x);
  const direction = { x: Math.cos(heading), y: Math.sin(heading) };
  const margin = (chord.length - length) / 2;
  const head = { x: chord.to.x - direction.x * margin,
    y: chord.to.y - direction.y * margin, z: 0 };
  const behind = (offset) => ({
    x: head.x - direction.x * offset, y: head.y - direction.y * offset, z: 0,
  });
  return {
    id: `ice-centipede-${seed}`, ...head, platformId: platform.id,
    lengthMeters, heading, pitch: 0, state: "patrol", attackCooldown: 0,
    spacing: length / 40, vertices,
    segments: Array.from({ length: 41 }, (_, index) => behind(index * length / 40)),
    trail: Array.from({ length: Math.ceil((length + 80) / TRAIL_SAMPLE) + 1 },
      (_, index) => behind(index * TRAIL_SAMPLE)),
    route: [], routeMode: "", destinationId: "", previousDestination: "",
    routeTimer: 0, targetPoint: null, visitedPlatforms: [platform.id],
  };
}

function smoothRoute(points) {
  // Entry footholds can create a short out-and-back spur; do not turn it into a cusp.
  const cleaned = [];
  for (const candidate of points) {
    cleaned.push(candidate);
    while (cleaned.length >= 3) {
      const [a, b, c] = cleaned.slice(-3);
      const before = distance(a, b), after = distance(b, c);
      const dot = ((b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y))
        / (before * after || 1);
      if (a.z || b.z || c.z || dot > -0.98 || Math.min(before, after) >= 60) break;
      cleaned.splice(cleaned.length - 2, 1);
    }
  }
  points = cleaned;
  if (points.length < 3) return points;
  const result = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1], b = points[i], c = points[i + 1];
    // Preserve the supported footholds and the 3D bridge shape at water crossings.
    if (a.z || b.z || c.z) { result.push(b); continue; }
    const before = distance(a, b), after = distance(b, c);
    const turn = ((b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y))
      / (before * after || 1);
    if (turn < -0.9) { result.push(b); continue; }
    const radius = Math.min(90, before * 0.24, after * 0.24);
    if (radius < 4) { result.push(b); continue; }
    const entry = { x: b.x + (a.x - b.x) / before * radius,
      y: b.y + (a.y - b.y) / before * radius, z: 0 };
    const exit = { x: b.x + (c.x - b.x) / after * radius,
      y: b.y + (c.y - b.y) / after * radius, z: 0 };
    result.push(entry);
    for (let sample = 1; sample <= 6; sample++) {
      const t = sample / 6, u = 1 - t;
      result.push({ x: u * u * entry.x + 2 * u * t * b.x + t * t * exit.x,
        y: u * u * entry.y + 2 * u * t * b.y + t * t * exit.y, z: 0 });
    }
  }
  result.push(points.at(-1));
  return result;
}

/** Turn on a broad semicircle inside a large island instead of reversing in place. */
function roundedDeparture(hunter, node, route) {
  const first = route.find((p) => distance(p, hunter) > 5);
  if (!first || Math.abs(hunter.z-getIceSurfaceHeight(node.platform,hunter.x,hunter.y)) > 0.1) return route;
  const dx = first.x - hunter.x, dy = first.y - hunter.y;
  const forward = { x: Math.cos(hunter.heading), y: Math.sin(hunter.heading) };
  // Every backward departure needs a supported turn, including obtuse bends
  // that are less severe than a near-total reversal.
  if ((dx * forward.x + dy * forward.y) / Math.hypot(dx, dy) >= 0) return route;
  const clearance = Math.min(...node.vertices.map((a, index) =>
    distance(hunter, project(hunter, a, node.vertices[(index + 1) % node.vertices.length]))));
  const radius = Math.min(65, (clearance - 30) / 2);
  if (radius < 30) return route;
  for (const side of [1, -1]) {
    const nx = -forward.y * side, ny = forward.x * side;
    const center = { x: hunter.x + nx * radius, y: hunter.y + ny * radius };
    const arc = [];
    for (let sample = 1; sample <= 16; sample++) {
      const angle = side * Math.PI * sample / 16;
      const rx = -nx * radius, ry = -ny * radius;
      const x=center.x+rx*Math.cos(angle)-ry*Math.sin(angle),y=center.y+rx*Math.sin(angle)+ry*Math.cos(angle);
      arc.push({x,y,z:getIceSurfaceHeight(node.platform,x,y)});
    }
    if (arc.every((p) => [[0, 0], [25, 0], [-25, 0], [0, 25], [0, -25]]
      .every(([ox, oy]) => pointInPolygon(node.vertices, p.x + ox, p.y + oy))))
      return [...arc, ...route];
  }
  return route;
}

function planRoute(hunter, graph, start, destination, previous, target) {
  const chain = [];
  for (let node = destination; node !== start;) {
    const parent = previous[node];
    if (!parent) return [];
    chain.unshift({ from: parent.node, to: node, link: parent.link });
    node = parent.node;
  }
  const points = [point(hunter, hunter.z)];
  for (const { link } of chain) {
    points.push(point(link.from));
    const arch = Math.min(58, Math.max(12, link.gap * 0.24));
    for (let step = 1; step < 10; step++) {
      const t = step / 10;
      points.push({ x: link.from.x + (link.toPoint.x - link.from.x) * t,
        y: link.from.y + (link.toPoint.y - link.from.y) * t,
        z: Math.sin(Math.PI * t) * arch });
    }
    points.push(point(link.toPoint));
  }
  points.push(target ? point(target) : point(graph.nodes[destination].platform));
  return roundedDeparture(hunter, graph.nodes[start], smoothRoute(points).slice(1));
}

function rememberHead(hunter) {
  const head = point(hunter, hunter.z);
  if (distance(head, hunter.trail[1] ?? hunter.trail[0]) >= TRAIL_SAMPLE)
    hunter.trail.unshift(head);
  else hunter.trail[0] = head;
  // Place each joint at the next sphere/trail intersection. Equal arc-length
  // samples can coincide after a hairpin; physical joints must keep their spacing.
  let cursor = 0, cursorPoint = head;
  Object.assign(hunter.segments[0], head);
  for (let segment = 1; segment < hunter.segments.length; segment++) {
    const previous = hunter.segments[segment - 1];
    while (cursor + 1 < hunter.trail.length
      && distance(previous, hunter.trail[cursor + 1]) < hunter.spacing) {
      cursor++; cursorPoint = hunter.trail[cursor];
    }
    const end = hunter.trail[cursor + 1];
    if (!end) break;
    const vx = end.x - cursorPoint.x, vy = end.y - cursorPoint.y, vz = end.z - cursorPoint.z;
    const ox = cursorPoint.x - previous.x, oy = cursorPoint.y - previous.y, oz = cursorPoint.z - previous.z;
    const qa = vx * vx + vy * vy + vz * vz;
    const qb = 2 * (ox * vx + oy * vy + oz * vz);
    const qc = ox * ox + oy * oy + oz * oz - hunter.spacing * hunter.spacing;
    const t = qa > 0 ? Math.max(0, Math.min(1,
      (-qb + Math.sqrt(Math.max(0, qb * qb - 4 * qa * qc))) / (2 * qa))) : 0;
    cursorPoint = { x: cursorPoint.x + vx * t, y: cursorPoint.y + vy * t, z: cursorPoint.z + vz * t };
    Object.assign(hunter.segments[segment], cursorPoint);
  }
  // Keep a bounded corner reserve so a bent 60m body still has enough supported trail.
  let total = 0;
  for (let i = 1; i < hunter.trail.length; i++) {
    total += distance(hunter.trail[i - 1], hunter.trail[i]);
    if (total > hunter.lengthMeters * 25 + 450) { hunter.trail.length = i + 1; break; }
  }
}

/** Safe main islands can be patrolled but never selected for a chase. */
export function centipedeTargetAllowed(platforms,target){
 if(!target)return false;const ice=highestIceAt(platforms,target.x,target.y);
 return Boolean(ice&&ice.biome!=='iceberg-tundra'&&!ice.crashSite&&!['floe-0','hunting-glacier'].includes(ice.id));
}

/** Match an older, buried starting pose to the prepared terrain before the
 * first render. Never flatten a live route's raised inter-island crossing. */
export function groundCentipedeStart(hunter,platforms){
  if(hunter.route.length)return false;
  const ice=highestIceAt(platforms,hunter.x,hunter.y);
  if(!ice||ice.biome==='iceberg-tundra')return false;
  const height=getIceSurfaceHeight(ice,hunter.x,hunter.y);
  if(hunter.z>height+.1)return false;
  hunter.z=height;
  for(const sample of hunter.trail){
    const support=highestIceAt(platforms,sample.x,sample.y);
    if(support&&support.biome!=='iceberg-tundra')sample.z=Math.max(sample.z,getIceSurfaceHeight(support,sample.x,sample.y));
  }
  rememberHead(hunter);
  return true;
}

/** Move continuously across connected islands, then let every segment follow the head's trail. */
export function updateCentipede(hunter, platforms, target, dt) {
  if(!Number.isFinite(dt)||dt<=0)return false;
  const graph = getCentipedeGraph(platforms);
  let current = graph.nodes.findIndex((node) => Math.abs(hunter.z - getIceSurfaceHeight(node.platform,hunter.x,hunter.y)) < 0.1
    && pointInPolygon(node.vertices, hunter.x, hunter.y));
  // Prepared terrain can rise above an older animal pose. An empty route then
  // has no supported start and never gets planned. Ground that stranded pose
  // once, retaining raised crossing arcs while an existing route is in flight.
  if(current===-1&&groundCentipedeStart(hunter,platforms))
    current=graph.byId.get(highestIceAt(platforms,hunter.x,hunter.y).id)??-1;
  if (current !== -1) {
    hunter.platformId = graph.nodes[current].id;
    if (hunter.visitedPlatforms.at(-1) !== hunter.platformId)
      hunter.visitedPlatforms.push(hunter.platformId);
    if (hunter.visitedPlatforms.length > 64) hunter.visitedPlatforms.shift();
  }
  const start = current === -1 ? graph.byId.get(hunter.platformId) : current;
  if (start === undefined) return false;
  const paths = routesFrom(graph, start);
  const targetNode = centipedeTargetAllowed(platforms,target) ? graph.nodes.findIndex((node) =>
    pointInPolygon(node.vertices, target.x, target.y)) : -1;
  const hunting = targetNode !== -1 && Number.isFinite(paths.costs[targetNode]);
  hunter.state = hunting ? "hunting" : "patrol";
  hunter.routeTimer -= dt;
  const changedTarget = hunting && (!hunter.targetPoint || distance(target, hunter.targetPoint) > 80);
  const mode = hunting ? "hunting" : "patrol";
  if (current !== -1 && (!hunter.route.length || hunter.routeMode !== mode
    || (hunting && hunter.routeTimer <= 0 && changedTarget))) {
    let destination = targetNode;
    let routePaths = paths;
    if (!hunting) {
      const previous = graph.byId.get(hunter.visitedPlatforms.at(-2));
      if (previous !== undefined && graph.nodes[start].links.length > 1)
        routePaths = routesFrom(graph, start, previous);
      destination = start;
      for (let index = 0; index < graph.nodes.length; index++) {
        if (graph.nodes[index].patrolCore
          && Math.min(graph.nodes[index].platform.rx, graph.nodes[index].platform.ry) >= 150
          && Number.isFinite(routePaths.costs[index])
          && routePaths.costs[index] > routePaths.costs[destination])
          destination = index;
      }
    }
    if (!hunting && destination === start) {
      routePaths = paths;
      for (let index = 0; index < graph.nodes.length; index++)
        if (Math.min(graph.nodes[index].platform.rx, graph.nodes[index].platform.ry) >= 150
          && Number.isFinite(paths.costs[index]) && paths.costs[index] > paths.costs[destination]) destination = index;
    }
    hunter.route = planRoute(hunter, graph, start, destination, routePaths.previous, hunting ? target : null);
    hunter.routeMode = mode;
    hunter.destinationId = graph.nodes[destination].id;
    hunter.targetPoint = target ? point(target) : null;
    hunter.routeTimer = 1.2;
  }
  let remaining = dt * (hunting ? 112 : 84);
  while (remaining > 0 && hunter.route.length) {
    const next = hunter.route[0], support = highestIceAt(platforms,next.x,next.y);
    if (support?.relief) next.z = Math.max(next.z ?? 0,getIceSurfaceHeight(support,next.x,next.y));
    const length = distance(hunter, next);
    if (length < 0.001) { hunter.route.shift(); continue; }
    const step = Math.min(remaining, length);
    const dx = (next.x - hunter.x) / length, dy = (next.y - hunter.y) / length;
    const dz = (next.z - hunter.z) / length;
    const origin={x:hunter.x,y:hunter.y,z:hunter.z};
    const originIce=highestIceAt(platforms,origin.x,origin.y);
    const followsGround=originIce?.relief&&support?.relief
      &&Math.abs(origin.z-getIceSurfaceHeight(originIce,origin.x,origin.y))<.1
      &&Math.abs(next.z-getIceSurfaceHeight(support,next.x,next.y))<.1;
    const candidate=fraction=>{
      const p={x:origin.x+dx*step*fraction,y:origin.y+dy*step*fraction,z:origin.z+dz*step*fraction};
      const ice=highestIceAt(platforms,p.x,p.y);
      if(ice?.relief){const height=getIceSurfaceHeight(ice,p.x,p.y);p.z=followsGround?height:Math.max(p.z,height);}
      return p;
    };
    let pose=candidate(1);
    if(distance(origin,pose)>step+1e-8){
      let low=0,high=1;
      for(let probe=0;probe<18;probe++){const middle=(low+high)/2;if(distance(origin,candidate(middle))<=step)low=middle;else high=middle;}
      pose=candidate(low);
    }
    if(highestIceAt(platforms,pose.x,pose.y)?.biome==='iceberg-tundra'){
      hunter.route=[];hunter.routeTimer=0;break;
    }
    Object.assign(hunter,pose);
    hunter.heading = Math.atan2(dy, dx);
    hunter.pitch = Math.atan2(hunter.z-origin.z, Math.hypot(hunter.x-origin.x, hunter.y-origin.y));
    remaining -= step;
    rememberHead(hunter);
    if (distance(hunter,next)<.001) hunter.route.shift();
  }
  return hunting;
}
