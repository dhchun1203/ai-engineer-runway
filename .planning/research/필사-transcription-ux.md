# 필사(Transcription) UX 조사 — 개념 설명 구간 적용

**조사일:** 2026-08-26
**긴급 재조정:** 조율자가 조사 도중 마감을 통보함 — 오늘(8/26) 기준 **2026-08-28 이전 배포**(약 1.5 작업일, 계획·구현·검증·배포 포함). 아래 권장안은 이 마감을 전제로 재조정된 것이며, "이상적인 설계"가 아니라 "1.5일 안에 한 세션으로 실제로 배포 가능한 설계"를 우선한다.

---

## Bottom line

**전체 문단을 실시간으로 따라 치는 "완전 필사"는 하지 않는다.** 이 프로젝트의 주 사용 기기(아이패드 사파리)에서 화면 키보드가 뷰포트 절반을 가리고, 한글 IME 조합(자모 단위 `input` 이벤트, `compositionend` 이전에는 완성되지 않은 음절)을 실시간으로 글자 단위 비교하는 것은 기술적으로 가장 위험하면서도 정작 학습 효과 근거는 가장 약한 선택지다(아래 Evidence 참고 — 눈에 보이는 글을 그대로 베끼는 것은 "인출 연습"이 아니라 복사이므로 testing effect/generation effect가 요구하는 조건을 충족하지 못한다).

대신 권장: **개념 설명(3번 섹션) 문단에서 이미 저자가 강조해 둔 용어 하나를 빈칸으로 만들어 입력하게 하는 클로즈(cloze) 방식**을 1일 안에 만든다. 빈칸 후보는 레슨 저자가 이미 쓰고 있는 3가지 강조 패턴(`용어(term, 설명)` 괄호 글로스 / `**굵게**` / `` `인라인 코드` ``)에서 자동으로 뽑는다 — 35개 레슨 중 32개(91%)에서 레슨별 추가 작업 없이 바로 적용 가능함을 이번 세션에서 직접 확인했다. 정답 비교는 `compositionend`나 `blur` 이후의 **최종 문자열 1회 비교**로만 하고, 타이핑 중 실시간 글자별 diff는 아예 만들지 않는다 — 이것이 한글 IME/NFC-NFD 정합성 문제를 "잘 처리하는" 게 아니라 "애초에 발생하지 않게" 만드는 유일하게 안전한 선택이다. 저장은 기존 Supabase `progress` 테이블/완료 버튼을 건드리지 않고 `localStorage`에 별도로 남긴다.

---

## Day-1 scope vs. later

**8/28 전 배포(Day-1):**
- 빌드 타임 remark 플러그인으로 `## 3. 개념 설명` 구간을 자동 탐지, 문단마다 강조된 용어 1개를 빈칸 후보로 표시 (레슨 파일 수정 없음)
- 문단당 인라인 `<input>` 1개 — 빈칸 채우기, `blur`/`Enter` 시 1회 비교(NFC 정규화 + trim), 정답/오답 즉시 표시 + "정답 보기" 폴백
- 강조 용어가 없는 문단(3개 레슨, 아래 참고)은 클로즈 없이 평문 그대로 렌더링 — 빌드가 깨지지 않는 안전한 폴백
- 저장: `localStorage`, 기존 완료 버튼/Supabase 스키마는 무변경
- 접근성: `aria-live="polite"`, 키보드만으로 완전히 조작 가능(일반 `<input>`), `prefers-reduced-motion` 존중

**이후(마감 이후에만 착수):**
- 문장 단위 전체 필사(재현 완료 시 reveal) — 실제 아이패드 사파리에서 `compositionend` 타이밍, 자동완성/자동대문자 간섭, `visualViewport` 키보드 회피를 직접 테스트할 시간이 필요함
- 탭-투-어셈블(단어 칩) 모드 — 키보드를 아예 안 쓰는 가장 iPad 친화적인 방식이지만, 접근 가능한 칩 UI(포커스 이동, 스크린리더 라벨)를 제대로 만들려면 클로즈보다 UI 표면이 넓음
- 클로즈 빈칸 선택 로직 고도화(현재는 "저자가 이미 강조한 첫 용어" 단순 규칙 — 문단당 난이도/빈도 조정 없음)

