---
phase: 08-performance-and-mobile
reviewed: 2026-08-27T03:32:22Z
depth: standard
files_reviewed: 39
files_reviewed_list:
  - assets/fonts/PretendardVariable.woff2
  - docs/making-of.md
  - package.json
  - public/fonts/PretendardVariable.subset.woff2
  - scripts/check-font-glyph-coverage.mjs
  - scripts/check-progress-gates.mjs
  - scripts/check-route-rendering.mjs
  - scripts/e2e-lesson-note.mjs
  - scripts/e2e-mobile-readability.mjs
  - scripts/e2e-perf-budget.mjs
  - scripts/e2e-progress.mjs
  - scripts/e2e-today.mjs
  - scripts/subset-font.mjs
  - src/app/api/progress/route.ts
  - src/app/curriculum/page.tsx
  - src/app/globals.css
  - src/app/lesson/[lessonId]/actions.ts
  - src/app/lesson/[lessonId]/page.tsx
  - src/app/page.tsx
  - src/app/schedule/page.tsx
  - src/app/step/[stepId]/page.tsx
  - src/components/code-block.tsx
  - src/components/complete-button.tsx
  - src/components/dday-countdown-live.tsx
  - src/components/lesson-nav.tsx
  - src/components/lesson-notepad.tsx
  - src/components/module-accordion.tsx
  - src/components/progress-error.tsx
  - src/components/progress-provider.tsx
  - src/components/progress-skeleton.tsx
  - src/components/progress-slots.tsx
  - src/components/progress-summary.tsx
  - src/components/schedule-table.tsx
  - src/components/section-tape.tsx
  - src/components/site-nav.tsx
  - src/components/step-card.tsx
  - src/components/theme-toggle.tsx
  - src/components/today-lesson-card.tsx
  - src/lib/fonts.ts
findings:
  critical: 0
  warning: 5
  info: 2
  total: 7
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-08-27T03:32:22Z
**Depth:** standard
**Files Reviewed:** 39
**Status:** issues_found

## Summary

Phase 8이 `/step`·`/lesson`·`/curriculum`을 완전 정적으로 전환하고 `GET /api/progress`
클라이언트 아일랜드로 진도·완료·메모를 옮긴 작업 전반을 코드 레벨에서 직접 추적했다.
가장 위험도가 높다고 지시받은 표면(`route.ts`의 쿠키 게이트 순서, `ProgressProvider`의
fetch/abort 흐름, `dday-countdown-live.tsx`의 하이드레이션, 폰트 서브셋)은 전부
견고하게 구현되어 있다 — `hasUnlockCookie()`가 어떤 조회보다 먼저 호출되고, 잠금
해제 전에는 응답 필드가 전부 `null`로 고정되며, 정적 셸 원문에는 진도 마커가 실제로
0건이다(코드 경로상 확인). `check-progress-gates.mjs`의 G9/G14/G17/G21도 실제
소스와 일치한다.

Critical(보안·데이터 손실·크래시) 등급 결함은 발견하지 못했다. 다만 진도 아일랜드의
`refresh()` 설계가 낳는 사이드 이펙트(완료 토글마다 같은 `<ProgressProvider>` 아래
모든 소비자가 `loading`으로 되돌아가 스켈레톤으로 교체된다) 하나가 특히 주목할
만하다 — 이 재마운트가 메모장의 미저장 디바운스 입력을 지울 수 있는 경로를 만들지만,
브라우저의 표준 blur-먼저-click 순서 덕분에 실제 데이터 손실로 이어질 가능성은
낮다고 판단해 Critical이 아니라 Warning으로 분류했다(근거는 아래 WR-01 참고). 알려진/
이관된 항목(`schedule-table.tsx:190`의 `seenTodayAnchor` 린트 오류, 375px 잔여
가독성 위반 120건)은 08-05 이후 손대지 않은 코드 그대로임을 diff로 재확인했고, 이번
diff로 새로 도달 가능해지거나 악화되지 않았다 — 지시대로 재보고하지 않는다.

## Critical Issues

없음.

## Warnings

### WR-01: 진도 새로고침이 완료 버튼·메모장을 매번 언마운트시켜 깜빡임과 잠재적 미저장 손실 경로를 만든다

