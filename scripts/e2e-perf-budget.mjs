#!/usr/bin/env node
// 프로덕션 빌드 기반 성능 회귀 게이트 — TTFB · 첫 방문 전송 바이트 · 스크롤
// 프레임 예산 세 항목을 측정한다. `scripts/e2e-mobile-overflow.mjs`의 구조를
// 그대로 복제하되 서버 부트스트랩만 갈라진다: 개발 서버(next dev)가 아니라
// `next build && next start` 프로덕션 서버를 대상으로 측정한다 — 온디맨드
// 컴파일 타이밍이 TTFB 숫자에 섞이면 그 숫자는 무의미해진다.
//
// 실행: node --env-file=.env.local scripts/e2e-perf-budget.mjs
//
// 이 실행의 출력값이 이 페이즈(08)의 성능 기준선이다 — 08-08의 전후 비교
// 근거로 SUMMARY에 그대로 옮겨 적는다.
//
// 어떤 출력에도 쿠키 값·시크릿을 찍지 않는다.

import { chromium } from '@playwright/test';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// 기존 게이트들이 3212(e2e-typography)·3213(e2e-mobile-overflow)을 쓰고 있어
// 겹치면 위음성 실패가 난다 — 이 게이트 전용 포트를 3214로 둔다.
const PORT = process.env.E2E_PERF_PORT ? Number(process.env.E2E_PERF_PORT) : 3214;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 180_000;
const BUILD_TIMEOUT_MS = 600_000;
const FETCH_TIMEOUT_MS = 30_000;

const TTFB_SAMPLE_COUNT = 5;
const TTFB_JUDGED_ROUTE = '/lesson/1-1-course-orientation';
const BYTES_ROUTE = '/lesson/1-1-course-orientation';
const SCROLL_ROUTE = '/lesson/1-1-course-orientation';
const SCROLL_VIEWPORT = { width: 768, height: 1024 }; // 아이패드 세로
const SCROLL_DISTANCE_PX = 2000;
const SCROLL_WAIT_MS = 1200;
const FRAME_BUDGET_MS = 1000 / 60; // 16.67ms
const OVER_BUDGET_THRESHOLD_MS = FRAME_BUDGET_MS * 1.5; // 25ms
const OVER_BUDGET_RATIO_MAX = 0.1; // 10%
const TTFB_BASELINE_ROUTE = '/about';

class FatalError extends Error {}

// --- 필수 환경 변수 부재 시 즉시 오류 종료 (기본값으로 넘어가지 않는다) ---
// admin.ts가 모듈 로드 시점에 SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY를 검증하므로
// 비어 있으면 빌드/서버가 어떤 페이지도 렌더하지 못한다(precondition).

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
      `e2e-perf-budget: ${name} 환경 변수가 비어 있습니다. \`node --env-file=.env.local scripts/e2e-perf-budget.mjs\`로 실행하세요.`,
    );
    process.exit(1);
  }
}

// TTFB 판정 대상 라우트 — /about(정적 대조군) 대비 상대 비교로 판정한다.
// /와 /schedule은 이 페이즈에서 동적 유지가 결정된 라우트이므로 측정만 하고
// 판정에서 제외한다(관측 로그로만 남긴다).
const TTFB_ROUTES = [
  { route: '/about', label: '소개(정적 대조군)', judged: false },
  { route: '/', label: '홈(동적 유지)', judged: false },
  { route: '/curriculum', label: '커리큘럼', judged: true },
  { route: '/schedule', label: '일정표(동적 유지)', judged: false },
  { route: '/step/1', label: 'Step 1', judged: true },
  { route: TTFB_JUDGED_ROUTE, label: '레슨(콘텐츠)', judged: true },
];

function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
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

// 1단계: 프로덕션 빌드. 실패하면 마지막 4000자 출력과 함께 FatalError.
// 개발 서버를 절대 쓰지 않는다 — 이 단계가 그 이유다: 빌드가 끝난 뒤에만
// 2단계(next start)로 넘어간다.
function runNextBuild(nextBin) {
  return new Promise((resolve, reject) => {
    const buildOutput = [];
    const child = spawn(process.execPath, [nextBin, 'build'], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
    child.stdout.on('data', (d) => buildOutput.push(d.toString()));
    child.stderr.on('data', (d) => buildOutput.push(d.toString()));

    const timer = setTimeout(() => {
      killServerTree(child);
      reject(
        new FatalError(`next build이 빌드 타임아웃(${BUILD_TIMEOUT_MS / 1000}초) 안에 끝나지 않았습니다.`),
      );
    }, BUILD_TIMEOUT_MS);

    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(
          new FatalError(
            `next build이 종료 코드 ${code}로 실패했습니다.\n--- 빌드 출력(마지막 부분) ---\n${buildOutput.join('').slice(-4000)}`,
          ),
        );
      }
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(new FatalError(`next build spawn 실패: ${e.message}`));
    });
  });
}

