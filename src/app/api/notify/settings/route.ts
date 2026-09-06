// GET/POST /api/notify/settings — 알림 기준(활성화·발송 시각·발송 조건)을 읽고 저장한다.
// api/progress와 같은 게이트 규율(hasUnlockCookie 먼저, no-store).

import { NextResponse } from 'next/server';
import { hasUnlockCookie } from '@/lib/auth';
import {
  readNotificationSettings,
  saveNotificationSettings,
  type NotifyWhen,
} from '@/lib/notify/settings-store';

const NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

export async function GET() {
  const unlocked = await hasUnlockCookie();
  if (!unlocked) {
    return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  }
  const settings = await readNotificationSettings();
  return NextResponse.json(
    {
      ok: true,
      enabled: settings.enabled,
      notifyHour: settings.notifyHour,
      notifyWhen: settings.notifyWhen,
    },
    { status: 200, headers: NO_STORE },
  );
}

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

  const raw = body as { enabled?: unknown; notifyHour?: unknown; notifyWhen?: unknown };
  const enabled = raw.enabled === true;
  const notifyHour = Number(raw.notifyHour);
  const notifyWhen: NotifyWhen = raw.notifyWhen === 'behind_or_on_track' ? 'behind_or_on_track' : 'behind';

  if (!Number.isInteger(notifyHour) || notifyHour < 0 || notifyHour > 23) {
    return NextResponse.json({ ok: false, error: 'invalid-hour' }, { status: 400, headers: NO_STORE });
  }

  try {
    await saveNotificationSettings({ enabled, notifyHour, notifyWhen });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502, headers: NO_STORE });
  }

  return NextResponse.json({ ok: true, enabled, notifyHour, notifyWhen }, { status: 200, headers: NO_STORE });
}
