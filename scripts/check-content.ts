import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { validateContent } from '../lib/verses';
const content: unknown = JSON.parse(readFileSync(new URL('../content/verses.json', import.meta.url), 'utf8'));
validateContent(content);
console.log(`콘텐츠 검증 완료: version ${content.version}, ${content.verses.length}개월`);
