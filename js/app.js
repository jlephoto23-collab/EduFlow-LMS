import {
  KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode,
} from './store.js';

Object.assign(globalThis, { KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode });

const base = new URL('./', import.meta.url);
const [a, b] = await Promise.all([
  fetch(new URL('part1.txt?v=20261116f', base)).then(r => { if (!r.ok) throw new Error('part1'); return r.text(); }),
  fetch(new URL('part2.txt?v=20261116f', base)).then(r => { if (!r.ok) throw new Error('part2'); return r.text(); }),
]);
new Function(a + b)();
