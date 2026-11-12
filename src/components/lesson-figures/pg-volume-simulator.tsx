"use client";

// 14회차 PostgreSQL 컨테이너와 볼륨 시뮬레이터. 15절 실습(볼륨 없이 켜기, 지우고 다시 켜기,
// pgdata 볼륨으로 켜기)을 버튼으로 따라간다. 규칙은 실제 Docker와 같다.
// - postgres:18 이미지는 데이터 자리(/var/lib/postgresql)를 볼륨으로 정해 둬서, -v가 없으면
//   run할 때마다 새 익명 볼륨이 생긴다.
// - stop/start는 같은 컨테이너라 데이터가 그대로다. rm -f는 컨테이너만 지우고 볼륨은 남긴다.
// - 이름 있는 볼륨(pgdata)은 없으면 run이 새로 만들고, 있으면 그대로 다시 잇는다.
// - docker volume prune은 어떤 컨테이너도 안 쓰는 익명 볼륨만 지운다.
// 출력 창의 문장은 레슨에 나온 출력 그대로이고, 왜 그렇게 됐는지는 뒤에 # 주석으로 붙인다.

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Where = { kind: "anon"; id: number } | { kind: "pgdata" };
type Container = { up: boolean; where: Where };
type Line = { text: string; why?: string; tone?: "ok" | "warn" | "dim" };

const ROWS = [
  "1 | 무선 키보드 | 35000 | 120",
  "2 | 게이밍 마우스 | 28000 | 85",
  "3 | 27인치 모니터 | 259000 | 15",
  "4 | USB-C 허브 | 19900 | 200",
  "5 | 노트북 거치대 | 24000 | 7",
];

const RUN = "docker run -d --name my-pg -e POSTGRES_PASSWORD=1234 -p 5432:5432";
const START_LOG: Line[] = [{ text: "# 버튼을 눌러 15절 실습을 따라가 보세요", tone: "dim" }];

