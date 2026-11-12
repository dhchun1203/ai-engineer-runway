"use client";

// 1회차 세 영역 시뮬레이터. git-practice 폴더에서 README.md 하나로 작업 폴더, Staging Area,
// 저장소가 어떻게 움직이는지 버튼으로 따라 한다. 버튼 하나가 명령어 한 줄이고, 출력 창의 글자는
// 실제 git 2.56으로 같은 순서를 돌려 받은 출력 그대로다(해시만 레슨 예시 값으로 둔다).

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Content = string[] | null; // null = 파일이 없음
type Commit = { hash: string; msg: string; lines: string[] };
type Line = { text: string; tone?: "cmd" | "warn" | "ok" | "dim" };

const LINES = ["Hello World", "Second line"];
// 레슨 9절, 4절의 해시. 실제로는 사람마다, 커밋할 때마다 달라진다.
const PLAN = [
  { hash: "361fe59", msg: "docs: add README" },
  { hash: "7933e0e", msg: "docs: add second line" },
];
const AMBIGUOUS = [
  "fatal: ambiguous argument 'HEAD~1': unknown revision or path not in the working tree.",
  "Use '--' to separate paths from revisions, like this:",
  "'git <command> [<revision>...] -- [<file>...]'",
];

const same = (a: Content, b: Content) => JSON.stringify(a) === JSON.stringify(b);

function statusShort(working: Content, index: Content, head: Content) {
  if (index === null) return working === null ? "" : "?? README.md";
  const x = head === null ? "A" : same(index, head) ? " " : "M";
  const y = working !== null && !same(working, index) ? "M" : " ";
  return x === " " && y === " " ? "" : `${x}${y} README.md`;
}

function FileBox({ title, sub, content }: { title: string; sub: string; content: Content }) {
  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  return (
    <div className="flex min-w-0 flex-col gap-1.5 border border-line px-3 py-2.5 dark:border-line-dark">
      <p className="text-label font-bold">{title}</p>
      <p className={`text-label ${muted}`}>{sub}</p>
      <div className="min-h-14 bg-surface-2 px-2.5 py-1.5 font-mono text-label leading-relaxed dark:bg-surface-2-dark">
        {content === null ? (
          <span className={muted}>(README.md 없음)</span>
        ) : (
          content.map((l, i) => <div key={i}>{l}</div>)
        )}
      </div>
    </div>
  );
}

