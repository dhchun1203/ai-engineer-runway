import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { hasUnlockCookie } from "@/lib/auth";
import { todayInSeoul } from "@/lib/today";
import { readQuizAttempts } from "@/lib/quiz-attempt-store";
import { classAttemptStates } from "@/lib/class-review";
import { pickQuizRefs, seoulWeekRange, type QuizRef } from "@/lib/class-logic";
import { classQuizKey } from "@/lib/quiz-mistake-key";
import { getOrderedClassLessons, groupClassLessonsByModule, type ClassLesson } from "@/content/class-lesson-helpers";
import { getClassQuizQuestion, getClassSession } from "@/content/class-sessions";
import { BasecampQuizSet } from "@/components/basecamp/basecamp-quiz-set";
import { ClassExamQuiz } from "@/components/class/class-exam-quiz";
import { MistakeNoteLink } from "@/components/mistake-note-link";

export const metadata: Metadata = {
  title: "종합 퀴즈 | 수업 복습",
  description: "여러 수업 회차의 확인 퀴즈를 섞어 풀어요. 이번 주, 지난주, 모듈별, 틀린 문제만 골라 연습하거나 시험처럼 풀 수 있어요.",
};

// 수업 종합 퀴즈(2026-10-27, 설계 3.5). 범위(scope)와 방식(mode)을 주소로 받는다.
// 틀린 문제와 기록이 계정마다 달라 동적 렌더다. 문항은 틀림 → 안 푼 것 → 맞힘 순으로
// 최대 QUIZ_LIMIT개, 오늘 날짜와 범위로 고정한 순서라 같은 날 다시 열면 같은 문항이 나온다.
export const dynamic = "force-dynamic";

const QUIZ_LIMIT = 20;

type Scope = { kind: "week" } | { kind: "prev" } | { kind: "all" } | { kind: "wrong" } | { kind: "module"; id: string };

function parseScope(raw: string | undefined, moduleIds: ReadonlySet<string>): Scope {
  if (raw === "prev" || raw === "all" || raw === "wrong") return { kind: raw };
  if (raw?.startsWith("module-") && moduleIds.has(raw.slice(7))) return { kind: "module", id: raw.slice(7) };
  return { kind: "week" };
}

function scopeParam(scope: Scope): string {
  return scope.kind === "module" ? `module-${scope.id}` : scope.kind;
}

