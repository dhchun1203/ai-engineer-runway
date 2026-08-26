import 'server-only';

// cloze_answer 테이블에 대한 유일한 데이터 접근 계층 — progress-store.ts와 같은
// 형태를 따른다. 조회 실패와 "기록 0건"을 타입 수준에서 구분해 반환한다(D-31과
// 동일 원칙 — 조회 실패를 "아무도 안 채움"으로 오인 표시하지 않는다). 이 파일
// 밖에서 cloze_answer에 접근하지 않는다.

import { supabaseAdmin } from './supabase/admin';

export type ClozeAnswerRecord = { answerHash: string; status: 'correct' | 'revealed' };

export type ClozeAnswersRead =
  | { ok: true; records: Record<string, ClozeAnswerRecord> }
  | { ok: false; error: string };

export async function readClozeAnswers(lessonId: string): Promise<ClozeAnswersRead> {
  const { data, error } = await supabaseAdmin
    .from('cloze_answer')
    .select('blank_id, answer_hash, status')
    .eq('lesson_id', lessonId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const records: Record<string, ClozeAnswerRecord> = {};
  for (const row of data ?? []) {
    records[row.blank_id as string] = {
      answerHash: row.answer_hash as string,
      status: row.status as 'correct' | 'revealed',
    };
  }
  return { ok: true, records };
}

export async function saveClozeAnswer(
  blankId: string,
  lessonId: string,
  answerHash: string,
  status: 'correct' | 'revealed',
): Promise<void> {
  const { error } = await supabaseAdmin.from('cloze_answer').upsert({
    blank_id: blankId,
    lesson_id: lessonId,
    answer_hash: answerHash,
    status,
    answered_at: new Date().toISOString(),
  });
  if (error) {
    throw new Error(`cloze-store: 필사 기록 저장 실패 (blank_id=${blankId}): ${error.message}`);
  }
}
