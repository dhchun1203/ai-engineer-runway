"use client";

// 15회차 SERIAL 번호 시뮬레이터. my_shop.sql과 같은 표(product)에서 INSERT가 번호를 어떻게 쓰는지 보여 준다.
// 버튼 하나가 psql에 친 문장 하나다. 오류 문장과 DETAIL 줄은 PostgreSQL 엔진(PGlite)으로 실제 실행해 확인한
// 글자 그대로이고, 파일 실행 출력은 수업 TIL에 나온 psql 출력 그대로다. 이유는 뒤에 # 주석으로 붙인다.

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Row = { id: number; name: string; price: number; stock: number };
type Line = { text: string; why?: string; tone?: "ok" | "warn" | "dim" };

const SEED: Omit<Row, "id">[] = [
  { name: "무선 이어폰", price: 35000, stock: 100 },
  { name: "게이밍 마우스", price: 28000, stock: 85 },
  { name: "27인치 모니터", price: 259000, stock: 15 },
  { name: "USB-C 허브", price: 19900, stock: 200 },
  { name: "노트북 거치대", price: 24000, stock: 7 },
];

const START: Line[] = [{ text: "(아직 my_shop DB가 없어요. 먼저 파일을 실행하세요.)", tone: "dim" }];

export function SerialSimulator() {
  const [dbExists, setDbExists] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  // 시퀀스가 마지막으로 내준 번호. 다음 INSERT는 last + 1을 받는다.
  const [last, setLast] = useState(0);
  const [log, setLog] = useState<Line[]>(START);
  const logRef = useRef<HTMLDivElement>(null);

  const say = (lines: Line[]) => {
    setLog((prev) => [...prev, ...lines].slice(-80));
    requestAnimationFrame(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const runFile = () => {
    const lines: Line[] = [{ text: "$ docker exec -i my-pg psql -U postgres < my_shop.sql", tone: "dim" }];
    if (!dbExists) {
      lines.push({ text: 'psql:my_shop.sql:2: NOTICE:  database "my_shop" does not exist, skipping', tone: "dim", why: "지울 DB가 없어 건너뜀, 오류 아님" });
      lines.push({ text: "DROP DATABASE" });
    } else {
      lines.push({ text: "DROP DATABASE", why: "있던 DB를 표와 번호까지 통째로 지움" });
    }
    lines.push(
      { text: "CREATE DATABASE" },
      { text: 'You are now connected to database "my_shop" as user "postgres".', why: "\\c my_shop" },
      { text: "CREATE TABLE", why: "새 표라 번호도 1부터" },
      { text: "INSERT 0 5", tone: "ok", why: "id 1~5" },
    );
    setDbExists(true);
    setRows(SEED.map((r, i) => ({ id: i + 1, ...r })));
    setLast(5);
    say(lines);
  };

  const insertBad = () => {
    const id = last + 1;
    setLast(id);
    say([
      { text: "INSERT INTO product (name, price) VALUES ('키보드', 45000);", tone: "dim" },
      { text: 'ERROR:  null value in column "stock" of relation "product" violates not-null constraint', tone: "warn", why: "stock은 NOT NULL" },
      { text: `DETAIL:  Failing row contains (${id}, 키보드, 45000, null).`, tone: "warn", why: `번호 ${id}은 이미 써 버림` },
    ]);
  };

  const insertGood = () => {
    const id = last + 1;
    setLast(id);
    setRows((prev) => [...prev, { id, name: "키보드", price: 45000, stock: 30 }]);
    say([
      { text: "INSERT INTO product (name, price, stock) VALUES ('키보드', 45000, 30);", tone: "dim" },
      { text: "INSERT 0 1", tone: "ok", why: `id = ${id}` },
    ]);
  };

  const select = () => {
    say([
      { text: "SELECT id, name FROM product;", tone: "dim" },
      ...rows.map((r) => ({ text: `${r.id} | ${r.name}` })),
      { text: `(${rows.length} rows)`, why: "칸 맞춤은 생략" },
    ]);
  };

  const reset = () => {
    setDbExists(false);
    setRows([]);
    setLast(0);
    setLog(START);
  };

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const toneClass = (t?: Line["tone"]) =>
    t === "ok" ? "text-ok dark:text-ok-dark" : t === "warn" ? "text-action dark:text-action-dark" : t === "dim" ? muted : "";
  // 번호 사이에 빈 자리가 있는지: 1부터 last까지 중 표에 없는 번호
  const used = new Set(rows.map((r) => r.id));
  const gaps = Array.from({ length: last }, (_, i) => i + 1).filter((n) => !used.has(n));

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3" aria-label="psql에 칠 문장">
          <h3 className="text-label font-bold">psql에 칠 문장</h3>
          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={runFile} className="btn-action tap-feedback min-h-11 justify-start px-3 text-left text-label">
              my_shop.sql 파일 실행
            </button>
            <button type="button" onClick={insertBad} disabled={!dbExists} className="btn tap-feedback min-h-11 justify-start px-3 text-left text-label disabled:opacity-50">
              키보드 넣기 (stock 빠짐)
            </button>
            <button type="button" onClick={insertGood} disabled={!dbExists} className="btn tap-feedback min-h-11 justify-start px-3 text-left text-label disabled:opacity-50">
              키보드 넣기 (stock 30)
            </button>
            <button type="button" onClick={select} disabled={!dbExists} className="btn tap-feedback min-h-11 justify-start px-3 text-left text-label disabled:opacity-50">
              SELECT로 확인
            </button>
            <button type="button" onClick={reset} className="btn tap-feedback min-h-11 justify-start px-3 text-left text-label">
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              처음부터
            </button>
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-3" aria-label="product 표와 번호">
          <h3 className="text-label font-bold">product 표</h3>
          {dbExists ? (
            <table className="w-full font-mono text-label tabular-nums">
              <thead>
                <tr className={`border-b border-line text-left dark:border-line-dark ${muted}`}>
                  <th className="py-1 pr-2 font-semibold">id</th>
                  <th className="py-1 pr-2 font-semibold">name</th>
                  <th className="py-1 text-right font-semibold">stock</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-b-0 dark:border-line-dark">
                    <td className="py-1 pr-2 font-semibold text-accent dark:text-accent-dark">{r.id}</td>
                    <td className="py-1 pr-2 font-sans">{r.name}</td>
                    <td className="py-1 text-right">{r.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={`text-label ${muted}`}>DB가 아직 없어요.</p>
          )}
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-t border-line pt-2 font-mono text-label tabular-nums dark:border-line-dark">
            <dt>마지막으로 쓴 번호</dt>
            <dd className="text-right">{last}</dd>
            <dt className="font-semibold">다음 INSERT가 받을 번호</dt>
            <dd className="text-right font-semibold">{dbExists ? last + 1 : "-"}</dd>
            <dt>표에 없는 번호 (빈틈)</dt>
            <dd className="text-right text-action dark:text-action-dark">{gaps.length > 0 ? gaps.join(", ") : "없음"}</dd>
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
              {l.text || "\u00a0"}
              {l.why ? <span className={muted}>{`  # ${l.why}`}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
