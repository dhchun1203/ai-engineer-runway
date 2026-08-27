#!/usr/bin/env node
// 진도 저장 서버 전용 접근 계층의 상시 정적 보안 게이트 — 외부 의존성 0, Node 표준 모듈만
// 사용한다. check-manifest.mjs/check-brand.mjs와 같은 형태: 저장소 루트 기준으로 파일을
// 읽고, 위반을 배열에 모아 마지막에 한꺼번에 보고하며, 하나라도 있으면 0이 아닌 코드로
// 종료한다. 02-02/02-03/02-04가 이 파일에 항목을 덧붙인다 (Task 2, PLAT-02 T-02-01/04/05/07).

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const errors = [];
const skipped = [];

function fail(message) {
  errors.push(message);
}

function skip(message) {
  skipped.push(message);
}

function readFileIfExists(absPath) {
  if (!fs.existsSync(absPath)) return null;
  return fs.readFileSync(absPath, 'utf8');
}

function stripSqlComments(sql) {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
}

function stripJsLineComments(source) {
  return source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
}

function walkFiles(absDir, extFilter) {
  const results = [];
  if (!fs.existsSync(absDir)) return results;
  const stack = [absDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        stack.push(path.join(current, entry.name));
      }
    } else if (stat.isFile()) {
      if (!extFilter || extFilter.test(current)) {
        results.push(current);
      }
    }
  }
  return results;
}

// --- G1: src/lib/supabase/admin.ts가 존재하고 첫 import가 server-only ---

const ADMIN_TS_PATH = path.join(ROOT, 'src', 'lib', 'supabase', 'admin.ts');
const adminSource = readFileIfExists(ADMIN_TS_PATH);

