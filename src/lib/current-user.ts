import 'server-only';

// 현재 로그인한 Supabase 사용자 id를 얻는 단일 지점 — 다중 사용자 전환 이후 모든
// 데이터 스토어(*-store.ts)가 "누구의 데이터인가"를 이 함수 하나로 판정한다.
//
// React cache로 감싸 요청당 1회만 auth 서버에 getUser()를 왕복한다 — 한 페이지가
// 진도·메모·북마크를 함께 읽어도 세션 검증은 한 번뿐이다. getUser()는 토큰을 Auth
// 서버로 검증하므로 위조 쿠키로는 통과할 수 없다.
//
// 격리 원칙: 데이터 접근은 여전히 service_role(supabaseAdmin)로 하되, 모든 쿼리를 이
// user_id로 필터/삽입해 사용자별 격리를 애플리케이션 계층에서 강제한다. 이 파일이
// 그 user_id의 유일한 출처다.

import { cache } from 'react';
import { createSupabaseServerClient } from './supabase/server';

/** 로그인한 사용자 id. 비로그인/검증 실패면 null. 요청 단위로 캐시된다. */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    // 세션 검증 중 오류(네트워크 등)는 "비로그인"으로 강등한다 — 실패를 통과로 오인하지 않는다.
    return null;
  }
});

/** 로그인한 사용자 id를 강제로 얻는다 — 쓰기(Server Action)처럼 반드시 로그인이 필요한
 *  경로에서 쓴다. 비로그인이면 던진다(호출부가 실패로 표시). */
export async function requireCurrentUserId(): Promise<string> {
  const uid = await getCurrentUserId();
  if (!uid) {
    throw new Error('current-user: 로그인이 필요합니다.');
  }
  return uid;
}
