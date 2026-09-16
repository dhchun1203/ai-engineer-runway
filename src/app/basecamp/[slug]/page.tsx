import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MDXContent } from "@/components/mdx-content";
import {
  getBasecampLessonBySlug,
  getOrderedBasecampLessons,
} from "@/content/basecamp-lesson-helpers";
import { BasecampNote } from "@/components/basecamp-note";
import { BasecampCopyPrompt } from "@/components/lesson-copy-prompt";
import { PrintButton } from "@/components/print-button";
import { ReadingAssistant } from "@/components/reading-assistant/reading-assistant";

// 베이스캠프 전용 학습 레슨 리더 — 완전 정적. concepts·roadmap 리더와 같은 셸이되
// 진도·완료·복습·북마크가 전혀 없다(격리 컬렉션). 콘텐츠는 basecampLessons에서 온다.
// 부가 기능 중 진도에 매이지 않는 둘 — "클로드에 물어보기"(선생님 지침+본문 복사)와
// PDF 저장 — 만 정규 레슨과 동일하게 얹는다. 진도·메모·완료 목록은 없으므로 복사
// 프롬프트에는 지침과 본문만 담긴다(BasecampCopyPrompt).

// 복사·독서 도우미가 읽을 본문 컨테이너 id — 페이지당 하나뿐이라 상수로 둔다.
const BASECAMP_ARTICLE_ID = "basecamp-article";

export function generateStaticParams() {
  return getOrderedBasecampLessons().map((lesson) => ({ slug: lesson.slug }));
}

// 새 라우트라 Next의 타입드 라우트(PageProps<"/basecamp/[slug]">)에 아직 없으므로
// params를 직접 타이핑한다(빌드 전 tsc에서도 통과). App Router 표준 형태다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getBasecampLessonBySlug(slug);
  if (!lesson) return {};
  return { title: `${lesson.title} · 베이스캠프`, description: lesson.summary };
}

export default async function BasecampLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getBasecampLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  return (
    // note-page-spacer: 하단 고정 메모 시트가 마지막 콘텐츠를 가리지 않도록 하단
    // 여백을 준다(정규 레슨 페이지와 동일). 메모가 잠겨 렌더되지 않아도 여백만
    // 조금 남을 뿐이라, 마운트 후 잠금 여부가 확정되기 전 레이아웃 시프트를 피한다.
    <main className="note-page-spacer mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/basecamp"
            data-print-hide
            className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            베이스캠프
          </Link>
          <h1 className="text-display font-black break-keep">{lesson.title}</h1>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip text-label font-bold">베이스캠프 학습</span>
              <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                약 {lesson.readingMinutes}분 읽기
              </span>
            </div>
            {/* 진도에 매이지 않는 두 입구 — 정규 레슨 헤더와 동일한 배치. 선생님
                지침+본문을 클립보드에 담는 "클로드에 물어보기"와, 이 레슨 한 편을
                PDF로 뽑는 버튼(필기 여백 변형 포함). 자기 자신은 data-print-hide로
                종이에서 빠진다. */}
            <span className="flex flex-wrap items-start gap-2">
              <BasecampCopyPrompt
                lessonTitle={lesson.title}
                articleId={BASECAMP_ARTICLE_ID}
              />
              <PrintButton />
              <PrintButton annotate label="필기 여백으로 저장" />
            </span>
          </div>
        </header>

        <div id={BASECAMP_ARTICLE_ID} className="prose dark:prose-invert max-w-none">
          <MDXContent code={lesson.code} />
        </div>

        <nav aria-label="베이스캠프로 돌아가기" data-print-hide className="hairline pt-6">
          <Link
            href="/basecamp"
            className="card-interactive panel flex min-h-11 items-center gap-2 p-4 text-body font-bold"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            베이스캠프 전체 보기
          </Link>
        </nav>
      </article>

      {/* 하단 고정 메모장(정규 레슨과 동일 UI). 완전 정적 페이지 위에 얹는 얇은
          클라이언트 아일랜드로, 마운트 후 자기 메모만 읽어 온다. */}
      <BasecampNote slug={lesson.slug} />

      {/* 우측 고정 독서 도우미 — 본문(#basecamp-article)을 문장 단위로 확대하며
          읽어 주는 karaoke식 리더. 완전 정적 페이지 위에 얹는 클라이언트 아일랜드. */}
      <ReadingAssistant articleId="basecamp-article" />
    </main>
  );
}
