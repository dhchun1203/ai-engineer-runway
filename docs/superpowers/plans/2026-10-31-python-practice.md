# 파이썬 손풀기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정규 커리큘럼과 격리된 실습 묶음 `/practice`를 만들고, 가계부 CLI를 키우는 파일럿 1단원을 배포한다.

**Architecture:** 새 Velite 컬렉션 `practiceLessons`(`src/content/practice/*.mdx`)가 단원 본문을 맡는다. 단원 페이지 `/practice/[slug]`는 완전 정적, 목록 `/practice`는 진도를 읽는 동적 페이지로 `pr:` 접두사 완료 체크를 가진다(베이스캠프 `bc:`와 같은 방식). MDX 부품 `TypeAlong`(복사 버튼 숨김)과 `Hints`(하나씩 펼치기)를 새로 만든다.

**Tech Stack:** Next.js 16 App Router, Velite 0.4, Tailwind v4, Supabase progress 테이블, lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-31-python-practice-design.md`

## Global Constraints

- 공개 문안에 교육기관명 금지, "AI Engineer 교육과정"으로 표기.
- 공개 문안에 가운데점(·), 긴 하이픈(—), ─ 글리프, 이모지 금지. 한국어는 2~3문장마다 문단을 끊는다.
- 레슨 속 실행 결과와 에러 메시지는 실제로 돌려서 나온 값만 쓴다. scratchpad에서 uv 0.13.6과 Python 3.12로 실행, git은 임시 `GIT_CONFIG_GLOBAL`.
- 진도와 일정에 섞이지 않는다: `lessons` 컬렉션, 홈 대시보드, 학습 일정은 손대지 않는다.
- 터치 타깃 44px 이상(`min-h-11`), 아이패드 1024 폭과 폰 390 폭에서 가로 넘침 없음.
- 카드 호버는 링크 카드에 `card-interactive panel`.
- UI 아이콘은 lucide 또는 `CustomIcon`. 이모지 금지.
- 메타데이터 제목은 `<제목> | 파이썬 손풀기` 꼴(가운데점 쓰지 않음).
- 이 저장소에는 단위 테스트 러너가 없다. 검증은 `npx velite build`, `npx next typegen && npx tsc --noEmit -p .`, `npx eslint <파일>`, 스크립트 게이트, 배포 후 브라우저 확인으로 한다.
- dev 서버(포트 3000)가 켜져 있으면 로컬 `next build`를 하지 않는다(.velite가 비워져 dev가 깨진다). 빌드 확인은 Vercel 배포로 한다.

## 설계 문서와 달라지는 한 가지

완료 체크는 단원 페이지가 아니라 목록 `/practice`에 둔다. 단원 페이지는 수업 복습 레슨처럼 완전 정적으로 두고, 맨 아래에 "목록에서 완료 체크하기" 카드를 둔다. 정적 페이지에서 개인 진도를 읽으려면 진도 아일랜드나 오프라인 대기열 종류를 새로 늘려야 해서다. Task 1에서 설계 문서의 해당 줄도 고친다.

## File Structure

| 파일 | 할 일 |
|---|---|
| `velite.config.ts` (수정) | `practiceLessons` 컬렉션, prepare에 단원 번호 검사 |
| `src/content/practice-helpers.ts` (새로) | 정렬, slug 조회, 이전과 다음, `pr:` 접두사 |
| `src/components/practice/type-along.tsx` (새로) | 복사 버튼 숨김 컨텍스트 |
| `src/components/code-block.tsx` (수정) | 컨텍스트가 켜지면 복사 버튼 대신 "직접 치기" 라벨 |
| `src/components/practice/hints.tsx` (새로) | `Hints`, `Hint` 하나씩 펼치기 |
| `src/components/practice/stage-chips.tsx` (새로) | 단원 페이지 위쪽 단계 칩, 읽는 단계 강조 |
| `src/components/practice/practice-unit-list.tsx` (새로) | 목록의 단원 카드와 완료 토글, 진행 막대 |
| `src/app/practice/actions.ts` (새로) | `togglePracticeUnit` Server Action |
| `src/app/practice/page.tsx` (새로) | 목록 (동적) |
| `src/app/practice/[slug]/page.tsx` (새로) | 단원 리더 (정적) |
| `src/components/illustrations/custom-icon.tsx` (수정) | `practice` 아이콘 |
| `src/components/site-nav.tsx` (수정) | 더보기 메뉴에 "파이썬 손풀기" |
| `src/content/practice/01-first-entry.mdx` (새로) | 파일럿 1단원 |

---

### Task 1: 컬렉션과 데이터 접근

**Files:**
- Modify: `velite.config.ts` (collections에 `practiceLessons` 추가, `prepare` 인자와 본문)
- Create: `src/content/practice-helpers.ts`
- Modify: `docs/superpowers/specs/2026-10-31-python-practice-design.md` (완료 체크 위치 줄)

**Interfaces:**
- Produces:
  - `practiceLessons` 문서 필드: `title: string`, `unit: number`, `slug: string`, `summary: string`, `feature: string`, `concepts: string[]`, `minutes: number`, `code: string`, `permalink: string` (`/practice/<slug>`)
  - `getOrderedPracticeUnits(): PracticeUnit[]`
  - `getPracticeUnitBySlug(slug: string): PracticeUnit | undefined`
  - `getAdjacentPracticeUnits(slug: string): { prev: PracticeUnit | null; next: PracticeUnit | null }`
  - `PRACTICE_PROGRESS_PREFIX = "pr:"`, `practiceProgressId(slug: string): string`

- [ ] **Step 1: 컬렉션 추가.** `classLessons` 바로 위에 넣는다.

```ts
    // 번외 실습 "파이썬 손풀기"(practiceLessons, 2026-10-31). 가계부 CLI를 단원마다 키우는
    // 실습 묶음이다. concepts와 같은 격리 컬렉션이라 진행률, 일정, 복습 어디에도 집계되지
    // 않는다. 완료 체크는 progress 테이블의 pr:<slug> 행이다(practice-helpers.ts).
    // 설계: docs/superpowers/specs/2026-10-31-python-practice-design.md
    practiceLessons: {
      name: "PracticeLesson",
      pattern: "src/content/practice/*.mdx",
      schema: s
        .object({
          title: s.string(),
          unit: s.number().int().min(1), // 단원 번호(1부터 빠짐없이), prepare가 검사
          slug: s.slug("practiceLessons"),
          summary: s.string(), // 목록 카드와 머리에 보일 두 줄 요약
          feature: s.string(), // 이 단원에서 가계부에 붙는 기능
          concepts: s.array(s.string()).default([]), // 필요한 개념 이름(칩)
          minutes: s.number().min(1), // 예상 시간(분)
          code: s.mdx(),
        })
        .transform((data) => ({
          ...data,
          permalink: `/practice/${data.slug}`,
        })),
    },
