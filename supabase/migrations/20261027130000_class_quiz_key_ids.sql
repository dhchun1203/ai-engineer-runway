-- 수업 퀴즈 오답 키를 문항 순서(cl:<slug>:<번호>)에서 문항 id(cl:<slug>:<id>)로 옮긴다(2026-10-27).
-- 회차 폴더의 review.yml로 데이터를 옮기며 문항마다 id를 붙였다. 표는 그때의 순서 그대로다.
-- 설계: docs/superpowers/specs/2026-10-27-class-data-structure-design.md 2.2
-- 새 키 행이 이미 있으면(배포와 적용 사이에 다시 푼 경우) 옛 행은 그대로 두고, 풀리지 않는 키라 화면에서 빠진다.
with m(old_key, new_key) as (values
  ('cl:01-terminal-git:0', 'cl:01-terminal-git:git-vs-github'),
  ('cl:01-terminal-git:1', 'cl:01-terminal-git:add-staging'),
  ('cl:01-terminal-git:2', 'cl:01-terminal-git:revert-pushed'),
  ('cl:01-terminal-git:3', 'cl:01-terminal-git:reset-soft'),
  ('cl:01-terminal-git:4', 'cl:01-terminal-git:reset-default'),
  ('cl:01-terminal-git:5', 'cl:01-terminal-git:ls-al-line'),
  ('cl:01-terminal-git:6', 'cl:01-terminal-git:echo-redirect'),
  ('cl:01-terminal-git:7', 'cl:01-terminal-git:cd-dash'),
  ('cl:01-terminal-git:8', 'cl:01-terminal-git:clear-line'),
  ('cl:01-terminal-git:9', 'cl:01-terminal-git:diff-staged'),
  ('cl:01-terminal-git:10', 'cl:01-terminal-git:winget-id'),
  ('cl:01-terminal-git:11', 'cl:01-terminal-git:env-committed'),
  ('cl:01-terminal-git:12', 'cl:01-terminal-git:branch-pointer'),
  ('cl:02-git-setup-remote:0', 'cl:02-git-setup-remote:rm-rf-flags'),
  ('cl:02-git-setup-remote:1', 'cl:02-git-setup-remote:config-unset-all'),
  ('cl:02-git-setup-remote:2', 'cl:02-git-setup-remote:hook-activate'),
  ('cl:02-git-setup-remote:3', 'cl:02-git-setup-remote:hooks-not-shared'),
  ('cl:02-git-setup-remote:4', 'cl:02-git-setup-remote:pre-commit-hook'),
  ('cl:02-git-setup-remote:5', 'cl:02-git-setup-remote:vscode-u-mark'),
  ('cl:02-git-setup-remote:6', 'cl:02-git-setup-remote:status-short'),
  ('cl:02-git-setup-remote:7', 'cl:02-git-setup-remote:log-all'),
  ('cl:02-git-setup-remote:8', 'cl:02-git-setup-remote:head-arrow'),
  ('cl:02-git-setup-remote:9', 'cl:02-git-setup-remote:readme-reject'),
  ('cl:02-git-setup-remote:10', 'cl:02-git-setup-remote:push-u'),
  ('cl:02-git-setup-remote:11', 'cl:02-git-setup-remote:remote-remove'),
  ('cl:02-git-setup-remote:12', 'cl:02-git-setup-remote:vim-save-quit'),
  ('cl:02-git-setup-remote:13', 'cl:02-git-setup-remote:push-routine'),
  ('cl:02-git-setup-remote:14', 'cl:02-git-setup-remote:checkout-graph'),
  ('cl:02-git-setup-remote:15', 'cl:02-git-setup-remote:detached-commit-lost')
)
update public.quiz_attempt a set quiz_key = m.new_key from m
where a.quiz_key = m.old_key
  and not exists (select 1 from public.quiz_attempt b where b.user_id = a.user_id and b.quiz_key = m.new_key);

with m(old_key, new_key) as (values
  ('cl:01-terminal-git:0', 'cl:01-terminal-git:git-vs-github'),
  ('cl:01-terminal-git:1', 'cl:01-terminal-git:add-staging'),
  ('cl:01-terminal-git:2', 'cl:01-terminal-git:revert-pushed'),
  ('cl:01-terminal-git:3', 'cl:01-terminal-git:reset-soft'),
  ('cl:01-terminal-git:4', 'cl:01-terminal-git:reset-default'),
  ('cl:01-terminal-git:5', 'cl:01-terminal-git:ls-al-line'),
  ('cl:01-terminal-git:6', 'cl:01-terminal-git:echo-redirect'),
  ('cl:01-terminal-git:7', 'cl:01-terminal-git:cd-dash'),
  ('cl:01-terminal-git:8', 'cl:01-terminal-git:clear-line'),
  ('cl:01-terminal-git:9', 'cl:01-terminal-git:diff-staged'),
  ('cl:01-terminal-git:10', 'cl:01-terminal-git:winget-id'),
  ('cl:01-terminal-git:11', 'cl:01-terminal-git:env-committed'),
  ('cl:01-terminal-git:12', 'cl:01-terminal-git:branch-pointer'),
  ('cl:02-git-setup-remote:0', 'cl:02-git-setup-remote:rm-rf-flags'),
  ('cl:02-git-setup-remote:1', 'cl:02-git-setup-remote:config-unset-all'),
  ('cl:02-git-setup-remote:2', 'cl:02-git-setup-remote:hook-activate'),
  ('cl:02-git-setup-remote:3', 'cl:02-git-setup-remote:hooks-not-shared'),
  ('cl:02-git-setup-remote:4', 'cl:02-git-setup-remote:pre-commit-hook'),
  ('cl:02-git-setup-remote:5', 'cl:02-git-setup-remote:vscode-u-mark'),
  ('cl:02-git-setup-remote:6', 'cl:02-git-setup-remote:status-short'),
  ('cl:02-git-setup-remote:7', 'cl:02-git-setup-remote:log-all'),
  ('cl:02-git-setup-remote:8', 'cl:02-git-setup-remote:head-arrow'),
  ('cl:02-git-setup-remote:9', 'cl:02-git-setup-remote:readme-reject'),
  ('cl:02-git-setup-remote:10', 'cl:02-git-setup-remote:push-u'),
  ('cl:02-git-setup-remote:11', 'cl:02-git-setup-remote:remote-remove'),
  ('cl:02-git-setup-remote:12', 'cl:02-git-setup-remote:vim-save-quit'),
  ('cl:02-git-setup-remote:13', 'cl:02-git-setup-remote:push-routine'),
  ('cl:02-git-setup-remote:14', 'cl:02-git-setup-remote:checkout-graph'),
  ('cl:02-git-setup-remote:15', 'cl:02-git-setup-remote:detached-commit-lost')
)
update public.quiz_mistake a set quiz_key = m.new_key from m
where a.quiz_key = m.old_key
  and not exists (select 1 from public.quiz_mistake b where b.user_id = a.user_id and b.quiz_key = m.new_key);
