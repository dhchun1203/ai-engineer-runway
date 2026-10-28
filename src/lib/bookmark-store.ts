import 'server-only';

// lesson_bookmark 테이블에 대한 유일한 데이터 접근 계층 — note-store.ts / progress-store.ts의
// 형태를 그대로 미러링한다. 조회 실패와 "북마크 없음"을 타입 수준에서 구분해 반환한다.
//
// 레슨 안 소제목(h2) 단위로 꽂는 페이지 책갈피다. 2026-10-29부터 페이지당 하나라
// (setPageBookmark가 보장), 정규 레슨 외에 basecamp:/roadmap:/class: 접두어 키도 담는다
// (bookmark-pages.ts). 키 자체는 처음의 다중 북마크 시절 (lesson_id, section_index) 복합
// 키를 그대로 쓴다. section_title을 함께 저장·반환하는 이유는
// 마이그레이션 주석 참고 — 본문 개정으로 h2 순서가 바뀌어도 제목으로 되찾기 위한 폴백이다.

import { getUserDb } from './supabase/db';
import { getCurrentUserId, requireCurrentUserId } from './current-user';

export type Bookmark = { index: number; title: string };

export type BookmarksRead = { ok: true; bookmarks: Bookmark[] } | { ok: false; error: string };

// T-DoS 방어 — 소제목 텍스트 길이 상한(note-store의 MAX_NOTE_LENGTH와 같은 결의 방어).
const MAX_SECTION_TITLE_LENGTH = 500;

// section_index의 상한. 한 레슨의 h2가 이 수를 넘을 일은 없다(6단 척추 표준). 음수·거대
// 정수로 오는 임의 입력을 저장 전에 막는다.
const MAX_SECTION_INDEX = 999;

function isValidIndex(sectionIndex: number): boolean {
  return Number.isInteger(sectionIndex) && sectionIndex >= 0 && sectionIndex <= MAX_SECTION_INDEX;
}

/** 한 페이지의 북마크를 최근 것부터 반환한다 — 레슨 페이지의 책갈피(page-bookmark.tsx)는
 * 맨 앞 하나만 쓴다(페이지당 책갈피 하나). 행이 없으면 빈 배열로 성공을 반환한다(조회
 * 실패와 타입 수준에서 구분). */
export async function readLessonBookmarks(lessonSlug: string): Promise<BookmarksRead> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: true, bookmarks: [] };

  const db = await getUserDb();
  const { data, error } = await db
    .from('lesson_bookmark')
    .select('section_index, section_title')
    .eq('user_id', userId)
    .eq('lesson_id', lessonSlug)
    .order('created_at', { ascending: false });

  if (error) {
    return { ok: false, error: error.message };
  }

  const bookmarks: Bookmark[] = (data ?? []).map((row) => ({
    index: row.section_index as number,
    title: (row.section_title as string | null) ?? '',
  }));

  return { ok: true, bookmarks };
}

/** 페이지 책갈피를 꽂거나 옮긴다 — 페이지당 하나라서 그 페이지의 기존 행을 모두 지우고
 * 새 행 하나를 넣는다. */
export async function setPageBookmark(
  lessonSlug: string,
  sectionIndex: number,
  sectionTitle: string,
): Promise<void> {
  if (!isValidIndex(sectionIndex)) {
    throw new Error(`bookmark-store: section_index가 올바르지 않습니다 (lesson_id=${lessonSlug}, index=${sectionIndex}).`);
  }

  // 제목은 저장 전에 상한으로 자른다 — 저장을 거부하는 대신 잘라서 담는다(제목은
  // 표시·폴백용 보조 데이터라, 길다는 이유로 북마크 지정 자체를 실패시키지 않는다).
  const title = sectionTitle.slice(0, MAX_SECTION_TITLE_LENGTH);

  const userId = await requireCurrentUserId();
  const db = await getUserDb();
  const cleared = await db
    .from('lesson_bookmark')
    .delete()
    .eq('user_id', userId)
    .eq('lesson_id', lessonSlug);
  if (cleared.error) {
    throw new Error(`bookmark-store: 이전 책갈피 정리 실패 (lesson_id=${lessonSlug}): ${cleared.error.message}`);
  }

  const { error } = await db
    .from('lesson_bookmark')
    .insert({ user_id: userId, lesson_id: lessonSlug, section_index: sectionIndex, section_title: title });

  if (error) {
    throw new Error(`bookmark-store: 북마크 저장 실패 (lesson_id=${lessonSlug}, index=${sectionIndex}): ${error.message}`);
  }
}

export async function removeBookmark(lessonSlug: string, sectionIndex: number): Promise<void> {
  if (!isValidIndex(sectionIndex)) {
    throw new Error(`bookmark-store: section_index가 올바르지 않습니다 (lesson_id=${lessonSlug}, index=${sectionIndex}).`);
  }

  const userId = await requireCurrentUserId();
  const db = await getUserDb();
  const { error } = await db
    .from('lesson_bookmark')
    .delete()
    .eq('user_id', userId)
    .eq('lesson_id', lessonSlug)
    .eq('section_index', sectionIndex);

  if (error) {
    throw new Error(`bookmark-store: 북마크 해제 실패 (lesson_id=${lessonSlug}, index=${sectionIndex}): ${error.message}`);
  }
}

export type AllBookmarksRow = {
  lessonId: string;
  index: number;
  title: string;
  createdAt: string;
};

export type AllBookmarksRead = { ok: true; rows: AllBookmarksRow[] } | { ok: false; error: string };

/** /bookmarks 관리 페이지용 — 전 레슨 북마크를 한 번에 조회한다(readAllLessonNotes와
 * 동형). 커리큘럼 순서 정렬은 페이지가 Velite 매니페스트로 하므로 여기서는 원본
 * 행만 돌려준다. */
export async function readAllBookmarks(): Promise<AllBookmarksRead> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: true, rows: [] };

  const db = await getUserDb();
  const { data, error } = await db
    .from('lesson_bookmark')
    .select('lesson_id, section_index, section_title, created_at')
    .eq('user_id', userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const rows: AllBookmarksRow[] = (data ?? []).map((row) => ({
    lessonId: row.lesson_id as string,
    index: row.section_index as number,
    title: (row.section_title as string | null) ?? '',
    createdAt: row.created_at as string,
  }));

  return { ok: true, rows };
}
