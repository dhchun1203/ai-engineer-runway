import Link from 'next/link';
import { redirect } from 'next/navigation';
import { hasUnlockCookie } from '@/lib/auth';
import { TIL_TEMPLATES, isTilTemplate } from '@/lib/til/templates';
import { listSeries } from '@/lib/til/store';
import { TilEditor } from '@/components/til/til-editor';

export const dynamic = 'force-dynamic';

export default async function TilNewPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  if (!(await hasUnlockCookie())) redirect('/login');
  const { template } = await searchParams;

  // 템플릿을 이미 고른 상태면 에디터를, 아니면 선택 카드를.
  if (template && isTilTemplate(template)) {
    const seriesRead = await listSeries();
    const allSeries = seriesRead.ok ? seriesRead.data : [];
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <TilEditor mode="create" template={template} allSeries={allSeries} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-display font-black">어떤 걸 쓸까요?</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TIL_TEMPLATES.map((t) => (
          <Link key={t.key} href={`/til/new?template=${t.key}`} className="panel flex min-h-11 flex-col gap-2 p-5">
            <span className="text-heading font-extrabold">{t.label}</span>
            <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
              {t.description}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
