import type { Metadata } from "next";
import Link from "next/link";
import { getOrderedConcepts } from "@/content/concept-helpers";

export const metadata: Metadata = {
  title: "AI 뜯어보기",
  description:
    "AI가 실제로 어떻게 동작하는지 — 토큰부터 에이전트·하네스까지 직접 만져보며 이해하는 번외 커리큘럼.",
};

// 번외 "AI 뜯어보기" 인덱스 — 완전 정적 단일 페이지. 진도 프로바이더·쿠키·완료
// 상태를 전혀 읽지 않는다(/glossary와 같은 정적 셸). 정규 커리큘럼과 별개임을
// 머리글에서 분명히 밝혀, 여기서 읽는다고 진행률이 오르지 않는다는 점을 알린다.
export default function ConceptsIndexPage() {
  const concepts = getOrderedConcepts();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="chip w-fit text-label font-bold">번외 커리큘럼</span>
        <h1 className="text-display font-black break-keep">AI 뜯어보기</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          토큰부터 에이전트·하네스까지, AI가 실제로 어떻게 돌아가는지 그림으로
          만져보며 이해하는 번외 편입니다. 정규 학습 일정·진행률과는 별개라, 순서에
          매이지 않고 궁금한 개념부터 골라 읽어도 됩니다.
        </p>
      </header>

      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {concepts.map((concept, index) => (
          <li key={concept.slug}>
            <Link
              href={concept.permalink}
              className="card-interactive panel flex h-full min-h-11 flex-col gap-2 p-5 transition-colors duration-150"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-2xl leading-none" aria-hidden="true">
                  {concept.icon}
                </span>
                <span className="shrink-0 text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="min-w-0 break-keep text-heading font-extrabold">
                  {concept.title}
                </h2>
              </div>
              <p className="break-keep text-body font-normal leading-relaxed">
                {concept.summary}
              </p>
              <span className="mt-auto text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                약 {concept.readingMinutes}분 읽기
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
