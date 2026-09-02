-- lesson_bookmark: 레슨 안 "소제목(h2) 단위" 북마크를 저장한다. lesson_note와 달리 한
-- 레슨에 여러 개가 있을 수 있으므로 (lesson_id, section_index) 복합 primary key다.
-- lesson_id는 Velite가 생성하는 lesson.slug를 그대로 참조한다(진실 원천은 계속 Velite).
--
-- section_index: #lesson-article 안 h2의 0부터 시작하는 순서. section_title: 그 h2의
-- 텍스트. 둘 다 저장하는 이유가 핵심이다 — 레슨 본문을 개정해 h2 순서가 바뀌어도
-- section_title로 되찾을 수 있게 하는 폴백이다(본문 수정 시 북마크 위치가 어긋나지
-- 않게 하려는 요구사항). 되돌아갈 때 section-scroll-restore.tsx가 제목 일치를 먼저
-- 시도하고, 없으면 index로 착지한다.
--
-- 중요: lesson_note와 동일하게 RLS를 켜되 정책(create policy)은 0개다 — 의도된 기본
-- 차단(default-deny). 이 앱은 Supabase Auth를 쓰지 않고 서버 전용 service_role 키
-- (src/lib/supabase/admin.ts)로만 접근하며, service_role은 RLS를 우회하므로 정책 0개와
-- 무관하게 동작한다. `using (true)` 같은 "편의 정책"을 추가해 "고치지" 말 것 — 그 순간
-- 이 테이블은 인터넷에 공개된다(lesson_note 마이그레이션 주석과 같은 계약).
--
-- 이 마이그레이션 파일은 검토용 사본이다. 라이브 테이블은 Supabase SQL Editor에서 이
-- 파일과 동일한 DDL을 1회 실행해 생성한다(RLS 켜짐 / 정책 0개 / 0행 상태를 확인할 것).

create table if not exists public.lesson_bookmark (
  lesson_id text not null,
  section_index integer not null,
  section_title text not null default '',
  created_at timestamptz not null default now(),
  primary key (lesson_id, section_index)
);

alter table public.lesson_bookmark enable row level security;