if (adminSource === null) {
  fail(`G1 failed: ${path.relative(ROOT, ADMIN_TS_PATH)} not found`);
} else {
  const firstImportMatch = adminSource.match(/^\s*import\s+.+?;/m);
  if (!firstImportMatch || !/^\s*import\s+['"]server-only['"];/.test(firstImportMatch[0])) {
    fail(
      `G1 failed: ${path.relative(ROOT, ADMIN_TS_PATH)}'s first import is not "import 'server-only';" — got: ${
        firstImportMatch ? firstImportMatch[0].trim() : '(no import found)'
      }`,
    );
  }
}

// --- G2: src/ 아래 'use client' 파일 중 lib/supabase/admin 또는 lib/progress-store를 import하는 파일 0개 ---

const SRC_DIR = path.join(ROOT, 'src');
const srcFiles = walkFiles(SRC_DIR, /\.(ts|tsx|js|jsx)$/);
const clientFilesImportingServerOnly = [];

for (const filePath of srcFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const isClientFile = /^\s*['"]use client['"]/.test(content);
  if (!isClientFile) continue;
  if (/from\s+['"].*lib\/supabase\/admin['"]/.test(content) || /from\s+['"].*lib\/progress-store['"]/.test(content)) {
    clientFilesImportingServerOnly.push(path.relative(ROOT, filePath));
  }
}

if (clientFilesImportingServerOnly.length > 0) {
  fail(
    `G2 failed: ${clientFilesImportingServerOnly.length} client component(s) import server-only progress modules: ${clientFilesImportingServerOnly.join(', ')}`,
  );
}

// --- G3: src/, scripts/, .env.example 어디에도 NEXT_PUBLIC_SUPABASE / NEXT_PUBLIC_UNLOCK 없음 ---

const FORBIDDEN_ENV_PREFIXES = ['NEXT_PUBLIC_SUPABASE', 'NEXT_PUBLIC_UNLOCK'];
const SELF_PATH = fileURLToPath(import.meta.url);
// 이 스크립트 자신은 검사 대상에서 제외한다 — 금지 문자열을 상수로 들고 있어야
// 검사할 수 있으므로, 자신을 스캔하면 게이트가 스스로를 무효화한다
// (check-manifest.mjs가 스크립트 원문에는 규칙을 적지 않는 것과 같은 원리).
const g3ScanTargets = [
  ...srcFiles,
  ...walkFiles(path.join(ROOT, 'scripts'), /\.(mjs|js|ts)$/),
  path.join(ROOT, '.env.example'),
].filter((p) => fs.existsSync(p) && p !== SELF_PATH);

const g3Violations = [];
for (const filePath of g3ScanTargets) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const forbidden of FORBIDDEN_ENV_PREFIXES) {
    if (content.includes(forbidden)) {
      g3Violations.push(`${path.relative(ROOT, filePath)} contains "${forbidden}"`);
    }
  }
}

if (g3Violations.length > 0) {
  fail(`G3 failed: client-exposure-prefixed env var name(s) found: ${g3Violations.join('; ')}`);
}

// --- G4: actions.ts에 'use server'가 있고, hasUnlockCookie/getLessonBySlug가 등장하는
// 문자 위치가 모두 setLessonCompletion 첫 등장보다 앞선다 (인가 검사가 쓰기 뒤로
// 밀리는 회귀를 잡는다, T-02-02) ---

const ACTIONS_TS_PATH = path.join(ROOT, 'src', 'app', 'lesson', '[lessonId]', 'actions.ts');
const actionsSource = readFileIfExists(ACTIONS_TS_PATH);

if (actionsSource === null) {
  fail(`G4 failed: ${path.relative(ROOT, ACTIONS_TS_PATH)} not found`);
} else {
  if (!/^\s*['"]use server['"];/.test(actionsSource)) {
    fail(`G4 failed: ${path.relative(ROOT, ACTIONS_TS_PATH)} does not start with "'use server';"`);
  }
  const hasUnlockIdx = actionsSource.indexOf('hasUnlockCookie');
  const getLessonIdx = actionsSource.indexOf('getLessonBySlug');
  const setCompletionIdx = actionsSource.indexOf('setLessonCompletion');
  if (hasUnlockIdx === -1 || getLessonIdx === -1 || setCompletionIdx === -1) {
    fail(
      `G4 failed: expected hasUnlockCookie, getLessonBySlug, and setLessonCompletion to all appear in ${path.relative(ROOT, ACTIONS_TS_PATH)}`,
    );
  } else if (hasUnlockIdx >= setCompletionIdx || getLessonIdx >= setCompletionIdx) {
    fail(
      `G4 failed: hasUnlockCookie/getLessonBySlug must appear before the first setLessonCompletion reference in ${path.relative(ROOT, ACTIONS_TS_PATH)}`,
    );
  }
}

// --- G5: 마이그레이션 SQL에서 주석 제거 후 enable row level security 1회, create policy 0회 ---

const MIGRATION_PATH = path.join(ROOT, 'supabase', 'migrations', '20260824120000_create_progress.sql');
const migrationSource = readFileIfExists(MIGRATION_PATH);

if (migrationSource === null) {
  fail(`G5 failed: ${path.relative(ROOT, MIGRATION_PATH)} not found`);
} else {
  const withoutComments = stripSqlComments(migrationSource).toLowerCase();
  const enableRlsCount = (withoutComments.match(/enable row level security/g) || []).length;
  const createPolicyCount = (withoutComments.match(/create policy/g) || []).length;

  if (enableRlsCount !== 1) {
    fail(`G5 failed: expected "enable row level security" exactly once (outside comments), got ${enableRlsCount}`);
  }
  if (createPolicyCount !== 0) {
    fail(
      `G5 failed: expected 0 occurrences of "create policy" (outside comments) — policy count 0 is the intended default-deny design, got ${createPolicyCount}`,
    );
  }
}

// --- G6: .env.example의 각 KEY=VALUE 줄에서 값이 40자 이하이고 eyJ로 시작하지 않음 ---

const ENV_EXAMPLE_PATH = path.join(ROOT, '.env.example');
const envExampleSource = readFileIfExists(ENV_EXAMPLE_PATH);

if (envExampleSource === null) {
  fail(`G6 failed: ${path.relative(ROOT, ENV_EXAMPLE_PATH)} not found`);
} else {
  const lines = envExampleSource.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (value.length > 40) {
      fail(`G6 failed: .env.example key "${key}" has a value longer than 40 chars — looks like a real secret, not a placeholder`);
    }
    if (value.startsWith('eyJ')) {
      fail(`G6 failed: .env.example key "${key}" has a value starting with "eyJ" — looks like a real JWT, not a placeholder`);
    }
  }
}

// --- G7: .gitignore가 .env*를 무시하고 .env.example을 예외로 둠 ---

const GITIGNORE_PATH = path.join(ROOT, '.gitignore');
const gitignoreSource = readFileIfExists(GITIGNORE_PATH);

if (gitignoreSource === null) {
  fail(`G7 failed: ${path.relative(ROOT, GITIGNORE_PATH)} not found`);
} else {
  const hasEnvIgnore = /^\s*\.env\*\s*$/m.test(gitignoreSource);
  const hasEnvExampleException = /^\s*!\.env\.example\s*$/m.test(gitignoreSource);
  if (!hasEnvIgnore) {
    fail('G7 failed: .gitignore does not contain a ".env*" ignore rule');
  }
  if (!hasEnvExampleException) {
    fail('G7 failed: .gitignore does not contain a "!.env.example" exception rule');
  }
}

// --- G8: package.json dependencies에 @supabase/ssr가 없다 (D-17이 Supabase Auth를 배제) ---

const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const packageJsonSource = readFileIfExists(PACKAGE_JSON_PATH);

if (packageJsonSource === null) {
  fail(`G8 failed: ${path.relative(ROOT, PACKAGE_JSON_PATH)} not found`);
} else {
  let packageJson;
  try {
    packageJson = JSON.parse(packageJsonSource);
  } catch (e) {
    fail(`G8 failed: could not parse package.json: ${e.message}`);
    packageJson = null;
  }
  if (packageJson && packageJson.dependencies && packageJson.dependencies['@supabase/ssr']) {
    fail(
      'G8 failed: package.json dependencies contains "@supabase/ssr" — D-17 explicitly excludes Supabase Auth/anonymous sessions in favor of the shared-secret cookie design; its reappearance signals a regression back to per-device anonymous sessions.',
    );
  }
}

// --- G9: 두 계약으로 나뉜다 (08-02).
//
// STATIC_SHELL_PAGES: 이 페이즈가 정적 셸로 전환하는 페이지 — route segment
// config `dynamic` 선언이 없고, 쿠키/진도 조회 식별자(hasUnlockCookie·
// readCompletedLessonIds·readLessonNote·cookies()) 중 어느 것도 등장하지
// 않는다. 08-02는 Step 페이지, 08-03은 레슨 페이지를 여기 넣는다. 08-06이
// 커리큘럼 페이지를 이 배열에 추가한다(계획에 명시돼 있다).
//
// DYNAMIC_GATED_PAGES: 오늘 날짜가 곧 페이지 본문이라 동적으로 유지하기로
// 결정된 두 라우트(근거는 08-06이 기록한다) — 기존 정규식대로 force-dynamic
// 선언 존재를 요구한다.
//
// STATIC_SHELL_PAGES 검사는 stripJsLineComments()로 주석을 걷어낸 소스만
// 본다 — 전환된 페이지가 "여기서 쿠키를 읽지 않는다"는 설명 주석을 달게
// 되므로, 주석까지 검사하면 게이트가 스스로를 오탐시킨다(G20과 같은 이유).

const STATIC_SHELL_PAGES = [
  path.join(ROOT, 'src', 'app', 'step', '[stepId]', 'page.tsx'),
  path.join(ROOT, 'src', 'app', 'lesson', '[lessonId]', 'page.tsx'),
];

const DYNAMIC_GATED_PAGES = [
  path.join(ROOT, 'src', 'app', 'page.tsx'),
  path.join(ROOT, 'src', 'app', 'schedule', 'page.tsx'),
];

const G9_COOKIE_IDENTIFIERS = ['hasUnlockCookie', 'readCompletedLessonIds', 'readLessonNote', 'cookies('];

for (const pagePath of STATIC_SHELL_PAGES) {
  const source = readFileIfExists(pagePath);
  if (source === null) {
    fail(`G9 failed: ${path.relative(ROOT, pagePath)} not found (이 페이즈가 정적 셸로 전환한 페이지 계약)`);
    continue;
  }
  const codeOnly = stripJsLineComments(source);
  if (/export\s+const\s+dynamic\s*=/.test(codeOnly)) {
    fail(
      `G9 failed: ${path.relative(ROOT, pagePath)} still declares a route segment config "dynamic" export — 이 페이지는 정적 셸로 전환됐어야 한다`,
    );
  }
  const foundIdentifiers = G9_COOKIE_IDENTIFIERS.filter((identifier) => codeOnly.includes(identifier));
  if (foundIdentifiers.length > 0) {
    fail(
      `G9 failed: ${path.relative(ROOT, pagePath)} still references cookie/progress identifier(s): ${foundIdentifiers.join(', ')} — 정적 셸로 전환한 페이지 계약 위반`,
    );
  }
}

for (const pagePath of DYNAMIC_GATED_PAGES) {
  const source = readFileIfExists(pagePath);
  if (source === null) {
    fail(`G9 failed: ${path.relative(ROOT, pagePath)} not found (동적 유지가 결정된 페이지 계약)`);
    continue;
  }
  if (!/export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(source)) {
    fail(
      `G9 failed: ${path.relative(ROOT, pagePath)} missing "export const dynamic = 'force-dynamic'" (동적 유지가 결정된 페이지 계약)`,
    );
  }
}

// --- G10: .next/static 존재 + 시크릿 env var가 채워져 있으면 그 값의 리터럴이 .next/static 아래 없어야 함 ---

const NEXT_STATIC_DIR = path.join(ROOT, '.next', 'static');
const secretEnvVars = [
  { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY },
  { name: 'UNLOCK_SECRET', value: process.env.UNLOCK_SECRET },
].filter((v) => typeof v.value === 'string' && v.value.length > 0);

if (!fs.existsSync(NEXT_STATIC_DIR) || secretEnvVars.length === 0) {
  skip('G10 skipped: .next/static directory or secret env vars not present in this run');
} else {
  const staticFiles = walkFiles(NEXT_STATIC_DIR, null);
  const g10Violations = [];
  for (const filePath of staticFiles) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue; // 바이너리/비-UTF8 파일은 시크릿 리터럴을 담을 수 없다고 간주하고 건너뛴다
    }
    for (const secret of secretEnvVars) {
      if (content.includes(secret.value)) {
        g10Violations.push(`${path.relative(ROOT, filePath)} contains the literal value of ${secret.name}`);
      }
    }
  }
  if (g10Violations.length > 0) {
    fail(`G10 failed: secret literal(s) found in .next/static: ${g10Violations.join('; ')}`);
  }
}

