-- inbox_item: 곁가지 질문 전용 전역 리스트 (quick 260901-x62, "궁금한 것
-- 인박스" — Matuschak writing inbox + 클로드 연결).
--
-- lesson_review·lesson_note와 같은 테이블이 아니라 lesson_id 없이도 존재할 수
-- 있는 전역 행 컬렉션이다 — 질문은 특정 레슨에 매이지 않고 공부하다 떠오른
-- 곁가지를 담는 자리라, lesson_id를 nullable로 두고 primary key는 자동 생성
-- uuid로 둔다(lesson_review처럼 lesson_id를 PK로 못 쓴다 — 레슨 하나에 질문이
-- 여러 개일 수 있다).
--
-- 중요: 아래에서 RLS를 켜지만 정책(create policy)은 하나도 만들지 않는다.
-- 버그가 아니라 의도된 기본 차단(default-deny) 설계다 — lesson_review·
-- lesson_note와 동일. 이 앱은 D-17(공유 시크릿 쿠키)에 따라 Supabase Auth를
-- 쓰지 않고, 서버 전용 service_role 키(src/lib/supabase/admin.ts)로만
-- 접근한다. service_role은 RLS를 우회하므로 정책 0개와 무관하게 정상
-- 동작한다. "anon 키로 조회하면 빈 배열"은 고장이 아니라 설계가 동작하는
-- 증거다. `using (true)` 같은 편의 정책을 추가해 "고치지" 말 것.
--
-- 이 마이그레이션은 라이브 Supabase에 이미 적용된 테이블과 정확히 일치하는
-- idempotent 기록용 파일이다(오케스트레이터가 라이브에 먼저 생성) — 이
-- 파일을 다시 실행해도 create table if not exists이므로 안전하다.

create table if not exists public.inbox_item (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  lesson_id text,
  created_at timestamptz default now(),
  done boolean default false
);

alter table public.inbox_item enable row level security;
