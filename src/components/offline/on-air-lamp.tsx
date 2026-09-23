"use client";

// 헤더의 ON AIR 램프(설계 3.5). 온라인이면 "ON AIR"와 천천히 숨 쉬는 불빛, 오프라인이면
// "OFF AIR"와 또렷한 깜빡임. 동기화를 기다리는 변경이 있으면 램프 위에 개수 배지를
// 얹는다. 누르면 오프라인 저장 화면(/offline)으로 간다.
//
// 640px 미만에서는 글자를 숨기고 램프만 보인다. 375px 폭에서 로고, 램프, 햄버거, 테마
// 버튼이 한 줄에 들어가는 최대 폭이다(글자까지 넣으면 헤더가 두 줄로 접힌다). 그래서
// 640px 미만에서는 배지를 흐름 밖(absolute) 램프 오른쪽 위에 얹어 폭을 늘리지 않고,
// 640px 이상에서는 글자 뒤에 나란히 둔다(얹으면 "AIR" 글자를 가린다). 상태 변화는 화면 밖
// 라이브 영역이 알린다.

import Link from "next/link";
import { useOnline } from "@/lib/offline/connectivity";
import { useQueueCount } from "@/lib/offline/queue";
import { useNeedsLogin } from "@/lib/offline/sync";

export function OnAirLamp() {
  const online = useOnline();
  const pending = useQueueCount();
  const needsLogin = useNeedsLogin();

  const parts = [online ? "온라인" : "오프라인"];
  if (pending > 0) parts.push(`동기화 대기 ${pending}개`);
  if (needsLogin) parts.push("다시 로그인하면 동기화돼요");
  const description = `${parts.join(", ")}. 오프라인 저장 화면 열기`;

  return (
    <>
      <Link
        href="/offline"
        prefetch={false}
        data-onair={online ? "on" : "off"}
        data-pending={pending}
        aria-label={description}
        title={description}
        className="tap-feedback relative flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 px-2 text-label font-bold text-badge-neutral-text hover:bg-badge-neutral-bg dark:text-badge-neutral-text-dark dark:hover:bg-badge-neutral-bg-dark"
      >
        <span
          aria-hidden="true"
          data-state={online ? "on" : "off"}
          className={`onair-lamp h-2.5 w-2.5 shrink-0 ${
            online ? "text-onair dark:text-onair-dark" : "text-offair dark:text-offair-dark"
          }`}
        />
        <span aria-hidden="true" className="hidden sm:inline">
          {online ? "ON AIR" : "OFF AIR"}
        </span>
        {pending > 0 ? (
          <span
            aria-hidden="true"
            data-onair-badge
            className="absolute -right-0.5 -top-1 flex h-5 min-w-5 items-center justify-center bg-foreground px-1 text-label font-bold leading-none text-background sm:static dark:bg-foreground-dark dark:text-background-dark"
          >
            {pending}
          </span>
        ) : null}
      </Link>
      <span role="status" aria-live="polite" className="sr-only">
        {online ? "온라인 상태예요." : "오프라인 상태예요. 저장한 페이지만 열 수 있어요."}
      </span>
    </>
  );
}
