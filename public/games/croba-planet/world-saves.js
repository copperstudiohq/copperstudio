import { packWorldText, unpackWorldText } from './world-save-codec.js';
export const WORLD_SAVE_FORMAT = 'croba-planet-world';
export const WORLD_SAVE_VERSION = 1;
export const WORLD_SAVE_PREFIX = 'croba-planet.world.v1.';
export const MAX_SAVED_WORLDS = 12;
export const MAX_SNAPSHOT_BYTES = 4 * 1024 * 1024;
const MAX_FILE_BYTES = MAX_SNAPSHOT_BYTES + 4096;
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,95}$/;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const utf8Length = value => new TextEncoder().encode(value).length;

export class WorldSaveError extends Error {
  constructor(code, message, options) { super(message, options); this.name = 'WorldSaveError'; this.code = code; }
}

function browserStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

function defaultId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

function worldName(value) {
  if (typeof value !== 'string') throw new WorldSaveError('invalid-name', 'Enter a name for this world.');
  const name = value.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!name || [...name].length > 32) throw new WorldSaveError('invalid-name', 'Use a world name from 1 to 32 characters.');
  return name;
}

function worldId(id) {
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) throw new WorldSaveError('invalid-id', 'This world has an invalid identifier.');
  return id;
}

/** Reject cycles, non-JSON values, huge/deep graphs and prototype-bearing data before serialization. */
function validateJson(value) {
  const ancestors = new WeakSet();
  let count = 0;
  function visit(node, depth) {
    if (++count > 1000000 || depth > 24) throw new WorldSaveError('invalid-save', 'This world contains too much nested save data.');
    if (node === null || typeof node === 'boolean' || typeof node === 'string') return;
    if (typeof node === 'number') {
      if (!Number.isFinite(node)) throw new WorldSaveError('invalid-save', 'World save numbers must be finite.');
      return;
    }
    if (typeof node !== 'object') throw new WorldSaveError('invalid-save', 'This world contains unsupported save data.');
    const prototype = Object.getPrototypeOf(node);
    if (!Array.isArray(node) && prototype !== Object.prototype && prototype !== null) {
      throw new WorldSaveError('invalid-save', 'World save data must use plain records.');
    }
    if (ancestors.has(node)) throw new WorldSaveError('invalid-save', 'This world contains circular save data.');
    if (Array.isArray(node) && node.length > 65536) throw new WorldSaveError('invalid-save', 'A world save array is too large.');
    ancestors.add(node);
    for (const key of Object.keys(node)) {
      if (FORBIDDEN_KEYS.has(key)) throw new WorldSaveError('invalid-save', 'This world contains unsafe save keys.');
      visit(node[key], depth + 1);
    }
    ancestors.delete(node);
  }
  visit(value, 0);
}

/** Browser-local save slots. Each world is one atomic storage value; no fragile external index is needed.
 * @param {{storage?:Storage|null, now?:()=>number, makeId?:()=>string, validateSnapshot?:(snapshot:unknown)=>object}} options
 */
