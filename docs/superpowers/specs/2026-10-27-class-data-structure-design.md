# 수업 복습 데이터 구조와 활용 설계

2026-10-27. 개강(2026-10-26) 후 수업이 거의 매일 한 회차씩 쌓인다(과정 1,056시간, 100회차 이상 예상).
2회차까지 쌓인 지금 저장 형태를 바꾸고, 쌓인 데이터를 꺼내 쓰는 기능을 함께 만든다.
사용자 승인 범위: 1순위부터 3순위까지 전부.

## 1. 지금 구조와 문제

- 본문: `src/content/class-lessons/NN-slug.mdx` (velite `classLessons`)
- 체크리스트와 퀴즈: `src/content/class-sessions.ts` 한 파일에 전 회차
- 오답 기록 키: `cl:<slug>:<문항 순서>`. 순서에 묶여 있어 문항을 중간에 넣거나 지우면 기록이 엉킨다.
- `/class`는 최근 1개 + 지난 카드 나열. 100개가 넘으면 찾기 어렵다.
- 명령어와 용어가 회차 안에 갇혀 있고, 간격 복습(`/review`)에 수업이 들어가지 않는다.

## 2. 저장 형태

### 2.1 회차 폴더

```
src/content/class-lessons/
  02-git-setup-remote/
    index.mdx     # 본문 + 메타(frontmatter)
    review.yml    # 복습 데이터: 체크리스트, 퀴즈, 명령어, 용어
```

`index.mdx` frontmatter:

| 필드 | 뜻 |
| --- | --- |
| title, session, date, summary, slug | 기존 그대로 |
| module | 커리큘럼 모듈 id(`1-2` 등). velite가 `modules.ts`에 있는 id인지 검사 |
| topic | 짧은 주제 이름(`Git`, `Python`). 목록 칩, 명령어 묶음 이름 |

`review.yml` (velite 컬렉션 `classReviews`, 같은 slug로 짝):

```yaml
slug: 02-git-setup-remote
checklist:
  - id: class-02-config        # 전 회차에서 유일. bc: 진도 키 그대로
    label: ...
quiz:
  - id: checkout-detached      # 회차 안에서 유일한 이름표. 오답 키 cl:<slug>:<id>
    q: ...
    code: ...                  # 선택
    options: [..4개..]
    answer: 1
    explain: ...
commands:
  - cmd: git checkout <해시>
    desc: HEAD를 그 커밋으로 옮긴다(detached HEAD)
    group: Git                 # 선택, 없으면 회차 topic
terms:
  - word: detached HEAD
    definition: ...
```

빌드 검사(velite `prepare`): 레슨과 review.yml이 1:1로 짝인지, 퀴즈 id 중복, 정답 번호 범위,
체크리스트 id 전역 중복과 `class-` 접두사, module id 유효성. 어기면 빌드 실패.

### 2.2 오답 키 이전

- 키를 `cl:<slug>:<문항 id>`로 바꾼다. 문항 id는 `[a-z0-9-]` 1~48자, 숫자로만 된 id는 금지(옛 순서 키와 헷갈림 방지).
- 1, 2회차의 기존 `quiz_attempt`, `quiz_mistake` 행은 순서 → id 표로 한 번에 옮기는 데이터 마이그레이션.
- 옮기지 못한 옛 키는 풀리지 않아 오답 노트에서 조용히 빠진다(기존 resolve 규칙).

### 2.3 바뀌지 않는 것

- 체크 진도: `progress` 테이블 `bc:class-NN-*` 행 그대로.
- 레슨 주소 `/class/<slug>` 그대로(북마크, 오프라인 목록 유지).

## 3. 활용 기능

### 3.1 간격 복습에 수업 넣기 (1순위)

