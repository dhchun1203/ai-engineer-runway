-- TIL 학습기록. progress/lesson_note와 같은 단일 오너·service_role 전용 모델.
-- RLS를 켜되 정책은 만들지 않는다(default-deny). 접근은 서버 전용 supabaseAdmin만.
-- 공개 발행글 노출은 서버 쿼리의 status='published' 필터가 담당한다(anon 정책 아님).

create table if not exists public.til_series (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.til_series enable row level security;

create table if not exists public.til_post (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  template text not null check (template in ('concept', 'bug')),
  title text not null,
  summary text,
  body_md text not null default '',
  -- 저장 시 컴파일한 MDX 함수본문 문자열(mdx-content.tsx가 소비). 스펙의 body_html을
  -- raw HTML이 아니라 함수본문으로 구현한다 — 기존 MDXContent 렌더 경로 재사용.
  body_code text not null default '',
  self_check text,
  understanding smallint check (understanding between 1 and 5),
  blocked_points text,
  tags text[] not null default '{}',
  series_id uuid references public.til_series(id) on delete set null,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.til_post enable row level security;

create index if not exists til_post_status_published_at_idx
  on public.til_post (status, published_at desc);
create index if not exists til_post_series_idx on public.til_post (series_id);
