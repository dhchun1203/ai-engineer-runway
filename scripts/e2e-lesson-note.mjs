#!/usr/bin/env node
// 메모장 신규 브라우저 게이트 — 기계로 증명 가능한 것만, 괘선 정렬 포함(D).
// e2e-mobile-overflow.mjs/e2e-section-tape.mjs의 부트스트랩(서버 spawn/대기/
// Windows taskkill 프로세스 트리 종료/FatalError/finally 정리/"검사 0건 = 실패"
// 방어/한국어 로그)을 그대로 복제한다 — 기존 게이트 전부 "재사용 안 함, 복제"
// 원칙을 따르므로 공유 모듈로 빼지 않는다.
//
// 실행: node --env-file=.env.local scripts/e2e-lesson-note.mjs
//
// 포트는 3215 — 3210~3214는 기존 게이트가 쓰고 있어 잇달아 돌릴 때 충돌하면
// 위음성 실패가 난다. E2E_NOTE_PORT로 덮어쓸 수 있다.
//
// 시작 시 프로브 레슨의 기존 메모 본문을 백업하고 종료 시(finally) 반드시
// 복원한다 — 게이트가 소유자의 실제 메모를 지우면 안 된다.
//
// 어떤 출력에도 쿠키 값·시크릿을 찍지 않는다.

import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = process.env.E2E_NOTE_PORT ? Number(process.env.E2E_NOTE_PORT) : 3215;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 180_000;
const FETCH_TIMEOUT_MS = 30_000;

// e2e-progress.mjs와 반드시 일치해야 한다 — 이 스크립트는 순수 TS 모듈을
// Node에서 직접 로드할 수 없어(ts-node/tsx 미설치) 상수를 재선언한다.
const UNLOCK_COOKIE_NAME = 'runway_unlock';

class FatalError extends Error {}

// --- 필수 환경 변수 부재 시 즉시 오류 종료 ---
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
      `e2e-lesson-note: ${name} 환경 변수가 비어 있습니다. \`node --env-file=.env.local scripts/e2e-lesson-note.mjs\`로 실행하세요.`,
    );
    process.exit(1);
  }
}

// 앱 코드를 import하지 않는다 — .velite/lessons.json을 독립 재파싱한다.
function readLessonsManifest() {
  const lessonsPath = path.join(ROOT, '.velite', 'lessons.json');
  if (!fs.existsSync(lessonsPath)) {
    console.error(
      `e2e-lesson-note: ${path.relative(ROOT, lessonsPath)}가 없습니다. \`npx velite build\`를 한 번 실행해 매니페스트를 생성한 뒤 다시 시도하세요.`,
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
}

const LESSONS = readLessonsManifest();
const PROBE_LESSON = LESSONS.find((l) => l.hasContent === true);
if (!PROBE_LESSON) {
  console.error('e2e-lesson-note: hasContent가 참인 레슨을 매니페스트에서 찾지 못했습니다.');
  process.exit(1);
}
const PROBE_SLUG = PROBE_LESSON.slug;
const PROBE_ROUTE = `/lesson/${PROBE_SLUG}`;

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

// 08-03 — 메모장이 이제 <ProgressProvider>의 fetch 완료 이후에만 마운트되므로
// (LessonNoteSlot이 loading 상태에서는 <NotepadSkeleton>만 렌더한다), 페이지를
// 열거나 새로고침한 직후 곧바로 [data-notepad]/[data-notepad-input]을 찾으면
// 아직 로딩 중이라 실패할 수 있다. 진도 아일랜드가 loading을 벗어날 때까지
// 먼저 기다린 뒤에 메모장 셀렉터를 찾는다 — e2e-progress.mjs의 renderedHtml()
// 대기 조건과 같은 신호(data-progress-state !== 'loading')를 쓴다.
async function waitForProgressSettled(page) {
  await page.waitForSelector('[data-progress-island]');
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-progress-island]');
    return el !== null && el.getAttribute('data-progress-state') !== 'loading';
  });
}

