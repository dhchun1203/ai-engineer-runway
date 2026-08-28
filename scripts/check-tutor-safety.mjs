#!/usr/bin/env node
// 학습도우미가 "말만 할 수 있고 아무것도 만질 수 없다"를 상시 검증하는 게이트
// (quick 260829-t8k). 외부 의존성 0, Node 표준 모듈만 사용 — check-brand.mjs 골격 복제.
//
// 왜 이 게이트가 있나
// ------------------
// 사용자 요구사항: "절대 웹사이트 소스를 변경할 수 있는 권한은 주면 안 된다.
// 학습을 위한 코드 생성은 가능하지만 프로젝트에 영향을 미치진 못하게 해야 한다."
//
// 지금 구현은 그 요구를 이미 만족한다 — /api/tutor는 도구를 하나도 주지 않는
// 순수 텍스트 대화(messages.stream)라 모델이 파일을 읽거나 쓰거나 명령을 실행할
// 수단 자체가 없다. 하지만 그건 "지금 코드가 우연히 그렇다"일 뿐이고, 나중에
// 누군가(=미래의 나) 편의로 tools 한 줄을 추가하면 조용히 무너진다.
//
// 이 게이트는 그 한 줄을 빌드에서 막는다. 도구를 주는 것이 실수로 불가능해진다.
//
// 검사 대상: src/app/api/tutor/route.ts, src/lib/tutor-*.ts, package.json
//
// 실행: node scripts/check-tutor-safety.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const errors = [];
const fail = (message) => errors.push(message);

function readFileIfExists(absPath) {
  try {
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

// 주석은 검사에서 제외한다 — 이 파일들은 "왜 도구를 주지 않는가"를 설명하는
// 주석을 달게 되고, 그 설명 문장 자체가 금지 토큰을 담는다(check-brand.mjs와
// check-progress-gates.mjs G20이 같은 이유로 쓰는 기법).
function stripComments(source) {
  return source
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

// --- T1: 모델에게 어떤 도구도 주지 않는다 ---
//
// 아래 토큰이 하나라도 등장하면 학습도우미가 텍스트 밖의 능력을 갖게 된다.
// 서버 도구(code_execution)는 Anthropic 인프라에서 돌지만, 그래도 이 사이트의
// 대화에 코드 실행 능력이 붙는 것이므로 같이 막는다 — 요구사항은 "학습용 코드를
// 보여주는 것"이지 "코드를 실행하는 것"이 아니다.
const FORBIDDEN_CAPABILITY_TOKENS = [
  'tools:',
  'tool_choice',
  'tool_runner',
  'toolRunner',
  'code_execution',
  'mcp_servers',
  'mcp_toolset',
  'bash_2025',
  'text_editor_',
  'computer_2025',
  'memory_2025',
  'web_search_',
  'web_fetch_',
  'claude-agent-sdk',
  'beta.agents',
  'beta.sessions',
];

// --- T2: 라우트가 파일 시스템·프로세스에 손대지 않는다 ---
//
// 도구를 주지 않아도, 라우트 코드 자체가 모델 출력을 받아 파일로 쓰면 같은 결과가
// 된다. 그런 코드가 들어올 경로를 아예 막는다.
const FORBIDDEN_HOST_TOKENS = [
  'node:fs',
  'node:child_process',
  'child_process',
  "from 'fs'",
  'from "fs"',
  'writeFile',
  'execSync',
  'spawn(',
];

const TUTOR_ROUTE = path.join(ROOT, 'src', 'app', 'api', 'tutor', 'route.ts');
const routeSource = readFileIfExists(TUTOR_ROUTE);

if (routeSource === null) {
  fail(`T0 failed: ${path.relative(ROOT, TUTOR_ROUTE)} not found`);
} else {
  const code = stripComments(routeSource);

  for (const token of FORBIDDEN_CAPABILITY_TOKENS) {
    if (code.includes(token)) {
      fail(
        `T1 failed: ${path.relative(ROOT, TUTOR_ROUTE)}에 "${token}"이(가) 있습니다 — 학습도우미는 도구 없는 순수 텍스트 대화여야 합니다(사용자 요구: 사이트 소스를 바꿀 수 없어야 한다)`,
      );
    }
  }

  for (const token of FORBIDDEN_HOST_TOKENS) {
    if (code.includes(token)) {
      fail(
        `T1 failed: ${path.relative(ROOT, TUTOR_ROUTE)}에 "${token}"이(가) 있습니다 — 이 라우트는 파일 시스템·프로세스에 접근하지 않습니다`,
      );
    }
  }

  // --- T2: 쿠키 게이트가 모델 호출보다 먼저 온다 (G4의 문자 위치 비교 기법 복제) ---
  const gateAt = code.indexOf('hasUnlockCookie');
  const clientAt = code.indexOf('new Anthropic');
  if (gateAt === -1) {
    fail(`T2 failed: ${path.relative(ROOT, TUTOR_ROUTE)}가 hasUnlockCookie()를 호출하지 않습니다`);
  } else if (clientAt !== -1 && gateAt > clientAt) {
    fail(
      `T2 failed: ${path.relative(ROOT, TUTOR_ROUTE)}에서 hasUnlockCookie()가 모델 클라이언트 생성보다 뒤에 있습니다 — 잠금 해제 전에 토큰이 나갈 수 있습니다`,
    );
  }

  // --- T3: 레슨 슬러그를 매니페스트로 검증한다 ---
  // 임의 문자열을 그대로 받으면 존재하지 않는 레슨 이름으로 행을 만들 수 있다.
  if (!code.includes('getLessonBySlug')) {
    fail(
      `T3 failed: ${path.relative(ROOT, TUTOR_ROUTE)}가 getLessonBySlug()로 레슨 존재를 검증하지 않습니다`,
    );
  }
}

// --- T4: 저장 계층도 도구·파일 접근이 없다 ---
for (const rel of ['src/lib/tutor-store.ts', 'src/lib/tutor-prompt.ts']) {
  const abs = path.join(ROOT, rel);
  const source = readFileIfExists(abs);
  if (source === null) {
    fail(`T4 failed: ${rel} not found`);
    continue;
  }
  const code = stripComments(source);
  for (const token of FORBIDDEN_HOST_TOKENS) {
    if (code.includes(token)) {
      fail(`T4 failed: ${rel}에 "${token}"이(가) 있습니다 — 이 계층은 DB만 다룹니다`);
    }
  }
}

// --- T5: 에이전트 SDK가 의존성으로 들어오지 않는다 ---
const pkgSource = readFileIfExists(path.join(ROOT, 'package.json'));
if (pkgSource === null) {
  fail('T5 failed: package.json not found');
} else {
  const pkg = JSON.parse(pkgSource);
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  for (const name of Object.keys(deps)) {
    if (name.includes('claude-agent-sdk') || name.includes('claude-code')) {
      fail(
        `T5 failed: package.json에 "${name}" 의존성이 있습니다 — 파일 시스템 도구를 내장한 에이전트 라이브러리는 이 프로젝트에 들어오지 않습니다`,
      );
    }
  }
}

// --- 결과 ---

if (errors.length > 0) {
  console.error(`check-tutor-safety: ${errors.length}건 위반:\n`);
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}

console.log(
  'check-tutor-safety: 통과 — 학습도우미는 도구 없는 텍스트 대화이고, 잠금 게이트가 모델 호출보다 앞서며, 파일 시스템·프로세스 접근 경로가 없습니다',
);
process.exit(0);
