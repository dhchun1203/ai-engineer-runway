import 'server-only';

// progress 테이블에 대한 유일한 데이터 접근 계층 — DB 접근과 %/집계 계산(src/lib/progress.ts,
// 02-03에서 신설 예정)을 분리한다. 조회 실패와 "완료 0건"을 타입 수준에서 구분해 반환한다
// (D-31의 전제 — 조회 실패를 진행률 0%로 오인 표시하지 않는다).

import { supabaseAdmin } from './supabase/admin';

export type ProgressRead = { ok: true; completedIds: Set<string> } | { ok: false; error: string };

export type ProgressRowsRead =
  | { ok: true; rows: { lessonSlug: string; completedAt: string }[] }
  | { ok: false; error: string };

/**
 * 완료 레슨을 완료 시각과 함께 읽는다 — 복습 만기 계산(src/lib/review.ts)의
 * 입력. completed_at 컬럼은 테이블 생성 때부터 있었지만 이 함수가 처음 읽는다.
 * completedIds가 필요한 호출부는 rows에서 파생하면 되므로, 홈은 이 함수 하나로
 * readCompletedLessonIds를 대체한다.
 */
export async function readProgressRows(): Promise<ProgressRowsRead> {
  const { data, error } = await supabaseAdmin.from('progress').select('lesson_id, completed_at');

  if (error) {
    return { ok: false, error: error.message };
  }

  const rows = (data ?? []).map((row) => ({
    lessonSlug: row.lesson_id as string,
    completedAt: row.completed_at as string,
  }));
  return { ok: true, rows };
}

export async function readCompletedLessonIds(): Promise<ProgressRead> {
  const { data, error } = await supabaseAdmin.from('progress').select('lesson_id');

  if (error) {
    return { ok: false, error: error.message };
  }

  const completedIds = new Set((data ?? []).map((row) => row.lesson_id as string));
  return { ok: true, completedIds };
}

export async function setLessonCompletion(lessonSlug: string, completed: boolean): Promise<void> {
  if (completed) {
    const { error } = await supabaseAdmin
      .from('progress')
      .upsert({ lesson_id: lessonSlug, completed_at: new Date().toISOString() });
    if (error) {
      throw new Error(`progress-store: 완료 저장 실패 (lesson_id=${lessonSlug}): ${error.message}`);
    }
    return;
  }

  const { error } = await supabaseAdmin.from('progress').delete().eq('lesson_id', lessonSlug);
  if (error) {
    throw new Error(`progress-store: 완료 취소 실패 (lesson_id=${lessonSlug}): ${error.message}`);
  }
}
