// 빌드 재생기: MDX에서 <BuildReplay id="shopping-cart" />로 부른다.
// 데이터는 src/content/build-replays에 두고, 여기서는 이름표로 찾아 재생기(클라이언트)에 넘긴다.

import { BUILD_REPLAYS } from "@/content/build-replays";
import { BuildReplayPlayer } from "@/components/build-replay-player";

export function BuildReplay({ id }: { id: string }) {
  const data = BUILD_REPLAYS[id];
  if (!data) {
    throw new Error(`BuildReplay: 알 수 없는 id "${id}"`);
  }
  return <BuildReplayPlayer data={data} />;
}
