import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, List } from "lucide-react";
import { MDXContent } from "@/components/mdx-content";
import { conceptComponents } from "@/components/concepts/concept-components";
import {
  getConceptBySlug,
  getOrderedConcepts,
  getAdjacentConcepts,
} from "@/content/concept-helpers";

// 번외 개념 리더 — 완전 정적. 레슨 리더와 달리 진도·완료·복습·구간 테이프·북마크가
// 전혀 없다(설계: 미사용 목록). 인터랙티브 시각화는 conceptComponents로 주입한다.

export function generateStaticParams() {
  return getOrderedConcepts().map((concept) => ({ slug: concept.slug }));
}

export async function generateMetadata(
  props: PageProps<"/concepts/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const concept = getConceptBySlug(slug);
  if (!concept) return {};
  return { title: `${concept.title} · AI 뜯어보기`, description: concept.summary };
}

export default async function ConceptPage(props: PageProps<"/concepts/[slug]">) {
  const { slug } = await props.params;
  const concept = getConceptBySlug(slug);

  if (!concept) {
    notFound();
  }

  const { prev, next } = getAdjacentConcepts(concept.slug);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/concepts"
            className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
          >
            <List className="h-4 w-4 shrink-0" aria-hidden="true" />
            AI 뜯어보기
          </Link>
          <h1 className="flex items-baseline gap-3 text-display font-black break-keep">
            <span className="text-3xl leading-none sm:text-4xl" aria-hidden="true">
              {concept.icon}
            </span>
            <span className="min-w-0">{concept.title}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip text-label font-bold">번외</span>
            <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
              약 {concept.readingMinutes}분 읽기
            </span>
          </div>
        </header>

        <div className="prose dark:prose-invert max-w-none">
          <MDXContent code={concept.code} components={conceptComponents} />
        </div>

        {/* 이전/다음 개념 — 번외 순서 안에서만 이어진다. 진도 컨트롤은 없다. */}
        <nav
          aria-label="번외 개념 이동"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {prev ? (
            <Link
              href={prev.permalink}
              className="card-interactive panel flex min-h-11 flex-col gap-1 p-4"
            >
              <span className="flex items-center gap-1.5 text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                이전
              </span>
              <span className="break-keep text-body font-bold">
                {prev.icon} {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={next.permalink}
              className="card-interactive panel flex min-h-11 flex-col gap-1 p-4 text-right sm:items-end"
            >
              <span className="flex items-center gap-1.5 text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                다음
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </span>
              <span className="break-keep text-body font-bold">
                {next.icon} {next.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </main>
  );
}
