// 파이썬 손풀기(practiceLessons)의 "직접 치기" 칸(<TypeAlong>)에 GitHub처럼 바뀐 줄을 표시한다(2026-11-25).
//
// 같은 단원의 "어제 끝난 코드(시작 코드) 보기" 접힌 칸에서 파일별 코드를 모으고, 직접 치기 칸의
// 코드를 같은 파일의 직전 버전과 줄 단위로 비교한다. 파일 이름은 코드 바로 앞 문단의 `ledger.py`
// 같은 인라인 코드로 정하고, 없으면 main.py다. 한 단원에 같은 파일의 직접 치기 칸이 또 나오면
// 앞 칸이 직전 버전이 된다. 직전 버전이 없는 새 파일은 표시하지 않는다.
//
// 결과: 지울 줄을 제자리에 끼워 넣은 코드로 바꾸고, rehype-pretty-code의 줄 ID 메타
// ({1,3-5}#add {2}#del)로 줄마다 data-highlighted-line-id를 붙인다. <TypeAlong>에는
// added, removed 속성을 달아 범례와 끄고 켜기 버튼이 쓰게 한다(type-along.tsx).

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

function collectStartCode(details: Node, files: Map<string, string>) {
  const kids = details.children ?? [];
  kids.forEach((child, idx) => {
    if (child.type === "code" && child.lang === "python" && typeof child.value === "string") {
      files.set(fileLabel(kids[idx - 1]) ?? DEFAULT_FILE, child.value);
    }
  });
}

function markTypeAlong(el: Node, label: string, files: Map<string, string>) {
  const code = (el.children ?? []).find((c) => c.type === "code" && c.lang === "python");
  if (!code || typeof code.value !== "string") return;
  const finalCode = code.value;
  const before = files.get(label);
  files.set(label, finalCode);
  if (before === undefined) return;

  const ops = diffLines(splitLines(before), splitLines(finalCode));
  const added: number[] = [];
  const removed: number[] = [];
  ops.forEach((op, idx) => {
    if (op.kind === "add") added.push(idx + 1);
    if (op.kind === "del") removed.push(idx + 1);
  });
  if (added.length === 0 && removed.length === 0) return;

  code.value = ops.map((op) => op.line).join("\n");
  const meta = [code.meta ?? ""];
  if (added.length) meta.push(`{${ranges(added)}}#add`);
  if (removed.length) meta.push(`{${ranges(removed)}}#del`);
  code.meta = meta.join(" ").trim();

  el.attributes = [
    ...(el.attributes ?? []),
    { type: "mdxJsxAttribute", name: "added", value: String(added.length) },
    { type: "mdxJsxAttribute", name: "removed", value: String(removed.length) },
  ];
}

function walk(parent: Node, files: Map<string, string>) {
  const kids = parent.children ?? [];
  kids.forEach((child, idx) => {
    if (isJsx(child, "details")) {
      const summary = (child.children ?? []).find((c) => isJsx(c, "summary"));
      if (summary && textOf(summary).includes("시작 코드")) {
        collectStartCode(child, files);
        return;
      }
    }
    if (isJsx(child, "TypeAlong")) {
      markTypeAlong(child, fileLabel(kids[idx - 1]) ?? DEFAULT_FILE, files);
      return;
    }
    if (child.children) walk(child, files);
  });
}

export function remarkTypeAlongDiff() {
  return (tree: Node) => {
    walk(tree, new Map());
  };
}
