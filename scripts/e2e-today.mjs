#!/usr/bin/env node
// 실제 개발 서버를 띄워 "오늘의 학습" 경로(매니페스트 → today.ts/schedule.ts →
// force-dynamic RSC → 렌더된 HTML)가 실제로 왕복하는지 확인하는 종단 게이트.
// 실행: node --env-file=.env.local scripts/e2e-today.mjs
//
// 앱 코드(curriculum-helpers.ts/schedule.ts/today.ts)를 import하지 않고
// .velite/lessons.json + src/content/modules.ts 정규식 재파싱으로 기대 일정을
// 독립 계산한다 — 같은 함수를 재사용하면 계산이 틀려도 검증이 같이 틀린다.
//
// 어떤 출력에도 쿠키 값·시크릿을 찍지 않는다.

import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// src/lib/unlock-secret.ts의 UNLOCK_COOKIE_NAME과 반드시 일치해야 한다 — 이
// 스크립트는 순수 TS 모듈을 Node에서 직접 로드할 수 없어(ts-node/tsx 미설치)
// 상수를 재선언한다(e2e-progress.mjs와 같은 이유).
const UNLOCK_COOKIE_NAME = 'runway_unlock';

// src/lib/schedule.ts의 SCHEDULE_START/COURSE_START_DATE와 반드시 일치해야
// 한다 — 앱 코드를 import하지 않고 독립적으로 기대값을 계산하기 위해 재선언한다.
const SCHEDULE_START = '2026-08-25';

const PORT = process.env.E2E_PORT ? Number(process.env.E2E_PORT) : 3211;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 180_000;
const FETCH_TIMEOUT_MS = 30_000;

class FatalError extends Error {}

// --- 필수 환경 변수 부재 시 즉시 오류 종료 (기본값으로 넘어가지 않는다) ---
// admin.ts가 모듈 로드 시점에 SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY를 검증하므로
// 비어 있으면 dev 서버가 어떤 페이지도 렌더하지 못한다(precondition).

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
      `e2e-today: ${name} 환경 변수가 비어 있습니다. \`node --env-file=.env.local scripts/e2e-today.mjs\`로 실행하세요.`,
    );
    process.exit(1);
  }
}

