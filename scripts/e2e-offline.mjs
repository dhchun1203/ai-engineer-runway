#!/usr/bin/env node
// 오프라인 모드 브라우저 게이트(docs/superpowers/specs/2026-09-23-offline-mode-design.md 5절).
// e2e-lesson-note.mjs의 부트스트랩(서버 spawn/대기/Windows taskkill 종료/FatalError/finally
// 정리/"검사 0건 = 실패"/한국어 로그)을 복제한다. 기존 게이트처럼 공유 모듈로 빼지 않는다.
//
// 다른 게이트와 다른 점 두 가지.
// 1) 개발 서버가 아니라 프로덕션 서버(next start)를 띄운다. 서비스 워커는 production에서만
//    등록되고(offline-runtime.tsx), 개발 서버(Turbopack)의 청크 주소는 해시가 아니라 캐시
//    먼저 전략과 맞지 않는다. 그래서 호출자가 먼저 `npm run build`를 해 둬야 한다.
// 2) 시크릿 쿠키(runway_unlock)가 아니라 테스터 계정으로 실제 로그인한다. 대기열 동기화는
//    Server Action이 로그인 사용자 id로 저장하는데, 시크릿 쿠키에는 사용자 id가 없다.
//
// "오프라인"은 두 겹으로 만든다. context.setOffline(true)(navigator.onLine과 offline 이벤트)와
// 서버 프로세스 종료(서비스 워커의 네트워크 요청까지 확실히 실패). 복귀는 서버 재기동 후
// setOffline(false).
//
// 실행: E2E_TESTER_EMAIL=... E2E_TESTER_PASSWORD=... node --env-file=.env.local scripts/e2e-offline.mjs
// (값은 테스터 계정. 문서와 코드에 쓰지 않는다.)
// 포트 3218(3210~3217은 기존 게이트). E2E_OFFLINE_PORT로 덮어쓸 수 있다.
// 테스터의 프로브 레슨 완료 행과 메모 행을 시작 때 백업하고 finally에서 복원한다.
// 어떤 출력에도 쿠키 값, 비밀번호, 이메일을 찍지 않는다.

import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const LOG = 'e2e-offline';
const PORT = process.env.E2E_OFFLINE_PORT ? Number(process.env.E2E_OFFLINE_PORT) : 3218;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 180_000;
const FETCH_TIMEOUT_MS = 30_000;

class FatalError extends Error {}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TESTER_EMAIL = process.env.E2E_TESTER_EMAIL;
const TESTER_PASSWORD = process.env.E2E_TESTER_PASSWORD;

