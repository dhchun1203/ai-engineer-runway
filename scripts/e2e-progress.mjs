#!/usr/bin/env node
// 실제 개발 서버를 띄워 완료 토글이 브라우저 요청 → 쿠키 게이트 → Server Action
// 재검증 → Supabase 저장 → 서버 재렌더까지 왕복하는지 확인하는 종단 게이트.
// 실행: node --env-file=.env.local scripts/e2e-progress.mjs
//
// src/lib/supabase/admin.ts를 import하지 않는다 — check-supabase-progress.mjs와
// 같은 이유로, 이 스크립트는 @supabase/supabase-js의 createClient를 직접 호출한다.
//
// 어떤 출력에도 쿠키 값·시크릿을 찍지 않는다.
//
// 08-02: Step 라우트가 정적으로 전환되면서 진도 표시가 서버 렌더가 아니라
// 마운트 후 클라이언트 fetch(GET /api/progress)로 옮겨갔다. h2~h4는 이제
// `await res.text()`(서버가 내려준 원문)가 아니라 `renderedHtml(...)`(Chromium으로
// 열어 수화 완료를 기다린 뒤의 DOM)을 문자열로 받는다 — 반환 타입이 같은 HTML
// 문자열이라 downstream 어설션은 한 글자도 바꾸지 않는다. h1은 그대로 원문
// fetch로 둔다(쿠키 없을 때 서버가 아무것도 안 내보낸다는 게 더 강하게 참이 됨).
// h5가 신규 — 쿠키를 실어도 원문 HTML에는 진도 마커가 0건임을 검사한다.
//
// 08-06: /curriculum도 정적으로 전환되면서 i2~i5의 커리큘럼 쪽 요청만
// renderedHtml(...)로 교체한다 — 홈(/)은 여전히 동적이라 그 요청은 원문
// fetch 그대로 둔다. 한 시나리오 안에 두 방식이 섞이는 이유: 홈과 커리큘럼이
// 이제 서로 다른 렌더 모드이기 때문이다(i1 주석 및 각 시나리오 로그 참고).
// i6이 신규 — h5/f의 커리큘럼 버전(쿠키를 실어도 원문에 진도 마커 0건).
//
// 역할 분담: 이 게이트는 개발 서버(next dev)를 spawn한다 — 개발 서버는 항상
// 온디맨드 렌더되므로 h5의 "원문에 마커 0건"은 코드가 쿠키를 안 읽는다는
// 사실만으로 성립한다. 실제 프로덕션 프리렌더 여부(next build 산출물이 진짜
// 정적인지)는 08-02-PLAN.md Task 1의 prerender-manifest 어설션과
// scripts/check-route-rendering.mjs가 본다 — 이 스크립트의 책임이 아니다.

import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// src/lib/unlock-secret.ts의 UNLOCK_COOKIE_NAME과 반드시 일치해야 한다 — 이
// 스크립트는 'server-only' 마커 유무와 무관하게 순수 TS 모듈을 Node에서 직접
// 로드할 수 없어(ts-node/tsx 미설치) 상수를 재선언한다.
const UNLOCK_COOKIE_NAME = 'runway_unlock';

const PORT = process.env.E2E_PORT ? Number(process.env.E2E_PORT) : 3210;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 180_000;
const FETCH_TIMEOUT_MS = 30_000;

class FatalError extends Error {}

// --- 필수 환경 변수 부재 시 즉시 오류 종료 (기본값으로 넘어가지 않는다) ---

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UNLOCK_SECRET = process.env.UNLOCK_SECRET;

for (const [name, value] of [
  ['SUPABASE_URL', SUPABASE_URL],
  ['SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY],
  ['UNLOCK_SECRET', UNLOCK_SECRET],
]) {
  if (!value) {
    console.error(
      `e2e-progress: ${name} 환경 변수가 비어 있습니다. \`node --env-file=.env.local scripts/e2e-progress.mjs\`로 실행하세요.`,
    );
    process.exit(1);
  }
}

function readLessonsManifest() {
  const lessonsPath = path.join(ROOT, '.velite', 'lessons.json');
  if (!fs.existsSync(lessonsPath)) {
    console.error(
      `e2e-progress: ${path.relative(ROOT, lessonsPath)}가 없습니다. \`npm run dev\` 또는 \`npm run build\`를 한 번 실행해 Velite 매니페스트를 생성한 뒤 다시 시도하세요.`,
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
}

// 홈의 '이어서 학습하기' CTA 검증용 — 앱 코드(curriculum-helpers.ts/progress.ts)를
// 재사용하지 않고 매니페스트에서 독립적으로 전역 정렬 첫 미완료 slug를 계산한다.
// 같은 함수를 재사용하면 계산 로직 자체가 틀려도 검증이 같이 틀린다 (Task 3 지시).
// check-manifest.mjs와 같은 방식으로 modules.ts를 정규식으로 재파싱한다.
function readModuleOrderMap() {
  const modulesTsPath = path.join(ROOT, 'src', 'content', 'modules.ts');
  const source = fs.readFileSync(modulesTsPath, 'utf8');
  const map = new Map();
  for (const match of source.matchAll(/id:\s*'([0-9]-[0-9])'[^}]*?order:\s*(\d+)/g)) {
    map.set(match[1], Number(match[2]));
  }
  return map;
}

function computeExpectedFirstIncompleteSlug(completedSlugSet) {
  const moduleOrderMap = readModuleOrderMap();
  const ordered = [...LESSONS].sort((a, b) => {
    if (a.stepId !== b.stepId) return a.stepId - b.stepId;
    const am = moduleOrderMap.get(a.moduleId) ?? 0;
    const bm = moduleOrderMap.get(b.moduleId) ?? 0;
    if (am !== bm) return am - bm;
    return a.order - b.order;
  });
  const firstIncomplete = ordered.find((l) => !completedSlugSet.has(l.slug));
  return firstIncomplete ? firstIncomplete.slug : null;
}

const LESSONS = readLessonsManifest();
const PROBE_LESSON = LESSONS.find((l) => l.hasContent) ?? LESSONS[0];
if (!PROBE_LESSON) {
  console.error('e2e-progress: .velite/lessons.json에 레슨이 하나도 없습니다.');
  process.exit(1);
}
const PROBE_SLUG = PROBE_LESSON.slug;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function waitForServerReady() {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetchWithTimeout(BASE_URL);
      if (res.status < 500) return;
    } catch {
      // 아직 기동 중 — 재시도
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new FatalError('서버가 제한 시간(180초) 안에 기동하지 않았습니다.');
}

function killServerTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // 이미 종료되었을 수 있음 — 무시
    }
  } else {
    try {
      child.kill('SIGKILL');
    } catch {
      // 이미 종료되었을 수 있음 — 무시
    }
  }
}

