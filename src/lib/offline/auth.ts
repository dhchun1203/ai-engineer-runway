// /api/auth 조회를 한 곳에서 한다. 오프라인 런타임(계정 대조), 내비(로그인 라벨), 동기화,
// 전체 받기, 옛 저장본 옮기기가 함께 쓴다. 경로를 옮길 때마다 런타임과 내비가 같은 순간
// 부르므로, 떠나 있는 요청이 있으면 그 결과를 같이 쓰고, 같은 경로에서 받은 지 5초 안이면
// 받은 결과를 다시 쓴다. 경로가 바뀌면 새로 묻는다(로그인이나 로그아웃 뒤 첫 화면이 옛 답을
// 쓰지 않게). 실패한 조회는 다시 쓰지 않는다. fresh는 방금 상태가 바뀌었을 수 있어 꼭 새로
// 물어야 하는 곳(로그아웃 재확인, 재생 실패 뒤 확인, 받기 끝 계정 확인)이 쓴다.
//
// 응답이 로그인과 사용자 id를 알려 주면
//   1) 로그아웃 정리로 막아 둔 DB 열기를 푼다(db.ts allowOfflineDbReopen). 같은 경로에서 다시
//      로그인해도 풀린다.
//   2) 이 페이지에서 확인된 계정으로 기억한다. 대기열 항목의 주인 판정(다른 계정이 남긴
//      변경을 얹거나 보내지 않기)에 쓴다.
// 정리(wipe.ts)는 invalidateAuthCache()로 기억과 다시 쓰기를 비운다. 정리 전에 떠난 요청의
// 늦은 응답은 기억에 반영하지 않는다(세대 번호로 가린다).

import { isOnline } from "./connectivity";
import { allowOfflineDbReopen } from "./db";
import { parseAuthState, type AuthState } from "./offline-logic";
import { withTimeout } from "./timeout";

const REUSE_MS = 5_000;
// 확인된 계정을 모를 때 서버에 물어보는 최대 시간(화면을 그리는 길에서 쓴다).
const ACCOUNT_LOOKUP_TIMEOUT_MS = 3_000;

type Entry = {
  path: string;
  generation: number;
  promise: Promise<unknown>;
  settledAt: number | null;
};

let entry: Entry | null = null;
let generation = 0;
let confirmedUserId: string | null = null;

function currentPath(): string {
  return typeof window === "undefined" ? "" : window.location.pathname;
}

function remember(json: unknown): void {
  const state = parseAuthState(json);
  if (state.loggedIn && state.userId) {
    confirmedUserId = state.userId;
    allowOfflineDbReopen();
  } else {
    confirmedUserId = null;
  }
}

async function requestAuthJson(requestGeneration: number): Promise<unknown> {
  try {
    const res = await fetch("/api/auth", { cache: "no-store" });
    if (!res.ok) {
      console.warn("[offline] auth state request returned", res.status);
      return null;
    }
    const json: unknown = await res.json();
    if (requestGeneration === generation) remember(json);
    return json;
  } catch (error) {
    // 오프라인에서 나는 네트워크 오류(TypeError)는 예상된 실패라 경고로 남기지 않는다.
    const expectedOffline = error instanceof TypeError && typeof navigator !== "undefined" && !navigator.onLine;
    if (!expectedOffline) console.warn("[offline] fetching auth state failed", error);
    return null;
  }
}

function reusable(current: Entry | null, path: string): current is Entry {
  if (current === null || current.generation !== generation || current.path !== path) return false;
  return current.settledAt === null || Date.now() - current.settledAt < REUSE_MS;
}

/** /api/auth의 JSON 그대로. 서버에 닿지 않거나 응답이 이상하면 null. */
export function fetchAuthJson(options: { fresh?: boolean } = {}): Promise<unknown> {
  const path = currentPath();
  if (!options.fresh && reusable(entry, path)) return entry.promise;
  const created: Entry = { path, generation, promise: requestAuthJson(generation), settledAt: null };
  entry = created;
  void created.promise.then((json) => {
    if (entry !== created) return;
    if (json === null) entry = null;
    else created.settledAt = Date.now();
  });
  return created.promise;
}

/** 로그인 상태 조회. 서버에 닿지 않으면 null. */
export async function fetchAuthState(options: { fresh?: boolean } = {}): Promise<AuthState | null> {
  const json = await fetchAuthJson(options);
  return json === null ? null : parseAuthState(json);
}

/** 정리(로그아웃, 계정 전환) 뒤에 부른다. 기억한 계정과 다시 쓸 응답을 버린다. */
export function invalidateAuthCache(): void {
  generation += 1;
  entry = null;
  confirmedUserId = null;
}

/**
 * 지금 로그인한 계정 id. 이 페이지에서 이미 확인했으면 그 값, 아니면 온라인일 때만 서버에
 * 묻는다(시간 제한 있음). 모르면 null(호출부가 기기 저장본의 주인으로 대신한다).
 */
export async function confirmedAccountId(): Promise<string | null> {
  if (confirmedUserId !== null) return confirmedUserId;
  if (!isOnline()) return null;
  const auth = await withTimeout(fetchAuthState(), ACCOUNT_LOOKUP_TIMEOUT_MS, null, "looking up the signed-in account");
  return auth !== null && auth.loggedIn ? auth.userId : null;
}
