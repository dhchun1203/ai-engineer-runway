# 아티클 섹션 + 매주 자동 수집 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현업 엔지니어링 기사를 우리 말로 풀어 쌓는 `/articles` 섹션(목록, 태그 필터, 상세, 하단 메모장)과 AI 뜯어보기의 "용어 사전" 층(공용 용어 사전)을 만들고, 첫 글(Linear CI 기사)을 올린 뒤, 매주 월요일 2편을 자동으로 써서 바로 게시하는 클라우드 예약 실행을 붙인다.

**Architecture:** 기사 한 편 = `src/content/articles/<slug>.mdx` 한 파일. velite 격리 컬렉션 `articles`가 frontmatter 스키마, 본문 h2 구조(필수 네 개 + 선택 한 개), 원문 url 중복을 빌드 시점에 강제한다. 페이지는 basecamp 레슨 셸을 재사용하고, 메모는 기존 `lesson_note` 저장소를 `article:` 접두사 키로 쓴다(DB 변경 없음). 용어 정의는 공용 용어 사전 `src/content/terms.ts` 한 곳에 두고(로드맵 사전을 넓힘), 기사와 로드맵 레슨의 `<Term>` 패널과 `/concepts/terms` 카드 페이지가 함께 쓴다. 작성 절차는 프로젝트 스킬 한 파일로 고정해 수동, 자동 두 경로가 공유한다.

**Tech Stack:** Next.js 16.3.2 App Router, velite 0.4, React 19, Tailwind v4, Supabase(`lesson_note` 재사용), Node 게이트 스크립트(`scripts/*.mjs`, 의존성 0), Claude 클라우드 예약 실행(schedule 스킬).

**Spec:** `docs/superpowers/specs/2026-09-23-articles-section-design.md`

## Global Constraints

- Next.js는 이 저장소 버전(16.3.2) 규칙을 따른다. 코드 쓰기 전 `node_modules/next/dist/docs/`의 해당 가이드를 확인한다. 페이지의 `params`, `searchParams`는 Promise다.
- 공개되는 모든 글과 UI에 교육기관명 금지(`scripts/check-brand.mjs`가 강제). 항상 "AI Engineer 교육과정".
- 기사 본문(mdx)에는 가운데점(U+00B7)과 긴하이픈(U+2014) 금지. 쉼표, 줄바꿈, 괄호로 쓴다.
- UI 버튼과 아이콘에 이모지 금지. 아이콘은 `lucide-react`.
- 한국어 장문은 2~3문장마다 문단을 끊는다.
- 터치 타깃 44px 이상(`min-h-11`), 아이패드(768px) 우선, 가로 넘침 없음.
- 저작권: 원문 전문, 문단 번역 금지. 직접 인용은 기사당 한 문장 이하. 원문 이미지 금지. "원문 열기" 링크 필수.
- 분야 태그 고정 목록: `AI 코딩`, `LLM`, `RAG`, `에이전트`, `평가`, `DevOps`, `백엔드`, `프론트엔드`, `데이터`, `제품`, `커리어`.
- 본문 h2(이 순서): `먼저 알아 둘 개념`, `핵심 내용 정리`, `취업과 면접 포인트`, `내 학습과 연결`(선택), `스스로 확인하기`. 선택 외에는 각 정확히 한 번.
- 용어 정의는 `src/content/terms.ts` 한 곳에만. 새 용어는 사전에 추가하고, 있거나 같은 뜻의 다른 표기가 있으면 재사용한다. `concept`(AI 뜯어보기 편 연결)는 실제로 같은 개념일 때만.
- 연결은 억지로 만들지 않는다(사용자 원칙): 우리 레슨, 로드맵과 실제로 같은 내용을 다룰 때만 `내 학습과 연결`과 `related`를 쓴다. 기사 선정 기준에 "우리 레슨과 이어지는가"를 넣지 않는다.
- 커밋 메시지 끝: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- 기존 상태 참고: `node scripts/check-font-glyph-coverage.mjs`는 **작업 전부터** Pretendard 비한글 21자(U+00F7, U+014D, U+203B, U+2197, U+21A9, U+21BA, U+21BB, U+2260, U+2423, U+2500, U+25B3, U+25B6, U+25BE, U+25C0, U+300A, U+300B, U+627F, U+71B1, U+7D50, U+8D77, U+8F49) 누락으로 실패한다. 이 작업의 기준은 "이 목록 밖의 새 누락이 생기지 않는 것"이다. `node scripts/check-brand.mjs`도 작업 전부터 기존 spec 문서 3곳 때문에 실패한다. 기준은 "새 위반이 없는 것"이다.

## File Structure

| 파일 | 역할 |
| --- | --- |
| `src/content/article-tags.ts` (생성) | 태그 목록과 h2 목록 상수, 타입가드. velite 설정과 앱이 함께 import하는 유일한 출처 |
| `velite.config.ts` (수정) | `articles` 컬렉션, h2 순서 검사, url 중복 검사(`prepare`) |
| `src/content/article-helpers.ts` (생성) | 정렬, 조회, 쓰인 태그, 날짜 표기 |
| `scripts/check-articles.mjs` (생성) | 기사 원문 문자 게이트(금지 표기, 허용 문자) |
| `scripts/check-font-glyph-coverage.mjs`, `scripts/subset-font.mjs` (수정) | 스캔 대상에 `src/content/articles` 추가 |
| `src/lib/article-note.ts` (생성) | 메모 키 `article:<slug>` 단일 지점 |
| `src/app/api/article-note/route.ts` (생성) | 메모 읽기 |
| `src/app/articles/[slug]/note-actions.ts` (생성) | 메모 쓰기 Server Action |
| `src/components/article-note.tsx` (생성) | 메모 아일랜드 |
| `src/app/articles/[slug]/page.tsx` (생성) | 상세 페이지 |
| `src/app/articles/page.tsx` (생성) | 목록 + 태그 필터 |
| `src/components/site-nav.tsx` (수정) | 더보기에 "아티클" |
| `src/content/articles/linear-ci-bottleneck.mdx` (생성) | 첫 글 |
| `.claude/skills/article-scrap/SKILL.md` (생성) | 공용 작성 절차서(수동, 자동) |
| `src/content/terms.ts` (`roadmap-terms.ts`에서 이동) | 공용 용어 사전 |
| `src/components/roadmap/term-panel.tsx` (수정) | id 기반 패널, 용어 페이지 링크 |
| `src/content/term-helpers.ts` (생성) | 용어 정렬, 조회, 나온 곳 |
| `src/app/concepts/terms/page.tsx`, `src/app/concepts/terms/[id]/page.tsx` (생성) | 용어 사전 목록, 용어 카드 |
| `src/app/concepts/page.tsx` (수정) | 용어 사전 입구 |

---

### Task 1: `articles` 컬렉션과 빌드 시점 검사

**Files:**
- Create: `src/content/article-tags.ts`
- Create: `src/content/article-helpers.ts`
- Modify: `velite.config.ts` (import 추가, `collections`에 `articles` 추가, 최상위 `prepare` 추가)

**Interfaces:**
- Produces: `ARTICLE_TAGS: readonly ArticleTag[]`, `type ArticleTag`, `isArticleTag(v: unknown): v is ArticleTag`, `ARTICLE_SECTIONS: readonly string[]`, `ARTICLE_OPTIONAL_SECTIONS: readonly string[]` (article-tags.ts)
- Produces: `type Article`, `getSortedArticles(): Article[]`, `getArticleBySlug(slug: string): Article | undefined`, `getUsedTags(list: Article[]): ArticleTag[]`, `formatKoreanDate(iso: string): string` (article-helpers.ts)
- Produces (velite 산출 필드): `title, originalTitle, source, author?, publishedAt, addedAt, url, tags, summary, related, origin, slug, code, permalink, readingMinutes`

- [ ] **Step 1: 상수 파일 작성**

`src/content/article-tags.ts`:

```ts
// 아티클(현업 기사 요약) 컬렉션의 고정 어휘. velite.config.ts(빌드 검사)와 앱
// (목록 필터, 상세 칩)이 모두 여기서만 가져온다. 표기 흔들림("Devops",
// "데브옵스")을 빌드에서 막는 것이 목적이라, 새 태그는 여기와 설계 문서
// (docs/superpowers/specs/2026-09-23-articles-section-design.md 3.3)를 함께 고친다.

export const ARTICLE_TAGS = [
  "AI 코딩",
  "LLM",
  "RAG",
  "에이전트",
  "평가",
  "DevOps",
  "백엔드",
  "프론트엔드",
  "데이터",
  "제품",
  "커리어",
] as const;

export type ArticleTag = (typeof ARTICLE_TAGS)[number];

export function isArticleTag(value: unknown): value is ArticleTag {
  return typeof value === "string" && (ARTICLE_TAGS as readonly string[]).includes(value);
}

// 본문 h2 목록(순서 포함). 작성 스킬과 빌드 검사가 같은 목록을 쓴다.
export const ARTICLE_SECTIONS = [
  "먼저 알아 둘 개념",
  "핵심 내용 정리",
  "취업과 면접 포인트",
  "내 학습과 연결",
  "스스로 확인하기",
] as const;

// 이 중 빠져도 되는 h2. 우리 레슨과 억지로 잇지 않는다는 원칙 때문에, 실제로
// 같은 내용을 다루는 레슨이 없으면 "내 학습과 연결"을 통째로 뺀다.
export const ARTICLE_OPTIONAL_SECTIONS: readonly string[] = ["내 학습과 연결"];
```

