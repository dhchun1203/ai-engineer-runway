// GET /offline-manifest.json: "전체 받기"가 받을 오프라인 대상 URL과 제목 목록(설계 3.2).
// velite 데이터로 만든다. 로드맵 레슨은 로드맵을 볼 수 있는 계정에게만 넣는다(소유자 개인용
// 제목이 다른 계정에 새지 않게). 그 판정이 요청별 세션을 읽어 이 라우트는 동적이고, 응답도
// 저장하지 않는다(no-store). 빌드 id는 참고용이다(캐시 이름은 클라이언트 번들에 박힌 같은
// 값을 쓴다). proxy가 로그인을 요구한다.
// /offline 화면은 이 파일을 캐시에도 넣어 두고, 오프라인 목차의 제목을 여기서 읽는다.

import { NextResponse } from "next/server";
import { getOrderedLessons, getStep } from "@/content/curriculum-helpers";
import { getOrderedBasecampLessons } from "@/content/basecamp-lesson-helpers";
import { getOrderedConcepts } from "@/content/concept-helpers";
import { getSortedTerms } from "@/content/term-helpers";
import { getOrderedRoadmapLessons } from "@/content/roadmap-lesson-helpers";
import { getSortedArticles } from "@/content/article-helpers";
import { isRoadmapViewer } from "@/lib/roadmap-access";
import type { OfflineManifest, OfflineManifestGroup, OfflineManifestItem } from "@/lib/offline/offline-logic";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

const STEP_IDS = [1, 2, 3] as const;

function item(url: string, title: string): OfflineManifestItem {
  return { url, title };
}

function seg(value: string): string {
  return encodeURIComponent(value);
}

export async function GET() {
  const roadmapGroup: OfflineManifestGroup[] = (await isRoadmapViewer())
    ? [
        {
          label: "로드맵",
          items: getOrderedRoadmapLessons().map((lesson) => item(`/roadmap/${seg(lesson.slug)}`, lesson.title)),
        },
      ]
    : [];

  const body: OfflineManifest = {
    buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? "dev",
    groups: [
      {
        label: "레슨",
        items: [
          item("/curriculum", "커리큘럼 전체"),
          ...STEP_IDS.map((id) => item(`/step/${id}`, `STEP ${id}. ${getStep(id)?.title ?? ""}`)),
          ...getOrderedLessons().map((lesson) => item(`/lesson/${seg(lesson.slug)}`, lesson.title)),
        ],
      },
      {
        label: "베이스캠프",
        items: getOrderedBasecampLessons().map((lesson) => item(`/basecamp/${seg(lesson.slug)}`, lesson.title)),
      },
      {
        label: "AI 뜯어보기",
        items: [
          item("/concepts", "AI 뜯어보기 목차"),
          ...getOrderedConcepts().map((concept) => item(`/concepts/${seg(concept.slug)}`, concept.title)),
          item("/concepts/terms", "용어 사전"),
          ...getSortedTerms().map((term) => item(`/concepts/terms/${seg(term.id)}`, term.title)),
        ],
      },
      ...roadmapGroup,
      {
        label: "아티클",
        items: [
          item("/articles", "아티클 목록"),
          ...getSortedArticles().map((article) => item(`/articles/${seg(article.slug)}`, article.title)),
        ],
      },
      {
        label: "기타",
        items: [item("/glossary", "용어집"), item("/about", "소개"), item("/offline", "오프라인 저장")],
      },
    ],
  };
  return NextResponse.json(body, { headers: NO_STORE_HEADERS });
}