export function createWorldStore({ storage = browserStorage(), now = Date.now, makeId = defaultId,
  validateSnapshot = value => value } = {}) {
  if (typeof now !== 'function' || typeof makeId !== 'function' || typeof validateSnapshot !== 'function') {
    throw new TypeError('World saves require clock, ID and snapshot validation functions.');
  }

  function requireStorage() {
    if (!storage || !['getItem', 'setItem', 'removeItem', 'key'].every(method => typeof storage[method] === 'function')) {
      throw new WorldSaveError('storage-unavailable', 'World storage is unavailable. Enable browser storage before creating or loading a world.');
    }
  }
  function storageFailure(error, writing = false) {
    if (error instanceof WorldSaveError) return error;
    if (writing && (error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014)) {
      return new WorldSaveError('storage-full', 'World storage is full. Export a backup and remove an unused world, then try again.', { cause: error });
    }
    return new WorldSaveError('storage-unavailable', 'The browser could not access world storage. Your last saved world has been kept.', { cause: error });
  }
  function read(id) {
    requireStorage();
    try { return storage.getItem(WORLD_SAVE_PREFIX + worldId(id)); }
    catch (error) { throw storageFailure(error); }
  }
  function timestamp() {
    const value = now();
    if (!Number.isSafeInteger(value) || value < 0) throw new WorldSaveError('invalid-clock', 'The browser clock could not date this world save.');
    return value;
  }
  function snapshotCopy(snapshot) {
    try {
      validateJson(snapshot);
      const normalized = validateSnapshot(JSON.parse(JSON.stringify(snapshot)));
      if (!isObject(normalized)) throw new WorldSaveError('invalid-save', 'A world needs a valid progress snapshot.');
      validateJson(normalized);
      const text = JSON.stringify(normalized);
      if (text.length > MAX_SNAPSHOT_BYTES || utf8Length(text) > MAX_SNAPSHOT_BYTES) {
        throw new WorldSaveError('save-too-large', 'This world exceeds the supported save size. Your previous save has been kept.');
      }
      return JSON.parse(text);
    } catch (error) {
      if (error instanceof WorldSaveError) throw error;
      throw new WorldSaveError('invalid-save', error?.message || 'This world has invalid progress data.', { cause: error });
    }
  }
  function parse(text, expectedId = null) {
    if (typeof text !== 'string' || text.length > MAX_FILE_BYTES || utf8Length(text) > MAX_FILE_BYTES) {
      throw new WorldSaveError('invalid-save', 'This world file is missing or too large.');
    }
    let record;
    try { record = JSON.parse(text); } catch (error) {
      throw new WorldSaveError('corrupt-save', 'This world could not be read. Its stored data has not been changed.', { cause: error });
    }
    validateJson(record);
    if (!isObject(record) || record.format !== WORLD_SAVE_FORMAT) throw new WorldSaveError('invalid-save', 'Choose a Croba world file.');
    if (record.version !== WORLD_SAVE_VERSION) throw new WorldSaveError('unsupported-version', 'This world uses an unsupported save version. Its data has been kept.');
    const id = worldId(record.id);
    if (expectedId !== null && id !== expectedId) throw new WorldSaveError('corrupt-save', 'The world identifier does not match its save slot.');
    if (![record.createdAt, record.updatedAt].every(value => Number.isSafeInteger(value) && value >= 0)
      || record.updatedAt < record.createdAt || !Number.isSafeInteger(record.revision) || record.revision < 1 || record.revision > 1000000000) {
      throw new WorldSaveError('corrupt-save', 'This world has invalid save metadata. Its data has been kept.');
    }
    return { id, name: worldName(record.name), createdAt: record.createdAt, updatedAt: record.updatedAt,
      revision: record.revision, snapshot: snapshotCopy(record.snapshot) };
  }
  function compactStoredWorlds(exceptId) {
    let compacted=0;
    // Replace only with a smaller, verified representation. Never delete a world to make room.
    for(const key of keys()){
      if(key===WORLD_SAVE_PREFIX+exceptId)continue;
      try{const old=storage.getItem(key);if(typeof old!=='string'||old.startsWith('RCZ1:')||old.length>MAX_FILE_BYTES)continue;
        const packed=packWorldText(old);if(packed===old||unpackWorldText(packed,{maxBytes:MAX_FILE_BYTES})!==old)continue;
        if(storage.getItem(key)!==old)continue; // Another tab updated this world while it was being compressed.
        storage.setItem(key,packed);compacted++;
      }catch{/* A failed atomic replacement leaves that world's old value intact. */}
    }
    return compacted;
  }
  function write(record) {
    requireStorage();
    if (!Number.isSafeInteger(record.revision) || record.revision > 1000000000) {
      throw new WorldSaveError('revision-limit', 'This world has reached its save revision limit. Export and import a backup into a new slot.');
    }
    const text = packWorldText(JSON.stringify({ format: WORLD_SAVE_FORMAT, version: WORLD_SAVE_VERSION, ...record }));
    const key=WORLD_SAVE_PREFIX+record.id;
    try { storage.setItem(key,text); }
    catch (error) {
      const failure=storageFailure(error,true);
      if(failure.code!=='storage-full'||!compactStoredWorlds(record.id))throw failure;
      try{storage.setItem(key,text);}catch(retryError){throw storageFailure(retryError,true);}
    }
    try{if(storage.getItem(key)!==text)throw new WorldSaveError('storage-unavailable','The browser did not keep this save. Export your current progress before leaving.');}
    catch(error){throw storageFailure(error);}
    return JSON.parse(JSON.stringify(record));
  }
  function keys() {
    requireStorage();
    try {
      const count = storage.length;
      if (!Number.isSafeInteger(count) || count < 0 || count > 100000) throw new Error('Invalid storage length');
      const selected = [];
      for (let index = 0; index < count; index++) {
        const key = storage.key(index);
        if (typeof key === 'string' && key.startsWith(WORLD_SAVE_PREFIX)) selected.push(key);
      }
      return selected;
    } catch (error) { throw storageFailure(error); }
  }
  function load(id) {
    const text = read(id);
    if (text === null) throw new WorldSaveError('not-found', 'This world is no longer saved in this browser.');
    try{return parse(unpackWorldText(text,{maxBytes:MAX_FILE_BYTES}),id);}
    catch(error){if(error instanceof WorldSaveError)throw error;throw new WorldSaveError('corrupt-save',error.message,{cause:error});}
  }
  function list() {
    const worlds = [];
    const errors = [];
    for (const key of keys()) {
      const id = key.slice(WORLD_SAVE_PREFIX.length);
      try {
        const { snapshot, ...metadata } = load(id);
        const elapsed = snapshot.vitals?.elapsed ?? snapshot.state?.elapsed;
        worlds.push({ ...metadata, elapsedSeconds: Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : 0 });
      } catch (error) {
        const failure = storageFailure(error);
        errors.push({ id, code: failure.code, message: failure.message });
      }
    }
    worlds.sort((left, right) => right.updatedAt - left.updatedAt || left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
    return { worlds, errors };
  }
  function create(name, snapshot) {
    const normalizedName = worldName(name);
    const copy = snapshotCopy(snapshot);
    if (keys().length >= MAX_SAVED_WORLDS) throw new WorldSaveError('world-limit', `You can keep up to ${MAX_SAVED_WORLDS} worlds. Export a backup before removing an old one.`);
    let id;
    for (let attempt = 0; attempt < 8; attempt++) {
      id = worldId(makeId());
      if (read(id) === null) break;
      id = null;
    }
    if (!id) throw new WorldSaveError('id-collision', 'A new world slot could not be created. Please try again.');
    const time = timestamp();
    return write({ id, name: normalizedName, createdAt: time, updatedAt: time, revision: 1, snapshot: copy });
  }
  function save(id, snapshot, { expectedRevision } = {}) {
    const record = load(id);
    if (expectedRevision !== undefined && record.revision !== expectedRevision) {
      throw new WorldSaveError('save-conflict', 'This world changed in another tab. Return to Worlds and load the latest save before continuing.');
    }
    const copy = snapshotCopy(snapshot);
    return write({ ...record, updatedAt: Math.max(record.updatedAt, timestamp()), revision: record.revision + 1, snapshot: copy });
  }
  function rename(id, name) {
    const record = load(id);
    return write({ ...record, name: worldName(name), updatedAt: Math.max(record.updatedAt, timestamp()), revision: record.revision + 1 });
  }
  function remove(id) {
    if (read(id) === null) throw new WorldSaveError('not-found', 'This world is no longer saved in this browser.');
    try { storage.removeItem(WORLD_SAVE_PREFIX + worldId(id)); }
    catch (error) { throw storageFailure(error); }
  }
  function exportWorld(id, { snapshot } = {}) {
    const record = load(id);
    if (snapshot !== undefined) record.snapshot = snapshotCopy(snapshot);
    return JSON.stringify({ format: WORLD_SAVE_FORMAT, version: WORLD_SAVE_VERSION, ...record });
  }
  function importWorld(text) {
    const record = parse(text);
    return create(record.name, record.snapshot);
  }
  return { list, create, load, save, rename, remove, exportWorld, importWorld };
}
