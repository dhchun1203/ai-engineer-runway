-- quiz_attempt: 객관식 퀴즈 풀이 기록(2026-10-15). 문항마다 "마지막으로 맞혔는지"와 푼 날짜,
-- 누적 시도 수를 계정별로 남긴다. 베이스캠프 복습 퀴즈와 /review 레슨 객관식이 함께 쓰고,
-- 화면은 이 기록으로 "지난번 맞힘/틀림", STEP별 진행 상황, "안 푼 문제만 보기"를 그린다.
-- 고른 보기 자체는 저장하지 않는다(다시 열었을 때 답이 미리 보이지 않게).
--
-- 키(quiz_key)는 오답 노트(quiz_mistake)와 같다: bc:<STEP>:<번호>, rv:<레슨>:<자가진단>:<번호>.
-- 오답 노트와 따로 두는 이유: 오답 노트는 맞히면 행이 지워지지만, 풀이 기록은 남아야 한다.
--
-- 격리: 다른 사용자 데이터 테이블과 같은 2겹 방어(RLS own_rows + 앱 계층 user_id 필터).

create table if not exists public.quiz_attempt (
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_key text not null check (char_length(quiz_key) between 3 and 300),
  last_correct boolean not null,
  attempts integer not null default 1 check (attempts >= 1),
  correct_count integer not null default 0 check (correct_count >= 0),
  last_answered_at timestamptz not null default now(),
  primary key (user_id, quiz_key)
);

alter table public.quiz_attempt enable row level security;

drop policy if exists own_rows on public.quiz_attempt;
create policy own_rows on public.quiz_attempt for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
