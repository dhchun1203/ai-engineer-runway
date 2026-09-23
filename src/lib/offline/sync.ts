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
// 서버가 한 항목을 거절하면(예: 배포로 이름이 바뀐 레슨) 그 항목은 대기열에 남기고 다음
// 항목으로 넘어간다. 거절은 항목마다 세고, 같은 값이 세 번 거절되면 대기열에서 버린다
// (queue.ts recordRejection). 네트워크가 끊겼거나 로그인이 풀렸을 때만 재생을 멈춘다.
// 지금 로그인한 계정의 항목만 보낸다(offline-logic.ts itemsForAccount). 다른 계정이 남긴
// 항목은 계정 대조(offline-runtime.tsx)가 지운다.
// 보내기 전에 서버의 현재 빌드 id와 이 페이지의 빌드 id를 비교한다. 다르면 이 페이지의
// Server Action 식별자가 서버에 없을 수 있어 보내지 않는다. 앱 시작(경로 이동 포함)과
// 화면이 다시 보일 때의 재생만 한 번 새로 불러온다(새 페이지가 재생한다). 쓰기 직후의
// 재생은 입력 중일 수 있어 새로 부르지 않고 재생만 건너뛴다. 서버 빌드 id를 읽지 못하면
// 새로 불러오지 않고 그대로 재생한다.
//
// 오프라인 모드를 끈 빌드(flag.ts)에서는 쓰기를 예전처럼 바로 보내고 재생하지 않는다.

import { useSyncExternalStore } from "react";
import { toggleLessonComplete } from "@/app/lesson/[lessonId]/actions";
import { saveLessonNoteAction } from "@/app/lesson/[lessonId]/note-actions";
import { toggleBasecampItem } from "@/app/basecamp/actions";
import { saveBasecampNoteAction } from "@/app/basecamp/[slug]/note-actions";
import { saveArticleNoteAction } from "@/app/articles/[slug]/note-actions";
import { confirmedAccountId, fetchAuthState } from "./auth";
import { BUILD_ID } from "./cache";
import { isOnline, markOffline, probeOnline } from "./connectivity";
import { setMeta } from "./db";
import { OFFLINE_MODE_OFF } from "./flag";
import { enqueue, hasQueued, readQueue, readQueueOwner, recordRejection, removeIfUnchanged } from "./queue";
import { saveNoteCopy } from "./snapshots";
import { itemsForAccount, parseNoteKey, type QueueInput, type QueueItem } from "./offline-logic";

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

/** 로그인이 풀렸는데 동기화 안 된 대기열이 남았을 때 부른다(계정 대조가 재생 없이 알게 된 경우). */
export function markNeedsLogin(): void {
  setNeedsLogin(true);
}

/** 대기열에 넣을 때 적을 계정. 이 페이지에서 확인된 계정, 모르면 기기 저장본의 주인. */
async function accountForWrite(): Promise<string | null> {
  return (await confirmedAccountId()) ?? (await readQueueOwner());
}

export async function writeOrQueue(input: QueueInput, send: () => Promise<void>): Promise<WriteResult> {
  if (OFFLINE_MODE_OFF) {
    await send();
    return "sent";
  }
  const account = await accountForWrite();
  if (!isOnline() || (await hasQueued(input.kind, input.key, account))) {
    await enqueue(input, account);
    if (isOnline()) void replayQueue();
    return "queued";
  }
  try {
    await send();
  } catch (error) {
    if (await probeOnline()) throw error;
    markOffline();
    await enqueue(input, account);
    return "queued";
  }
  if (input.kind === "note") await saveNoteCopy(input.key, input.value);
  return "sent";
}

/**
 * 이 페이지가 서버와 같은 빌드인가. 같거나 서버 빌드 id를 모르면 true(재생해도 된다).
 * 다르면 false이고, allowReload이며 이 서버 빌드로 아직 새로 불러온 적이 없으면 한 번 새로 불러온다.
 */
