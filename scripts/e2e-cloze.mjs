#!/usr/bin/env node
// 클로즈(빈칸 채우기) 필사 기능이 "저장 없이도 배포 가능함"을 반증 가능하게
// 증명하는 런타임 게이트 (CONT-07). 부트스트랩(서버 spawn/폴링 대기/Windows
// taskkill 프로세스 트리 종료/FatalError/finally 정리/"검사 0건 = 실패" 방어/
// 한국어 로그 + tN/총N 시나리오 번호)은 scripts/e2e-mobile-overflow.mjs 형태를
// 그대로 복제한다 — 기존 게이트 전부 "재사용 안 함, 복제" 원칙을 따르므로
// 공유 모듈로 빼지 않는다.
//
// 실행: node --env-file=.env.local scripts/e2e-cloze.mjs
//
// 포트 기본값 3215(E2E_CLOZE_PORT로 override) — 기존 게이트가 이미 쓰는
// 3210~3214와 겹치지 않는다.
//
// s1~s9 브라우저 컨텍스트는 잠금 해제 쿠키 없이(잠금 상태로) 연다 — 콘텐츠가
// 잠금 상태에서도 공개라는 기존 설계상 빈칸도 잠금 상태에서 동작해야 한다.
// s10만 잠금 해제 쿠키를 심은 별도 컨텍스트로 저장 왕복을 검증하고,
// finally에서 프로브 행을 반드시 정리한다(T-uig-06).
//
// 판정 로직은 전부 순수 함수로 분리해 쓴다(s3이 이 함수들 자체를 검사한다).
//
// 게이트는 앱 코드의 판정 로직을 재사용하지 않는다 — .velite/lessons.json·
// .velite/pages.json을 독립 재파싱한다. 단 src/lib/remark-cloze-blanks.ts는
// 검사 대상 자체이므로 pathToFileURL 동적 import로 직접 로드해 픽스처로 돌린다.
//
// 어떤 출력에도 쿠키 값·시크릿을 찍지 않는다.

import { chromium } from '@playwright/test';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { toString as mdastToString } from 'mdast-util-to-string';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = process.env.E2E_CLOZE_PORT ? Number(process.env.E2E_CLOZE_PORT) : 3215;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 180_000;
const FETCH_TIMEOUT_MS = 30_000;
const LESSON_ARTICLE_ID = 'lesson-article';
// src/lib/unlock-secret.ts의 UNLOCK_COOKIE_NAME과 반드시 일치해야 한다 —
// 이 파일은 그 상수를 import하지 않고 값만 복제한다(게이트는 앱 모듈을
// import하지 않는다는 관례, e2e-progress.mjs와 동일 패턴).
const UNLOCK_COOKIE_NAME = 'runway_unlock';

// DD-5: 32/35는 옛 리서치의 관측치일 뿐 고정 집합이 아니다. Task 1 SUMMARY가
// 기록한 실측(29/35, CONT-05 프로젝트 가이드 5편 + 1-1-dev-environment-setup —
// 이 6편은 "## 3. 개념 설명"이 코드 다이어그램 + 표로만 구성되고 강조가 없는
// 직계 문단이 구조적으로 0개다)을 근거로 임계값을 실측 우선 원칙(이 프로젝트
// STATE.md에 반복된 관례)에 따라 29로 고정한다. 32로 두면 이 게이트는 콘텐츠를
// 한 글자도 수정하지 않고는 항상 실패하는 게이트가 되어 "검증 가능"이라는
// 목적 자체를 잃는다.
const MIN_BLANK_LESSON_COUNT = 29;
const TOTAL_LESSON_COUNT = 35;

class FatalError extends Error {}

// --- 필수 환경 변수 부재 시 즉시 오류 종료 (기존 게이트와 동일 규약) ---
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
      `e2e-cloze: ${name} 환경 변수가 비어 있습니다. \`node --env-file=.env.local scripts/e2e-cloze.mjs\`로 실행하세요.`,
    );
    process.exit(1);
  }
}

// =====================================================================
// 정적 유틸리티 — 독립 재파싱
// =====================================================================

