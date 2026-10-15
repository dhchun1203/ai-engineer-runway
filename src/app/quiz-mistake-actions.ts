'use server';

// 객관식 답 기록 Server Action — 베이스캠프 복습 퀴즈와 /review 객관식, 오답 노트가 함께
// 부른다. 풀이 기록(quiz_attempt)과 오답 노트(quiz_mistake)를 한 번에 갱신한다. review-actions.ts와 같은 순서로 스스로 재검증한다(Server Action은 POST
// 엔드포인트라 위조 요청이 올 수 있다): 로그인 확인 → 키가 실제 문항으로 풀리는지 확인 →
// 고른 보기 번호가 범위 안인지 확인 → 그다음에만 저장한다. 정답 여부는 클라이언트가 보낸
// 값을 믿지 않고 서버가 문항 데이터로 직접 채점한다.

import { hasUnlockCookie } from '@/lib/auth';
import { resolveQuizKey } from '@/lib/quiz-mistake-resolve';
import { recordQuizAnswer as storeRecordQuizAnswer, type QuizAnswerOutcome } from '@/lib/quiz-mistake-store';
import { recordQuizAttempt } from '@/lib/quiz-attempt-store';

export async function recordQuizAnswer(key: string, chosenOption: number): Promise<QuizAnswerOutcome> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  const resolved = resolveQuizKey(key);
  if (!resolved) {
    throw new Error('invalid quiz key');
  }

  const { options, answer } = resolved.question;
  if (!Number.isInteger(chosenOption) || chosenOption < 0 || chosenOption >= options.length) {
    throw new Error('invalid option');
  }

  const correct = chosenOption === answer;
  // 풀이 기록(마지막 결과)과 오답 노트를 함께 갱신한다(2026-10-15).
  await recordQuizAttempt(key, correct);
  return storeRecordQuizAnswer(key, correct);
}
