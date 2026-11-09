import type { BuildReplayData } from "./types";
import { shoppingCart } from "./shopping-cart";

// MDX에서 <BuildReplay id="..." />로 부르는 이름표.
export const BUILD_REPLAYS: Record<string, BuildReplayData> = {
  "shopping-cart": shoppingCart,
};
