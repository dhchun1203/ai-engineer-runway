import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const fail = (m) => { console.error('check-til FAIL:', m); process.exit(1); };

// G1: store는 supabaseAdmin만, createClient 직접 호출 금지.
const store = read('src/lib/til/store.ts');
if (!store.includes("from '@/lib/supabase/admin'")) fail('store가 supabaseAdmin을 임포트하지 않음');
if (store.includes('createClient(')) fail('store가 createClient를 직접 호출함(admin.ts만 허용)');

// G2: 마이그레이션 RLS default-deny(정책 없음).
const mig = read('supabase/migrations/20260910120000_create_til.sql');
if (!/enable row level security/i.test(mig)) fail('마이그레이션에 RLS enable 없음');
if (/create policy/i.test(mig)) fail('til 테이블에 정책이 있음 — default-deny 위반');

// G3: 액션 게이트.
const actions = read('src/app/til/actions.ts');
if (!actions.includes('hasUnlockCookie')) fail('actions가 hasUnlockCookie 게이트를 안 씀');
if (!/셀프 체크|self_check|selfCheck/.test(actions)) fail('발행 필수 검증(셀프체크) 흔적 없음');

console.log('check-til: OK (admin 규율·RLS default-deny·게이트 확인)');