```

- [ ] **Step 2: prepare 검사 추가.** `prepare` 인자에 `practiceLessons`를 더하고, `if (problems.length > 0)` 바로 위에 넣는다.

```ts
    // 파이썬 손풀기: 단원 번호는 1부터 빠짐없이 이어지고, slug 앞 두 자리와 같아야 한다.
    const units = [...practiceLessons].sort((a, b) => a.unit - b.unit);
    units.forEach((u, i) => {
      if (u.unit !== i + 1) problems.push(`practice: ${u.slug}의 unit ${u.unit}이 순서(${i + 1})와 맞지 않습니다(빠지거나 겹친 단원)`);
      if (!u.slug.startsWith(`${String(u.unit).padStart(2, "0")}-`)) problems.push(`practice: ${u.slug}는 "${String(u.unit).padStart(2, "0")}-"로 시작해야 합니다`);
    });
```

- [ ] **Step 3: 헬퍼 파일.**

```ts
import { practiceLessons } from "#site/content";

// 번외 실습 "파이썬 손풀기"(practiceLessons) 데이터 접근. unit 오름차순이 곧 진행 순서다.
// 정규 레슨과 분리된 격리 컬렉션이라 진도, 일정, 복습 계산이 이 함수들을 참조하지 않는다.

export type PracticeUnit = (typeof practiceLessons)[number];

/** 완료 체크를 progress 테이블에 저장할 때 붙이는 접두사. 커리큘럼 slug, 베이스캠프 bc:와 분리한다. */
export const PRACTICE_PROGRESS_PREFIX = "pr:";

export function practiceProgressId(slug: string): string {
  return `${PRACTICE_PROGRESS_PREFIX}${slug}`;
}

export function getOrderedPracticeUnits(): PracticeUnit[] {
  return [...practiceLessons].sort((a, b) => a.unit - b.unit);
}

export function getPracticeUnitBySlug(slug: string): PracticeUnit | undefined {
  return practiceLessons.find((u) => u.slug === slug);
}

