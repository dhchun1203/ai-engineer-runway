import type { Metadata } from "next";
import Link from "next/link";
import {
  formatKoreanDate,
  getSortedArticles,
  getUsedTags,
} from "@/content/article-helpers";
import { isArticleTag } from "@/content/article-tags";

export const metadata: Metadata = {
  title: "아티클",
  description:
    "현업 엔지니어링 기사를 우리 말로 풀어 모은 곳. 개념 풀이, 핵심 정리, 면접 포인트를 담고, 이어지는 레슨이 있으면 연결해 둡니다. 글은 계속 더해집니다.",
};

// 아티클 목록 — 태그 필터를 쿼리스트링(?tag=)으로 받으므로 요청마다 렌더링된다
// (Next 16: searchParams를 읽으면 동적 렌더). DB 조회는 없고 velite 데이터만 거른다.
// 필터는 링크 이동이라 클라이언트 JS가 필요 없다.
export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[] }>;
}) {
  const { tag } = await searchParams;
  const all = getSortedArticles();
  const activeTag = typeof tag === "string" && isArticleTag(tag) ? tag : null;
  const list = activeTag ? all.filter((a) => a.tags.includes(activeTag)) : all;
  const usedTags = getUsedTags(all);

  const chipClass = (active: boolean) =>
    `${active ? "chip-solid" : "chip"} tap-feedback inline-flex min-h-11 items-center text-label font-semibold`;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="chip w-fit text-label font-bold">현업 읽기</span>
        <h1 className="text-display font-black break-keep">아티클</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          현업 엔지니어링 기사를 우리 말로 풀어 모았습니다. 기사마다 먼저 알아 둘 개념 풀이,
          핵심 정리, 면접에서 쓸 포인트를 담았고, 이어지는 레슨이 있으면 연결해 뒀어요.
          원문은 언제든 링크로 열 수 있고, 글은 계속 더해집니다.
        </p>
      </header>

      {usedTags.length > 0 ? (
        <nav aria-label="분야 필터" className="flex flex-wrap gap-2">
          <Link href="/articles" aria-current={activeTag ? undefined : "page"} className={chipClass(!activeTag)}>
            전체
          </Link>
          {usedTags.map((t) => (
            <Link
              key={t}
              href={`/articles?tag=${encodeURIComponent(t)}`}
              aria-current={activeTag === t ? "page" : undefined}
              className={chipClass(activeTag === t)}
            >
              {t}
            </Link>
          ))}
        </nav>
      ) : null}

      {list.length === 0 ? (
        <p className="panel p-5 text-body break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
          아직 모은 기사가 없어요.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {list.map((article) => (
            <li key={article.slug}>
              <Link
                href={article.permalink}
                className="card-interactive panel flex h-full min-h-11 flex-col gap-2 p-5 transition-colors duration-150"
              >
                <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {article.source}
                  <span className="mx-2" aria-hidden="true">|</span>
                  {formatKoreanDate(article.publishedAt)}
                </span>
                <span className="text-heading font-extrabold break-keep">{article.title}</span>
                <span className="text-body font-normal leading-relaxed break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {article.summary[0]}
                </span>
                <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  {article.tags.map((t) => (
                    <span key={t} className="chip text-label font-semibold">
                      {t}
                    </span>
                  ))}
                  {article.origin === "auto" ? (
                    <span className="text-label font-normal text-muted dark:text-muted-dark">자동 수집</span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
