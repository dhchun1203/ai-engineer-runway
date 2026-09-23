// 오프라인 모드의 IndexedDB(offline-db, 버전 1) 얇은 Promise 래퍼(설계 3.4). 외부 라이브러리
// 없이 이 기능에 필요한 동작만 둔다. 저장소 네 개는 모두 keyPath "id"다.
//   progressSnapshot: { id: 레슨 slug 또는 "", data: /api/progress 응답, at }
//   noteSnapshots:    { id: 메모 키, body, at }
//   queue:            QueueItem(offline-logic.ts). id가 "kind|key"라 같은 항목은 덮어써진다
//   meta:             { id: "userId" | "lastDownloadAt" | "lastSyncAt", value }

import { OFFLINE_MODE_OFF } from "./flag";

export type StoreName = "progressSnapshot" | "noteSnapshots" | "queue" | "meta";

const DB_NAME = "offline-db";
const DB_VERSION = 1;
const STORE_NAMES: readonly StoreName[] = ["progressSnapshot", "noteSnapshots", "queue", "meta"];

let dbPromise: Promise<IDBDatabase> | null = null;
// 지금 dbPromise가 가리키는 연결. 옛 연결의 onclose가 새로 연 연결을 잊게 만들지 않도록 대조한다.
let openedDb: IDBDatabase | null = null;
// 정리(deleteOfflineDb)로 DB를 지운 뒤에는 이 페이지에서 다시 열지 않는다. 여는 순간 빈 DB가
// 새로 생기기 때문이다. 지우기 전에 시작한 재생이나 옮기기가 뒤늦게 열면 로그아웃한 뒤에도
// DB가 남는다. 로그인과 사용자 id가 확인된 /api/auth 응답(auth.ts)과 계정 대조
// (offline-runtime.tsx)가 allowOfflineDbReopen()으로 푼다.
let reopenBlocked = false;

/** 로그인이 확인된 뒤 부른다. 정리로 막아 둔 DB 열기를 다시 허용한다. */
export function allowOfflineDbReopen(): void {
  reopenBlocked = false;
}

