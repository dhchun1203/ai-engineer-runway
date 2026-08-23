# AI Engineer Runway

AI Engineer 교육과정 개강(2026-09-30) 전 사전학습을 위한 웹 사이트입니다. 커리큘럼 전체를 쉬운 개념 설명과 실무 적용 예제로 콘텐츠화하고, 레슨별 완료 체크와 섹션별 진행률, 개강 전 학습 일정표를 제공하는 것을 목표로 합니다.

## 배포 주소

https://ai-engineer-runway.vercel.app

저장소 기본 브랜치인 `master`에 푸시할 때마다 위 프로덕션 URL이 자동으로 갱신됩니다 (Vercel Production Branch = `master`).

## 기술 스택

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
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

빌드는 다음 명령으로 확인합니다.

```bash
npm run build
```

## 프로젝트 구조

```
src/
  app/                 App Router 라우트
    lesson/[lessonId]/ 레슨 상세 페이지
  components/          공용 React 컴포넌트 (MDX 렌더러 등)
  content/lessons/      레슨 MDX 콘텐츠 (Velite가 빌드 타임에 파싱)
  lib/                 폰트 등 유틸리티
velite.config.ts        Velite 콘텐츠 스키마 정의
```

## 참고

이 저장소는 개인 학습용 사이트의 소스코드이며, GSD(Get Sh*t Done) 워크플로로 계획·실행됩니다. `.planning/` 디렉터리에 각 단계의 계획·요구사항·의사결정 기록이 함께 보관됩니다.
