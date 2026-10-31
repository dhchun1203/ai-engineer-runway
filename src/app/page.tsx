import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { ProgressReadError } from "@/components/progress-error";
import { HomeCard, HomeCellBar } from "@/components/home-card";
import { TilStreak } from "@/components/til/til-streak";
import { SpotIllustration } from "@/components/illustrations/spot-illustration";
import { hasUnlockCookie } from "@/lib/auth";
import { isRoadmapViewer } from "@/lib/roadmap-access";
import { readProgressRows } from "@/lib/progress-store";
import { readReviewStates } from "@/lib/review-store";
import { listPublishedDates } from "@/lib/til/store";
import { todayInSeoul } from "@/lib/today";
import { basecampProgressId } from "@/content/basecamp";
import { latestClassLesson } from "@/content/class-lesson-helpers";
import { getClassSession } from "@/content/class-sessions";
import { computeDueClassSessions } from "@/lib/class-review";
import { getOrderedPracticeUnits, practiceProgressId } from "@/content/practice-helpers";
import { getRoadmapSessionNotes } from "@/content/roadmap-lesson-helpers";
import { roadmapStages } from "@/content/channeltalk-roadmap";

// 홈은 수업 복습, TIL 현황, 파이썬 손풀기, 로드맵 네 칸이다(2026-10-31 사용자 결정).
//
// 개인 진도와 오늘 날짜를 읽으므로 동적 렌더링이 필요하다. ISR(revalidate)도 쓰지 않는다.
// 설치된 Next 16.3.2 문서(node_modules/next/dist/docs/01-app/02-guides/
// incremental-static-regeneration.md)가 말하듯 재검증 창 만료 후 첫 요청은 낡은 페이지를
// 받는다. check-progress-gates.mjs G9의 DYNAMIC_GATED_PAGES가 이 선언을 상시 검사한다.
export const dynamic = "force-dynamic";

