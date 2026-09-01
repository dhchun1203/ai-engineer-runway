import Link from "next/link";
import { getAllTerms } from "@/content/curriculum-helpers";
import type { GlossarySection } from "@/content/curriculum-helpers";

// 완전 정적 단일 페이지(round2-j 권장 경로 3) — ProgressProvider·쿠키·진도
// 읽기 없음. 용어 표는 빌드타임에 velite.config.ts의 parseTermTable이
// 굳힌 정적 데이터라 런타임 사용자 입력이 전혀 없다. generateStaticParams는
// 단일 라우트라 불필요.
//
// .prose를 쓰지 않는다 — 이 페이지는 장문 산문이 아니라 구조화된 데이터
// (용어·정의·출처 목록)라 curriculum/step 페이지의 크림 종이·각진 패널
// 컴포넌트 클래스(.panel/.chip)를 직접 조합하는 편이 맞다. .prose를 썼다면
// @tailwindcss/typography 기본 pre/table 다크 배경이 라이트 모드에서도
// 어둡게 뜨는 결함을 물려받았을 것이다.

export default function GlossaryPage() {
  const glossary = getAllTerms();
  const hasSections = glossary.korean.length > 0 || glossary.latin.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="panel-hero flex flex-col gap-2 px-4 py-4 sm:px-6 sm:py-6">
        <h1 className="text-display font-black">용어집</h1>
        <p className="text-body font-normal">
          전 레슨에 나온 용어 {glossary.totalGroups}개, 총 {glossary.totalTerms}개 정의를 모았습니다. 같은 단어가
          레슨마다 다르게 쓰이면(다의어) 정의를 나눠 보여줍니다.
        </p>
      </header>

      {hasSections ? <JumpIndex korean={glossary.korean} latin={glossary.latin} /> : null}

      {glossary.korean.length > 0 ? (
        <section className="flex flex-col gap-8">
          {glossary.korean.map((section) => (
            <GlossarySectionBlock key={`ko-${section.bucket}`} prefix="ko" section={section} />
          ))}
        </section>
      ) : null}

      {glossary.latin.length > 0 ? (
        <section className="flex flex-col gap-8">
          {glossary.latin.map((section) => (
            <GlossarySectionBlock key={`en-${section.bucket}`} prefix="en" section={section} />
          ))}
        </section>
      ) : null}
    </main>
  );
}

function JumpIndex({ korean, latin }: { korean: GlossarySection[]; latin: GlossarySection[] }) {
  return (
    <nav aria-label="용어집 바로가기" className="flex flex-wrap gap-2">
      {korean.map((section) => (
        <a
          key={`jump-ko-${section.bucket}`}
          href={`#ko-${section.bucket}`}
          className="chip tap-feedback min-h-11 items-center"
        >
          {section.bucket}
        </a>
      ))}
      {latin.map((section) => (
        <a
          key={`jump-en-${section.bucket}`}
          href={`#en-${section.bucket}`}
          className="chip tap-feedback min-h-11 items-center"
        >
          {section.bucket}
        </a>
      ))}
    </nav>
  );
}

function GlossarySectionBlock({ prefix, section }: { prefix: "ko" | "en"; section: GlossarySection }) {
  const anchorId = `${prefix}-${section.bucket}`;

  return (
    <div id={anchorId} className="flex flex-col gap-3" style={{ scrollMarginTop: "var(--site-header-height)" }}>
      <h2 className="text-heading font-extrabold">{section.bucket}</h2>
      <ul className="flex flex-col gap-3">
        {section.groups.map((group) => (
          <li key={group.word} className="panel flex flex-col gap-2 px-4 py-3">
            <span className="text-body font-bold">{group.word}</span>
            <ol className="flex flex-col gap-3">
              {group.definitions.map((def, index) => (
                <li key={`${def.source.lessonSlug}-${index}`} className="flex flex-col gap-1.5">
                  <span className="text-label font-normal">{def.definition}</span>
                  <Link
                    href={def.source.permalink}
                    className="chip tap-feedback min-h-11 w-fit items-center"
                  >
                    {def.source.lessonTitle}
                  </Link>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
    </div>
  );
}
