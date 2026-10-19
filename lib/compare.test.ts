import assert from 'node:assert/strict';
import test from 'node:test';
import { compare } from './compare';

test('공백, NFC, 문장부호를 정규화한다', () => {
  assert.equal(compare('“하나님”, 사랑! 은혜: 기쁨.', "  하나님   사랑\n은혜 기쁨  ").complete, true);
  assert.equal(compare('하나님', '하나님'.normalize('NFD')).complete, true);
  assert.equal(compare('빛이라/ 이같이', '빛이라 이같이').complete, true);
});
test('가이드는 미입력 글자이며 완성 전 완료되지 않는다', () => {
  assert.deepEqual(compare('말씀', '').characters.map(c => c.status), ['guide', 'guide']);
  assert.equal(compare('', '').complete, false);
  assert.equal(compare('말씀', '말').complete, false);
});
test('한글 IME 조합 중 마지막 글자에 오답 표시를 하지 않는다', () => {
  for (const input of ['ㅎ', '하', '한', '하나ㄴ', '하나니']) {
    const result = compare('하나님', input);
    assert.notEqual(result.characters.at(-1)?.status, 'wrong');
    assert.equal(result.complete, false);
  }
  assert.equal(compare('하나님', '하나님').complete, true);
});
test('이어서 입력하거나 공백으로 확정하면 오답을 표시한다', () => {
  assert.equal(compare('하나님', '허나').characters[0].status, 'wrong');
  assert.equal(compare('하나님', '하나니 ').characters.at(-1)?.status, 'wrong');
  assert.equal(compare('하나님', '하나니.').characters.at(-1)?.status, 'wrong');
});
test('추가 글자, 영어 오타, 삭제와 재입력을 비교한다', () => {
  assert.equal(compare('말씀', '말씀x').errors, 1);
  assert.equal(compare('말씀', '말씀x').complete, false);
  assert.equal(compare('abc', 'abx').errors, 1);
  assert.equal(compare('말씀', '말쓰').complete, false);
  assert.equal(compare('말씀', '말씀').complete, true);
});
