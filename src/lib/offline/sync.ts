// 쓰기와 동기화(설계 3.4).
//
// writeOrQueue: 기존 Server Action 호출부를 감싼다. 온라인이면 지금처럼 바로 보낸다.
// 오프라인이거나, 보냈는데 서버에 닿지 않으면(확인 요청까지 실패) 대기열에 넣고 성공처럼
// 돌아간다. 서버에 닿는데 실패한 것은 진짜 오류라 그대로 던진다(호출부의 기존 오류 표시).
// 같은 항목이 이미 대기 중이면 새 값도 대기열로 보낸다. 그래야 재생 중인 옛 값이 새 값을
// 덮어쓰는 순서 뒤집힘이 없다.
//
// replayQueue: 대기열을 넣은 순서대로 기존 Server Action으로 다시 부른다. 성공한 항목만
// 지운다. 로그인이 풀려 있으면 멈추고 "다시 로그인하면 동기화돼요"를 켠다. 완료 토글은
// 목표 상태로 보낸다. 서버는 !currentlyDone을 저장하므로 currentlyDone = !목표로 부른다.
// 보내기 전에 서버의 현재 빌드 id와 이 페이지의 빌드 id를 비교한다. 다르면 이 페이지의
// Server Action 식별자가 서버에 없을 수 있어 보내지 않고, 한 번만 새로 불러온다(새 페이지가
// 재생한다). 서버 빌드 id를 읽지 못하면 새로 불러오지 않고 그대로 재생한다.

import { useSyncExternalStore } from "react";
import { toggleLessonComplete } from "@/app/lesson/[lessonId]/actions";
import { saveLessonNoteAction } from "@/app/lesson/[lessonId]/note-actions";
import { toggleBasecampItem } from "@/app/basecamp/actions";
import { saveBasecampNoteAction } from "@/app/basecamp/[slug]/note-actions";
import { saveArticleNoteAction } from "@/app/articles/[slug]/note-actions";
import { BUILD_ID } from "./cache";
import { isOnline, markOffline, probeOnline } from "./connectivity";
import { getMeta, setMeta } from "./db";
import { enqueue, hasQueued, readQueue, removeIfUnchanged } from "./queue";
import { saveNoteCopy } from "./snapshots";
import { parseAuthState, parseNoteKey, type AuthState, type QueueInput, type QueueItem } from "./offline-logic";

export type WriteResult = "sent" | "queued";

// 재생 한 번에 최대 몇 바퀴 도는가. 재생 중에 새 항목이 들어오면 다음 바퀴가 이어서 보낸다.
const MAX_REPLAY_ROUNDS = 5;

// 서버 빌드 id별로 "이미 한 번 새로 불러왔다" 표시. 같은 서버 빌드에는 한 번만 새로 부른다.
const RELOAD_FLAG_PREFIX = "offline-reloaded-for-build:";

let needsLogin = false;
const needsLoginListeners = new Set<() => void>();

function setNeedsLogin(next: boolean): void {
  if (next === needsLogin) return;
  needsLogin = next;
  for (const listener of needsLoginListeners) listener();
}

function subscribeNeedsLogin(listener: () => void): () => void {
  needsLoginListeners.add(listener);
  return () => {
    needsLoginListeners.delete(listener);
  };
}

function getNeedsLogin(): boolean {
  return needsLogin;
}

function getServerNeedsLogin(): boolean {
  return false;
}

export function useNeedsLogin(): boolean {
  return useSyncExternalStore(subscribeNeedsLogin, getNeedsLogin, getServerNeedsLogin);
}

export async function writeOrQueue(input: QueueInput, send: () => Promise<void>): Promise<WriteResult> {
  if (!isOnline() || (await hasQueued(input.kind, input.key))) {
    await enqueue(input);
    if (isOnline()) void replayQueue();
    return "queued";
  }
  try {
    await send();
  } catch (error) {
    if (await probeOnline()) throw error;
    markOffline();
    await enqueue(input);
    return "queued";
  }
  if (input.kind === "note") await saveNoteCopy(input.key, input.value);
  return "sent";
}

