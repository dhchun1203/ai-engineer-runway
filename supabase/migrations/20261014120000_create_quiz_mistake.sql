-- quiz_mistake: 객관식 퀴즈 오답 노트(2026-10-14). 베이스캠프 복습 퀴즈(/basecamp/quiz)와
-- /review의 레슨 객관식에서 틀린 문제를 계정별로 모은다. 오답 노트 페이지
-- (/review/mistakes)가 이 행들을 다시 풀게 보여 준다.
--
-- 키(quiz_key): 어떤 퀴즈의 몇 번 문항인지를 글자로 적는다.
--   bc:<STEP id>:<문항 번호>               예) bc:step5:3   (basecamp-review.ts)
--   rv:<레슨 slug>:<자가진단 번호>:<문항 번호> 예) rv:1-3-python-variables-and-types:0:2
-- 앱이 키를 저장 전에 실제 문항으로 풀어 보고, 풀리지 않는 키는 거절한다.
--
-- 규칙: 틀리면 행을 만들거나 wrong_count를 올리고 correct_streak를 0으로. 오답 노트에 있는
-- 문제를 맞히면 correct_streak를 올리고, 2번 연속이면 행을 지운다(오답 노트에서 빠짐).
--
-- 격리: 다른 사용자 데이터 테이블과 같은 2겹 방어. RLS를 켜고 auth.uid() = user_id 정책을
-- authenticated 역할에만 건다(20260915120000_rls_user_isolation.sql과 같은 own_rows).
-- 앱 계층(quiz-mistake-store.ts)도 모든 쿼리를 현재 user_id로 거른다.

create table if not exists public.quiz_mistake (
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_key text not null check (char_length(quiz_key) between 3 and 300),
  wrong_count integer not null default 1 check (wrong_count >= 1),
  correct_streak integer not null default 0 check (correct_streak >= 0),
  last_wrong_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, quiz_key)
);

alter table public.quiz_mistake enable row level security;

drop policy if exists own_rows on public.quiz_mistake;
create policy own_rows on public.quiz_mistake for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
