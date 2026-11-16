import {
  KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode,
} from './store.js';

Object.assign(globalThis, { KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode });

try {
  const base = new URL('./', import.meta.url);
  const [a, b] = await Promise.all([
    fetch(new URL('chunk-a.txt?v=20261116d', base)).then((r) => r.text()),
    fetch(new URL('chunk-b.txt?v=20261116d', base)).then((r) => r.text()),
  ]);
  new Function(a + b)();
} catch (err) {
  console.error('EduFlow failed to start', err);
  document.getElementById('splash')?.classList.add('hide');
}
