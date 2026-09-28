import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const files = ['src/app.js', 'src/audio.js', 'src/config.js', 'src/core.js', 'src/questions.js', 'src/renderer.js', 'src/storage.js', 'service-worker.js', 'scripts/build.mjs', 'scripts/check.mjs', 'scripts/serve.mjs'];
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
const html = readFileSync('index.html', 'utf8');
for (const source of [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]).filter((path) => !path.startsWith('#'))) {
  if (!existsSync(join(process.cwd(), source))) throw new Error(`Missing referenced file: ${source}`);
}
if (/\beval\s*\(|new Function\s*\(/.test(files.map((file) => readFileSync(file, 'utf8')).join('\n'))) throw new Error('Dynamic code execution is not allowed');
console.log(`Syntax/static checks passed (${files.length} JavaScript files)`);
