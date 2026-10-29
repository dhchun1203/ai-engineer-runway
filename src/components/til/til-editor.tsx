'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { savePostAction, deletePostAction, uploadTilImageAction } from '@/app/til/actions';
import { getTemplate } from '@/lib/til/templates';
import { TilMarkdownPreview } from '@/components/til/til-markdown-preview';
import {
  Bold,
  Italic,
  Strikethrough,
  Quote,
  Code,
  SquareCode,
  Table,
  Link as LinkIcon,
  ImagePlus,
  Trash2,
  ChevronDown,
} from 'lucide-react';
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
  const [creatingSeries, setCreatingSeries] = useState(false);
  // 학습 날짜(서울 기준 YYYY-MM-DD). 기존 글은 원래 발행일, 새 글이나 초고는 오늘이 기본값.
  const [learnedOn, setLearnedOn] = useState(() =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
      post?.publishedAt ? new Date(post.publishedAt) : new Date(),
    ),
  );
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
      learnedOn,
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
  // collapse=true면 바꾼 블록을 선택하지 않고 끝에 커서만 둔다(제목: 파란 블록 없이 커서만 깜빡).
  function transformLines(transform: (line: string) => string, collapse = false) {
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
      if (collapse) {
        const pos = lineStart + newBlock.length;
        ta.selectionStart = pos;
        ta.selectionEnd = pos;
      } else {
        ta.selectionStart = lineStart;
        ta.selectionEnd = lineStart + newBlock.length;
      }
    });
  }

  function applyHeading(level: number) {
    const prefix = '#'.repeat(level) + ' ';
    transformLines((ln) => {
      const cleaned = ln.replace(/^#{1,6}\s+/, '');
      return prefix + cleaned;
    }, true);
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

  function applyTable() {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const before = bodyMd.slice(0, start);
    // 표는 블록이라 앞에 줄이 필요하면 개행을 넣는다(코드블록과 동일 처리).
    const needLeadBreak = before !== '' && !before.endsWith('\n') ? '\n' : '';
    const table = '| 제목 | 제목 |\n| --- | --- |\n| 내용 | 내용 |\n';
    const next = before + needLeadBreak + table + bodyMd.slice(ta.selectionEnd);
    setBodyMd(next);
    // 첫 헤더 셀("제목")을 선택 상태로 둬서 바로 고쳐 쓰게 한다. "| " 다음이 시작.
    const firstCell = start + needLeadBreak.length + 2;
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = firstCell;
      ta.selectionEnd = firstCell + 2; // "제목"
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

  // 메타 입력칸: 흰 패널 위에 한 단계 들어간 면(종이색)으로 놓아 "칸"으로 읽히게 한다.
  // 얇은 선, 포커스 때만 진한 선과 흰 바탕으로 떠오른다.
  const inputClass =
    'min-h-11 w-full border border-line bg-background px-3 py-2 text-label outline-none transition-colors placeholder:text-muted ' +
    'hover:border-muted focus:border-foreground focus:bg-surface ' +
    'dark:border-line-dark dark:bg-background-dark dark:placeholder:text-muted-dark dark:hover:border-muted-dark dark:focus:border-foreground-dark dark:focus:bg-surface-dark';

  // 툴바 버튼: 최소 44px 터치 타깃(아이패드). 호버 시 배경 없이 아이콘/글자만 커진다.
  const toolBtn =
    'inline-flex h-11 min-w-11 items-center justify-center px-2 text-label font-bold text-muted ' +
    'transition-transform hover:scale-125 hover:text-foreground disabled:opacity-40 ' +
    'dark:text-muted-dark dark:hover:text-foreground-dark';
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
          <button type="button" onClick={() => wrapSelection('**', '**', '굵게')} className={toolBtn} aria-label="굵게" title="굵게"><Bold className="h-5 w-5" aria-hidden /></button>
          <button type="button" onClick={() => wrapSelection('_', '_', '기울임')} className={toolBtn} aria-label="기울임" title="기울임"><Italic className="h-5 w-5" aria-hidden /></button>
          <button type="button" onClick={() => wrapSelection('~~', '~~', '취소선')} className={toolBtn} aria-label="취소선" title="취소선"><Strikethrough className="h-5 w-5" aria-hidden /></button>
          <span className={toolDivider} aria-hidden />
          <button type="button" onClick={applyQuote} className={toolBtn} aria-label="인용" title="인용"><Quote className="h-5 w-5" aria-hidden /></button>
          <button type="button" onClick={() => wrapSelection('`', '`', '코드')} className={toolBtn} aria-label="인라인 코드" title="인라인 코드"><Code className="h-5 w-5" aria-hidden /></button>
          <button type="button" onClick={applyCodeBlock} className={toolBtn} aria-label="코드 블록" title="코드 블록"><SquareCode className="h-5 w-5" aria-hidden /></button>
          <button type="button" onClick={applyTable} className={toolBtn} aria-label="표" title="표 삽입"><Table className="h-5 w-5" aria-hidden /></button>
          <span className={toolDivider} aria-hidden />
          <button type="button" onClick={() => wrapSelection('[', '](https://)', '링크')} className={toolBtn} aria-label="링크" title="링크"><LinkIcon className="h-5 w-5" aria-hidden /></button>
          <button
            type="button"
            onClick={() => bodyImageInputRef.current?.click()}
            disabled={uploadingBodyImage}
            className={toolBtn}
            aria-label="이미지"
            title="이미지 삽입"
          >
            <ImagePlus className="h-5 w-5" aria-hidden />
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
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileView('write')}
              aria-pressed={mobileView === 'write'}
              className="btn tap-feedback px-3 text-label"
            >
              편집
            </button>
            <button
              type="button"
              onClick={() => setMobileView('preview')}
              aria-pressed={mobileView === 'preview'}
              className="btn tap-feedback px-3 text-label"
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

      {/* ── 메타데이터: 되짚어보기 | 분류 두 묶음 ───────────────────────────── */}
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <section className="panel flex min-w-0 flex-col gap-5 p-5 sm:p-6">
          <h2 className={groupTitle}>되짚어보기</h2>

          <Field label="셀프 체크 질문" note="발행 시 필수" htmlFor="til-self-check">
            <input
              id="til-self-check"
              value={selfCheck}
              onChange={(e) => setSelfCheck(e.target.value)}
              placeholder={tpl.hints.selfCheck}
              className={inputClass}
            />
          </Field>

          <Field label="막힌 곳" note="선택" htmlFor="til-blocked">
            <textarea
              id="til-blocked"
              value={blocked}
              onChange={(e) => setBlocked(e.target.value)}
              rows={3}
              placeholder={tpl.hints.blocked}
              className={`${inputClass} resize-y`}
            />
          </Field>

          <Field label="이해도" note="다시 누르면 해제">
            {/* 다섯 칸이 붙은 한 줄(세그먼트). 고른 칸까지 채워서 "몇 점"이 한눈에 보이게. */}
            <div
              className="grid w-full max-w-xs grid-cols-5 border border-line dark:border-line-dark"
              role="group"
              aria-label="이해도"
            >
              {[1, 2, 3, 4, 5].map((n) => {
                const on = understanding === n;
                const filled = understanding !== null && n <= understanding;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setUnderstanding(on ? null : n)}
                    className={
                      'tap-feedback flex h-11 items-center justify-center border-l border-line text-label font-bold transition-colors first:border-l-0 dark:border-line-dark ' +
                      (filled
                        ? 'bg-foreground text-surface dark:bg-foreground-dark dark:text-surface-dark'
                        : 'bg-background text-muted hover:text-foreground dark:bg-background-dark dark:text-muted-dark dark:hover:text-foreground-dark')
                    }
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </Field>
        </section>

        <section className="panel flex min-w-0 flex-col gap-5 p-5 sm:p-6">
          <h2 className={groupTitle}>분류</h2>

          <Field label="학습 날짜" note="목록에 이 날로 보여요" htmlFor="til-learned-on">
            <input
              id="til-learned-on"
              type="date"
              value={learnedOn}
              onChange={(e) => setLearnedOn(e.target.value)}
              className={`${inputClass} cursor-pointer`}
            />
          </Field>

          <Field label="태그" note="쉼표로 구분" htmlFor="til-tags">
            <input
              id="til-tags"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="python, 자료형"
              className={inputClass}
            />
          </Field>

          <Field label="시리즈" htmlFor="til-series">
            <div className="relative">
              <select
                id="til-series"
                value={creatingSeries ? NEW_SERIES : seriesId ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === NEW_SERIES) {
                    setCreatingSeries(true);
                    setSeriesId(null);
                  } else {
                    setCreatingSeries(false);
                    setNewSeriesTitle('');
                    setSeriesId(v || null);
                  }
                }}
                className={`${inputClass} cursor-pointer appearance-none pr-10`}
              >
                <option value="">없음</option>
                {allSeries.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
                <option value={NEW_SERIES}>+ 새 시리즈 만들기</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted dark:text-muted-dark"
                aria-hidden
              />
            </div>
            {creatingSeries ? (
              <input
                value={newSeriesTitle}
                onChange={(e) => setNewSeriesTitle(e.target.value)}
                placeholder="새 시리즈 제목 (저장할 때 만들어져요)"
                aria-label="새 시리즈 제목"
                autoFocus
                className={`${inputClass} mt-2`}
              />
            ) : null}
          </Field>

          <Field label="커버 이미지" note="선택">
            {coverImageUrl ? (
              <div className="flex items-center gap-4">
                {/* next/image 권장 규칙이 있으나, 외부 스토리지 URL이라 img로 단순화(til-card.tsx와 동일 판단). */}
                <img
                  src={coverImageUrl}
                  alt=""
                  className="aspect-[16/9] w-36 shrink-0 border border-line object-cover dark:border-line-dark"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="btn tap-feedback cursor-pointer text-label">
                    {uploadingCover ? '업로드 중...' : '바꾸기'}
                    <input type="file" accept="image/*" onChange={handleCoverImageChange} disabled={uploadingCover} className="hidden" />
                  </label>
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => setCoverImageUrl(null)}
                    className="btn tap-feedback text-label text-destructive dark:text-destructive-dark"
                  >
                    제거
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-dashed border-line bg-background px-3 py-3 text-label font-semibold text-muted hover:border-foreground hover:text-foreground dark:border-line-dark dark:bg-background-dark dark:text-muted-dark dark:hover:border-foreground-dark dark:hover:text-foreground-dark">
                <ImagePlus className="h-4 w-4" aria-hidden />
                {uploadingCover ? '업로드 중...' : '이미지 올리기'}
                <input type="file" accept="image/*" onChange={handleCoverImageChange} disabled={uploadingCover} className="hidden" />
              </label>
            )}
          </Field>
        </section>
      </div>

      {/* ── 저장 바: 삭제는 왼쪽 끝, 저장·발행은 오른쪽 끝 ───────────────── */}
      {/* pb-16: 오른쪽 아래 떠 있는 '맨 위로' 버튼이 페이지 끝에서 발행 버튼을 덮지 않게 여백 확보 */}
      <div className="flex flex-col gap-3 border-t border-line pb-16 pt-5 dark:border-line-dark">
        {error ? <p className="text-label font-semibold text-destructive dark:text-destructive-dark">{error}</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          {post ? (
            <button
              type="button"
              disabled={pending}
              onClick={handleDelete}
              className="btn tap-feedback text-label text-destructive dark:text-destructive-dark"
            >
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
              삭제
            </button>
          ) : null}
          <div className="ml-auto flex items-center gap-3">
            <button type="button" disabled={pending} onClick={() => handleSave(false)} className="btn tap-feedback text-body">
              초고 저장
            </button>
            <button type="button" disabled={pending} onClick={() => handleSave(true)} className="btn-action tap-feedback text-body">
              발행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const NEW_SERIES = '__new__';

const groupTitle =
  '-mx-5 -mt-1 border-b border-line px-5 pb-3 text-body font-extrabold sm:-mx-6 sm:px-6 dark:border-line-dark';

function Field({
  label,
  note,
  htmlFor,
  children,
}: {
  label: string;
  note?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-label font-bold">{label}</label>
        {note ? <span className="text-label font-normal text-muted dark:text-muted-dark">{note}</span> : null}
      </div>
      {children}
    </div>
  );
}
