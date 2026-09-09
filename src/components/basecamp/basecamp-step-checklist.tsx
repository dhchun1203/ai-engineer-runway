'use client';

// 베이스캠프 한 STEP의 체크리스트 + "N/M 완료" 카운터. 카운터와 체크박스가 같은
// 클라이언트 상태(doneIds)를 공유하는 것이 이 컴포넌트의 존재 이유다 — 체크박스를
// 누르는 순간 카운터도 함께 바뀌어야 하므로(사용자 요청 2026-09-09), 완료 집합의
// 진실을 이 클라이언트 컴포넌트가 들고 있는다. 저장은 낙관적으로 처리한다: 누르면
// 즉시 뒤집어 보이고(카운터도 즉시 갱신) 서버 액션을 부르며, 저장이 실패하면 그
// 항목만 되돌리고 표시한다. 서버 재검증(revalidate)은 걸지 않는다 — 다음 전체 로드에
// 서버 값이 다시 진실이 된다(complete-button.tsx의 낙관적 토글 원칙과 같다).

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Check } from 'lucide-react';
import { toggleBasecampItem } from '@/app/basecamp/actions';
import type { BasecampStep } from '@/content/basecamp';

export function BasecampStepChecklist({
  step,
  initialDoneIds,
  unlocked,
}: {
  step: BasecampStep;
  /** 완료된 항목 id(접두사 없는 item.id) 목록. unlocked일 때만 의미가 있다. */
  initialDoneIds: readonly string[];
  unlocked: boolean;
}) {
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(
    () => new Set(initialDoneIds),
  );
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [errorIds, setErrorIds] = useState<ReadonlySet<string>>(new Set());

  const doneCount = step.items.filter((item) => doneIds.has(item.id)).length;

  async function handleToggle(itemId: string) {
    if (pendingIds.has(itemId)) return;
    const wasDone = doneIds.has(itemId);

    // 낙관적 갱신 — 완료 집합을 즉시 뒤집는다(카운터도 이 집합에서 파생되므로 함께 갱신).
    setDoneIds((prev) => withToggled(prev, itemId, !wasDone));
    setPendingIds((prev) => withAdded(prev, itemId));
    setErrorIds((prev) => withRemoved(prev, itemId));

    try {
      await toggleBasecampItem(itemId, wasDone);
    } catch {
      // 이 항목만 되돌린다(카운터도 자동 복원).
      setDoneIds((prev) => withToggled(prev, itemId, wasDone));
      setErrorIds((prev) => withAdded(prev, itemId));
    } finally {
      setPendingIds((prev) => withRemoved(prev, itemId));
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip text-label font-bold">{step.weekLabel}</span>
          <h2 className="text-heading font-extrabold break-keep">{step.title}</h2>
          {unlocked ? (
            <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
              {doneCount}/{step.items.length} 완료
            </span>
          ) : null}
        </div>
        <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {step.summary}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {step.items.map((item) => {
          const itemDone = doneIds.has(item.id);
          const itemError = errorIds.has(item.id);
          return (
            <li key={item.id} className="panel flex items-start gap-3 p-4 sm:p-5">
              {unlocked ? (
                <button
                  type="button"
                  onClick={() => handleToggle(item.id)}
                  disabled={pendingIds.has(item.id)}
                  aria-pressed={itemDone}
                  aria-label={itemDone ? `${item.title} 완료 취소` : `${item.title} 완료로 표시`}
                  className={`tap-feedback mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors ${
                    itemDone
                      ? 'border-ok bg-ok text-background dark:border-ok-dark dark:bg-ok-dark dark:text-background-dark'
                      : itemError
                        ? 'border-destructive dark:border-destructive-dark'
                        : 'border-foreground bg-background dark:border-foreground-dark dark:bg-background-dark'
                  }`}
                >
                  {itemDone ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                </button>
              ) : (
                <span
                  className="mt-0.5 h-6 w-6 shrink-0 border-2 border-line dark:border-line-dark"
                  aria-hidden="true"
                />
              )}
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="break-keep text-body font-extrabold">{item.title}</span>
                  {item.kind === 'assignment' ? (
                    <span className="chip text-label font-bold text-action dark:text-action-dark">
                      과제
                    </span>
                  ) : null}
                </div>
                <p className="break-keep text-label font-normal leading-relaxed">
                  {item.summary}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                  <a
                    href={item.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link tap-feedback inline-flex min-h-11 items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark"
                  >
                    공식 과제 열기
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                  {item.ourLessonHref ? (
                    <Link
                      href={item.ourLessonHref}
                      className="nav-link tap-feedback inline-flex min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
                    >
                      우리 레슨으로 깊게
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Set 불변 갱신 헬퍼 — React 상태로 안전하게 다루기 위해 매번 새 Set을 만든다.
function withToggled(set: ReadonlySet<string>, id: string, present: boolean): ReadonlySet<string> {
  return present ? withAdded(set, id) : withRemoved(set, id);
}
function withAdded(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
  if (set.has(id)) return set;
  const next = new Set(set);
  next.add(id);
  return next;
}
function withRemoved(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
  if (!set.has(id)) return set;
  const next = new Set(set);
  next.delete(id);
  return next;
}
