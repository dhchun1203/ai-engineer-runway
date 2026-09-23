// 쓰기 대기열(설계 3.4)과 헤더 램프가 보는 대기 개수 저장소. 대기열 항목의 id가
// "kind|key"라 같은 항목을 다시 넣으면 앞의 것을 덮어쓴다(마지막 것만 남는다).
// 항목마다 넣을 때 확인된 계정(userId)을 적는다. 다른 계정의 항목을 가려내는 판정은
// offline-logic.ts itemsForAccount가 한다. 오프라인 모드를 끈 빌드(flag.ts)에서는 대기열이
// 비어 있는 것으로 본다(DB를 열지 않는다).

import { useSyncExternalStore } from "react";
import { getMeta, idbCount, idbDeleteIf, idbGet, idbGetAll, idbPut, idbUpdateIf, offlineDbExists } from "./db";
import { OFFLINE_MODE_OFF } from "./flag";
import {
  afterRejection,
  itemsForAccount,
  MAX_QUEUE_REJECTIONS,
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
  if (OFFLINE_MODE_OFF) return 0;
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

/** 기기 저장본의 주인(meta.userId). 없거나 읽지 못하면 null. */
export async function readQueueOwner(): Promise<string | null> {
  try {
    return (await getMeta<string>("userId")) ?? null;
  } catch (error) {
    console.warn("[offline] reading queue owner failed", error);
    return null;
  }
}

/** userId: 넣는 순간 확인된 계정(모르면 null, 그러면 기기 저장본 주인의 것으로 본다). */
export async function enqueue(input: QueueInput, userId: string | null): Promise<void> {
  await idbPut("queue", toQueueItem(input, Date.now(), userId));
  await refreshQueueCount();
}

/** 이 계정(account, 모르면 null)의 같은 항목이 대기 중인가. 다른 계정의 항목은 세지 않는다. */
export async function hasQueued(kind: QueueKind, key: string, account: string | null): Promise<boolean> {
  try {
    const item = await idbGet<QueueItem>("queue", queueItemId(kind, key));
    if (item === undefined) return false;
    if (account === null) return true;
    return itemsForAccount([item], account, item.userId ? null : await readQueueOwner()).length > 0;
  } catch (error) {
    console.warn("[offline] reading queued item failed", error);
    return false;
  }
}

export async function readQueue(): Promise<QueueItem[]> {
  if (OFFLINE_MODE_OFF) return [];
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

/**
 * 서버가 이 항목을 거절했다. 같은 값이 아직 대기 중이면 거절 횟수를 하나 늘리고, 한도
 * (MAX_QUEUE_REJECTIONS)에 닿으면 버린다. 그 사이 새 값이 들어왔으면 손대지 않는다.
 */
export async function recordRejection(item: QueueItem): Promise<void> {
  try {
    const outcome = await idbUpdateIf<QueueItem>("queue", item.id, (current) => {
      if (current === undefined || current.at !== item.at || current.value !== item.value) return undefined;
      return afterRejection(current);
    });
    if (outcome === "deleted") {
      console.warn(
        `[offline] dropping a queued write the server rejected ${MAX_QUEUE_REJECTIONS} times`,
        item.kind,
        item.key,
      );
    }
  } catch (error) {
    console.warn("[offline] recording a rejected queue item failed", error);
  }
  await refreshQueueCount();
}
