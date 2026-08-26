#!/usr/bin/env node
// 호스티드 Supabase DB에 실제 왕복을 걸어 cloze_answer 스키마 적용 + RLS 기본
// 차단 + answer_hash 갱신 + status check 제약을 동시에 반증하는 게이트.
// check-supabase-progress.mjs를 그대로 복제한 형태다.
//
// 실행: node --env-file=.env.local scripts/check-supabase-cloze.mjs
//
// src/lib/supabase/admin.ts를 import하지 않는다 — 'server-only' 마커가 붙은
// 모듈은 Next 번들러 밖에서 로드되지 않는다. 여기서는 @supabase/supabase-js의
// createClient를 스크립트 안에서 직접 호출한다.
//
// 프로브 blank_id는 실제 레슨과 겹치지 않는 값을 쓴다(__gate_probe__ 접두사,
// 실제 레슨 slug는 "-"로 시작하지 않으므로 "#" 뒤에 gate probe 마커를 붙여도
// 실제 blank_id 패턴과 충돌하지 않는다).
//
// 어떤 출력에도 키·URL 전문을 찍지 않는다.

import { createClient } from '@supabase/supabase-js';

const PROBE_BLANK_ID = '__gate_probe__#1';
const PROBE_LESSON_ID = '__gate_probe_lesson__';
const PROBE_HASH_1 = '0000000000000001';
const PROBE_HASH_2 = '0000000000000002';

function fatal(message) {
  console.error(`check-supabase-cloze: ${message}`);
  process.exit(1);
}

