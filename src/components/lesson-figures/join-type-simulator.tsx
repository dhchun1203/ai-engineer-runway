"use client";

// 18회차 JOIN 종류 시뮬레이터. 강좌 14개와 강사 8명(17회차 시드 출력 그대로)을 두고, JOIN 종류를
// 고르면 결과 행과 NULL이 생기는 자리를 보여 준다. 같은 두 표를 PostgreSQL 엔진(PGlite)에 넣고
// ON c.instructor_id = i.instructor_id ORDER BY c.course_id 로 네 가지를 실행해 12, 14, 13, 15행이
// 나오는 것을 확인했다(수업 정리의 행 수와 같다). 결과 행은 그 실행 결과와 같은 순서로 만든다.

import { useState } from "react";

type Course = { id: number; name: string; instructorId: number | null };
type Instructor = { id: number; name: string };

const COURSES: Course[] = [
  { id: 1, name: "수영 초급 새벽반", instructorId: 1 },
  { id: 2, name: "헬스 자유이용", instructorId: null },
  { id: 3, name: "수영 중급 저녁반", instructorId: 3 },
  { id: 4, name: "수영 상급 저녁반", instructorId: 3 },
  { id: 5, name: "아쿠아로빅", instructorId: 1 },
  { id: 6, name: "헬스 PT 그룹반", instructorId: 4 },
  { id: 7, name: "근력운동 입문반", instructorId: 2 },
  { id: 8, name: "골프 입문반", instructorId: 5 },
  { id: 9, name: "골프 중급반", instructorId: 6 },
  { id: 10, name: "골프 타석 자유이용", instructorId: null },
  { id: 11, name: "라틴댄스 초급", instructorId: 7 },
  { id: 12, name: "볼룸댄스 중급", instructorId: 7 },
  { id: 13, name: "실버 스포츠댄스", instructorId: 7 },
  { id: 14, name: "수영 마스터즈반", instructorId: 1 },
];

const INSTRUCTORS: Instructor[] = [
  { id: 1, name: "한지수" },
  { id: 2, name: "강태호" },
  { id: 3, name: "오민재" },
  { id: 4, name: "윤서연" },
  { id: 5, name: "임도현" },
  { id: 6, name: "서하늘" },
  { id: 7, name: "배수민" },
  { id: 8, name: "차예린" },
];

type Kind = "inner" | "left" | "right" | "full";

const KINDS: { kind: Kind; label: string; keyword: string; why: string }[] = [
  {
    kind: "inner",
    label: "JOIN",
    keyword: "JOIN",
    why: "양쪽에 짝이 있는 행만 남아요. 강사 없는 강좌 2개(2번, 10번)와 강좌 없는 강사 차예린이 모두 빠져요. INNER JOIN 이라고 써도 같아요.",
  },
  {
    kind: "left",
    label: "LEFT JOIN",
    keyword: "LEFT JOIN",
    why: "왼쪽 courses 는 14개가 전부 남아요. 짝이 없는 2번, 10번은 강사 칸이 NULL 이에요.",
  },
  {
    kind: "right",
    label: "RIGHT JOIN",
    keyword: "RIGHT JOIN",
    why: "오른쪽 instructors 는 8명이 전부 남아요. 맡은 강좌가 없는 차예린은 강좌 쪽 칸이 NULL 이고, 강사 없는 강좌 2개는 빠져요.",
  },
  {
    kind: "full",
    label: "FULL OUTER JOIN",
    keyword: "FULL OUTER JOIN",
    why: "양쪽이 전부 남아요. 짝이 맞는 12행에 강사 없는 강좌 2행, 강좌 없는 강사 1행이 더해져요.",
  },
];

type Row = { courseId: number | null; courseName: string | null; teacher: string | null; orphan: boolean };

function joinRows(kind: Kind): Row[] {
  const byId = new Map(INSTRUCTORS.map((i) => [i.id, i]));
  const rows: Row[] = [];
  for (const c of COURSES) {
    const i = c.instructorId === null ? undefined : byId.get(c.instructorId);
    if (i) rows.push({ courseId: c.id, courseName: c.name, teacher: i.name, orphan: false });
    else if (kind === "left" || kind === "full") rows.push({ courseId: c.id, courseName: c.name, teacher: null, orphan: true });
  }
  if (kind === "right" || kind === "full") {
    const used = new Set(COURSES.map((c) => c.instructorId));
    // ORDER BY c.course_id 에서 course_id 가 NULL 인 행은 맨 뒤에 선다.
    for (const i of INSTRUCTORS) {
      if (!used.has(i.id)) rows.push({ courseId: null, courseName: null, teacher: i.name, orphan: true });
    }
  }
  return rows;
}

export function JoinTypeSimulator() {
  const [pick, setPick] = useState(1);
  const k = KINDS[pick];
  const rows = joinRows(k.kind);

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const head = `border-b border-line text-left dark:border-line-dark ${muted}`;
  const nullCell = (v: string | number | null, sans = false) =>
    v === null ? <span className={`${muted} font-normal`}>NULL</span> : <span className={sans ? "font-sans" : ""}>{v}</span>;

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <section className="flex flex-col gap-2" aria-label="JOIN 종류 고르기">
        <h3 className="text-label font-bold">JOIN 종류 고르기</h3>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((item, i) => (
            <button
              key={item.kind}
              type="button"
              onClick={() => setPick(i)}
              aria-pressed={i === pick}
              className={`tap-feedback min-h-11 px-3 text-label font-mono ${i === pick ? "btn-action" : "btn"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-4 bg-surface-2 px-3 py-2 font-mono text-label leading-relaxed dark:bg-surface-2-dark">
        <div className={muted}>SELECT c.course_id, c.course_name, i.name AS 강사</div>
        <div className={muted}>FROM courses c</div>
        <div className="whitespace-pre-wrap break-words font-semibold">{`${k.keyword} instructors i ON c.instructor_id = i.instructor_id`}</div>
        <div className={muted}>ORDER BY c.course_id;</div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[22rem] font-mono text-label tabular-nums">
          <thead>
            <tr className={head}>
              <th className="py-1 pr-2 font-semibold">course_id</th>
              <th className="py-1 pr-2 font-semibold">course_name</th>
              <th className="py-1 font-semibold">강사</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={`${r.courseId ?? "x"}-${r.teacher ?? "x"}-${idx}`}
                className={`border-b border-line last:border-b-0 dark:border-line-dark ${
                  r.orphan ? "bg-accent/10 font-semibold dark:bg-accent-dark/15" : ""
                }`}
              >
                <td className="py-1 pr-2 text-accent dark:text-accent-dark">{nullCell(r.courseId)}</td>
                <td className="py-1 pr-2">{nullCell(r.courseName, true)}</td>
                <td className="py-1">{nullCell(r.teacher, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-label leading-relaxed" aria-live="polite">
        <span className="font-mono font-semibold">{`(${rows.length} rows)`}</span> {k.why}
      </p>
      <p className={`mt-1 text-label ${muted}`}>
        색이 칠해진 행이 짝 없이 살아남은 행이에요. psql은 NULL을 빈칸으로 보여 주지만 여기서는 NULL로 적었어요.
      </p>
    </div>
  );
}
