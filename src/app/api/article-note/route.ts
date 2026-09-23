// GET /api/article-note?slug=<slug> — 아티클 메모 아일랜드의 유일한 읽기 지점.
// app/api/basecamp-note/route.ts와 같은 보안 계약: hasUnlockCookie()를 무조건,
// 어떤 조회보다 먼저 호출하고, 미존재 슬러그는 note:{ok:false}로 둔다. 사용자별
// 응답이라 모든 응답에 no-store를 붙인다.

import { NextResponse } from "next/server";
import { hasUnlockCookie } from "@/lib/auth";
import { getArticleBySlug } from "@/content/article-helpers";
import { readLessonNote } from "@/lib/note-store";
import { articleNoteId } from "@/lib/article-note";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

export type ArticleNoteResponse = {
  unlocked: boolean;
  note: { ok: true; body: string } | { ok: false };
};

export async function GET(request: Request) {
  const unlocked = await hasUnlockCookie();

  if (!unlocked) {
    return NextResponse.json(
      { unlocked: false, note: { ok: false } } satisfies ArticleNoteResponse,
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }

  const slug = new URL(request.url).searchParams.get("slug");
  let note: ArticleNoteResponse["note"] = { ok: false };
  if (slug && getArticleBySlug(slug)) {
    const read = await readLessonNote(articleNoteId(slug));
    note = read.ok ? { ok: true, body: read.body } : { ok: false };
  }

  return NextResponse.json(
    { unlocked: true, note } satisfies ArticleNoteResponse,
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
