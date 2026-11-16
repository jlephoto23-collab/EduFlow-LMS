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

const parts = await Promise.all(
  Array.from({ length: 18 }, (_, i) => import('./c' + i + '.js'))
);
const preamble = `const { KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode } = globalThis;\n`;
const source = preamble + parts.map((m) => m.default).join('');
try {
  // eslint-disable-next-line no-new-func
  new Function(source)();
} catch (err) {
  console.error('EduFlow failed to start', err);
  document.getElementById('splash')?.classList.add('hide');
}