**절대 하지 않음(이번 마감 안에서는):**
- 전체 문단 실시간 글자별 diff(Monkeytype류) — 아래 Options ranked #4 참고, 리스크/보상 비율이 가장 나쁨
- Apple Pencil 손글씨 인식 — 웹에 공개 API 자체가 없음(아래 참고), 이번 마감과 무관하게 이 아키텍처(Next.js/Vercel 웹앱)에서는 애초에 불가능

---

## Prior art table

| 제품 | 하는 일 | 입력 비교 방식 | 모바일/태블릿 이야기 | 우리가 훔칠 것 |
|---|---|---|---|---|
| Monkeytype | 데스크톱 타자 속도 테스트, 문단 실시간 필사 | 키 입력마다 실시간 diff, 맞으면 초록/틀리면 빨강으로 즉시 표시 [MEDIUM] | 모바일 대상 설계 아님, 키보드 중심 | (day-1엔 미사용) 색상 diff 시각 문법은 later 단계에서나 참고 |
| Keybr | 적응형 알파벳 연습, 마르코프 체인으로 취약한 자리 조합을 자동으로 더 자주 출제 | 생성된 bigram 스트림 대비 실시간 diff [MEDIUM] | 데스크톱/물리 키보드 전용, 모바일 이야기 없음 | 적용 안 함 — "취약점" 데이터 모델 자체가 우리 콘텐츠엔 없음 |
| Typing.com | 커리큘럼형 타자 수업 + 게임, 영상 강의 | 기술 문서 미공개(LOW — 검색으로 확인 안 됨) | 모바일 웹은 있으나 물리 키보드 훈련이 본질 | 적용 안 함 |
| 한컴타자 "필사" 기능 | 교보문고 제휴 도서 전문(全文)을 그대로 타이핑 [MEDIUM] | 비공개 | 주로 PC | "필사"라는 한국어 단어의 시장 기본 의미가 "전문 타이핑"임을 확인 — 우리는 의도적으로 그 기본형에서 벗어난다는 점을 명시할 가치가 있음 |
| 한글타자왕 | 한글 타자 연습 앱 | 비공개 | 태블릿/폴더블 가로모드 "한 줄 집중 모드" 전용 UI, 타이핑 위치를 픽셀 단위로 추적해 현재 줄이 화면 밖으로 안 나가게 함, 블루투스 키보드 지원. **자체적으로 "모바일 터치로는 10손가락 타법 근육기억을 만들 수 없다"고 명시하고 모바일을 게임 위주의 보조 모드로, PC를 '진짜' 연습으로 구분**함 [MEDIUM] | 전문 한글 타자 앱조차 터치 키보드로는 자기 제품의 핵심 스킬을 못 가르친다고 이미 결론 내렸다는 점이 이 프로젝트의 "아이패드 정직성" 우려를 뒷받침함 |
| 필사(Fillsa) 앱 | 매일 한 문장 명언 필사 저널 | 화면 키보드로 타이핑하거나, 직접 쓴 손글씨를 사진으로 업로드 — 타이핑은 선택지 중 하나일 뿐, 필수 경로가 아님 [MEDIUM] | 폰 우선, 비(非)타이핑 손글씨-사진 경로를 동등한 1급 옵션으로 제공 | "타이핑이 아닌 방식도 정당한 대안"이라는 태도 — 억지로 타이핑에 끼워맞추지 말라는 근거 |
| 타이핑 웍스 | 무료 웹 필사 연습, 회원가입 없음, 초/중/고급 난이도 지문 | 비공개 | 웹, 태블릿 특화 없음 | 게이미피케이션 없이 "지문 고르고 타이핑하고 끝"이라는 단순 흐름으로도 충분히 쓸모 있다는 점 |
| Duolingo "직접 입력" 문제 | 빈칸/번역 입력 문제 | 기본값은 **단어 뱅크에서 탭으로 선택**한 최종 문자열을 비교 — 물리 키보드 입력은 화면 왼쪽 하단 아이콘을 탭해야 나오는 **선택적** 고급 모드 [MEDIUM — Duolingo 공식 블로그] | 모바일 퍼스트 제품이면서도, "폰 화면 타이핑이 단어 탭보다 UX가 나쁘다"는 자체 결론으로 기본값을 타이핑이 아닌 쪽으로 잡음 | **이 표에서 가장 강력한 선례.** 모바일 UX 리서치 자원이 우리보다 압도적으로 많은 회사가 이미 "폰에서 자유 타이핑은 기본값이 아니다"라고 결론 내림 |
| Anki / Clozemaster 클로즈 삭제 | 문장 속 단어/구 1개를 빈칸으로 채우기, 자동 또는 자가 채점 | Clozemaster는 자동 문자열 비교, 기본 Anki 클로즈는 보통 정답 공개 후 자가 채점 [MEDIUM] | 빈칸이 짧은 단어 하나뿐이라 모바일에서도 무리 없음 | **Day-1 권장안의 원형** — 입력 범위가 짧게 제한되면 모바일 타이핑도, 한글 IME 리스크도 함께 작아짐 |

