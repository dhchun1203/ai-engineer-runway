import { GuideReader, guideMetadata } from "@/components/class/guide-reader";

// 맥 실습 환경 안내(2026-11-17) — 완전 정적. 본문은 src/content/guides/mac-setup.mdx.
export const metadata = guideMetadata("mac-setup");

export default function MacSetupPage() {
  return <GuideReader slug="mac-setup" />;
}
