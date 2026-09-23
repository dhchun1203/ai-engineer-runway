import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSortedTerms } from "@/content/term-helpers";

export const metadata: Metadata = {
  title: "용어 사전 · AI 뜯어보기",
  description: "기사와 로드맵 레슨에 나온 용어를 짧은 카드로 모은 사전.",
};

// AI 뜯어보기의 "용어 사전" 층 — 완전 정적. 깊은 편(/concepts/[slug])과 달리
// 짧은 카드 모음이다. 정의는 공용 용어 사전(src/content/terms.ts) 한 곳에서 온다.
export default function TermsIndexPage() {
  const terms = getSortedTerms();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/concepts"
          className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          AI 뜯어보기
        </Link>
        <h1 className="text-display font-black break-keep">용어 사전</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          기사와 로드맵 레슨에 나온 용어 {terms.length}개를 짧은 카드로 모았어요. 본문에서
          밑줄 친 용어를 누르면 나오는 설명과 같은 내용이고, 깊게 다룬 개념은 AI 뜯어보기
          편으로 이어집니다.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {terms.map((term) => (
          <li key={term.id}>
            <Link
              href={`/concepts/terms/${term.id}`}
              className="card-interactive panel flex h-full min-h-11 flex-col gap-1.5 p-4"
            >
              <span className="text-body font-extrabold break-keep">{term.title}</span>
              <span className="line-clamp-2 text-label font-normal leading-relaxed break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {term.body.split("\n\n")[0]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
