'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { savePostAction, deletePostAction, uploadTilImageAction } from '@/app/til/actions';
import { getTemplate } from '@/lib/til/templates';
import { TilMarkdownPreview } from '@/components/til/til-markdown-preview';
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
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(post?.coverImageUrl ?? null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBodyImage, setUploadingBodyImage] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 좁은 화면(아이패드 세로·폰) 전용 편집/미리보기 토글. 넓은 화면은 항상 2단.
  const [mobileView, setMobileView] = useState<'write' | 'preview'>('write');
  const bodyImageInputRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

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
      coverImageUrl,
    };
  }

  // ── 마크다운 서식 도우미 ─────────────────────────────────────────────
  // 선택 영역을 before/after로 감싼다. 선택이 없으면 placeholder를 넣고 그 부분을 선택 상태로 둔다.
  function wrapSelection(before: string, after: string, placeholder: string) {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = bodyMd.slice(start, end) || placeholder;
    const next = bodyMd.slice(0, start) + before + selected + after + bodyMd.slice(end);
    setBodyMd(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    });
  }

  // 선택한 줄(들)의 맨 앞을 transform으로 바꾼다 — 제목·인용에 사용.
  function transformLines(transform: (line: string) => string) {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = bodyMd.lastIndexOf('\n', start - 1) + 1;
    const lineEndRaw = bodyMd.indexOf('\n', end);
    const lineEnd = lineEndRaw === -1 ? bodyMd.length : lineEndRaw;
    const block = bodyMd.slice(lineStart, lineEnd);
    const newBlock = block.split('\n').map(transform).join('\n');
    const next = bodyMd.slice(0, lineStart) + newBlock + bodyMd.slice(lineEnd);
    setBodyMd(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = lineStart;
      ta.selectionEnd = lineStart + newBlock.length;
    });
  }

  function applyHeading(level: number) {
    const prefix = '#'.repeat(level) + ' ';
    transformLines((ln) => {
      const cleaned = ln.replace(/^#{1,6}\s+/, '');
      return prefix + cleaned;
    });
  }

  function applyQuote() {
    transformLines((ln) => (ln.startsWith('> ') ? ln.slice(2) : '> ' + ln));
  }

  function applyCodeBlock() {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = bodyMd.slice(start, end) || '코드';
    const before = bodyMd.slice(0, start);
    const needLeadBreak = before !== '' && !before.endsWith('\n') ? '\n' : '';
    const snippet = `${needLeadBreak}\`\`\`\n${selected}\n\`\`\`\n`;
    const next = before + snippet + bodyMd.slice(end);
    setBodyMd(next);
    const selPos = start + needLeadBreak.length + 4; // ``` + \n
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = selPos;
      ta.selectionEnd = selPos + selected.length;
    });
  }

  async function handleCoverImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    const formData = new FormData();
    formData.set('file', file);
    const res = await uploadTilImageAction(formData);
    setUploadingCover(false);
    if (res.ok) {
      setCoverImageUrl(res.url);
    } else {
      setError(res.error);
    }
  }

  async function handleBodyImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingBodyImage(true);
    setError(null);
    const formData = new FormData();
    formData.set('file', file);
    const res = await uploadTilImageAction(formData);
    setUploadingBodyImage(false);
    if (res.ok) {
      setBodyMd((prev) => `${prev}${prev.endsWith('\n') || prev === '' ? '' : '\n'}\n![](${res.url})\n`);
    } else {
      setError(res.error);
    }
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

  // 툴바 버튼: 최소 44px 터치 타깃(아이패드), 위·아래 붙는 눌림 피드백.
  const toolBtn =
    'inline-flex h-11 min-w-11 items-center justify-center px-2 text-label font-bold tap-feedback ' +
    'hover:bg-surface dark:hover:bg-surface-dark';
  const toolDivider = 'mx-1 h-6 w-px shrink-0 bg-line dark:bg-line-dark';

  return (
    <div className="flex flex-col gap-5">
      <span className="chip w-fit text-label font-bold">{tpl.label}</span>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="w-full border-0 border-b-2 border-line bg-transparent px-0 py-2 text-display font-black outline-none placeholder:text-muted focus:border-foreground dark:border-line-dark dark:placeholder:text-muted-dark dark:focus:border-foreground-dark"
      />

      <input
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder={tpl.hints.summary}
        className="w-full border-0 border-b border-line bg-transparent px-0 py-2 text-subhead font-normal text-muted outline-none placeholder:text-muted focus:border-foreground dark:border-line-dark dark:text-muted-dark dark:placeholder:text-muted-dark dark:focus:border-foreground-dark"
      />

      {/* ── 본문 에디터: 툴바 + (넓은 화면) 편집|미리보기 2단 ─────────────── */}
      <div className="border-2 border-foreground bg-surface dark:border-foreground-dark dark:bg-surface-dark">
        <div className="flex flex-wrap items-center gap-0.5 border-b-2 border-foreground bg-surface-2 px-2 py-1.5 dark:border-foreground-dark dark:bg-surface-2-dark">
          <button type="button" onClick={() => applyHeading(1)} className={toolBtn} aria-label="제목 1" title="제목 1">H1</button>
          <button type="button" onClick={() => applyHeading(2)} className={toolBtn} aria-label="제목 2" title="제목 2">H2</button>
          <button type="button" onClick={() => applyHeading(3)} className={toolBtn} aria-label="제목 3" title="제목 3">H3</button>
          <button type="button" onClick={() => applyHeading(4)} className={toolBtn} aria-label="제목 4" title="제목 4">H4</button>
          <span className={toolDivider} aria-hidden />
          <button type="button" onClick={() => wrapSelection('**', '**', '굵게')} className={`${toolBtn} font-black`} aria-label="굵게" title="굵게">B</button>
          <button type="button" onClick={() => wrapSelection('_', '_', '기울임')} className={`${toolBtn} italic`} aria-label="기울임" title="기울임">I</button>
          <button type="button" onClick={() => wrapSelection('~~', '~~', '취소선')} className={`${toolBtn} line-through`} aria-label="취소선" title="취소선">S</button>
          <span className={toolDivider} aria-hidden />
          <button type="button" onClick={applyQuote} className={toolBtn} aria-label="인용" title="인용">&ldquo;</button>
          <button type="button" onClick={() => wrapSelection('`', '`', '코드')} className={`${toolBtn} font-mono`} aria-label="인라인 코드" title="인라인 코드">{'</>'}</button>
          <button type="button" onClick={applyCodeBlock} className={`${toolBtn} font-mono`} aria-label="코드 블록" title="코드 블록">{'{ }'}</button>
          <span className={toolDivider} aria-hidden />
          <button type="button" onClick={() => wrapSelection('[', '](https://)', '링크')} className={toolBtn} aria-label="링크" title="링크">🔗</button>
          <button
            type="button"
            onClick={() => bodyImageInputRef.current?.click()}
            disabled={uploadingBodyImage}
            className={toolBtn}
            aria-label="이미지"
            title="이미지 삽입"
          >
            {uploadingBodyImage ? '…' : '🖼'}
          </button>
          <input
            ref={bodyImageInputRef}
            type="file"
            accept="image/*"
            onChange={handleBodyImageChange}
            disabled={uploadingBodyImage}
            className="hidden"
          />

          {/* 좁은 화면 전용 편집/미리보기 토글 — 넓은 화면(lg)에선 2단이라 숨김 */}
          <div className="ml-auto flex items-center gap-0.5 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileView('write')}
              className={`inline-flex h-11 items-center px-3 text-label font-bold ${mobileView === 'write' ? 'bg-foreground text-surface dark:bg-foreground-dark dark:text-surface-dark' : ''}`}
            >
              편집
            </button>
            <button
              type="button"
              onClick={() => setMobileView('preview')}
              className={`inline-flex h-11 items-center px-3 text-label font-bold ${mobileView === 'preview' ? 'bg-foreground text-surface dark:bg-foreground-dark dark:text-surface-dark' : ''}`}
            >
              미리보기
            </button>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:divide-x-2 lg:divide-foreground dark:lg:divide-foreground-dark">
          <textarea
            ref={bodyRef}
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            className={`${mobileView === 'write' ? 'block' : 'hidden'} min-h-[420px] w-full resize-y bg-background px-4 py-3 font-mono text-body leading-relaxed outline-none dark:bg-background-dark lg:block lg:min-h-[560px] lg:resize-none`}
            spellCheck={false}
            placeholder="마크다운으로 자유롭게 써보세요."
          />
          <div
            className={`${mobileView === 'preview' ? 'block' : 'hidden'} min-h-[420px] w-full overflow-auto bg-background px-4 py-3 dark:bg-background-dark lg:block lg:min-h-[560px]`}
          >
            <TilMarkdownPreview markdown={bodyMd} />
          </div>
        </div>
      </div>

      {/* ── 메타데이터 ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-label font-semibold">커버 이미지</span>
        {coverImageUrl ? (
          // eslint 규칙상 next/image 권장이나, 외부 스토리지 URL이라 img로 단순화(til-card.tsx와 동일 판단).
          <img src={coverImageUrl} alt="" className="aspect-[16/9] w-full rounded object-cover" />
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <label className="chip tap-feedback flex min-h-11 cursor-pointer items-center text-label font-semibold">
            {uploadingCover ? '업로드 중...' : coverImageUrl ? '커버 이미지 바꾸기' : '커버 이미지 올리기'}
            <input type="file" accept="image/*" onChange={handleCoverImageChange} disabled={uploadingCover} className="hidden" />
          </label>
          {coverImageUrl ? (
            <button
              type="button"
              disabled={uploadingCover}
              onClick={() => setCoverImageUrl(null)}
              className="min-h-11 text-label font-semibold text-destructive dark:text-destructive-dark"
            >
              커버 이미지 제거
            </button>
          ) : null}
        </div>
      </div>

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

      <label className="flex min-h-11 items-center gap-2 text-label font-semibold">
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
