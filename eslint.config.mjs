import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 고아 에이전트 워크트리(.claude/worktrees/agent-*)가 소스 사본을 들고 있어
    // 같은 위반이 중복 집계된다 — 실제 소스 트리만 검사한다.
    ".claude/**",
  ]),
]);

export default eslintConfig;
