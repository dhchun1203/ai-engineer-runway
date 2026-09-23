// 진도와 메모의 마지막 사본(설계 3.4). 온라인에서 받을 때마다 갱신하고, 오프라인이면
// 사본에 대기열 변경분을 얹어 돌려준다. 모든 함수는 기기 저장소 오류를 경고로 남기고
// 넘어간다. 사본은 부가 기능이라 실패해도 기존 화면 흐름을 깨면 안 된다.

import type { ProgressData, ProgressLesson } from "@/components/progress-provider";
import { idbClear, idbGet, idbGetAll, idbPut } from "./db";
import { readQueue } from "./queue";
import { overlayProgress, queuedNote } from "./offline-logic";

type ProgressCopy = { id: string; data: ProgressData; at: number };
type NoteCopy = { id: string; body: string; at: number };

/** 받은 진도 응답을 사본으로 남기고, 대기 중인 변경분을 얹어 돌려준다. */
export async function keepProgressCopy(lessonId: string | undefined, data: ProgressData): Promise<ProgressData> {
  if (!data.unlocked || !data.ok) return data;
  try {
    const at = Date.now();
    await idbPut<ProgressCopy>("progressSnapshot", { id: lessonId ?? "", data, at });
    if (data.lesson && data.lesson.note.ok) {
      await idbPut<NoteCopy>("noteSnapshots", { id: data.lesson.slug, body: data.lesson.note.body, at });
    }
    const queue = await readQueue();
    return queue.length === 0 ? data : overlayProgress(data, queue, null);
  } catch (error) {
    console.warn("[offline] keeping progress copy failed", error);
    return data;
  }
}

/**
 * 오프라인 읽기. 완료 목록과 진행률은 가장 최근 사본에서, 레슨 칸(til, 다시 보기 표시)은
 * 그 레슨의 사본에서, 메모는 메모 사본에서 가져온 뒤 대기열을 얹는다. 사본이 하나도 없으면 null.
 */
export async function readProgressCopy(lessonId: string | undefined): Promise<ProgressData | null> {
  try {
    const copies = await idbGetAll<ProgressCopy>("progressSnapshot");
    if (copies.length === 0) return null;
    const latest = copies.reduce((a, b) => (b.at > a.at ? b : a));
    let lesson: ProgressLesson | null = null;
    let noteBody: string | null = null;
    if (lessonId) {
      const own = copies.find((copy) => copy.id === lessonId);
      lesson = own?.data.lesson ?? { slug: lessonId, done: false, note: { ok: false }, til: "", needsReview: false };
      const noteCopy = await idbGet<NoteCopy>("noteSnapshots", lessonId);
      noteBody = noteCopy?.body ?? null;
    }
    const queue = await readQueue();
    return overlayProgress({ ...latest.data, lesson }, queue, noteBody);
  } catch (error) {
    console.warn("[offline] reading progress copy failed", error);
    return null;
  }
}

export async function saveNoteCopy(noteKey: string, body: string): Promise<void> {
  try {
    await idbPut<NoteCopy>("noteSnapshots", { id: noteKey, body, at: Date.now() });
  } catch (error) {
    // 사본 저장 실패는 넘어간다(다음 온라인 조회 때 다시 남긴다).
    console.warn("[offline] saving note copy failed", error);
  }
}

/** 서버 메모를 사본으로 남기고, 아직 동기화 안 된 메모가 있으면 그것을 돌려준다. */
export async function keepNoteCopy(noteKey: string, body: string): Promise<string> {
  await saveNoteCopy(noteKey, body);
  return queuedNote(await readQueue(), noteKey) ?? body;
}

/** 오프라인 메모 읽기. 대기열 > 사본. 둘 다 없으면 null(메모장을 열지 않는다). */
export async function readNoteCopy(noteKey: string): Promise<string | null> {
  const queued = queuedNote(await readQueue(), noteKey);
  if (queued !== null) return queued;
  try {
    return (await idbGet<NoteCopy>("noteSnapshots", noteKey))?.body ?? null;
  } catch (error) {
    console.warn("[offline] reading note copy failed", error);
    return null;
  }
}

export async function clearCopies(): Promise<void> {
  await idbClear("progressSnapshot");
  await idbClear("noteSnapshots");
}
