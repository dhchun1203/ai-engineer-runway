# Phase 6: 전체 페이지 디자인 정리 - Pattern Map

**Mapped:** 2026-08-26
**Files analyzed:** 신규 3개(추정) + 23개(타이포 임의값 치환 대상) + 8개(구조/셸 수정) + 게이트 스크립트 2개 + 문서 1개
**Analogs found:** 대부분 exact/role-match. Section Tape의 `ResizeObserver`/`scroll-margin` 부분은 **no analog(신규 패턴)**로 명시.

이 Phase는 그린필드가 아니라 기존 6종 화면의 정리다. 아래 표의 "새/수정" 파일은 거의 전부
이미 존재하며, 이 문서의 값은 "지금 이 코드가 무엇인지" + "같은 하우스 스타일을 보여주는
가장 가까운 analog"다.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/section-tape.tsx` (신규) | component (client) | event-driven (DOM 측정 + 클릭 스크롤) | `src/components/schedule-auto-scroll.tsx` | role-match (구조는 같으나 `ResizeObserver`/오프셋 계산은 no-analog) |
| `scripts/check-design-tokens.mjs` (신규) | utility (static gate) | batch (파일 트리 스캔) | `scripts/check-brand.mjs` | exact |
| `scripts/e2e-typography.mjs` (신규, D-89/D-91 겸용) | test (e2e gate) | request-response (부트스트랩) + 신규 검증(Playwright) | `scripts/e2e-today.mjs` | role-match (부트스트랩만 exact, 검증층은 no-analog) |
| `src/app/globals.css` (`@theme` + `.prose` 확장) | config/style | transform (빌드타임 CSS) | 자기 자신의 기존 5개 `.prose` 오버라이드(`globals.css:163-219`) | exact (같은 파일 안의 기존 패턴) |
| `src/components/mdx-content.tsx` (수정: `table` 항목 추가) | component (server) | transform (MDX 컴포넌트 치환) | 자기 자신의 `pre → CodeBlock` 매핑(21-23줄) | exact |
| `src/components/lesson-nav.tsx` (수정: 화살표 리터럴 제거) | component | request-response | 자기 자신 (`PagerButton`) | exact |
| `src/app/lesson/[lessonId]/page.tsx` (수정: `<main>`, 잠금 문구, `gap-8`) | route/page (server) | request-response | `src/app/step/[stepId]/page.tsx` | exact |
| `src/components/step-card.tsx` (수정: hover, 타이포 치환) | component | CRUD-adjacent(표시 전용) | `src/components/today-lesson-card.tsx` | exact (동일 그리드 카드 원형) |
| `src/components/today-lesson-card.tsx` (수정: `p-6`→`p-4`, hover, 타이포) | component | request-response | `src/components/step-card.tsx` | exact |
| `src/components/module-accordion.tsx` (수정: hover, 타이포) | component | request-response | `src/components/schedule-table.tsx` | role-match (같은 "리스트 행" 원형) |
| `src/components/schedule-table.tsx` (수정: hover, 타이포) | component | request-response | `src/components/module-accordion.tsx` | role-match |
| `src/components/site-nav.tsx` (수정: 타이포만, 구조 불변) | component (client) | request-response | 자기 자신 | exact |
| 23개 파일의 66곳 임의값 치환(`text-[Npx] leading-[N]` → `text-{role}`) | 전 역할 혼재 | transform | `src/components/step-card.tsx:33-41` (라벨/헤딩/바디 3종 모두 한 파일에 존재) | exact |
| `.planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md` (Typography 표 갱신) | docs | transform | 없음(문서 자체, 06-UI-SPEC.md의 신규 표가 원본) | n/a — 문서 대 문서 |

---

## Pattern Assignments

### `src/components/section-tape.tsx` (신규, client component)

**Analog:** `src/components/schedule-auto-scroll.tsx`(전문, 18줄) — 코드베이스에서 유일하게
`useEffect` + DOM 쿼리를 쓰는 클라이언트 컴포넌트.

