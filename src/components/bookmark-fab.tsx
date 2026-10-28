"use client";

// 좌하단 책갈피 버튼의 겉모습 — 레슨 책갈피(page-bookmark.tsx)와 책으로 읽기
// 책갈피(book-bookmark.tsx)가 같이 쓴다. 저장·이동 로직은 각자 갖고, 여기서는 버튼
// 하나와 작은 메뉴만 그린다.
//
// 버튼은 하나다(2026-10-29 정리). 아직 안 꽂았으면 누르는 즉시 꽂고, 꽂혀 있으면 위로
// "책갈피로 이동 / 여기로 옮기기" 메뉴를 연다. 폰에서는 아이콘만 보이는 44px 정사각이라
// 가운데 독서 도우미, 오른쪽 맨 위로 버튼과 같은 줄에 같은 크기로 선다. 넓은 화면(sm+)에서는
// "책갈피" 글자가 붙는다. 안내 문구(flash)는 버튼 위에 떠서 옆 버튼을 가리지 않는다.

import { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkPlus, CornerDownRight } from "lucide-react";

export function BookmarkFab({
  placed,
  placedTitle,
  pending,
  canPlace,
  disabledHint,
  flash,
  onPlace,
  onGoTo,
}: {
  placed: boolean;
  /** 꽂힌 자리 이름(메뉴의 "책갈피로 이동" 아래 작게 보인다). 없으면 생략. */
  placedTitle?: string;
  pending: boolean;
  /** false면 꽂기/옮기기를 잠근다(오프라인 등). 이동은 된다. */
  canPlace: boolean;
  disabledHint?: string;
  flash: string | null;
  onPlace: () => void;
  onGoTo: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 메뉴 바깥을 누르거나 Esc면 닫는다.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onMain = () => {
    if (placed) setOpen((v) => !v);
    else onPlace();
  };

  const label = placed ? "책갈피 메뉴" : "책갈피 꽂기";

  return (
    <div ref={rootRef} data-print-hide className="bookmark-fab">
      {flash ? (
        <span role="status" aria-live="polite" className="bookmark-fab-flash text-label font-semibold">
          {flash}
        </span>
      ) : null}

      {open && placed ? (
        <div role="menu" aria-label="책갈피" className="bookmark-fab-menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onGoTo();
            }}
            className="bookmark-fab-item tap-feedback"
          >
            <CornerDownRight className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex min-w-0 flex-col items-start">
              <span>책갈피로 이동</span>
              {placedTitle ? (
                <span className="bookmark-fab-item-sub">{placedTitle}</span>
              ) : null}
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={pending || !canPlace}
            title={canPlace ? undefined : disabledHint}
            onClick={() => {
              setOpen(false);
              onPlace();
            }}
            className="bookmark-fab-item tap-feedback"
          >
            <BookmarkPlus className="size-4 shrink-0" aria-hidden="true" />
            <span>여기로 옮기기</span>
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onMain}
        disabled={!placed && (pending || !canPlace)}
        aria-label={label}
        aria-haspopup={placed ? "menu" : undefined}
        aria-expanded={placed ? open : undefined}
        title={!placed && !canPlace ? disabledHint : label}
        className="btn bookmark-fab-btn tap-feedback text-label"
      >
        <Bookmark className={`size-5 shrink-0${placed ? " fill-current" : ""}`} aria-hidden="true" />
        <span className="hidden sm:inline">책갈피</span>
      </button>
    </div>
  );
}