---

## Options ranked

| 순위 | 방식 | 아이패드 적합성 | 구현 비용(대략) | 학습 효과 근거 |
|---|---|---|---|---|
| 1 (day-1) | **클로즈(빈칸 채우기)** — 문단당 강조 용어 1개 | 좋음 — 입력이 2~6자로 짧아 화면 키보드 노출 시간이 짧고, 비교를 blur 이후 1회로만 하므로 IME 리스크가 거의 없음 | 약 1일 — 빌드타임 추출(신규 의존성 불필요, 검증됨) + `<input>` 1개 + NFC 정규화 비교 + localStorage | **가장 강함** — retrieval practice/testing effect(Roediger & Karpicke)가 직접 검증한 조건과 구조가 동일(단서 없이 답을 스스로 생성) |
| 2 (later) | 문장 단위 전체 필사, 완료 시 정답 공개 | 보통 — 문장 하나(약 15~40 음절)는 화면 키보드 세션이 길어지고, 자동완성/자동대문자 간섭 위험 증가 | 2~3일 실감 — 실기기(iPad Safari) IME 엣지 케이스 검증에 시간이 실제로 든다 | 중간 — "진짜 필사"에 가깝지만 손글씨 대비 타이핑 특이적 효과는 근거가 혼재(Evidence 참고) |
| 3 (later) | 탭-투-어셈블(단어 칩, 키보드 없음) | 최고 — 화면 키보드를 아예 안 씀, IME 리스크 0 (Duolingo 모바일 기본값과 동일한 발상) | 클로즈와 비슷한 수준(~1일)이지만 칩 셔플/탭-배치/실행취소 + 접근 가능한 키보드 내비게이션까지 제대로 만들면 UI 표면이 더 넓음 | 클로즈보다 약함 — 몇 개 안 되는 칩 중에서 "재인식"하는 것은 단서 없이 "생성"하는 것보다 인출 강도가 낮음. 그래도 읽고-넘기기보다는 확실히 위 |
| 4 (하지 않음) | 전체 문단 실시간 글자별 diff (Monkeytype류) | 나쁨 — 세로 모드 아이패드에서 키보드가 뷰포트의 40~50%를 차지, 게다가 **이 목록에서 기술적으로 가장 위험한 항목**: 한글 조합 중 자모 단위 `input` 이벤트가 계속 발생하고 `value.length`가 실제 지각되는 글자 수와 일치하지 않아, 잘못 구현하면 타이핑 도중 초록/빨강 표시가 화면에서 눈에 띄게 깨짐 — 이는 "학습 난이도"가 아니라 "버그"로 읽힘 | 가장 높음 — 실기기 IME 조합 케이스(2벌식, 자동완성 제안바로 인한 포커스 탈취 등)까지 검증하려면 현실적으로 3~5일+ | 의외로 **가장 약함** — 이미 보이는 글을 그대로 베끼는 것은 정의상 "인출"이 아니라 "복사"이므로, testing effect/generation effect가 요구하는 조건(단서 없이 스스로 만들어내기)을 충족하지 않는다 |
| 5 (참고만) | 읽고-넘기기 + 자가 체크 | 매우 좋음 — 타이핑 전혀 없음, 이미 있는 "완료" 버튼과 사실상 같은 패턴 | 약 30분 | **가장 약함** — retrieval practice 연구에서 재읽기/자가보고는 보통 대조군(통제 조건)으로 쓰이는 쪽이지, 개입 효과가 있는 쪽이 아님 |
| — (범위 밖) | 손글씨 트레이싱(Apple Pencil) | 정신적으로는 가장 "필사"에 가까운 아이패드 네이티브 상호작용이지만, PencilKit/손글씨 인식은 **iOS 네이티브 전용 API이며 웹에 공개된 대응 API가 없음**(WICG의 `handwriting-recognition` explainer는 아직 초기 제안 단계이고 사파리에 탑재되지 않음, Apple이 Scribble/PencilKit을 웹 콘텐츠에 노출한 적 없음) [MEDIUM — 검색 확인] | Next.js/Vercel 웹앱 구조상 사실상 불가능 — `<canvas>`로 펜 궤적만 받아서 자동 채점 없는 낙서장을 만드는 정도가 한계 | 손글씨 대 타이핑 문헌은 손글씨 쪽에 유리하지만(Evidence 참고), 이 프로젝트에서는 측정 불가 | 이번 마감과 무관하게 **완전히 범위 밖** — 정말 손글씨 효과를 원하면 정직한 답은 "웹 기능이 아니라 실제 종이를 쓰라"이다 |

