// POST /api/push/test — 저장된 모든 구독에 테스트 알림을 보낸다. 사용자가 설정 모달에서
// "테스트 알림" 버튼을 눌러 실제로 기기에 알림이 오는지 확인하는 용도.

import { NextResponse } from 'next/server';
import { hasUnlockCookie } from '@/lib/auth';
import { sendPushToAll } from '@/lib/notify/push';

const NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

export async function POST() {
  const unlocked = await hasUnlockCookie();
  if (!unlocked) {
    return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  }

  try {
    const result = await sendPushToAll({
      title: '테스트 알림',
      body: '학습 알림이 정상적으로 켜졌어요. 👍',
      url: '/',
    });
    return NextResponse.json({ ok: true, ...result }, { status: 200, headers: NO_STORE });
  } catch (err) {
    // 오너 전용(게이트 통과) 화면에서 원인을 바로 볼 수 있게 메시지를 전달한다 —
    // VAPID 키 미설정 같은 설정 문제를 여기서 확인한다.
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: NO_STORE });
  }
}
