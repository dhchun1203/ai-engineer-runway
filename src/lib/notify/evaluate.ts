import 'server-only';

// "알림을 보낼까?" 판단 — 홈페이지(src/app/page.tsx)의 페이스 조립을 그대로 재사용한다.
// 진도 판정의 진실 원천은 computePace 하나뿐이다(별도 재계산 금지). "앞서고 있으면
// 알림을 보내지 않는다"는 사용자 요구가 여기서 status==='ahead' → shouldNotify=false로
// 그대로 구현된다.

import { computePace } from '../pace';
import { getScheduleRows, getLessonMinutesBySlug } from '../schedule-data';
import { readProgressRows } from '../progress-store';
import { todayInSeoul } from '../today';
import type { NotifyWhen } from './settings-store';

export type NotificationDecision = {
  shouldNotify: boolean;
  status: 'ahead' | 'on-track' | 'behind' | 'unknown';
  missedCount: number;
  gapMinutes: number;
  title: string;
  body: string;
  url: string;
};

// notifyWhen:
//   'behind'             — 뒤처졌을 때만 보낸다(기본).
//   'behind_or_on_track' — 예정대로(on-track)여도 "오늘의 학습" 리마인더를 보낸다.
// 어느 경우든 ahead(앞섬)면 절대 보내지 않는다.
export async function evaluateNotification(
  notifyWhen: NotifyWhen,
  today: string = todayInSeoul(),
): Promise<NotificationDecision> {
  const progress = await readProgressRows();
  if (!progress.ok) {
    return { shouldNotify: false, status: 'unknown', missedCount: 0, gapMinutes: 0, title: '', body: '', url: '/' };
  }

  const rows = getScheduleRows();
  const minutesBySlug = getLessonMinutesBySlug();
  const completedIds = new Set(progress.rows.map((r) => r.lessonSlug));
  const pace = computePace(rows, minutesBySlug, completedIds, today);

  const shouldNotify =
    pace.status === 'behind'
      ? true
      : pace.status === 'on-track'
        ? notifyWhen === 'behind_or_on_track'
        : false; // ahead → 항상 false

  const missedCount = pace.missedSlugs.length;

  const { title, body } =
    pace.status === 'behind'
      ? {
          title: '학습이 밀리고 있어요',
          body:
            missedCount > 0
              ? `밀린 레슨 ${missedCount}개(약 ${pace.gapMinutes}분). 지금 이어서 따라잡아요.`
              : `약 ${pace.gapMinutes}분 분량이 밀렸어요. 지금 이어서 학습해요.`,
        }
      : {
          title: '오늘의 학습 시간이에요',
          body: '오늘 배정된 레슨을 확인해 보세요.',
        };

  return {
    shouldNotify,
    status: pace.status,
    missedCount,
    gapMinutes: pace.gapMinutes,
    title,
    body,
    url: '/',
  };
}
