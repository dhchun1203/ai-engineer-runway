# TIL GitHub 연동 설계 (2026-10-26)

## 목표

사용자가 사이트에서 TIL을 발행하면, 그 사용자가 연결해 둔 **자기 GitHub 저장소**에 같은 글이
마크다운 파일로 커밋된다. 사용자마다 자기 저장소를 고른다. 소유자(dhchun1203/TIL)도 같은
방식으로 연결하는 첫 번째 사용자다.

## 하지 않는 것

- 저장소 README 목차 자동 갱신(나중에 필요하면 별도 작업)
- GitHub에서 고친 내용을 사이트로 되가져오기(한 방향만: 사이트 → GitHub)
- 초고 업로드
- GitHub 쪽 앱 제거를 웹훅으로 실시간 감지(업로드 실패 때 알아챈다)

## 연결 방식: GitHub App

사용자 토큰을 받거나 보관하지 않는다. GitHub App 하나를 등록하고, 사용자는 그 앱을 자기
저장소 하나에 설치한다. 사이트는 "이 사용자 = 이 설치(installation) + 이 저장소"만 저장하고,
올릴 때마다 1시간짜리 설치 토큰을 새로 받는다.

### 앱 설정 (소유자가 GitHub에서 한 번 등록)

- 이름: `AI Engineer TIL Sync` (교육기관명 금지 규칙 준수)
- 권한: Repository > Contents: Read and write, Metadata: Read-only. 그 외 없음
- "Request user authorization (OAuth) during installation": 켬. 설치 직후 사용자 인증 코드가
  같이 오므로, 그 설치가 정말 이 사용자 것인지 확인할 수 있다(아래 보안 참고)
- Callback URL: `https://ai-engineer-hub-kr.vercel.app/api/github/callback`
  (로컬 개발용으로 `http://localhost:3000/api/github/callback`도 추가)
- Webhook: 끔
- 설치 가능 대상: Any account (다른 사용자도 설치할 수 있어야 함)

### 환경 변수 (Vercel, 소유자가 직접 입력)

| 이름 | 내용 |
|---|---|
| `GITHUB_APP_ID` | 앱 ID |
| `GITHUB_APP_SLUG` | 앱 주소 이름(설치 링크용) |
| `GITHUB_APP_CLIENT_ID` | OAuth 클라이언트 ID |
| `GITHUB_APP_CLIENT_SECRET` | OAuth 클라이언트 시크릿 |
| `GITHUB_APP_PRIVATE_KEY` | 앱 개인 키(PEM) |

다섯 개 중 하나라도 없으면 기능 전체가 꺼진 상태로 동작한다. 프로필에 연결 버튼이 안 보이고,
발행은 지금과 똑같이 사이트에만 저장된다.

## 연결 흐름

1. `/login`(로그인 상태의 프로필 화면)에 "GitHub 저장소 연결" 카드가 생긴다.
2. 버튼을 누르면 `/api/github/connect`가 무작위 `state`를 만들어 짧게 사는 httpOnly 쿠키에
   넣고, `https://github.com/apps/<slug>/installations/new?state=...`로 보낸다.
3. 사용자는 GitHub에서 "Only select repositories"로 저장소를 고르고 설치한다.
4. GitHub이 `/api/github/callback?code=...&installation_id=...&state=...`로 돌려보낸다.
5. 콜백은:
   - `state`가 쿠키 값과 같은지 확인(다르면 거절)
   - `code`를 사용자 토큰으로 교환하고, `GET /user/installations`에 `installation_id`가 있는지
     확인(없으면 거절). 사용자 토큰은 이 확인에만 쓰고 저장하지 않는다
   - 설치 토큰으로 `GET /installation/repositories`를 불러 저장소 목록을 얻는다
   - 저장소가 1개면 바로 저장, 여러 개면 프로필에서 하나를 고르게 한다
6. 연결 카드는 "연결됨: owner/repo", "연결 끊기", "지금까지 발행한 글 N편 올리기"를 보여 준다.

"연결 끊기"는 사이트의 연결 행만 지운다. GitHub에 설치된 앱은 사용자가 GitHub 설정에서
지우도록 링크를 함께 보여 준다.

## 데이터

새 테이블 `github_connection` (마이그레이션 `supabase/migrations/20261026120000_create_github_connection.sql`)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `user_id` | uuid, PK, auth.users 참조, on delete cascade | 사이트 사용자 |
| `installation_id` | bigint, not null | GitHub 설치 ID |
| `repo_full_name` | text, null | `owner/repo`. 여러 저장소 중 아직 안 골랐으면 null |
| `status` | text, not null, 기본 `'ok'` | `'ok'` 또는 `'broken'`(앱이 지워졌거나 권한이 사라짐) |
| `created_at`, `updated_at` | timestamptz | |

RLS는 기존 `own_rows` 정책과 같은 모양(`auth.uid() = user_id`)으로 켠다.

`til_post`에 컬럼 하나 추가: `github_path text null`. 그 글이 저장소에 올라간 파일 경로다.
수정해서 다시 발행할 때 이 경로를 그대로 쓰므로, 발행일이 바뀌어도 파일이 두 개로 늘지 않는다.

## 업로드 규칙

`savePostAction`과 `deletePostAction`이 DB 저장에 성공한 **뒤에** 동기화를 호출한다.

