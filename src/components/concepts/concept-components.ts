import type { ComponentType } from "react";
import { AgentHarnessLoop } from "@/components/concepts/agent-harness-loop";

// 번외 "AI 뜯어보기" 개념 리더에만 주입하는 인터랙티브 시각화 컴포넌트 맵.
// 개념 리더 페이지가 <MDXContent code={...} components={conceptComponents} />로 넘긴다.
// mdx-content.tsx의 defaultComponents(pre·table·TwistBox·NextTeaser 등)는 그대로 병합되므로
// 여기에는 번외 전용 시각화만 추가한다 — 무거운 시각화가 레슨 페이지 번들에 새지 않게
// defaultComponents를 건드리지 않는 것이 요점이다(설계 문서 "시각화" 절).
export const conceptComponents: Record<string, ComponentType> = {
  AgentHarnessLoop: AgentHarnessLoop as ComponentType,
};
