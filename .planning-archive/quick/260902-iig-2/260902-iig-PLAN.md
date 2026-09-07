---
phase: quick-260902-iig
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/site-nav.tsx
  - src/app/globals.css
autonomous: false
requirements:
  - NAV-2TIER
estimate:
  tokens: 48000
  raw_tokens: 30000
  tasks: 3
  confidence: low
must_haves:
  truths:
    - 데스크톱에서 "학습 도구"/"일정·정보" 대메뉴를 탭하면 소메뉴 드롭다운이 열리고, 바깥 클릭·다른 대메뉴 클릭·Esc로 닫힌다 (hover 아님 — 아이패드 터치 대응).
    - 현재 pathname이 어느 대메뉴의 소메뉴 경로 중 하나와 매치되면 그 대메뉴(및 드롭다운 트리거)가 활성(chip-solid)으로 표시된다.
    - 640px 미만 햄버거 패널에서 대메뉴 라벨이 비링크 소제목으로, 그 아래 소메뉴 링크들이 들여쓰기된 그룹으로 항상 펼쳐진 아코디언 형태로 보인다.
    - /print(PDF 내보내기)가 "일정·정보" 소메뉴 링크로 내비에서 직접 도달 가능하다.
    - 소메뉴 드롭다운을 열거나 햄버거 패널을 펼쳐 헤더 실측 높이가 바뀌어도 --site-header-height가 갱신되어 구간 테이프가 헤더 뒤로 숨지 않는다.
    - 모든 터치 타깃 44px+ 유지, 크림 지면+굵은 잉크 문법 유지(nav-link/chip-solid/tap-feedback/text-muted 재사용), 웹페이지 노출 텍스트에 "KANT" 미언급.
  artifacts:
    - src/components/site-nav.tsx
    - src/app/globals.css
  key_links:
    - NavItem.children ↔ 렌더 분기(단독 링크 vs 드롭다운 트리거 vs 비링크 소제목+자식 그룹)
    - isActiveHref/isMenuActive ↔ 대메뉴 활성 표시 (데스크톱 행 + 햄버거 패널 공유 순수함수)
    - openMenu state ↔ aria-expanded/aria-haspopup ↔ 절대배치 드롭다운 패널 ↔ 바깥클릭/Esc 리스너
    - headerRef ResizeObserver ↔ --site-header-height ↔ 구간 테이프 위치
---

<objective>
사이트 헤더 내비(src/components/site-nav.tsx)를 평면 8항목에서 대메뉴 4개 + 소메뉴 2단 구조로 재정리한다.

대메뉴 구조 (D-09 4항목 골격을 계승·확장):
1. 오늘의 학습 (/) — 단독 링크
2. 커리큘럼 (/curriculum) — 단독 링크
3. 학습 도구 ▾ (자체 링크 없음) — 소메뉴: 복습(/review)·용어집(/glossary)·노트(/notes)·질문함(/inbox)
4. 일정·정보 ▾ (자체 링크 없음) — 소메뉴: 일정표(/schedule)·PDF 내보내기(/print)·소개(/about)

/print는 지금 커리큘럼 페이지 안 버튼으로만 닿던 "숨은" 진입점 — 이번에 "일정·정보" 소메뉴로 승격한다(라우트 자체는 이미 존재, 변경 없음).

Purpose: 8개 평면 항목이 좁은 폭에서 두 줄로 접히는 대신, 관련 도구를 두 그룹으로 묶어 헤더를 정돈하고 아이패드 터치에서 탐색을 단순화한다.
Output: 재작성된 site-nav.tsx (단일 파일 원칙, 필요 시 globals.css 드롭다운 스타일 소폭 추가). 라우트·콘텐츠 변경 0.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/CLAUDE.md

# 수정 대상 (전체 정독 필수)
@src/components/site-nav.tsx

# 기존 유틸 클래스·토큰·--site-header-height 소비처
@src/app/globals.css

# SiteNav 마운트 지점 (헤더가 sticky·구간 테이프와 연동됨을 확인)
@src/app/layout.tsx

