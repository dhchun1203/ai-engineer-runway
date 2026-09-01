#!/usr/bin/env node
// 브라우저 안 파이썬 실행(Pyodide 지연 로드) 게이트 — quick 260901-iqk.
// e2e-mobile-readability.mjs/e2e-lesson-note.mjs의 골격을 그대로 복제한다
// (환경 변수 선검증, FatalError, waitForServerReady, killServerTree,
// `next dev` spawn, 위반 누적 후 일괄 보고, 0이 아닌 종료 코드) — 이 저장소
// 게이트 전부 "재사용 안 함, 복제" 원칙을 따르므로 공유 모듈로 빼지 않는다.
//
// 실행: node --env-file=.env.local scripts/e2e-code-run.mjs
//
// 포트는 3216 — 3210(e2e-progress)·3211(e2e-today)·3212(e2e-typography)·
// 3213(e2e-mobile-overflow)·3214(e2e-perf-budget/e2e-section-tape)·
// 3215(e2e-mobile-readability/e2e-lesson-note)가 이미 선점돼 있어(preflight 8)
// 잇달아 돌릴 때 포트 충돌로 인한 위음성 실패가 나지 않게 다음 번호를 쓴다.
//
// 판정 5건(A3~A5는 Task 2에서 추가):
//   A1 0바이트 계약 — /lesson/1-3-python-variables-and-types를 networkidle까지
//     열었을 때(실행 버튼을 누르기 전) cdn.jsdelivr.net 호스트로 나간 응답이 0건.
//   A2 실행 계약 — 실행 버튼 클릭 후 출력 영역에 예제의 결정적 출력이 나타난다
//     (자료형 줄, 프리미엄 할인율 줄, 회원 3명 인사말 줄). 첫 로드가 느리므로
//     이 대기만 넉넉한 타임아웃(2분 이상)을 준다.
//   A3 터치 타깃 — 768×1024에서 [data-run-python] 안 button 전부 높이 44px 이상.
//   A4 편집 실행 — "고쳐 보기" → textarea 내용을 판별 가능한 한 줄짜리 코드로
//     교체 → 실행 → 그 출력이 출력 영역에 나타난다.
//   A5 에러 표시 — 파이썬 예외를 내는 코드를 실행했을 때 출력 영역에 파이썬이
//     낸 예외 이름이 그대로 보인다.
//
// 어떤 출력에도 쿠키 값·시크릿을 찍지 않는다.

import { chromium } from '@playwright/test';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = process.env.E2E_CODE_RUN_PORT ? Number(process.env.E2E_CODE_RUN_PORT) : 3216;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 180_000;
const FETCH_TIMEOUT_MS = 30_000;
// 첫 실행은 CDN에서 Pyodide 전체(수 MB)를 내려받으므로 느리다 — 계획이 명시한
// "2분 이상" 여유를 그대로 쓴다.
const RUN_TIMEOUT_MS = 150_000;

const LESSON_SLUG = '1-3-python-variables-and-types';
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
      `e2e-code-run: ${name} 환경 변수가 비어 있습니다. \`node --env-file=.env.local scripts/e2e-code-run.mjs\`로 실행하세요.`,
    );
    process.exit(1);
  }
}

// 레슨이 실제로 매니페스트에 존재하는지 확인한다(오타로 존재하지 않는 라우트를
// 조용히 판정하는 것을 막는다). 앱 코드를 import하지 않고 .velite 산출물을
// 독립 재파싱한다(e2e-lesson-note.mjs와 같은 원칙).
function assertLessonExists() {
  const lessonsPath = path.join(ROOT, '.velite', 'lessons.json');
  if (!fs.existsSync(lessonsPath)) {
    console.error(
      `e2e-code-run: ${path.relative(ROOT, lessonsPath)}가 없습니다. \`npx velite build\`를 한 번 실행해 매니페스트를 생성한 뒤 다시 시도하세요.`,
    );
    process.exit(1);
  }
  const lessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
  if (!lessons.some((l) => l.slug === LESSON_SLUG)) {
    console.error(`e2e-code-run: 레슨 슬러그 "${LESSON_SLUG}"를 매니페스트에서 찾지 못했습니다.`);
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
  console.log(`e2e-code-run: ${id} ${label} — ${status}${detail ? ` (${detail})` : ''}`);
}

// 예제 실행 결과 중 "우연히 맞을 수 없는" 결정적 출력 5줄. 자료형 4종 중
// 대표로 str 하나만 판정하면 충분하다(4개 전부 판정하면 취약성 없이 장황해질
// 뿐이다) — 나머지는 할인율·인사말 3줄로 이미 실행 경로 전체가 증명된다.
const EXPECTED_OUTPUT_SNIPPETS = [
  "<class 'str'>",
  '프리미엄 회원 할인율: 20.0%',
  '김지현님, 안녕하세요!',
  '이민준님, 안녕하세요!',
  '박서연님, 안녕하세요!',
];

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
    console.log('e2e-code-run: 개발 서버 기동 완료');

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
    await page.waitForSelector('[data-run-python]');

    record(
      'A1',
      '0바이트 계약(실행 전 cdn.jsdelivr.net 요청 0건)',
      cdnRequestsBeforeRun.length === 0,
      cdnRequestsBeforeRun.length > 0 ? `${cdnRequestsBeforeRun.length}건 발생` : '',
    );

    // --- A2: 실행 버튼 클릭 → 결정적 출력 5줄이 모두 나타난다 ------------
    const runButton = page.locator('[data-run-python] [data-run]').first();
    await runButton.click();

    let a2Pass = false;
    let a2Detail = '';
    try {
      await page.waitForFunction(
        (needle) => {
          const out = document.querySelector('[data-run-output]');
          return out !== null && (out.textContent || '').includes(needle);
        },
        EXPECTED_OUTPUT_SNIPPETS[EXPECTED_OUTPUT_SNIPPETS.length - 1],
        { timeout: RUN_TIMEOUT_MS },
      );
      const outputText = (await page.locator('[data-run-output]').first().textContent()) ?? '';
      const missing = EXPECTED_OUTPUT_SNIPPETS.filter((snippet) => !outputText.includes(snippet));
      a2Pass = missing.length === 0;
      a2Detail = missing.length > 0 ? `누락: ${missing.join(' / ')}` : '';
    } catch (e) {
      a2Detail = e instanceof Error ? e.message : String(e);
    }
    record('A2', '실행 계약(결정적 출력 5줄)', a2Pass, a2Detail);

    await context.close();
    await browser.close();
    browser = undefined;

    const failures = results.filter((r) => !r.pass);
    if (failures.length > 0) {
      console.error(`\ne2e-code-run: ${failures.length}건 실패:`);
      for (const f of failures) {
        console.error(`  - ${f.id} ${f.label}${f.detail ? `: ${f.detail}` : ''}`);
      }
      throw new FatalError(`e2e-code-run 판정 실패 ${failures.length}건`);
    }

    console.log(`\ne2e-code-run: 판정 ${results.length}건 전부 통과`);
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
    console.error(`e2e-code-run: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
