import { ArrowDown, FileText, Users } from "lucide-react";
import { roadmapStages } from "@/content/channeltalk-roadmap";

// "준비하는 곳" 바로가기 묶음. 상자 테두리 대신, 작은 색 사각형(단계 번호) + 제목 + 아래 화살표로
// "이 페이지 아래로 내려가는 링크"임을 보여 준다. 호버하면 제목에 밑줄이 그어진다.
// id는 roadmapStages의 id, 또는 "talent"(채널톡이 찾는 사람), "doc-strategy"(서류 전략).
const SPECIAL: Record<string, { label: string; Icon: typeof Users }> = {
  talent: { label: "채널톡이 찾는 사람", Icon: Users },
  "doc-strategy": { label: "비전공자 서류 대비 전략", Icon: FileText },
};

export function PrepLinks({ ids }: { ids: readonly string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
        준비하는 곳
      </span>
      <ul className="flex flex-wrap items-center gap-x-5">
        {ids.map((id) => {
          const stage = roadmapStages.find((s) => s.id === id);
          const special = SPECIAL[id];
          if (!stage && !special) return null;
          const label = stage ? stage.title : special.label;
          const SpecialIcon = special?.Icon;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className="group/prep tap-feedback inline-flex min-h-11 items-center gap-2 text-label font-bold"
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 min-w-6 shrink-0 items-center justify-center bg-accent px-1 text-label font-black tabular-nums text-surface dark:bg-accent-dark dark:text-background-dark"
                >
                  {stage ? (
                    String(stage.order).padStart(2, "0")
                  ) : SpecialIcon ? (
                    <SpecialIcon className="h-3.5 w-3.5" />
                  ) : null}
                </span>
                <span className="break-keep underline-offset-4 group-hover/prep:underline">
                  <span className="sr-only">{stage ? `${stage.order}단계 ` : ""}</span>
                  {label}
                </span>
                <ArrowDown
                  className="h-3.5 w-3.5 shrink-0 text-badge-neutral-text transition-transform group-hover/prep:translate-y-0.5 dark:text-badge-neutral-text-dark"
                  aria-hidden="true"
                />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
