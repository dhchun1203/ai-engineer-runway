#!/usr/bin/env node
// 실제 개발 서버를 띄우고 Playwright(Chromium)로 렌더된 레슨 페이지의
// getComputedStyle 크기·굵기 히스토그램을 측정하는 런타임 타이포 게이트 (D-89, D-98).
//
// e2e-today.mjs와 달리 순수 fetch()가 아니라 실제 레이아웃 엔진이 필요하다 —
// getComputedStyle과 ::before/::after content는 SSR HTML 문자열에는 존재하지
// 않고 브라우저가 레이아웃·스타일을 계산해야만 얻을 수 있는 값이기 때문이다
// (06-RESEARCH.md § Don't Hand-Roll).
//
// 부트스트랩(서버 spawn/대기/종료)은 e2e-today.mjs의 형태를 그대로 복제한다 —
// 기존 게이트 8종이 전부 "재사용 안 함, 복제" 원칙을 따르므로 공유 모듈로
// 빼지 않는다.
//
// 실행: node --env-file=.env.local scripts/e2e-typography.mjs [--report-only]
//
// --report-only: 히스토그램만 출력하고 항상 exit 0 — 현재 코드의 이탈(예: h2
// 24px, 표 안 인라인 코드 12.25px/600)을 도구가 실제로 탐지하는지 확인하는
// 베이스라인 측정 모드다. 이 모드에서는 허용 집합 위반도 실패로 취급하지
// 않는다 — 측정 대상 0건만은 이 모드에서도 감춰지지 않도록 별도로 출력한다.
//
// 어떤 출력에도 쿠키 값·시크릿을 찍지 않는다.

import { chromium } from '@playwright/test';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = process.env.E2E_TYPOGRAPHY_PORT ? Number(process.env.E2E_TYPOGRAPHY_PORT) : 3212;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 180_000;
const FETCH_TIMEOUT_MS = 30_000;

const REPORT_ONLY = process.argv.includes('--report-only');

// D-R4K-4 / 06-UI-SPEC.md § Typography — 허용 크기(px)·굵기 집합. 인라인
// 코드 15px(0.9375rem)도 포함된 5+1종/3굵기다.
// quick 260828-d3n: 디스플레이 30 -> 36px, 굵기 800/900 추가(옮겨온 디자인의 굵은 제목).
const ALLOWED_SIZES_PX = [36, 22, 17, 16, 15, 14];
const ALLOWED_WEIGHTS = [400, 600, 700, 800, 900];

// 측정 라우트 — 콘텐츠가 있는 레슨 1편이 기본값. 배열 상수라 나중에 늘릴 수
// 있다(06-08 최종 스위트가 같은 범위로 재실행될 예정).
const ROUTES = ['/lesson/1-1-course-orientation'];

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
      `e2e-typography: ${name} 환경 변수가 비어 있습니다. \`node --env-file=.env.local scripts/e2e-typography.mjs\`로 실행하세요.`,
    );
    process.exit(1);
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

// 콘텐츠 루트 하위에서 pre(Shiki 코드 블록) 밖의, 직접 텍스트 노드를 가진
// 요소만 측정한다 — 자식 요소만 가진 래퍼 div는 중복 집계를 만든다. 인라인
// code 요소는 ::before/::after의 content도 함께 확인해 백틱 글리프 잔존
// 여부를 잡는다(D-R4K-5).
//
// 루트 셀렉터로 `main`이 아니라 `article`을 쓴다 — 06-01 시점의
// `/lesson/[lessonId]`는 아직 `<main>` 랜드마크가 없고(D-R4K-8, 06-06 소유
// 범위) 최상위가 `<article>`이다(06-RESEARCH.md 셸 비교표). `<article>`은
// 06-06이 `<main><article>...</article></main>`로 감싼 뒤에도 그대로 남으므로
// 이 셀렉터는 현재와 이후 상태 모두에서 유효하다.
function buildBrowserMeasurementScript() {
  return () => {
    const root = document.querySelector('article') ?? document.querySelector('main');
    if (!root) return { measured: 0, sizes: {}, weights: {}, backtickViolations: [] };

    const all = Array.from(root.querySelectorAll('*'));
    const sizes = {};
    const weights = {};
    const backtickViolations = [];
    let measured = 0;

    function buildSelectorHint(el) {
      const tag = el.tagName.toLowerCase();
      const cls = typeof el.className === 'string' && el.className.trim() ? el.className.trim().split(/\s+/)[0] : '';
      const text = (el.textContent || '').trim().slice(0, 24).replace(/\s+/g, ' ');
      return `${tag}${cls ? '.' + cls : ''} "${text}"`;
    }

    for (const el of all) {
      if (el.closest('pre')) continue;

      const hasDirectText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0,
      );
      if (!hasDirectText) continue;

      measured += 1;
      const cs = getComputedStyle(el);
      const fontSize = cs.fontSize;
      const fontWeight = cs.fontWeight;

      if (!sizes[fontSize]) sizes[fontSize] = { count: 0, sample: buildSelectorHint(el) };
      sizes[fontSize].count += 1;

      if (!weights[fontWeight]) weights[fontWeight] = { count: 0, sample: buildSelectorHint(el) };
      weights[fontWeight].count += 1;

      if (el.tagName === 'CODE') {
        const beforeContent = getComputedStyle(el, '::before').content;
        const afterContent = getComputedStyle(el, '::after').content;
        if (beforeContent !== 'none' || afterContent !== 'none') {
          backtickViolations.push({
            selector: buildSelectorHint(el),
            before: beforeContent,
            after: afterContent,
          });
        }
      }
    }

    return { measured, sizes, weights, backtickViolations };
  };
}

