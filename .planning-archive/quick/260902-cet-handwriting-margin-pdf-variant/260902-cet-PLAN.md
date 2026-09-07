---
phase: quick-260902-cet
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/print-button.tsx
  - src/components/print-mode.tsx
  - src/app/globals.css
  - src/app/lesson/[lessonId]/page.tsx
  - src/app/print/[scope]/page.tsx
autonomous: false
requirements:
  - handwriting-margin-pdf   # edu-sites FINAL-REPORT 2단 "필기 여백 PDF" + 사용자 습관 확인(2026-09-02)

estimate:
  tokens: 42000
  raw_tokens: 30000
  tasks: 3
  confidence: med

must_haves:
  truths:
    - 레슨 페이지와 /print 범위 페이지에서 "PDF로 저장" 옆에 "필기 여백으로 저장" 버튼이 하나 더 보인다.
    - "필기 여백으로 저장"을 누르면 인쇄 미리보기 본문 오른쪽에 손글씨용 빈 세로 컬럼이 생긴다.
    - 기존 "PDF로 저장" 버튼은 예전과 똑같은(여백 없는) 인쇄 결과를 낸다 — 회귀 없음.
    - 인쇄가 끝나거나 취소되면 data-print-annotate가 body에서 제거돼 다음 일반 인쇄에 여백이 새어들지 않는다.
    - 코드 블록·표·그림은 필기 컬럼에 눌리거나 잘리지 않고 전체 폭을 유지한다.
  artifacts:
    - src/components/print-button.tsx        # annotate 프롭 + 인쇄 직전 body 표식 설정
    - src/components/print-mode.tsx           # leave()에서 표식 정리
    - src/app/globals.css                     # body[data-print-annotate] 인쇄 스코프 블록
    - src/app/lesson/[lessonId]/page.tsx      # 두 번째 버튼
    - src/app/print/[scope]/page.tsx          # 두 번째 버튼
  key_links:
    - 버튼 onClick이 body의 data-print-annotate를 켜고 → globals.css 인쇄 규칙이 그 스코프를 읽어 필기 컬럼을 내고 → print-mode.tsx의 leave()가 그 속성을 걷어낸다. 세 지점이 동일한 리터럴 속성명(data-print-annotate)으로 이어져야 동작한다(data-print-hide가 이미 쓰는 것과 같은 패턴).
---

<objective>
기존 "PDF로 저장"(window.print() → 아이패드 Safari 인쇄 미리보기 → Notability) 경로 옆에
필기 여백 변형 버튼 "필기 여백으로 저장"을 하나 더 붙인다. 누르면 본문 오른쪽에 애플펜슬로
필기할 세로 컬럼이 비워진 채로 인쇄된다. 기존 인쇄는 그대로 둔다.

Purpose: 사용자가 종종 레슨을 Notability로 가져가 필기하는 습관이 확인됨(2026-09-02).
텍스트 옆에 손글씨 쓸 자리를 미리 비워주면 그 흐름이 매끄러워진다.
Output: annotate 변형 버튼 2개(레슨·묶음 페이지) + body[data-print-annotate] 스코프 인쇄 CSS
+ 인쇄 후 표식을 걷어내는 정리 로직.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.claude/CLAUDE.md
@src/components/print-button.tsx
@src/components/print-mode.tsx
@src/app/lesson/[lessonId]/page.tsx
@src/app/print/[scope]/page.tsx

# globals.css 인쇄 규칙 전체는 1524~1647행(@media print). 새 규칙은 이 블록 안 또는
# 바로 아래 인접 @media print 블록에 body[data-print-annotate] 스코프로만 추가한다.
@src/app/globals.css
</context>

<tasks>

<task type="tracer">
  <name>Task 1: data-print-annotate 파이프라인 — 버튼 표식 설정 · 인쇄 후 정리 · 스코프 CSS</name>
  <files>src/components/print-button.tsx, src/components/print-mode.tsx, src/app/globals.css</files>
  <action>
