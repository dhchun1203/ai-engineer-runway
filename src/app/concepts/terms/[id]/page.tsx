import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getConceptBySlug } from "@/content/concept-helpers";
import { getSortedTerms, getTerm, getTermUsages } from "@/content/term-helpers";

// 용어 카드 — 완전 정적. 설명, 같은 개념의 깊은 편(있을 때만), 이 용어가 나온
// 기사와 로드맵 레슨(빌드 시 <Term id>에서 계산)을 보여 준다.

export function generateStaticParams() {
  return getSortedTerms().map((term) => ({ id: term.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const term = getTerm(id);
  if (!term) return {};
  return { title: `${term.title} · 용어 사전`, description: term.body.split("\n\n")[0] };
}

export default async function TermPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const term = getTerm(id);
  if (!term) notFound();

  const concept = term.concept ? getConceptBySlug(term.concept) : undefined;
  const usages = getTermUsages(term.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/concepts/terms"
          className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          용어 사전
        </Link>
        <span className="chip w-fit text-label font-bold">용어</span>
        <h1 className="text-display font-black break-keep">{term.title}</h1>
      </header>

      <div className="flex flex-col gap-4">
        {term.body.split("\n\n").map((paragraph, index) => (
          <p key={index} className="break-keep text-body font-normal leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {concept ? (
        <Link
          href={concept.permalink}
          className="card-interactive panel flex min-h-11 items-center justify-between gap-2 p-4 text-body font-bold break-keep"
        >
          AI 뜯어보기에서 자세히: {concept.title}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      ) : null}

      {usages.length > 0 ? (
        <section className="hairline flex flex-col gap-3 pt-6">
          <h2 className="text-body font-extrabold">이 용어가 나온 곳</h2>
          <ul className="flex flex-col gap-2">
            {usages.map((usage) => (
              <li key={usage.href}>
                <Link
                  href={usage.href}
                  className="card-interactive panel flex min-h-11 flex-col gap-0.5 p-4"
                >
                  <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    {usage.kind}
                  </span>
                  <span className="text-body font-bold break-keep">{usage.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
