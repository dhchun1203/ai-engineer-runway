"use client";

// 18회차 월 매출 쿼리 리플레이. "종목별 월 매출이 100만 원 이상인 달" 쿼리가 절마다 어떻게 실행되는지
// 한 단계씩 보여 준다. LEFT JOIN 풀이와 INNER JOIN 풀이 두 가지를 고를 수 있다.
// 강좌별, 월별 수강 기록 수(취소 포함)와 그룹 합계는 사용자가 시드 데이터에서 실행한 값이다.
// 같은 건수와 합계로 표를 만들어 PostgreSQL 엔진(PGlite)에서 두 쿼리를 실행해 189행, 17그룹(LEFT),
// 200행, 188행, 16그룹(INNER), 최종 4행과 정렬 전후 순서가 이 그림과 같은 것을 확인했다.

import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const MONTHS = ["2026-08", "2026-09", "2026-10", "2026-11"] as const;
type Month = (typeof MONTHS)[number];

const MONTH_BG: Record<Month, string> = {
  "2026-08": "bg-action dark:bg-action-dark",
  "2026-09": "bg-[#0f8a7e] dark:bg-[#4fc2b2]",
  "2026-10": "bg-[#7c4dcc] dark:bg-[#b39af0]",
  "2026-11": "bg-accent dark:bg-accent-dark",
};
const MONTH_TOP: Record<Month, string> = {
  "2026-08": "border-t-action dark:border-t-action-dark",
  "2026-09": "border-t-[#0f8a7e] dark:border-t-[#4fc2b2]",
  "2026-10": "border-t-[#7c4dcc] dark:border-t-[#b39af0]",
  "2026-11": "border-t-accent dark:border-t-accent-dark",
};

const SPORTS = [
  { id: 1, name: "수영" },
  { id: 2, name: "헬스" },
  { id: 3, name: "골프연습" },
  { id: 4, name: "스포츠댄스" },
];
const sportName = (id: number) => SPORTS.find((s) => s.id === id)?.name ?? "";

// [course_id, 이름, sport_id, { 월: [취소 아님, 취소] }]
type Course = [number, string, number, Partial<Record<Month, [number, number]>>];
const COURSES: Course[] = [
  [1, "수영 초급 새벽반", 1, { "2026-08": [1, 1], "2026-09": [3, 0], "2026-10": [3, 0], "2026-11": [3, 0] }],
  [3, "수영 중급 저녁반", 1, { "2026-08": [5, 0], "2026-09": [2, 0], "2026-10": [5, 0], "2026-11": [5, 0] }],
  [4, "수영 상급 저녁반", 1, { "2026-08": [3, 1], "2026-09": [4, 0], "2026-10": [4, 0], "2026-11": [5, 0] }],
  [5, "아쿠아로빅", 1, { "2026-08": [2, 0], "2026-09": [3, 0], "2026-10": [1, 0], "2026-11": [2, 0] }],
  [14, "수영 마스터즈반", 1, {}],
  [2, "헬스 자유이용", 2, { "2026-08": [2, 0], "2026-09": [4, 1], "2026-10": [4, 0], "2026-11": [5, 0] }],
  [6, "헬스 PT 그룹반", 2, { "2026-08": [1, 0], "2026-09": [2, 1], "2026-10": [3, 0], "2026-11": [4, 0] }],
  [7, "근력운동 입문반", 2, { "2026-08": [4, 0], "2026-09": [4, 1], "2026-10": [5, 0], "2026-11": [4, 0] }],
  [8, "골프 입문반", 3, { "2026-08": [6, 0], "2026-09": [5, 1], "2026-10": [4, 1], "2026-11": [6, 0] }],
  [9, "골프 중급반", 3, { "2026-08": [1, 0], "2026-09": [1, 0], "2026-10": [1, 0], "2026-11": [4, 0] }],
  [10, "골프 타석 자유이용", 3, { "2026-08": [5, 1], "2026-09": [4, 0], "2026-10": [5, 0], "2026-11": [2, 0] }],
  [11, "라틴댄스 초급", 4, { "2026-08": [5, 0], "2026-09": [3, 0], "2026-10": [5, 0], "2026-11": [5, 0] }],
  [12, "볼룸댄스 중급", 4, { "2026-08": [3, 1], "2026-09": [2, 1], "2026-10": [1, 1], "2026-11": [4, 0] }],
  [13, "실버 스포츠댄스", 4, { "2026-08": [4, 0], "2026-09": [6, 0], "2026-10": [6, 1], "2026-11": [7, 0] }],
];

