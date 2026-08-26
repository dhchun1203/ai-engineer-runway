#!/usr/bin/env node
// 실제 개발 서버를 띄우고 Playwright(Chromium)로 375×667(폰)·768×1024(아이패드
// 세로)·1024×768(아이패드 가로) 세 뷰포트에서 가로 오버플로가 0임을 확인하는
// 런타임 게이트 (D-91). `03-VERIFICATION.md`의 truth #9("375px에서 독립적으로
// 재확인되지 않음")가 두 Phase 연속 사람 확인 없이 남았던 항목을 자동 게이트로 닫는다.
//
// 부트스트랩(서버 spawn/대기/종료)은 e2e-typography.mjs/e2e-today.mjs의 형태를
// 그대로 복제한다 — 기존 게이트 전부 "재사용 안 함, 복제" 원칙을 따르므로
// 공유 모듈로 빼지 않는다.
//
// 실행: node --env-file=.env.local scripts/e2e-mobile-overflow.mjs
//
// 판정식: document.documentElement.scrollWidth <= document.documentElement.clientWidth
// (등호 포함 — 딱 맞는 상태는 통과). 두 값이 정수 반올림이라 0.5px 미만
// 오버플로를 놓칠 수 있으므로, 페이지 안 모든 요소의 getBoundingClientRect().right
// 최댓값이 clientWidth + 1px 이하인지도 함께 확인한다(소수점을 유지하는 보완 측정).
//
// 측정 전 필수 단언(치명적 위양성 방지, T-06-22): body/documentElement의
// computed overflow-x가 hidden이면 그 자체를 위반으로 본다 — hidden이 걸려
// 있으면 scrollWidth가 오버플로를 감춰 이 게이트가 영원히 초록불이 된다.
//
// 표 특례: 표가 있는 라우트에서 각 table의 래퍼 div(overflow-x-auto)의
// scrollWidth/clientWidth를 관측 로그로만 남긴다(위반 판정 아님) — 06-06의
// 래퍼가 스크롤바 폭을 차지해 표의 여유를 줄였는지 나중에 추적하기 위함이다.
// 같은 원칙으로, right 보완 측정은 조상 중 overflow-x:auto/scroll 컨테이너가
// 있는 요소(표 래퍼 내부, 코드 블록 내부 등 의도된 로컬 가로 스크롤)를
// 제외한다 — 이 게이트는 "문서가 밀리는가"를 보는 것이지 "스크롤 컨테이너
// 안에 긴 콘텐츠가 있는가"를 보는 것이 아니다.
//
// 라우트 목록은 .velite/lessons.json을 독립 재파싱해 hasContent=false 레슨을
// 찾는다(앱 코드를 import하지 않는다 — 같은 함수를 재사용하면 계산이 틀려도
// 검증이 같이 틀린다). 0편이면 존재하지 않는 슬러그로 not-found 셸을 대신
// 검사하고 그 사실을 로그에 남긴다.
//
// 어떤 출력에도 쿠키 값·시크릿을 찍지 않는다.

import { chromium } from '@playwright/test';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// e2e-typography.mjs의 기본 포트(3212)와 겹치지 않아야 두 게이트를 잇달아
// 돌릴 때 포트 충돌로 인한 위음성 실패가 나지 않는다.
const PORT = process.env.E2E_OVERFLOW_PORT ? Number(process.env.E2E_OVERFLOW_PORT) : 3213;
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
      `e2e-mobile-overflow: ${name} 환경 변수가 비어 있습니다. \`node --env-file=.env.local scripts/e2e-mobile-overflow.mjs\`로 실행하세요.`,
    );
    process.exit(1);
  }
}

// 뷰포트 3종 — 폰만 고치고 태블릿을 깨뜨리는 것을 막기 위해 셋을 모두 돈다.
const VIEWPORTS = [
  { width: 375, height: 667, label: '375×667(폰)' },
  { width: 768, height: 1024, label: '768×1024(아이패드 세로)' },
  { width: 1024, height: 768, label: '1024×768(아이패드 가로)' },
];

