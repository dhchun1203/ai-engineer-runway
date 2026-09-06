import 'server-only';

// notification_settings 테이블의 유일한 데이터 접근 계층 — progress-store와 같은 규율
// (service_role 접근, 조회 실패와 "설정 없음"을 타입으로 구분하지 않고 안전한 기본값으로
// 강등). 이 앱은 1인 사용이라 행은 id='owner' 싱글턴 하나뿐이다.

import { supabaseAdmin } from '../supabase/admin';

export type NotifyWhen = 'behind' | 'behind_or_on_track';

export type NotificationSettings = {
  enabled: boolean;
  notifyHour: number; // 서울 기준 0-23
  notifyWhen: NotifyWhen;
  lastSentOn: string | null; // YYYY-MM-DD(서울) 또는 null
};

// 조회 실패·행 없음일 때 돌려주는 안전한 기본값 — "알림 꺼짐"이 안전한 기본이다
// (설정을 못 읽었다고 알림을 함부로 보내지 않는다).
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  notifyHour: 20,
  notifyWhen: 'behind',
  lastSentOn: null,
};

const OWNER_ID = 'owner';

export async function readNotificationSettings(): Promise<NotificationSettings> {
  const { data, error } = await supabaseAdmin
    .from('notification_settings')
    .select('enabled, notify_hour, notify_when, last_sent_on')
    .eq('id', OWNER_ID)
    .maybeSingle();

  if (error || !data) return DEFAULT_NOTIFICATION_SETTINGS;

  return {
    enabled: Boolean(data.enabled),
    notifyHour: Number(data.notify_hour),
    notifyWhen: data.notify_when === 'behind_or_on_track' ? 'behind_or_on_track' : 'behind',
    lastSentOn: (data.last_sent_on as string | null) ?? null,
  };
}

export async function saveNotificationSettings(input: {
  enabled: boolean;
  notifyHour: number;
  notifyWhen: NotifyWhen;
}): Promise<void> {
  const { error } = await supabaseAdmin.from('notification_settings').upsert({
    id: OWNER_ID,
    enabled: input.enabled,
    notify_hour: input.notifyHour,
    notify_when: input.notifyWhen,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    throw new Error(`notification-settings: 설정 저장 실패: ${error.message}`);
  }
}

// 하루 한 번만 보내기 위한 발송 기록. update가 아니라 upsert를 쓰는 이유: 크론이
// 설정 행보다 먼저 도는 경우는 없지만(알림을 켜야 행이 생긴다), 방어적으로 행이 없더라도
// 기록이 남게 한다. id·last_sent_on만 넘기므로 다른 컬럼은 건드리지 않는다.
export async function markNotificationSent(sentOn: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('notification_settings')
    .upsert({ id: OWNER_ID, last_sent_on: sentOn });
  if (error) {
    throw new Error(`notification-settings: 발송 기록 저장 실패: ${error.message}`);
  }
}
