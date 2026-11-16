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

const mods = await Promise.all([
  import('./b0.js'),
  import('./b1.js'),
  import('./b2.js'),
  import('./b3.js'),
]);
try {
  // eslint-disable-next-line no-new-func
  new Function(mods.map((m) => m.default).join(''))();
} catch (err) {
  console.error('EduFlow failed to start', err);
  document.getElementById('splash')?.classList.add('hide');
}
