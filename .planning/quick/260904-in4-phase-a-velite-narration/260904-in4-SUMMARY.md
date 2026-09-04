---
quick_id: 260904-in4
slug: phase-a-velite-narration
date: 2026-09-04
status: complete
commits:
  - 86f00d9
---

# Quick Task 260904-in4 — 책으로 읽기 낭독(TTS) Phase A: 대본 추출 파이프라인

## 무엇을 만들었나

"책으로 읽기(/book/[step])"를 미리 만든 신경망 음성으로 들려주는 큰 기능의 **1단계**.
이 Phase는 오디오를 만들지 않는다 — 다음 Phase(음성 생성)가 그대로 넘길 수 있는
**"귀로 듣기 좋은 순수 한국어 대본"**을 빌드 타임에 뽑아내는 것까지만 한다.

`velite.config.ts`의 lessons 스키마 transform에 `narration: string[]`(문장 배열)을 추가.
`bookCode`·`bookMinutes`와 같은 `sliceBookContent()` 입력(책 본문 = 2.왜 배우나 +
3.개념 설명 + NextTeaser)을 쓰고, `terms`/`selfCheck`와 정확히 같은 `hasContent` 게이트를 탄다.

## 어떻게

- **stripBlocks 공용 헬퍼**: SVG 다이어그램·코드펜스·HTML/JSX 태그 제거 3-replace를
  `estimateBookMinutes`에서 뽑아내 `extractNarration`과 공유. `parseTermTable`/
  `parseSelfCheck` 이중 구현 경고와 같은 정신 — 애초에 같은 함수를 부르게 해 드리프트를
  구조적으로 차단. 리팩터는 출력 동일이라 **`bookMinutes` 값은 변하지 않는다**.
- **extractNarration**: stripBlocks 후 줄 단위로 GFM 표(`| …`)·빈 줄 스킵 → 헤딩(`#`)·
  리스트(`- `/`* `)·인용(`>`)·선두 장식 이모지 제거 → 인라인 강조/코드 기호(`* _ ~ \``)만
  제거하고 **단어 내부 하이픈은 보존**(f-string·TypeError 안 깨짐) → 문장 분리.
- **문장 분리**: 각 원본 줄을 하드 경계로 삼고, 종결부호(`. ? ! …`) 바로 앞이 한글
  음절 또는 닫는 괄호/따옴표일 때만 자른다(`(?<=[가-힣)\]"'」』])` 룩비하인드).
  소수점(`3.14`·`1.0`)은 앞이 숫자라 안 걸려 안전하게 보존.
- **scripts/check-narration.mjs**: `.velite/lessons.json`을 읽는 상시 게이트 —
  잔여물(꺾쇠·백틱·코드펜스·표 파이프·SVG) 0, 소수점 문장 끝 분절 없음, hasContent
  레슨 대본 비어있지 않음, 스텁은 빈 배열. 하나라도 어기면 0이 아닌 코드로 종료.
  `check-progress-gates.mjs`·`check-manifest.mjs`와 같은 형태.

## 검증

- `npx velite build` 통과(타입 생성 정상).
- 35개 레슨 **전부** narration 생성 — 총 **764문장**.
- 파일럿(**Python 변수·자료형**, `1-3-python-variables-and-types`) 30문장 육안 확인:
  코드·SVG·표 기호가 하나도 안 새고, 인라인 코드 내용은 살아 있고(`name = "지현"`,
  `f-string`), 문장 분리가 자연스러움. `1 == 1.0` 소수점 미분절 확인.
- `node scripts/check-narration.mjs` → OK(잔여물 0).

## 범위 밖 (다음 Phase)

오디오 생성(OpenAI gpt-4o-mini-tts), Supabase Storage 업로드, 오디오 매니페스트,
플레이어 UI, 읽는 문장 하이라이트 — 전부 이후 Phase. 이 Phase는 대본 텍스트만.

## 커밋

- `86f00d9` feat(quick-260904-in4): 책으로 읽기 낭독(TTS) 대본 추출 파이프라인
