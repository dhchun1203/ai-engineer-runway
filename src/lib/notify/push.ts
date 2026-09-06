import 'server-only';

// 웹푸시 발송 계층 — web-push 라이브러리로 VAPID 서명 + 페이로드 암호화를 처리한다.
// 서버 전용(크론·테스트 라우트에서만 호출). VAPID 키는 환경변수로 주입한다:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — 공개키(클라이언트도 구독 시 같은 값을 쓴다)
//   VAPID_PRIVATE_KEY             — 개인키(서버 전용, 절대 클라이언트에 노출 금지)
//   VAPID_SUBJECT                 — mailto: 또는 https: 연락처(미설정 시 OWNER_EMAIL로 대체)

import webpush from 'web-push';
import { readSubscriptions, deleteSubscription } from './subscription-store';

let configured = false;

function configure(): void {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error(
      'notify/push: VAPID 키가 없습니다 — NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY를 설정하세요.',
    );
  }
  const owner = process.env.OWNER_EMAIL?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || (owner ? `mailto:${owner}` : 'mailto:noreply@localhost');
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export type PushSendResult = {
  total: number;
  sent: number;
  pruned: number; // 만료(404/410)로 삭제된 구독 수
  failed: number;
};

// 저장된 모든 구독에 같은 알림을 보낸다. 만료된 구독(404/410)은 조용히 지운다 —
// 브라우저가 구독을 폐기하면 그 endpoint는 영구히 죽으므로 남겨둘 이유가 없다.
export async function sendPushToAll(payload: PushPayload): Promise<PushSendResult> {
  configure();
  const subs = await readSubscriptions();
  const json = JSON.stringify(payload);

  let sent = 0;
  let pruned = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          json,
        );
        sent += 1;
      } catch (err) {
        const status =
          typeof err === 'object' && err !== null && 'statusCode' in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        if (status === 404 || status === 410) {
          await deleteSubscription(s.endpoint);
          pruned += 1;
        } else {
          failed += 1;
        }
      }
    }),
  );

  return { total: subs.length, sent, pruned, failed };
}
