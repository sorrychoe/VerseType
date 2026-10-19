import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function serviceWorker(base, files, version) {
  return `const BASE = ${JSON.stringify(base)};
const PREFIX = 'versetype-pwa-';
const CACHE = PREFIX + ${JSON.stringify(version)};
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin ||
      (url.pathname !== BASE && !url.pathname.startsWith(BASE + '/'))) return;
  let path = url.pathname;
  if (event.request.mode === 'navigate') {
    const route = path.slice(BASE.length).replace(/\\/$/, '');
    if (route === '' || route === '/index.html') path = BASE + '/index.html';
    else if (route === '/past' || route === '/attendance') path = BASE + route + '.html';
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return await cache.match(path) || fetch(event.request);
  })());
});
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { expo } = JSON.parse(readFileSync('app.json', 'utf8'));
  const base = expo.experiments.baseUrl;
  const list = (dir, prefix = '') => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = prefix + entry.name;
    return entry.isDirectory() ? list(join(dir, entry.name), path + '/') : [path];
  });
  const files = list('dist').filter(file => file !== 'sw.js' && !file.startsWith('.')).sort();
  const hash = createHash('sha256').update(serviceWorker(base, [], ''));
  for (const file of files) hash.update(file).update(readFileSync(join('dist', file)));
  const version = hash.digest('hex').slice(0, 16);
  writeFileSync('dist/sw.js', serviceWorker(base, files.map(file => `${base}/${file}`), version));
  console.log(`PWA 사전 캐시: ${files.length}개 파일, 버전 ${version}`);
}