for (const [name, value] of [
  ['SUPABASE_URL', SUPABASE_URL],
  ['SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY],
  ['E2E_TESTER_EMAIL', TESTER_EMAIL],
  ['E2E_TESTER_PASSWORD', TESTER_PASSWORD],
]) {
  if (!value) {
    console.error(
      `${LOG}: ${name} 환경 변수가 비어 있습니다. \`E2E_TESTER_EMAIL=... E2E_TESTER_PASSWORD=... node --env-file=.env.local scripts/e2e-offline.mjs\`로 실행하세요.`,
    );
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(ROOT, '.next', 'BUILD_ID'))) {
  console.error(`${LOG}: .next/BUILD_ID가 없습니다. 먼저 \`npm run build\`를 실행하세요(이 게이트는 next start로 돈다).`);
  process.exit(1);
}

// 앱 코드를 import하지 않는다. .velite/lessons.json을 독립 재파싱한다.
function readLessonsManifest() {
  const lessonsPath = path.join(ROOT, '.velite', 'lessons.json');
  if (!fs.existsSync(lessonsPath)) {
    console.error(`${LOG}: ${path.relative(ROOT, lessonsPath)}가 없습니다. \`npm run build\`를 먼저 실행하세요.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
}

const LESSONS = readLessonsManifest();
const PROBE_LESSON = LESSONS.find((l) => l.hasContent === true);
if (!PROBE_LESSON) {
  console.error(`${LOG}: hasContent가 참인 레슨을 매니페스트에서 찾지 못했습니다.`);
  process.exit(1);
}
const PROBE_SLUG = PROBE_LESSON.slug;
const PROBE_ROUTE = `/lesson/${PROBE_SLUG}`;

// 옛 빌드 캐시 옮기기(M)에 쓰는 레슨. 프로브와 다른, 본문이 있는 마지막 레슨.
const MIGRATION_LESSON = [...LESSONS].reverse().find((l) => l.hasContent === true && l.slug !== PROBE_SLUG);
if (!MIGRATION_LESSON) {
  console.error(`${LOG}: 옮기기 검사에 쓸 두 번째 레슨(hasContent)을 매니페스트에서 찾지 못했습니다.`);
  process.exit(1);
}
const MIGRATION_ROUTE = `/lesson/${MIGRATION_LESSON.slug}`;
const OLD_CACHE_NAME = 'offline-old';

// AI 뜯어보기(그림이 움직이는 편) 검사(C5)에 쓰는 개념. .velite/concepts.json의 첫 편(order 순).
function readFirstConceptSlug() {
  const conceptsPath = path.join(ROOT, '.velite', 'concepts.json');
  if (!fs.existsSync(conceptsPath)) {
    console.error(`${LOG}: ${path.relative(ROOT, conceptsPath)}가 없습니다. \`npm run build\`를 먼저 실행하세요.`);
    process.exit(1);
  }
  const concepts = JSON.parse(fs.readFileSync(conceptsPath, 'utf8'));
  const first = [...concepts].sort((a, b) => a.order - b.order)[0];
  if (!first) {
    console.error(`${LOG}: 개념 매니페스트가 비어 있습니다.`);
    process.exit(1);
  }
  return first.slug;
}
const CONCEPT_ROUTE = `/concepts/${readFirstConceptSlug()}`;

// 아티클/베이스캠프 메모의 오프라인 대기열 검사(D4/D5, E3/E4)에 쓰는 슬러그. 각
// 매니페스트의 첫 항목이면 충분하다(메모 저장 경로 자체를 보는 것이지 특정 글 내용은
// 상관없다).
function readFirstArticleSlug() {
  const articlesPath = path.join(ROOT, '.velite', 'articles.json');
  if (!fs.existsSync(articlesPath)) {
    console.error(`${LOG}: ${path.relative(ROOT, articlesPath)}가 없습니다. \`npm run build\`를 먼저 실행하세요.`);
    process.exit(1);
  }
  const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
  const first = articles[0];
  if (!first) {
    console.error(`${LOG}: 아티클 매니페스트가 비어 있습니다.`);
    process.exit(1);
  }
  return first.slug;
}
const ARTICLE_SLUG = readFirstArticleSlug();
const ARTICLE_ROUTE = `/articles/${ARTICLE_SLUG}`;
const ARTICLE_NOTE_ID = `article:${ARTICLE_SLUG}`;

function readFirstBasecampLessonSlug() {
  const basecampPath = path.join(ROOT, '.velite', 'basecampLessons.json');
  if (!fs.existsSync(basecampPath)) {
    console.error(`${LOG}: ${path.relative(ROOT, basecampPath)}가 없습니다. \`npm run build\`를 먼저 실행하세요.`);
    process.exit(1);
  }
  const lessons = JSON.parse(fs.readFileSync(basecampPath, 'utf8'));
  const first = lessons[0];
  if (!first) {
    console.error(`${LOG}: 베이스캠프 레슨 매니페스트가 비어 있습니다.`);
    process.exit(1);
  }
  return first.slug;
}
const BASECAMP_SLUG = readFirstBasecampLessonSlug();
const BASECAMP_ROUTE = `/basecamp/${BASECAMP_SLUG}`;
const BASECAMP_NOTE_ID = `basecamp:${BASECAMP_SLUG}`;

function killServerTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } catch (e) {
      // 이미 종료되었을 수 있다. 남아 있으면 waitForServerDown이 잡는다.
      console.warn(`${LOG}: 서버 프로세스 종료 명령 실패(이미 종료되었을 수 있음): ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    try {
      child.kill('SIGKILL');
    } catch (e) {
      console.warn(`${LOG}: 서버 프로세스 종료 실패(이미 종료되었을 수 있음): ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

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
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetchWithTimeout(BASE_URL, { redirect: 'manual' });
      if (res.status < 500) return;
      lastError = `HTTP ${res.status}`;
    } catch (e) {
      // 아직 기동 중. 재시도하고, 끝내 실패하면 마지막 오류를 함께 보고한다.
      lastError = e instanceof Error ? e.message : String(e);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new FatalError(`서버가 제한 시간(180초) 안에 기동하지 않았습니다. 마지막 오류: ${lastError ?? '없음'}`);
}

async function waitForServerDown() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      await fetchWithTimeout(BASE_URL, { redirect: 'manual' });
    } catch {
      // 연결 실패가 곧 "내려갔다"는 신호다(삼키는 오류가 아니라 성공 조건).
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new FatalError('서버가 15초 안에 내려가지 않았습니다.');
}

const serverOutput = [];
let server = null;

