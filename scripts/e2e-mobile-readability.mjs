#!/usr/bin/env node
// 375px "좁아서 참고 쓴다"는 감각을 세 개의 숫자로 바꾸는 정량 가독성 게이트 (08-05).
// e2e-mobile-overflow.mjs의 골격(env 검증, FatalError, waitForServerReady,
// killServerTree, 서버 spawn·조합 순회)을 그대로 복제한다 — 이 저장소 게이트
// 전부 "재사용 안 함, 복제" 원칙을 따르므로 공유 모듈로 빼지 않는다.
//
// 실행: node --env-file=.env.local scripts/e2e-mobile-readability.mjs
//
// 측정 지표 3종(브라우저 안에서 실행):
//   M1 터치 타깃 — a/button/summary 중 getBoundingClientRect().height < 44.
//     보이지 않는 요소(offsetParent null 또는 rect width·height 둘 다 0)와
//     인라인 링크(부모가 p이거나 조상에 .prose가 있는 a)는 제외한다.
//   M2 짧은 텍스트의 과도한 줄바꿈 — 자식 요소가 없고 textContent trim 길이가
//     30 이하인 leaf 요소 중, 렌더 줄 수(Math.round(rect.height / lineHeight),
//     lineHeight는 getComputedStyle에서 읽고 normal이면 fontSize*1.2로 대체)가
//     3 이상이면 위반.
//   M3 텍스트 컨테이너 최소 폭 — 같은 leaf 텍스트 요소 중 콘텐츠 박스 폭
//     (rect.width - paddingLeft - paddingRight)이 120 미만이면 위반. 단
//     텍스트 길이 4자 이하(배지·아이콘 캡션 등)는 제외한다.
//
// 판정은 375px에서만 한다 — 768px·1024px(아이패드 세로/가로)은 관측 로그로만
// 남겨 아이패드 회귀를 눈으로 추적할 수 있게 한다.
//
// 어떤 출력에도 쿠키 값·시크릿을 찍지 않는다. M2/M3 위반 보고에는 텍스트를
// 앞 20자까지만 싣는다(T-08-05-01).

import { chromium } from '@playwright/test';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// e2e-typography.mjs(3212)·e2e-mobile-overflow.mjs(3213)·e2e-perf-budget.mjs(3214)와
// 겹치지 않아야 게이트를 잇달아 돌릴 때 포트 충돌로 인한 위음성 실패가 나지 않는다.
const PORT = process.env.E2E_READABILITY_PORT ? Number(process.env.E2E_READABILITY_PORT) : 3215;
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
      `e2e-mobile-readability: ${name} 환경 변수가 비어 있습니다. \`node --env-file=.env.local scripts/e2e-mobile-readability.mjs\`로 실행하세요.`,
    );
    process.exit(1);
  }
}

// 라우트 6종 — 계획이 명시적으로 고정한 목록이다(매니페스트 재파싱으로 도출하지 않음).
const ROUTES = [
  { route: '/', label: '홈', wait: 'main' },
  { route: '/curriculum', label: '커리큘럼', wait: 'main' },
  { route: '/schedule', label: '일정표', wait: 'main' },
  { route: '/step/1', label: 'Step 1', wait: 'main' },
  { route: '/lesson/1-1-course-orientation', label: '콘텐츠 레슨', wait: '#lesson-article' },
  { route: '/about', label: '소개', wait: 'main' },
];

// 뷰포트 3종 — 판정은 375px에서만 하고 나머지 둘은 관측 로그로만 남긴다.
const VIEWPORTS = [
  { width: 375, height: 667, label: '375×667(폰)', judged: true },
  { width: 768, height: 1024, label: '768×1024(아이패드 세로)', judged: false },
  { width: 1024, height: 768, label: '1024×768(아이패드 가로)', judged: false },
];

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