// GROUP BY 결과 [sport_id, 수강월, COUNT(*), SUM]. 수강월 null 은 LEFT JOIN 이 남긴 마스터즈반 행의 그룹.
type Group = [number, Month | null, number, number | null];
const GROUPS: Group[] = [
  [1, "2026-08", 11, 792500], [1, "2026-09", 12, 875000], [1, "2026-10", 13, 947500], [1, "2026-11", 15, 1092500], [1, null, 1, null],
  [2, "2026-08", 7, 436000], [2, "2026-09", 10, 686000], [2, "2026-10", 12, 851000], [2, "2026-11", 13, 994000],
  [3, "2026-08", 12, 1264000], [3, "2026-09", 10, 1018000], [3, "2026-10", 10, 997000], [3, "2026-11", 12, 1384000],
  [4, "2026-08", 12, 631000], [4, "2026-09", 11, 538000], [4, "2026-10", 12, 581000], [4, "2026-11", 16, 816000],
];
const PASSING = GROUPS.filter((g) => g[3] !== null && g[3] >= 1000000);
const SORTED = [...PASSING].sort(
  (a, b) => sportName(a[0]).localeCompare(sportName(b[0]), "ko") || String(a[1]).localeCompare(String(b[1])),
);

type Kind =
  | "sports" | "lcourses" | "lenroll"
  | "ienroll" | "icourses" | "isports" | "iwhere"
  | "group" | "having" | "select" | "order";
type Stage = { k: Kind; title: string; badge: string; text: string; withNull?: boolean };
type Mode = { label: string; sql: { t: string; s: number }[]; stages: Stage[] };