async function deleteProbeRow(admin) {
  await admin.from('progress').delete().eq('lesson_id', PROBE_SLUG);
}

// Chromium 컨텍스트를 새로 만들고(필요하면 잠금 쿠키를 심고) 페이지를 연 다음
// [data-progress-island]가 나타날 때까지, 그리고 data-progress-state가
// loading이 아닐 때까지 기다린 뒤 page.content()를 문자열로 돌려준다.
// 반환 타입이 기존 `await res.text()`와 같은 HTML 문자열이므로 h2~h4의
// downstream 문자열 어설션은 바뀌지 않는다 (최소 변경 이행 경로).
async function renderedHtml(browser, url, { cookieValue } = {}) {
  const context = await browser.newContext();
  if (cookieValue) {
    await context.addCookies([{ name: UNLOCK_COOKIE_NAME, value: cookieValue, url: BASE_URL }]);
  }
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-progress-island]');
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-progress-island]');
      return el !== null && el.getAttribute('data-progress-state') !== 'loading';
    });
    return await page.content();
  } finally {
    await context.close();
  }
}

async function main() {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // a. service_role로 프로브 레슨 초기 상태 확정 (완료 없음)
  await deleteProbeRow(admin);

  const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  const serverOutput = [];
  const child = spawn(process.execPath, [nextBin, 'dev', '--port', String(PORT), '--hostname', HOST], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  child.stdout.on('data', (d) => serverOutput.push(d.toString()));
  child.stderr.on('data', (d) => serverOutput.push(d.toString()));

  let browser;
  try {
    try {
      await waitForServerReady();
    } catch (e) {
      throw new FatalError(
        `${e.message}\n--- 서버 출력(마지막 부분) ---\n${serverOutput.join('').slice(-4000)}`,
      );
    }
    console.log(`e2e-progress: 개발 서버 기동 완료 (probe lesson: ${PROBE_SLUG})`);

    // h2~h5(수화 완료 후 DOM 검증 + 정적 셸 원문 검증)가 쓴다 — i/b~g 시나리오는
    // 원문 fetch만 쓰므로 이 브라우저와 무관하다.
    browser = await chromium.launch();

    const cookieHeader = `${UNLOCK_COOKIE_NAME}=${UNLOCK_SECRET}`;
    // 프로브 레슨이 속한 stepId는 매니페스트에서 읽는다(하드코딩 금지) — 02-03이
    // h1-h4에서 이미 확립한 관례를 02-04 홈 시나리오도 그대로 따른다.
    const PROBE_STEP_ID = PROBE_LESSON.stepId;

    // --- i. 홈 시나리오 (02-04, TRACK-04) ---
    // scenario a가 이미 프로브 행을 삭제했다. 나머지 lesson/step 시나리오(b~h)가
    // 아직 어떤 완료도 만들지 않은 이 시점에 홈 시나리오를 실행해, i2의 "완료 0건"
    // 판정이 다른 시나리오의 부수 효과와 섞이지 않게 한다.

    function extractAttrs(body, attr) {
      const stripped = body.replace(/<!--\s*-->/g, '');
      return [...stripped.matchAll(new RegExp(`${attr}="([^"]*)"`, 'g'))].map((m) => m[1]);
    }

    function extractHomeCtaLessonSlug(body) {
      // Phase 3(03-01)부터 홈은 오늘 레슨 카드·밀린 레슨 목록에도 /lesson/ 링크를
      // 렌더한다. 진행률 요약 섹션(data-progress-ui="summary") 안의 CTA href만 뽑는다.
      const stripped = body.replace(/<!--\s*-->/g, '');
      const start = stripped.indexOf('data-progress-ui="summary"');
      if (start === -1) return null;
      const end = stripped.indexOf('</section>', start);
      const section = stripped.slice(start, end === -1 ? undefined : end);
      const match = section.match(/href="\/lesson\/([a-z0-9-]+)"/);
      return match ? match[1] : null;
    }

    // i1. 쿠키 없이 홈·커리큘럼 GET → 진도 UI 마커 0건, Step 링크 3개, 사이트 제목 존재 (D-18+D-20)
    // Phase 3(03-01)부터 Step 카드는 /curriculum으로 이동했다 — Step 링크는 거기서 확인한다.
    {
      const res = await fetchWithTimeout(`${BASE_URL}/`);
      if (res.status !== 200) {
        throw new FatalError(`시나리오 i1 실패 — 쿠키 없는 홈 요청이 200이 아닙니다 (status=${res.status})`);
      }
      const body = await res.text();
      if (body.includes('data-progress-ui')) {
        throw new FatalError('시나리오 i1 실패 — 쿠키 없는 홈 응답에 data-progress-ui 마커가 존재합니다 (D-20 위반)');
      }
      if (!body.includes('AI Engineer Runway')) {
        throw new FatalError('시나리오 i1 실패 — 쿠키 없는 홈 응답에 사이트 제목이 없습니다 (D-18 위반)');
      }

      const curRes = await fetchWithTimeout(`${BASE_URL}/curriculum`);
      if (curRes.status !== 200) {
        throw new FatalError(`시나리오 i1 실패 — 쿠키 없는 /curriculum 요청이 200이 아닙니다 (status=${curRes.status})`);
      }
      const curBody = await curRes.text();
      if (curBody.includes('data-progress-ui')) {
        throw new FatalError('시나리오 i1 실패 — 쿠키 없는 /curriculum 응답에 data-progress-ui 마커가 존재합니다 (D-20 위반)');
      }
      for (const stepId of [1, 2, 3]) {
        if (!curBody.includes(`href="/step/${stepId}"`)) {
          throw new FatalError(`시나리오 i1 실패 — 쿠키 없는 /curriculum 응답에 /step/${stepId} 링크가 없습니다 (D-18 위반)`);
        }
      }
    }
    console.log('e2e-progress: i1/i 홈·커리큘럼 쿠키 없음 → 진도 UI 마커 0건 + Step 링크 3개 + 사이트 제목 존재 OK');

    // i2. 잠금 쿠키로 홈 GET → 요약 블록 마커 + Step 진행률 바 마커 3개 존재.
    // 완료 0건이면(현재 실제 DB 상태) empty state 문구·퍼센트 0을 함께 확인한다.
    let beforeOverallPercent;
    let beforeStepPercents;
    {
      const { data: rows, error } = await admin.from('progress').select('lesson_id');
      if (error) throw new FatalError(`시나리오 i2 준비(select) 실패 — Supabase 오류: ${error.message}`);
      const actualCompletedCount = rows.length;

      const res = await fetchWithTimeout(`${BASE_URL}/`, { headers: { Cookie: cookieHeader } });
      const body = await res.text();
      if (!body.includes('data-progress-ui="summary"')) {
        throw new FatalError('시나리오 i2 실패 — 잠금 쿠키 홈 응답에 요약 블록 마커가 없습니다');
      }
      // Step 진행률 바는 /curriculum(03-01에서 홈과 분리, 08-06부터 정적 셸)에서
      // 확인한다 — 이 라우트는 이제 마운트 후 클라이언트 fetch로 진도를 가져오므로
      // 원문 fetch가 아니라 renderedHtml()(수화 완료 후 DOM)을 써야 한다. 홈(/)은
      // 여전히 동적이라 위 body는 그대로 원문 fetch를 쓴다.
      const curBody = await renderedHtml(browser, `${BASE_URL}/curriculum`, { cookieValue: UNLOCK_SECRET });
      const stepBarCount = (curBody.match(/data-progress-ui="step-bar"/g) || []).length;
      if (stepBarCount !== 3) {
        throw new FatalError(`시나리오 i2 실패 — /curriculum의 Step 진행률 바 마커가 3개가 아닙니다 (got ${stepBarCount})`);
      }
      const percentAttrs = extractAttrs(body, 'data-progress-percent');
      if (percentAttrs.length !== 1) {
        throw new FatalError(`시나리오 i2 실패 — data-progress-percent 속성을 정확히 1개 찾지 못했습니다 (got ${percentAttrs.length})`);
      }
      beforeOverallPercent = Number(percentAttrs[0]);
      beforeStepPercents = extractAttrs(curBody, 'data-step-percent').map(Number);
      if (beforeStepPercents.length !== 3) {
        throw new FatalError(`시나리오 i2 실패 — data-step-percent 속성이 3개가 아닙니다 (got ${beforeStepPercents.length})`);
      }

      if (actualCompletedCount === 0) {
        if (beforeOverallPercent !== 0) {
          throw new FatalError(`시나리오 i2 실패 — 완료 0건인데 data-progress-percent가 0이 아닙니다 (got ${beforeOverallPercent})`);
        }
        if (!body.includes('학습을 시작해볼까요?')) {
          throw new FatalError('시나리오 i2 실패 — 완료 0건 상태의 empty state 제목 문구가 없습니다');
        }
      }
    }
    console.log(
      `e2e-progress: i2/i 홈 잠금 쿠키 → 요약 마커 + Step 바 3개 존재 OK (overall=${beforeOverallPercent}%, steps=${beforeStepPercents.join('/')}%)`,
    );

    // i3. service_role로 프로브 레슨 완료 처리 → 전체 퍼센트 증가, 프로브가 속한
    // Step의 바 값만 증가, 나머지 두 Step 바는 불변 (UI-SPEC #21 부분 진행 확인).
    let afterOverallPercent;
    let afterStepPercents;
    {
      const { error } = await admin
        .from('progress')
        .upsert({ lesson_id: PROBE_SLUG, completed_at: new Date().toISOString() });
      if (error) throw new FatalError(`시나리오 i3 준비(upsert) 실패 — Supabase 오류: ${error.message}`);

      const res = await fetchWithTimeout(`${BASE_URL}/`, { headers: { Cookie: cookieHeader } });
      const body = await res.text();
      const percentAttrs = extractAttrs(body, 'data-progress-percent');
      afterOverallPercent = Number(percentAttrs[0]);
      // /curriculum은 08-06부터 정적 셸이라 renderedHtml()(수화 완료 후 DOM)로 읽는다.
      const curBody = await renderedHtml(browser, `${BASE_URL}/curriculum`, { cookieValue: UNLOCK_SECRET });
      afterStepPercents = extractAttrs(curBody, 'data-step-percent').map(Number);

      if (!(afterOverallPercent > beforeOverallPercent)) {
        throw new FatalError(
          `시나리오 i3 실패 — 프로브 완료 후 전체 퍼센트가 증가하지 않았습니다 (before=${beforeOverallPercent}, after=${afterOverallPercent})`,
        );
      }
      const probeIndex = PROBE_STEP_ID - 1;
      if (!(afterStepPercents[probeIndex] > beforeStepPercents[probeIndex])) {
        throw new FatalError(
          `시나리오 i3 실패 — 프로브가 속한 Step ${PROBE_STEP_ID}의 바 값이 증가하지 않았습니다 (before=${beforeStepPercents[probeIndex]}, after=${afterStepPercents[probeIndex]})`,
        );
      }
      for (let i = 0; i < 3; i++) {
        if (i === probeIndex) continue;
        if (afterStepPercents[i] !== beforeStepPercents[i]) {
          throw new FatalError(
            `시나리오 i3 실패 — 프로브와 무관한 Step ${i + 1}의 바 값이 변했습니다 (before=${beforeStepPercents[i]}, after=${afterStepPercents[i]})`,
          );
        }
      }

      // i4. '이어서 학습하기' CTA 대상이 매니페스트 기반 독립 계산과 일치하는지 확인.
      const { data: rows, error: selError } = await admin.from('progress').select('lesson_id');
      if (selError) throw new FatalError(`시나리오 i4 준비(select) 실패 — Supabase 오류: ${selError.message}`);
      const completedSlugSet = new Set(rows.map((r) => r.lesson_id));
      const expectedNextSlug = computeExpectedFirstIncompleteSlug(completedSlugSet);
      const actualCtaSlug = extractHomeCtaLessonSlug(body);
      if (expectedNextSlug === null) {
        if (actualCtaSlug !== null) {
          throw new FatalError('시나리오 i4 실패 — 전건 완료로 계산됐는데 홈에 /lesson/ CTA가 남아 있습니다');
        }
      } else if (actualCtaSlug !== expectedNextSlug) {
        throw new FatalError(
          `시나리오 i4 실패 — CTA 대상(${actualCtaSlug})이 독립 계산한 첫 미완료 slug(${expectedNextSlug})와 다릅니다`,
        );
      }
    }
    console.log(
      `e2e-progress: i3-i4/i 프로브 완료 → 전체·Step 퍼센트 증가 + 나머지 Step 불변 + CTA 대상 일치 OK (overall=${afterOverallPercent}%, steps=${afterStepPercents.join('/')}%)`,
    );

    // i5. 프로브 삭제(원상 복구) → 전체 퍼센트가 i2 관측값으로 복귀.
    {
      const { error } = await admin.from('progress').delete().eq('lesson_id', PROBE_SLUG);
      if (error) throw new FatalError(`시나리오 i5 준비(delete) 실패 — Supabase 오류: ${error.message}`);

      const res = await fetchWithTimeout(`${BASE_URL}/`, { headers: { Cookie: cookieHeader } });
      const body = await res.text();
      const restoredOverallPercent = Number(extractAttrs(body, 'data-progress-percent')[0]);
      if (restoredOverallPercent !== beforeOverallPercent) {
        throw new FatalError(
          `시나리오 i5 실패 — 프로브 삭제 후 전체 퍼센트가 원래 값(${beforeOverallPercent})으로 복귀하지 않았습니다 (got ${restoredOverallPercent})`,
        );
      }
    }
    console.log('e2e-progress: i5/i 프로브 삭제 → 홈 전체 퍼센트 원상 복구 OK (TRACK-04)');

    // i6(신규, 08-06). 잠금 쿠키를 실은 채로 /curriculum을 원문 fetch(브라우저를
    // 거치지 않는다) → 응답 HTML에 data-progress-ui 문자열이 0건. h5(Step)·f(레슨)의
    // 커리큘럼 버전이다 — 정적 셸이 진도를 담지 않는다는 런타임 증명이다.
    {
      const res = await fetchWithTimeout(`${BASE_URL}/curriculum`, { headers: { Cookie: cookieHeader } });
      if (res.status !== 200) {
        throw new FatalError(`시나리오 i6 실패 — 잠금 쿠키 보유 정적 셸 커리큘럼 요청이 200이 아닙니다 (status=${res.status})`);
      }
      const body = await res.text();
      if (body.includes('data-progress-ui')) {
        throw new FatalError(
          '시나리오 i6 실패 — 쿠키가 있어도 정적 셸 HTML에는 진도가 없어야 하는데 data-progress-ui 마커가 원문에 존재합니다',
        );
      }
    }
    console.log('e2e-progress: i6/i 잠금 쿠키 + /curriculum 정적 셸 원문 fetch → data-progress-ui 마커 0건 OK (T-08-06-01)');

    // b. 쿠키 없이 GET(레슨 정적 셸 원문) — 진도 UI 마커 0건 + 레슨 제목은 존재
    // (D-18/D-20). 08-03부터 이 라우트는 완전 정적 셸이라 이 판정이 더 강하게
    // 참이 된다 — 서버가 애초에 쿠키를 읽지 않는다.
    {
      const res = await fetchWithTimeout(`${BASE_URL}/lesson/${PROBE_SLUG}`);
      if (res.status !== 200) {
        throw new FatalError(`시나리오 b 실패 — 쿠키 없는 정적 셸 레슨 요청이 200이 아닙니다 (status=${res.status})`);
      }
      const body = await res.text();
      if (body.includes('data-progress-ui')) {
        throw new FatalError('시나리오 b 실패 — 쿠키 없는 정적 셸 레슨 응답에 data-progress-ui 마커가 존재합니다 (D-20 위반)');
      }
      if (!body.includes(PROBE_LESSON.title)) {
        throw new FatalError('시나리오 b 실패 — 쿠키 없는 정적 셸 레슨 응답에 레슨 제목이 없습니다 (D-18 위반)');
      }
    }
    console.log('e2e-progress: b 쿠키 없음 → 레슨 정적 셸 원문에 진도 UI 마커 0건 + 레슨 제목 존재 OK');

    // c. 올바른 쿠키 + DB 미완료 → todo (08-03부터 수화 완료 후 DOM으로 확인한다 —
    // 완료 상태가 이제 서버 렌더가 아니라 GET /api/progress?lesson=<slug> 응답에서
    // 온다. renderedHtml()의 반환 타입이 기존 res.text()와 같은 HTML 문자열이라
    // downstream 문자열 어설션은 바뀌지 않는다.)
    {
      const body = await renderedHtml(browser, `${BASE_URL}/lesson/${PROBE_SLUG}`, { cookieValue: UNLOCK_SECRET });
      if (!body.includes('data-complete-state="todo"')) {
        throw new FatalError('시나리오 c 실패 — 쿠키 보유 + DB 미완료 상태인데 data-complete-state="todo"가 없습니다');
      }
    }
    console.log('e2e-progress: c 쿠키 있음 + DB 미완료 → todo 렌더 OK (수화 완료 후 DOM)');

    // d. service_role로 완료 upsert → done (TRACK-01 지속성의 증거)
    {
      const { error } = await admin
        .from('progress')
        .upsert({ lesson_id: PROBE_SLUG, completed_at: new Date().toISOString() });
      if (error) throw new FatalError(`시나리오 d 준비(upsert) 실패 — Supabase 오류: ${error.message}`);

      const body = await renderedHtml(browser, `${BASE_URL}/lesson/${PROBE_SLUG}`, { cookieValue: UNLOCK_SECRET });
      if (!body.includes('data-complete-state="done"')) {
        throw new FatalError(
          '시나리오 d 실패 — DB 완료 후에도 data-complete-state="done"이 렌더되지 않습니다 (TRACK-01)',
        );
      }
    }
    console.log('e2e-progress: d DB 완료 upsert → done 렌더 OK (TRACK-01)');

    // e. 그 행을 delete → todo로 복귀 (TRACK-02)
    {
      const { error } = await admin.from('progress').delete().eq('lesson_id', PROBE_SLUG);
      if (error) throw new FatalError(`시나리오 e 준비(delete) 실패 — Supabase 오류: ${error.message}`);

      const body = await renderedHtml(browser, `${BASE_URL}/lesson/${PROBE_SLUG}`, { cookieValue: UNLOCK_SECRET });
      if (!body.includes('data-complete-state="todo"')) {
        throw new FatalError('시나리오 e 실패 — DB 삭제 후에도 todo로 복귀하지 않습니다 (TRACK-02)');
      }
    }
    console.log('e2e-progress: e DB 삭제 → todo 복귀 OK (TRACK-02)');

    // f(신규, T-08-03-01/02). 잠금 쿠키를 실은 채로 레슨 라우트를 원문 fetch(브라우저를
    // 거치지 않는다) → 응답 HTML에 data-progress-ui와 data-notepad 둘 다 0건. h5의
    // 레슨 버전이다 — 정적 셸이 진도도 메모도 담지 않는다는 런타임 증명이다.
    {
      const res = await fetchWithTimeout(`${BASE_URL}/lesson/${PROBE_SLUG}`, {
        headers: { Cookie: cookieHeader },
      });
      if (res.status !== 200) {
        throw new FatalError(`시나리오 f 실패 — 잠금 쿠키 보유 정적 셸 레슨 요청이 200이 아닙니다 (status=${res.status})`);
      }
      const body = await res.text();
      if (body.includes('data-progress-ui')) {
        throw new FatalError(
          '시나리오 f 실패 — 쿠키가 있어도 레슨 정적 셸 원문에는 진도 마커가 없어야 하는데 data-progress-ui가 존재합니다',
        );
      }
      if (body.includes('data-notepad')) {
        throw new FatalError(
          '시나리오 f 실패 — 쿠키가 있어도 레슨 정적 셸 원문에는 메모 마커가 없어야 하는데 data-notepad가 존재합니다',
        );
      }
    }
    console.log('e2e-progress: f 잠금 쿠키 + 레슨 정적 셸 원문 fetch → data-progress-ui·data-notepad 마커 0건 OK (T-08-03-01/02)');

    // g(신규, SC1). 브라우저에서 완료 버튼을 실제로 클릭 → data-complete-state가
    // todo에서 done으로 즉시 바뀌고, 페이지를 새로 열어도(reload) done으로
    // 유지된다. c·d·e는 Supabase를 직접 조작한 뒤 페이지를 다시 여는 방식이라
    // "토글 → refresh → 슬롯 재렌더" 경로를 한 번도 지나가지 않는다 — 이 시나리오가
    // 그 경로를 실제로 증명한다.
    {
      const context = await browser.newContext();
      await context.addCookies([{ name: UNLOCK_COOKIE_NAME, value: UNLOCK_SECRET, url: BASE_URL }]);
      const page = await context.newPage();
      try {
        await page.goto(`${BASE_URL}/lesson/${PROBE_SLUG}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('[data-progress-island]');
        await page.waitForFunction(() => {
          const el = document.querySelector('[data-progress-island]');
          return el !== null && el.getAttribute('data-progress-state') !== 'loading';
        });
        const before = await page.evaluate(
          () => document.querySelector('[data-complete-state]')?.getAttribute('data-complete-state') ?? null,
        );
        if (before !== 'todo') {
          throw new FatalError(`시나리오 g 실패 — 클릭 전 상태가 todo가 아닙니다 (got ${before})`);
        }
        await page.click('[data-progress-ui="complete-button"] button');
        await page.waitForFunction(
          () => document.querySelector('[data-complete-state]')?.getAttribute('data-complete-state') === 'done',
        );
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForSelector('[data-progress-island]');
        await page.waitForFunction(() => {
          const el = document.querySelector('[data-progress-island]');
          return el !== null && el.getAttribute('data-progress-state') !== 'loading';
        });
        const afterReload = await page.evaluate(
          () => document.querySelector('[data-complete-state]')?.getAttribute('data-complete-state') ?? null,
        );
        if (afterReload !== 'done') {
          throw new FatalError(`시나리오 g 실패 — 재방문 후에도 done으로 유지되지 않습니다 (got ${afterReload})`);
        }
      } finally {
        await context.close();
        await deleteProbeRow(admin);
      }
    }
    console.log('e2e-progress: g 완료 버튼 클릭 → 즉시 done 반영 + 재방문 후에도 유지 OK (SC1)');

    // h. Step 페이지 시나리오 (02-03, TRACK-03)

    function extractHeaderBadgeCount(body) {
      // React SSR은 인접한 JSX 표현식 사이에 <!-- --> 마커를 끼워 넣는다
      // ("완료 <!-- -->0<!-- -->/<!-- -->10") — 정규식 매칭 전에 제거한다.
      const stripped = body.replace(/<!--\s*-->/g, '');
      const match = stripped.match(/완료\s*(\d+)\s*\/\s*(\d+)/);
      return match ? { completed: Number(match[1]), total: Number(match[2]) } : null;
    }

    // h1. 쿠키 없이 Step 페이지 GET → 진도 UI 마커 0건 + 모듈 아코디언(<details)은
    // 그대로 존재 (D-18 + D-20 동시 확인). 08-02부터 이 라우트는 완전 정적
    // 셸이라 이 판정이 더 강하게 참이 된다 — 서버가 애초에 쿠키를 읽지 않는다.
    {
      const res = await fetchWithTimeout(`${BASE_URL}/step/${PROBE_STEP_ID}`);
      if (res.status !== 200) {
        throw new FatalError(`시나리오 h1 실패 — 쿠키 없는 정적 셸 Step 요청이 200이 아닙니다 (status=${res.status})`);
      }
      const body = await res.text();
      if (body.includes('data-progress-ui')) {
        throw new FatalError('시나리오 h1 실패 — 쿠키 없는 정적 셸 Step 응답에 data-progress-ui 마커가 존재합니다 (D-20 위반)');
      }
      if (!body.includes('<details')) {
        throw new FatalError('시나리오 h1 실패 — 쿠키 없는 정적 셸 Step 응답에 모듈 아코디언(<details)이 없습니다 (D-18 위반)');
      }
    }
    console.log('e2e-progress: h1/f Step 정적 셸 쿠키 없음 → 진도 UI 마커 0건 + 아코디언 존재 OK');

    // h2. 잠금 쿠키로 GET(수화 완료 후 DOM) → 진행률 배지 마커 존재, "완료 " 접두 + "%" 포함
    let beforeStepCount;
    {
      const body = await renderedHtml(browser, `${BASE_URL}/step/${PROBE_STEP_ID}`, {
        cookieValue: UNLOCK_SECRET,
      });
      if (!body.includes('data-progress-ui="badge"') || !body.includes('완료 ') || !body.includes('%')) {
        throw new FatalError('시나리오 h2 실패 — 잠금 쿠키 보유 Step 응답(수화 완료 후 DOM)에 진행률 배지 마커/텍스트가 없습니다');
      }
      beforeStepCount = extractHeaderBadgeCount(body);
      if (!beforeStepCount) {
        throw new FatalError('시나리오 h2 실패 — Step 헤더 배지에서 "완료 n/total" 형식을 찾지 못했습니다');
      }
    }
    console.log(
      `e2e-progress: h2/f Step 잠금 쿠키 → 배지 마커 존재 OK (완료 ${beforeStepCount.completed}/${beforeStepCount.total})`,
    );

    // h3. service_role로 프로브 레슨 완료 처리 → Step 헤더 배지의 완료 개수가 1 증가
    {
      const { error } = await admin
        .from('progress')
        .upsert({ lesson_id: PROBE_SLUG, completed_at: new Date().toISOString() });
      if (error) throw new FatalError(`시나리오 h3 준비(upsert) 실패 — Supabase 오류: ${error.message}`);

      const body = await renderedHtml(browser, `${BASE_URL}/step/${PROBE_STEP_ID}`, {
        cookieValue: UNLOCK_SECRET,
      });
      if (!body.includes('data-progress-ui="lesson-done"')) {
        throw new FatalError('시나리오 h3 실패 — 완료 처리 후 완료 행 마커(data-progress-ui="lesson-done")가 없습니다');
      }
      const afterStepCount = extractHeaderBadgeCount(body);
      if (!afterStepCount || afterStepCount.completed !== beforeStepCount.completed + 1) {
        throw new FatalError(
          `시나리오 h3 실패 — Step 헤더 배지의 완료 개수가 1 증가하지 않았습니다 (before=${beforeStepCount.completed}, after=${afterStepCount?.completed})`,
        );
      }
    }
    console.log('e2e-progress: h3/f 프로브 완료 처리 → Step 헤더 배지 완료 개수 +1 OK (TRACK-03)');

    // h4. 프로브 행 삭제(원상 복구) → 완료 개수가 원래 값으로 돌아옴
    {
      const { error } = await admin.from('progress').delete().eq('lesson_id', PROBE_SLUG);
      if (error) throw new FatalError(`시나리오 h4 준비(delete) 실패 — Supabase 오류: ${error.message}`);

      const body = await renderedHtml(browser, `${BASE_URL}/step/${PROBE_STEP_ID}`, {
        cookieValue: UNLOCK_SECRET,
      });
      const restoredStepCount = extractHeaderBadgeCount(body);
      if (!restoredStepCount || restoredStepCount.completed !== beforeStepCount.completed) {
        throw new FatalError(
          `시나리오 h4 실패 — 프로브 삭제 후 완료 개수가 원래 값(${beforeStepCount.completed})으로 복귀하지 않았습니다 (got ${restoredStepCount?.completed})`,
        );
      }
    }
    console.log('e2e-progress: h4/f 프로브 삭제 → Step 헤더 배지 완료 개수 원상 복구 OK');

    // h5(신규, T-08-02-03). 잠금 쿠키를 실은 채로 /step/1을 원문 fetch(브라우저를
    // 거치지 않는다) → 응답 HTML에 data-progress-ui 문자열이 0건. 정적 전환이
    // 실제로 이뤄졌다는 증거이자, 정적 셸이 사용자별 상태를 담지 않는다는 캐시
    // 오염 방어의 런타임 증명이다.
    {
      const res = await fetchWithTimeout(`${BASE_URL}/step/${PROBE_STEP_ID}`, {
        headers: { Cookie: cookieHeader },
      });
      if (res.status !== 200) {
        throw new FatalError(`시나리오 h5 실패 — 잠금 쿠키 보유 정적 셸 Step 요청이 200이 아닙니다 (status=${res.status})`);
      }
      const body = await res.text();
      if (body.includes('data-progress-ui')) {
        throw new FatalError(
          '시나리오 h5 실패 — 쿠키가 있어도 정적 셸 HTML에는 진도가 없어야 하는데 data-progress-ui 마커가 원문에 존재합니다',
        );
      }
    }
    console.log('e2e-progress: h5/f 잠금 쿠키 + 정적 셸 원문 fetch → data-progress-ui 마커 0건 OK (T-08-02-03)');

    // g. /unlock 발급 경로 — 리다이렉트를 따라가지 않고 응답 헤더를 직접 본다.
    let issuedUnlockCookiePair = null;
    {
      const res = await fetchWithTimeout(
        `${BASE_URL}/unlock?key=${encodeURIComponent(UNLOCK_SECRET)}`,
        { redirect: 'manual' },
      );
      if (res.status < 300 || res.status >= 400) {
        throw new FatalError(`시나리오 g1 실패 — 올바른 key인데 3xx가 아닙니다 (status=${res.status})`);
      }
      const location = res.headers.get('location') ?? '';
      if (!location.includes('state=ok')) {
        throw new FatalError(`시나리오 g1 실패 — Location이 성공 상태를 가리키지 않습니다`);
      }
      const setCookie = res.headers.get('set-cookie') ?? '';
      if (!setCookie.includes(`${UNLOCK_COOKIE_NAME}=`) || !/HttpOnly/i.test(setCookie)) {
        throw new FatalError('시나리오 g1 실패 — 잠금 쿠키에 HttpOnly 속성이 없거나 쿠키가 발급되지 않았습니다');
      }
      issuedUnlockCookiePair = setCookie.split(';')[0];
    }
    console.log('e2e-progress: g1/f /unlock?key=<올바른 값> → HttpOnly 잠금 쿠키 발급 OK');

    {
      const lastChar = UNLOCK_SECRET.slice(-1);
      const wrongKey = `${UNLOCK_SECRET.slice(0, -1)}${lastChar === 'a' ? 'b' : 'a'}`;
      const res = await fetchWithTimeout(`${BASE_URL}/unlock?key=${encodeURIComponent(wrongKey)}`, {
        redirect: 'manual',
      });
      if (res.status < 300 || res.status >= 400) {
        throw new FatalError(`시나리오 g2 실패 — 틀린 key인데 3xx가 아닙니다 (status=${res.status})`);
      }
      const location = res.headers.get('location') ?? '';
      if (!location.includes('state=invalid')) {
        throw new FatalError('시나리오 g2 실패 — Location이 실패 상태를 가리키지 않습니다');
      }
      if (res.headers.get('set-cookie')) {
        throw new FatalError('시나리오 g2 실패 — 틀린 key인데 Set-Cookie가 응답에 섞였습니다');
      }
    }
    console.log('e2e-progress: g2/f /unlock?key=<틀린 값> → 쿠키 미발급 OK');

    {
      const res = await fetchWithTimeout(`${BASE_URL}/unlock`, { redirect: 'manual' });
      const location = res.headers.get('location') ?? '';
      if (!location.includes('state=invalid') || res.headers.get('set-cookie')) {
        throw new FatalError('시나리오 g3 실패 — key 없는 /unlock 요청이 실패 상태로 처리되지 않습니다');
      }
    }
    console.log('e2e-progress: g3/f /unlock(key 없음) → 실패 상태 처리 OK');

    // 발급된 쿠키를 재사용해 레슨 페이지에 진도 UI가 렌더되는지 확인 — 발급된
    // 쿠키가 실제로 게이트를 통과한다는 증거.
    //
    // 08-08: 레슨 페이지가 08-03에서 완전 정적으로 전환된 뒤에는 원문 fetch에
    // 진도 마커가 아예 없는 것이 올바른 동작이다(f 시나리오가 바로 그 계약을
    // 검사한다) — 이 검사가 raw fetch로 'data-progress-ui' 존재를 기대하는 것은
    // 정적 전환 이전에 쓰인 낡은 어설션이었다. h2~h4/i2~i5와 같은 방식으로
    // renderedHtml()(수화 완료 후 DOM)로 바꿔 실제로 쿠키가 게이트를 통과함을
    // 검사한다.
    {
      if (!issuedUnlockCookiePair) {
        throw new FatalError('시나리오 g4 실패 — g1에서 쿠키를 확보하지 못했습니다');
      }
      const issuedCookieValue = issuedUnlockCookiePair.split('=').slice(1).join('=');
      const body = await renderedHtml(browser, `${BASE_URL}/lesson/${PROBE_SLUG}`, {
        cookieValue: issuedCookieValue,
      });
      if (!body.includes('data-progress-ui')) {
        throw new FatalError('시나리오 g4 실패 — /unlock이 발급한 쿠키로 요청해도 진도 UI가 렌더되지 않습니다');
      }
    }
    console.log('e2e-progress: g4/f /unlock 발급 쿠키 재사용 → 레슨 페이지 진도 UI 렌더 OK (수화 후 DOM)');

    // /unlock/done 두 상태 화면이 각각 UI-SPEC 제목을 담고 있는지 확인.
    {
      const okRes = await fetchWithTimeout(`${BASE_URL}/unlock/done?state=ok`);
      const okBody = await okRes.text();
      if (!okBody.includes('잠금 해제됐어요')) {
        throw new FatalError('시나리오 g5 실패 — /unlock/done?state=ok에 성공 제목이 없습니다');
      }
      const invalidRes = await fetchWithTimeout(`${BASE_URL}/unlock/done?state=invalid`);
      const invalidBody = await invalidRes.text();
      if (!invalidBody.includes('유효하지 않은 링크예요')) {
        throw new FatalError('시나리오 g5 실패 — /unlock/done?state=invalid에 실패 제목이 없습니다');
      }
    }
    console.log('e2e-progress: g5/f /unlock/done 성공·실패 화면 문구 OK');

    console.log(
      'e2e-progress: 모든 시나리오 통과 — 완료 토글과 /unlock 잠금 해제 흐름이 브라우저 → 쿠키 게이트 → Supabase → 서버 재렌더까지 왕복합니다.',
    );
  } finally {
    // f. 정리 — 프로브 행 삭제, 브라우저·서버 프로세스 트리 종료
    await deleteProbeRow(admin);
    if (browser) {
      await browser.close().catch(() => {});
    }
    killServerTree(child);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(`e2e-progress: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
