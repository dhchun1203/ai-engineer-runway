-- 다중 사용자 전환 — 8개 사용자 데이터 테이블에 user_id를 추가하고, 기존 단일 오너의
-- 데이터를 그 오너 계정으로 백필한 뒤, 사용자별 격리를 위해 기본키/유니크를 재구성한다.
--
-- 배경: 지금까지 이 앱은 1인용이라 모든 데이터가 user_id 없는 단일 전역 세트였고,
-- 서버 전용 service_role(supabaseAdmin)로만 접근했다(RLS on + 정책 0개 = 기본 차단).
-- 이제 누구나 가입해 각자 자기 진도/메모/북마크/복습/받은함/TIL을 갖는다.
--
-- 격리 방식(중요): RLS 정책은 추가하지 않는다. 이 테이블들은 여전히 anon 키에 노출되지
-- 않고(정책 0개 = 기본 차단 유지), 오직 service_role 서버 코드만 접근한다. 사용자별
-- 격리는 애플리케이션 계층이 모든 쿼리를 현재 세션 user_id로 필터해 강제한다
-- (src/lib/current-user.ts + 각 *-store.ts). auth.uid() 기반 RLS 정책은 세션(anon) 클라이언트로
-- 접근할 때만 의미가 있는데, 우리는 service_role로 접근하므로 정책은 inert하다 — 기존
-- 보안 모델(create_progress.sql 주석)을 그대로 유지한다.
--
-- 백필 대상: 현재 auth.users의 유일한 계정(dhchun1203@gmail.com).
-- 새 계정이 생기기 전에 적용해야 백필이 정확하다(적용 시점에 계정이 하나여야 한다).

do $$
declare
  owner_id uuid;
  user_count int;
begin
  select count(*) into user_count from auth.users;
  if user_count <> 1 then
    raise exception '이 마이그레이션은 auth.users에 계정이 정확히 1개일 때만 안전하게 백필할 수 있습니다 (현재 %개). 다중 계정 상태에서는 각 행의 소유자를 자동 판정할 수 없습니다.', user_count;
  end if;
  select id into owner_id from auth.users limit 1;

  -- 1) 컬럼 추가(우선 nullable) → 오너로 백필 → not null.
  alter table public.progress        add column if not exists user_id uuid;
  alter table public.lesson_note      add column if not exists user_id uuid;
  alter table public.lesson_review    add column if not exists user_id uuid;
  alter table public.book_bookmark    add column if not exists user_id uuid;
  alter table public.lesson_bookmark  add column if not exists user_id uuid;
  alter table public.inbox_item       add column if not exists user_id uuid;
  alter table public.til_series        add column if not exists user_id uuid;
  alter table public.til_post          add column if not exists user_id uuid;

  update public.progress       set user_id = owner_id where user_id is null;
  update public.lesson_note     set user_id = owner_id where user_id is null;
  update public.lesson_review   set user_id = owner_id where user_id is null;
  update public.book_bookmark   set user_id = owner_id where user_id is null;
  update public.lesson_bookmark set user_id = owner_id where user_id is null;
  update public.inbox_item      set user_id = owner_id where user_id is null;
  update public.til_series       set user_id = owner_id where user_id is null;
  update public.til_post         set user_id = owner_id where user_id is null;
end $$;

-- 2) not null + auth.users FK(계정 삭제 시 그 사용자 데이터도 삭제).
alter table public.progress       alter column user_id set not null;
alter table public.lesson_note     alter column user_id set not null;
alter table public.lesson_review   alter column user_id set not null;
alter table public.book_bookmark   alter column user_id set not null;
alter table public.lesson_bookmark alter column user_id set not null;
alter table public.inbox_item      alter column user_id set not null;
alter table public.til_series       alter column user_id set not null;
alter table public.til_post         alter column user_id set not null;

alter table public.progress       add constraint progress_user_fk       foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.lesson_note     add constraint lesson_note_user_fk     foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.lesson_review   add constraint lesson_review_user_fk   foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.book_bookmark   add constraint book_bookmark_user_fk   foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.lesson_bookmark add constraint lesson_bookmark_user_fk foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.inbox_item      add constraint inbox_item_user_fk      foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.til_series       add constraint til_series_user_fk       foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.til_post         add constraint til_post_user_fk         foreign key (user_id) references auth.users(id) on delete cascade;

-- 3) 기본키를 사용자별로 재구성 — 같은 lesson_id/step_id를 여러 사용자가 각자 가질 수 있어야 한다.
alter table public.progress       drop constraint progress_pkey;
alter table public.progress       add  constraint progress_pkey primary key (user_id, lesson_id);

alter table public.lesson_note     drop constraint lesson_note_pkey;
alter table public.lesson_note     add  constraint lesson_note_pkey primary key (user_id, lesson_id);

alter table public.lesson_review   drop constraint lesson_review_pkey;
alter table public.lesson_review   add  constraint lesson_review_pkey primary key (user_id, lesson_id);

alter table public.book_bookmark   drop constraint book_bookmark_pkey;
alter table public.book_bookmark   add  constraint book_bookmark_pkey primary key (user_id, step_id);

alter table public.lesson_bookmark drop constraint lesson_bookmark_pkey;
alter table public.lesson_bookmark add  constraint lesson_bookmark_pkey primary key (user_id, lesson_id, section_index);

-- 4) TIL: slug 전역 유니크 → 사용자별 유니크. inbox_item/til_post는 uuid 기본키 유지, user_id 인덱스만 추가.
alter table public.til_series drop constraint if exists til_series_slug_key;
create unique index if not exists til_series_user_slug_key on public.til_series (user_id, slug);

alter table public.til_post   drop constraint if exists til_post_slug_key;
create unique index if not exists til_post_user_slug_key on public.til_post (user_id, slug);

create index if not exists inbox_item_user_idx on public.inbox_item (user_id);
create index if not exists til_post_user_status_idx on public.til_post (user_id, status, published_at desc);