function pageMatchesServerBuild(serverBuildId: string | null, allowReload: boolean): boolean {
  if (serverBuildId === null || serverBuildId === BUILD_ID) return true;
  if (!allowReload) return false;
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

type SendOutcome = "sent" | "rejected" | "stop";

/** 한 항목을 보낸다. 서버가 거절했으면 "rejected", 네트워크나 로그인 문제면 "stop". */
async function sendOne(item: QueueItem): Promise<SendOutcome> {
  try {
    await sendQueued(item);
    return "sent";
  } catch (error) {
    console.warn("[offline] replaying queued write failed", item.kind, item.key, error);
    if (!(await probeOnline())) {
      markOffline();
      return "stop";
    }
    // 방금 실패했으니 다시 쓴 응답이 아니라 새로 묻는다.
    const again = await fetchAuthState({ fresh: true });
    // 로그인 상태를 확인할 수 없으면 네트워크 문제로 보고 멈춘다.
    if (again === null) return "stop";
    if (!again.userId) {
      setNeedsLogin(true);
      return "stop";
    }
    // 서버가 이 항목만 거절했다. 대기열에 남기고(다음 계기에 다시 시도) 다음 항목으로 넘어간다.
    return "rejected";
  }
}

// 같은 값으로 다시 보내지 않으려고 id와 넣은 시각을 함께 본다(새 값이 들어오면 다시 시도한다).
function attemptKey(item: QueueItem): string {
  return `${item.id}@${item.at}`;
}

async function runReplay(): Promise<void> {
  if (OFFLINE_MODE_OFF) return;
  // 이번 재생에서 서버가 거절한 항목. 다음 바퀴에서 같은 값을 되풀이해 보내지 않는다(거절
  // 횟수도 재생 한 번에 한 번만 는다).
  const rejected = new Set<string>();
  for (let round = 0; round < MAX_REPLAY_ROUNDS; round += 1) {
    if (!isOnline()) return;
    const queue = await readQueue();
    if (queue.length === 0) {
      setNeedsLogin(false);
      return;
    }
    const auth = await fetchAuthState();
    if (auth === null) return;
    if (!pageMatchesServerBuild(auth.buildId, reloadAllowed)) return;
    if (!auth.userId) {
      setNeedsLogin(true);
      return;
    }
    setNeedsLogin(false);
    // 지금 계정의 항목만 보낸다. 다른 계정의 항목은 계정 대조(offline-runtime.tsx)가 지운다.
    const items = itemsForAccount(queue, auth.userId, await readQueueOwner()).filter(
      (item) => !rejected.has(attemptKey(item)),
    );
    if (items.length === 0) return;

    for (const item of items) {
      if (!isOnline()) return;
      const outcome = await sendOne(item);
      if (outcome === "stop") return;
      if (outcome === "rejected") {
        rejected.add(attemptKey(item));
        await recordRejection(item);
        continue;
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
// 지금 도는 재생이 빌드가 다를 때 새로 불러와도 되는가. 앱 시작과 화면 복귀 계기만 켠다.
let reloadAllowed = false;

export type ReplayOptions = {
  /** 빌드가 다르면 한 번 새로 불러와도 된다(앱 시작, 화면이 다시 보일 때만). */
  allowReload?: boolean;
};

/**
 * 동시에 한 번만 돈다. 이미 돌고 있으면 그 약속을 돌려준다. 돌고 있는 재생에 allowReload를
 * 얹으면 그 재생이 아직 빌드를 비교하기 전일 때만 반영된다(아니면 다음 계기로 미룬다).
 */
export function replayQueue(options: ReplayOptions = {}): Promise<void> {
  if (options.allowReload) reloadAllowed = true;
  if (!running) {
    running = runReplay()
      .catch((error: unknown) => {
        console.warn("[offline] queue replay failed", error);
      })
      .finally(() => {
        running = null;
        reloadAllowed = false;
      });
  }
  return running;
}
