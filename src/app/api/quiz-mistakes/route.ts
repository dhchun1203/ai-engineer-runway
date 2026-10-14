// GET /api/quiz-mistakes — 오답 노트 키 목록. 정적 페이지(복습 카드, 복습 퀴즈)의 작은
// 아일랜드가 "이 STEP에서 틀린 문제 n개"를 그리려고 부른다. 문항 내용은 보내지 않고 키만
// 보낸다(문항 풀기는 오답 노트 페이지가 서버에서 한다). article-note 라우트와 같은 보안
// 계약: 무엇을 읽기 전에 hasUnlockCookie()부터, 사용자별 응답이라 no-store.

import { NextResponse } from "next/server";
import { hasUnlockCookie } from "@/lib/auth";
import { readQuizMistakes } from "@/lib/quiz-mistake-store";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

export type QuizMistakesResponse = { unlocked: boolean; ok: boolean; keys: string[] };

export async function GET() {
  if (!(await hasUnlockCookie())) {
    return NextResponse.json(
      { unlocked: false, ok: true, keys: [] } satisfies QuizMistakesResponse,
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }

  const read = await readQuizMistakes();
  return NextResponse.json(
    { unlocked: true, ok: read.ok, keys: read.ok ? read.rows.map((row) => row.key) : [] } satisfies QuizMistakesResponse,
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
