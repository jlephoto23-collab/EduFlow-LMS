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

const [p1, p2] = await Promise.all([
  import('./app-part1.js'),
  import('./app-part2.js'),
]);
const preamble = `const { KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode } = globalThis;\n`;
const source = preamble + p1.default + p2.default;
try {
  // eslint-disable-next-line no-new-func
  new Function(source)();
} catch (err) {
  console.error('EduFlow failed to start', err);
  document.getElementById('splash')?.classList.add('hide');
}
