---
quick_id: 260905-vbc
slug: book-step-step1
date: 2026-09-05
---

# Quick 260905-vbc — 책으로 읽기 음성 플레이어(Phase C, Step 1)

책으로 읽기 음성 낭독 기능([[book-audio-narration-feature]])의 Phase C. Phase B에서
무료 코랩 GPU(XTTS)로 생성해 받은 Step 1 챕터 10개 MP3를 Supabase Storage에 올리고,
/book/[step]에 재생 바를 붙인다. 스텝 단위 대상(레슨 낱개 아님), Step 1 파일럿.

## 태스크

1. **오디오 호스팅** — Step 1 MP3 10개를 Supabase Storage 공개 버킷 `book-audio`의
   `step1/`에 업로드(일회성 스크립트, service_role 키). 공개 URL 확보.
2. **매니페스트** — `src/content/book-audio.ts`: 스텝별 챕터(slug·title·seconds·url).
   slug로 book-scopes 챕터와 매칭. 없는 스텝은 undefined.
3. **플레이어** — `src/components/book-audio-player.tsx`(client): <audio> 하나로 챕터
   이어재생·자동 다음, 재생/정지·10초 앞뒤·이전/다음·배속·진행 막대·챕터 목록,
   재생 중 본문 챕터 스크롤+강조, 이어듣기(localStorage), MediaSession(잠금화면).
4. **통합/스타일** — globals.css에 하단 바·FAB 밀어올림(겹침 방지)·챕터 강조,
   page.tsx에서 getBookAudio로 렌더.

## 검증

내장 브라우저 768×1024에서 재생·챕터 이동·강조·이어듣기·FAB 겹침·라이트/다크 확인.
사용자는 배포 사이트를 아이패드로 최종 확인(push까지).

## 범위 밖

Step 2·3 생성, 읽는 "문장" 단위 하이라이트(현재는 챕터 단위), CosyVoice2 비교.
