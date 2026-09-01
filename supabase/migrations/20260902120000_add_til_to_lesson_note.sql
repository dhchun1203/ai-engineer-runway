-- lesson_note.til: 완료 흐름의 "오늘 배운 것 한 줄?"(코넬 큐) 입력을 담는 별도 컬럼.
-- 기존 body(자유 메모)와는 완전히 분리된 컬럼이다 — saveLessonTil은 til만 upsert하고
-- body에는 손대지 않는다(WR-01, T-0rz-04). 한 slug당 한 행(기존 lesson_id primary key)을
-- 계속 공유하므로 새 테이블이 아니라 컬럼 추가다.
--
-- 이 마이그레이션은 검토용 사본이다 — 라이브 테이블은 오케스트레이터가 관리 API로
-- 이미 적용했고(2026-09-02, `til text not null default ''`), 이 파일을 SQL Editor에
-- 다시 실행할 필요는 없다. `add column if not exists`로 멱등하게 작성해 두어, 혹시
-- 다시 실행하더라도 안전하다.

alter table public.lesson_note
  add column if not exists til text not null default '';
