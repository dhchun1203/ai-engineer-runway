import 'server-only';

// Supabase Auth(이메일+비밀번호 로그인) 전용 서버 클라이언트. 진도 데이터에 접근하는
// service_role 클라이언트(admin.ts)와는 별개다 — 이쪽은 "로그인한 사람이 누구인가"만
// 판정하고(auth.getUser), 데이터 테이블은 건드리지 않는다.
//
// 왜 anon 키인가: Supabase Auth 세션 쿠키는 anon(publishable) 키로 발급·검증한다.
// service_role로 signInWithPassword를 하면 안 된다(관리자 키를 인증 흐름에 노출).
// SUPABASE_ANON_KEY는 서버 전용 env로만 읽는다 — NEXT_PUBLIC_ 접두사를 붙이지 않는다
// (게이트 G3: 클라이언트 노출 금지). 브라우저 클라이언트는 만들지 않는다 — 로그인은
// 전부 Server Action/Server Component/proxy에서만 일어난다.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'src/lib/supabase/server.ts: SUPABASE_URL 환경 변수가 비어 있습니다 — .env.local(로컬) 또는 Vercel 프로젝트 환경 변수(배포)에 값을 설정하세요.',
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'src/lib/supabase/server.ts: SUPABASE_ANON_KEY 환경 변수가 비어 있습니다 — .env.local(로컬) 또는 Vercel 프로젝트 환경 변수(배포)에 값을 설정하세요. NEXT_PUBLIC_ 접두사를 붙이지 않습니다.',
  );
}

// "로그인 정보 저장" 여부를 기록하는 동반 쿠키. '0'이면 세션 전용(브라우저 닫으면 만료),
// 그 외/부재면 지속(재시작해도 유지). proxy.ts도 같은 이름을 읽어 리프레시 시 지속성을
// 보존한다(문자열 상수를 공유하지 않고 각자 선언 — proxy는 server.ts를 import하지 않는다).
export const PERSIST_COOKIE = 'sb-persist';

// Server Component/Server Action/Route Handler에서 쓰는 쿠키 인지형 클라이언트.
// setAll은 Server Component 렌더 중에는 실패할 수 있다(쿠키 쓰기 불가) — 그 경우는
// proxy.ts가 매 요청마다 세션을 리프레시하므로 무시해도 된다(@supabase/ssr 표준 패턴).
//
// persist: 명시하면 그 값을, 없으면 sb-persist 쿠키로 판단(기본 지속). false면 인증
// 쿠키에서 maxAge/expires를 떼어 세션 쿠키로 만든다("로그인 정보 저장" 해제).
export async function createSupabaseServerClient(opts?: { persist?: boolean }) {
  const cookieStore = await cookies();

  const persist =
    typeof opts?.persist === 'boolean'
      ? opts.persist
      : cookieStore.get(PERSIST_COOKIE)?.value !== '0';

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            if (persist) {
              cookieStore.set(name, value, options);
            } else {
              const sessionOptions = { ...(options ?? {}) };
              delete sessionOptions.maxAge;
              delete sessionOptions.expires;
              cookieStore.set(name, value, sessionOptions);
            }
          }
        } catch {
          // Server Component 렌더 컨텍스트 — 쿠키 쓰기가 막혀 있다. proxy가 대신 리프레시한다.
        }
      },
    },
  });
}