export function getAdjacentPracticeUnits(slug: string): {
  prev: PracticeUnit | null;
  next: PracticeUnit | null;
} {
  const ordered = getOrderedPracticeUnits();
  const idx = ordered.findIndex((u) => u.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? ordered[idx - 1] : null,
    next: idx < ordered.length - 1 ? ordered[idx + 1] : null,
  };
}
```

- [ ] **Step 4: 검사가 실패하는지 본다.** 임시 파일 `src/content/practice/03-tmp.mdx`를 만든다(frontmatter `title: "t"`, `unit: 3`, `slug: "03-tmp"`, `summary: "s"`, `feature: "f"`, `minutes: 10`, 본문 한 줄). `npx velite build` 실행. 기대: `practice: 03-tmp의 unit 3이 순서(1)와 맞지 않습니다` 오류로 실패.
- [ ] **Step 5: 통과하는지 본다.** 같은 파일을 `01-tmp.mdx`, `unit: 1`, `slug: "01-tmp"`로 바꾸고 `npx velite build`. 기대: 오류 없음. 확인 뒤 임시 파일을 지운다(Task 4가 진짜 1단원을 쓰기 전까지 컬렉션은 비어 있어도 빌드는 통과해야 한다. 다시 `npx velite build`로 확인).
- [ ] **Step 6: 설계 문서 고치기.** "화면" 절의 단원 페이지 "맨 아래에 완료 체크와 다음 단원 카드"를 "맨 아래에 다음 단원 카드와 '목록에서 완료 체크하기' 카드. 완료 체크는 목록 페이지에서 한다(단원 페이지는 정적)"로, 목록 단원 카드 줄에 "완료 토글"을 더한다.
- [ ] **Step 7: 타입 확인과 커밋.** `npx next typegen && npx tsc --noEmit -p .` 통과 후

```bash
git add velite.config.ts src/content/practice-helpers.ts docs/superpowers/specs/2026-10-31-python-practice-design.md
git commit -m "feat(practice): 파이썬 손풀기 컬렉션"
```

### Task 2: MDX 부품 (TypeAlong, Hints)

**Files:**
- Create: `src/components/practice/type-along.tsx`
- Modify: `src/components/code-block.tsx`
- Create: `src/components/practice/hints.tsx`

**Interfaces:**
- Produces: `TypeAlong({ children })`, `useNoCopy(): boolean` (type-along.tsx), `Hints({ children })`, `Hint({ children })` (hints.tsx). MDX 매핑은 Task 3 단원 페이지가 조립한다.
- Consumes: 없음

- [ ] **Step 1: TypeAlong.**

```tsx
'use client';

// 따라 치기 칸. 안에 든 코드 블록의 복사 버튼을 숨기고 "직접 치기" 라벨로 바꾼다.
// 파이썬 손풀기의 원칙(복사하지 말고 손으로 치기)을 화면에서 지키는 장치다.
// code-block.tsx가 이 컨텍스트를 읽는다.

import { createContext, useContext, type ReactNode } from 'react';

const NoCopyContext = createContext(false);

export function useNoCopy(): boolean {
  return useContext(NoCopyContext);
}

export function TypeAlong({ children }: { children: ReactNode }) {
  return <NoCopyContext.Provider value>{children}</NoCopyContext.Provider>;
}
```

- [ ] **Step 2: code-block.tsx 수정.** import에 `import { useNoCopy } from '@/components/practice/type-along';`. 컴포넌트 첫 줄에 `const noCopy = useNoCopy();`. 헤더의 `<button ...>...</button>`을 아래로 감싼다.

```tsx
        {noCopy ? (
          // 따라 치기 칸(TypeAlong): 복사 대신 손으로 친다. 버튼 자리를 같은 높이 라벨로 채워
          // 헤더 높이가 다른 코드 칸과 같게 둔다.
          <span className="flex h-11 items-center px-3 text-label font-bold">직접 치기</span>
        ) : (
          <button ...기존 그대로...>
          </button>
        )}
```

`role="status"` span은 `noCopy`일 때 렌더하지 않는다(`{noCopy ? null : <span role="status" ...>}`).

- [ ] **Step 3: Hints.**

```tsx
'use client';

// 고쳐 치기 힌트. 처음엔 모두 닫혀 있고, 버튼을 누를 때마다 다음 힌트가 하나씩 열린다.
// 막혔을 때 정답 전체가 아니라 다음 한 걸음만 보게 하는 장치다.

