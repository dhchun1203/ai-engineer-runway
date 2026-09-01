#!/usr/bin/env node
// 예측 프롬프트 전량 승격(quick 260902-0rz) — 경계 = "hasContent: true이고 4장
// (## 4. 실무 예제)에 코드/쿼리 예제가 있는 콘텐츠 레슨" 전부에 `<PredictPrompt />`를
// 100% 균일 삽입한다. 연구 근거(RESEARCH round1-c-korean.md): 의례 장치의 부분
// 적용은 유해하다 — 경계 안 전량이어야 한다. 손으로 32편을 편집하는 대신 이
// 스크립트로 삽입해 저작 편차·중복 삽입을 원천 차단한다.
//
// 파일 순회 골격(step-1 → step-2 → step-3, 각 디렉터리 안에서는 파일명 정렬)은
// check-lesson-structure.mjs를 그대로 재사용한다.
//
// 경계 판정: 4장 범위(다음 "## " 헤딩 또는 EOF까지) 안에서 첫 코드 요소 줄
// (<RunPython>/<RunSQL>/여는 코드펜스 — 소문자 언어 태그로 시작하는 ```lang)을
// 찾는다. 없으면 그 레슨은 경계 밖이다(예: 3-2-project-rag-agent,
// 3-7-project-ax-launch — 4장에 코드 없음, "코드 보기 전"이라는 의례의 전제
// 자체가 없다).
//
// 멱등: 4장 범위 안에 이미 `<PredictPrompt`가 있으면 그 파일은 건너뛴다 — 파일럿
// (Task 2)과 재실행 모두 안전하다. 앞으로 레슨이 추가되면 이 스크립트를 다시
// 돌려 경계를 유지한다.
//
// CRLF/LF 정규화 후 처리, 저장은 LF로 통일한다 — check-lesson-structure가 CRLF도
// 정규화해 검사하므로 LF 저장이 안전하다(원본이 CRLF였어도 문제 없음).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LESSON_DIRS = ['step-1', 'step-2', 'step-3'].map((d) =>
  path.join(ROOT, 'src', 'content', 'lessons', d),
);

const SECTION_HEADING = '## 4. 실무 예제';
const PREDICT_PROMPT_TAG = '<PredictPrompt';

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  return match ? match[1] : '';
}

function hasContentTrue(frontmatter) {
  const match = frontmatter.match(/hasContent:\s*(true|false)/);
  return match ? match[1] === 'true' : false;
}

// 4장 범위 안에서 "첫 코드 요소" 판정 — <RunPython>/<RunSQL> 여는 태그이거나,
// 소문자 언어 태그로 시작하는 여는 코드펜스(```python 등, 닫는 펜스 ```는
// 언어 태그가 없으므로 이 정규식에 걸리지 않는다).
function isCodeElementLine(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith('<RunPython>')) return true;
  if (trimmed.startsWith('<RunSQL>')) return true;
  if (/^```[a-z]/.test(trimmed)) return true;
  return false;
}

const allFiles = LESSON_DIRS.flatMap((dir) =>
  fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .sort()
    .map((f) => path.join(dir, f)),
);

let insertedCount = 0;
let alreadyHadCount = 0;
let noCodeCount = 0;

for (const absPath of allFiles) {
  const raw = fs.readFileSync(absPath, 'utf8');
  const content = raw.replace(/\r\n/g, '\n');
  const frontmatter = extractFrontmatter(content);
  if (!hasContentTrue(frontmatter)) continue; // hasContent: false 스텁은 경계 밖

  const lines = content.split('\n');
  const sectionStart = lines.indexOf(SECTION_HEADING);
  if (sectionStart === -1) continue; // 방어적 — L1 게이트가 이미 이 헤딩 존재를 보장한다

  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      sectionEnd = i;
      break;
    }
  }

  const sectionLines = lines.slice(sectionStart, sectionEnd);

  // 멱등 — 이미 삽입돼 있으면 건너뛴다.
  if (sectionLines.some((l) => l.includes(PREDICT_PROMPT_TAG))) {
    alreadyHadCount += 1;
    continue;
  }

  let codeLineOffset = -1;
  for (let i = 0; i < sectionLines.length; i++) {
    if (isCodeElementLine(sectionLines[i])) {
      codeLineOffset = i;
      break;
    }
  }

  if (codeLineOffset === -1) {
    // 4장에 코드가 없다 — 경계 밖(부분 적용이 아니라 애초에 경계 밖).
    noCodeCount += 1;
    continue;
  }

  const codeLineIndex = sectionStart + codeLineOffset;
  const prevLine = lines[codeLineIndex - 1];
  const needsLeadingBlank = prevLine !== undefined && prevLine.trim() !== '';

  const insertion = needsLeadingBlank ? ['', '<PredictPrompt />', ''] : ['<PredictPrompt />', ''];
  const newLines = [...lines.slice(0, codeLineIndex), ...insertion, ...lines.slice(codeLineIndex)];

  fs.writeFileSync(absPath, newLines.join('\n'), 'utf8');
  insertedCount += 1;
}

console.log(
  `insert-predict-prompt: 삽입 ${insertedCount}개 / 이미 있어 건너뜀 ${alreadyHadCount}개 / 4장 코드 없어 건너뜀 ${noCodeCount}개`,
);
