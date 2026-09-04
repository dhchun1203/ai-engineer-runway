-- book_bookmark: "책으로 읽기(/book/[step])"의 책갈피를 저장한다. 스텝마다 딱 한
-- 개(책에 끼운 책갈피 하나)라 step_id가 primary key다 — lesson_bookmark처럼 여러
-- 개가 아니라, 한 행을 upsert로 갈아 끼운다.
--
-- 저장 값: chapter_slug(그 자리가 속한 챕터=레슨 슬러그) + within_offset(챕터 top
-- 으로부터의 픽셀 오프셋) + scroll_y(절대 스크롤, 챕터를 못 찾을 때의 폴백). 챕터에
-- 앵커하는 이유는 본문 개정으로 앞 챕터 길이가 바뀌어도 대략 그 자리를 되찾기
-- 위함이다(book-bookmark.tsx가 되돌아갈 때 챕터를 먼저 찾고, 없으면 scroll_y로 착지).
--
-- 기기 간 동기화가 목적이다(quick 260904-a1o 후속): 원래 이 책갈피는 기기별
-- localStorage였는데, 아이패드에서 꽂은 걸 데스크톱에서도 이어 보려고 서버로 옮겼다.
-- 이 앱은 단일 소유자 데이터라 user_id 없이 step_id만으로 유일하다(lesson_bookmark과
-- 동일한 단일 사용자 계약).
--
-- 중요: lesson_bookmark/lesson_note와 동일하게 RLS를 켜되 정책(create policy)은
-- 0개다 — 의도된 기본 차단(default-deny). 이 앱은 서버 전용 service_role 키
-- (src/lib/supabase/admin.ts)로만 접근하며 service_role은 RLS를 우회하므로 정책 0개와
-- 무관하게 동작한다. `using (true)` 같은 "편의 정책"을 추가해 "고치지" 말 것 — 그 순간
-- 이 테이블은 인터넷에 공개된다.
--
-- 이 마이그레이션 파일은 검토용 사본이다. 라이브 테이블은 Supabase SQL Editor에서 이
-- 파일과 동일한 DDL을 1회 실행해 생성한다(RLS 켜짐 / 정책 0개 / 0행 상태를 확인할 것).

create table if not exists public.book_bookmark (
  step_id smallint primary key check (step_id between 1 and 3),
  chapter_slug text,
  within_offset integer not null default 0,
  scroll_y integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.book_bookmark enable row level security;
