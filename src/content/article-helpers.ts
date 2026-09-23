import { articles } from "#site/content";
import { ARTICLE_TAGS, type ArticleTag } from "@/content/article-tags";

// 아티클 데이터 접근 — 격리 컬렉션. 진도·일정·복습 계산은 이 파일을 참조하지 않는다.

export type Article = (typeof articles)[number];

/** 올린 날(addedAt) 최신순, 같은 날이면 원문 발행일 최신순. YYYY-MM-DD라 문자열 비교로 충분하다. */
export function getSortedArticles(): Article[] {
  return [...articles].sort(
    (a, b) => b.addedAt.localeCompare(a.addedAt) || b.publishedAt.localeCompare(a.publishedAt),
  );
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

/** 실제로 쓰인 태그만, ARTICLE_TAGS의 순서대로. 필터 칩 줄에 쓴다. */
export function getUsedTags(list: Article[]): ArticleTag[] {
  const used = new Set<string>(list.flatMap((a) => a.tags));
  return ARTICLE_TAGS.filter((tag) => used.has(tag));
}

/** "2026-09-21" -> "2026년 9월 21일" */
export function formatKoreanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}
