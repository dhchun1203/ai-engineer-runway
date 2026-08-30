#!/usr/bin/env node
// 구간 테이프(Section Tape)를 클릭했을 때 "무엇을 표시하는가"와 "라벨이 테이프
// 경계 안에 있는가"를 검사하는 런타임 게이트 (06-09, G-06-9/G-06-2). 기존
// e2e-mobile-overflow.mjs의 부트스트랩(서버 spawn/폴링 대기/Windows taskkill
// 프로세스 트리 종료/FatalError/finally 정리/"검사 0건 = 실패" 방어/한국어
// 로그 + tN/총N 시나리오 번호)을 그대로 복제한다 — 기존 게이트 전부 "재사용
// 안 함, 복제" 원칙을 따르므로 공유 모듈로 빼지 않는다.
//
// 실행: node --env-file=.env.local scripts/e2e-section-tape.mjs
//
// e2e-typography.mjs(3212)·e2e-mobile-overflow.mjs(3213)와 겹치지 않는
// 기본 포트 3214 — 세 게이트를 잇달아 돌릴 때 포트 충돌로 인한 위음성
// 실패를 막는다. E2E_TAPE_PORT로 override 가능.
//
// 검사 대상: 주 라우트 /lesson/1-1-course-orientation(실제 h2 6개, 375×667·
// 768×1024 뷰포트 × reduce·no-preference 모션 모드 4조합 × 칸 6개 = 24건),
// 보조 라우트로 .velite/lessons.json의 마지막 레슨 1편(375×667 + reduce
// 하나만) — 다른 구간 수의 레슨도 훑어 6칸 하드코딩에 기대지 않음을 확인한다.
// 보조 라우트에서 테이프가 렌더되지 않거나 칸이 2개 미만이면 위반이 아니라
// "테이프 없음 — 건너뜀"을 로그에 남기고 넘어간다(조용한 스킵 금지). 주
// 라우트에서 칸이 2개 미만이면 치명적 실패다.
//
// 위반 태그: [구간-불일치](G-06-9 직접 판정) [라벨-경계](G-06-2 직접 판정)
// [라벨-없음] [라벨-중복] [라벨-말줄임] [라벨-겹침] [테이프-미부착] [문서-오버플로]
//
// 어떤 출력에도 쿠키 값·시크릿을 찍지 않는다(T-06-27) — 기하값(rect·px)과
// 구간 제목 텍스트만 찍는다.

import { chromium } from '@playwright/test';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = process.env.E2E_TAPE_PORT ? Number(process.env.E2E_TAPE_PORT) : 3214;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 180_000;
const FETCH_TIMEOUT_MS = 30_000;
const SCROLL_STABLE_TIMEOUT_MS = 3_000;
const SCROLL_STABLE_POLL_MS = 50;
const SCROLL_STABLE_CONSECUTIVE = 3;
const BOUNDARY_TOLERANCE_PX = 0.5;
// 테이프 부착 판정 허용 오차 — 헤더 높이를 JS가 정수 px로 반올림해
// --site-header-height에 쓰므로 최대 1px가 남을 수 있다(quick 260831-0f5).
const STICK_TOLERANCE_PX = 1.5;
const LESSON_ARTICLE_ID = 'lesson-article';
const PRIMARY_SLUG = '1-1-course-orientation';

class FatalError extends Error {}

// --- 필수 환경 변수 부재 시 즉시 오류 종료 (e2e-mobile-overflow.mjs와 동일 규약) ---
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
      `e2e-section-tape: ${name} 환경 변수가 비어 있습니다. \`node --env-file=.env.local scripts/e2e-section-tape.mjs\`로 실행하세요.`,
    );
    process.exit(1);
  }
}

