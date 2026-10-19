import assert from 'node:assert/strict';
import test from 'node:test';
import { bundledContent, completeVerse, currentVerse, monthKey, monthButtons, pastVerses, readProgress, validateContent, type Content, type Storage } from './verses';

function memory(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return { async getItem(key) { return data.get(key) ?? null; }, async setItem(key, value) { data.set(key, value); } };
}
const content: Content = { version: 2, verses: [
  { month: '2025-12', reference: '구절1', text: '말씀1' },
  { month: '2026-01', reference: '구절2', text: '말씀2' },
  { month: '2026-03', reference: '구절3', text: '말씀3' },
] };

test('연말 → 새해: 로컬 연월로 이달과 지난달 판정', () => {
  const date = new Date(2026, 0, 1, 0, 0);
  assert.equal(monthKey(date), '2026-01');
  assert.equal(currentVerse(content, date).verse?.month, '2026-01');
  assert.equal(currentVerse(content, date).fallback, false);
  assert.equal(pastVerses(content, date).at(-1)?.month, '2025-12');
});
test('월 경계 전후와 누락된 지난달', () => {
  assert.equal(currentVerse(content, new Date(2026, 1, 28, 23, 59)).verse?.month, '2026-01');
  assert.equal(currentVerse(content, new Date(2026, 2, 1)).verse?.month, '2026-03');
  assert.equal(pastVerses(content, new Date(2026, 2, 1)).at(-1)?.month, '2026-01');
});
test('이달 누락 시 미래 말씀을 건너뛰고 최근 과거를 표시한다', () => {
  const result = currentVerse(content, new Date(2026, 1, 1));
  assert.equal(result.fallback, true);
  assert.equal(result.verse?.month, '2026-01');
  assert.equal(pastVerses(content, new Date(2025, 0, 1)).length, 0);
  assert.equal(currentVerse(content, new Date(2025, 0, 1)).verse, undefined);
});
test('콘텐츠의 월, 중복, 빈 본문, 주소, 버전을 검증한다', () => {
  validateContent(content);
  for (const invalid of [null, {}, { ...content, version: 0 }, { ...content, verses: [] },
    { ...content, verses: [content.verses[0], content.verses[0]] },
    ...['2026-1', '2026-13', '2026-00'].map(month => ({ ...content, verses: [{ ...content.verses[0], month }] })),
    ...['', '   ', '...'].map(text => ({ ...content, verses: [{ ...content.verses[0], text }] })),
    { ...content, verses: [{ ...content.verses[0], reference: '' }] },
  ]) assert.throws(() => validateContent(invalid));
});
test('번들에는 연도별 12개월이 있고 새해 데이터 미설치 시 최근 말씀을 표시한다', () => {
  validateContent(bundledContent);
  const years = [...new Set(bundledContent.verses.map(v => v.month.slice(0, 4)))];
  for (const year of years) {
    assert.deepEqual(bundledContent.verses.filter(v => v.month.startsWith(year + '-')).map(v => v.month).sort(),
      Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`));
  }
  const lastYear = Math.max(...years.map(Number));
  const result = currentVerse(bundledContent, new Date(lastYear + 1, 0, 1));
  assert.equal(result.fallback, true);
  assert.equal(result.verse?.month, `${lastYear}-12`);
});
test('완료 횟수와 시각을 저장하고 연속 완료를 잃지 않는다', async () => {
  const storage = memory();
  const now = new Date('2026-10-18T00:00:00Z');
  assert.equal((await readProgress(storage, '2026-10')).count, 0);
  await Promise.all([completeVerse(storage, '2026-10', now), completeVerse(storage, '2026-10', now)]);
  assert.deepEqual(await readProgress(storage, '2026-10'), { count: 2, lastCompletedAt: now.toISOString() });
  assert.equal((await readProgress(storage, '2026-09')).count, 0);
});
test('손상된 완료 기록을 덮어쓰지 않는다', async () => {
  const storage = memory({ 'progress:2026-10': 'broken' });
  await assert.rejects(completeVerse(storage, '2026-10'));
  assert.equal(await storage.getItem('progress:2026-10'), 'broken');
  assert.equal((await completeVerse(memory(), '2026-10')).count, 1);
});
test('저장 실패는 성공으로 보고하지 않고 재시도할 수 있다', async () => {
  const storage = memory();
  await assert.rejects(completeVerse({ ...storage, async setItem() { throw new Error('full'); } }, '2026-10'));
  assert.equal((await readProgress(storage, '2026-10')).count, 0);
  assert.equal((await completeVerse(storage, '2026-10')).count, 1);
});

test('10월 31일 → 11월 1일 이달과 지난달이 자동으로 바뀐다', () => {
  const october = new Date(2026, 9, 31, 23, 59);
  const november = new Date(2026, 10, 1, 0, 0);
  assert.equal(currentVerse(bundledContent, october).verse?.month, '2026-10');
  assert.equal(pastVerses(bundledContent, october).at(-1)?.month, '2026-09');
  assert.equal(currentVerse(bundledContent, november).verse?.month, '2026-11');
  assert.equal(pastVerses(bundledContent, november).at(-1)?.month, '2026-10');
});
test('월 버튼은 올해 1월~이달, 없는 월은 비활성, 미래 월은 비노출', () => {
  assert.deepEqual(monthButtons(content, new Date(2026, 2, 1)), [
    { month: '2026-01', available: true }, { month: '2026-02', available: false }, { month: '2026-03', available: true },
  ]);
  const buttons = monthButtons(bundledContent, new Date(2026, 9, 31));
  assert.equal(buttons.length, 10);
  assert.equal(buttons.at(-1)?.month, '2026-10');
});
test('1월에는 전년도 12개월 버튼을 앞에 표시한다', () => {
  const buttons = monthButtons(content, new Date(2026, 0, 1));
  assert.equal(buttons.length, 13);
  assert.deepEqual(buttons[0], { month: '2025-01', available: false });
  assert.deepEqual(buttons[11], { month: '2025-12', available: true });
  assert.equal(buttons[12].month, '2026-01');
});
