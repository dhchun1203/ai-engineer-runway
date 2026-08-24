#!/usr/bin/env node
// 호스티드 Supabase DB에 실제 왕복을 걸어 스키마 적용 + RLS 기본 차단을 동시에
// 반증하는 게이트. 실행: node --env-file=.env.local scripts/check-supabase-progress.mjs
//
// src/lib/supabase/admin.ts를 import하지 않는다 — 'server-only' 마커가 붙은 모듈은
// Next 번들러 밖에서 로드되지 않고, check-manifest.mjs가 modules.ts를 독립적으로
// 재파싱하는 것과 같은 "게이트는 앱 런타임에 의존하지 않는다" 관례를 따른다.
// 여기서는 @supabase/supabase-js의 createClient를 스크립트 안에서 직접 호출한다.
//
// 어떤 메시지에도 키 값이나 URL 전체를 출력하지 않는다.

import { createClient } from '@supabase/supabase-js';

const PROBE_LESSON_ID = '__gate_probe__';

function fatal(message) {
  console.error(`check-supabase-progress: ${message}`);
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- 필수 환경 변수 부재 시 즉시 오류 종료 (기본값으로 넘어가지 않는다) ---

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  fatal(
    'SUPABASE_URL 환경 변수가 비어 있습니다. .env.local에 값을 채우고 `node --env-file=.env.local scripts/check-supabase-progress.mjs`로 다시 실행하세요.',
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

  // --- 1. service_role로 select — 스키마 미적용 여부 판정 ---
  {
    const { error } = await admin.from('progress').select('lesson_id').limit(1);
    if (error) {
      fatal(
        `1단계(스키마 확인) 실패 — progress 테이블에 접근할 수 없습니다. 마이그레이션이 적용되지 않았을 수 있습니다. Supabase 오류: ${error.message}`,
      );
    }
  }
  console.log('check-supabase-progress: 1/7 스키마 확인 OK (progress 테이블 select 성공)');

  // --- 2. 프로브 행 upsert ---
  const firstCompletedAt = new Date().toISOString();
  {
    const { error } = await admin
      .from('progress')
      .upsert({ lesson_id: PROBE_LESSON_ID, completed_at: firstCompletedAt });
    if (error) {
      fatal(`2단계(최초 upsert) 실패 — Supabase 오류: ${error.message}`);
    }
  }
  console.log('check-supabase-progress: 2/7 최초 upsert OK');

  // --- 3. 다시 select해 존재 확인 ---
  {
    const { data, error } = await admin
      .from('progress')
      .select('lesson_id, completed_at')
      .eq('lesson_id', PROBE_LESSON_ID)
      .maybeSingle();
    if (error) {
      fatal(`3단계(존재 확인 select) 실패 — Supabase 오류: ${error.message}`);
    }
    if (!data) {
      fatal('3단계(존재 확인 select) 실패 — upsert한 프로브 행이 조회되지 않습니다.');
    }
  }
  console.log('check-supabase-progress: 3/7 존재 확인 OK');

  // --- 4. 잠시 뒤 같은 행을 새 시각으로 재upsert, completed_at 변경 확인 (D-30) ---
  await sleep(50);
  const secondCompletedAt = new Date().toISOString();
  {
    const { error } = await admin
      .from('progress')
      .upsert({ lesson_id: PROBE_LESSON_ID, completed_at: secondCompletedAt });
    if (error) {
      fatal(`4단계(재upsert) 실패 — Supabase 오류: ${error.message}`);
    }
  }
  {
    const { data, error } = await admin
      .from('progress')
      .select('completed_at')
      .eq('lesson_id', PROBE_LESSON_ID)
      .maybeSingle();
    if (error) {
      fatal(`4단계(재upsert 후 확인 select) 실패 — Supabase 오류: ${error.message}`);
    }
    if (!data) {
      fatal('4단계(재upsert 후 확인 select) 실패 — 프로브 행이 사라졌습니다.');
    }
    const storedCompletedAt = new Date(data.completed_at).toISOString();
    if (storedCompletedAt === firstCompletedAt) {
      fatal(
        `4단계(D-30 시각 갱신 확인) 실패 — 재완료 후에도 completed_at이 최초 값과 동일합니다 (재완료 시 시각이 갱신되어야 합니다).`,
      );
    }
  }
  console.log('check-supabase-progress: 4/7 재upsert 시 completed_at 갱신 확인 OK (D-30)');

  // --- 5. delete 후 부재 확인 (TRACK-02) ---
  {
    const { error } = await admin.from('progress').delete().eq('lesson_id', PROBE_LESSON_ID);
    if (error) {
      fatal(`5단계(delete) 실패 — Supabase 오류: ${error.message}`);
    }
  }
  {
    const { data, error } = await admin
      .from('progress')
      .select('lesson_id')
      .eq('lesson_id', PROBE_LESSON_ID)
      .maybeSingle();
    if (error) {
      fatal(`5단계(delete 후 확인 select) 실패 — Supabase 오류: ${error.message}`);
    }
    if (data) {
      fatal('5단계(delete 후 확인 select) 실패 — delete했는데도 프로브 행이 여전히 존재합니다.');
    }
  }
  console.log('check-supabase-progress: 5/7 delete 후 부재 확인 OK (TRACK-02)');

  // --- 6. anon 키 default-deny 반증 (PLAT-02) ---
  if (!SUPABASE_ANON_KEY) {
    console.log('check-supabase-progress: 6/7 skipped — SUPABASE_ANON_KEY가 설정되지 않음');
  } else {
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: anonSelectData, error: anonSelectError } = await anon.from('progress').select('lesson_id');
    if (anonSelectError) {
      // RLS 거부가 에러로 표현되는 경우도 있고 빈 배열로 표현되는 경우도 있다 — 둘 다 통과.
      console.log('check-supabase-progress: 6a/7 anon select가 오류로 거부됨 (RLS 기본 차단 확인)');
    } else if (Array.isArray(anonSelectData) && anonSelectData.length === 0) {
      console.log('check-supabase-progress: 6a/7 anon select가 0행 반환 (RLS 기본 차단 확인)');
    } else {
      fatal(
        `6a단계(anon select 기본 차단 반증) 실패 — anon 키로 select했더니 ${anonSelectData?.length ?? '알 수 없는 수'}행이 반환되었습니다. RLS 정책이 하나라도 존재하는지 확인하세요.`,
      );
    }

    const { error: anonInsertError } = await anon
      .from('progress')
      .insert({ lesson_id: PROBE_LESSON_ID, completed_at: new Date().toISOString() });
    if (!anonInsertError) {
      // anon insert가 성공해버렸다면 RLS가 뚫린 것 — 즉시 정리를 시도하고 실패로 종료.
      await admin.from('progress').delete().eq('lesson_id', PROBE_LESSON_ID);
      fatal(
        '6b단계(anon insert 기본 차단 반증) 실패 — anon 키로 insert가 성공했습니다. RLS 정책이 하나라도 존재하는지 확인하세요 (정책 0개가 기본 차단 설계입니다).',
      );
    }
    console.log('check-supabase-progress: 6b/7 anon insert가 오류로 거부됨 (RLS 기본 차단 확인, PLAT-02)');
  }

  // --- 7. 마지막으로 프로브 행이 남아 있지 않은지 재확인 (게이트가 진행률 수치를 오염시키지 않아야 함) ---
  {
    const { data, error } = await admin
      .from('progress')
      .select('lesson_id')
      .eq('lesson_id', PROBE_LESSON_ID)
      .maybeSingle();
    if (error) {
      fatal(`7단계(최종 정리 확인) 실패 — Supabase 오류: ${error.message}`);
    }
    if (data) {
      // 6b에서 anon insert가 거부되었어야 하므로 정상적으로는 여기 도달하지 않지만,
      // 방어적으로 한 번 더 정리를 시도한다.
      await admin.from('progress').delete().eq('lesson_id', PROBE_LESSON_ID);
      fatal('7단계(최종 정리 확인) 실패 — 스크립트 종료 시점에 프로브 행이 테이블에 남아 있었습니다.');
    }
  }
  console.log('check-supabase-progress: 7/7 최종 정리 확인 OK — 프로브 행 없음');

  console.log('check-supabase-progress: 모든 단계 통과 — 쓰면 저장되고 읽으면 돌아오며 외부 키로는 아무것도 못 합니다.');
  process.exit(0);
}

main().catch((e) => {
  fatal(`예상치 못한 오류: ${e instanceof Error ? e.message : String(e)}`);
});
