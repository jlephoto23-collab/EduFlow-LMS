import {
  KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode,
} from './store.js';

Object.assign(globalThis, { KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode });

const base = new URL('./', import.meta.url);
const v = '20261126g';

try {
  const parts = await Promise.all(
    ['c0.txt', 'c1.txt', 'c2.txt', 'c3.txt', 'c4.txt', 'c5.txt'].map((n) =>
      fetch(new URL(n + '?v=' + v, base)).then((r) => {
        if (!r.ok) throw new Error('Failed to load ' + n + ' (' + r.status + ')');
        return r.text();
      })
    )
  );
  new Function(parts.join('\n'))();
} catch (err) {
  console.error('EduFlow boot error:', err);
  const splash = document.getElementById('splash');
  if (splash) {
    splash.innerHTML = '<div style="padding:2rem;text-align:center;max-width:360px"><div class="splash-logo" style="margin:0 auto 1rem">E</div><p style="font-size:1.4rem;font-weight:800">EduFlow</p><p style="color:#f87171">Failed to load app modules.</p><p style="font-size:.85rem;color:#94a3b8">' + (err.message || err) + '</p><button onclick="location.reload()" style="margin-top:1rem;padding:.6rem 1.2rem;background:#2563eb;color:#fff;border:0;border-radius:8px;cursor:pointer">Reload</button></div>';
  }
}