---

## Korean/IME correctness notes

- **핵심 함정:** 조합 중(`compositionstart` ~ `compositionend` 사이) 발생하는 `input` 이벤트는 완성되지 않은 자모 상태를 담고 있다. `ㄱ` → `가` → `각`처럼 한 음절 안에서도 여러 `input` 이벤트가 오가므로, 이 구간에서 실시간 글자별 비교를 시도하면 항상 깨진다. 표준 대응은 `isComposing`(또는 `onCompositionStart`/`onCompositionEnd`)으로 조합 여부를 추적하고 **`compositionend` 이후에만** 비교하는 것 [MEDIUM — 다수 개발 블로그·React composition 이슈 스레드에서 일관되게 확인]. 우리 권장안(day-1 클로즈)은 여기서 한 걸음 더 나가 **`blur`/제출 시 1회 최종 비교**로 단순화해 이 문제 자체를 회피한다.
- **NFC vs NFD:** macOS의 파일시스템(HFS+ 계열)은 한글을 NFD(자모 분해형, 가 = U+1100 U+1161)로 저장하는 것으로 알려져 있으나, 이는 **파일명/복사-붙여넣기 경로에서 주로 발생하는 특수 사례**이고, 일반 `<input>`/`<textarea>`를 통한 사파리 타이핑 입력은 보통 NFC로 들어온다는 근거를 찾았다 [MEDIUM — 검증된 1차 소스는 아님]. 그럼에도 이걸 "항상 NFC"라고 가정하지 말고, 비교 직전 양쪽(정답·입력) 모두에 `.normalize('NFC').trim()`을 거는 것을 방어적 기본값으로 삼는다 — 비용이 0에 가까운 한 줄이므로 굳이 리스크를 감수할 이유가 없다.
- **부가 이점:** "실시간 diff를 안 만들고 제출 시 1회 비교만 한다"는 이 설계는 IME 안전성뿐 아니라 접근성 권고와도 정확히 일치한다 — 웹 접근성 모범사례는 폼 검증 라이브 리전(`aria-live`)을 "키 입력마다"가 아니라 "필드를 벗어나거나 제출할 때" 알리라고 권한다 [MEDIUM — UXPin/Harvard 접근성 가이드]. 즉 IME 안전 설계와 a11y 모범사례가 같은 방향을 가리킨다.

