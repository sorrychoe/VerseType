import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function checkConfig(app, platform = 'all') {
  assert.ok(['android', 'ios', 'all'].includes(platform), '지원하지 않는 플랫폼');
  if (platform !== 'ios') assert.match(app.android?.package ?? '', /^[a-zA-Z]\w*(\.[a-zA-Z]\w*)+$/, 'app.json: android.package 설정 필요');
  if (platform !== 'android') assert.match(app.ios?.bundleIdentifier ?? '', /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/, 'app.json: ios.bundleIdentifier 설정 필요');
  assert.match(app.extra?.eas?.projectId ?? '', /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i, 'eas init으로 프로젝트 연결 필요');
}
export function checkContentUrl(value) {
  const url = new URL(value);
  assert.equal(url.protocol, 'https:', 'HTTPS 콘텐츠 URL 필요');
  assert.ok(!url.username && !url.password, '콘텐츠 URL에 자격 증명을 넣지 마세요');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--content-url') checkContentUrl(process.env.EXPO_PUBLIC_VERSES_URL);
  else checkConfig(JSON.parse(readFileSync('app.json', 'utf8')).expo, process.env.PLATFORM ?? 'all');
  console.log('배포 설정 검증 통과');
}