기존 인쇄 파이프라인에 필기 여백 변형을 얹되, 현재 "PDF로 저장" 출력은 한 픽셀도 바뀌지 않게 한다. 세 지점을 한 슬라이스로 연결해 끝까지 동작하게 만드는 것이 이 태스크다.

(a) src/components/print-button.tsx — 선택적 불리언 프롭 `annotate`(기본 false)를 추가한다. true면 onClick이 먼저 document.body에 빈 값의 `data-print-annotate` 속성을 설정한 뒤 window.print()를 호출한다(기본 버튼 경로는 그대로 window.print()만). annotate가 true일 때 앞쪽 아이콘을 손글씨 아이콘으로 바꾼다 — lucide-react에서 `PencilLine`을 import(파일 존재 확인: node_modules/lucide-react/dist/esm/icons/pencil-line.mjs), 기본 버튼은 기존 `Printer` 유지. 클래스는 기존 `btn tap-feedback text-label`와 `data-print-hide` 속성을 그대로 재사용한다 — 새 클래스 금지, Tailwind 임의값 대괄호 금지(check-design-tokens 규칙 c). `btn` 클래스가 이미 min-height 2.75rem(44px 터치)를 지니므로 터치 크기는 자동 상속된다. 여기서 속성을 걷어내지 말 것 — 정리는 (b)의 print-mode.tsx 한 곳에 모은다(Safari의 afterprint/matchMedia 발화만이 '인쇄 끝/취소'를 알려주는 유일하게 믿을 신호라서다).

(b) src/components/print-mode.tsx — 이미 다크 모드를 되돌리고 인쇄로 연 details를 닫는 기존 `leave()` 함수 안에서 `document.body.removeAttribute("data-print-annotate")`도 호출한다. 없는 속성에 대한 removeAttribute는 no-op이므로, afterprint·matchMedia("print") leave·언마운트 정리(cleanup의 leave() 호출) 어느 경로로 끝나든 표식이 안전하게 지워진다 — 다음 일반 인쇄에 여백이 새어들지 않는다. 필기 변형과 연결됨을 알리는 한 줄 주석을 단다. enter()는 건드리지 않는다(enter는 모든 인쇄에 도는데, 표식은 annotate 버튼을 눌렀을 때만 켜져야 하므로 설정은 버튼이, 정리는 leave가 담당한다).

(c) src/app/globals.css — 기존 @media print 블록(현재 규칙이 끝나는 ~1647행, 닫는 중괄호 앞) 안 또는 바로 아래 인접한 새 @media print 블록에, `body[data-print-annotate]`로만 스코프한 규칙을 추가한다 — 기본 인쇄 경로는 스코프에 걸리지 않아 무회귀. `body[data-print-annotate] .prose`에 오른쪽 필기 컬럼을 준다: margin-right 40mm(A4 세로 본문폭 ~186mm → 글줄 ~143mm, 여전히 읽기 편함), 작은 padding-right(~3mm) 숨쉴 틈, 옅은 경계선 border-right 1px solid var(--color-line)(기존 토큰 재사용 — 새 색 금지). 그다음 눌리거나 잘리면 안 되는 넓은 블록의 전체 폭을 되찾는다: 같은 `body[data-print-annotate] .prose` 스코프 아래 블록 래퍼 `[data-code-block]`, `table`, `figure`, `[data-diagram]`에 margin-right -40mm를 적용한다. 안에 중첩된 `pre`는 목록에 넣지 말 것([data-code-block] 안에 있어 이중 이동된다). 치수는 전부 이 파일의 순수 CSS(mm 단위)로만 두고 Tailwind 대괄호 값으로 옮기지 않는다. 새 규칙이 font-size/font-weight 선언을 추가하지 않게 한다(check-design-tokens 규칙 b는 타이포 리터럴만 본다 — 여백/테두리 선언은 무관).
  </action>
  <verify>
    <automated>cd "C:/Users/dhchu/dev/aiEngineerCourse" && npx tsc --noEmit && npm run lint</automated>
    <automated>cd "C:/Users/dhchu/dev/aiEngineerCourse" && grep -q "data-print-annotate" src/components/print-button.tsx && grep -q "data-print-annotate" src/components/print-mode.tsx && grep -q "body\[data-print-annotate\]" src/app/globals.css</automated>
  </verify>
  <done>annotate 프롭이 body의 data-print-annotate를 켜고, print-mode.tsx leave()가 그것을 걷어내며, globals.css에 var(--color-line) 토큰만 쓴 body[data-print-annotate] 인쇄 스코프가 존재한다. 기본 "PDF로 저장" 버튼의 onClick과 아이콘은 변화 없음. tsc·lint 통과.</done>
