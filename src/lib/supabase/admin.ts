import 'server-only';

// 이 앱에서 Supabase Postgres에 접근하는 유일한 클라이언트다 — service_role 키로
// 초기화되어 RLS를 완전히 우회한다. D-17(공유 시크릿 쿠키 방식)에 따라 Supabase Auth
// 세션을 쓰지 않으므로 persistSession/autoRefreshToken은 모두 비활성화한다.
// 이 파일 외의 어떤 곳에서도 createClient를 호출하지 않는다.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    'src/lib/supabase/admin.ts: SUPABASE_URL 환경 변수가 비어 있습니다 — .env.local(로컬) 또는 Vercel 프로젝트 환경 변수(배포)에 값을 설정하세요. NEXT_PUBLIC_ 접두사를 붙이지 않습니다.',
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    'src/lib/supabase/admin.ts: SUPABASE_SERVICE_ROLE_KEY 환경 변수가 비어 있습니다 — .env.local(로컬) 또는 Vercel 프로젝트 환경 변수(배포)에 값을 설정하세요. NEXT_PUBLIC_ 접두사를 붙이지 않습니다.',
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