| 사이트에서 한 일 | GitHub에서 하는 일 |
|---|---|
| 처음 발행 | 새 파일 만들기, `github_path` 저장 |
| 발행한 글 수정 후 다시 발행 | 같은 경로 파일 덮어쓰기 |
| 발행한 글을 초고로 되돌림 | 파일 삭제, `github_path` 비움 |
| 삭제 | 파일 삭제 |
| 초고 저장 | 아무것도 안 함 |

- 경로: `YYYY/MM/YYYY-MM-DD-<slug>.md`, 날짜는 처음 올릴 때의 한국 시간 기준
- 커밋 메시지: 만들기·수정 `til: <제목>`, 삭제 `til: <제목> 삭제`
- 커밋 작성자는 앱 봇(`<slug>[bot]`)으로 남는다

### 파일 내용

```markdown
# <제목>

> <요약>            (요약이 있을 때만)

태그: #태그1 #태그2   (태그가 있을 때만)

<본문 마크다운 그대로>

## 셀프 체크

<셀프 체크 질문>
```

이해도와 막힌 점은 개인 기록이라 넣지 않는다. 이미지 주소는 본문에 있는 그대로 둔다
(Supabase 공개 버킷이라 GitHub에서도 보인다). 사이트 주소 링크는 넣지 않는다(로그인해야 열림).

## 실패 처리

- GitHub 쪽 실패는 사이트 저장을 절대 되돌리지 않는다. 액션 결과에 `githubWarning`을 붙여
  에디터가 "사이트에는 저장됐지만 GitHub에는 올리지 못했어요"를 보여 준다.
- 설치 토큰 발급이 401/404면 앱이 지워진 것으로 보고 `status='broken'`으로 바꾼다. 프로필 카드가
  "연결이 끊겼어요. 다시 연결해 주세요"를 보여 주고, 그동안은 업로드를 시도하지 않는다.
- 연결이 없거나 저장소를 아직 안 골랐으면 조용히 건너뛴다(경고 없음).
- 같은 경로에 파일이 이미 있으면(사용자가 GitHub에서 직접 만든 경우 등) 그 파일의 sha로 덮어쓴다.

## 코드 구성

| 파일 | 하는 일 |
|---|---|
| `src/lib/github/app-auth.ts` | 앱 JWT 서명(RS256, `node:crypto`), 설치 토큰 발급. 외부 라이브러리 없이 |
| `src/lib/github/contents.ts` | 파일 읽기(sha), 만들기·덮어쓰기, 삭제. `fetch` 기반, 호출 함수를 주입받아 테스트 가능 |
| `src/lib/til/github-markdown.ts` | 글 → 파일 경로, 파일 내용 만들기(순수 함수) |
| `src/lib/til/github-sync.ts` | 연결 조회 → 경로 결정 → 업로드/삭제 → `github_path` 갱신 |
| `src/app/api/github/connect/route.ts` | state 쿠키 + GitHub 설치 화면으로 보내기 |
| `src/app/api/github/callback/route.ts` | 설치 확인, 연결 저장, 프로필로 돌려보내기 |
| `src/app/login/github-connect-card.tsx` | 프로필의 연결 카드(연결, 저장소 고르기, 끊기, 기존 글 올리기) |
| `src/app/til/actions.ts` | 저장·삭제 뒤 동기화 호출, 경고 전달 |

모든 GitHub 호출은 서버에서만 한다(`server-only`). 개인 키와 토큰은 브라우저로 넘어가지 않는다.

## 보안

- 설치 ID는 주소창에 그대로 보이므로 위조할 수 있다. 그래서 콜백은 `state` 쿠키 확인과
  "그 설치가 이 사용자의 GitHub 계정 것인지" 확인을 둘 다 통과해야만 연결을 저장한다.
- 앱 권한은 Contents 쓰기 하나뿐이고, 사용자가 고른 저장소에만 적용된다.
- 사용자 토큰은 저장하지 않는다. 설치 토큰은 요청 중에만 메모리에 있고 1시간 뒤 만료된다.
- 다른 사용자의 글이 남의 저장소로 가는 경로가 없어야 한다: 동기화는 항상 "글의 user_id =
  현재 로그인 사용자 = 연결의 user_id"일 때만 돈다.

## 테스트

- 순수 함수(경로, 파일 내용, JWT 페이로드)와 동기화 결정표(위 업로드 규칙 표의 다섯 줄)는
  가짜 GitHub 응답을 주입해 단위 테스트한다(`node --test`, Node 24의 TS 실행).
- 실제 확인: 소유자가 앱을 등록하고 dhchun1203/TIL에 설치한 뒤, 테스트 글을 발행, 수정, 초고로
  되돌림, 삭제하면서 저장소의 파일과 커밋이 표대로 생기고 지워지는지 본다.
- 기존 게이트(`check-til`, `check-route-rendering`, lint, tsc, build)가 계속 통과해야 한다.
  새 API 라우트 두 개는 동적 라우트다.

## 소유자가 직접 해야 하는 것

1. GitHub에서 위 설정대로 앱 등록, 개인 키 내려받기
2. Vercel에 환경 변수 다섯 개 입력
3. 사이트 프로필에서 "GitHub 저장소 연결"로 dhchun1203/TIL 연결
4. "지금까지 발행한 글 올리기"로 기존 글 1편 올리기
