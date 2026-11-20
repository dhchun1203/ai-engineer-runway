import { GuideReader, guideMetadata } from "@/components/class/guide-reader";

// 미니 프로젝트 2부(2026-11-20): 1부의 cafe_db 앞에 FastAPI 창구를 세우고 노트북에서 requests로
// 호출해 pandas로 분석한다. 맥 기준 따라하기. 완전 정적. 본문은 src/content/guides/cafe-api-project.mdx.
export const metadata = guideMetadata("cafe-api-project");

export default function CafeApiProjectPage() {
  return <GuideReader slug="cafe-api-project" />;
}