/** 로그인 상태 조회. 서버에 닿지 않으면 null. */
export async function fetchAuthState(): Promise<AuthState | null> {
  try {
    const res = await fetch("/api/auth", { cache: "no-store" });
    if (!res.ok) return null;
    return parseAuthState(await res.json());
  } catch (error) {
    console.warn("[offline] fetching auth state failed", error);
    return null;
  }
}

/**
 * 이 페이지가 서버와 같은 빌드인가. 같거나 서버 빌드 id를 모르면 true(재생해도 된다).
 * 다르면 false이고, 이 서버 빌드로 아직 새로 불러온 적이 없으면 한 번 새로 불러온다.
 */
function pageMatchesServerBuild(serverBuildId: string | null): boolean {
  if (serverBuildId === null || serverBuildId === BUILD_ID) return true;
  const flag = `${RELOAD_FLAG_PREFIX}${serverBuildId}`;
  let alreadyReloaded: boolean;
  try {
    alreadyReloaded = window.sessionStorage.getItem(flag) !== null;
    if (!alreadyReloaded) window.sessionStorage.setItem(flag, "1");
  } catch (error) {
    // 표시를 남길 수 없으면 새로 불러오기가 되풀이될 수 있어 새로 부르지 않는다. 옛 빌드
    // 페이지에서는 재생하지도 않는다(다음에 새 페이지를 열면 그 페이지가 재생한다).
    console.warn("[offline] build reload flag unavailable, skipping reload", error);
    return false;
  }
  if (!alreadyReloaded) window.location.reload();
  return false;
}

function sendQueued(item: QueueItem): Promise<void> {
  if (item.kind === "lessonComplete") return toggleLessonComplete(item.key, !item.value);
  if (item.kind === "basecampItem") return toggleBasecampItem(item.key, !item.value);
  const { target, slug } = parseNoteKey(item.key);
  if (target === "basecamp") return saveBasecampNoteAction(slug, item.value);
  if (target === "article") return saveArticleNoteAction(slug, item.value);
  return saveLessonNoteAction(slug, item.value);
}

async function runReplay(): Promise<void> {
  for (let round = 0; round < MAX_REPLAY_ROUNDS; round += 1) {
    if (!isOnline()) return;
    const items = await readQueue();
    if (items.length === 0) {
      setNeedsLogin(false);
      return;
    }
    const auth = await fetchAuthState();
    if (auth === null) return;
    if (!pageMatchesServerBuild(auth.buildId)) return;
    if (!auth.userId) {
      setNeedsLogin(true);
      return;
    }
    // 다른 계정의 대기열이면 보내지 않는다. 계정 대조(offline-runtime.tsx)가 지운다.
    const owner = await getMeta<string>("userId").catch((error: unknown) => {
      console.warn("[offline] reading queue owner failed", error);
      return undefined;
    });
    if (owner && owner !== auth.userId) return;
    setNeedsLogin(false);

    for (const item of items) {
      try {
        await sendQueued(item);
      } catch (error) {
        console.warn("[offline] replaying queued write failed", error);
        if (!(await probeOnline())) {
          markOffline();
          return;
        }
        const again = await fetchAuthState();
        if (again !== null && !again.userId) setNeedsLogin(true);
        // 서버가 거절했다. 대기열은 지우지 않고 다음 계기에 다시 시도한다.
        return;
      }
      await removeIfUnchanged(item);
      if (item.kind === "note") await saveNoteCopy(item.key, item.value);
    }
    await setMeta("lastSyncAt", Date.now()).catch((error: unknown) => {
      console.warn("[offline] saving lastSyncAt failed", error);
    });
  }
}

let running: Promise<void> | null = null;

/** 동시에 한 번만 돈다. 이미 돌고 있으면 그 약속을 돌려준다. */
export function replayQueue(): Promise<void> {
  if (!running) {
    running = runReplay()
      .catch((error: unknown) => {
        console.warn("[offline] queue replay failed", error);
      })
      .finally(() => {
        running = null;
      });
  }
  return running;
}
