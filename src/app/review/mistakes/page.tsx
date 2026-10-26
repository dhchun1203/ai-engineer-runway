import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { hasUnlockCookie } from "@/lib/auth";
import { readQuizMistakes, type QuizMistakeRow } from "@/lib/quiz-mistake-store";
import { resolveQuizKey, type ResolvedQuizQuestion } from "@/lib/quiz-mistake-resolve";
import { MISTAKE_CLEAR_STREAK } from "@/lib/quiz-mistake-key";
import { basecampReviewSteps } from "@/content/basecamp-review";
import { BasecampQuizSet } from "@/components/basecamp/basecamp-quiz-set";

export const metadata: Metadata = {
  title: "오답 노트",
  description: "객관식 퀴즈에서 틀린 문제를 모아 다시 푸는 곳. 두 번 연속 맞히면 오답 노트에서 빠져요.",
};

// 오답 노트 — 베이스캠프 복습 퀴즈와 /review 레슨 객관식에서 틀린 문제를 계정별로 모아
// 다시 풀게 한다. 사용자별 데이터라 요청마다 렌더한다. 이 화면에서 푼 답도 같은 Server
// Action으로 기록되므로, 여기서 두 번 연속 맞히면 다음에 열 때 목록에서 빠져 있다(풀고 있는
// 도중에는 목록을 바꾸지 않는다, 문제가 눈앞에서 사라지지 않게).

export const dynamic = "force-dynamic";

type Item = { row: QuizMistakeRow; resolved: ResolvedQuizQuestion };
type Group = { id: string; label: string; studyHref: string; studyLabel: string; items: Item[] };

function groupItems(items: Item[], order: (a: Group, b: Group) => number): Group[] {
  const map = new Map<string, Group>();
  for (const item of items) {
    const r = item.resolved;
    const group = map.get(r.groupId) ?? {
      id: r.groupId,
      label: r.groupLabel,
      studyHref: r.studyHref,
      studyLabel: r.studyLabel,
      items: [],
    };
    group.items.push(item);
    map.set(r.groupId, group);
  }
  return [...map.values()].sort(order);
}

function noteFor(row: QuizMistakeRow): string {
  const streak =
    row.correctStreak > 0 ? `, 연속 정답 ${row.correctStreak}/${MISTAKE_CLEAR_STREAK}` : "";
  return `틀린 횟수 ${row.wrongCount}번${streak}`;
}

function GroupPanel({ group }: { group: Group }) {
  return (
    <section className="panel flex flex-col gap-4 p-5">
      <header className="flex flex-col gap-1">
        <h3 className="text-heading font-extrabold break-keep">{group.label}</h3>
        <Link
          href={group.studyHref}
          className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark"
        >
          {group.studyLabel}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </header>
      <BasecampQuizSet
        questions={group.items.map((item) => item.resolved.question)}
        keys={group.items.map((item) => item.resolved.key)}
        notes={group.items.map((item) => noteFor(item.row))}
      />
    </section>
  );
}

export default async function QuizMistakesPage() {
  const unlocked = await hasUnlockCookie();
  const read = unlocked ? await readQuizMistakes() : null;

  const items: Item[] = (read?.ok ? read.rows : [])
    .map((row) => {
      const resolved = resolveQuizKey(row.key);
      return resolved ? { row, resolved } : null;
    })
    .filter((item): item is Item => item !== null);

  const stepOrder = new Map(basecampReviewSteps.map((step, i) => [step.id, i]));
  const basecampGroups = groupItems(
    items.filter((item) => item.resolved.source === "basecamp"),
    (a, b) => (stepOrder.get(a.id) ?? 0) - (stepOrder.get(b.id) ?? 0),
  );
  // 레슨 묶음은 가장 최근에 틀린 문제가 있는 레슨부터(읽기 결과가 최근순이라 처음 등장 순서 유지).
  const reviewGroups = groupItems(
    items.filter((item) => item.resolved.source === "review"),
    () => 0,
  );
  // 수업 복습 묶음은 최근 수업이 위로(slug가 회차 번호로 시작해 내림차순이 곧 최근순).
  const classGroups = groupItems(
    items.filter((item) => item.resolved.source === "class"),
    (a, b) => b.id.localeCompare(a.id),
  );
  const basecampCount = basecampGroups.reduce((n, g) => n + g.items.length, 0);
  const reviewCount = reviewGroups.reduce((n, g) => n + g.items.length, 0);
  const classCount = classGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-x-4">
          <Link
            href="/basecamp/quiz"
            className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            베이스캠프 복습 퀴즈
          </Link>
          <Link
            href="/review"
            className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            오늘의 복습
          </Link>
        </div>
        <span className="chip w-fit text-label font-bold">복습</span>
        <h1 className="text-display font-black break-keep">오답 노트</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          객관식 퀴즈에서 틀린 문제가 여기 모여요. 다시 풀어서 {MISTAKE_CLEAR_STREAK}번 연속 맞히면 오답
          노트에서 빠져요. 여기서 푼 결과도 바로 기록되고, 다음에 이 화면을 열 때 반영돼요.
        </p>
        {items.length > 0 ? (
          <p className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
            모두 {items.length}문제
            {classCount > 0 ? (
              <>
                <span className="mx-2" aria-hidden="true">|</span>
                수업 복습 {classCount}문제
              </>
            ) : null}
            <span className="mx-2" aria-hidden="true">|</span>
            베이스캠프 {basecampCount}문제
            <span className="mx-2" aria-hidden="true">|</span>
            레슨 복습 {reviewCount}문제
          </p>
        ) : null}
      </header>

      {!unlocked ? (
        <p className="panel p-5 text-body break-keep">로그인하면 내 오답 노트를 볼 수 있어요.</p>
      ) : read && !read.ok ? (
        <p className="panel p-5 text-body break-keep">오답 노트를 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.</p>
      ) : items.length === 0 ? (
        <section className="panel flex flex-col gap-3 p-5">
          <p className="text-body font-bold break-keep">아직 틀린 문제가 없어요.</p>
          <p className="text-body leading-relaxed break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
            베이스캠프 복습 퀴즈나 오늘의 복습의 객관식에서 틀린 문제가 생기면 여기 모여요.
          </p>
          <Link href="/basecamp/quiz" className="btn tap-feedback w-fit text-label">
            베이스캠프 복습 퀴즈 풀기
          </Link>
        </section>
      ) : (
        <>
          {classGroups.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-subhead font-extrabold break-keep">수업 복습 퀴즈</h2>
              {classGroups.map((group) => (
                <GroupPanel key={group.id} group={group} />
              ))}
            </section>
          ) : null}
          {basecampGroups.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-subhead font-extrabold break-keep">베이스캠프 복습 퀴즈</h2>
              {basecampGroups.map((group) => (
                <GroupPanel key={group.id} group={group} />
              ))}
            </section>
          ) : null}
          {reviewGroups.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-subhead font-extrabold break-keep">레슨 복습 객관식</h2>
              {reviewGroups.map((group) => (
                <GroupPanel key={group.id} group={group} />
              ))}
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