- 기준일은 수업 날짜. 수업 다음 날, 그 3일 뒤, 그 7일 뒤(기존 사다리 `[1,3,7]`, 3번이면 졸업).
- 상태는 기존 `lesson_review` 표에 `lesson_id = 'class:<slug>'`로 저장(정규 레슨 slug와 겹치지 않음).
  기존 화면은 `getLessonBySlug`로 걸러서 이 행을 무시한다.
- `/review` 위쪽에 "수업 다시 꺼내 보기" 묶음: 만기 회차마다 퀴즈 5문항(지난번 틀림 → 안 푼 것 → 나머지,
  날짜 시드로 고정) + "복습 완료" 버튼(새 Server Action, 로그인 → slug 검증 → 저장 순서).
- 홈 "오늘의 복습" 안내에도 만기 회차 수를 더한다.

### 3.2 모듈별 수업 목록 (1순위)

- `/class` 최근 수업 카드와 오늘 체크리스트는 그대로, 아래 "지난 수업"을 모듈별 접힘 묶음으로.
  묶음 머리: Step, 모듈 이름, 회차 수, 체크 진행률. 최근 수업이 속한 모듈만 펼쳐 둔다.
- 레슨 페이지 아래: 이전, 다음 회차 링크 + 같은 모듈의 사전학습 레슨 링크(모듈이 같을 때만).

### 3.3 매일 추가 절차 고정 (1순위)

- 프로젝트 스킬 `.claude/skills/class-lesson/SKILL.md`: TIL 링크(또는 노션)를 받아 회차 폴더를 만들고,
  본문 eli5 작성, review.yml 작성, 명령 출력 실행 확인, 기관명 검사, 빌드, 화면 확인, 커밋, 푸시까지.

### 3.4 명령어 모음 (2순위)

- `/class/commands`: 전 회차 `commands`를 group별로 묶어 보여 주고 검색창으로 거른다.
  항목마다 "N회차" 링크. 같은 cmd가 여러 회차에 나오면 처음 배운 회차와 다시 나온 회차를 함께.

### 3.5 종합 퀴즈와 시험 모드 (2, 3순위)

- `/class/quiz?scope=week|module:<id>|all|wrong&mode=practice|exam`
  - week: 이번 주(월요일 시작, 서울) 회차. 지난주는 `week=prev`.
  - wrong: 로그인 사용자의 `cl:` 키 중 마지막 결과가 틀림인 문항.
  - 문항 수 최대 20, 틀림 → 안 푼 것 → 나머지 순, 날짜 시드 셔플.
- practice: 기존 퀴즈 묶음(고르는 즉시 채점).
- exam: 다 고른 뒤 "채점하기"를 누르면 점수와 해설을 한 번에. 채점 때 문항마다 기존 기록 액션을 부른다.

### 3.6 용어 사전 합치기 (2순위)

- `/glossary`의 용어 묶음에 수업 `terms`를 더한다. 출처 칩은 "N회차 제목".

### 3.7 수업 달력 (3순위)

- `/class` 머리 아래 달력: 수업이 있던 날 칸에 체크 진행률 농도, 간격 복습을 마친 칸 표시.
  최근 2개월(이번 달, 지난달)만.

### 3.8 회차 검색 (3순위)

- `/class` 목록 위 검색창: 제목, 요약, 주제, 소제목, 명령어, 용어로 거른다(본문 전체는 넣지 않음).
  소제목은 velite가 본문에서 뽑아 둔다.

## 4. 범위 밖

- 레슨을 DB로 옮기기, 관리 화면, AI 생성 퀴즈 자동화.

## 5. 검증

- velite 검사로 데이터 오류를 빌드에서 잡는다.
- `next build` 통과, 내장 브라우저(아이패드 크기)로 `/class`, `/class/<slug>`, `/class/commands`,
  `/class/quiz`, `/review`, `/glossary` 확인. 로그인이 필요한 화면은 배포 후 사용자 크롬으로 확인.
- 마이그레이션 전후 `cl:` 키 행 수 비교.
