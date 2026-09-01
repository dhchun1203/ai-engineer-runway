-- lesson_review.missed_q: 약한 문항 인덱스 배열(quick 260901-w04, 설계는
-- .planning/research/edu-sites/round2-h-review-design.md V2절). /review 세션의
-- O(맞음)·△(맞았지만 불안)·X(틀림) 판정 중 △·X가 이 배열에 문항 인덱스를 남기고,
-- O가 그 인덱스를 뺀다 — src/lib/review-store.ts의 recordReviewJudgment가 유일한
-- 쓰기 경로다.
--
-- 라이브 Supabase에는 오케스트레이터가 이미 이 컬럼을 적용했다 — 이 파일은
-- idempotent add-column으로 저장소 이력만 채운다(재실행해도 안전).
--
-- 부패 수용: missed_q 값은 레슨의 selfCheck 배열 인덱스(0/1, 레슨당 정확히
-- 2문항 — velite build가 강제)를 가리킨다. 콘텐츠 편집으로 문항 순서가 바뀌면
-- 인덱스가 다른 문항을 가리킬 수 있으나, 문항 수가 고정 2개라 실무상 드물다.
-- 텍스트 해시를 키로 쓰는 대안은 문항 문구를 한 글자만 고쳐도 매칭이 깨지므로
-- (더 자주 부패) 기각했다 — 인덱스가 상대적으로 안정적이다.
--
-- create_lesson_review.sql과 같은 default-deny 톤: RLS는 그 마이그레이션에서
-- 이미 켜졌고, 정책(create policy)은 여전히 0개다. 서버 전용 service_role 키
-- (src/lib/supabase/admin.ts)만 RLS를 우회해 접근한다. `using (true)` 같은
-- 편의 정책을 추가해 "고치지" 말 것.

alter table public.lesson_review
  add column if not exists missed_q int[] not null default '{}';
