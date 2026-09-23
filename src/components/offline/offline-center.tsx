"use client";

// 오프라인 저장 화면(/offline, 설계 3.3). 온라인이면 "전체 받기"와 저장본 관리, 오프라인이면
// 서비스 워커가 개인 화면 대신 보여 주는 목차다. 목차에는 Cache Storage에 실제로 있는
// 주소만 보인다(지금 빌드와 옛 빌드 캐시의 합집합). 제목은 /offline-manifest.json(오프라인이면
// 저장해 둔 사본)에서 온다.
// ?from=<경로>는 서비스 워커가 붙인다. 저장 안 된 콘텐츠면 "아직 저장되지 않았어요",
// 개인 화면이면 "오프라인에서는 열 수 없어요"를 먼저 보여 준다.
// 새 배포 뒤 옛 저장본을 옮기는 동안(migration.ts)은 "새 버전으로 다시 받는 중"을 보이고
// 전체 받기와 저장본 지우기를 막는다.
// 목차 링크는 prefetch를 끈다(백 개가 넘는 링크의 RSC 미리 받기를 막는다). 오프라인에서
// 누르면 offline-runtime.tsx가 전체 이동으로 바꿔 서비스 워커가 저장본을 준다.

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Download, Trash2 } from "lucide-react";
import { parseLastLesson } from "@/components/continue-reading-card";
import { listCachedPaths } from "@/lib/offline/cache";
import { useOnline } from "@/lib/offline/connectivity";
import { getMeta } from "@/lib/offline/db";
import {
  clearSavedPages,
  loadManifest,
  startDownload,
  useDownloadState,
  type DownloadProgress,
  type DownloadState,
  type DownloadStopReason,
} from "@/lib/offline/download";
import { useMigrationState } from "@/lib/offline/migration";
import { classifyOfflinePath, formatBytes, type OfflineManifest } from "@/lib/offline/offline-logic";
import { useQueueCount } from "@/lib/offline/queue";
import { useNeedsLogin } from "@/lib/offline/sync";

type Overview = {
  manifest: OfflineManifest | null;
  cached: ReadonlySet<string>;
  lastDownloadAt: number | null;
  usage: number | null;
};

const EMPTY_OVERVIEW: Overview = { manifest: null, cached: new Set(), lastDownloadAt: null, usage: null };

const PHASE_LABEL: Record<DownloadProgress["phase"], string> = {
  pages: "페이지",
  files: "화면 파일",
  data: "내 진도와 메모",
};

async function readStorageUsage(): Promise<number | null> {
  if (!navigator.storage?.estimate) return null;
  try {
    return (await navigator.storage.estimate()).usage ?? null;
  } catch (error) {
    console.warn("[offline] reading storage estimate failed", error);
    return null;
  }
}

async function loadOverview(): Promise<Overview> {
  const [manifest, cached, lastDownloadAt, usage] = await Promise.all([
    loadManifest(),
    listCachedPaths(),
    getMeta<number>("lastDownloadAt").catch((error: unknown) => {
      console.warn("[offline] reading lastDownloadAt failed", error);
      return undefined;
    }),
    readStorageUsage(),
  ]);
  return { manifest, cached, lastDownloadAt: lastDownloadAt ?? null, usage };
}

function subscribeNothing(): () => void {
  return () => {};
}

function readFromParam(): string | null {
  return new URLSearchParams(window.location.search).get("from");
}

function readLastLessonRaw(): string | null {
  try {
    return localStorage.getItem("lastLesson");
  } catch (error) {
    console.warn("[offline] reading last lesson failed", error);
    return null;
  }
}

function readNothing(): null {
  return null;
}

const STOP_MESSAGE: Record<DownloadStopReason, string> = {
  login: "로그인이 풀렸어요. 다시 로그인한 뒤 받아 주세요.",
  network: "받지 못했어요. 연결을 확인하고 다시 눌러 주세요.",
  quota: "기기 저장 공간이 부족해서 받기를 멈췄어요. 공간을 비운 뒤 다시 눌러 주세요.",
  wiped: "받는 중에 저장본이 지워져서 받기를 멈췄어요.",
  account: "받는 중에 계정이 바뀌어서 받기를 멈췄어요.",
  busy: "이미 받는 중이에요.",
};