async function startServer() {
  const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  server = spawn(process.execPath, [nextBin, 'start', '--port', String(PORT), '--hostname', HOST], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  server.stdout.on('data', (d) => serverOutput.push(d.toString()));
  server.stderr.on('data', (d) => serverOutput.push(d.toString()));
  try {
    await waitForServerReady();
  } catch (e) {
    throw new FatalError(`${e.message}\n--- 서버 출력(마지막 부분) ---\n${serverOutput.join('').slice(-4000)}`);
  }
}

async function stopServer() {
  killServerTree(server);
  server = null;
  await waitForServerDown();
}

async function goOffline(context) {
  await context.setOffline(true);
  await stopServer();
}

async function goOnline(context) {
  await startServer();
  await context.setOffline(false);
}

// --- 결과 누적기. 실패는 항목 순서대로 모아 마지막에 한 번에 출력한다 ---
const results = [];
function record(id, label, pass, detail) {
  results.push({ id, label, pass, detail: detail ?? '' });
  console.log(`${LOG}: ${id} ${label}: ${pass ? 'OK' : 'FAIL'}${detail ? ` (${detail})` : ''}`);
}

async function pollUntil(read, isDone, timeoutMs, intervalMs = 500) {
  const deadline = Date.now() + timeoutMs;
  let value = await read();
  while (!isDone(value) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    value = await read();
  }
  return value;
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', TESTER_EMAIL);
  await page.fill('input[name="password"]', TESTER_PASSWORD);
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/', { timeout: 30_000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function readAuth(page) {
  return page.evaluate(() => fetch('/api/auth', { cache: 'no-store' }).then((r) => r.json()));
}

// e2e-lesson-note.mjs와 같은 신호: 진도 아일랜드가 loading을 벗어날 때까지 기다린다.
async function waitForProgressSettled(page) {
  await page.waitForSelector('[data-progress-island]');
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-progress-island]');
    return el !== null && el.getAttribute('data-progress-state') !== 'loading';
  });
}

async function waitForServiceWorker(page) {
  return page.evaluate(() =>
    Promise.race([
      navigator.serviceWorker.ready.then((registration) => Boolean(registration.active)),
      new Promise((resolve) => setTimeout(() => resolve(false), 20_000)),
    ]),
  );
}

// offline-db 한 저장소의 키 목록. DB가 없으면 만들지 않고 빈 목록(open만 하면 빈 v1 DB가
// 생겨 앱의 저장소 생성을 막는다).
async function idbKeys(page, storeName) {
  return page.evaluate(async (name) => {
    const dbs = typeof indexedDB.databases === 'function' ? await indexedDB.databases() : [];
    if (!dbs.some((d) => d.name === 'offline-db')) return [];
    return new Promise((resolve) => {
      const request = indexedDB.open('offline-db');
      request.onerror = () => resolve([]);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(name)) {
          db.close();
          resolve([]);
          return;
        }
        const keysRequest = db.transaction(name, 'readonly').objectStore(name).getAllKeys();
        keysRequest.onsuccess = () => {
          db.close();
          resolve(keysRequest.result.map(String));
        };
        keysRequest.onerror = () => {
          db.close();
          resolve([]);
        };
      };
    });
  }, storeName);
}

async function queueCount(page) {
  return (await idbKeys(page, 'queue')).length;
}

async function waitForQueueEmpty(page, timeoutMs) {
  const count = await pollUntil(() => queueCount(page), (n) => n === 0, timeoutMs, 1000);
  return count === 0;
}

async function backupProbe(admin, userId) {
  const { data: progressRow, error: progressError } = await admin
    .from('progress')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('lesson_id', PROBE_SLUG)
    .maybeSingle();
  if (progressError) throw new FatalError(`완료 행 백업 조회 실패: ${progressError.message}`);
  const { data: noteRow, error: noteError } = await admin
    .from('lesson_note')
    .select('body, til, needs_review')
    .eq('user_id', userId)
    .eq('lesson_id', PROBE_SLUG)
    .maybeSingle();
  if (noteError) throw new FatalError(`메모 행 백업 조회 실패: ${noteError.message}`);
  return { progressRow, noteRow };
}

