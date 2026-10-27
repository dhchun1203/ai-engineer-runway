"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { QuizMistakesResponse } from "@/app/api/quiz-mistakes/route";

// 오답 노트 입구 — 정적 페이지(복습 카드, 복습 퀴즈, 베이스캠프)에 붙는 작은 아일랜드.
// 마운트 후 /api/quiz-mistakes를 한 번 불러 키 목록을 받고, prefix로 세어 개수를 보여 준다.
// 한 페이지에 여러 개(STEP 카드마다)가 붙어도 요청은 한 번만 나가도록 모듈 수준에서
// 약속(Promise)을 나눠 쓴다. 페이지를 새로 열 때마다 새로 받는다(아래 cache는 그 페이지
// 수명 동안만).

let pending: Promise<string[]> | null = null;

function loadKeys(): Promise<string[]> {
  if (!pending) {
    pending = fetch("/api/quiz-mistakes", { cache: "no-store" })
      .then((res) => res.json() as Promise<QuizMistakesResponse>)
      .then((data) => (data.unlocked && data.ok ? data.keys : []))
      .catch(() => [])
      .finally(() => {
        // 다음 페이지 방문 때는 새로 받도록 잠시 뒤 비운다.
        setTimeout(() => {
          pending = null;
        }, 1000);
      });
  }
  return pending;
}

export function MistakeNoteLink({
  prefix = "",
  variant,
  label,
  scope = "이 STEP",
}: {
  /** 이 접두사로 시작하는 키만 센다(예: "bc:step1:"). 비우면 전체. */
  prefix?: string;
  /** step: 0개면 아무것도 안 그림 / link: 늘 링크를 그리고 개수가 있으면 붙임 */
  variant: "step" | "link";
  label?: string;
  /** step 변형 문구의 범위 이름("이 STEP에서 틀린 문제"). 수업 레슨은 "이 수업" */
  scope?: string;
}) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    loadKeys().then((keys) => {
      if (alive) setCount(keys.filter((key) => key.startsWith(prefix)).length);
    });
    return () => {
      alive = false;
    };
  }, [prefix]);

  if (variant === "step") {
    if (!count) return null;
    return (
      <Link
        href="/review/mistakes"
        className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-destructive dark:text-destructive-dark"
      >
        {scope}에서 틀린 문제 {count}개, 오답 노트에서 다시 풀기
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link
      href="/review/mistakes"
      className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark"
    >
      {label ?? "오답 노트"}
      {count ? ` (${count}문제)` : null}
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </Link>
  );
}