**File:** `src/components/progress-provider.tsx:75-99`, `src/components/progress-slots.tsx:57-77,100-120`, `src/components/lesson-notepad.tsx:47-56,87-103`

**Issue:** `CompleteButton`의 `onToggled`(완료 토글 성공 시)와 `ProgressErrorSlot`의
`onRetry`는 둘 다 `ProgressProvider.refresh()`를 호출한다. `refresh()`는
`reloadToken`을 증가시키고, `useEffect`가 그 즉시 `setState({ status: "loading",
data: null })`를 실행한다(progress-provider.tsx:77). 레슨 페이지에서는
`<ProgressProvider lessonId>` 하나가 `CompleteButtonSlot`과 `LessonNoteSlot`을 모두
감싸므로, 완료 버튼을 누를 때마다 두 슬롯이 동시에 `loading` 분기로 떨어져
`CompleteButtonSkeleton`/`NotepadSkeleton`으로 **교체**된다(progress-slots.tsx:60,
103) — React가 다른 컴포넌트 타입으로 교체하므로 `LessonNotepad`가 언마운트된다.

`LessonNotepad`의 디바운스 저장 타이머 cleanup(lesson-notepad.tsx:96-100)은
`clearTimeout`만 하고 `flush()`를 호출하지 않는다 — 즉 저장 대기 중(입력 후
1000ms 이내)에 컴포넌트가 언마운트되면 그 편집분은 서버로 전송되지 않고 조용히
버려진다. 재마운트된 `LessonNotepad`는 서버의 이전 `initialBody`로 다시 초기화된다.

이 경로가 실제 데이터 손실로 이어지려면 사용자가 메모장에 포커스를 둔 채 다른
DOM 요소(완료 버튼 등)를 곧바로 조작해야 하는데, 브라우저의 표준 동작상 포커스가
다른 요소로 옮겨지면 클릭 이벤트보다 먼저 `blur`가 발생해 `onBlur={() => void
flush()}`(lesson-notepad.tsx:205)가 선제적으로 저장을 트리거한다. 그래서 통상적인
마우스/터치/키보드 상호작용에서는 실제 손실이 은폐된다 — 하지만 이 안전장치는
`LessonNotepad`가 명시적으로 보장하는 계약이 아니라 우연히 기대는 것이다.
언마운트 자체를 막는 코드는 전혀 없다.

증상은 데이터 손실 여부와 무관하게도 나타난다: 완료 버튼을 누르면 `useOptimistic`이
이미 즉시 "완료했어요 ✓"로 반영한 화면이, `refresh()` 완료를 기다리는 동안
스켈레톤으로 한 번 깜빡였다가 다시 실제 버튼으로 돌아온다 — 애초에 낙관적 UI를
도입한 목적(즉시성, 재조회 대기 없는 반응)을 새 재조회 설계가 스스로 무효화한다.

**Fix:** 두 가지 중 하나를 권장한다.
1. `LessonNotepad`에 언마운트 시 flush를 보장하는 cleanup을 추가한다(blur 순서에
   기대지 않는 명시적 방어):
```tsx
useEffect(() => {
  return () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      // best-effort: 언마운트 후에도 네트워크 요청 자체는 계속 진행된다
      if (valueRef.current !== lastSavedRef.current) {
        void saveLessonNoteAction(lessonId, valueRef.current);
      }
    }
  };
}, [lessonId]);
```
2. (더 근본적) `ProgressProvider.refresh()`가 `status`를 즉시 `loading`으로
   되돌리지 않고, 이전 `data`를 유지한 채 백그라운드로만 재조회하는
   stale-while-revalidate 방식으로 바꿔 슬롯이 언마운트되지 않게 한다.

---

### WR-02: 폰트 글리프 커버리지 게이트가 `.ts`(비-`.tsx`) 파일의 한글/기호 리터럴을 스캔하지 않는다

**File:** `scripts/subset-font.mjs:208-213`, `scripts/check-font-glyph-coverage.mjs:89-94`

