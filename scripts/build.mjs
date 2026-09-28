import { cpSync, mkdirSync, rmSync } from 'node:fs';

const output = 'dist';
rmSync(output, { recursive: true, force: true }); mkdirSync(output);
for (const path of ['index.html', 'manifest.webmanifest', 'service-worker.js', 'src', 'assets']) cpSync(path, `${output}/${path}`, { recursive: true });
console.log('Build complete: dist/');
