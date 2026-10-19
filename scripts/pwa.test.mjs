import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { serviceWorker } from './pwa.mjs';

function worker({ failInstall = false } = {}) {
  const handlers = {};
  const stored = new Map();
  const deleted = [];
  let claimed = false;
  const cache = {
    async addAll(files) {
      if (failInstall) throw new Error('download failed');
      for (const file of files) stored.set(file, file);
    },
    async match(path) { return stored.get(path); },
  };
  vm.runInNewContext(serviceWorker('/VerseType', [
    '/VerseType/index.html', '/VerseType/past.html', '/VerseType/attendance.html', '/VerseType/app.js',
  ], 'new'), {
    URL,
    self: { location: { origin: 'https://church.test' }, clients: { async claim() { claimed = true; } }, addEventListener(name, fn) { handlers[name] = fn; } },
    caches: { async open() { return cache; }, async keys() { return ['church-cache', 'versetype-pwa-old', 'versetype-pwa-new']; }, async delete(key) { deleted.push(key); } },
    async fetch() { throw new Error('offline'); },
  });
  const lifecycle = name => new Promise((resolve, reject) => handlers[name]({ waitUntil: task => task.then(resolve, reject) }));
  const request = (path, mode = 'navigate', method = 'GET') => {
    let response;
    handlers.fetch({ request: { url: new URL(path, 'https://church.test').href, mode, method }, respondWith(task) { response = task; } });
    return response;
  };
  return { lifecycle, request, deleted, claimed: () => claimed };
}

test('오프라인에서 시작·지난달·출석 및 번들 파일을 캐시로 제공한다', async () => {
  const w = worker(); await w.lifecycle('install');
  for (const path of ['/VerseType', '/VerseType/', '/VerseType/?source=home']) assert.equal(await w.request(path), '/VerseType/index.html');
  for (const route of ['past', 'attendance']) {
    assert.equal(await w.request(`/VerseType/${route}`), `/VerseType/${route}.html`);
    assert.equal(await w.request(`/VerseType/${route}/`), `/VerseType/${route}.html`);
  }
  assert.equal(await w.request('/VerseType/app.js', 'cors'), '/VerseType/app.js');
});
test('교회 홈페이지·다른 출처·POST 요청은 가로채지 않는다', () => {
  const w = worker();
  for (const path of ['/', '/bible-ai/', '/VerseType-other/', 'https://other.test/VerseType/']) assert.equal(w.request(path), undefined);
  assert.equal(w.request('/VerseType/', 'cors', 'POST'), undefined);
});
test('업데이트 활성화 시 자기 이전 캐시만 지운다', async () => {
  const w = worker(); await w.lifecycle('activate');
  assert.deepEqual(w.deleted, ['versetype-pwa-old']); assert.equal(w.claimed(), true);
});
test('파일 다운로드 실패 시 새 서비스 워커 설치도 실패한다', async () => {
  await assert.rejects(worker({ failInstall: true }).lifecycle('install'), /download failed/);
});
