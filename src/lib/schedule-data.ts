// 매니페스트 조회(curriculum-helpers.ts)와 순수 일정 계산(schedule.ts)을 조합하는
// 얇은 층 — progress.ts와 같은 역할. Velite 콘텐츠 매니페스트 모듈(#site/content)을
// 직접 import하지 않는다 — 매니페스트 접근은 curriculum-helpers.ts의 공개 함수를
// 통한다. Supabase 계열 모듈도 import하지 않는다 — 이 파일은 완료 집합을 다루지
// 않는 공개 층이다(D-37, ARCHITECTURE 책임 맵의 계층 분리).

import { getOrderedLessons } from '@/content/curriculum-helpers';
import { buildSchedule, scheduleTotalDays, SCHEDULE_START, type ScheduleRow } from './schedule';

/**
 * 매니페스트 전역 정렬(getOrderedLessons) 순서를 SCHEDULE_START부터 배정한
 * 36행 일정을 돌려준다. /와 /schedule이 서로 다른 방식으로 일정을 만드는
 * 드리프트를 막는 단일 진입점이다.
 */
export function getScheduleRows(): ScheduleRow[] {
  const slugs = getOrderedLessons().map((lesson) => lesson.slug);
  return buildSchedule(slugs, SCHEDULE_START, scheduleTotalDays(slugs.length));
}

/** slug → estimatedMinutes Map (Plan 03의 페이스 계산 입력). */
export function getLessonMinutesBySlug(): Map<string, number> {
  const map = new Map<string, number>();
  for (const lesson of getOrderedLessons()) {
    map.set(lesson.slug, lesson.estimatedMinutes);
  }
  return map;
}
