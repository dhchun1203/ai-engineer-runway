#!/usr/bin/env node
// 브라우저 안 SQL 실행(PGlite 지연 로드) 게이트 — quick 260901-ksv.
// e2e-code-run.mjs의 골격을 그대로 복제한다(환경 변수 선검증, FatalError,
// waitForServerReady, killServerTree, `next dev` spawn, 위반 누적 후 일괄
// 보고, 0이 아닌 종료 코드) — 이 저장소 게이트 전부 "재사용 안 함, 복제"
// 원칙을 따르므로 공유 모듈로 빼지 않는다.
//
// 실행: node --env-file=.env.local scripts/e2e-sql-run.mjs
//
// 포트는 3217 — 3210~3216이 이미 선점돼 있어(preflight, e2e-code-run.mjs
// 주석 참고) 잇달아 돌릴 때 포트 충돌로 인한 위음성 실패가 나지 않게 다음
// 번호를 쓴다.
//
// 판정 5건:
//   A1 0바이트 계약 — /lesson/1-4-sql-queries-and-joins를 networkidle까지
//     열었을 때(실행 버튼을 누르기 전) cdn.jsdelivr.net 호스트로 나간 요청 0건.
//   A2 셋업 성공 — 첫 [data-run-sql]의 [data-run](셋업 블록) 클릭 후
//     [data-run-output]에 성공 상태 메시지("실행 완료" 계열)가 나타난다.
//   A3 쿼리 표 렌더(지속 인스턴스 증명) — 조회 블록의 [data-run] 클릭 후
//     [data-run-output] 안에 table이 생기고, 셋업 데이터에서만 나올 수 있는
//     결정적 셀 텍스트가 표에 있다. 이는 셋업이 같은 인스턴스에 지속돼
//     practice.students를 참조함을 증명한다.
//   A4 터치 타깃 — [data-run-sql] 안 button 전부 높이 44px 이상.
//   A5 Postgres 에러 표시 — "고쳐 보기"로 textarea를 존재하지 않는 표를
//     참조하는 SQL로 교체 후 실행 → 출력 영역에 Postgres 에러 문구가 그대로
//     보인다.
//
// 첫 실행은 CDN에서 PGlite WASM을 내려받아 느리므로 RUN_TIMEOUT은 2분 이상
// 유지한다. 어떤 출력에도 쿠키·시크릿을 찍지 않는다.

import { chromium } from '@playwright/test';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = process.env.E2E_SQL_RUN_PORT ? Number(process.env.E2E_SQL_RUN_PORT) : 3217;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 180_000;
const FETCH_TIMEOUT_MS = 30_000;
// 첫 실행은 CDN에서 PGlite WASM 전체를 내려받으므로 느리다 — 계획이 명시한
// "2분 이상" 여유를 그대로 쓴다.
const RUN_TIMEOUT_MS = 150_000;

const LESSON_SLUG = '1-4-sql-queries-and-joins';
const LESSON_ROUTE = `/lesson/${LESSON_SLUG}`;

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
      `e2e-sql-run: ${name} 환경 변수가 비어 있습니다. \`node --env-file=.env.local scripts/e2e-sql-run.mjs\`로 실행하세요.`,
    );
    process.exit(1);
  }
}

// 레슨이 실제로 매니페스트에 존재하는지 확인한다(오타로 존재하지 않는 라우트를
// 조용히 판정하는 것을 막는다). 앱 코드를 import하지 않고 .velite 산출물을
// 독립 재파싱한다(e2e-code-run.mjs와 같은 원칙).
function assertLessonExists() {
  const lessonsPath = path.join(ROOT, '.velite', 'lessons.json');
  if (!fs.existsSync(lessonsPath)) {
    console.error(
      `e2e-sql-run: ${path.relative(ROOT, lessonsPath)}가 없습니다. \`npx velite build\`를 한 번 실행해 매니페스트를 생성한 뒤 다시 시도하세요.`,
    );
    process.exit(1);
  }
  const lessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
  if (!lessons.some((l) => l.slug === LESSON_SLUG)) {
    console.error(`e2e-sql-run: 레슨 슬러그 "${LESSON_SLUG}"를 매니페스트에서 찾지 못했습니다.`);
    process.exit(1);
  }
}
assertLessonExists();

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

// --- 결과 누적기 — 실패는 항목 순서대로 모아 마지막에 한 번에 출력한다 ---
const results = [];
function record(id, label, pass, detail) {
  results.push({ id, label, pass, detail: detail ?? '' });
  const status = pass ? 'OK' : 'FAIL';
  console.log(`e2e-sql-run: ${id} ${label} — ${status}${detail ? ` (${detail})` : ''}`);
}

