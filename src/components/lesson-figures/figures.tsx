// 레슨 본문 그림 부품. "개념 하나 = 짧은 글 + 그 아래 그림 한 장" 방식(2026-11-13 사용자가
// 고른 레슨 문체)을 MDX에서 바로 쓰게 한다. 모두 서버 컴포넌트다(상태 없음).
//
// 글자 안의 `코드`와 **굵게**는 rich()가 바꿔 준다. MDX 속성은 문자열이라 마크다운이
// 먹지 않기 때문이다.
//
// 색은 역할로 고른다. 같은 레슨 안에서 한 대상(예: 상품)은 끝까지 한 색이다.
// blue = 주인공(장바구니처럼 다른 것을 꺼내 쓰는 쪽), rust = 재료(상품), amber = 세 번째 대상,
// ok = 통과, red = 막힘, neutral = 배경 역할. 글자는 잉크 색을 쓰고 제목만 대상 색을 입는다.

import { Fragment, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

export type Tone = "blue" | "rust" | "amber" | "ok" | "red" | "neutral";

const TONE: Record<Tone, { box: string; title: string; chip: string; line: string; left?: string }> = {
  blue: {
    box: "border-accent bg-accent/8 dark:border-accent-dark dark:bg-accent-dark/12",
    title: "text-accent dark:text-accent-dark",
    chip: "bg-accent text-surface dark:bg-accent-dark dark:text-background-dark",
    line: "border-accent dark:border-accent-dark",
    left: "border-l-accent dark:border-l-accent-dark",
  },
  rust: {
    box: "border-action bg-action/8 dark:border-action-dark dark:bg-action-dark/12",
    title: "text-action dark:text-action-dark",
    chip: "bg-action text-surface dark:bg-action-dark dark:text-background-dark",
    line: "border-action dark:border-action-dark",
    left: "border-l-action dark:border-l-action-dark",
  },
  amber: {
    box: "border-warn bg-warn/8 dark:border-warn-dark dark:bg-warn-dark/12",
    title: "text-warn dark:text-warn-dark",
    chip: "bg-warn text-surface dark:bg-warn-dark dark:text-background-dark",
    line: "border-warn dark:border-warn-dark",
  },
  ok: {
    box: "border-ok bg-ok/8 dark:border-ok-dark dark:bg-ok-dark/12",
    title: "text-ok dark:text-ok-dark",
    chip: "bg-ok text-surface dark:bg-ok-dark dark:text-background-dark",
    line: "border-ok dark:border-ok-dark",
  },
  red: {
    box: "border-destructive bg-destructive/8 dark:border-destructive-dark dark:bg-destructive-dark/12",
    title: "text-destructive dark:text-destructive-dark",
    chip: "bg-destructive text-surface dark:bg-destructive-dark dark:text-background-dark",
    line: "border-destructive dark:border-destructive-dark",
  },
  neutral: {
    box: "border-line bg-surface-2/50 dark:border-line-dark dark:bg-surface-2-dark/50",
    title: "text-foreground dark:text-foreground-dark",
    chip: "bg-foreground text-surface dark:bg-foreground-dark dark:text-background-dark",
    line: "border-line dark:border-line-dark",
  },
};

const CODE =
  "whitespace-nowrap rounded-sm bg-surface-2 px-1 py-px font-mono text-[0.88em] dark:bg-surface-2-dark";
const MUTED = "text-badge-neutral-text dark:text-badge-neutral-text-dark";

// `코드`와 **굵게**만 다룬다. 둘 다 짝이 맞지 않으면 글자 그대로 둔다.
export function rich(text: string): ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className={CODE}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

// 그림 한 장의 바깥 틀. 본문 글꼴 규칙(prose)을 끊고, 좁은 화면에서는 그림만 가로로 밀린다.
export function Figure({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <figure data-figure className="not-prose panel my-6 flex flex-col gap-4 overflow-x-auto p-4 sm:p-5">
      {label ? <figcaption className={`text-label font-bold ${MUTED}`}>{label}</figcaption> : null}
      {children}
    </figure>
  );
}

// 그림 아래 한두 줄 덧붙임. 본문보다 작고 흐리다.
export function Hint({ children }: { children: ReactNode }) {
  return (
    <div
      data-figure
      className={`not-prose -mt-2 mb-6 text-label leading-relaxed ${MUTED} [&_code]:rounded-sm [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.88em] dark:[&_code]:bg-surface-2-dark`}
    >
      {children}
    </div>
  );
}

type BoxData = { title: string; lines?: string[]; tone?: Tone; dashed?: boolean; note?: string };

function Box({ title, lines = [], tone = "neutral", dashed = false, note }: BoxData) {
  return (
    <div className={`min-w-0 flex-1 border-2 px-4 py-3 ${TONE[tone].box} ${dashed ? "border-dashed" : ""}`}>
      <p className={`font-mono text-body font-semibold ${TONE[tone].title}`}>{title}</p>
      {note ? <p className={`text-label ${MUTED}`}>{note}</p> : null}
      {lines.length > 0 ? (
        <ul className={`mt-1.5 flex list-disc flex-col gap-0.5 pl-4 text-label leading-relaxed ${MUTED}`}>
          {lines.map((l, i) => (
            <li key={i}>{rich(l)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// 화살표 하나 + 짧은 말. 넓은 화면에서는 좌우, 좁은 화면에서는 위아래로 눕는다.
function Connector({ label, dir }: { label: string; dir: "left" | "right" }) {
  const Wide = dir === "left" ? ArrowLeft : ArrowRight;
  const Narrow = dir === "left" ? ArrowUp : ArrowDown;
  return (
    <div className={`flex shrink-0 flex-row items-center justify-center gap-2 text-center text-label leading-snug sm:w-28 sm:flex-col sm:gap-1 ${MUTED}`}>
      <Wide className="hidden h-5 w-5 text-foreground sm:block dark:text-foreground-dark" aria-hidden="true" />
      <Narrow className="h-5 w-5 text-foreground sm:hidden dark:text-foreground-dark" aria-hidden="true" />
      <span className="break-keep">{rich(label)}</span>
    </div>
  );
}

export type BoxItem = BoxData | { arrow: string; dir?: "left" | "right" };

// 누가 누구를 쓰나: 상자 사이에 화살표. below의 상자들은 줄 아래에 폭 전체로 놓인다.
export function Boxes({ row, below = [] }: { row: BoxItem[]; below?: BoxData[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {row.map((item, i) =>
          "arrow" in item ? (
            <Connector key={i} label={item.arrow} dir={item.dir ?? "right"} />
          ) : (
            <Box key={i} {...item} />
          ),
        )}
      </div>
      {below.map((b, i) => (
        <Box key={i} {...b} />
      ))}
    </div>
  );
}

type LayerBox = BoxData & { via?: string };

// 위에서 아래로 기대는 구조: 위층이 아래층을 꺼내 쓴다. 한 층에 상자가 여럿이면 나란히 놓고,
// via는 그 상자 바로 위에 붙는 화살표 말("Cart가 꺼내 씀")이다. 상자가 셋 이상 한 줄에 서면
// 본문 폭에서 코드가 잘게 끊겨서, 지도는 이 층 구조로 그린다.
export function Layers({ layers }: { layers: LayerBox[][] }) {
  return (
    <div className="flex flex-col gap-1">
      {layers.map((row, i) => (
        <div key={i} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          {row.map(({ via, ...box }, j) => (
            <div key={j} className="flex min-w-0 flex-1 flex-col gap-1">
              {via ? (
                <div className={`flex items-center gap-1.5 py-1 pl-3 text-label ${MUTED}`}>
                  <ArrowDown className="h-4 w-4 shrink-0 text-foreground dark:text-foreground-dark" aria-hidden="true" />
                  <span className="break-keep">{rich(via)}</span>
                </div>
              ) : null}
              <div className="flex flex-1">
                <Box {...box} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// 값이 차례로 바뀌는 모습: 1 -> 2 -> 3. 마지막 칸(지금 값)만 강조한다.
export function Trail({ label, values, tone = "rust" }: { label?: string; values: string[]; tone?: Tone }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 font-mono text-label">
      {label ? <span className={`mr-1 font-sans ${MUTED}`}>{rich(label)}</span> : null}
      {values.map((v, i) => {
        const last = i === values.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 ? <ArrowRight className={`h-3.5 w-3.5 shrink-0 ${MUTED}`} aria-label="다음" /> : null}
            <span
              className={`border px-2 py-0.5 ${
                last ? `${TONE[tone].line} font-semibold ${TONE[tone].title}` : "border-line dark:border-line-dark"
              }`}
            >
              {v}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}

type CardData = { badge: string; lines: string[]; warn?: boolean };

// 틀 하나에서 실물이 여러 개 찍혀 나오는 모습(클래스와 인스턴스).
export function Blueprint({
  template,
  cards,
  tone = "rust",
  trail,
}: {
  template: BoxData;
  cards: CardData[];
  tone?: Tone;
  trail?: { label: string; values: string[] };
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        <div className="flex md:w-64 md:shrink-0">
          <Box {...template} tone={template.tone ?? tone} />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
          {cards.map((c, i) => {
            const t = c.warn ? "red" : tone;
            return (
              <div key={i} className={`border bg-surface p-2.5 font-mono text-label leading-relaxed dark:bg-surface-dark ${TONE[t].line}`}>
                <span className={`inline-block px-1.5 font-semibold ${TONE[t].chip}`}>{c.badge}</span>
                {c.lines.map((l, j) => (
                  <div key={j} className="font-sans">
                    {rich(l)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      {trail ? <Trail label={trail.label} values={trail.values} tone={tone} /> : null}
    </div>
  );
}

type Gate = { q: string; code?: string; yes?: string; out: string; outTone?: Tone };

// 문지기 흐름: 질문마다 "예"면 옆으로 빠지고, "아니오"면 아래로 내려간다. 끝까지 오면 통과.
export function GateFlow({ gates, pass, noLabel = "아니오" }: { gates: Gate[]; pass: { text: string; code?: string }; noLabel?: string }) {
  return (
    <div className="flex flex-col">
      {gates.map((g, i) => (
        <Fragment key={i}>
          <div className="grid grid-cols-1 items-center gap-1.5 sm:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] sm:gap-2">
            <div className={`border-2 px-3.5 py-2.5 text-body font-semibold leading-snug ${TONE.blue.box}`}>
              {rich(g.q)}
              {g.code ? <span className={`mt-0.5 block font-mono text-label font-normal ${MUTED}`}>{g.code}</span> : null}
            </div>
            <div className={`flex items-center gap-1 pl-4 text-label font-semibold sm:justify-center sm:pl-0 ${TONE[g.outTone ?? "red"].title}`}>
              <span>{g.yes ?? "예"}</span>
              <ArrowRight className="hidden h-4 w-4 sm:block" aria-hidden="true" />
              <ArrowDown className="h-4 w-4 sm:hidden" aria-hidden="true" />
            </div>
            <div className={`border px-3.5 py-2 text-label leading-snug ${TONE[g.outTone ?? "red"].box}`}>{rich(g.out)}</div>
          </div>
          <div className={`ml-6 flex items-center gap-1 border-l-2 py-2 pl-3 text-label font-semibold ${TONE.ok.title} border-line dark:border-line-dark`}>
            {noLabel}
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </div>
        </Fragment>
      ))}
      <div className={`border-2 px-3.5 py-2.5 text-body font-semibold sm:max-w-[calc(50%-2.25rem)] ${TONE.ok.box}`}>
        {rich(pass.text)}
        {pass.code ? <span className={`mt-0.5 block font-mono text-label font-normal ${MUTED}`}>{pass.code}</span> : null}
      </div>
    </div>
  );
}

// 딕셔너리 속 보기: 이름 = { 키 | 값, 키 | 값 }. 키와 값은 색으로 나누고 아래에 범례를 단다.
export function DictView({
  name,
  pairs,
  keyLabel = "키",
  valueLabel = "값",
  keyTone = "rust",
  valueTone = "blue",
}: {
  name: string;
  pairs: [string, string][];
  keyLabel?: string;
  valueLabel?: string;
  keyTone?: Tone;
  valueTone?: Tone;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 font-mono text-body">
        <span>{name} = {"{"}</span>
        {pairs.length === 0 ? <span className={MUTED}>(비어 있음)</span> : null}
        {pairs.map(([k, v], i) => (
          <span key={i} className="inline-flex border border-line dark:border-line-dark">
            <span className={`px-2.5 py-1 ${TONE[keyTone].box} ${TONE[keyTone].title} border-0`}>{k}</span>
            <span className={`px-2.5 py-1 font-semibold ${TONE[valueTone].box} ${TONE[valueTone].title} border-0`}>{v}</span>
          </span>
        ))}
        <span>{"}"}</span>
      </div>
      <div className={`flex flex-wrap gap-4 text-label ${MUTED}`}>
        <span className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 ${TONE[keyTone].chip}`} aria-hidden="true" />
          {rich(keyLabel)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 ${TONE[valueTone].chip}`} aria-hidden="true" />
          {rich(valueLabel)}
        </span>
      </div>
    </div>
  );
}

type Leg = { fn: string; desc: string; ex?: string; value: string };

// 이어달리기 계산: 앞 칸의 결과를 다음 칸이 받아 쓴다.
export function Relay({ legs, tone = "blue" }: { legs: Leg[]; tone?: Tone }) {
  return (
    <div className="flex flex-col items-stretch gap-2 md:flex-row">
      {legs.map((l, i) => (
        <Fragment key={i}>
          {i > 0 ? (
            <div className="flex items-center justify-center" aria-hidden="true">
              <ArrowRight className={`hidden h-4 w-4 md:block ${MUTED}`} />
              <ArrowDown className={`h-4 w-4 md:hidden ${MUTED}`} />
            </div>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-1 border border-line bg-surface px-3.5 py-3 dark:border-line-dark dark:bg-surface-dark">
            <span className={`font-mono text-label font-semibold ${TONE[tone].title}`}>{l.fn}</span>
            <span className="text-label leading-snug">{rich(l.desc)}</span>
            {l.ex ? <span className={`font-mono text-label ${MUTED}`}>{l.ex}</span> : null}
            <span className="mt-auto pt-1 font-mono text-heading font-semibold tabular-nums">{l.value}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

// 번호 붙은 순서. 각 단계는 굵은 머리말 + 한 줄 설명.
export function Seq({ steps, tone = "blue" }: { steps: { title: string; body?: string }[]; tone?: Tone }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <li key={i} className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-3">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-label font-semibold ${TONE[tone].chip}`}>
            {i + 1}
          </span>
          <span className="pt-0.5 text-body leading-relaxed">
            <strong>{rich(s.title)}</strong> {s.body ? rich(s.body) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

// 이름표 여럿이 상자 하나를 가리키는 모습(복사가 아니라 가리키기).
export function SharedRef({
  names,
  target,
  trail,
  tone = "rust",
}: {
  names: string[];
  target: BoxData;
  trail?: { label: string; values: string[] };
  tone?: Tone;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-row flex-wrap gap-2 sm:flex-col">
          {names.map((n, i) => (
            <span key={i} className="border border-foreground px-2.5 py-1 font-mono text-label dark:border-foreground-dark">
              {n}
            </span>
          ))}
        </div>
        <div className={`flex items-center gap-1.5 px-1 text-label ${MUTED}`}>
          <ArrowRight className="hidden h-5 w-5 sm:block" aria-hidden="true" />
          <ArrowDown className="h-5 w-5 sm:hidden" aria-hidden="true" />
          <span>둘 다 같은 상자를 가리켜요</span>
        </div>
        <Box {...target} tone={target.tone ?? tone} />
      </div>
      {trail ? <Trail label={trail.label} values={trail.values} tone="red" /> : null}
    </div>
  );
}

// 부모 하나 아래 자식 여럿(상속). 자식 상자는 부모에게서 받은 것과 자기만 가진 것을 나눠 적는다.
export function Inherit({ parent, kids, edge = "물려받기" }: { parent: BoxData; kids: BoxData[]; edge?: string }) {
  return (
    <div className="flex flex-col items-stretch gap-2">
      <div className="flex justify-center">
        <div className="flex w-full sm:w-2/3">
          <Box {...parent} tone={parent.tone ?? "amber"} />
        </div>
      </div>
      <div className={`flex items-center justify-center gap-1.5 text-label ${MUTED}`}>
        <ArrowDown className="h-4 w-4" aria-hidden="true" />
        {rich(edge)}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {kids.map((k, i) => (
          <Box key={i} {...k} tone={k.tone ?? "amber"} />
        ))}
      </div>
    </div>
  );
}

// 같은 호출 한 줄이 객체마다 다른 답을 낸다(다형성).
export function FanOut({
  call,
  targets,
  tone = "amber",
}: {
  call: string;
  targets: { title: string; result: string; why?: string }[];
  tone?: Tone;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="self-start border-2 border-foreground bg-surface px-3 py-2 font-mono text-body font-semibold dark:border-foreground-dark dark:bg-surface-dark">
        {call}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {targets.map((t, i) => (
          <div key={i} className={`flex flex-col gap-1 border px-3 py-2.5 ${TONE[tone].box}`}>
            <span className={`text-label font-semibold leading-snug ${TONE[tone].title}`}>{rich(t.title)}</span>
            <span className="font-mono text-heading font-semibold tabular-nums">{t.result}</span>
            {t.why ? <span className={`text-label leading-snug ${MUTED}`}>{rich(t.why)}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// 짚고 넘어갈 곳. warn = 고칠 거리, info = 알아 두면 좋은 것. 안에는 마크다운(코드 블록 포함)을 쓴다.
export function Note({ title, tone = "warn", children }: { title: string; tone?: "warn" | "info"; children: ReactNode }) {
  const t = tone === "warn" ? TONE.rust : TONE.blue;
  return (
    <div className={`my-4 border border-l-4 border-line bg-surface px-4 py-3 dark:border-line-dark dark:bg-surface-dark ${t.left} [&>*:first-child]:mt-0 [&>*:last-child]:mb-0`}>
      <p className="not-prose mb-2 text-body font-bold leading-snug">{rich(title)}</p>
      {children}
    </div>
  );
}
