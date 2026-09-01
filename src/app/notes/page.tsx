import Link from "next/link";
import { hasUnlockCookie } from "@/lib/auth";
import { readAllLessonNotes } from "@/lib/note-store";
import { getOrderedLessons } from "@/content/curriculum-helpers";
import { modules } from "@/content/modules";

// /notes 노트 단권화(quick 260901-x62) — 전 레슨 메모를 커리큘럼 순서로 한
// 페이지에 모아 보는 읽기 전용 집계. /review·/inbox와 같은 조립 순서를
// 재사용한다 — hasUnlockCookie() 최우선 → readAllLessonNotes(). 쿠키가 있어야만
// 메모 데이터에 접근하므로 동적 렌더가 필요하다(조건부 쿠키 접근이 캐시된
// 응답을 내보내는 문제 회피). 여기서 노트를 편집하지 않는다 — 편집은 레슨
// 메모장(lesson-notepad.tsx)의 몫이다.
export const dynamic = "force-dynamic";

const moduleTitleById = new Map(modules.map((m) => [m.id, m.title]));

function EmptyState({ message }: { message: string }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="panel-hero flex flex-col gap-2 px-4 py-4 sm:px-6 sm:py-6">
        <h1 className="text-display font-black">노트</h1>
        <p className="text-body font-normal">{message}</p>
      </header>
    </main>
  );
}

export default async function NotesPage() {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다 — 홈·복습·질문함과 동일한
  // 게이트 순서(D8-P 원칙 승계).
  const unlocked = await hasUnlockCookie();
  if (!unlocked) {
    return <EmptyState message="노트 단권화는 잠금 해제 후 이용할 수 있어요. 홈에서 잠금을 해제해 주세요." />;
  }

  const notesRead = await readAllLessonNotes();
  if (!notesRead.ok) {
    return <EmptyState message="노트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." />;
  }

  const lessonsWithNotes = getOrderedLessons()
    .filter((lesson) => notesRead.notes.has(lesson.slug))
    .map((lesson) => ({ lesson, body: notesRead.notes.get(lesson.slug)! }));

  if (lessonsWithNotes.length === 0) {
    return (
      <EmptyState message="아직 저장된 메모가 없어요. 레슨을 읽으며 하단 메모장에 적으면 여기 모여요." />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="panel-hero flex flex-col gap-2 px-4 py-4 sm:px-6 sm:py-6">
        <h1 className="text-display font-black">노트</h1>
        <p className="text-body font-normal">
          모듈 순으로 모은 내 메모 단권화입니다. 여기서는 읽기만 해요 — 고치려면 해당 레슨 하단 메모장을
          열어주세요.
        </p>
      </header>

      <section className="flex flex-col gap-8">
        {lessonsWithNotes.map(({ lesson, body }, index) => {
          const prev = lessonsWithNotes[index - 1];
          const showModuleHeading = index === 0 || prev.lesson.moduleId !== lesson.moduleId;
          const moduleTitle = moduleTitleById.get(lesson.moduleId) ?? lesson.moduleId;

          return (
            <div key={lesson.slug} className="flex flex-col gap-3">
              {showModuleHeading ? (
                <h2 className="text-heading font-extrabold">{moduleTitle}</h2>
              ) : null}
              <div className="panel flex flex-col gap-3 overflow-x-auto p-4">
                <span className="text-body font-bold">{lesson.title}</span>
                <p className="text-body font-normal whitespace-pre-wrap">{body}</p>
                <Link href={lesson.permalink} className="chip tap-feedback min-h-11 w-fit items-center">
                  레슨으로 이동: {lesson.title}
                </Link>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
