import 'server-only';

// 현재 로그인한 Supabase 사용자 id를 얻는 단일 지점 — 다중 사용자 전환 이후 모든
// 데이터 스토어(*-store.ts)가 "누구의 데이터인가"를 이 함수 하나로 판정한다.
//
// React cache로 감싸 요청당 1회만 auth 서버에 getUser()를 왕복한다 — 한 페이지가
// 진도·메모·북마크를 함께 읽어도 세션 검증은 한 번뿐이다. getUser()는 토큰을 Auth
// 서버로 검증하므로 위조 쿠키로는 통과할 수 없다.
//
// 격리 원칙(2겹): 데이터 접근은 로그인 본인 자격(supabase/db.ts의 getUserDb, RLS 적용)으로
// 하고 — DB의 auth.uid()=user_id 정책이 본인 행 외 접근을 차단한다 — 그 위에 모든 쿼리를
// 이 user_id로도 필터/삽입해 애플리케이션 계층에서 한 번 더 강제한다. 이 파일이 그 user_id의
// 유일한 출처다. (service_role 우회 접근은 가입 승인 등 관리 작업 전용으로만 남긴다 — admin.ts)

import { cache } from 'react';
import { createSupabaseServerClient } from './supabase/server';

// 우리가 실제로 쓰는 클레임만 추린 최소 타입. getClaims는 서명 검증된 JWT의 페이로드를
// 돌려주며 sub(사용자 id)·email이 그중 일부다.
type SessionClaims = { sub?: string; email?: string | null };

/**
 * 현재 세션의 서명 검증된 JWT 클레임. 비로그인/검증 실패면 null. 요청 단위로 캐시된다.
 *
 * getUser()가 아니라 getClaims()를 쓴다 — 이 프로젝트는 비대칭 서명 키(ES256/JWKS)를
 * 쓰므로 getClaims는 인증 서버로 왕복하지 않고 JWT 서명을 로컬에서 암호학적으로 검증한다
 * (JWKS 공개키는 서버 프로세스에 캐시된다). 서명이 유효하지 않은 위조 쿠키는 통과하지
 * 못하므로 getUser와 같은 위조 방지력을 유지하면서 페이지 이동마다 붙던 인증 서버 왕복
 * 지연(약 50~150ms)을 없앤다.
 *
 * 트레이드오프: 서버에서 계정이 차단/삭제되어도 이미 발급된 토큰은 만료(약 1시간) 전까지
 * 유효로 판정된다. 이 앱에서는 콘텐츠가 공개(D-18)이고, 승인제 가입([[approval-gated-signup]])
 * 상 차단 계정은 애초에 토큰을 발급받지 못하므로 수용 가능한 창이다.
 *
 * 게이트(auth.ts)·소유자 판정(owner.ts)·데이터 스토어가 모두 이 하나를 재사용해, 한 페이지가
 * 진도·메모·소유자 여부를 함께 봐도 검증은 요청당 단 한 번이다.
 */
export const getSessionClaims = cache(async (): Promise<SessionClaims | null> => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims as SessionClaims | undefined;
    if (error || !claims?.sub) return null;
    return claims;
  } catch {
    // 검증 중 오류는 "비로그인"으로 강등한다 — 실패를 통과로 오인하지 않는다.
    return null;
  }
});

/** 로그인한 사용자 id. 비로그인/검증 실패면 null. 요청 단위로 캐시된다. */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const claims = await getSessionClaims();
  const sub = claims?.sub;
  return typeof sub === 'string' ? sub : null;
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