const MODES: Record<"left" | "inner", Mode> = {
  left: {
    label: "LEFT JOIN 풀이",
    sql: [
      { t: "SELECT", s: 6 },
      { t: "    s.sport_name AS 종목,", s: 6 },
      { t: "    e.enroll_month AS 수강월,", s: 6 },
      { t: "    COUNT(*) AS 수강인원,", s: 6 },
      { t: "    SUM(e.pay_amount) AS 매출", s: 6 },
      { t: "FROM sports s", s: 1 },
      { t: "LEFT JOIN courses c", s: 2 },
      { t: "    ON (c.sport_id = s.sport_id)", s: 2 },
      { t: "LEFT JOIN enrollments e", s: 3 },
      { t: "    ON (e.course_id = c.course_id", s: 3 },
      { t: "        AND e.status <> '취소')", s: 3 },
      { t: "GROUP BY s.sport_id, e.enroll_month", s: 4 },
      { t: "HAVING SUM(e.pay_amount) >= 1000000", s: 5 },
      { t: "ORDER BY s.sport_name", s: 7 },
      { t: '         COLLATE "ko-x-icu",', s: 7 },
      { t: "         수강월;", s: 7 },
    ],
    stages: [
      { k: "sports", title: "1. FROM sports", badge: "4행", text: "`sports`에서 시작해요. 종목 4개가 출발점이에요." },
      {
        k: "lcourses", title: "2. LEFT JOIN courses", badge: "14행",
        text: "종목마다 그 종목의 강좌를 옆에 붙여요. 종목 하나에 강좌가 여러 개라 행이 14개로 늘어나요. 강좌가 없는 종목이 있었다면 버려지지 않고 강좌 칸이 NULL인 행으로 남았을 거예요.",
      },
      {
        k: "lenroll", title: "3. LEFT JOIN enrollments", badge: "189행 = 기록 188 + NULL 1", withNull: true,
        text: "강좌마다 수강 기록을 붙여요. 점 하나가 기록 한 건이고 색은 수강월이에요. 취소 기록 12건은 `ON` 조건 `e.status <> '취소'`에 걸려 짝이 되지 못해요. 수영 마스터즈반은 붙을 기록이 없지만 `LEFT JOIN`이라 버려지지 않고, `enrollments` 칸이 전부 NULL인 행 1개로 남아요.",
      },
      {
        k: "group", title: "4. GROUP BY 종목, 수강월", badge: "17그룹", withNull: true,
        text: "같은 종목, 같은 수강월끼리 묶고 그룹마다 `COUNT(*)`와 `SUM`을 계산해요. 마스터즈반 행은 수강월이 NULL이라 따로 한 그룹이 돼요. 행이 1개라 `COUNT(*)`는 1이고, 더할 금액이 없어 `SUM`은 NULL이에요.",
      },
      {
        k: "having", title: "5. HAVING SUM >= 1,000,000", badge: "4그룹 통과", withNull: true,
        text: "매출 합계가 1,000,000 이상인 그룹만 남겨요. NULL 그룹은 `NULL >= 1000000`이 참이 아니라서 여기서 빠져요. `LEFT JOIN`이 남긴 여분의 행이 결과에 닿지 못한 이유예요.",
      },
      {
        k: "select", title: "6. SELECT", badge: "4행",
        text: "남은 그룹마다 보여 줄 열을 만들고 별칭을 붙여요. 아직 정렬 전이라 행 순서는 정해져 있지 않아요.",
      },
      {
        k: "order", title: "7. ORDER BY 종목, 수강월", badge: "최종 4행",
        text: "종목 이름 가나다순, 같으면 수강월 순으로 정렬해요. 골프연습이 수영보다 앞이라 수영 2026-11 행이 맨 아래로 내려가요. 이것이 최종 결과예요.",
      },
    ],
  },
  inner: {
    label: "INNER JOIN 풀이",
    sql: [
      { t: "SELECT", s: 7 },
      { t: "    s.sport_name AS 종목,", s: 7 },
      { t: "    e.enroll_month AS 수강월,", s: 7 },
      { t: "    COUNT(*) AS 수강인원,", s: 7 },
      { t: "    SUM(e.pay_amount) AS 매출", s: 7 },
      { t: "FROM enrollments e", s: 1 },
      { t: "JOIN courses c", s: 2 },
      { t: "    ON e.course_id = c.course_id", s: 2 },
      { t: "JOIN sports s", s: 3 },
      { t: "    ON c.sport_id = s.sport_id", s: 3 },
      { t: "WHERE e.status <> '취소'", s: 4 },
      { t: "GROUP BY s.sport_name, e.enroll_month", s: 5 },
      { t: "HAVING SUM(e.pay_amount) >= 1000000", s: 6 },
      { t: "ORDER BY 종목, 수강월;", s: 8 },
    ],
    stages: [
      {
        k: "ienroll", title: "1. FROM enrollments", badge: "200행",
        text: "이번에는 수강 기록에서 시작해요. 아직 아무것도 거르지 않아 취소 기록 12건(빨간 X)도 들어 있어요. 지금은 기록마다 `course_id`만 알고 있어요.",
      },
      {
        k: "icourses", title: "2. JOIN courses", badge: "200행",
        text: "기록마다 `course_id`가 같은 강좌를 찾아 붙여요. 이제 강좌 이름과 `sport_id`를 알아요. 기록이 하나도 없는 수영 마스터즈반은 처음부터 출발점에 없어서 NULL 행이 생기지 않아요.",
      },
      {
        k: "isports", title: "3. JOIN sports", badge: "200행",
        text: "강좌의 `sport_id`로 종목을 찾아 붙여요. 기록에서 강좌로, 강좌에서 종목으로 찾아간 거예요.",
      },
      {
        k: "iwhere", title: "4. WHERE status <> '취소'", badge: "188행",
        text: "취소 기록 12건을 걸러요. `INNER JOIN`에서는 이 조건을 `ON`에 넣든 `WHERE`에 넣든 결과가 같아요. 행 거르기라는 뜻이 잘 보이게 `WHERE`에 둬요.",
      },
      {
        k: "group", title: "5. GROUP BY 종목, 수강월", badge: "16그룹", withNull: false,
        text: "같은 종목, 같은 수강월끼리 묶어요. NULL 행이 없으니 수강월이 NULL인 그룹도 없어요. 4종목 곱하기 4개월로 16그룹이에요.",
      },
      {
        k: "having", title: "6. HAVING SUM >= 1,000,000", badge: "4그룹 통과", withNull: false,
        text: "매출 합계가 1,000,000 이상인 그룹만 남겨요. 걸러 낼 NULL 그룹이 처음부터 없어서 금액 조건만 판단해요.",
      },
      {
        k: "select", title: "7. SELECT", badge: "4행",
        text: "남은 그룹마다 보여 줄 열을 만들고 별칭을 붙여요. 아직 정렬 전이에요.",
      },
      {
        k: "order", title: "8. ORDER BY 종목, 수강월", badge: "최종 4행",
        text: "`ORDER BY`는 `SELECT` 다음이라 별칭 `종목`, `수강월`로 정렬할 수 있어요. 최종 결과는 LEFT JOIN 풀이와 똑같아요.",
      },
    ],
  },
};