</task>

<task type="auto">
  <name>Task 2: 레슨·묶음 페이지에 "필기 여백으로 저장" 버튼 배치 + 인쇄 에뮬레이션 확인</name>
  <files>src/app/lesson/[lessonId]/page.tsx, src/app/print/[scope]/page.tsx</files>
  <action>
두 인쇄 진입점 모두에, 기존 버튼 바로 옆에 두 번째 버튼을 렌더한다.

(a) src/app/lesson/[lessonId]/page.tsx — CopyLessonPrompt와 기본 `<PrintButton />`을 담고 있는 `<span className="flex flex-wrap items-start gap-2">`(대략 91~101행, lesson.hasContent일 때만 렌더) 안에서, 기존 `<PrintButton />` 바로 뒤에 두 번째 인스턴스 `<PrintButton annotate label="필기 여백으로 저장" />`을 추가한다. flex-wrap span이 좁은 아이패드 폭을 이미 처리한다.

(b) src/app/print/[scope]/page.tsx — 기존 `<PrintButton label="이 묶음 PDF로 저장" />`을 담은 `<div data-print-hide className="flex flex-wrap items-center gap-3 pt-2">`(대략 73~81행) 안에서, 그 버튼 바로 뒤·"다른 범위 고르기" Link 앞에 `<PrintButton annotate label="필기 여백으로 저장" />`을 추가한다.

두 파일 모두 이미 PrintButton을 import하고 있고, 사이트의 유일한 두 인쇄 진입점이며, 교육기관명 브랜딩 금지 규칙(웹 노출 문구는 항상 "AI Engineer 교육과정"만)을 지킨다 — 새 문구에 어떤 교육기관 이름도 넣지 않는다.

배치 후, 내장 브라우저에서 print 미디어를 에뮬레이션해(예: DevTools rendering "Emulate CSS media type: print", 또는 agent-browser로 print 미디어 강제) 두 모드를 눈으로 대조한다: 기본 "PDF로 저장"은 여백 없음, "필기 여백으로 저장"은 본문 오른쪽에 40mm 빈 컬럼 + 옅은 경계선이 생기고 코드 블록·표는 그 컬럼으로 넘쳐 전체 폭을 유지하는지 확인한다. 인쇄 종료(afterprint) 후 body에서 data-print-annotate가 사라졌는지 DOM에서 확인한다.
  </action>
  <verify>
    <automated>cd "C:/Users/dhchu/dev/aiEngineerCourse" && grep -q 'annotate label="필기 여백으로 저장"' src/app/lesson/[lessonId]/page.tsx && grep -q 'annotate label="필기 여백으로 저장"' src/app/print/[scope]/page.tsx</automated>
    <automated>cd "C:/Users/dhchu/dev/aiEngineerCourse" && node scripts/check-brand.mjs && node scripts/check-design-tokens.mjs && node scripts/check-lesson-structure.mjs && node scripts/check-route-rendering.mjs</automated>
    <automated>cd "C:/Users/dhchu/dev/aiEngineerCourse" && npm run build</automated>
    <human-check>내장 브라우저 print 미디어 에뮬레이션에서 두 모드 대조: 일반 = 여백 없음, 필기 = 오른쪽 40mm 빈 컬럼 + 옅은 경계선, 코드/표는 전체 폭 유지(잘림 없음). 인쇄 종료 후 body의 data-print-annotate 제거 확인.</human-check>
  </verify>
  <done>레슨·묶음 두 페이지에 "필기 여백으로 저장" 버튼이 기존 버튼 옆에 뜬다. 네 게이트(check-brand·check-design-tokens·check-lesson-structure·check-route-rendering)와 build 통과. 인쇄 에뮬레이션에서 두 모드 차이가 확인되고 표식이 인쇄 후 정리된다.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: 아이패드 실기기 Notability 반입 UAT</name>
  <what-built>레슨/묶음 페이지의 "필기 여백으로 저장" 버튼 — 누르면 본문 오른쪽에 손글씨 컬럼이 비워진 PDF가 Notability로 넘어간다.</what-built>
  <how-to-verify>
