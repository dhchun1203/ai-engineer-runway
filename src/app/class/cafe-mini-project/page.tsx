import { GuideReader, guideMetadata } from "@/components/class/guide-reader";

// 미니 프로젝트(2026-11-20): compose PostgreSQL, 시드 SQL, psycopg, pandas/NumPy 분석, 결과 저장까지
// 맥 기준 따라하기. 완전 정적. 본문은 src/content/guides/cafe-mini-project.mdx,
// 시드는 public/downloads/cafe-seed.sql.
export const metadata = guideMetadata("cafe-mini-project");

export default function CafeMiniProjectPage() {
  return <GuideReader slug="cafe-mini-project" />;
}
