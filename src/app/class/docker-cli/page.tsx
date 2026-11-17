import { GuideReader, guideMetadata } from "@/components/class/guide-reader";

// Docker 명령 한눈에 보기(2026-11-17, 교안 35장 정리) — 완전 정적. 본문은 src/content/guides/docker-cli.mdx.
export const metadata = guideMetadata("docker-cli");

export default function DockerCliPage() {
  return <GuideReader slug="docker-cli" />;
}