function readLessonsManifest() {
  const lessonsPath = path.join(ROOT, '.velite', 'lessons.json');
  if (!fs.existsSync(lessonsPath)) {
    console.error(
      `e2e-today: ${path.relative(ROOT, lessonsPath)}가 없습니다. \`npm run dev\` 또는 \`npm run build\`를 한 번 실행해 Velite 매니페스트를 생성한 뒤 다시 시도하세요.`,
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
}

// check-manifest.mjs/e2e-progress.mjs와 같은 방식으로 modules.ts를 정규식으로
// 재파싱한다 — curriculum-helpers.ts를 import하지 않는다.
function readModuleOrderMap() {
  const modulesTsPath = path.join(ROOT, 'src', 'content', 'modules.ts');
  const source = fs.readFileSync(modulesTsPath, 'utf8');
  const map = new Map();
  for (const match of source.matchAll(/id:\s*'([0-9]-[0-9])'[^}]*?order:\s*(\d+)/g)) {
    map.set(match[1], Number(match[2]));
  }
  return map;
}

// getOrderedLessons()와 동일한 (stepId, 모듈 order, 레슨 order) 3단 정렬을
// 독립적으로 재현한다.
function computeOrderedSlugs() {
  const lessons = readLessonsManifest();
  const moduleOrderMap = readModuleOrderMap();
  const ordered = [...lessons].sort((a, b) => {
    if (a.stepId !== b.stepId) return a.stepId - b.stepId;
    const am = moduleOrderMap.get(a.moduleId) ?? 0;
    const bm = moduleOrderMap.get(b.moduleId) ?? 0;
    if (am !== bm) return am - bm;
    return a.order - b.order;
  });
  return ordered.map((l) => l.slug);
}

// buildSchedule()과 동일한 Date.UTC 산술을 독립적으로 재현한다 — schedule.ts를
// import하지 않는다(같은 함수를 재사용하면 계산이 틀려도 검증이 같이 틀린다).
function computeScheduleRows(orderedSlugs, startDateISO) {
  const totalDays = orderedSlugs.length + 1;
  const [y, m, d] = startDateISO.split('-').map(Number);
  const rows = [];
  for (let i = 0; i < totalDays; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const dateStr = dt.toISOString().slice(0, 10);
    const lessonSlug = i < orderedSlugs.length ? orderedSlugs[i] : null;
    rows.push({ date: dateStr, lessonSlug, isBuffer: lessonSlug === null });
  }
  return rows;
}

const LESSONS = readLessonsManifest();
const LESSON_BY_SLUG = new Map(LESSONS.map((l) => [l.slug, l]));

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

// React SSR은 인접한 JSX 표현식 사이에 <!-- --> 마커를 끼워 넣는다 — 정규식
// 매칭 전에 제거한다(e2e-progress.mjs의 extractAttrs와 동일 원리).
function stripSsrComments(body) {
  return body.replace(/<!--\s*-->/g, '');
}

function countOccurrences(body, needle) {
  return body.split(needle).length - 1;
}

async function main() {
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
    console.log('e2e-today: 개발 서버 기동 완료');

    // --- t1. 쿠키 없이 GET / → 200, dday 1건, today-card 1건, 진도 마커 0건 (D-37/D-20) ---
    {
      const res = await fetchWithTimeout(`${BASE_URL}/`);
      if (res.status !== 200) {
        throw new FatalError(`시나리오 t1 실패 — 쿠키 없는 홈 요청이 200이 아닙니다 (status=${res.status})`);
      }
      const body = stripSsrComments(await res.text());
      const ddayCount = countOccurrences(body, 'data-schedule-ui="dday"');
      const todayCardCount = countOccurrences(body, 'data-schedule-ui="today-card"');
      if (ddayCount !== 1) {
        throw new FatalError(`시나리오 t1 실패 — data-schedule-ui="dday" 마커가 1건이 아닙니다 (got ${ddayCount})`);
      }
      if (todayCardCount !== 1) {
        throw new FatalError(
          `시나리오 t1 실패 — data-schedule-ui="today-card" 마커가 1건이 아닙니다 (got ${todayCardCount})`,
        );
      }
      if (body.includes('data-progress-ui')) {
        throw new FatalError('시나리오 t1 실패 — 쿠키 없는 홈 응답에 data-progress-ui 마커가 존재합니다 (D-20 위반)');
      }
    }
    console.log('e2e-today: t1/5 홈 쿠키 없음 → dday 1건 + today-card 1건 + 진도 마커 0건 OK');

    // --- t2. 오늘 날짜를 독립 계산해 분기별 본문 확인 (SCHED-01/02 경계) ---
    {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
      const orderedSlugs = computeOrderedSlugs();
      const rows = computeScheduleRows(orderedSlugs, SCHEDULE_START);
      const todayRow = rows.find((r) => r.date === today) ?? null;

      const res = await fetchWithTimeout(`${BASE_URL}/`);
      const body = stripSsrComments(await res.text());

      if (todayRow && !todayRow.isBuffer) {
        const lesson = LESSON_BY_SLUG.get(todayRow.lessonSlug);
        if (!lesson) {
          throw new FatalError(`시나리오 t2 실패 — 매니페스트에서 오늘 배정 slug(${todayRow.lessonSlug})를 찾지 못했습니다`);
        }
        if (!body.includes(`href="/lesson/${todayRow.lessonSlug}"`)) {
          throw new FatalError(`시나리오 t2 실패 — 오늘 배정 레슨 링크(/lesson/${todayRow.lessonSlug})가 없습니다`);
        }
        if (!body.includes(lesson.title)) {
          throw new FatalError('시나리오 t2 실패 — 오늘 배정 레슨 제목이 본문에 없습니다');
        }
      } else if (todayRow && todayRow.isBuffer) {
        if (!body.includes('복습·정리일')) {
          throw new FatalError('시나리오 t2 실패 — 버퍼일(9/29) 상태 문구가 없습니다');
        }
      } else if (today < SCHEDULE_START) {
        if (!body.includes('곧 시작해요')) {
          throw new FatalError('시나리오 t2 실패 — 시작 전(before-start) 상태 문구가 없습니다');
        }
      } else {
        if (!body.includes('개강했어요!')) {
          throw new FatalError('시나리오 t2 실패 — 범위 이후(after-range) 상태 문구가 없습니다');
        }
      }
    }
    console.log('e2e-today: t2/5 오늘 날짜 분기별 홈 상태 문구/링크 OK');

    // --- t3. 쿠키 없이 GET /curriculum → 200, /step/1~3 링크 3건 (D-18/D-37) ---
    {
      const res = await fetchWithTimeout(`${BASE_URL}/curriculum`);
      if (res.status !== 200) {
        throw new FatalError(`시나리오 t3 실패 — 쿠키 없는 /curriculum 요청이 200이 아닙니다 (status=${res.status})`);
      }
      const body = stripSsrComments(await res.text());
      for (const stepId of [1, 2, 3]) {
        if (!body.includes(`href="/step/${stepId}"`)) {
          throw new FatalError(`시나리오 t3 실패 — /curriculum 응답에 /step/${stepId} 링크가 없습니다`);
        }
      }
      if (body.includes('data-progress-ui')) {
        throw new FatalError('시나리오 t3 실패 — 쿠키 없는 /curriculum 응답에 data-progress-ui 마커가 존재합니다 (D-20 위반)');
      }
    }
    console.log('e2e-today: t3/5 /curriculum 쿠키 없음 → Step 링크 3건 + 진도 마커 0건 OK');

    // --- t4. 쿠키 포함 GET /curriculum → data-progress-ui="step-bar" 3건 (T-03-01) ---
    {
      const cookieHeader = `${UNLOCK_COOKIE_NAME}=${UNLOCK_SECRET}`;
      const res = await fetchWithTimeout(`${BASE_URL}/curriculum`, { headers: { Cookie: cookieHeader } });
      const body = stripSsrComments(await res.text());
      const stepBarCount = countOccurrences(body, 'data-progress-ui="step-bar"');
      if (stepBarCount !== 3) {
        throw new FatalError(`시나리오 t4 실패 — /curriculum Step 진행률 바 마커가 3건이 아닙니다 (got ${stepBarCount})`);
      }
    }
    console.log('e2e-today: t4/5 /curriculum 쿠키 있음 → Step 진행률 바 3건 OK');

    // --- t5. GET / 본문에 내비 4개 href 모두 존재 (D-09) ---
    {
      const res = await fetchWithTimeout(`${BASE_URL}/`);
      const body = stripSsrComments(await res.text());
      for (const href of ['href="/"', 'href="/curriculum"', 'href="/schedule"', 'href="/about"']) {
        if (!body.includes(href)) {
          throw new FatalError(`시나리오 t5 실패 — 내비 링크(${href})가 홈 응답에 없습니다`);
        }
      }
    }
    console.log('e2e-today: t5/5 내비 4개 href 전부 존재 OK');

    console.log(
      'e2e-today: 모든 시나리오 통과 — 매니페스트 → today.ts/schedule.ts → force-dynamic RSC → 렌더된 HTML까지 왕복 확인.',
    );
  } finally {
    killServerTree(child);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(`e2e-today: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
