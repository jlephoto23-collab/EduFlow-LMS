import {
  KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode,
} from './store.js';

Object.assign(globalThis, { KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode });

const base = new URL('./', import.meta.url);
const parts = await Promise.all(
  ['c0.txt', 'c1.txt'].map((n) =>
    fetch(new URL(n + '?v=20261123d', base)).then((r) => {
      if (!r.ok) throw new Error('Failed ' + n);
      return r.text();
    })
  )
);
new Function(parts.join(''))();
