import type { Metadata } from "next";
import { hasUnlockCookie } from "@/lib/auth";
import { readProgressRows } from "@/lib/progress-store";
import { readLessonNote } from "@/lib/note-store";
import { normalizeRepoUrl, PRACTICE_REPO_NOTE_ID } from "@/lib/practice-repo";
import { PracticeRepoLink } from "@/components/practice/practice-repo-link";
import { PracticeUnitList } from "@/components/practice/practice-unit-list";
import { getOrderedPracticeUnits, PRACTICE_PROGRESS_PREFIX } from "@/content/practice-helpers";

export const metadata: Metadata = {
  title: "파이썬 손풀기",
  description:
    "개념은 짧게, 치는 시간은 길게. VS Code에서 가계부 프로그램을 일주일 동안 직접 키우는 파이썬 실습.",
};

// 파이썬 손풀기 목록. 완료 체크(pr: 행)를 읽어야 해서 동적이다(베이스캠프 허브와 같은 계약).
// 정규 커리큘럼 진행률과 학습 일정에는 집계되지 않는다.
export const dynamic = "force-dynamic";

const PREP_ITEMS = [
  "VS Code와 Python 확장(Microsoft에서 만든 것)",
  "uv (5회차 수업에서 설치한 것)",
  "git과 GitHub 계정",
];

export default async function PracticeIndexPage() {
  const unlocked = await hasUnlockCookie();
  const [progress, repoNote] = unlocked
    ? await Promise.all([readProgressRows(), readLessonNote(PRACTICE_REPO_NOTE_ID)])
    : [null, null];
  const initialDone = progress?.ok
    ? progress.rows
        .filter((row) => row.lessonSlug.startsWith(PRACTICE_PROGRESS_PREFIX))
        .map((row) => row.lessonSlug.slice(PRACTICE_PROGRESS_PREFIX.length))
    : [];
  const units = getOrderedPracticeUnits().map((u) => ({
    slug: u.slug,
    unit: u.unit,
    title: u.title,
    feature: u.feature,
    minutes: u.minutes,
    permalink: u.permalink,
  }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="chip w-fit text-label font-bold">번외 실습</span>
        <h1 className="text-display font-black break-keep">파이썬 손풀기</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          개념은 짧게, 치는 시간은 길게. 하루 한 단원씩 VS Code에서 가계부 프로그램을 직접 키워요.
        </p>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          따라 치기 칸에는 복사 버튼이 없어요. 손으로 쳐야 손에 남으니까요. 단계가 끝날 때마다 커밋하고, 단원이
          끝나면 GitHub에 올려요.
        </p>
      </header>

      <section className="panel flex flex-col gap-3 p-5">
        <h2 className="text-heading font-extrabold">시작 전 준비물</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {PREP_ITEMS.map((item) => (
            <li key={item} className="break-keep text-body font-normal">
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* 주소를 못 읽었을 때는 칸을 감춘다. 빈 입력칸을 보이면 저장한 주소가 사라진 것처럼 보인다. */}
      {repoNote?.ok ? <PracticeRepoLink initialUrl={normalizeRepoUrl(repoNote.body)} /> : null}

      <PracticeUnitList units={units} initialDone={initialDone} unlocked={unlocked} />
    </main>
  );
}