- [ ] **Step 2: velite 설정에 컬렉션 추가**

`velite.config.ts` 맨 위 import 줄들 아래에 추가:

```ts
import {
  ARTICLE_OPTIONAL_SECTIONS,
  ARTICLE_SECTIONS,
  ARTICLE_TAGS,
} from "./src/content/article-tags";
```

`compileBookMdx` 함수 정의 아래(= `export default defineConfig` 위)에 추가:

```ts
// 아티클 본문 h2 검사 — ARTICLE_SECTIONS 순서와 같아야 하고, 선택 h2
// (ARTICLE_OPTIONAL_SECTIONS)만 빠질 수 있다. 모르는 h2나 중복은 실패.
// 코드펜스 안의 "## "는 헤딩이 아니므로 건너뛴다(parseSelfCheck와 같은 방어).
function assertArticleSections(content: string, file: string): void {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const headings: string[] = [];
  let inFence = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && /^## /.test(line)) headings.push(line.slice(3).trim());
  }
  const expected = ARTICLE_SECTIONS.filter(
    (s) => headings.includes(s) || !ARTICLE_OPTIONAL_SECTIONS.includes(s),
  );
  const ok =
    headings.length === expected.length && headings.every((h, i) => h === expected[i]);
  if (!ok) {
    throw new Error(
      `articles: ${file}의 h2는 [${ARTICLE_SECTIONS.join(" / ")}] 순서여야 합니다(선택: ${ARTICLE_OPTIONAL_SECTIONS.join(", ")}). 실제: [${headings.join(" / ")}]`,
    );
  }
}

// 원문 url 중복 판별 키 — 호스트(소문자) + 끝 슬래시 뗀 경로. 쿼리와 해시는 무시한다.
function articleUrlKey(raw: string): string {
  const u = new URL(raw);
  return `${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, "")}`;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
```

`collections` 안, `basecampLessons` 항목 뒤에 추가:

```ts
    // 아티클(현업 엔지니어링 기사를 우리 말로 푼 요약) — 격리 컬렉션. 진도·일정·
    // 복습은 lessons만 소비하므로 어디에도 집계되지 않는다. 설계:
    // docs/superpowers/specs/2026-09-23-articles-section-design.md
    articles: {
      name: "Article",
      pattern: "src/content/articles/**/*.mdx",
      schema: s
        .object({
          title: s.string(),
          originalTitle: s.string(),
          source: s.string(),
          author: s.string().optional(),
          publishedAt: s.string().regex(ISO_DAY),
          addedAt: s.string().regex(ISO_DAY),
          url: s.string().url(),
          tags: s.array(s.enum(ARTICLE_TAGS)).min(1).max(3),
          summary: s.array(s.string().min(1)).length(3),
          related: s
            .array(s.object({ label: s.string(), href: s.string().regex(/^\/(?!\/)/) }))
            .default([]),
          origin: s.enum(["manual", "auto"]),
          slug: s.slug("articles"),
          code: s.mdx(),
        })
        .transform((data, { meta }) => {
          assertArticleSections(meta.content ?? "", String(meta.path));
          return {
            ...data,
            permalink: `/articles/${data.slug}`,
            readingMinutes: estimateBookMinutes(meta.content ?? ""),
          };
        }),
    },
```

`defineConfig({ ... })` 객체의 최상위(`collections`와 같은 층, `collections` 뒤)에 추가:

```ts
  // 컬렉션 전체를 봐야 하는 검사 — 원문 url 중복은 항목 단위 transform으로는 못 잡는다.
  prepare: ({ articles }) => {
    const seen = new Map<string, string>();
    for (const article of articles) {
      const key = articleUrlKey(article.url);
      const prev = seen.get(key);
      if (prev) {
        throw new Error(`articles: 원문 url 중복 ${article.url} (${prev}, ${article.slug})`);
      }
      seen.set(key, article.slug);
    }
  },
```

- [ ] **Step 3: 헬퍼 작성**

`src/content/article-helpers.ts`:

```ts
import { articles } from "#site/content";
import { ARTICLE_TAGS, type ArticleTag } from "@/content/article-tags";

// 아티클 데이터 접근 — 격리 컬렉션. 진도·일정·복습 계산은 이 파일을 참조하지 않는다.

export type Article = (typeof articles)[number];

/** 올린 날(addedAt) 최신순, 같은 날이면 원문 발행일 최신순. YYYY-MM-DD라 문자열 비교로 충분하다. */
export function getSortedArticles(): Article[] {
  return [...articles].sort(
    (a, b) => b.addedAt.localeCompare(a.addedAt) || b.publishedAt.localeCompare(a.publishedAt),
  );
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

/** 실제로 쓰인 태그만, ARTICLE_TAGS의 순서대로. 필터 칩 줄에 쓴다. */
export function getUsedTags(list: Article[]): ArticleTag[] {
  const used = new Set<string>(list.flatMap((a) => a.tags));
  return ARTICLE_TAGS.filter((tag) => used.has(tag));
}

/** "2026-09-21" -> "2026년 9월 21일" */
export function formatKoreanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}
```

- [ ] **Step 4: 빈 컬렉션으로 빌드가 통과하는지 확인**

Run: `npx velite build && npx tsc --noEmit -p .`
Expected: `build finished`, tsc 출력 없음(종료 코드 0). `.velite/articles.json`이 `[]`.

- [ ] **Step 5: 검사가 실제로 막는지 실패 테스트(임시 파일)**

`src/content/articles/zz-check.mdx`를 아래로 만든다(정상본):

```mdx
---
title: "검사용"
originalTitle: "Check"
source: "테스트"
publishedAt: "2026-09-01"
addedAt: "2026-09-02"
url: "https://example.com/a"
tags: ["DevOps"]
summary: ["하나", "둘", "셋"]
origin: "manual"
slug: "zz-check"
---

## 먼저 알아 둘 개념

가

## 핵심 내용 정리

나

## 취업과 면접 포인트

다

## 내 학습과 연결

라

## 스스로 확인하기

마
```

Run: `npx velite build; echo "exit=$?"` → Expected: 성공, `exit=0`.

이어서 한 가지씩 바꿔 실행하고 결과를 확인한 뒤 매번 원래대로 되돌린다. 1~5는 실패(오류 메시지)해야 하고, 6은 성공해야 한다.
1. `tags: ["Devops"]` → enum 오류
2. `summary: ["하나", "둘"]` → length 오류
3. `## 핵심 내용 정리` 줄 삭제 → `articles: ...의 h2는` 오류
4. `## 스스로 확인하기` 블록을 `## 내 학습과 연결` 위로 옮김 → 순서 오류
5. 파일을 `zz-check2.mdx`로 복사하고 `slug: "zz-check2"`만 바꿈(url 같음) → `원문 url 중복` 오류
6. `## 내 학습과 연결`과 그 아래 `라` 줄을 삭제 → **성공**(선택 h2)

주의: velite가 오류를 출력만 하고 종료 코드 0을 돌려주면, 출력에 오류 문자열이 있는지로 판정한다(`npx velite build 2>&1 | grep -E "error|오류|중복|h2는"`). 이 동작을 확인해 Task 5 스킬 파일의 검사 단계 문구에 반영한다.

확인이 끝나면 `zz-check*.mdx`를 모두 지우고 `npx velite build`가 다시 성공하는지 본다.

- [ ] **Step 6: Commit**

```bash
git add src/content/article-tags.ts src/content/article-helpers.ts velite.config.ts
git commit -m "feat(articles): 아티클 컬렉션과 빌드 시점 검사(태그, 요약, h2 순서, url 중복)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 기사 원문 문자 게이트와 글리프 스캔 범위

**Files:**
- Create: `scripts/check-articles.mjs`
- Modify: `scripts/check-font-glyph-coverage.mjs` (`contentFiles` 배열)
- Modify: `scripts/subset-font.mjs` (`contentFiles` 배열)

**Interfaces:**
- Produces: CLI `node scripts/check-articles.mjs [dir]` — 기본 dir `src/content/articles`. 인자 없이 실행하면 `src/content/terms.ts`(주석 줄 제외)도 검사한다. 위반 시 목록 출력 후 종료 코드 1, 통과 시 0, 검사할 것이 없으면 skip 메시지와 0.

- [ ] **Step 1: 실패 테스트 준비(스크립트 없이 실행)**

```bash
T=$(mktemp -d)
printf -- '---\ntitle: "x"\n---\n\n본문에 가운데점\xc2\xb7 과 긴하이픈\xe2\x80\x94 과 이모지\xf0\x9f\x98\x80\n' > "$T/bad.mdx"
node scripts/check-articles.mjs "$T"; echo "exit=$?"
```

Expected: `Cannot find module` 류 오류, `exit=1` (스크립트가 아직 없음).

- [ ] **Step 2: 스크립트 작성**

`scripts/check-articles.mjs`:

```js
#!/usr/bin/env node
// 아티클 원문 문자 게이트 — 외부 의존성 0, Node 표준 모듈만 사용.
//
// velite 스키마가 frontmatter 형식과 h2 순서를 검사한다면, 이 게이트는 "글자"를
// 검사한다. 두 가지를 막는다.
//   1) 사이트 글쓰기 금지 표기: 가운데점(U+00B7), 긴하이픈(U+2014), 교육기관명.
//   2) 허용 문자 밖의 글자: 이모지나 낯선 기호는 서브셋 폰트에 없어 깨지거나 다른
//      글꼴로 튄다. 한글 음절, 출력 가능한 ASCII, 아래 허용 기호만 쓴다.
//
// 사용: node scripts/check-articles.mjs [dir]   (기본: src/content/articles)