// --- 필수 환경 변수 부재 시 즉시 오류 종료 (기본값으로 넘어가지 않는다) ---

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  fatal(
    'SUPABASE_URL 환경 변수가 비어 있습니다. .env.local에 값을 채우고 `node --env-file=.env.local scripts/check-supabase-cloze.mjs`로 다시 실행하세요.',
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
    const { error } = await admin.from('cloze_answer').select('blank_id').limit(1);
    if (error) {
      fatal(
        `1단계(스키마 확인) 실패 — cloze_answer 테이블에 접근할 수 없습니다. 마이그레이션이 적용되지 않았습니다. supabase/migrations/20260826090000_create_cloze.sql을 SQL 에디터에서 실행하세요. Supabase 오류: ${error.message}`,
      );
    }
  }
  console.log('check-supabase-cloze: 1/8 스키마 확인 OK (cloze_answer 테이블 select 성공)');

  // --- 2. 프로브 행 upsert ---
  {
    const { error } = await admin.from('cloze_answer').upsert({
      blank_id: PROBE_BLANK_ID,
      lesson_id: PROBE_LESSON_ID,
      answer_hash: PROBE_HASH_1,
      status: 'correct',
    });
    if (error) {
      fatal(`2단계(최초 upsert) 실패 — Supabase 오류: ${error.message}`);
    }
  }
  console.log('check-supabase-cloze: 2/8 최초 upsert OK');

  // --- 3. 다시 select해 존재 확인 ---
  {
    const { data, error } = await admin
      .from('cloze_answer')
      .select('blank_id, lesson_id, answer_hash, status')
      .eq('blank_id', PROBE_BLANK_ID)
      .maybeSingle();
    if (error) {
      fatal(`3단계(존재 확인 select) 실패 — Supabase 오류: ${error.message}`);
    }
    if (!data) {
      fatal('3단계(존재 확인 select) 실패 — upsert한 프로브 행이 조회되지 않습니다.');
    }
    if (data.answer_hash !== PROBE_HASH_1 || data.status !== 'correct') {
      fatal(
        `3단계(존재 확인 select) 실패 — 저장된 값이 다릅니다 (answer_hash=${data.answer_hash}, status=${data.status}).`,
      );
    }
  }
  console.log('check-supabase-cloze: 3/8 존재 확인 OK');

  // --- 4. 같은 blank_id에 다른 answer_hash로 재upsert -> 값 갱신 확인 (DD-7) ---
  {
    const { error } = await admin.from('cloze_answer').upsert({
      blank_id: PROBE_BLANK_ID,
      lesson_id: PROBE_LESSON_ID,
      answer_hash: PROBE_HASH_2,
      status: 'revealed',
    });
    if (error) {
      fatal(`4단계(재upsert) 실패 — Supabase 오류: ${error.message}`);
    }
  }
  {
    const { data, error } = await admin
      .from('cloze_answer')
      .select('answer_hash, status')
      .eq('blank_id', PROBE_BLANK_ID)
      .maybeSingle();
    if (error) {
      fatal(`4단계(재upsert 후 확인 select) 실패 — Supabase 오류: ${error.message}`);
    }
    if (!data) {
      fatal('4단계(재upsert 후 확인 select) 실패 — 프로브 행이 사라졌습니다.');
    }
    if (data.answer_hash !== PROBE_HASH_2 || data.status !== 'revealed') {
      fatal(
        `4단계(answer_hash 갱신 확인, DD-7) 실패 — 재upsert 후에도 값이 갱신되지 않았습니다 (answer_hash=${data.answer_hash}, status=${data.status}).`,
      );
    }
  }
  console.log('check-supabase-cloze: 4/8 재upsert 시 answer_hash/status 갱신 확인 OK (DD-7)');

  // --- 5. status에 허용되지 않은 값을 넣으면 check 제약으로 거부됨 확인 ---
  {
    const { error } = await admin.from('cloze_answer').upsert({
      blank_id: PROBE_BLANK_ID,
      lesson_id: PROBE_LESSON_ID,
      answer_hash: PROBE_HASH_2,
      status: 'incorrect', // 허용되지 않은 값 — DB의 status in ('correct','revealed') 제약이 거부해야 한다
    });
    if (!error) {
      fatal(
        '5단계(status check 제약 반증) 실패 — 허용되지 않은 status 값("incorrect")이 upsert에 성공했습니다. 마이그레이션의 check 제약을 확인하세요.',
      );
    }
  }
  console.log('check-supabase-cloze: 5/8 허용되지 않은 status 값 거부 확인 OK');

  // --- 6. delete 후 부재 확인 ---
  {
    const { error } = await admin.from('cloze_answer').delete().eq('blank_id', PROBE_BLANK_ID);
    if (error) {
      fatal(`6단계(delete) 실패 — Supabase 오류: ${error.message}`);
    }
  }
  {
    const { data, error } = await admin
      .from('cloze_answer')
      .select('blank_id')
      .eq('blank_id', PROBE_BLANK_ID)
      .maybeSingle();
    if (error) {
      fatal(`6단계(delete 후 확인 select) 실패 — Supabase 오류: ${error.message}`);
    }
    if (data) {
      fatal('6단계(delete 후 확인 select) 실패 — delete했는데도 프로브 행이 여전히 존재합니다.');
    }
  }
  console.log('check-supabase-cloze: 6/8 delete 후 부재 확인 OK');

  // --- 7. anon 키 default-deny 반증 ---
  if (!SUPABASE_ANON_KEY) {
    console.log('check-supabase-cloze: 7/8 skipped — SUPABASE_ANON_KEY가 설정되지 않음');
  } else {
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: anonSelectData, error: anonSelectError } = await anon
      .from('cloze_answer')
      .select('blank_id');
    if (anonSelectError) {
      console.log('check-supabase-cloze: 7a/8 anon select가 오류로 거부됨 (RLS 기본 차단 확인)');
    } else if (Array.isArray(anonSelectData) && anonSelectData.length === 0) {
      console.log('check-supabase-cloze: 7a/8 anon select가 0행 반환 (RLS 기본 차단 확인)');
    } else {
      fatal(
        `7a단계(anon select 기본 차단 반증) 실패 — anon 키로 select했더니 ${anonSelectData?.length ?? '알 수 없는 수'}행이 반환되었습니다. RLS 정책이 하나라도 존재하는지 확인하세요.`,
      );
    }

    const { error: anonInsertError } = await anon.from('cloze_answer').insert({
      blank_id: PROBE_BLANK_ID,
      lesson_id: PROBE_LESSON_ID,
      answer_hash: PROBE_HASH_1,
      status: 'correct',
    });
    if (!anonInsertError) {
      await admin.from('cloze_answer').delete().eq('blank_id', PROBE_BLANK_ID);
      fatal(
        '7b단계(anon insert 기본 차단 반증) 실패 — anon 키로 insert가 성공했습니다. RLS 정책이 하나라도 존재하는지 확인하세요(정책 0개가 기본 차단 설계입니다).',
      );
    }
    console.log('check-supabase-cloze: 7b/8 anon insert가 오류로 거부됨 (RLS 기본 차단 확인, T-uig-03)');
  }

  // --- 8. 최종적으로 프로브 행이 남아 있지 않은지 재확인 ---
  {
    const { data, error } = await admin
      .from('cloze_answer')
      .select('blank_id')
      .eq('blank_id', PROBE_BLANK_ID)
      .maybeSingle();
    if (error) {
      fatal(`8단계(최종 정리 확인) 실패 — Supabase 오류: ${error.message}`);
    }
    if (data) {
      await admin.from('cloze_answer').delete().eq('blank_id', PROBE_BLANK_ID);
      fatal('8단계(최종 정리 확인) 실패 — 스크립트 종료 시점에 프로브 행이 테이블에 남아 있었습니다.');
    }
  }
  console.log('check-supabase-cloze: 8/8 최종 정리 확인 OK — 프로브 행 없음');

  console.log(
    'check-supabase-cloze: 모든 단계 통과 — 쓰면 저장되고 읽으면 돌아오며, answer_hash가 바뀌면 값이 갱신되고, 허용되지 않은 status는 거부되며, 외부 키로는 아무것도 못 합니다.',
  );
  process.exit(0);
}

main().catch((e) => {
  fatal(`예상치 못한 오류: ${e instanceof Error ? e.message : String(e)}`);
});