주의 사항 (site-nav.tsx 정독 시 확인할 것):
- 현재 NavItem = { label, href: string | null }. null = "준비 중" 비활성 배지. 새 구조에서 드롭다운 부모는 href 없이 children을 갖는다 — null href가 "비활성"이 아니라 "드롭다운"을 의미할 수 있으므로 렌더 분기를 명확히 나눌 것.
- isActiveHref(pathname, href): href==="/"는 정확히 "/"일 때만, 그 외는 startsWith. 이 순수함수를 재사용하고 "자식 중 하나라도 매치" 판정 헬퍼를 그 위에 얹는다.
- useEffect의 ResizeObserver가 headerRef 높이를 --site-header-height에 실측·기록. 이 로직·상태 없음 원칙(setState 미사용, CSS 변수만)을 그대로 유지한다. 데스크톱 드롭다운은 절대배치라 헤더 높이에 영향이 없을 가능성이 크다(그래서 테이프가 안 흔들린다) — Task 3에서 실측 검증.
- 디자인 문법: 크림 지면 + 굵은 잉크 밑줄(.site-header border-bottom 2px foreground). 얇은 회색 경계선은 헤더 문법이 아니다. chip-solid(활성 잉크 블록)·nav-link(밑줄 호버)·tap-feedback·text-muted·chip 재사용. 44px = min-h-11.
- globals.css는 check-design-tokens.mjs 상시 게이트 대상 — 새 CSS는 임의값 대괄호 금지, hex 리터럴은 @theme 밖 금지, font-size/weight는 허용 집합만. 토큰(var(--color-*))만 사용.
</context>

<tasks>

<task type="tracer">
  <name>Task 1: NavItem 트리 재구성 + 데스크톱 드롭다운 end-to-end</name>
  <files>src/components/site-nav.tsx</files>
  <action>
NavItem 타입에 optional `children?: NavItem[]` 필드를 추가한다. NAV_ITEMS를 대메뉴 4개 트리로 교체: (1) 오늘의 학습 href "/" 단독, (2) 커리큘럼 href "/curriculum" 단독, (3) 라벨 "학습 도구" href 없음 + children [복습 "/review", 용어집 "/glossary", 노트 "/notes", 질문함 "/inbox"], (4) 라벨 "일정·정보" href 없음 + children [일정표 "/schedule", PDF 내보내기 "/print", 소개 "/about"]. /print를 "일정·정보" 소메뉴로 승격 — 이 항목은 지금까지 내비에 없던 숨은 진입점이다.

기존 isActiveHref 순수함수는 그대로 두고, 그 위에 "대메뉴 활성" 판정 헬퍼(예: isMenuActive(pathname, item) — item.children가 있으면 자식 href 중 하나라도 isActiveHref 참이면 true, 없으면 item.href를 isActiveHref로 판정)를 추가한다. 데스크톱 행과 햄버거 패널이 같은 헬퍼를 공유하게 해 두 곳이 어긋나지 않도록 한다(기존 순수함수 공유 원칙 계승).

데스크톱 행(sm:flex 컨테이너)을 재작성한다: children 없는 대메뉴는 기존과 동일한 nav-link/chip-solid 링크로 렌더. children 있는 대메뉴는 드롭다운 트리거 버튼으로 렌더 — 트리거는 relative 래퍼 안의 button 요소로, 라벨 + 여닫힘 표시 caret(lucide-react ChevronDown, 열림 시 회전)을 담고, nav-link 문법을 따르며 isMenuActive면 chip-solid로 활성 표시한다. 트리거 클릭 시 그 대메뉴의 드롭다운을 토글한다.

드롭다운 상태는 "열린 대메뉴 식별자 하나"(예: openMenu: string | null, 라벨을 키로) useState로 관리한다 — 동시에 하나만 열린다. 열린 드롭다운 패널은 트리거 relative 래퍼 기준 absolute(top-full)로 헤더 아래에 띄운다(문서 흐름 밖 → 헤더 실측 높이 불변 → 구간 테이프 안 흔들림). 패널은 크림 지면(var(--color-background)/dark 대응) + 헤더와 같은 굵은 잉크 경계 문법으로 그리고, 내부 소메뉴는 각 44px+ 링크(nav-link/chip-solid/tap-feedback/text-muted, min-h-11), 자식 링크 클릭 시 드롭다운을 닫는다.

