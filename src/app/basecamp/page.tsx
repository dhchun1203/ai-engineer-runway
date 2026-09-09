import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { hasUnlockCookie } from "@/lib/auth";
import { readProgressRows } from "@/lib/progress-store";
import { todayInSeoul, daysUntil } from "@/lib/today";
import { BasecampCheck } from "@/components/basecamp/basecamp-check";
import {
  basecampSteps,
  basecampProgressId,
  countStepDone,
  BASECAMP_END_DATE,
  BASECAMP_INDEX_URL,
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

      {basecampSteps.map((step) => {
        const { done, total } = countStepDone(step, doneRawIds);
        return (
          <section key={step.no} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip text-label font-bold">{step.weekLabel}</span>
                <h2 className="text-heading font-extrabold break-keep">
                  {step.title}
                </h2>
                {unlocked ? (
                  <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    {done}/{total} 완료
                  </span>
                ) : null}
              </div>
              <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {step.summary}
              </p>
            </div>

            <ul className="flex flex-col gap-3">
              {step.items.map((item) => {
                const itemDone = doneRawIds.has(basecampProgressId(item.id));
                return (
                  <li
                    key={item.id}
                    className="panel flex items-start gap-3 p-4 sm:p-5"
                  >
                    {unlocked ? (
                      <BasecampCheck
                        itemId={item.id}
                        initialDone={itemDone}
                        label={item.title}
                      />
                    ) : (
                      <span
                        className="mt-0.5 h-6 w-6 shrink-0 border-2 border-line dark:border-line-dark"
                        aria-hidden="true"
                      />
                    )}
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="break-keep text-body font-extrabold">
                          {item.title}
                        </span>
                        {item.kind === "assignment" ? (
                          <span className="chip text-label font-bold text-action dark:text-action-dark">
                            과제
                          </span>
                        ) : null}
                      </div>
                      <p className="break-keep text-label font-normal leading-relaxed">
                        {item.summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                        <a
                          href={item.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nav-link tap-feedback inline-flex min-h-11 items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark"
                        >
                          공식 과제 열기
                          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                        </a>
                        {item.ourLessonHref ? (
                          <Link
                            href={item.ourLessonHref}
                            className="nav-link tap-feedback inline-flex min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
                          >
                            우리 레슨으로 깊게
                            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

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
