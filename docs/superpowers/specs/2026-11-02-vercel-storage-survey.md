# 배포 크기 조사 (2026-11-02)

Vercel 팀 저장 한도 조치 때 배포 하나의 크기를 살펴본 기록이다. 아직 아무것도 줄이지 않았다.
줄일 때는 한 번에 하나만 바꾸고, 프리뷰 배포에서 크기와 주요 화면, 함수 동작을 확인한다.

숫자의 출처는 두 가지다. 함수 개수와 크기는 Vercel Resources 화면(배포 34bef29)이고, 파일 단위 내역은 2026-10-28의 로컬 빌드(`.next`)라 지금과 조금 다를 수 있다.

## 함수

- 함수 278개이고, 화면에서 본 항목은 페이지 함수 23.5MB, API 함수 20.2MB, 미들웨어 584kB였다. 목록 전체를 읽지는 못했다.
- 정적으로 만든 레슨 페이지도 각자 함수로 잡혀 있어 개수가 많다(`/articles/...`, `/basecamp/...`).
- `/about`의 추적 파일(압축 전 12.6MB) 중 7MB가 `.next/server/chunks`이고, 그중 레슨 데이터가 5.9MB다.
  - `curriculum-helpers` 2.82MB, `basecamp-lesson-helpers` 2.32MB, `velite roadmapLessons` 0.79MB
  - 레슨을 보여 주지 않는 페이지에도 들어가 있다. 어디서 끌려오는지는 아직 찾지 않았다.
- `@vercel/og`가 2.84MB(`resvg.wasm` 1.31, `index.node.js` 0.83, `index.edge.js` 0.70)로 같이 들어간다. 쓰는 곳은 `icon.ts`, `apple-icon.ts`로 보인다.

## 미리 만든 페이지

`.next/server/app`이 85MB이고, 정적 자산(`.next/static`)은 3MB로 작다.

| 경로 | 크기 |
|---|---|
| `/print` | 30MB |
| `/basecamp` | 15MB |
| `/lesson` | 13MB |
| `/step` | 11MB |
| `/concepts` | 8.3MB |

- `/print/all`은 레슨 전체를 한 페이지에 다시 담아 HTML 3.8MB, RSC 1.9MB이고, 같은 내용의 조각 파일이 또 있다.
- `/step/2`의 HTML이 1.16MB다. 목록 페이지치고 커서 레슨 본문이 함께 들어가는지 볼 만하다.

## 줄일 후보 (효과 큰 순서로 추정)

1. `/print/*`를 빌드 때 만들지 않고 요청 때 만들기. 약 30MB, 인쇄 페이지 첫 열기가 느려지는 대신 자주 쓰지 않는 화면이다.
2. `/step/*`가 레슨 본문을 싣는지 확인하고 덜어 내기. 약 11MB 이내.
3. 레슨 데이터가 레슨과 무관한 함수에 들어가는 경로 끊기. Functions Storage에 효과가 있다.
4. `outputFileTracingExcludes`로 아이콘 외 함수에서 `@vercel/og` 빼기. Functions Storage에 효과가 있다.

`/print`와 `/step`은 오프라인 모드가 내려받는 목록과 겹치는지(`src/app/offline-manifest.json/route.ts`) 먼저 확인한다.