// 브라우저 안에서 실행되는 측정 함수. Playwright가 직렬화해 페이지 컨텍스트에서
// 실행하므로 바깥 스코프 변수를 참조하지 않는다(isScheduleRoute만 인자로 받음).
function buildReadabilityMeasurementScript() {
  return (isScheduleRoute) => {
    const SHORT_TEXT_MAX_LEN = 30;
    const MIN_LINE_COUNT_VIOLATION = 3;
    const MIN_CONTENT_WIDTH = 120;
    const MIN_WIDTH_EXCLUDE_TEXT_LEN = 4;
    const MIN_TOUCH_TARGET_HEIGHT = 44;
    const SNIPPET_LEN = 20; // T-08-05-01: 텍스트는 앞 20자까지만 로그에 싣는다.

    function firstClass(el) {
      return typeof el.className === 'string' && el.className.trim()
        ? el.className.trim().split(/\s+/)[0]
        : '';
    }

    function isHidden(el) {
      const rect = el.getBoundingClientRect();
      return el.offsetParent === null || (rect.width === 0 && rect.height === 0);
    }

    function hasAncestorClass(el, cls) {
      let node = el.parentElement;
      while (node) {
        if (node.classList && node.classList.contains(cls)) return true;
        node = node.parentElement;
      }
      return false;
    }

    function isInlineLink(el) {
      if (el.tagName !== 'A') return false;
      if (el.parentElement && el.parentElement.tagName === 'P') return true;
      return hasAncestorClass(el, 'prose');
    }

    function computeLineCount(el) {
      const cs = getComputedStyle(el);
      let lineHeightPx = parseFloat(cs.lineHeight);
      if (cs.lineHeight === 'normal' || Number.isNaN(lineHeightPx)) {
        lineHeightPx = parseFloat(cs.fontSize) * 1.2;
      }
      const rect = el.getBoundingClientRect();
      if (!lineHeightPx || lineHeightPx <= 0) return 0;
      return Math.round(rect.height / lineHeightPx);
    }

    const m1 = [];
    const m2 = [];
    const m3 = [];

    // --- M1: 터치 타깃 --------------------------------------------------
    for (const el of document.querySelectorAll('a, button, summary')) {
      if (isHidden(el)) continue;
      if (isInlineLink(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.height < MIN_TOUCH_TARGET_HEIGHT) {
        m1.push({
          tag: el.tagName.toLowerCase(),
          cls: firstClass(el),
          textSnippet: (el.textContent || '').trim().slice(0, SNIPPET_LEN),
          height: Math.round(rect.height * 100) / 100,
        });
      }
    }

    // --- M2/M3: leaf 텍스트 요소 -----------------------------------------
    const EXCLUDED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
    for (const el of document.querySelectorAll('*')) {
      if (el.children.length !== 0) continue;
      if (EXCLUDED_TAGS.has(el.tagName)) continue;
      const text = (el.textContent || '').trim();
      if (text.length === 0) continue;
      if (isHidden(el)) continue;

      if (text.length <= SHORT_TEXT_MAX_LEN) {
        const lines = computeLineCount(el);
        if (lines >= MIN_LINE_COUNT_VIOLATION) {
          m2.push({
            tag: el.tagName.toLowerCase(),
            cls: firstClass(el),
            textSnippet: text.slice(0, SNIPPET_LEN),
            lines,
          });
        }
      }

      if (text.length > MIN_WIDTH_EXCLUDE_TEXT_LEN) {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const contentWidth = rect.width - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0');
        if (contentWidth < MIN_CONTENT_WIDTH) {
          m3.push({
            tag: el.tagName.toLowerCase(),
            cls: firstClass(el),
            textSnippet: text.slice(0, SNIPPET_LEN),
            width: Math.round(contentWidth * 100) / 100,
          });
        }
      }
    }

    // --- 일정표 라우트 전용: 레슨 제목 최대 줄 수(관측, 판정 아님) ----------
    let scheduleTitleMaxLines = null;
    if (isScheduleRoute) {
      scheduleTitleMaxLines = 0;
      for (const el of document.querySelectorAll('a[href^="/lesson/"] span.text-body')) {
        if (isHidden(el)) continue;
        const lines = computeLineCount(el);
        if (lines > scheduleTitleMaxLines) scheduleTitleMaxLines = lines;
      }
    }

    return { m1, m2, m3, scheduleTitleMaxLines };
  };
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
    console.log('e2e-mobile-readability: 개발 서버 기동 완료');

    browser = await chromium.launch();

    const results = [];
    const totalCombos = ROUTES.length * VIEWPORTS.length;
    let comboIndex = 0;

    for (const routeCfg of ROUTES) {
      for (const vp of VIEWPORTS) {
        comboIndex += 1;
        const scenario = `t${comboIndex}/${totalCombos}`;

        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const page = await context.newPage();
        try {
          await page.goto(`${BASE_URL}${routeCfg.route}`, { waitUntil: 'domcontentloaded' });
          await page.waitForSelector(routeCfg.wait);

          const m = await page.evaluate(buildReadabilityMeasurementScript(), routeCfg.route === '/schedule');

          console.log(
            `e2e-mobile-readability: ${scenario} ${routeCfg.route} @ ${vp.label} — M1=${m.m1.length} M2=${m.m2.length} M3=${m.m3.length}` +
              (m.scheduleTitleMaxLines !== null ? ` scheduleTitleMaxLines=${m.scheduleTitleMaxLines}` : ''),
          );

          results.push({
            route: routeCfg.route,
            label: routeCfg.label,
            width: vp.width,
            viewportLabel: vp.label,
            judged: vp.judged,
            m1: m.m1,
            m2: m.m2,
            m3: m.m3,
            scheduleTitleMaxLines: m.scheduleTitleMaxLines,
          });
        } finally {
          await context.close();
        }
      }
    }

    await browser.close();
    browser = undefined;

    console.log(`e2e-mobile-readability: 검사한 (라우트 × 뷰포트) 조합 수 = ${results.length}`);

    if (results.length === 0) {
      throw new FatalError('검사한 (라우트 × 뷰포트) 조합이 0건입니다 — 라우트/뷰포트 목록을 확인하세요.');
    }

    // 375px 판정 대상만 필터링.
    const judgedResults = results.filter((r) => r.judged);
    const failures = judgedResults.filter((r) => r.m1.length + r.m2.length + r.m3.length > 0);
    failures.sort((a, b) => (a.route < b.route ? -1 : a.route > b.route ? 1 : 0));

    if (failures.length > 0) {
      console.error(`e2e-mobile-readability: 375px에서 ${failures.length}개 라우트에 가독성 위반이 발견되었습니다:\n`);
      for (const f of failures) {
        console.error(`  - ${f.route} (${f.label}) @ ${f.viewportLabel}:`);
        for (const v of f.m1) {
          console.error(`      · [M1 터치타깃] <${v.tag}.${v.cls || '(no-class)'}> "${v.textSnippet}" height=${v.height}px (<44px)`);
        }
        for (const v of f.m2) {
          console.error(`      · [M2 줄바꿈] <${v.tag}.${v.cls || '(no-class)'}> "${v.textSnippet}" lines=${v.lines}(>=3)`);
        }
        for (const v of f.m3) {
          console.error(`      · [M3 컨텐츠폭] <${v.tag}.${v.cls || '(no-class)'}> "${v.textSnippet}" width=${v.width}px (<120px)`);
        }
      }
    }

    // --- 요약표: 라우트 × 뷰포트별 M1/M2/M3 위반 수 + 일정표 레슨 제목 최대 줄 수 ---
    console.log('\ne2e-mobile-readability: 요약표 (라우트 × 뷰포트 → M1/M2/M3 위반 수, scheduleTitleMaxLines)');
    for (const r of results) {
      const judgeTag = r.judged ? '[판정]' : '[관측]';
      const titleCol = r.scheduleTitleMaxLines !== null ? `, scheduleTitleMaxLines=${r.scheduleTitleMaxLines}` : '';
      console.log(
        `  ${judgeTag} ${r.route} @ ${r.viewportLabel} — M1=${r.m1.length} M2=${r.m2.length} M3=${r.m3.length}${titleCol}`,
      );
    }

    if (failures.length > 0) {
      const totalViolations = failures.reduce((sum, f) => sum + f.m1.length + f.m2.length + f.m3.length, 0);
      throw new FatalError(`375px 가독성 위반 ${totalViolations}건으로 게이트 실패`);
    }

    console.log('\ne2e-mobile-readability: 375px M1·M2·M3 위반 0건 — 전부 통과');
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
    console.error(`e2e-mobile-readability: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