function readManifest(name) {
  const manifestPath = path.join(ROOT, '.velite', `${name}.json`);
  if (!fs.existsSync(manifestPath)) {
    console.error(
      `e2e-cloze: ${path.relative(ROOT, manifestPath)}가 없습니다. \`npx velite build\` 또는 \`npm run build\`를 한 번 실행해 매니페스트를 생성한 뒤 다시 시도하세요.`,
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

// 컴파일된 MDX 코드 문자열에서 ClozeBlank JSX 호출의 attributes만 뽑는다.
// remark-cloze-blanks.ts가 항상 answer -> index -> hash 순서로 속성을
// 내보내므로(makeClozeBlankNode) 이 순서에 고정된 정규식으로 충분하다 —
// 앱의 판정 로직이 아니라 빌드 산출물의 구조를 읽는 것뿐이다.
const CLOZE_ATTR_RE = /answer:"((?:[^"\\]|\\.)*)",index:"(\d+)",hash:"([0-9a-f]{16})"/g;

function extractClozeBlanks(code) {
  const results = [];
  let m;
  CLOZE_ATTR_RE.lastIndex = 0;
  while ((m = CLOZE_ATTR_RE.exec(code))) {
    results.push({ answer: m[1], index: m[2], hash: m[3] });
  }
  return results;
}

// --- s1 커버리지 판정 함수 (순수) ---
function judgeCoverage(lessons, minBlankCount, expectedTotal) {
  const violations = [];
  if (lessons.length !== expectedTotal) {
    violations.push(`레슨 수가 ${expectedTotal}편이 아닙니다 (실제 ${lessons.length}편)`);
  }
  const perLesson = lessons.map((l) => ({ slug: l.slug, blanks: extractClozeBlanks(l.code) }));
  const withBlanks = perLesson.filter((l) => l.blanks.length > 0);
  const zeroBlankSlugs = perLesson.filter((l) => l.blanks.length === 0).map((l) => l.slug);
  if (withBlanks.length < minBlankCount) {
    violations.push(`빈칸 있는 레슨이 ${minBlankCount}편 미만입니다 (실제 ${withBlanks.length}편)`);
  }
  return { violations, blankLessonCount: withBlanks.length, zeroBlankSlugs, perLesson };
}

// --- s4 /about 무영향 판정 함수 (순수) ---
function judgePagesUnaffected(pages) {
  const violations = [];
  for (const p of pages) {
    if (typeof p.code === 'string' && p.code.includes('ClozeBlank')) {
      violations.push(`${p.slug}에 ClozeBlank 참조가 있습니다 — /about 등은 영향받지 않아야 합니다`);
    }
  }
  return violations;
}

// --- s2/s3 구간 경계 판정 함수 (순수) — fixtureCounts: {conceptCount, otherCount} ---
function judgeSectionBoundary(fixtureCounts) {
  const violations = [];
  if (fixtureCounts.conceptCount !== 1) {
    violations.push(`개념 설명 구간의 빈칸 수가 1이 아닙니다 (실제 ${fixtureCounts.conceptCount})`);
  }
  if (fixtureCounts.otherCount !== 0) {
    violations.push(`개념 설명 밖에도 빈칸이 생겼습니다 (실제 ${fixtureCounts.otherCount}개)`);
  }
  return violations;
}

// =====================================================================
// s2 — remark-cloze-blanks.ts를 직접 로드해 합성 픽스처에 돌린다
// =====================================================================

async function loadClozePlugin() {
  const pluginPath = path.join(ROOT, 'src', 'lib', 'remark-cloze-blanks.ts');
  const mod = await import(pathToFileURL(pluginPath).href);
  return mod.default;
}

// 픽스처 markdown을 파싱 -> 플러그인 실행 -> {conceptCount, otherCount, threwException}를 돌려준다.
// otherCount는 "## 3. 개념 설명"이 아닌 depth-2 섹션에 생긴 ClozeBlank 개수다.
function runFixture(plugin, markdown) {
  const processor = unified().use(remarkParse).use(remarkMdx).use(plugin);
  let tree;
  try {
    tree = processor.parse(markdown);
    processor.runSync(tree);
  } catch (e) {
    return { conceptCount: 0, otherCount: 0, threwException: true, error: e instanceof Error ? e.message : String(e) };
  }

  let currentSectionIsConcept = false;
  let conceptCount = 0;
  let otherCount = 0;

  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'heading' && node.depth === 2) {
      const text = mdastToString(node);
      currentSectionIsConcept = /^3\./.test(text) && text.includes('개념 설명');
    }
    if (node.type === 'mdxJsxTextElement' && node.name === 'ClozeBlank') {
      if (currentSectionIsConcept) conceptCount += 1;
      else otherCount += 1;
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child);
    }
  }
  for (const child of tree.children) walk(child);

  return { conceptCount, otherCount, threwException: false };
}

