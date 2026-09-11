// Next.js 16 proxy(구 middleware) — Supabase Auth 세션 리프레시 + 전체 로그인 게이트.
// node_modules/next/dist/docs .../file-conventions/proxy.md: v16에서 middleware는
// proxy로 이름이 바뀌었고 export 이름도 proxy다(기본 Node 런타임).
//
// 하는 일 (1) 세션 리프레시: 만료가 가까운 액세스 토큰을 리프레시 토큰으로 갱신하고 그
// 결과를 응답 쿠키에 실어 보낸다. 이 갱신을 여기서 하지 않으면(Server Component는 쿠키를
// 쓸 수 없다) 리프레시 토큰 회전이 켜진 환경에서 약 1시간 뒤 로그아웃되는 문제가 생긴다.
//
// 하는 일 (2) 전체 로그인 게이트(사용자 결정 2026-09-12): 이 사이트는 이제 로그인해야만
// 들어올 수 있다. 예전 "콘텐츠는 공개(D-18)" 방침을 사용자가 명시적으로 뒤집었다. 로그인
// 세션(아무 사용자)도, e2e·폴백용 시크릿 쿠키(runway_unlock)도 없는 요청은 /login으로
// 리다이렉트한다 — auth.ts의 hasUnlockCookie와 같은 "둘 중 하나면 통과" 기준을 여기서도
// 쓴다. 인증 페이지(/login, /signup)와 인증 상태 조회 API(/api/auth), 시크릿 해제 라우트
// (/unlock), 그리고 매니페스트·아이콘 같은 시스템 파일은 게이트에서 제외한다(그래야
// 리다이렉트 루프가 안 나고 PWA 매니페스트도 로드된다).

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { UNLOCK_COOKIE_NAME, isValidUnlockValue } from './lib/unlock-secret';

// 로그인 없이도 접근 가능한 경로. AUTH_PREFIXES는 자신과 그 하위 경로 전부를 연다.
const AUTH_PREFIXES = ['/login', '/signup', '/unlock', '/api/auth'];
const PUBLIC_EXACT = new Set(['/manifest.webmanifest', '/icon', '/robots.txt', '/sitemap.xml']);

function isPublicPath(pathname: string): boolean {
  // 프레임워크 내부(_next: RSC·데이터·dev HMR 소켓 등)는 절대 게이트하지 않는다 —
  // 리다이렉트하면 HMR과 RSC 프리페치가 깨진다.
  if (pathname.startsWith('/_next')) return true;
  if (PUBLIC_EXACT.has(pathname)) return true;
  return AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

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
        // "로그인 정보 저장" 해제 시(sb-persist=0) 리프레시된 인증 쿠키도 세션 쿠키로 유지한다
        // — 여기서 maxAge를 붙이면 세션 전용이 매 이동마다 지속 쿠키로 바뀌어 버린다.
        const persist = request.cookies.get('sb-persist')?.value !== '0';
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          if (persist) {
            response.cookies.set(name, value, options);
          } else {
            const sessionOptions = { ...(options ?? {}) };
            delete sessionOptions.maxAge;
            delete sessionOptions.expires;
            response.cookies.set(name, value, sessionOptions);
          }
        }
      },
    },
  });

  // getUser() 호출이 만료 임박 토큰의 리프레시를 유발하고, 그 새 쿠키가 위 setAll로
  // 응답에 실린다. 이제 반환값(로그인 여부)도 전체 게이트 판정에 쓴다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 전체 로그인 게이트: 공개 경로가 아니고, 로그인 세션도 시크릿 쿠키(e2e·폴백)도 없으면
  // /login으로 보낸다. hasUnlockCookie와 같은 "둘 중 하나면 통과" 기준이다.
  const { pathname } = request.nextUrl;
  if (!user && !isPublicPath(pathname)) {
    const legacyOk = isValidUnlockValue(
      request.cookies.get(UNLOCK_COOKIE_NAME)?.value,
      process.env.UNLOCK_SECRET,
    );
    if (!legacyOk) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  // 정적 자산·이미지 최적화·favicon·흔한 정적 파일 확장자는 제외한다. 나머지(페이지·
  // API·Server Action POST)에서는 세션 리프레시가 돌게 둔다.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)',
  ],
};
