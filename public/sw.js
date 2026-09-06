/* 학습 알림 웹푸시 서비스워커.
 *
 * 푸시 수신(push)과 알림 클릭(notificationclick)만 처리한다. fetch는 가로채지 않는다 —
 * 오프라인 캐싱을 넣지 않는 이유: 이 사이트는 오늘 날짜에 따라 바뀌는 동적 렌더 페이지가
 * 많아 SW 캐싱이 오히려 낡은 화면을 보여줄 위험이 크다. 알림에 필요한 최소한만 둔다.
 *
 * 아이패드/아이폰 Safari(16.4+)는 홈 화면에 추가된 PWA에서만 웹푸시가 동작한다 —
 * manifest(display: standalone)는 이미 있으므로 이 파일이 등록되면 준비가 끝난다.
 */

self.addEventListener('install', () => {
  // 새 서비스워커를 기다리지 않고 즉시 활성화 — 알림 등록 직후 바로 쓸 수 있어야 한다.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const fallback = { title: '학습 알림', body: '', url: '/' };
  let payload = fallback;
  if (event.data) {
    try {
      payload = Object.assign({}, fallback, event.data.json());
    } catch (_e) {
      payload = Object.assign({}, fallback, { body: event.data.text() });
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon',
      badge: '/icon',
      data: { url: payload.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 창이 있으면 그 창을 이동·포커스한다(새 탭을 계속 늘리지 않는다).
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    }),
  );
});