async function measureTTFBOnce(browser, url) {
  const context = await browser.newContext(); // 매 방문 전 새 컨텍스트 — 캐시 비움
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    return await page.evaluate(() => {
      const [nav] = performance.getEntriesByType('navigation');
      return nav.responseStart - nav.requestStart;
    });
  } finally {
    await context.close();
  }
}

async function measureByteTransfer(browser, url) {
  const context = await browser.newContext(); // 캐시 없는 새 컨텍스트
  try {
    const page = await context.newPage();
    const pending = [];

    // Content-Length 헤더가 없는 응답(예: chunked transfer-encoding)은
    // 실제 body 길이를 대신 잰다 — 헤더 부재를 0바이트로 오인하면 총
    // 전송량이 과소 집계된다.
    page.on('response', (response) => {
      const task = (async () => {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        let length;
        if (contentLength) {
          length = Number(contentLength);
        } else {
          try {
            const body = await response.body();
            length = body.length;
          } catch {
            // 리다이렉트/캐시 응답 등 body를 읽을 수 없는 경우 — 0으로 처리
            length = 0;
          }
        }
        return { url: response.url(), length };
      })();
      pending.push(task);
    });

    await page.goto(url, { waitUntil: 'networkidle' });

    const measured = await Promise.all(pending);
    let totalBytes = 0;
    let fontBytes = 0;
    for (const { url: responseUrl, length } of measured) {
      totalBytes += length;
      if (responseUrl.endsWith('.woff2')) {
        fontBytes += length;
      }
    }

    const fontPercent = totalBytes > 0 ? (fontBytes / totalBytes) * 100 : 0;
    return { totalBytes, fontBytes, fontPercent };
  } finally {
    await context.close();
  }
}

async function measureScrollFrameBudget(browser, url) {
  const context = await browser.newContext({ viewport: SCROLL_VIEWPORT });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Source: 08-RESEARCH.md § Code Examples — rAF 프레임 델타 수집.
    const result = await page.evaluate(
      async ({ distance, waitMs, budgetMs, overBudgetMs }) => {
        const el = document.scrollingElement;
        const deltas = [];
        let last = performance.now();
        const collect = () => {
          const now = performance.now();
          deltas.push(now - last);
          last = now;
        };
        let rafId;
        const raf = () => {
          collect();
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);
        el.scrollBy({ top: distance, behavior: 'smooth' });
        await new Promise((r) => setTimeout(r, waitMs));
        cancelAnimationFrame(rafId);
        const overBudget = deltas.filter((d) => d > overBudgetMs).length;
        return {
          totalFrames: deltas.length,
          overBudgetFrames: overBudget,
          ratio: deltas.length > 0 ? overBudget / deltas.length : 0,
        };
      },
      {
        distance: SCROLL_DISTANCE_PX,
        waitMs: SCROLL_WAIT_MS,
        budgetMs: FRAME_BUDGET_MS,
        overBudgetMs: OVER_BUDGET_THRESHOLD_MS,
      },
    );
    return result;
  } finally {
    await context.close();
  }
}

