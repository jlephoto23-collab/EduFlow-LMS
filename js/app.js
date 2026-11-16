import {
  KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode,
} from './store.js';

Object.assign(globalThis, { KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode });

const base = new URL('./', import.meta.url);
const names = ['p1a.txt', 'p1b.txt', 'part2.txt'];
const parts = await Promise.all(
  names.map((n) => fetch(new URL(n + '?v=20261116f', base)).then((r) => {
    if (!r.ok) throw new Error('Failed ' + n);
    return r.text();
  }))
);
new Function(parts.join(''))();
