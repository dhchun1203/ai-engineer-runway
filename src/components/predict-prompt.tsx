// 4장(실무 예제) 첫 코드 앞에 붙는 "먼저 스스로 설계" 의례 콜아웃(quick 260902-0rz).
// 문구를 이 컴포넌트 안에 한 번만 담아둔다 — 레슨별 커스텀 저작이 아니라 모든
// 레슨에서 글자 그대로 동일한 의례 장치이기 때문이다(연구 근거: 부분 적용은
// 유해하다, 경계 안 전량 균일 적용). props/children이 없는 자기완결 컴포넌트라
// MDX에는 자기닫힘 `<PredictPrompt />` 한 줄만 삽입하면 된다 — 삽입 지점마다
// 문구가 흔들릴 여지가 없다.
//
// 항상 보이는 콜아웃이다 — `<details>` 접기가 아니다. 사고 실험(30초 예측)이라
// 숨길 이유가 없고, 코드를 보기 전 시선이 반드시 거쳐가야 하는 자리다.
//
// 서버 컴포넌트다(RunPython/RunSQL과 달리 상태나 이벤트가 없다) — 'use client'
// 마커를 붙이지 않는다.

import { Lightbulb } from 'lucide-react';

export function PredictPrompt() {
  return (
    <div data-predict-prompt className="panel flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 shrink-0 text-accent dark:text-accent-dark" aria-hidden="true" />
        <p className="text-label font-bold">코드 보기 전 30초: 먼저 스스로 설계</p>
      </div>
      <p className="text-body font-normal">
        아래 코드를 보기 전에, 어떤 순서로 짜야 할지 머릿속으로 한 번 그려 보세요. 잘 안 그려져도
        괜찮습니다. 통과 여부는 중요하지 않아요. 스스로 예상해 본 다음 코드와 맞춰 보면, 그냥
        읽고 넘어갈 때보다 훨씬 오래 남습니다.
      </p>
    </div>
  );
}
