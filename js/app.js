import {
  KEYS, load, save, uid, seedIfNeeded, onLiveChange, getLiveMode,
} from './store.js';

// Bootstrap: load full app core as separate module to keep this file small
import './app-core.js';
