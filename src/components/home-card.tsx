import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CustomIcon, type CustomIconName } from "@/components/illustrations/custom-icon";

// 홈 대시보드의 칸 하나. 서버 컴포넌트(표시 전용)로, 값은 홈이 계산해 넘긴다.
// 카드 전체가 링크라 children에 다른 링크를 넣지 않는다.

export function HomeCard({
  href,
  icon,
  label,
  title,
  detail,
  cta,
  children,
}: {
  href: string;
  icon: CustomIconName;
  label: string;
  title: string;
  detail: string;
  cta: string;
  children?: ReactNode;
}) {
  return (
    <Link href={href} className="card-interactive panel flex h-full flex-col gap-3 p-5 sm:p-6">
      <span className="flex items-center gap-2 text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
        <CustomIcon name={icon} className="h-5 w-5 shrink-0" />
        {label}
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-heading font-extrabold break-keep">{title}</span>
        <span className="break-keep text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {detail}
        </span>
      </span>
      {children}
      <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-label font-bold text-accent dark:text-accent-dark">
        {cta}
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </span>
    </Link>
  );
}

// 진행 칸 막대. 파이썬 손풀기 목록의 막대와 같은 모양이다. 글자로 이미 진행 수를 보여 주므로
// 막대 자체는 장식으로 둔다.
export function HomeCellBar({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  return (
    <span
      aria-hidden="true"
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 ${i < done ? "bg-foreground dark:bg-foreground-dark" : "bg-line dark:bg-line-dark"}`}
        />
      ))}
    </span>
  );
}