// --- G11: src/lib/unlock-secret.ts의 isValidUnlockValue 다섯 판정을 node:assert로
// 실제 실행 검증한다. 이 파일은 어떤 것도 import하지 않으므로 Node가 그대로
// 로드할 수 있다(Node 22.6+ 타입 스트리핑, 별도 러너 도입 없음 — PITFALLS Pitfall 1) ---

const UNLOCK_SECRET_TS_PATH = path.join(ROOT, 'src', 'lib', 'unlock-secret.ts');

if (!fs.existsSync(UNLOCK_SECRET_TS_PATH)) {
  fail(`G11 failed: ${path.relative(ROOT, UNLOCK_SECRET_TS_PATH)} not found`);
} else {
  try {
    const { isValidUnlockValue } = await import(pathToFileURL(UNLOCK_SECRET_TS_PATH).href);
    const LONG_SECRET = 'a'.repeat(32);

    assert.strictEqual(isValidUnlockValue(undefined, undefined), false, '시크릿 미설정 + candidate 미설정');
    assert.strictEqual(isValidUnlockValue(undefined, LONG_SECRET), false, 'candidate 미설정');
    assert.strictEqual(isValidUnlockValue('wrong-value', LONG_SECRET), false, '불일치');
    assert.strictEqual(isValidUnlockValue('short', 'short'), false, '짧은 시크릿(16자 미만)');
    assert.strictEqual(isValidUnlockValue(LONG_SECRET, LONG_SECRET), true, '정상 일치');
  } catch (e) {
    fail(`G11 failed: isValidUnlockValue 실행 검증 실패 — ${e.message}`);
  }
}

