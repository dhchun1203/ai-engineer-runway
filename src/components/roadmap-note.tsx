"use client";

// 로드맵 레슨 메모 아일랜드. basecamp-note.tsx와 같은 셸 계약이다: 마운트 후
// GET /api/roadmap-note를 한 번 불러, 로딩엔 스켈레톤, 권한 없음엔 무표시, 읽기
// 실패엔 안내, 성공에만 메모장을 띄운다. 다른 점은 tips — 세션 노트의 "세션 뒤에 채울
// 칸"처럼 메모에 무엇을 적으면 좋은지 메모장 안에 팁으로 보여 준다.

import { useEffect, useState } from "react";
import { LessonNotepad } from "@/components/lesson-notepad";
import { NotepadSkeleton } from "@/components/progress-skeleton";
import { saveRoadmapNoteAction } from "@/app/roadmap/[slug]/note-actions";
import type { RoadmapNoteResponse } from "@/app/api/roadmap-note/route";
import { NOTE_KEY_PREFIX } from "@/lib/offline/offline-logic";
import { keepNoteCopy, readNoteCopy } from "@/lib/offline/snapshots";

type State =
  | { status: "loading" }
  | { status: "ready"; body: string }
  | { status: "locked" }
  | { status: "error" };

export function RoadmapNote({ slug, tips }: { slug: string; tips?: readonly string[] }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const noteKey = `${NOTE_KEY_PREFIX.roadmap}${slug}`;

    fetch(`/api/roadmap-note?slug=${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => res.json() as Promise<RoadmapNoteResponse>)
      .then(async (data) => {
        if (controller.signal.aborted) return;
        if (!data.unlocked) return setState({ status: "locked" });
        if (!data.note.ok) return setState({ status: "error" });
        const body = await keepNoteCopy(noteKey, data.note.body);
        if (controller.signal.aborted) return;
        setState({ status: "ready", body });
      })
      .catch(async () => {
        if (controller.signal.aborted) return;
        // 오프라인이면 기기 사본(대기열 우선)으로 연다. 사본이 없으면 안내.
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

  return (
    <LessonNotepad
      lessonId={slug}
      initialBody={state.body}
      saveAction={saveRoadmapNoteAction}
      noteKeyPrefix={NOTE_KEY_PREFIX.roadmap}
      tips={tips}
    />
  );
}
