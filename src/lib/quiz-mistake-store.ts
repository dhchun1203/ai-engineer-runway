import 'server-only';

// quiz_mistake 테이블의 유일한 데이터 접근 계층. 다른 store와 같은 2겹 방어 — 로그인 본인
// 자격(getUserDb, RLS 적용)으로 접근하고, 모든 쿼리를 현재 user_id로도 거른다.
//
// 규칙: 틀리면 행을 만들거나 wrong_count +1, correct_streak 0. 오답 노트에 있는 문제를
// 맞히면 correct_streak +1, MISTAKE_CLEAR_STREAK번 연속이면 행을 지운다. 오답 노트에 없는
// 문제를 맞힌 건 기록하지 않는다(맞힌 기록까지 쌓지 않는다).

import { getUserDb } from './supabase/db';
import { getCurrentUserId, requireCurrentUserId } from './current-user';
import { MISTAKE_CLEAR_STREAK } from './quiz-mistake-key';

export type QuizMistakeRow = { key: string; wrongCount: number; correctStreak: number; lastWrongAt: string };

export type QuizMistakesRead = { ok: true; rows: QuizMistakeRow[] } | { ok: false; error: string };

/** 현재 사용자의 오답 노트 전체. 최근에 틀린 것부터. 비로그인이면 빈 목록. */
export async function readQuizMistakes(): Promise<QuizMistakesRead> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: true, rows: [] };

  const db = await getUserDb();
  const { data, error } = await db
    .from('quiz_mistake')
    .select('quiz_key, wrong_count, correct_streak, last_wrong_at')
    .eq('user_id', userId)
    .order('last_wrong_at', { ascending: false });

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    rows: (data ?? []).map((row) => ({
      key: row.quiz_key as string,
      wrongCount: row.wrong_count as number,
      correctStreak: row.correct_streak as number,
      lastWrongAt: row.last_wrong_at as string,
    })),
  };
}

export type QuizAnswerOutcome = 'added' | 'still-wrong' | 'streak' | 'cleared' | 'ignored';

/** 한 문항의 답을 기록한다. 키 검증은 호출부(Server Action)가 먼저 끝낸 상태여야 한다. */
export async function recordQuizAnswer(key: string, correct: boolean): Promise<QuizAnswerOutcome> {
  const userId = await requireCurrentUserId();
  const db = await getUserDb();

  const { data: existing, error: readError } = await db
    .from('quiz_mistake')
    .select('wrong_count, correct_streak')
    .eq('user_id', userId)
    .eq('quiz_key', key)
    .maybeSingle();
  if (readError) throw new Error(`quiz-mistake-store: 읽기 실패 (${readError.message})`);

  const now = new Date().toISOString();

  if (!correct) {
    const { error } = await db.from('quiz_mistake').upsert(
      {
        user_id: userId,
        quiz_key: key,
        wrong_count: existing ? (existing.wrong_count as number) + 1 : 1,
        correct_streak: 0,
        last_wrong_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id,quiz_key' },
    );
    if (error) throw new Error(`quiz-mistake-store: 저장 실패 (${error.message})`);
    return existing ? 'still-wrong' : 'added';
  }

  if (!existing) return 'ignored';

  const streak = (existing.correct_streak as number) + 1;
  if (streak >= MISTAKE_CLEAR_STREAK) {
    const { error } = await db.from('quiz_mistake').delete().eq('user_id', userId).eq('quiz_key', key);
    if (error) throw new Error(`quiz-mistake-store: 삭제 실패 (${error.message})`);
    return 'cleared';
  }

  const { error } = await db
    .from('quiz_mistake')
    .update({ correct_streak: streak, updated_at: now })
    .eq('user_id', userId)
    .eq('quiz_key', key);
  if (error) throw new Error(`quiz-mistake-store: 갱신 실패 (${error.message})`);
  return 'streak';
}
