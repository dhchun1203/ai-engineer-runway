// 진도와 메모의 마지막 사본(설계 3.4). 온라인에서 받을 때마다 갱신하고, 오프라인이면
// 사본에 대기열 변경분을 얹어 돌려준다. 모든 함수는 기기 저장소 오류를 경고로 남기고
// 넘어간다. 사본은 부가 기능이라 실패해도 기존 화면 흐름을 깨면 안 된다.
//
// 화면을 그리는 길(진도와 메모 불러오기)에서 부르는 읽기는 시간 제한(timeout.ts)을 둔다.
// 저장소가 멈춰도 스켈레톤에서 멈추지 않고 빈 대기열이나 "사본 없음"으로 넘어간다.
// 대기열은 지금 계정의 항목만 얹는다(offline-logic.ts itemsForAccount). 세션이 만료돼 앞 사람의
// 대기열이 남은 기기에서 다른 사람이 로그인하면, 계정 대조가 지우기 전이라도 앞 사람의 완료와
// 메모가 화면에 보이거나 자동 저장으로 새 계정에 들어가지 않게 한다.
// 오프라인 모드를 끈 빌드(flag.ts)에서는 사본을 남기지도 읽지도 않는다.

import type { ProgressData, ProgressLesson } from "@/components/progress-provider";
import { confirmedAccountId } from "./auth";
import { idbClear, idbGet, idbGetAll, idbPut } from "./db";
import { OFFLINE_MODE_OFF } from "./flag";
import { readQueue, readQueueOwner } from "./queue";
import { itemsForAccount, overlayProgress, queuedNote, type QueueItem } from "./offline-logic";
import { STORAGE_READ_TIMEOUT_MS, withTimeout } from "./timeout";

type ProgressCopy = { id: string; data: ProgressData; at: number };
type NoteCopy = { id: string; body: string; at: number };

function readBounded<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  return withTimeout(promise, STORAGE_READ_TIMEOUT_MS, fallback, label);
}

/** 대기열 중 지금 계정의 항목(넣은 순서). 비었거나 읽지 못하면 빈 목록. */
async function queueForCurrentAccount(): Promise<QueueItem[]> {
  const queue = await readBounded(readQueue(), [], "reading the write queue");
  if (queue.length === 0) return queue;
  const [account, metaOwner] = await Promise.all([
    confirmedAccountId(),
    readBounded(readQueueOwner(), null, "reading the queue owner"),
  ]);
  return itemsForAccount(queue, account, metaOwner);
}

/** 받은 진도 응답을 사본으로 남긴다. 화면을 그린 뒤 백그라운드로 부른다. */
export async function saveProgressCopy(lessonId: string | undefined, data: ProgressData): Promise<void> {
  if (OFFLINE_MODE_OFF || !data.unlocked || !data.ok) return;
  try {
    const at = Date.now();
    await idbPut<ProgressCopy>("progressSnapshot", { id: lessonId ?? "", data, at });
    if (data.lesson && data.lesson.note.ok) {
      await idbPut<NoteCopy>("noteSnapshots", { id: data.lesson.slug, body: data.lesson.note.body, at });
    }
  } catch (error) {
    console.warn("[offline] keeping progress copy failed", error);
  }
}

/** 받은 진도 응답에 지금 계정의 대기 중인 변경분을 얹어 돌려준다(대기열이 비었으면 그대로). */
export async function overlayQueuedProgress(data: ProgressData): Promise<ProgressData> {
  if (OFFLINE_MODE_OFF || !data.unlocked || !data.ok) return data;
  const queue = await queueForCurrentAccount();
  return queue.length === 0 ? data : overlayProgress(data, queue, null);
}

/**
 * 오프라인 읽기. 완료 목록과 진행률은 가장 최근 사본에서, 레슨 칸(til, 다시 보기 표시)은
 * 그 레슨의 사본에서, 메모는 메모 사본에서 가져온 뒤 대기열을 얹는다. 사본이 하나도 없으면 null.
 */
export async function readProgressCopy(lessonId: string | undefined): Promise<ProgressData | null> {
  if (OFFLINE_MODE_OFF) return null;
  try {
    const copies = await readBounded(idbGetAll<ProgressCopy>("progressSnapshot"), [], "reading progress copies");
    if (copies.length === 0) return null;
    const latest = copies.reduce((a, b) => (b.at > a.at ? b : a));
    let lesson: ProgressLesson | null = null;
    let noteBody: string | null = null;
    if (lessonId) {
      const own = copies.find((copy) => copy.id === lessonId);
      lesson = own?.data.lesson ?? { slug: lessonId, done: false, note: { ok: false }, til: "", needsReview: false };
      const noteCopy = await readBounded(
        idbGet<NoteCopy>("noteSnapshots", lessonId),
        undefined,
        "reading the note copy",
      );
      noteBody = noteCopy?.body ?? null;
    }
    const queue = await queueForCurrentAccount();
    return overlayProgress({ ...latest.data, lesson }, queue, noteBody);
  } catch (error) {
    console.warn("[offline] reading progress copy failed", error);
    return null;
  }
}

export async function saveNoteCopy(noteKey: string, body: string): Promise<void> {
  if (OFFLINE_MODE_OFF) return;
  try {
    await idbPut<NoteCopy>("noteSnapshots", { id: noteKey, body, at: Date.now() });
  } catch (error) {
    // 사본 저장 실패는 넘어간다(다음 온라인 조회 때 다시 남긴다).
    console.warn("[offline] saving note copy failed", error);
  }
}

/**
 * 서버 메모를 사본으로 남기고(백그라운드), 지금 계정의 동기화 안 된 메모가 있으면 그것을
 * 돌려준다. 대기열을 다 읽은 뒤에 돌려주므로 메모장은 처음부터 맞는 값으로 열린다.
 */
export async function keepNoteCopy(noteKey: string, body: string): Promise<string> {
  if (OFFLINE_MODE_OFF) return body;
  void saveNoteCopy(noteKey, body);
  return queuedNote(await queueForCurrentAccount(), noteKey) ?? body;
}

/** 오프라인 메모 읽기. 대기열 > 사본. 둘 다 없으면 null(메모장을 열지 않는다). */
export async function readNoteCopy(noteKey: string): Promise<string | null> {
  if (OFFLINE_MODE_OFF) return null;
  const queued = queuedNote(await queueForCurrentAccount(), noteKey);
  if (queued !== null) return queued;
  try {
    const copy = await readBounded(idbGet<NoteCopy>("noteSnapshots", noteKey), undefined, "reading the note copy");
    return copy?.body ?? null;
  } catch (error) {
    console.warn("[offline] reading note copy failed", error);
    return null;
  }
}

export async function clearCopies(): Promise<void> {
  await idbClear("progressSnapshot");
  await idbClear("noteSnapshots");
}
