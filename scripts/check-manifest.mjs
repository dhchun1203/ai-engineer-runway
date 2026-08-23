#!/usr/bin/env node
// 커리큘럼 매니페스트 불변식 자동 검증 게이트 — 외부 의존성 0, Node 표준 모듈만 사용.
// 입력: .velite/lessons.json(빌드 산출물), src/content/modules.ts(정규식으로 모듈 id 리터럴 추출)
// 하나라도 깨지면 비어 있지 않은 오류 메시지와 함께 비정상 종료(exit code != 0)한다.
//
// 기대값 상수: hasContent가 true인 레슨 수. 파일럿 1(1-3-python-variables-and-types)만
// 존재하는 현재는 1. Plan 06이 파일럿 2(2-3-react-components)를 채우면 이 값을 2로 올릴 것.
const EXPECTED_HAS_CONTENT_COUNT = 1;
const EXPECTED_HAS_CONTENT_SLUGS = ['1-3-python-variables-and-types'];

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const LESSONS_JSON_PATH = path.join(ROOT, '.velite', 'lessons.json');
const MODULES_TS_PATH = path.join(ROOT, 'src', 'content', 'modules.ts');

const errors = [];

function fail(message) {
  errors.push(message);
}

// --- 입력 로드 (파일이 없으면 즉시 오류 — 기본값으로 넘어가지 않는다) ---

if (!fs.existsSync(LESSONS_JSON_PATH)) {
  console.error(
    `check-manifest: ${LESSONS_JSON_PATH} not found — run "npm run build" first (Velite build output missing)`,
  );
  process.exit(1);
}

if (!fs.existsSync(MODULES_TS_PATH)) {
  console.error(`check-manifest: ${MODULES_TS_PATH} not found`);
  process.exit(1);
}

let lessons;
try {
  lessons = JSON.parse(fs.readFileSync(LESSONS_JSON_PATH, 'utf8'));
} catch (e) {
  console.error(`check-manifest: failed to parse ${LESSONS_JSON_PATH}: ${e.message}`);
  process.exit(1);
}

if (!Array.isArray(lessons)) {
  console.error(`check-manifest: ${LESSONS_JSON_PATH} did not parse to an array`);
  process.exit(1);
}

const modulesSource = fs.readFileSync(MODULES_TS_PATH, 'utf8');
const moduleIdMatches = [...modulesSource.matchAll(/id:\s*'([0-9]-[0-9])'/g)].map((m) => m[1]);

if (moduleIdMatches.length === 0) {
  console.error(
    `check-manifest: no module id literals (id: '<n>-<n>') extracted from ${MODULES_TS_PATH} — parsing regex may be stale`,
  );
  process.exit(1);
}

// --- 1. 레슨 수가 정확히 35 ---
if (lessons.length !== 35) {
  fail(`Invariant 1 failed: expected exactly 35 lessons, got ${lessons.length}`);
}

// --- 2. 모듈 id가 정확히 19개이고 모두 유일 ---
const moduleIdSet = new Set(moduleIdMatches);
if (moduleIdMatches.length !== 19) {
  fail(`Invariant 2 failed: expected exactly 19 module id literals in modules.ts, got ${moduleIdMatches.length}`);
}
if (moduleIdSet.size !== moduleIdMatches.length) {
  fail(
    `Invariant 2 failed: module ids in modules.ts are not all unique (${moduleIdMatches.length} literals, ${moduleIdSet.size} unique)`,
  );
}

// --- 3. 모든 레슨의 depth가 심화 또는 개요 ---
const invalidDepth = lessons.filter((l) => l.depth !== '심화' && l.depth !== '개요');
if (invalidDepth.length > 0) {
  fail(
    `Invariant 3 failed: ${invalidDepth.length} lesson(s) have a depth value other than 심화/개요: ${invalidDepth
      .map((l) => `${l.slug}=${l.depth}`)
      .join(', ')}`,
  );
}

// --- 4. stepId=3 -> 전부 개요 / stepId 1,2 -> 전부 심화 ---
const step3NotOverview = lessons.filter((l) => l.stepId === 3 && l.depth !== '개요');
if (step3NotOverview.length > 0) {
  fail(
    `Invariant 4 failed: ${step3NotOverview.length} Step 3 lesson(s) are not 개요: ${step3NotOverview
      .map((l) => l.slug)
      .join(', ')}`,
  );
}
const step12NotDeep = lessons.filter((l) => l.stepId !== 3 && l.depth !== '심화');
if (step12NotDeep.length > 0) {
  fail(
    `Invariant 4 failed: ${step12NotDeep.length} Step 1/2 lesson(s) are not 심화: ${step12NotDeep
      .map((l) => l.slug)
      .join(', ')}`,
  );
}

// --- 5. estimatedMinutes가 1 이상의 정수 ---
const invalidMinutes = lessons.filter(
  (l) => typeof l.estimatedMinutes !== 'number' || !Number.isInteger(l.estimatedMinutes) || l.estimatedMinutes < 1,
);
if (invalidMinutes.length > 0) {
  fail(
    `Invariant 5 failed: ${invalidMinutes.length} lesson(s) have an invalid estimatedMinutes: ${invalidMinutes
      .map((l) => `${l.slug}=${l.estimatedMinutes}`)
      .join(', ')}`,
  );
}