아이패드 터치 대응 — hover가 아니라 클릭 토글이다. 접근성: 트리거에 aria-haspopup="true", aria-expanded={열림여부}, aria-controls로 패널 id 연결. 닫힘 경로 3종: (a) 다른 대메뉴 트리거 클릭 시 그쪽으로 전환(이전 것 닫힘), (b) 바깥 클릭 시 닫힘 — 드롭다운이 하나라도 열렸을 때만 document pointerdown/click 리스너를 붙이고 nav 래퍼(ref) 바깥이면 close, (c) Esc keydown 시 닫힘. 리스너는 열림 상태에서만 등록하고 cleanup에서 해제한다. children 없는 단독 링크·null href지만 children도 없는 잔여 케이스(현재 트리엔 없음)는 방어적으로 기존 처리를 유지한다.
  </action>
  <verify>
    <automated>cd C:/Users/dhchu/dev/aiEngineerCourse && npx tsc --noEmit && npm run lint</automated>
    <human-check>내장 브라우저를 아이패드 폭(768px/1024px)으로 열어: "학습 도구" 탭 → 소메뉴 4개 패널 열림, 다시 탭하거나 "일정·정보" 탭 시 전환, 패널 바깥 클릭·Esc로 닫힘 확인</human-check>
  </verify>
  <done>site-nav.tsx가 타입 오류·lint 오류 없이 컴파일된다. 데스크톱에서 두 드롭다운 대메뉴가 클릭 토글로 열리고, 바깥 클릭/다른 대메뉴/Esc로 닫히며, aria-haspopup·aria-expanded가 열림 상태를 반영한다. 소메뉴 경로에 있을 때 해당 대메뉴 트리거가 chip-solid로 활성 표시된다.</done>
</task>

<task type="auto">
  <name>Task 2: 640px 미만 햄버거 패널 아코디언 + 헤더 높이 로직 보존</name>
  <files>src/components/site-nav.tsx, src/app/globals.css</files>
  <action>