**Issue:** 서브셋 생성기(`subset-font.mjs`)와 상시 게이트(`check-font-glyph-coverage.mjs`)
둘 다 콘텐츠 문자 집합을 `src/content/lessons/**/*.mdx` + `src/content/modules.ts`
(명시적 단일 파일) + `src/**/*.tsx` + `docs/*.md`에서만 수집한다. `modules.ts`
외의 `.ts` 파일(예: `src/lib/note-store.ts`, `src/lib/progress-store.ts`,
`src/lib/schedule-data.ts`, 향후 추가될 공용 상수 파일 등)에 새 한글 UI 문자열
리터럴이 추가되면, 그 문자열이 `.tsx`에서 변수 참조로만 쓰이는 한(리터럴 자체가
`.tsx` 소스 텍스트에 등장하지 않으면) 두 스크립트 모두 그 문자를 인식하지 못한다.

현재 코드베이스를 직접 확인한 결과 이 경로로 실제 사용자에게 노출되는 문자열은
없다(`.ts` 파일의 한글은 전부 주석이거나, 서버 전용 `throw new Error` 메시지로
DB/개발자 로그에만 남고 클라이언트로 전달되지 않는다) — 그래서 지금 당장의
결함은 아니다. 하지만 생성기와 게이트가 **완전히 동일한 스캔 로직**(같은
`walkFiles`/확장자 필터)을 공유하므로, 이중 방어처럼 보이지만 실제로는 같은
사각지대를 공유하는 단일 방어다. 향후 누군가 `.ts` 상수 파일에 한글 라벨을
추가하고 `.tsx`에서 그 상수를 참조하기만 해도, 서브셋 폰트에 글리프가 빠진 채
게이트가 "통과"로 보고하고, 배포 후에야 깨진 글자(tofu)로 발견된다 — 바로 이
게이트가 막으려던 실패 모드 그 자체다.

**Fix:** 두 스크립트의 `contentFiles` 수집 대상에 `src/**/*.ts`(`.tsx` 제외 아님,
합집합)를 추가하거나, 최소한 `src/lib/**/*.ts`·`src/content/**/*.ts`처럼 사용자
문구가 실제로 정의될 수 있는 디렉터리를 화이트리스트로 넓힌다. 서버 전용 오류
메시지까지 스캔에 포함시키는 것이 과하다면, "클라이언트에 렌더되는 문자열은
반드시 `.tsx`/`.mdx`에 리터럴로 존재해야 한다"는 코딩 규율을 주석으로 명문화하고
ESLint 규칙 등으로 강제하는 대안도 있다.

---

### WR-03: 640px 미만 내비게이션 패널에 Escape·바깥 클릭 닫기가 없다

**File:** `src/components/site-nav.tsx:38-142`

**Issue:** 새로 추가된 햄버거 메뉴(`open` 상태)는 토글 버튼 클릭이나 패널 내부
링크 클릭(`onClick={() => setOpen(false)}`, site-nav.tsx:126)으로만 닫힌다.
패널이 열린 상태에서 Escape 키를 누르거나 패널 바깥을 클릭/탭해도 닫히지 않는다.
같은 커밋 세트가 `lesson-notepad.tsx`에는 Escape 키 처리(`handlePanelKeyDown`,
lesson-notepad.tsx:165-170)를 명시적으로 구현해 뒀는데, 같은 페이즈에 추가된
내비게이션 패널에는 이 패턴이 적용되지 않아 두 열림/닫힘 UI 사이에 일관성이
없고, 키보드만 사용하는 사용자가 패널을 닫으려면 반드시 햄버거 버튼으로 다시
포커스를 옮겨야 한다.

**Fix:** `lesson-notepad.tsx`의 `handlePanelKeyDown` 패턴을 재사용해 패널
컨테이너에 Escape 핸들러를 추가하고(포커스는 햄버거 버튼으로 복귀), 필요하면
바깥 클릭 감지(예: patrol 패턴이 아니라 단순 `useEffect` + `pointerdown` 리스너)도
추가한다.

### WR-04: `complete-button.tsx`의 `initialDone` 계약 설명 주석이 08-02/03 전환 이후 사실과 어긋난다

**File:** `src/components/complete-button.tsx:3-9`

