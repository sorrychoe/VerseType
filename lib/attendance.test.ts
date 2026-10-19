import assert from 'node:assert/strict';
import test from 'node:test';
import { attendanceStats, calendarDays, dateKey, readAttendance, recordAttendance, saveAttendance } from './attendance';
import type { Storage } from './verses';
function memory(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return { async getItem(key) { return data.get(key) ?? null; }, async setItem(key, value) { data.set(key, value); } };
}
test('출석 읽기만으로는 기록하지 않는다', async () => {
  const storage = memory();
  assert.deepEqual(await readAttendance(storage), []);
  assert.equal(await storage.getItem('attendance'), null);
});
test('기기 로컬 날짜로 기록하고 동일 날짜는 중복되지 않는다', () => {
  const today = new Date(2026, 9, 19, 0, 1);
  assert.equal(dateKey(today), '2026-10-19');
  const result = recordAttendance([], today);
  assert.deepEqual(result, { dates: ['2026-10-19'], newlyRecorded: true });
  assert.deepEqual(recordAttendance(result.dates, today), { dates: ['2026-10-19'], newlyRecorded: false });
  assert.deepEqual(result.dates, ['2026-10-19']);
});
test('자정과 연도 경계의 완료 날짜를 각각 기록한다', () => {
  const before = recordAttendance([], new Date(2026, 11, 31, 23, 59, 59));
  const after = recordAttendance(before.dates, new Date(2027, 0, 1));
  assert.deepEqual(after.dates, ['2026-12-31', '2027-01-01']);
  assert.deepEqual(attendanceStats(after.dates, new Date(2027, 0, 1)), { streak: 2, monthCount: 1 });
});
test('오늘 미완료여도 어제까지 이어진 연속 출석은 유지한다', () => {
  const dates = ['2026-09-30', '2026-10-01', '2026-10-02'];
  assert.deepEqual(attendanceStats(dates, new Date(2026, 9, 3)), { streak: 3, monthCount: 2 });
  assert.equal(attendanceStats(dates, new Date(2026, 9, 4)).streak, 0);
});
test('중간 결석과 중복·미래 기록을 계산에서 처리한다', () => {
  const dates = ['2026-10-01', '2026-10-03', '2026-10-03', '2026-10-04', '2026-11-01'];
  assert.deepEqual(attendanceStats(dates, new Date(2026, 9, 3)), { streak: 1, monthCount: 2 });
  assert.deepEqual(attendanceStats([], new Date(2026, 9, 3)), { streak: 0, monthCount: 0 });
});
test('윤년 2월 달력과 월 경계', () => {
  assert.equal(calendarDays('2024-02').length, 29);
  assert.equal(calendarDays('2026-02').length, 28);
  assert.equal(dateKey(calendarDays('2026-12').at(-1)!), '2026-12-31');
  assert.equal(calendarDays('2026-10')[0].getDay(), 4);
});
test('서로 다른 월 말씀을 같은 날 완료해도 출석 저장은 한 번이다', async () => {
  const storage = memory();
  const now = new Date(2026, 9, 19);
  const results = await Promise.all([saveAttendance(storage, now), saveAttendance(storage, now)]);
  assert.deepEqual(results.map(result => result.newlyRecorded), [true, false]);
  assert.deepEqual(await readAttendance(storage), ['2026-10-19']);
});
test('저장 시각이 아니라 전달한 완료 순간으로 출석한다', async () => {
  const storage = memory();
  await saveAttendance(storage, new Date(2026, 9, 31, 23, 59, 59));
  assert.deepEqual(await readAttendance(storage), ['2026-10-31']);
});
test('손상된 출석 데이터는 덮어쓰지 않는다', async () => {
  for (const value of ['broken', '{}', '["2026-02-30"]', '["2026-13-01"]', '[null]']) {
    const storage = memory({ attendance: value });
    await assert.rejects(saveAttendance(storage, new Date(2026, 9, 19)));
    assert.equal(await storage.getItem('attendance'), value);
  }
});
test('저장 실패 후 재시도해도 출석은 하루 한 번이다', async () => {
  const storage = memory();
  const now = new Date(2026, 9, 19);
  await assert.rejects(saveAttendance({ ...storage, async setItem() { throw new Error('full'); } }, now));
  await saveAttendance(storage, now);
  await saveAttendance(storage, now);
  assert.deepEqual(await readAttendance(storage), ['2026-10-19']);
});
