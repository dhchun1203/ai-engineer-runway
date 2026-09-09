'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { savePostAction, deletePostAction } from '@/app/til/actions';
import { getTemplate } from '@/lib/til/templates';
import type { TilPost, TilPostInput, TilSeries, TilTemplate } from '@/lib/til/types';

type Props =
  | { mode: 'create'; template: TilTemplate; post?: undefined; allSeries: TilSeries[] }
  | { mode: 'edit'; template?: undefined; post: TilPost; allSeries: TilSeries[] };

export function TilEditor(props: Props) {
  const router = useRouter();
  const template: TilTemplate = props.mode === 'create' ? props.template : props.post.template;
  const tpl = getTemplate(template);
  const post = props.mode === 'edit' ? props.post : undefined;
  const allSeries = props.allSeries;

  const [title, setTitle] = useState(post?.title ?? '');
  const [summary, setSummary] = useState(post?.summary ?? '');
  const [bodyMd, setBodyMd] = useState(post?.bodyMd ?? tpl.bodySkeleton);
  const [selfCheck, setSelfCheck] = useState(post?.selfCheck ?? '');
  const [understanding, setUnderstanding] = useState<number | null>(post?.understanding ?? null);
  const [blocked, setBlocked] = useState(post?.blockedPoints ?? '');
  const [tagsText, setTagsText] = useState((post?.tags ?? []).join(', '));
  const [seriesId, setSeriesId] = useState<string | null>(post?.seriesId ?? null);
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildInput(): TilPostInput {
    return {
      id: post?.id,
      existingSlug: post?.slug,
      template,
      title,
      summary,
      bodyMd,
      selfCheck,
      understanding,
      blockedPoints: blocked,
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      seriesId,
      newSeriesTitle: newSeriesTitle.trim() || undefined,
      coverImageUrl: post?.coverImageUrl ?? null,
    };
  }

  async function handleSave(publish: boolean) {
    if (pending) return;
    if (publish && !selfCheck.trim()) {
      setError('발행하려면 셀프 체크 질문을 채워주세요.');
      return;
    }
    setPending(true);
    setError(null);
    const res = await savePostAction(buildInput(), publish);
    setPending(false);
    if (res.ok) {
      router.push(`/til/${res.slug}`);
    } else {
      setError(res.error);
    }
  }

  async function handleDelete() {
    if (!post || pending) return;
    setPending(true);
    const res = await deletePostAction(post.id);
    setPending(false);
    if (res.ok) router.push('/til/drafts');
    else setError(res.error);
  }

  const inputClass =
    'w-full border-2 border-foreground bg-background px-3 py-2 text-body dark:border-foreground-dark dark:bg-background-dark';

  return (
    <div className="flex flex-col gap-4">
      <span className="chip w-fit text-label font-bold">{tpl.label}</span>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className={`${inputClass} text-heading font-extrabold`}
      />

      <input
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder={tpl.hints.summary}
        className={inputClass}
      />

      <textarea
        value={bodyMd}
        onChange={(e) => setBodyMd(e.target.value)}
        rows={16}
        className={`${inputClass} font-mono`}
        spellCheck={false}
      />

      <input
        value={selfCheck}
        onChange={(e) => setSelfCheck(e.target.value)}
        placeholder={tpl.hints.selfCheck}
        className={inputClass}
      />

      <textarea
        value={blocked}
        onChange={(e) => setBlocked(e.target.value)}
        rows={2}
        placeholder={tpl.hints.blocked}
        className={inputClass}
      />

      <label className="flex items-center gap-2 text-label font-semibold">
        이해도
        <select
          value={understanding ?? ''}
          onChange={(e) => setUnderstanding(e.target.value ? Number(e.target.value) : null)}
          className="border-2 border-foreground bg-background px-2 py-1 dark:border-foreground-dark dark:bg-background-dark"
        >
          <option value="">-</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}/5</option>
          ))}
        </select>
      </label>

      <input
        value={tagsText}
        onChange={(e) => setTagsText(e.target.value)}
        placeholder="태그 (쉼표로 구분: python, 자료형)"
        className={inputClass}
      />

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-label font-semibold">
          시리즈
          <select
            value={seriesId ?? ''}
            onChange={(e) => setSeriesId(e.target.value || null)}
            className="min-h-11 border-2 border-foreground bg-background px-2 py-1 dark:border-foreground-dark dark:bg-background-dark"
          >
            <option value="">(없음)</option>
            {allSeries.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </label>
        <input
          value={newSeriesTitle}
          onChange={(e) => setNewSeriesTitle(e.target.value)}
          placeholder="새 시리즈 만들기 (제목 입력 시 저장할 때 생성)"
          className={inputClass}
        />
      </div>

      {error ? <p className="text-label font-semibold text-destructive dark:text-destructive-dark">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={pending} onClick={() => handleSave(false)} className="chip tap-feedback min-h-11 text-body">
          초고 저장
        </button>
        <button type="button" disabled={pending} onClick={() => handleSave(true)} className="btn-action tap-feedback min-h-11 text-body">
          발행
        </button>
        {post ? (
          <button type="button" disabled={pending} onClick={handleDelete} className="min-h-11 text-label font-semibold text-destructive dark:text-destructive-dark">
            삭제
          </button>
        ) : null}
      </div>
    </div>
  );
}
