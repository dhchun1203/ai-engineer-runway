import 'server-only';

// book_bookmark 테이블에 대한 유일한 데이터 접근 계층 — bookmark-store.ts와 같은
// 형태(조회 실패와 "없음"을 타입 수준에서 구분)이나, 이쪽은 스텝마다 딱 한 개라
// (lesson_id, section_index) 복합 키가 아니라 step_id 단일 키를 upsert한다.
//
// 기기 간 동기화(quick 260904-a1o 후속)를 위해 원래 localStorage였던 책갈피를 서버로
// 옮긴 것이다. 단일 소유자 데이터라 user_id 없이 step_id만으로 유일하다.

import { supabaseAdmin } from './supabase/admin';

export type BookBookmark = { chapter: string | null; within: number; y: number };

export type BookBookmarkRead =
  | { ok: true; bookmark: BookBookmark | null }
  | { ok: false; error: string };

const MAX_SLUG_LENGTH = 200;
// 스크롤 좌표 상한 — 음수·거대 정수 임의 입력을 저장 전에 가둔다(bookmark-store의
// MAX_SECTION_INDEX와 같은 결의 방어).
const MAX_ABS_COORD = 5_000_000;

function isValidStep(stepId: number): boolean {
  return Number.isInteger(stepId) && stepId >= 1 && stepId <= 3;
}

function clampCoord(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(-MAX_ABS_COORD, Math.min(MAX_ABS_COORD, Math.round(n)));
}

/** 한 스텝의 책갈피를 읽는다. 행이 없으면 bookmark:null로 성공을 반환한다(조회
 * 실패와 타입 수준에서 구분). */
export async function readBookBookmark(stepId: number): Promise<BookBookmarkRead> {
  if (!isValidStep(stepId)) return { ok: true, bookmark: null };

  const { data, error } = await supabaseAdmin
    .from('book_bookmark')
    .select('chapter_slug, within_offset, scroll_y')
    .eq('step_id', stepId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: true, bookmark: null };
  }

  return {
    ok: true,
    bookmark: {
      chapter: (data.chapter_slug as string | null) ?? null,
      within: data.within_offset as number,
      y: data.scroll_y as number,
    },
  };
}

/** 한 스텝의 책갈피를 꽂거나 옮긴다(upsert — 스텝당 한 개라 갈아 끼운다). */
export async function setBookBookmark(stepId: number, mark: BookBookmark): Promise<void> {
  if (!isValidStep(stepId)) {
    throw new Error(`book-bookmark-store: step_id가 올바르지 않습니다 (${stepId}).`);
  }

  const chapter = mark.chapter ? mark.chapter.slice(0, MAX_SLUG_LENGTH) : null;

  const { error } = await supabaseAdmin.from('book_bookmark').upsert(
    {
      step_id: stepId,
      chapter_slug: chapter,
      within_offset: clampCoord(mark.within),
      scroll_y: clampCoord(mark.y),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'step_id' },
  );

  if (error) {
    throw new Error(`book-bookmark-store: 책갈피 저장 실패 (step=${stepId}): ${error.message}`);
  }
}
