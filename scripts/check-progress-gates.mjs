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

// --- G9: 잠금 게이트를 통과해야 하는 페이지들에 force-dynamic 선언이 있다.
// 이번 태스크 시점에서는 레슨 페이지 하나를 검사하고, 02-03/02-04가 Step·홈을
// 이 목록에 추가한다 ---

const DYNAMIC_GATED_PAGES = [path.join(ROOT, 'src', 'app', 'lesson', '[lessonId]', 'page.tsx')];

for (const pagePath of DYNAMIC_GATED_PAGES) {
  const source = readFileIfExists(pagePath);
  if (source === null) {
    fail(`G9 failed: ${path.relative(ROOT, pagePath)} not found`);
    continue;
  }
  if (!/export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(source)) {
    fail(`G9 failed: ${path.relative(ROOT, pagePath)} missing "export const dynamic = 'force-dynamic'"`);
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
