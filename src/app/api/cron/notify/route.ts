// GET /api/cron/notify — 학습 알림 발송 크론. Vercel Cron이 매시 정각에 호출한다
// (vercel.json). 매시 돌지만 실제 발송은 사용자가 정한 시각·조건이 맞을 때 하루 한 번만.
//
// 인증: Vercel Cron은 `Authorization: Bearer <CRON_SECRET>` 헤더를 붙여 호출한다
// (프로젝트에 CRON_SECRET 환경변수를 설정하면 자동으로 붙는다). 외부에서 임의로
// 호출해 알림을 남발하지 못하도록 이 시크릿이 맞을 때만 동작한다.
//
// 판단은 evaluateNotification 하나가 전담한다("앞서 있으면 안 보냄"은 그 안에서 처리).
// 여기서는 발송 게이트(활성화·시각·중복)만 본다.

import { NextResponse } from 'next/server';
import { todayInSeoul, hourInSeoul } from '@/lib/today';
import {
  readNotificationSettings,
  markNotificationSent,
} from '@/lib/notify/settings-store';
import { evaluateNotification } from '@/lib/notify/evaluate';
import { sendPushToAll } from '@/lib/notify/push';

// 크론은 항상 최신 진도·시각으로 판단해야 하므로 정적 캐싱을 금지한다.
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  }

  const settings = await readNotificationSettings();
  if (!settings.enabled) {
    return NextResponse.json({ ok: true, skipped: 'disabled' }, { status: 200, headers: NO_STORE });
  }

  const today = todayInSeoul();
  const hour = hourInSeoul();
  if (hour !== settings.notifyHour) {
    return NextResponse.json(
      { ok: true, skipped: 'not-time', hour, notifyHour: settings.notifyHour },
      { status: 200, headers: NO_STORE },
    );
  }
  if (settings.lastSentOn === today) {
    return NextResponse.json({ ok: true, skipped: 'already-sent' }, { status: 200, headers: NO_STORE });
  }

  const decision = await evaluateNotification(settings.notifyWhen, today);
  if (!decision.shouldNotify) {
    // 앞서 있거나(ahead) 판단 불가면 보내지 않는다 — 사용자 핵심 요구.
    // lastSentOn은 갱신하지 않는다(오늘 시각이 다시 맞을 일은 없으므로 무해).
    return NextResponse.json(
      { ok: true, skipped: 'not-needed', status: decision.status },
      { status: 200, headers: NO_STORE },
    );
  }

  const result = await sendPushToAll({ title: decision.title, body: decision.body, url: decision.url });
  await markNotificationSent(today);

  return NextResponse.json(
    { ok: true, status: decision.status, ...result },
    { status: 200, headers: NO_STORE },
  );
}
