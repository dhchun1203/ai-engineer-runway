---
name: class-lesson
description: 그날 수업 정리(사용자 TIL 저장소의 md 링크 또는 노션 링크)를 이 사이트의 수업 복습(/class)에 새 회차로 올린다. 사용자가 "오늘 학습한 내용", "수업 정리 반영", TIL이나 노션 링크를 주며 "사이트에 넣어 줘" 등을 말할 때 쓴다.
---

# 수업 회차 추가

수업 하나를 회차 폴더 하나로 올린다. 설계: `docs/superpowers/specs/2026-10-27-class-data-structure-design.md`.

```
src/content/class-lessons/NN-<주제 영문 kebab>/
  index.mdx    # 본문 + frontmatter
  review.yml   # 체크리스트, 퀴즈, 명령어, 용어
```

폴더 이름이 곧 slug이고 주소는 `/class/NN-<주제>`다. NN은 회차 번호 두 자리(100회차부터 세 자리).

## 절대 규칙

- **원본 항목을 하나도 빠뜨리지 않는다.** 정리에 나온 개념, 명령, 주의점, 셀프 체크를 항목 단위로 본문과 대조한다. 수업 정리가 최우선 원본이다.
- **교육기관명 금지.** 원본 노트의 폴더, 저장소, 경로, 예시에 기관명이 있으면 `my-project`, `old-project`처럼 바꾼다. 항상 "AI Engineer 교육과정"으로 쓴다.
- 가운데점(·), 긴 하이픈(—), ─ 글리프, 이모지 금지. 한국어는 2~3문장마다 문단을 끊는다.
- **명령 출력은 직접 실행해 본 값만 쓴다.** 세션 scratchpad에 임시 저장소를 만들어 돌린다. git 설정은 `GIT_CONFIG_GLOBAL=<scratchpad>/gitconfig`로 임시 파일을 써서 사용자의 실제 설정을 건드리지 않는다.
- 이미 쓴 퀴즈 문항 id는 바꾸지 않는다(오답 기록 키 `cl:<slug>:<id>`).

## 절차

1. **원본 받기**
   - TIL 저장소 md: `https://github.com/dhchun1203/TIL/blob/main/...` 는 `raw.githubusercontent.com/dhchun1203/TIL/main/...`로 받는다.
   - 노션: notion-fetch로 읽는다.
   - 항목 목록을 작업 메모(scratchpad)로 먼저 뽑는다. 이 목록이 대조표다.
2. **회차와 모듈 정하기**
   - session: 지금 가장 큰 회차 + 1 (`ls src/content/class-lessons`).
   - module: `src/content/modules.ts`의 모듈 id 중 그날 수업이 실제로 속한 것(예: Git은 `1-2`, Python 기초는 `1-3`). 애매하면 그날 가장 큰 주제를 따른다.
   - topic: 짧은 주제 이름(`Git`, `Python`, `SQL`). 같은 주제는 앞 회차와 같은 글자로 쓴다(`grep -h "^topic:" src/content/class-lessons/*/index.mdx`).
   - preStudy: 개강 전에 읽은 정규 레슨 중 **내용이 실제로 같은 것만** slug로(`src/content/lessons/`를 grep해서 확인). 같은 모듈이라도 주제가 다르면 넣지 않는다(예: Git 수업에 생성형 AI 레슨). 없으면 `[]`.
3. **본문 `index.mdx`** (eli5 톤, 앞 회차 본문과 같은 구성)
   ```mdx
   ---
   title: "..."
   session: 3
   date: "YYYY-MM-DD"
   summary: "목록과 머리에 보일 두세 줄 요약"
   slug: "03-..."
   module: "1-2"
   topic: "Git"
   preStudy: ["1-2-git-branch-and-pr"]
   ---
   ```
   - 도입 두 문단 → 순서 표(순서, 내용, 한 줄로) → `## 1. ...`부터 번호 붙은 절 → `## 오늘 꼭 기억할 주의점`.
   - 쓸 수 있는 컴포넌트: `<TwistBox title="...">`, `<PredictPrompt />`(앞 회차 사용례 참고).
   - 어제 배운 것과 이어지는 곳은 "어제 배운 X가 여기서 쓰여요"처럼 한 줄로 잇는다.
4. **복습 데이터 `review.yml`** (앞 회차 파일을 본보기로)
   - `checklist`: 원본의 복습 체크리스트를 그대로. id는 `class-NN-<짧은 이름>`, 전 회차에서 유일.
   - `quiz`: 12~16문항. 문항마다 `id`(영문 소문자, 숫자, - 로 내용을 나타내게, 숫자만은 금지), `q`, 필요하면 `code`(블록은 `|-`), 보기 4개, `answer`(0부터), `explain`(정답 이유와 헷갈리는 보기 설명). 정답 위치는 화면에서 섞이니 신경 쓰지 않아도 된다.
   - `commands`: 그날 나온 명령어, 단축키, 편집기 키를 빠짐없이. `cmd`, `desc`(무엇을 하는지 한 줄), `group`(`Git`, `터미널`, `단축키`, `vim`처럼 명령어 모음의 묶음 이름. 앞 회차와 같은 글자로).
   - `terms`: 그날 새로 나온 핵심 용어 5~10개. `word`(한글 (English) 꼴 권장), `definition`(한두 문장).
5. **검사** (하나라도 실패하면 고친다)
   - `npx velite build`: 회차 짝, 퀴즈 id 규칙과 중복, 정답 범위, 체크 id, 모듈 id를 검사해 실패시킨다. 출력에 오류가 없어야 통과.
   - `npx next typegen && npx tsc --noEmit -p .`
   - `node scripts/check-class.mjs`
   - `node scripts/check-brand.mjs 2>&1 | grep -i "class-lessons"` 가 아무것도 출력하지 않아야 한다.
   - `node scripts/check-font-glyph-coverage.mjs 2>&1 | tail -4`: 새 한글 누락이 나오면 `node scripts/subset-font.mjs`.
   - 대조표의 항목이 본문에 모두 있는지 마지막으로 한 번 더 본다.
6. **화면 확인과 배포**
   - dev 서버가 켜져 있으면 끄고 `npx next build`, 끝나면 dev를 다시 켠다(켜 둔 채 빌드하면 .velite가 비워져 dev가 깨진다).
   - 내장 브라우저 아이패드 크기(1024x1366)로 `/class/<slug>`, `/class`, `/class/commands`를 연다. 가로 넘침이 없는지 본다.
   - 커밋 메시지 `feat(class): N회차 <주제> 레슨`, push, Vercel 배포가 READY인지 확인한다.
   - 사용자에게 무엇을 담았는지(절 목록, 퀴즈 수, 명령어 수)와 주소를 알린다. 아이패드에서 새로고침해 보라고 한다.
