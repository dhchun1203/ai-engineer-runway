import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { roadmapStages, type SkillCoverage } from "@/content/channeltalk-roadmap";

// 진입 로드맵 단계 목록. 단계마다 접히는 카드(details)이고, 머리(번호, 제목, 부제,
// 강화/별도 개수)만 기본으로 보인다. 펼치면 채널톡의 말, 이유, 익힐 역량이 나온다.
// 같은 페이지 바로가기로 오면 StageAccordionControls가 그 단계를 펼친다.

// 커버리지 라벨(강화/별도): 강화는 강조색(파랑), 별도는 행동색(주황). 페이지 범례도 같은 함수를 쓴다.
export const COVERAGE_LABEL: Record<SkillCoverage, string> = {
  reinforce: "강화",
  separate: "별도",
};

export function coverageBadgeClass(coverage: SkillCoverage): string {
  const base =
    "inline-flex shrink-0 items-center border px-1.5 py-0.5 text-label font-bold leading-none";
  return coverage === "separate"
    ? `${base} border-action text-action dark:border-action-dark dark:text-action-dark`
    : `${base} border-accent text-accent dark:border-accent-dark dark:text-accent-dark`;
}

export function coverageDotClass(coverage: SkillCoverage): string {
  return coverage === "separate"
    ? "bg-action dark:bg-action-dark"
    : "bg-accent dark:bg-accent-dark";
}

export function RoadmapStageList() {
  return (
    <ol className="flex flex-col gap-3">
      {roadmapStages.map((stage) => {
        const reinforceCount = stage.skills.filter(
          (skill) => skill.coverage === "reinforce",
        ).length;
        const separateCount = stage.skills.length - reinforceCount;
        return (
        <li key={stage.id} id={stage.id} className="scroll-mt-24">
          <details data-roadmap-stage className="stage-accordion panel group overflow-hidden">
            {/* 단계 머리 — 번호, 제목, 부제, 커버리지 요약. 접힌 상태에서도 이것만으로
                단계의 무게(강화/별도 개수)가 보인다. 누르면 아래 본문이 펼쳐진다. */}
            <summary className="stage-accordion-summary flex min-h-11 cursor-pointer list-none items-start gap-3 p-5 sm:p-6">
              <span
                className="shrink-0 text-label font-black tabular-nums text-accent dark:text-accent-dark"
                aria-hidden="true"
              >
                {String(stage.order).padStart(2, "0")}
              </span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <h3 className="break-keep text-heading font-extrabold">
                  {stage.title}
                </h3>
                <p className="break-keep text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {stage.subtitle}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {reinforceCount > 0 ? (
                    <span className={coverageBadgeClass("reinforce")}>
                      강화 {reinforceCount}
                    </span>
                  ) : null}
                  {separateCount > 0 ? (
                    <span className={coverageBadgeClass("separate")}>
                      별도 {separateCount}
                    </span>
                  ) : null}
                </div>
              </div>
              <ChevronDown
                className="ml-auto mt-1 h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>

            <div className="stage-accordion-body flex flex-col gap-4 px-5 pb-5 sm:px-6 sm:pb-6">
            {/* 채널톡의 말 — 잉크 왼쪽 선 인용 블록 */}
            <blockquote className="border-l-2 border-foreground pl-4 dark:border-foreground-dark">
              <p className="break-keep text-label font-medium italic leading-relaxed">
                {stage.evidence}
              </p>
              <cite className="mt-1 block text-label font-semibold not-italic text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {stage.evidenceSource}
              </cite>
            </blockquote>

            {/* 왜 이 단계인가 */}
            <p className="break-keep text-body font-normal leading-relaxed">
              {stage.rationale}
            </p>

            {/* 익힐 역량 — 각 항목에 강화/별도 라벨과 근거를 붙인다. */}
            <ul className="flex flex-col gap-3.5">
              {stage.skills.map((skill) => (
                <li key={skill.title} className="flex items-start gap-2.5">
                  <span
                    className={`mt-2 h-1.5 w-1.5 shrink-0 ${coverageDotClass(skill.coverage)}`}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="break-keep text-body font-normal leading-relaxed">
                      {skill.title}
                    </span>
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className={coverageBadgeClass(skill.coverage)}>
                        {COVERAGE_LABEL[skill.coverage]}
                      </span>
                      <span className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
                        {skill.where}
                      </span>
                    </span>
                    {skill.lessonSlug ? (
                      <Link
                        href={`/roadmap/${skill.lessonSlug}`}
                        className="btn tap-feedback w-fit text-label"
                      >
                        심화 레슨 열기
                        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            {stage.internalLink ? (
              <Link
                href={stage.internalLink.href}
                className="btn tap-feedback w-fit text-label"
              >
                {stage.internalLink.label}
              </Link>
            ) : null}
            </div>
          </details>
        </li>
        );
      })}
    </ol>
  );
}
