/** Original Octo Nose dialogue from Axolotl Major's octo-companion.js. */
export const NOSE_LINES = Object.freeze([
  'A nose knows which way the wind goes. Mine prefers the quiet route.',
  'Some people follow their hearts. I follow my nose. Today, my nose follows you.',
  'Never trust a sewer with no smell. It might be holding its breath.',
  'My face stays covered. My opinions about noses do not.',
  'An axolotl has a little nose and very big ambitions. A fine combination.',
  'If we get lost, do not worry. I have a nose for adventure.',
  'Two nostrils, one mission: find somewhere that smells better.',
  'Please give my nose some room. It is thinking.',
]);
export const TRI_LINES = Object.freeze([
  'That pink growth in Rain and Copper... the Tri. Even my nose keeps its distance.',
  'Tri Lord Done left something behind. I would rather talk about noses.',
  'When the Tri turns grass pink, my nose says to find clear ground.',
]);
export const CROBA_LINES = Object.freeze([
  'On Croba Planet, the Woodlons have one eye. My nose would still find them among the old bones.',
  'Croba Planet has Crobon Birds nesting on crashed ships. A curious place to raise a family, says my nose.',
  'That giant ice centipede on Croba Planet? My nose votes for getting into the water before it arrives.',
  'Croba Planet has blue kelp forests beneath the waves. I wonder what an underwater nose would smell.',
]);
export const CROBA_REMARK_INTERVAL = 8;
export const OCTO_GREETING = 'I will come with you, Major. Follow your dreams—and your nose!';
export const TRI_REMARK_INTERVAL = 25;
export const OCTO_REMARK_SECONDS = 20;
const format = text => `Octo Nose: “${text}”`;
const ORIGINAL_SOURCE = Object.freeze({ noseLines: NOSE_LINES, triLines: TRI_LINES,
  triRemarkInterval: TRI_REMARK_INTERVAL, crobaLines: CROBA_LINES,
  crobaRemarkInterval: CROBA_REMARK_INTERVAL, greeting: OCTO_GREETING });

export function nextOctoRemark(speaker, source = ORIGINAL_SOURCE) {
  const number = ++speaker.line;
  if (source.remarkCycle?.length) return format(source.remarkCycle[(number - 1) % source.remarkCycle.length]);
  return format(number % source.triRemarkInterval === 0
    ? source.triLines[(number / source.triRemarkInterval - 1) % source.triLines.length]
    : source.crobaLines?.length && number % source.crobaRemarkInterval === 0
      ? source.crobaLines[(number / source.crobaRemarkInterval - 1) % source.crobaLines.length]
    : source.noseLines[(number - 1) % source.noseLines.length]);
}

/** One conversation clock prevents overlapping voices when both armies contain Octo. */
export class OctoDialogue {
  constructor() { this.source = ORIGINAL_SOURCE; this.reset(); }

  updateSource(source) {
    const validLines = (lines, maxLength = 128) => Array.isArray(lines) && lines.length > 0 && lines.length <= maxLength
      && lines.every(line => typeof line === 'string' && line.trim().length > 0 && line.length <= 500);
    if (!source || !validLines(source.noseLines) || !validLines(source.triLines)
      || !Number.isSafeInteger(source.triRemarkInterval) || source.triRemarkInterval < 1 || source.triRemarkInterval > 500
      || typeof source.greeting !== 'string' || !source.greeting.trim() || source.greeting.length > 500) return false;
    if (source.crobaLines !== undefined && (!validLines(source.crobaLines) || !Number.isSafeInteger(source.crobaRemarkInterval)
      || source.crobaRemarkInterval < 1 || source.crobaRemarkInterval > 500)) return false;
    if (source.remarkCycle !== undefined && !validLines(source.remarkCycle, 4096)) return false;
    this.source = Object.freeze({ noseLines: Object.freeze([...source.noseLines]), triLines: Object.freeze([...source.triLines]),
      triRemarkInterval: source.triRemarkInterval, greeting: source.greeting,
      ...(source.crobaLines ? { crobaLines: Object.freeze([...source.crobaLines]), crobaRemarkInterval: source.crobaRemarkInterval } : {}),
      ...(source.remarkCycle ? { remarkCycle: Object.freeze([...source.remarkCycle]) } : {}) });
    return true;
  }

  reset() {
    this.session = null;
    this.line = 0;
    this.introduced = false;
    this.nextRemarkAt = OCTO_REMARK_SECONDS;
    this.speakerIndex = 0;
  }

  speakers(state) {
    if (state.gameMode !== 'war') { if (this.session) this.reset(); return []; }
    if (state.war !== this.session) {
      this.reset();
      this.session = state.war;
    }
    if (!['war-setup', 'playing'].includes(state.mode)) return [];
    return state.enemies.filter(actor => actor.type === 'octo-nose' && actor.hp > 0);
  }

  remark(state, speakers) {
    const speaker = speakers[this.speakerIndex++ % speakers.length];
    const text = this.introduced ? nextOctoRemark(this, this.source) : format(this.source.greeting);
    this.introduced = true;
    this.nextRemarkAt = state.elapsed + OCTO_REMARK_SECONDS;
    return { text, id: speaker.id, team: speaker.team };
  }

  update(state) {
    const speakers = this.speakers(state);
    if (!speakers.length) return null;
    if (!this.introduced || state.mode === 'playing' && state.elapsed >= this.nextRemarkAt) {
      return this.remark(state, speakers);
    }
    return null;
  }

  talk(state) {
    const speakers = this.speakers(state);
    return speakers.length ? this.remark(state, speakers) : null;
  }
}
