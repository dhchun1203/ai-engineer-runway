# AI Engineer Hub

AI Engineer 교육과정 개강(2026-09-30) 전 사전학습을 위한 웹 사이트입니다. 커리큘럼 전체를 쉬운 개념 설명과 실무 적용 예제로 콘텐츠화하고, 레슨별 완료 체크와 섹션별 진행률, 메모·학습 기록을 한곳에서 제공하는 것을 목표로 합니다.

## 배포 주소

https://ai-engineer-hub-kr.vercel.app

저장소 기본 브랜치인 `master`에 푸시할 때마다 위 프로덕션 URL이 자동으로 갱신됩니다 (Vercel Production Branch = `master`).

## 주요 기능

- **커리큘럼 레슨** — Step 1~3 전 과정을 쉬운 설명 + 실무 예제로. 브라우저 안 코드 실행(Python/SQL), 요약 영상, 복습 자가진단 포함
- **베이스캠프 선행 과제** — 개강 전 공식 선행 과제를 따로 정리한 트랙
- **진도·복습** — 레슨 완료 체크, Step/모듈별 진행률, "더 공부할 레슨" 표시, 간격 복습
- **메모·학습 기록** — 레슨별 메모와 노트 단권화, 자체 TIL(오늘 배운 것) 에디터
- **독서 도우미** — 본문을 문장 단위로 확대하며 읽어 주는 리더 (데스크톱 우측 세로 / 터치 하단 가로 툴바)
- **번외 콘텐츠** — "AI 뜯어보기" 개념편, 채널톡 로드맵(별도 심화), "책으로 읽기" 모드, PDF 내보내기, 용어집
- **로그인** — 승인제 회원가입, 로그인 시 기기 간 진도·기록 동기화

## 기술 스택

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Supabase** (Postgres + Auth, `@supabase/ssr`) — 진도·메모·학습 기록 저장, 로그인, Row Level Security
- **Tailwind CSS v4** — 스타일링
- **Velite** — MDX 콘텐츠 파이프라인 (Zod 스키마 기반 frontmatter 검증)
- **rehype-pretty-code** + **Shiki** — 코드 블록 신택스 하이라이팅, 항상 보이는 복사 버튼
- **Pretendard** (자체 호스팅 가변 폰트) — 한국어 타이포그래피
- **Vercel** — 배포

## 로컬 실행 방법

```bash
npm install
npm run dev
```

개발 서버가 뜨면 `http://localhost:3000`에서 확인할 수 있습니다.

Supabase 연동(진도·메모·로그인)에는 환경 변수가 필요합니다. `.env.example`을 `.env.local`로 복사한 뒤 값을 채워 주세요. 콘텐츠 열람만 확인할 때는 없어도 페이지가 렌더됩니다.

빌드는 다음 명령으로 확인합니다.

```bash
npm run build
```

## 프로젝트 구조

```
src/
  app/                  App Router 라우트
    lesson/             정규 커리큘럼 레슨
    basecamp/           베이스캠프 선행 과제
    concepts/           번외 "AI 뜯어보기" 개념편
    roadmap/            채널톡 로드맵 (별도 심화)
    book/               "책으로 읽기" 모드
    til/                학습 기록(TIL)
    curriculum, step, review, glossary, notes, bookmarks, inbox … 학습 도구
    api/                진도·메모·인증 Route Handler
  components/           공용 React 컴포넌트 (MDX 렌더러, 독서 도우미 등)
    reading-assistant/  문장 포커스 독서 도우미
  content/              MDX 콘텐츠 + 데이터 (Velite가 빌드 타임에 파싱)
    lessons/ basecamp-lessons/ concepts/ roadmap-lessons/
  lib/                  Supabase 클라이언트·진도/메모 저장소·유틸리티
supabase/migrations/    데이터베이스 스키마 마이그레이션
velite.config.ts        Velite 콘텐츠 스키마 정의
```

## 참고

개인 학습용 사이트의 소스코드입니다. 계획·요구사항·의사결정 기록은 `.planning-archive/` 디렉터리에 보관되어 있습니다.
