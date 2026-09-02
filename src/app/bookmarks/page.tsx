import Link from "next/link";
import { ArrowRight, Bookmark as BookmarkIcon, ChevronDown } from "lucide-react";
import { hasUnlockCookie } from "@/lib/auth";
import { readAllBookmarks, type Bookmark } from "@/lib/bookmark-store";
import { getModulesByStep, getLessonsByModule } from "@/content/curriculum-helpers";
import { steps, type StepId } from "@/content/modules";
import { BookmarkRemoveButton } from "@/components/bookmark-remove-button";

// /bookmarks — "전체 커리큘럼 목차 + 내 북마크 표시"(quick 260902-bkm). Step→모듈→레슨
// 전체 목차를 펼치되, 모듈을 <details>로 감싸 북마크가 있는 모듈만 펼치고 나머지는
// 접는다 — 35개 레슨이 한 번에 쏟아지지 않고, 내 북마크가 있는 곳만 바로 보인다.
// 접힌 모듈도 눌러 펼치면 그 안 레슨 목차를 볼 수 있다.
//
// <details>는 네이티브라 클라이언트 JS 없이 서버 렌더만으로 접힘/펼침이 동작한다
// (module-accordion.tsx가 세운 .panel group + group-open:rotate-180 패턴 재사용).
//
// /notes·/review·/inbox와 같은 게이트 순서: hasUnlockCookie() 최우선 → readAllBookmarks().
export const dynamic = "force-dynamic";

// 모듈 헤더(summary)에 그 모듈이 속한 Step 색을 왼쪽 굵은 선으로 얹는다 —
// module-accordion.tsx의 STEP_HEADER_CLASSES와 같은 리터럴(Tailwind JIT 대응).
const STEP_HEADER_CLASSES: Record<StepId, string> = {
  1: "bg-surface-2 border-l-4 border-l-step-1 dark:bg-surface-2-dark dark:border-l-step-1-dark",
  2: "bg-surface-2 border-l-4 border-l-step-2 dark:bg-surface-2-dark dark:border-l-step-2-dark",
  3: "bg-surface-2 border-l-4 border-l-step-3 dark:bg-surface-2-dark dark:border-l-step-3-dark",
};

function EmptyState({ message }: { message: string }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="panel-hero flex flex-col gap-2 px-4 py-4 sm:px-6 sm:py-6">
        <h1 className="text-display font-black">북마크</h1>
        <p className="text-body font-normal">{message}</p>
      </header>
    </main>
  );
}

