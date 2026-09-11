import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpenText, Flag, ListChecks, PenLine } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LoginForm } from './login-form';
import { signOutAction } from './actions';

// 세션을 읽어 로그인 상태에 따라 폼/로그아웃을 가르므로 동적 렌더가 필요하다.
export const dynamic = 'force-dynamic';

// 전체 로그인 게이트(2026-09-12) 이후 이 페이지가 사이트의 유일한 공개 진입점이자
// 소개 랜딩이다 — 색인을 막지 않고 사이트를 설명하는 메타데이터를 둔다. 교육기관명은
// 쓰지 않는다(브랜딩 HARD RULE) — 항상 "AI Engineer 교육과정".
export const metadata: Metadata = {
  title: 'AI Engineer 교육과정 사전학습',
  description:
    '개강 전 커리큘럼의 기초를 다지는 사전학습 사이트. 쉬운 개념 설명과 실무 예제 레슨, 베이스캠프 선행 과제, 진도와 복습, 학습 기록까지 한곳에서.',
};

// 현재 로그인한 사용자 이메일(있으면). 다중 사용자 전환 이후 화이트리스트는 보지 않고
// 로그인한 아무 사용자의 이메일을 반환한다 — auth.ts 게이트와 같은 기준(아무 세션).
async function currentUserEmail(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

const FEATURES = [
  {
    icon: BookOpenText,
    title: '커리큘럼 레슨',
    body: '쉬운 개념 설명과 실무 적용 예제로 커리큘럼 전체를 콘텐츠화했습니다.',
  },
  {
    icon: Flag,
    title: '베이스캠프 선행 과제',
    body: '개강 전 매주 공개되는 공식 선행 과제를 준비하는 최우선 트랙.',
  },
  {
    icon: ListChecks,
    title: '진도와 복습',
    body: '레슨 완료 체크, 섹션별 진행률, 간격 복습과 자가진단까지.',
  },
  {
    icon: PenLine,
    title: '학습 기록',
    body: '배운 것을 내 글로 남기는 TIL 기록으로 오래 남깁니다.',
  },
];

export default async function LoginPage() {
  const loggedInEmail = await currentUserEmail();

  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 items-start gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:py-16">
      {/* 소개 — 사이트가 무엇이고 무엇을 할 수 있는지. */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="chip-solid w-fit text-label font-bold">사전학습</span>
          <h1 className="text-display font-black break-keep">
            AI Engineer 교육과정 사전학습
          </h1>
          <p className="max-w-xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
            개강 전까지 커리큘럼의 기초를 확실히 다지는 곳입니다. 레슨을 읽고, 완료를
            체크하고, 진행률과 선행 과제를 한눈에 확인하며 준비합니다.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="panel flex items-start gap-3 p-4">
              <Icon
                className="mt-0.5 h-5 w-5 shrink-0 text-accent dark:text-accent-dark"
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-body font-extrabold break-keep">{title}</span>
                <span className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {body}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 로그인 — 진입점. 이미 로그인돼 있으면 홈으로 안내한다. */}
      <section className="panel-hero flex flex-col gap-5 p-6 lg:sticky lg:top-24">
        {loggedInEmail ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-heading font-extrabold">이미 로그인됨</h2>
            <p className="text-body font-normal break-keep">
              현재 <strong className="font-bold">{loggedInEmail}</strong> 계정으로
              로그인되어 있어요.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/" className="btn-action tap-feedback min-h-11 text-body">
                홈으로
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="chip tap-feedback min-h-11 text-body">
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-heading font-extrabold">로그인</h2>
              <p className="text-label font-normal text-muted dark:text-muted-dark">
                로그인하면 어느 기기에서든 진도와 학습 기록이 그대로 이어집니다.
              </p>
            </div>
            <LoginForm />
          </>
        )}
      </section>
    </main>
  );
}
