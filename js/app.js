import {
  KEYS,
  load,
  save,
  uid,
  seedIfNeeded,
  onLiveChange,
  getLiveMode,
} from './store.js';

Object.assign(globalThis, {
  KEYS,
  load,
  save,
  uid,
  seedIfNeeded,
  onLiveChange,
  getLiveMode,
});

const parts = await Promise.all([
  import('./c0.js'),
  import('./c1.js'),
  import('./c2.js'),
  import('./c3.js'),
  import('./c4.js'),
  import('./c5.js'),
  import('./c6.js'),
  import('./c7.js'),
  import('./c8.js'),
  import('./c9.js'),
  import('./c10.js'),
  import('./c11.js'),
  import('./c12.js'),
  import('./c13.js'),
  import('./c14.js'),
  import('./c15.js'),
  import('./c16.js'),
  import('./c17.js'),
]);

const preamble = `
const { KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode } = globalThis;
`;

const source = preamble + parts.map((m) => m.default).join('');

try {
  // Prefer Function so boot runs even if DOMContentLoaded already fired
  // and blob: module imports are blocked.
  // eslint-disable-next-line no-new-func
  new Function(source)();
} catch (err) {
  console.error('EduFlow failed to start', err);
  document.getElementById('splash')?.classList.add('hide');
  const errBox = document.getElementById('login-error');
  if (errBox) {
    errBox.textContent = 'App failed to load. Hard-refresh (Ctrl+F5) or clear site data.';
    errBox.classList.remove('d-none');
  }
}
