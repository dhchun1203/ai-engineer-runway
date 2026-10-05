import type { Metadata } from "next";
import Link from "next/link";
import {
  formatKoreanDate,
  getSortedArticles,
  getUsedTags,
  type Article,
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
//
// 헤더와 필터는 다른 페이지와 같은 모양을 쓰고, 기사 목록만 신문 지면처럼 짠다:
// 가장 최근 기사는 머리기사로 크게, 나머지는 세로 괘선으로 나뉜 단(段)에 흘려 넣는다.
// 형태 규칙은 globals.css의 .news-* 클래스에 있다.
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
  const [lead, ...rest] = list;

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

      {lead === undefined ? (
        <p className="panel p-5 text-body break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
          아직 모은 기사가 없어요.
        </p>
      ) : (
        <div className="news-sheet flex flex-col gap-8 pt-6">
          <LeadStory article={lead} />
          {rest.length > 0 ? (
            // 2단은 기사가 2편 이상일 때만 — 1편을 2단에 넣으면 오른쪽 단이 통째로 빈다.
            <ul className={`news-columns columns-1 gap-x-8 ${rest.length > 1 ? "md:columns-2" : ""}`}>
              {rest.map((article) => (
                <li
                  key={article.slug}
                  className="mb-6 break-inside-avoid border-b border-line pb-6 dark:border-line-dark"
                >
                  <Story article={article} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </main>
  );
}

/** 분야 꼬리표 — 신문 기사 제목 위의 작은 '키커'. 자동 수집 표시는 바이라인이 아니라
 *  여기 오른쪽에 둔다(바이라인이 길어져 좁은 단에서 줄이 넘치지 않게). */
function Kicker({ article }: { article: Article }) {
  return (
    <span className="flex flex-wrap items-baseline justify-between gap-x-3 text-label">
      <span className="font-bold text-action dark:text-action-dark">{article.tags.join(", ")}</span>
      {article.origin === "auto" ? (
        <span className="font-normal text-muted dark:text-muted-dark">자동 수집</span>
      ) : null}
    </span>
  );
}

/** 출처, 원문 날짜, 읽는 시간 — 기사 아래 바이라인 줄. 줄이 넘칠 때 한 항목 안에서
 *  갈라지지 않도록, 항목마다 줄바꿈을 막고 항목 사이에서만 넘긴다. */
function Byline({ article }: { article: Article }) {
  const parts = [article.source, formatKoreanDate(article.publishedAt), `약 ${article.readingMinutes}분 읽기`];
  return (
    <span className="flex flex-wrap text-label font-semibold text-muted dark:text-muted-dark">
      {parts.map((part, i) => (
        <span key={part} className="whitespace-nowrap">
          {i > 0 ? (
            <span className="mx-2" aria-hidden="true">
              |
            </span>
          ) : null}
          {part}
        </span>
      ))}
    </span>
  );
}

/** 머리기사 — 목록의 첫 기사. 큰 명조 제목에 요약 세 줄을 두 단으로 펼친다. */
function LeadStory({ article }: { article: Article }) {
  return (
    <article>
      <Link href={article.permalink} className="news-story tap-feedback flex flex-col gap-3 border-b border-foreground pb-8 dark:border-foreground-dark">
        <Kicker article={article} />
        <h2 className="news-serif news-headline text-display font-black break-keep">{article.title}</h2>
        <Byline article={article} />
        <div className="news-serif mt-2 columns-1 gap-x-8 text-body font-normal leading-relaxed break-keep md:columns-2">
          {article.summary.map((line) => (
            <p key={line} className="mb-3">
              {line}
            </p>
          ))}
        </div>
      </Link>
    </article>
  );
}

/** 단 기사 — 머리기사 아래 단에 흘러 들어가는 나머지 기사. */
function Story({ article }: { article: Article }) {
  return (
    <article>
      <Link href={article.permalink} className="news-story tap-feedback flex min-h-11 flex-col gap-2">
        <Kicker article={article} />
        <h2 className="news-serif news-headline text-heading font-extrabold break-keep">{article.title}</h2>
        <p className="news-serif text-body font-normal leading-relaxed break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {article.summary[0]}
        </p>
        <Byline article={article} />
      </Link>
    </article>
  );
}