// e2e-today.mjs와 같은 방식으로 .velite/lessons.json을 독립 재파싱한다 —
// curriculum-helpers.ts를 import하지 않는다.
function readLessonsManifest() {
  const lessonsPath = path.join(ROOT, '.velite', 'lessons.json');
  if (!fs.existsSync(lessonsPath)) {
    console.error(
      `e2e-mobile-overflow: ${path.relative(ROOT, lessonsPath)}가 없습니다. \`npm run dev\` 또는 \`npm run build\`를 한 번 실행해 Velite 매니페스트를 생성한 뒤 다시 시도하세요.`,
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
}

function buildRoutes() {
  const lessons = readLessonsManifest();
  const emptyContentLessons = lessons.filter((l) => l.hasContent === false);

  let shellRoute;
  let shellLabel;
  if (emptyContentLessons.length > 0) {
    const lesson = emptyContentLessons[0];
    shellRoute = `/lesson/${lesson.slug}`;
    shellLabel = `콘텐츠 없는 레슨 셸(hasContent=false, ${lesson.slug})`;
    console.log(
      `e2e-mobile-overflow: hasContent=false 레슨 ${emptyContentLessons.length}편 발견 — ${lesson.slug}를 셸 라우트로 사용`,
    );
  } else {
    shellRoute = '/lesson/e2e-overflow-notfound-probe';
    shellLabel = '셸만 렌더되는 not-found 라우트(존재하지 않는 레슨 슬러그로 대체)';
    console.log(
      'e2e-mobile-overflow: hasContent=false 레슨 0편 — 존재하지 않는 레슨 슬러그로 not-found 셸을 대신 검사',
    );
  }

  return [
    { route: '/', label: '홈', wait: 'main' },
    { route: '/curriculum', label: '커리큘럼', wait: 'main' },
    { route: '/schedule', label: '일정표', wait: 'main' },
    { route: '/step/1', label: 'Step 1', wait: 'main' },
    { route: '/about', label: '소개', wait: 'main' },
    // 레슨 라우트는 06-06이 확정한 prose 컨테이너 id(#lesson-article)로 대기한다.
    { route: '/lesson/1-1-course-orientation', label: '콘텐츠 레슨(표 포함)', wait: '#lesson-article' },
    { route: shellRoute, label: shellLabel, wait: 'main' },
  ];
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

// 브라우저 안에서 실행되는 측정 함수. 측정 전에 body/documentElement의
// overflow-x가 hidden이 아님을 먼저 단언한다(T-06-22) — hidden이면 그 자체를
// 위반으로 보고, scrollWidth 기반 판정은 무효로 취급한다.
function buildOverflowMeasurementScript() {
  return () => {
    const bodyOverflowX = getComputedStyle(document.body).overflowX;
    const htmlOverflowX = getComputedStyle(document.documentElement).overflowX;
    const hiddenGuardViolation = bodyOverflowX === 'hidden' || htmlOverflowX === 'hidden';

    const docEl = document.documentElement;
    const scrollWidth = docEl.scrollWidth;
    const clientWidth = docEl.clientWidth;

    // 자기 자신이 아니라 조상 중 하나가 overflow-x:auto/scroll이면 그 조상의
    // 스크롤 컨테이너 내부에서 의도적으로 넘치는 콘텐츠다(표 래퍼, 코드 블록의
    // 가로 스크롤 등) — 문서 수준 오버플로 판정에서 제외한다. 이 게이트가
    // 검사하는 것은 "문서가 가로로 밀리는가"이지 "스크롤 컨테이너 안에 긴
    // 콘텐츠가 있는가"가 아니다(표 특례와 같은 원칙).
    function hasScrollableAncestor(el) {
      let node = el.parentElement;
      while (node && node !== document.documentElement) {
        const style = getComputedStyle(node);
        if (style.overflowX === 'auto' || style.overflowX === 'scroll') return true;
        node = node.parentElement;
      }
      return false;
    }

    let maxRight = 0;
    let maxRightSelector = '';
    for (const el of document.querySelectorAll('*')) {
      if (hasScrollableAncestor(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.right > maxRight) {
        maxRight = rect.right;
        const tag = el.tagName.toLowerCase();
        const cls =
          typeof el.className === 'string' && el.className.trim()
            ? el.className.trim().split(/\s+/)[0]
            : '';
        maxRightSelector = `${tag}${cls ? '.' + cls : ''}`;
      }
    }

    // 표 특례 — table 래퍼(div.overflow-x-auto > table)별 scrollWidth/clientWidth
    // 관측 로그. 위반 판정이 아니라 정보성 기록이다.
    const tableObservations = [];
    for (const wrapper of document.querySelectorAll('div.overflow-x-auto')) {
      if (!wrapper.querySelector(':scope > table')) continue;
      tableObservations.push({
        scrollWidth: wrapper.scrollWidth,
        clientWidth: wrapper.clientWidth,
      });
    }

    return {
      bodyOverflowX,
      htmlOverflowX,
      hiddenGuardViolation,
      scrollWidth,
      clientWidth,
      maxRight,
      maxRightSelector,
      tableObservations,
    };
  };
}

async function main() {
  const routes = buildRoutes();

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
    console.log('e2e-mobile-overflow: 개발 서버 기동 완료');

    browser = await chromium.launch();

    const results = [];
    const totalCombos = routes.length * VIEWPORTS.length;
    let comboIndex = 0;

    for (const routeCfg of routes) {
      for (const vp of VIEWPORTS) {
        comboIndex += 1;
        const scenario = `t${comboIndex}/${totalCombos}`;

        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const page = await context.newPage();
        try {
          await page.goto(`${BASE_URL}${routeCfg.route}`, { waitUntil: 'domcontentloaded' });
          await page.waitForSelector(routeCfg.wait);

          const m = await page.evaluate(buildOverflowMeasurementScript());

          console.log(
            `e2e-mobile-overflow: ${scenario} ${routeCfg.route} @ ${vp.label} — overflow-x 사전 확인: body=${m.bodyOverflowX}, html=${m.htmlOverflowX}`,
          );

          const reasons = [];
          if (m.hiddenGuardViolation) {
            reasons.push(
              `body/html에 overflow-x:hidden이 걸려 있어 측정이 무효화됩니다 (body=${m.bodyOverflowX}, html=${m.htmlOverflowX}) — T-06-22`,
            );
          } else {
            if (m.scrollWidth > m.clientWidth) {
              reasons.push(
                `documentElement.scrollWidth(${m.scrollWidth}px) > clientWidth(${m.clientWidth}px)`,
              );
            }
            if (m.maxRight > m.clientWidth + 1) {
              reasons.push(
                `요소 최대 right(${m.maxRight.toFixed(2)}px, ${m.maxRightSelector})가 clientWidth+1(${m.clientWidth + 1}px)을 초과합니다`,
              );
            }
          }

          results.push({
            route: routeCfg.route,
            label: routeCfg.label,
            width: vp.width,
            viewportLabel: vp.label,
            pass: reasons.length === 0,
            reasons,
          });

          for (const obs of m.tableObservations) {
            const margin = obs.clientWidth - obs.scrollWidth;
            console.log(
              `e2e-mobile-overflow: ${scenario} ${routeCfg.route} @ ${vp.label} — 표 래퍼 관측: scrollWidth=${obs.scrollWidth}px clientWidth=${obs.clientWidth}px 여유=${margin}px`,
            );
          }

          console.log(
            `e2e-mobile-overflow: ${scenario} ${routeCfg.route} @ ${vp.label} — scrollWidth=${m.scrollWidth}px clientWidth=${m.clientWidth}px maxRight=${m.maxRight.toFixed(2)}px`,
          );
        } finally {
          await context.close();
        }
      }
    }

    await browser.close();
    browser = undefined;

    console.log(`e2e-mobile-overflow: 검사한 (라우트 × 뷰포트) 조합 수 = ${results.length}`);

    // 검사 대상 0건은 이 게이트가 아무것도 측정하지 못한 상태를 성공으로
    // 둔갑시키지 않는다(check-brand.mjs와 같은 방어 로직).
    if (results.length === 0) {
      throw new FatalError('검사한 (라우트 × 뷰포트) 조합이 0건입니다 — 라우트/뷰포트 목록을 확인하세요.');
    }

    const failures = results.filter((r) => !r.pass);
    // 실패는 라우트 오름차순, 같은 라우트 안에서는 뷰포트 폭 오름차순으로 정렬한다.
    failures.sort((a, b) => {
      if (a.route !== b.route) return a.route < b.route ? -1 : 1;
      return a.width - b.width;
    });

    if (failures.length > 0) {
      console.error(`e2e-mobile-overflow: ${failures.length}건의 가로 오버플로 위반이 발견되었습니다:\n`);
      for (const f of failures) {
        console.error(`  - ${f.route} @ ${f.viewportLabel} (${f.label}):`);
        for (const reason of f.reasons) {
          console.error(`      · ${reason}`);
        }
      }
      throw new FatalError(`${failures.length}건의 가로 오버플로 위반으로 게이트 실패`);
    }

    console.log(
      `e2e-mobile-overflow: 375/768/1024 세 뷰포트 × ${routes.length}개 라우트 = ${results.length}개 조합 전부 가로 오버플로 0 — 전부 통과`,
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
    console.error(`e2e-mobile-overflow: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
