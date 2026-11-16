"use client";

// 16회차 사물함 배정 시뮬레이터. lockers(1:1, ON DELETE CASCADE)와 members를 두고, 버튼 하나가 psql에 친
// 문장 하나다. 오류 문장과 DETAIL 줄은 PostgreSQL 엔진(PGlite)으로 실제 실행해 확인한 글자 그대로다.
// 한 문장이 여러 규칙을 함께 어기면 PostgreSQL은 사물함 번호(PK), 회원 번호(UNIQUE), 회원 존재(FK)
// 순서로 먼저 걸린 것 하나만 알려 준다. 이 순서도 엔진에서 확인했다.

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Member = { id: number; name: string };
type Locker = { no: number; member: number };
type Line = { text: string; why?: string; tone?: "ok" | "warn" | "dim" };

const START_MEMBERS: Member[] = [
  { id: 1, name: "김하늘" },
  { id: 2, name: "이준호" },
];
const START_LOCKERS: Locker[] = [{ no: 101, member: 1 }];
const START: Line[] = [{ text: "(회원 1, 2번이 있고 사물함 101번은 김하늘에게 배정돼 있어요.)", tone: "dim" }];

export function LockerCascadeSimulator() {
  const [members, setMembers] = useState<Member[]>(START_MEMBERS);
  const [lockers, setLockers] = useState<Locker[]>(START_LOCKERS);
  // 회원 번호표가 마지막으로 내준 번호. 다음 회원은 last + 1을 받는다.
  const [last, setLast] = useState(2);
  const [log, setLog] = useState<Line[]>(START);
  const logRef = useRef<HTMLDivElement>(null);

  const say = (lines: Line[]) => {
    setLog((prev) => [...prev, ...lines].slice(-80));
    requestAnimationFrame(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const assign = (no: number, member: number) => {
    const sql: Line = { text: `INSERT INTO lockers VALUES (${no}, ${member}, '2026-11-01');`, tone: "dim" };
    if (lockers.some((l) => l.no === no)) {
      say([
        sql,
        { text: 'ERROR:  duplicate key value violates unique constraint "lockers_pkey"', tone: "warn", why: "사물함 번호가 PK" },
        { text: `DETAIL:  Key (locker_no)=(${no}) already exists.`, tone: "warn" },
      ]);
      return;
    }
    if (lockers.some((l) => l.member === member)) {
      say([
        sql,
        { text: 'ERROR:  duplicate key value violates unique constraint "lockers_member_id_key"', tone: "warn", why: "UNIQUE: 회원 한 명에 사물함 하나" },
        { text: `DETAIL:  Key (member_id)=(${member}) already exists.`, tone: "warn" },
      ]);
      return;
    }
    if (!members.some((m) => m.id === member)) {
      say([
        sql,
        { text: 'ERROR:  insert or update on table "lockers" violates foreign key constraint "lockers_member_id_fkey"', tone: "warn", why: "FK: 없는 회원" },
        { text: `DETAIL:  Key (member_id)=(${member}) is not present in table "members".`, tone: "warn" },
      ]);
      return;
    }
    setLockers((prev) => [...prev, { no, member }]);
    say([sql, { text: "INSERT 0 1", tone: "ok", why: `사물함 ${no}번을 회원 ${member}번에게` }]);
  };

  const addMember = () => {
    const id = last + 1;
    setLast(id);
    setMembers((prev) => [...prev, { id, name: "임시회원" }]);
    say([
      { text: "INSERT INTO members (name, gender, birth_year, join_date) VALUES ('임시회원', 'M', 2000, '2026-11-01');", tone: "dim" },
      { text: "INSERT 0 1", tone: "ok", why: `member_id = ${id}` },
    ]);
  };

  const remove = () => {
    const sql: Line = { text: "DELETE FROM members WHERE member_id = 3;", tone: "dim" };
    if (!members.some((m) => m.id === 3)) {
      say([sql, { text: "DELETE 0", why: "3번 회원이 없어 지운 행이 없음" }]);
      return;
    }
    const gone = lockers.filter((l) => l.member === 3).map((l) => l.no);
    setMembers((prev) => prev.filter((m) => m.id !== 3));
    setLockers((prev) => prev.filter((l) => l.member !== 3));
    say([
      sql,
      { text: "DELETE 1", tone: "ok", why: gone.length ? `CASCADE로 사물함 ${gone.join(", ")}번 배정도 같이 지움` : "배정된 사물함이 없어 회원만 지움" },
    ]);
  };

  const selectLockers = () => {
    say([
      { text: "SELECT * FROM lockers;", tone: "dim" },
      ...lockers.map((l) => ({ text: `${l.no} | ${l.member} | 2026-11-01` })),
      { text: `(${lockers.length} ${lockers.length === 1 ? "row" : "rows"})`, why: "칸 맞춤은 생략" },
    ]);
  };

  const selectMembers = () => {
    say([
      { text: "SELECT member_id, name FROM members;", tone: "dim" },
      ...members.map((m) => ({ text: `${m.id} | ${m.name}` })),
      { text: `(${members.length} rows)`, why: "칸 맞춤은 생략" },
    ]);
  };

  const reset = () => {
    setMembers(START_MEMBERS);
    setLockers(START_LOCKERS);
    setLast(2);
    setLog(START);
  };

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const toneClass = (t?: Line["tone"]) =>
    t === "ok" ? "text-ok dark:text-ok-dark" : t === "warn" ? "text-action dark:text-action-dark" : t === "dim" ? muted : "";
  const btn = "btn tap-feedback min-h-11 justify-start px-3 text-left text-label";
  const head = `border-b border-line text-left dark:border-line-dark ${muted}`;
  const cell = "border-b border-line last:border-b-0 dark:border-line-dark";

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3" aria-label="psql에 칠 문장">
          <h3 className="text-label font-bold">psql에 칠 문장</h3>
          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={() => assign(102, 1)} className={btn}>
              사물함 102번을 회원 1번에게
            </button>
            <button type="button" onClick={addMember} className={btn}>
              임시회원 넣기
            </button>
            <button type="button" onClick={() => assign(102, 3)} className={btn}>
              사물함 102번을 회원 3번에게
            </button>
            <button type="button" onClick={remove} className="btn-action tap-feedback min-h-11 justify-start px-3 text-left text-label">
              회원 3번 지우기
            </button>
            <button type="button" onClick={selectLockers} className={btn}>
              SELECT * FROM lockers
            </button>
            <button type="button" onClick={selectMembers} className={btn}>
              SELECT member_id, name FROM members
            </button>
            <button type="button" onClick={reset} className={btn}>
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              처음부터
            </button>
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-4" aria-label="members 표와 lockers 표">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-label font-bold">members</h3>
            <table className="w-full font-mono text-label tabular-nums">
              <thead>
                <tr className={head}>
                  <th className="py-1 pr-2 font-semibold">member_id</th>
                  <th className="py-1 font-semibold">name</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className={cell}>
                    <td className="py-1 pr-2 font-semibold text-accent dark:text-accent-dark">{m.id}</td>
                    <td className="py-1 font-sans">{m.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-label font-bold">lockers</h3>
            <table className="w-full font-mono text-label tabular-nums">
              <thead>
                <tr className={head}>
                  <th className="py-1 pr-2 font-semibold">locker_no</th>
                  <th className="py-1 font-semibold">member_id</th>
                </tr>
              </thead>
              <tbody>
                {lockers.map((l) => (
                  <tr key={l.no} className={cell}>
                    <td className="py-1 pr-2">{l.no}</td>
                    <td className="py-1 font-semibold text-accent dark:text-accent-dark">{l.member}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-t border-line pt-2 font-mono text-label tabular-nums dark:border-line-dark">
            <dt className="font-semibold">다음 회원이 받을 번호</dt>
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
