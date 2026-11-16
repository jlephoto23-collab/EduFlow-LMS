import {
  KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode,
} from './store.js';

Object.assign(globalThis, { KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode });

try {
  const base = new URL('./', import.meta.url);
  const parts = await Promise.all(
    [0, 1, 2].map((i) => fetch(new URL('app-core-' + i + '.txt', base)).then((r) => r.text()))
  );
  new Function(parts.join(''))();
} catch (err) {
  console.error('EduFlow failed to start', err);
  document.getElementById('splash')?.classList.add('hide');
}