아이패드(iPad Safari)에서:
1. 아무 레슨 페이지를 연다 (예: 배포 URL 또는 로컬 `npm run dev` 후 http://<맥/PC IP>:3000/lesson/<레슨-슬러그>).
2. 제목 아래 버튼 줄에서 "필기 여백으로 저장"을 탭한다.
3. 인쇄 미리보기가 뜨면 본문 오른쪽에 빈 세로 컬럼(옅은 경계선)이 보이는지 확인.
4. 공유 시트 → Notability를 골라 반입한 뒤, 그 오른쪽 컬럼에 애플펜슬로 실제로 필기가 되는지 확인.
5. 같은 페이지에서 이번엔 "PDF로 저장"(기존 버튼)을 탭 → 여백 없이 예전과 똑같이 나오는지 확인(회귀 없음).
6. 5번 직후 다시 인쇄 미리보기를 열어(또는 다른 레슨에서) 여백이 새어들지 않았는지 확인.
  </how-to-verify>
  <resume-signal>필기 컬럼이 잘 나오고 필기가 되면 "approved", 컬럼 폭·경계선·코드 잘림 등 문제가 있으면 구체적으로 알려주세요.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (없음 — 신규 없음) | 순수 클라이언트 프레젠테이션 변경. 새 입력·네트워크 호출·패키지·서버 경계 없음. window.print()와 body 속성 토글, 인쇄 전용 CSS만 추가. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-cet-01 | Tampering | body[data-print-annotate] 표식이 인쇄 후 남아 다음 일반 인쇄를 오염 | low | mitigate | print-mode.tsx leave()가 afterprint·matchMedia·언마운트 세 경로에서 removeAttribute로 정리(Task 1b, key_links). |
| T-cet-02 | Information Disclosure | 신규 데이터 노출 경로 | low | accept | 진도·PII·네트워크 접근 없음. 정적 콘텐츠 인쇄 레이아웃 변경뿐이라 노출면 증가 없음. |
</threat_model>

<verification>
- npx tsc --noEmit / npm run lint / npm run build 통과.
- 게이트 무회귀: check-brand, check-design-tokens(규칙 b·c), check-lesson-structure, check-route-rendering.
- 기본 "PDF로 저장" 출력 불변(회귀 없음), annotate 경로만 오른쪽 컬럼 추가.
- 인쇄 후 data-print-annotate가 body에서 제거됨.
</verification>

<success_criteria>
- 레슨·묶음 페이지에 "필기 여백으로 저장" 버튼(44px 터치·data-print-hide·btn 클래스 재사용)이 기존 버튼 옆에 존재.
- annotate 인쇄 시 본문 오른쪽 40mm 필기 컬럼 + 옅은 경계선, 코드·표·그림은 전체 폭 유지.
- 새 색·arbitrary Tailwind 값 없음(토큰만, 치수는 globals.css mm).
- 인쇄 종료/취소 후 표식 정리로 다음 일반 인쇄 무오염.
- 아이패드 실기기 Notability 반입 UAT 승인.
</success_criteria>

<output>
Create `.planning/quick/260902-cet-handwriting-margin-pdf-variant/260902-cet-SUMMARY.md` when done
</output>
