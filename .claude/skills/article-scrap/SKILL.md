---
name: article-scrap
description: 현업 엔지니어링 기사를 이 사이트의 /articles(아티클)에 우리 말 요약으로 올린다. 사용자가 기사 링크를 주며 "넣어 줘", "스크랩", "아티클에 추가" 등을 말하거나, 매주 자동 수집 예약 실행이 돌 때 쓴다.
---

# 아티클 스크랩

현업 기사를 우리 말로 풀어 `src/content/articles/<slug>.mdx` 한 파일로 올린다. 목적은 공부(개념 풀이, 학습 연결)와 취업(면접 포인트, 채널톡 로드맵 연결) 둘 다다. 설계: `docs/superpowers/specs/2026-09-23-articles-section-design.md`.

## 절대 규칙

- 원문 전문이나 문단 번역을 싣지 않는다. 모든 문장은 우리 말로 새로 쓴다.
- 직접 인용은 기사당 한 문장 이하, 따옴표와 출처 표기. 원문 이미지와 도표는 가져오지 않는다.
- 수치와 사실은 "기사에 따르면"처럼 출처를 밝혀 적는다.
- 교육기관명 금지(항상 "AI Engineer 교육과정"). 가운데점(·)과 긴하이픈(—) 금지. 이모지 금지.
- 한국어는 2~3문장마다 문단을 끊는다. 쉬운 비유로 푼다(이 사이트 레슨 톤).
- **연결을 억지로 만들지 않는다.** 우리 레슨이나 로드맵과 실제로 같은 내용을 다룰 때만 잇는다. 레슨 제목만 비슷하고 내용이 다르면 잇지 않는다(링크 걸기 전에 그 레슨 본문을 grep으로 확인). 이어질 게 없으면 `## 내 학습과 연결`과 `related`를 통째로 뺀다.
- 기사를 고를 때도 "우리 레슨과 이어지는가"는 기준이 아니다. 기사 자체의 가치로 고른다.

## 절차

1. **원문 읽기**: 브라우저(JS 렌더 페이지 대응)로 본문 전체를 읽는다. 원제, 글쓴이, 발행일(YYYY-MM-DD), 정식 URL을 확인한다.
2. **중복 확인**: `grep -rh "^url:" src/content/articles/`로 같은 원문이 있으면 중단하고 알린다.
3. **파일 쓰기**: 아래 형식 그대로. slug는 `<출처 약칭>-<주제 영문 kebab>`(영문 소문자, 숫자, 하이픈).
4. **용어 연결**: "먼저 알아 둘 개념"의 각 용어를 본문에서 처음 쓸 때 `<Term id="...">단어</Term>`로 감싼다. id는 공용 용어 사전 `src/content/terms.ts`에서 찾는다(제목과 설명을 grep, 같은 뜻의 다른 표기도 확인). 없으면 사전 끝에 항목을 추가한다: `"영문-kebab-id": { title: "한글 (English)", body: "두세 문단, 빈 줄로 구분, 쉬운 비유" },`. 이 용어를 AI 뜯어보기 편(`src/content/concepts/`)이 실제로 같은 개념으로 깊게 다룰 때만 `concept: "<slug>"`를 더한다.
5. **검사** (하나라도 실패하면 고친다. 자동 수집에서는 고칠 수 없으면 그 글을 버린다):
   - `node scripts/check-articles.mjs` (기사와 용어 사전의 글자 검사)
   - `npx velite build`: velite는 스키마 위반을 경고(`[VELITE] issues:` 블록)로만 찍고 exit 0으로 끝날 수 있다. 이 저장소는 prepare 훅에서 명시적으로 throw해(태그, 요약, 본문 h2, 원문 url 중복, 사전에 없는 `<Term id>`, 스키마 위반으로 조용히 빠진 문서를 잡는 파일 수 검사) 빌드를 실패시킨다. 판정은 `npx velite build`의 종료 코드가 0이고 출력에 `issues`나 `Error`가 없어야 통과.
   - `npx next typegen && npx tsc --noEmit -p .` (그냥 `tsc`만 돌리면 라우트 타입이 없어 이 저장소에서는 원래부터 실패한다)
   - `node scripts/check-font-glyph-coverage.mjs 2>&1 | tail -4`: 알려진 기존 누락 21자 외의 새 코드포인트가 없어야 한다(새 한글 누락이 나오면 수동 경로는 `node scripts/subset-font.mjs` 재실행, 자동 경로는 그 단어를 다른 말로 바꾼다)
   - `node scripts/check-brand.mjs 2>&1 | grep -i articles` 에 걸리는 것이 없어야 한다
   - 원문 url이 열리는지 확인
   - 스스로 점검: 원문 문장을 옮긴 곳이 없는가, 인용이 한 문장 이하인가, 억지로 이은 레슨이나 로드맵 단계가 없는가
6. **게시**: 수동 경로는 아이패드 크기(768px)로 `/articles`와 새 글을 열어 확인한 뒤 커밋, push. 자동 경로는 아래 "자동 수집" 절.

## 파일 형식

