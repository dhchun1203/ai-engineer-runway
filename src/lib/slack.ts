import 'server-only';

// 슬랙 워크스페이스의 한 채널 메시지를 사이트에서 읽어오는 계층(방식 A — 사이트가
// 슬랙 Web API를 직접 호출). 봇 토큰과 채널 ID는 서버 전용 env로만 둔다(클라이언트
// 노출 금지 — NEXT_PUBLIC 접두사를 붙이지 않는다). 이 피드는 소유자에게만 보인다
// (src/lib/owner.ts + /slack 페이지의 게이트).
//
// 브랜딩: 이 파일이 만드는 어떤 문자열에도 워크스페이스 이름(교육기관명)을 넣지
// 않는다(HARD RULE). 메시지 본문은 원문 그대로 전달만 한다.

const SLACK_API = 'https://slack.com/api';

export type SlackMessage = {
  /** 슬랙 메시지 고유 ts(정렬·키). */
  ts: string;
  /** 작성자 표시 이름(users.list로 해석, 실패 시 사용자 ID). */
  author: string;
  /** 사람이 읽기 좋게 정리한 본문(mrkdwn 최소 변환). */
  text: string;
  /** 서울 기준 표시용 시각 문자열. */
  time: string;
};

export type SlackFeedRead =
  | { ok: true; messages: SlackMessage[] }
  | { ok: false; reason: 'unconfigured' | 'error'; error?: string };

type SlackConfig = { token: string; channelId: string };

/** env에서 봇 토큰과 채널 ID를 읽는다. 둘 중 하나라도 없으면 null(미설정). */
function slackConfig(): SlackConfig | null {
  const token = process.env.SLACK_BOT_TOKEN?.trim();
  const channelId = process.env.SLACK_CHANNEL_ID?.trim();
  if (!token || !channelId) return null;
  return { token, channelId };
}

export function isSlackConfigured(): boolean {
  return slackConfig() !== null;
}

async function slackGet(
  token: string,
  method: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const url = `${SLACK_API}/${method}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    // 열 때마다 최신을 받는다 — 캐시하지 않는다(방식 A: on-load 갱신).
    cache: 'no-store',
  });
  return (await res.json()) as Record<string, unknown>;
}

/** 사용자 ID → 표시 이름 맵. users.list 한 번으로 만든다(멘션·작성자 해석용). */
async function fetchUserMap(token: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const data = await slackGet(token, 'users.list', { limit: '200' });
    if (data.ok && Array.isArray(data.members)) {
      for (const m of data.members as Array<Record<string, unknown>>) {
        const id = m.id as string | undefined;
        const profile = (m.profile ?? {}) as Record<string, unknown>;
        const name =
          (profile.display_name as string) ||
          (profile.real_name as string) ||
          (m.name as string) ||
          (id ?? '');
        if (id) map.set(id, name);
      }
    }
  } catch {
    // 이름 해석 실패는 치명적이지 않다 — 사용자 ID로 폴백한다.
  }
  return map;
}

// 슬랙 mrkdwn을 사람이 읽기 좋게 최소 변환한다: 멘션(<@U..>)·채널(<#C..|name>)·
// 링크(<url|label>)·HTML 이스케이프를 정리한다. 완전한 마크다운 렌더는 아니고,
// 화면에서 깨져 보이지 않게만 다듬는다.
function formatText(raw: string, users: Map<string, string>): string {
  let t = raw;
  t = t.replace(/<@([UW][A-Z0-9]+)(\|[^>]+)?>/g, (_m, id: string) => `@${users.get(id) ?? id}`);
  t = t.replace(/<#[CG][A-Z0-9]+\|([^>]+)>/g, (_m, name: string) => `#${name}`);
  t = t.replace(/<(https?:[^|>]+)\|([^>]+)>/g, (_m, _url: string, label: string) => label);
  t = t.replace(/<(https?:[^>]+)>/g, (_m, url: string) => url);
  t = t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return t;
}

/** 채널 최근 메시지를 최신순으로 읽는다. 봇 메시지·조인 알림 등 서브타입은
 *  걸러 사람 글만 남긴다. 미설정이면 unconfigured, 실패면 error를 반환한다. */
export async function fetchChannelMessages(limit = 30): Promise<SlackFeedRead> {
  const config = slackConfig();
  if (!config) return { ok: false, reason: 'unconfigured' };

  try {
    const users = await fetchUserMap(config.token);
    const data = await slackGet(config.token, 'conversations.history', {
      channel: config.channelId,
      limit: String(Math.min(Math.max(limit, 1), 100)),
    });

    if (!data.ok) {
      return { ok: false, reason: 'error', error: String(data.error ?? 'unknown') };
    }

    const seoulTime = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const raw = Array.isArray(data.messages) ? (data.messages as Array<Record<string, unknown>>) : [];
    const messages: SlackMessage[] = raw
      // 채널 조인/봇 시스템 메시지 등은 제외하고 사람 글(subtype 없음)만.
      .filter((m) => m.type === 'message' && !m.subtype && typeof m.text === 'string')
      .map((m) => {
        const ts = m.ts as string;
        const userId = (m.user as string) ?? '';
        return {
          ts,
          author: users.get(userId) ?? userId ?? '알 수 없음',
          text: formatText(m.text as string, users),
          time: seoulTime.format(new Date(Number(ts) * 1000)),
        };
      });

    return { ok: true, messages };
  } catch (err) {
    return { ok: false, reason: 'error', error: err instanceof Error ? err.message : 'fetch 실패' };
  }
}
