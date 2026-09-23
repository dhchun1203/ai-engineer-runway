"use client";

// 베이스캠프 레슨 메모 아일랜드. 정규 레슨의 진도 아일랜드
// (ProgressProvider + LessonNoteSlot)를 통째로 얹는 대신, 메모 한 건만 읽어
// 오는 얇은 아일랜드다 — 베이스캠프는 진도·완료·복습이 없는 격리 컬렉션이라
// completedIds·steps·modules를 계산하는 GET /api/progress를 태우지 않는다.
//
// 셸 계약은 정규 레슨 페이지와 같다: 페이지는 완전 정적이고, 이 클라이언트
// 아일랜드가 마운트 후 GET /api/basecamp-note를 한 번 호출해 메모를 가져온다.
// 상태 판정도 LessonNoteSlot과 동형이다 — 로딩엔 스켈레톤, 잠금엔 무표시(메모가
// DOM에 등장할 경로 자체를 없앤다), 읽기 실패엔 한국어 안내, 성공에만 메모장을
// 마운트한다(NotepadSkeleton과 같은 .note-sheet 기하라 레이아웃 시프트 0).

import { useEffect, useState } from "react";
import { LessonNotepad } from "@/components/lesson-notepad";
import { NotepadSkeleton } from "@/components/progress-skeleton";
import { saveBasecampNoteAction } from "@/app/basecamp/[slug]/note-actions";
import type { BasecampNoteResponse } from "@/app/api/basecamp-note/route";
import { NOTE_KEY_PREFIX } from "@/lib/offline/offline-logic";
import { keepNoteCopy, readNoteCopy } from "@/lib/offline/snapshots";

type State =
  | { status: "loading" }
  | { status: "ready"; body: string }
  | { status: "locked" }
  | { status: "error" };

export function BasecampNote({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const noteKey = `${NOTE_KEY_PREFIX.basecamp}${slug}`;

    fetch(`/api/basecamp-note?slug=${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => res.json() as Promise<BasecampNoteResponse>)
      .then(async (data) => {
        if (controller.signal.aborted) return;
        if (!data.unlocked) return setState({ status: "locked" });
        if (!data.note.ok) return setState({ status: "error" });
        // 서버 본문을 기기 사본으로 남기고, 동기화 안 된 메모가 있으면 그것을 보여 준다.
        const body = await keepNoteCopy(noteKey, data.note.body);
        if (controller.signal.aborted) return;
        setState({ status: "ready", body });
      })
      .catch(async () => {
        if (controller.signal.aborted) return;
        // 오프라인이면 기기 사본(대기열 우선)으로 메모장을 연다. 사본이 없으면 기존 안내.
        const body = await readNoteCopy(noteKey);
        if (controller.signal.aborted) return;
        setState(body === null ? { status: "error" } : { status: "ready", body });
      });

    return () => controller.abort();
  }, [slug]);

  if (state.status === "loading") return <NotepadSkeleton />;
  if (state.status === "locked") return null;
  if (state.status === "error") {
    return (
      <p
        data-notepad-read-error
        className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark"
      >
        메모를 불러오지 못했어요. 새로고침해 주세요.
      </p>
    );
  }

  // initialBody는 마운트 후 갈아끼우지 않는다 — LessonNotepad는 메모가 도착한
  // 뒤에만 마운트되므로(로딩 중엔 위에서 스켈레톤), 초기값 한 번으로 충분하다.
  return (
    <LessonNotepad
      lessonId={slug}
      initialBody={state.body}
      saveAction={saveBasecampNoteAction}
      noteKeyPrefix={NOTE_KEY_PREFIX.basecamp}
    />
  );
}