function forgetConnection(db: IDBDatabase | null): void {
  if (db !== null && openedDb !== db) return;
  openedDb = null;
  dbPromise = null;
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  // 오프라인 모드를 끈 빌드(flag.ts)에서는 열지 않는다. 런타임이 지운 DB가 되살아나지 않게 하는
  // 마지막 방어선이다(호출부는 꺼져 있으면 여기까지 오지 않는다).
  if (OFFLINE_MODE_OFF) return Promise.reject(new Error("offline mode is turned off"));
  if (reopenBlocked) {
    return Promise.reject(new Error("offline-db was deleted on this page; reopening waits for a confirmed login"));
  }
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
      openedDb = db;
      // 다른 탭이 DB를 지우려 하면(로그아웃) 연결을 놓아 준다. 다음 호출이 다시 연다.
      db.onversionchange = () => {
        db.close();
        forgetConnection(db);
      };
      // 브라우저가 연결을 스스로 닫는 경우(iPad Safari가 백그라운드 뒤에 닫기도 한다).
      // 잊어 두면 다음 호출이 다시 연다.
      db.onclose = () => {
        console.warn("[offline] offline-db connection was closed by the browser");
        forgetConnection(db);
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
  dbPromise = opening.catch((error: unknown) => {
    forgetConnection(null);
    throw error;
  });
  return dbPromise;
}

/**
 * 연결이 끊겨 다시 열면 되는 오류인가. InvalidStateError: 이미 닫힌 연결. UnknownError: WebKit이
 * IndexedDB 서버와의 연결을 잃었을 때("Connection to Indexed Database server lost") 내는 오류.
 */
function isConnectionLost(error: unknown): boolean {
  return (
    typeof DOMException !== "undefined" &&
    error instanceof DOMException &&
    (error.name === "InvalidStateError" || error.name === "UnknownError")
  );
}

/**
 * 트랜잭션 하나를 연다. 연결이 이미 닫혀 있으면 연결을 잊고 한 번만 다시 열어 재시도한다
 * (onclose가 오지 않는 브라우저 대비).
 */
async function openTransaction(name: StoreName, mode: IDBTransactionMode): Promise<IDBTransaction> {
  const db = await openDb();
  try {
    return db.transaction(name, mode);
  } catch (error) {
    if (!isConnectionLost(error)) throw error;
    console.warn("[offline] offline-db connection was closed, reopening once", error);
    forgetConnection(db);
    return (await openDb()).transaction(name, mode);
  }
}

function runTransaction<T>(tx: IDBTransaction, name: StoreName, body: (store: IDBObjectStore) => () => T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const read = body(tx.objectStore(name));
    tx.oncomplete = () => resolve(read());
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/**
 * 한 트랜잭션 안에서 body가 요청을 걸고, 트랜잭션이 끝나면 body가 돌려준 함수로 결과를 읽는다.
 * 여러 요청(읽고 조건부로 지우기)을 하나의 트랜잭션으로 묶을 때 쓴다. 트랜잭션이 연결 끊김으로
 * 실패하면 그 연결을 잊고 한 번만 다시 열어 처음부터 다시 한다(body는 다시 실행해도 결과가 같은
 * 요청만 건다).
 */
async function transact<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  body: (store: IDBObjectStore) => () => T,
): Promise<T> {
  const tx = await openTransaction(name, mode);
  try {
    return await runTransaction(tx, name, body);
  } catch (error) {
    if (!isConnectionLost(error)) throw error;
    console.warn("[offline] offline-db transaction lost its connection, reopening once", error);
    forgetConnection(tx.db);
    return runTransaction(await openTransaction(name, mode), name, body);
  }
}

function run<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return transact(name, mode, (store) => {
    const request = action(store);
    return () => request.result;
  });
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

/**
 * 읽기와 조건부 삭제를 한 readwrite 트랜잭션으로 한다. 그 사이에 다른 쓰기가 끼어들어
 * 새 값이 지워지는 일이 없다. 지웠으면 true.
 */
export function idbDeleteIf<T>(
  name: StoreName,
  id: string,
  shouldDelete: (current: T | undefined) => boolean,
): Promise<boolean> {
  return transact(name, "readwrite", (store) => {
    let deleted = false;
    const read = store.get(id) as IDBRequest<T | undefined>;
    read.onsuccess = () => {
      if (shouldDelete(read.result)) {
        store.delete(id);
        deleted = true;
      }
    };
    return () => deleted;
  });
}

/**
 * 읽고 바꾸거나 지우기를 한 readwrite 트랜잭션으로 한다. update가 undefined를 돌려주면 그대로
 * 두고, null이면 지우고, 값이면 그 값으로 쓴다. 돌려주는 값은 한 일.
 */
export function idbUpdateIf<T extends { id: string }>(
  name: StoreName,
  id: string,
  update: (current: T | undefined) => T | null | undefined,
): Promise<"kept" | "updated" | "deleted"> {
  return transact(name, "readwrite", (store) => {
    let outcome: "kept" | "updated" | "deleted" = "kept";
    const read = store.get(id) as IDBRequest<T | undefined>;
    read.onsuccess = () => {
      const next = update(read.result);
      if (next === undefined) return;
      if (next === null) {
        store.delete(id);
        outcome = "deleted";
      } else {
        store.put(next);
        outcome = "updated";
      }
    };
    return () => outcome;
  });
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
  // 닫기보다 먼저 막는다. 닫힌 연결을 만난 작업이 다시 열어 DB를 새로 만들지 않게 한다.
  reopenBlocked = true;
  if (dbPromise) {
    try {
      (await dbPromise).close();
    } catch (error) {
      // 열기에 실패한 연결은 닫을 것이 없다. 그대로 삭제로 넘어간다.
      console.warn("[offline] closing offline-db before delete failed", error);
    }
    forgetConnection(null);
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
