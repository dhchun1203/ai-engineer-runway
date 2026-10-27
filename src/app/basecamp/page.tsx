import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, Flag } from "lucide-react";
import { SpotIllustration } from "@/components/illustrations/spot-illustration";
import { hasUnlockCookie } from "@/lib/auth";
import { readProgressRows } from "@/lib/progress-store";
import { todayInSeoul, daysUntil } from "@/lib/today";
import { BasecampStepChecklist } from "@/components/basecamp/basecamp-step-checklist";
import { BasecampPastStep } from "@/components/basecamp/basecamp-past-step";
import { BasecampPrepChecklist } from "@/components/basecamp/basecamp-prep-checklist";
import { BasecampPastPrep } from "@/components/basecamp/basecamp-past-prep";
import {
  basecampSteps,
  basecampProgressId,
  BASECAMP_END_DATE,
  BASECAMP_INDEX_URL,
  STEP2_ADVANCED_URL,
  step2AdvancedPrepLessons,
  step3ChatbotLessons,
  STEP3_CHATBOT_URL,
  step4AutomationLessons,
  STEP4_AUTOMATION_URL,
  step5PandasLessons,
  STEP5_PANDAS_URL,
  type BasecampStep,
} from "@/content/basecamp";
import { basecampQuizTotal } from "@/content/basecamp-review";
import { MistakeNoteLink } from "@/components/mistake-note-link";

