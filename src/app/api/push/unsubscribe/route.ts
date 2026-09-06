// POST /api/push/unsubscribe — 이 기기의 구독을 지운다(알림 끄기 시 클라이언트가 호출).

import { NextResponse } from 'next/server';
import { hasUnlockCookie } from '@/lib/auth';
import { deleteSubscription } from '@/lib/notify/subscription-store';

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

  const endpoint = (body as { endpoint?: unknown })?.endpoint;
  if (typeof endpoint !== 'string') {
    return NextResponse.json({ ok: false, error: 'invalid-endpoint' }, { status: 400, headers: NO_STORE });
  }

  try {
    await deleteSubscription(endpoint);
  } catch {
    return NextResponse.json({ ok: false }, { status: 502, headers: NO_STORE });
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
}
