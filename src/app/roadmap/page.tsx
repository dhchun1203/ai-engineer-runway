import type { Metadata } from "next";
import Link from "next/link";
import {
  talentTraits,
  roadmapStages,
  hiringProcess,
  roadmapSources,
} from "@/content/channeltalk-roadmap";

export const metadata: Metadata = {
  title: "채널톡 AI Engineer 로드맵",
  description:
    "채널톡(채널코퍼레이션) 채용 공고와 기술블로그를 분석해 뽑은 AI Engineer 진입 로드맵 — 기초부터 실전 태도까지 여덟 단계. 정규 학습 커리큘럼과 별개의 취업 목표 트랙.",
};

// 채널톡 AI Engineer 진입 로드맵 — 완전 정적 단일 페이지. 정규 커리큘럼과 달리
// 진도 프로바이더나 완료 상태를 전혀 읽지 않는 정적 셸이다(/concepts와 같은
// 방침). 콘텐츠는 src/content/channeltalk-roadmap.ts에서 온다 — 사용자가 그
// 데이터 파일을 편집해 앞으로 단계와 스킬을 채워나간다.
export default function RoadmapPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-14 px-4 py-12 sm:px-6 lg:px-8">
      {/* 머리글 — 이 트랙이 학습 진도, 일정과 별개임을 분명히 밝힌다. */}
      <header className="flex flex-col gap-3">
        <span className="chip w-fit text-label font-bold">취업 목표 로드맵</span>
        <h1 className="text-display font-black break-keep">
          채널톡 AI Engineer 진입 로드맵
        </h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          채널톡(채널코퍼레이션)의 채용 공고와 기술블로그, CTO 인터뷰를 꼼꼼히
          읽고, 이 회사가 실제로 원하는 역량을 여덟 단계의 로드맵으로 옮겼습니다.
          정규 학습 일정이나 진행률과는 별개의 트랙이라, 순서에 매이지 않고
          앞으로 스스로 채워나가는 살아있는 문서입니다.
        </p>
      </header>

      {/* 채널톡이 찾는 사람 — 인재상 분석 */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-heading font-extrabold break-keep">
            채널톡이 찾는 사람
          </h2>
          <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
            채용 공고, CTO 인터뷰, 기술블로그를 가로질러 반복되는 인재상을 여섯
            갈래로 정리했습니다. 로드맵의 모든 단계는 여기서 출발합니다.
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {talentTraits.map((trait) => (
            <li key={trait.title} className="panel flex h-full flex-col gap-2 p-5">
              <h3 className="break-keep text-body font-extrabold">{trait.title}</h3>
              <p className="break-keep text-label font-normal leading-relaxed">
                {trait.body}
              </p>
              <span className="mt-auto pt-1 text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {trait.source}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 진입 로드맵 — 여덟 단계 */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-heading font-extrabold break-keep">진입 로드맵</h2>
          <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
            기초에서 실전 태도까지 여덟 단계입니다. Applied AI Engineer 트랙을
            중심축으로 두되, Forward Deployed Engineer와 Software Engineer 요건까지
            함께 녹였습니다. 각 단계에는 채널톡이 직접 한 말을 근거로 달아, 왜
            지금 이걸 익히는지 잊지 않게 했습니다.
          </p>
        </div>

        <ol className="flex flex-col gap-5">
          {roadmapStages.map((stage) => (
            <li key={stage.id} id={stage.id}>
              <article className="panel flex flex-col gap-4 p-5 sm:p-6">
                {/* 단계 머리 — 번호, 아이콘, 제목, 부제 */}
                <div className="flex items-start gap-3">
                  <span
                    className="shrink-0 text-label font-black tabular-nums text-accent dark:text-accent-dark"
                    aria-hidden="true"
                  >
                    {String(stage.order).padStart(2, "0")}
                  </span>
                  <span className="shrink-0 text-2xl leading-none" aria-hidden="true">
                    {stage.icon}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <h3 className="break-keep text-heading font-extrabold">
                      {stage.title}
                    </h3>
                    <p className="break-keep text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                      {stage.subtitle}
                    </p>
                  </div>
                </div>

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

                {/* 익힐 역량 */}
                <ul className="flex flex-col gap-2">
                  {stage.skills.map((skill) => (
                    <li
                      key={skill.title}
                      className="flex items-start gap-2.5 break-keep text-body font-normal leading-relaxed"
                    >
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent dark:bg-accent-dark"
                        aria-hidden="true"
                      />
                      <span>{skill.title}</span>
                    </li>
                  ))}
                </ul>

                {stage.internalLink ? (
                  <Link
                    href={stage.internalLink.href}
                    className="chip w-fit min-h-11 items-center text-label font-bold"
                  >
                    {stage.internalLink.label}
                  </Link>
                ) : null}
              </article>
            </li>
          ))}
        </ol>
      </section>

      {/* 채용 절차 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-heading font-extrabold break-keep">채용 절차</h2>
        <ol className="flex flex-wrap items-center gap-2">
          {hiringProcess.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <span className="chip text-label font-semibold">
                <span
                  className="text-accent dark:text-accent-dark"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                {step}
              </span>
              {index < hiringProcess.length - 1 ? (
                <span
                  className="text-badge-neutral-text dark:text-badge-neutral-text-dark"
                  aria-hidden="true"
                >
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <p className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          Software Engineer 채용 기준이며, 직군에 따라 단계는 달라질 수 있습니다.
        </p>
      </section>

      {/* 참고 자료 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-heading font-extrabold break-keep">
          참고한 채용, 블로그 자료
        </h2>
        <ul className="flex flex-col gap-2">
          {roadmapSources.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card-interactive panel flex min-h-11 items-center gap-2 p-3 text-label font-semibold"
              >
                <span className="text-accent dark:text-accent-dark" aria-hidden="true">
                  ↗
                </span>
                <span className="break-keep">{source.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
