import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronDown, ClipboardCheck, Terminal } from "lucide-react";
import { hasUnlockCookie } from "@/lib/auth";
import { readProgressRows } from "@/lib/progress-store";
import { readReviewStates } from "@/lib/review-store";
import { GRADUATE_COUNT } from "@/lib/review";
import { classReviewId } from "@/lib/class-logic";
import { todayInSeoul } from "@/lib/today";
import { basecampProgressId } from "@/content/basecamp";
import { getOrderedClassLessons, groupClassLessonsByModule, type ClassLesson } from "@/content/class-lesson-helpers";
import { getClassSession } from "@/content/class-sessions";
import { buildClassSearchDocs } from "@/content/class-derived";
import { ClassChecklist } from "@/components/class/class-checklist";
import { ClassCalendar, type CalendarDay } from "@/components/class/class-calendar";
import { ClassSearch } from "@/components/class/class-search";
import { ClassPastLessonRow } from "@/components/class/class-past-lesson-row";
import { MistakeNoteLink } from "@/components/mistake-note-link";
import type { StepId } from "@/content/modules";

export const metadata: Metadata = {
  title: "수업 복습",
  description: "개강 후 매 수업 내용을 쉬운 말로 다시 풀어 쓴 복습 레슨. 회차마다 복습 체크리스트와 확인 퀴즈가 있어요.",
};

// 수업 복습 허브 — 베이스캠프 허브와 같은 이유로 동적 렌더(쿠키, 진도 조회). 체크 진도는
// progress 테이블의 bc: 접두사 행에서, 간격 복습 상태는 lesson_review의 class: 행에서 읽는다.
// 2026-10-27: 회차가 매일 쌓이므로 지난 수업을 커리큘럼 모듈별로 접고, 달력, 회차 검색,
// 종합 퀴즈와 명령어 모음 바로가기를 더했다(docs/superpowers/specs/2026-10-27-class-data-structure-design.md).
export const dynamic = "force-dynamic";

