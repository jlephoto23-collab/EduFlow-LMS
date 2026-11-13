/**
 * Copy static web assets into www/ for Capacitor (clean native build folder).
 */
import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const www = join(root, 'www');

if (existsSync(www)) rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

const files = [
  'index.html',
  'manifest.json',
  'sw.js',
  'package.json',
];
const dirs = ['css', 'js', 'icons'];

for (const f of files) {
  const src = join(root, f);
  if (existsSync(src)) cpSync(src, join(www, f));
}
for (const d of dirs) {
  const src = join(root, d);
  if (existsSync(src)) cpSync(src, join(www, d), { recursive: true });
}

// Marker for debugging installs
writeFileSync(
  join(www, 'build-info.txt'),
  `EduFlow LMS www build\n${new Date().toISOString()}\n`,
  'utf8'
);

console.log('www/ ready for Capacitor (npx cap sync)');
