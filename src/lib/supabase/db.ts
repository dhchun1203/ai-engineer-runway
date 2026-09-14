import 'server-only';

// 사용자 데이터 테이블(진도·메모·북마크·복습·받은함·TIL)을 "로그인한 본인 자격"으로
// 읽고 쓰는 클라이언트. service_role(admin.ts)과 달리 RLS가 적용된다 — DB에 걸린
// auth.uid() = user_id 정책(20260915120000_rls_user_isolation.sql)이 사용자별 격리를
// DB 차원에서 강제하므로, 앱 계층이 .eq('user_id')를 실수로 빠뜨려도 본인 행 외에는
// 반환/수정되지 않는다(2겹 방어). 각 store는 계속 .eq('user_id', userId)로도 필터한다.
//
// 내부적으로는 auth 세션 판정에 쓰는 것과 같은 쿠키 인지형 서버 클라이언트다
// (createSupabaseServerClient). 유효한 로그인 세션의 액세스 토큰이 붙어 authenticated
// 역할로 쿼리가 실행된다. 세션이 없으면 anon 역할이라 정책상 아무 행도 못 보는데, 각
// store는 그전에 getCurrentUserId()가 null이면 빈 결과로 단락(short-circuit)시키므로 이
// 경로로는 애초에 쿼리가 나가지 않는다.
//
// React cache로 요청당 한 번만 만든다(한 페이지가 진도·메모·북마크를 함께 읽어도
// 클라이언트는 하나).

import { cache } from 'react';
import { createSupabaseServerClient } from './server';

export const getUserDb = cache(async () => createSupabaseServerClient());
