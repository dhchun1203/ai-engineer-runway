#!/usr/bin/env node
// 아티클 원문 문자 게이트 — 외부 의존성 0, Node 표준 모듈만 사용.
//
// velite 스키마가 frontmatter 형식과 h2 순서를 검사한다면, 이 게이트는 "글자"를
// 검사한다. 두 가지를 막는다.
//   1) 사이트 글쓰기 금지 표기: 가운데점(U+00B7), 긴하이픈(U+2014), 교육기관명.
//   2) 허용 문자 밖의 글자: 이모지나 낯선 기호는 서브셋 폰트에 없어 깨지거나 다른
//      글꼴로 튄다. 한글 음절, 출력 가능한 ASCII, 아래 허용 기호만 쓴다.
//
// 사용: node scripts/check-articles.mjs [dir]   (기본: src/content/articles)

import fs from 'node:fs';
import path from 'node:path';

const customDir = process.argv[2];
const dir = path.resolve(customDir ?? path.join('src', 'content', 'articles'));

const files = fs.existsSync(dir)
  ? fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.mdx'))
      .map((e) => path.join(dir, e.name))
  : [];

// 기본 실행이면 공용 용어 사전(src/content/terms.ts)도 같은 규칙으로 본다. 설명
// 문구가 패널과 용어 카드로 그대로 공개되기 때문이다. 주석 줄(//)은 건너뛴다.
const TERMS_FILE = path.resolve('src', 'content', 'terms.ts');
const scanTerms = customDir === undefined && fs.existsSync(TERMS_FILE);

if (files.length === 0 && !scanTerms) {
  console.log(`check-articles: ${dir}에 검사할 기사 없음 — 건너뜀`);
  process.exit(0);
}

const FORBIDDEN = [
  { re: /·/, why: '가운데점(·) 금지' },
  { re: /—/, why: '긴하이픈(—) 금지' },
  { re: /kant/i, why: '교육기관명 금지' },
];

// 한글 음절, 출력 가능한 ASCII, 공백류, 그리고 이 기호들만 허용한다.
const EXTRA_ALLOWED = new Set(['\u201C', '\u201D', '\u2018', '\u2019', '\u2026', '\u2192', '\u00D7', '\u2248']);

function isAllowed(ch) {
  const cp = ch.codePointAt(0);
  if (cp === 0x09 || cp === 0x0a || cp === 0x0d) return true;
  if (cp >= 0x20 && cp <= 0x7e) return true;
  if (cp >= 0xac00 && cp <= 0xd7a3) return true;
  return EXTRA_ALLOWED.has(ch);
}

const errors = [];

const targets = scanTerms ? [...files, TERMS_FILE] : files;

for (const file of targets) {
  const isTerms = file === TERMS_FILE;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (isTerms && line.trim().startsWith('//')) return;
    for (const { re, why } of FORBIDDEN) {
      if (re.test(line)) errors.push(`${file}:${i + 1}: ${why}`);
    }
    for (const ch of line) {
      if (!isAllowed(ch)) {
        const cp = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
        errors.push(`${file}:${i + 1}: 허용되지 않은 문자 U+${cp} "${ch}"`);
      }
    }
  });
}

if (errors.length > 0) {
  console.error(`check-articles: ${errors.length}건 위반`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`check-articles: 기사 ${files.length}편${scanTerms ? ' + 용어 사전' : ''} 통과`);