640px 미만 햄버거 패널(#site-nav-panel) 렌더를 새 트리에 맞춰 재작성한다 — 드롭다운이 아니라 항상 펼친 아코디언 형태로 단순하게. children 없는 대메뉴(오늘의 학습·커리큘럼)는 기존처럼 직접 링크로 렌더한다. children 있는 대메뉴(학습 도구·일정·정보)는 대메뉴 라벨을 비링크 소제목(button/Link 아닌 span, text-muted 계열 소제목 스타일, 클릭 불가)으로 두고 그 바로 아래에 자식 링크들을 들여쓴 그룹으로 배치한다(예: 좌측 들여쓰기 pl-6 또는 좌측 잉크 라인 들여쓰기). 각 자식 링크는 44px+(min-h-11), nav-link/chip-solid(활성)/tap-feedback/text-muted 문법을 따르고 클릭 시 setOpen(false)로 패널을 닫는다. isMenuActive/isActiveHref 헬퍼를 데스크톱과 동일하게 공유한다.

ResizeObserver + --site-header-height 로직은 손대지 않는다 — 상태 없음(CSS 변수만) 원칙 그대로다. 햄버거 패널은 계속 <header> 안(nav 아래)에 렌더되므로 패널을 펼치면 헤더 실측 높이가 자라고 ResizeObserver가 이를 --site-header-height에 반영해 구간 테이프가 따라 내려간다 — 이 경로가 깨지지 않는지 확인한다.

CSS는 최소로만 추가한다. 데스크톱 드롭다운 패널이 기존 유틸리티 조합(크림 배경 + 굵은 잉크 경계)으로 표현 가능하면 새 클래스를 만들지 않는다. 정말 필요할 때만 globals.css의 헤더/패널 계열 근처에 토큰 기반 클래스를 소폭 추가한다(var(--color-*)만, 임의값 대괄호·hex 리터럴·비허용 font-size 금지 — check-design-tokens.mjs 통과 조건). 기존 nav-panel-reveal 진입 애니메이션과 prefers-reduced-motion 가드는 유지한다.
  </action>
  <verify>
    <automated>cd C:/Users/dhchu/dev/aiEngineerCourse && npm run lint && node scripts/check-design-tokens.mjs && npm run build</automated>
    <human-check>내장 브라우저 375px 폭에서 햄버거 열기 → "학습 도구"·"일정·정보" 소제목 아래 소메뉴 링크가 들여쓰기되어 항상 펼쳐져 보임, 자식 링크 탭 시 패널 닫힘 확인</human-check>
  </verify>
  <done>npm run build가 성공한다(SSG 렌더·하이드레이션 문제 없음). check-design-tokens.mjs가 통과한다(globals.css 수정 시). 640px 미만 패널이 대메뉴 소제목 + 들여쓴 자식 링크 그룹으로 항상 펼쳐진 아코디언으로 렌더되고, /print가 "일정·정보" 그룹에서 링크로 도달 가능하다. ResizeObserver/--site-header-height 로직이 그대로 남아 있고 햄버거 펼침 시 헤더 높이가 갱신된다.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
헤더 내비를 대메뉴 4개(오늘의 학습·커리큘럼·학습 도구▾·일정·정보▾) + 소메뉴 2단으로 재정리했다. 데스크톱은 클릭 토글 드롭다운(바깥/Esc 닫힘), 640px 미만은 소제목+들여쓴 링크 아코디언. /print를 "일정·정보" 소메뉴로 승격. 라우트·콘텐츠 변경 없음.
  </what-built>
  <how-to-verify>
아이패드 사파리 실기기에서 배포/로컬 사이트를 연다.

데스크톱 폭(가로 모드/1024px+):
1. "학습 도구" 탭 → 아래에 복습·용어집·노트·질문함 4개 패널이 뜨는지. 패널 바깥의 본문을 한 번 탭 → 닫히는지.
2. "일정·정보" 탭 → 일정표·PDF 내보내기·소개 3개가 뜨는지. "학습 도구"가 열린 상태에서 "일정·정보"를 탭하면 앞의 것이 닫히고 이쪽이 열리는지.
3. /review 페이지로 이동 후 → "학습 도구" 대메뉴가 활성(꽉 찬 잉크 블록)으로 표시되는지. /schedule로 이동 → "일정·정보"가 활성인지.
4. "PDF 내보내기"를 눌러 /print로 이동되는지(내비에서 직접 도달).

세로 모드(744px 폭, 햄버거 나오는 폭이면 햄버거로):
5. 햄버거 열기 → "학습 도구"·"일정·정보" 소제목 아래 링크들이 들여쓰기되어 펼쳐져 있는지, 소제목 자체는 눌리지 않는지.
6. 아무 레슨을 길게 스크롤 → 상단 구간 테이프(회차 라벨)가 헤더 뒤로 숨지 않고 헤더 바로 아래에 붙어 따라오는지(드롭다운/햄버거를 열었다 닫아도 테이프 위치가 헤더에 가려지지 않는지).
7. 모든 탭·링크가 손가락으로 누르기 편한 크기(44px+)인지, 라이트/다크 모드 둘 다 크림+잉크 문법이 유지되는지.
  </how-to-verify>
  <resume-signal>"승인"이라고 하거나 어긋난 항목(번호로)을 알려주세요</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | 순수 클라이언트 UI 리팩터 — 새 사용자 입력·네트워크 요청·인증 경계·패키지 설치가 없다. NAV_ITEMS는 하드코딩 상수, 라우트/콘텐츠 변경 0. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-nav-01 | Information Disclosure | 소메뉴 링크(/print 등) | low | accept | 승격되는 /print를 포함해 모든 소메뉴 경로는 이미 공개된 정적/세션 라우트다. 새 데이터 노출 없음. |
| T-nav-02 | Denial of Service | document click/keydown 리스너 | low | mitigate | 리스너는 드롭다운이 열린 동안에만 등록하고 useEffect cleanup에서 반드시 해제 — 누수·중복 등록 방지. |
| T-nav-03 | Tampering | globals.css 신규 스타일 | low | mitigate | check-design-tokens.mjs 상시 게이트로 임의값·hex 리터럴 유입 차단(토큰만 허용). |
</threat_model>

<verification>
- `npx tsc --noEmit` — 새 NavItem 트리·children·헬퍼가 타입 오류 없이 컴파일.
- `npm run lint` — eslint 통과(effect 내 setState·미사용 변수 등 회귀 없음).
- `node scripts/check-design-tokens.mjs` — globals.css 수정 시 토큰 위반 0.
- `npm run build` — SSG/하이드레이션 성공.
- 브랜딩: 웹 노출 텍스트(라벨·aria-label 등)에 "KANT"/"Kant" 미포함.
- 아이패드 실기기 human-verify(체크포인트) — 드롭다운 토글/닫힘/활성표시/아코디언/테이프/44px.
</verification>

<success_criteria>
- 대메뉴 4개(단독 2 + 드롭다운 2) 구조가 데스크톱·모바일 양쪽에서 렌더된다.
- 데스크톱 드롭다운: 클릭 토글, 바깥 클릭·다른 대메뉴·Esc로 닫힘, aria-haspopup/aria-expanded 반영, 절대배치 패널.
- 소메뉴 자식 경로 활성 시 부모 대메뉴가 chip-solid로 활성 표시(데스크톱·모바일 공유 헬퍼).
- 640px 미만: 대메뉴 비링크 소제목 + 들여쓴 자식 링크의 항상 펼친 아코디언.
- /print가 "일정·정보" 소메뉴로 내비에서 도달 가능.
- ResizeObserver/--site-header-height 유지 — 헤더 높이 변화 시 구간 테이프 안 가려짐.
- 44px+ 터치 타깃, 크림+잉크 문법, KANT 미언급.
- lint·design-tokens·build 게이트 통과.
</success_criteria>

<output>
Create `.planning/quick/260902-iig-2/260902-iig-SUMMARY.md` when done
</output>
