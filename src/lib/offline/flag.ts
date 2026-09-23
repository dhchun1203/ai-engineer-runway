// 오프라인 모드 끄기 스위치(설계 "되돌리기(롤백)"). Vercel 환경 변수 NEXT_PUBLIC_OFFLINE_MODE를
// "off"로 두고 다시 배포하면, 빌드 때 이 값이 박혀 들어간다. 꺼져 있으면 런타임
// (offline-runtime.tsx)이 서비스 워커를 등록하는 대신 이 기기의 서비스 워커를 모두 해제하고
// offline-* 캐시와 offline-db를 지운다. 대기열 재생, 옛 저장본 옮기기, 전체 받기도 하지 않고,
// 쓰기는 예전처럼 서버로 바로 보낸다.

export const OFFLINE_MODE_OFF = process.env.NEXT_PUBLIC_OFFLINE_MODE === "off";