function formatDay(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}월 ${d}일`;
}

function chipClass(active: boolean): string {
  return `${active ? "chip-solid" : "chip"} tap-feedback min-h-11 items-center text-label font-bold break-keep`;
}

export default async function ClassQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const unlocked = await hasUnlockCookie();
  const today = todayInSeoul();
  const groups = groupClassLessonsByModule();
  const scope = parseScope(
    typeof params.scope === "string" ? params.scope : undefined,
    new Set(groups.map((g) => g.module.id)),
  );
  const mode = params.mode === "exam" ? "exam" : "practice";

  const attemptsRead = unlocked ? await readQuizAttempts() : null;
  const attempts = classAttemptStates(attemptsRead?.ok ? attemptsRead.rows : []);

  // 범위 안의 회차(수업 날짜가 오늘 이후인 회차는 아직 열리지 않았으니 뺀다).
  const opened = getOrderedClassLessons().filter((l) => l.date <= today);
  let lessons: ClassLesson[] = opened;
  let rangeText = "지금까지 정리된 모든 수업";
  if (scope.kind === "week" || scope.kind === "prev") {
    const { start, end } = seoulWeekRange(today, scope.kind === "week" ? 0 : -1);
    lessons = opened.filter((l) => l.date >= start && l.date <= end);
    rangeText = `${formatDay(start)}부터 ${formatDay(end)}까지 수업`;
  } else if (scope.kind === "module") {
    const group = groups.find((g) => g.module.id === scope.id);
    lessons = opened.filter((l) => l.module === scope.id);
    rangeText = group ? `${group.module.id} ${group.module.title} 수업` : rangeText;
  } else if (scope.kind === "wrong") {
    rangeText = "지난번에 틀린 문제";
  }

  let refs: QuizRef[] = lessons.flatMap((l) => (getClassSession(l.slug)?.quiz ?? []).map((q) => ({ slug: l.slug, id: q.id })));
  if (scope.kind === "wrong") refs = refs.filter((r) => attempts.get(classQuizKey(r.slug, r.id)) === "wrong");
  const picked = pickQuizRefs(refs, attempts, `${today}:${scopeParam(scope)}`, QUIZ_LIMIT);

  const lessonBySlug = new Map(opened.map((l) => [l.slug, l]));
  const items = picked.flatMap((ref) => {
    const q = getClassQuizQuestion(ref.slug, ref.id);
    const lesson = lessonBySlug.get(ref.slug);
    return q && lesson ? [{ q, key: classQuizKey(ref.slug, ref.id), label: `${lesson.session}회차 ${lesson.title}` }] : [];
  });
  const sessionCount = new Set(picked.map((r) => r.slug)).size;

  const scopeLinks: { label: string; scope: Scope }[] = [
    { label: "이번 주", scope: { kind: "week" } },
    { label: "지난주", scope: { kind: "prev" } },
    ...groups.map((g) => ({ label: `${g.module.id} ${g.module.title}`, scope: { kind: "module", id: g.module.id } as Scope })),
    { label: "전체", scope: { kind: "all" } },
    { label: "틀린 문제만", scope: { kind: "wrong" } },
  ];
  const href = (s: Scope, m: string) => `/class/quiz?scope=${scopeParam(s)}${m === "exam" ? "&mode=exam" : ""}`;

  let empty: string | null = null;
  if (items.length === 0) {
    if (scope.kind === "wrong") {
      empty = unlocked
        ? "지금은 틀린 문제가 없어요. 다른 범위로 풀어 보세요."
        : "틀린 문제만 모아 풀려면 로그인해 주세요. 상단 메뉴의 계정에서 로그인할 수 있어요.";
    } else if (scope.kind === "week") {
      empty = "이번 주에 정리된 수업이 아직 없어요. 지난주나 전체로 풀어 보세요.";
    } else if (scope.kind === "prev") {
      empty = "지난주에 정리된 수업이 없어요. 이번 주나 전체로 풀어 보세요.";
    } else {
      empty = "이 범위에는 아직 풀 문제가 없어요.";
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/class"
          className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          수업 복습
        </Link>
        <h1 className="text-display font-black break-keep">종합 퀴즈</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          여러 회차의 확인 퀴즈를 섞어 풀어요. 지난번에 틀린 문제와 아직 안 푼 문제가 먼저 나와요.
        </p>
      </header>

      <section className="flex flex-col gap-4" aria-label="퀴즈 범위와 방식">
        <div className="flex flex-col gap-2">
          <span className="text-label font-bold">범위</span>
          <nav aria-label="퀴즈 범위" className="flex flex-wrap gap-2">
            {scopeLinks.map((link) => (
              <Link
                key={scopeParam(link.scope)}
                href={href(link.scope, mode)}
                aria-current={scopeParam(link.scope) === scopeParam(scope) ? "page" : undefined}
                className={chipClass(scopeParam(link.scope) === scopeParam(scope))}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-label font-bold">방식</span>
          <nav aria-label="푸는 방식" className="flex flex-wrap gap-2">
            <Link href={href(scope, "practice")} aria-current={mode === "practice" ? "page" : undefined} className={chipClass(mode === "practice")}>
              연습 (고르면 바로 채점)
            </Link>
            <Link href={href(scope, "exam")} aria-current={mode === "exam" ? "page" : undefined} className={chipClass(mode === "exam")}>
              시험 (다 풀고 채점)
            </Link>
          </nav>
        </div>
      </section>

      {empty ? (
        <p className="panel p-5 text-body break-keep">{empty}</p>
      ) : (
        <section className="panel flex flex-col gap-4 p-5" aria-labelledby="class-quiz-heading">
          <header className="flex flex-col gap-1.5">
            <span className="text-label font-bold text-accent dark:text-accent-dark">
              {mode === "exam" ? "시험 모드" : "연습 모드"}
            </span>
            <h2 id="class-quiz-heading" className="text-heading font-extrabold break-keep">
              {rangeText}
            </h2>
            <p className="break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
              {sessionCount}개 회차에서 {items.length}문항
              {refs.length > items.length ? `을 골랐어요(전체 ${refs.length}문항). 내일은 다른 문항이 먼저 나올 수 있어요.` : "이에요."}
            </p>
          </header>
          {mode === "exam" ? (
            <ClassExamQuiz
              key={`exam-${scopeParam(scope)}`}
              questions={items.map((i) => i.q)}
              keys={items.map((i) => i.key)}
              labels={items.map((i) => i.label)}
              canRecord={unlocked}
            />
          ) : (
            <BasecampQuizSet
              key={`practice-${scopeParam(scope)}`}
              questions={items.map((i) => i.q)}
              keys={items.map((i) => i.key)}
              labels={items.map((i) => i.label)}
            />
          )}
          <MistakeNoteLink prefix="cl:" variant="link" label="수업 복습 오답 노트" />
        </section>
      )}
    </main>
  );
}