function describeProgress(progress: DownloadProgress): string {
  const failed = progress.failed > 0 ? ` | 받지 못한 항목 ${progress.failed}개` : "";
  return `${PHASE_LABEL[progress.phase]} ${progress.done}/${progress.total} | 받은 용량 ${formatBytes(progress.bytes)}${failed}`;
}

/** 끝난 뒤의 결과 문구. 도는 중이거나 시작 전이면 빈 문자열. */
function describeResult(download: DownloadState): string {
  if (download.status === "error") return STOP_MESSAGE[download.reason ?? "network"];
  if (download.status !== "done") return "";
  const failed = download.progress?.failed ?? 0;
  return failed === 0 ? "다 받았어요." : `받지 못한 항목이 ${failed}개 있어요. 전체 받기를 다시 눌러 주세요.`;
}

/**
 * 화면 읽기 프로그램에 알릴 문구. 단계가 바뀔 때와 끝났을 때만 바뀐다(진행 숫자마다 읽지 않게).
 */
function describeAnnouncement(download: DownloadState): string {
  if (download.status === "running") {
    return download.progress ? `${PHASE_LABEL[download.progress.phase]} 받는 중` : "받기를 시작했어요";
  }
  return describeResult(download);
}

export function OfflineCenter() {
  const online = useOnline();
  const pending = useQueueCount();
  const needsLogin = useNeedsLogin();
  const migration = useMigrationState();
  const from = useSyncExternalStore(subscribeNothing, readFromParam, readNothing);
  const lastLesson = parseLastLesson(useSyncExternalStore(subscribeNothing, readLastLessonRaw, readNothing));
  const [overview, setOverview] = useState<Overview>(EMPTY_OVERVIEW);
  const [reloadKey, setReloadKey] = useState(0);
  // 전체 받기는 모듈의 공유 저장소에서 읽는다(화면을 떠났다 돌아와도 진행이 이어져 보인다).
  const download = useDownloadState();
  const { status, progress, persisted } = download;

  // 옮기기나 전체 받기의 상태가 바뀌면(끝나면) 저장 현황을 다시 읽는다.
  useEffect(() => {
    let active = true;
    loadOverview().then((next) => {
      if (active) setOverview(next);
    });
    return () => {
      active = false;
    };
  }, [reloadKey, migration.status, status]);

  const migrating = migration.status === "running";
  const busy = status === "running" || migrating;

  async function handleClear() {
    if (!window.confirm("기기에 저장한 페이지를 모두 지울까요? 동기화를 기다리는 체크와 메모는 지우지 않아요.")) return;
    try {
      await clearSavedPages();
    } catch (error) {
      console.warn("[offline] clearing saved pages failed", error);
    }
    setReloadKey((key) => key + 1);
  }

  const allItems = overview.manifest?.groups.flatMap((group) => group.items) ?? [];
  const savedCount = allItems.filter((entry) => overview.cached.has(entry.url)).length;
  const groups = (overview.manifest?.groups ?? [])
    .map((group) => ({ label: group.label, items: group.items.filter((entry) => overview.cached.has(entry.url)) }))
    .filter((group) => group.items.length > 0);
  const lastLessonHref = lastLesson ? `/lesson/${encodeURIComponent(lastLesson.slug)}` : null;
  const canContinue = lastLessonHref !== null && (online || overview.cached.has(lastLessonHref));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-display font-black break-keep">오프라인 저장</h1>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          인터넷이 없을 때도 저장한 레슨을 읽고, 완료 체크와 메모를 남길 수 있어요. 연결되면 자동으로 서버와 맞춰요.
        </p>
      </header>

      {from ? (
        <p data-offline-missing className="panel break-keep p-4 text-body font-normal">
          {classifyOfflinePath(from) === "content"
            ? "이 페이지는 아직 기기에 저장되지 않았어요. 인터넷에 연결되면 열 수 있어요."
            : "이 화면은 내 정보를 서버에서 바로 그려서 오프라인에서는 열 수 없어요. 아래 저장된 콘텐츠를 읽어 보세요."}
        </p>
      ) : null}

      <section className="panel flex flex-col gap-2 p-5">
        <h2 className="text-heading font-extrabold">동기화</h2>
        <p className="break-keep text-body font-normal">
          {pending > 0
            ? `동기화를 기다리는 체크와 메모가 ${pending}개 있어요. 연결되면 자동으로 보내요.`
            : "동기화를 기다리는 변경이 없어요."}
        </p>
        {needsLogin ? (
          <p className="break-keep text-body font-bold text-destructive dark:text-destructive-dark">
            다시 로그인하면 동기화돼요.
          </p>
        ) : null}
        {canContinue && lastLesson && lastLessonHref ? (
          <Link
            href={lastLessonHref}
            prefetch={false}
            className="nav-link tap-feedback inline-flex min-h-11 w-fit items-center text-body font-bold text-accent dark:text-accent-dark"
          >
            이어서 읽기: {lastLesson.title}
          </Link>
        ) : null}
      </section>

      <section data-offline-status={status} className="panel flex flex-col gap-3 p-5">
        <h2 className="text-heading font-extrabold">기기에 저장하기</h2>
        <p data-offline-count data-saved={savedCount} data-total={allItems.length} className="text-body font-normal">
          저장된 페이지 {savedCount}/{allItems.length}
          {overview.usage !== null ? ` | 사용 중인 기기 공간 약 ${formatBytes(overview.usage)}` : ""}
        </p>
        {overview.lastDownloadAt !== null ? (
          <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            마지막으로 받은 시각: {new Date(overview.lastDownloadAt).toLocaleString("ko-KR")}
          </p>
        ) : null}
        {migration.status === "running" ? (
          <p
            data-offline-migrating
            className="break-keep text-body font-bold text-accent dark:text-accent-dark"
          >
            새 버전으로 다시 받는 중 {migration.done}/{migration.total}
          </p>
        ) : null}
        {migration.status === "error" ? (
          <p
            data-offline-migration-error
            className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark"
          >
            새 버전으로 옮기지 못한 저장본이 있어요. 전체 받기를 누르면 새로 받을 수 있어요.
          </p>
        ) : null}
        {online ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-offline-download
              onClick={startDownload}
              disabled={busy}
              aria-busy={status === "running"}
              className="btn-action tap-feedback min-h-11 text-body"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
              {status === "running" ? "받는 중…" : "전체 받기"}
            </button>
            <button
              type="button"
              onClick={() => void handleClear()}
              disabled={busy}
              className="btn tap-feedback min-h-11 text-body"
            >
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              저장본 지우기
            </button>
          </div>
        ) : (
          <p className="break-keep text-body font-normal">
            지금은 오프라인이에요. 새로 받기는 인터넷에 연결된 뒤에 할 수 있어요.
          </p>
        )}
        {status === "running" && progress ? (
          <div
            role="progressbar"
            aria-label={`${PHASE_LABEL[progress.phase]} 받기`}
            aria-valuenow={progress.done}
            aria-valuemin={0}
            aria-valuemax={progress.total}
            className="h-2 w-full overflow-hidden border border-line bg-surface-2 dark:border-line-dark dark:bg-surface-2-dark"
          >
            <div
              className="h-full bg-action dark:bg-action-dark"
              style={{ width: `${progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0}%` }}
            />
          </div>
        ) : null}
        <p data-offline-progress className="break-keep text-label font-normal">
          {progress ? describeProgress(progress) : ""}
          {progress && status !== "running" && describeResult(download) ? " | " : ""}
          {describeResult(download)}
        </p>
        <p role="status" aria-live="polite" className="sr-only">
          {migrating ? "새 버전으로 다시 받는 중" : describeAnnouncement(download)}
        </p>
        {persisted === false ? (
          <p className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            브라우저가 저장본 보호 요청을 받아 주지 않았어요. 홈 화면 앱으로 쓰면 더 오래 유지돼요.
          </p>
        ) : null}
        <p className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          그림이 움직이는 편은 온라인에서 한 번 열어 두면 오프라인에서도 움직여요.
        </p>
        <p className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          아이패드에서는 Safari의 공유 버튼, 홈 화면에 추가로 설치한 앱으로 써야 저장본이 오래 유지돼요.
        </p>
      </section>

      <section data-offline-toc className="flex flex-col gap-4">
        <h2 className="text-heading font-extrabold">저장된 콘텐츠</h2>
        {groups.length === 0 ? (
          <p className="break-keep text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            아직 저장한 페이지가 없어요.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <h3 className="text-body font-extrabold">
                {group.label}{" "}
                <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {group.items.length}
                </span>
              </h3>
              <ul className="panel flex flex-col p-2">
                {group.items.map((entry) => (
                  <li key={entry.url}>
                    <Link
                      href={entry.url}
                      prefetch={false}
                      className="nav-link tap-feedback flex min-h-11 items-center break-keep px-3 text-body font-normal"
                    >
                      {entry.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
