import {
  KEYS,
  load,
  save,
  uid,
  seedIfNeeded,
  onLiveChange,
  getLiveMode,
} from './store.js';
import p1 from './payload1.js';
import p2 from './payload2.js';

Object.assign(globalThis, {
  KEYS,
  load,
  save,
  uid,
  seedIfNeeded,
  onLiveChange,
  getLiveMode,
});

const b64 = p1 + p2;
function b64ToU8(s) {
  const bin = atob(s);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
try {
  const ds = new DecompressionStream('deflate');
  const stream = new Blob([b64ToU8(b64)]).stream().pipeThrough(ds);
  const text = await new Response(stream).text();
  // eslint-disable-next-line no-new-func
  new Function(text)();
} catch (err) {
  console.error('EduFlow failed to start', err);
  document.getElementById('splash')?.classList.add('hide');
}