export default async function Home() {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다. 레슨/Step 페이지와 동일한 게이트 순서를
  // 지켜 조건부 호출이 만드는 캐시 문제를 피한다.
  const unlocked = await hasUnlockCookie();

  // 세 조회는 서로의 결과에 의존하지 않으므로 동시에 띄운다. 복습과 TIL 조회는 실패해도
  // 그 칸의 수치만 비우고, 진도 조회 실패만 배너로 알린다.
  const [progressRead, reviewRead, tilDatesRead, roadmapViewer] = await Promise.all([
    unlocked ? readProgressRows() : null,
    unlocked ? readReviewStates() : null,
    unlocked ? listPublishedDates() : null,
    isRoadmapViewer(),
  ]);
  const progressOk = Boolean(progressRead?.ok);
  const doneIds = new Set(progressRead?.ok ? progressRead.rows.map((row) => row.lessonSlug) : []);
  const today = todayInSeoul();

  // 수업 복습: 가장 최근 회차의 복습 체크(bc: 행, class-sessions.ts)와 간격 복습 차례.
  const latestClass = latestClassLesson();
  const classChecklist = latestClass ? (getClassSession(latestClass.slug)?.checklist ?? []) : [];
  const classDone = classChecklist.filter((item) => doneIds.has(basecampProgressId(item.id))).length;
  const classReviewDue = reviewRead?.ok ? computeDueClassSessions(reviewRead.states, today).length : 0;

  // TIL 현황: 발행일(서울 날짜)만으로 센다. 본문까지 읽는 목록 조회를 피한다.
  const tilDates = tilDatesRead?.ok ? tilDatesRead.data : null;
  const tilThisMonth = tilDates?.filter((date) => date.startsWith(today.slice(0, 7))).length ?? 0;

  // 파이썬 손풀기: 처음으로 안 끝낸 단원으로 바로 보낸다.
  const practiceUnits = getOrderedPracticeUnits();
  const practiceDone = practiceUnits.filter((u) => doneIds.has(practiceProgressId(u.slug))).length;
  const practiceNext = practiceUnits.find((u) => !doneIds.has(practiceProgressId(u.slug)));

  const roadmapNotes = getRoadmapSessionNotes();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-display font-black">오늘의 학습</h1>
          <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            AI Engineer 교육과정
          </p>
        </div>
        <SpotIllustration name="today" className="hidden w-28 shrink-0 sm:block lg:w-36" />
      </header>

      {progressRead && !progressRead.ok ? <ProgressReadError /> : null}

      {/* 로드맵은 허용 계정만 볼 수 있어서 칸이 셋일 때가 있다. 그때는 수업 복습을 한 줄로 넓혀 빈칸을 없앤다. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={`flex flex-col gap-3 ${roadmapViewer ? "" : "sm:col-span-2"}`}>
          <div className="flex-1">
            <HomeCard
              href="/class"
              icon="class"
              label="수업 복습"
              title={latestClass ? `${latestClass.session}회차 ${latestClass.title}` : "아직 정리된 수업이 없어요"}
              detail={
                !progressOk || classChecklist.length === 0
                  ? "최근 수업을 복습하세요"
                  : classDone === classChecklist.length
                    ? "복습 체크 완료"
                    : `복습 체크 ${classDone}/${classChecklist.length}`
              }
              cta="수업 복습으로 가기"
            >
              {progressOk ? <HomeCellBar done={classDone} total={classChecklist.length} /> : null}
            </HomeCard>
          </div>
          {classReviewDue > 0 ? (
            <Link
              href="/review"
              className="card-interactive panel flex min-h-11 items-center justify-between gap-3 px-5 py-3"
            >
              <span className="flex items-center gap-2 text-body font-bold break-keep">
                <RotateCcw className="h-4 w-4 shrink-0 text-accent dark:text-accent-dark" aria-hidden="true" />
                지난 수업 {classReviewDue}개, 다시 꺼내 볼 차례예요
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          ) : null}
        </div>

        <HomeCard
          href="/til"
          icon="til"
          label="TIL 현황"
          title={
            !tilDates
              ? "내 학습기록"
              : tilDates.includes(today)
                ? "오늘 기록을 남겼어요"
                : "오늘 기록은 아직이에요"
          }
          detail={
            tilDates ? `이번 달 ${tilThisMonth}편, 모두 ${tilDates.length}편` : "로그인하면 내 기록 현황이 보여요"
          }
          cta="TIL로 가기"
        >
          {tilDates ? <TilStreak dates={tilDates} /> : null}
        </HomeCard>

        <HomeCard
          href={practiceNext?.permalink ?? "/practice"}
          icon="practice"
          label="파이썬 손풀기"
          title={practiceNext ? `${practiceNext.unit}단원 ${practiceNext.title}` : "모든 단원을 끝냈어요"}
          detail={
            progressOk ? `${practiceDone}/${practiceUnits.length} 단원 완료` : "가계부 프로그램을 직접 치며 키워요"
          }
          cta={practiceNext ? (practiceDone > 0 ? "이어서 치기" : "시작하기") : "단원 목록 보기"}
        >
          {progressOk ? <HomeCellBar done={practiceDone} total={practiceUnits.length} /> : null}
        </HomeCard>

        {roadmapViewer ? (
          <HomeCard
            href="/roadmap"
            icon="roadmap"
            label="로드맵"
            title="채널톡 AI Engineer 진입 로드맵"
            detail={`${roadmapStages.length}단계, 특강 노트 ${roadmapNotes.length}개`}
            cta="로드맵으로 가기"
          />
        ) : null}
      </div>

      {/* 로그아웃 상태에서도 레슨은 볼 수 있다. 진도와 기록만 로그인한 계정에 저장된다. */}
      {!unlocked ? (
        <section className="panel card-hover-grow flex flex-col items-start gap-4 p-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-heading font-extrabold break-keep">로그인하고 이어가기</h2>
            <p className="max-w-xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
              진도, 복습, 학습기록은 로그인한 계정에 저장됩니다. 로그인하면 어느 기기에서든 그대로 이어집니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/login" className="btn-action tap-feedback text-body">
              로그인
            </Link>
            <Link href="/signup" className="btn tap-feedback text-body">
              회원가입
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
