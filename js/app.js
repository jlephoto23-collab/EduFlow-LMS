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

const mods = await Promise.all(
  Array.from({ length: 8 }, (_, i) => import('./ap' + i + '.js'))
);
const preamble = `const { KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode } = globalThis;\n`;
try {
  // eslint-disable-next-line no-new-func
  new Function(preamble + mods.map((m) => m.default).join(''))();
} catch (err) {
  console.error('EduFlow failed to start', err);
  document.getElementById('splash')?.classList.add('hide');
}
