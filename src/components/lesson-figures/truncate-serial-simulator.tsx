"use client";

// 19회차 번호표 시뮬레이터. contact_lists 표에서 INSERT, DELETE, TRUNCATE, TRUNCATE ... RESTART IDENTITY,
// BEGIN/ROLLBACK/COMMIT이 행과 SERIAL 번호를 어떻게 바꾸는지 보여 준다. 버튼 하나가 psql에 친 문장 하나다.
// 명령 결과 글자(INSERT 0 18, DELETE 1, TRUNCATE TABLE 등)와 번호 동작은 PostgreSQL 엔진(PGlite)으로 실제
// 실행해 확인했다: ROLLBACK은 행을 되돌리지만 INSERT가 쓴 번호는 되돌리지 않고, BEGIN 안에서 한
// RESTART IDENTITY는 ROLLBACK하면 함께 취소된다. 이름 다섯 개는 수업 TIL 출력(1~3번, 17~18번) 그대로다.

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Line = { text: string; why?: string; tone?: "ok" | "warn" | "dim" };
type Tx = { rows: number[]; restartedFrom: number | null };

// UNION 결과 18행 중 TIL 출력에 보인 행. 가운데(4~16번째)는 TIL처럼 ... 으로 줄인다.
const HEAD = [
  ["강나연", "이메일 미등록"],
  ["강도윤", "휴대폰 미등록"],
  ["권우진", "이메일 미등록"],
];
const TAIL = [
  ["황은지", "이메일 미등록"],
  ["황은찬", "이메일 미등록"],
];
const BATCH = 18;

const START: Line[] = [{ text: "(contact_lists 표를 막 만들었어요. 행 0개, 번호는 아직 하나도 안 썼어요.)", tone: "dim" }];

