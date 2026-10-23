import { Flag } from "lucide-react";
import { hiringProcess } from "@/content/channeltalk-roadmap";
import { PrepLinks } from "@/components/roadmap/prep-links";

// 채널톡 채용 절차 세로 타임라인(Applied AI Engineer 기준). 단계마다 번호 상자, 공고의 진행 방식 한 줄, 이
// 로드맵의 어느 단계로 준비하는지 바로가기(같은 페이지 앵커)를 단다. 마지막 단계(최종
// 합격)는 행동색 상자와 깃발로 도착점을 표시한다.
export function HiringTimeline() {
  return (
    <ol className="panel flex flex-col p-5 sm:p-6">
      {hiringProcess.map((step, index) => {
        const isLast = index === hiringProcess.length - 1;
        return (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {/* 다음 단계로 이어지는 세로 선 — 번호 상자 가운데에서 아래로 */}
            {!isLast ? (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-5 top-10 w-px bg-line dark:bg-line-dark"
              />
            ) : null}
            <span
              aria-hidden="true"
              className={`relative flex h-10 w-10 shrink-0 items-center justify-center border text-body font-black tabular-nums ${
                isLast
                  ? "border-action bg-action text-surface dark:border-action-dark dark:bg-action-dark dark:text-background-dark"
                  : "border-foreground bg-surface dark:border-foreground-dark dark:bg-surface-dark"
              }`}
            >
              {isLast ? <Flag className="h-5 w-5" /> : index + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-1.5 pt-1.5">
              <h3 className="break-keep text-body font-extrabold">
                <span className="sr-only">{index + 1}단계 </span>
                {step.title}
              </h3>
              <p className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {step.focus}
              </p>
              {step.prep.length > 0 ? (
                <div className="pt-1">
                  <PrepLinks ids={step.prep} />
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