export function PgVolumeSimulator() {
  const [box, setBox] = useState<Container | null>(null);
  const [anons, setAnons] = useState<{ id: number; rows: number }[]>([]);
  const [pgdata, setPgdata] = useState<{ rows: number } | null>(null);
  const [nextId, setNextId] = useState(1);
  const [log, setLog] = useState<Line[]>(START_LOG);
  const logRef = useRef<HTMLDivElement>(null);

  const say = (lines: Line[]) => {
    setLog((prev) => [...prev, ...lines].slice(-60));
    requestAnimationFrame(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const cmd = (text: string): Line => ({ text: `$ ${text}`, tone: "dim" });

  // 지금 컨테이너가 데이터를 두는 곳의 행 수
  const rowsHere = (w: Where) => (w.kind === "pgdata" ? (pgdata?.rows ?? 0) : (anons.find((a) => a.id === w.id)?.rows ?? 0));
  const setRowsHere = (w: Where, rows: number) => {
    if (w.kind === "pgdata") setPgdata({ rows });
    else setAnons((prev) => prev.map((a) => (a.id === w.id ? { ...a, rows } : a)));
  };

  const run = (withVolume: boolean) => {
    const line = cmd(withVolume ? `${RUN} -v pgdata:/var/lib/postgresql postgres:18` : `${RUN} postgres:18`);
    if (box) {
      return say([
        line,
        { text: 'The container name "/my-pg" is already in use', why: "먼저 docker rm -f my-pg", tone: "warn" },
      ]);
    }
    if (withVolume) {
      const had = pgdata !== null;
      if (!had) setPgdata({ rows: 0 });
      setBox({ up: true, where: { kind: "pgdata" } });
      say([
        line,
        {
          text: "# my-pg 실행 중(Up)",
          why:
            pgdata !== null && pgdata.rows > 0
              ? "pgdata에 이미 DB가 있어서 그대로 이어요. -e 비밀번호는 다시 읽지 않아요"
              : had
                ? "기존 pgdata 볼륨을 이어요"
                : "pgdata가 없어서 도커가 새로 만들었어요",
          tone: "ok",
        },
      ]);
    } else {
      const id = nextId;
      setNextId(id + 1);
      setAnons((prev) => [...prev, { id, rows: 0 }]);
      setBox({ up: true, where: { kind: "anon", id } });
      say([line, { text: "# my-pg 실행 중(Up)", why: `-v가 없어서 새 익명 볼륨 ${id}번이 생겼어요`, tone: "ok" }]);
    }
  };

  const needUp = (line: Line): boolean => {
    if (!box) {
      say([line, { text: "# my-pg 컨테이너가 없어요. 먼저 docker run", tone: "warn" }]);
      return false;
    }
    if (!box.up) {
      say([line, { text: "# my-pg가 정지(Exited) 상태라 exec를 할 수 없어요. 먼저 docker start my-pg", tone: "warn" }]);
      return false;
    }
    return true;
  };

  const load = () => {
    const line = cmd('docker exec -it my-pg psql -U postgres -c "CREATE TABLE product (...);"');
    if (!needUp(line) || !box) return;
    if (rowsHere(box.where) > 0) {
      return say([{ text: "# 이 DB에는 이미 상품 5개가 있어요. SELECT로 확인해 보세요", tone: "dim" }]);
    }
    setRowsHere(box.where, 5);
    say([
      line,
      cmd("docker cp products.sql my-pg:/tmp/products.sql"),
      cmd("docker exec -it my-pg psql -U postgres -f /tmp/products.sql"),
      { text: "INSERT 0 5", why: "5건이 들어갔어요", tone: "ok" },
    ]);
  };

  const select = () => {
    const line = cmd('docker exec -it my-pg psql -U postgres -c "SELECT * FROM product;"');
    if (!needUp(line) || !box) return;
    if (rowsHere(box.where) === 0) {
      return say([line, { text: 'ERROR:  relation "product" does not exist', why: "이 컨테이너의 DB는 비어 있어요", tone: "warn" }]);
    }
    say([
      line,
      { text: "id | name | price | stock", tone: "dim" },
      ...ROWS.map((r) => ({ text: r })),
      { text: "# 상품 5개", why: box.where.kind === "pgdata" ? "pgdata 볼륨에 있던 데이터" : `익명 볼륨 ${box.where.id}번에 있는 데이터`, tone: "ok" },
    ]);
  };

  const stop = () => {
    const line = cmd("docker stop my-pg");
    if (!box) return say([line, { text: "# 멈출 컨테이너가 없어요", tone: "warn" }]);
    setBox({ ...box, up: false });
    say([line, { text: "my-pg", why: "정지(Exited). 데이터는 그대로 남아요" }]);
  };

  const start = () => {
    const line = cmd("docker start my-pg");
    if (!box) return say([line, { text: "# 켤 컨테이너가 없어요. docker run으로 새로 만들어요", tone: "warn" }]);
    setBox({ ...box, up: true });
    say([line, { text: "my-pg", why: "같은 컨테이너를 다시 켜요(Up). 같은 볼륨을 그대로 써요", tone: "ok" }]);
  };

  const remove = () => {
    const line = cmd("docker rm -f my-pg");
    if (!box) return say([line, { text: "# 지울 컨테이너가 없어요", tone: "warn" }]);
    const w = box.where;
    setBox(null);
    say([
      line,
      {
        text: "my-pg",
        why:
          w.kind === "pgdata"
            ? "컨테이너만 사라졌어요. pgdata 볼륨은 남아요"
            : `컨테이너만 사라졌어요. 익명 볼륨 ${w.id}번은 주인 없이 남아요`,
      },
    ]);
  };

  const prune = () => {
    const inUse = box && box.where.kind === "anon" ? box.where.id : null;
    const gone = anons.filter((a) => a.id !== inUse);
    setAnons((prev) => prev.filter((a) => a.id === inUse));
    say([
      cmd("docker volume prune"),
      { text: "# 확인 질문에 y", tone: "dim" },
      {
        text: gone.length > 0 ? `# 주인 없는 익명 볼륨 ${gone.length}개를 지웠어요` : "# 지울 익명 볼륨이 없어요",
        why: "이름 있는 볼륨 pgdata와 쓰는 중인 볼륨은 남아요",
      },
    ]);
  };

  const reset = () => {
    setBox(null);
    setAnons([]);
    setPgdata(null);
    setNextId(1);
    setLog(START_LOG);
  };

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const toneClass = (t?: Line["tone"]) =>
    t === "ok" ? "text-ok dark:text-ok-dark" : t === "warn" ? "text-action dark:text-action-dark" : t === "dim" ? muted : "";

  const where = box?.where;
  const whereText = !where ? "" : where.kind === "pgdata" ? "pgdata 볼륨" : `익명 볼륨 ${where.id}번`;
  const rowsText = (rows: number) => (rows > 0 ? `상품 ${rows}개` : "빈 DB");
  const usedBy = (isHere: boolean) => (isHere ? (box?.up ? "my-pg가 쓰는 중" : "my-pg(정지)가 잡고 있음") : "주인 없음");

  const btn = "btn tap-feedback min-h-11 px-3 font-mono text-label";

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3" aria-label="컨테이너">
          <h3 className="text-label font-bold">컨테이너 my-pg</h3>
          <div
            className={`border-2 px-4 py-3 ${
              !box
                ? "border-dashed border-line dark:border-line-dark"
                : box.up
                  ? "border-accent bg-accent/8 dark:border-accent-dark dark:bg-accent-dark/12"
                  : "border-line bg-surface-2/50 dark:border-line-dark dark:bg-surface-2-dark/50"
            }`}
          >
            <p className="text-body font-semibold">{!box ? "없음" : box.up ? "실행 중 (Up)" : "정지 (Exited)"}</p>
            <p className={`text-label ${muted}`}>
              {box ? (
                <>
                  <span className="font-mono">/var/lib/postgresql</span>
                  {` 자리에 ${whereText}을 이어 씀`}
                </>
              ) : (
                "docker run으로 만들어요"
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => run(false)} className={btn} aria-label="볼륨 없이 docker run으로 my-pg 만들기">
              run (볼륨 없이)
            </button>
            <button type="button" onClick={() => run(true)} className={btn} aria-label="pgdata 볼륨을 이어 docker run으로 my-pg 만들기">
              run -v pgdata
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={load} className={btn} aria-label="표를 만들고 products.sql로 상품 5개 가져오기">
              5개 가져오기
            </button>
            <button type="button" onClick={select} className={btn} aria-label="SELECT로 상품 꺼내 보기">
              SELECT
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={stop} className={btn} aria-label="docker stop으로 my-pg 정지">
              stop
            </button>
            <button type="button" onClick={start} className={btn} aria-label="docker start로 my-pg 다시 켜기">
              start
            </button>
            <button type="button" onClick={remove} className="btn-action tap-feedback min-h-11 px-3 font-mono text-label" aria-label="docker rm -f로 my-pg 지우기">
              rm -f
            </button>
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-3" aria-label="볼륨">
          <h3 className="text-label font-bold">볼륨 (docker volume ls)</h3>
          <ul className="flex flex-col gap-1.5">
            {pgdata === null && anons.length === 0 ? <li className={`text-label ${muted}`}>(볼륨 없음)</li> : null}
            {pgdata !== null ? (
              <li className="border border-warn bg-warn/8 px-3 py-2 dark:border-warn-dark dark:bg-warn-dark/12">
                <p className="font-mono text-label font-semibold text-warn dark:text-warn-dark">pgdata</p>
                <p className={`text-label ${muted}`}>
                  이름 있는 볼륨, {rowsText(pgdata.rows)}, {usedBy(where?.kind === "pgdata")}
                </p>
              </li>
            ) : null}
            {anons.map((a) => (
              <li key={a.id} className="border border-line px-3 py-2 dark:border-line-dark">
                <p className="font-mono text-label font-semibold">익명 볼륨 {a.id}번</p>
                <p className={`text-label ${muted}`}>
                  긴 해시 이름, {rowsText(a.rows)}, {usedBy(where?.kind === "anon" && where.id === a.id)}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={prune} className={btn} aria-label="docker volume prune으로 주인 없는 익명 볼륨 정리">
              volume prune
            </button>
            <button type="button" onClick={reset} className="btn tap-feedback min-h-11 px-3 text-label" aria-label="처음 상태로 되돌리기">
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              처음부터
            </button>
          </div>
        </section>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <h3 className="text-label font-bold">터미널 출력</h3>
        <div
          ref={logRef}
          aria-live="polite"
          className="flex h-48 flex-col gap-0.5 overflow-y-auto bg-surface-2 px-3 py-2 font-mono text-label leading-relaxed break-words dark:bg-surface-2-dark"
        >
          {log.map((l, i) => (
            <div key={i} className={toneClass(l.tone)}>
              {l.text}
              {l.why ? <span className={muted}>{`  # ${l.why}`}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
