import Link from "next/link";
import { ArrowRight, Bookmark as BookmarkIcon } from "lucide-react";
import { hasUnlockCookie } from "@/lib/auth";
import { readAllBookmarks, type Bookmark } from "@/lib/bookmark-store";
import { getModulesByStep, getLessonsByModule } from "@/content/curriculum-helpers";
import { steps } from "@/content/modules";
import { BookmarkRemoveButton } from "@/components/bookmark-remove-button";

// /bookmarks — "전체 커리큘럼 목차 + 내 북마크 표시"(quick 260902-bkm 개정). 북마크만
// 딸랑 모으지 않고 Step → 모듈 → 레슨 전체 목차를 쭉 펼친 뒤, 내가 북마크한 레슨에만
// 채운 리본을 달고 그 아래 저장한 소제목 위치를 펼쳐 보인다. 목차 전체가 보이므로 내
// 북마크가 커리큘럼 어디에 흩어져 있는지 한눈에 잡힌다.
//
// /notes·/review·/inbox와 같은 게이트 순서: hasUnlockCookie() 최우선 → readAllBookmarks().
// 쿠키가 있어야만 데이터에 접근하므로 동적 렌더가 필요하다.
export const dynamic = "force-dynamic";

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
            ? "전체 커리큘럼 목차예요. 북마크한 레슨은 리본으로 표시되고, 그 아래 저장한 위치가 펼쳐집니다. 위치를 누르면 그 소제목으로 바로 이동해요."
            : "전체 커리큘럼 목차예요. 아직 북마크가 없어요 — 레슨을 읽다가 왼쪽 아래 리본 버튼을 누르면 그 위치가 여기 표시됩니다."}
        </p>
      </header>

      <div className="flex flex-col gap-12">
        {steps.map((step) => (
          <section key={step.id} className="flex flex-col gap-6">
            <h2 className="text-heading font-extrabold">
              Step {step.id} · {step.title}
            </h2>

            {getModulesByStep(step.id).map((mod) => (
              <div key={mod.id} className="flex flex-col gap-2">
                <h3 className="text-subhead font-bold text-muted dark:text-muted-dark">{mod.title}</h3>

                <ul className="flex flex-col">
                  {getLessonsByModule(mod.id).map((lesson) => {
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

                        {/* 북마크된 소제목들 — 리본 슬롯 폭(size-4=1rem + gap-2=0.5rem)만큼
                            들여쓴 좌측 잉크 라인 아래로. 각 항목은 딥링크 + 해제. */}
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
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
