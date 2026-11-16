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

const [a, b] = await Promise.all([
  import('./bundle-a.js'),
  import('./bundle-b.js'),
]);
try {
  // eslint-disable-next-line no-new-func
  new Function(a.default + b.default)();
} catch (err) {
  console.error('EduFlow failed to start', err);
  document.getElementById('splash')?.classList.add('hide');
}
