import { createContext, useContext } from 'react';
import type { Storage } from './verses';

export function dateKey(today: Date): string {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}
export function recordAttendance(dates: string[], today: Date) {
  const day = dateKey(today);
  return { dates: [...new Set([...dates, day])].sort(), newlyRecorded: !dates.includes(day) };
}
export function attendanceStats(dates: string[], today: Date) {
  const days = new Set(dates);
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dateKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  const current = dateKey(today);
  const monthCount = [...days].filter(day => day.startsWith(current.slice(0, 7)) && day <= current).length;
  return { streak, monthCount };
}
export function calendarDays(month: string) {
  const [year, number] = month.split('-').map(Number);
  return Array.from({ length: new Date(year, number, 0).getDate() }, (_, i) => new Date(year, number - 1, i + 1, 12));
}
export async function readAttendance(storage: Storage): Promise<string[]> {
  const raw = await storage.getItem('attendance');
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || value.some(day => {
    if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return true;
    const [year, month, date] = day.split('-').map(Number);
    return dateKey(new Date(year, month - 1, date, 12)) !== day;
  })) throw new Error('출석 기록을 읽을 수 없습니다.');
  return [...new Set(value)].sort();
}
let pending: Promise<unknown> = Promise.resolve();
export function saveAttendance(storage: Storage, completedAt: Date) {
  const save = pending.catch(() => {}).then(async () => {
    const result = recordAttendance(await readAttendance(storage), completedAt);
    if (result.newlyRecorded) await storage.setItem('attendance', JSON.stringify(result.dates));
    return result;
  });
  pending = save;
  return save;
}
export const AttendanceContext = createContext<{ dates: string[] | null; error: boolean; refresh: () => void }>({ dates: null, error: false, refresh: () => {} });
export const useAttendance = () => useContext(AttendanceContext);