import fs from 'node:fs';
import path from 'node:path';

const customDir = process.argv[2];
const dir = path.resolve(customDir ?? path.join('src', 'content', 'articles'));

const files = fs.existsSync(dir)
  ? fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.mdx'))
      .map((e) => path.join(dir, e.name))
  : [];

// 기본 실행이면 공용 용어 사전(src/content/terms.ts)도 같은 규칙으로 본다. 설명
// 문구가 패널과 용어 카드로 그대로 공개되기 때문이다. 주석 줄(//)은 건너뛴다.
const TERMS_FILE = path.resolve('src', 'content', 'terms.ts');
const scanTerms = customDir === undefined && fs.existsSync(TERMS_FILE);

if (files.length === 0 && !scanTerms) {
  console.log(`check-articles: ${dir}에 검사할 기사 없음 — 건너뜀`);
  process.exit(0);
}

const FORBIDDEN = [
  { re: /·/, why: '가운데점(·) 금지' },
  { re: /—/, why: '긴하이픈(—) 금지' },
  { re: /kant/i, why: '교육기관명 금지' },
];

// 한글 음절, 출력 가능한 ASCII, 공백류, 그리고 이 기호들만 허용한다.
const EXTRA_ALLOWED = new Set(['“', '”', '‘', '’', '…', '→', '×', '≈']);

function isAllowed(ch) {
  const cp = ch.codePointAt(0);
  if (cp === 0x09 || cp === 0x0a || cp === 0x0d) return true;
  if (cp >= 0x20 && cp <= 0x7e) return true;
  if (cp >= 0xac00 && cp <= 0xd7a3) return true;
  return EXTRA_ALLOWED.has(ch);
}

const errors = [];

const targets = scanTerms ? [...files, TERMS_FILE] : files;

for (const file of targets) {
  const isTerms = file === TERMS_FILE;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (isTerms && line.trim().startsWith('//')) return;
    for (const { re, why } of FORBIDDEN) {
      if (re.test(line)) errors.push(`${file}:${i + 1}: ${why}`);
    }
    for (const ch of line) {
      if (!isAllowed(ch)) {
        const cp = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
        errors.push(`${file}:${i + 1}: 허용되지 않은 문자 U+${cp} "${ch}"`);
      }
    }
  });
}

