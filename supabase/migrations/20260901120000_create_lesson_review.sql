-- lesson_review: 완료한 레슨의 간격 복습 상태 (quick 260901-etq, 설계는
-- .planning/research/edu-sites/round2-h-review-design.md).
--
-- progress 테이블에 컬럼을 얹지 않고 별도 테이블인 이유(F2): 재완료 upsert가
-- completed_at을 덮어쓰고 완료 취소가 행을 삭제하므로, 복습 상태를 progress에
-- 두면 이력 소실 경로가 둘이나 된다. 완료와 복습은 수명이 다르다 — 완료를
-- 취소해도 복습 이력(졸업)은 남기고, 만기 계산은 progress 현재 행과 join해
-- 취소된 레슨을 자연히 제외한다.
--
-- 중요: 아래에서 RLS를 켜지만 정책(create policy)은 하나도 만들지 않는다.
-- 버그가 아니라 의도된 기본 차단(default-deny) 설계다 — progress·lesson_note와
-- 동일. 이 앱은 D-17(공유 시크릿 쿠키)에 따라 Supabase Auth를 쓰지 않고,
-- 서버 전용 service_role 키(src/lib/supabase/admin.ts)로만 접근한다.
-- service_role은 RLS를 우회하므로 정책 0개와 무관하게 정상 동작한다.
-- "anon 키로 조회하면 빈 배열"은 고장이 아니라 설계가 동작하는 증거다.
-- `using (true)` 같은 편의 정책을 추가해 "고치지" 말 것.

create table if not exists public.lesson_review (
  lesson_id text primary key,
  -- 복습 사다리 위치. 0=아직 복습 없음(완료 후 1일 만기), 1·2·3… — 3이면 졸업.
  review_count int not null default 0,
  last_reviewed_at timestamptz
);

alter table public.lesson_review enable row level security;
