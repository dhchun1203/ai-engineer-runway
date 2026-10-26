import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { hasUnlockCookie } from "@/lib/auth";
import { readProgressRows } from "@/lib/progress-store";
import { basecampProgressId } from "@/content/basecamp";
import { getOrderedClassLessons, type ClassLesson } from "@/content/class-lesson-helpers";
import { getClassSession } from "@/content/class-sessions";
import { ClassChecklist } from "@/components/class/class-checklist";
import { MistakeNoteLink } from "@/components/mistake-note-link";

export const metadata: Metadata = {
  title: "수업 복습",
  description: "개강 후 매 수업 내용을 쉬운 말로 다시 풀어 쓴 복습 레슨. 회차마다 복습 체크리스트와 확인 퀴즈가 있어요.",
};

// 수업 복습 허브 — 베이스캠프 허브와 같은 이유로 동적 렌더(쿠키, 진도 조회). 체크 진도는
// progress 테이블의 bc: 접두사 행에서 읽는다(class-sessions.ts 주석 참고).
export const dynamic = "force-dynamic";

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
          {formatDate(lesson.date)} 수업
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

export default async function ClassHubPage() {
  const unlocked = await hasUnlockCookie();
  const progressRead = unlocked ? await readProgressRows() : null;
  const doneRawIds = new Set(progressRead?.ok ? progressRead.rows.map((row) => row.lessonSlug) : []);

  // 최근 수업이 맨 위. 지난 수업은 그 아래 카드 목록으로 쌓인다.
  const lessons = getOrderedClassLessons().reverse();
  const [latest, ...past] = lessons;
  const latestSession = latest ? getClassSession(latest.slug) : undefined;

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

      {past.length > 0 ? (
        <section className="flex flex-col gap-3">
          <span className="text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
            지난 수업
          </span>
          {past.map((lesson) => (
            <LessonCard
              key={lesson.slug}
              lesson={lesson}
              quizCount={getClassSession(lesson.slug)?.quiz.length ?? 0}
            />
          ))}
        </section>
      ) : null}
    </main>
  );
}