// 셋업 데이터에서만 나올 수 있는 결정적 학생 이름 — practice.students에 이
// 값들을 넣는 것은 셋업 블록뿐이므로, 조회 결과 표에 이 이름이 있다는 것은
// 셋업이 같은 PGlite 인스턴스에 지속되어 쿼리가 그 표를 참조했다는 증거다.
const SETUP_SEED_NAMES = ['박서연', '김지현'];

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

  let browser;
  try {
    try {
      await waitForServerReady();
    } catch (e) {
      throw new FatalError(
        `${e.message}\n--- 서버 출력(마지막 부분) ---\n${serverOutput.join('').slice(-4000)}`,
      );
    }
    console.log('e2e-sql-run: 개발 서버 기동 완료');

    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 768, height: 1024 } }); // 아이패드 세로
    const page = await context.newPage();

    // --- A1: 방문만 했을 때 cdn.jsdelivr.net 요청이 0건 ------------------
    const cdnRequestsBeforeRun = [];
    page.on('request', (req) => {
      let host = '';
      try {
        host = new URL(req.url()).host;
      } catch {
        // URL 파싱 실패 — 무시
      }
      if (host.includes('cdn.jsdelivr.net')) {
        cdnRequestsBeforeRun.push(req.url());
      }
    });

    await page.goto(`${BASE_URL}${LESSON_ROUTE}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#lesson-article');
    await page.waitForSelector('[data-run-sql]');

    record(
      'A1',
      '0바이트 계약(실행 전 cdn.jsdelivr.net 요청 0건)',
      cdnRequestsBeforeRun.length === 0,
      cdnRequestsBeforeRun.length > 0 ? `${cdnRequestsBeforeRun.length}건 발생` : '',
    );

    // --- A2: 셋업 블록 [실행] → 성공 상태 메시지("실행 완료" 계열) --------
    const runSqlBlocks = page.locator('[data-run-sql]');
    const setupBlock = runSqlBlocks.nth(0);
    const setupRunButton = setupBlock.locator('[data-run]').first();
    await setupRunButton.click();

    let a2Pass = false;
    let a2Detail = '';
    try {
      await page.waitForFunction(
        () => {
          const blocks = document.querySelectorAll('[data-run-sql]');
          const out = blocks[0]?.querySelector('[data-run-output]');
          return out !== null && out !== undefined && (out.textContent || '').includes('실행 완료');
        },
        { timeout: RUN_TIMEOUT_MS },
      );
      a2Pass = true;
    } catch (e) {
      a2Detail = e instanceof Error ? e.message : String(e);
    }
    record('A2', '셋업 성공(실행 완료 상태 메시지)', a2Pass, a2Detail);

    // --- A3: 조회 블록 [실행] → 표 + 셋업 데이터 결정적 셀 텍스트 ---------
    let a3Pass = false;
    let a3Detail = '';
    try {
      const queryBlock = runSqlBlocks.nth(1);
      const queryRunButton = queryBlock.locator('[data-run]').first();
      await queryRunButton.click();
      await page.waitForFunction(
        () => {
          const blocks = document.querySelectorAll('[data-run-sql]');
          const out = blocks[1]?.querySelector('[data-run-output]');
          return out !== null && out !== undefined && out.querySelector('table') !== null;
        },
        { timeout: RUN_TIMEOUT_MS },
      );
      const outputText =
        (await queryBlock.locator('[data-run-output]').first().textContent()) ?? '';
      const missing = SETUP_SEED_NAMES.filter((name) => !outputText.includes(name));
      const hasTable = await queryBlock.locator('[data-run-output] table').count();
      a3Pass = hasTable > 0 && missing.length === 0;
      a3Detail = missing.length > 0 ? `누락: ${missing.join(' / ')}` : hasTable === 0 ? 'table 없음' : '';
    } catch (e) {
      a3Detail = e instanceof Error ? e.message : String(e);
    }
    record('A3', '쿼리 표 렌더(지속 인스턴스 증명, 셋업 데이터 셀 포함)', a3Pass, a3Detail);

    // --- A4: 768×1024에서 [data-run-sql] 안 button 전부 44px 이상 --------
    const buttonHeights = await page.evaluate(() => {
      const roots = document.querySelectorAll('[data-run-sql]');
      const heights = [];
      roots.forEach((root) => {
        root.querySelectorAll('button').forEach((btn) => {
          heights.push({
            text: (btn.textContent || '').trim().slice(0, 20),
            height: Math.round(btn.getBoundingClientRect().height * 100) / 100,
          });
        });
      });
      return heights;
    });
    const shortButtons = buttonHeights.filter((b) => b.height < 44);
    record(
      'A4',
      '터치 타깃(버튼 전부 44px 이상)',
      buttonHeights.length > 0 && shortButtons.length === 0,
      buttonHeights.length === 0
        ? 'button을 찾지 못함'
        : shortButtons.length > 0
          ? shortButtons.map((b) => `"${b.text}"=${b.height}px`).join(', ')
          : '',
    );

    // --- A5: "고쳐 보기" → 존재하지 않는 표 SQL로 교체 → 실행 → Postgres 에러 표시 ---
    let a5Pass = false;
    let a5Detail = '';
    try {
      const setupBlockAgain = runSqlBlocks.nth(0);
      await setupBlockAgain.locator('button', { hasText: '고쳐 보기' }).first().click();
      const textarea = setupBlockAgain.locator('textarea').first();
      await textarea.waitFor({ state: 'visible' });
      await textarea.fill('SELECT * FROM practice.nonexistent_xyz;');
      await setupBlockAgain.locator('[data-run]').first().click();
      await page.waitForFunction(
        () => {
          const blocks = document.querySelectorAll('[data-run-sql]');
          const out = blocks[0]?.querySelector('[data-run-output]');
          return out !== null && out !== undefined && (out.textContent || '').includes('does not exist');
        },
        { timeout: RUN_TIMEOUT_MS },
      );
      a5Pass = true;
    } catch (e) {
      a5Detail = e instanceof Error ? e.message : String(e);
    }
    record('A5', 'Postgres 에러 표시(does not exist 원문)', a5Pass, a5Detail);

    await context.close();
    await browser.close();
    browser = undefined;

    const failures = results.filter((r) => !r.pass);
    if (failures.length > 0) {
      console.error(`\ne2e-sql-run: ${failures.length}건 실패:`);
      for (const f of failures) {
        console.error(`  - ${f.id} ${f.label}${f.detail ? `: ${f.detail}` : ''}`);
      }
      throw new FatalError(`e2e-sql-run 판정 실패 ${failures.length}건`);
    }

    console.log(`\ne2e-sql-run: 판정 ${results.length}건 전부 통과`);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    killServerTree(child);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(`e2e-sql-run: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
