import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { basecampQuizTotal, basecampReviewSteps } from "@/content/basecamp-review";
import { BasecampQuizSet } from "@/components/basecamp/basecamp-quiz-set";
import { basecampQuizKey } from "@/lib/quiz-mistake-key";
import { MistakeNoteLink } from "@/components/mistake-note-link";

export const metadata: Metadata = {
  title: "베이스캠프 복습 퀴즈",
  description:
    "베이스캠프 STEP별 복습 퀴즈. 코드의 출력과 에러를 예측하고 개념을 확인하는 4지선다 문항으로, 고르는 즉시 정답과 해설이 나와요.",
};

// 베이스캠프 복습 퀴즈 — 페이지는 정적이고, 채점은 STEP 묶음마다 클라이언트에서 한다.
// 답은 Server Action으로 계정의 오답 노트에 기록된다(2026-10-14, quiz-mistake-store.ts). 문항 데이터는 basecamp-review.ts에 있고, 코드 문항의 출력은 실제 실행으로
// 확인한 값이다.

export default function BasecampQuizPage() {
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
        <h1 className="text-display font-black break-keep">베이스캠프 복습 퀴즈</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          STEP마다 {basecampReviewSteps[0].quiz.length}문항, 모두 {basecampQuizTotal}문항이에요. 코드 문항은 실행하기
          전에 결과를 먼저 머릿속으로 예측해 보세요. 고르는 즉시 정답과 해설이 나오고, 풀이 결과는 내
          계정에 남아 다음에 열면 &ldquo;지난번 맞힘/틀림&rdquo;으로 보여요. 틀린 문제는 오답 노트에도 모여요.
        </p>
        <Link
          href="/basecamp/review"
          className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark"
        >
          복습 카드 먼저 훑기
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
        <MistakeNoteLink variant="link" label="오답 노트에서 틀린 문제만 다시 풀기" />
      </header>

      <nav aria-label="STEP 바로가기" className="flex flex-wrap gap-2">
        {basecampReviewSteps.map((step) => (
          <a key={step.id} href={`#${step.id}`} className="chip tap-feedback inline-flex min-h-11 items-center text-label font-semibold">
            {step.label}
          </a>
        ))}
      </nav>

      {basecampReviewSteps.map((step) => (
        <section key={step.id} id={step.id} className="panel flex scroll-mt-20 flex-col gap-4 p-5">
          <header className="flex flex-col gap-1.5">
            <span className="text-label font-bold text-accent dark:text-accent-dark">{step.label}</span>
            <h2 className="text-heading font-extrabold break-keep">{step.title}</h2>
          </header>
          <BasecampQuizSet questions={step.quiz} keys={step.quiz.map((_, i) => basecampQuizKey(step.id, i))} />
          <Link
            href={`/basecamp/review#${step.id}`}
            className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark"
          >
            {step.label} 복습 카드 보기
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </section>
      ))}
    </main>
  );
}
