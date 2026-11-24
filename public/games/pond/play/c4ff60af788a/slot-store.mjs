import { createSlotRecord, restoreSlot, slotKey } from './model.mjs';

export const SLOT_NUMBERS = [1, 2, 3];
const DATABASE_NAME = 'orbit-bloom-systems';
const SNAPSHOTS = 'snapshots';
const SUMMARIES = 'summaries';

function transaction(database, stores, mode, operation) {
  return new Promise((resolve, reject) => {
    const work = database.transaction(stores, mode);
    work.addEventListener('error', (event) => reject(event.target.error ?? work.error ?? new Error('Storage request failed.')));
    work.addEventListener('abort', () => reject(work.error ?? new Error('Storage transaction was interrupted.')));
    let request;
    try {
      request = operation(work);
    } catch (error) {
      work.abort();
      reject(error);
      return;
    }
    work.addEventListener('complete', () => resolve(request?.result));
  });
}

function summarize(record, number) {
  const system = record?.system;
  if (typeof system?.name !== 'string' || !Number.isFinite(system.clock)) throw new Error('Invalid save summary.');
  const timestamp = typeof record.timestamp === 'string' && Number.isFinite(Date.parse(record.timestamp)) ? record.timestamp : null;
  return { number, name: system.name, clock: system.clock, timestamp };
}

function newer(first, second) {
  return (first?.timestamp ?? '') > (second?.timestamp ?? '');
}

export function createSlotStore({
  getDatabase = () => globalThis.indexedDB,
  getLegacy = () => globalThis.localStorage,
} = {}) {
  let connection;

  function open() {
    connection ??= new Promise((resolve, reject) => {
      const indexedDB = getDatabase();
      if (!indexedDB) return reject(new Error('IndexedDB is unavailable.'));
      const request = indexedDB.open(DATABASE_NAME, 1);
      let blocked = false;
      request.onupgradeneeded = () => {
        request.result.createObjectStore(SNAPSHOTS);
        request.result.createObjectStore(SUMMARIES, { keyPath: 'number' });
      };
      request.onblocked = () => {
        blocked = true;
        reject(new Error('Another tab is upgrading the save slots.'));
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        if (blocked) return database.close();
        database.onversionchange = () => {
          database.close();
          connection = undefined;
        };
        database.onclose = () => { connection = undefined; };
        resolve(database);
      };
    }).catch((error) => {
      connection = undefined;
      console.warn('Pond is using browser storage for save slots.', error);
      return null;
    });
    return connection;
  }

  function legacy(number) {
    try {
      const raw = getLegacy()?.getItem(slotKey(number));
      if (!raw) return null;
      const record = JSON.parse(raw);
      return { record, summary: summarize(record, number) };
    } catch {
      return { summary: { number, unreadable: true } };
    }
  }

  return {
    async list() {
      const database = await open();
      const indexed = database ? await transaction(database, [SUMMARIES], 'readonly', (work) => work.objectStore(SUMMARIES).getAll()) : [];
      return SLOT_NUMBERS.map((number) => {
        const saved = indexed.find((summary) => summary.number === number);
        const old = legacy(number)?.summary;
        return saved && !newer(old, saved) ? saved : old ?? { number };
      });
    },

    async load(number) {
      const database = await open();
      const old = legacy(number);
      const record = database ? await transaction(database, [SNAPSHOTS], 'readonly', (work) => work.objectStore(SNAPSHOTS).get(number)) : null;
      if (record && !newer(old?.summary, record)) return restoreSlot(record);
      if (old?.record) return restoreSlot(old.record);
      if (old?.summary.unreadable) throw new Error('This slot contains an unreadable save.');
      return null;
    },

    async save(number, system, view) {
      const record = structuredClone(createSlotRecord(system, view));
      const database = await open();
      if (database) {
        await transaction(database, [SNAPSHOTS, SUMMARIES], 'readwrite', (work) => {
          work.objectStore(SNAPSHOTS).put(record, number);
          work.objectStore(SUMMARIES).put(summarize(record, number));
        });
      } else {
        getLegacy().setItem(slotKey(number), JSON.stringify(record));
      }
    },
  };
}
