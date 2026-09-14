-- 관리자 승인제 가입: 가입 요청 1건당 한 줄. 가입 시 유저는 auth.users에 "차단(ban)"
-- 상태로 만들어지고 여기에 pending으로 기록된다. 소유자가 /admin에서 승인하면 차단이
-- 풀리고 status가 approved로, 거절하면 rejected로 바뀐다. 로그인 실패 문구 분기(대기중/
-- 거절됨)와 관리자 대기 목록이 이 테이블을 읽는다.
--
-- 접근: service_role(src/lib/supabase/admin.ts)만 읽고 쓴다. RLS를 켠 채 정책을 하나도
-- 두지 않으면 anon/authenticated 롤은 전부 차단되고 service_role만 통과한다(RLS 우회).
-- 이 앱은 다른 앱과 같은 Supabase 프로젝트를 공유하므로 공개 정책을 절대 두지 않는다.

create table if not exists public.access_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- 대기 목록을 생성 시간 순으로 자주 훑으므로 status에 인덱스를 둔다(행 수가 적어 큰 이득은
-- 아니지만 규칙을 지킨다).
create index if not exists access_requests_status_idx on public.access_requests (status);

alter table public.access_requests enable row level security;
