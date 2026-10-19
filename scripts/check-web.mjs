import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const { expo } = JSON.parse(readFileSync('app.json', 'utf8'));
const base = expo.experiments.baseUrl;
const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'));
assert.equal(manifest.start_url, `${base}/`);
assert.equal(manifest.scope, `${base}/`);
assert.equal(manifest.display, 'standalone');
for (const icon of manifest.icons) {
  assert.ok(icon.src.startsWith(`${base}/`));
  assert.ok(existsSync(join('dist', icon.src.slice(base.length))));
}
for (const route of ['index', 'past', 'attendance']) {
  const html = readFileSync(`dist/${route}.html`, 'utf8');
  assert.match(html, /<html\s+lang="ko"/);
  assert.ok(html.includes(`${base}/manifest.webmanifest`));
  const resources = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
    .map(match => match[1]).filter(url => url.startsWith('/'));
  for (const url of resources) {
    assert.ok(url.startsWith(`${base}/`), `프로젝트 경로 누락: ${url}`);
    assert.ok(existsSync(join('dist', decodeURIComponent(url.slice(base.length).split('?')[0]))), `파일 없음: ${url}`);
  }
  assert.ok(resources.some(url => url.endsWith('.js')), '실행 번들 누락');
}
console.log('웹 배포 검사 통과: 3개 화면·하위 경로·정적 파일·홈 화면 설정');

assert.ok(existsSync('dist/sw.js'), '서비스 워커 누락');
const worker = readFileSync('dist/sw.js', 'utf8');
assert.ok(worker.includes(`${base}/index.html`));
assert.ok(worker.includes(`${base}/past.html`));
assert.ok(worker.includes(`${base}/attendance.html`));
assert.ok(!worker.includes('skipWaiting'), '입력 도중 강제 업데이트 금지');
assert.equal(expo.platforms.join(','), 'web');
assert.equal(expo.extra?.eas, undefined);
console.log('PWA 서비스 워커·웹 전용 설정 검사 통과');
