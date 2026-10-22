import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { HiringTimeline } from "@/components/roadmap/hiring-timeline";
import { isRoadmapViewer } from "@/lib/roadmap-access";
import { getRoadmapSessionNotes } from "@/content/roadmap-lesson-helpers";
import {
  talentTraits,
  roadmapStages,
  roadmapSources,
  type SkillCoverage,
} from "@/content/channeltalk-roadmap";

// 커버리지 라벨(강화/별도) 배지의 색과 글자를 한곳에서 정한다. 강화는 지면의
// 강조색(파랑), 별도는 행동색(주황)으로 갈라, "따로 챙겨야 하는 것"이 한눈에
// 튀게 한다. 라이트와 다크 모두 -dark 토큰으로 짝을 맞춘다.
const COVERAGE_LABEL: Record<SkillCoverage, string> = {
  reinforce: "강화",
  separate: "별도",
};

function coverageBadgeClass(coverage: SkillCoverage): string {
  const base =
    "inline-flex shrink-0 items-center border px-1.5 py-0.5 text-label font-bold leading-none";
  return coverage === "separate"
    ? `${base} border-action text-action dark:border-action-dark dark:text-action-dark`
    : `${base} border-accent text-accent dark:border-accent-dark dark:text-accent-dark`;
}

function coverageDotClass(coverage: SkillCoverage): string {
  return coverage === "separate"
    ? "bg-action dark:bg-action-dark"
    : "bg-accent dark:bg-accent-dark";
}

export const metadata: Metadata = {
  title: "채널톡 AI Engineer 로드맵",
  description:
    "채널톡(채널코퍼레이션) 채용 공고와 기술블로그를 분석해 뽑은 AI Engineer 진입 로드맵 — 기초부터 실전 태도까지 여덟 단계. 정규 학습 커리큘럼과 별개의 취업 목표 트랙.",
  // 소유자 개인용 페이지라 검색 색인을 막는다(/slack·/admin과 같은 방침).
  robots: { index: false, follow: false },
};

// 소유자 개인용 페이지다 — 허용 계정(소유자 + 테스터)만 접근할 수 있게 세션을 확인하므로
// 동적 렌더가 필요하다. 콘텐츠 자체는 src/content/channeltalk-roadmap.ts에서 오는 정적
// 데이터이지만, 접근 판정(isRoadmapViewer)이 요청별 세션을 읽는다.
export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  // 허용 계정이 아니면(비로그인 포함) 홈으로 돌려보낸다 — 메뉴 숨김과 별개로 URL 직접
  // 접근도 막는 서버 게이트다.
  if (!(await isRoadmapViewer())) {
    redirect("/");
  }

  const sessionNotes = getRoadmapSessionNotes();

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

      {/* 세션 노트 — 튜터링 같은 세션을 미리 숙지하고, 끝난 뒤 들은 것을 채워 두는 노트
          (2026-10-15). roadmapLessons 중 kind가 session인 것만 최신순으로 모은다. */}
      {sessionNotes.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-heading font-extrabold break-keep">세션 노트</h2>
            <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
              튜터링과 특강 같은 세션을 미리 숙지하고, 끝난 뒤 들은 내용을 채워 두는 노트예요.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {sessionNotes.map((note) => (
              <li key={note.slug}>
                <Link
                  href={note.permalink}
                  className="card-interactive panel flex min-h-11 flex-col gap-1.5 p-5"
                >
                  <span className="text-body font-extrabold break-keep">{note.title}</span>
                  <span className="text-label leading-relaxed break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    {note.summary}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 채널톡이 찾는 사람 — 인재상 분석 */}
      <section id="talent" className="flex scroll-mt-24 flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-heading font-extrabold break-keep">
            채널톡이 찾는 사람
          </h2>
          <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
            채용 공고, CTO 인터뷰, 기술블로그를 가로질러 반복되는 인재상을 일곱
            갈래로 정리했습니다. 로드맵의 모든 단계는 여기서 출발합니다.
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {talentTraits.map((trait) => (
            <li key={trait.title} className="panel card-hover-grow flex h-full flex-col gap-2 p-5">
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

          {/* 라벨 범례 — 각 역량이 기존 교육과정과 어떤 관계인지 두 갈래로 표시한다.
              기관명은 쓰지 않고 "AI Engineer 교육과정"으로만 부른다. */}
          <div className="panel flex flex-col gap-2.5 p-4">
            <div className="flex items-start gap-2.5">
              <span className={coverageBadgeClass("reinforce")}>강화</span>
              <p className="break-keep text-label font-normal leading-relaxed">
                기존 AI Engineer 교육과정에 있는 내용입니다. 과정을 들으며 채널톡
                수준으로 더 깊게 파고들 자리이고, 옆에 어느 Step에서 다루는지
                적어뒀습니다.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className={coverageBadgeClass("separate")}>별도</span>
              <p className="break-keep text-label font-normal leading-relaxed">
                교육과정에 없거나 얕게 다뤄서, 따로 챙겨 학습해야 하는 내용입니다.
              </p>
            </div>
          </div>
        </div>

        <ol className="flex flex-col gap-5">
          {roadmapStages.map((stage) => {
            const reinforceCount = stage.skills.filter(
              (skill) => skill.coverage === "reinforce",
            ).length;
            const separateCount = stage.skills.length - reinforceCount;
            return (
            <li key={stage.id} id={stage.id} className="scroll-mt-24">
              <article className="panel card-hover-grow flex flex-col gap-4 p-5 sm:p-6">
                {/* 단계 머리 — 번호, 아이콘, 제목, 부제, 커버리지 요약 */}
                <div className="flex items-start gap-3">
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
              </article>
            </li>
            );
          })}
        </ol>
      </section>

      {/* 채용 절차 — 세로 타임라인. 단계마다 무엇을 하는 자리인지 한 줄과, 이 로드맵의
          어느 단계로 준비하는지 바로가기를 붙인다(prep은 우리 매핑). */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-heading font-extrabold break-keep">채용 절차</h2>
          <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
            우리 목표인 Applied AI Engineer 공고의 절차입니다(2026년 10월 확인).
            단계마다 공고가 밝힌 진행 방식과, 이 로드맵의 어디서 준비하는지를 이어
            두었어요. 직군마다 다릅니다. Software Engineer는 1차가 라이브 코딩이고,
            Forward Deployed Engineer는 3일짜리 과제 전형이 더 있어요.
          </p>
        </div>
        <HiringTimeline />
        {/* 지원 자격 중 비전공자가 미리 알아야 할 줄 — 숨기지 않고 대비책과 함께 적는다. */}
        <p className="border-l-2 border-action pl-4 break-keep text-label font-normal leading-relaxed dark:border-action-dark">
          <span className="font-bold">지원 자격 체크:</span> 필수 자격에 &ldquo;컴퓨터공학,
          전자공학, 수학, 통계학 등 관련 전공 학사 이상&rdquo;이 들어 있어요. 비전공이라면
          서류에서 프로젝트와 운영 기록으로 문제 해결 역량을 증명해야 하는 지점이에요(10/16
          튜터링: 전공 조건은 포트폴리오로 넘을 수 있다).
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
                <ExternalLink className="h-4 w-4 shrink-0 text-accent dark:text-accent-dark" aria-hidden="true" />
                <span className="break-keep">{source.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