**전체 인용 (구조 템플릿)**:
```tsx
// Source: src/components/schedule-auto-scroll.tsx:1-18
"use client";

import { useEffect } from "react";

export function ScheduleAutoScroll({ targetId }: { targetId: string }) {
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ block: "center" });
  }, [targetId]);

  return null;
}
```

**Section Tape가 복제해야 할 것**: `"use client"` 최상단 지시어, props를 최소화(서버→클라이언트
직렬화 경계 최소), `useEffect` 1개, cleanup 없음 → **단, Section Tape는 `return null`이 아니라
실제 UI를 렌더**하고 `ResizeObserver`로 cleanup(`observer.disconnect()`)이 필요하므로 완전히
동일하지 않다.

**No analog (신규 패턴, 명시):**
- `ResizeObserver` — 코드베이스 전체 grep 0건. 표준 브라우저 API로 직접 구현.
- `scroll-margin-top` — `globals.css`에 전례 없음. `.prose h2 { scroll-margin-top: 52px; }`로 신규 추가(06-UI-SPEC.md "scroll-margin-top" 절 참고).
- `offsetTop` 기반 비례 폭 계산 — 06-RESEARCH.md "Code Examples" 절이 이미 초안을 제공(아래 인용), 이것을 시작점으로 쓴다:

```tsx
// Source: 06-RESEARCH.md "Section Tape 초기 폭 계산" 절 (신규 초안, 전례 없음)
"use client";
import { useEffect, useRef, useState } from "react";

type Section = { id: string; label: string; widthPercent: number };

export function SectionTape({ articleRef }: { articleRef: React.RefObject<HTMLElement> }) {
  const [sections, setSections] = useState<Section[] | null>(null); // null = 초기 균등 폭

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;

    function measure() {
      const headings = Array.from(article!.querySelectorAll("h2"));
      if (headings.length < 2) {
        setSections([]); // D-R4K-1: h2 2개 미만이면 렌더하지 않음
        return;
      }
      const tops = headings.map((h) => (h as HTMLElement).offsetTop);
      const total = article!.scrollHeight;
      const widths = tops.map((top, i) => {
        const next = tops[i + 1] ?? total;
        return ((next - top) / total) * 100;
      });
      setSections(headings.map((h, i) => ({ id: h.id, label: h.textContent ?? "", widthPercent: widths[i] })));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(article);
    return () => observer.disconnect();
  }, [articleRef]);

  if (sections !== null && sections.length === 0) return null;
  return null; // 렌더 로직은 06-UI-SPEC.md "Section Tape 계약" 절 그대로 구현
}
```

**Step 색 매핑 — `step-card.tsx`의 리터럴 `Record<StepId, string>` 패턴을 그대로 재사용해야 한다
(D-R4K-2 명시적 요구):**
```tsx
// Source: src/components/step-card.tsx:8-12 (동적 클래스 조합 대신 리터럴 맵을 쓰는 이유는
// Tailwind JIT이 문자열 템플릿 조합을 스캔하지 못하기 때문 — depth-badge.tsx와 같은 이유)
const STEP_BORDER_CLASSES: Record<StepId, string> = {
  1: "border-step-1 dark:border-step-1-dark",
  2: "border-step-2 dark:border-step-2-dark",
  3: "border-step-3 dark:border-step-3-dark",
};
```
Section Tape는 이 맵을 `bg-step-N/40`(idle), `bg-step-N/60`(hover), `bg-step-N`(current, 100%
불투명도) 변형으로 확장해서 쓴다(06-UI-SPEC.md "인터랙션 상태" 표).

**배치 지점:** `src/app/lesson/[lessonId]/page.tsx:54`의 `lesson.hasContent ? (...)` `true` 분기
안, `MDXContent` 바로 앞/옆(article 안).

---

### `scripts/check-design-tokens.mjs` (신규, static gate)

