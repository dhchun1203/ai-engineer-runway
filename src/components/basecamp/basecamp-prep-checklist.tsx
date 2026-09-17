'use client';

// STEP 2 심화 과제 보강 레슨의 체크리스트. 완료 토글은 STEP 항목과 똑같이
// toggleBasecampItem 액션을 쓴다(진도는 bc: 접두사로 저장, 커리큘럼과 격리).
// STEP 체크리스트(basecamp-step-checklist.tsx)와 카드 모양이 다르다 — 외부 공식
// 과제 링크가 아니라 우리 레슨 내부 링크("레슨 열기")를 걸고, "과제" 배지도 없다.
// 그래서 컴포넌트를 따로 두되, 낙관적 토글 규칙과 Set 헬퍼는 STEP 체크리스트와
// 공유한다. 이 섹션의 완료 개수는 STEP의 "N/M 완료"에 섞이지 않고 여기서만 센다.

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { toggleBasecampItem } from '@/app/basecamp/actions';
import { withToggled, withAdded, withRemoved } from '@/components/basecamp/toggle-set';
import type { BasecampPrepLesson } from '@/content/basecamp';

export function BasecampPrepChecklist({
  lessons,
  initialDoneIds,
  unlocked,
}: {
  lessons: readonly BasecampPrepLesson[];
  /** 완료된 보강 레슨 id(접두사 없는 lesson.id) 목록. unlocked일 때만 의미가 있다. */
  initialDoneIds: readonly string[];
  unlocked: boolean;
}) {
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(
    () => new Set(initialDoneIds),
  );
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [errorIds, setErrorIds] = useState<ReadonlySet<string>>(new Set());

  const doneCount = lessons.filter((lesson) => doneIds.has(lesson.id)).length;

  async function handleToggle(id: string) {
    if (pendingIds.has(id)) return;
    const wasDone = doneIds.has(id);

    // 낙관적 갱신 — 완료 집합을 즉시 뒤집고(카운터도 이 집합에서 파생) 서버 액션을
    // 부른다. 실패하면 이 항목만 되돌리고 표시한다(step-checklist와 동일 규칙).
    setDoneIds((prev) => withToggled(prev, id, !wasDone));
    setPendingIds((prev) => withAdded(prev, id));
    setErrorIds((prev) => withRemoved(prev, id));

    try {
      await toggleBasecampItem(id, wasDone);
    } catch {
      setDoneIds((prev) => withToggled(prev, id, wasDone));
      setErrorIds((prev) => withAdded(prev, id));
    } finally {
      setPendingIds((prev) => withRemoved(prev, id));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {unlocked ? (
        <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {doneCount}/{lessons.length} 완료
        </span>
      ) : null}
      <ul className="flex flex-col gap-3">
        {lessons.map((lesson) => {
          const lessonDone = doneIds.has(lesson.id);
          const lessonError = errorIds.has(lesson.id);
          return (
            <li key={lesson.href} className="panel flex items-start gap-3 p-4 sm:p-5">
              {unlocked ? (
                <button
                  type="button"
                  onClick={() => handleToggle(lesson.id)}
                  disabled={pendingIds.has(lesson.id)}
                  aria-pressed={lessonDone}
                  aria-label={
                    lessonDone ? `${lesson.title} 완료 취소` : `${lesson.title} 완료로 표시`
                  }
                  className={`tap-feedback mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors ${
                    lessonDone
                      ? 'border-ok bg-ok text-background dark:border-ok-dark dark:bg-ok-dark dark:text-background-dark'
                      : lessonError
                        ? 'border-destructive dark:border-destructive-dark'
                        : 'border-foreground bg-background dark:border-foreground-dark dark:bg-background-dark'
                  }`}
                >
                  {lessonDone ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                </button>
              ) : (
                <span
                  className="mt-0.5 h-6 w-6 shrink-0 border-2 border-line dark:border-line-dark"
                  aria-hidden="true"
                />
              )}
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="break-keep text-body font-extrabold">{lesson.title}</span>
                <p className="break-keep text-label font-normal leading-relaxed">
                  {lesson.summary}
                </p>
                <Link
                  href={lesson.href}
                  className="nav-link tap-feedback inline-flex min-h-11 w-fit items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark"
                >
                  레슨 열기
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
