-- 학습 알림(웹푸시) 기능. 두 테이블 모두 progress와 같은 단일 오너·service_role
-- 전용 모델을 따른다 — RLS를 켜되 정책(create policy)은 하나도 만들지 않는다.
-- Supabase에서 RLS가 켜져 있고 정책이 0개면 anon/authenticated 역할의 모든 접근이
-- 거부된다(default-deny). 이 앱은 D-17(공유 시크릿/오너 세션)에 따라 이 두 테이블에
-- 서버 전용 service_role 키(src/lib/supabase/admin.ts의 supabaseAdmin)로만 접근하고,
-- service_role은 RLS를 완전히 우회한다. "anon 키로 조회했더니 빈 배열"은 고장이 아니라
-- 이 설계의 증거다 — `using (true)` 편의 정책을 추가해서 "고치지" 말 것(progress 규율).

-- notification_settings: 알림 기준을 담는 싱글턴 행. 이 앱은 1인 사용이라 id는 항상
-- 'owner' 하나만 쓴다. enabled=알림 켜짐 여부, notify_hour=서울 기준 발송 시각(0-23),
-- notify_when=발송 조건('behind'=뒤처졌을 때만 / 'behind_or_on_track'=예정대로여도 발송),
-- last_sent_on=하루 한 번만 보내기 위한 마지막 발송 서울 날짜(중복 방지).
create table if not exists public.notification_settings (
  id text primary key default 'owner',
  enabled boolean not null default false,
  notify_hour smallint not null default 20 check (notify_hour between 0 and 23),
  notify_when text not null default 'behind' check (notify_when in ('behind', 'behind_or_on_track')),
  last_sent_on date,
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

-- push_subscription: 기기별 웹푸시 구독. 아이패드·데스크톱 등 여러 기기가 각자 한 행을
-- 가진다(endpoint가 기기·브라우저별로 고유하므로 primary key). p256dh·auth는 브라우저의
-- PushManager.subscribe()가 돌려준 구독 공개키/인증 시크릿으로, 서버가 web-push로 이
-- 구독에 페이로드를 암호화해 보낼 때 쓴다. 만료(410/404)된 구독은 발송 시 지운다.
create table if not exists public.push_subscription (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.push_subscription enable row level security;
