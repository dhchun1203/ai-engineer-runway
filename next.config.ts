import type { NextConfig } from "next";

const isDev = process.argv.indexOf("dev") !== -1;
const isBuild = process.argv.indexOf("build") !== -1;
if (!process.env.VELITE_STARTED && (isDev || isBuild)) {
  process.env.VELITE_STARTED = "1";
  import("velite").then((m) => m.build({ watch: isDev, clean: !isDev }));
}

const nextConfig: NextConfig = {
  // 소스맵 생성을 끈다 — 배포 저장소 절감. 소스맵(.js.map)은 각 배포의 서버 산출물에서
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