**Analog:** `scripts/check-brand.mjs`(전문 143줄, 위에서 통독) — 검사 대상이 "특정 문자열
grep"이라는 점에서 D-88의 3개 검사(hex/rgb/hsl, 타이포 리터럴, 임의값 대괄호) 전부와 구조가
가장 가깝다.

**Imports/shebang 패턴 (1-25줄)**:
```js
#!/usr/bin/env node
// (주석: 검사 목적, 대상 경로, 외부 의존성 0 명시)
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_RELATIVE_PATHS = ["src", "docs", "public", "README.md"];
```
D-88 게이트도 `src/**/*.tsx`와 `globals.css`만 대상으로 하므로 `ROOT`/`TARGET_RELATIVE_PATHS`를
좁혀 재사용.

**Walk + 에러 수집 패턴 (61-112줄, `scanFile`/`walk`)**:
```js
const violations = [];
let scannedFileCount = 0;

function scanFile(absFilePath) {
  // ... 라인 단위로 순회하며 정규식 매칭
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    // for each forbidden pattern: violations.push(`${absFilePath}:${lineNumber}: ...`);
  });
}

function walk(absPath) {
  const stat = fs.statSync(absPath);
  if (stat.isFile()) { scanFile(absPath); return; }
  if (!stat.isDirectory()) return;
  for (const entry of fs.readdirSync(absPath, { withFileTypes: true })) {
    const entryPath = path.join(absPath, entry.name);
    if (entry.isDirectory()) walk(entryPath);
    else if (entry.isFile()) scanFile(entryPath);
  }
}
```

**"0건 검사 = 성공 위장 금지" 방어 로직 (114-131줄)**:
```js
if (missingTargetCount > 0) {
  console.error(`check-brand: 검사 대상 ${missingTargetCount}곳이 존재하지 않아 검증을 수행할 수 없습니다. ...`);
  process.exit(1);
}
```
새 게이트도 대상 디렉터리(`src/`) 부재 시 이 방식으로 실패 처리해야 한다.

**성공/실패 종료 패턴 (126-143줄)**:
```js
if (violations.length > 0) {
  console.error(`check-brand: ${violations.length}건의 위반이 발견되었습니다:\n`);
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}
console.log(`check-brand: 위반 없음 — ${scannedFileCount}개 파일 검사 완료`);
process.exit(0);
```

**D-88 검사식 초안 (06-RESEARCH.md "Code Examples" 절, 신규 작성이지만 check-brand.mjs 구조를
그대로 따름):**
```js
const ARBITRARY_VALUE_PATTERN =
  /(?:text|bg|border|leading|gap|p|px|py|m|w|h|top|left|right|bottom|inset)-\[[^\]]+\]/g;
```

**순서 제약(Pitfall 1, 반드시 지킬 것):** 66곳 임의값 치환 → 게이트 신설·활성화 순서. 게이트를
먼저 만들면 66건 위반으로 즉시 빨간불.

**D-96 스코프:** hex/rgb/hsl + 임의값 대괄호 + Tailwind 기본 팔레트 색 유틸리티(`text-white`
4곳)까지 포함하되, `text-white`는 06-UI-SPEC.md 권고대로 allowlist 등록(4곳, 전부 accent 배경
위 고정 대비용).

---

### `scripts/e2e-typography.mjs` (신규, D-89 + D-91 겸용)

**Analog(부트스트랩 절반만):** `scripts/e2e-today.mjs`(부분 인용, `waitForServerReady`/
`killServerTree`/서버 spawn/`main()` 진입부, 130-194줄).

```js
// Source: scripts/e2e-today.mjs:130-141
async function waitForServerReady() {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetchWithTimeout(BASE_URL);
      if (res.status < 500) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new FatalError('서버가 제한 시간(180초) 안에 기동하지 않았습니다.');
}
```
```js
// Source: scripts/e2e-today.mjs:144-159
function killServerTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    try { execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' }); } catch {}
  } else {
    try { child.kill('SIGKILL'); } catch {}
  }
}
```
```js
// Source: scripts/e2e-today.mjs:171-189
const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBin, 'dev', '--port', String(PORT), '--hostname', HOST], {
  cwd: ROOT,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
});
// ... try { await waitForServerReady(); } finally { killServerTree(child); }
```