function mergeHistogram(target, source) {
  for (const [key, info] of Object.entries(source)) {
    if (!target[key]) {
      target[key] = { count: 0, sample: info.sample };
    }
    target[key].count += info.count;
  }
}

function printHistogram(title, histogram) {
  console.log(`e2e-typography: ${title}`);
  const entries = Object.entries(histogram).sort((a, b) => b[1].count - a[1].count);
  if (entries.length === 0) {
    console.log('  (측정된 값 없음)');
    return;
  }
  for (const [value, info] of entries) {
    console.log(`  ${value}: ${info.count}건 (예: ${info.sample})`);
  }
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

  let browser;
  try {
    try {
      await waitForServerReady();
    } catch (e) {
      throw new FatalError(
        `${e.message}\n--- 서버 출력(마지막 부분) ---\n${serverOutput.join('').slice(-4000)}`,
      );
    }
    console.log('e2e-typography: 개발 서버 기동 완료');

    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const totalSizes = {};
    const totalWeights = {};
    const totalBacktickViolations = [];
    let totalMeasured = 0;

    for (let i = 0; i < ROUTES.length; i++) {
      const route = ROUTES[i];
      const scenario = `t${i + 1}/${ROUTES.length}`;

      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('article, main');

      const result = await page.evaluate(buildBrowserMeasurementScript());

      totalMeasured += result.measured;
      mergeHistogram(totalSizes, result.sizes);
      mergeHistogram(totalWeights, result.weights);
      totalBacktickViolations.push(
        ...result.backtickViolations.map((v) => ({ ...v, route })),
      );

      console.log(`e2e-typography: ${scenario} ${route} 측정 완료 (요소 ${result.measured}개)`);
    }

    await browser.close();
    browser = undefined;

    printHistogram('크기(font-size) 히스토그램', totalSizes);
    printHistogram('굵기(font-weight) 히스토그램', totalWeights);

    if (totalBacktickViolations.length > 0) {
      console.log(`e2e-typography: 인라인 코드 백틱 글리프 잔존 ${totalBacktickViolations.length}건`);
      for (const v of totalBacktickViolations) {
        console.log(`  ${v.route} — ${v.selector} (::before=${v.before}, ::after=${v.after})`);
      }
    }

    console.log(`e2e-typography: 총 측정 요소 ${totalMeasured}개`);

    // 측정 대상 부재는 --report-only 모드에서도 감춰지지 않는다 — 검사 대상
    // 부재 = 실패라는 원칙은 "히스토그램 정보성 출력"과는 별개다.
    if (totalMeasured === 0) {
      throw new FatalError(
        '측정 대상 요소가 0개입니다 — article/main 셀렉터 또는 측정 범위 로직을 확인하세요.',
      );
    }

    if (REPORT_ONLY) {
      console.log('e2e-typography: --report-only 모드 — 허용 집합 위반 여부와 무관하게 exit 0');
      return;
    }

    const issues = [];
    for (const [size, info] of Object.entries(totalSizes)) {
      const px = parseFloat(size);
      if (!ALLOWED_SIZES_PX.includes(px)) {
        issues.push(`허용되지 않은 font-size ${size} (${info.count}건, 예: ${info.sample})`);
      }
    }
    for (const [weight, info] of Object.entries(totalWeights)) {
      const w = parseInt(weight, 10);
      if (!ALLOWED_WEIGHTS.includes(w)) {
        issues.push(`허용되지 않은 font-weight ${weight} (${info.count}건, 예: ${info.sample})`);
      }
    }
    for (const v of totalBacktickViolations) {
      issues.push(
        `인라인 코드 백틱 글리프 잔존 — ${v.route} ${v.selector} (::before=${v.before}, ::after=${v.after})`,
      );
    }

    if (issues.length > 0) {
      throw new FatalError(`${issues.length}건의 타이포 위반이 발견되었습니다:\n  - ${issues.join('\n  - ')}`);
    }

    console.log(
      'e2e-typography: 크기 5+1종/굵기 3종 허용 집합 밖의 값 없음, 인라인 코드 백틱 글리프 잔존 없음 — 전부 통과',
    );
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
    console.error(`e2e-typography: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
