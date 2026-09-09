-- 학습 알림(웹푸시) 기능 제거(2026-09-09). 마감일 개념을 걷어내면서 "뒤처졌을 때만
-- 보내는 알림"이 근거를 잃어 기능 전체를 삭제했다 — 관련 코드(lib/notify, /api/push,
-- /api/notify, /api/cron/notify, public/sw.js, 컴포넌트, 크론)는 이미 제거됐고,
-- 여기서 그 기능이 쓰던 두 테이블을 드롭한다. 두 테이블은 서로 참조가 없어 순서 무관.
drop table if exists public.push_subscription;
drop table if exists public.notification_settings;