export const metadata: Metadata = {
  title: "베이스캠프 선행 과제",
  description:
    "개강 전 매주 공개되던 공식 선행 과제와 진도, STEP별 학습과 최종 과제, 우리 레슨 연결까지 복습용으로 모아 둔 곳.",
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
  // 마감일 다음 날부터 종료. 종료 후에는 "최우선" 표시를 내리고, 상단에 종료 안내와
  // 수업 복습으로 가는 길을 크게 둔다(2026-10-27). 페이지 자체는 복습용으로 남긴다.
  const ended = daysLeft < 0;
  const [, endMonth, endDay] = BASECAMP_END_DATE.split("-").map(Number);
  const endLabel = `${endMonth}월 ${endDay}일`;

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

  // 보강 레슨 묶음(step2/step3)의 완료 id 목록. STEP 항목과 같은 bc: 진도를 읽는다.
  const prepDoneIds = (lessons: readonly { id: string }[]): string[] =>
    lessons
      .filter((lesson) => doneRawIds.has(basecampProgressId(lesson.id)))
      .map((lesson) => lesson.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            {ended ? (
              <span className="chip w-fit text-label font-bold">종료됨</span>
            ) : (
              <span className="chip-solid w-fit text-label font-bold">최우선</span>
            )}
            <h1 className="text-display font-black break-keep">베이스캠프 선행 과제</h1>
            <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
              {ended
                ? "개강 전 매주 한 STEP씩 공개되던 공식 선행 과제입니다. 지난 주차와 보강 레슨, 복습 카드와 퀴즈는 모두 그대로 남아 있어 언제든 다시 볼 수 있습니다."
                : "개강 전 매주 한 STEP씩 공개되는 공식 선행 과제입니다. 이 트랙이 우리 커리큘럼보다 우선입니다. 여기서 각 주차를 준비하고 완료를 체크하며, 같은 주제를 더 깊게 다루는 우리 레슨으로 이어 봅니다."}
            </p>
          </div>
          <SpotIllustration name="basecamp" className="hidden w-28 shrink-0 sm:block lg:w-36" />
        </div>
        {ended ? (
          <div className="panel flex flex-col gap-3 border-l-4 border-l-accent p-5 dark:border-l-accent-dark">
            <p className="flex items-center gap-2 text-heading font-extrabold break-keep">
              <Flag className="h-5 w-5 shrink-0 text-accent dark:text-accent-dark" aria-hidden="true" />
              베이스캠프는 {endLabel}에 끝났어요
            </p>
            <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
              새 STEP은 더 공개되지 않아요. 이제는 정규 수업이 우선이라, 그날 배운 내용은
              수업 복습에서 이어 가요. 이 페이지는 복습용으로 남겨 둡니다.
            </p>
            <Link href="/class" className="btn-action tap-feedback inline-flex min-h-11 w-fit items-center gap-1.5 px-4 text-label">
              수업 복습으로 가기
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {ended ? null : (
            <>
              <span className="chip text-label font-semibold">
                {daysLeft > 0 ? `마감까지 D-${daysLeft}` : "오늘 마감"}
              </span>
              <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {BASECAMP_END_DATE}까지 매주 STEP 공개
              </span>
            </>
          )}
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
          {ended ? "마지막 주차" : "지금 집중"}
        </span>
        <BasecampStepChecklist
          step={currentStep}
          initialDoneIds={doneIdsFor(currentStep)}
          unlocked={unlocked}
        />
      </section>

      {/* 전체 복습 — 지금까지의 STEP을 한 장씩 훑는 복습 카드와 STEP별 퀴즈로 가는 입구
          (2026-10-12). 둘 다 진도와 무관한 정적 페이지다. */}
      <section className="panel flex flex-col gap-3 p-5">
        <div className="flex flex-col gap-1.5">
          <span className="w-fit text-label font-bold text-accent dark:text-accent-dark">전체 복습</span>
          <h2 className="text-heading font-extrabold break-keep">지금까지 배운 것 복습하기</h2>
          <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
            STEP마다 할 수 있게 된 것, 핵심 문법, 자주 하는 실수, 최종 과제 흐름을 한 장으로 훑고,
            코드의 출력과 에러를 예측하는 퀴즈로 직접 꺼내 봐요.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/basecamp/review" className="btn tap-feedback text-label">
            복습 카드
          </Link>
          <Link href="/basecamp/quiz" className="btn tap-feedback text-label">
            복습 퀴즈 ({basecampQuizTotal}문항)
          </Link>
        </div>
        <MistakeNoteLink variant="link" label="오답 노트" />
      </section>

      {/* 지난 주차 — 끝났거나 지난 STEP은 접힌 한 줄로. 누르면 그 자리에서 펼쳐 복습.
          지금 집중이 바뀔 때마다 직전 STEP의 과제 보강도 여기에 접힌 행으로 내려온다
          (STEP 2 보강은 2026-09-21, STEP 3 보강은 2026-09-29, STEP 4 보강은 2026-10-12,
          STEP 5 보강은 2026-10-20 STEP 6 복습 주간 공개와 함께). */}
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
            {/* STEP 5 과제 보강 — 지난 주차로 내려온 접이식 보강 묶음(최근 것이 위). */}
            <BasecampPastPrep
              label="STEP 5 과제 보강"
              title="엑셀 자동 정리 툴 Pandas로 다시 만들기"
              description="STEP 5 최종 과제인 STEP 4 코드의 Pandas 번역을 두 편에 걸쳐 함께 해 보는 레슨입니다. STEP 4 보강에서 만든 서점 툴을 덩어리별로 Pandas로 옮기고, 두 버전의 결과 파일이 같은지까지 확인합니다."
              officialUrl={STEP5_PANDAS_URL}
              officialLabel="공식 Pandas 과제 열기"
              lessons={step5PandasLessons}
              initialDoneIds={prepDoneIds(step5PandasLessons)}
              unlocked={unlocked}
            />
            {/* STEP 4 과제 보강 — 지난 주차로 내려온 접이식 보강 묶음. */}
            <BasecampPastPrep
              label="STEP 4 과제 보강"
              title="엑셀 자동 정리 툴 함께 만들기"
              description="STEP 4 최종 과제인 엑셀 자동 정리 툴을 두 편에 걸쳐 직접 만들며, 필요한 개념을 그때그때 익히는 레슨입니다. 서점 지점 파일로 툴을 처음부터 끝까지 완성해 봅니다. 위의 STEP 5 과제 보강이 이 서점 툴을 Pandas로 번역합니다."
              officialUrl={STEP4_AUTOMATION_URL}
              officialLabel="공식 엑셀 자동화 과제 열기"
              lessons={step4AutomationLessons}
              initialDoneIds={prepDoneIds(step4AutomationLessons)}
              unlocked={unlocked}
            />
            {/* STEP 3 과제 보강 — 지난 주차로 내려온 접이식 보강 묶음. */}
            <BasecampPastPrep
              label="STEP 3 과제 보강"
              title="Q&A 챗봇 함께 만들기"
              description="STEP 3 최종 과제인 Q&A 챗봇을 직접 만들며 필요한 개념을 그때그때 익히는 레슨입니다. 1~3편이 기본이고, 4편과 5편은 공식 2단계의 선택 심화(A: 더 똑똑하게, B: UX 다듬기)입니다."
              officialUrl={STEP3_CHATBOT_URL}
              officialLabel="공식 챗봇 과제 열기"
              lessons={step3ChatbotLessons}
              initialDoneIds={prepDoneIds(step3ChatbotLessons)}
              unlocked={unlocked}
            />
            {/* STEP 2 과제 보강 — 지난 주차로 내려온 접이식 보강 묶음. */}
            <BasecampPastPrep
              label="STEP 2 과제 보강"
              title="심화 과제 보강 레슨"
              description="STEP 2 최종 과제의 심화 버전을 스스로 풀 수 있도록, 필요한 기법을 더 깊게 다루는 레슨입니다. 문제를 대신 풀어 주지 않고, 같은 기법을 다른 예제로 익혀 직접 적용하도록 돕습니다."
              officialUrl={STEP2_ADVANCED_URL}
              officialLabel="공식 심화 과제 열기"
              lessons={step2AdvancedPrepLessons}
              initialDoneIds={prepDoneIds(step2AdvancedPrepLessons)}
              unlocked={unlocked}
            />
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

      {/* 다음 주차 예고 — 종료 후에는 더 공개될 STEP이 없으니 숨긴다. */}
      {ended ? null : (
      <section className="hairline flex flex-col gap-1.5 pt-6">
        <h2 className="text-body font-extrabold break-keep">다음 STEP</h2>
        <p className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          다음 STEP은 매주 순서대로 공개됩니다({BASECAMP_END_DATE}까지). 공개되는 대로
          여기에 같은 방식으로 준비 과정과 체크리스트, 우리 레슨 연결을 더합니다.
        </p>
      </section>
      )}
    </main>
  );
}
