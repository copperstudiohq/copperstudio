import { blubBarks, cellLines, fieldLines, villageLines } from './blub-dialogue.mjs';
import { BATTLEFIELD_EXIT, BATTLEFIELD_SPAWN, battlefieldHeight, canWalkBattlefield } from './battlefield.mjs';
import { canWalkDungeon, dungeonFloor, DUNGEON_STAIRS, PRISONER } from './dungeon-plan.mjs';
import { walkSurface } from './layout.mjs';
import { companionArrival, createOrcCompanion } from './orc-companion.mjs';
import { SERVICE_DOOR, TOWER_SPAWN, towerWalkHeight } from './tower-plan.mjs';

export const PRISONER_NAME = 'Blub';

const routes = {
  dungeon: [[-.35, 1.35], [0, .64], [0, DUNGEON_STAIRS.z]],
  tower: [
    [-4.4, 6.63], [-4.4, -5.78], [-.4, -5.78], [4.39, -5.78], [4.39, 5.6],
    [SERVICE_DOOR.x, 5.6], [SERVICE_DOOR.x, SERVICE_DOOR.z + .56],
  ],
  battlefield: [[.18, -8], [.17, -31], [.6, -51], [BATTLEFIELD_EXIT.x, BATTLEFIELD_EXIT.z]],
  village: [[.1, 29], [.1, 18], [.5, 8], [.5, -2], [-.45, -14], [1.8, -14], [2.0, -6],
    [2.15, 3], [2.0, 12], [1.25, 22], [.6, 34]],
};
const spawns = {
  cell: { x: PRISONER.x, y: 0, z: PRISONER.z, yaw: .63 },
  tower: { x: TOWER_SPAWN.x, y: 0, z: TOWER_SPAWN.z, yaw: -Math.PI / 2 },
  battlefield: { x: BATTLEFIELD_SPAWN.x, z: BATTLEFIELD_SPAWN.z, yaw: Math.PI,
    y: battlefieldHeight(BATTLEFIELD_SPAWN.x, BATTLEFIELD_SPAWN.z) },
  village: { x: .6, z: 34, y: walkSurface(.6, 34), yaw: Math.PI },
};
const nextArea = { dungeon: 'tower', tower: 'battlefield', battlefield: 'village' };
const speed = { dungeon: 3.9, tower: 4.15, battlefield: 5.0, village: 1.48 };
const wrongTurn = [2.43, -3.18];
const tiredRoute = [...routes.tower.slice(0, 3), [2.43, -5.78], wrongTurn, [2.43, -5.78], ...routes.tower.slice(3)];

export function createOrcJourney(mayWalkVillage, random = Math.random, mayFollowWorld = mayWalkVillage) {
  const position = { ...spawns.cell };
  const companion = createOrcCompanion();
  const followSurfaces = {
    battlefield: { canWalk: canWalkBattlefield, heightAt: battlefieldHeight },
    village: { canWalk: mayFollowWorld, heightAt: walkSurface },
  };
  let area = 'cell';
  let following = false;
  let waypoint = 0;
  let pause = 0;
  let strides = 0;
  let talkedCell = 0;
  let talkedField = 0;
  let talkedVillage = 0;
  let caughtBefore = false;
  let tired = false;

  function enter(next) {
    area = next;
    waypoint = 0;
    pause = 0;
    if (spawns[next]) Object.assign(position, spawns[next]);
    if (next === 'village') pause = 1.8;
    return next;
  }

  return {
    position,
    get area() { return area; },
    get active() { return area !== 'cell'; },
    get following() { return following; },
    get stride() { return strides; },
    get walking() { return following ? companion.walking : area !== 'cell' && pause <= 0; },
    get running() { return following ? companion.running : area !== 'cell' && area !== 'village'; },
    travelWith(next, player) {
      if (!following || !followSurfaces[next]) return;
      const { canWalk, heightAt } = followSurfaces[next];
      enter(next);
      companion.reset();
      Object.assign(position, companionArrival(player, canWalk, heightAt));
    },
    start(gateOpen) {
      if (!gateOpen || area !== 'cell') return false;
      tired = random() < .32;
      enter('dungeon');
      return true;
    },
    caught() {
      if (area !== 'tower') return false;
      caughtBefore = true;
      enter('cell');
      return true;
    },
    talk() {
      if (area === 'cell') {
        if (caughtBefore) {
          caughtBefore = false;
          return blubBarks.caught;
        }
        return cellLines[talkedCell++ % cellLines.length];
      }
      if (area === 'village') {
        if (!following) pause = 2.1;
        return villageLines[talkedVillage++ % villageLines.length];
      }
      if (area === 'battlefield') return fieldLines[talkedField++ % fieldLines.length];
      return area === 'tower' ? blubBarks.tower : blubBarks.dungeon;
    },
    advance(elapsed, gateOpen, player) {
      if (area === 'cell') return null;
      const surface = followSurfaces[area];
      if (surface && (following || player?.area === area)) {
        following = true;
        strides += companion.advance(elapsed, position, player?.area === area ? player : null, surface.canWalk, surface.heightAt);
        return null;
      }
      if (pause > 0) {
        pause = Math.max(0, pause - elapsed);
        return null;
      }
      const route = area === 'tower' && tired ? tiredRoute : routes[area];
      const [targetX, targetZ] = route[waypoint];
      const dx = targetX - position.x;
      const dz = targetZ - position.z;
      const distance = Math.hypot(dx, dz);
      const step = Math.min(distance, elapsed * speed[area]);
      if (step > 0) {
        const x = position.x + dx / distance * step;
        const z = position.z + dz / distance * step;
        let y;
        if (area === 'dungeon') {
          if (!canWalkDungeon(x, z, gateOpen, undefined, false)) return null;
          y = dungeonFloor(z);
        } else if (area === 'tower') {
          y = towerWalkHeight(x, z, position.y);
          if (y === null) return null;
        } else if (area === 'battlefield') {
          y = battlefieldHeight(x, z);
        } else {
          if (!mayWalkVillage(x, z)) {
            waypoint = (waypoint + 1) % routes.village.length;
            pause = .8;
            return null;
          }
          y = walkSurface(x, z);
        }
        Object.assign(position, { x, y, z, yaw: Math.atan2(dx, dz) });
        strides += step;
      }
      if (step < distance) return null;
      if (route[waypoint] === wrongTurn) pause = 1.6;
      waypoint++;
      if (area === 'village') {
        waypoint %= routes.village.length;
        if (waypoint % 3 === 0) pause = 1.7;
        return null;
      }
      return waypoint === route.length ? enter(nextArea[area]) : null;
    },
  };
}
