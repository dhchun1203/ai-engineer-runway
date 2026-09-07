---
phase: quick-260902-iig
plan: 01
subsystem: 사이트 헤더 내비게이션
tags: [nav, dropdown, accordion, ipad-touch, information-architecture]
requires:
  - site-header (.site-header · --site-header-height 단일 소스)
  - nav-link/chip-solid/tap-feedback 유틸 문법
provides:
  - 대메뉴 4개 + 소메뉴 2단 내비 구조
  - /print 내비 직접 도달(숨은 진입점 승격)
affects:
  - src/components/site-nav.tsx
tech-stack:
  added: []
  patterns:
    - 클릭 토글 드롭다운(hover 아님) + 바깥클릭/Esc 닫힘, 열림 상태에서만 리스너 등록·cleanup 해제
    - absolute top-full 드롭다운 패널로 헤더 실측 높이 불변 유지(구간 테이프 안정)
    - children 유무 기반 렌더 분기, isActiveHref 위에 isMenuActive 헬퍼(데스크톱·모바일 공유)
key-files:
  created: []
  modified:
    - src/components/site-nav.tsx
decisions:
  - Task 1(데스크톱 드롭다운)·Task 2(모바일 아코디언)를 단일 커밋으로 합침 — 두 태스크가 같은 파일(site-nav.tsx)을 수정하고 구조적으로 결합돼 있다. NAV_ITEMS를 평면 8항목에서 트리로 바꾸면(Task 1) 기존 평면 모바일 렌더러가 tool 그룹을 href 없는 "준비 중" 배지로 잘못 표시하므로, 빌드를 초록으로 유지하려면 모바일 패널의 children 처리(Task 2)가 같은 파일 버전에 함께 있어야 한다.
  - globals.css 무변경 — 드롭다운 패널을 등록된 Tailwind 색 토큰(border-foreground/bg-background + dark 변형)으로 표현해 헤더와 같은 크림 지면+굵은 잉크 경계 문법을 새 CSS 클래스 없이 재현. check-design-tokens.mjs 위반 0(임의값 대괄호·hex 리터럴 미사용).
  - 바깥 클릭 경계를 데스크톱 대메뉴 행 컨테이너(desktopNavRef)로 설정 — 트리거·패널은 컨테이너 안이라 유지, 로고·토글·본문은 밖이라 닫힘. 다른 대메뉴로의 전환은 트리거 자신의 onClick이 처리(컨테이너 안이라 바깥-클릭 핸들러 비관여, 이중 토글 없음).
metrics:
  duration: ~15min
  completed: 2026-09-02
  tasks_completed: 2
  tasks_total: 3
actuals:
  tokens: 2980
  tasks: 2
  commits: 1
status: complete
---

# Phase quick-260902-iig Plan 01: 헤더 내비 2단 재정리 Summary

사이트 헤더 내비를 평면 8항목에서 대메뉴 4개(오늘의 학습·커리큘럼 단독 링크 + 학습 도구▾·일정·정보▾ 클릭 토글 드롭다운) + 소메뉴 2단으로 재정리하고, 커리큘럼 페이지 안 버튼으로만 닿던 /print(PDF 내보내기)를 "일정·정보" 소메뉴로 승격했다. 라우트·콘텐츠 변경 0, globals.css 무변경.

## 무엇을 했나

- **NavItem 트리화**: `NavItem`에 `children?: readonly NavItem[]` 추가. `NAV_ITEMS`를 대메뉴 4개 트리로 교체. `href === null`의 의미를 "준비 중 비활성"에서 "드롭다운 부모"로 재정의(잔여 방어 케이스만 배지 유지).
- **활성 판정 헬퍼**: 기존 `isActiveHref` 순수함수를 그대로 두고, 그 위에 `isMenuActive`(children 있으면 자식 중 하나라도 활성이면 부모 활성)를 얹어 데스크톱 행과 햄버거 패널이 공유.
- **데스크톱 드롭다운**: children 대메뉴를 트리거 버튼(라벨 + ChevronDown, 열림 시 180° 회전)으로 렌더. `openMenu: string | null` 상태로 동시에 하나만 열림. 패널은 `relative` 래퍼 기준 `absolute top-full`(문서 흐름 밖 → 헤더 실측 높이 불변 → 구간 테이프 안 흔들림). 크림 지면 + 굵은 잉크 경계. hover가 아닌 클릭 토글(아이패드 터치 대응). aria-haspopup/aria-expanded/aria-controls 연결. 닫힘 3종: 다른 대메뉴 전환 / 바깥 pointerdown / Esc — 리스너는 열림 상태에서만 등록하고 cleanup에서 해제(T-nav-02 완화).
- **640px 미만 아코디언**: children 대메뉴 라벨을 비링크 소제목(span, text-muted), 그 아래 자식 링크를 좌측 잉크 라인(border-l-2 border-foreground)으로 들여쓴 그룹으로 항상 펼쳐 렌더. 자식 링크 탭 시 패널 닫힘.
- **디자인/보존**: nav-link/chip-solid/tap-feedback/text-muted 재사용, 모든 터치 타깃 min-h-11(44px+), 크림+잉크 문법 유지. ResizeObserver/--site-header-height 로직 무변경. 웹 노출 텍스트에 "KANT" 미언급.