---

## Evidence

- **Testing effect / retrieval practice (Roediger & Karpicke, 2006 및 후속 재현 연구):** 시험(인출) 조건이 재읽기 조건보다 장기 기억에 유의하게 유리하다는 것은 이 분야에서 반복적으로 재현된, 비교적 강한 근거다 [MEDIUM — 다수 리뷰 논문에서 일관되게 확인, 원논문 직접 열람은 하지 않음]. 클로즈(빈칸 채우기)는 이 조건을 구조적으로 그대로 구현한다 — 단서 없이 스스로 답을 만들어낸다.
- **Generation effect:** 스스로 만들어낸(generate) 항목이 단순히 읽은 항목보다 기억에 유리하다는 고전적 효과이며, testing effect와 메커니즘이 겹친다는 지적도 있다 [MEDIUM].
- **손글씨 대 타이핑(노트 필기 문헌):** 대학생 대상 연구에서 손글씨 필기 집단이 이후 평가에서 더 나은 경우가 다수 보고되지만("Pen Is Mightier Than the Keyboard" 계열), 이는 어디까지나 **강의를 들으며 스스로 요약/바꿔쓰기(paraphrase)해야 하는 노트 필기** 상황을 다룬 것이지, **이미 화면에 적힌 문장을 그대로 베끼는 필사**를 다룬 것이 아니다 — 후자는 인출/재구성 부담이 훨씬 적다. 또한 최근 연구들은 결과가 혼재되어 있다는 점도 함께 보고된다(일부는 키보드 집단이 오히려 더 나음, 초·중등생이 아닌 대학생 표본 한정) [MEDIUM — 다수 리뷰/메타 자료로 확인, 개별 1차 논문은 직접 읽지 않음].
- **정직하게 짚어야 할 공백:** "이미 보이는 학습 지문을 화면에서 그대로 타이핑해 베끼는 것"이 기억에 도움이 된다는 것을 직접 검증한 연구는 이번 조사에서 찾지 못했다. 위 두 문헌(testing effect, 손글씨-대-타이핑)은 각각 "단서 없는 인출"과 "강의 요약 필기"를 다루지, "보이는 문장 그대로 베끼기"를 다루지 않는다. 따라서 **완전 필사(옵션 4)가 "필사"라는 이름값에 비해 가장 약한 근거를 갖고, 오히려 클로즈(옵션 1)가 근거가 더 강하다**는 것은 이 리서치에서 나온, 다소 의외이지만 중요한 결론이다 — 제품 마케팅 문구("필사가 뇌에 좋다")와 실제 인지심리학 근거를 분리해서 봐야 한다.

---

## Content-marking recommendation

**검증된 사실(이번 세션에서 직접 파일을 읽고 확인):**

