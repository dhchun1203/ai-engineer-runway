"use client";

import { Search, X } from "lucide-react";

// 수업 복습의 검색창(명령어 모음, 회차 검색이 함께 쓴다). 글자 크기를 본문 크기로 두어
// iPad Safari가 입력할 때 화면을 확대하지 않게 한다.

export function ClassSearchField({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  /** 화면 낭독기용 이름 */
  label: string;
  placeholder: string;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 border-2 border-foreground bg-surface px-3 dark:border-foreground-dark dark:bg-surface-dark">
      <Search className="h-4 w-4 shrink-0 text-muted dark:text-muted-dark" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full min-w-0 bg-transparent py-2 text-body font-normal outline-none placeholder:text-muted dark:placeholder:text-muted-dark [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="tap-feedback -mr-1 flex h-11 w-11 shrink-0 items-center justify-center"
          aria-label="검색어 지우기"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </label>
  );
}
