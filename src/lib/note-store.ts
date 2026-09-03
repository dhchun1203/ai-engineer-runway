import 'server-only';

// lesson_note 테이블에 대한 유일한 데이터 접근 계층 — progress-store.ts의 형태를 그대로
// 미러링한다. 조회 실패와 "아직 메모 없음"을 타입 수준에서 구분해 반환한다 — 조회
// 실패를 빈 메모로 오인해 화면에 보여주면 사용자는 메모가 사라졌다고 느낀다.

import { supabaseAdmin } from './supabase/admin';

export type NoteRead =
  | { ok: true; body: string; til: string; needsReview: boolean }
  | { ok: false; error: string };

// T-0y8-02(DoS) — 본문 길이 상한. 초과 시 저장을 거부하고 한국어 오류를 던진다.
// 클라이언트는 실패를 표시하되 textarea의 글은 그대로 둔다(saveLessonNoteAction이
// 이 오류를 그대로 전파하고, lesson-notepad.tsx는 실패 시 setValue를 호출하지 않는다).
const MAX_NOTE_LENGTH = 50_000;

// T-0rz-03(DoS) — TIL 한 줄 길이 상한. MAX_NOTE_LENGTH와 같은 방어를 별도 컬럼에도 적용한다.
const MAX_TIL_LENGTH = 2_000;

export async function readLessonNote(lessonSlug: string): Promise<NoteRead> {
  const { data, error } = await supabaseAdmin
    .from('lesson_note')
    .select('body, til, needs_review')
    .eq('lesson_id', lessonSlug)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  // 행이 없으면 "아직 메모 없음"이며 빈 문자열/false로 성공을 반환한다 — 조회
  // 실패(error 존재)와 타입 수준에서 구분된다.
  return {
    ok: true,
    body: data?.body ?? '',
    til: data?.til ?? '',
    needsReview: data?.needs_review ?? false,
  };
}

export async function saveLessonNote(lessonSlug: string, body: string): Promise<void> {
  if (body.length > MAX_NOTE_LENGTH) {
    throw new Error(
      `note-store: 메모가 너무 깁니다 (lesson_id=${lessonSlug}): 최대 ${MAX_NOTE_LENGTH}자까지 저장할 수 있습니다.`,
    );
  }

  const { error } = await supabaseAdmin
    .from('lesson_note')
    .upsert({ lesson_id: lessonSlug, body, updated_at: new Date().toISOString() });

  if (error) {
    throw new Error(`note-store: 메모 저장 실패 (lesson_id=${lessonSlug}): ${error.message}`);
  }
}

// saveLessonNote가 til을 건드리지 않는 것과 대칭으로, 이 함수도 body 키를 upsert
// payload에 넣지 않는다 — 지정하지 않은 컬럼은 Postgrest upsert의 ON CONFLICT
// DO UPDATE SET 절에 포함되지 않으므로 기존 body가 그대로 보존된다(WR-01).
export async function saveLessonTil(lessonSlug: string, til: string): Promise<void> {
  if (til.length > MAX_TIL_LENGTH) {
    throw new Error(
      `note-store: TIL이 너무 깁니다 (lesson_id=${lessonSlug}): 최대 ${MAX_TIL_LENGTH}자까지 저장할 수 있습니다.`,
    );
  }

  const { error } = await supabaseAdmin
    .from('lesson_note')
    .upsert({ lesson_id: lessonSlug, til, updated_at: new Date().toISOString() });

  if (error) {
    throw new Error(`note-store: TIL 저장 실패 (lesson_id=${lessonSlug}): ${error.message}`);
  }
}

// saveLessonTil과 대칭 — needs_review만 upsert하고 body/til 키는 payload에 넣지
// 않는다(WR-01). 불리언 한 값이라 길이 상한은 두지 않는다. "더 공부해야 함"을
// 켜고 끄는 사용자 신호 하나를 저장할 뿐, 완료 상태와는 완전히 독립이다.
export async function saveLessonNeedsReview(lessonSlug: string, needsReview: boolean): Promise<void> {
  const { error } = await supabaseAdmin
    .from('lesson_note')
    .upsert({ lesson_id: lessonSlug, needs_review: needsReview, updated_at: new Date().toISOString() });

  if (error) {
    throw new Error(
      `note-store: 더 공부 표시 저장 실패 (lesson_id=${lessonSlug}): ${error.message}`,
    );
  }
}

export type NeedsReviewRead = { ok: true; ids: Set<string> } | { ok: false; error: string };

/** "더 공부할 레슨으로 표시"(needs_review=true)한 lesson_id 전체를 읽는다 —
 * readCompletedLessonIds와 동형(Set 반환, 조회 실패와 "0건"을 타입 수준에서 구분).
 * 커리큘럼 목록의 줄 표시·개수 배지가 이 집합을 completedSlugs처럼 교집합해 쓴다. */
export async function readNeedsReviewLessonIds(): Promise<NeedsReviewRead> {
  const { data, error } = await supabaseAdmin
    .from('lesson_note')
    .select('lesson_id')
    .eq('needs_review', true);

  if (error) {
    return { ok: false, error: error.message };
  }

  const ids = new Set((data ?? []).map((row) => row.lesson_id as string));
  return { ok: true, ids };
}

export type AllNotesRead = { ok: true; notes: Map<string, string> } | { ok: false; error: string };

/** /notes 단권화(quick 260901-x62)를 위한 전 레슨 메모 조회 — readReviewStates가
 * Map을 만드는 방식과 동형이다. body가 빈 문자열인 행은 Map에서 제외한다 —
 * 단권화는 실제 내용이 있는 노트만 대상이다(레슨 메모장을 열었다 아무것도
 * 안 쓰고 닫은 경우 등, upsert가 빈 문자열 행을 만들 수 있다). 조회 실패
 * (error 존재)와 "노트 없음"은 여기서도 타입 수준에서 구분된다. */
export async function readAllLessonNotes(): Promise<AllNotesRead> {
  const { data, error } = await supabaseAdmin.from('lesson_note').select('lesson_id, body');

  if (error) {
    return { ok: false, error: error.message };
  }

  const notes = new Map<string, string>();
  for (const row of data ?? []) {
    const body = (row.body as string | null) ?? '';
    if (body.length === 0) continue;
    notes.set(row.lesson_id as string, body);
  }

  return { ok: true, notes };
}
