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

// 한 그림(개념)은 여러 장면이 될 수 있다 — 같은 그림을 유지한 채 본문 설명을
// 나눠 나레이션하고, 설명이 진행될수록 그림 요소가 하나씩 나타난다(스테이지 리빌).
// sub: 그 개념 안에서 몇 번째 장면인지, subCount: 그 개념의 총 장면 수.
type Scene = { chapter: string; caption: string; svg: SVGElement; sub: number; subCount: number };

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

// 긴 문단을 문장 경계로 잘라 캡션 크기(기본 150자)로 묶는다. 한 문장이 그보다
// 길면 그 문장 하나가 한 조각이 된다.
function chunkText(raw: string, max = 150): string[] {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text ? [text] : [];
  const sentences = text.match(/[^.!?]*[.!?]+(?:\s|$)|\S[^.!?]*$/g) ?? [text];
  const chunks: string[] = [];
  let cur = '';
  for (const s of sentences) {
    const t = s.trim();
    if (!t) continue;
    if (cur && (cur + ' ' + t).length > max) {
      chunks.push(cur);
      cur = t;
    } else {
      cur = cur ? cur + ' ' + t : t;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

// 그림 바로 앞(같은 절 안)의 설명 문단들을 문서 순서대로 모은다. heading이나 다른
// 그림을 만나면 멈춰 개념이 섞이지 않게 한다 — 이 문단들이 그 그림의 나레이션이다.
function leadParagraphs(svg: Element): string[] {
  const out: string[] = [];
  let p = svg.previousElementSibling;
  while (p) {
    if (/^H[1-4]$/.test(p.tagName)) break;
    if (p.matches?.('[data-diagram]')) break;
    if (p.tagName === 'P') {
      const t = (p.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (t) out.unshift(t);
    }
    p = p.previousElementSibling;
  }
  return out;
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
    const list: Scene[] = [];
    for (const svg of sources) {
      const chapter = nearestHeading(svg);
      const title = (svg.querySelector('title')?.textContent ?? '').replace(/\s+/g, ' ').trim();
      // 그림 앞 설명 문단을 캡션 크기로 나눈다(최대 4조각) + 마지막에 그림 한 줄 요약(title).
      const caps = leadParagraphs(svg)
        .flatMap((t) => chunkText(t))
        .slice(0, 4);
      if (title && title !== caps[caps.length - 1]) caps.push(title);
      if (caps.length === 0) caps.push(chapter || '그림');
      const subCount = caps.length;
      caps.forEach((caption, sub) => list.push({ chapter, caption, svg, sub, subCount }));
    }
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
  const mountedSvgRef = useRef<Element | null>(null);
  const kidsRef = useRef<SVGElement[]>([]);

  // 무대 렌더 + 스테이지 리빌. 개념(그림)이 바뀌거나 전체화면이 토글되면 그림을
  // 다시 복제하고, 그 개념 안에서 설명이 진행될수록(sub 증가) 그림의 top-level
  // 요소를 앞에서부터 하나씩 나타낸다 — 그림이 "그려지듯" 조립된다. 같은 개념
  // 안에서 캡션만 넘어갈 땐 다시 복제하지 않아 깜빡이지 않는다.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const sc = scenes[step];
    if (!sc) {
      stage.replaceChildren();
      mountedSvgRef.current = null;
      return;
    }

    const fullKey = String(isFull);
    const needClone = mountedSvgRef.current !== sc.svg || stage.dataset.full !== fullKey;
    if (needClone) {
      stage.replaceChildren();
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

      // <title>을 뺀 top-level 요소들이 리빌 대상이다.
      const kids = Array.from(clone.children).filter(
        (c) => c.tagName.toLowerCase() !== 'title',
      ) as SVGElement[];
      kidsRef.current = kids;
      if (!reduced) {
        kids.forEach((k) => {
          k.style.opacity = '0';
          k.style.transition = 'opacity .5s ease';
        });
      }
      stage.appendChild(clone);
      mountedSvgRef.current = sc.svg;
      stage.dataset.full = fullKey;
    }

    // 리빌: 이 개념의 진행도(sub+1)/subCount 만큼 앞에서부터 요소를 켠다.
    const applyReveal = () => {
      const kids = kidsRef.current;
      if (!kids.length) return;
      const frac = (sc.sub + 1) / sc.subCount;
      const revealCount = reduced ? kids.length : Math.max(1, Math.ceil(kids.length * frac));
      kids.forEach((k, i) => {
        k.style.opacity = i < revealCount ? '1' : '0';
      });
    };
    // 새로 복제한 직후엔 요소가 방금 opacity 0으로 붙었으므로, 두 프레임 뒤에
    // 켜야 트랜지션이 걸린다. 같은 그림에서 캡션만 넘어갈 땐 바로 적용해도 애니메이션.
    if (needClone && !reduced) {
      requestAnimationFrame(() => requestAnimationFrame(applyReveal));
    } else {
      applyReveal();
    }
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