**No analog (검증 절반 — 반드시 신규 작성, Pitfall 4 참고):** 기존 두 `e2e-*.mjs`는 `fetch()` +
문자열 매칭뿐이라 `getComputedStyle`/`scrollWidth`를 볼 수 없다. 신규 검증 코드는 `@playwright/test`의
`chromium.launch()` → `page.goto()` → `page.evaluate(() => getComputedStyle(...))` /
`page.setViewportSize({ width: 375, height: 667 })` + `document.documentElement.scrollWidth`
형태로 완전히 새로 작성한다.

**시나리오 번호 매기기 컨벤션(재사용):** `t1`, `t2`, ... + `console.log`로 각 시나리오 통과 보고
(`e2e-today.mjs` 전역 컨벤션).

---

### `src/app/globals.css` — `@theme` 확장 + `.prose` 오버라이드

**현재 죽은 토큰 (5-41줄, 삭제 대상):**
```css
@theme {
  /* ... 18 color tokens 그대로 유지 ... */
  --font-size-label: 14px;
  --font-size-body: 16px;
  --font-size-heading: 20px;
  --font-size-display: 28px;
  --font-weight-regular: 400;
  --font-weight-semibold: 600;   /* .prose summary(204줄)에서만 var()로 참조됨 */
}
```

**교체 대상 (06-UI-SPEC.md "Typography > `@theme` 토큰 선언" 절이 최종안, 그대로 삽입):**
```css
@theme {
  --text-display: 1.875rem;        /* 30px */
  --text-display--line-height: 1.2;
  --text-heading: 1.375rem;        /* 22px */
  --text-heading--line-height: 1.3;
  --text-subhead: 1.0625rem;       /* 17px */
  --text-subhead--line-height: 1.4;
  --text-body: 1rem;               /* 16px */
  --text-body--line-height: 1.6;
  --text-label: 0.875rem;          /* 14px */
  --text-label--line-height: 1.4;
}
```

**`.prose` 오버라이드 analog(자기 자신, 이미 5곳 성공 사례, 163-219줄) — 새 CSS 레이어/`!important`
불필요, 평범한 클래스 선택자로 충분:**
```css
/* Source: src/app/globals.css:163-180 */
.prose { line-height: 1.8; }
.prose > p { margin-block: 2.4em; }
.prose > h2 { margin-top: 3.2em; }
.prose > h3 { margin-top: 2.6em; }
```
이 패턴을 그대로 반복해 h1-h4 크기 고정, 인라인 코드 백틱 제거·칩화, `scroll-margin-top`을
추가한다(정확한 신규 규칙 값은 `06-UI-SPEC.md` "Typography"/"Section Tape 계약" 절에 이미 확정
되어 있음 — 재도출 불필요, 그대로 복사).

**`.prose details`/`.prose summary` — 라이트+다크 쌍 규칙 패턴(신규 hover 규칙이 따라야 할 형태,
182-219줄):**
```css
/* Source: src/app/globals.css:189-206 */
.prose details {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-badge-neutral-bg);
}
.prose summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  cursor: pointer;
  list-style: none;
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent);
}
```
Card Contract의 `.card-interactive:hover`(06-UI-SPEC.md)도 이 "라이트 규칙 + `.dark` 접두사
오버라이드" 쌍 패턴을 그대로 따른다(`.prose [data-code-block] > button`/`.dark .prose ...`
쌍, 110-124줄도 동일 패턴의 또 다른 사례).

---

### `src/components/mdx-content.tsx` (table 컴포넌트 치환)

