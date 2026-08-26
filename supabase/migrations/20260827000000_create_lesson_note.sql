-- lesson_note: 레슨당 메모 1개를 저장하는 단일 테이블. lesson_id는 Velite가 생성하는
-- lesson.slug 값을 그대로 참조하며(커리큘럼 구조의 진실 원천은 계속 Velite 매니페스트다),
-- 한 slug당 최대 한 행만 존재한다(primary key).
--
-- 중요: 아래에서 이 테이블에 RLS를 켜지만 정책(create policy)은 하나도 만들지 않는다.
-- 이것은 버그가 아니라 의도된 기본 차단(default-deny) 설계다 — Supabase에서 RLS가
-- 켜져 있고 정책이 0개면 anon/authenticated 역할의 모든 접근(SELECT 포함)이 거부된다.
-- 이 앱은 D-17(공유 시크릿 쿠키 방식)에 따라 Supabase Auth를 쓰지 않고, 서버 전용
-- service_role 키(src/lib/supabase/admin.ts의 supabaseAdmin)로만 이 테이블에 접근한다.
-- service_role은 RLS를 완전히 우회하므로 정책 0개와 무관하게 정상 동작한다.
--
-- 미래의 나 자신에게: "anon 키로 조회했더니 빈 배열이 나온다"는 고장이 아니라 이
-- 설계가 의도대로 동작하는 증거다. `using (true)` 같은 "편의 정책"을 추가해서
-- "고치지" 말 것 — 그 순간 이 테이블은 인터넷에 공개된다.
--
-- 이 마이그레이션은 검토용 사본이다 — 라이브 테이블은 오케스트레이터가 관리 API로
-- 이미 생성·검증했고(2026-08-27, RLS 켜짐/정책 0개/0행), 이 파일을 SQL Editor에
-- 다시 실행할 필요는 없다.

create table if not exists public.lesson_note (
  lesson_id text primary key,
  body text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.lesson_note enable row level security;