// 모듈 머리에 그 모듈이 속한 Step 색을 왼쪽 굵은 선으로 얹는다(bookmarks 페이지와 같은 리터럴).
const STEP_HEADER_CLASSES: Record<StepId, string> = {
  1: "bg-surface-2 border-l-4 border-l-step-1 dark:bg-surface-2-dark dark:border-l-step-1-dark",
  2: "bg-surface-2 border-l-4 border-l-step-2 dark:bg-surface-2-dark dark:border-l-step-2-dark",
  3: "bg-surface-2 border-l-4 border-l-step-3 dark:bg-surface-2-dark dark:border-l-step-3-dark",
};

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}월 ${d}일`;
}

function LessonCard({ lesson, quizCount }: { lesson: ClassLesson; quizCount: number }) {
  return (
    <Link href={lesson.permalink} className="card-interactive panel flex flex-col gap-2 p-5">
      <span className="flex flex-wrap items-center gap-2">
        <span className="chip text-label font-bold">{lesson.session}회차</span>
        <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {formatDate(lesson.date)} 수업, {lesson.topic}
        </span>
      </span>
      <span className="text-heading font-extrabold break-keep">{lesson.title}</span>
      <span className="break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
        {lesson.summary}
      </span>
      <span className="mt-1 inline-flex items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark">
        레슨 읽기{quizCount > 0 ? `, 확인 퀴즈 ${quizCount}문항` : ""}
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </span>
    </Link>
  );
}

const TOOLS = [
  { href: "/class/quiz", label: "종합 퀴즈", desc: "여러 회차를 섞어 풀기", Icon: ClipboardCheck },
  { href: "/class/commands", label: "명령어 모음", desc: "배운 명령어 찾기", Icon: Terminal },
  { href: "/glossary", label: "용어집", desc: "수업 용어도 함께", Icon: BookOpen },
] as const;

export default async function ClassHubPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const unlocked = await hasUnlockCookie();
  const [progressRead, reviewRead] = unlocked
    ? await Promise.all([readProgressRows(), readReviewStates()])
    : [null, null];
  const doneRawIds = new Set(progressRead?.ok ? progressRead.rows.map((row) => row.lessonSlug) : []);
  const today = todayInSeoul();

  // 최근 수업이 맨 위. 지난 수업은 그 아래 모듈별 묶음으로 쌓인다.
  const lessons = getOrderedClassLessons().reverse();
  const [latest, ...past] = lessons;
  const latestSession = latest ? getClassSession(latest.slug) : undefined;
  const pastGroups = groupClassLessonsByModule(past);

  function checkCount(slug: string): { done: number; total: number } {
    const checklist = getClassSession(slug)?.checklist ?? [];
    return {
      done: checklist.filter((item) => doneRawIds.has(basecampProgressId(item.id))).length,
      total: checklist.length,
    };
  }

  // 달력 칸 데이터. 진도를 못 읽었으면 체크 비율은 null(농도 없이 테두리만).
  const calendarDays = new Map<string, CalendarDay>();
  for (const lesson of lessons) {
    const { done, total } = checkCount(lesson.slug);
    const reviewCount = reviewRead?.ok ? (reviewRead.states.get(classReviewId(lesson.slug))?.reviewCount ?? 0) : 0;
    calendarDays.set(lesson.date, {
      session: lesson.session,
      href: lesson.permalink,
      title: lesson.title,
      checkRatio: progressRead?.ok && total > 0 ? done / total : null,
      graduated: reviewCount >= GRADUATE_COUNT,
    });
  }

  // 달력의 달(?cal=YYYY-MM). 첫 수업이 있던 달부터 이번 달(또는 마지막 수업 달)까지만 옮긴다.
  const thisMonth = today.slice(0, 7);
  const classMonths = lessons.map((l) => l.date.slice(0, 7)).sort();
  const minMonth = classMonths[0] ?? thisMonth;
  const maxMonth = classMonths.length > 0 && classMonths[classMonths.length - 1] > thisMonth ? classMonths[classMonths.length - 1] : thisMonth;
  const requested = typeof params.cal === "string" && /^\d{4}-\d{2}$/.test(params.cal) ? params.cal : thisMonth;
  const calendarMonth = requested < minMonth ? minMonth : requested > maxMonth ? maxMonth : requested;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="chip-solid w-fit text-label font-bold">최우선</span>
        <h1 className="text-display font-black break-keep">수업 복습</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          개강 후 수업마다 배운 내용을 쉬운 말로 다시 풀어 썼어요. 레슨을 읽고, 복습 체크리스트를
          채우고, 확인 퀴즈로 꺼내 보면서 그날 수업을 내 것으로 만들어요.
        </p>
      </header>

      <nav aria-label="수업 복습 도구" className="grid gap-3 sm:grid-cols-3">
        {TOOLS.map(({ href, label, desc, Icon }) => (
          <Link key={href} href={href} className="card-interactive panel flex min-h-11 items-center gap-3 p-4">
            <Icon className="h-5 w-5 shrink-0 text-accent dark:text-accent-dark" aria-hidden="true" />
            <span className="flex min-w-0 flex-col">
              <span className="text-body font-bold break-keep">{label}</span>
              <span className="text-label font-normal break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {desc}
              </span>
            </span>
          </Link>
        ))}
      </nav>

      {lessons.length > 0 ? <ClassCalendar days={calendarDays} today={today} month={calendarMonth} minMonth={minMonth} maxMonth={maxMonth} /> : null}

      <ClassSearch docs={buildClassSearchDocs()}>
        {latest ? (
          <section className="flex flex-col gap-3">
            <span className="w-fit text-label font-bold text-accent dark:text-accent-dark">최근 수업</span>
            <LessonCard lesson={latest} quizCount={latestSession?.quiz.length ?? 0} />
            {latestSession && latestSession.checklist.length > 0 ? (
              <div className="flex flex-col gap-3 pt-2">
                <h2 className="text-subhead font-extrabold break-keep">오늘의 복습 체크리스트</h2>
                <ClassChecklist
                  items={latestSession.checklist}
                  initialDoneIds={latestSession.checklist
                    .filter((item) => doneRawIds.has(basecampProgressId(item.id)))
                    .map((item) => item.id)}
                  unlocked={unlocked}
                />
              </div>
            ) : null}
            <MistakeNoteLink prefix="cl:" variant="link" label="수업 복습 오답 노트" />
          </section>
        ) : (
          <p className="panel p-5 text-body break-keep">아직 정리된 수업이 없어요.</p>
        )}

        {pastGroups.length > 0 ? (
          <section className="flex flex-col gap-3" aria-labelledby="class-past-heading">
            <h2
              id="class-past-heading"
              className="text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark"
            >
              지난 수업
            </h2>
            {pastGroups.map(({ module: mod, step, lessons: groupLessons }) => {
              const counts = groupLessons.map((l) => checkCount(l.slug));
              const done = counts.reduce((sum, c) => sum + c.done, 0);
              const total = counts.reduce((sum, c) => sum + c.total, 0);
              return (
                <details key={mod.id} open={latest?.module === mod.id} className="panel group overflow-hidden">
                  <summary
                    className={`flex min-h-11 cursor-pointer list-none flex-col items-start gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${STEP_HEADER_CLASSES[step.id]}`}
                  >
                    <span className="min-w-0 text-subhead font-bold break-keep">
                      {mod.id} {mod.title}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-label font-normal">
                      <span>{groupLessons.length}개 회차</span>
                      {progressRead?.ok && total > 0 ? (
                        <span className="text-badge-neutral-text dark:text-badge-neutral-text-dark">
                          체크 {done}/{total}
                        </span>
                      ) : null}
                      <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                    </span>
                  </summary>
                  <ul className="flex flex-col px-4 py-1">
                    {groupLessons
                      .slice()
                      .reverse()
                      .map((lesson) => {
                        const checklist = getClassSession(lesson.slug)?.checklist ?? [];
                        return (
                          <ClassPastLessonRow
                            key={lesson.slug}
                            href={lesson.permalink}
                            session={lesson.session}
                            title={lesson.title}
                            dateLabel={formatDate(lesson.date)}
                            checklist={checklist}
                            initialDoneIds={checklist
                              .filter((item) => doneRawIds.has(basecampProgressId(item.id)))
                              .map((item) => item.id)}
                            unlocked={unlocked && Boolean(progressRead?.ok)}
                          />
                        );
                      })}
                  </ul>
                </details>
              );
            })}
          </section>
        ) : null}
      </ClassSearch>
    </main>
  );
}
