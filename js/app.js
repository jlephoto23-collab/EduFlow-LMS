import {
  KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode,
} from './store.js';

Object.assign(globalThis, { KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode });

try {
  const base = new URL('./', import.meta.url);
  const parts = await Promise.all(
    [0, 1, 2, 3].map((i) =>
      fetch(new URL('c' + i + '.txt?v=20261116d', base)).then((r) => {
        if (!r.ok) throw new Error('Failed to load c' + i + '.txt');
        return r.text();
      })
    )
  );
  new Function(parts.join(''))();
} catch (err) {
  console.error('EduFlow failed to start', err);
  document.getElementById('splash')?.classList.add('hide');
  const c = document.getElementById('content');
  if (c) c.innerHTML = '<div class="content-block"><p>Failed to load app. Hard refresh (Ctrl+F5) or clear cache.</p></div>';
}
