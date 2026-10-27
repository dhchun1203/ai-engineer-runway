import Link from "next/link";
import { hasUnlockCookie } from "@/lib/auth";
import { readProgressRows } from "@/lib/progress-store";
import { readReviewStates } from "@/lib/review-store";
import { selectReviewQuestions, SELF_CHECK_ANCHOR } from "@/lib/review";
import { getLessonBySlug, getOrderedLessons } from "@/content/curriculum-helpers";
import { todayInSeoul } from "@/lib/today";
import { ReviewJudgmentButtons } from "@/components/review-judgment-buttons";
import { ReviewQuizBlock } from "@/components/review-quiz-block";
import { getReviewQuiz } from "@/content/review-quiz";
import { reviewQuizKey } from "@/lib/quiz-mistake-key";
import { MistakeNoteLink } from "@/components/mistake-note-link";
import { SpotIllustration } from "@/components/illustrations/spot-illustration";
import { BasecampQuizSet } from "@/components/basecamp/basecamp-quiz-set";
import { ClassReviewDoneButton } from "@/components/class/class-review-done-button";
import { readQuizAttempts } from "@/lib/quiz-attempt-store";
import { classAttemptStates, computeDueClassSessions, pickSessionQuestions, type DueClassSession } from "@/lib/class-review";
import { classQuizKey } from "@/lib/quiz-mistake-key";
import { GRADUATE_COUNT } from "@/lib/review";
import type { ClassQuizQuestion } from "@/content/class-sessions";

// /review 복습 세션(quick 260901-w04, 설계는
// .planning/research/edu-sites/round2-h-review-design.md V2절). 홈(page.tsx)과
// 같은 조립 순서를 재사용한다 — hasUnlockCookie() 최우선 → readProgressRows →
// readReviewStates. 쿠키가 있어야만 진도·복습 상태에 접근하므로, 홈처럼
// 동적 렌더가 필요하다(조건부 쿠키 접근이 캐시된 응답을 내보내는 문제 회피).
export const dynamic = "force-dynamic";

type Lesson = NonNullable<ReturnType<typeof getLessonBySlug>>;

type QuestionCard = { lesson: Lesson; questionIndex: number; text: string };

/** 회차 하나의 간격 복습에서 낼 문항 수. */
const CLASS_REVIEW_QUESTIONS = 5;

type ClassDueCard = { due: DueClassSession; questions: ClassQuizQuestion[] };