1. 35개 레슨 `.mdx` 파일 전체(`src/content/lessons/step-1/**`, `step-2/**`, `step-3/**`)에서 `## 1. 학습 목표` → `## 2. 왜 배우나` → `## 3. 개념 설명` → `## 4. 실무 예제` → `## 5. 실무 팁` → `## 6. 핵심 정리 및 스스로 점검` 순서의 헤딩이 **35/35 전부 예외 없이 동일**함을 `grep`으로 전 파일에 대해 직접 확인했다. `## 3. 개념 설명` 섹션 경계는 프로그램적으로 100% 신뢰 가능하다.
2. `velite.config.ts:22-24`에서 이미 `rehypePlugins: [[rehypePrettyCode, ...]]`를 쓰고 있고, Velite의 mdx 옵션 타입 정의(`node_modules/velite/dist/index.d.ts:6744`)에 `remarkPlugins?: PluggableList`가 존재함을 직접 확인했다 — **remark 플러그인 추가는 기존 파이프라인 패턴을 그대로 따르는 것**이며 새로운 개념이 아니다.
3. remark 플러그인 작성에 필요한 `unist-util-visit`(v5.1.0)과 `mdast-util-to-string`(v4.0.0)이 이미 `node_modules/`에 **전이 의존성으로 설치되어 있음**을 확인했다 — `package.json`에 devDependency로 명시적으로 추가하는 것을 권장하지만(호이스팅에만 의존하면 lockfile 변경 시 깨질 수 있음), **신규 `npm install` 비용은 0**이다.
4. `src/components/mdx-content.tsx:32-35`에서 이미 `pre → CodeBlock`, `table → TableWrapper` 컴포넌트 오버라이드 패턴이 존재한다. 같은 패턴으로 `defaultComponents`에 새 키(예: `TranscriptionBlank`)를 하나 더 추가하면 된다 — 이 파일의 기존 관례를 그대로 확장하는 것.
5. `## 3. 개념 설명` 구간 안에서 저자들이 이미 쓰고 있는 용어 강조 관례 3종(괄호 글로스 `용어(term, 설명)`, `**굵게**`, `` `인라인 코드` ``)의 커버리지를 전 35개 레슨에 대해 직접 스크립트로 집계했다:
   - 3가지 패턴 중 **최소 1개라도 있는 레슨: 32/35 (91%)**
   - 어느 패턴도 없는 레슨(3개): `2-4-project-ai-shop-frontend.mdx`, `2-7-promptops.mdx`, `2-7-prompt-patterns.mdx` — 이 3개 레슨의 개념 설명 문단은 서사적 설명 위주라 강조 용어가 없다.

**권장 구현 방식:**

빌드타임 remark 플러그인이 각 레슨의 mdast 트리에서 `## 3. 개념 설명` 헤딩부터 다음 depth-2 헤딩(`## 4. ...`) 직전까지를 순회하며, 각 `paragraph` 노드 안에서 위 3가지 패턴 중 하나를 정규식/노드 타입으로 찾아 **해당 용어 하나만** 빈칸 후보로 표시하는 커스텀 JSX 요소(예: `<TranscriptionBlank answer="...">...</TranscriptionBlank>`)로 문단을 감싼다. 패턴이 없는 문단(3개 레슨 포함)은 그대로 평문 `<p>`로 둔다 — **레슨 파일을 단 한 글자도 수정하지 않고 35개 전체에 적용 가능**하며, 실패 시에도 빌드가 깨지지 않고 조용히 클로즈 없는 일반 문단으로 폴백한다.

이 방식은 애초에 "레슨 저자가 이미 하고 있던 일(용어 강조)"을 재활용하는 것이므로, 마감이 요구하는 "레슨당 추가 저작 시간 0"을 그대로 만족한다.

---

## Progress + accessibility