import { Children, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export function Hint({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Hints({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const [open, setOpen] = useState(0);

  return (
    <div className="not-prose panel my-6 flex flex-col gap-3 p-4">
      {items.slice(0, open).map((item, i) => (
        <div key={i} className="flex flex-col gap-1">
          <span className="text-label font-bold text-accent dark:text-accent-dark">힌트 {i + 1}</span>
          <div className="prose dark:prose-invert max-w-none">{item}</div>
        </div>
      ))}
      {open < items.length ? (
        <button
          type="button"
          onClick={() => setOpen((n) => n + 1)}
          className="tap-feedback flex min-h-11 w-fit items-center gap-1.5 text-label font-bold"
        >
          <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
          {open === 0 ? '힌트 보기' : `다음 힌트 (${open + 1}/${items.length})`}
        </button>
      ) : (
        <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          힌트를 모두 열었어요.
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 린트와 타입.** `npx eslint src/components/practice src/components/code-block.tsx` 와 `npx tsc --noEmit -p .` 통과.
- [ ] **Step 5: 커밋.**

```bash
git add src/components/practice/type-along.tsx src/components/practice/hints.tsx src/components/code-block.tsx
git commit -m "feat(practice): 직접 치기 코드 칸과 힌트 부품"
```

### Task 3: 화면 (단원 리더, 목록, 메뉴)

**Files:**
- Create: `src/components/practice/stage-chips.tsx`
- Create: `src/app/practice/[slug]/page.tsx`
- Create: `src/app/practice/actions.ts`
- Create: `src/components/practice/practice-unit-list.tsx`
- Create: `src/app/practice/page.tsx`
- Modify: `src/components/illustrations/custom-icon.tsx`, `src/components/site-nav.tsx`

**Interfaces:**
- Consumes: Task 1 헬퍼 전부, Task 2 `TypeAlong`, `Hints`, `Hint`
- Produces: `togglePracticeUnit(slug: string, currentlyDone: boolean): Promise<void>`

- [ ] **Step 1: StageChips.** `LessonToc`(src/components/roadmap/lesson-toc.tsx)와 같은 스크롤 추적을 쓰되, 모든 폭에서 본문 위에 가로 칩 줄로 sticky 표시한다.

```tsx
"use client";

import { useEffect, useState } from "react";

// 단원 페이지 위쪽 단계 칩. 본문의 h2(rehypeSlug id)를 읽어 칩으로 늘어놓고, 누르면 그 단계로
// 이동, 지금 읽는 단계를 채운 칩으로 보여 준다. h2 제목의 "3. " 같은 번호는 칩에서 뺀다.
// 스크롤 판정은 LessonToc와 같다(제목 착지선을 마지막으로 지난 절).

type Stage = { id: string; label: string };

function headingOffset(el: HTMLElement): number {
  return parseFloat(getComputedStyle(el).scrollMarginTop) || 88;
}

export function StageChips({ contentId }: { contentId: string }) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const container = document.getElementById(contentId);
    if (!container) return;
    const headings = Array.from(container.querySelectorAll<HTMLElement>("h2[id]"));
    setStages(headings.map((h) => ({ id: h.id, label: (h.textContent ?? "").replace(/^\d+\.\s*/, "") })));

    let raf = 0;
    const compute = () => {
      raf = 0;
      let current = headings[0]?.id ?? "";
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= headingOffset(h) + 8) current = h.id;
        else break;
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [contentId]);

  if (stages.length === 0) return null;
  return (
    <nav aria-label="단원 단계" data-print-hide className="flex flex-wrap gap-2">
      {stages.map((s, i) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-current={s.id === activeId ? "step" : undefined}
          className={`${s.id === activeId ? "chip-solid" : "chip"} tap-feedback min-h-11 items-center break-keep`}
        >
          {i + 1}. {s.label}
        </a>
      ))}
    </nav>
  );
}
```

(칩 줄은 sticky로 두지 않는다. 단원 하나에 칩이 7개라 아이패드 세로에서 두 줄이 되고, sticky면 본문을 가린다. 머리 아래 한 번만 보여 준다.)

- [ ] **Step 2: 단원 리더 `src/app/practice/[slug]/page.tsx`.** `src/app/class/[slug]/page.tsx`의 셸을 따른다.

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MDXContent } from "@/components/mdx-content";
import { ReadingAssistant } from "@/components/reading-assistant/reading-assistant";
import { LessonToc } from "@/components/roadmap/lesson-toc";
import { PageBookmark } from "@/components/page-bookmark";
import { StageChips } from "@/components/practice/stage-chips";
import { TypeAlong } from "@/components/practice/type-along";
import { Hints, Hint } from "@/components/practice/hints";
import type { ComponentType } from "react";
import { getAdjacentPracticeUnits, getOrderedPracticeUnits, getPracticeUnitBySlug } from "@/content/practice-helpers";

// 파이썬 손풀기 단원 리더. 완전 정적이다(수업 복습 레슨 리더와 같은 셸). 완료 체크는 개인
// 진도를 읽어야 해서 목록(/practice)에 둔다.

const PRACTICE_ARTICLE_ID = "practice-article";

const practiceComponents: Record<string, ComponentType> = {
  TypeAlong: TypeAlong as ComponentType,
  Hints: Hints as ComponentType,
  Hint: Hint as ComponentType,
};

export function generateStaticParams() {
  return getOrderedPracticeUnits().map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const unit = getPracticeUnitBySlug(slug);
  if (!unit) return {};
  return { title: `${unit.title} | 파이썬 손풀기`, description: unit.summary };
}

export default async function PracticeUnitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const unit = getPracticeUnitBySlug(slug);
  if (!unit) notFound();
  const { prev, next } = getAdjacentPracticeUnits(slug);
  const hours = Math.round((unit.minutes / 60) * 10) / 10;

  return (
    <main className="relative mx-auto flex w-full max-w-3xl min-[1800px]:max-w-4xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <LessonToc contentId={PRACTICE_ARTICLE_ID} />
      <PageBookmark pageKey={`practice:${unit.slug}`} pageTitle={unit.title} articleId={PRACTICE_ARTICLE_ID} />
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link href="/practice" className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark">
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            파이썬 손풀기
          </Link>
          <h1 className="text-display font-black break-keep">{unit.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip text-label font-bold">{unit.unit}단원</span>
            <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
              약 {hours}시간, 오늘 붙는 기능: {unit.feature}
            </span>
          </div>
          <StageChips contentId={PRACTICE_ARTICLE_ID} />
        </header>

        <div id={PRACTICE_ARTICLE_ID} className="prose dark:prose-invert max-w-none">
          <MDXContent code={unit.code} components={practiceComponents} />
        </div>

        <nav aria-label="이어지는 단원" data-print-hide className="hairline flex flex-col gap-3 pt-6">
          {prev || next ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link href={prev.permalink} className="card-interactive panel flex min-h-11 flex-col gap-1 p-4">
                  <span className="inline-flex items-center gap-1.5 text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                    이전 단원, {prev.unit}단원
                  </span>
                  <span className="text-body font-bold break-keep">{prev.title}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next ? (
                <Link href={next.permalink} className="card-interactive panel flex min-h-11 flex-col gap-1 p-4 sm:items-end sm:text-right">
                  <span className="inline-flex items-center gap-1.5 text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    다음 단원, {next.unit}단원
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                  <span className="text-body font-bold break-keep">{next.title}</span>
                </Link>
              ) : null}
            </div>
          ) : null}
          <Link href="/practice" className="card-interactive panel flex min-h-11 items-center justify-between gap-2 p-4 text-body font-bold">
            목록에서 완료 체크하기
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </nav>
      </article>
      <ReadingAssistant articleId={PRACTICE_ARTICLE_ID} />
    </main>
  );
}
```

- [ ] **Step 3: Server Action `src/app/practice/actions.ts`.**

```ts
'use server';

// 파이썬 손풀기 단원 완료 토글. basecamp/actions.ts와 같은 보안 계약이다: hasUnlockCookie()
// 재검증 다음, 알려진 단원 slug 검증 다음에만 setLessonCompletion()을 부른다. 진도는 pr:
// 접두사로 저장해 커리큘럼 진행률과 섞이지 않는다.

import { hasUnlockCookie } from '@/lib/auth';
import { setLessonCompletion } from '@/lib/progress-store';
import { getPracticeUnitBySlug, practiceProgressId } from '@/content/practice-helpers';

export async function togglePracticeUnit(slug: string, currentlyDone: boolean): Promise<void> {
  if (!(await hasUnlockCookie())) throw new Error('unauthorized');
  if (!getPracticeUnitBySlug(slug)) throw new Error('invalid practice unit');
  await setLessonCompletion(practiceProgressId(slug), !currentlyDone);
}
```

- [ ] **Step 4: 목록 클라이언트 `src/components/practice/practice-unit-list.tsx`.** 진행 막대 7칸, 단원 카드(링크) 옆에 완료 토글 버튼. 낙관적 갱신은 `src/components/basecamp/toggle-set.ts`의 `withToggled`, `withAdded`, `withRemoved`를 쓴다.

```tsx
'use client';

// 파이썬 손풀기 목록의 단원 카드와 완료 토글. 토글은 낙관적으로 뒤집고 togglePracticeUnit을
// 부른다. 실패하면 그 단원만 되돌리고 "저장하지 못했어요"를 보인다. 오프라인 대기열은 쓰지
// 않는다(목록은 개인 화면이라 오프라인 캐시 대상이 아니다).

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { togglePracticeUnit } from '@/app/practice/actions';
import { withToggled, withAdded, withRemoved } from '@/components/basecamp/toggle-set';

export type PracticeUnitCard = {
  slug: string;
  unit: number;
  title: string;
  feature: string;
  minutes: number;
  permalink: string;
};

export function PracticeUnitList({
  units,
  initialDone,
  unlocked,
}: {
  units: readonly PracticeUnitCard[];
  initialDone: readonly string[];
  unlocked: boolean;
}) {
  const [done, setDone] = useState<ReadonlySet<string>>(() => new Set(initialDone));
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const doneCount = units.filter((u) => done.has(u.slug)).length;

  async function toggle(slug: string) {
    if (pending.has(slug)) return;
    const wasDone = done.has(slug);
    setDone((p) => withToggled(p, slug, !wasDone));
    setPending((p) => withAdded(p, slug));
    setFailed((p) => withRemoved(p, slug));
    try {
      await togglePracticeUnit(slug, wasDone);
    } catch {
      setDone((p) => withToggled(p, slug, wasDone));
      setFailed((p) => withAdded(p, slug));
    } finally {
      setPending((p) => withRemoved(p, slug));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {unlocked ? (
        <div className="flex flex-col gap-2">
          <span className="text-label font-bold">{doneCount}/{units.length} 단원 완료</span>
          <div className="grid grid-cols-7 gap-1" aria-hidden="true">
            {units.map((u) => (
              <span key={u.slug} className={`h-2 ${done.has(u.slug) ? 'bg-foreground dark:bg-foreground-dark' : 'bg-line dark:bg-line-dark'}`} />
            ))}
          </div>
        </div>
      ) : null}
      <ol className="flex flex-col gap-3">
        {units.map((u) => {
          const isDone = done.has(u.slug);
          return (
            <li key={u.slug} className="flex items-stretch gap-2">
              <Link href={u.permalink} className="card-interactive panel flex min-h-11 min-w-0 flex-1 flex-col gap-1 p-4">
                <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {u.unit}단원, 약 {Math.round((u.minutes / 60) * 10) / 10}시간
                </span>
                <span className="text-heading font-extrabold break-keep">{u.title}</span>
                <span className="text-body font-normal break-keep">{u.feature}</span>
              </Link>
              {unlocked ? (
                <button
                  type="button"
                  onClick={() => toggle(u.slug)}
                  aria-pressed={isDone}
                  aria-label={`${u.unit}단원 ${isDone ? '완료 취소' : '완료 체크'}`}
                  className={`tap-feedback panel flex w-14 shrink-0 flex-col items-center justify-center gap-1 text-label font-bold ${isDone ? 'bg-foreground text-background dark:bg-foreground-dark dark:text-background-dark' : ''}`}
                >
                  <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {failed.has(u.slug) ? '실패' : isDone ? '완료' : '체크'}
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

(색 토큰 이름 `bg-foreground`, `bg-line`, `text-background`의 dark 짝은 `globals.css` `@theme`에서 실제 이름을 확인하고 맞춘다. `node scripts/check-design-tokens.mjs`로 새 경고가 없는지 본다.)

- [ ] **Step 5: 목록 페이지 `src/app/practice/page.tsx`.**

```tsx
import type { Metadata } from "next";
import { hasUnlockCookie } from "@/lib/auth";
import { readProgressRows } from "@/lib/progress-store";
import { PracticeUnitList } from "@/components/practice/practice-unit-list";
import { getOrderedPracticeUnits, PRACTICE_PROGRESS_PREFIX } from "@/content/practice-helpers";

export const metadata: Metadata = {
  title: "파이썬 손풀기",
  description: "개념은 짧게, 치는 시간은 길게. VS Code에서 가계부 CLI를 일주일 동안 직접 키우는 파이썬 실습.",
};

// 파이썬 손풀기 목록. 완료 체크(pr: 행)를 읽어야 해서 동적이다(베이스캠프 허브와 같은 계약).
// 정규 커리큘럼 진행률과 학습 일정에는 집계되지 않는다.
export const dynamic = "force-dynamic";

const PREP_ITEMS = [
  "VS Code와 Python 확장(Microsoft)",
  "uv (5회차 수업에서 설치)",
  "git과 GitHub 계정",
];

export default async function PracticeIndexPage() {
  const unlocked = await hasUnlockCookie();
  const progress = unlocked ? await readProgressRows() : null;
  const initialDone =
    progress?.ok
      ? progress.rows
          .filter((r) => r.lessonSlug.startsWith(PRACTICE_PROGRESS_PREFIX))
          .map((r) => r.lessonSlug.slice(PRACTICE_PROGRESS_PREFIX.length))
      : [];
  const units = getOrderedPracticeUnits().map((u) => ({
    slug: u.slug, unit: u.unit, title: u.title, feature: u.feature, minutes: u.minutes, permalink: u.permalink,
  }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="chip w-fit text-label font-bold">번외 실습</span>
        <h1 className="text-display font-black break-keep">파이썬 손풀기</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          개념은 짧게, 치는 시간은 길게. 하루 한 단원씩 VS Code에서 가계부 프로그램을 직접 키워요.
        </p>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          따라 치기 칸에는 복사 버튼이 없어요. 손으로 쳐야 손에 남으니까요. 단원이 끝날 때마다 커밋하고 GitHub에 올려요.
        </p>
      </header>

      <section className="panel flex flex-col gap-2 p-5">
        <h2 className="text-heading font-extrabold">시작 전 준비물</h2>
        <ul className="flex flex-col gap-1">
          {PREP_ITEMS.map((item) => (
            <li key={item} className="break-keep text-body font-normal">{item}</li>
          ))}
        </ul>
      </section>

      <PracticeUnitList units={units} initialDone={initialDone} unlocked={unlocked} />
    </main>
  );
}
```

- [ ] **Step 6: 아이콘과 메뉴.** `custom-icon.tsx` ICONS의 `concepts` 아래에 `practice: { body: "M2 6h20v12H2z", ink: "M6 10h1M10 10h1M14 10h1M18 10h1M7 14h10" },`(키보드). `site-nav.tsx` 더보기의 "AI 뜯어보기" 바로 위에

```ts
      // 번외 실습 "파이썬 손풀기"(/practice) — 가계부 CLI를 직접 키우는 실습. 진도와 격리.
      { label: "파이썬 손풀기", href: "/practice", icon: "practice" },
```

- [ ] **Step 7: 확인과 커밋.** `npx velite build`, `npx next typegen && npx tsc --noEmit -p .`, `npx eslint src/app/practice src/components/practice src/components/site-nav.tsx src/components/illustrations/custom-icon.tsx`, `node scripts/check-design-tokens.mjs 2>&1 | grep -i practice`(출력 없어야 함). dev 서버(3000)에서 `/practice`가 단원 0개로도 에러 없이 열리는지 본다.

```bash
git add src/app/practice src/components/practice src/components/illustrations/custom-icon.tsx src/components/site-nav.tsx
git commit -m "feat(practice): 파이썬 손풀기 목록과 단원 페이지"
```

### Task 4: 파일럿 1단원 "가계부 첫 줄 찍기"

**Files:**
- Create: `src/content/practice/01-first-entry.mdx`
- 실행 확인용(커밋하지 않음): `<scratchpad>/practice/` 아래 하네스와 단원 코드

**Interfaces:**
- Consumes: `TypeAlong`, `Hints`, `Hint`, `TwistBox`(기본 매핑), frontmatter 스키마(Task 1)
- Produces: 2단원 시작 코드 = 이 단원 혼자 치기 정답 `main.py`

- [ ] **Step 1: 실행 하네스.** `input()`에 넣은 값이 터미널처럼 화면에 보이게, 입력값을 받아 그대로 찍어 주는 래퍼를 scratchpad에 만든다.

```python
# <scratchpad>/practice/echo_run.py  사용: python echo_run.py main.py 값1 값2 ...
import builtins, runpy, sys
answers = iter(sys.argv[2:])
def fake_input(prompt=""):
    value = next(answers)
    print(f"{prompt}{value}")
    return value
builtins.input = fake_input
sys.argv = [sys.argv[1]]
runpy.run_path(sys.argv[0], run_name="__main__")
```

- [ ] **Step 2: 프로젝트 만들기 실측.** 환경: PATH 앞에 `<scratchpad>/uvpkg/bin`, `UV_CACHE_DIR`, `UV_PYTHON_INSTALL_DIR`를 scratchpad로, `GIT_CONFIG_GLOBAL=<scratchpad>/gitconfig-practice`(user.name, user.email만). `<scratchpad>/practice/work`에서 `uv init python-ledger` 실행, 출력과 생성 파일 목록(`ls -a`), `git -C python-ledger status`, `git branch` 결과를 기록한다(uv가 git 저장소를 만드는지, 기본 브랜치 이름이 무엇인지 실측). `uv run main.py` 출력 기록.
- [ ] **Step 3: 단원 코드 세 벌 실행.** `python-ledger/main.py`에 아래 단계별 코드를 차례로 넣고 하네스로 돌려 출력을 기록한다.
  - 따라 치기: 제목 한 줄 출력, `input("항목: ")`, `input("금액: ")`, `int()` 변환, f-string으로 `"{항목} {금액}원을 기록했어요."` 출력, `type()` 확인 줄 없음.
  - 고쳐 치기: 분류(`input("분류: ")`) 추가, 출력 꼴을 `[분류] 항목 금액원`으로.
  - 혼자 치기: 항목 두 개를 받아 각각 출력하고 합계 `오늘 합계: N원`. 확인 표용 입력 두 벌을 돌린다.
- [ ] **Step 4: 에러 실측.** 아래를 실제로 일으켜 트레이스백 원문을 기록한다.
  - 금액을 `int()`로 바꾸지 않고 `금액 + 1000` → `TypeError`
  - 금액에 `9천` 입력 → `ValueError: invalid literal for int() with base 10: '9천'`
  - 변수 이름 오타 → `NameError`
  - 들여쓰기 섞임 → `IndentationError`
- [ ] **Step 5: git 흐름 실측.** 같은 저장소에서 `git add .`, 커밋 세 번(따라, 고쳐, 혼자), `git log --oneline` 출력을 기록한다. GitHub push는 실측할 수 없으므로 명령과 "처음 push할 때 브라우저 로그인 창이 뜬다"는 안내만 쓰고 출력은 싣지 않는다. 원격 추가는 `git remote add origin https://github.com/<내아이디>/python-ledger.git`, 브랜치는 `git branch -M main` 후 `git push -u origin main`.
- [ ] **Step 6: 본문 작성.** frontmatter:

```yaml
---
title: "가계부 첫 줄 찍기"
unit: 1
slug: "01-first-entry"
summary: "VS Code와 uv로 가계부 프로젝트를 만들고, 항목과 금액을 받아 한 줄로 찍어요. 첫 커밋을 GitHub에 올리는 데까지 가요."
feature: "항목과 금액을 받아 한 줄로 출력"
concepts: ["변수", "자료형", "input", "print", "f-string"]
minutes: 150
---
```

  본문 h2는 정확히 다음 7개(칩이 이 이름을 쓴다):
  `## 1. 오늘 만들 것` / `## 2. 필요한 개념만` / `## 3. 따라 치기` / `## 4. 고쳐 치기` / `## 5. 혼자 치기` / `## 6. 자주 나는 에러` / `## 7. 커밋하고 올리기`
  - 1절 앞에 도입 두 문단과 "준비" 소제목(h3)으로 VS Code Python 확장 설치, 폴더 열기, 터미널 열기(``Ctrl+` ``), `uv init python-ledger`, `code python-ledger`(Step 2 실측 출력)를 둔다.
  - 2절: 변수, `str`과 `int`, `input()`은 항상 문자열, `int()`, f-string. 예제마다 2~5줄, 터미널 `uv run python` REPL에서 쳐 볼 수 있게.
  - 3절: `<TypeAlong>` 안에 따라 치기 코드, 그 아래 실행 결과(하네스 출력), 커밋 명령.
  - 4절: 요구사항 문단, `<Hints>` 안에 `<Hint>` 3개, 정답은 `<details><summary>정답 코드 보기</summary>...</details>`, 커밋 명령.
  - 5절: 요구사항, 확인 표(입력 두 벌과 기대 출력, 실측값), 정답 `<details>`, 커밋 명령. 마지막 줄에 "이 코드가 2단원의 시작 코드예요."
  - 6절: Step 4 에러 네 개, 각각 원문 블록 + "맨 아래 줄부터 읽어요" + 고치는 법.
  - 7절: GitHub에서 새 저장소 만들기(README 없이), 원격 추가, push, 처음 push할 때 로그인 창, `git log --oneline` 실측 출력. 마지막에 "목록에서 1단원 완료 체크".
- [ ] **Step 7: 게이트.** `npx velite build`(오류 없음), `node scripts/check-brand.mjs 2>&1 | grep -i practice`(출력 없음), `node scripts/check-font-glyph-coverage.mjs 2>&1 | tail -4`(새 누락 있으면 `node scripts/subset-font.mjs`), 본문에서 `·`, `—`, `─` 검색해 0건.
- [ ] **Step 8: 커밋.**

```bash
git add src/content/practice/01-first-entry.mdx
git commit -m "content(practice): 1단원 가계부 첫 줄 찍기"
```

### Task 5: 배포와 확인

- [ ] **Step 1: push.** `git push`. Vercel 배포(project prj_vfQdxdijytLkDFCGZKTmspCPVnyj)가 READY인지 확인. 실패면 빌드 로그를 읽고 고친다.
- [ ] **Step 2: 화면 확인.** 사용자 Chrome(소유자 로그인)에서 https://ai-engineer-hub-kr.vercel.app/practice 와 `/practice/01-first-entry`를 연다. iframe 폭 1024, 390에서 `scrollWidth === clientWidth`, 단계 칩 7개, 따라 치기 칸에 복사 버튼 대신 "직접 치기", 힌트가 하나씩 열림, 다른 코드 칸에는 복사 버튼이 그대로, 완료 토글이 눌렸다가 새로고침 후에도 유지, 다시 눌러 취소.
- [ ] **Step 3: 격리 확인.** 완료 체크 후 홈(`/`)의 진행률 숫자가 그대로인지 본다.
- [ ] **Step 4: 사용자 보고.** 아이패드에서 1단원 형식을 봐 달라고 요청. 승인 전까지 2~7단원은 쓰지 않는다.
