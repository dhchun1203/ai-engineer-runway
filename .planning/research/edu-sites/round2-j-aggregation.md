# Round 2-J: 집계 페이지(/glossary·모듈 복습) 타당성 (실측, 2026-09-01)

## 판정: 가능 — Round 1의 변수("표 데이터화")가 예상보다 훨씬 싸다

- 35편 전편에 용어 표 존재, **L5 게이트가 이미 기계 파싱 가능한 형태를 강제**
  (`**이 레슨의 단어**` 라벨 1회 → `| 단어 | 뜻 |` 헤더 → 데이터 행 5~8개).
- **총 용어 247개.** 셀 안 백틱·볼드·이스케이프 0건 — 순수 텍스트. 라틴 시작 29건
  (A–Z 섹션 필요), 병기 23건.
- Velite 0.4: 기존 lessons `.transform((data, {meta}))`의 `meta.content`로 본문 접근
  가능 — **frontmatter 이관(35편 수작업) 불필요.** 본문 표 파싱(코드 한 번)이 이 저장소
  관행("게이트가 형식을 강제하고 코드가 그 형식에 기댄다" — check-manifest와 동일 패턴)에
  맞다. 표가 단일 진실로 남는다.
- 모듈 조립 코드 재사용 가능: `curriculum-helpers.ts`의 `getLessonsByModule()` 등,
  `/step/[stepId]/page.tsx`가 정확한 본보기.
- prerequisites 필드: `s.array(s.string()).default([])` 추가는 기존 35편 안 깨짐.
  값 채우기는 수작업 반나절 (R1 유지).
- 폰트 서브셋: 스캔 대상에 새 라우트 tsx가 자동 포함 — 걱정 없음.

## 용어 중복 실측: 29개 용어가 2회+ 등장 — **자동 병합 금지**

- 동일 정의 복붙 ~10건(병합 무손실) / 의도적 심화 재정의(토큰·임베딩·프롬프트) /
  **진짜 다의어**(회귀: ML vs 버그, 상태: React vs 에이전트).
- 제안: "용어 1개 → 정의 목록(출처 레슨 역링크)" 그룹 표시. 다의어 병합은 틀린다.
  그룹 표시가 오히려 "같은 단어가 문맥마다 다르다"는 학습 가치.

## 권장 구현 경로

1. `velite.config.ts` — transform에 `terms: parseTermTable(meta.content)` (~25줄,
   L5 로직 이식, 실패 시 throw로 빌드 실패)
2. `curriculum-helpers.ts` — `getAllTerms()`(그룹+ㄱㄴㄷ/A–Z 정렬), `getTermsByModule()`
3. `src/app/glossary/page.tsx` — 완전 정적 (step 페이지 패턴, ProgressProvider 불필요)
4. `src/app/review/[module]/page.tsx` — generateStaticParams 19모듈
5. `check-route-rendering.mjs`에 라우트 등록

## 함정

1. **레슨 6장 앵커 없음** (rehype-slug 부재) — 역링크는 레슨 최상단으로만. 직행 링크는
   rehype-slug 결정 필요 (→ round2-h와 같은 결정).
2. 다의어 자동 병합 금지.
3. 라틴 시작 29개 — A–Z 섹션 필수.
4. 파서-게이트 이중 구현 — L5와 velite 파서가 같은 규칙 두 번. 양쪽에 상호 참조 주석.
5. `meta.content`는 frontmatter 포함 원문 — 라벨 탐색 기반이라 실질 영향 없음.

## 작업량 (R1 대비 하향)

- 파서+헬퍼+/glossary: **반나절** (R1 "1일+변수" → 변수 소멸)
- /review/[module]: **반나절**
- prerequisites 칩: 1일 유지 (매핑 수작업 포함)