// e2e-mobile-overflow.mjs와 같은 방식으로 .velite/lessons.json을 독립
// 재파싱한다 — curriculum-helpers.ts를 import하지 않는다.
function readLessonsManifest() {
  const lessonsPath = path.join(ROOT, '.velite', 'lessons.json');
  if (!fs.existsSync(lessonsPath)) {
    console.error(
      `e2e-section-tape: ${path.relative(ROOT, lessonsPath)}가 없습니다. \`npx velite build\`를 한 번 실행해 매니페스트를 생성한 뒤 다시 시도하세요.`,
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
}

function resolveRoutes() {
  const lessons = readLessonsManifest();
  const primary = lessons.find((l) => l.slug === PRIMARY_SLUG);
  if (!primary || primary.hasContent !== true) {
    console.error(
      `e2e-section-tape: 주 라우트 슬러그 "${PRIMARY_SLUG}"가 매니페스트에 없거나 hasContent가 아닙니다 — 404를 조용히 통과시키지 않고 즉시 종료합니다.`,
    );
    process.exit(1);
  }
  const last = lessons[lessons.length - 1];
  return {
    primaryRoute: `/lesson/${primary.slug}`,
    secondaryRoute: `/lesson/${last.slug}`,
    secondaryLabel: `매니페스트 마지막 레슨(${last.slug})`,
  };
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

// window.scrollY를 50ms 간격으로 폴링해 3회 연속 같은 값이면 정착으로 본다.
// smooth 스크롤 경로에서 고정 waitForTimeout 하나로 때우면 위음성/위양성
// 양쪽이 나므로 실측 폴링으로 대체한다.
async function waitForScrollStable(page) {
  const deadline = Date.now() + SCROLL_STABLE_TIMEOUT_MS;
  let last = null;
  let consecutive = 0;
  while (Date.now() < deadline) {
    const y = await page.evaluate(() => window.scrollY);
    if (y === last) {
      consecutive += 1;
      if (consecutive >= SCROLL_STABLE_CONSECUTIVE) {
        return { stabilized: true, scrollY: y };
      }
    } else {
      last = y;
      consecutive = 1;
    }
    await new Promise((resolve) => setTimeout(resolve, SCROLL_STABLE_POLL_MS));
  }
  return { stabilized: false, scrollY: last };
}

// 브라우저 안에서 실행되는 초기 관측(클릭 전) — 테이프 존재·칸 수만 본다.
function buildInitialProbeScript() {
  return () => {
    const tape = document.querySelector('[data-section-tape]');
    if (!tape) return { tapeFound: false, cellCount: 0 };
    const buttons = tape.querySelectorAll('button.section-tape-cell');
    return { tapeFound: true, cellCount: buttons.length };
  };
}

// 클릭 후 실행되는 측정 함수. page.evaluate는 인자를 하나만 전달하므로
// { clickedIndex, articleId } 객체 하나로 묶어 받는다.
function buildTapeMeasurementScript() {
  return ({ clickedIndex, articleId }) => {
    function normalizeText(el) {
      if (!el) return '';
      const children = Array.from(el.children);
      if (children.length > 0) {
        return children
          .map((c) => (c.textContent || '').replace(/\s+/g, ' ').trim())
          .filter(Boolean)
          .join(' ');
      }
      return (el.textContent || '').replace(/\s+/g, ' ').trim();
    }

    const tape = document.querySelector('[data-section-tape]');
    if (!tape) return { tapeFound: false };

    // 사이트 헤더도 sticky top-0이다 — 테이프가 '붙었는지'는 뷰포트 상단(0)이 아니라
    // 헤더 아래쪽 경계를 기준으로 판정해야 한다(quick 260831-0f5).
    const headerEl = document.querySelector('header.site-header');
    const headerRect = headerEl
      ? (() => {
          const r = headerEl.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, height: r.height };
        })()
      : null;

    const tapeRectRaw = tape.getBoundingClientRect();
    const tapeRect = {
      top: tapeRectRaw.top,
      left: tapeRectRaw.left,
      right: tapeRectRaw.right,
      bottom: tapeRectRaw.bottom,
    };

    const buttons = Array.from(tape.querySelectorAll('button.section-tape-cell'));
    const buttonRects = buttons.map((b) => {
      const r = b.getBoundingClientRect();
      return { left: r.left, right: r.right, width: r.width };
    });
    const barRects = buttons.map((b) => {
      const bar = b.querySelector(':scope > span:first-child');
      if (!bar) return null;
      const r = bar.getBoundingClientRect();
      return { top: r.top, left: r.left, right: r.right, bottom: r.bottom };
    });

    const labelEls = Array.from(tape.querySelectorAll('[data-section-tape-label]'));
    const labelCount = labelEls.length;
    const labelEl = labelEls[0] || null;
    const labelRectRaw = labelEl ? labelEl.getBoundingClientRect() : null;
    const labelRect = labelRectRaw
      ? {
          top: labelRectRaw.top,
          left: labelRectRaw.left,
          right: labelRectRaw.right,
          bottom: labelRectRaw.bottom,
          width: labelRectRaw.width,
        }
      : null;
    const labelText = normalizeText(labelEl);

    const titleEl = tape.querySelector('[data-section-tape-label-title]');
    const titleScrollWidth = titleEl ? titleEl.scrollWidth : null;
    const titleClientWidth = titleEl ? titleEl.clientWidth : null;

    const article = document.getElementById(articleId);
    const headings = article ? Array.from(article.querySelectorAll('h2')) : [];
    const heading = headings[clickedIndex] || null;
    const headingTop = heading ? heading.getBoundingClientRect().top : null;
    const headingText = normalizeText(heading);

    const docEl = document.documentElement;

    return {
      tapeFound: true,
      cellCount: buttons.length,
      tapeRect,
      buttonRects,
      barRects,
      labelCount,
      labelRect,
      labelText,
      titleScrollWidth,
      titleClientWidth,
      headingTop,
      headingText,
      headerRect,
      scrollY: window.scrollY,
      docScrollWidth: docEl.scrollWidth,
      docClientWidth: docEl.clientWidth,
    };
  };
}

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

// 측정값에서 위반 태그 목록을 뽑는다. 기대 라벨 텍스트는 정규화된 h2 텍스트 그 자체다.
//
// 2026-08-27 변경: 이전에는 "2자리 0패딩 번호 + 공백 + h2 텍스트"를 기대했다. 테이프가
// 인덱스 뱃지(01/02...)를 따로 그렸기 때문인데, 35개 레슨의 h2 제목이 이미 "1. 학습 목표"처럼
// 번호로 시작해서 화면에 "01 1. 학습 목표"로 숫자가 두 번 나왔다. 제목이 원본이므로 파생된
// 뱃지를 없앴고, 그에 맞춰 기대값도 제목만으로 바꾼다. 클릭한 칸과 표시된 구간이
// 일치하는지는 175~234행의 브라우저 측 수집 함수가 clickedIndex로 이미 판정한다 —
// 이 함수는 수집된 측정값(m)만 보고 위반을 가린다.
function evaluateViolations(m) {
  const violations = [];
  const expected = m.headingText;

  const labelMissing = m.labelCount === 0 || !m.labelText || (m.labelRect && m.labelRect.width === 0);
  if (labelMissing) {
    violations.push({
      tag: '[라벨-없음]',
      detail: `labelCount=${m.labelCount} text="${m.labelText}" width=${m.labelRect ? m.labelRect.width.toFixed(1) : 'n/a'}`,
    });
  } else {
    if (m.labelText !== expected) {
      violations.push({
        tag: '[구간-불일치]',
        detail: `기대="${expected}" 실제="${m.labelText}"`,
      });
    }

    const sides = [];
    if (m.labelRect.left < m.tapeRect.left - BOUNDARY_TOLERANCE_PX) {
      sides.push(`left ${(m.tapeRect.left - m.labelRect.left).toFixed(1)}px`);
    }
    if (m.labelRect.right > m.tapeRect.right + BOUNDARY_TOLERANCE_PX) {
      sides.push(`right ${(m.labelRect.right - m.tapeRect.right).toFixed(1)}px`);
    }
    if (m.labelRect.top < m.tapeRect.top - BOUNDARY_TOLERANCE_PX) {
      sides.push(`top ${(m.tapeRect.top - m.labelRect.top).toFixed(1)}px`);
    }
    if (m.labelRect.bottom > m.tapeRect.bottom + BOUNDARY_TOLERANCE_PX) {
      sides.push(`bottom ${(m.labelRect.bottom - m.tapeRect.bottom).toFixed(1)}px`);
    }
    if (sides.length > 0) {
      violations.push({ tag: '[라벨-경계]', detail: sides.join(', ') });
    }

    const overlapsBar = m.barRects.some((bar) => bar && rectsOverlap(m.labelRect, bar));
    if (overlapsBar) {
      violations.push({ tag: '[라벨-겹침]', detail: '라벨 rect가 막대 rect와 겹침' });
    }
  }

  if (m.labelCount >= 2) {
    violations.push({ tag: '[라벨-중복]', detail: `labelCount=${m.labelCount}` });
  }

  if (m.titleScrollWidth != null && m.titleClientWidth != null && m.titleScrollWidth > m.titleClientWidth + 1) {
    violations.push({
      tag: '[라벨-말줄임]',
      detail: `scrollWidth=${m.titleScrollWidth} clientWidth=${m.titleClientWidth}`,
    });
  }

  // 테이프는 뷰포트 상단이 아니라 '헤더 아래'에 붙어야 한다. 이전 판정은
  // top === 0을 요구했는데, 그 자리는 불투명한 .site-header(z-20)가 이미
  // 차지하고 있어 통과 = 테이프가 화면에서 사라짐이었다(quick 260831-0f5).
  // 헤더를 못 찾으면 옛 기준(0)으로 물러선다 — 조용히 검사를 건너뛰지 않는다.
  if (m.scrollY > 0) {
    const expectedTop = m.headerRect ? m.headerRect.bottom : 0;
    const gap = m.tapeRect.top - expectedTop;
    if (Math.abs(gap) > STICK_TOLERANCE_PX) {
      violations.push({
        tag: '[테이프-미부착]',
        detail:
          `scrollY=${m.scrollY} tapeTop=${m.tapeRect.top.toFixed(1)} ` +
          `headerBottom=${expectedTop.toFixed(1)} 차=${gap.toFixed(1)}px` +
          (gap < 0 ? ' (헤더에 가려짐)' : ' (헤더와 본문 사이에 틈)'),
      });
    }
  }

  if (m.docScrollWidth > m.docClientWidth) {
    violations.push({
      tag: '[문서-오버플로]',
      detail: `scrollWidth=${m.docScrollWidth} clientWidth=${m.docClientWidth}`,
    });
  }

  return violations;
}

async function runCombo({ browser, route, routeLabel, viewport, viewportLabel, reducedMotion, isPrimary, scenario }) {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  const comboResults = [];

  try {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(`#${LESSON_ARTICLE_ID}`);

    const initial = await page.evaluate(buildInitialProbeScript());

    if (!initial.tapeFound || initial.cellCount < 2) {
      if (isPrimary) {
        throw new FatalError(
          `${scenario} ${route} @ ${viewportLabel}/${reducedMotion} — 주 라우트에서 테이프 칸이 2개 미만입니다(tapeFound=${initial.tapeFound}, cellCount=${initial.cellCount}). 치명적 실패.`,
        );
      }
      console.log(
        `e2e-section-tape: ${scenario} ${route} @ ${viewportLabel}/${reducedMotion} — 테이프 없음(칸 ${initial.cellCount}개) — 건너뜀`,
      );
      return comboResults;
    }

    console.log(
      `e2e-section-tape: ${scenario} ${route} @ ${viewportLabel}/${reducedMotion} — 칸 ${initial.cellCount}개 확인`,
    );

    const buttonLocator = page.locator('[data-section-tape] button.section-tape-cell');

    for (let i = 0; i < initial.cellCount; i++) {
      await buttonLocator.nth(i).click();
      const stability = await waitForScrollStable(page);
      if (!stability.stabilized) {
        console.log(
          `e2e-section-tape: ${scenario} ${route} @ ${viewportLabel}/${reducedMotion} 칸${i + 1} — 스크롤이 ${SCROLL_STABLE_TIMEOUT_MS}ms 안에 정착하지 않았습니다(마지막 scrollY=${stability.scrollY}), 측정은 계속 진행합니다.`,
        );
      }

      const m = await page.evaluate(buildTapeMeasurementScript(), {
        clickedIndex: i,
        articleId: LESSON_ARTICLE_ID,
      });
      if (!m.tapeFound) {
        throw new FatalError(`${scenario} ${route} 칸${i + 1} — 클릭 후 테이프가 사라졌습니다.`);
      }

      const violations = evaluateViolations(m);

      console.log(
        `e2e-section-tape: ${scenario} ${route} @ ${viewportLabel}/${reducedMotion} 칸${i + 1} — h2 top=${m.headingTop != null ? m.headingTop.toFixed(1) : 'n/a'}px scrollY=${m.scrollY}`,
      );

      comboResults.push({
        route,
        routeLabel,
        viewportWidth: viewport.width,
        viewportLabel,
        motion: reducedMotion,
        cellIndex: i,
        pass: violations.length === 0,
        violations,
      });
    }

    return comboResults;
  } finally {
    await context.close();
  }
}

async function main() {
  const { primaryRoute, secondaryRoute, secondaryLabel } = resolveRoutes();

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
    console.log('e2e-section-tape: 개발 서버 기동 완료');

    browser = await chromium.launch();

    const VIEWPORTS = [
      { width: 375, height: 667, label: '375×667(폰)' },
      { width: 768, height: 1024, label: '768×1024(아이패드 세로)' },
    ];
    const MOTION_MODES = ['reduce', 'no-preference'];

    const combos = [];
    for (const viewport of VIEWPORTS) {
      for (const motion of MOTION_MODES) {
        combos.push({
          route: primaryRoute,
          routeLabel: '주 라우트(콘텐츠 레슨)',
          viewport,
          viewportLabel: viewport.label,
          reducedMotion: motion,
          isPrimary: true,
        });
      }
    }
    combos.push({
      route: secondaryRoute,
      routeLabel: secondaryLabel,
      viewport: VIEWPORTS[0],
      viewportLabel: VIEWPORTS[0].label,
      reducedMotion: 'reduce',
      isPrimary: false,
    });

    const allResults = [];
    for (let idx = 0; idx < combos.length; idx++) {
      const combo = combos[idx];
      const scenario = `t${idx + 1}/${combos.length}`;
      const comboResults = await runCombo({ browser, ...combo, scenario });
      allResults.push(...comboResults);
    }

    await browser.close();
    browser = undefined;

    console.log(`e2e-section-tape: 수행한 (조합 × 칸) 검사 수 = ${allResults.length}`);

    if (allResults.length === 0) {
      throw new FatalError('수행한 (조합 × 칸) 검사가 0건입니다 — 라우트/뷰포트/칸 목록을 확인하세요.');
    }

    const failures = allResults.filter((r) => !r.pass);
    // 라우트 → 뷰포트 폭 → 모드 → 칸 번호 오름차순 정렬.
    failures.sort((a, b) => {
      if (a.route !== b.route) return a.route < b.route ? -1 : 1;
      if (a.viewportWidth !== b.viewportWidth) return a.viewportWidth - b.viewportWidth;
      if (a.motion !== b.motion) return a.motion < b.motion ? -1 : 1;
      return a.cellIndex - b.cellIndex;
    });

    if (failures.length > 0) {
      console.error(`e2e-section-tape: ${failures.length}건의 위반이 발견되었습니다:\n`);
      for (const f of failures) {
        console.error(
          `  - ${f.route} @ ${f.viewportLabel}/${f.motion} 칸${f.cellIndex + 1} (${f.routeLabel}):`,
        );
        for (const v of f.violations) {
          console.error(`      · ${v.tag} ${v.detail}`);
        }
      }
      throw new FatalError(`${failures.length}건의 위반으로 게이트 실패`);
    }

    console.log(
      `e2e-section-tape: 검사한 ${allResults.length}건 전부 위반 0건 — 전부 통과`,
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
    console.error(`e2e-section-tape: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