// 단계가 바뀐 뒤 움직임(점 사라짐, 통과 판정, 정렬)이 시작되기까지의 시간
const AFTER_MS: Partial<Record<Kind, number>> = { lenroll: 1400, iwhere: 1000, having: 900, order: 700 };

const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
const codeChip = "rounded bg-surface-2 px-1 font-mono text-[0.9em] dark:bg-surface-2-dark";

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) =>
        i % 2 === 1 ? <code key={i} className={codeChip}>{part}</code> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

function CancelMark({ gone }: { gone: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`h-3 shrink-0 text-destructive transition-all duration-500 motion-reduce:transition-none dark:text-destructive-dark ${
        gone ? "-ml-[3px] w-0 scale-0 opacity-0" : "w-3"
      }`}
    >
      <rect x="1" y="1" width="10" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 3.5l5 5M8.5 3.5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function RecordDots({ mo, cancelGone, className = "" }: { mo: Course[3]; cancelGone: boolean; className?: string }) {
  const out: ReactNode[] = [];
  for (const m of MONTHS) {
    const [ok, x] = mo[m] ?? [0, 0];
    for (let i = 0; i < ok; i++) out.push(<i key={`${m}-o${i}`} className={`h-2 w-2 shrink-0 rounded-full @md:h-2.5 @md:w-2.5 ${MONTH_BG[m]}`} />);
    for (let i = 0; i < x; i++) out.push(<CancelMark key={`${m}-x${i}`} gone={cancelGone} />);
  }
  return <span className={`flex min-h-3.5 flex-wrap items-center gap-[2px] @md:gap-[3px] ${className}`}>{out}</span>;
}

function NullChip({ children }: { children: ReactNode }) {
  return (
    <span className={`rounded-md border-[1.5px] border-dashed border-current px-2 font-mono text-[0.75rem] font-semibold ${muted}`}>
      {children}
    </span>
  );
}

function Legend({ withNull }: { withNull: boolean }) {
  return (
    <div className={`mb-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[0.8rem] ${muted}`}>
      {MONTHS.map((m) => (
        <span key={m} className="inline-flex items-center gap-1.5">
          <i className={`h-2.5 w-2.5 rounded-full ${MONTH_BG[m]}`} />
          {m}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <CancelMark gone={false} />
        취소 기록
      </span>
      {withNull ? (
        <span className="inline-flex items-center gap-1.5">
          <NullChip>NULL</NullChip>짝 없음
        </span>
      ) : null}
    </div>
  );
}

const sportChip = "chip justify-center whitespace-nowrap px-2 py-0.5 text-[0.8rem] font-bold";
// 좁은 화면(폰)에서는 종목과 강좌 이름을 한 줄에, 기록 점을 아래 줄에 둔다. 넓으면 세 칸 한 줄.
const rowBox = "qr-enter grid min-h-[2.125rem] grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1 rounded-lg bg-background px-2 py-1 dark:bg-background-dark @md:grid-cols-[5.5rem_minmax(0,9.5rem)_minmax(0,1fr)]";
const dotsCell = "col-span-2 @md:col-span-1";

function SportRows({ withDots, cancelGone }: { withDots: boolean; cancelGone: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      {COURSES.map(([id, name, sid, mo], i) => (
        <div
          key={id}
          className={`${rowBox} ${i > 0 && COURSES[i - 1][2] !== sid ? "mt-1.5" : ""}`}
          style={{ animationDelay: `${i * 35}ms` }}
        >
          <span className={sportChip}>{sportName(sid)}</span>
          <span className="truncate text-[0.85rem]">{name}</span>
          {withDots ? (
            id === 14 ? (
              <span className={`qr-enter ${dotsCell}`}><NullChip>enrollments 칸 전부 NULL</NullChip></span>
            ) : (
              <RecordDots mo={mo} cancelGone={cancelGone} className={dotsCell} />
            )
          ) : (
            <span className="hidden @md:block" />
          )}
        </div>
      ))}
    </div>
  );
}

function EnrollRows({ level, cancelGone }: { level: 1 | 2 | 3; cancelGone: boolean }) {
  const list = COURSES.filter((c) => c[0] !== 14).sort((a, b) => a[0] - b[0]);
  return (
    <div className="flex flex-col gap-1">
      {list.map(([id, name, sid, mo], i) => (
        <div key={id} className={rowBox} style={{ animationDelay: `${i * 30}ms` }}>
          {level >= 3 ? (
            <span className={`${sportChip} qr-enter`}>{sportName(sid)}</span>
          ) : (
            <span className={`${sportChip} font-mono font-semibold ${muted}`}>{level === 2 ? `sport_id ${sid}` : "?"}</span>
          )}
          {level >= 2 ? (
            <span className="qr-enter truncate text-[0.85rem]">{name}</span>
          ) : (
            <span className={`truncate font-mono text-[0.85rem] ${muted}`}>course_id {id}</span>
          )}
          <RecordDots mo={mo} cancelGone={cancelGone} className={dotsCell} />
        </div>
      ))}
    </div>
  );
}

const won = (n: number) => n.toLocaleString("ko-KR");

function GroupGrid({ withNull, judged }: { withNull: boolean; judged: boolean | null }) {
  return (
    <div className="flex flex-col gap-2.5">
      {SPORTS.map((s) => (
        <div key={s.id} className="qr-enter grid grid-cols-1 items-start gap-1.5 @md:grid-cols-[5.5rem_minmax(0,1fr)] @md:gap-2.5">
          <span className={`${sportChip} w-[5.5rem] @md:w-auto`}>{s.name}</span>
          <div className="grid grid-cols-3 gap-1.5 @md:gap-2 @md:grid-cols-[repeat(auto-fill,minmax(7.25rem,1fr))]">
            {GROUPS.filter((g) => g[0] === s.id && (withNull || g[1] !== null)).map(([sid, m, cnt, sum]) => {
              const ok = sum !== null && sum >= 1000000;
              const state = judged ? (ok ? "pass" : "fail") : "idle";
              return (
                <div
                  key={`${sid}-${m}`}
                  className={`relative rounded-lg border border-t-4 px-1.5 py-2 @md:px-2.5 transition-[opacity,background-color,border-color] duration-500 motion-reduce:transition-none ${
                    m ? MONTH_TOP[m] : `border-dashed border-t-current ${muted}`
                  } ${
                    state === "pass"
                      ? "border-ok bg-ok/10 dark:border-ok-dark dark:bg-ok-dark/15"
                      : "border-line bg-background dark:border-line-dark dark:bg-background-dark"
                  } ${state === "fail" ? "opacity-30" : ""}`}
                >
                  <span
                    className={`absolute top-1.5 right-1.5 @md:right-2 text-[0.7rem] font-bold text-ok transition-opacity duration-300 dark:text-ok-dark ${
                      state === "pass" ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    통과
                  </span>
                  <div className="font-mono text-[0.75rem] font-semibold @md:text-[0.8rem] text-foreground dark:text-foreground-dark">{m ?? "월 NULL"}</div>
                  <div className={`text-[0.8rem] ${muted}`}>COUNT(*) {cnt}</div>
                  <div
                    className={`font-mono text-[0.78rem] @md:text-[0.88rem] font-semibold tabular-nums text-foreground dark:text-foreground-dark ${
                      state === "fail" ? "line-through" : ""
                    }`}
                  >
                    {sum === null ? "SUM NULL" : `${won(sum)}원`}
                  </div>
                </div>
              );
            })}
            {withNull && s.id === 1 ? (
              <p
                className={`col-span-full text-[0.8rem] text-destructive transition-opacity duration-500 dark:text-destructive-dark ${
                  judged ? "opacity-100" : "opacity-0"
                }`}
              >
                NULL &gt;= 1,000,000 은 참이 아니라서 월 NULL 그룹은 탈락해요.
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

const ROW_H = 2.625; // rem, 결과 행 높이. 정렬 애니메이션이 이 높이만큼씩 행을 옮긴다.

function ResultTable({ sorted }: { sorted: boolean }) {
  const order = sorted ? SORTED : PASSING;
  const pos = new Map(order.map((g, i) => [`${g[0]}-${g[1]}`, i]));
  const cols = "grid grid-cols-[minmax(0,1fr)_4rem_3.5rem_5.25rem] items-center gap-2 px-2 @md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4.5rem_minmax(0,7rem)] @md:gap-3 @md:px-3";
  return (
    <div className="qr-enter max-w-xl font-mono text-[0.8rem] tabular-nums @md:text-[0.9rem]">
      <div className={`${cols} border-b border-line py-2 font-sans text-[0.8rem] font-semibold dark:border-line-dark ${muted}`}>
        <span>종목</span>
        <span>수강월</span>
        <span className="text-right">수강인원</span>
        <span className="text-right">매출</span>
      </div>
      <div className="relative" style={{ height: `${PASSING.length * ROW_H}rem` }}>
        {PASSING.map((g) => {
          const key = `${g[0]}-${g[1]}`;
          return (
            <div
              key={key}
              className={`${cols} absolute inset-x-0 top-0 border-b border-line bg-surface transition-transform duration-700 ease-in-out motion-reduce:transition-none dark:border-line-dark dark:bg-surface-dark`}
              style={{ height: `${ROW_H}rem`, transform: `translateY(${(pos.get(key) ?? 0) * ROW_H}rem)` }}
            >
              <span className="font-sans">{sportName(g[0])}</span>
              <span>{g[1]}</span>
              <span className="text-right">{g[2]}</span>
              <span className="text-right">{g[3]?.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function QueryReplaySimulator() {
  const [modeKey, setModeKey] = useState<"left" | "inner">("left");
  const [cur, setCur] = useState(0);
  // 움직임이 끝난 단계의 열쇠. 단계가 바뀌면 열쇠가 달라져 저절로 처음 상태로 돌아간다.
  const [afterKey, setAfterKey] = useState("");
  const [playing, setPlaying] = useState(false);

  const mode = MODES[modeKey];
  const stages = mode.stages;
  const st = stages[cur];
  const last = stages.length - 1;
  const stageKey = `${modeKey}-${cur}`;
  const after = afterKey === stageKey;

  // 단계가 바뀌고 잠시 뒤 움직임(점 사라짐, 통과 판정, 정렬)을 시작한다.
  useEffect(() => {
    const ms = AFTER_MS[st.k];
    if (ms === undefined) return;
    const t = setTimeout(() => setAfterKey(stageKey), ms);
    return () => clearTimeout(t);
  }, [stageKey, st.k]);

  useEffect(() => {
    if (!playing || cur >= last) return;
    const t = setTimeout(() => {
      setCur(cur + 1);
      if (cur + 1 >= last) setPlaying(false);
    }, 4200);
    return () => clearTimeout(t);
  }, [playing, cur, last]);

  const go = (i: number) => {
    setPlaying(false);
    setCur(Math.max(0, Math.min(last, i)));
  };
  const pickMode = (m: "left" | "inner") => {
    if (m === modeKey) return;
    setPlaying(false);
    setModeKey(m);
    setCur(0);
  };
  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (cur === last) setCur(0);
    setPlaying(true);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") go(cur + 1);
    if (e.key === "ArrowLeft") go(cur - 1);
  };

  let canvas: ReactNode;
  switch (st.k) {
    case "sports":
      canvas = (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-2.5">
          {SPORTS.map((s, i) => (
            <div
              key={s.id}
              className="qr-enter rounded-lg border border-line bg-background p-3.5 dark:border-line-dark dark:bg-background-dark"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`font-mono text-[0.75rem] font-semibold ${muted}`}>sport_id {s.id}</div>
              <div className="text-[1.05rem] font-bold">{s.name}</div>
            </div>
          ))}
        </div>
      );
      break;
    case "lcourses":
      canvas = <SportRows withDots={false} cancelGone={false} />;
      break;
    case "lenroll":
      canvas = (
        <>
          <Legend withNull />
          <SportRows withDots cancelGone={after} />
        </>
      );
      break;
    case "ienroll":
    case "icourses":
    case "isports":
    case "iwhere":
      canvas = (
        <>
          <Legend withNull={false} />
          <EnrollRows
            level={st.k === "ienroll" ? 1 : st.k === "icourses" ? 2 : 3}
            cancelGone={st.k === "iwhere" && after}
          />
        </>
      );
      break;
    case "group":
    case "having":
      canvas = (
        <>
          <Legend withNull={!!st.withNull} />
          <GroupGrid withNull={!!st.withNull} judged={st.k === "having" ? after : null} />
        </>
      );
      break;
    case "select":
      canvas = <ResultTable sorted={false} />;
      break;
    case "order":
      canvas = <ResultTable sorted={after} />;
      break;
  }

  return (
    <div data-figure className="not-prose panel @container my-6 flex flex-col gap-4 p-4 sm:p-5" onKeyDown={onKey}>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="풀이 고르기">
        {(Object.keys(MODES) as ("left" | "inner")[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => pickMode(m)}
            aria-pressed={m === modeKey}
            className={`tap-feedback min-h-11 px-4 text-label font-bold ${m === modeKey ? "btn-action" : "btn"}`}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto bg-surface-2 py-2.5 font-mono text-[0.75rem] leading-relaxed dark:bg-surface-2-dark @md:text-[0.8rem]">
        {mode.sql.map((l, i) => {
          const on = l.s === cur + 1;
          const done = l.s < cur + 1;
          return (
            <span
              key={`${modeKey}-${i}`}
              className={`block border-l-[3px] px-3 py-0.5 whitespace-pre transition-colors duration-300 ${
                on
                  ? "border-accent bg-warn/20 font-semibold text-foreground dark:border-accent-dark dark:bg-warn-dark/20 dark:text-foreground-dark"
                  : `border-transparent ${done ? "text-foreground dark:text-foreground-dark" : muted}`
              }`}
            >
              {l.t}
            </span>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 @md:flex-row @md:flex-wrap @md:items-center">
        <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => go(cur - 1)}
          disabled={cur === 0}
          className="btn tap-feedback inline-flex min-h-11 items-center gap-1 px-3 text-label font-bold disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          이전
        </button>
        <button
          type="button"
          onClick={() => go(cur + 1)}
          disabled={cur === last}
          className="btn-action tap-feedback inline-flex min-h-11 items-center gap-1 px-3 text-label font-bold disabled:opacity-40"
        >
          다음
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="btn tap-feedback inline-flex min-h-11 items-center gap-1.5 px-3 text-label font-bold"
        >
          {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          {playing ? "멈춤" : "자동 재생"}
        </button>
        </div>
        <div
          className="grid gap-1 @md:flex @md:flex-wrap"
          style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
          aria-label="단계"
        >
          {stages.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => go(i)}
              aria-label={s.title}
              aria-current={i === cur ? "step" : undefined}
              className={`tap-feedback min-h-11 font-mono text-label font-semibold @md:min-w-11 ${i === cur ? "btn-action" : "btn"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite">
        <div className="mb-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-mono text-body font-bold">{st.title}</h3>
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-[0.8rem] font-semibold text-accent dark:bg-accent-dark/15 dark:text-accent-dark">
            {st.badge}
          </span>
        </div>
        <p className="text-label leading-relaxed break-keep">
          <Rich text={st.text} />
        </p>
      </div>

      <div key={`${modeKey}-${cur}`} className="min-h-[20rem] overflow-x-auto">
        {canvas}
      </div>
    </div>
  );
}
