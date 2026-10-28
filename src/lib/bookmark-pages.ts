import 'server-only';

// 책갈피를 꽂을 수 있는 레슨 페이지 키(2026-10-29). lesson_bookmark.lesson_id에 그대로
// 저장되는 값이다 — 정규 레슨은 slug 그대로(기존 행과 /bookmarks 호환), 나머지는
// 메모장 키(roadmap:<slug>)와 같은 접두어 꼴이다. 저장·조회 전에 실제 존재하는 페이지인지
// 확인해, 임의 키로 행을 만들거나 존재 여부를 떠보는 경로를 막는다.

import { getLessonBySlug } from '@/content/curriculum-helpers';
import { getBasecampLessonBySlug } from '@/content/basecamp-lesson-helpers';
import { getClassLessonBySlug } from '@/content/class-lesson-helpers';
import { getRoadmapLessonBySlug } from '@/content/roadmap-lesson-helpers';
import { isRoadmapViewer } from './roadmap-access';

export async function isBookmarkablePage(key: string): Promise<boolean> {
  const sep = key.indexOf(':');
  if (sep === -1) return Boolean(getLessonBySlug(key));

  const kind = key.slice(0, sep);
  const slug = key.slice(sep + 1);
  if (kind === 'basecamp') return Boolean(getBasecampLessonBySlug(slug));
  if (kind === 'class') return Boolean(getClassLessonBySlug(slug));
  // 로드맵은 허용 계정 전용 페이지라 책갈피도 같은 게이트를 지난다.
  if (kind === 'roadmap') return Boolean(getRoadmapLessonBySlug(slug)) && (await isRoadmapViewer());
  return false;
}
