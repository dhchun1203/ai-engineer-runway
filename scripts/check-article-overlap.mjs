#!/usr/bin/env node
// 아티클 원문 겹침 검사 — 외부 의존성 0, Node 표준 모듈만 사용.
//
// 한국어 원문 기사를 우리 말로 요약하면 같은 사실을 같은 언어로 쓰다 보니 문장이
// 원문에 수렴하기 쉽다(어미만 "~했습니다"에서 "~했어요"로 바뀐 근접 복제). 사람
// 눈으로는 놓치기 쉬워서, 글과 원문이 글자 그대로 길게 겹치는 구간을 기계로 찾는다.
//
// 방법: 두 텍스트에서 한글 음절만 남기고(띄어쓰기, 문장부호, 영문, 숫자 제거) 연속
// MIN음절 이상 똑같은 구간을 찾는다. 영문과 숫자를 빼는 이유는 모델 이름, 점수, 날짜
// 같은 고유명사와 사실은 원래 원문과 같아야 해서다. 띄어쓰기와 문장부호를 지우므로 "띄어쓰기만
// 바꾼" 문장도 잡힌다. 어미만 바꾼 문장은 어미 앞의 긴 구간이 겹쳐서 잡힌다.
//
// 글에서 검사하지 않는 부분: frontmatter 중 originalTitle, source, author, url,
// related(원문 제목과 출처는 원래 같아야 한다), 백틱 코드, 따옴표 안 직접 인용
// (기사당 한 문장 이하로 허용된 인용), <Term id> 태그 자체.
//
// 기준 10음절(2026-10-05 맞춤): 8음절이면 "데이터와 프롬프트" 같은 흔한 말까지 걸리고,
// 10음절부터는 실제로 옮긴 구절만 남았다. 어미만 바꾼 근접 복제는 20음절 넘게 겹친다.
//
// 사용: node scripts/check-article-overlap.mjs <글.mdx> <원문.txt|원문.html> [--min 10]
//   원문은 본문을 텍스트로 저장한 파일이거나, 받은 HTML 파일 그대로.
//   겹침이 없으면 0, 있으면 1로 끝난다. 2는 사용법 오류.

import fs from 'node:fs';

const args = process.argv.slice(2);
const minIdx = args.indexOf('--min');
const MIN = minIdx >= 0 ? Number(args[minIdx + 1]) : 10;
const files = args.filter((a, i) => a !== '--min' && (minIdx < 0 || i !== minIdx + 1));

if (files.length !== 2 || !Number.isInteger(MIN) || MIN < 6) {
  console.error('사용: node scripts/check-article-overlap.mjs <글.mdx> <원문.txt 또는 원문.html> [--min 10]');
  process.exit(2);
}

const [articlePath, originalPath] = files;
const rawArticle = fs.readFileSync(articlePath, 'utf8');
let rawOriginal = fs.readFileSync(originalPath, 'utf8');
// 원문을 HTML 그대로 받아 넣어도 된다(curl -sL URL -o orig.html). 스크립트, 스타일과
// 태그를 지운다. 머리글이나 메뉴 같은 사이트 공통 글이 섞여도 겹침이 늘 뿐 판정에는
// 문제가 없다(그 글은 우리 기사에 나오지 않는다).
if (/\.html?$/i.test(originalPath)) {
  rawOriginal = rawOriginal
    .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

/** 줄바꿈은 남기고 나머지 글자를 공백으로 — 지워도 줄 번호가 그대로 맞는다. */
const blank = (str) => str.replace(/[^\n]/g, ' ');

/** 글에서 검사 대상이 아닌 부분을 공백으로 지운다. */
function stripArticle(text) {
  let s = text.replace(/\r\n/g, '\n');
  // frontmatter: 원문과 같아야 하는 줄과 사이트 내부 링크 묶음은 뺀다.
  s = s.replace(/^---\n[\s\S]*?\n---\n/, (fm) => {
    let inRelated = false;
    return fm
      .split('\n')
      .map((line) => {
        if (/^related:/.test(line)) inRelated = true;
        else if (/^\S/.test(line)) inRelated = false;
        const skip =
          inRelated ||
          /^(originalTitle|source|author|url|publishedAt|addedAt|origin|slug|tags):/.test(line);
        return skip ? blank(line) : line;
      })
      .join('\n');
  });
  s = s.replace(/`[^`]*`/g, blank); // 코드
  s = s.replace(/“[^”]*”/g, blank); // 직접 인용(허용된 한 문장)
  s = s.replace(/<\/?(Term|details|summary)[^>]*>/g, blank); // 태그 자체(안쪽 글은 남긴다)
  return s;
}

/** 한글 음절만 남긴 문자열과, 각 글자가 원래 텍스트의 어디였는지. */
function normalize(text) {
  const chars = [];
  const pos = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/[가-힣]/.test(ch)) {
      chars.push(ch);
      pos.push(i);
    }
  }
  return { norm: chars.join(''), pos };
}

const article = stripArticle(rawArticle);
const a = normalize(article);
const o = normalize(rawOriginal);

if (o.norm.length < MIN * 10) {
  console.error(`원문 텍스트가 너무 짧습니다(한글 ${o.norm.length}음절). 본문 전체를 저장했는지 확인하세요.`);
  process.exit(2);
}

// 원문의 MIN음절 조각을 전부 모아 두고, 글을 한 칸씩 밀며 같은 조각이 있는지 본다.
const grams = new Set();
for (let i = 0; i + MIN <= o.norm.length; i++) grams.add(o.norm.slice(i, i + MIN));

const spans = [];
let i = 0;
while (i + MIN <= a.norm.length) {
  if (!grams.has(a.norm.slice(i, i + MIN))) {
    i++;
    continue;
  }
  // 겹침이 시작됐다. 겹치는 동안 끝을 늘린다.
  let end = i + MIN;
  while (end < a.norm.length && grams.has(a.norm.slice(end - MIN + 1, end + 1))) end++;
  spans.push([i, end]);
  i = end;
}

const real = spans;

if (real.length === 0) {
  console.log(`check-article-overlap: 원문과 ${MIN}음절 이상 겹치는 구간 없음`);
  process.exit(0);
}

console.log(`check-article-overlap: 원문과 ${MIN}음절 이상 겹치는 구간 ${real.length}곳 (한글만 비교)`);
for (const [s, e] of real) {
  const from = a.pos[s];
  const to = a.pos[e - 1] + 1;
  const line = article.slice(0, from).split('\n').length;
  const excerpt = article.slice(from, to).replace(/\s+/g, ' ');
  console.log(`  - 글 ${line}행 근처 (${e - s}음절): ${excerpt}`);
}
console.log('이 구간들은 원문 문장을 거의 그대로 옮긴 것입니다. 메모로 돌아가 우리 말로 새로 쓰세요.');
process.exit(1);