## 자동 게이트 결과 (전부 통과)

| 게이트 | 결과 |
|--------|------|
| `npx tsc --noEmit` | 통과 (exit 0) — 새 children 트리·헬퍼 타입 오류 0 |
| `npm run lint` | 통과 (출력 없음) — effect 내 setState 회귀 없음, 리스너 cleanup 완비 |
| `node scripts/check-design-tokens.mjs` | 통과 — 57개 파일 위반 0(임의값 대괄호·hex 리터럴 미사용) |
| `npm run build` | 통과 (exit 0) — SSG/하이드레이션 문제 없음, /print·/review 등 전 라우트 렌더 |

## 남은 일 — Task 3 (아이패드 실기기 human-verify) 미완

Task 3은 `checkpoint:human-verify`(gate="blocking")로, 실행자가 대신 수행할 수 없는 **아이패드 사파리 실기기 UAT**다. 오케스트레이터/사용자가 아래를 확인해야 한다:

- 데스크톱 폭: "학습 도구" 탭 → 소메뉴 4개 열림, 바깥 탭·Esc·다른 대메뉴로 전환·닫힘. /review에서 "학습 도구" chip-solid 활성, /schedule에서 "일정·정보" 활성. "PDF 내보내기" → /print 도달.
- 세로 모드: 햄버거 → "학습 도구"·"일정·정보" 소제목 아래 들여쓴 링크 펼쳐짐, 소제목 비클릭.
- 레슨 장문 스크롤 → 구간 테이프가 헤더 뒤로 숨지 않음(드롭다운/햄버거 여닫아도).
- 44px+ 터치 타깃, 라이트/다크 크림+잉크 문법 유지.

승인 신호: "승인" 또는 어긋난 항목 번호.

## Deviations from Plan

**1. [설계 판단] Task 1·2를 단일 커밋으로 결합**
- **이유**: 두 태스크가 같은 파일(site-nav.tsx)을 수정하고, NAV_ITEMS를 트리로 바꾸는 Task 1이 기존 평면 모바일 렌더러를 깨뜨린다(tool 그룹이 href 없는 배지로 오표시). 빌드를 초록으로 유지하려면 모바일 children 처리(Task 2)가 같은 파일 버전에 함께 있어야 한다.
- **결과**: 커밋 `b82592f` 하나에 데스크톱 드롭다운 + 모바일 아코디언 포함. 각 태스크의 자동 verify 게이트는 순서대로 전부 실행·통과했다(tsc/lint → tracer 게이트, +design-tokens/build → 확장 게이트).

**2. [범위 축소] globals.css 신규 클래스 0**
- 계획은 "필요 시 globals.css 드롭다운 스타일 소폭 추가"를 허용했으나, 등록된 Tailwind 색 토큰만으로 헤더 문법을 재현 가능해 새 CSS를 만들지 않았다. 단일 파일 원칙에 더 부합하고 check-design-tokens 표면도 늘리지 않는다.

## Known Stubs

없음 — 스텁·플레이스홀더·미배선 데이터 없음. 모든 소메뉴 링크는 이미 존재하는 라우트로 연결된다.

## Threat Flags

없음 — 순수 클라이언트 UI 리팩터. 새 네트워크 엔드포인트·인증 경로·스키마 변경·패키지 설치 없음. T-nav-02(리스너 누수)는 열림 상태 조건부 등록 + cleanup 해제로, T-nav-03(CSS 임의값 유입)은 globals.css 무변경 + check-design-tokens 통과로 완화.

## Self-Check: PASSED

- FOUND: src/components/site-nav.tsx
- FOUND: .planning/quick/260902-iig-2/260902-iig-SUMMARY.md
- FOUND commit: b82592f
