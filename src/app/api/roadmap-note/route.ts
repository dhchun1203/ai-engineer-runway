// GET /api/roadmap-note?slug=<slug> — 로드맵 레슨 메모 아일랜드의 유일한 읽기 지점.
// app/api/basecamp-note/route.ts와 같은 모양이고, 권한 검사만 isRoadmapViewer()다
// (로드맵 페이지와 같은 문). 본문 순서가 보안 계약이다: 권한 판정을 어떤 조회보다
// 먼저 하고, 허용 계정이 아니면 메모를 열지 않고 unlocked:false만 돌려준다.
// 사용자마다 갈리는 응답이라 모든 응답에 no-store를 단다.

import { NextResponse } from "next/server";
import { isRoadmapViewer } from "@/lib/roadmap-access";
import { getRoadmapLessonBySlug } from "@/content/roadmap-lesson-helpers";
import { readLessonNote } from "@/lib/note-store";
import { roadmapNoteId } from "@/lib/roadmap-note";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

export type RoadmapNoteResponse = {
  unlocked: boolean;
  note: { ok: true; body: string } | { ok: false };
};

export async function GET(request: Request) {
  const unlocked = await isRoadmapViewer();

  if (!unlocked) {
    return NextResponse.json(
      { unlocked: false, note: { ok: false } } satisfies RoadmapNoteResponse,
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }

  // 미존재 슬러그는 오류가 아니라 note:{ok:false}로 둔다(존재 여부 탐침 방지).
  const slug = new URL(request.url).searchParams.get("slug");
  let note: RoadmapNoteResponse["note"] = { ok: false };
  if (slug && getRoadmapLessonBySlug(slug)) {
    const read = await readLessonNote(roadmapNoteId(slug));
    note = read.ok ? { ok: true, body: read.body } : { ok: false };
  }

  return NextResponse.json(
    { unlocked: true, note } satisfies RoadmapNoteResponse,
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
