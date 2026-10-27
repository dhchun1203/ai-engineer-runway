import { getOrderedClassLessons } from "@/content/class-lesson-helpers";
import { getClassSession } from "@/content/class-sessions";
import type { CommandGroup } from "@/components/class/command-list";
import type { ExtraTerm } from "@/content/curriculum-helpers";

// 회차 데이터를 모아 만든 파생 목록(2026-10-27): 명령어 모음, 회차 검색 색인.
// 설계: docs/superpowers/specs/2026-10-27-class-data-structure-design.md 3.4, 3.8

/** 전 회차의 명령어를 묶음(group, 없으면 회차 topic)별로 모은다. 같은 묶음에 같은 명령이
 *  다시 나오면 한 줄로 합치고 회차 링크만 늘린다(설명은 처음 배운 회차의 것). 묶음 순서는
 *  처음 나온 순서다. */
export function buildCommandGroups(): CommandGroup[] {
  const groups = new Map<string, CommandGroup>();
  for (const lesson of getOrderedClassLessons()) {
    for (const command of getClassSession(lesson.slug)?.commands ?? []) {
      const name = command.group ?? lesson.topic;
      let group = groups.get(name);
      if (!group) {
        group = { name, entries: [] };
        groups.set(name, group);
      }
      let entry = group.entries.find((e) => e.cmd === command.cmd);
      if (!entry) {
        entry = { cmd: command.cmd, desc: command.desc, sessions: [] };
        group.entries.push(entry);
      }
      if (!entry.sessions.some((s) => s.href === lesson.permalink)) {
        entry.sessions.push({ session: lesson.session, href: lesson.permalink, title: lesson.title });
      }
    }
  }
  return [...groups.values()];
}

/** 용어집(/glossary)에 더할 수업 용어. 출처는 "N회차 제목"으로 그 회차 레슨을 가리킨다. */
export function buildClassGlossaryTerms(): ExtraTerm[] {
  return getOrderedClassLessons().flatMap((lesson) =>
    (getClassSession(lesson.slug)?.terms ?? []).map((term) => ({
      word: term.word,
      definition: term.definition,
      source: {
        lessonSlug: lesson.slug,
        lessonTitle: `${lesson.session}회차 ${lesson.title}`,
        moduleId: lesson.module,
        permalink: lesson.permalink,
      },
    })),
  );
}

export type ClassSearchDoc = {
  slug: string;
  session: number;
  date: string;
  title: string;
  summary: string;
  topic: string;
  href: string;
  /** 검색에 쓰는 글(제목, 요약, 주제, 소제목, 명령어, 용어를 한 줄로) */
  text: string;
};

/** 회차 검색 색인. 본문 전체는 넣지 않고 소제목, 명령어, 용어까지만 넣는다(브라우저로 보내는 양). */
export function buildClassSearchDocs(): ClassSearchDoc[] {
  return getOrderedClassLessons()
    .reverse()
    .map((lesson) => {
      const session = getClassSession(lesson.slug);
      const parts = [
        `${lesson.session}회차`,
        lesson.title,
        lesson.summary,
        lesson.topic,
        ...lesson.headings,
        ...(session?.commands.map((c) => `${c.cmd} ${c.desc}`) ?? []),
        ...(session?.terms.map((t) => t.word) ?? []),
      ];
      return {
        slug: lesson.slug,
        session: lesson.session,
        date: lesson.date,
        title: lesson.title,
        summary: lesson.summary,
        topic: lesson.topic,
        href: lesson.permalink,
        text: parts.join(" "),
      };
    });
}
