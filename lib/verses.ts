import { createContext, useContext } from 'react';
import bundled from '../content/verses.json';

export type Verse = { month: string; reference: string; text: string };
export type Content = { version: number; verses: Verse[] };
export type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> };

export function validateContent(value: unknown): asserts value is Content {
  if (!value || typeof value !== 'object') throw new Error('콘텐츠는 객체여야 합니다.');
  const data = value as Partial<Content>;
  if (!Number.isSafeInteger(data.version) || data.version! < 1 || !Array.isArray(data.verses) || !data.verses.length) {
    throw new Error('version은 양의 정수, verses는 비어 있지 않은 배열이어야 합니다.');
  }
  const months = new Set<string>();
  for (const verse of data.verses) {
    if (!verse || typeof verse.month !== 'string' || !/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(verse.month) || months.has(verse.month)) {
      throw new Error('month 형식이 잘못되었거나 중복되었습니다.');
    }
    if (typeof verse.reference !== 'string' || !verse.reference.trim() || typeof verse.text !== 'string' || !verse.text.replace(/[\p{P}\s]/gu, '')) {
      throw new Error(`${verse.month}: 구절 주소와 본문이 필요합니다.`);
    }
    months.add(verse.month);
  }
}
validateContent(bundled);
export const bundledContent: Content = bundled;
export const VersesContext = createContext({ content: bundledContent, today: new Date() });
export const useVerses = () => useContext(VersesContext);

export function monthKey(today: Date): string {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}
export function currentVerse(content: Content, today: Date) {
  const month = monthKey(today);
  const sorted = [...content.verses].sort((a, b) => a.month.localeCompare(b.month));
  const exact = sorted.find(v => v.month === month);
  const verse = exact ?? sorted.filter(v => v.month < month).at(-1);
  return { verse, fallback: !exact };
}
export function pastVerses(content: Content, today: Date): Verse[] {
  return content.verses.filter(v => v.month < monthKey(today)).sort((a, b) => a.month.localeCompare(b.month));
}
export function monthButtons(content: Content, today: Date) {
  const year = today.getFullYear();
  const first = today.getMonth() === 0 ? new Date(year - 1, 0, 1) : new Date(year, 0, 1);
  const months = [];
  for (let date = first; monthKey(date) <= monthKey(today); date = new Date(date.getFullYear(), date.getMonth() + 1, 1)) {
    const month = monthKey(date);
    months.push({ month, available: content.verses.some(v => v.month === month) });
  }
  return months;
}
export function monthLabel(month: string) {
  const [year, number] = month.split('-');
  return `${year}년 ${Number(number)}월 암송 말씀`;
}

export type Progress = { count: number; lastCompletedAt: string | null };
export async function readProgress(storage: Storage, month: string): Promise<Progress> {
  const raw = await storage.getItem(`progress:${month}`);
  if (!raw) return { count: 0, lastCompletedAt: null };
  const value = JSON.parse(raw) as Progress;
  if (!value || !Number.isSafeInteger(value.count) || value.count < 0 || (value.lastCompletedAt !== null && (typeof value.lastCompletedAt !== 'string' || !Number.isFinite(Date.parse(value.lastCompletedAt))))) {
    throw new Error('저장된 완료 기록을 읽을 수 없습니다.');
  }
  return value;
}
// 화면 전환 중에도 동시에 완료된 기록이 서로 덮어쓰지 않도록 저장을 직렬화한다.
let pendingSave: Promise<unknown> = Promise.resolve();
export function completeVerse(storage: Storage, month: string, now = new Date()): Promise<Progress> {
  const save = pendingSave.catch(() => {}).then(async () => {
    const previous = await readProgress(storage, month);
    const next = { count: previous.count + 1, lastCompletedAt: now.toISOString() };
    await storage.setItem(`progress:${month}`, JSON.stringify(next));
    return next;
  });
  pendingSave = save;
  return save;
}
