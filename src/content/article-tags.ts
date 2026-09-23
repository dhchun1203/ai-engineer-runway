// 아티클(현업 기사 요약) 컬렉션의 고정 어휘. velite.config.ts(빌드 검사)와 앱
// (목록 필터, 상세 칩)이 모두 여기서만 가져온다. 표기 흔들림("Devops",
// "데브옵스")을 빌드에서 막는 것이 목적이라, 새 태그는 여기와 설계 문서
// (docs/superpowers/specs/2026-09-23-articles-section-design.md 3.3)를 함께 고친다.

export const ARTICLE_TAGS = [
  "AI 코딩",
  "LLM",
  "RAG",
  "에이전트",
  "평가",
  "DevOps",
  "백엔드",
  "프론트엔드",
  "데이터",
  "제품",
  "커리어",
] as const;

export type ArticleTag = (typeof ARTICLE_TAGS)[number];

export function isArticleTag(value: unknown): value is ArticleTag {
  return typeof value === "string" && (ARTICLE_TAGS as readonly string[]).includes(value);
}

// 본문 h2 목록(순서 포함). 작성 스킬과 빌드 검사가 같은 목록을 쓴다.
export const ARTICLE_SECTIONS = [
  "먼저 알아 둘 개념",
  "핵심 내용 정리",
  "취업과 면접 포인트",
  "내 학습과 연결",
  "스스로 확인하기",
] as const;

// 이 중 빠져도 되는 h2. 우리 레슨과 억지로 잇지 않는다는 원칙 때문에, 실제로
// 같은 내용을 다루는 레슨이 없으면 "내 학습과 연결"을 통째로 뺀다.
export const ARTICLE_OPTIONAL_SECTIONS: readonly string[] = ["내 학습과 연결"];
