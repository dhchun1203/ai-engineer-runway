import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { basecampReviewSteps } from "@/content/basecamp-review";
import { ReviewCode } from "@/components/basecamp/review-code";

export const metadata: Metadata = {
  title: "베이스캠프 복습 카드",
  description:
    "지금까지의 베이스캠프 STEP을 한 장씩 훑는 복습 카드. 할 수 있게 된 것, 핵심 문법, 자주 하는 실수, 최종 과제 흐름, 다시 볼 레슨.",
};

// 베이스캠프 복습 카드 — 완전 정적. 데이터는 basecamp-review.ts 하나에서 오고, 진도나
// 쿠키를 읽지 않는다. 같은 데이터의 퀴즈는 /basecamp/quiz에 있다.

const HOW_TO = [
  "새 Colab 노트에서 그 STEP의 최종 과제를 답을 보지 않고 다시 풀어요.",
  "막히면 바로 레슨을 열지 말고 5분은 버텨 봐요. 그래도 막힌 곳이 진짜 약점이에요.",
  "약점만 아래 카드의 '다시 볼 레슨'에서 찾아 그 부분만 읽어요.",
  "복습 퀴즈로 그 STEP을 한 번 더 꺼내 봐요.",
  "학습 기록에 '할 수 있게 된 것'과 '헷갈렸던 것'을 내 말로 적어요.",
];

export default function BasecampReviewPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/basecamp"
          className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          베이스캠프
        </Link>
        <span className="chip w-fit text-label font-bold">복습</span>
        <h1 className="text-display font-black break-keep">베이스캠프 복습 카드</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          지금까지의 STEP을 한 장씩 훑어요. 다시 읽는 것보다 직접 꺼내 보는 게 오래 남으니, 카드는
          빠르게 훑고 퀴즈와 최종 과제 다시 풀기에 시간을 더 쓰세요.
        </p>
        <Link href="/basecamp/quiz" className="btn tap-feedback w-fit text-label">
          복습 퀴즈 풀기
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </header>

      <section className="panel flex flex-col gap-3 p-5">
        <h2 className="text-subhead font-extrabold break-keep">이렇게 복습하세요</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-body leading-relaxed break-keep">
          {HOW_TO.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <p className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          하루에 STEP 하나씩, 마지막 날은 아무 과제나 골라 처음부터 끝까지 시간을 재며 풀어 보세요.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-subhead font-extrabold break-keep">한 줄기로 보기</h2>
        <ol className="flex flex-col gap-2">
          {basecampReviewSteps.map((step) => (
            <li key={step.id} className="flex gap-3 border-l-2 border-line pl-3 dark:border-line-dark">
              <span className="w-24 shrink-0 text-label font-bold text-accent dark:text-accent-dark">{step.label}</span>
              <span className="text-body leading-relaxed break-keep">{step.oneLine}</span>
            </li>
          ))}
        </ol>
      </section>

      <nav aria-label="STEP 바로가기" className="flex flex-wrap gap-2">
        {basecampReviewSteps.map((step) => (
          <a key={step.id} href={`#${step.id}`} className="chip tap-feedback inline-flex min-h-11 items-center text-label font-semibold">
            {step.label}
          </a>
        ))}
      </nav>

      {basecampReviewSteps.map((step) => (
        <article key={step.id} id={step.id} className="panel flex scroll-mt-20 flex-col gap-6 p-5">
          <header className="flex flex-col gap-1.5">
            <span className="text-label font-bold text-accent dark:text-accent-dark">{step.label}</span>
            <h2 className="text-heading font-extrabold break-keep">{step.title}</h2>
          </header>

          <section className="flex flex-col gap-2">
            <h3 className="text-label font-bold">할 수 있게 된 것</h3>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-body leading-relaxed break-keep">
              {step.canDo.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-label font-bold">핵심 문법과 개념</h3>
            {step.keyPoints.map((point) => (
              <div key={point.label} className="flex flex-col gap-1.5">
                <p className="text-body font-bold break-keep">{point.label}</p>
                {point.code ? <ReviewCode code={point.code} /> : null}
                <p className="text-body leading-relaxed break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {point.note}
                </p>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-label font-bold">자주 하는 실수</h3>
            <ul className="flex flex-col">
              {step.pitfalls.map((pit) => (
                <li
                  key={pit.mistake}
                  className="flex flex-col gap-0.5 border-t border-line py-2.5 first:border-t-0 first:pt-0 dark:border-line-dark"
                >
                  <span className="text-body font-semibold break-keep">{pit.mistake}</span>
                  <span className="text-label leading-relaxed break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    <span className="font-semibold text-destructive dark:text-destructive-dark">{pit.symptom}</span>
                    <span className="mx-2" aria-hidden="true">|</span>
                    {pit.fix}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-label font-bold">최종 과제 다시 풀기 흐름</h3>
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-body leading-relaxed break-keep">
              {step.assignmentFlow.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
            {step.assignmentSkeleton ? (
              <>
                <p className="text-label leading-relaxed break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  코드 뼈대예요. ... 자리를 답을 보지 않고 채워 보세요.
                </p>
                <ReviewCode code={step.assignmentSkeleton} />
              </>
            ) : null}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-label font-bold">다시 볼 레슨</h3>
            <div className="flex flex-wrap gap-2">
              {step.lessons.map((lesson) => (
                <Link
                  key={lesson.href}
                  href={lesson.href}
                  className="chip tap-feedback inline-flex min-h-11 items-center text-label font-semibold"
                >
                  {lesson.label}
                </Link>
              ))}
            </div>
          </section>

          <Link
            href={`/basecamp/quiz#${step.id}`}
            className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark"
          >
            {step.label} 퀴즈 풀기
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </article>
      ))}
    </main>
  );
}
