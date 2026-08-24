#!/usr/bin/env node
// 실제 개발 서버를 띄워 완료 토글이 브라우저 요청 → 쿠키 게이트 → Server Action
// 재검증 → Supabase 저장 → 서버 재렌더까지 왕복하는지 확인하는 종단 게이트.
// 실행: node --env-file=.env.local scripts/e2e-progress.mjs
//
// src/lib/supabase/admin.ts를 import하지 않는다 — check-supabase-progress.mjs와
// 같은 이유로, 이 스크립트는 @supabase/supabase-js의 createClient를 직접 호출한다.
//
// 어떤 출력에도 쿠키 값·시크릿을 찍지 않는다.

import { createClient } from '@supabase/supabase-js';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// src/lib/unlock-secret.ts의 UNLOCK_COOKIE_NAME과 반드시 일치해야 한다 — 이
// 스크립트는 'server-only' 마커 유무와 무관하게 순수 TS 모듈을 Node에서 직접
// 로드할 수 없어(ts-node/tsx 미설치) 상수를 재선언한다.
const UNLOCK_COOKIE_NAME = 'runway_unlock';

const PORT = process.env.E2E_PORT ? Number(process.env.E2E_PORT) : 3210;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 180_000;
const FETCH_TIMEOUT_MS = 30_000;

class FatalError extends Error {}

// --- 필수 환경 변수 부재 시 즉시 오류 종료 (기본값으로 넘어가지 않는다) ---

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
      `e2e-progress: ${name} 환경 변수가 비어 있습니다. \`node --env-file=.env.local scripts/e2e-progress.mjs\`로 실행하세요.`,
    );
    process.exit(1);
  }
}

function readLessonsManifest() {
  const lessonsPath = path.join(ROOT, '.velite', 'lessons.json');
  if (!fs.existsSync(lessonsPath)) {
    console.error(
      `e2e-progress: ${path.relative(ROOT, lessonsPath)}가 없습니다. \`npm run dev\` 또는 \`npm run build\`를 한 번 실행해 Velite 매니페스트를 생성한 뒤 다시 시도하세요.`,
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
}

const LESSONS = readLessonsManifest();
const PROBE_LESSON = LESSONS.find((l) => l.hasContent) ?? LESSONS[0];
if (!PROBE_LESSON) {
  console.error('e2e-progress: .velite/lessons.json에 레슨이 하나도 없습니다.');
  process.exit(1);
}
const PROBE_SLUG = PROBE_LESSON.slug;

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

async function deleteProbeRow(admin) {
  await admin.from('progress').delete().eq('lesson_id', PROBE_SLUG);
}

async function main() {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // a. service_role로 프로브 레슨 초기 상태 확정 (완료 없음)
  await deleteProbeRow(admin);

  const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  const serverOutput = [];
  const child = spawn(process.execPath, [nextBin, 'dev', '--port', String(PORT), '--hostname', HOST], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  child.stdout.on('data', (d) => serverOutput.push(d.toString()));
  child.stderr.on('data', (d) => serverOutput.push(d.toString()));

  try {
    try {
      await waitForServerReady();
    } catch (e) {
      throw new FatalError(
        `${e.message}\n--- 서버 출력(마지막 부분) ---\n${serverOutput.join('').slice(-4000)}`,
      );
    }
    console.log(`e2e-progress: 개발 서버 기동 완료 (probe lesson: ${PROBE_SLUG})`);

    // b. 쿠키 없이 GET — 진도 UI 마커 0건 + 레슨 제목은 존재 (D-18/D-20)
    {
      const res = await fetchWithTimeout(`${BASE_URL}/lesson/${PROBE_SLUG}`);
      if (res.status !== 200) {
        throw new FatalError(`시나리오 b 실패 — 쿠키 없는 요청이 200이 아닙니다 (status=${res.status})`);
      }
      const body = await res.text();
      if (body.includes('data-progress-ui')) {
        throw new FatalError('시나리오 b 실패 — 쿠키 없는 응답에 data-progress-ui 마커가 존재합니다 (D-20 위반)');
      }
      if (!body.includes(PROBE_LESSON.title)) {
        throw new FatalError('시나리오 b 실패 — 쿠키 없는 응답에 레슨 제목이 없습니다 (D-18 위반)');
      }
    }
    console.log('e2e-progress: b/f 쿠키 없음 → 진도 UI 마커 0건 + 레슨 제목 존재 OK');

    const cookieHeader = `${UNLOCK_COOKIE_NAME}=${UNLOCK_SECRET}`;

    // c. 올바른 쿠키 + DB 미완료 → todo
    {
      const res = await fetchWithTimeout(`${BASE_URL}/lesson/${PROBE_SLUG}`, {
        headers: { Cookie: cookieHeader },
      });
      const body = await res.text();
      if (!body.includes('data-complete-state="todo"')) {
        throw new FatalError('시나리오 c 실패 — 쿠키 보유 + DB 미완료 상태인데 data-complete-state="todo"가 없습니다');
      }
    }
    console.log('e2e-progress: c/f 쿠키 있음 + DB 미완료 → todo 렌더 OK');

    // d. service_role로 완료 upsert → done (TRACK-01 지속성의 서버 렌더 증거)
    {
      const { error } = await admin
        .from('progress')
        .upsert({ lesson_id: PROBE_SLUG, completed_at: new Date().toISOString() });
      if (error) throw new FatalError(`시나리오 d 준비(upsert) 실패 — Supabase 오류: ${error.message}`);

      const res = await fetchWithTimeout(`${BASE_URL}/lesson/${PROBE_SLUG}`, {
        headers: { Cookie: cookieHeader },
      });
      const body = await res.text();
      if (!body.includes('data-complete-state="done"')) {
        throw new FatalError(
          '시나리오 d 실패 — DB 완료 후에도 data-complete-state="done"이 렌더되지 않습니다 (TRACK-01)',
        );
      }
    }
    console.log('e2e-progress: d/f DB 완료 upsert → done 렌더 OK (TRACK-01)');

    // e. 그 행을 delete → todo로 복귀 (TRACK-02)
    {
      const { error } = await admin.from('progress').delete().eq('lesson_id', PROBE_SLUG);
      if (error) throw new FatalError(`시나리오 e 준비(delete) 실패 — Supabase 오류: ${error.message}`);

      const res = await fetchWithTimeout(`${BASE_URL}/lesson/${PROBE_SLUG}`, {
        headers: { Cookie: cookieHeader },
      });
      const body = await res.text();
      if (!body.includes('data-complete-state="todo"')) {
        throw new FatalError('시나리오 e 실패 — DB 삭제 후에도 todo로 복귀하지 않습니다 (TRACK-02)');
      }
    }
    console.log('e2e-progress: e/f DB 삭제 → todo 복귀 OK (TRACK-02)');

    console.log(
      'e2e-progress: 모든 시나리오 통과 — 완료 토글이 브라우저 → 쿠키 게이트 → Supabase → 서버 재렌더까지 왕복합니다.',
    );
  } finally {
    // f. 정리 — 프로브 행 삭제, 서버 프로세스 트리 종료
    await deleteProbeRow(admin);
    killServerTree(child);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(`e2e-progress: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