const FIXTURE_A = `## 3. 개념 설명

이것은 강조가 전혀 없는 평문 문단입니다. 스무 자를 넘기기 위해 조금 더 길게 문장을 씁니다.

또 다른 평문 문단도 마찬가지로 강조가 없이 스무 자 이상으로 작성되어 있습니다.

## 4. 실무 예제

여기는 실무 예제 구간입니다.
`;

const FIXTURE_B = `## 3. 개념 설명

이 문단에는 **핵심용어**라는 강조 단어가 있고 전체 길이가 스무 자를 넘도록 작성됩니다.

## 4. 실무 예제

이 문단에도 **다른용어**라는 강조가 있고 마찬가지로 스무 자를 넘도록 작성합니다.
`;

const FIXTURE_C = `## 1. 소개

이 문서는 "## 3. 개념 설명" 헤딩이 아예 없는 /about류 문서입니다. 스무 자 이상 작성합니다.
`;

// =====================================================================
// 브라우저 부트스트랩 (기존 게이트와 동일 규약)
// =====================================================================

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// 다른 게이트의 "<500이면 준비됨" 판정과 달리 여기서는 정확히 200을
// 요구한다 — Turbopack dev 서버는 리스너가 열린 직후에도 라우터가 아직
// 온디맨드 컴파일을 마치지 못해 홈("/")조차 일시적으로 404를 낼 수 있고,
// <500 조건은 그 과도기 404를 "준비 완료"로 오판해 이후의 모든 페이지
// 요청이 실패하는 경합을 만든다(실측: 이 게이트에서 재현됨).
async function waitForServerReady() {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetchWithTimeout(BASE_URL);
      if (res.status === 200) return;
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

// =====================================================================
// 브라우저 측정 헬퍼
// =====================================================================

async function measureOverflow(page) {
  return page.evaluate(() => {
    const docEl = document.documentElement;
    return {
      scrollWidth: docEl.scrollWidth,
      clientWidth: docEl.clientWidth,
      overflowXHidden:
        getComputedStyle(document.body).overflowX === 'hidden' ||
        getComputedStyle(docEl).overflowX === 'hidden',
    };
  });
}

async function main() {
  const results = []; // { name, pass, detail }
  function record(name, pass, detail) {
    results.push({ name, pass, detail });
    const mark = pass ? 'OK' : 'FAIL';
    console.log(`e2e-cloze: [${mark}] ${name}${detail ? ` — ${detail}` : ''}`);
  }

  // --- s1: 커버리지 (정적) ---
  const lessons = readManifest('lessons');
  const coverage = judgeCoverage(lessons, MIN_BLANK_LESSON_COUNT, TOTAL_LESSON_COUNT);
  record(
    's1 커버리지',
    coverage.violations.length === 0,
    `총 ${lessons.length}편, 빈칸 있는 레슨 ${coverage.blankLessonCount}편, 빈칸 0편: ${JSON.stringify(coverage.zeroBlankSlugs)}${
      coverage.violations.length > 0 ? ` | 위반: ${coverage.violations.join('; ')}` : ''
    }`,
  );

  // --- s2: 폴백 픽스처 (플러그인 직접 로드) ---
  const plugin = await loadClozePlugin();

  const fixtureAResult = runFixture(plugin, FIXTURE_A);
  record(
    's2a 강조 없음 -> 빈칸 0개, 예외 없음',
    !fixtureAResult.threwException && fixtureAResult.conceptCount === 0 && fixtureAResult.otherCount === 0,
    `conceptCount=${fixtureAResult.conceptCount} otherCount=${fixtureAResult.otherCount} threwException=${fixtureAResult.threwException}${fixtureAResult.error ? ` error=${fixtureAResult.error}` : ''}`,
  );

  const fixtureBResult = runFixture(plugin, FIXTURE_B);
  const fixtureBViolations = fixtureBResult.threwException
    ? [`예외 발생: ${fixtureBResult.error}`]
    : judgeSectionBoundary(fixtureBResult);
  record(
    's2b 구간 경계 — 개념 설명에만 1개',
    fixtureBViolations.length === 0,
    `conceptCount=${fixtureBResult.conceptCount} otherCount=${fixtureBResult.otherCount}${fixtureBViolations.length > 0 ? ` | 위반: ${fixtureBViolations.join('; ')}` : ''}`,
  );

  const fixtureCResult = runFixture(plugin, FIXTURE_C);
  record(
    's2c 개념 설명 헤딩 없음 -> 빈칸 0개, 예외 없음(/about 보호)',
    !fixtureCResult.threwException && fixtureCResult.conceptCount === 0 && fixtureCResult.otherCount === 0,
    `conceptCount=${fixtureCResult.conceptCount} otherCount=${fixtureCResult.otherCount} threwException=${fixtureCResult.threwException}`,
  );

  // --- s3: 위양성 가드 — 판정 함수 자체가 깨진 입력에서 실제로 위반을 잡는지 ---
  // "ClozeBlank가 전부 제거된 가짜 레슨 배열"을 만든다. 문자열 "ClozeBlank"만
  // 지우면(destructuring 선언부에만 등장) extractClozeBlanks()가 보는
  // answer/index/hash 트리플 패턴은 그대로 남아 위반이 잡히지 않는다 — 그래서
  // 실제로 그 트리플 패턴 자체를 code에서 제거해야 "빈칸이 없는 레슨"을
  // 정확히 시뮬레이션한다.
  const brokenLessons = lessons.map((l) => ({ ...l, code: l.code.replace(CLOZE_ATTR_RE, '') }));
  const brokenCoverage = judgeCoverage(brokenLessons, MIN_BLANK_LESSON_COUNT, TOTAL_LESSON_COUNT);
  const s3aPass = brokenCoverage.violations.length > 0;
  record(
    's3a 위양성 가드 — 커버리지 판정 함수가 전부-빈칸-제거 입력을 잡는가',
    s3aPass,
    `brokenBlankLessonCount=${brokenCoverage.blankLessonCount} violations=${JSON.stringify(brokenCoverage.violations)}`,
  );
  if (!s3aPass) {
    throw new FatalError(
      's3a 위양성 가드 실패 — judgeCoverage가 ClozeBlank를 전부 제거한 가짜 데이터에서도 위반을 보고하지 않았습니다. 이 게이트 자체가 신뢰할 수 없습니다.',
    );
  }

  const s3bViolations = judgeSectionBoundary({ conceptCount: 1, otherCount: 2 });
  const s3bPass = s3bViolations.length > 0;
  record(
    's3b 위양성 가드 — 구간 경계 판정 함수가 "밖에도 빈칸 생김" 가짜 결과를 잡는가',
    s3bPass,
    `violations=${JSON.stringify(s3bViolations)}`,
  );
  if (!s3bPass) {
    throw new FatalError(
      's3b 위양성 가드 실패 — judgeSectionBoundary가 구간 밖 빈칸이 있는 가짜 결과에서도 위반을 보고하지 않았습니다. 이 게이트 자체가 신뢰할 수 없습니다.',
    );
  }

  // --- s4: /about 무영향 (정적) ---
  const pages = readManifest('pages');
  const pagesViolations = judgePagesUnaffected(pages);
  record('s4 /about 무영향', pagesViolations.length === 0, `pages=${pages.length}편${pagesViolations.length > 0 ? ` | 위반: ${pagesViolations.join('; ')}` : ''}`);

  // --- 브라우저 대상 레슨 선정 ---
  // PRIMARY: 매니페스트 순서상 첫 번째 빈칸의 정답이 한글을 포함하는 레슨.
  // s6~s8을 이 레슨의 첫 빈칸에서 전부 수행한다 — NFD(s8) 검증까지 한 번에
  // 만족시키므로 별도 레슨 전환 로직이 필요 없다.
  const HANGUL_RE = /[가-힣]/;
  let primary = null;
  for (const l of coverage.perLesson) {
    if (l.blanks.length > 0 && HANGUL_RE.test(l.blanks[0].answer)) {
      primary = { slug: l.slug, blank: l.blanks[0] };
      break;
    }
  }
  if (!primary) {
    throw new FatalError(
      's5~s8 대상 레슨 선정 실패 — 첫 빈칸 정답에 한글이 포함된 레슨을 찾지 못했습니다(s8 NFD 검증이 불가능합니다).',
    );
  }
  console.log(`e2e-cloze: 대상 레슨(s5~s8) = ${primary.slug} (첫 빈칸 정답 "${primary.blank.answer}")`);

  // LONGEST: 전체 레슨·빈칸 중 정답 문자열이 가장 긴 빈칸을 가진 레슨(s9 두 번째 측정용).
  let longest = null;
  for (const l of coverage.perLesson) {
    for (const b of l.blanks) {
      if (!longest || b.answer.length > longest.blank.answer.length) {
        longest = { slug: l.slug, blank: b };
      }
    }
  }
  if (!longest) {
    throw new FatalError('s9 두 번째 측정 대상 레슨 선정 실패 — 빈칸이 있는 레슨이 하나도 없습니다.');
  }
  console.log(
    `e2e-cloze: 정답이 가장 긴 빈칸 레슨(s9 보조) = ${longest.slug} (정답 "${longest.blank.answer}", 길이 ${longest.blank.answer.length})`,
  );

  // --- 서버 기동 ---
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
    console.log('e2e-cloze: 개발 서버 기동 완료');

    browser = await chromium.launch();

    const VIEWPORTS = [
      { width: 375, height: 667, label: '375×667(폰)' },
      { width: 768, height: 1024, label: '768×1024(아이패드 세로)' },
    ];

    for (const vp of VIEWPORTS) {
      // 잠금 해제 쿠키 없이(잠금 상태로) 연다.
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/lesson/${primary.slug}`, { waitUntil: 'networkidle' });
        await page.waitForSelector(`#${LESSON_ARTICLE_ID}`);

        const blankSelector = `[data-cloze-blank][data-cloze-index="${primary.blank.index}"]`;
        const blankLocator = page.locator(blankSelector);
        const inputLocator = page.locator(`${blankSelector} .cloze-blank-input`);
        const feedbackLocator = page.locator(`${blankSelector} .cloze-blank-feedback`);
        const revealLocator = page.locator(`${blankSelector} .cloze-blank-reveal`);

        // s5: 존재·터치 타깃
        const totalBlanks = await page.locator('[data-cloze-blank]').count();
        const box = await inputLocator.boundingBox();
        const s5Pass = totalBlanks >= 1 && !!box && box.height >= 44;
        record(
          `s5 존재·터치 타깃 @ ${vp.label}`,
          s5Pass,
          `totalBlanks=${totalBlanks} inputHeight=${box ? box.height.toFixed(1) : 'n/a'}`,
        );
        if (!s5Pass) {
          throw new FatalError(`s5 실패 @ ${vp.label} — 빈칸이 없거나 터치 타깃이 44px 미만입니다.`);
        }

        // s6: "정답 보기" -> revealed, 정답 문자열 읽기
        await revealLocator.click();
        const revealedState = await blankLocator.getAttribute('data-cloze-state');
        const revealedText = (await feedbackLocator.innerText()).trim();
        const revealedAnswer = revealedText.replace(/^정답:\s*/, '');
        record(
          's6-1 정답 보기 -> revealed',
          revealedState === 'revealed' && revealedAnswer.length > 0,
          `state=${revealedState} revealedText="${revealedText}"`,
        );

        // 새로 로드
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForSelector(`#${LESSON_ARTICLE_ID}`);

        // 타이핑만 -> 판정도 낭독도 없어야 한다
        await inputLocator.click();
        await inputLocator.type(revealedAnswer);
        const stateWhileTyping = await blankLocator.getAttribute('data-cloze-state');
        const feedbackWhileTyping = (await feedbackLocator.innerText()).trim();
        const s6TypingPass = stateWhileTyping === 'empty' && feedbackWhileTyping === '';
        record(
          `s6-2 타이핑 중 판정 없음 @ ${vp.label}`,
          s6TypingPass,
          `state=${stateWhileTyping} feedback="${feedbackWhileTyping}"`,
        );

        // blur -> correct
        await page.locator('h1').click();
        await page.waitForTimeout(50);
        const stateAfterBlur = await blankLocator.getAttribute('data-cloze-state');
        const feedbackAfterBlur = (await feedbackLocator.innerText()).trim();
        const s6BlurPass = stateAfterBlur === 'correct' && feedbackAfterBlur.length > 0;
        record(
          `s6-3 blur 후 correct @ ${vp.label}`,
          s6BlurPass,
          `state=${stateAfterBlur} feedback="${feedbackAfterBlur}"`,
        );

        // s7: 새로 로드, 오답
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForSelector(`#${LESSON_ARTICLE_ID}`);
        await inputLocator.click();
        await inputLocator.fill('');
        await inputLocator.type(`${revealedAnswer}오`);
        await page.locator('h1').click();
        await page.waitForTimeout(50);
        const stateWrong = await blankLocator.getAttribute('data-cloze-state');
        const s7Pass = stateWrong === 'incorrect' && stateWrong !== stateAfterBlur;
        record(
          `s7-1 오답 -> incorrect (s6과 다른 결과) @ ${vp.label}`,
          s7Pass,
          `state=${stateWrong} (s6 blur state=${stateAfterBlur})`,
        );

        // 오답이어도 탭 이동/진행이 막히지 않는지
        await inputLocator.focus();
        await page.keyboard.press('Tab');
        const activeTag = await page.evaluate(() => document.activeElement?.tagName ?? null);
        const s7TabPass = activeTag !== null && activeTag !== 'BODY';
        record(`s7-2 오답 후 탭 이동 가능 @ ${vp.label}`, s7TabPass, `activeElement=${activeTag}`);

        // s8: 새로 로드, NFD 정답 주입
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForSelector(`#${LESSON_ARTICLE_ID}`);
        await inputLocator.focus();
        await inputLocator.evaluate((el, nfdValue) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, nfdValue);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, revealedAnswer.normalize('NFD'));
        await page.locator('h1').click();
        await page.waitForTimeout(50);
        const stateNfd = await blankLocator.getAttribute('data-cloze-state');
        record(`s8 NFD 입력 -> correct @ ${vp.label}`, stateNfd === 'correct', `state=${stateNfd}`);

        // s9(1/2): 위 시나리오 진행 중 375px에서 빈칸에 값이 채워진 상태로 오버플로 0
        if (vp.width === 375) {
          const overflow = await measureOverflow(page);
          const s9Pass = !overflow.overflowXHidden && overflow.scrollWidth <= overflow.clientWidth;
          record(
            's9-1 375px 오버플로 0 (빈칸 포커스·값 채워진 상태)',
            s9Pass,
            `scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth} overflowXHidden=${overflow.overflowXHidden}`,
          );
        }
      } finally {
        await context.close();
      }
    }

    // s9(2/2): 정답이 가장 긴 빈칸을 가진 레슨에서도 같은 375px 오버플로 측정
    {
      const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
      const page = await context.newPage();
      try {
        await page.goto(`${BASE_URL}/lesson/${longest.slug}`, { waitUntil: 'networkidle' });
        await page.waitForSelector(`#${LESSON_ARTICLE_ID}`);
        const blankSelector = `[data-cloze-blank][data-cloze-index="${longest.blank.index}"]`;
        const inputLocator = page.locator(`${blankSelector} .cloze-blank-input`);
        await inputLocator.click();
        await inputLocator.type(longest.blank.answer);
        const overflow = await measureOverflow(page);
        const s9LongPass = !overflow.overflowXHidden && overflow.scrollWidth <= overflow.clientWidth;
        record(
          `s9-2 375px 오버플로 0 (최장 정답 레슨 ${longest.slug}, 정답 길이 ${longest.blank.answer.length})`,
          s9LongPass,
          `scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth} overflowXHidden=${overflow.overflowXHidden}`,
        );
      } finally {
        await context.close();
      }
    }

    // s10: 저장 왕복 — 잠금 해제 쿠키를 심은 컨텍스트로 레슨을 열어 첫
    // 빈칸에 정답을 넣고 blur -> 새로 로드해도 correct 상태가 유지됨을
    // 확인한 뒤, service_role로 그 레슨의 프로브 행을 지우고 지워졌음을
    // 확인한다. 정리는 finally에서 반드시 수행한다 — 이 게이트가 실제
    // 학습 기록을 오염시킨 채 끝나면 안 된다(T-uig-06).
    {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const s10BlankId = `${primary.slug}#${primary.blank.index}`;

      const context = await browser.newContext({ viewport: { width: 768, height: 1024 } });
      try {
        // 실제 앱과 같은 방식으로 쿠키를 심는다 — /unlock 라우트를 거치지
        // 않고 컨텍스트에 직접 addCookies한다(HttpOnly 쿠키는 fetch/document.cookie로
        // 만들 수 없으므로 Playwright의 컨텍스트 API를 쓴다).
        await context.addCookies([
          {
            name: UNLOCK_COOKIE_NAME,
            value: UNLOCK_SECRET,
            domain: HOST,
            path: '/',
            httpOnly: true,
            secure: false,
          },
        ]);
        const page = await context.newPage();

        await page.goto(`${BASE_URL}/lesson/${primary.slug}`, { waitUntil: 'networkidle' });
        await page.waitForSelector(`#${LESSON_ARTICLE_ID}`);

        const blankSelector = `[data-cloze-blank][data-cloze-index="${primary.blank.index}"]`;
        const inputLocator = page.locator(`${blankSelector} .cloze-blank-input`);
        await inputLocator.click();
        await inputLocator.type(primary.blank.answer);
        await page.locator('h1').click(); // blur -> correct -> 백그라운드 저장 시도

        // 저장은 낙관적 UI 뒤에서 fire-and-forget으로 진행된다(DD-10, revalidatePath
        // 없음) — 저장이 DB에 반영될 시간을 실측 폴링으로 준다.
        let savedRow = null;
        const deadline = Date.now() + 10_000;
        while (Date.now() < deadline) {
          const { data } = await admin
            .from('cloze_answer')
            .select('blank_id, answer_hash, status')
            .eq('blank_id', s10BlankId)
            .maybeSingle();
          if (data) {
            savedRow = data;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
        record(
          's10-1 저장 — Server Action이 cloze_answer에 실제로 씀',
          !!savedRow && savedRow.status === 'correct' && savedRow.answer_hash === primary.blank.hash,
          savedRow ? `blank_id=${savedRow.blank_id} status=${savedRow.status}` : '10초 안에 행이 나타나지 않음',
        );

        // 새로 로드해도 correct 상태가 유지되는지 — ClozeProvider가
        // readClozeAnswers로 조회한 기록을 initial state로 복원해야 한다.
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForSelector(`#${LESSON_ARTICLE_ID}`);
        const stateAfterReload = await page.locator(blankSelector).getAttribute('data-cloze-state');
        const valueAfterReload = await inputLocator.inputValue();
        record(
          's10-2 새로 로드해도 채워진 상태 유지 (기기 간 동기화 전제)',
          stateAfterReload === 'correct' && valueAfterReload === primary.blank.answer,
          `state=${stateAfterReload} value="${valueAfterReload}"`,
        );
      } finally {
        // 프로브 행 정리 — 실제 학습 기록을 남기지 않는다.
        await admin.from('cloze_answer').delete().eq('blank_id', s10BlankId);
        const { data: leftover } = await admin
          .from('cloze_answer')
          .select('blank_id')
          .eq('blank_id', s10BlankId)
          .maybeSingle();
        record('s10-3 정리 — 프로브 행 삭제 확인', !leftover, leftover ? '삭제 후에도 행이 남아있음' : '삭제 확인됨');
        await context.close();
      }
    }

    await browser.close();
    browser = undefined;

    console.log(`e2e-cloze: 검사한 시나리오 수 = ${results.length}`);
    if (results.length === 0) {
      throw new FatalError('검사한 시나리오가 0건입니다.');
    }

    const failures = results.filter((r) => !r.pass);
    if (failures.length > 0) {
      console.error(`e2e-cloze: ${failures.length}건의 위반이 발견되었습니다:\n`);
      for (const f of failures) {
        console.error(`  - ${f.name}: ${f.detail}`);
      }
      throw new FatalError(`${failures.length}건의 위반으로 게이트 실패`);
    }

    console.log(`e2e-cloze: 시나리오 ${results.length}건 전부 통과`);
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
    console.error(`e2e-cloze: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
