import { UPGRADE_CATALOG, CREATURE_CATALOG, availableBossCatalog } from './simulation.js';
import { WAR_CATALOG, WAR_LIMITS } from './war.js';
import { getArenaSize } from './arena-config.js';
import { ultraArenaActive } from './mech-ultra-collision.js';
import { ULTRA_ROOF_MISSILE_KIND } from './mech-ultra-roof-missiles.js';

const MODE_NAMES = { endless: 'Endless Waves', survival: 'Survival', practice: 'Practice', war: 'War Mode' };
const ARENA_NAMES = { bonefields: 'Tri Bonefields', colosseum: 'Colosseum', 'drill-mine': 'Drill Mine' };
const ARENA_SECTORS = { bonefields: 'SECTOR 07', colosseum: 'SECTOR 08', 'drill-mine': 'SECTOR 09' };
const clock = seconds => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, '0')}`;

const MODULES = {
  sword: ['BLADE POWER', 'M5 19 18 6l1-3-3 1L3 17m1-4 7 7m-7-1-2 3 3-2'],
  heart: ['VITALITY', 'M12 20 4 12C-2 5 7 1 12 7c5-6 14-2 8 5Z'],
  dash: ['DASH SYSTEM', 'M3 6h10M1 12h9M3 18h10m2-14 6 8-6 8'],
  haste: ['ATTACK SPEED', 'M9 3h6m-3 0v3m7 0 2-2M12 9v5l3 2M20 14a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z'],
  stride: ['MOVEMENT', 'M4 18 8 8l5 2m-7 6 7 3 5-10m-7 1 4-6m-1 15 6 1'],
  armor: ['DEFENSE', 'M12 3 20 6v6c0 5-8 9-8 9s-8-4-8-9V6Zm0 4v10'],
  capacitor: ['ENERGY', 'M13 2 5 14h7l-1 8 8-13h-7Z'],
  leech: ['KILL REPAIR', 'M12 3c-2 4-7 8-7 12a7 7 0 0 0 14 0c0-4-5-8-7-12Zm0 8v7m-3-3h6'],
  kick: ['KNOCKBACK', 'M6 3v10l6 3 7-1 2 5H5V10m1 3 5-1'],
  repair: ['FIELD SERVICE', 'M12 4v16M4 12h16M6 4 4 6m14-2 2 2M4 18l2 2m12 0 2-2'],
};

function moduleIcon(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('module-icon');
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', (MODULES[id] || MODULES.repair)[1]);
  svg.append(path);
  return svg;
}

/** Accessible DOM layer. The renderer and simulation remain independent of the interface. */
export class GameUI {
  constructor({ onStart, onPause, onUpgrade, onSound, onBossPractice = () => {}, onArenaChange = () => {}, onMenu = () => {},
    onWarFight = () => {}, onWarRemove = () => {}, onWarClear = () => {}, onWarRematch = () => {}, onWarEdit = () => {}, onWarAdd = () => {}, onOctoTalk = () => {},
    onOctoSend = () => null, onOctoChatClose = () => {} }) {
    this.onUpgrade = onUpgrade;
    this.onArenaChange = onArenaChange;
    this.menuSelection = { gameMode: 'endless', arenaId: 'bonefields', colosseumMode: 'copper', practiceType: 'blob' };
    this.warSelection = { team: 'blue', type: WAR_CATALOG[0].id };
    this.onWarRemove = onWarRemove;
    this.menuStep = 'mode';
    this.mode = null;
    this.soundEnabled = false;
    this.toastTimer = null;
    this.octoCaptionTimer = null;
    this.octoLine = null;
    this.octoAvailable = false;
    this.octoChatOpen = false;
    this.onOctoChatClose = onOctoChatClose;
    this.elements = Object.fromEntries([...document.querySelectorAll('[id]')].map(element => [element.id, element]));
    this.elements['start-button'].addEventListener('click', () => onStart(this.getStartOptions()));
    this.elements['retry-button'].addEventListener('click', () => onStart(this.getStartOptions()));
    this.elements['pause-button'].addEventListener('click', onPause);
    this.elements['resume-button'].addEventListener('click', onPause);
    this.elements['boss-practice'].addEventListener('click', () => {
      this.menuSelection.gameMode = 'practice';
      const options = this.getStartOptions();
      onBossPractice(options.practiceType, { arenaId: options.arenaId, colosseumMode: options.colosseumMode });
    });
    this.modeButtons = [...document.querySelectorAll('[data-mode-choice]')];
    this.arenaButtons = [...document.querySelectorAll('[data-arena-choice]')];
    this.modeButtons.forEach(button => button.addEventListener('click', () => {
      this.menuSelection.gameMode = button.dataset.modeChoice;
      this.updateMenuChoices();
    }));
    this.arenaButtons.forEach(button => button.addEventListener('click', () => {
      this.menuSelection.arenaId = button.dataset.arenaChoice;
      this.updateMenuChoices();
      onArenaChange(this.menuSelection.arenaId);
    }));
    this.elements['boss-choice'].addEventListener('change', () => this.updateMenuChoices());
    this.elements['copper-practice-choice'].addEventListener('change', () => this.updateMenuChoices());
    this.elements['mine-practice-choice'].addEventListener('change', () => this.updateMenuChoices());
    this.elements['menu-next'].addEventListener('click', () => this.showMenuStep('arena'));
    this.elements['menu-back'].addEventListener('click', () => this.showMenuStep('mode'));
    for (const id of ['pause-menu', 'end-menu']) this.elements[id].addEventListener('click', () => {
      this.showMenuStep('mode', false);
      onMenu();
    });
    this.elements['sound-button'].addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      this.elements['sound-label'].textContent = this.soundEnabled ? 'SOUND ON' : 'SOUND OFF';
      this.elements['sound-button'].setAttribute('aria-pressed', String(this.soundEnabled));
      this.elements['sound-button'].setAttribute('aria-label', this.soundEnabled ? 'Mute sound' : 'Enable sound');
      onSound(this.soundEnabled);
    });
    this.pips = [...document.querySelectorAll('.wave-pips i')];
    this.lastValues = new Map();
    for (const team of ['blue', 'red']) this.elements[`war-team-${team}`].addEventListener('click', () => {
      this.warSelection.team = team;
      this.updateWarSelection();
      if (this.warState) this.renderWar(this.warState);
    });
    this.elements['war-unit'].addEventListener('change', () => {
      this.warSelection.type = this.elements['war-unit'].value;
      this.updateWarSelection();
    });
    const triIds = new Set(CREATURE_CATALOG.map(unit => unit.id));
    const bossIds = new Set(['bonefields', 'colosseum', 'drill-mine'].flatMap(arenaId => availableBossCatalog({ arenaId })).map(unit => unit.id));
    this.warOptions = new Map();
    for (const label of ['Tri creatures', 'Robots and machines', 'Bosses', 'War guests']) {
      const group = document.createElement('optgroup'); group.label = label;
      for (const entry of WAR_CATALOG) {
        if ((entry.warOnly ? 'War guests' : bossIds.has(entry.id) ? 'Bosses' : triIds.has(entry.id) ? 'Tri creatures' : 'Robots and machines') !== label) continue;
        const option = document.createElement('option');
        option.value = entry.id; option.textContent = entry.name; group.append(option);
        this.warOptions.set(entry.id, option);
      }
      this.elements['war-unit'].append(group);
    }
    this.elements['war-unit'].value = this.warSelection.type;
    this.elements['war-add'].addEventListener('click', () => onWarAdd(this.getWarPlacement()));
    this.elements['war-clear'].addEventListener('click', () => onWarClear(this.warSelection.team));
    this.elements['war-fight'].addEventListener('click', onWarFight);
    this.elements['war-rematch'].addEventListener('click', onWarRematch);
    this.elements['war-edit'].addEventListener('click', onWarEdit);
    this.elements['octo-talk'].addEventListener('click', onOctoTalk);
    this.elements['octo-chat-close'].addEventListener('click', () => this.closeOctoChat());
    this.elements['octo-chat-form'].addEventListener('submit', event => {
      event.preventDefault();
      if (!this.octoChatOpen) return;
      const input = this.elements['octo-chat-input'], text = input.value.trim().slice(0, 300);
      if (!text) return;
      input.value = '';
      this.appendOctoChat('You', text);
      try {
        const answer = onOctoSend(text);
        if (typeof answer === 'string' && answer.trim()) this.appendOctoChat('Octo', answer.replace(/^Octo Nose:\s*/, '').replace(/^[“"]|[”"]$/g, ''));
      } catch {
        console.warn('[rain-arena] Octo could not answer this message.');
        this.appendOctoChat('Octo', 'I lost that thought. Please try again.');
      }
      input.focus({ preventScroll: true });
    });
    this.elements['octo-chat'].addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); this.closeOctoChat(); return; }
      if (event.key !== 'Tab') return;
      const first = this.elements['octo-chat-close'], last = this.elements['octo-chat-send'];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    this.elements['war-result'].addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const first = this.elements['war-rematch'], last = this.elements['war-result-menu'];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    for (const id of ['war-setup-menu', 'war-result-menu']) this.elements[id].addEventListener('click', () => {
      this.showMenuStep('mode', false); onMenu();
    });
    this.updateWarSelection();
    this.elements['upgrade-panel'].addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const available = [...this.elements['upgrade-options'].querySelectorAll('button:not([disabled])')];
      const first = available[0], last = available[available.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    this.elements['tri-guide-toggle'].addEventListener('keydown', event => {
      // Keep native details activation separate from the game's Space-to-kick handler.
      if (event.code === 'Space') event.stopPropagation();
    });
    this.renderFieldGuide();
    this.showMenuStep('mode', false);
  }

  getStartOptions() {
    if (this.menuSelection.arenaId === 'drill-mine') return { ...this.menuSelection, colosseumMode: 'copper',
      practiceType: this.menuSelection.gameMode === 'practice' ? this.elements['mine-practice-choice'].value : 'miner-bot' };
    const copperPractice = this.menuSelection.arenaId === 'colosseum' && this.menuSelection.gameMode === 'practice';
    const practiceType = copperPractice ? this.elements['copper-practice-choice'].value
      : this.menuSelection.arenaId === 'colosseum' ? 'copper-robot' : this.elements['boss-choice'].value;
    return { ...this.menuSelection, colosseumMode: 'copper', practiceType };
  }

  getWarPlacement() { return { ...this.warSelection }; }

  updateWarSelection() {
    for (const team of ['blue', 'red']) this.attribute(`war-team-${team}`, 'aria-pressed', this.warSelection.team === team);
    const entry = WAR_CATALOG.find(unit => unit.id === this.warSelection.type);
    this.text('war-unit-help', entry?.description || `${entry?.name || 'Opponent'} joins the selected army.`);
    this.text('war-roster-title', `${this.warSelection.team.toUpperCase()} ARMY`);
  }

  updateMenuChoices() {
    for (const button of this.modeButtons) this.attribute(button.id, 'aria-pressed', button.dataset.modeChoice === this.menuSelection.gameMode);
    for (const button of this.arenaButtons) this.attribute(button.id, 'aria-pressed', button.dataset.arenaChoice === this.menuSelection.arenaId);
    const colosseum = this.menuSelection.arenaId === 'colosseum';
    const mine = this.menuSelection.arenaId === 'drill-mine';
    const war = this.menuSelection.gameMode === 'war';
    for (const entry of WAR_CATALOG) {
      const unavailable = !!entry.exclusiveArena && entry.exclusiveArena !== this.menuSelection.arenaId;
      this.warOptions.get(entry.id).disabled = unavailable;
      if (unavailable && this.warSelection.type === entry.id) {
        this.warSelection.type = WAR_CATALOG[0].id;
        this.elements['war-unit'].value = this.warSelection.type;
        this.updateWarSelection();
      }
    }
    const copperPractice = colosseum && this.menuSelection.gameMode === 'practice';
    this.elements['colosseum-controls'].hidden = !colosseum || war;
    this.elements['war-menu-note'].hidden = !war;
    this.elements['copper-practice-controls'].hidden = !copperPractice;
    this.elements['drill-mine-controls'].hidden = !mine || war;
    this.elements['mine-practice-controls'].hidden = !mine || this.menuSelection.gameMode !== 'practice';
    this.elements['practice-controls'].hidden = colosseum || mine || this.menuSelection.gameMode !== 'practice';
    const copperTarget = copperPractice ? ` // ${this.elements['copper-practice-choice'].selectedOptions[0]?.textContent || ''}` : '';
    const opponent = war ? ' // ANY OPPONENT · TWO ARMIES' : mine
      ? this.menuSelection.gameMode === 'practice' ? ` // ${this.elements['mine-practice-choice'].selectedOptions[0]?.textContent || ''}` : ' // MINERS + DRILL CREATURES'
      : colosseum ? copperTarget || ' // ROBOTS + BOSSES'
      : this.menuSelection.gameMode === 'practice' ? ` // ${this.elements['boss-choice'].selectedOptions[0]?.textContent || ''}` : '';
    this.text('match-summary', `${MODE_NAMES[this.menuSelection.gameMode]} // ${ARENA_NAMES[this.menuSelection.arenaId]}${opponent}`.toUpperCase());
    this.text('start-label', war ? 'BUILD YOUR ARMIES' : 'ENTER THE ARENA');
  }

  showMenuStep(step, focus = true) {
    this.menuStep = step;
    this.elements['mode-step'].hidden = step !== 'mode';
    this.elements['arena-step'].hidden = step !== 'arena';
    this.text('menu-step-label', step === 'mode' ? '01 / MODE SELECT' : '02 / ARENA SELECT');
    this.updateMenuChoices();
    if (step === 'arena') this.onArenaChange(this.menuSelection.arenaId);
    if (focus) {
      const selected = step === 'mode' ? this.elements[`mode-${this.menuSelection.gameMode}`] : this.elements[`arena-${this.menuSelection.arenaId}`];
      selected.focus({ preventScroll: true });
      selected.scrollIntoView({ block: 'nearest' });
    }
  }

  update(key, value, apply) {
    if (this.lastValues.has(key) && this.lastValues.get(key) === value) return;
    apply(value);
    this.lastValues.set(key, value);
  }

  text(id, value) {
    this.update(`text:${id}`, String(value ?? ''), next => { this.elements[id].textContent = next; });
  }

  style(id, property, value) {
    this.update(`style:${id}:${property}`, value, next => { this.elements[id].style[property] = next; });
  }

  toggleClass(id, name, enabled, element = this.elements[id]) {
    this.update(`class:${id}:${name}`, Boolean(enabled), next => element.classList.toggle(name, next));
  }

  attribute(id, name, value) {
    this.update(`attribute:${id}:${name}`, String(value), next => this.elements[id].setAttribute(name, next));
  }

  render(state) {
    this.renderOctoChat(state);
    const entrance = state.ultraEncounter && !state.ultraEncounter.complete && ['playing', 'paused'].includes(state.mode);
    this.update('hidden:ultra-camera', !entrance, hidden => { this.elements['ultra-camera'].hidden = hidden; });
    this.text('ultra-camera', state.ultraEncounter?.followCamera ? 'FREE LOOK · C' : 'FOLLOW ENTRANCE · C');
    this.attribute('ultra-camera', 'aria-pressed', Boolean(entrance && state.ultraEncounter.followCamera));
    const { mode, player, wave, enemies, score, kills } = state;
    const gameMode = mode === 'menu' ? this.menuSelection?.gameMode || state.gameMode || 'endless' : state.gameMode || (state.practice ? 'practice' : 'endless');
    if (gameMode === 'war' && mode !== 'menu') { this.renderWar(state); return; }
    this.attribute('interface', 'data-war-player', false);
    this.renderOcto(state);
    for (const id of ['war-setup', 'war-battle-hud', 'war-result', 'war-spectator-help']) this.update(`hidden:${id}`, true, hidden => { this.elements[id].hidden = hidden; });
    const arenaId = mode === 'menu' ? this.menuSelection?.arenaId || state.arenaId : state.arenaId;
    const colosseum = arenaId === 'colosseum';
    const mine = arenaId === 'drill-mine';
    const copper = colosseum || mine;
    const survival = gameMode === 'survival';
    const bosses = availableBossCatalog({ arenaId: arenaId || 'bonefields', colosseumMode: 'copper' });
    const eligibleBoss = enemy => enemy.boss && enemy.hp > 0 && bosses.some(entry => entry.id === enemy.type);
    const boss = enemies.find(enemy => enemy.type === 'mech-spider-tank-ultra' && eligibleBoss(enemy))
      || enemies.find(enemy => enemy.type === 'copper-mega-drill' && eligibleBoss(enemy))
      || enemies.find(enemy => enemy.type === 'copper-mine-walker' && eligibleBoss(enemy))
      || enemies.find(enemy => enemy.type === 'copper-fortress' && eligibleBoss(enemy)) || enemies.find(eligibleBoss);
    const nextBossWave = (Math.floor(Math.max(1, wave) / 5) + 1) * 5;
    const nextMineWave = Math.max(4, wave + 1);
    const nextMineBossName = nextMineWave % 10 === 0 ? 'MEGA DRILL + DRONES' : nextMineWave >= 6 ? 'SPIDER + WALKER' : 'SPIDER DRONE';
    if (this.mode !== mode) this.setMode(state);
    this.attribute('interface', 'data-game-mode', gameMode);
    this.attribute('interface', 'data-arena', arenaId || 'bonefields');
    this.renderArenaIdentity(state, arenaId);
    this.text('wave-label', mode === 'menu' ? this.menuStep === 'arena' ? 'CHOOSE YOUR ARENA' : 'CHOOSE YOUR MODE'
      : survival ? `SURVIVED ${clock(state.survival?.elapsed ?? state.elapsed)}` : `WAVE ${String(wave).padStart(3, '0')} // ${gameMode === 'practice' ? 'PRACTICE' : 'ENDLESS'}`);
    let encounterLabel;
    if (mode === 'menu') encounterLabel = 'FOUR MODES · THREE BATTLEFIELDS';
    else if (gameMode === 'practice') encounterLabel = state.practiceTarget === 'mech-spider-tank-ultra'
      ? 'ULTRA PRACTICE · FACTORIES ACTIVE' : 'SOLO PRACTICE · NO EXTRA SPAWNS';
    else if (survival) {
      const level = state.survival?.level || 1;
      const mineBossLevel = level % 10 === 0 && state.survival?.lastMegaDrillLevel !== level ? level : (Math.floor(level / 10) + 1) * 10;
      const spiderLevel = Math.max(4, level + Number(state.survival?.lastSpiderDroneLevel === level));
      const walkerLevel = Math.max(6, level + Number(state.survival?.lastMineWalkerLevel === level));
      const nextMineLevel = Math.min(spiderLevel, walkerLevel, mineBossLevel);
      const mineBossName = mineBossLevel === nextMineLevel ? 'MEGA DRILL'
        : walkerLevel === nextMineLevel ? spiderLevel === nextMineLevel ? 'SPIDER + WALKER' : 'MINE WALKER' : 'SPIDER DRONE';
      const countdown = mine ? `${mineBossName} · THREAT ${nextMineLevel}`
        : colosseum ? `TRON IN ${Math.ceil(state.survival?.nextTronIn ?? 60)}s`
        : `BOSS IN ${Math.ceil(state.survival?.nextBossIn ?? 60)}s`;
      encounterLabel = `THREAT ${state.survival?.level || 1} · ${boss ? 'BOSS ACTIVE' : countdown}`;
    } else if (mine) encounterLabel = boss ? `${boss.type === 'copper-spider-drone' ? 'SPIDER DRONE' : boss.type === 'copper-mine-walker' ? 'MINE WALKER' : 'MEGA DRILL'} ACTIVE` : `TUNNEL ASSAULT · ${nextMineBossName} WAVE ${String(nextMineWave).padStart(3, '0')}`;
    else if (colosseum) encounterLabel = `ROBOTS · ${boss ? 'BOSS ACTIVE' : `TRON AT LEVEL ${String((Math.floor(wave / 3) + 1) * 3).padStart(3, '0')}`}`;
    else encounterLabel = boss ? 'BOSS ENCOUNTER' : `NEXT BOSS · WAVE ${String(nextBossWave).padStart(3, '0')}`;
    if (state.ultraEncounter && !state.ultraEncounter.complete) encounterLabel = `FINAL MINE ENTRANCE · ${state.ultraEncounter.stage.replaceAll('-', ' ').toUpperCase()}`;
    else if (boss?.type === 'mech-spider-tank-ultra') encounterLabel = 'MECH SPIDER TANK ULTRA · FINAL MINE BOSS';
    this.text('next-boss', encounterLabel);
    this.text('objective-text', boss?.ultra?.phase === 'down' && mode === 'playing'
      ? `DRILL ARM DOWN · ${Math.ceil(boss.ultra.phaseTime)}s · WALK ONTO THE ARM TO BOARD`
      : mode === 'playing' && state.projectiles?.some(bolt => bolt.kind === ULTRA_ROOF_MISSILE_KIND)
      ? 'ROOF MISSILES · LEAVE THE MARKED AREAS OR USE COVER'
      : state.ultraEncounter && !state.ultraEncounter.complete && mode === 'playing'
      ? `${state.ultraEncounter.stage.replaceAll('-', ' ').toUpperCase()} · KEEP TO THE ISLAND · C: CAMERA`
      : player.mineWalkerClimb && mode === 'playing'
      ? `CLIMBING ${Math.round(player.elevation * 10) / 10} M · W / ↑ UP · S / ↓ DOWN · SPACE LET GO`
      : mode === 'menu' ? 'CHOOSE YOUR FIGHT. CHOOSE YOUR GROUND.' : mode === 'playing'
      ? `${enemies.length} ${copper ? `${enemies.length === 1 ? 'ROBOT' : 'ROBOTS'} ${survival ? 'HUNTING YOU · KEEP MOVING' : 'REMAINING'}` : survival ? 'TRI HUNTING YOU · KEEP MOVING' : 'HOSTILES REMAINING · CUT WHERE YOU AIM'}`
      : mode === 'upgrade' ? 'CHOOSE YOUR NEXT ADVANTAGE.' : mode === 'dead' ? 'BLADE UNIT LOST. TRY AGAIN.' : 'COMBAT PAUSED.');
    this.renderVitals(player);
    this.text('score-value', String(score).padStart(6, '0'));
    this.text('kill-value', String(kills));
    this.text('kill-label', copper ? 'ROBOTS DEFEATED' : 'TRI ELIMINATED');
    this.text('best-wave', String(state.bestWave ?? 0).padStart(3, '0'));
    this.text('best-score', String(state.bestScore ?? 0).padStart(6, '0'));
    this.pips.forEach((pip, index) => this.toggleClass(`pip-${index}`, 'active', mode !== 'menu' && index <= (Math.max(1, wave) - 1) % 5, pip));
    this.update('hidden:boss-hud', !boss || !['playing', 'paused'].includes(mode), hidden => { this.elements['boss-hud'].hidden = hidden; });
    if (boss) {
      const health = Math.max(0, Math.min(100, boss.hp / boss.maxHp * 100));
      const name = boss.name ?? state.wavePlan?.boss?.name ?? 'BOSS';
      this.text('boss-name', name.toUpperCase());
      this.text('boss-status', boss.shielded ? 'SHIELDED' : `${Math.ceil(boss.hp)} / ${boss.maxHp}`);
      this.style('boss-fill', 'width', `${health}%`);
      this.toggleClass('boss-hud', 'shielded', boss.shielded);
      this.attribute('boss-meter', 'aria-valuenow', Math.round(health));
      this.attribute('boss-meter', 'aria-valuetext', `${name}: ${Math.ceil(boss.hp)} of ${boss.maxHp} health${boss.shielded ? ', shielded' : ''}`);
    }
  }

  renderVitals(player, label = 'FIGHTER 01') {
    this.text('health-label', label);
    this.text('hp-value', String(Math.ceil(Math.max(0, player.hp))));
    this.text('max-hp-value', String(player.maxHp));
    this.style('health-fill', 'width', `${Math.max(0, player.hp / player.maxHp * 100)}%`);
    this.style('energy-fill', 'width', `${Math.max(0, Math.min(100, player.stamina / player.maxStamina * 100))}%`);
    this.toggleClass('body', 'low-health', player.hp > 0 && player.hp / player.maxHp < .3, document.body);
    for (const [name, cooldown, duration] of [['dash', player.dashCooldown, player.dashDuration || 1.4], ['kick', player.kickCooldown, player.kickDuration || 2.5]]) {
      this.style(`${name}-fill`, 'transform', `scaleX(${Math.max(0, Math.min(1, 1 - cooldown / duration))})`);
      this.toggleClass(`${name}-ability`, 'cooling', cooldown > 0);
    }
  }

  renderArenaIdentity(state, arenaId) {
    const expanded = state.mode !== 'menu' && ultraArenaActive(state), size = getArenaSize(arenaId);
    this.text('arena-name', expanded ? 'THE LAVA ISLAND' : (ARENA_NAMES[arenaId] || ARENA_NAMES.bonefields).toUpperCase());
    this.text('arena-sector', expanded ? 'SECTOR 50 / FINAL MINE' : ARENA_SECTORS[arenaId] || ARENA_SECTORS.bonefields);
    this.text('arena-dimensions', expanded ? '72 × 60 M ISLAND · 360 × 300 × 600 M CAVERN' : `${size.width} × ${size.depth} M BATTLEFIELD`);
  }

  renderWar(state) {
    this.warState = state;
    const { mode, war, arenaId } = state;
    if (this.mode !== mode) this.setMode(state);
    const setup = mode === 'war-setup', finished = mode === 'war-result';
    const possessed = war.playerActive === true;
    const roster = war.roster;
    const blue = roster.filter(unit => unit.team === 'blue'), red = roster.filter(unit => unit.team === 'red');
    this.attribute('interface', 'data-game-mode', 'war');
    this.attribute('interface', 'data-war-player', possessed);
    if (possessed) this.renderVitals(state.player, `PLAYER // ${(war.playerTeam || 'blue').toUpperCase()}`);
    else this.toggleClass('body', 'low-health', false, document.body);
    this.attribute('interface', 'data-arena', arenaId);
    this.renderArenaIdentity(state, arenaId);
    this.text('wave-label', setup ? 'WAR MODE // DEPLOYMENT' : possessed ? 'WAR MODE // PLAYER' : 'WAR MODE // SPECTATING');
    this.text('next-boss', setup ? 'BUILD BLUE AND RED ARMIES' : finished ? 'BATTLE COMPLETE' : mode === 'paused' ? 'BATTLE PAUSED' : 'LET THE ARMIES FIGHT');
    for (const [id, visible] of [['war-setup', setup], ['war-battle-hud', !setup], ['war-result', finished], ['war-spectator-help', mode === 'playing' && !possessed]]) {
      this.update(`hidden:${id}`, !visible, hidden => { this.elements[id].hidden = hidden; });
    }
    for (const [team, units] of [['blue', blue], ['red', red]]) {
      this.text(`war-${team}-count`, `${units.length} / ${WAR_LIMITS.perTeam}`);
      this.text(`war-${team}-alive`, String(war.counts?.[team] ?? units.length));
    }
    this.text('war-time', clock(war.elapsed));
    this.text('war-battle-label', mode === 'paused' ? 'BATTLE PAUSED' : finished ? 'BATTLE COMPLETE' : 'BATTLE IN PROGRESS');
    if (setup) {
      const selected = this.warSelection.team === 'blue' ? blue : red;
      const duplicatePlayer = this.warSelection.type === 'war-player' && roster.some(unit => unit.type === 'war-player');
      const duplicateMega = this.warSelection.type === 'copper-mega-drill' && selected.some(unit => unit.type === 'copper-mega-drill');
      this.text('war-capacity', `${roster.length} / ${WAR_LIMITS.total} TOTAL`);
      this.text('war-ready', duplicatePlayer ? 'Only one Player can join. Remove it before placing it on another side.' : duplicateMega ? 'Each army can deploy one Copper Mega Drill. Choose another unit or switch sides.' : blue.length && red.length ? 'Both armies are ready. Let them fight when your setup is complete.' : 'Place at least one opponent on each side.');
      for (const [id, disabled] of [['war-fight', !blue.length || !red.length], ['war-clear', !selected.length], ['war-add', duplicatePlayer || duplicateMega || selected.length >= WAR_LIMITS.perTeam || roster.length >= WAR_LIMITS.total]]) {
        this.update(`disabled:${id}`, Boolean(disabled), value => { this.elements[id].disabled = value; });
      }
      const key = `${this.warSelection.team}:${selected.map(unit => `${unit.id}:${unit.type}`).join(',')}`;
      this.update('war:roster', key, () => {
        const list = this.elements['war-roster'];
        const children = selected.map(unit => {
          const row = document.createElement('li'), name = document.createElement('span'), remove = document.createElement('button');
          const label = WAR_CATALOG.find(entry => entry.id === unit.type)?.name || unit.type;
          name.textContent = label; remove.textContent = 'REMOVE';
          remove.setAttribute('aria-label', `Remove ${label} from ${unit.team} army`);
          remove.addEventListener('click', () => {
            this.elements['war-unit'].focus({ preventScroll: true });
            this.elements['war-unit'].scrollIntoView({ block: 'nearest' });
            this.onWarRemove(unit.id);
          });
          row.append(name, remove); return row;
        });
        if (!children.length) {
          const empty = document.createElement('li'); empty.className = 'war-empty';
          empty.textContent = 'No units on this side yet.'; children.push(empty);
        }
        list.replaceChildren(...children);
        this.attribute('war-roster', 'aria-label', `${this.warSelection.team} army placements`);
      });
    }
    if (finished) {
      const winner = war.winner;
      this.text('war-result-title', winner === 'draw' ? 'BATTLE DRAW.' : `${winner?.toUpperCase() || 'NO'} ARMY WINS.`);
      this.text('war-result-description', `${clock(war.elapsed)} of combat. Blue: ${war.counts?.blue ?? 0} remaining. Red: ${war.counts?.red ?? 0} remaining. Fight again with the same armies or edit your placements.`);
    }
    this.renderOcto(state);
  }

  renderOcto(state) {
    const living = state.enemies.filter(enemy => enemy.type === 'octo-nose' && enemy.hp > 0);
    this.octoAvailable = state.gameMode === 'war' && ['war-setup', 'playing'].includes(state.mode) && living.length > 0;
    this.update('hidden:octo-controls', !this.octoAvailable, hidden => { this.elements['octo-controls'].hidden = hidden; });
    this.update('disabled:octo-talk', !this.octoAvailable, disabled => { this.elements['octo-talk'].disabled = disabled; });
    if (!this.octoAvailable || (this.octoLine?.id != null && !living.some(enemy => String(enemy.id) === String(this.octoLine.id) || String(enemy.setupId) === String(this.octoLine.id)))) {
      this.clearOctoLine();
    } else {
      this.update('hidden:octo-caption', !this.octoLine, hidden => { this.elements['octo-caption'].hidden = hidden; });
    }
  }

  /** Keep every word readable independently of speech support and global sound. */
  showOctoLine({ text, id, team } = {}) {
    if (!this.octoAvailable || typeof text !== 'string' || !text.trim()) return false;
    clearTimeout(this.octoCaptionTimer);
    this.octoLine = { text, id, team };
    this.text('octo-caption-speaker', `OCTO NOSE${['blue', 'red'].includes(team) ? ` // ${team.toUpperCase()} ARMY` : ''}`);
    this.text('octo-caption-text', text.replace(/^Octo Nose:\s*/, '').replace(/^[“"]|[”"]$/g, ''));
    this.attribute('octo-caption', 'data-team', ['blue', 'red'].includes(team) ? team : 'neutral');
    this.update('hidden:octo-caption', false, hidden => { this.elements['octo-caption'].hidden = hidden; });
    this.octoCaptionTimer = setTimeout(() => this.clearOctoLine(), Math.max(10000, text.length * 90));
    this.octoCaptionTimer?.unref?.();
    return true;
  }

  clearOctoLine() {
    clearTimeout(this.octoCaptionTimer);
    this.octoCaptionTimer = null; this.octoLine = null;
    this.update('hidden:octo-caption', true, hidden => { this.elements['octo-caption'].hidden = hidden; });
    this.text('octo-caption-text', '');
  }

  renderOctoChat(state) {
    this.octoChatContext = state;
    if (this.octoChatOpen && (state.gameMode !== 'war' || !['war-setup', 'playing', 'paused'].includes(state.mode)
      || state.war !== this.octoChatSession || !state.enemies.some(enemy => enemy.type === 'octo-nose' && enemy.hp > 0 && enemy.id === this.octoChatTarget.id))) {
      this.closeOctoChat({ notify: false });
    }
    this.attribute('interface', 'data-octo-chat-open', Boolean(this.octoChatOpen));
  }

  openOctoChat({ id, team } = {}) {
    const state = this.octoChatContext;
    if (!state || state.gameMode !== 'war' || !['war-setup', 'playing', 'paused'].includes(state.mode)) return false;
    const target = state.enemies.find(enemy => enemy.type === 'octo-nose' && enemy.hp > 0 && (id == null || String(enemy.id) === String(id)));
    if (!target) return false;
    if (this.octoChatHistorySession !== state.war) {
      this.elements['octo-chat-log'].replaceChildren();
      this.elements['octo-chat-input'].value = '';
      this.octoChatHistorySession = state.war;
    }
    if (!this.octoChatOpen) this.octoChatReturnFocus = document.activeElement;
    this.octoChatOpen = true; this.octoChatTarget = target; this.octoChatSession = state.war;
    const army = target.team || team;
    this.text('octo-chat-team', `${['blue', 'red'].includes(army) ? army.toUpperCase() + ' ARMY // ' : ''}LOCAL CHAT`);
    this.attribute('interface', 'data-octo-chat-open', true);
    this.update('hidden:octo-chat', false, hidden => { this.elements['octo-chat'].hidden = hidden; });
    this.clearOctoLine();
    if (!this.elements['octo-chat-log'].children.length) this.appendOctoChat('Octo', 'Hello, Major. Ask about noses, Croba Planet, or a job I can help with.');
    this.elements['octo-chat-input'].focus({ preventScroll: true });
    return true;
  }

  appendOctoChat(who, text) {
    const log = this.elements['octo-chat-log'], row = document.createElement('p');
    const label = document.createElement('strong'), message = document.createElement('span');
    row.className = `octo-chat-row ${who === 'You' ? 'user' : 'octo'}`;
    label.textContent = `${who}: `; message.textContent = text;
    row.append(label, message); log.append(row);
    while (log.children.length > 24) log.removeChild(log.children[0]);
    log.scrollTop = log.scrollHeight;
  }

  closeOctoChat({ notify = true } = {}) {
    if (!this.octoChatOpen) return false;
    this.octoChatOpen = false; this.octoChatTarget = null;
    this.attribute('interface', 'data-octo-chat-open', false);
    this.update('hidden:octo-chat', true, hidden => { this.elements['octo-chat'].hidden = hidden; });
    if (notify) {
      this.octoChatReturnFocus?.focus?.({ preventScroll: true });
      this.onOctoChatClose();
    }
    return true;
  }

  setMode(state) {
    const { mode } = state;
    this.mode = mode;
    document.body.dataset.mode = mode;
    const panels = { menu: 'menu-panel', paused: 'pause-panel', upgrade: 'upgrade-panel', dead: 'end-panel' };
    for (const id of ['menu-panel', 'pause-panel', 'upgrade-panel', 'end-panel']) this.elements[id].hidden = id !== panels[mode];
    this.elements.overlay.hidden = ['playing', 'war-setup', 'war-result'].includes(mode);
    this.elements['pause-button'].hidden = mode !== 'playing' && mode !== 'paused';
    this.elements['pause-button'].setAttribute('aria-label', mode === 'paused' ? 'Resume game' : 'Pause game');
    if (mode === 'menu') this.showMenuStep('mode', false);
    if (mode === 'upgrade') {
      const survival = state.gameMode === 'survival';
      this.text('upgrade-eyebrow', survival ? `THREAT ${state.survival?.level ?? state.wave} REACHED` : `WAVE ${String(state.wave).padStart(3, '0')} CLEARED`);
      this.text('upgrade-instruction', survival ? 'Choose one upgrade, then continue surviving. Time is paused.' : 'Choose one module, then return to the fight.');
      this.renderUpgrades(state.upgrades);
    }
    if (mode === 'paused') {
      const survival = state.gameMode === 'survival';
      const war = state.gameMode === 'war';
      const possessed = war && state.war?.playerActive === true;
      this.text('pause-description', possessed ? 'Fight for your army with all permanent upgrades maxed. Inspect your loadout, then resume the battle.' : war ? 'The armies are paused. Resume to keep watching or return to the mode menu.' : survival ? 'Choose an upgrade every 30 seconds. Time pauses while you choose, then the fight continues.' : 'Inspect your installed modules. Resume when ready.');
      this.text('pause-upgrades-title', 'UPGRADES INSTALLED');
      if (!war || possessed) this.renderLoadout(state);
      this.elements['tri-field-guide'].hidden = state.arenaId !== 'bonefields';
    }
    if (mode === 'dead') {
      this.text('end-eyebrow', 'FIGHTER DOWN');
      const title = this.elements['end-title'];
      const colosseum = state.arenaId !== 'bonefields';
      title.replaceChildren(document.createTextNode(colosseum ? 'THE ROBOTS' : 'THE TRI'), document.createElement('br'));
      const accent = document.createElement('em');
      accent.textContent = 'PREVAIL.';
      title.append(accent);
      this.text('end-description', state.gameMode === 'survival' ? `You survived ${clock(state.survival?.elapsed ?? state.elapsed)} and defeated ${state.kills} ${colosseum ? 'robots' : 'Tri'}. How long can you last next time?` : `You held the line until wave ${state.wave}. The arena awaits your return.`);
      this.text('end-score', String(state.score).padStart(6, '0'));
      this.text('end-kills', String(state.kills));
      this.text('end-time', `${Math.floor(state.elapsed / 60)}:${String(Math.floor(state.elapsed % 60)).padStart(2, '0')}`);
    }
    // Keep keyboard actions available as overlays appear or disappear.
    const focusTarget = mode === 'menu' ? this.elements[`mode-${this.menuSelection.gameMode}`]
      : mode === 'playing' ? this.elements.arena
      : mode === 'paused' ? this.elements['resume-button']
      : mode === 'upgrade' ? this.elements['upgrade-options'].querySelector('button:not([disabled])')
      : mode === 'dead' ? this.elements['retry-button'] : null;
    const warFocus = mode === 'war-setup' ? this.elements['war-unit'] : mode === 'war-result' ? this.elements['war-rematch'] : focusTarget;
    if (!this.octoChatOpen) warFocus?.focus({ preventScroll: true });
    if (mode === 'war-setup' && !this.octoChatOpen) warFocus?.scrollIntoView({ block: 'nearest' });
    if (mode === 'upgrade') focusTarget?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  renderUpgrades(upgrades) {
    this.elements['upgrade-options'].replaceChildren(...upgrades.map((upgrade, index) => {
      const button = document.createElement('button');
      const service = upgrade.id === 'repair';
      const level = upgrade.level ?? 0;
      button.className = `upgrade-card${service ? ' repair-card' : ''}`;
      button.disabled = Boolean(upgrade.capped);
      button.setAttribute('aria-keyshortcuts', index === 9 ? '0' : String(index + 1));
      const meta = document.createElement('span');
      meta.className = 'upgrade-meta';
      const category = document.createElement('span');
      category.className = 'upgrade-index';
      category.textContent = (MODULES[upgrade.id] || MODULES.repair)[0];
      const shortcut = document.createElement('kbd');
      shortcut.textContent = index === 9 ? '0' : String(index + 1);
      meta.append(moduleIcon(upgrade.id), category, shortcut);
      const title = document.createElement('strong');
      title.textContent = upgrade.title;
      const badge = document.createElement('span');
      badge.className = 'upgrade-level';
      badge.textContent = service ? `REPAIRS USED ${level} · UNLIMITED` : `CURRENT LV ${level} / ${upgrade.maxLevel}`;
      const description = document.createElement('p');
      description.textContent = upgrade.description;
      const action = document.createElement('span');
      action.className = 'upgrade-action';
      action.textContent = upgrade.capped ? 'MAX LEVEL' : service ? 'REPAIR & CONTINUE ↗' : `INSTALL LEVEL ${level + 1} ↗`;
      button.append(meta, title, badge, description, action);
      button.addEventListener('click', () => this.onUpgrade(upgrade.id));
      return button;
    }));
  }

  renderLoadout(state) {
    const levels = state.upgradeLevels || {};
    const installed = UPGRADE_CATALOG.filter(upgrade => upgrade.id !== 'repair' && levels[upgrade.id] > 0).map(upgrade => {
      const entry = document.createElement('span');
      const level = levels[upgrade.id];
      entry.textContent = `${upgrade.title} · LV ${level}${level >= upgrade.maxLevel ? ' MAX' : ''}`;
      return entry;
    });
    if (!installed.length) {
      const empty = document.createElement('span');
      empty.className = 'loadout-empty';
      empty.textContent = 'NO MODULES INSTALLED — CLEAR A WAVE TO UPGRADE';
      installed.push(empty);
    }
    if (levels.repair > 0) {
      const repairs = document.createElement('span');
      repairs.className = 'repair-count';
      repairs.textContent = `FIELD REPAIRS ${levels.repair}`;
      installed.push(repairs);
    }
    this.elements['installed-upgrades'].replaceChildren(...installed);
    const player = state.player;
    const seconds = value => `${(Number.isFinite(value) ? value : 0).toFixed(2)}s`;
    const stats = [
      ['BLADE POWER', `${(player.bladePower || 1).toFixed(2)}×`], ['MAX HEALTH', player.maxHp],
      ['MOVE SPEED', `${(player.moveSpeed || 0).toFixed(1)} m/s`], ['ARMOR', `${Math.round((player.armor || 0) * 100)}%`],
      ['SWING', seconds(player.attackDuration)], ['DASH', seconds(player.dashDuration)],
      ['ENERGY / REGEN', `${player.maxStamina} / +${Math.round(player.staminaRegen || 0)}/s`],
      ['HEAL PER KILL', `+${player.killHealing || 0}`], ['KICK / COOLDOWN', `${player.kickDamage || 0} / ${seconds(player.kickDuration)}`],
    ];
    this.elements['pause-stats'].replaceChildren(...stats.map(([label, value]) => {
      const entry = document.createElement('div');
      const caption = document.createElement('span');
      caption.textContent = label;
      const stat = document.createElement('strong');
      stat.textContent = String(value);
      entry.append(caption, stat);
      return entry;
    }));
  }

  renderFieldGuide() {
    this.elements['tri-species-count'].textContent = `${CREATURE_CATALOG.length} SPECIES`;
    this.elements['tri-species-list'].replaceChildren(...CREATURE_CATALOG.map(creature => {
      const entry = document.createElement('article');
      const name = document.createElement('strong');
      name.textContent = creature.name;
      const description = document.createElement('p');
      description.textContent = creature.description;
      entry.append(name, description);
      if (creature.attackHelp) {
        const hint = document.createElement('small');
        hint.textContent = creature.attackHelp;
        entry.append(hint);
      }
      return entry;
    }));
  }

  toast(message) {
    clearTimeout(this.toastTimer);
    this.elements.toast.textContent = message;
    this.elements.toast.classList.add('visible');
    this.toastTimer = setTimeout(() => this.elements.toast.classList.remove('visible'), 2100);
  }
}