// --- 결과 누적기 — 실패는 항목 순서대로 모아 마지막에 한 번에 출력한다 ---
const results = [];
function record(id, label, pass, detail) {
  results.push({ id, label, pass, detail: detail ?? '' });
  const status = pass ? 'OK' : 'FAIL';
  console.log(`e2e-lesson-note: ${id} ${label} — ${status}${detail ? ` (${detail})` : ''}`);
}

// --- D/E 공용: 괘선 정렬 측정 + 판정식 ---

async function measureRulingAlignment(page) {
  return page.evaluate(() => {
    const textarea = document.querySelector('[data-notepad-input]');
    if (!textarea) return { found: false };

    const periodProbe = document.createElement('div');
    periodProbe.style.position = 'absolute';
    periodProbe.style.visibility = 'hidden';
    periodProbe.style.height = 'var(--note-line-height)';
    document.body.appendChild(periodProbe);
    const periodPx = periodProbe.getBoundingClientRect().height;
    periodProbe.remove();

    const fontProbe = document.createElement('div');
    fontProbe.style.position = 'absolute';
    fontProbe.style.visibility = 'hidden';
    fontProbe.style.fontSize = 'var(--text-body)';
    document.body.appendChild(fontProbe);
    const bodyFontPx = Number.parseFloat(getComputedStyle(fontProbe).fontSize);
    fontProbe.remove();

    const cs = getComputedStyle(textarea);
    const lineHeightPx = Number.parseFloat(cs.lineHeight);
    const fontSizePx = Number.parseFloat(cs.fontSize);
    const paddingTopPx = Number.parseFloat(cs.paddingTop);
    const paddingBottomPx = Number.parseFloat(cs.paddingBottom);
    const backgroundImage = cs.backgroundImage;
    const backgroundAttachment = cs.backgroundAttachment;

    const repeatingMatch = backgroundImage.match(/repeating-linear-gradient\(([\s\S]*)\)/);
    let stops = [];
    if (repeatingMatch) {
      stops = [...repeatingMatch[1].matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((m) => Number.parseFloat(m[1]));
    }
    const maxStop = stops.length > 0 ? Math.max(...stops) : null;

    return {
      found: true,
      periodPx,
      bodyFontPx,
      lineHeightPx,
      fontSizePx,
      paddingTopPx,
      paddingBottomPx,
      backgroundAttachment,
      stopsCount: stops.length,
      maxStop,
    };
  });
}

function evaluateRulingViolations(m) {
  const violations = [];
  if (!m.found) {
    violations.push('textarea를 찾지 못했습니다');
    return violations;
  }
  if (Math.abs(m.lineHeightPx - m.periodPx) > 0.05) {
    violations.push(`line-height(${m.lineHeightPx}px) != 주기(${m.periodPx}px)`);
  }
  if (Math.abs(m.fontSizePx - m.bodyFontPx) > 0.05) {
    violations.push(`font-size(${m.fontSizePx}px) != 본문 토큰(${m.bodyFontPx}px)`);
  }
  const ratio = m.periodPx > 0 ? m.paddingTopPx / m.periodPx : NaN;
  const nearestInt = Math.round(ratio);
  if (!Number.isFinite(ratio) || Math.abs(ratio - nearestInt) * m.periodPx > 0.05) {
    violations.push(`padding-top(${m.paddingTopPx}px)이 주기의 정수배가 아닙니다`);
  }
  if (m.stopsCount === 0) {
    violations.push(
      'backgroundImage에서 repeating-linear-gradient px 정지점을 찾지 못했습니다 — 파싱 실패는 성공이 아니라 실패로 처리합니다',
    );
  } else if (Math.abs(m.maxStop - m.periodPx) > 0.5) {
    violations.push(`가장 큰 정지점(${m.maxStop}px) != 주기(${m.periodPx}px)`);
  }
  if (!m.backgroundAttachment.includes('local')) {
    violations.push(`backgroundAttachment(${m.backgroundAttachment})에 local이 없습니다`);
  }
  return violations;
}

async function main() {
  // --- precondition: 백업 ---
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: originalRow, error: backupError } = await admin
    .from('lesson_note')
    .select('body')
    .eq('lesson_id', PROBE_SLUG)
    .maybeSingle();
  if (backupError) {
    throw new FatalError(`프로브 레슨 메모 백업 조회 실패 — Supabase 오류: ${backupError.message}`);
  }
  const hadOriginal = originalRow !== null;
  const originalBody = originalRow?.body ?? '';
  console.log(
    `e2e-lesson-note: 프로브 레슨 ${PROBE_SLUG} 기존 메모 백업 완료 (존재=${hadOriginal}, 길이=${originalBody.length}자)`,
  );

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
    console.log(`e2e-lesson-note: 개발 서버 기동 완료 (probe lesson: ${PROBE_SLUG})`);

    browser = await chromium.launch();
    const cookieValue = UNLOCK_SECRET;

    // --- 메인(잠금 해제) 컨텍스트 — A~G, I, J, K, M ---
    const context = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    await context.addCookies([
      { name: UNLOCK_COOKIE_NAME, value: cookieValue, url: BASE_URL },
    ]);
    const page = await context.newPage();
    await page.goto(`${BASE_URL}${PROBE_ROUTE}`, { waitUntil: 'domcontentloaded' });
    await waitForProgressSettled(page);
    await page.waitForSelector('[data-notepad]');

    // === A. 접힘 기본 상태 ===
    try {
      const state = await page.evaluate(() => {
        const notepad = document.querySelector('[data-notepad]');
        const toggle = notepad ? notepad.querySelector('button[aria-expanded]') : null;
        const panel = document.querySelector('[data-notepad-panel]');
        return {
          notepadExists: !!notepad,
          ariaExpanded: toggle ? toggle.getAttribute('aria-expanded') : null,
          panelHeight: panel ? panel.getBoundingClientRect().height : null,
          handleHeight: toggle ? toggle.getBoundingClientRect().height : null,
        };
      });
      const pass =
        state.notepadExists &&
        state.ariaExpanded === 'false' &&
        state.panelHeight !== null &&
        state.panelHeight <= 1 &&
        state.handleHeight !== null &&
        state.handleHeight <= 56;
      record('A', '접힘 기본 상태', pass, JSON.stringify(state));
    } catch (e) {
      record('A', '접힘 기본 상태', false, `예외: ${e.message}`);
    }

    // === B. 접힘 상태가 본문을 가리지 않는다 ===
    try {
      const covered = await page.evaluate(() => {
        const pager =
          document.querySelector('[data-pager="next"]') ?? document.querySelector('[data-pager="prev"]');
        if (!pager) return { found: false };
        const rect = pager.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const el = document.elementFromPoint(cx, cy);
        const coveredByNotepad = !!(el && el.closest('[data-notepad]'));
        return { found: true, coveredByNotepad };
      });
      const pass = covered.found && covered.coveredByNotepad === false;
      record('B', '접힘 상태가 본문을 가리지 않음', pass, JSON.stringify(covered));
    } catch (e) {
      record('B', '접힘 상태가 본문을 가리지 않음', false, `예외: ${e.message}`);
    }

    // === C. 토글 ===
    const toggleLocator = page.locator('[data-notepad] button[aria-expanded]');
    try {
      await toggleLocator.click();
      // .note-sheet-panel의 height 트랜지션(200ms)이 끝날 때까지 기다린 뒤
      // 측정한다 — 트랜지션 도중 측정하면 panelHeight가 과도기 값으로 잡힌다.
      await page.waitForTimeout(250);
      const afterOpen = await page.evaluate(() => {
        const toggle = document.querySelector('[data-notepad] button[aria-expanded]');
        const panel = document.querySelector('[data-notepad-panel]');
        const remPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
        const visibleHeightPx = Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--note-visible-height'),
        );
        const lower = 11 * remPx;
        const upper = 26 * remPx;
        const target = Math.min(upper, Math.max(lower, visibleHeightPx * 0.4));
        const panelHeight = panel ? panel.getBoundingClientRect().height : null;
        return {
          ariaExpanded: toggle ? toggle.getAttribute('aria-expanded') : null,
          panelHeight,
          target,
        };
      });
      const withinRange =
        afterOpen.panelHeight !== null && Math.abs(afterOpen.panelHeight - afterOpen.target) <= 4;
      const openPass = afterOpen.ariaExpanded === 'true' && withinRange;
      record('C1', '토글 열기', openPass, JSON.stringify(afterOpen));

      await toggleLocator.click();
      const afterClose = await page.evaluate(() => {
        const toggle = document.querySelector('[data-notepad] button[aria-expanded]');
        return toggle ? toggle.getAttribute('aria-expanded') : null;
      });
      record('C2', '토글 닫기', afterClose === 'false', `ariaExpanded=${afterClose}`);

      // 이후 D~K 시나리오를 위해 다시 연다.
      await toggleLocator.click();
      await page.waitForTimeout(250);
    } catch (e) {
      record('C', '토글', false, `예외: ${e.message}`);
    }

    // === D. 괘선 정렬 ===
    try {
      const m = await measureRulingAlignment(page);
      const violations = evaluateRulingViolations(m);
      record('D1-D6', '괘선 정렬 — 정적 판정 6종', violations.length === 0, violations.join('; '));

      // D7 — 누적 드리프트: 12줄 입력 후 scrollHeight 검증. textarea는
      // flex-1(+.note-paper의 height:100%)로 패널 남은 공간을 채우도록
      // 늘어나 있어 12줄이 그 공간보다 작으면 오버플로가 없고, scrollHeight는
      // "오버플로 없음"일 때 clientHeight와 같아져 늘어난 박스 높이를 그대로
      // 반환한다(내용 높이가 아니다). 측정 순간에만 flex/height를 풀어 내용
      // 그대로의 자연 높이를 재고 즉시 원복한다 — 화면에는 보이지 않는 순간적
      // 조작이고 React가 관리하지 않는 style 속성이라 재렌더와 충돌하지 않는다.
      const twelveLines = Array.from({ length: 12 }, (_, i) => `라인 ${i + 1}`).join('\n');
      await page.fill('[data-notepad-input]', twelveLines);
      const drift = await page.evaluate(() => {
        const textarea = document.querySelector('[data-notepad-input]');
        const cs = getComputedStyle(textarea);
        const paddingTopPx = Number.parseFloat(cs.paddingTop);
        const paddingBottomPx = Number.parseFloat(cs.paddingBottom);

        const originalFlex = textarea.style.flex;
        const originalHeight = textarea.style.height;
        textarea.style.flex = 'none';
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        textarea.style.flex = originalFlex;
        textarea.style.height = originalHeight;

        return { scrollHeight, paddingTopPx, paddingBottomPx };
      });
      const contentHeight = drift.scrollHeight - drift.paddingTopPx - drift.paddingBottomPx;
      const expected12 = 12 * m.periodPx;
      const driftPass = Math.abs(contentHeight - expected12) <= 1;
      record(
        'D7',
        '괘선 정렬 — 12줄 누적 드리프트 0',
        driftPass,
        `contentHeight=${contentHeight.toFixed(2)}px 기대=${expected12.toFixed(2)}px`,
      );

      // === E. 위양성 가드 — 판정식이 진짜로 잡는지 스스로 반증 ===
      const brokenLineHeight = `${(m.periodPx + 3).toFixed(2)}px`;
      await page.evaluate((broken) => {
        const textarea = document.querySelector('[data-notepad-input]');
        textarea.style.lineHeight = broken;
      }, brokenLineHeight);
      const brokenMeasure = await measureRulingAlignment(page);
      const brokenViolations = evaluateRulingViolations(brokenMeasure);
      record(
        'E',
        '위양성 가드 — 의도적 파손이 판정식에 잡힘',
        brokenViolations.length > 0,
        brokenViolations.join('; '),
      );
      await page.evaluate(() => {
        const textarea = document.querySelector('[data-notepad-input]');
        textarea.style.lineHeight = '';
      });
    } catch (e) {
      record('D/E', '괘선 정렬 + 위양성 가드', false, `예외: ${e.message}`);
    }

    // === F. 자동 저장 왕복 ===
    const uniqueNoteText = `자동저장-${Date.now()}-한글확인`;
    try {
      await page.fill('[data-notepad-input]', uniqueNoteText);
      await page.waitForTimeout(1800);

      const { data: savedRow, error: savedError } = await admin
        .from('lesson_note')
        .select('body')
        .eq('lesson_id', PROBE_SLUG)
        .maybeSingle();
      if (savedError) throw new Error(`Supabase 오류: ${savedError.message}`);
      const dbPass = savedRow?.body === uniqueNoteText;
      record('F1', '자동 저장 — DB 직접 확인', dbPass, `dbBody일치=${dbPass}`);

      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForProgressSettled(page);
      await page.waitForSelector('[data-notepad-input]');
      const reloadedValue = await page.evaluate(() => {
        const textarea = document.querySelector('[data-notepad-input]');
        return textarea ? textarea.value : null;
      });
      record('F2', '자동 저장 — 새로고침 후 서버 값 재현', reloadedValue === uniqueNoteText, '');
    } catch (e) {
      record('F', '자동 저장 왕복', false, `예외: ${e.message}`);
    }

    // === G. 저장 실패가 글을 지우지 않는다 ===
    const failureNoteText = `${uniqueNoteText}-실패테스트`;
    try {
      // F의 reload로 패널이 닫혀 있으므로 다시 연다.
      await toggleLocator.click();
      await page.waitForSelector('[data-notepad-input]');

      await page.route('**/*', async (route) => {
        const req = route.request();
        if (req.method() === 'POST' && req.headers()['next-action']) {
          await route.fulfill({ status: 500, body: 'Internal Server Error' });
        } else {
          await route.continue();
        }
      });

      await page.fill('[data-notepad-input]', failureNoteText);
      await page.waitForTimeout(1800);

      const afterFailure = await page.evaluate(() => {
        const statusEl = document.querySelector('[data-notepad-status]');
        const textarea = document.querySelector('[data-notepad-input]');
        return {
          status: statusEl ? statusEl.getAttribute('data-notepad-status') : null,
          value: textarea ? textarea.value : null,
        };
      });
      const gPass = afterFailure.status === 'failed' && afterFailure.value === failureNoteText;
      record('G', '저장 실패가 글을 지우지 않음', gPass, JSON.stringify(afterFailure));

      await page.unroute('**/*');
    } catch (e) {
      record('G', '저장 실패가 글을 지우지 않음', false, `예외: ${e.message}`);
      await page.unroute('**/*').catch(() => {});
    }

    // === I. 접근성 ===
    try {
      const staticAttrs = await page.evaluate(() => {
        const toggle = document.querySelector('[data-notepad] button[aria-expanded]');
        const panel = document.querySelector('[data-notepad-panel]');
        const statusEl = document.querySelector('[data-notepad] [role="status"]');
        return {
          tagName: toggle ? toggle.tagName : null,
          ariaControls: toggle ? toggle.getAttribute('aria-controls') : null,
          panelId: panel ? panel.id : null,
          statusAriaLive: statusEl ? statusEl.getAttribute('aria-live') : null,
        };
      });
      const staticPass =
        staticAttrs.tagName === 'BUTTON' &&
        staticAttrs.ariaControls !== null &&
        staticAttrs.ariaControls === staticAttrs.panelId &&
        staticAttrs.statusAriaLive === 'polite';
      record('I1', '접근성 — 정적 속성(BUTTON/aria-controls/aria-live)', staticPass, JSON.stringify(staticAttrs));

      // 열린 상태에서 Tab으로 시트 밖으로 나갈 수 있는지 (포커스 트랩 없음)
      await page.click('[data-notepad-input]');
      let escapedSheet = false;
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const outside = await page.evaluate(() => {
          const el = document.activeElement;
          return !(el && el.closest('[data-notepad]'));
        });
        if (outside) {
          escapedSheet = true;
          break;
        }
      }
      record('I2', '접근성 — Tab으로 시트 밖 포커스 도달(트랩 없음)', escapedSheet, `escapedSheet=${escapedSheet}`);

      // Escape로 닫고 포커스가 토글로 돌아오는지
      await page.click('[data-notepad-input]');
      await page.keyboard.press('Escape');
      const afterEscape = await page.evaluate(() => {
        const toggle = document.querySelector('[data-notepad] button[aria-expanded]');
        return {
          ariaExpanded: toggle ? toggle.getAttribute('aria-expanded') : null,
          focusReturnedToToggle: document.activeElement === toggle,
        };
      });
      const escapePass = afterEscape.ariaExpanded === 'false' && afterEscape.focusReturnedToToggle;
      record('I3', '접근성 — Escape로 닫힘 + 포커스 복귀', escapePass, JSON.stringify(afterEscape));
    } catch (e) {
      record('I', '접근성', false, `예외: ${e.message}`);
    }

    // === J. 스크롤 락 누수 없음 (I3에서 이미 닫힌 상태) ===
    try {
      const bodyState = await page.evaluate(() => ({
        overflow: getComputedStyle(document.body).overflow,
        position: document.body.style.position,
      }));
      const jPass = bodyState.overflow !== 'hidden' && bodyState.position !== 'fixed';
      record('J', '스크롤 락 누수 없음', jPass, JSON.stringify(bodyState));
    } catch (e) {
      record('J', '스크롤 락 누수 없음', false, `예외: ${e.message}`);
    }

    // === K. 스크롤해도 붙어 있다 ===
    try {
      await toggleLocator.click(); // 다시 연다
      await page.waitForSelector('[data-notepad-input]');
      const before = await page.evaluate(() => {
        const sheet = document.querySelector('[data-notepad]');
        return sheet.getBoundingClientRect().bottom;
      });
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(100);
      const after = await page.evaluate(() => {
        const sheet = document.querySelector('[data-notepad]');
        return sheet.getBoundingClientRect().bottom;
      });
      const kPass = Math.abs(after - before) <= 1;
      record('K', '스크롤해도 시트가 하단에 고정됨', kPass, `before=${before} after=${after}`);
    } catch (e) {
      record('K', '스크롤해도 시트가 하단에 고정됨', false, `예외: ${e.message}`);
    }

    // === M. visualViewport 배선 확인 ===
    try {
      await page.evaluate(() => {
        document.documentElement.style.removeProperty('--note-visible-height');
        document.documentElement.style.removeProperty('--note-keyboard-inset');
      });
      const wired = await page.evaluate(() => {
        if (!window.visualViewport) return { hasVisualViewport: false };
        window.visualViewport.dispatchEvent(new Event('resize'));
        return {
          hasVisualViewport: true,
          visibleHeight: getComputedStyle(document.documentElement).getPropertyValue('--note-visible-height').trim(),
          keyboardInset: getComputedStyle(document.documentElement).getPropertyValue('--note-keyboard-inset').trim(),
        };
      });
      const mPass =
        wired.hasVisualViewport === false ||
        (/^\d+(\.\d+)?px$/.test(wired.visibleHeight) && /^\d+(\.\d+)?px$/.test(wired.keyboardInset));
      record(
        'M',
        'visualViewport 배선 확인 (헤드리스 Chromium에는 소프트 키보드가 없어 "키보드 위에 앉는다"의 증명은 아님)',
        mPass,
        JSON.stringify(wired),
      );
    } catch (e) {
      record('M', 'visualViewport 배선 확인', false, `예외: ${e.message}`);
    }

    await context.close();

    // === H. 잠금 없이는 저장되지 않는다 ===
    // 정적 셸에서는 수화 전에도 [data-notepad]가 원문에 없는 것이 참이라, 곧바로
    // page.content()만 보면 "아직 안 그려진 것"과 "잠겨서 안 그린 것"을 구분하지
    // 못하는 위양성 통과가 가능하다. waitForProgressSettled()로 진도 아일랜드가
    // 확실히 locked 상태에 도달한 것을 먼저 확인한 뒤에 data-notepad 부재를 본다.
    try {
      const lockedContext = await browser.newContext({ viewport: { width: 768, height: 1024 } });
      const lockedPage = await lockedContext.newPage();
      await lockedPage.goto(`${BASE_URL}${PROBE_ROUTE}`, { waitUntil: 'domcontentloaded' });
      await waitForProgressSettled(lockedPage);
      const progressState = await lockedPage.evaluate(
        () => document.querySelector('[data-progress-island]')?.getAttribute('data-progress-state') ?? null,
      );
      const html = await lockedPage.content();
      const noNotepad = !html.includes('data-notepad');
      const noLeak = !html.includes(uniqueNoteText);
      const isLocked = progressState === 'locked';
      record(
        'H',
        '잠금 없이는 렌더도 저장 내용 노출도 없음',
        isLocked && noNotepad && noLeak,
        `progressState=${progressState} noNotepad=${noNotepad} noLeak=${noLeak}`,
      );
      await lockedContext.close();
    } catch (e) {
      record('H', '잠금 없이는 렌더도 저장 내용 노출도 없음', false, `예외: ${e.message}`);
    }

    // === N(신규, D8-H). 빈 값 덮어쓰기 방지 ===
    // 프로브 레슨의 메모를 고유 문자열로 미리 심어 둔다. 그 레슨 페이지를 열고,
    // 진도가 정착되기를(waitForProgressSettled) 기다리지 않은 채 자동 저장
    // 디바운스(SAVE_DEBOUNCE_MS=1000ms)보다 긴 2500ms를 그냥 기다린다 — 메모가
    // 도착하기 전에 <LessonNotepad>가 빈 초기값으로 마운트되면 이 구간에서 빈
    // 값이 저장될 수 있다(D8-H가 막으려는 경로). 그 다음 Supabase에서 그 행을
    // 다시 읽어 본문이 여전히 원래 고유 문자열인지 확인한다.
    const overwriteGuardText = `덮어쓰기방지-${Date.now()}-한글`;
    try {
      const { error: seedError } = await admin
        .from('lesson_note')
        .upsert({ lesson_id: PROBE_SLUG, body: overwriteGuardText, updated_at: new Date().toISOString() });
      if (seedError) throw new Error(`Supabase 시드 오류: ${seedError.message}`);

      const guardContext = await browser.newContext({ viewport: { width: 768, height: 1024 } });
      await guardContext.addCookies([{ name: UNLOCK_COOKIE_NAME, value: cookieValue, url: BASE_URL }]);
      const guardPage = await guardContext.newPage();
      await guardPage.goto(`${BASE_URL}${PROBE_ROUTE}`, { waitUntil: 'domcontentloaded' });
      await guardPage.waitForTimeout(2500);
      await guardContext.close();

      const { data: guardRow, error: guardReadError } = await admin
        .from('lesson_note')
        .select('body')
        .eq('lesson_id', PROBE_SLUG)
        .maybeSingle();
      if (guardReadError) throw new Error(`Supabase 확인 오류: ${guardReadError.message}`);
      const preserved = guardRow?.body === overwriteGuardText;
      record('N', '빈 값 덮어쓰기 방지 — 메모 도착 전 마운트 금지(D8-H)', preserved, `preserved=${preserved}`);
    } catch (e) {
      record('N', '빈 값 덮어쓰기 방지 — 메모 도착 전 마운트 금지(D8-H)', false, `예외: ${e.message}`);
    }

    // === L. 가로 오버플로 0 (시트를 연 채, 3개 뷰포트) ===
    const L_VIEWPORTS = [
      { width: 375, height: 667, label: '375×667(폰)' },
      { width: 768, height: 1024, label: '768×1024(아이패드 세로)' },
      { width: 1024, height: 768, label: '1024×768(아이패드 가로)' },
    ];
    for (const vp of L_VIEWPORTS) {
      try {
        const vpContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        await vpContext.addCookies([{ name: UNLOCK_COOKIE_NAME, value: cookieValue, url: BASE_URL }]);
        const vpPage = await vpContext.newPage();
        await vpPage.goto(`${BASE_URL}${PROBE_ROUTE}`, { waitUntil: 'domcontentloaded' });
        await waitForProgressSettled(vpPage);
        await vpPage.waitForSelector('[data-notepad]');
        await vpPage.locator('[data-notepad] button[aria-expanded]').click();
        await vpPage.waitForTimeout(250);

        const measurement = await vpPage.evaluate(() => {
          const bodyOverflowX = getComputedStyle(document.body).overflowX;
          const htmlOverflowX = getComputedStyle(document.documentElement).overflowX;
          return {
            bodyOverflowX,
            htmlOverflowX,
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          };
        });
        const hiddenGuardViolation = measurement.bodyOverflowX === 'hidden' || measurement.htmlOverflowX === 'hidden';
        const lPass = !hiddenGuardViolation && measurement.scrollWidth <= measurement.clientWidth;
        record(`L-${vp.label}`, '가로 오버플로 0 (시트 연 상태)', lPass, JSON.stringify(measurement));
        await vpContext.close();
      } catch (e) {
        record(`L-${vp.label}`, '가로 오버플로 0 (시트 연 상태)', false, `예외: ${e.message}`);
      }
    }

    await browser.close();
    browser = undefined;

    console.log(`e2e-lesson-note: 수행한 검사 수 = ${results.length}`);
    if (results.length === 0) {
      throw new FatalError('수행한 검사가 0건입니다 — 시나리오 목록을 확인하세요.');
    }

    const failures = results.filter((r) => !r.pass);
    if (failures.length > 0) {
      console.error(`e2e-lesson-note: ${failures.length}건의 위반이 발견되었습니다:\n`);
      for (const f of failures) {
        console.error(`  - [${f.id}] ${f.label}: ${f.detail}`);
      }
      throw new FatalError(`${failures.length}건의 위반으로 게이트 실패`);
    }

    console.log(`e2e-lesson-note: 검사한 ${results.length}건 전부 통과 (위양성 가드 E 포함) — 전부 초록불`);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    killServerTree(child);

    // 프로브 레슨의 원래 메모를 그대로 복원한다 — 게이트가 소유자의 실제
    // 메모를 지우지 않는다(plan-check note #1).
    if (hadOriginal) {
      await admin
        .from('lesson_note')
        .upsert({ lesson_id: PROBE_SLUG, body: originalBody, updated_at: new Date().toISOString() });
      console.log('e2e-lesson-note: 프로브 레슨 원래 메모 복원 완료');
    } else {
      await admin.from('lesson_note').delete().eq('lesson_id', PROBE_SLUG);
      console.log('e2e-lesson-note: 프로브 레슨에 원래 메모가 없었으므로 행을 삭제해 원상 복구');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(`e2e-lesson-note: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
