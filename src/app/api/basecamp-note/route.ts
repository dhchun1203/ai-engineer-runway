// GET /api/basecamp-note?slug=<slug> — 베이스캠프 레슨 메모 아일랜드의 유일한
// 읽기 지점. 정규 레슨 메모가 GET /api/progress에 얹혀 오는 것과 달리, 베이스캠프는
// 진도·완료·복습이 없는 격리 컬렉션이라 진도 계산을 전혀 돌리지 않는 전용 라우트를
// 둔다 — 이 핸들러는 completedIds·steps·modules를 계산하지 않고 메모 한 건만 읽는다.
//
// 본문 순서 자체가 보안 계약이다(app/api/progress/route.ts와 동일 규율):
// hasUnlockCookie()를 무조건, 그리고 어떤 조회보다도 먼저 호출한다. 잠금 해제
// 전이면 note 필드를 열지 않고 unlocked:false만 노출한다 — 메모 본문이 새어나갈
// 경로 자체를 없앤다. 미존재 슬러그는 오류가 아니라 note:{ok:false}로 처리한다.
//
// route segment config `dynamic`을 force-static으로 선언하지 않는다 — cookies()를
// 통해 사용자별로 갈리는 응답이라 정적 캐시가 강제되면 한 사용자의 메모가 다른
// 요청자에게 응답된다. 모든 응답에 명시적으로 no-store를 설정한다.

import { NextResponse } from "next/server";
import { hasUnlockCookie } from "@/lib/auth";
import { getBasecampLessonBySlug } from "@/content/basecamp-lesson-helpers";
import { readLessonNote } from "@/lib/note-store";
import { basecampNoteId } from "@/lib/basecamp-note";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

// note는 실패 시 { ok: false }만 담는다 — DB 오류 문자열을 클라이언트로 내보내지
// 않는다(정규 진도 라우트와 동일). body 외의 필드(til·needsReview)는 베이스캠프에
// 없으므로 싣지 않는다.
export type BasecampNoteResponse = {
  unlocked: boolean;
  note: { ok: true; body: string } | { ok: false };
};

export async function GET(request: Request) {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다.
  const unlocked = await hasUnlockCookie();

  if (!unlocked) {
    return NextResponse.json(
      { unlocked: false, note: { ok: false } } satisfies BasecampNoteResponse,
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }

  // 슬러그 존재를 먼저 검증한다(note-actions.ts와 같은 방어). 미존재 슬러그는
  // note:{ok:false}로 둔다 — 존재 여부를 되묻는 탐침이 되지 않게 한다.
  // readLessonNote()는 hasUnlockCookie() 판정을 통과하고 슬러그 존재가 확인된
  // 뒤에만 호출한다 — 잠금 해제 전에는 이 호출 자체가 발생할 경로가 없다.
  const slug = new URL(request.url).searchParams.get("slug");
  let note: BasecampNoteResponse["note"] = { ok: false };
  if (slug && getBasecampLessonBySlug(slug)) {
    const read = await readLessonNote(basecampNoteId(slug));
    note = read.ok ? { ok: true, body: read.body } : { ok: false };
  }

  return NextResponse.json(
    { unlocked: true, note } satisfies BasecampNoteResponse,
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