**Analog: 자기 자신의 `pre → CodeBlock` 매핑 (21-23줄), 그대로 인용:**
```tsx
// Source: src/components/mdx-content.tsx:21-23
const defaultComponents: Record<string, ComponentType> = {
  pre: CodeBlock as ComponentType,
};
```
**추가할 항목:**
```tsx
const defaultComponents: Record<string, ComponentType> = {
  pre: CodeBlock as ComponentType,
  table: TableWrapper as ComponentType, // 신규 (D-R4K-6)
};
```
`TableWrapper`는 `CodeBlock`과 달리 상태가 없으므로 `"use client"` 불필요, Server Component로
충분(06-UI-SPEC.md "표 가로 스크롤 계약" 절이 최종 구현을 이미 제공):
```tsx
function TableWrapper(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  );
}
```
**금지 사항:** `<table>` 자체에 `display: block` 적용 금지 — `overflow-x-auto`는 감싸는
`<div>`에만.

---

### `src/components/lesson-nav.tsx` (D-R4K-7, 화살표 리터럴 제거)

**현재 코드(정확한 수정 지점, 35줄):**
```tsx
// Source: src/components/lesson-nav.tsx:34-49
const isPrev = direction === "prev";
const label = isPrev ? "← 이전 레슨" : "다음 레슨 →";
// ...
const content = isPrev ? (
  <>
    <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
    {label}
  </>
) : (
  <>
    {label}
    <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
  </>
);
```
**수정:** `label` 값에서 리터럴 화살표만 제거 — `"이전 레슨"` / `"다음 레슨"`. `ChevronLeft`/
`ChevronRight` JSX 구조는 그대로 유지(chevron은 남긴다). 37줄의 `text-[16px] font-normal
leading-[1.6]`도 같은 파일 수정 범위 안이므로 `text-body font-normal`로 함께 치환.

---

### `src/app/lesson/[lessonId]/page.tsx` (`<main>` + 잠금 문구 + `gap-8`)

**Analog: `src/app/step/[stepId]/page.tsx`(전문 71줄) — 이미 `<main>`을 쓰는 유일한 "읽기형"
페이지:**
```tsx
// Source: src/app/step/[stepId]/page.tsx:40-41
return (
  <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
```

**현재 레슨 페이지(수정 대상, 45줄):**
```tsx
// Source: src/app/lesson/[lessonId]/page.tsx:44-45
return (
  <article className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
```
**수정 방향:** `<main>`으로 감싸고 내부에 `<article>` 유지, `gap-6` → `gap-8`(06-UI-SPEC.md
D-99):
```tsx
<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
  <article className="flex flex-col gap-8">
    {/* 기존 내용 그대로 */}
  </article>
</main>
```
(정확한 클래스 분배는 계획 재량이지만 `<main><article>` 중첩 구조와 `gap-8` 값은 06-UI-SPEC.md가
확정.)

**잠금 문구 삽입 지점 (67-81줄, `progressRead ? (...) : (...)`의 `else` 분기가 현재 완전
빈 렌더):**
```tsx
// Source: src/app/lesson/[lessonId]/page.tsx:67-81
{progressRead ? (
  <div data-progress-controls className="flex flex-col gap-6">
    {/* CompleteButton / ProgressReadError */}
    <LessonPager prev={prev} next={next} />
  </div>
) : (
  <LessonPager prev={prev} next={next} />
)}
```
`else` 분기(현재 `progressRead === null`, 즉 잠금 상태)에 `<LessonPager>` 앞에 한 줄 문구 추가:
`"완료 체크와 진행률 기록은 잠금 해제 후에 사용할 수 있습니다."`(`text-label` 크기, 링크 없음
— 06-UI-SPEC.md "Copywriting Contract").

---

### Card Contract — 그리드 카드 2종 (`step-card.tsx` ↔ `today-lesson-card.tsx`, 서로가 서로의 analog)

**`step-card.tsx` (이미 표준, padding 정답):**
```tsx
// Source: src/components/step-card.tsx:30
className={`flex min-h-11 flex-col gap-3 rounded-lg border-l-4 bg-surface p-4 dark:bg-surface-dark ${STEP_BORDER_CLASSES[step.id]}`}
```

