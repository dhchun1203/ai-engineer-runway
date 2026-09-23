import type { NextConfig } from "next";

const isDev = process.argv.indexOf("dev") !== -1;
const isBuild = process.argv.indexOf("build") !== -1;
if (!process.env.VELITE_STARTED && (isDev || isBuild)) {
  process.env.VELITE_STARTED = "1";
  import("velite").then((m) => m.build({ watch: isDev, clean: !isDev }));
}

const nextConfig: NextConfig = {
  // 오프라인 모드의 빌드 id(docs/superpowers/specs/2026-09-23-offline-mode-design.md 3.1).
  // env 설정값은 빌드 때 번들에 그대로 박힌다. 서비스 워커 등록 주소(/sw.js?v=...)와
  // 캐시 이름(offline-<id>)이 이 값을 쓴다. Vercel은 커밋 sha, 로컬 빌드는 빌드 시각.
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || `local-${Date.now()}`,
  },
  // 서비스 워커 파일은 절대 캐시하지 않는다(Next PWA 가이드 권장). 캐시되면 새 배포의
  // 서비스 워커가 늦게 설치되어 옛 캐시 규칙이 계속 돈다.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  // 소스맵 생성을 끈다(배포 저장소 절감). 소스맵(.js.map)은 각 배포의 서버 산출물에서
  // 큰 비중(측정 시 약 52MB/배포)을 차지했는데, 디버깅 보조일 뿐 런타임 동작과는 무관하다.
  // Vercel은 배포마다 산출물을 통째로 보관하므로, 배포 1건을 줄이면 앞으로 누적이 훨씬 느려진다.
  // 이 프로젝트는 Turbopack으로 빌드하므로 turbopackSourceMaps까지 함께 끈다.
  productionBrowserSourceMaps: false,
  experimental: {
    serverSourceMaps: false,
    turbopackSourceMaps: false,
  },
};

export default nextConfig;
