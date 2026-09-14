'use client';

import type { ComponentPropsWithoutRef, ComponentType, ReactNode } from 'react';
import { Target, Compass, ShieldCheck, Wrench, Route, type LucideIcon } from 'lucide-react';
import { MDXContent } from '@/components/mdx-content';

// 소개(Making-of) 페이지 전용 렌더러. 예전엔 섹션 제목에 이모지(🎯📌🧰🛠)를 썼는데,
// 서브셋 한글 글꼴에 이모지 글리프가 없어 깨질(tofu) 수 있고 사이트의 미니멀 톤과도
// 맞지 않았다. docs/making-of.md에서 이모지를 걷어내고, 여기서 각 제목(h2)에 lucide
// 아이콘을 얹는다. 아이콘은 사이트 강조색(accent)으로 통일해 나머지 UI와 같은 톤이다.
//
// 서버 컴포넌트(about/page.tsx)에서 컴포넌트 함수 props를 MDXContent로 직접 넘길 수
// 없어(RSC 경계) 이 클라이언트 래퍼를 둔다 — page.tsx는 직렬화 가능한 code 문자열만 넘긴다.

// 제목 텍스트 → 아이콘. 제목 문구는 making-of.md에서 우리가 직접 관리하므로 안전하다.
const ICON_BY_HEADING: Record<string, LucideIcon> = {
  '한 문장으로': Target,
  '무엇을 할 수 있나': Compass,
  '데이터는 어떻게 지키나': ShieldCheck,
  '무엇으로 만들었나': Wrench,
  '어떻게 만들었나': Route,
};

// h2 children에서 순수 텍스트만 뽑는다(문자열, 혹은 문자열이 섞인 노드 배열 모두 대비).
function textOf(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return textOf((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return '';
}

function AboutHeading({ children, ...rest }: ComponentPropsWithoutRef<'h2'>) {
  const key = textOf(children).trim();
  const Icon = ICON_BY_HEADING[key];
  return (
    <h2 {...rest} className="flex items-center gap-2.5">
      {Icon ? (
        <Icon
          className="h-[1.1em] w-[1.1em] shrink-0 text-accent dark:text-accent-dark"
          aria-hidden="true"
        />
      ) : null}
      <span>{children}</span>
    </h2>
  );
}

export function AboutContent({ code }: { code: string }) {
  return <MDXContent code={code} components={{ h2: AboutHeading as ComponentType }} />;
}