```mdx
---
title: "우리 말 제목"
originalTitle: "Original Title As Published"
source: "Linear 블로그"
author: "글쓴이"            # 없으면 줄 삭제
publishedAt: "2026-09-21"
addedAt: "2026-09-23"       # 올리는 날(한국 시간)
url: "https://..."
tags: ["DevOps", "AI 코딩"] # 1~3개, 아래 목록에서만
summary:
  - "첫 줄: 무슨 문제였나"
  - "둘째 줄: 어떻게 풀었나"
  - "셋째 줄: 결과와 의미"
related:                    # 사이트 내부 링크만, 없으면 줄 삭제
  - label: "로드맵: AI 코드에 자동 테스트 붙이기"
    href: "/roadmap/automated-testing"
origin: "manual"            # 자동 수집이면 "auto"
slug: "source-topic"
---

## 먼저 알아 둘 개념
(기사를 읽는 데 필요한 용어 3~6개. 용어마다 짧은 소제목(###)과 쉬운 비유)

## 핵심 내용 정리
(문제, 해결책, 수치 효과를 우리 말로. 기사 구조를 따라가되 번역하지 않는다)

## 취업과 면접 포인트
(면접에서 쓸 수 있는 한 마디, 현업이 원하는 역량. 채널톡 로드맵은 실제로 맞닿을 때만 언급)

## 내 학습과 연결
(선택. 관련 레슨이나 로드맵이 실제로 같은 내용을 다룰 때만. 없으면 이 h2와 related를 통째로 뺀다)

## 스스로 확인하기
(질문 2~3개, 그 뒤에 <details><summary>정답 확인</summary> ... </details>)
```

MDX 주의: 본문 산문에 `{`, `}`, `<`를 그대로 쓰지 않는다(JSX로 해석된다). 코드나 기호는 백틱으로 감싼다. 쓸 수 있는 태그는 `<Term id="...">`와 정답 접기용 `<details>`, `<summary>`뿐이다. 글자는 한글 음절, ASCII, 그리고 `“ ” ‘ ’ … → × ≈`만 쓴다(`check-articles.mjs`가 막는다).

분야 태그: `AI 코딩`, `LLM`, `RAG`, `에이전트`, `평가`, `DevOps`, `백엔드`, `프론트엔드`, `데이터`, `제품`, `커리어`. 새 태그가 필요하면 `src/content/article-tags.ts`와 설계 문서 3.3을 함께 고친다.

채널톡 로드맵 단계 id: `foundations`, `python-eng`, `llm-core`, `rag`, `agents`, `evals`, `production`, `mindset` (`src/content/channeltalk-roadmap.ts`). 로드맵 레슨 목록: `src/content/roadmap-lessons/`의 slug.

## 자동 수집 (매주 월요일 예약 실행)

1. `git pull --rebase origin master`
2. 아래 출처에서 최근 14일 안의 글 후보를 모은다.
3. 2편을 고른다: 기사 자체의 가치(현업의 설계 판단, 수치, 시행착오가 분명하고 AI Engineer 실무에 의미 있는 글)로 고른다. 우리 레슨과의 연결은 고려하지 않는다. 국내 1편과 해외 1편을 섞되 한쪽에 적합한 글이 없으면 예외, 광고와 채용 공고와 행사 홍보와 얕은 글 제외, 이미 올린 url 제외. 적합한 글이 2편 미만이면 있는 만큼만.
4. 각 글을 위 절차 1~5로 쓴다. `origin: "auto"`.
5. 검사를 통과한 글만 `git add src/content/articles/<slug>.mdx src/content/terms.ts` 후 커밋: `feat(articles): 자동 수집 <제목>` + Co-Authored-By 줄. 통과 못 한 글은 파일을 지우고, 그 글 때문에 사전에 넣은 새 용어도 되돌린다(`git checkout src/content/terms.ts` 후 통과한 글의 용어만 다시 추가).
6. `git pull --rebase origin master && git push origin master`
7. 마지막 응답에 올린 글(제목, 원문 링크, 사이트 경로)과 버린 후보(이유)를 적는다.

### 출처

| 묶음 | 출처 |
| --- | --- |
| 국내 기술 블로그 | 토스(toss.tech), 당근(medium.com/daangn), 우아한형제들(techblog.woowahan.com), 카카오(tech.kakao.com), 네이버 D2(d2.naver.com), 채널톡(channel.io/ko/blog, 엔지니어링 글) |
| 해외 엔지니어링 블로그 | Anthropic(anthropic.com/engineering), OpenAI(openai.com/index), Vercel(vercel.com/blog), Linear(linear.app/now), Stripe(stripe.com/blog/engineering), GitHub(github.blog/engineering), Cloudflare(blog.cloudflare.com) |
| AI 실무 큐레이션 | Simon Willison(simonwillison.net), Latent Space(latent.space), Hacker News 상위 글(news.ycombinator.com) |

사용자가 "출처에 ○○ 추가해 줘"라고 하면 이 표를 고친다.

## 내리기

사용자가 "○○ 내려 줘"라고 하면 그 파일을 `git rm`하고 커밋, push한다.
