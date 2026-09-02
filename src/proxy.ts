// Next.js 16 proxy(구 middleware) — Supabase Auth 세션 리프레시 전용.
// node_modules/next/dist/docs .../file-conventions/proxy.md: v16에서 middleware는
// proxy로 이름이 바뀌었고 export 이름도 proxy다(기본 Node 런타임).
//
// 하는 일은 딱 하나: 만료가 가까운 액세스 토큰을 리프레시 토큰으로 갱신하고 그 결과를
// 응답 쿠키에 실어 보낸다. 이 갱신을 여기서 하지 않으면(Server Component는 쿠키를 쓸 수
// 없다) 리프레시 토큰 회전이 켜진 환경에서 약 1시간 뒤 로그아웃되는 문제가 생긴다.
//
// 콘텐츠 공개 원칙(D-18) 보존: 여기서 리다이렉트·차단을 절대 하지 않는다 — 로그인
// 여부와 무관하게 모든 요청을 그대로 통과시킨다. 실제 접근 제어는 페이지·Server Action
// ·Route Handler 내부의 hasUnlockCookie() 재검증이 담당한다. 비로그인 방문자는 세션이
// 없어 getUser가 네트워크 왕복 없이 즉시 null을 반환하므로 공개 페이지 속도에 영향이 없다.

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  // env가 없으면(예: 프리뷰 초기 설정 누락) 인증 리프레시만 건너뛰고 요청은 통과시킨다 —
  // 공개 콘텐츠가 500으로 막히지 않게 한다.
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() 호출이 만료 임박 토큰의 리프레시를 유발하고, 그 새 쿠키가 위 setAll로
  // 응답에 실린다. 반환값 자체는 여기서 쓰지 않는다(차단하지 않으므로).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // 정적 자산·이미지 최적화·favicon·흔한 정적 파일 확장자는 제외한다. 나머지(페이지·
  // API·Server Action POST)에서는 세션 리프레시가 돌게 둔다.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)',
  ],
};
