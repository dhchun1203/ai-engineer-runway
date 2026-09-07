import type { ComponentType } from "react";
import { AgentHarnessLoop } from "@/components/concepts/agent-harness-loop";
import { TokenViz } from "@/components/concepts/token-viz";
import { EmbeddingMapViz } from "@/components/concepts/embedding-viz";
import { AttentionViz } from "@/components/concepts/attention-viz";
import { TemperatureViz } from "@/components/concepts/next-token-viz";
import { WeightsViz } from "@/components/concepts/weights-viz";
import { TrainingStagesViz } from "@/components/concepts/training-stages-viz";
import { ContextWindowViz } from "@/components/concepts/context-window-viz";
import { RagFlowViz } from "@/components/concepts/rag-viz";
import { HallucinationViz } from "@/components/concepts/hallucination-viz";

// 번외 "AI 뜯어보기" 개념 리더에만 주입하는 인터랙티브 시각화 컴포넌트 맵.
// 개념 리더 페이지가 <MDXContent code={...} components={conceptComponents} />로 넘긴다.
// mdx-content.tsx의 defaultComponents(pre·table·TwistBox·NextTeaser 등)는 그대로 병합되므로
// 여기에는 번외 전용 시각화만 추가한다 — 무거운 시각화가 레슨 페이지 번들에 새지 않게
// defaultComponents를 건드리지 않는 것이 요점이다(설계 문서 "시각화" 절).
// 각 개념 MDX가 <ComponentName />으로 부르는 이름과 여기 키가 정확히 일치해야 한다.
export const conceptComponents: Record<string, ComponentType> = {
  AgentHarnessLoop: AgentHarnessLoop as ComponentType,
  TokenViz: TokenViz as ComponentType,
  EmbeddingMapViz: EmbeddingMapViz as ComponentType,
  AttentionViz: AttentionViz as ComponentType,
  TemperatureViz: TemperatureViz as ComponentType,
  WeightsViz: WeightsViz as ComponentType,
  TrainingStagesViz: TrainingStagesViz as ComponentType,
  ContextWindowViz: ContextWindowViz as ComponentType,
  RagFlowViz: RagFlowViz as ComponentType,
  HallucinationViz: HallucinationViz as ComponentType,
};