async function main() {
  const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');

  console.log('e2e-perf-budget: next build 시작...');
  await runNextBuild(nextBin);
  console.log('e2e-perf-budget: next build 완료');

  const serverOutput = [];
  const child = spawn(process.execPath, [nextBin, 'start', '--port', String(PORT), '--hostname', HOST], {
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
    console.log('e2e-perf-budget: 프로덕션 서버(next start) 기동 완료');

    browser = await chromium.launch();

    const results = [];

    // --- (1) TTFB: 6종 라우트 각 5회 방문, 중앙값 ---
    console.log('\ne2e-perf-budget: TTFB 측정 시작 (라우트당 5회 방문, 중앙값 계산)');
    const ttfbByRoute = {};
    for (const routeCfg of TTFB_ROUTES) {
      const samples = [];
      for (let i = 0; i < TTFB_SAMPLE_COUNT; i++) {
        const ttfb = await measureTTFBOnce(browser, `${BASE_URL}${routeCfg.route}`);
        samples.push(ttfb);
      }
      const med = median(samples);
      ttfbByRoute[routeCfg.route] = med;
      console.log(
        `e2e-perf-budget: TTFB ${routeCfg.route} (${routeCfg.label}) — 중앙값 ${med.toFixed(2)}ms (샘플: ${samples.map((s) => s.toFixed(1)).join(', ')})`,
      );
    }

    const baselineMedian = ttfbByRoute[TTFB_BASELINE_ROUTE];
    const ttfbThreshold = baselineMedian * 2 + 15;
    console.log(
      `e2e-perf-budget: TTFB 판정 기준 = /about 중앙값(${baselineMedian.toFixed(2)}ms) × 2 + 15ms = ${ttfbThreshold.toFixed(2)}ms`,
    );

    for (const routeCfg of TTFB_ROUTES) {
      if (!routeCfg.judged) continue;
      const med = ttfbByRoute[routeCfg.route];
      const pass = med <= ttfbThreshold;
      results.push({
        name: `TTFB ${routeCfg.route}`,
        pass,
        reasons: pass
          ? []
          : [
              `TTFB 중앙값(${med.toFixed(2)}ms)이 판정 기준(${ttfbThreshold.toFixed(2)}ms)을 초과합니다`,
            ],
      });
    }

    // --- (2) 첫 방문 전송 바이트 (판정 없음 — 숫자만 낸다) ---
    console.log('\ne2e-perf-budget: 첫 방문 전송 바이트 측정 시작');
    const byteResult = await measureByteTransfer(browser, `${BASE_URL}${BYTES_ROUTE}`);
    console.log(
      `e2e-perf-budget: ${BYTES_ROUTE} 첫 방문 총 전송 바이트 = ${byteResult.totalBytes}bytes, .woff2 합계 = ${byteResult.fontBytes}bytes, 폰트 비중 = ${byteResult.fontPercent.toFixed(2)}%`,
    );

    // --- (3) 스크롤 프레임 예산 ---
    console.log('\ne2e-perf-budget: 스크롤 프레임 예산 측정 시작 (768×1024, 2000px 스무스 스크롤)');
    const frameResult = await measureScrollFrameBudget(browser, `${BASE_URL}${SCROLL_ROUTE}`);
    const frameRatio = frameResult.ratio;
    console.log(
      `e2e-perf-budget: ${SCROLL_ROUTE} 총 프레임 = ${frameResult.totalFrames}, 25ms 초과 프레임 = ${frameResult.overBudgetFrames}, 비율 = ${(frameRatio * 100).toFixed(2)}%`,
    );
    const framePass = frameRatio <= OVER_BUDGET_RATIO_MAX;
    results.push({
      name: `Scroll frame budget ${SCROLL_ROUTE}`,
      pass: framePass,
      reasons: framePass
        ? []
        : [
            `25ms 초과 프레임 비율(${(frameRatio * 100).toFixed(2)}%)이 허용치(${(OVER_BUDGET_RATIO_MAX * 100).toFixed(0)}%)를 초과합니다`,
          ],
    });

    await browser.close();
    browser = undefined;

    // --- 기준선 요약 블록 (SUMMARY에 그대로 옮겨 적을 수 있게) ---
    console.log('\n=== e2e-perf-budget: 기준선 요약 ===');
    console.log('TTFB 중앙값(ms):');
    for (const routeCfg of TTFB_ROUTES) {
      console.log(
        `  ${routeCfg.route} (${routeCfg.label}): ${ttfbByRoute[routeCfg.route].toFixed(2)}ms${routeCfg.judged ? ' [판정 대상]' : ' [관측만]'}`,
      );
    }
    console.log(
      `첫 방문 전송 바이트(${BYTES_ROUTE}): 총 ${byteResult.totalBytes}bytes, 폰트(.woff2) ${byteResult.fontBytes}bytes (${byteResult.fontPercent.toFixed(2)}%)`,
    );
    console.log(
      `스크롤 프레임 예산(${SCROLL_ROUTE}): 총 ${frameResult.totalFrames}프레임, 25ms 초과 ${frameResult.overBudgetFrames}프레임 (${(frameRatio * 100).toFixed(2)}%)`,
    );
    console.log('=== 요약 끝 ===\n');

    if (results.length === 0) {
      throw new FatalError('판정 결과가 0건입니다 — 판정 대상 라우트 목록을 확인하세요.');
    }

    const failures = results.filter((r) => !r.pass);
    if (failures.length > 0) {
      console.error(`e2e-perf-budget: ${failures.length}건의 성능 예산 위반이 발견되었습니다:\n`);
      for (const f of failures) {
        console.error(`  - ${f.name}:`);
        for (const reason of f.reasons) {
          console.error(`      · ${reason}`);
        }
      }
      throw new FatalError(`${failures.length}건의 성능 예산 위반으로 게이트 실패`);
    }

    console.log(`e2e-perf-budget: 판정 대상 ${results.length}건 전부 통과`);
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
    console.error(`e2e-perf-budget: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
