"use client";

// 아티클 메모 아일랜드 — BasecampNote와 같은 셸 계약. 페이지는 정적이고, 마운트 후
// GET /api/article-note를 한 번 불러 메모를 가져온다. 로딩엔 스켈레톤, 잠금엔 무표시,
// 읽기 실패엔 한국어 안내, 성공에만 메모장을 마운트한다.

import { useEffect, useState } from "react";
import { LessonNotepad } from "@/components/lesson-notepad";
import { NotepadSkeleton } from "@/components/progress-skeleton";
import { saveArticleNoteAction } from "@/app/articles/[slug]/note-actions";
import type { ArticleNoteResponse } from "@/app/api/article-note/route";

type State =
  | { status: "loading" }
  | { status: "ready"; body: string }
  | { status: "locked" }
  | { status: "error" };

export function ArticleNote({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/article-note?slug=${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => res.json() as Promise<ArticleNoteResponse>)
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!data.unlocked) return setState({ status: "locked" });
        if (data.note.ok) return setState({ status: "ready", body: data.note.body });
        return setState({ status: "error" });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: "error" });
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
    <LessonNotepad lessonId={slug} initialBody={state.body} saveAction={saveArticleNoteAction} />
  );
}
