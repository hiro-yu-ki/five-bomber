import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relative = normalize(urlPath).replace(/^([/\\])+/, '');
  let file = join(root, relative || 'index.html');
  if (!file.startsWith(root) || !existsSync(file)) { response.writeHead(404); response.end('Not found'); return; }
  if (statSync(file).isDirectory()) file = join(file, 'index.html');
  response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  createReadStream(file).pipe(response);
});
const port = Number(process.env.PORT || 4173);
server.listen(port, '127.0.0.1', () => console.log(`FIVE BOMBER: http://127.0.0.1:${port}`));
