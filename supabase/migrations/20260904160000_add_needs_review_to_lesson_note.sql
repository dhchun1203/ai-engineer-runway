-- lesson_note.needs_review: "이 레슨은 더 공부해야 함"을 사용자가 직접 표시하는 플래그.
-- 완료 여부(progress 테이블)와 무관하다 — 완료하지 않은 레슨도 표시할 수 있어야 하고,
-- progress는 "행 존재 = 완료"라 이 상태를 담을 수 없다. 대신 til과 같은 방식으로
-- lesson_note의 한 행(기존 lesson_id primary key)을 공유하는 컬럼으로 둔다 —
-- setLessonNeedsReview는 needs_review만 upsert하고 body/til에는 손대지 않는다(WR-01).
--
-- 이 마이그레이션은 검토용 사본이다 — 라이브 테이블에는 관리 API로 이미 적용했고
-- (2026-09-04, `needs_review boolean not null default false`), 이 파일을 SQL Editor에
-- 다시 실행할 필요는 없다. `add column if not exists`로 멱등하게 작성해 두어, 혹시
-- 다시 실행하더라도 안전하다.

alter table public.lesson_note
  add column if not exists needs_review boolean not null default false;