// --- 6. estimatedMinutes 총합이 7200~10800 ---
const totalMinutes = lessons.reduce((sum, l) => sum + (l.estimatedMinutes || 0), 0);
if (totalMinutes < 7200 || totalMinutes > 10800) {
  fail(`Invariant 6 failed: estimatedMinutes total ${totalMinutes} is outside the 7200-10800 band`);
}

// --- 7. 레슨의 moduleId 집합 == 모듈 id 집합 (양방향 차집합 공집합) ---
const lessonModuleIdSet = new Set(lessons.map((l) => l.moduleId));
const lessonsOnlyModuleIds = [...lessonModuleIdSet].filter((id) => !moduleIdSet.has(id));
const modulesOnlyModuleIds = [...moduleIdSet].filter((id) => !lessonModuleIdSet.has(id));
if (lessonsOnlyModuleIds.length > 0) {
  fail(
    `Invariant 7 failed: lesson moduleId(s) not present in modules.ts (orphan lessons): ${lessonsOnlyModuleIds.join(', ')}`,
  );
}
if (modulesOnlyModuleIds.length > 0) {
  fail(
    `Invariant 7 failed: module id(s) in modules.ts with no lessons referencing them: ${modulesOnlyModuleIds.join(', ')}`,
  );
}

// --- 8. moduleId+order 키가 전역 유일 ---
const moduleOrderKeys = lessons.map((l) => `${l.moduleId}#${l.order}`);
const moduleOrderKeySet = new Set(moduleOrderKeys);
if (moduleOrderKeySet.size !== moduleOrderKeys.length) {
  fail(
    `Invariant 8 failed: (moduleId, order) is not globally unique — ${moduleOrderKeys.length} lessons, ${moduleOrderKeySet.size} unique keys`,
  );
}

// --- 9. slug가 전역 유일 ---
const slugs = lessons.map((l) => l.slug);
const slugSet = new Set(slugs);
if (slugSet.size !== slugs.length) {
  fail(`Invariant 9 failed: slug is not globally unique — ${slugs.length} lessons, ${slugSet.size} unique slugs`);
}

// --- 10. hasContent=true인 레슨이 기대 개수/슬러그와 일치 ---
const hasContentLessons = lessons.filter((l) => l.hasContent === true);
if (hasContentLessons.length !== EXPECTED_HAS_CONTENT_COUNT) {
  fail(
    `Invariant 10 failed: expected exactly ${EXPECTED_HAS_CONTENT_COUNT} lesson(s) with hasContent=true, got ${hasContentLessons.length} (${hasContentLessons
      .map((l) => l.slug)
      .join(', ')})`,
  );
} else {
  const actualSlugs = hasContentLessons.map((l) => l.slug).sort();
  const expectedSlugs = [...EXPECTED_HAS_CONTENT_SLUGS].sort();
  if (JSON.stringify(actualSlugs) !== JSON.stringify(expectedSlugs)) {
    fail(
      `Invariant 10 failed: hasContent=true slug(s) ${JSON.stringify(actualSlugs)} do not match expected ${JSON.stringify(expectedSlugs)}`,
    );
  }
}

// --- 11. (stepId, 모듈 order, 레슨 order) 3단 정렬의 첫/마지막 slug ---
const moduleOrderById = new Map(
  moduleIdMatches.map((id) => {
    // module.ts 소스에서 해당 id의 order 값을 재추출한다 (동일 파일, 별도 정규식 패스).
    const re = new RegExp(`id:\\s*'${id}'[\\s\\S]*?order:\\s*(\\d+)`);
    const match = modulesSource.match(re);
    return [id, match ? Number(match[1]) : NaN];
  }),
);

function sortKey(lesson) {
  const modOrder = moduleOrderById.get(lesson.moduleId);
  return [lesson.stepId, modOrder, lesson.order];
}

const ordered = [...lessons].sort((a, b) => {
  const [as, am, al] = sortKey(a);
  const [bs, bm, bl] = sortKey(b);
  if (as !== bs) return as - bs;
  if (am !== bm) return am - bm;
  return al - bl;
});

const EXPECTED_FIRST_SLUG = '1-1-course-orientation';
const EXPECTED_LAST_SLUG = '3-7-project-ax-launch';
const actualFirst = ordered[0]?.slug;
const actualLast = ordered[ordered.length - 1]?.slug;
if (actualFirst !== EXPECTED_FIRST_SLUG) {
  fail(`Invariant 11 failed: expected first ordered lesson slug "${EXPECTED_FIRST_SLUG}", got "${actualFirst}"`);
}
if (actualLast !== EXPECTED_LAST_SLUG) {
  fail(`Invariant 11 failed: expected last ordered lesson slug "${EXPECTED_LAST_SLUG}", got "${actualLast}"`);
}

// --- 결과 ---
if (errors.length > 0) {
  console.error(`check-manifest: ${errors.length} invariant(s) failed:\n`);
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}

console.log(
  `check-manifest: all 11 invariants passed (35 lessons, 19 modules, total ${totalMinutes} minutes)`,
);
process.exit(0);
