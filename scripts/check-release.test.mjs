import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { checkConfig } from './check-release.mjs';
const projectId = '12345678-1234-1234-1234-123456789abc';
const app = { android: { package: 'org.example.bible' }, ios: { bundleIdentifier: 'org.example.bible' }, extra: { eas: { projectId } } };
test('선택한 플랫폼의 배포 설정 누락을 빌드 전에 발견한다', () => {
  checkConfig(app);
  checkConfig({ ...app, ios: {} }, 'android');
  checkConfig({ ...app, android: {} }, 'ios');
  for (const invalid of [{}, { ...app, android: {} }, { ...app, ios: {} }, { ...app, extra: {} }]) assert.throws(() => checkConfig(invalid));
  assert.throws(() => checkConfig(app, 'unknown'));
});
test('콘텐츠 URL 없이 배포 설정을 검사하고 dotenv 로딩을 비활성화한다', () => {
  checkConfig(app);
  const config = JSON.parse(readFileSync(new URL('../eas.json', import.meta.url), 'utf8'));
  assert.equal(config.build.release.env.EXPO_NO_DOTENV, '1');
  const workflow = readFileSync(new URL('../.github/workflows/build.yml', import.meta.url), 'utf8');
  assert.ok(!workflow.includes('--content-url'));
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

test('CI 인증 토큰이 없으면 안내하고 중단하며 토큰 값을 출력하지 않는다', () => {
  const workflow = readFileSync(new URL('../.github/workflows/build.yml', import.meta.url), 'utf8');
  const guard = workflow.split('      - name: Check Expo token\n')[1].split('      - uses:')[0];
  const script = guard.split('        run: |\n')[1];
  for (const token of ['', 'test-token-not-a-real-credential']) {
    const result = spawnSync('sh', ['-c', script], { env: { EXPO_TOKEN: token }, encoding: 'utf8' });
    assert.equal(result.status, token ? 0 : 1);
    if (token) assert.equal(result.stdout + result.stderr, '');
    else assert.match(result.stdout, /EXPO_TOKEN is missing/);
  }
  const build = workflow.split('      - name: Build signed install files on EAS\n')[1].split('      - name:')[0];
  assert.ok(build.includes('EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}'));
});