// 수업 회차 간격 복습(2026-10-27, src/lib/class-review.ts). 회차마다 문항 몇 개를 다시 풀고
// "복습 완료"로 사다리를 한 칸 올린다. 풀이는 오답 노트와 풀이 기록에 그대로 쌓인다.
function ClassDueSection({ cards }: { cards: ClassDueCard[] }) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="class-review-heading">
      <div className="flex flex-col gap-1.5">
        <h2 id="class-review-heading" className="text-heading font-extrabold break-keep">
          수업 다시 꺼내 보기{" "}
          <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            {cards.length}개
          </span>
        </h2>
        <p className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          수업 다음 날, 3일 뒤, 7일 뒤에 그 회차 문제를 다시 꺼내요. 다 풀었으면 복습 완료를 눌러 주세요.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {cards.map(({ due, questions }) => (
          <li key={due.lesson.slug} className="panel flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip text-label font-bold">{due.lesson.session}회차</span>
              <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {due.rung}/{GRADUATE_COUNT}번째 복습
              </span>
            </div>
            <span className="text-subhead font-extrabold break-keep">{due.lesson.title}</span>
            {questions.length > 0 ? (
              <BasecampQuizSet
                questions={questions}
                keys={questions.map((q) => classQuizKey(due.lesson.slug, q.id))}
              />
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ClassReviewDoneButton slug={due.lesson.slug} />
              <Link href={due.lesson.permalink} className="chip tap-feedback min-h-11 w-fit items-center">
                레슨 다시 보기
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="panel-hero flex items-center justify-between gap-6 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-display font-black">복습</h1>
          <p className="text-body font-normal">{message}</p>
        </div>
        <SpotIllustration name="review" className="hidden w-24 lg:w-28 shrink-0 sm:block" />
      </header>
    </main>
  );
}

function QuestionListItem({ card }: { card: QuestionCard }) {
  // 자가진단(주관식)과 나란히 붙는 객관식 3문항(quick 260906). 없는 문항은
  // 빈 배열이라 기존 자가진단만 보인다(파일럿 외 레슨).
  const quiz = getReviewQuiz(card.lesson.slug, card.questionIndex);
  return (
    <li className="panel flex flex-col gap-3 p-4">
      <p className="text-body font-normal">{card.text}</p>
      {quiz.length > 0 ? (
        <ReviewQuizBlock
          questions={quiz}
          keys={quiz.map((_, i) => reviewQuizKey(card.lesson.slug, card.questionIndex, i))}
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReviewJudgmentButtons lessonSlug={card.lesson.slug} questionIndex={card.questionIndex} />
        <Link
          href={`/lesson/${card.lesson.slug}#${SELF_CHECK_ANCHOR}`}
          className="chip tap-feedback min-h-11 w-fit items-center"
        >
          레슨에서 확인: {card.lesson.title}
        </Link>
      </div>
    </li>
  );
}

export default async function ReviewPage() {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다 — 홈·레슨 페이지와 동일한
  // 게이트 순서(D8-P 원칙 승계).
  const unlocked = await hasUnlockCookie();
  if (!unlocked) {
    return (
      <EmptyState message="복습 세션은 로그인 후 이용할 수 있어요. 상단 메뉴 '계정'에서 로그인해 주세요." />
    );
  }

  const progressRead = await readProgressRows();
  if (!progressRead.ok) {
    return <EmptyState message="진도를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." />;
  }

  const reviewRead = await readReviewStates();
  if (!reviewRead.ok) {
    return <EmptyState message="복습 상태를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." />;
  }

  const today = todayInSeoul();
  const seoulDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });
  const completedDateBySlug = new Map(
    progressRead.rows.map((row) => [row.lessonSlug, seoulDate.format(new Date(row.completedAt))]),
  );

  // 완료 + selfCheck 문항이 있는 레슨만 후보 questionCountBySlug에 넣는다 —
  // selectReviewQuestions의 계약(완료+문항 있는 레슨만 후보)을 호출부가 지킨다.
  const questionCountBySlug = new Map<string, number>();
  for (const lesson of getOrderedLessons()) {
    if (completedDateBySlug.has(lesson.slug) && lesson.selfCheck.length > 0) {
      questionCountBySlug.set(lesson.slug, lesson.selfCheck.length);
    }
  }

  const refs = selectReviewQuestions(completedDateBySlug, reviewRead.states, today, questionCountBySlug);

  // getLessonBySlug/selfCheck 조회 실패는 조용히 제외한다(홈 behindRows와 같은
  // 방어적 필터링 원칙).
  const sessionCards: QuestionCard[] = refs
    .map((ref) => {
      const lesson = getLessonBySlug(ref.lessonSlug);
      const text = lesson?.selfCheck[ref.questionIndex];
      return lesson && text !== undefined ? { lesson, questionIndex: ref.questionIndex, text } : null;
    })
    .filter((card): card is QuestionCard => card !== null);

  // 오답 모아보기 — states 중 missedQ가 비지 않은 레슨을 전부 순회한다(완료 여부와
  // 무관 — 복습 이력은 완료 취소 후에도 남는다는 review.ts F2 설계 그대로).
  const missedCards: QuestionCard[] = [...reviewRead.states.entries()].flatMap(([slug, state]) => {
    const lesson = getLessonBySlug(slug);
    if (!lesson) return [];
    const missedQ = state.missedQ ?? [];
    return missedQ
      .filter((i) => i < lesson.selfCheck.length)
      .map((i) => ({ lesson, questionIndex: i, text: lesson.selfCheck[i] }));
  });

  // 수업 회차 간격 복습. 풀이 기록을 못 읽으면 안 푼 문항 기준으로만 고른다.
  const classDue = computeDueClassSessions(reviewRead.states, today);
  const attemptsRead = classDue.length > 0 ? await readQuizAttempts() : null;
  const attempts = classAttemptStates(attemptsRead?.ok ? attemptsRead.rows : []);
  const classCards: ClassDueCard[] = classDue.map((due) => ({
    due,
    questions: pickSessionQuestions(due.lesson.slug, attempts, today, CLASS_REVIEW_QUESTIONS),
  }));

  if (sessionCards.length === 0 && missedCards.length === 0 && classCards.length === 0) {
    return (
      <EmptyState message="아직 복습할 문항이 없어요. 레슨을 완료하면 여기서 스스로 점검 문제를 다시 풀 수 있어요." />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="panel-hero flex items-center justify-between gap-6 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-display font-black">복습</h1>
          <p className="text-body font-normal">
            완료한 레슨의 스스로 점검 문항을 다시 풀어 보세요. 정답은 여기서 보여주지 않아요 —
            &ldquo;레슨에서 확인&rdquo; 링크로 확인합니다. 판정은 본인 몫이고, 후하게 매겨도 괜찮아요.
          </p>
          <MistakeNoteLink variant="link" label="객관식 오답 노트" />
        </div>
        <SpotIllustration name="review" className="hidden w-24 lg:w-28 shrink-0 sm:block" />
      </header>

      {classCards.length > 0 ? <ClassDueSection cards={classCards} /> : null}

      {sessionCards.length > 0 ? (
        <section className="flex flex-col gap-4" aria-labelledby="review-session-heading">
          <h2 id="review-session-heading" className="text-heading font-extrabold">
            오늘의 세션 <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">{sessionCards.length}문항</span>
          </h2>
          <ul className="flex flex-col gap-3">
            {sessionCards.map((card) => (
              <QuestionListItem key={`${card.lesson.slug}-${card.questionIndex}`} card={card} />
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          오늘은 새로 풀 문항이 없어요. 아래 오답 모아보기를 확인해 보세요.
        </p>
      )}

      {missedCards.length > 0 ? (
        <section className="flex flex-col gap-4" aria-labelledby="review-missed-heading">
          <h2 id="review-missed-heading" className="text-heading font-extrabold">
            오답 모아보기
          </h2>
          <ul className="flex flex-col gap-3">
            {missedCards.map((card) => (
              <QuestionListItem key={`missed-${card.lesson.slug}-${card.questionIndex}`} card={card} />
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
