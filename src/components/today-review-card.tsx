import Link from "next/link";
import { RotateCcw } from "lucide-react";
import type { getLessonBySlug } from "@/content/curriculum-helpers";
import { SELF_CHECK_ANCHOR, GRADUATE_COUNT } from "@/lib/review";
import { ReviewDoneButton } from "@/components/review-done-button";

// 홈의 "오늘의 복습" 카드 — today-lesson-card.tsx와 같은 규약의 순수 표현
// 컴포넌트(데이터 조회 없음, 홈이 계산한 props만 받는다).
//
// 이 카드가 하는 일: 만기 레슨의 "스스로 점검 문제" 섹션으로 보낸다. 레슨을
// 다시 읽으라는 게 아니라(재독은 저효용) 문제 2개를 먼저 떠올려 보라는 것이다.
// 판정은 본인이 한다 — 후하게 매겨도 괜찮다. 회상을 시도했다는 사실이 효과의
// 대부분을 만든다(Anki·Quizlet·Quantum Country 전부 같은 설계).
//
// 복습은 새 레슨 진행을 절대 잠그지 않는다 — 이 카드는 권유까지만 한다.

type Lesson = NonNullable<ReturnType<typeof getLessonBySlug>>;

export type DueReviewRow = {
  lesson: Lesson;
  /** 몇 번째 복습인지 (1~GRADUATE_COUNT). */
  rung: number;
};

export function TodayReviewCard({
  dueRows,
  nextDue,
}: {
  dueRows: DueReviewRow[];
  /** 만기 0건일 때 보여줄 다음 만기일(YYYY-MM-DD). 전부 졸업/완료 0건이면 null. */
  nextDue: string | null;
}) {
  // 만기 0건 + 예정도 없음(완료 0건이거나 전부 졸업) — 카드 자체를 내지 않는다.
  if (dueRows.length === 0 && nextDue === null) return null;

  // 만기 0건 — 축소형 배지 한 줄. "복습 빚 0"이 스트릭보다 정확한 신호다
  // (round1-e — 1인 학습에서 행동을 유도하는 건 연속 일수가 아니라 오늘 만기).
  if (dueRows.length === 0) {
    const [, m, d] = nextDue!.split("-");
    return (
      <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        복습 만기 0건 ✓ — 다음 복습은 {Number(m)}/{Number(d)}
      </p>
    );
  }

  return (
    <section className="panel flex flex-col gap-4 p-6" aria-labelledby="today-review-heading">
      <div className="flex items-center gap-2">
        <RotateCcw className="h-5 w-5 shrink-0" aria-hidden="true" />
        <h2 id="today-review-heading" className="text-heading font-extrabold">
          오늘의 복습
        </h2>
        <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {dueRows.length}편
        </span>
      </div>
      <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        점검 문제만 다시 풀어 보세요 — 약 3분이면 됩니다. 판정은 본인 몫이고, 후하게
        매겨도 괜찮아요.
      </p>
      <ul className="flex flex-col gap-3">
        {dueRows.map(({ lesson, rung }) => (
          <li key={lesson.slug} className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href={`/lesson/${lesson.slug}#${SELF_CHECK_ANCHOR}`}
              className="card-interactive -m-2 flex min-h-11 flex-1 items-center gap-2 rounded-lg p-2"
            >
              <span className="text-body font-normal">{lesson.title}</span>
              <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {rung}/{GRADUATE_COUNT}회차
              </span>
            </Link>
            <ReviewDoneButton lessonSlug={lesson.slug} />
          </li>
        ))}
      </ul>
    </section>
  );
}
