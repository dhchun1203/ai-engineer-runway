#!/usr/bin/env node
// 호스티드 Supabase DB에 lesson_note로 실제 왕복을 걸어 스키마 적용 + RLS 기본 차단을
// 동시에 반증하는 게이트. check-supabase-progress.mjs의 골격을 그대로 복제한다
// (공유 모듈로 빼지 않는다, 이 저장소의 관례).
// 실행: node --env-file=.env.local scripts/check-supabase-note.mjs
//
// 1단계는 precondition 확인이다 — 오케스트레이터가 관리 API로 public.lesson_note
// 테이블을 이미 만들었다고 전제한다(RLS 켜짐, 정책 0개). 이 전제가 깨지면 즉시
// 중단하고 소유자에게 알린다. src/lib/note-store.ts를 import하지 않는다 —
// 'server-only' 마커가 붙은 모듈은 Next 번들러 밖에서 로드되지 않고, 여기서는
// @supabase/supabase-js의 createClient를 스크립트 안에서 직접 호출한다.
//
// 어떤 출력에도 키 값이나 URL 전체를 출력하지 않는다.

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PROBE_LESSON_ID = '__note_gate_probe__';
let stepsPassed = 0;

function fatal(message) {
  console.error(`check-supabase-note: ${message}`);
  process.exit(1);
}

function stripSqlComments(sql) {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
}

// --- 필수 환경 변수 부재 시 즉시 오류 종료 (기본값으로 넘어가지 않는다) ---

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  fatal(
    'SUPABASE_URL 환경 변수가 비어 있습니다. .env.local에 값을 채우고 `node --env-file=.env.local scripts/check-supabase-note.mjs`로 다시 실행하세요.',
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  fatal(
    'SUPABASE_SERVICE_ROLE_KEY 환경 변수가 비어 있습니다. .env.local에 값을 채우고 다시 실행하세요.',
  );
}

