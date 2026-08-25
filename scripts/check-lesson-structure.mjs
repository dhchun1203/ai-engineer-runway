#!/usr/bin/env node
// 레슨 구조 자동 게이트 — D-59가 사람 검토를 없앤 대가로 필요해진 유일한 자동
// 안전망(RESEARCH.md, 04-VALIDATION.md §Wave 0). 외부 의존성 0, Node 표준 모듈만
// 사용, `.velite/` 빌드 산출물이 아니라 원본 `.mdx` 파일을 직접 읽는다 —
// `<details>` 마크업과 빈 줄 규칙은 컴파일 후 HTML에서는 확인할 수 없다.
//
// 검사 대상: src/content/lessons/step-1/2/3 세 디렉터리 전체(순회 순서: step-1 →
// step-2 → step-3, 각 디렉터리 안에서는 파일명 정렬) 중 프론트매터
// hasContent: true인 파일만. false인 스텁은 건너뛴다(아직 본문이 없으므로 구조를
// 검사할 대상이 아니다). Phase 5(D-71)가 Step 1 전용 스코프를 세 디렉터리
// 전체로 확대했다 — 심화(Step 1·2)·개요(Step 3)·프로젝트 준비 가이드 세 형식
// 모두에 예외 없이 같은 6개 검사(L1~L6)를 적용한다(D-69, 형식 예외 없음).
// 허용 코드펜스 언어는 D-72로 13개(python/sql/bash/powershell/text +
// typescript/tsx/javascript/jsx/json/html/css/yaml)로 확장됐다.

const EXPECTED_HEADINGS = [
  '## 1. 학습 목표',
  '## 2. 왜 배우나',
  '## 3. 개념 설명',
  '## 4. 실무 예제',
  '## 5. 실무 팁',
  '## 6. 핵심 정리 및 스스로 점검',
];
const TASK_COUNT_MIN = 2;
const TASK_COUNT_MAX = 3;
const TASK_HEADING = '### 해보기';
const ANSWER_SUMMARY_LINE = '<summary>정답 보기</summary>';
const DETAILS_OPEN_LINE = '<details>';
const DETAILS_CLOSE_LINE = '</details>';
const TERM_TABLE_LABEL = '**이 레슨의 단어**';
const TERM_TABLE_HEADER = '| 단어 | 뜻 |';
const TERM_ROWS_MIN = 5;
const TERM_ROWS_MAX = 8;
const ALLOWED_FENCE_LANG_PREFIXES = [
  'python', 'sql', 'bash', 'powershell', 'text',
  'typescript', 'tsx', 'javascript', 'jsx', 'json', 'html', 'css', 'yaml',
];

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LESSON_DIRS = ['step-1', 'step-2', 'step-3'].map((d) =>
  path.join(ROOT, 'src', 'content', 'lessons', d),
);

const errors = [];
function fail(message) {
  errors.push(message);
}

for (const dir of LESSON_DIRS) {
  if (!fs.existsSync(dir)) {
    console.error(`check-lesson-structure: ${dir} not found`);
    process.exit(1);
  }
}

// 디렉터리 순(step-1 → step-2 → step-3), 각 디렉터리 안에서는 파일명 정렬.
const allFiles = LESSON_DIRS.flatMap((dir) =>
  fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .sort()
    .map((f) => path.join(dir, f)),
);

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  return match ? match[1] : '';
}

function hasContentTrue(frontmatter) {
  const match = frontmatter.match(/hasContent:\s*(true|false)/);
  return match ? match[1] === 'true' : false;
}

function extractSlug(frontmatter) {
  const match = frontmatter.match(/slug:\s*"([^"]+)"/);
  return match ? match[1] : null;
}

// --- L1: 6개 헤딩이 각각 정확히 1회, 순서대로 등장하고 총 `## ` 헤딩 수가 6 ---
function checkHeadings(slug, lines) {
  const h2Lines = lines.filter((l) => l.startsWith('## '));
  if (h2Lines.length !== 6) {
    fail(`L1 (${slug}): expected exactly 6 '## ' headings, got ${h2Lines.length}`);
  }
  let lastIndex = -1;
  for (const heading of EXPECTED_HEADINGS) {
    const occurrences = lines.filter((l) => l === heading).length;
    if (occurrences !== 1) {
      fail(`L1 (${slug}): heading "${heading}" appears ${occurrences} time(s), expected exactly 1`);
      continue;
    }
    const idx = lines.indexOf(heading);
    if (idx <= lastIndex) {
      fail(`L1 (${slug}): heading "${heading}" is out of order (index ${idx}, previous ${lastIndex})`);
    }
    lastIndex = idx;
  }
}

// --- L2: `### 해보기` 줄 개수가 2~3 ---
function checkTaskCount(slug, lines) {
  const count = lines.filter((l) => l === TASK_HEADING).length;
  if (count < TASK_COUNT_MIN || count > TASK_COUNT_MAX) {
    fail(
      `L2 (${slug}): expected ${TASK_COUNT_MIN}-${TASK_COUNT_MAX} "${TASK_HEADING}" heading(s), got ${count}`,
    );
  }
  return count;
}

