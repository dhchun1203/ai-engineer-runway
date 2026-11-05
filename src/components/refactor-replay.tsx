// 리팩터링 재생기 — MDX에서 <RefactorReplay id="rps-functions" />로 부른다.
// 데이터(원래 코드 + 단계별 고침)는 src/content/refactor-replays에 두고, 여기서는
// 이름표로 찾아 재생기(클라이언트)에 넘기기만 한다.

import { REFACTOR_REPLAYS } from "@/content/refactor-replays";
import { RefactorReplayPlayer } from "@/components/refactor-replay-player";

export function RefactorReplay({ id }: { id: string }) {
  const data = REFACTOR_REPLAYS[id];
  if (!data) {
    throw new Error(`RefactorReplay: 알 수 없는 id "${id}"`);
  }
  return <RefactorReplayPlayer data={data} />;
}