async function restoreProbe(admin, userId, backup) {
  const progress = backup.progressRow
    ? await admin
        .from('progress')
        .upsert(
          { user_id: userId, lesson_id: PROBE_SLUG, completed_at: backup.progressRow.completed_at },
          { onConflict: 'user_id,lesson_id' },
        )
    : await admin.from('progress').delete().eq('user_id', userId).eq('lesson_id', PROBE_SLUG);
  if (progress.error) throw new Error(`완료 행 복원 실패: ${progress.error.message}`);
  const note = backup.noteRow
    ? await admin.from('lesson_note').upsert(
        {
          user_id: userId,
          lesson_id: PROBE_SLUG,
          body: backup.noteRow.body,
          til: backup.noteRow.til,
          needs_review: backup.noteRow.needs_review,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' },
      )
    : await admin.from('lesson_note').delete().eq('user_id', userId).eq('lesson_id', PROBE_SLUG);
  if (note.error) throw new Error(`메모 행 복원 실패: ${note.error.message}`);
}

// 아티클/베이스캠프 메모(D4/D5, E3/E4)는 프로브 레슨과 다른 lesson_id(article:/basecamp:
// 접두사)를 쓰므로 백업·복원을 프로브와 분리해 일반화한다.
async function backupNoteRow(admin, userId, noteId) {
  const { data, error } = await admin
    .from('lesson_note')
    .select('body, til, needs_review')
    .eq('user_id', userId)
    .eq('lesson_id', noteId)
    .maybeSingle();
  if (error) throw new FatalError(`메모 행 백업 조회 실패(${noteId}): ${error.message}`);
  return data;
}

async function restoreNoteRow(admin, userId, noteId, noteRow) {
  const note = noteRow
    ? await admin.from('lesson_note').upsert(
        {
          user_id: userId,
          lesson_id: noteId,
          body: noteRow.body,
          til: noteRow.til,
          needs_review: noteRow.needs_review,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' },
      )
    : await admin.from('lesson_note').delete().eq('user_id', userId).eq('lesson_id', noteId);
  if (note.error) throw new Error(`메모 행 복원 실패(${noteId}): ${note.error.message}`);
}

async function main() {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let browser;
  let userId = null;
  let backup = null;
  let articleNoteBackup = null;
  let basecampNoteBackup = null;

  try {
    await startServer();
    console.log(`${LOG}: 프로덕션 서버 기동 완료 (probe lesson: ${PROBE_SLUG})`);

    browser = await chromium.launch();
    // 1024 폭: 램프 글자(ON AIR)가 보이는 폭(640px 이상)에서 본다.
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();

    await login(page);
    const auth = await readAuth(page);
    if (typeof auth?.userId !== 'string' || auth.userId.length === 0) {
      throw new FatalError('/api/auth가 userId를 돌려주지 않습니다. 테스터 로그인과 /api/auth 변경을 확인하세요.');
    }
    userId = auth.userId;
    backup = await backupProbe(admin, userId);
    console.log(
      `${LOG}: 테스터 프로브 행 백업 완료 (완료 행=${Boolean(backup.progressRow)}, 메모 행=${Boolean(backup.noteRow)})`,
    );
    articleNoteBackup = await backupNoteRow(admin, userId, ARTICLE_NOTE_ID);
    basecampNoteBackup = await backupNoteRow(admin, userId, BASECAMP_NOTE_ID);
    console.log(
      `${LOG}: 아티클/베이스캠프 메모 행 백업 완료 (아티클=${Boolean(articleNoteBackup)}, 베이스캠프=${Boolean(basecampNoteBackup)})`,
    );

    // === A. /sw.js 응답과 서비스 워커 등록 ===
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/sw.js?v=e2e`, { redirect: 'manual' });
      const info = {
        status: res.status,
        cacheControl: res.headers.get('cache-control') ?? '',
        contentType: res.headers.get('content-type') ?? '',
        allowed: res.headers.get('service-worker-allowed'),
      };
      const pass =
        info.status === 200 &&
        info.cacheControl.includes('no-store') &&
        info.contentType.includes('javascript') &&
        info.allowed === '/';
      record('A1', '/sw.js 헤더(쿠키 없이 200, no-store, javascript, Service-Worker-Allowed)', pass, JSON.stringify(info));
    } catch (e) {
      record('A1', '/sw.js 헤더', false, `예외: ${e.message}`);
    }

    try {
      await page.goto(`${BASE_URL}${PROBE_ROUTE}`, { waitUntil: 'domcontentloaded' });
      const active = await waitForServiceWorker(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const state = await page.evaluate(async () => {
        const offlineKeys = (await caches.keys()).filter((k) => k.startsWith('offline-'));
        return {
          controlled: navigator.serviceWorker.controller !== null,
          offlineKeys,
          lessonCached: Boolean(await caches.match(location.pathname)),
        };
      });
      const pass = active && state.controlled && state.offlineKeys.length === 1 && state.lessonCached;
      record('A2', '로그인 후 서비스 워커 활성, 페이지 제어, 빌드 캐시 1개, 방문한 레슨 저장', pass, JSON.stringify({ active, ...state }));
    } catch (e) {
      record('A2', '서비스 워커 등록', false, `예외: ${e.message}`);
    }

    // === B0. 서비스 워커 설치 때 /offline이 미리 저장됨(전체 받기 전) ===
    // A에서 로그인 직후 설치됐고, 아직 /offline을 방문하지 않았다.
    try {
      const precached = await page.evaluate(async () => Boolean(await caches.match('/offline')));
      record('B0', '설치 때 오프라인 목차(/offline) 미리 저장', precached, `precached=${precached}`);
    } catch (e) {
      record('B0', '설치 때 /offline 미리 저장', false, `예외: ${e.message}`);
    }

    // === B. /offline에서 전체 받기 ===
    try {
      await page.goto(`${BASE_URL}/offline`, { waitUntil: 'domcontentloaded' });
      await page.click('[data-offline-download]');
      await page.waitForSelector('[data-offline-status="done"], [data-offline-status="error"]', { timeout: 300_000 });
      await page.waitForFunction(
        () => Number(document.querySelector('[data-offline-count]')?.getAttribute('data-saved') ?? '0') > 1,
        null,
        { timeout: 15_000 },
      );
      const summary = await page.evaluate(async (probeRoute) => {
        const count = document.querySelector('[data-offline-count]');
        return {
          status: document.querySelector('[data-offline-status]')?.getAttribute('data-offline-status') ?? null,
          saved: Number(count?.getAttribute('data-saved') ?? '0'),
          total: Number(count?.getAttribute('data-total') ?? '0'),
          progress: document.querySelector('[data-offline-progress]')?.textContent ?? '',
          probeCached: Boolean(await caches.match(probeRoute)),
          manifestCached: Boolean(await caches.match('/offline-manifest.json')),
          tocLinks: document.querySelectorAll('[data-offline-toc] a').length,
        };
      }, PROBE_ROUTE);
      const snapshotKeys = await idbKeys(page, 'progressSnapshot');
      const pass =
        summary.status === 'done' &&
        summary.total > 0 &&
        summary.saved >= Math.floor(summary.total * 0.9) &&
        summary.probeCached &&
        summary.manifestCached &&
        summary.tocLinks > 0 &&
        snapshotKeys.includes(PROBE_SLUG);
      record(
        'B',
        '전체 받기 완료(페이지 90% 이상, 프로브 레슨, 목록 파일, 내 진도 사본)',
        pass,
        JSON.stringify({ ...summary, snapshotHasProbe: snapshotKeys.includes(PROBE_SLUG) }),
      );
    } catch (e) {
      record('B', '전체 받기', false, `예외: ${e.message}`);
    }

    // === C. 오프라인 읽기(새로고침, 링크 이동, 개인 화면 대체, 저장 안 된 페이지) ===
    try {
      await page.goto(`${BASE_URL}${PROBE_ROUTE}`, { waitUntil: 'domcontentloaded' });
      const nextHref = await page.getAttribute('a[data-pager="next"]', 'href');
      await goOffline(context);

      await page.reload({ waitUntil: 'domcontentloaded' });
      const title = (await page.textContent('h1'))?.trim() ?? null;
      record('C1', '오프라인 새로고침에도 레슨 본문이 보임', title === PROBE_LESSON.title, `h1=${title}`);

      if (nextHref) {
        await Promise.all([
          page.waitForURL((url) => url.pathname === nextHref, { timeout: 15_000 }),
          page.click('a[data-pager="next"]'),
        ]);
        const nextTitle = (await page.textContent('h1'))?.trim() ?? '';
        record('C2', '오프라인 링크 이동(저장된 다음 레슨)', nextTitle.length > 0, `path=${nextHref} h1=${nextTitle}`);
      } else {
        record('C2', '오프라인 링크 이동', false, '프로브 레슨에 다음 레슨 링크가 없음');
      }

      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-offline-toc] a', { timeout: 15_000 });
      await page.waitForSelector('[data-offline-missing]', { timeout: 15_000 });
      const home = await page.evaluate(() => ({
        path: location.pathname,
        from: new URLSearchParams(location.search).get('from'),
        links: document.querySelectorAll('[data-offline-toc] a').length,
      }));
      record('C3', '오프라인 홈(/)은 오프라인 목차로 대체', home.path === '/offline' && home.from === '/' && home.links > 0, JSON.stringify(home));

      await page.goto(`${BASE_URL}/lesson/offline-e2e-not-saved`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-offline-missing]', { timeout: 15_000 });
      const missing = await page.evaluate(() => ({
        path: location.pathname,
        text: document.querySelector('[data-offline-missing]')?.textContent ?? '',
      }));
      record('C4', '저장 안 된 콘텐츠 주소는 안내 화면', missing.path === '/offline' && missing.text.includes('아직 기기에 저장되지'), JSON.stringify(missing));
    } catch (e) {
      record('C', '오프라인 읽기', false, `예외: ${e.message}`);
    }
    if (server === null) await goOnline(context);

    // === C5. 그림이 움직이는 편(AI 뜯어보기)은 온라인에서 한 번 열면 오프라인에서도 열린다 ===
    // 지연 로딩 조각은 HTML에 주소가 없어 전체 받기가 모른다. 온라인 방문 때 서비스 워커가
    // 캐시 먼저 규칙으로 저장한 것을 오프라인에서 쓰는지 본다.
    try {
      await page.goto(`${BASE_URL}${CONCEPT_ROUTE}`, { waitUntil: 'networkidle' });
      const onlineTitle = (await page.textContent('h1'))?.trim() ?? '';
      await goOffline(context);
      const failedStatic = [];
      const onFailed = (request) => {
        const url = new URL(request.url());
        if (url.pathname.startsWith('/_next/static/')) failedStatic.push(url.pathname);
      };
      page.on('requestfailed', onFailed);
      try {
        await page.goto(`${BASE_URL}${CONCEPT_ROUTE}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('h1', { timeout: 15_000 });
        await page.waitForTimeout(1500);
      } finally {
        page.off('requestfailed', onFailed);
      }
      const offline = await page.evaluate(() => ({
        path: location.pathname,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        fallback: document.querySelector('[data-offline-missing]') !== null,
      }));
      const pass =
        onlineTitle.length > 0 &&
        offline.path === CONCEPT_ROUTE &&
        offline.h1 === onlineTitle &&
        !offline.fallback &&
        failedStatic.length === 0;
      record(
        'C5',
        '한 번 열어 둔 AI 뜯어보기 편은 오프라인에서도 열림(제목, 화면 파일 실패 없음)',
        pass,
        JSON.stringify({ route: CONCEPT_ROUTE, onlineTitle, ...offline, failedStatic }),
      );
    } catch (e) {
      record('C5', '오프라인 AI 뜯어보기', false, `예외: ${e.message}`);
    }
    if (server === null) await goOnline(context);

    // === M. 새 배포 뒤 옮기기: 옛 빌드 캐시에만 있는 페이지 ===
    // 가짜 옛 캐시(offline-old)에 레슨 하나를 넣고 지금 빌드 캐시에서는 뺀다. 오프라인이면 옛
    // 캐시에서 읽히고(M1), 온라인에서 페이지를 새로 열면 런타임이 지금 빌드 캐시로 다시 받은 뒤
    // 옛 캐시를 지운다(M2).
    try {
      const { buildId } = await readAuth(page);
      const currentCache = `offline-${buildId}`;
      // 이번 로드의 옮기기 확인(런타임)이 끝난 뒤에 심는다.
      await page.goto(`${BASE_URL}/offline`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const names = { route: MIGRATION_ROUTE, oldName: OLD_CACHE_NAME, currentName: currentCache };
      const seeded = await page.evaluate(async ({ route, oldName, currentName }) => {
        const res = await fetch(route, { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok || res.redirected) return { ok: false, status: res.status };
        await (await caches.open(oldName)).put(route, res);
        if (await caches.has(currentName)) await (await caches.open(currentName)).delete(route);
        return { ok: true };
      }, names);
      await page.waitForTimeout(500);
      const before = await page.evaluate(
        async ({ route, oldName, currentName }) => ({
          inOld: Boolean(await caches.match(route, { cacheName: oldName })),
          inCurrent: Boolean(await caches.match(route, { cacheName: currentName })),
        }),
        names,
      );

      await goOffline(context);
      await page.goto(`${BASE_URL}${MIGRATION_ROUTE}`, { waitUntil: 'domcontentloaded' });
      const oldTitle = (await page.textContent('h1'))?.trim() ?? '';
      const offlinePath = await page.evaluate(() => location.pathname);
      record(
        'M1',
        '오프라인에서 옛 빌드 캐시에만 있는 레슨이 열림',
        seeded.ok && before.inOld && !before.inCurrent && offlinePath === MIGRATION_ROUTE && oldTitle === MIGRATION_LESSON.title,
        JSON.stringify({ seeded, before, path: offlinePath, h1: oldTitle }),
      );

      await goOnline(context);
      await page.goto(`${BASE_URL}/offline`, { waitUntil: 'domcontentloaded' });
      const after = await pollUntil(
        () =>
          page.evaluate(
            async ({ route, oldName, currentName }) => ({
              inCurrent: Boolean(await caches.match(route, { cacheName: currentName })),
              oldExists: await caches.has(oldName),
              offlineCaches: (await caches.keys()).filter((k) => k.startsWith('offline-')),
            }),
            names,
          ),
        (v) => v.inCurrent && !v.oldExists,
        60_000,
      );
      record(
        'M2',
        '온라인이 되면 옛 캐시의 레슨을 지금 빌드 캐시로 옮기고 옛 캐시를 지움',
        after.inCurrent && !after.oldExists && after.offlineCaches.length === 1,
        JSON.stringify(after),
      );
    } catch (e) {
      record('M', '옛 빌드 캐시 옮기기', false, `예외: ${e.message}`);
    }
    if (server === null) await goOnline(context);

    // === D. 오프라인 완료 체크와 메모가 대기열에 쌓인다 ===
    const offlineNote = `오프라인메모-${Date.now()}-한글`;
    let expectedDone = null;
    let offlineArticleNote = null;
    let offlineBasecampNote = null;
    try {
      await goOffline(context);
      await page.goto(`${BASE_URL}${PROBE_ROUTE}`, { waitUntil: 'domcontentloaded' });
      await waitForProgressSettled(page);
      const islandState = await page.getAttribute('[data-progress-island]', 'data-progress-state');
      record('D1', '오프라인에서 진도 아일랜드가 기기 사본으로 준비됨', islandState === 'ready', `state=${islandState}`);

      const before = await page.getAttribute('[data-progress-ui="complete-button"]', 'data-complete-state');
      expectedDone = before !== 'done';
      await page.click('[data-progress-ui="complete-button"] button');
      await page.waitForSelector(
        `[data-progress-ui="complete-button"][data-complete-state="${expectedDone ? 'done' : 'todo'}"]`,
        { timeout: 10_000 },
      );
      const afterToggle = await queueCount(page);
      record('D2', '오프라인 완료 체크가 화면에 반영되고 대기열에 1건', afterToggle === 1, `before=${before} queue=${afterToggle}`);

      await page.click('[data-notepad] button[aria-expanded]');
      await page.waitForSelector('[data-notepad-input]');
      await page.fill('[data-notepad-input]', offlineNote);
      await page.waitForTimeout(1800);
      const noteStatus = await page.getAttribute('[data-notepad-status]', 'data-notepad-status');
      const afterNote = await queueCount(page);
      record('D3', '오프라인 메모가 기기에 저장됨 상태로 대기열에 들어감', noteStatus === 'queued' && afterNote === 2, `status=${noteStatus} queue=${afterNote}`);

      // 아티클/베이스캠프 메모(진도·완료가 없는 격리 화면)도 같은 writeOrQueue 경로를 타는지
      // 본다. 두 페이지 모두 "전체 받기"(B)가 이미 저장해 둔 콘텐츠라 오프라인에서도 열린다.
      await page.goto(`${BASE_URL}${ARTICLE_ROUTE}`, { waitUntil: 'domcontentloaded' });
      await page.click('[data-notepad] button[aria-expanded]');
      await page.waitForSelector('[data-notepad-input]');
      offlineArticleNote = `오프라인아티클메모-${Date.now()}-한글`;
      await page.fill('[data-notepad-input]', offlineArticleNote);
      await page.waitForTimeout(1800);
      const articleNoteStatus = await page.getAttribute('[data-notepad-status]', 'data-notepad-status');
      const afterArticleNote = await queueCount(page);
      record(
        'D4',
        '오프라인 아티클 메모가 기기에 저장됨 상태로 대기열에 들어감',
        articleNoteStatus === 'queued' && afterArticleNote === 3,
        `status=${articleNoteStatus} queue=${afterArticleNote}`,
      );

      await page.goto(`${BASE_URL}${BASECAMP_ROUTE}`, { waitUntil: 'domcontentloaded' });
      await page.click('[data-notepad] button[aria-expanded]');
      await page.waitForSelector('[data-notepad-input]');
      offlineBasecampNote = `오프라인베이스캠프메모-${Date.now()}-한글`;
      await page.fill('[data-notepad-input]', offlineBasecampNote);
      await page.waitForTimeout(1800);
      const basecampNoteStatus = await page.getAttribute('[data-notepad-status]', 'data-notepad-status');
      const afterBasecampNote = await queueCount(page);
      record(
        'D5',
        '오프라인 베이스캠프 메모가 기기에 저장됨 상태로 대기열에 들어감',
        basecampNoteStatus === 'queued' && afterBasecampNote === 4,
        `status=${basecampNoteStatus} queue=${afterBasecampNote}`,
      );
    } catch (e) {
      record('D', '오프라인 쓰기', false, `예외: ${e.message}`);
    }

    // === E. 온라인 복귀 후 자동 동기화와 서버 반영 ===
    try {
      if (server === null) await goOnline(context);
      const drained = await waitForQueueEmpty(page, 40_000);
      const { data: progressRow } = await admin
        .from('progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('lesson_id', PROBE_SLUG)
        .maybeSingle();
      const { data: noteRow } = await admin
        .from('lesson_note')
        .select('body')
        .eq('user_id', userId)
        .eq('lesson_id', PROBE_SLUG)
        .maybeSingle();
      const serverDone = progressRow !== null;
      const pass = drained && expectedDone !== null && serverDone === expectedDone && noteRow?.body === offlineNote;
      record('E1', '복귀하면 대기열이 비고 서버에 완료와 메모가 반영됨', pass, JSON.stringify({ drained, expectedDone, serverDone, noteMatches: noteRow?.body === offlineNote }));

      const { data: articleNoteRow } = await admin
        .from('lesson_note')
        .select('body')
        .eq('user_id', userId)
        .eq('lesson_id', ARTICLE_NOTE_ID)
        .maybeSingle();
      record(
        'E3',
        '오프라인 아티클 메모가 온라인 복귀 후 서버에 반영됨',
        articleNoteRow?.body === offlineArticleNote,
        JSON.stringify({ bodyMatches: articleNoteRow?.body === offlineArticleNote }),
      );

      const { data: basecampNoteRow } = await admin
        .from('lesson_note')
        .select('body')
        .eq('user_id', userId)
        .eq('lesson_id', BASECAMP_NOTE_ID)
        .maybeSingle();
      record(
        'E4',
        '오프라인 베이스캠프 메모가 온라인 복귀 후 서버에 반영됨',
        basecampNoteRow?.body === offlineBasecampNote,
        JSON.stringify({ bodyMatches: basecampNoteRow?.body === offlineBasecampNote }),
      );

      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForProgressSettled(page);
      const uiState = await page.getAttribute('[data-progress-ui="complete-button"]', 'data-complete-state');
      record('E2', '새로고침 후 화면도 서버 값과 같음', uiState === (expectedDone ? 'done' : 'todo'), `ui=${uiState}`);
    } catch (e) {
      record('E', '동기화', false, `예외: ${e.message}`);
    }
    if (server === null) await goOnline(context);

    // === H. 로그아웃하면 기기 저장본이 모두 지워진다(항상 마지막) ===
    // 로그아웃 뒤에는 로그인이 필요한 시나리오를 돌릴 수 없다. 새 시나리오는 이 주석 위에 넣는다.
    try {
      if (server === null) await goOnline(context);
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.click('button:has-text("로그아웃")');
      await page.waitForSelector('input[name="email"]', { timeout: 30_000 });
      const after = await pollUntil(
        () =>
          page.evaluate(async () => {
            const offlineCaches = (await caches.keys()).filter((k) => k.startsWith('offline-')).length;
            const dbs = typeof indexedDB.databases === 'function' ? await indexedDB.databases() : [];
            const registrations = (await navigator.serviceWorker.getRegistrations()).length;
            return { offlineCaches, offlineDb: dbs.some((d) => d.name === 'offline-db'), registrations };
          }),
        (v) => v.offlineCaches === 0 && !v.offlineDb && v.registrations === 0,
        10_000,
      );
      const pass = after.offlineCaches === 0 && !after.offlineDb && after.registrations === 0;
      record('H', '로그아웃하면 저장본, IndexedDB, 서비스 워커가 모두 사라짐', pass, JSON.stringify(after));
    } catch (e) {
      record('H', '로그아웃 정리', false, `예외: ${e.message}`);
    }

    await browser.close();
    browser = undefined;

    console.log(`${LOG}: 수행한 검사 수 = ${results.length}`);
    if (results.length === 0) {
      throw new FatalError('수행한 검사가 0건입니다. 시나리오 목록을 확인하세요.');
    }
    const failures = results.filter((r) => !r.pass);
    if (failures.length > 0) {
      console.error(`${LOG}: ${failures.length}건의 위반이 발견되었습니다:\n`);
      for (const f of failures) console.error(`  - [${f.id}] ${f.label}: ${f.detail}`);
      throw new FatalError(`${failures.length}건의 위반으로 게이트 실패`);
    }
    console.log(`${LOG}: 검사한 ${results.length}건 전부 통과`);
  } finally {
    if (browser) {
      await browser.close().catch((e) => {
        console.warn(`${LOG}: 브라우저 종료 실패: ${e instanceof Error ? e.message : String(e)}`);
      });
    }
    killServerTree(server);
    server = null;
    if (backup && userId) {
      try {
        await restoreProbe(admin, userId, backup);
        console.log(`${LOG}: 테스터 프로브 행 복원 완료`);
      } catch (e) {
        console.error(`${LOG}: 복원 실패. 수동 확인이 필요합니다: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    if (userId) {
      try {
        await restoreNoteRow(admin, userId, ARTICLE_NOTE_ID, articleNoteBackup);
        await restoreNoteRow(admin, userId, BASECAMP_NOTE_ID, basecampNoteBackup);
        console.log(`${LOG}: 아티클/베이스캠프 메모 행 복원 완료`);
      } catch (e) {
        console.error(
          `${LOG}: 아티클/베이스캠프 메모 복원 실패. 수동 확인이 필요합니다: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(`${LOG}: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
