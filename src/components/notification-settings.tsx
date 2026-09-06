'use client';

// 학습 알림 설정 — 프로필 화면의 "학습 알림" 버튼을 누르면 뜨는 모달.
//
// 두 가지를 다룬다:
//   1) 발송 기준(서버 저장): 알림 받기 여부 · 발송 시각 · 발송 조건. /api/notify/settings.
//   2) 이 기기의 웹푸시 구독(브라우저별): 권한 요청 + 서비스워커 등록 + 구독을 서버에 저장.
//
// 아이패드/아이폰 Safari는 "홈 화면에 추가"로 설치된 PWA에서만 웹푸시가 동작한다 —
// 설치 전에는 PushManager 자체가 없다. 그 경우 구독 버튼 대신 설치 안내를 보여준다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';

type NotifyWhen = 'behind' | 'behind_or_on_track';

type Settings = {
  enabled: boolean;
  notifyHour: number;
  notifyWhen: NotifyWhen;
};

// 이 기기의 푸시 상태.
//   loading       — 아직 확인 중
//   unsupported   — 이 브라우저가 웹푸시 미지원
//   needs-install — iOS/iPadOS인데 홈 화면에 추가(PWA)되지 않음 → 설치 후 가능
//   denied        — 사용자가 알림 권한을 거부함(브라우저 설정에서 풀어야 함)
//   subscribed    — 이 기기 구독됨(알림 받음)
//   idle          — 지원되지만 아직 구독 안 함
type PushState = 'loading' | 'unsupported' | 'needs-install' | 'denied' | 'subscribed' | 'idle';

const DEFAULT_SETTINGS: Settings = { enabled: false, notifyHour: 20, notifyWhen: 'behind' };

// VAPID 공개키(base64url)를 pushManager.subscribe가 요구하는 Uint8Array로 바꾼다.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function hourLabel(h: number): string {
  if (h === 0) return '오전 12시 (자정)';
  if (h === 12) return '오후 12시 (정오)';
  if (h < 12) return `오전 ${h}시`;
  return `오후 ${h - 12}시`;
}

function detectPushEnv(): 'supported' | 'needs-install' | 'unsupported' {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'unsupported';
  const ua = navigator.userAgent || '';
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ Safari는 데스크톱 UA로 위장하므로 터치 포인트로 아이패드를 가려낸다.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!supported) return isIOS && !standalone ? 'needs-install' : 'unsupported';
  return 'supported';
}

