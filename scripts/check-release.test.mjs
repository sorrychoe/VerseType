import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { checkConfig, checkContentUrl } from './check-release.mjs';
const projectId = '12345678-1234-1234-1234-123456789abc';
const app = { android: { package: 'org.example.bible' }, ios: { bundleIdentifier: 'org.example.bible' }, extra: { eas: { projectId } } };
test('선택한 플랫폼의 배포 설정 누락을 빌드 전에 발견한다', () => {
  checkConfig(app);
  checkConfig({ ...app, ios: {} }, 'android');
  checkConfig({ ...app, android: {} }, 'ios');
  for (const invalid of [{}, { ...app, android: {} }, { ...app, ios: {} }, { ...app, extra: {} }]) assert.throws(() => checkConfig(invalid));
  assert.throws(() => checkConfig(app, 'unknown'));
});
test('배포 앱에 포함할 공개 HTTPS URL을 검증한다', () => {
  checkContentUrl('https://example.org/verses.json');
  for (const url of [undefined, '', 'http://example.org', 'https://user:password@example.org']) assert.throws(() => checkContentUrl(url));
});
test('GitHub 배포는 설치 가능한 APK와 실제 기기 IPA만 생성한다', () => {
  const config = JSON.parse(readFileSync(new URL('../eas.json', import.meta.url), 'utf8'));
  assert.equal(config.submit, undefined);
  assert.equal(config.build.release.distribution, 'internal');
  assert.equal(config.build.release.android.buildType, 'apk');
  assert.equal(config.build.release.ios.simulator, false);
  assert.equal(config.build.release.developmentClient, undefined);
});

test('로컬 빌드 명령은 release 프로필로 APK·IPA를 로컬에 생성한다', () => {
  const { scripts } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  for (const [platform, extension] of [['android', 'apk'], ['ios', 'ipa']]) {
    const command = scripts[`build:${platform}:local`];
    assert.ok(command.startsWith('npm run check && '));
    assert.ok(command.includes(`PLATFORM=${platform} node scripts/check-release.mjs`));
    assert.ok(command.includes(`--platform ${platform} --profile release --local --output artifacts/bible-memorize.${extension}`));
  }
});