if (errors.length > 0) {
  console.error(`check-articles: ${errors.length}건 위반`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`check-articles: 기사 ${files.length}편${scanTerms ? ' + 용어 사전' : ''} 통과`);
```

- [ ] **Step 3: 실패와 통과 확인**

```bash
node scripts/check-articles.mjs "$T"; echo "exit=$?"
```
Expected: 가운데점, 긴하이픈, `U+1F600` 위반 3건 이상, `exit=1`.

```bash
printf -- '---\ntitle: "x"\n---\n\n정상 문장입니다. CI -> 빨라졌다 “따옴표” 1.5배\n' > "$T/bad.mdx"
node scripts/check-articles.mjs "$T"; echo "exit=$?"
```
Expected: `기사 1편 통과`, `exit=0`.

```bash
node scripts/check-articles.mjs; echo "exit=$?"; rm -rf "$T"
```
Expected: `검사할 기사 없음 — 건너뜀`, `exit=0`. (이 시점엔 기사도 `terms.ts`도 아직 없다. `terms.ts`는 Task 3에서 생긴다.)

- [ ] **Step 4: 글리프 스캔 범위에 기사 추가**

`scripts/check-font-glyph-coverage.mjs`와 `scripts/subset-font.mjs`의 `contentFiles` 배열 두 곳 모두, lessons 줄 바로 아래에 한 줄 추가:

```js
  ...walkFiles(path.join(ROOT, 'src', 'content', 'articles'), /\.mdx$/),
```

Run: `node scripts/check-font-glyph-coverage.mjs 2>&1 | tail -4`
Expected: Global Constraints의 기존 21자 목록과 **같은** 누락만 보고(새 코드포인트 없음). Noto Serif KR 줄은 "통과".

- [ ] **Step 5: Commit**

```bash
git add scripts/check-articles.mjs scripts/check-font-glyph-coverage.mjs scripts/subset-font.mjs
git commit -m "feat(articles): 기사 원문 문자 게이트와 글리프 스캔 범위 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 공용 용어 사전으로 옮기기와 빌드 검사

**Files:**
- Move: `src/content/roadmap-terms.ts` → `src/content/terms.ts` (`git mv`)
- Modify: `src/content/terms.ts` (타입, export 이름, 머리 주석, 일부 항목에 `concept`)
- Modify: `src/components/roadmap/term-panel.tsx` (import, 상태를 id 기반으로, 패널 링크 두 개)
- Modify: `velite.config.ts` (`extractTermIds`, roadmapLessons와 articles에 `termIds`, `prepare` 확장)
- Create: `src/content/term-helpers.ts`
- Modify: `scripts/check-font-glyph-coverage.mjs`, `scripts/subset-font.mjs` (스캔 대상에 `src/content/terms.ts`)

**Interfaces:**
- Consumes: Task 1의 `articles` 컬렉션, `prepare`
- Produces: `type TermEntry = { title: string; body: string; concept?: string }`, `terms: Record<string, TermEntry>` (terms.ts)
- Produces (velite 산출 필드): roadmapLessons와 articles 항목에 `termIds: string[]`
- Produces: `type TermListItem = TermEntry & { id: string }`, `getSortedTerms(): TermListItem[]`, `getTerm(id: string): TermListItem | undefined`, `type TermUsage = { kind: "아티클" | "로드맵 레슨"; title: string; href: string }`, `getTermUsages(id: string): TermUsage[]` (term-helpers.ts)
- Produces: `TermPanelProvider`, `Term`(props `{ id, children }`)는 이름과 props 그대로. 패널에 `/concepts/terms/<id>` 링크가 생긴다(Task 4가 그 페이지를 만든다).

- [ ] **Step 1: 파일 옮기기와 이름 바꾸기**

```bash
git mv src/content/roadmap-terms.ts src/content/terms.ts
```

`src/content/terms.ts`에서:
- 머리 주석 첫 두 줄을 아래로 바꾼다.

```ts
// 공용 용어 사전 — 로드맵 심화 레슨과 아티클(기사 요약)이 함께 쓴다. 본문에서
// <Term id="...">로 감싼 단어를 누르면 우측 패널이 이 설명을 펼치고(term-panel.tsx),
// 각 항목은 AI 뜯어보기의 "용어 사전" 층(/concepts/terms/<id>)에 카드 페이지가 된다.
//
// concept: AI 뜯어보기 깊은 편의 slug. 그 편이 **실제로 같은 개념을 다룰 때만**
// 채운다(억지 연결 금지). 빌드(velite prepare)가 존재하지 않는 slug를 막는다.
```

- `export type RoadmapTerm = {` 블록을 아래로 바꾼다.

```ts
export type TermEntry = {
  /** 패널, 카드 제목 */
  title: string;
  /** 설명 본문. 빈 줄로 문단을 나눈다. */
  body: string;
  /** 같은 개념을 깊게 다루는 AI 뜯어보기 편 slug (있을 때만) */
  concept?: string;
};
```

- `export const roadmapTerms: Record<string, RoadmapTerm> = {`를 `export const terms: Record<string, TermEntry> = {`로 바꾼다.

- [ ] **Step 2: 패널을 새 사전에 맞추고 링크 추가**

`src/components/roadmap/term-panel.tsx`:
- import 줄 `import { roadmapTerms, type RoadmapTerm } from "@/content/roadmap-terms";`를 아래 두 줄로 바꾼다.

```tsx
import Link from "next/link";
import { terms, type TermEntry } from "@/content/terms";
```

- `import { X } from "lucide-react";`를 `import { ArrowRight, X } from "lucide-react";`로 바꾼다.
- 컨텍스트 타입과 상태를 id 기반으로 바꾼다.

```tsx
type ActiveTerm = { id: string; entry: TermEntry };

type TermPanelContextValue = {
  open: (id: string) => void;
};
```

`TermPanelProvider` 안:

```tsx
  const [active, setActive] = useState<ActiveTerm | null>(null);
```

```tsx
  const open = useCallback((id: string) => {
    const entry = terms[id];
    if (!entry) return;
    triggerRef.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;
    setActive({ id, entry });
  }, []);
```

- 렌더부의 `active.title`(두 곳: `aria-label`, `<h2>`)을 `active.entry.title`로, `active.body`를 `active.entry.body`로 바꾼다.
- 설명 문단 `</div>` 바로 뒤(`</aside>` 앞)에 추가:

```tsx
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href={`/concepts/terms/${active.id}`}
                className="card-interactive panel flex min-h-11 items-center justify-between gap-2 p-3 text-label font-bold"
              >
                용어 페이지 열기
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
              {active.entry.concept ? (
                <Link
                  href={`/concepts/${active.entry.concept}`}
                  className="card-interactive panel flex min-h-11 items-center justify-between gap-2 p-3 text-label font-bold"
                >
                  AI 뜯어보기에서 자세히
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
```

- `Term` 컴포넌트를 아래로 바꾼다.

```tsx
export function Term({ id, children }: { id: string; children: ReactNode }) {
  const { open } = useTermPanel();
  const entry = terms[id];
  if (!entry) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={() => open(id)}
      aria-label={`용어 설명 열기: ${entry.title}`}
      className="[font:inherit] cursor-pointer bg-transparent p-0 text-accent underline decoration-dashed underline-offset-2 dark:text-accent-dark"
    >
      {children}
    </button>
  );
}
```

Run: `grep -rn "roadmap-terms\|roadmapTerms\|RoadmapTerm" src scripts` → Expected: 출력 없음.

- [ ] **Step 3: velite에 termIds와 사전 검사 추가**

`velite.config.ts`:
- import 추가: `import { terms } from "./src/content/terms";`
- `articleUrlKey` 함수 아래에 추가:

```ts
// 본문의 <Term id="..."> 사용처를 뽑는다. 용어 카드의 "이 용어가 나온 곳"과
// 사전 누락 검사(prepare)가 이 목록을 쓴다.
function extractTermIds(content: string): string[] {
  return [...new Set([...content.matchAll(/<Term\s+id="([^"]+)"/g)].map((m) => m[1]))];
}
```

- `roadmapLessons`의 transform 반환 객체에 `termIds: extractTermIds(meta.content ?? ""),` 한 줄 추가.
- `articles`의 transform 반환 객체에도 `termIds: extractTermIds(meta.content ?? ""),` 한 줄 추가.
- Task 1의 `prepare` 전체를 아래로 바꾼다.

```ts
  // 컬렉션 전체를 봐야 하는 검사 — 원문 url 중복, 용어 사전 누락, 없는 개념 편 참조.
  prepare: ({ articles, roadmapLessons, concepts }) => {
    const problems: string[] = [];

    const seen = new Map<string, string>();
    for (const article of articles) {
      const key = articleUrlKey(article.url);
      const prev = seen.get(key);
      if (prev) problems.push(`articles: 원문 url 중복 ${article.url} (${prev}, ${article.slug})`);
      seen.set(key, article.slug);
    }

    for (const doc of [...articles, ...roadmapLessons]) {
      for (const id of doc.termIds) {
        if (!terms[id]) {
          problems.push(`${doc.permalink}: <Term id="${id}">가 src/content/terms.ts에 없습니다`);
        }
      }
    }

    const conceptSlugs = new Set(concepts.map((c) => c.slug));
    for (const [id, entry] of Object.entries(terms)) {
      if (entry.concept && !conceptSlugs.has(entry.concept)) {
        problems.push(`terms.${id}.concept "${entry.concept}"는 없는 AI 뜯어보기 편입니다`);
      }
    }

    if (problems.length > 0) throw new Error(problems.join("\n"));
  },
```

- [ ] **Step 4: 빌드 통과와 실패 테스트**

Run: `npx velite build 2>&1 | tail -3 && npx tsc --noEmit -p .`
Expected: 오류 없음(기존 로드맵 레슨의 용어 62개가 모두 사전에 있음을 사전 조사로 확인함).

실패 테스트(확인 후 되돌림):
1. `src/content/roadmap-lessons/01-automated-testing.mdx`의 첫 `<Term id="ci">`를 `<Term id="ci-typo">`로 → `<Term id="ci-typo">가 ...에 없습니다` 오류
2. `terms.ts`의 `ci` 항목에 `concept: "no-such"` 추가 → `없는 AI 뜯어보기 편` 오류

- [ ] **Step 5: 같은 개념인 항목에만 concept 채우기**

아래 후보마다 먼저 확인 명령을 돌려, 그 편 본문이 **그 개념 자체를 설명하는 문단**을 갖고 있을 때만 `concept`를 채운다. 제목만 비슷하거나 지나가듯 언급하면 채우지 않는다.

| 용어 id | 후보 편 slug | 확인 명령 |
| --- | --- | --- |
| `hallucination` | `hallucination` | `grep -c "환각" src/content/concepts/hallucination.mdx` |
| `rag` | `rag` | `grep -n "RAG" src/content/concepts/rag.mdx \| head -5` |
| `vector-search` | `rag` | `grep -n "임베딩 검색\|벡터" src/content/concepts/rag.mdx \| head -5` |
| `embedding` | `embeddings` | `grep -c "임베딩" src/content/concepts/embeddings.mdx` |
| `token` | `tokens` | `grep -c "토큰" src/content/concepts/tokens.mdx` |
| `context-window` | `context-window` | `grep -c "컨텍스트" src/content/concepts/context-window.mdx` |
| `fine-tuning` | `training-stages` | `grep -n "파인튜닝" src/content/concepts/training-stages.mdx \| head -5` |

채울 때는 항목의 `body` 뒤에 `concept: "<slug>",` 한 줄을 넣는다. 결정 결과(채움/안 채움과 이유)를 커밋 메시지 본문에 적는다.

Run: `npx velite build 2>&1 | tail -3` → 오류 없음.

- [ ] **Step 6: 용어 헬퍼**

`src/content/term-helpers.ts`:

```ts
import { articles, roadmapLessons } from "#site/content";
import { terms, type TermEntry } from "@/content/terms";

// 공용 용어 사전 데이터 접근. AI 뜯어보기 "용어 사전" 층(/concepts/terms)이 쓴다.

export type TermListItem = TermEntry & { id: string };

export type TermUsage = {
  kind: "아티클" | "로드맵 레슨";
  title: string;
  href: string;
};

/** 제목 가나다순(영문은 한글 뒤가 아니라 ko 로캘 규칙대로). */
export function getSortedTerms(): TermListItem[] {
  return Object.entries(terms)
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => a.title.localeCompare(b.title, "ko"));
}

export function getTerm(id: string): TermListItem | undefined {
  const entry = terms[id];
  return entry ? { id, ...entry } : undefined;
}

/** 이 용어를 <Term id>로 쓴 기사와 로드맵 레슨. velite가 뽑은 termIds로 계산한다. */
export function getTermUsages(id: string): TermUsage[] {
  return [
    ...articles
      .filter((a) => a.termIds.includes(id))
      .map((a) => ({ kind: "아티클" as const, title: a.title, href: a.permalink })),
    ...roadmapLessons
      .filter((l) => l.termIds.includes(id))
      .map((l) => ({ kind: "로드맵 레슨" as const, title: l.title, href: l.permalink })),
  ];
}
```

- [ ] **Step 7: 글자 게이트와 글리프 스캔에 사전 포함**

- `scripts/check-font-glyph-coverage.mjs`, `scripts/subset-font.mjs`의 `contentFiles` 배열에 `path.join(ROOT, 'src', 'content', 'terms.ts'),` 한 줄 추가(modules.ts 줄 아래).
- `node scripts/check-articles.mjs` 실행 → Task 2에서 넣은 사전 스캔이 이제 `terms.ts`를 읽는다. 위반이 나오면(기존 항목에 금지 문자) 그 항목 문구만 고친다.

Run:
```bash
node scripts/check-articles.mjs
node scripts/check-font-glyph-coverage.mjs 2>&1 | tail -4
npx tsc --noEmit -p .
```
Expected: 기사 게이트 통과(사전 포함), 글리프 누락은 기존 21자뿐, tsc 통과.

- [ ] **Step 8: 로드맵 패널 회귀 확인 (768px)**

dev 서버에서 `/roadmap/automated-testing`을 열고 본문의 "CI" 용어를 눌러 패널이 열리는지, 제목과 설명이 전과 같은지, "용어 페이지 열기" 링크가 보이는지 확인한다(링크 목적지는 Task 4에서 생긴다).

- [ ] **Step 9: Commit**

```bash
git add -A src/content/terms.ts src/content/roadmap-terms.ts src/components/roadmap/term-panel.tsx velite.config.ts src/content/term-helpers.ts scripts/check-font-glyph-coverage.mjs scripts/subset-font.mjs
git commit -m "feat(terms): 로드맵 용어 사전을 공용 용어 사전으로 넓히고 빌드 검사 추가

(Step 5의 concept 채움 결정 목록)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: AI 뜯어보기 "용어 사전" 층

**Files:**
- Create: `src/app/concepts/terms/page.tsx`
- Create: `src/app/concepts/terms/[id]/page.tsx`
- Modify: `src/app/concepts/page.tsx` (목록 아래 "용어 사전" 구역)

**Interfaces:**
- Consumes: `getSortedTerms`, `getTerm`, `getTermUsages` (Task 3), `getConceptBySlug` (`@/content/concept-helpers`)

- [ ] **Step 1: 용어 목록 페이지**

`src/app/concepts/terms/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSortedTerms } from "@/content/term-helpers";