export default async function BookmarksPage() {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다 — 홈·노트·복습과 동일한 게이트 순서.
  const unlocked = await hasUnlockCookie();
  if (!unlocked) {
    return <EmptyState message="북마크는 로그인 후 이용할 수 있어요. 상단 메뉴 '계정'에서 로그인해 주세요." />;
  }

  const read = await readAllBookmarks();
  if (!read.ok) {
    return <EmptyState message="북마크를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." />;
  }

  // lessonId → 그 레슨의 북마크들(section_index 오름차순).
  const byLesson = new Map<string, Bookmark[]>();
  for (const row of read.rows) {
    const list = byLesson.get(row.lessonId) ?? [];
    list.push({ index: row.index, title: row.title });
    byLesson.set(row.lessonId, list);
  }
  for (const list of byLesson.values()) {
    list.sort((a, b) => a.index - b.index);
  }

  const totalBookmarks = read.rows.length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="panel-hero flex flex-col gap-2 px-4 py-4 sm:px-6 sm:py-6">
        <h1 className="text-display font-black">북마크</h1>
        <p className="text-body font-normal">
          {totalBookmarks > 0
            ? "전체 커리큘럼 목차예요. 북마크한 곳이 있는 모듈은 펼쳐 두고 나머지는 접었어요 — 접힌 모듈도 눌러서 펼칠 수 있어요. 저장한 위치를 누르면 그 소제목으로 바로 이동합니다."
            : "전체 커리큘럼 목차예요. 아직 북마크가 없어요 — 레슨을 읽다가 왼쪽 아래 리본 버튼을 누르면 그 위치가 여기 표시됩니다. 모듈을 눌러 목차를 펼쳐 볼 수 있어요."}
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {steps.map((step) => (
          <section key={step.id} className="flex flex-col gap-4">
            <h2 className="text-heading font-extrabold">
              Step {step.id} · {step.title}
            </h2>

            {getModulesByStep(step.id).map((mod) => {
              const lessons = getLessonsByModule(mod.id);
              const moduleBookmarkCount = lessons.reduce(
                (sum, lesson) => sum + (byLesson.get(lesson.slug)?.length ?? 0),
                0,
              );
              const moduleHasBookmarks = moduleBookmarkCount > 0;

              return (
                <details
                  key={mod.id}
                  open={moduleHasBookmarks}
                  className="panel group overflow-hidden"
                >
                  <summary
                    className={`flex min-h-11 cursor-pointer list-none flex-col items-start gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${STEP_HEADER_CLASSES[step.id]}`}
                  >
                    <span className="min-w-0 text-subhead font-bold">{mod.title}</span>
                    <span className="flex shrink-0 items-center gap-2 text-label font-normal">
                      {moduleHasBookmarks ? (
                        <span className="flex items-center gap-1 font-bold">
                          <BookmarkIcon className="size-4 shrink-0 fill-current" aria-hidden="true" />
                          북마크 {moduleBookmarkCount}
                        </span>
                      ) : (
                        <span className="text-muted dark:text-muted-dark">레슨 {lessons.length}개</span>
                      )}
                      <ChevronDown
                        className="size-4 shrink-0 transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </span>
                  </summary>

                  <ul className="flex flex-col px-4 py-1">
                    {lessons.map((lesson) => {
                      const marks = byLesson.get(lesson.slug) ?? [];
                      const isMarked = marks.length > 0;

                      return (
                        <li key={lesson.slug} className="flex flex-col">
                          {/* 레슨 행 — 리본 슬롯(고정 폭)으로 제목 왼쪽을 정렬한다.
                              북마크된 레슨만 채운 리본 + 진한 제목, 나머지는 옅게. */}
                          <div className="flex min-h-11 items-center gap-2">
                            <BookmarkIcon
                              className={`size-4 shrink-0 ${
                                isMarked
                                  ? "fill-current text-foreground dark:text-foreground-dark"
                                  : "text-transparent"
                              }`}
                              aria-hidden="true"
                            />
                            {lesson.hasContent ? (
                              <Link
                                href={lesson.permalink}
                                className={`tap-feedback flex-1 text-body ${
                                  isMarked
                                    ? "font-bold"
                                    : "font-normal text-muted dark:text-muted-dark"
                                }`}
                              >
                                {lesson.title}
                              </Link>
                            ) : (
                              <span className="flex-1 text-body font-normal text-badge-neutral-text opacity-70 dark:text-badge-neutral-text-dark">
                                {lesson.title}
                              </span>
                            )}
                          </div>

                          {/* 북마크된 소제목들 — 리본 슬롯 폭만큼 들여쓴 좌측 잉크 라인 아래로. */}
                          {isMarked ? (
                            <ul className="mb-1 ml-6 flex flex-col gap-2 border-l-2 border-foreground pl-3 dark:border-foreground-dark">
                              {marks.map((mark) => {
                                const href = `${lesson.permalink}?section=${mark.index}&st=${encodeURIComponent(mark.title)}`;
                                return (
                                  <li
                                    key={mark.index}
                                    className="flex flex-wrap items-center justify-between gap-3"
                                  >
                                    <Link
                                      href={href}
                                      className="tap-feedback flex min-h-11 flex-1 items-center gap-2 text-body font-normal"
                                    >
                                      <ArrowRight
                                        className="size-4 shrink-0 text-accent dark:text-accent-dark"
                                        aria-hidden="true"
                                      />
                                      <span>{mark.title || "레슨 처음"}</span>
                                    </Link>
                                    <BookmarkRemoveButton lessonId={lesson.slug} sectionIndex={mark.index} />
                                  </li>
                                );
                              })}
                            </ul>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })}
          </section>
        ))}
      </div>
    </main>
  );
}