**`today-lesson-card.tsx` (padding 이탈 지점, 수정 대상):**
```tsx
// Source: src/components/today-lesson-card.tsx:79
className="flex flex-col gap-3 rounded-lg bg-surface p-6 dark:bg-surface-dark"
```
`p-6` → `p-4`로 통일(06-UI-SPEC.md Card Contract). `border-l-4` 없음은 의도된 차이(유지).

**hover 신규 규칙 (양쪽 파일 공통, 새 색 없음, `.card-interactive` 클래스 추가):**
```css
/* Source: 06-UI-SPEC.md "Card Contract" 절 */
.card-interactive:hover { background-color: var(--color-badge-neutral-bg); }
.dark .card-interactive:hover { background-color: var(--color-badge-neutral-bg-dark); }
```
두 컴포넌트의 `<Link className="...">`에 `card-interactive transition-colors duration-150`을
추가.

**타이포 치환 대표 지점(두 파일 공통 패턴):**
```tsx
// step-card.tsx:33,36,38,41 / today-lesson-card.tsx:91,105,106
text-[14px] font-normal leading-[1.4]   → text-label font-normal
text-[14px] font-semibold leading-[1.4] → text-label font-semibold
text-[20px] font-semibold leading-[1.3] → text-heading font-bold   (크기 변경 20→22)
text-[16px] font-normal leading-[1.6]   → text-body font-normal
```

---

### 리스트 행 — `module-accordion.tsx` ↔ `schedule-table.tsx` (서로가 서로의 analog)

**공통 최소 높이/세로 padding(이미 통일, 손대지 않음):**
```tsx
// module-accordion.tsx:58
className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-3"
// schedule-table.tsx:54
className={`flex min-h-11 items-center gap-3 px-2 py-3 ${isToday ? TODAY_ROW_CLASS : ""}`}
```
가로 padding(`px-4` vs `px-2`)은 **의도된 예외로 유지**(06-UI-SPEC.md — 일정표는 고정폭 grid
정렬 제약).

**hover 신규 규칙:** 카드와 동일한 `.card-interactive:hover` 톤을 행에도 재사용(06-UI-SPEC.md
"리스트 행" 표).

**타이포 치환 대표 지점:**
```tsx
// module-accordion.tsx:40  text-[20px] font-semibold leading-[1.3] → text-heading font-bold
// module-accordion.tsx:41  text-[14px] font-normal leading-[1.4]  → text-label font-normal
// module-accordion.tsx:69,76 → text-body font-normal / text-label font-semibold
// schedule-table.tsx:56    text-[14px] font-normal leading-[1.4]  → text-label font-normal
```

---

### `src/components/site-nav.tsx` (Nav Shell Contract, 구조 불변 · 타이포만)

**컨테이너(변경 없음, 06-UI-SPEC.md "Nav Shell Contract"가 그대로 인용):**
```tsx
// Source: src/components/site-nav.tsx:37
className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6 lg:px-8"
```
**타이포 치환 지점:**
```tsx
// site-nav.tsx:24  NavBadge: text-[14px] font-semibold leading-[1.4] → text-label font-semibold
// site-nav.tsx:41  로고: text-[20px] font-semibold leading-[1.3]     → text-heading font-bold (레거시 20px→22px 마이그레이션 대상)
// site-nav.tsx:52,64  내비 항목: text-[14px] font-semibold leading-[1.4] → text-label font-semibold
```
활성 상태(`border-accent text-accent`) 로직은 변경 없음.

---

## Shared Patterns

