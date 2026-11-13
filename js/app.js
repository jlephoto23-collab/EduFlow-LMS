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

await import('./app-a.js');
await import('./app-b.js');