async function main() {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- 1. service_role로 lesson_note select — precondition 확인. 실패하면
  // 스키마 미적용(또는 오케스트레이터의 사전 생성이 반영되지 않음)으로 판정하고
  // 즉시 중단한다 ---
  {
    const { error } = await admin.from('lesson_note').select('lesson_id').limit(1);
    if (error) {
      fatal(
        `1단계(precondition: 스키마 확인) 실패 — lesson_note 테이블에 접근할 수 없습니다. 오케스트레이터가 관리 API로 테이블을 미리 만들어 두었어야 합니다(계획의 <precondition> 참고). Supabase 오류: ${error.message}`,
      );
    }
  }
  stepsPassed++;
  console.log('check-supabase-note: 1단계 precondition 확인 OK (lesson_note 테이블 select 성공)');

  // --- 2. 프로브 행 upsert → select 일치 확인 → 다른 body로 재upsert → 갱신 확인
  // → delete → 부재 확인 (왕복 반증) ---
  {
    const firstBody = `probe-1-${Date.now()}`;
    const { error: upsertError } = await admin
      .from('lesson_note')
      .upsert({ lesson_id: PROBE_LESSON_ID, body: firstBody, updated_at: new Date().toISOString() });
    if (upsertError) fatal(`2단계(최초 upsert) 실패 — Supabase 오류: ${upsertError.message}`);

    const { data: firstData, error: firstSelectError } = await admin
      .from('lesson_note')
      .select('body')
      .eq('lesson_id', PROBE_LESSON_ID)
      .maybeSingle();
    if (firstSelectError) fatal(`2단계(존재 확인 select) 실패 — Supabase 오류: ${firstSelectError.message}`);
    if (!firstData || firstData.body !== firstBody) {
      fatal('2단계(존재 확인 select) 실패 — upsert한 body가 그대로 조회되지 않습니다.');
    }
    console.log('check-supabase-note: 2단계 최초 upsert + 존재 확인 OK');

    const secondBody = `probe-2-${Date.now()}`;
    const { error: reupsertError } = await admin
      .from('lesson_note')
      .upsert({ lesson_id: PROBE_LESSON_ID, body: secondBody, updated_at: new Date().toISOString() });
    if (reupsertError) fatal(`2단계(재upsert) 실패 — Supabase 오류: ${reupsertError.message}`);

    const { data: secondData, error: secondSelectError } = await admin
      .from('lesson_note')
      .select('body')
      .eq('lesson_id', PROBE_LESSON_ID)
      .maybeSingle();
    if (secondSelectError) fatal(`2단계(재upsert 후 확인 select) 실패 — Supabase 오류: ${secondSelectError.message}`);
    if (!secondData || secondData.body !== secondBody) {
      fatal('2단계(재upsert 후 갱신 확인) 실패 — body가 새 값으로 갱신되지 않았습니다.');
    }
    console.log('check-supabase-note: 2단계 재upsert 갱신 확인 OK (다른 body로 왕복 반증)');

    const { error: deleteError } = await admin.from('lesson_note').delete().eq('lesson_id', PROBE_LESSON_ID);
    if (deleteError) fatal(`2단계(delete) 실패 — Supabase 오류: ${deleteError.message}`);

    const { data: afterDelete, error: afterDeleteError } = await admin
      .from('lesson_note')
      .select('lesson_id')
      .eq('lesson_id', PROBE_LESSON_ID)
      .maybeSingle();
    if (afterDeleteError) fatal(`2단계(delete 후 확인 select) 실패 — Supabase 오류: ${afterDeleteError.message}`);
    if (afterDelete) fatal('2단계(delete 후 확인 select) 실패 — delete했는데도 프로브 행이 남아 있습니다.');

    stepsPassed++;
    console.log('check-supabase-note: 2단계 delete 후 부재 확인 OK — 왕복 전체 통과');
  }

  // --- 3. 마이그레이션 SQL에서 주석 제거 후 enable row level security 1회,
  // create policy 0회 ---
  {
    const migrationPath = path.join(ROOT, 'supabase', 'migrations', '20260827000000_create_lesson_note.sql');
    if (!fs.existsSync(migrationPath)) {
      fatal(`3단계(마이그레이션 파일 확인) 실패 — ${path.relative(ROOT, migrationPath)}가 없습니다.`);
    }
    const source = fs.readFileSync(migrationPath, 'utf8');
    const withoutComments = stripSqlComments(source).toLowerCase();
    const enableRlsCount = (withoutComments.match(/enable row level security/g) || []).length;
    const createPolicyCount = (withoutComments.match(/create policy/g) || []).length;
    if (enableRlsCount !== 1) {
      fatal(
        `3단계(RLS 활성화 확인) 실패 — "enable row level security"가 주석 제거 후 정확히 1회 등장해야 합니다 (got ${enableRlsCount})`,
      );
    }
    if (createPolicyCount !== 0) {
      fatal(
        `3단계(정책 0개 확인) 실패 — "create policy"가 주석 제거 후 0회 등장해야 합니다 (got ${createPolicyCount}) — 정책 0개가 의도된 기본 차단 설계입니다.`,
      );
    }
    stepsPassed++;
    console.log('check-supabase-note: 3단계 마이그레이션 RLS 1회 + 정책 0회 확인 OK');
  }

  // --- 4. note-store.ts 첫 import가 server-only인지, src/ 아래 'use client'
  // 파일 중 lib/note-store를 import하는 파일이 0개인지 정적으로 확인한다 ---
  {
    const noteStorePath = path.join(ROOT, 'src', 'lib', 'note-store.ts');
    if (!fs.existsSync(noteStorePath)) {
      fatal(`4단계(note-store.ts 확인) 실패 — ${path.relative(ROOT, noteStorePath)}가 없습니다.`);
    }
    const noteStoreSource = fs.readFileSync(noteStorePath, 'utf8');
    const firstImportMatch = noteStoreSource.match(/^\s*import\s+.+?;/m);
    if (!firstImportMatch || !/^\s*import\s+['"]server-only['"];/.test(firstImportMatch[0])) {
      fatal(
        `4단계(server-only 첫 import 확인) 실패 — note-store.ts의 첫 import가 "import 'server-only';"가 아닙니다: ${
          firstImportMatch ? firstImportMatch[0].trim() : '(import 없음)'
        }`,
      );
    }

    const srcDir = path.join(ROOT, 'src');
    const clientFilesImportingNoteStore = [];
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const content = fs.readFileSync(full, 'utf8');
          const isClientFile = /^\s*['"]use client['"]/.test(content);
          if (isClientFile && /from\s+['"].*lib\/note-store['"]/.test(content)) {
            clientFilesImportingNoteStore.push(path.relative(ROOT, full));
          }
        }
      }
    }
    walk(srcDir);
    if (clientFilesImportingNoteStore.length > 0) {
      fatal(
        `4단계(클라이언트 컴포넌트의 서버 전용 모듈 import 확인) 실패 — ${clientFilesImportingNoteStore.join(', ')}가 lib/note-store를 import합니다.`,
      );
    }
    stepsPassed++;
    console.log('check-supabase-note: 4단계 server-only 첫 import + 클라이언트 미참조 확인 OK');
  }

  // --- 5. anon 키 default-deny 반증 ---
  if (!SUPABASE_ANON_KEY) {
    console.log('check-supabase-note: 5단계 skipped — SUPABASE_ANON_KEY가 설정되지 않음');
  } else {
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: anonSelectData, error: anonSelectError } = await anon.from('lesson_note').select('lesson_id');
    if (anonSelectError) {
      console.log('check-supabase-note: 5a단계 anon select가 오류로 거부됨 (RLS 기본 차단 확인)');
    } else if (Array.isArray(anonSelectData) && anonSelectData.length === 0) {
      console.log('check-supabase-note: 5a단계 anon select가 0행 반환 (RLS 기본 차단 확인)');
    } else {
      fatal(
        `5a단계(anon select 기본 차단 반증) 실패 — anon 키로 select했더니 ${anonSelectData?.length ?? '알 수 없는 수'}행이 반환되었습니다. RLS 정책이 하나라도 존재하는지 확인하세요.`,
      );
    }

    const { error: anonInsertError } = await anon
      .from('lesson_note')
      .insert({ lesson_id: PROBE_LESSON_ID, body: 'anon-probe' });
    if (!anonInsertError) {
      await admin.from('lesson_note').delete().eq('lesson_id', PROBE_LESSON_ID);
      fatal(
        '5b단계(anon insert 기본 차단 반증) 실패 — anon 키로 insert가 성공했습니다. RLS 정책이 하나라도 존재하는지 확인하세요(정책 0개가 기본 차단 설계입니다).',
      );
    }
    stepsPassed++;
    console.log('check-supabase-note: 5b단계 anon insert가 오류로 거부됨 (RLS 기본 차단 확인)');
  }

  // --- 6. 종료 직전 프로브 행이 남아 있지 않은지 재확인 ---
  {
    const { data, error } = await admin
      .from('lesson_note')
      .select('lesson_id')
      .eq('lesson_id', PROBE_LESSON_ID)
      .maybeSingle();
    if (error) fatal(`6단계(최종 정리 확인) 실패 — Supabase 오류: ${error.message}`);
    if (data) {
      await admin.from('lesson_note').delete().eq('lesson_id', PROBE_LESSON_ID);
      fatal('6단계(최종 정리 확인) 실패 — 스크립트 종료 시점에 프로브 행이 테이블에 남아 있었습니다.');
    }
    stepsPassed++;
    console.log('check-supabase-note: 6단계 최종 정리 확인 OK — 프로브 행 없음');
  }

  // 검사 건수가 0이면 성공이 아니라 실패로 종료한다.
  if (stepsPassed === 0) {
    fatal('검사 건수가 0입니다 — 게이트가 아무것도 확인하지 못했습니다.');
  }

  console.log(
    `check-supabase-note: 모든 단계 통과 (검사 ${stepsPassed}건) — lesson_note 왕복 + RLS 기본 차단 확인 완료.`,
  );
  process.exit(0);
}

main().catch((e) => {
  fatal(`예상치 못한 오류: ${e instanceof Error ? e.message : String(e)}`);
});
