-- 사용자별 데이터 격리를 DB 차원에서 강제한다(방어선 2겹째).
--
-- 배경: 지금까지 8개 사용자 데이터 테이블(progress/lesson_note/lesson_review/book_bookmark/
-- lesson_bookmark/inbox_item/til_series/til_post)은 service_role(supabaseAdmin)로만 접근하고
-- RLS 정책은 0개였다(기본 차단). 격리는 오직 애플리케이션 계층(*-store.ts가 모든 쿼리를
-- 현재 세션 user_id로 필터)에만 의존했다 — 쿼리 한 곳이라도 실수로 user_id 필터를 빠뜨리면
-- 전 사용자 데이터가 섞일 수 있는 "안전망 한 겹" 구조였다. 1인용일 땐 충분했지만, 실제
-- 다수 학생의 개인 데이터를 담게 되면서 DB 차원의 안전망을 추가한다.
--
-- 이 마이그레이션 이후의 모델(create_progress.sql / add_user_id_multiuser.sql의 기존 주석을
-- 대체한다): 데이터 조회를 "로그인한 본인 자격"(authenticated 역할, @supabase/ssr 쿠키 세션)
-- 으로 바꾼다(코드: src/lib/supabase/db.ts의 getUserDb). 그리고 각 테이블에 auth.uid() = user_id
-- 정책을 건다. 이제 앱 코드가 필터를 빠뜨려도 DB가 본인 행 외에는 절대 반환/수정하지 않는다.
-- 앱 계층의 .eq('user_id', userId) 필터도 그대로 유지해 2겹으로 방어한다(belt and suspenders).
--
-- service_role(admin.ts)은 계속 RLS를 우회한다 — 가입 승인(access_requests의 생성/차단해제)
-- 같은 관리 작업 전용이며, 이 8개 테이블의 사용자 행 읽기/쓰기에는 더 이상 쓰지 않는다.
--
-- anon 역할: 이 정책은 authenticated 역할에만 부여한다. anon(비로그인/publishable 키)은
-- 여전히 정책이 없어 기본 차단된다 — 로그인 세션 없이는 이 테이블을 한 행도 볼 수 없다.

alter table public.progress        enable row level security;
alter table public.lesson_note      enable row level security;
alter table public.lesson_review    enable row level security;
alter table public.book_bookmark    enable row level security;
alter table public.lesson_bookmark  enable row level security;
alter table public.inbox_item       enable row level security;
alter table public.til_series        enable row level security;
alter table public.til_post          enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'progress','lesson_note','lesson_review','book_bookmark',
    'lesson_bookmark','inbox_item','til_series','til_post'
  ]
  loop
    execute format('drop policy if exists own_rows on public.%I', t);
    execute format(
      'create policy own_rows on public.%I for all to authenticated '
      || 'using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
  end loop;
end $$;
