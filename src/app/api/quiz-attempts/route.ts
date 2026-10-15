// GET /api/quiz-attempts — 객관식 풀이 기록(문항별 마지막 결과와 날짜). 퀴즈 화면과 복습
// 카드의 작은 아일랜드가 "지난번 맞힘/틀림"과 진행 상황을 그리려고 부른다. 고른 보기는
// 저장하지 않으므로 응답에도 없다. 보안 계약은 /api/quiz-mistakes와 같다.

import { NextResponse } from "next/server";
import { hasUnlockCookie } from "@/lib/auth";
import { readQuizAttempts, type QuizAttemptRow } from "@/lib/quiz-attempt-store";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

export type QuizAttemptsResponse = { unlocked: boolean; ok: boolean; attempts: QuizAttemptRow[] };

export async function GET() {
  if (!(await hasUnlockCookie())) {
    return NextResponse.json(
      { unlocked: false, ok: true, attempts: [] } satisfies QuizAttemptsResponse,
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }

  const read = await readQuizAttempts();
  return NextResponse.json(
    { unlocked: true, ok: read.ok, attempts: read.ok ? read.rows : [] } satisfies QuizAttemptsResponse,
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
