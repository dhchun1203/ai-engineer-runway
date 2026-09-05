'use client';

// 범용 레슨 요약 영상 — 모든 레슨 공용. 레슨 맨 위에 놓여, 그 레슨이 본문에 이미
// 가진 정적 그림([data-diagram])들을 그 자리에서 모아 캡션(각 그림의 <title>)과
// 함께 순서대로 재생한다. 레슨마다 새 그림을 손으로 그리지 않으므로 어색할 일이
// 없고, 35개 레슨에 균일하게 적용된다.
//
// 파일럿 1-3만 손으로 애니메이션한 lesson-video.tsx(LessonVideo)를 쓰고, 나머지
// 레슨은 이 컴포넌트를 쓴다. 재생·전체화면·키보드·크롬은 lesson-player-core.tsx 공유.
//
// 그림은 이미 .prose 안에 서버 렌더돼 있으므로, 마운트 후 DOM에서 원본 노드를
// 모아 두고 장면 전환 때마다 복제(clone)해 무대에 얹는다 — JSX 속성(textAnchor 등)
// 변환 문제 없이 브라우저가 이미 그린 그림을 그대로 재사용한다. 복제본은 id를 떼어
// 문서 내 중복 id를 만들지 않는다.

import { useEffect, useRef, useState } from 'react';
import { PlayerFrame, useLessonPlayer } from '@/components/lesson-player-core';

type Scene = { chapter: string; caption: string; svg: SVGElement };

// heading 텍스트에서 앞머리 이모지·번호를 떼어 챕터 라벨로 다듬는다.
function cleanHeading(t: string): string {
  return t
    .replace(/\s+/g, ' ')
    .replace(/^[\s\d.]+/, '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .trim();
}

// 그림 바로 앞(같은 레벨 또는 상위)의 heading을 찾아 그 개념 이름을 얻는다.
function nearestHeading(el: Element): string {
  let node: Element | null = el;
  while (node) {
    let prev = node.previousElementSibling;
    while (prev) {
      if (/^H[1-4]$/.test(prev.tagName)) return cleanHeading(prev.textContent ?? '');
      prev = prev.previousElementSibling;
    }
    node = node.parentElement;
    if (node && node.classList.contains('prose')) break;
  }
  return '';
}

export function LessonPresenter() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);

  // 마운트 후 본문 그림을 모은다. 플레이어 자신(data-print-hide) 안의 복제본은
  // 제외해 원본만 담는다.
  useEffect(() => {
    const container =
      document.querySelector('.prose[data-step]') ?? document.querySelector('.prose');
    if (!container) return;
    const sources = Array.from(container.querySelectorAll<SVGElement>('[data-diagram]')).filter(
      (svg) => !svg.closest('[data-print-hide]'),
    );
    const list: Scene[] = sources.map((svg) => ({
      chapter: nearestHeading(svg),
      caption: (svg.querySelector('title')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      svg,
    }));
    if (list.length === 0) return;
    // setState를 effect 본문에서 동기로 부르지 않도록 마이크로태스크로 미룬다
    // (react-hooks/set-state-in-effect). DOM은 이미 그려져 있어 한 틱 미뤄도 무방.
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setScenes(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const player = useLessonPlayer({ count: scenes.length });
  const { step, isFull, reduced } = player;
  const scene = scenes[step];

  // 현재 장면의 그림을 복제해 무대에 얹고 부드럽게 나타낸다.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.replaceChildren();
    const sc = scenes[step];
    if (!sc) return;

    const clone = sc.svg.cloneNode(true) as SVGElement;
    // 문서 내 중복 id 방지 — aria 참조와 모든 id를 뗀다(접근 이름은 <title>이 준다).
    clone.removeAttribute('aria-labelledby');
    clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));

    clone.style.display = 'block';
    clone.style.margin = '0 auto';
    // 높이를 고정해 그림마다 비율이 달라도 무대 높이가 튀지 않게 한다(폭은 자동).
    if (isFull) {
      clone.style.height = 'min(52vh, 30rem)';
      clone.style.width = 'auto';
      clone.style.maxWidth = '92vw';
    } else {
      clone.style.height = '14rem';
      clone.style.width = 'auto';
      clone.style.maxWidth = '100%';
    }

    if (!reduced) {
      clone.style.opacity = '0';
      clone.style.transform = 'scale(0.98)';
      clone.style.transition = 'opacity .4s ease, transform .4s ease';
      // 두 프레임 뒤에 목표값을 줘 트랜지션이 확실히 걸리게 한다.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          clone.style.opacity = '1';
          clone.style.transform = 'none';
        }),
      );
    }
    stage.appendChild(clone);
  }, [step, scenes, isFull, reduced]);

  // 아직 그림을 못 모았으면(초기 한 순간) 자리만 잡아 둔다.
  if (scenes.length === 0) {
    return (
      <div
        data-print-hide
        className="panel-hero my-6 p-4 text-center text-caption opacity-60"
      >
        레슨 요약 영상 준비 중…
      </div>
    );
  }

  return (
    <PlayerFrame
      player={player}
      ariaLabel="이 레슨 요약 영상 — 본문 그림 모아보기"
      chapters={[]} // 그림 1개당 개념 1개라 칩 대신 상단 표시 + 이전/다음으로 이동
      activeChapter={scene?.chapter ?? ''}
      caption={scene?.caption ?? ''}
    >
      <div
        ref={stageRef}
        className="flex items-center justify-center"
        style={{ minHeight: isFull ? '52vh' : '14rem' }}
      />
    </PlayerFrame>
  );
}