### 1. 정적 게이트 스크립트 8종의 공통 골격
**Source:** `scripts/check-brand.mjs`(전문 인용 위), 06-RESEARCH.md "기존 게이트 스크립트 컨벤션"
절이 8종 전체를 통독해 정리.
**Apply to:** `scripts/check-design-tokens.mjs`
```
shebang #!/usr/bin/env node
→ 외부 의존성 0 (fs/path/assert 표준 모듈만)
→ path.resolve(__dirname, '..')로 저장소 루트 계산 (check-brand.mjs만 process.cwd() 예외)
→ violations 배열에 누적, 마지막에 한꺼번에 출력 후 process.exit(1)
→ "0건 검사"를 성공으로 위장 금지 (대상 부재 = 실패)
→ 성공 시: console.log('스크립트명: 요약'); process.exit(0);
→ 한국어 주석 + 영어 식별자
```

### 2. `prose` CSS 오버라이드는 명세성만으로 이긴다
**Source:** `src/app/globals.css:163-219`(5곳 기존 성공 사례)
**Apply to:** `.prose h1-h4` 고정, 인라인 코드 칩화, `scroll-margin-top`
`@tailwindcss/typography`의 모든 선택자가 `:where()`로 명세성 0이므로, 평범한 클래스 선택자가
소스 순서와 무관하게 항상 이긴다 — `!important`/`@layer` 불필요.

### 3. 라이트+다크 쌍 규칙 패턴
**Source:** `src/app/globals.css:110-146` (`.prose [data-code-block] > button` /
`.dark .prose [data-code-block] > button`, 복사 버튼 상태별 색)
**Apply to:** `.card-interactive:hover`, Section Tape idle/hover/current 배경 — 라이트 규칙 뒤
`.dark` 접두사로 다크 값을 별도 지정.

### 4. Step 색 리터럴 맵(동적 클래스 조합 금지)
**Source:** `src/components/step-card.tsx:8-21`
**Apply to:** Section Tape의 Step별 배경/막대 색
`Record<StepId, string>` 리터럴 맵 — Tailwind JIT이 템플릿 문자열 조합을 스캔하지 못하므로
동적 클래스명 생성 금지.

### 5. 쿠키 기반 조건부 렌더(진행률 3분기)
**Source:** `src/app/lesson/[lessonId]/page.tsx:35,42,67-81`, `src/app/step/[stepId]/page.tsx:28,37`
**Apply to:** 잠금 문구 삽입 위치 판단 — `hasUnlockCookie()`를 `notFound()` 분기보다 먼저,
무조건 호출(force-dynamic 캐시 문제 방지, RESEARCH Pitfall 4).

---

## No Analog Found

| File/Pattern | Role | Data Flow | Reason |
|---|---|---|---|
| `ResizeObserver` 사용 코드 | client hook logic | event-driven | 코드베이스 전체 grep 0건 — Section Tape가 처음 도입하는 표준 브라우저 API 활용 |
| `.prose h2 { scroll-margin-top }` | CSS | n/a | `globals.css`에 `scroll-margin` 계열 규칙 전례 없음 |
| Playwright 기반 `getComputedStyle`/`scrollWidth` 검증 코드 | test (e2e) | request-response | 기존 `e2e-*.mjs` 2종은 순수 HTTP fetch — 레이아웃 엔진이 필요한 값은 애초에 측정 불가능했던 영역 |
| `focus-visible` outline 규칙 | CSS | n/a | 전역 grep 0건 — Section Tape가 이 Phase에서 처음 정의하는 명시적 규칙(06-UI-SPEC.md "Focus-visible 계약") |

---

## Metadata

**Analog search scope:** `src/app/**`, `src/components/**`, `src/app/globals.css`, `scripts/*.mjs`
**Files scanned:** 23개(임의값 대상) + `mdx-content.tsx`, `schedule-auto-scroll.tsx`,
`lesson-nav.tsx`, `step-card.tsx`, `today-lesson-card.tsx`, `module-accordion.tsx`,
`schedule-table.tsx`, `site-nav.tsx`, `lesson/[lessonId]/page.tsx`, `step/[stepId]/page.tsx`,
`check-brand.mjs`, `e2e-today.mjs` (총 17개 직접 Read)
**Pattern extraction date:** 2026-08-26
