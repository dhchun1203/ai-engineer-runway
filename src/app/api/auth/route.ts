// GET /api/auth: 내비가 "로그인"/"프로필" 라벨을 고르기 위한 최소 인증 상태 조회.
// 진도 데이터를 읽지 않고 게이트 판정(hasUnlockCookie)만 반환한다(/api/progress보다
// 가볍다). 클라이언트 내비가 마운트 시 한 번 부른다. 캐시 금지(사용자별, 상태별 응답).

import { NextResponse } from 'next/server';
import { hasUnlockCookie } from '@/lib/auth';
import { isOwnerSession } from '@/lib/owner';
import { isRoadmapViewer } from '@/lib/roadmap-access';
import { getCurrentUserId } from '@/lib/current-user';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0, must-revalidate' };

export async function GET() {
  // loggedIn: 아무 사용자 로그인 여부(내비 라벨용). isOwner: 소유자 전용 항목(슬랙 피드, 가입
  // 승인) 노출 여부. roadmapViewer: 채널톡 로드맵을 볼 수 있는 계정인지. 내비가 이 값으로
  // "채널톡 로드맵" 항목을 허용 계정에게만 보인다.
  // userId: 오프라인 모드가 기기 저장본의 주인과 지금 로그인한 사람이 같은지 대조하는 값
  // (다른 계정이면 저장본을 지운다). 요청한 사람 자신의 id만 돌려준다. 시크릿 쿠키로만
  // 통과한 경우에는 사용자 id가 없어 null이다.
  // buildId: 서버의 현재 빌드 id. 오프라인 대기열을 재생하기 전에 페이지의 빌드 id와 비교한다
  // (다르면 페이지를 새로 불러온 뒤 재생한다). 서비스 워커 등록 주소에 이미 공개되는 값이다.
  const [loggedIn, isOwner, roadmapViewer, userId] = await Promise.all([
    hasUnlockCookie(),
    isOwnerSession(),
    isRoadmapViewer(),
    getCurrentUserId(),
  ]);
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev';
  return NextResponse.json(
    { loggedIn, isOwner, roadmapViewer, userId, buildId },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
