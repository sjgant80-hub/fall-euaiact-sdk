// scripts/parity.mjs · src/ must be the fall-euaiact product's sdk/ folder byte for byte, and src/kernel.js must be
// the product's gated kernel.mjs (the classifier the live page runs). Default: the published repository on GitHub;
// or pass a local checkout of fall-euaiact.   node scripts/parity.mjs [path-to-fall-euaiact]
import { readFileSync } from 'node:fs';
const FILES = ['index.js', 'index.d.ts', 'kernel.js', 'classifier.js', 'articles.js', 'audit.js', 'docgen.js', 'transparency.js', 'sign.js'];
const local = process.argv[2];
const read = async (p) => (local ? readFileSync(local + '/' + p, 'utf8') : await (await fetch('https://raw.githubusercontent.com/sjgant80-hub/fall-euaiact/main/' + p)).text());
const drift = [];
for (const f of FILES) if (readFileSync(new URL('../src/' + f, import.meta.url), 'utf8') !== await read('sdk/' + f)) drift.push('src/' + f + ' differs from fall-euaiact/sdk/' + f);
if (readFileSync(new URL('../src/kernel.js', import.meta.url), 'utf8') !== await read('kernel.mjs')) drift.push('src/kernel.js differs from fall-euaiact/kernel.mjs, the gated kernel the page runs');
if (drift.length) { console.error('PARITY FAILED:\n  ' + drift.join('\n  ')); process.exit(1); }
console.log('parity: all ' + FILES.length + ' files match fall-euaiact/sdk byte for byte, and the kernel is the page\'s gated kernel.mjs');