export function GitAreasSimulator() {
  const [working, setWorking] = useState<Content>(null);
  const [index, setIndex] = useState<Content>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [log, setLog] = useState<Line[]>([
    { text: "$ mkdir git-practice && cd git-practice", tone: "cmd" },
    { text: "$ git init", tone: "cmd" },
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  const head: Content = commits.length ? commits[commits.length - 1].lines : null;
  const short = statusShort(working, index, head);

  const run = (cmd: string, out: Line[] = []) => {
    setLog((prev) => [...prev, { text: `$ ${cmd}`, tone: "cmd" as const }, ...out].slice(-80));
    requestAnimationFrame(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const nextLine = working === null ? 0 : working.length;
  const editCmd =
    nextLine === 0 ? `echo "${LINES[0]}" > README.md` : `echo "${LINES[Math.min(nextLine, 1)]}" >> README.md`;

  const edit = () => {
    if (nextLine >= LINES.length) return;
    setWorking(LINES.slice(0, nextLine + 1));
    run(editCmd);
  };

  const add = () => {
    if (working === null) return run("git add README.md", [{ text: "fatal: pathspec 'README.md' did not match any files", tone: "warn" }]);
    setIndex(working);
    run("git add README.md");
  };

  const commitPlan = PLAN[Math.min(commits.length, PLAN.length - 1)];
  const commitCmd = `git commit -m "${commitPlan.msg}"`;

  const commit = () => {
    if (index !== null && !same(index, head)) {
      const added = index.length - (head?.length ?? 0);
      const root = commits.length === 0;
      setCommits((prev) => [...prev, { ...commitPlan, lines: index }]);
      return run(commitCmd, [
        { text: `[main ${root ? "(root-commit) " : ""}${commitPlan.hash}] ${commitPlan.msg}`, tone: "ok" },
        { text: ` 1 file changed, ${added} insertion${added > 1 ? "s" : ""}(+)` },
        ...(root ? [{ text: " create mode 100644 README.md" }] : []),
      ]);
    }
    if (commits.length === 0) {
      return run(
        commitCmd,
        working === null
          ? [
              { text: "On branch main" },
              { text: "" },
              { text: "Initial commit" },
              { text: "" },
              { text: 'nothing to commit (create/copy files and use "git add" to track)', tone: "warn" },
            ]
          : [
              { text: "On branch main" },
              { text: "" },
              { text: "Initial commit" },
              { text: "" },
              { text: "Untracked files:" },
              { text: '  (use "git add <file>..." to include in what will be committed)' },
              { text: "\tREADME.md", tone: "warn" },
              { text: "" },
              { text: 'nothing added to commit but untracked files present (use "git add" to track)', tone: "warn" },
            ],
      );
    }
    if (!same(working, index)) {
      return run(commitCmd, [
        { text: "On branch main" },
        { text: "Changes not staged for commit:" },
        { text: '  (use "git add <file>..." to update what will be committed)' },
        { text: '  (use "git restore <file>..." to discard changes in working directory)' },
        { text: "\tmodified:   README.md", tone: "warn" },
        { text: "" },
        { text: 'no changes added to commit (use "git add" and/or "git commit -a")', tone: "warn" },
      ]);
    }
    run(commitCmd, [{ text: "On branch main" }, { text: "nothing to commit, working tree clean" }]);
  };

  const restore = () => {
    if (index === null)
      return run("git restore README.md", [{ text: "error: pathspec 'README.md' did not match any file(s) known to git", tone: "warn" }]);
    setWorking(index);
    run("git restore README.md");
  };

  const reset = (mode: "soft" | "mixed" | "hard") => {
    const cmd = mode === "mixed" ? "git reset HEAD~1" : `git reset --${mode} HEAD~1`;
    if (commits.length < 2) return run(cmd, AMBIGUOUS.map((text) => ({ text, tone: "warn" as const })));
    const back = commits[commits.length - 2];
    setCommits((prev) => prev.slice(0, -1));
    if (mode === "soft") return run(cmd);
    setIndex(back.lines);
    if (mode === "mixed") {
      return run(cmd, same(working, back.lines) ? [] : [{ text: "Unstaged changes after reset:" }, { text: "M\tREADME.md" }]);
    }
    setWorking(back.lines);
    run(cmd, [{ text: `HEAD is now at ${back.hash} ${back.msg}` }]);
  };

  const startOver = () => {
    setWorking(null);
    setIndex(null);
    setCommits([]);
    setLog([
      { text: "$ mkdir git-practice && cd git-practice", tone: "cmd" },
      { text: "$ git init", tone: "cmd" },
    ]);
  };

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const toneClass = (t?: Line["tone"]) =>
    t === "cmd"
      ? "font-semibold text-accent dark:text-accent-dark"
      : t === "ok"
        ? "text-ok dark:text-ok-dark"
        : t === "warn"
          ? "text-action dark:text-action-dark"
          : t === "dim"
            ? muted
            : "";
  const btn = "btn tap-feedback min-h-11 justify-start px-3 text-left font-semibold text-label";

  return (
    <div data-figure className="not-prose panel @container my-6 flex flex-col gap-5 p-4 sm:p-5">
      <section className="grid grid-cols-1 gap-3 @xl:grid-cols-3" aria-label="세 가지 영역">
        <FileBox title="작업 폴더" sub="방 안의 물건" content={working} />
        <FileBox title="Staging Area" sub="택배 상자 (.git/index)" content={index} />
        <div className="flex min-w-0 flex-col gap-1.5 border border-line px-3 py-2.5 dark:border-line-dark">
          <p className="text-label font-bold">저장소</p>
          <p className={`text-label ${muted}`}>송장 붙여 보낸 상자 (git log --oneline)</p>
          <div className="min-h-14 bg-surface-2 px-2.5 py-1.5 font-mono text-label leading-relaxed dark:bg-surface-2-dark">
            {commits.length === 0 ? (
              <span className={muted}>(커밋 없음)</span>
            ) : (
              [...commits].reverse().map((c, i) => (
                <div key={c.hash} className={i === 0 ? "font-semibold" : ""}>
                  {c.hash} {c.msg}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-label font-bold">git status --short</h3>
        <p className="min-h-9 whitespace-pre bg-surface-2 px-3 py-1.5 font-mono text-label dark:bg-surface-2-dark" aria-live="polite">
          {short || <span className={`font-sans ${muted}`}>(아무것도 안 나와요: 세 영역이 모두 같아요)</span>}
        </p>
      </div>

      <section className="grid grid-cols-1 gap-2 @lg:grid-cols-2" aria-label="명령어">
        <button type="button" onClick={edit} disabled={nextLine >= LINES.length} className={`${btn} disabled:opacity-50`} aria-label="README.md에 한 줄 쓰기">
          {nextLine >= LINES.length ? "(더 쓸 줄이 없어요)" : editCmd}
        </button>
        <button type="button" onClick={add} className={btn}>
          git add README.md
        </button>
        <button type="button" onClick={commit} className={btn}>
          {commitCmd}
        </button>
        <button type="button" onClick={restore} className={btn}>
          git restore README.md
        </button>
        <button type="button" onClick={() => reset("soft")} className={btn}>
          git reset --soft HEAD~1
        </button>
        <button type="button" onClick={() => reset("mixed")} className={btn}>
          git reset HEAD~1
        </button>
        <button type="button" onClick={() => reset("hard")} className={btn}>
          git reset --hard HEAD~1
        </button>
        <button type="button" onClick={startOver} className="btn tap-feedback min-h-11 text-label">
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
          처음부터
        </button>
      </section>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-label font-bold">터미널</h3>
        <div
          ref={logRef}
          aria-live="polite"
          className="flex h-52 flex-col overflow-y-auto bg-surface-2 px-3 py-2 font-mono text-label leading-relaxed [tab-size:4] dark:bg-surface-2-dark"
        >
          {log.map((l, i) => (
            <div key={i} className={`min-h-[1lh] whitespace-pre-wrap break-all ${toneClass(l.tone)}`}>
              {l.text}
            </div>
          ))}
        </div>
        <p className={`text-label ${muted}`}>해시는 레슨 예시 값이에요. 실제로는 사람마다, 커밋할 때마다 달라요.</p>
      </div>
    </div>
  );
}
