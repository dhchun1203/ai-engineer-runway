-- TIL GitHub 연동 철회(2026-10-27, 커밋 c8d263a). 20261026120000에서 만든 표와 열을 지운다.
-- 지울 때 둘 다 비어 있었다.

drop table if exists public.github_connection;

alter table public.til_post drop column if exists github_path;
