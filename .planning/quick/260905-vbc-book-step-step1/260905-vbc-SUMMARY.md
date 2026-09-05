---
quick_id: 260905-vbc
slug: book-step-step1
date: 2026-09-05
status: complete
commits:
  - 7dd3469
---

# Quick 260905-vbc — 책으로 읽기 음성 플레이어(Step 1)

## 무엇을 만들었나

`/book/1`(책으로 읽기, 스텝 단위)에 **낭독 재생 바**를 붙였다. 무료 오픈소스 TTS
(XTTS, 코랩 무료 GPU)로 만든 Step 1 챕터 10개 MP3(총 ~25분)를 Supabase Storage 공개
버킷에 올리고, 선생님이 읽어주듯 챕터를 자동으로 넘겨 가며 들려준다.

## 어떻게

- **호스팅**: Supabase Storage 공개 버킷 `book-audio` 생성, `step1/<slug>.mp3` 10개
  업로드(일회성 스크립트, service_role). 공개 URL 200·audio/mpeg 확인.
- **매니페스트** `src/content/book-audio.ts`: `getBookAudio(stepId)` → 스텝별 챕터
  (slug·title·seconds·url). slug로 book-scopes 챕터와 매칭. Step 2·3은 undefined라
  플레이어를 렌더하지 않는다(파일럿).
- **플레이어** `src/components/book-audio-player.tsx`(client): <audio> 하나로 현재
  챕터 재생, 끝나면 다음 챕터 자동 재생. 재생/정지·10초 앞뒤·이전/다음 챕터·배속
  (1/1.25/1.5)·진행 막대(seek)·챕터 목록(펼쳐 점프). 재생 중 본문의 해당 챕터
  ([data-book-chapter])로 스크롤 + 제목 강조([data-book-audio-active]). 이어듣기
  위치 localStorage 저장/복원(iOS 제스처 요건상 복원 시 자동재생 안 함). MediaSession
  으로 잠금화면·제어센터 컨트롤(아이패드 화면 꺼도 재생 지속).
- **스타일/통합**: globals.css `.book-audio-bar` 하단 고정 + 바 높이만큼 scroll-top·
  book-bookmark FAB 밀어올림(메모장 시트 `:has()` 패턴 재사용, 겹침 방지) + 본문 하단
  여백 + 진행 막대·챕터 강조. page.tsx는 매니페스트 있으면 `<BookAudioPlayer>` 렌더.

## 검증(내장 브라우저 768×1024)

재생 정상(Supabase mp3 로드, currentTime 진행, 에러 0) · 챕터 목록 펼침·점프 시 src
전환·강조 이동 · 이어듣기 localStorage 저장(index·time) · 하단 바가 scroll-top FAB를
84px로 밀어올려 겹침 없음 · 라이트/다크 색 전부 토큰대로(surface·line·accent·foreground).
tsc·eslint 통과. 최종은 사용자가 배포 사이트를 아이패드로 확인(push).

## 다음(범위 밖)

Step 2·3 음성 생성(같은 코랩 노트북 STEP 바꿔 실행 → 같은 업로드/매니페스트 확장) ·
읽는 "문장" 단위 하이라이트(현재 챕터 단위) · CosyVoice2 음색 비교.

## 커밋

- `7dd3469` feat(quick-260905-vbc): 책으로 읽기 음성 플레이어 — /book/1 낭독 재생 바
