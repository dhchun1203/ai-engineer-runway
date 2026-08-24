#!/usr/bin/env node
// 실제 개발 서버를 띄워 완료 토글이 브라우저 요청 → 쿠키 게이트 → Server Action
// 재검증 → Supabase 저장 → 서버 재렌더까지 왕복하는지 확인하는 종단 게이트.
// 실행: node --env-file=.env.local scripts/e2e-progress.mjs
//
// src/lib/supabase/admin.ts를 import하지 않는다 — check-supabase-progress.mjs와
// 같은 이유로, 이 스크립트는 @supabase/supabase-js의 createClient를 직접 호출한다.
//
// 어떤 출력에도 쿠키 값·시크릿을 찍지 않는다.

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

  try {
    try {
      await waitForServerReady();
    } catch (e) {
      throw new FatalError(
        `${e.message}\n--- 서버 출력(마지막 부분) ---\n${serverOutput.join('').slice(-4000)}`,
      );
    }
    console.log(`e2e-progress: 개발 서버 기동 완료 (probe lesson: ${PROBE_SLUG})`);

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
      // 홈 페이지에는 이어서 학습하기 CTA 말고 다른 /lesson/ 링크가 없다
      // (Step 카드는 /step/N을 가리킨다) — 유일한 href만 뽑으면 된다.
      const stripped = body.replace(/<!--\s*-->/g, '');
      const match = stripped.match(/href="\/lesson\/([a-z0-9-]+)"/);
      return match ? match[1] : null;
    }

    // i1. 쿠키 없이 홈 GET → 진도 UI 마커 0건, Step 링크 3개, 사이트 제목 존재 (D-18+D-20)
    {
      const res = await fetchWithTimeout(`${BASE_URL}/`);
      if (res.status !== 200) {
        throw new FatalError(`시나리오 i1 실패 — 쿠키 없는 홈 요청이 200이 아닙니다 (status=${res.status})`);
      }
      const body = await res.text();
      if (body.includes('data-progress-ui')) {
        throw new FatalError('시나리오 i1 실패 — 쿠키 없는 홈 응답에 data-progress-ui 마커가 존재합니다 (D-20 위반)');
      }
      for (const stepId of [1, 2, 3]) {
        if (!body.includes(`href="/step/${stepId}"`)) {
          throw new FatalError(`시나리오 i1 실패 — 쿠키 없는 홈 응답에 /step/${stepId} 링크가 없습니다 (D-18 위반)`);
        }
      }
      if (!body.includes('AI Engineer Runway')) {
        throw new FatalError('시나리오 i1 실패 — 쿠키 없는 홈 응답에 사이트 제목이 없습니다 (D-18 위반)');
      }
    }
    console.log('e2e-progress: i1/i 홈 쿠키 없음 → 진도 UI 마커 0건 + Step 링크 3개 + 사이트 제목 존재 OK');

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
      const stepBarCount = (body.match(/data-progress-ui="step-bar"/g) || []).length;
      if (stepBarCount !== 3) {
        throw new FatalError(`시나리오 i2 실패 — Step 진행률 바 마커가 3개가 아닙니다 (got ${stepBarCount})`);
      }
      const percentAttrs = extractAttrs(body, 'data-progress-percent');
      if (percentAttrs.length !== 1) {
        throw new FatalError(`시나리오 i2 실패 — data-progress-percent 속성을 정확히 1개 찾지 못했습니다 (got ${percentAttrs.length})`);
      }
      beforeOverallPercent = Number(percentAttrs[0]);
      beforeStepPercents = extractAttrs(body, 'data-step-percent').map(Number);
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
      afterStepPercents = extractAttrs(body, 'data-step-percent').map(Number);

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

    // b. 쿠키 없이 GET — 진도 UI 마커 0건 + 레슨 제목은 존재 (D-18/D-20)
    {
      const res = await fetchWithTimeout(`${BASE_URL}/lesson/${PROBE_SLUG}`);
      if (res.status !== 200) {
        throw new FatalError(`시나리오 b 실패 — 쿠키 없는 요청이 200이 아닙니다 (status=${res.status})`);
      }
      const body = await res.text();
      if (body.includes('data-progress-ui')) {
        throw new FatalError('시나리오 b 실패 — 쿠키 없는 응답에 data-progress-ui 마커가 존재합니다 (D-20 위반)');
      }
      if (!body.includes(PROBE_LESSON.title)) {
        throw new FatalError('시나리오 b 실패 — 쿠키 없는 응답에 레슨 제목이 없습니다 (D-18 위반)');
      }
    }
    console.log('e2e-progress: b/f 쿠키 없음 → 진도 UI 마커 0건 + 레슨 제목 존재 OK');

    // c. 올바른 쿠키 + DB 미완료 → todo
    {
      const res = await fetchWithTimeout(`${BASE_URL}/lesson/${PROBE_SLUG}`, {
        headers: { Cookie: cookieHeader },
      });
      const body = await res.text();
      if (!body.includes('data-complete-state="todo"')) {
        throw new FatalError('시나리오 c 실패 — 쿠키 보유 + DB 미완료 상태인데 data-complete-state="todo"가 없습니다');
      }
    }
    console.log('e2e-progress: c/f 쿠키 있음 + DB 미완료 → todo 렌더 OK');

    // d. service_role로 완료 upsert → done (TRACK-01 지속성의 서버 렌더 증거)
    {
      const { error } = await admin
        .from('progress')
        .upsert({ lesson_id: PROBE_SLUG, completed_at: new Date().toISOString() });
      if (error) throw new FatalError(`시나리오 d 준비(upsert) 실패 — Supabase 오류: ${error.message}`);

      const res = await fetchWithTimeout(`${BASE_URL}/lesson/${PROBE_SLUG}`, {
        headers: { Cookie: cookieHeader },
      });
      const body = await res.text();
      if (!body.includes('data-complete-state="done"')) {
        throw new FatalError(
          '시나리오 d 실패 — DB 완료 후에도 data-complete-state="done"이 렌더되지 않습니다 (TRACK-01)',
        );
      }
    }
    console.log('e2e-progress: d/f DB 완료 upsert → done 렌더 OK (TRACK-01)');

    // e. 그 행을 delete → todo로 복귀 (TRACK-02)
    {
      const { error } = await admin.from('progress').delete().eq('lesson_id', PROBE_SLUG);
      if (error) throw new FatalError(`시나리오 e 준비(delete) 실패 — Supabase 오류: ${error.message}`);

      const res = await fetchWithTimeout(`${BASE_URL}/lesson/${PROBE_SLUG}`, {
        headers: { Cookie: cookieHeader },
      });
      const body = await res.text();
      if (!body.includes('data-complete-state="todo"')) {
        throw new FatalError('시나리오 e 실패 — DB 삭제 후에도 todo로 복귀하지 않습니다 (TRACK-02)');
      }
    }
    console.log('e2e-progress: e/f DB 삭제 → todo 복귀 OK (TRACK-02)');

    // h. Step 페이지 시나리오 (02-03, TRACK-03)

    function extractHeaderBadgeCount(body) {
      // React SSR은 인접한 JSX 표현식 사이에 <!-- --> 마커를 끼워 넣는다
      // ("완료 <!-- -->0<!-- -->/<!-- -->10") — 정규식 매칭 전에 제거한다.
      const stripped = body.replace(/<!--\s*-->/g, '');
      const match = stripped.match(/완료\s*(\d+)\s*\/\s*(\d+)/);
      return match ? { completed: Number(match[1]), total: Number(match[2]) } : null;
    }

    // h1. 쿠키 없이 Step 페이지 GET → 진도 UI 마커 0건 + 모듈 아코디언(<details)은
    // 그대로 존재 (D-18 + D-20 동시 확인)
    {
      const res = await fetchWithTimeout(`${BASE_URL}/step/${PROBE_STEP_ID}`);
      if (res.status !== 200) {
        throw new FatalError(`시나리오 h1 실패 — 쿠키 없는 Step 요청이 200이 아닙니다 (status=${res.status})`);
      }
      const body = await res.text();
      if (body.includes('data-progress-ui')) {
        throw new FatalError('시나리오 h1 실패 — 쿠키 없는 Step 응답에 data-progress-ui 마커가 존재합니다 (D-20 위반)');
      }
      if (!body.includes('<details')) {
        throw new FatalError('시나리오 h1 실패 — 쿠키 없는 Step 응답에 모듈 아코디언(<details)이 없습니다 (D-18 위반)');
      }
    }
    console.log('e2e-progress: h1/f Step 쿠키 없음 → 진도 UI 마커 0건 + 아코디언 존재 OK');

    // h2. 잠금 쿠키로 GET → 진행률 배지 마커 존재, "완료 " 접두 + "%" 포함
    let beforeStepCount;
    {
      const res = await fetchWithTimeout(`${BASE_URL}/step/${PROBE_STEP_ID}`, {
        headers: { Cookie: cookieHeader },
      });
      const body = await res.text();
      if (!body.includes('data-progress-ui="badge"') || !body.includes('완료 ') || !body.includes('%')) {
        throw new FatalError('시나리오 h2 실패 — 잠금 쿠키 보유 Step 응답에 진행률 배지 마커/텍스트가 없습니다');
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

      const res = await fetchWithTimeout(`${BASE_URL}/step/${PROBE_STEP_ID}`, {
        headers: { Cookie: cookieHeader },
      });
      const body = await res.text();
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

      const res = await fetchWithTimeout(`${BASE_URL}/step/${PROBE_STEP_ID}`, {
        headers: { Cookie: cookieHeader },
      });
      const body = await res.text();
      const restoredStepCount = extractHeaderBadgeCount(body);
      if (!restoredStepCount || restoredStepCount.completed !== beforeStepCount.completed) {
        throw new FatalError(
          `시나리오 h4 실패 — 프로브 삭제 후 완료 개수가 원래 값(${beforeStepCount.completed})으로 복귀하지 않았습니다 (got ${restoredStepCount?.completed})`,
        );
      }
    }
    console.log('e2e-progress: h4/f 프로브 삭제 → Step 헤더 배지 완료 개수 원상 복구 OK');

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
    {
      if (!issuedUnlockCookiePair) {
        throw new FatalError('시나리오 g4 실패 — g1에서 쿠키를 확보하지 못했습니다');
      }
      const res = await fetchWithTimeout(`${BASE_URL}/lesson/${PROBE_SLUG}`, {
        headers: { Cookie: issuedUnlockCookiePair },
      });
      const body = await res.text();
      if (!body.includes('data-progress-ui')) {
        throw new FatalError('시나리오 g4 실패 — /unlock이 발급한 쿠키로 요청해도 진도 UI가 렌더되지 않습니다');
      }
    }
    console.log('e2e-progress: g4/f /unlock 발급 쿠키 재사용 → 레슨 페이지 진도 UI 렌더 OK');

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
    // f. 정리 — 프로브 행 삭제, 서버 프로세스 트리 종료
    await deleteProbeRow(admin);
    killServerTree(child);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(`e2e-progress: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