// --- G12: complete-button.tsx가 useOptimistic을 쓰고, 완료 여부를 담는 별도의
// useState를 두지 않는다 (Task 1이 채택한 prop 수렴 방식의 회귀 방지) ---

const COMPLETE_BUTTON_PATH = path.join(ROOT, 'src', 'components', 'complete-button.tsx');
const completeButtonSource = readFileIfExists(COMPLETE_BUTTON_PATH);

if (completeButtonSource === null) {
  fail(`G12 failed: ${path.relative(ROOT, COMPLETE_BUTTON_PATH)} not found`);
} else {
  // 주석(예: Task 1이 남긴 "왜 useState(initialDone)을 쓰지 않는가" 설명)은
  // 스캔에서 제외한다 — 그 설명 문장 자체가 금지 패턴의 리터럴을 담고 있어
  // 주석까지 검사하면 게이트가 스스로를 오탐시킨다.
  const codeOnly = stripJsLineComments(completeButtonSource);
  if (!/useOptimistic\s*\(/.test(codeOnly)) {
    fail(`G12 failed: ${path.relative(ROOT, COMPLETE_BUTTON_PATH)} does not call useOptimistic(...)`);
  }
  if (/useState\s*\(\s*initialDone\s*\)/.test(codeOnly)) {
    fail(
      `G12 failed: ${path.relative(ROOT, COMPLETE_BUTTON_PATH)} calls useState(initialDone) — a separate local "done" state reintroduces the cross-device staleness bug Task 1's prop-convergence design avoided`,
    );
  }
}

// --- G13: src/lib/progress.ts가 Velite 콘텐츠 매니페스트와 Supabase 계열
// 모듈을 import하지 않는다 (집계 계층의 순수성 유지, 02-03) ---

const PROGRESS_TS_PATH = path.join(ROOT, 'src', 'lib', 'progress.ts');
const progressSource = readFileIfExists(PROGRESS_TS_PATH);

if (progressSource === null) {
  fail(`G13 failed: ${path.relative(ROOT, PROGRESS_TS_PATH)} not found`);
} else {
  const codeOnly = stripJsLineComments(progressSource);
  if (codeOnly.includes('#site/content')) {
    fail(
      `G13 failed: ${path.relative(ROOT, PROGRESS_TS_PATH)} imports the Velite content manifest directly — must go through curriculum-helpers.ts instead`,
    );
  }
  if (/supabase|progress-store/i.test(codeOnly)) {
    fail(
      `G13 failed: ${path.relative(ROOT, PROGRESS_TS_PATH)} references Supabase/progress-store — the aggregation layer must stay pure (no data access)`,
    );
  }
}

// --- G14: 쿠키 게이트 순서 계약이 Step 페이지에서 신규 Route Handler로
// 이사했다(08-02). src/app/api/progress/route.ts에서 hasUnlockCookie 첫 등장
// 위치가 readCompletedLessonIds 첫 등장보다 앞선다 — 게이트를 건너뛰고
// 조회하는 회귀를 잡는다. 검사 내용(indexOf 비교)은 G4와 동일한 기법이다 ---

const PROGRESS_ROUTE_PATH = path.join(ROOT, 'src', 'app', 'api', 'progress', 'route.ts');
const progressRouteSource = readFileIfExists(PROGRESS_ROUTE_PATH);

if (progressRouteSource === null) {
  fail(`G14 failed: ${path.relative(ROOT, PROGRESS_ROUTE_PATH)} not found`);
} else {
  const hasUnlockIdx = progressRouteSource.indexOf('hasUnlockCookie');
  const readCompletedIdx = progressRouteSource.indexOf('readCompletedLessonIds');
  if (hasUnlockIdx === -1 || readCompletedIdx === -1) {
    fail(
      `G14 failed: expected hasUnlockCookie and readCompletedLessonIds to both appear in ${path.relative(ROOT, PROGRESS_ROUTE_PATH)}`,
    );
  } else if (hasUnlockIdx >= readCompletedIdx) {
    fail(
      `G14 failed: hasUnlockCookie must appear before readCompletedLessonIds in ${path.relative(ROOT, PROGRESS_ROUTE_PATH)} (cookie gate must run before progress read)`,
    );
  }
}

// --- G15: src/components/step-card.tsx에 하드코딩된 0 진행률 상수가 없다
// (Phase 1이 남긴 progressPercent = 0 placeholder의 회귀 방지, 02-04) ---

const STEP_CARD_PATH = path.join(ROOT, 'src', 'components', 'step-card.tsx');
const stepCardSource = readFileIfExists(STEP_CARD_PATH);

if (stepCardSource === null) {
  fail(`G15 failed: ${path.relative(ROOT, STEP_CARD_PATH)} not found`);
} else if (/progressPercent\s*=\s*0/.test(stepCardSource)) {
  fail(
    `G15 failed: ${path.relative(ROOT, STEP_CARD_PATH)} still hardcodes a zero progress value — must render from a real progress prop or omit the bar entirely`,
  );
}

// --- G16: src/app/ 아래에 dashboard 세그먼트가 없다 — D-25가 별도 대시보드
// 페이지를 만들지 않기로 한 결정의 회귀 방지 (02-04) ---

const DASHBOARD_SEGMENT_PATH = path.join(ROOT, 'src', 'app', 'dashboard');
if (fs.existsSync(DASHBOARD_SEGMENT_PATH)) {
  fail(
    `G16 failed: ${path.relative(ROOT, DASHBOARD_SEGMENT_PATH)} exists — D-25 decided against a separate dashboard route in favor of enhancing the home page`,
  );
}

// --- G17: /와 /schedule 각각에서 hasUnlockCookie 첫 등장 위치가
// readCompletedLessonIds 첫 등장보다 앞선다 (G14가 Route Handler에 대해 하는
// 것과 동일한 형태) — 게이트를 건너뛰고 조회하는 회귀를 잡는다 (03-01,
// T-03-01). /curriculum은 08-06이 정적으로 전환하면 두 식별자가 사라지므로
// 08-02에서 뺀다 — 그 계약은 G9의 STATIC_SHELL_PAGES로 옮겨간다 ---

const G17_GATED_PAGES = [
  path.join(ROOT, 'src', 'app', 'page.tsx'),
  path.join(ROOT, 'src', 'app', 'schedule', 'page.tsx'),
];

for (const pagePath of G17_GATED_PAGES) {
  const source = readFileIfExists(pagePath);
  if (source === null) {
    fail(`G17 failed: ${path.relative(ROOT, pagePath)} not found`);
    continue;
  }
  const hasUnlockIdx = source.indexOf('hasUnlockCookie');
  const readCompletedIdx = source.indexOf('readCompletedLessonIds');
  if (hasUnlockIdx === -1 || readCompletedIdx === -1) {
    fail(
      `G17 failed: expected hasUnlockCookie and readCompletedLessonIds to both appear in ${path.relative(ROOT, pagePath)}`,
    );
  } else if (hasUnlockIdx >= readCompletedIdx) {
    fail(
      `G17 failed: hasUnlockCookie must appear before readCompletedLessonIds in ${path.relative(ROOT, pagePath)} (cookie gate must run before progress read)`,
    );
  }
}

// --- G18: src/lib/today.ts·src/lib/schedule.ts·src/lib/pace.ts가 의존성 0
// 순수 모듈을 유지한다 — 주석을 걷어낸 코드에 import 문이 한 건도 없어야 한다.
// 위반 시 check-schedule.mjs/check-pace.mjs가 트랜스파일러 없이 로드하지
// 못하게 된다 (03-01, 03-03이 pace.ts를 추가) ---

const G18_PURE_MODULES = [
  path.join(ROOT, 'src', 'lib', 'today.ts'),
  path.join(ROOT, 'src', 'lib', 'schedule.ts'),
  path.join(ROOT, 'src', 'lib', 'pace.ts'),
];

for (const modulePath of G18_PURE_MODULES) {
  const source = readFileIfExists(modulePath);
  if (source === null) {
    fail(`G18 failed: ${path.relative(ROOT, modulePath)} not found`);
    continue;
  }
  const codeOnly = stripJsLineComments(source);
  if (/^\s*import\s+.+$/m.test(codeOnly)) {
    fail(
      `G18 failed: ${path.relative(ROOT, modulePath)} contains an import statement — 의존성 0 순수 모듈이라야 게이트 스크립트가 트랜스파일러 없이 로드할 수 있다`,
    );
  }
}

// --- G19: src/lib/pace.ts와 src/lib/schedule.ts가 Supabase 계열·progress-store·
// Velite 매니페스트 식별자를 참조하지 않는다 — G13이 progress.ts에 대해 하는
// 것과 같은 형태의 계층 분리 검사. 주석은 stripJsLineComments()로 걷어낸 뒤
// 검사해 게이트가 자기 설명 문장(예: "Supabase를 import하지 않는다")에 걸려
// 오탐하는 일을 막는다 (03-03) ---

const G19_LAYER_SEPARATED_MODULES = [
  path.join(ROOT, 'src', 'lib', 'pace.ts'),
  path.join(ROOT, 'src', 'lib', 'schedule.ts'),
];

for (const modulePath of G19_LAYER_SEPARATED_MODULES) {
  const source = readFileIfExists(modulePath);
  if (source === null) {
    fail(`G19 failed: ${path.relative(ROOT, modulePath)} not found`);
    continue;
  }
  const codeOnly = stripJsLineComments(source);
  if (codeOnly.includes('#site/content')) {
    fail(
      `G19 failed: ${path.relative(ROOT, modulePath)} imports the Velite content manifest directly — must go through curriculum-helpers.ts instead (called at the page/route layer, not here)`,
    );
  }
  if (/supabase|progress-store/i.test(codeOnly)) {
    fail(
      `G19 failed: ${path.relative(ROOT, modulePath)} references Supabase/progress-store — this pure calculation layer must stay dependency-0 and receive completed sets as parameters only`,
    );
  }
}

// --- G20: src/components/schedule-auto-scroll.tsx가 "use client"로 시작하고
// 진도·시크릿 계열 식별자(completedIds, progress-store, supabase, UNLOCK)를
// 참조하지 않는다 — G2가 이미 클라이언트 파일의 서버 전용 모듈 import를 막고
// 있으므로, 이 게이트는 props를 통한 데이터 유입까지 좁히는 보강이다(T-03-15,
// 03-04). 주석은 stripJsLineComments()로 걷어낸 뒤 검사해 게이트가 자기 설명
// 문장(예: "진도·시크릿 어떤 것도 받지 않는다")에 걸려 오탐하는 일을 막는다 ---

const SCHEDULE_AUTO_SCROLL_PATH = path.join(ROOT, 'src', 'components', 'schedule-auto-scroll.tsx');
const scheduleAutoScrollSource = readFileIfExists(SCHEDULE_AUTO_SCROLL_PATH);

if (scheduleAutoScrollSource === null) {
  fail(`G20 failed: ${path.relative(ROOT, SCHEDULE_AUTO_SCROLL_PATH)} not found`);
} else {
  if (!/^\s*['"]use client['"]/.test(scheduleAutoScrollSource)) {
    fail(`G20 failed: ${path.relative(ROOT, SCHEDULE_AUTO_SCROLL_PATH)} does not start with "'use client'"`);
  }
  const codeOnly = stripJsLineComments(scheduleAutoScrollSource);
  const FORBIDDEN_PROGRESS_IDENTIFIERS = ['completedIds', 'progress-store', 'supabase', 'UNLOCK'];
  const foundIdentifiers = FORBIDDEN_PROGRESS_IDENTIFIERS.filter((identifier) =>
    new RegExp(identifier, 'i').test(codeOnly),
  );
  if (foundIdentifiers.length > 0) {
    fail(
      `G20 failed: ${path.relative(ROOT, SCHEDULE_AUTO_SCROLL_PATH)} references progress/secret identifier(s): ${foundIdentifiers.join(', ')} — this island must only receive targetId (T-03-15)`,
    );
  }
}

// --- G21: src/app/api/progress/route.ts가 (1) route segment config를
// force-static으로 지정하지 않고 (2) 응답에 no-store 캐시 금지 헤더를 실제로
// 설정한다 — 이 핸들러가 캐시되면 한 사용자의 진도가 다른 요청자에게
// 응답된다(T-08-02-02). G20과 같은 형태(파일 존재 → 주석 제거 → 문자열 검사)를
// 쓴다 ---

if (progressRouteSource === null) {
  fail(`G21 failed: ${path.relative(ROOT, PROGRESS_ROUTE_PATH)} not found`);
} else {
  const codeOnly = stripJsLineComments(progressRouteSource);
  if (/export\s+const\s+dynamic\s*=\s*["']force-static["']/.test(codeOnly)) {
    fail(
      `G21 failed: ${path.relative(ROOT, PROGRESS_ROUTE_PATH)} declares "export const dynamic = 'force-static'" — 사용자별 진도 응답이 정적 캐시로 강제되면 캐시 오염이 발생한다`,
    );
  }
  if (!codeOnly.includes('no-store')) {
    fail(
      `G21 failed: ${path.relative(ROOT, PROGRESS_ROUTE_PATH)} does not set a "no-store" cache directive — 응답 캐시 금지 헤더가 실제로 설정돼야 한다`,
    );
  }
}

// --- 결과 ---

if (skipped.length > 0) {
  for (const s of skipped) {
    console.log(`check-progress-gates: ${s}`);
  }
}

if (errors.length > 0) {
  console.error(`check-progress-gates: ${errors.length} gate(s) failed:\n`);
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}

console.log('check-progress-gates: all gates passed');
process.exit(0);
