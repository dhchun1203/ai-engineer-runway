"use client";

// 3회차 브랜치 합치기 시뮬레이터. 레슨 실습과 같은 그림에서 시작한다: main에 A, B가 있고
// feature/login이 B에서 갈라져 C, D를 쌓았다. 버튼 하나가 명령 한 번이다. main에 커밋 E를
// 만들지 말지에 따라 git merge가 Fast-forward가 되거나 merge 커밋 M을 만든다.
// 출력 창의 글자는 레슨에서 실제로 돌린 git 출력 그대로이고, 왜 그렇게 됐는지는 뒤에 # 주석으로 붙인다.

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Line = { text: string; why?: string; tone?: "cmd" | "ok" | "warn" | "dim" };
type Merge = null | "ff" | "3way" | "noff";
type Node = { id: string; x: number; y: number; kind: "main" | "feature" | "merge" };

const TOP = 42;
const MAIN = 96;
const START: Line[] = [{ text: "main: A, B / feature/login: B에서 갈라져 C, D", tone: "dim" }];

export function BranchMergeSimulator() {
  const [hasE, setHasE] = useState(false);
  const [merge, setMerge] = useState<Merge>(null);
  const [mergeHash, setMergeHash] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [log, setLog] = useState<Line[]>(START);
  const logRef = useRef<HTMLDivElement>(null);

  const say = (cmd: string, lines: Line[]) => {
    setLog((prev) => [...prev, { text: `$ ${cmd}`, tone: "cmd" as const }, ...lines].slice(-60));
    requestAnimationFrame(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const commitE = () => {
    setHasE(true);
    say('git commit -m "E"', [{ text: "[main 5aa7a3c] E", why: "main에도 새 커밋 E가 생겼어요" }]);
  };

  const doMerge = (noFf: boolean) => {
    const cmd = noFf ? "git merge --no-ff feature/login" : "git merge feature/login";
    if (deleted) return say(cmd, [{ text: "merge: feature/login - not something we can merge", why: "브랜치를 이미 지웠어요", tone: "warn" }]);
    if (merge) return say(cmd, [{ text: "Already up to date.", why: "이미 합쳐서 더 가져올 게 없어요" }]);
    if (!hasE && !noFf) {
      setMerge("ff");
      return say(cmd, [
        { text: "Updating dc67246..d6e0dc5" },
        { text: "Fast-forward", why: "main에 새 커밋이 없어서 책갈피만 D로 옮겨요", tone: "ok" },
        { text: " login.txt | 2 ++" },
      ]);
    }
    if (!hasE && noFf) {
      setMerge("noff");
      setMergeHash("75a68d2");
      return say(cmd, [
        { text: "Merge made by the 'ort' strategy.", why: "Fast-forward가 되는 상황이지만 merge 커밋 M을 남겨요", tone: "ok" },
      ]);
    }
    setMerge("3way");
    setMergeHash(noFf ? null : "c759821");
    say(cmd, [
      {
        text: "Merge made by the 'ort' strategy.",
        why: noFf ? "어차피 merge 커밋이 생기는 상황이라 옵션 없이 합칠 때와 같아요" : "양쪽에 새 커밋이 있어서 B, E, D를 비교해 M을 만들어요",
        tone: "ok",
      },
      { text: " login.txt | 2 ++" },
    ]);
  };

  const deleteBranch = () => {
    const cmd = "git branch -d feature/login";
    if (deleted) return say(cmd, [{ text: "Error: branch 'feature/login' not found", why: "이미 지웠어요", tone: "warn" }]);
    if (!merge)
      return say(cmd, [
        { text: "error: the branch 'feature/login' is not fully merged", why: "C, D가 아직 main에 없어요", tone: "warn" },
        { text: "hint: If you are sure you want to delete it, run 'git branch -D feature/login'", tone: "warn" },
      ]);
    setDeleted(true);
    say(cmd, [{ text: "Deleted branch feature/login (was d6e0dc5).", why: "책갈피만 빠지고 커밋 C, D는 main 줄기에 남아요", tone: "ok" }]);
  };

  const reset = () => {
    setHasE(false);
    setMerge(null);
    setMergeHash(null);
    setDeleted(false);
    setLog(START);
  };

  // 그래프 배치. Fast-forward는 한 줄로 펴고, 나머지는 feature를 윗줄에 둔다.
  const nodes: Node[] =
    merge === "ff"
      ? [
          { id: "A", x: 30, y: MAIN, kind: "main" },
          { id: "B", x: 95, y: MAIN, kind: "main" },
          { id: "C", x: 160, y: MAIN, kind: "feature" },
          { id: "D", x: 225, y: MAIN, kind: "feature" },
        ]
      : [
          { id: "A", x: 30, y: MAIN, kind: "main" },
          { id: "B", x: 95, y: MAIN, kind: "main" },
          { id: "C", x: 160, y: TOP, kind: "feature" },
          { id: "D", x: 225, y: TOP, kind: "feature" },
          ...(hasE ? [{ id: "E", x: 160, y: MAIN, kind: "main" as const }] : []),
          ...(merge ? [{ id: "M", x: 290, y: MAIN, kind: "merge" as const }] : []),
        ];
  const at = (id: string) => nodes.find((n) => n.id === id)!;
  const edges: [string, string][] = [
    ["A", "B"],
    ["B", "C"],
    ["C", "D"],
    ...(hasE && merge !== "ff" ? ([["B", "E"]] as [string, string][]) : []),
    ...(merge === "3way" || merge === "noff" ? ([[hasE ? "E" : "B", "M"], ["D", "M"]] as [string, string][]) : []),
  ];
  const mainAt = merge === "ff" ? "D" : merge ? "M" : hasE ? "E" : "B";
  const nodeFill = (k: Node["kind"]) =>
    k === "main" ? "fill-accent dark:fill-accent-dark" : k === "feature" ? "fill-action dark:fill-action-dark" : "fill-ok dark:fill-ok-dark";

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const toneClass = (t?: Line["tone"]) =>
    t === "cmd"
      ? "font-semibold"
      : t === "ok"
        ? "text-ok dark:text-ok-dark"
        : t === "warn"
          ? "text-action dark:text-action-dark"
          : t === "dim"
            ? muted
            : "";

  const m = at(mainAt);
  const d = at("D");
  const summary =
    merge === "ff"
      ? `Fast-forward: merge 커밋 없이 main 책갈피가 D로 앞당겨졌어요.${deleted ? "" : " feature/login과 같은 커밋이에요."}`
      : merge
        ? `merge 커밋 M${mergeHash ? ` (${mergeHash})` : ""}이 생겼어요. M의 부모는 ${hasE ? "E" : "B"}와 D 둘이에요.`
        : hasE
          ? "양쪽에 새 커밋이 있어요. 지금 합치면 3-way merge예요."
          : "main에 새 커밋이 없어요. 지금 합치면 Fast-forward예요.";

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2" aria-label="커밋 그래프">
          <h3 className="text-label font-bold">커밋 그래프 (HEAD는 main에 있어요)</h3>
          <svg viewBox="0 0 330 135" className="w-full max-w-lg" role="img" aria-label={summary}>
            {edges.map(([a, b]) => {
              const p = at(a);
              const q = at(b);
              return (
                <line
                  key={`${a}${b}`}
                  x1={p.x}
                  y1={p.y}
                  x2={q.x}
                  y2={q.y}
                  strokeWidth={2.5}
                  className="stroke-badge-neutral-text dark:stroke-badge-neutral-text-dark"
                />
              );
            })}
            {nodes.map((n) => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={13} className={nodeFill(n.kind)} />
                <text x={n.x} y={n.y + 4.5} textAnchor="middle" fontSize={13} fontWeight={700} className="fill-surface dark:fill-background-dark">
                  {n.id}
                </text>
              </g>
            ))}
            <text x={m.x} y={m.y + 32} textAnchor="middle" fontSize={11} fontWeight={700} className="fill-accent font-mono dark:fill-accent-dark">
              HEAD -&gt; main
            </text>
            {deleted ? null : (
              <text x={d.x} y={d.y - 22} textAnchor="middle" fontSize={11} fontWeight={700} className="fill-action font-mono dark:fill-action-dark">
                feature/login
              </text>
            )}
          </svg>
          <p className="text-label leading-relaxed" aria-live="polite">
            {summary}
            {deleted ? " feature/login 책갈피는 지웠어요." : ""}
          </p>
        </section>

        <section className="flex flex-col gap-2" aria-label="명령">
          <h3 className="text-label font-bold">명령 (main에 서서)</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={commitE}
              disabled={hasE || merge !== null}
              className="btn tap-feedback min-h-11 px-3 font-mono text-label"
              aria-label="main에 커밋 E 만들기"
            >
              git commit -m &quot;E&quot;
            </button>
            <button type="button" onClick={() => doMerge(false)} className="btn tap-feedback min-h-11 px-3 font-mono text-label">
              git merge feature/login
            </button>
            <button type="button" onClick={() => doMerge(true)} className="btn tap-feedback min-h-11 px-3 font-mono text-label">
              git merge --no-ff feature/login
            </button>
            <button type="button" onClick={deleteBranch} className="btn tap-feedback min-h-11 px-3 font-mono text-label">
              git branch -d feature/login
            </button>
            <button type="button" onClick={reset} className="btn-action tap-feedback min-h-11 text-label">
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              처음부터
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-1.5" aria-label="출력">
          <h3 className="text-label font-bold">터미널 출력</h3>
          <div
            ref={logRef}
            aria-live="polite"
            className="flex h-44 flex-col gap-0.5 overflow-y-auto whitespace-pre-wrap bg-surface-2 px-3 py-2 font-mono text-label leading-relaxed dark:bg-surface-2-dark"
          >
            {log.map((l, i) => (
              <div key={i} className={toneClass(l.tone)}>
                {l.text}
                {l.why ? <span className={`font-normal ${muted}`}>{`  # ${l.why}`}</span> : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
