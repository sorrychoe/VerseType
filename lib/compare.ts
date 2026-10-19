export type Character = {
  text: string;
  status: 'correct' | 'wrong' | 'pending' | 'guide';
};

export function compare(target: string, input: string) {
  const normalize = (text: string) => text.normalize('NFC').replace(/\p{P}/gu, '').replace(/\s+/gu, ' ').trim();
  const expected = Array.from(normalize(target));
  const actual = Array.from(normalize(input));
  const characters: Character[] = Array.from({ length: Math.max(expected.length, actual.length) }, (_, i) => {
    if (i >= actual.length) return { text: expected[i], status: 'guide' };
    if (actual[i] === expected[i]) return { text: actual[i], status: 'correct' };
    // shortcut: native IME 조합 상태를 공통 API로 알 수 없어 마지막 한글은 다음 입력까지 판정을 유예한다. 네이티브 조합 이벤트 지원 시 교체한다.
    const composing = i === actual.length - 1 && /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]$/u.test(input.normalize('NFC'));
    return { text: actual[i], status: composing ? 'pending' : 'wrong' };
  });
  return {
    characters,
    complete: expected.length > 0 && expected.join('') === actual.join(''),
    errors: characters.filter(c => c.status === 'wrong').length,
  };
}
