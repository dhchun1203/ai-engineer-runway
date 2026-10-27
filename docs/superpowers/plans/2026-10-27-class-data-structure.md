# 수업 복습 데이터 구조와 활용 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 수업 회차를 폴더(본문 + review.yml)로 쌓고, 간격 복습, 모듈별 목록, 명령어 모음, 종합 퀴즈와 시험 모드, 용어 합치기, 달력, 검색으로 꺼내 쓴다.

**Architecture:** velite에 `classReviews`(yaml) 컬렉션을 더하고 `class-sessions.ts`를 그 데이터를 읽는 얇은 접근 계층으로 바꾼다. 순수 계산은 import 없는 `src/lib/class-logic.ts`에 두고 `scripts/check-class.mjs`가 node:assert로 검증한다(check-review.mjs와 같은 방식). 화면은 기존 서버 컴포넌트, `BasecampQuizSet`, `recordQuizAnswer`, `lesson_review`를 재사용한다.

**Tech Stack:** Next.js 16 App Router, velite 0.4, Supabase, Tailwind v4, lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-27-class-data-structure-design.md`

## Global Constraints

- 공개 내용에 기관명 금지(항상 "AI Engineer 교육과정"). `node scripts/check-brand.mjs` 통과.
- 화면 글에 가운데점(·), 긴 하이픈(—), ─ 글리프 금지. UI에 이모지 금지(lucide 아이콘).
- 터치 타깃 44px 이상(`min-h-11`), 아이패드 우선.
- 카드 호버: 링크 = `card-interactive panel`, 그 외 = `card-hover-grow`.
- dev 서버가 켜진 채 `next build` 금지(빌드 전 dev 중지, 빌드 후 재시작).
- 체크 진도 키(`bc:class-NN-*`)와 레슨 주소(`/class/<slug>`)는 바꾸지 않는다.

---

### Task 1: 회차 폴더와 classReviews 컬렉션, 오답 키 이전

**Files:**
- Move: `src/content/class-lessons/01-terminal-git.mdx` → `src/content/class-lessons/01-terminal-git/index.mdx` (frontmatter에 `module: "1-2"`, `topic: "Git"`)
- Move: `src/content/class-lessons/02-git-setup-remote.mdx` → `.../02-git-setup-remote/index.mdx` (같은 필드)
- Create: `src/content/class-lessons/01-terminal-git/review.yml`, `.../02-git-setup-remote/review.yml` (class-sessions.ts의 checklist, quiz를 옮기고 문항마다 id, commands, terms 추가)
- Modify: `velite.config.ts` (classLessons 스키마에 module, topic, headings / classReviews 컬렉션 / prepare 검사)
- Rewrite: `src/content/class-sessions.ts` (classReviews를 읽는 접근 계층. 기존 export 이름 유지: `ClassChecklistItem`, `ClassSession`, `classItemIds`, `getClassSession`)
- Modify: `src/lib/quiz-mistake-key.ts` (`classQuizKey(slug, id: string)`, parse에서 cl의 3번째 칸을 id 규칙으로)
- Modify: `src/lib/quiz-mistake-resolve.ts` (id로 문항 찾기)
- Modify: `src/app/class/[slug]/page.tsx` (keys = quiz.map(q => classQuizKey(slug, q.id)))
- Create: `supabase/migrations/20261027130000_class_quiz_key_ids.sql`

**Interfaces (Produces):**
```ts
// class-sessions.ts
export type ClassQuizQuestion = BasecampQuizQuestion & { id: string };
export type ClassCommand = { cmd: string; desc: string; group: string };
export type ClassTerm = { word: string; definition: string };
export type ClassSession = { slug: string; checklist: readonly ClassChecklistItem[]; quiz: readonly ClassQuizQuestion[]; commands: readonly ClassCommand[]; terms: readonly ClassTerm[] };
export const classSessions: readonly ClassSession[];
export const classItemIds: ReadonlySet<string>;
export function getClassSession(slug: string): ClassSession | undefined;
// quiz-mistake-key.ts
export function classQuizKey(lessonSlug: string, questionId: string): string; // `cl:${slug}:${id}`
export const CLASS_QUESTION_ID = /^(?=.*[a-z])[a-z0-9-]{1,48}$/;
// ParsedQuizKey class 변형: { source: "class"; lessonSlug: string; questionId: string }
// ClassLesson에 module: string, topic: string, headings: string[] 추가
```

- [ ] review.yml 두 개 작성(문항 id는 내용을 나타내는 kebab, 숫자만 금지), velite 설정, 접근 계층, 키 함수 변경
- [ ] velite prepare 검사: 짝 1:1, quiz id 중복/규칙, answer 범위, options 4개 이상, checklist id 전역 중복과 `class-` 접두사, module id가 modules.ts에 있음
- [ ] 마이그레이션 SQL: `update quiz_attempt set quiz_key = m.new from (values ...) m(old,new) where quiz_key = m.old;` quiz_mistake도 같게. 적용 전후 `cl:%` 행 수와 숫자 키 0건 확인
- [ ] `npx velite build` 성공, `npx tsc --noEmit` 통과, 일부러 정답 범위를 깨서 빌드가 실패하는지 한 번 확인 후 되돌림
- [ ] 커밋

### Task 2: 순수 계산 모듈과 검사 스크립트

**Files:**
- Create: `src/lib/class-logic.ts` (import 없음)
- Create: `scripts/check-class.mjs`

**Interfaces (Produces):**
```ts
export function seoulWeekRange(todayStr: string, offsetWeeks: number): { start: string; end: string }; // 월~일, YYYY-MM-DD
export type QuizRef = { slug: string; id: string };
export type AttemptState = 'wrong' | 'right'; // 없으면 안 푼 것
export function pickQuizRefs(refs: readonly QuizRef[], attemptByKey: ReadonlyMap<string, AttemptState>, seedStr: string, limit: number): QuizRef[]; // 틀림 → 안 푼 것 → 맞힘, 각 묶음 안은 seed 셔플
export type SearchDoc = { slug: string; text: string };
export function matchesQuery(text: string, query: string): boolean; // 공백으로 나눈 낱말이 모두 들어 있으면 true, 대소문자 무시
export type CalendarCell = { date: string; inMonth: boolean };
export function monthGrid(year: number, month: number): CalendarCell[][]; // 월요일 시작 주 단위 6행 이하
export function classReviewId(slug: string): string; // `class:${slug}`
```
- [ ] check-class.mjs에 경계값 단언 작성(주 경계 일요일/월요일, 월말, 셔플 결정성, 우선순위, 빈 질의, 달력 첫 칸이 월요일) → 실행해 실패 확인 → 구현 → 통과
- [ ] 커밋

### Task 3: 간격 복습에 수업 넣기

**Files:**
- Modify: `src/app/review-actions.ts` (`completeClassReview(slug)`: hasUnlockCookie → getClassLessonBySlug → markLessonReviewed(classReviewId(slug)))
- Create: `src/components/class/class-review-done-button.tsx` (ReviewDoneButton과 같은 형태)
- Create: `src/lib/class-review.ts` (server-only: `computeDueClassSessions(states, today)` = computeDueLessons(Map(slug→date), statesFiltered, today) 를 회차 객체로)
- Modify: `src/app/review/page.tsx` (위쪽 "수업 다시 꺼내 보기": 만기 회차마다 pickQuizRefs 5문항 + BasecampQuizSet + 완료 버튼. 수업 만기만 있어도 빈 화면이 아니게)
- Modify: 홈 오늘의 복습 카드(만기 회차 수 한 줄 + /review 링크)

- [ ] 구현, `node scripts/check-review.mjs` 여전히 통과, tsc
- [ ] 커밋

### Task 4: 모듈별 목록, 이전/다음, 사전학습 연결

**Files:**
- Modify: `src/content/class-lesson-helpers.ts` (`groupClassLessonsByModule()`: 모듈 순서대로 { module, step, lessons })
- Modify: `src/app/class/page.tsx` (지난 수업 → `<details>` 모듈 묶음, 머리에 회차 수와 체크 진행률, 최근 모듈만 open)
- Modify: `src/app/class/[slug]/page.tsx` (아래 nav에 이전/다음 회차, 같은 모듈 사전학습 레슨 칩)

- [ ] 구현, tsc, 커밋

### Task 5: 명령어 모음

**Files:**
- Create: `src/app/class/commands/page.tsx` (정적. group별 묶음, 같은 cmd는 회차 링크 여러 개)
- Create: `src/components/class/command-search.tsx` (클라이언트 필터, matchesQuery 사용)
- Modify: `src/app/offline-manifest.json/route.ts` (/class/commands, /class/quiz 추가)

- [ ] 구현, 커밋

### Task 6: 종합 퀴즈와 시험 모드

**Files:**
- Create: `src/app/class/quiz/page.tsx` (force-dynamic, searchParams scope/mode, 범위 칩, 최대 20문항)
- Create: `src/components/class/class-exam-quiz.tsx` (다 고른 뒤 채점, 문항마다 recordQuizAnswer 호출, 점수와 해설)
- 범위: week(이번 주), prev(지난주), module:<id>, all, wrong(로그인 필요, readQuizAttempts의 cl: 마지막 틀림)

- [ ] 구현, 커밋

### Task 7: 용어 사전 합치기

**Files:**
- Modify: `src/content/curriculum-helpers.ts` getAllTerms (정규 레슨 뒤에 수업 terms를 같은 그룹 규칙으로, source.permalink = /class/slug, lessonTitle = "N회차 제목", moduleId = 회차 module)

- [ ] 구현, `/glossary` 빌드 확인, 커밋

### Task 8: 수업 달력과 회차 검색

**Files:**
- Create: `src/components/class/class-calendar.tsx` (서버. monthGrid로 이번 달과 지난달, 수업 날 칸에 회차 번호와 체크 진행률 농도, 복습 졸업/진행 표시, 칸은 레슨 링크)
- Create: `src/components/class/class-search.tsx` (클라이언트. 검색어가 있으면 전 회차에서 matchesQuery로 거른 카드 목록을 보이고 아래 목록을 숨김)
- Modify: `src/app/class/page.tsx` (머리 아래 달력, 목록 위 검색, 명령어 모음과 종합 퀴즈 바로가기)

- [ ] 구현, 커밋

### Task 9: 매일 추가 스킬과 메모

**Files:**
- Create: `.claude/skills/class-lesson/SKILL.md`
- Modify: 메모 `class-review-section.md`

- [ ] 작성, 커밋

### Task 10: 전체 검증과 배포

- [ ] dev 중지 → `npx next build` → 검사 스크립트(brand, review, class) → dev 재시작
- [ ] 내장 브라우저 1024x1366, 375x812에서 공개 화면 확인(가로 넘침 없음), 로그인 화면은 배포 후 크롬
- [ ] push, Vercel READY 확인