- **완료 모델과의 관계:** 필사는 기존 "완료" 버튼(Supabase `progress` 테이블, `src/lib/progress-store.ts`)과 **분리된 별도의, 선택적 신호**로 둔다. 완료 버튼의 의미("이 레슨을 다 읽었다")를 필사 여부에 종속시키지 않는다 — 스키마 변경, 새 테이블, 새 RLS 정책이 전혀 필요 없다.
- **저장 위치:** `localStorage`에 `필사:{slug}:{paragraphId}` 형태 키로 boolean/timestamp를 저장한다. **트레이드오프를 명시적으로 남긴다:** 이 사이트는 1인 사용이고 주 기기가 아이패드라 대부분 문제 없지만, `1-1-course-orientation.mdx` 레슨 본문 자체가 "읽기는 아이패드, 실습은 PC로 나눠 쓰면 편합니다"라고 안내하고 있다 — 즉 사용자가 실제로 기기를 오가는 습관이 있다는 근거가 레슨 콘텐츠 안에 이미 있다. `localStorage`는 브라우저/기기별로 격리되므로, 아이패드에서 채운 필사 기록은 PC 사파리/크롬에서는 보이지 않는다. 완료 버튼(Supabase, 기기 무관 동기화)과 달리 필사 기록은 기기 간 동기화되지 않는다는 점을 소유자에게 명시적으로 알려야 한다(Open questions 참고).
- **a11y:**
  - `aria-live="polite"`로 정답/오답 피드백을 알리되, **키 입력마다가 아니라 blur/제출 시 1회만** 갱신 — IME 안전 설계와 동일한 타이밍이라 별도 구현 분기가 필요 없다.
  - 클로즈 `<input>`은 표준 폼 컨트롤이므로 키보드만으로 완전히 접근 가능하다 — 이는 (later 단계의) 단어 칩 UI보다 day-1에 유리한 또 하나의 이유다. 칩 UI는 접근 가능한 키보드 내비게이션(로빙 tabindex, listbox 패턴)을 별도로 설계해야 하는데 이번 마감 안에 제대로 검증할 시간이 없다.
  - `prefers-reduced-motion`이 설정된 경우 정답/오답 표시는 애니메이션 없이 즉시 전환한다.
  - 오답이어도 "다음 문단으로 진행"을 막지 않는다(체크포인트로 학습을 막는 형태는 이 레슨의 기존 철학 — "이해가 안 되는 절은 표시만 하고 넘어가세요" — 와도 어긋난다).

---

## Open questions for the owner

1. **기기 간 동기화가 필요한가?** `localStorage` 기반(day-1, 기기별 격리)으로 시작할지, 아니면 처음부터 Supabase에 필사 기록용 컬럼/테이블을 만들지(더 안전하지만 마감을 넘길 가능성 높음) — 이번 조사는 마감 준수를 위해 전자를 권장했지만 최종 결정은 소유자 몫이다.
2. **오답 처리 강도:** 오답이어도 그냥 넘어가게 할지(권장, 위 참고), 아니면 재시도를 유도할지.
3. **빈칸 선택 규칙의 세밀도:** day-1 권장안은 "저자가 이미 강조한 용어 중 첫 번째"라는 단순 규칙이다. 문단마다 여러 강조 용어가 있을 때 어떤 걸 고를지(빈도/길이/순서 등)는 추후 다듬을 여지가 있다 — day-1에는 손대지 않는다.
4. **강조 용어가 없는 3개 레슨을 손볼지:** `2-4-project-ai-shop-frontend`, `2-7-promptops`, `2-7-prompt-patterns`는 필사 없이 평문으로만 노출된다. 이후에 이 3개 레슨의 개념 설명 문단에 강조 표시를 몇 개 추가해 커버리지를 100%로 올릴지는 저작 시간 대비 가치 판단이 필요하다.
5. **later 단계에서 문장 필사/단어 칩 중 어느 쪽을 다음으로 만들지:** 위 Options ranked 표를 참고해 학습 효과(문장 필사가 "필사"라는 이름값에 더 가까움) 대 iPad 안전성(단어 칩이 IME 리스크 0)을 놓고 소유자가 우선순위를 정해야 한다.

---

## Sources

### Primary (직접 확인, HIGH confidence)
- `C:/Users/dhchu/dev/aiEngineerCourse/src/content/lessons/**/*.mdx` (전체 35개 파일) — 헤딩 구조 및 강조 패턴 커버리지 직접 grep/awk 집계
- `C:/Users/dhchu/dev/aiEngineerCourse/velite.config.ts` — remark/rehype 파이프라인 구조
- `C:/Users/dhchu/dev/aiEngineerCourse/node_modules/velite/dist/index.d.ts:6744` — `remarkPlugins` 옵션 존재 확인
- `C:/Users/dhchu/dev/aiEngineerCourse/node_modules/unist-util-visit`, `node_modules/mdast-util-to-string` — 전이 의존성 설치 여부 직접 확인
- `C:/Users/dhchu/dev/aiEngineerCourse/src/components/mdx-content.tsx` — 컴포넌트 오버라이드 관례
- `C:/Users/dhchu/dev/aiEngineerCourse/src/lib/progress-store.ts` — 기존 완료 모델

