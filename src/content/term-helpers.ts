import { articles, roadmapLessons } from "#site/content";
import { terms, type TermEntry } from "@/content/terms";

// 공용 용어 사전 데이터 접근. AI 뜯어보기 "용어 사전" 층(/concepts/terms)이 쓴다.

export type TermListItem = TermEntry & { id: string };

export type TermUsage = {
  kind: "아티클" | "로드맵 레슨";
  title: string;
  href: string;
};

/** 제목 가나다순(영문은 한글 뒤가 아니라 ko 로캘 규칙대로). */
export function getSortedTerms(): TermListItem[] {
  return Object.entries(terms)
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => a.title.localeCompare(b.title, "ko"));
}

export function getTerm(id: string): TermListItem | undefined {
  const entry = terms[id];
  return entry ? { id, ...entry } : undefined;
}

/** 이 용어를 <Term id>로 쓴 기사와 로드맵 레슨. velite가 뽑은 termIds로 계산한다. */
export function getTermUsages(id: string): TermUsage[] {
  return [
    ...articles
      .filter((a) => a.termIds.includes(id))
      .map((a) => ({ kind: "아티클" as const, title: a.title, href: a.permalink })),
    ...roadmapLessons
      .filter((l) => l.termIds.includes(id))
      .map((l) => ({ kind: "로드맵 레슨" as const, title: l.title, href: l.permalink })),
  ];
}
