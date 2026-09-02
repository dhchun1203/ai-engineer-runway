import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { hasUnlockCookie } from "@/lib/auth";
import { readAllBookmarks, type Bookmark } from "@/lib/bookmark-store";
import { getOrderedLessons } from "@/content/curriculum-helpers";
import { modules } from "@/content/modules";
import { BookmarkRemoveButton } from "@/components/bookmark-remove-button";

// /bookmarks 북마크 단권화(quick 260902-bkm) — 전 레슨의 소제목 북마크를 커리큘럼
// 순서로 모아 보고, 각 항목을 그 소제목으로 딥링크하며, 여기서 해제도 한다. /notes·
// /review·/inbox와 같은 조립 순서를 재사용한다: hasUnlockCookie() 최우선 →
// readAllBookmarks(). 쿠키가 있어야만 데이터에 접근하므로 동적 렌더가 필요하다.
export const dynamic = "force-dynamic";

const moduleTitleById = new Map(modules.map((m) => [m.id, m.title]));

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

  // lessonId → 그 레슨의 북마크들(section_index 오름차순). 커리큘럼 순서 정렬은
  // 아래에서 getOrderedLessons()로 하므로 여기서는 레슨별로만 묶는다.
  const byLesson = new Map<string, Bookmark[]>();
  for (const row of read.rows) {
    const list = byLesson.get(row.lessonId) ?? [];
    list.push({ index: row.index, title: row.title });
    byLesson.set(row.lessonId, list);
  }
  for (const list of byLesson.values()) {
    list.sort((a, b) => a.index - b.index);
  }

  const lessonsWithBookmarks = getOrderedLessons()
    .filter((lesson) => byLesson.has(lesson.slug))
    .map((lesson) => ({ lesson, bookmarks: byLesson.get(lesson.slug)! }));

  if (lessonsWithBookmarks.length === 0) {
    return (
      <EmptyState message="아직 북마크가 없어요. 레슨을 읽다가 왼쪽 아래 북마크 버튼을 누르면 그 위치가 여기 모여요." />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="panel-hero flex flex-col gap-2 px-4 py-4 sm:px-6 sm:py-6">
        <h1 className="text-display font-black">북마크</h1>
        <p className="text-body font-normal">
          모듈 순으로 모은 내 북마크입니다. 각 항목을 누르면 그 소제목 위치로 바로 이동해요.
        </p>
      </header>

      <section className="flex flex-col gap-8">
        {lessonsWithBookmarks.map(({ lesson, bookmarks }, index) => {
          const prev = lessonsWithBookmarks[index - 1];
          const showModuleHeading = index === 0 || prev.lesson.moduleId !== lesson.moduleId;
          const moduleTitle = moduleTitleById.get(lesson.moduleId) ?? lesson.moduleId;

          return (
            <div key={lesson.slug} className="flex flex-col gap-3">
              {showModuleHeading ? (
                <h2 className="text-heading font-extrabold">{moduleTitle}</h2>
              ) : null}
              <div className="panel flex flex-col gap-3 p-4">
                <span className="text-body font-bold">{lesson.title}</span>
                <ul className="flex flex-col gap-2">
                  {bookmarks.map((bookmark) => {
                    const href = `${lesson.permalink}?section=${bookmark.index}&st=${encodeURIComponent(bookmark.title)}`;
                    return (
                      <li
                        key={bookmark.index}
                        className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-foreground pl-3 dark:border-foreground-dark"
                      >
                        <Link
                          href={href}
                          className="tap-feedback flex min-h-11 flex-1 items-center gap-2 text-body font-normal"
                        >
                          <ArrowRight className="size-4 shrink-0 text-accent dark:text-accent-dark" aria-hidden="true" />
                          <span>{bookmark.title || "레슨 처음"}</span>
                        </Link>
                        <BookmarkRemoveButton lessonId={lesson.slug} sectionIndex={bookmark.index} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
