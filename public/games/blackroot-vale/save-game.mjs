import { WORLD_HALF } from './layout.mjs';

const VERSION = 1;
const PREFIX = 'blackroot-vale.save.';
const slots = ['manual', 'auto'];
const areas = [null, 'dungeon', 'tower', 'battlefield'];
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const listOfIds = (value) => Array.isArray(value) && value.length < 24 && value.every((id) => typeof id === 'string');

function playableState(state) {
  const player = state?.player;
  return object(state) && areas.includes(state.area) && object(player)
    && [player.x, player.z, player.yaw, player.pitch, player.height].every(Number.isFinite)
    && Math.hypot(player.x, player.z) <= WORLD_HALF && Math.abs(player.height) < 24 && Math.abs(player.pitch) <= 1.1
    && typeof state.place === 'string' && state.place.length < 100
    && listOfIds(state.doors) && listOfIds(state.gates)
    && (state.openingGate === null || typeof state.openingGate === 'string')
    && object(state.blub) && object(state.rider);
}

export function createSaveStore(storage = () => globalThis.localStorage) {
  function read(slot) {
    let raw;
    try {
      raw = storage().getItem(PREFIX + slot);
    } catch {
      return { status: 'unavailable', record: null };
    }
    if (raw === null) return { status: 'empty', record: null };
    try {
      const record = JSON.parse(raw);
      if (record?.version === VERSION && typeof record.revision === 'string'
        && Number.isSafeInteger(record.savedAt) && record.savedAt > 0 && record.savedAt <= 8.64e15
        && playableState(record.state)) {
        return { status: 'ready', record };
      }
    } catch {
      // The current run can continue even if a browser save is unreadable.
    }
    return { status: 'invalid', record: null };
  }

  return {
    read,
    latest() {
      return slots.map((slot) => read(slot).record).filter(Boolean)
        .sort((a, b) => b.savedAt - a.savedAt)[0] ?? null;
    },
    write(slot, state, expectedRevision) {
      if (!playableState(state)) return { status: 'invalid', record: null };
      if (expectedRevision !== undefined) {
        const existing = read(slot);
        if (existing.status === 'unavailable') return existing;
        if ((existing.record?.revision ?? null) !== expectedRevision) return { status: 'changed', record: null };
      }
      const savedAt = Date.now();
      const revision = savedAt + '-' + Math.random().toString(36).slice(2);
      const record = { version: VERSION, savedAt, revision, state };
      try {
        storage().setItem(PREFIX + slot, JSON.stringify(record));
        return { status: 'ready', record };
      } catch {
        return { status: 'unavailable', record: null };
      }
    },
  };
}
