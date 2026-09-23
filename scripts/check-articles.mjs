#!/usr/bin/env node
// 아티클 원문 문자 게이트 — 외부 의존성 0, Node 표준 모듈만 사용.
//
// velite 스키마가 frontmatter 형식과 h2 순서를 검사한다면, 이 게이트는 "글자"를
// 검사한다. 두 가지를 막는다.
//   1) 사이트 글쓰기 금지 표기: 가운데점(U+00B7), 긴하이픈(U+2014), 교육기관명.
//   2) 허용 문자 밖의 글자: 이모지나 낯선 기호는 서브셋 폰트에 없어 깨지거나 다른
//      글꼴로 튄다. 한글 음절, 출력 가능한 ASCII, 아래 허용 기호만 쓴다.
// 그리고 기사 .mdx에는 실행될 수 있는 MDX(표현식, import/export, 허용 밖 태그)를
// 막는 검사를 하나 더 건다(아래 checkExecutableMdx).
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

// 실행되는 MDX 차단 — 기사 .mdx에만 적용한다(용어 사전은 제외).
// MDXContent는 컴파일된 MDX를 new Function으로 실행하고, 정적 생성 때 서버에서
// 돈다. 그래서 자동 수집으로 바로 게시되는 기사에 MDX 표현식 {...}, import/export
// 줄, 임의 JSX 태그가 섞이면 서버 코드가 실행될 수 있다. frontmatter, 펜스 코드
// 블록(``` 토글), 인라인 백틱 코드 밖에서 아래를 위반으로 본다.
//   - { 또는 }
//   - 앞 공백을 뺀 줄이 "import " 또는 "export "로 시작
//   - < 다음에 글자나 / 가 오는데, 허용 태그(Term, details, summary)가 아닌 것
const ALLOWED_TAGS = new Set(['Term', 'details', 'summary']);

function checkExecutableMdx(file, lines, errors) {
  let inFrontmatter = lines[0]?.trim() === '---';
  let inFence = false;
  lines.forEach((line, i) => {
    if (i === 0 && inFrontmatter) return;
    if (inFrontmatter) {
      if (line.trim() === '---') inFrontmatter = false;
      return;
    }
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    const where = `${file}:${i + 1}`;
    if (/^(import|export)\s/.test(line.trim())) {
      errors.push(`${where}: import/export 줄 금지(MDX에서 코드로 실행된다)`);
    }
    // 인라인 코드(같은 개수의 백틱으로 닫힌 구간)는 글자 그대로 보이므로 뺀다.
    const prose = line.replace(/(`+)[\s\S]*?\1/g, '');
    if (/[{}]/.test(prose)) {
      errors.push(`${where}: 중괄호 { } 금지(MDX 표현식으로 실행된다, 코드면 백틱으로 감싼다)`);
    }
    for (const m of prose.matchAll(/<(\/?)([A-Za-z][A-Za-z0-9.:_-]*)?/g)) {
      const [whole, slash, name] = m;
      if (!slash && !name) continue; // < 다음이 글자나 / 가 아니면 태그가 아니다
      if (name && ALLOWED_TAGS.has(name)) continue;
      errors.push(`${where}: 허용되지 않은 태그 "${whole}"(쓸 수 있는 태그는 Term, details, summary뿐)`);
    }
  });
}

const errors = [];

const targets = scanTerms ? [...files, TERMS_FILE] : files;

for (const file of targets) {
  const isTerms = file === TERMS_FILE;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  if (!isTerms) checkExecutableMdx(file, lines, errors);
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
