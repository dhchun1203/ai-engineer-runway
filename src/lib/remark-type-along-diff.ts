// 파이썬 손풀기(practiceLessons)의 "직접 치기" 칸(<TypeAlong>)에 GitHub처럼 바뀐 줄을 표시한다(2026-11-25).
//
// 같은 단원의 "어제 끝난 코드(시작 코드) 보기" 접힌 칸에서 파일별 코드를 모으고, 직접 치기 칸의
// 코드를 같은 파일의 직전 버전과 줄 단위로 비교한다. 파일 이름은 코드 바로 앞 문단의 `ledger.py`
// 같은 인라인 코드로 정하고, 없으면 main.py다. 한 단원에 같은 파일의 직접 치기 칸이 또 나오면
// 앞 칸이 직전 버전이 된다. 직전 버전이 없는 새 파일은 표시하지 않는다.
//
// 2026-11-25 추가: "고쳐 치기", "혼자 치기"의 정답 코드(<summary>정답 코드 보기...</summary> 접힌 칸)도
// 같은 파일의 바로 앞 단계(따라 치기 코드, 고쳐 치기 정답)와 비교해 표시한다. 정답 칸의 파일 이름은
// "정답 코드 보기: ui.py"처럼 summary 끝에 있거나 코드 앞 문단에 있다.
//
// 결과: 지울 줄을 제자리에 끼워 넣은 코드로 바꾸고, rehype-pretty-code의 줄 ID 메타
// ({1,3-5}#add {2}#del)로 줄마다 data-highlighted-line-id를 붙인다. 직접 치기 칸은 <TypeAlong>에,
// 정답 코드는 새로 감싼 <CodeDiff>에 added, removed, base(무엇과 비교했나) 속성을 달아
// 범례와 끄고 켜기 버튼이 쓰게 한다(src/components/practice/type-along.tsx).

type Node = {
  type: string;
  name?: string;
  value?: string;
  lang?: string | null;
  meta?: string | null;
  children?: Node[];
  attributes?: { type: string; name: string; value: unknown }[];
};

const DEFAULT_FILE = "main.py";

function textOf(node: Node): string {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(textOf).join("");
}

// `ledger.py` 또는 `models.py` (새 파일)처럼 인라인 코드로 시작하는 문단이면 파일 이름을 돌려준다.
function fileLabel(node: Node | undefined): string | null {
  if (!node || node.type !== "paragraph") return null;
  const first = node.children?.[0];
  if (first?.type === "inlineCode" && /^[\w./-]+\.py$/.test(first.value ?? "")) return first.value ?? null;
  return null;
}

