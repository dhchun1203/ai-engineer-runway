import 'server-only';

// lesson_note 테이블에 대한 유일한 데이터 접근 계층 — progress-store.ts의 형태를 그대로
// 미러링한다. 조회 실패와 "아직 메모 없음"을 타입 수준에서 구분해 반환한다 — 조회
// 실패를 빈 메모로 오인해 화면에 보여주면 사용자는 메모가 사라졌다고 느낀다.

import { supabaseAdmin } from './supabase/admin';

export type NoteRead = { ok: true; body: string } | { ok: false; error: string };

// T-0y8-02(DoS) — 본문 길이 상한. 초과 시 저장을 거부하고 한국어 오류를 던진다.
// 클라이언트는 실패를 표시하되 textarea의 글은 그대로 둔다(saveLessonNoteAction이
// 이 오류를 그대로 전파하고, lesson-notepad.tsx는 실패 시 setValue를 호출하지 않는다).
const MAX_NOTE_LENGTH = 50_000;

export async function readLessonNote(lessonSlug: string): Promise<NoteRead> {
  const { data, error } = await supabaseAdmin
    .from('lesson_note')
    .select('body')
    .eq('lesson_id', lessonSlug)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  // 행이 없으면 "아직 메모 없음"이며 빈 문자열로 성공을 반환한다 — 조회
  // 실패(error 존재)와 타입 수준에서 구분된다.
  return { ok: true, body: data?.body ?? '' };
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
