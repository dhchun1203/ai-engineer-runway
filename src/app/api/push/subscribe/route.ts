// POST /api/push/subscribe — 이 기기의 웹푸시 구독을 저장한다. api/progress와 같은
// 게이트 규율: hasUnlockCookie()를 어떤 조회보다 먼저, 응답에 시크릿을 남기지 않는다.

import { NextResponse } from 'next/server';
import { hasUnlockCookie } from '@/lib/auth';
import { saveSubscription } from '@/lib/notify/subscription-store';

const NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

export async function POST(request: Request) {
  const unlocked = await hasUnlockCookie();
  if (!unlocked) {
    return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400, headers: NO_STORE });
  }

  // 브라우저 PushSubscription.toJSON() 형태: { endpoint, keys: { p256dh, auth } }
  const sub = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (typeof endpoint !== 'string' || typeof p256dh !== 'string' || typeof auth !== 'string') {
    return NextResponse.json({ ok: false, error: 'invalid-subscription' }, { status: 400, headers: NO_STORE });
  }

  try {
    await saveSubscription({ endpoint, p256dh, auth, userAgent: request.headers.get('user-agent') });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502, headers: NO_STORE });
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
}
