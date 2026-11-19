import { UPGRADE_CATALOG } from './simulation.js';

export const WAR_PLAYER = Object.freeze({ id: 'war-player', name: 'Player', warOnly: true, playerControlled: true,
  description: 'Join this army as the human fighter with every permanent upgrade at maximum level.',
  attackHelp: 'Control movement, sword, dash, jump, kick and block. If you fall, watch the remaining armies finish the battle.',
  hp: 400, radius: .42, speed: 11.5, damage: 0, score: 0 });

/** Keep the ordinary player's stats and actions; only the loadout is preinstalled. */
export function equipWarPlayer(game, actor) {
  Object.assign(actor, { ...game.createState().player, ...actor, playerControlled: true, modelScale: 1.12 });
  game.state.player = actor;
  game.state.upgradeLevels = Object.fromEntries(UPGRADE_CATALOG.map(upgrade => [upgrade.id, upgrade.maxLevel ?? 0]));
  game.applyUpgradeStats();
  actor.hp = actor.maxHp; actor.stamina = actor.maxStamina;
  return actor;
}
