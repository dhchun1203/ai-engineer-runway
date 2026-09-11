import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { hasUnlockCookie } from "@/lib/auth";
import { readProgressRows } from "@/lib/progress-store";
import { todayInSeoul, daysUntil } from "@/lib/today";
import { BasecampStepChecklist } from "@/components/basecamp/basecamp-step-checklist";
import { BasecampPastStep } from "@/components/basecamp/basecamp-past-step";
import {
  basecampSteps,
  basecampProgressId,
  BASECAMP_END_DATE,
  BASECAMP_INDEX_URL,
  type BasecampStep,
} from "@/content/basecamp";

export const metadata: Metadata = {
  title: "베이스캠프 선행 과제",
  description:
    "개강 전 매주 공개되는 공식 선행 과제를 준비하고 진도를 추적하는 최우선 트랙. STEP별 학습과 최종 과제, 우리 레슨 연결까지.",
};

// 베이스캠프 허브 — 홈과 같은 이유로 동적 렌더(쿠키·진도 조회). 진도는 curriculum과
// 같은 progress 테이블에서 bc: 접두사 행만 골라 읽는다.
export const dynamic = "force-dynamic";

export default async function BasecampPage() {
  const unlocked = await hasUnlockCookie();
  const progressRead = unlocked ? await readProgressRows() : null;
  const doneRawIds = new Set(
    progressRead?.ok ? progressRead.rows.map((row) => row.lessonSlug) : [],
  );

  const today = todayInSeoul();
  const daysLeft = daysUntil(BASECAMP_END_DATE, today);

  // 레이아웃 C — 공개된 STEP을 "지금 집중할 한 주차"와 "지난 주차"로 가른다.
  // 지금 집중 = 가장 최근 공개된 STEP(맨 아래 것), 지난 주차 = 그 앞의 공개 STEP들.
  // 이렇게 나눠야 주차가 매주 쌓여도 상단은 늘 이번 주 하나이고, 끝난 주차는
  // 접힌 한 줄로 남아 스크롤이 늘어나지 않는다.
  const releasedSteps = basecampSteps.filter((step) => step.released);
  const currentStep =
    releasedSteps.length > 0
      ? releasedSteps[releasedSteps.length - 1]
      : basecampSteps[0];
  const pastSteps = releasedSteps.slice(0, -1);

  // 한 STEP의 완료 항목 id(접두사 없는 item.id) 목록을 서버 진도에서 만든다.
  const doneIdsFor = (step: BasecampStep): string[] =>
    step.items
      .filter((item) => doneRawIds.has(basecampProgressId(item.id)))
      .map((item) => item.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="chip-solid w-fit text-label font-bold">최우선</span>
        <h1 className="text-display font-black break-keep">베이스캠프 선행 과제</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          개강 전 매주 한 STEP씩 공개되는 공식 선행 과제입니다. 이 트랙이 우리
          커리큘럼보다 우선입니다. 여기서 각 주차를 준비하고 완료를 체크하며, 같은
          주제를 더 깊게 다루는 우리 레슨으로 이어 봅니다.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip text-label font-semibold">
            {daysLeft > 0 ? `마감까지 D-${daysLeft}` : "진행 기간 종료"}
          </span>
          <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            {BASECAMP_END_DATE}까지 매주 STEP 공개
          </span>
          <a
            href={BASECAMP_INDEX_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link tap-feedback inline-flex min-h-11 items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark"
          >
            공식 과제 페이지
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          </a>
        </div>
      </header>

      {/* 지금 집중 — 이번 주 STEP 하나를 항상 펼쳐 둔다. */}
      <section className="flex flex-col gap-3">
        <span className="w-fit text-label font-bold text-accent dark:text-accent-dark">
          지금 집중
        </span>
        <BasecampStepChecklist
          step={currentStep}
          initialDoneIds={doneIdsFor(currentStep)}
          unlocked={unlocked}
        />
      </section>

      {/* 지난 주차 — 끝났거나 지난 STEP은 접힌 한 줄로. 누르면 그 자리에서 펼쳐 복습. */}
      {pastSteps.length > 0 ? (
        <section className="flex flex-col gap-3">
          <span className="text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
            지난 주차
          </span>
          <div className="flex flex-col gap-3">
            {pastSteps.map((step) => (
              <BasecampPastStep
                key={step.no}
                step={step}
                initialDoneIds={doneIdsFor(step)}
                unlocked={unlocked}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* 제출 안내 — 공식 과제는 그쪽 학습 사이트로 제출한다. */}
      <section className="panel flex flex-col gap-2 p-5">
        <h2 className="text-body font-extrabold break-keep">과제 제출은 이렇게</h2>
        <p className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          최종 과제는 Google Colab에서 직접 코드로 풀고, 공유 링크(링크가 있는 모든
          사용자, 뷰어 권한)를 공식 학습 사이트의 제출란에 붙여 제출합니다. 제출 전에
          로그인하지 않은 상태에서도 링크가 열리는지 확인하세요. 여기 체크는 나의
          준비 진도를 추적하는 용도이고, 실제 제출은 공식 사이트에서 이뤄집니다.
        </p>
      </section>

      {/* 다음 주차 예고 */}
      <section className="hairline flex flex-col gap-1.5 pt-6">
        <h2 className="text-body font-extrabold break-keep">다음 STEP</h2>
        <p className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          다음 STEP은 매주 순서대로 공개됩니다({BASECAMP_END_DATE}까지). 공개되는 대로
          여기에 같은 방식으로 준비 과정과 체크리스트, 우리 레슨 연결을 더합니다.
        </p>
      </section>
    </main>
  );
}
