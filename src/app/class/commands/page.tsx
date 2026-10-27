import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buildCommandGroups } from "@/content/class-derived";
import { CommandList } from "@/components/class/command-list";

export const metadata: Metadata = {
  title: "명령어 모음 | 수업 복습",
  description: "수업에서 배운 명령어를 한곳에 모았어요. 무엇을 하는 명령인지와 몇 회차에서 배웠는지 함께 보여 줘요.",
};

// 명령어 모음(2026-10-27) — 완전 정적. 회차 폴더 review.yml의 commands를 빌드 때 모은다.
export default function ClassCommandsPage() {
  const groups = buildCommandGroups();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/class"
          className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          수업 복습
        </Link>
        <h1 className="text-display font-black break-keep">명령어 모음</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          수업에서 배운 명령어를 한곳에 모았어요. 기억이 안 날 때 여기서 찾고, 회차 칩을 누르면 처음 배운
          수업으로 돌아가요.
        </p>
      </header>

      {groups.length > 0 ? (
        <CommandList groups={groups} />
      ) : (
        <p className="panel p-5 text-body break-keep">아직 모인 명령어가 없어요.</p>
      )}
    </main>
  );
}