function isJsx(node: Node, name: string): boolean {
  return (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && node.name === name;
}

type Op = { kind: "same" | "add" | "del"; line: string };

// 최장 공통 부분열로 줄 단위 비교. 바뀐 덩어리 안에서는 지울 줄을 먼저, 새 줄을 뒤에 둔다.
export function diffLines(before: string[], after: string[]): Op[] {
  const n = before.length;
  const m = after.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = before[i] === after[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  let dels: Op[] = [];
  let adds: Op[] = [];
  const flush = () => {
    ops.push(...dels, ...adds);
    dels = [];
    adds = [];
  };
  while (i < n || j < m) {
    if (i < n && j < m && before[i] === after[j]) {
      flush();
      ops.push({ kind: "same", line: after[j] });
      i++;
      j++;
    } else if (j < m && (i === n || lcs[i][j + 1] >= lcs[i + 1][j])) {
      adds.push({ kind: "add", line: after[j] });
      j++;
    } else {
      dels.push({ kind: "del", line: before[i] });
      i++;
    }
  }
  flush();
  return ops;
}

function ranges(nums: number[]): string {
  const out: string[] = [];
  for (let k = 0; k < nums.length; k++) {
    const start = nums[k];
    while (k + 1 < nums.length && nums[k + 1] === nums[k] + 1) k++;
    out.push(start === nums[k] ? `${start}` : `${start}-${nums[k]}`);
  }
  return out.join(",");
}

const splitLines = (code: string) => code.replace(/\n$/, "").split("\n");

type Version = { code: string; base: string };
type Files = Map<string, Version>;

function attr(name: string, value: string) {
  return { type: "mdxJsxAttribute", name, value };
}

// 코드 노드를 직전 버전과 비교해 줄 표시를 붙인다. 바뀐 줄이 있으면 [added, removed, base]를 돌려준다.
function markCode(code: Node, label: string, files: Files, nextBase: string): string[] | null {
  if (typeof code.value !== "string") return null;
  const finalCode = code.value;
  const prev = files.get(label);
  files.set(label, { code: finalCode, base: nextBase });
  if (!prev) return null;

  const ops = diffLines(splitLines(prev.code), splitLines(finalCode));
  const added: number[] = [];
  const removed: number[] = [];
  ops.forEach((op, idx) => {
    if (op.kind === "add") added.push(idx + 1);
    if (op.kind === "del") removed.push(idx + 1);
  });
  if (added.length === 0 && removed.length === 0) return null;

  code.value = ops.map((op) => op.line).join("\n");
  const meta = [code.meta ?? ""];
  if (added.length) meta.push(`{${ranges(added)}}#add`);
  if (removed.length) meta.push(`{${ranges(removed)}}#del`);
  code.meta = meta.join(" ").trim();
  return [String(added.length), String(removed.length), prev.base];
}

function isPython(node: Node | undefined): boolean {
  return node?.type === "code" && node.lang === "python";
}

function collectStartCode(details: Node, files: Files) {
  const kids = details.children ?? [];
  kids.forEach((child, idx) => {
    if (isPython(child) && typeof child.value === "string") {
      files.set(fileLabel(kids[idx - 1]) ?? DEFAULT_FILE, { code: child.value, base: "어제 코드" });
    }
  });
}

function markTypeAlong(el: Node, label: string, files: Files) {
  const code = (el.children ?? []).find(isPython);
  if (!code) return;
  const result = markCode(code, label, files, "따라 치기 코드");
  if (!result) return;
  const [added, removed, base] = result;
  el.attributes = [...(el.attributes ?? []), attr("added", added), attr("removed", removed), attr("base", base)];
}

// 정답 접힌 칸: 코드마다 바로 앞 단계와 비교하고, 바뀐 코드는 <CodeDiff>로 감싼다.
function markAnswer(details: Node, summaryText: string, section: string, files: Files) {
  const fromSummary = summaryText.match(/:\s*([\w./-]+\.py)\s*$/)?.[1] ?? null;
  const nextBase = section.includes("혼자 치기") ? "혼자 치기 정답" : "고쳐 치기 정답";
  const kids = details.children ?? [];
  kids.forEach((child, idx) => {
    if (!isPython(child)) return;
    const label = fileLabel(kids[idx - 1]) ?? fromSummary ?? DEFAULT_FILE;
    const result = markCode(child, label, files, nextBase);
    if (!result) return;
    const [added, removed, base] = result;
    kids[idx] = {
      type: "mdxJsxFlowElement",
      name: "CodeDiff",
      attributes: [attr("added", added), attr("removed", removed), attr("base", base)],
      children: [child],
    };
  });
}

function walk(parent: Node, files: Files, state: { section: string }) {
  const kids = parent.children ?? [];
  kids.forEach((child, idx) => {
    if (child.type === "heading" && (child as Node & { depth?: number }).depth === 2) {
      state.section = textOf(child);
      return;
    }
    if (isJsx(child, "details")) {
      const summary = (child.children ?? []).find((c) => isJsx(c, "summary"));
      const summaryText = summary ? textOf(summary) : "";
      if (summaryText.includes("시작 코드")) {
        collectStartCode(child, files);
        return;
      }
      if (summaryText.includes("정답 코드")) {
        markAnswer(child, summaryText, state.section, files);
        return;
      }
    }
    if (isJsx(child, "TypeAlong")) {
      markTypeAlong(child, fileLabel(kids[idx - 1]) ?? DEFAULT_FILE, files);
      return;
    }
    if (child.children) walk(child, files, state);
  });
}

export function remarkTypeAlongDiff() {
  return (tree: Node) => {
    walk(tree, new Map(), { section: "" });
  };
}
