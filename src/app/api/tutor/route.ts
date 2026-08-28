// POST /api/tutor — 레슨 과외선생님 스트리밍 대화.
// GET  /api/tutor?lesson=<slug> — 저장된 대화 불러오기.
// DELETE /api/tutor?lesson=<slug> — 대화 초기화.
//
// 본문 순서가 보안 계약이다 — hasUnlockCookie() 재검증을 무조건, 그리고 어떤
// 조회·모델 호출보다도 먼저 한다(api/progress/route.ts와 같은 게이트 순서).
// 잠금 해제 전에는 레슨 본문도 대화도 토큰도 절대 나가지 않는다.
//
// API 키는 서버 환경변수에서만 읽고 응답·로그 어디에도 싣지 않는다.
//
// 모델: claude-sonnet-5 (사용자 지정). 설명과 되묻기에 충분히 좋고 빠르며,
// 이 사이트의 사용 규모에서 비용이 사실상 문제가 되지 않는다.

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { hasUnlockCookie } from '@/lib/auth';
import { getLessonBySlug, getOrderedLessons } from '@/content/curriculum-helpers';
import { modules } from '@/content/modules';
import { readLessonNote } from '@/lib/note-store';
import { readCompletedLessonIds } from '@/lib/progress-store';
import {
  readLessonChat,
  saveLessonChat,
  clearLessonChat,
  MAX_MESSAGE_LENGTH,
  type TutorMessage,
} from '@/lib/tutor-store';
import { buildTutorSystemPrompt, buildTutorContext } from '@/lib/tutor-prompt';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' } as const;

const MODEL = 'claude-sonnet-5';
// 과외 답변 한 개의 상한. 넉넉하되 무한하지 않다 — 스트리밍이라 타임아웃 걱정은
// 없고, 이 값은 "한 번에 이 이상은 쓰지 않는다"는 뜻이다.
const MAX_TOKENS = 8_000;

function unauthorized() {
  return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE_HEADERS });
}

function moduleTitleOf(moduleId: string): string {
  return modules.find((m) => m.id === moduleId)?.title ?? moduleId;
}

export async function GET(request: Request) {
  if (!(await hasUnlockCookie())) return unauthorized();

  const slug = new URL(request.url).searchParams.get('lesson');
  if (!slug || !getLessonBySlug(slug)) {
    // 미존재 슬러그는 오류가 아니라 빈 대화로 처리한다 — 존재 여부를 되묻는
    // 탐침이 되지 않게 한다(api/progress/route.ts와 같은 방어).
    return NextResponse.json({ ok: true, messages: [] }, { headers: NO_STORE_HEADERS });
  }

  const read = await readLessonChat(slug);
  if (!read.ok) {
    return NextResponse.json({ ok: false, messages: [] }, { status: 502, headers: NO_STORE_HEADERS });
  }
  return NextResponse.json({ ok: true, messages: read.messages }, { headers: NO_STORE_HEADERS });
}

export async function DELETE(request: Request) {
  if (!(await hasUnlockCookie())) return unauthorized();

  const slug = new URL(request.url).searchParams.get('lesson');
  if (!slug || !getLessonBySlug(slug)) {
    return NextResponse.json({ ok: false }, { status: 400, headers: NO_STORE_HEADERS });
  }

  try {
    await clearLessonChat(slug);
  } catch {
    return NextResponse.json({ ok: false }, { status: 502, headers: NO_STORE_HEADERS });
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  if (!(await hasUnlockCookie())) return unauthorized();

  if (!process.env.ANTHROPIC_API_KEY) {
    // 키가 없으면 조용히 빈 응답을 흘리지 않고 명시적으로 알린다 — 설정 누락을
    // "선생님이 대답을 안 한다"로 오인하면 진단이 오래 걸린다.
    return NextResponse.json(
      { ok: false, error: 'ANTHROPIC_API_KEY가 서버에 설정되어 있지 않습니다.' },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  let body: { lesson?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const slug = typeof body.lesson === 'string' ? body.lesson : '';
  const userMessage = typeof body.message === 'string' ? body.message.trim() : '';

  const lesson = getLessonBySlug(slug);
  if (!lesson || userMessage.length === 0 || userMessage.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ ok: false }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const [chatRead, noteRead, progressRead] = await Promise.all([
    readLessonChat(slug),
    readLessonNote(slug),
    readCompletedLessonIds(),
  ]);

  if (!chatRead.ok) {
    return NextResponse.json({ ok: false }, { status: 502, headers: NO_STORE_HEADERS });
  }

  const history = chatRead.messages;
  const note = noteRead.ok ? noteRead.body : '';
  const completedCount = progressRead.ok ? progressRead.completedIds.size : 0;
  const totalCount = getOrderedLessons().length;

  const client = new Anthropic();
  const conversation: TutorMessage[] = [...history, { role: 'user', content: userMessage }];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let answer = '';
      try {
        const modelStream = client.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          // 과외 대화는 응답 속도가 곧 쓸모다 — 깊이보다 왕복이 중요하다.
          output_config: { effort: 'medium' },
          system: [
            {
              type: 'text',
              text: buildTutorSystemPrompt(lesson, moduleTitleOf(lesson.moduleId)),
              // 레슨 본문은 한 레슨 안에서 절대 바뀌지 않는다 — 여기까지를
              // 캐시하면 두 번째 턴부터 이 부분이 10분의 1 가격이 된다.
              cache_control: { type: 'ephemeral' },
            },
            { type: 'text', text: buildTutorContext(note, completedCount, totalCount) },
          ],
          messages: conversation.map((m) => ({ role: m.role, content: m.content })),
        });

        for await (const event of modelStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta' &&
            event.delta.text
          ) {
            answer += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        // 스트림이 끝난 뒤에 한 번만 저장한다 — 델타마다 쓰면 왕복이 대화 길이에
        // 비례해 늘어난다.
        if (answer.length > 0) {
          await saveLessonChat(slug, [...conversation, { role: 'assistant', content: answer }]);
        }
      } catch {
        // 오류 문자열(모델·키·DB 메시지)을 그대로 흘리지 않는다. 클라이언트는
        // 한국어 한 줄만 받는다.
        controller.enqueue(encoder.encode('\n\n(답변을 받지 못했어요. 잠시 후 다시 물어봐 주세요.)'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...NO_STORE_HEADERS,
      'Content-Type': 'text/plain; charset=utf-8',
      // 프록시가 스트림을 모아 한 번에 내보내지 않게 한다.
      'X-Accel-Buffering': 'no',
    },
  });
}