// --- L3: <details>/<summary>정답 보기</summary>/</details> 개수가 모두 같고 해보기+2 이상 ---
function checkAnswerBlockPairing(slug, lines, taskCount) {
  const detailsOpen = lines.filter((l) => l.includes(DETAILS_OPEN_LINE)).length;
  const summary = lines.filter((l) => l.includes(ANSWER_SUMMARY_LINE)).length;
  const detailsClose = lines.filter((l) => l.includes(DETAILS_CLOSE_LINE)).length;
  if (detailsOpen !== summary || summary !== detailsClose) {
    fail(
      `L3 (${slug}): <details>/<summary>정답 보기</summary>/</details> counts do not match (${detailsOpen}/${summary}/${detailsClose})`,
    );
    return;
  }
  const minExpected = taskCount + 2;
  if (detailsOpen < minExpected) {
    fail(
      `L3 (${slug}): expected at least ${minExpected} answer block(s) (해보기 ${taskCount} + 스스로 점검 2), got ${detailsOpen}`,
    );
  }
}

// --- L4: <summary> 다음 줄, </details> 이전 줄이 반드시 빈 줄 ---
function checkBlankLineRule(slug, lines) {
  lines.forEach((line, idx) => {
    if (line.includes(ANSWER_SUMMARY_LINE)) {
      const nextLine = lines[idx + 1];
      if (nextLine === undefined || nextLine !== '') {
        fail(`L4 (${slug}): line ${idx + 1} (<summary>) is not followed by a blank line`);
      }
    }
    if (line.includes(DETAILS_CLOSE_LINE)) {
      const prevLine = lines[idx - 1];
      if (prevLine === undefined || prevLine !== '') {
        fail(`L4 (${slug}): line ${idx + 1} (</details>) is not preceded by a blank line`);
      }
    }
  });
}

// --- L5: "이 레슨의 단어" 라벨 1회 + 표 헤더 일치 + 데이터 행 5~8개 ---
function checkTermTable(slug, lines) {
  const labelCount = lines.filter((l) => l === TERM_TABLE_LABEL).length;
  if (labelCount !== 1) {
    fail(`L5 (${slug}): "${TERM_TABLE_LABEL}" label appears ${labelCount} time(s), expected exactly 1`);
    return;
  }
  const labelIdx = lines.indexOf(TERM_TABLE_LABEL);
  let i = labelIdx + 1;
  while (i < lines.length && lines[i].trim() === '') i += 1;
  if (i >= lines.length || lines[i].trim() !== TERM_TABLE_HEADER) {
    fail(`L5 (${slug}): expected table header "${TERM_TABLE_HEADER}" after the term label, got "${lines[i]}"`);
    return;
  }
  const headerIdx = i;
  const separatorIdx = headerIdx + 1;
  if (separatorIdx >= lines.length || !/^\|[\s:-]+\|/.test(lines[separatorIdx].trim())) {
    fail(`L5 (${slug}): expected a markdown table separator row after the header (line ${separatorIdx + 1})`);
    return;
  }
  let rowCount = 0;
  let j = separatorIdx + 1;
  while (j < lines.length && lines[j].trim().startsWith('|')) {
    rowCount += 1;
    j += 1;
  }
  if (rowCount < TERM_ROWS_MIN || rowCount > TERM_ROWS_MAX) {
    fail(`L5 (${slug}): term table has ${rowCount} data row(s), expected ${TERM_ROWS_MIN}-${TERM_ROWS_MAX}`);
  }
}

// --- L6: 모든 여는 코드펜스가 허용 목록으로 시작하는 언어 태그를 가진다 ---
function checkFenceLanguages(slug, lines) {
  let inFence = false;
  lines.forEach((line, idx) => {
    if (!line.startsWith('```')) return;
    if (!inFence) {
      const lang = line.slice(3).trim();
      if (lang === '') {
        fail(`L6 (${slug}): line ${idx + 1} opens a code fence with no language tag`);
      } else if (!ALLOWED_FENCE_LANG_PREFIXES.some((allowed) => lang.startsWith(allowed))) {
        fail(
          `L6 (${slug}): line ${idx + 1} uses disallowed fence language "${lang}" — add it to ALLOWED_FENCE_LANG_PREFIXES in this script if it should be permitted`,
        );
      }
      inFence = true;
    } else {
      inFence = false;
    }
  });
}

let checkedCount = 0;

for (const absPath of allFiles) {
  // CRLF(Windows 체크아웃)와 LF를 모두 다뤄야 한다 — 정규화하지 않으면 이 게이트가
  // CRLF로 저장된 파일을 조용히 건너뛰고 통과시켜버린다(구조 검증 0건).
  const content = fs.readFileSync(absPath, 'utf8').replace(/\r\n/g, '\n');
  const frontmatter = extractFrontmatter(content);
  if (!hasContentTrue(frontmatter)) continue; // hasContent: false 스텁은 건너뛴다

  const slug = extractSlug(frontmatter) || path.basename(absPath);
  checkedCount += 1;

  const lines = content.split('\n');
  checkHeadings(slug, lines);
  const taskCount = checkTaskCount(slug, lines);
  checkAnswerBlockPairing(slug, lines, taskCount);
  checkBlankLineRule(slug, lines);
  checkTermTable(slug, lines);
  checkFenceLanguages(slug, lines);
}

// 검사 대상이 0개면 그 자체가 오류다 — 게이트가 아무것도 검사하지 않고 조용히
// 통과하는 경로를 막는다.
if (checkedCount === 0) {
  fail('no lesson with hasContent: true was found in step-1/2/3 — the gate checked nothing');
}

if (errors.length > 0) {
  console.error(`check-lesson-structure: ${errors.length} error(s) found:\n`);
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}

console.log(`check-lesson-structure: ${checkedCount}개 레슨, 6개 검사 통과`);
process.exit(0);