### Secondary (웹 검색, 공신력 있는 출처와 교차 확인, MEDIUM confidence)
- [Duolingo 공식 블로그 — 쓰기 스킬 접근법](https://blog.duolingo.com/covering-all-the-bases-duolingos-approach-to-writing-skills/) — 단어 뱅크 기본값, 키보드 입력은 선택 모드
- [Roediger & Karpicke testing effect 관련 리뷰](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3983480/) — retrieval practice의 장기 기억 효과
- [Handwriting vs. Typing 리뷰(UCR)](https://psyfi.ucr.edu/wp-content/uploads/2024/12/Handwriting-vs.-Typing.pdf), [The Learning Scientists 블로그](https://www.learningscientists.org/blog/2024/7/18-1) — 손글씨/타이핑 노트 필기 문헌, 혼재된 결과 포함
- [Clozemaster — 클로즈 삭제 대 플래시카드](https://www.clozemaster.com/blog/cloze-deletion-vs-flashcards/)
- [한글타자왕 블로그 — 모바일 타자연습 현실적 방법](https://www.hangul-tajawang.com/blog/mobile-typing-practice)
- [한컴타자 필사 안내](https://www.hancomtaja.com/en/pilsa)
- [필사(Fillsa) 앱 — Google Play](https://play.google.com/store/apps/details?id=com.arakene.fillsa&hl=ko)
- [WICG handwriting-recognition explainer](https://github.com/WICG/handwriting-recognition/blob/main/explainer.md) — 웹 손글씨 인식 API 부재 확인
- [Safari 13, Mobile Keyboards, and the VisualViewport API](https://tkte.ch/articles/2019/09/23/safari-13-mobile-keyboards-and-the-visualviewport-api.html)
- [UXPin — ARIA Live Regions for Dynamic Content](https://www.uxpin.com/studio/blog/aria-live-regions-for-dynamic-content/) / [Harvard 접근성 서비스 — 라이브 리전 폼 피드백](https://accessibility.huit.harvard.edu/technique-form-feedback-live-regions)
- [MDN — String.prototype.normalize()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)
- Korean React composition 이벤트 처리 관련 다수 개발 블로그(velog, junhyunny.github.io) — `compositionend` 기반 비교 관례 확인

### Tertiary (단일 미확인 웹 결과, LOW confidence)
- Monkeytype/Keybr의 정확한 내부 diff 구현 세부사항 — 공식 기술 문서를 찾지 못해 일반 리뷰/비교 사이트 서술에 의존
- macOS NFD 관련 서술 중 "사파리 텍스트 입력은 보통 NFC로 들어온다"는 부분 — 1차 소스(WebKit 자체 문서)로 검증하지 못함, 방어적으로 항상 `.normalize('NFC')`를 적용하라는 권고의 근거로만 사용

---

## Metadata

**신뢰도 요약:**
- 콘텐츠 마킹 실현 가능성: HIGH — 이번 세션에서 전 35개 레슨 파일과 관련 설정 파일을 직접 읽고 검증
- 아이패드 IME/뷰포트 리스크 평가: MEDIUM — 다수의 교차 검증된 2차 자료, 실기기 테스트는 아직 하지 않음(day-1 설계가 이 리스크를 우회하도록 만들어졌기 때문에 실기기 IME 테스트 없이도 안전)
- 학습 효과 근거(Evidence): MEDIUM — 리뷰/메타 자료 다수 확인, 원논문 직접 열람은 하지 않음; "완전 필사 자체"를 직접 검증한 연구는 못 찾음(정직하게 공백으로 남김)

**조사일:** 2026-08-26
**유효기간 추정:** 이 문서의 실현 가능성 관련 사실(레슨 구조, 의존성 존재 여부)은 레슨 콘텐츠나 `package.json`이 바뀌기 전까지 유효. 외부 제품 비교(Duolingo 등)는 약 3~6개월 내 재확인 권장.
