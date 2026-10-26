-- TIL GitHub 연동(2026-10-26, docs/superpowers/specs/2026-10-26-til-github-sync-design.md).
-- 사용자별 GitHub App 설치 연결과, 글마다 저장소에 올라간 파일 경로.

create table if not exists public.github_connection (
  user_id uuid primary key references auth.users(id) on delete cascade,
  installation_id bigint not null,
  repo_full_name text,
  status text not null default 'ok' check (status in ('ok', 'broken')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.github_connection enable row level security;

drop policy if exists own_rows on public.github_connection;
create policy own_rows on public.github_connection for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.til_post add column if not exists github_path text;