export function TruncateSerialSimulator() {
  const [rows, setRows] = useState<number[]>([]);
  // 시퀀스가 마지막으로 내준 번호. 다음 INSERT는 last + 1부터 받는다.
  const [last, setLast] = useState(0);
  const [tx, setTx] = useState<Tx | null>(null);
  const [log, setLog] = useState<Line[]>(START);
  const logRef = useRef<HTMLDivElement>(null);

  const say = (lines: Line[]) => {
    setLog((prev) => [...prev, ...lines].slice(-80));
    requestAnimationFrame(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const insert = () => {
    const ids = Array.from({ length: BATCH }, (_, i) => last + 1 + i);
    setRows((prev) => [...prev, ...ids]);
    setLast(last + BATCH);
    say([
      { text: "INSERT INTO contact_lists (...) SELECT ... UNION SELECT ... RETURNING *;", tone: "dim" },
      ...HEAD.map(([n, r], i) => ({ text: `${ids[i]} | ${n} | ${r}` })),
      { text: "..." },
      ...TAIL.map(([n, r], i) => ({ text: `${ids[BATCH - 2 + i]} | ${n} | ${r}` })),
      { text: "(18 rows)", tone: "dim", why: "칸 맞춤과 member_id, 날짜 열은 생략" },
      { text: "INSERT 0 18", tone: "ok", why: `번호 ${ids[0]}~${ids[BATCH - 1]}` },
    ]);
  };

  const deleteLast = () => {
    const max = Math.max(...rows);
    setRows((prev) => prev.filter((id) => id !== max));
    say([
      { text: `DELETE FROM contact_lists WHERE request_id = ${max} RETURNING request_id;`, tone: "dim" },
      { text: `${max}` },
      { text: "(1 row)", tone: "dim" },
      { text: "DELETE 1", tone: "ok", why: "행은 사라져도 번호는 그대로" },
    ]);
  };

  const truncate = (restart: boolean) => {
    setRows([]);
    if (restart) {
      if (tx && tx.restartedFrom === null) setTx({ ...tx, restartedFrom: last });
      setLast(0);
    }
    say([
      { text: restart ? "TRUNCATE contact_lists RESTART IDENTITY;" : "TRUNCATE contact_lists;", tone: "dim" },
      { text: "TRUNCATE TABLE", tone: "ok", why: restart ? "번호도 1부터 다시" : `행만 비움, 다음 번호는 ${last + 1}` },
    ]);
  };

  const begin = () => {
    setTx({ rows, restartedFrom: null });
    say([
      { text: "BEGIN;", tone: "dim" },
      { text: "BEGIN", why: "여기부터는 확정 전 변경" },
    ]);
  };

  const rollback = () => {
    if (!tx) return;
    setRows(tx.rows);
    const restored = tx.restartedFrom !== null;
    if (restored) setLast(tx.restartedFrom as number);
    setTx(null);
    say([
      { text: "ROLLBACK;", tone: "dim" },
      {
        text: "ROLLBACK",
        tone: "warn",
        why: restored ? "행과 번호 되돌리기(RESTART IDENTITY도 취소)" : "행은 돌아오지만 INSERT가 쓴 번호는 그대로",
      },
    ]);
  };

  const commit = () => {
    setTx(null);
    say([
      { text: "COMMIT;", tone: "dim" },
      { text: "COMMIT", tone: "ok", why: "확정, 이제 되돌릴 수 없음" },
    ]);
  };

  const reset = () => {
    setRows([]);
    setLast(0);
    setTx(null);
    setLog(START);
  };

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const toneClass = (t?: Line["tone"]) =>
    t === "ok" ? "text-ok dark:text-ok-dark" : t === "warn" ? "text-action dark:text-action-dark" : t === "dim" ? muted : "";
  const btn = "btn tap-feedback min-h-11 justify-start px-3 text-left text-label disabled:opacity-50";

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3" aria-label="psql에 칠 문장">
          <h3 className="text-label font-bold">psql에 칠 문장</h3>
          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={insert} className="btn-action tap-feedback min-h-11 justify-start px-3 text-left text-label">
              연락 목록 18명 넣기 (INSERT ... SELECT)
            </button>
            <button type="button" onClick={deleteLast} disabled={rows.length === 0} className={btn}>
              마지막 행 하나 지우기 (DELETE)
            </button>
            <button type="button" onClick={() => truncate(false)} className={btn}>
              TRUNCATE
            </button>
            <button type="button" onClick={() => truncate(true)} className={btn}>
              TRUNCATE ... RESTART IDENTITY
            </button>
            <div className="grid grid-cols-3 gap-1.5">
              <button type="button" onClick={begin} disabled={tx !== null} className={`${btn} justify-center`}>
                BEGIN
              </button>
              <button type="button" onClick={rollback} disabled={tx === null} className={`${btn} justify-center`}>
                ROLLBACK
              </button>
              <button type="button" onClick={commit} disabled={tx === null} className={`${btn} justify-center`}>
                COMMIT
              </button>
            </div>
            <button type="button" onClick={reset} className={btn}>
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              처음부터
            </button>
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-3" aria-label="contact_lists 표와 번호">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-label font-bold">contact_lists 표</h3>
            <span className={`font-mono text-label ${tx ? "font-semibold text-action dark:text-action-dark" : muted}`}>
              {tx ? "sportscenter=*#" : "sportscenter=#"}
            </span>
          </div>
          {rows.length > 0 ? (
            <ul className="flex flex-wrap gap-1" aria-label={`행 ${rows.length}개`}>
              {rows.map((id) => (
                <li
                  key={id}
                  className="min-w-[2.25rem] rounded-md bg-surface-2 px-1.5 py-1 text-center font-mono text-label font-semibold tabular-nums text-accent dark:bg-surface-2-dark dark:text-accent-dark"
                >
                  {id}
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-label ${muted}`}>행이 없어요. 표 구조는 그대로 있어요.</p>
          )}
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-t border-line pt-2 font-mono text-label tabular-nums dark:border-line-dark">
            <dt>행 개수</dt>
            <dd className="text-right">{rows.length}</dd>
            <dt>마지막으로 쓴 번호</dt>
            <dd className="text-right">{last}</dd>
            <dt className="font-semibold">다음 INSERT가 받을 번호</dt>
            <dd className="text-right font-semibold">{last + 1}</dd>
          </dl>
        </section>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <h3 className="text-label font-bold">출력 (psql)</h3>
        <div
          ref={logRef}
          aria-live="polite"
          className="flex h-56 flex-col gap-0.5 overflow-y-auto bg-surface-2 px-3 py-2 font-mono text-label leading-relaxed dark:bg-surface-2-dark"
        >
          {log.map((l, i) => (
            <div key={i} className={`whitespace-pre-wrap break-all ${toneClass(l.tone)}`}>
              {l.text || " "}
              {l.why ? <span className={muted}>{`  # ${l.why}`}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
