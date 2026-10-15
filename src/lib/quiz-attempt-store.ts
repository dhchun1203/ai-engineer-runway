import 'server-only';

// quiz_attempt 테이블의 유일한 데이터 접근 계층(2026-10-15). 문항마다 마지막 결과와 누적
// 시도 수를 남긴다. 다른 store와 같은 2겹 방어 — 로그인 본인 자격(getUserDb, RLS)으로
// 접근하고 모든 쿼리를 현재 user_id로도 거른다. 키 검증은 호출부(Server Action)가 먼저 한다.

import { getUserDb } from './supabase/db';
import { getCurrentUserId, requireCurrentUserId } from './current-user';

export type QuizAttemptRow = { key: string; lastCorrect: boolean; lastAnsweredAt: string };

export type QuizAttemptsRead = { ok: true; rows: QuizAttemptRow[] } | { ok: false; error: string };

/** 현재 사용자의 풀이 기록 전체. 비로그인이면 빈 목록. */
export async function readQuizAttempts(): Promise<QuizAttemptsRead> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: true, rows: [] };

  const db = await getUserDb();
  const { data, error } = await db
    .from('quiz_attempt')
    .select('quiz_key, last_correct, last_answered_at')
    .eq('user_id', userId);

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    rows: (data ?? []).map((row) => ({
      key: row.quiz_key as string,
      lastCorrect: row.last_correct as boolean,
      lastAnsweredAt: row.last_answered_at as string,
    })),
  };
}

/** 한 문항의 풀이 결과를 남긴다(마지막 결과를 덮어쓰고 누적 수를 올린다). */
export async function recordQuizAttempt(key: string, correct: boolean): Promise<void> {
  const userId = await requireCurrentUserId();
  const db = await getUserDb();

  const { data: existing, error: readError } = await db
    .from('quiz_attempt')
    .select('attempts, correct_count')
    .eq('user_id', userId)
    .eq('quiz_key', key)
    .maybeSingle();
  if (readError) throw new Error(`quiz-attempt-store: 읽기 실패 (${readError.message})`);

  const { error } = await db.from('quiz_attempt').upsert(
    {
      user_id: userId,
      quiz_key: key,
      last_correct: correct,
      attempts: existing ? (existing.attempts as number) + 1 : 1,
      correct_count: (existing ? (existing.correct_count as number) : 0) + (correct ? 1 : 0),
      last_answered_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,quiz_key' },
  );
  if (error) throw new Error(`quiz-attempt-store: 저장 실패 (${error.message})`);
}
