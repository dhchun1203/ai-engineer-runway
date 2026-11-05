import type { RefactorReplayData } from "./types";
import { rpsFunctions } from "./rps-functions";

// MDX에서 <RefactorReplay id="..." />로 부르는 이름표.
export const REFACTOR_REPLAYS: Record<string, RefactorReplayData> = {
  "rps-functions": rpsFunctions,
};
