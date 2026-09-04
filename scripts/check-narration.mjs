#!/usr/bin/env node
// 낭독(TTS) 대본 상시 정적 게이트 (quick 260904-in4 Phase A) — check-progress-gates.mjs·
// check-manifest.mjs와 같은 형태: 저장소 루트 기준으로 velite 산출물을 읽고, 위반을
// 배열에 모아 마지막에 한꺼번에 보고하며, 하나라도 있으면 0이 아닌 코드로 종료한다.
//
// velite.config.ts의 extractNarration이 만든 lessons[].narration(순수 한국어 문장 배열)이
// 다음 Phase(오디오 생성)에 넘겨도 안전한 상태인지 지킨다. extractNarration의 stripBlocks·
// 문장 분리 로직이 나중에 바뀌어 코드/태그/표 기호가 대본에 새거나, 소수점이 문장 중간에서
// 끊기면 여기서 빌드를 실패시킨다.
//
// 입력은 .velite/lessons.json(gitignore 대상 빌드 산출물)이다 — 먼저 `npx velite build`가
// 돌아야 한다. next build 파이프라인이 velite를 물고 있으므로 CI에서도 빌드 뒤 실행하면 된다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LESSONS_JSON = path.join(ROOT, '.velite', 'lessons.json');

const errors = [];
const fail = (message) => errors.push(message);

if (!fs.existsSync(LESSONS_JSON)) {
  console.error(
    'check-narration: .velite/lessons.json 이 없습니다 — 먼저 `npx velite build`(또는 next build)를 실행하세요.',
  );
  process.exit(1);
}

const lessons = JSON.parse(fs.readFileSync(LESSONS_JSON, 'utf8'));

// 대본에 절대 새면 안 되는 잔여물 패턴. extractNarration이 stripBlocks(svg·코드펜스·태그)
// 와 GFM 표(| ...) 줄 스킵, 인라인 기호 제거를 제대로 했다면 하나도 걸리지 않아야 한다.
const RESIDUE_PATTERNS = [
  { re: /[<>]/, label: 'HTML/JSX 꺾쇠(< >)' },
  { re: /`/, label: '백틱(`)' },
  { re: /```/, label: '코드펜스(```)' },
  { re: /\|/, label: 'GFM 표 파이프(|)' },
  { re: /<svg|<\/svg>/i, label: 'SVG 태그' },
];

// 소수점이 문장 중간에서 끊기지 않아야 한다 — "3.14"·"1.0" 같은 토막이 문장 "끝"에
// 오면(뒤에 아무 것도 없으면) 소수점에서 잘렸다는 신호다.
const DECIMAL_SPLIT_RE = /\d+\.$/;

let totalSentences = 0;

for (const lesson of lessons) {
  if (!lesson.hasContent) {
    // hasContent:false 스텁은 narration:[]가 정상(terms/selfCheck와 같은 게이트 대칭).
    if (lesson.narration && lesson.narration.length > 0) {
      fail(`${lesson.slug}: hasContent=false 인데 narration 이 비어있지 않습니다.`);
    }
    continue;
  }

  const narration = lesson.narration;
  if (!Array.isArray(narration) || narration.length === 0) {
    fail(`${lesson.slug}: hasContent 레슨인데 narration 이 비어있습니다 — 대본 추출 실패.`);
    continue;
  }

  narration.forEach((sentence, i) => {
    totalSentences += 1;
    const where = `${lesson.slug}[${i}]`;

    if (typeof sentence !== 'string' || sentence.trim() === '') {
      fail(`${where}: 빈/비문자 문장.`);
      return;
    }
    for (const { re, label } of RESIDUE_PATTERNS) {
      if (re.test(sentence)) {
        fail(`${where}: 잔여물 발견(${label}) → "${sentence.slice(0, 60)}"`);
      }
    }
    if (DECIMAL_SPLIT_RE.test(sentence.trim())) {
      fail(`${where}: 소수점에서 문장이 끊긴 듯 → "${sentence.slice(-30)}"`);
    }
  });
}

if (errors.length > 0) {
  console.error(`check-narration: ${errors.length}건 실패\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log(
  `check-narration: OK — ${lessons.filter((l) => l.hasContent).length}개 레슨, 총 ${totalSentences}문장, 잔여물 0.`,
);
