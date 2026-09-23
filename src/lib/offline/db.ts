// 오프라인 모드의 IndexedDB(offline-db, 버전 1) 얇은 Promise 래퍼(설계 3.4). 외부 라이브러리
// 없이 이 기능에 필요한 동작만 둔다. 저장소 네 개는 모두 keyPath "id"다.
//   progressSnapshot: { id: 레슨 slug 또는 "", data: /api/progress 응답, at }
//   noteSnapshots:    { id: 메모 키, body, at }
//   queue:            QueueItem(offline-logic.ts). id가 "kind|key"라 같은 항목은 덮어써진다
//   meta:             { id: "userId" | "lastDownloadAt" | "lastSyncAt", value }

export type StoreName = "progressSnapshot" | "noteSnapshots" | "queue" | "meta";

const DB_NAME = "offline-db";
const DB_VERSION = 1;
const STORE_NAMES: readonly StoreName[] = ["progressSnapshot", "noteSnapshots", "queue", "meta"];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORE_NAMES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // 다른 탭이 DB를 지우려 하면(로그아웃) 연결을 놓아 준다. 다음 호출이 다시 연다.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
  dbPromise = opening.catch((error: unknown) => {
    dbPromise = null;
    throw error;
  });
  return dbPromise;
}

function run<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(name, mode);
        const request = action(tx.objectStore(name));
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = () => reject(tx.error ?? request.error);
        tx.onabort = () => reject(tx.error ?? request.error);
      }),
  );
}

export function idbGet<T>(name: StoreName, id: string): Promise<T | undefined> {
  return run(name, "readonly", (store) => store.get(id) as IDBRequest<T | undefined>);
}

export function idbGetAll<T>(name: StoreName): Promise<T[]> {
  return run(name, "readonly", (store) => store.getAll() as IDBRequest<T[]>);
}

export function idbPut<T extends { id: string }>(name: StoreName, value: T): Promise<void> {
  return run(name, "readwrite", (store) => store.put(value)).then(() => undefined);
}

export function idbDelete(name: StoreName, id: string): Promise<void> {
  return run(name, "readwrite", (store) => store.delete(id)).then(() => undefined);
}

export function idbClear(name: StoreName): Promise<void> {
  return run(name, "readwrite", (store) => store.clear()).then(() => undefined);
}

export function idbCount(name: StoreName): Promise<number> {
  return run(name, "readonly", (store) => store.count());
}

type MetaRecord<T> = { id: string; value: T };

export async function getMeta<T>(id: string): Promise<T | undefined> {
  const record = await idbGet<MetaRecord<T>>("meta", id);
  return record?.value;
}

export function setMeta<T>(id: string, value: T): Promise<void> {
  return idbPut<MetaRecord<T>>("meta", { id, value });
}

/** DB를 새로 만들지 않고 있는지만 본다(로그아웃 상태에서 빈 DB가 생기지 않게). */
export async function offlineDbExists(): Promise<boolean> {
  if (typeof indexedDB === "undefined") return false;
  if (typeof indexedDB.databases !== "function") return true;
  try {
    return (await indexedDB.databases()).some((info) => info.name === DB_NAME);
  } catch (error) {
    // 목록을 못 읽으면 "있다"로 본다(지워야 할 저장본을 놓치지 않는 쪽).
    console.warn("[offline] listing IndexedDB databases failed", error);
    return true;
  }
}

export async function deleteOfflineDb(): Promise<void> {
  if (dbPromise) {
    try {
      (await dbPromise).close();
    } catch (error) {
      // 열기에 실패한 연결은 닫을 것이 없다. 그대로 삭제로 넘어간다.
      console.warn("[offline] closing offline-db before delete failed", error);
    }
    dbPromise = null;
  }
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.warn("[offline] deleting offline-db failed", request.error);
      resolve();
    };
    request.onblocked = () => {
      // 다른 탭이 연결을 쥐고 있다. 그 탭이 onversionchange로 놓으면 삭제가 이어서 끝난다.
      console.warn("[offline] deleting offline-db is blocked by another connection");
      resolve();
    };
  });
}
