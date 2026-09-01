#!/usr/bin/env node
// 라우트 렌더 모드 계약 정적 게이트 — 외부 의존성 0, Node 표준 모듈만 사용.
// check-manifest.mjs와 같은 형태다: 저장소 루트 기준으로 산출물을 읽고, 위반을
// 배열에 모아 마지막에 한꺼번에 보고하며, 하나라도 있으면 0이 아닌 코드로 종료한다.
//
// 이 계약은 **목표 상태**를 적는다 — 08-02~08-06 전환 플랜이 이 게이트를
// 초록불로 만든다. 이 플랜(08-01) 직후에는 빨간불인 것이 정상이다(아직 아무
// 라우트도 정적/ISR로 전환하지 않았으므로). 결함이 아니라 의도다.
//
// 입력:
//   .next/prerender-manifest.json — `npm run build` 산출물. routes 키에 있는
//     항목만 프리렌더(정적) 대상이고, initialRevalidateSeconds가 숫자가 아니면
//     완전 정적, 숫자면 ISR이다.
//   .velite/lessons.json — 레슨 슬러그 목록. curriculum-helpers.ts를 import하지
//     않고 이 파일을 직접 재파싱한다(e2e-mobile-overflow.mjs 84~95행과 같은
//     원칙 — 같은 함수를 재사용하면 계산이 틀려도 검증이 같이 틀린다).
//
// 목표 계약:
//   완전 정적(prerender 대상, initialRevalidateSeconds가 숫자가 아님):
//     /about(대조군, 이미 정적), /step/1, /step/2, /step/3, /curriculum,
//     /glossary(quick 260901-r9t — 쿠키·진도 없는 완전 정적 셸),
//     그리고 .velite/lessons.json의 모든 레슨 슬러그에 대한 /lesson/<slug>
//   동적 유지(prerender 대상이 아님, routes에 등장하면 안 됨): /, /schedule,
//     /review(quick 260901-w04 — 쿠키·진도·복습 상태를 읽는 세션 라우트, /와
//     동일한 계약), /notes·/inbox(quick 260901-x62 — 쿠키·노트/질문 상태를
//     읽는 라우트, /·/review와 동일 계약)
//
// 주의: 이 스크립트는 next build를 스스로 실행하지 않는다 — 빌드는 호출자가
// 한다(정적 게이트는 수 초 안에 끝나야 한다는 이 저장소의 샘플링 관례).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PRERENDER_MANIFEST_PATH = path.join(ROOT, '.next', 'prerender-manifest.json');
const LESSONS_JSON_PATH = path.join(ROOT, '.velite', 'lessons.json');

const errors = [];

function fail(message) {
  errors.push(message);
}

// --- 입력 부재 시 skip (빌드 산출물이 없으면 계약을 평가할 수 없다) ---

if (!fs.existsSync(PRERENDER_MANIFEST_PATH)) {
  console.log(
    `check-route-rendering: ${path.relative(ROOT, PRERENDER_MANIFEST_PATH)} not found — run "npm run build" first, then re-run this gate. Skipping.`,
  );
  process.exit(0);
}

if (!fs.existsSync(LESSONS_JSON_PATH)) {
  console.log(
    `check-route-rendering: ${path.relative(ROOT, LESSONS_JSON_PATH)} not found — run "npm run build" first, then re-run this gate. Skipping.`,
  );
  process.exit(0);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(PRERENDER_MANIFEST_PATH, 'utf8'));
} catch (e) {
  console.error(`check-route-rendering: failed to parse ${PRERENDER_MANIFEST_PATH}: ${e.message}`);
  process.exit(1);
}

let lessons;
try {
  lessons = JSON.parse(fs.readFileSync(LESSONS_JSON_PATH, 'utf8'));
} catch (e) {
  console.error(`check-route-rendering: failed to parse ${LESSONS_JSON_PATH}: ${e.message}`);
  process.exit(1);
}

if (!Array.isArray(lessons)) {
  console.error(`check-route-rendering: ${LESSONS_JSON_PATH} did not parse to an array`);
  process.exit(1);
}

const routes = manifest.routes || {};
const lessonRoutes = lessons.map((l) => `/lesson/${l.slug}`);

const EXPECTED_STATIC_ROUTES = [
  '/about',
  '/step/1',
  '/step/2',
  '/step/3',
  '/curriculum',
  '/glossary',
  ...lessonRoutes,
];

const EXPECTED_DYNAMIC_ROUTES = ['/', '/schedule', '/review', '/notes', '/inbox'];

function isFullyStatic(routeEntry) {
  return typeof routeEntry.initialRevalidateSeconds !== 'number';
}

// --- 완전 정적이어야 하는 라우트 ---

for (const route of EXPECTED_STATIC_ROUTES) {
  const entry = routes[route];
  if (!entry) {
    fail(
      `Route "${route}" is expected to be fully static (prerendered) but does not appear in prerender-manifest.json routes — it is still rendered dynamically`,
    );
    continue;
  }
  if (!isFullyStatic(entry)) {
    fail(
      `Route "${route}" is expected to be fully static but has a numeric initialRevalidateSeconds (${entry.initialRevalidateSeconds}) — it is ISR, not fully static`,
    );
  }
}

// --- 동적으로 남아야 하는 라우트 ---

for (const route of EXPECTED_DYNAMIC_ROUTES) {
  if (routes[route]) {
    fail(
      `Route "${route}" is expected to remain dynamic (not prerendered) but appears in prerender-manifest.json routes — this route was decided to stay dynamic (D8 decisions), not converted`,
    );
  }
}

// --- 결과 ---

if (errors.length > 0) {
  console.error(`check-route-rendering: ${errors.length} route rendering contract violation(s):\n`);
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}

console.log('check-route-rendering: all route rendering contracts passed');
process.exit(0);
