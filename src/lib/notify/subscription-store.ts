import 'server-only';

// push_subscription 테이블 접근 계층. 기기별 웹푸시 구독(endpoint 고유)을 저장·조회·삭제한다.
// service_role 접근(supabaseAdmin), progress-store와 같은 규율.

import { supabaseAdmin } from '../supabase/admin';

export type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function saveSubscription(
  sub: PushSubscriptionRecord & { userAgent?: string | null },
): Promise<void> {
  const { error } = await supabaseAdmin.from('push_subscription').upsert({
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
    user_agent: sub.userAgent ?? null,
  });
  if (error) {
    throw new Error(`push-subscription: 구독 저장 실패: ${error.message}`);
  }
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  const { error } = await supabaseAdmin.from('push_subscription').delete().eq('endpoint', endpoint);
  if (error) {
    throw new Error(`push-subscription: 구독 삭제 실패: ${error.message}`);
  }
}

// 발송용 전체 구독 목록. 조회 실패는 빈 배열로 강등한다 — 크론이 설정을 못 읽은 것과
// 같은 방어(실패를 예외로 터뜨려 크론 전체를 멈추지 않는다).
export async function readSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('push_subscription')
    .select('endpoint, p256dh, auth');
  if (error) return [];
  return (data ?? []).map((row) => ({
    endpoint: row.endpoint as string,
    p256dh: row.p256dh as string,
    auth: row.auth as string,
  }));
}

export async function countSubscriptions(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('push_subscription')
    .select('endpoint', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}
