-- 가입 승인 "방식"을 기록한다 — /admin 처리 이력에서 "초대 코드로 바로 가입"과
-- "관리자가 직접 승인"을 구분해 보여주기 위한 컬럼.
--
-- 값: 'invite'(초대 코드 자동 승인) | 'manual'(소유자가 /admin에서 승인). 거절은
-- 방식이 없어 null로 둔다. 이 컬럼 추가 이전에 승인된 기존 행도 null이며, 화면에서는
-- 방식 표시 없이 "승인됨"으로만 나온다(소급 판정하지 않는다).

alter table public.access_requests
  add column if not exists approved_via text;

alter table public.access_requests
  drop constraint if exists access_requests_approved_via_check;

alter table public.access_requests
  add constraint access_requests_approved_via_check
  check (approved_via is null or approved_via in ('invite', 'manual'));