export const metadata: Metadata = {
  title: "용어 사전 · AI 뜯어보기",
  description: "기사와 로드맵 레슨에 나온 용어를 짧은 카드로 모은 사전.",
};

// AI 뜯어보기의 "용어 사전" 층 — 완전 정적. 깊은 편(/concepts/[slug])과 달리
// 짧은 카드 모음이다. 정의는 공용 용어 사전(src/content/terms.ts) 한 곳에서 온다.
export default function TermsIndexPage() {
  const terms = getSortedTerms();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/concepts"
          className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          AI 뜯어보기
        </Link>
        <h1 className="text-display font-black break-keep">용어 사전</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          기사와 로드맵 레슨에 나온 용어 {terms.length}개를 짧은 카드로 모았어요. 본문에서
          밑줄 친 용어를 누르면 나오는 설명과 같은 내용이고, 깊게 다룬 개념은 AI 뜯어보기
          편으로 이어집니다.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {terms.map((term) => (
          <li key={term.id}>
            <Link
              href={`/concepts/terms/${term.id}`}
              className="card-interactive panel flex h-full min-h-11 flex-col gap-1.5 p-4"
            >
              <span className="text-body font-extrabold break-keep">{term.title}</span>
              <span className="line-clamp-2 text-label font-normal leading-relaxed break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {term.body.split("\n\n")[0]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: 용어 카드 페이지**

`src/app/concepts/terms/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getConceptBySlug } from "@/content/concept-helpers";
import { getSortedTerms, getTerm, getTermUsages } from "@/content/term-helpers";

// 용어 카드 — 완전 정적. 설명, 같은 개념의 깊은 편(있을 때만), 이 용어가 나온
// 기사와 로드맵 레슨(빌드 시 <Term id>에서 계산)을 보여 준다.

export function generateStaticParams() {
  return getSortedTerms().map((term) => ({ id: term.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const term = getTerm(id);
  if (!term) return {};
  return { title: `${term.title} · 용어 사전`, description: term.body.split("\n\n")[0] };
}

export default async function TermPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const term = getTerm(id);
  if (!term) notFound();

  const concept = term.concept ? getConceptBySlug(term.concept) : undefined;
  const usages = getTermUsages(term.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/concepts/terms"
          className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          용어 사전
        </Link>
        <span className="chip w-fit text-label font-bold">용어</span>
        <h1 className="text-display font-black break-keep">{term.title}</h1>
      </header>

      <div className="flex flex-col gap-4">
        {term.body.split("\n\n").map((paragraph, index) => (
          <p key={index} className="break-keep text-body font-normal leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {concept ? (
        <Link
          href={concept.permalink}
          className="card-interactive panel flex min-h-11 items-center justify-between gap-2 p-4 text-body font-bold break-keep"
        >
          AI 뜯어보기에서 자세히: {concept.title}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      ) : null}

      {usages.length > 0 ? (
        <section className="hairline flex flex-col gap-3 pt-6">
          <h2 className="text-body font-extrabold">이 용어가 나온 곳</h2>
          <ul className="flex flex-col gap-2">
            {usages.map((usage) => (
              <li key={usage.href}>
                <Link
                  href={usage.href}
                  className="card-interactive panel flex min-h-11 flex-col gap-0.5 p-4"
                >
                  <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    {usage.kind}
                  </span>
                  <span className="text-body font-bold break-keep">{usage.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
```

- [ ] **Step 3: AI 뜯어보기 첫 화면에 입구**

`src/app/concepts/page.tsx`:
- import 추가: `import { ArrowRight } from "lucide-react";`, `import { getSortedTerms } from "@/content/term-helpers";`
- 함수 안 `const concepts = getOrderedConcepts();` 아래에 `const termCount = getSortedTerms().length;`
- `</ol>` 바로 뒤(`</main>` 앞)에 추가:

```tsx
      <section className="hairline flex flex-col gap-3 pt-6">
        <span className="w-fit text-label font-bold text-accent dark:text-accent-dark">용어 사전</span>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          기사와 로드맵 레슨에 나온 용어 {termCount}개를 짧은 카드로 모았어요. 위 편들이
          깊게 파고든다면, 용어 사전은 빠르게 뜻을 확인하는 곳입니다.
        </p>
        <Link
          href="/concepts/terms"
          className="card-interactive panel flex min-h-11 items-center justify-between gap-2 p-4 text-body font-bold"
        >
          용어 사전 열기
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </section>
```

- [ ] **Step 4: 타입과 화면 확인 (768px)**

Run: `npx tsc --noEmit -p .` → 출력 없음.

내장 브라우저:
- `/concepts`: 10편 아래 "용어 사전" 구역, 용어 수 표시, 입구 링크
- `/concepts/terms`: 카드 목록(가나다순), 가로 넘침 0
- `/concepts/terms/ci`: 설명, "이 용어가 나온 곳"에 로드맵 레슨 "AI 코드에 자동 테스트 붙이기"
- Step 5에서 concept를 채운 용어 하나(예: `/concepts/terms/hallucination`): "AI 뜯어보기에서 자세히" 링크가 해당 편으로 이동
- `/concepts/terms/none` → 404
- 로드맵 레슨 패널의 "용어 페이지 열기"가 해당 카드로 이동
- 더보기 메뉴의 "AI 뜯어보기"가 `/concepts/terms`에서 활성 표시

- [ ] **Step 5: Commit**

```bash
git add src/app/concepts/terms "src/app/concepts/terms/[id]/page.tsx" src/app/concepts/page.tsx
git commit -m "feat(terms): AI 뜯어보기에 용어 사전 층(목록, 용어 카드, 나온 곳) 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 작성 스킬과 첫 글(Linear CI 기사)

**Files:**
- Create: `.claude/skills/article-scrap/SKILL.md`
- Create: `src/content/articles/linear-ci-bottleneck.mdx`

**Interfaces:**
- Consumes: Task 1 스키마와 h2 목록, Task 2 `check-articles.mjs`, Task 3 공용 용어 사전(`terms.ts`)과 `<Term>` 검사
- Produces: 첫 기사 slug `linear-ci-bottleneck` (Task 6, 7의 화면 검증 대상), 새 용어 4개(`runner`, `critical-path`, `test-shard`, `cache`)

**Files 추가:** Modify `src/content/terms.ts` (새 용어 4개)

- [ ] **Step 1: 스킬 파일 작성**

`.claude/skills/article-scrap/SKILL.md`:

````markdown
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
   - `node scripts/check-articles.mjs` (기사와 용어 사전)
   - `npx velite build 2>&1 | tail -5` 에 오류가 없어야 한다(사전에 없는 `<Term id>`도 여기서 걸린다)
   - `npx tsc --noEmit -p .`
   - `node scripts/check-font-glyph-coverage.mjs 2>&1 | tail -4`: 알려진 기존 누락 21자 외의 새 코드포인트가 없어야 한다(새 한글 누락이 나오면 수동 경로는 `node scripts/subset-font.mjs` 재실행, 자동 경로는 그 단어를 다른 말로 바꾼다)
   - 원문 url이 열리는지 확인
   - 스스로 점검: 원문 문장을 옮긴 곳이 없는가, 인용이 한 문장 이하인가
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
````

- [ ] **Step 2: 첫 글 작성**

`src/content/articles/linear-ci-bottleneck.mdx`를 스킬 형식대로 쓴다. frontmatter는 정확히:

```yaml
---
title: "AI 코딩 시대, CI가 병목이 되자 Linear가 한 일"
originalTitle: "AI coding has made CI a bottleneck, so we reworked ours to keep up"
source: "Linear 블로그"
author: "Mufeez Amjad"
publishedAt: "2026-09-21"
addedAt: "2026-09-23"
url: "https://linear.app/now/ci-bottleneck-reworked"
tags: ["DevOps", "AI 코딩"]
summary:
  - "에이전트 덕에 코드는 훨씬 빨리 나오는데, 모든 PR이 거쳐야 하는 CI 검사가 따라가지 못해 병목이 됐다."
  - "Linear는 빠른 러너와 도구로 바꾸고, 다른 일을 막는 작은 잡을 줄이고, 반복되는 준비를 없애고, 테스트를 더 잘게 나눠 병렬로 돌렸다."
  - "테스트가 연초보다 4배 가까이 늘었는데도 PR 대기 시간은 6분대에서 5분 남짓으로 줄고, 테스트당 러너 시간은 절반가량이 됐다."
related:
  - label: "로드맵: AI 코드에 자동 테스트 붙이기"
    href: "/roadmap/automated-testing"
origin: "manual"
slug: "linear-ci-bottleneck"
---
```

본문 필수 내용(우리 말로 새로 쓴다, 원문 문장 번역 금지):

- `## 먼저 알아 둘 개념`: `### CI`(PR마다 자동으로 돌리는 검사, 공항 보안 검색대 비유), `### 러너`(검사를 실제로 돌리는 빌린 컴퓨터), `### 크리티컬 패스`(가장 오래 걸리는 줄이 전체 시간을 정한다, 요리 순서 비유), `### 샤드`(시험지를 여러 명에게 나눠 채점), `### 캐시`(지난번 결과를 재사용하지만 꺼내는 비용이 새로 만드는 것보다 클 수도 있다). 각 소제목 아래 설명에서 그 용어를 처음 쓸 때 `<Term id="ci">CI</Term>`, `<Term id="runner">러너</Term>`, `<Term id="critical-path">크리티컬 패스</Term>`, `<Term id="test-shard">샤드</Term>`, `<Term id="cache">캐시</Term>`로 감싼다(`ci`는 기존 항목 재사용). 소제목(###) 자체에는 감싸지 않는다.
- `## 핵심 내용 정리`: 네 갈래를 `###` 소제목으로. 기사 수치는 "기사에 따르면"으로 출처 표기:
  - 인프라와 도구: 더 빠른 외부 러너로 옮겨 잡 평균 34% 단축(tsc는 52%), 네이티브 TypeScript 컴파일러(tsgo)로 타입 검사 주간 중앙값 73% 단축, 타입 정보 없이 AST만 보는 린트 규칙으로 바꿔 린트 시간 55~68% 단축.
  - 다른 일을 막는 잡: 변경 감지 잡이 전체 코드를 받지 않게 해 중앙값 26초에서 8초로, 네트워크가 멈추면 30초 안에 포기하고 재시도하는 체크아웃, 캐시 표시 쓰기를 병합 경로 밖으로 빼 42초 절약.
  - 반복 준비 줄이기: 공용 도구를 CI 이미지에 미리 설치, 필요한 패키지만 설치(44~73초에서 16~18초), node_modules 캐시는 되살리는 데 28초라 새로 설치(7.5초)보다 느려서 캐시를 버림, 스키마 스냅샷으로 DB 준비 12초에서 1~2초, 짧은 검사 7개를 2개 잡으로 묶어 월 약 8만 7천 러너 분(전체의 11.8%) 절약.
  - 테스트 실행: 러너가 파일 단위로 나누니 큰 파일을 쪼개 샤드를 4개에서 8개로, 안전한 파일만 모듈 상태를 공유(isolate: false, 명시적 opt-in)해 가장 느린 샤드 300초대에서 약 195초, 에이전트가 쓰는 테스트도 같은 규칙을 따르도록 에이전트 스킬을 갱신.
  - 교훈: 샤드는 준비 비용이 낮아야 이득(준비를 줄였기에 8개가 가능해짐). 개선이 없었다면 지금 약 11분 걸렸을 것이고, 테스트가 주당 약 2,000개씩 늘고 있어 계속되는 일이다.
- `## 취업과 면접 포인트`: "AI가 코드를 빨리 쓰는 시대엔 검증 속도가 병목"이라는 관점, 측정부터 하고(중앙값, p90, 러너 분) 크리티컬 패스를 먼저 보는 습관, 캐시가 늘 이득은 아니라는 판단(측정으로 결정), 정확성 위험이 큰 최적화는 opt-in과 격리로 다루는 태도. 면접 한 마디 예시 두세 개. 로드맵 단계 이름을 억지로 끼우지 않는다.
- `## 내 학습과 연결`: 로드맵 레슨 "AI 코드에 자동 테스트 붙이기"만 잇는다. 그 레슨의 CI 게이트 부분(GitHub Actions 예시, 결정적 테스트와 평가 테스트 분리)이 이 기사의 배경과 실제로 같은 내용이기 때문이다. "Git 브랜치와 PR 협업 흐름" 레슨은 CI를 다루지 않으므로 잇지 않는다.
- `## 스스로 확인하기`: 질문 3개(크리티컬 패스의 짧은 잡이 왜 중요한가, node_modules 캐시를 버린 이유, 샤드를 늘리기 전에 준비 비용을 줄여야 했던 이유)와 `<details><summary>정답 확인</summary>` 정답.

MDX 주의: 본문 산문에 `{`, `}`, `<`를 쓰지 않는다(JSX로 해석됨, `<Term>` 태그만 예외). 코드나 기호는 백틱으로 감싼다.

`src/content/terms.ts` 끝(마지막 항목 뒤, `};` 앞)에 새 용어 4개를 추가한다. 먼저 `grep -n "러너\|runner\|크리티컬\|샤드\|shard\|  cache" src/content/terms.ts`로 이미 없는지 확인한다.

```ts
  // ── 아티클(기사 요약)에서 추가된 용어 ─────────────────────────────────────
  runner: {
    title: "러너 (CI runner)",
    body: "CI 검사를 실제로 돌리는 컴퓨터입니다. PR이 올라오면 러너 한 대를 빌려 코드를 받고, 필요한 도구를 설치하고, 테스트를 돌린 뒤 반납합니다.\n\n러너를 쓴 시간만큼 비용이 들어서, 회사들은 기다리는 시간과 함께 러너를 쓴 총시간(러너 분)도 줄이려고 애씁니다.",
  },
  "critical-path": {
    title: "크리티컬 패스 (critical path)",
    body: "여러 일이 동시에 진행될 때, 전체가 끝나는 시간을 정하는 가장 긴 순서의 줄입니다. 라면 물이 끓는 동안 파를 썰면, 전체 시간은 물 끓는 시간이 정합니다.\n\n그래서 속도를 높이려면 크리티컬 패스 위의 일부터 줄여야 합니다. 옆길의 일을 아무리 줄여도 전체는 빨라지지 않습니다.",
  },
  "test-shard": {
    title: "샤드 (test shard)",
    body: "많은 테스트를 여러 묶음으로 나눠 여러 러너에서 동시에 돌릴 때, 그 한 묶음을 샤드라고 합니다. 시험지 더미를 채점자 여러 명에게 나눠 주는 것과 같습니다.\n\n샤드를 늘리면 기다리는 시간은 줄지만, 샤드마다 준비 비용(러너 켜기, 설치)이 붙어 총비용은 늘 수 있습니다. 가장 느린 샤드가 끝나야 전체가 끝납니다.",
  },
  cache: {
    title: "캐시 (cache)",
    body: "한 번 만든 결과를 저장해 두었다가 다음에 다시 쓰는 것입니다. 매번 새로 만드는 대신 꺼내 쓰니 보통 빨라집니다.\n\n다만 꺼내 오는 데도 시간이 듭니다. 저장한 결과가 크거나 자주 바뀌면 꺼내는 비용이 새로 만드는 비용보다 커져서 오히려 느려질 수 있습니다. 그래서 캐시는 측정해 보고 결정합니다.",
  },
```

(주석 줄의 `──`는 주석이라 글자 게이트가 건너뛴다.)

- [ ] **Step 3: 검사 실행**

```bash
node scripts/check-articles.mjs
npx velite build 2>&1 | tail -3
npx tsc --noEmit -p .
node scripts/check-font-glyph-coverage.mjs 2>&1 | tail -4
node scripts/check-brand.mjs 2>&1 | grep -c "articles" || true
```

Expected: `기사 1편 + 용어 사전 통과`; velite 오류 없음(`<Term>` 다섯 개가 모두 사전에 있음); tsc 출력 없음; 글리프 누락은 기존 21자뿐; brand 위반 중 articles 경로 0건.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/article-scrap/SKILL.md src/content/articles/linear-ci-bottleneck.mdx src/content/terms.ts
git commit -m "feat(articles): 작성 스킬과 첫 글(Linear CI 병목 기사)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 상세 페이지와 하단 메모장

**Files:**
- Create: `src/lib/article-note.ts`
- Create: `src/app/api/article-note/route.ts`
- Create: `src/app/articles/[slug]/note-actions.ts`
- Create: `src/components/article-note.tsx`
- Create: `src/app/articles/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getArticleBySlug`, `getSortedArticles`, `formatKoreanDate` (Task 1); `TermPanelProvider`, `Term` (Task 3); `readLessonNote(id)`, `saveLessonNote(id, body)` (`@/lib/note-store`); `hasUnlockCookie()` (`@/lib/auth`); `LessonNotepad` props `{ lessonId, initialBody, saveAction }`; `BasecampCopyPrompt` props `{ lessonTitle, articleId }`; `PrintButton` props `{ annotate?, label? }`; `ReadingAssistant` props `{ articleId }`.
- Produces: `articleNoteId(slug: string): string`, `ArticleNoteResponse` 타입, `saveArticleNoteAction(slug: string, body: string): Promise<void>`, `<ArticleNote slug />`.

- [ ] **Step 1: 메모 키**

`src/lib/article-note.ts`:

```ts
// 아티클 메모의 lesson_note.lesson_id 키를 만드는 단일 지점. 정규 레슨, 베이스캠프
// 메모와 같은 테이블을 쓰므로 `article:` 접두사로 행이 겹치지 않게 한다. 읽기
// (app/api/article-note/route.ts)와 쓰기(app/articles/[slug]/note-actions.ts)가
// 반드시 이 함수를 쓴다(basecampNoteId와 같은 원칙).
export function articleNoteId(slug: string): string {
  return `article:${slug}`;
}
```

- [ ] **Step 2: 읽기 라우트**

`src/app/api/article-note/route.ts`:

```ts
// GET /api/article-note?slug=<slug> — 아티클 메모 아일랜드의 유일한 읽기 지점.
// app/api/basecamp-note/route.ts와 같은 보안 계약: hasUnlockCookie()를 무조건,
// 어떤 조회보다 먼저 호출하고, 미존재 슬러그는 note:{ok:false}로 둔다. 사용자별
// 응답이라 모든 응답에 no-store를 붙인다.

import { NextResponse } from "next/server";
import { hasUnlockCookie } from "@/lib/auth";
import { getArticleBySlug } from "@/content/article-helpers";
import { readLessonNote } from "@/lib/note-store";
import { articleNoteId } from "@/lib/article-note";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

export type ArticleNoteResponse = {
  unlocked: boolean;
  note: { ok: true; body: string } | { ok: false };
};

export async function GET(request: Request) {
  const unlocked = await hasUnlockCookie();

  if (!unlocked) {
    return NextResponse.json(
      { unlocked: false, note: { ok: false } } satisfies ArticleNoteResponse,
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }

  const slug = new URL(request.url).searchParams.get("slug");
  let note: ArticleNoteResponse["note"] = { ok: false };
  if (slug && getArticleBySlug(slug)) {
    const read = await readLessonNote(articleNoteId(slug));
    note = read.ok ? { ok: true, body: read.body } : { ok: false };
  }

  return NextResponse.json(
    { unlocked: true, note } satisfies ArticleNoteResponse,
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
```

- [ ] **Step 3: 쓰기 액션**

`src/app/articles/[slug]/note-actions.ts`:

```ts
'use server';

// 아티클 메모 저장 Server Action. basecamp/[slug]/note-actions.ts와 같은 보안 계약
// (본문 순서가 계약이다): hasUnlockCookie() 재검증 → 슬러그 존재 검증 → 저장.

import { hasUnlockCookie } from '@/lib/auth';
import { getArticleBySlug } from '@/content/article-helpers';
import { saveLessonNote } from '@/lib/note-store';
import { articleNoteId } from '@/lib/article-note';

export async function saveArticleNoteAction(slug: string, body: string): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!getArticleBySlug(slug)) {
    throw new Error('invalid article');
  }

  await saveLessonNote(articleNoteId(slug), body);
}
```

- [ ] **Step 4: 메모 아일랜드**

`src/components/article-note.tsx`:

```tsx
"use client";

// 아티클 메모 아일랜드 — BasecampNote와 같은 셸 계약. 페이지는 정적이고, 마운트 후
// GET /api/article-note를 한 번 불러 메모를 가져온다. 로딩엔 스켈레톤, 잠금엔 무표시,
// 읽기 실패엔 한국어 안내, 성공에만 메모장을 마운트한다.

import { useEffect, useState } from "react";
import { LessonNotepad } from "@/components/lesson-notepad";
import { NotepadSkeleton } from "@/components/progress-skeleton";
import { saveArticleNoteAction } from "@/app/articles/[slug]/note-actions";
import type { ArticleNoteResponse } from "@/app/api/article-note/route";

type State =
  | { status: "loading" }
  | { status: "ready"; body: string }
  | { status: "locked" }
  | { status: "error" };

export function ArticleNote({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/article-note?slug=${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => res.json() as Promise<ArticleNoteResponse>)
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!data.unlocked) return setState({ status: "locked" });
        if (data.note.ok) return setState({ status: "ready", body: data.note.body });
        return setState({ status: "error" });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: "error" });
      });

    return () => controller.abort();
  }, [slug]);

  if (state.status === "loading") return <NotepadSkeleton />;
  if (state.status === "locked") return null;
  if (state.status === "error") {
    return (
      <p
        data-notepad-read-error
        className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark"
      >
        메모를 불러오지 못했어요. 새로고침해 주세요.
      </p>
    );
  }

  return (
    <LessonNotepad lessonId={slug} initialBody={state.body} saveAction={saveArticleNoteAction} />
  );
}
```

- [ ] **Step 5: 상세 페이지**

`src/app/articles/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { MDXContent } from "@/components/mdx-content";
import {
  formatKoreanDate,
  getArticleBySlug,
  getSortedArticles,
} from "@/content/article-helpers";
import { ArticleNote } from "@/components/article-note";
import { BasecampCopyPrompt } from "@/components/lesson-copy-prompt";
import { PrintButton } from "@/components/print-button";
import { ReadingAssistant } from "@/components/reading-assistant/reading-assistant";
import { TermPanelProvider, Term } from "@/components/roadmap/term-panel";
import type { ComponentType } from "react";

// 아티클 상세 — 완전 정적. basecamp/[slug] 리더와 같은 셸에 출처, 원문 열기,
// 세 줄 요약 카드, 함께 보기를 얹는다. 진도와 복습은 없다(격리 컬렉션).

const ARTICLE_BODY_ID = "article-body";

export function generateStaticParams() {
  return getSortedArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return { title: `${article.title} · 아티클`, description: article.summary[0] };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="note-page-spacer mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/articles"
            data-print-hide
            className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            아티클
          </Link>
          <h1 className="text-display font-black break-keep">{article.title}</h1>
          <p className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            <span>{article.source}</span>
            {article.author ? <span>, {article.author}</span> : null}
            <span className="mx-2" aria-hidden="true">|</span>
            <span>{formatKoreanDate(article.publishedAt)}</span>
          </p>
          <p lang="en" className="break-words text-label font-normal text-muted dark:text-muted-dark">
            원제: {article.originalTitle}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip text-label font-bold">아티클</span>
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/articles?tag=${encodeURIComponent(tag)}`}
                  className="chip tap-feedback inline-flex min-h-11 items-center text-label font-semibold"
                >
                  {tag}
                </Link>
              ))}
              <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                약 {article.readingMinutes}분 읽기
              </span>
            </div>
            <span className="flex flex-wrap items-start gap-2" data-print-hide>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card-interactive panel inline-flex min-h-11 items-center gap-1.5 px-4 text-label font-bold"
              >
                원문 열기
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
              <BasecampCopyPrompt lessonTitle={article.title} articleId={ARTICLE_BODY_ID} />
              <PrintButton />
              <PrintButton annotate label="필기 여백으로 저장" />
            </span>
          </div>
        </header>

        {/* 용어 패널 프로바이더로 본문을 감싼다. 본문 안 <Term>이 우측 설명 패널을
            연다(로드맵 레슨과 같은 부품, 공용 용어 사전). */}
        <TermPanelProvider>
        <div id={ARTICLE_BODY_ID} className="prose dark:prose-invert max-w-none">
          <div className="not-prose panel flex flex-col gap-2 p-5">
            <p className="text-label font-bold text-accent dark:text-accent-dark">세 줄 요약</p>
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-body leading-relaxed break-keep">
              {article.summary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </div>
          <MDXContent code={article.code} components={{ Term: Term as ComponentType }} />
        </div>
        </TermPanelProvider>

        {article.related.length > 0 ? (
          <nav aria-label="함께 보기" data-print-hide className="hairline flex flex-col gap-3 pt-6">
            <span className="text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
              함께 보기
            </span>
            {article.related.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="card-interactive panel flex min-h-11 items-center p-4 text-body font-bold break-keep"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <nav aria-label="아티클 목록으로" data-print-hide className="hairline pt-6">
          <Link
            href="/articles"
            className="card-interactive panel flex min-h-11 items-center gap-2 p-4 text-body font-bold"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            아티클 전체 보기
          </Link>
        </nav>
      </article>

      <ArticleNote slug={article.slug} />

      <ReadingAssistant articleId={ARTICLE_BODY_ID} />
    </main>
  );
}
```

- [ ] **Step 6: 타입과 빌드**

Run: `npx tsc --noEmit -p .`
Expected: 출력 없음.

- [ ] **Step 7: 화면 확인 (내장 브라우저, 768px)**

dev 서버(`preview_start` name `dev`)를 켜고 테스터 계정으로 로그인한 뒤 `/articles/linear-ci-bottleneck`을 연다. 확인:
- 제목, 출처와 날짜, 원제, 태그 칩, 읽는 시간, 원문 열기, 세 줄 요약 카드, h2 다섯 개, 정답 접기, 함께 보기 한 링크
- 본문의 밑줄 용어(CI, 러너, 크리티컬 패스, 샤드, 캐시)를 누르면 패널이 열리고, "용어 페이지 열기"가 `/concepts/terms/<id>`로 이동, 그 카드의 "이 용어가 나온 곳"에 이 기사가 있음
- `document.documentElement.scrollWidth - clientWidth === 0`(가로 넘침 없음)
- 메모장에 "테스트 메모" 입력 → 저장 표시 → 새로고침 후 유지 → 확인 후 지우고 다시 저장(빈 메모로 원복)
- `/articles/none` → 404 화면

- [ ] **Step 8: Commit**

```bash
git add src/lib/article-note.ts src/app/api/article-note/route.ts "src/app/articles/[slug]/note-actions.ts" src/components/article-note.tsx "src/app/articles/[slug]/page.tsx"
git commit -m "feat(articles): 아티클 상세 페이지와 하단 메모장

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 목록, 태그 필터, 네비

**Files:**
- Create: `src/app/articles/page.tsx`
- Modify: `src/components/site-nav.tsx` ("AI 뜯어보기" 항목 바로 아래)

**Interfaces:**
- Consumes: `getSortedArticles`, `getUsedTags`, `formatKoreanDate` (Task 1), `isArticleTag` (article-tags.ts)

- [ ] **Step 1: 목록 페이지**

`src/app/articles/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  formatKoreanDate,
  getSortedArticles,
  getUsedTags,
} from "@/content/article-helpers";
import { isArticleTag } from "@/content/article-tags";

export const metadata: Metadata = {
  title: "아티클",
  description:
    "현업 엔지니어링 기사를 우리 말로 풀어 모은 곳. 개념 풀이, 핵심 정리, 면접 포인트, 내 학습과의 연결까지.",
};

// 아티클 목록 — 태그 필터를 쿼리스트링(?tag=)으로 받으므로 요청마다 렌더링된다
// (Next 16: searchParams를 읽으면 동적 렌더). DB 조회는 없고 velite 데이터만 거른다.
// 필터는 링크 이동이라 클라이언트 JS가 필요 없다.
export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[] }>;
}) {
  const { tag } = await searchParams;
  const all = getSortedArticles();
  const activeTag = typeof tag === "string" && isArticleTag(tag) ? tag : null;
  const list = activeTag ? all.filter((a) => a.tags.includes(activeTag)) : all;
  const usedTags = getUsedTags(all);

  const chipClass = (active: boolean) =>
    `${active ? "chip-solid" : "chip"} tap-feedback inline-flex min-h-11 items-center text-label font-semibold`;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="chip w-fit text-label font-bold">현업 읽기</span>
        <h1 className="text-display font-black break-keep">아티클</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          현업 엔지니어링 기사를 우리 말로 풀어 모았습니다. 기사마다 먼저 알아 둘 개념,
          핵심 정리, 면접에서 쓸 포인트, 내 학습과의 연결을 담았고, 원문은 언제든 링크로
          열 수 있어요. 매주 새 글이 더해집니다.
        </p>
      </header>

      {usedTags.length > 0 ? (
        <nav aria-label="분야 필터" className="flex flex-wrap gap-2">
          <Link href="/articles" aria-current={activeTag ? undefined : "page"} className={chipClass(!activeTag)}>
            전체
          </Link>
          {usedTags.map((t) => (
            <Link
              key={t}
              href={`/articles?tag=${encodeURIComponent(t)}`}
              aria-current={activeTag === t ? "page" : undefined}
              className={chipClass(activeTag === t)}
            >
              {t}
            </Link>
          ))}
        </nav>
      ) : null}

      {list.length === 0 ? (
        <p className="panel p-5 text-body break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
          아직 모은 기사가 없어요.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {list.map((article) => (
            <li key={article.slug}>
              <Link
                href={article.permalink}
                className="card-interactive panel flex h-full min-h-11 flex-col gap-2 p-5 transition-colors duration-150"
              >
                <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {article.source}
                  <span className="mx-2" aria-hidden="true">|</span>
                  {formatKoreanDate(article.publishedAt)}
                </span>
                <span className="text-heading font-extrabold break-keep">{article.title}</span>
                <span className="text-body font-normal leading-relaxed break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {article.summary[0]}
                </span>
                <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  {article.tags.map((t) => (
                    <span key={t} className="chip text-label font-semibold">
                      {t}
                    </span>
                  ))}
                  {article.origin === "auto" ? (
                    <span className="text-label font-normal text-muted dark:text-muted-dark">자동 수집</span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 2: 네비 항목**

`src/components/site-nav.tsx`에서 아래 줄을 찾아:

```tsx
      { label: "AI 뜯어보기", href: "/concepts" },
```

바로 아래에 추가:

```tsx
      // 아티클(/articles) — 현업 기사를 우리 말로 푼 요약 모음(격리 컬렉션).
      { label: "아티클", href: "/articles" },
```

- [ ] **Step 3: 타입과 화면 확인 (768px)**

Run: `npx tsc --noEmit -p .` → 출력 없음.

내장 브라우저에서:
- `/articles`: 카드 1개, 태그 줄 "전체 / DevOps / AI 코딩"(ARTICLE_TAGS 순서라 `AI 코딩`이 먼저), "전체"가 채워진 칩
- `/articles?tag=DevOps`: 카드 1개, DevOps 칩 활성
- `/articles?tag=LLM`: 쓰인 태그가 아니지만 유효 태그라 결과 0 → "아직 모은 기사가 없어요." (허용: 유효 태그 직접 입력 시 빈 목록)
- `/articles?tag=없는태그`: 전체 표시
- 상세 페이지 태그 칩을 누르면 필터된 목록으로 이동
- 더보기 메뉴에 "아티클", 누르면 이동, `/articles/...`에서 활성 표시
- 가로 넘침 0

- [ ] **Step 4: Commit**

```bash
git add src/app/articles/page.tsx src/components/site-nav.tsx
git commit -m "feat(articles): 아티클 목록, 분야 태그 필터, 네비 항목

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 전체 검증과 배포

**Files:** 없음 (검증만)

- [ ] **Step 1: 게이트 일괄 실행**

```bash
node scripts/check-articles.mjs
npx velite build 2>&1 | tail -3
npx tsc --noEmit -p .
npm run lint 2>&1 | tail -5
node scripts/check-font-glyph-coverage.mjs 2>&1 | tail -4
node scripts/check-brand.mjs 2>&1 | tail -5
```

Expected: 기사 게이트 통과; velite, tsc 오류 없음; lint 새 오류 없음; 글리프와 brand는 Global Constraints의 기존 실패 외 새 항목 없음.

- [ ] **Step 2: 프로덕션 빌드**

Run: `npm run build 2>&1 | tail -30`
Expected: 성공. 라우트 표에 `/articles`(동적, ƒ)와 `/articles/[slug]`(정적 생성, `/articles/linear-ci-bottleneck` 포함), `/concepts/terms`와 `/concepts/terms/[id]`(정적 생성, 용어 수만큼).

- [ ] **Step 3: push**

```bash
git push origin master
```

- [ ] **Step 4: 배포 확인**

Vercel 배포가 끝나면(1~3분) 배포 사이트의 `/articles`, `/articles/linear-ci-bottleneck`, `/concepts/terms`, `/concepts/terms/runner`가 열리는지 확인한다(로그인 필요 시 테스터 계정). 사용자에게 아이패드 확인 경로를 알린다.

---

### Task 9: 매주 자동 수집 예약 실행

**Files:** 없음 (클라우드 예약 실행 설정)

- [ ] **Step 1: 선행 조건 확인**

schedule 스킬을 불러(`Skill` 도구, `schedule`) 클라우드 예약 실행이 저장소 `dhchun1203/ai-engineer-runway`를 받아 **master에 push할 수 있는지** 확인한다. 불가하면 멈추고 사용자에게 필요한 연결(GitHub 앱 권한 등)을 안내한다. 가능해질 때까지 Step 2 이후를 진행하지 않는다.

- [ ] **Step 2: 예약 실행 만들기**

schedule 스킬로 다음 설정의 루틴을 만든다.
- 이름: `weekly-article-scrap`
- 일정: 매주 월요일 08:00 Asia/Seoul (cron `0 23 * * 0` UTC)
- 저장소: `dhchun1203/ai-engineer-runway`, 브랜치 master
- 프롬프트:

```text
이 저장소의 프로젝트 스킬 .claude/skills/article-scrap/SKILL.md를 읽고 "자동 수집 (매주 월요일 예약 실행)" 절차를 그대로 수행해 줘. 이번 주 기사 2편을 골라 origin: "auto"로 쓰고, 검사를 모두 통과한 글만 master에 push해. 검사를 통과하지 못한 글은 올리지 마. 마지막 응답은 한국어로, 올린 글(제목, 원문 링크, 사이트 경로 /articles/<slug>)과 버린 후보(이유)를 목록으로 적어 줘.
```

- [ ] **Step 3: 1회 수동 실행으로 확인**

만든 루틴을 즉시 1회 실행한다. 결과를 확인한다.
- 커밋이 master에 올라왔는지(`git fetch && git log origin/master --oneline -3`)
- 올라온 글이 `node scripts/check-articles.mjs`, `npx velite build`를 통과하는지(로컬에서 pull 후 재실행)
- 내용이 저작권 규칙(번역 없음, 인용 한 문장 이하)을 지키는지 직접 한 편 읽어 점검
- 배포 사이트 `/articles`에 보이는지

문제가 있으면 스킬 파일을 고치고 다시 1회 실행한다. 통과하면 예약이 켜진 상태로 둔다.

- [ ] **Step 4: 기록**

메모리 `articles-section-workflow.md`의 상태 줄을 "구현 완료, 자동 수집 예약 켜짐(루틴 이름 weekly-article-scrap)"으로 갱신한다.
