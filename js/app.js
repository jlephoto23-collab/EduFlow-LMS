import {
  KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode,
} from './store.js';
import q0 from './q0.js';
import q1 from './q1.js';
import q2 from './q2.js';
import q3 from './q3.js';
import q4 from './q4.js';
import q5 from './q5.js';
import q6 from './q6.js';
import q7 from './q7.js';

Object.assign(globalThis, { KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode });

const b64 = q0 + q1 + q2 + q3 + q4 + q5 + q6 + q7;
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
  new Function(text)();
} catch (err) {
  console.error('EduFlow failed to start', err);
  document.getElementById('splash')?.classList.add('hide');
}