export function NotificationSettings({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [pushState, setPushState] = useState<PushState>('loading');
  const [pushBusy, setPushBusy] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);

  const refreshPushState = useCallback(async () => {
    const env = detectPushEnv();
    if (env !== 'supported') {
      setPushState(env === 'needs-install' ? 'needs-install' : 'unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setPushState('denied');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setPushState(sub ? 'subscribed' : 'idle');
    } catch {
      setPushState('idle');
    }
  }, []);

  // 모달을 열 때 서버 설정과 이 기기 푸시 상태를 함께 불러온다.
  useEffect(() => {
    if (!open) return;
    let active = true;
    void (async () => {
      try {
        const res = await fetch('/api/notify/settings', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as Partial<Settings> & { ok?: boolean };
          if (active && data.ok) {
            setSettings({
              enabled: Boolean(data.enabled),
              notifyHour: typeof data.notifyHour === 'number' ? data.notifyHour : 20,
              notifyWhen: data.notifyWhen === 'behind_or_on_track' ? 'behind_or_on_track' : 'behind',
            });
          }
        }
      } catch {
        // 설정 조회 실패는 기본값 유지 — 저장 시 다시 시도할 수 있다.
      } finally {
        if (active) setLoaded(true);
      }
      await refreshPushState();
    })();
    return () => {
      active = false;
    };
  }, [open, refreshPushState]);

  // Esc로 닫기 + 열렸을 때 배경 스크롤 잠금.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  async function saveSettings(next: Settings) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/notify/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error('save-failed');
      setSettings(next);
      setMessage('설정을 저장했어요.');
    } catch {
      setMessage('설정을 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  }

  async function enablePush() {
    if (!vapidPublicKey) {
      setMessage('서버에 알림 키(VAPID)가 아직 설정되지 않았어요.');
      return;
    }
    setPushBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushState(permission === 'denied' ? 'denied' : 'idle');
        setMessage('알림 권한이 허용되지 않았어요.');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // 최신 DOM 타입은 applicationServerKey를 ArrayBuffer 백킹으로 좁게 요구하는데
        // Uint8Array는 ArrayBufferLike로 추론돼 어긋난다 — 런타임 값은 정확하므로
        // BufferSource로 좁혀 준다.
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error('subscribe-failed');
      setPushState('subscribed');
      setMessage('이 기기에서 알림을 받도록 켰어요.');
    } catch {
      setMessage('알림을 켜지 못했어요. 다시 시도해 주세요.');
      await refreshPushState();
    } finally {
      setPushBusy(false);
    }
  }

  async function disablePush() {
    setPushBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setPushState('idle');
      setMessage('이 기기에서 알림을 껐어요.');
    } catch {
      setMessage('알림을 끄지 못했어요. 다시 시도해 주세요.');
      await refreshPushState();
    } finally {
      setPushBusy(false);
    }
  }

  async function sendTest() {
    setPushBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/push/test', { method: 'POST' });
      const data = (await res.json()) as { ok?: boolean; sent?: number; error?: string };
      if (res.ok && data.ok) {
        setMessage(
          data.sent && data.sent > 0
            ? '테스트 알림을 보냈어요. 기기 알림을 확인해 보세요.'
            : '보낼 구독 기기가 없어요. 먼저 이 기기에서 알림을 켜주세요.',
        );
      } else {
        setMessage(`테스트 알림을 보내지 못했어요${data.error ? ` (${data.error})` : ''}.`);
      }
    } catch {
      setMessage('테스트 알림을 보내지 못했어요.');
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage(null);
          setOpen(true);
        }}
        className="btn-action tap-feedback flex min-h-11 items-center gap-2 text-body"
      >
        <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
        학습 알림
      </button>

      {open ? (
        <div
          className="notif-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notif-title"
            tabIndex={-1}
            className="notif-dialog panel flex flex-col gap-5 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 id="notif-title" className="text-heading font-extrabold">
                  학습 알림
                </h2>
                <p className="text-label font-normal text-muted dark:text-muted-dark">
                  진도가 밀렸을 때만 알려드려요. 앞서 있으면 보내지 않아요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="tap-feedback flex h-11 w-11 shrink-0 items-center justify-center"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* 발송 기준 */}
            <fieldset className="flex flex-col gap-4" disabled={!loaded || saving}>
              <label className="flex items-center justify-between gap-3">
                <span className="text-body font-bold">알림 받기</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.enabled}
                  onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
                  className={`tap-feedback min-h-11 px-4 text-label font-bold ${
                    settings.enabled ? 'btn' : 'chip'
                  }`}
                >
                  {settings.enabled ? '켜짐' : '꺼짐'}
                </button>
              </label>

              <label className="flex items-center justify-between gap-3">
                <span className="text-body font-bold">알림 시각</span>
                <select
                  value={settings.notifyHour}
                  onChange={(e) => setSettings((s) => ({ ...s, notifyHour: Number(e.target.value) }))}
                  className="notif-select min-h-11 px-3 text-body"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {hourLabel(h)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-2">
                <span className="text-body font-bold">언제 보낼까요</span>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      { value: 'behind', label: '뒤처졌을 때만' },
                      { value: 'behind_or_on_track', label: '매일 학습 시간에 (뒤처졌거나 예정대로일 때)' },
                    ] as const
                  ).map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="notify-when"
                        value={opt.value}
                        checked={settings.notifyWhen === opt.value}
                        onChange={() => setSettings((s) => ({ ...s, notifyWhen: opt.value }))}
                        className="h-5 w-5 shrink-0"
                      />
                      <span className="text-body font-normal">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </fieldset>

            {/* 이 기기 푸시 */}
            <div className="notif-divider flex flex-col gap-3 pt-4">
              <span className="text-body font-bold">이 기기</span>
              {pushState === 'loading' ? (
                <p className="text-label font-normal text-muted dark:text-muted-dark">확인 중…</p>
              ) : pushState === 'needs-install' ? (
                <p className="text-label font-normal text-muted dark:text-muted-dark">
                  아이패드에서는 먼저 공유 → <strong className="font-bold">홈 화면에 추가</strong>로 앱을
                  설치한 뒤, 홈 화면 아이콘으로 열어 이 화면에서 알림을 켜주세요.
                </p>
              ) : pushState === 'unsupported' ? (
                <p className="text-label font-normal text-muted dark:text-muted-dark">
                  이 브라우저는 웹푸시 알림을 지원하지 않아요.
                </p>
              ) : pushState === 'denied' ? (
                <p className="text-label font-normal text-muted dark:text-muted-dark">
                  알림 권한이 차단되어 있어요. 브라우저 설정에서 이 사이트의 알림을 허용해 주세요.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {pushState === 'subscribed' ? (
                    <>
                      <button
                        type="button"
                        onClick={disablePush}
                        disabled={pushBusy}
                        className="chip tap-feedback min-h-11 text-body"
                      >
                        이 기기 알림 끄기
                      </button>
                      <button
                        type="button"
                        onClick={sendTest}
                        disabled={pushBusy}
                        className="btn tap-feedback min-h-11 text-body"
                      >
                        테스트 알림
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={enablePush}
                      disabled={pushBusy}
                      className="btn-action tap-feedback min-h-11 text-body"
                    >
                      이 기기에서 알림 켜기
                    </button>
                  )}
                </div>
              )}
            </div>

            {message ? (
              <p role="status" aria-live="polite" className="text-label font-normal">
                {message}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="chip tap-feedback min-h-11 text-body"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => saveSettings(settings)}
                disabled={!loaded || saving}
                aria-busy={saving}
                className="btn-action tap-feedback min-h-11 text-body"
              >
                {saving ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