**Issue:** 헤더 주석은 "`initialDone`은 서버가 매 렌더마다 새로 내려주는 prop이다
... Server Action이 `revalidatePath`를 부르면 서버가 새 `initialDone`을 내려주고
`useOptimistic`이 그 값으로 수렴한다"고 설명한다. 그런데 08-02에서
`revalidatePath` 3줄은 이미 제거되었고(`actions.ts:32-38` 주석 참고), 이제
`initialDone`은 `CompleteButtonSlot`이 클라이언트 `fetch`(`GET
/api/progress?lesson=`)로 받아온 `data.lesson.done`이며 페이지의 "매 렌더"가
아니라 `ProgressProvider`의 마운트/`refresh()` 시점에만 갱신된다. 동작 자체는
올바르지만(다른 기기 변경 사항은 `refresh()`가 있을 때만 반영됨, WR-01과 연결),
주석은 여전히 옛 서버 렌더링 시절의 정합성 모델을 설명하고 있어 향후 유지보수자가
실제 데이터 흐름을 오해할 수 있다.

**Fix:** 주석을 `ProgressProvider`/`refresh()` 기반 흐름으로 갱신한다 — 예:
"`initialDone`은 `useProgress()`가 마운트 시 또는 `refresh()` 호출 시 가져온
`data.lesson.done`이다. 서버 렌더가 아니라 클라이언트 fetch가 소스이므로, 다른
기기에서 바뀐 완료 상태는 이 페이지가 다시 fetch할 때만(마운트 또는 이 컴포넌트의
`onToggled→refresh()`) 반영된다."

### WR-05: `DDayCountdownLive`가 이름과 달리 마운트 시 1회만 정정하고, 자정을 넘겨 열어 둔 탭은 갱신되지 않는다

**File:** `src/components/dday-countdown-live.tsx:16-33`

**Issue:** `useEffect(() => {...}, [])`가 마운트 직후 한 번만
`daysUntil(COURSE_START_DATE, todayInSeoul())`을 재계산한다. 컴포넌트 이름과
헤더 주석("D-day만 브라우저에서 다시 계산해 정정")은 "항상 정확"을 목표로
서술하지만, 실제로는 페이지를 자정(Asia/Seoul) 이전에 열어 그대로 탭을 켜 둔
채 자정을 넘기면(예: 밤에 켜 둔 아이패드) 리렌더를 유발할 아무 타이머·이벤트도
없어 D-day가 하루 어긋난 채로 남는다 — 새로고침이나 재방문 전까지는 고쳐지지
않는다. `/curriculum`이 정적 셸이라는 근본 목적(빌드 시점 값 고착 방지)은
달성했지만 "Live" 라는 이름이 주는 기대(지속 갱신)에는 못 미친다.

**Fix:** 심각도는 낮지만(재방문·새로고침으로 즉시 회복), 이름을
`DDayCountdownMountCorrect`처럼 정확히 하거나, 다음 Asia/Seoul 자정까지
남은 시간을 계산해 `setTimeout`으로 한 번 더 정정하는 짧은 보강을 고려한다.

## Info

### IN-01: `subset-font.mjs`의 KS X 1001 완성형 2,350자 상수는 검증됨(참고 사항, 결함 아님)

**File:** `scripts/subset-font.mjs:37-155`

**Issue:** 헤더 주석의 "이 세션에서 직접 확인했다"는 주장을 `node -e`로 독립
재계산해 문자 수 2,350 및 중복 0을 확인했다 — 결함 아님, 리뷰 과정에서 실제로
검증했다는 기록만 남긴다.

### IN-02: `check-route-rendering.mjs`/`check-progress-gates.mjs`의 G9·G14·G17·G21 재정렬은 실제 소스와 일치

**File:** `scripts/check-progress-gates.mjs`, `scripts/check-route-rendering.mjs`

**Issue:** `STATIC_SHELL_PAGES`/`DYNAMIC_GATED_PAGES`(G9), Route Handler 쿠키
게이트 순서(G14, G21), `/`·`/schedule` 전용 쿠키 게이트 순서(G17)가 각 소스
파일의 실제 코드 순서·선언과 정확히 일치함을 라인 단위로 대조했다 — 결함 아님.

---

_Reviewed: 2026-08-27T03:32:22Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
