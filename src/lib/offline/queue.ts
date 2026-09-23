// 쓰기 대기열(설계 3.4)과 헤더 램프가 보는 대기 개수 저장소. 대기열 항목의 id가
// "kind|key"라 같은 항목을 다시 넣으면 앞의 것을 덮어쓴다(마지막 것만 남는다).

import { useSyncExternalStore } from "react";
import { idbCount, idbDeleteIf, idbGet, idbGetAll, idbPut, offlineDbExists } from "./db";
import {
  queueItemId,
  sortQueue,
  toQueueItem,
  type QueueInput,
  type QueueItem,
  type QueueKind,
} from "./offline-logic";

let cachedCount = 0;
let loaded = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export async function countQueue(): Promise<number> {
  try {
    // 세기만 하려고 DB를 열면 없던 빈 DB가 새로 생긴다. 로그아웃 정리 직후 화면(헤더 램프가
    // 잠깐 다시 붙는 경우 포함)에서 지운 DB가 되살아나지 않게, 없으면 열지 않고 0으로 본다.
    if (!(await offlineDbExists())) return 0;
    return await idbCount("queue");
  } catch (error) {
    console.warn("[offline] counting queue failed", error);
    return 0;
  }
}

export async function refreshQueueCount(): Promise<void> {
  const next = await countQueue();
  if (next === cachedCount) return;
  cachedCount = next;
  emit();
}

/** DB를 지운 직후에 쓴다. 다시 세면 빈 DB가 새로 생기므로 0으로만 맞춘다. */
export function resetQueueCount(): void {
  if (cachedCount === 0) return;
  cachedCount = 0;
  emit();
}

function subscribeQueueCount(listener: () => void): () => void {
  listeners.add(listener);
  if (!loaded) {
    loaded = true;
    void refreshQueueCount();
  }
  return () => {
    listeners.delete(listener);
  };
}

function getQueueCount(): number {
  return cachedCount;
}

function getServerQueueCount(): number {
  return 0;
}

export function useQueueCount(): number {
  return useSyncExternalStore(subscribeQueueCount, getQueueCount, getServerQueueCount);
}

export async function enqueue(input: QueueInput): Promise<void> {
  await idbPut("queue", toQueueItem(input, Date.now()));
  await refreshQueueCount();
}

export async function hasQueued(kind: QueueKind, key: string): Promise<boolean> {
  try {
    return (await idbGet<QueueItem>("queue", queueItemId(kind, key))) !== undefined;
  } catch (error) {
    console.warn("[offline] reading queued item failed", error);
    return false;
  }
}

export async function readQueue(): Promise<QueueItem[]> {
  try {
    return sortQueue(await idbGetAll<QueueItem>("queue"));
  } catch (error) {
    console.warn("[offline] reading queue failed", error);
    return [];
  }
}

/**
 * 보낸 항목을 지운다. 보내는 사이에 같은 항목이 새 값으로 바뀌었으면 남긴다. 읽기와 삭제를
 * 한 트랜잭션으로 해서, 그 사이에 들어온 새 값(메모 자동 저장 등)이 지워지지 않게 한다.
 */
export async function removeIfUnchanged(item: QueueItem): Promise<void> {
  try {
    await idbDeleteIf<QueueItem>(
      "queue",
      item.id,
      (current) => current !== undefined && current.at === item.at && current.value === item.value,
    );
  } catch (error) {
    // 지우지 못하면 다음 동기화에서 같은 값을 한 번 더 보낸다(결과는 같다).
    console.warn("[offline] removing sent queue item failed", error);
  }
  await refreshQueueCount();
}
