// 채널톡(채널코퍼레이션) AI Engineer 진입 로드맵 — 데이터 정의.
//
// 이 파일은 정규 학습 커리큘럼(step/lesson/진도)과 완전히 분리된, 취업 목표
// 트랙의 콘텐츠 원천이다. 사용자가 앞으로 직접 채워나가는 살아있는 문서라,
// 진도 저장(Supabase)이나 완료 체크에 얽히지 않고 이 파일을 편집하는 것만으로
// 단계와 스킬, 메모를 늘려갈 수 있게 순수 데이터로 둔다(/concepts와 같은
// 정적 셸 방침). 근거(rationale)와 인용(evidence)은 실제 채널톡 채용 공고와
// 기술블로그, CTO 인터뷰에서 뽑은 것으로, 각 단계가 왜 필요한지를 회사의 말로
// 못 박아 학습 동기를 잃지 않게 한다.
//
// 표기 규칙: 페이지에 공개되는 프로즈에는 가운데점과 긴하이픈을 쓰지 않는다
// (쉼표, 괄호, 줄바꿈으로 대신한다).

export type RoadmapSkill = {
  /** 익혀야 할 역량 한 줄 */
  title: string;
  /** 사용자가 나중에 자료 링크나 메모를 붙일 자리(선택) */
  note?: string;
};

export type RoadmapStage = {
  /** 라우트/앵커에 쓰는 안정적 식별자 */
  id: string;
  /** 표시 순서(0부터) */
  order: number;
  /** 단계를 상징하는 이모지 */
  icon: string;
  /** 단계 제목 */
  title: string;
  /** 한 줄 부제 */
  subtitle: string;
  /** 왜 이 단계가 채널톡 입사에 필요한가 */
  rationale: string;
  /** 채널톡의 말(공고/블로그/인터뷰 인용) */
  evidence: string;
  /** 인용 출처 라벨 */
  evidenceSource: string;
  /** 이 단계에서 익힐 구체 역량들 */
  skills: RoadmapSkill[];
  /** 사이트 내 연결 링크(있으면) */
  internalLink?: { label: string; href: string };
};

export type TalentTrait = {
  /** 인재상 한 줄 */
  title: string;
  /** 풀어 쓴 설명 */
  body: string;
  /** 근거 출처 */
  source: string;
};

export type RoadmapSource = {
  label: string;
  href: string;
};

/**
 * 채널톡이 찾는 사람 — 채용 공고, CTO 인터뷰, 기술블로그를 가로질러 반복되는
 * 인재상을 여섯 갈래로 정리했다.
 */
export const talentTraits: readonly TalentTrait[] = [
  {
    title: "태도가 스택을 이긴다",
    body: "CTO는 특정 기술 스택이나 몇 년의 경력보다 기술을 대하는 태도를 더 중요하게 본다고 말합니다. 문제 앞에서 자연스럽게 왜 이렇게 되어 있는지 묻고, 모르는 것을 만나면 깊이 파고드는 사람을 원합니다.",
    source: "CTO 인터뷰, 함께 하고 싶은 개발자",
  },
  {
    title: "기초가 곧 실력",
    body: "자료구조와 알고리즘 같은 전통적 기초, 시스템이 어떻게 도는지에 대한 깊은 이해를 강조합니다. AI가 코드를 대신 써주는 시대일수록 기초 사고력과 문제 분석 능력이 오히려 더 필수적이라고 봅니다.",
    source: "CTO 인터뷰, Software Engineer 공고",
  },
  {
    title: "무엇을 만들지 정의하는 힘",
    body: "어떻게 구현할까보다 무엇을 구현할 것인가가 중요해졌습니다. 모호한 비즈니스 문제를 AI 문제로 바꾸고, 문제를 정의하고 구조화하는 능력을 핵심 역량으로 꼽습니다.",
    source: "Applied AI Engineer 공고, CTO 인터뷰",
  },
  {
    title: "빠른 가설 검증 반복",
    body: "정답을 고집하기보다 더 나은 질문을 찾는 팀입니다. 불확실한 상황에서도 실험을 시작하고, 빠르게 가설을 세워 검증하고 개선하는 몰입을 요구합니다.",
    source: "Applied AI Engineer 공고",
  },
  {
    title: "End-to-end 오너십",
    body: "문제 정의부터 프로덕션까지 스스로 책임지고 끝까지 밀고 가는 경험을 중요하게 봅니다. 개발자와 비개발자를 오가며 함께 문제를 정의하는 커뮤니케이션도 함께 요구합니다.",
    source: "Forward Deployed Engineer 공고",
  },
  {
    title: "AI로 일하는 사람",
    body: "AI 도구 사용을 즐기고, 자기 업무와 프로세스를 직접 AI로 재설계해 본 사람을 우대합니다. 채널톡은 이미 Cursor를 전사 도입하고 사내 에이전트로 일하는 조직입니다.",
    source: "FDE 공고, 기술블로그",
  },
] as const;

/**
 * 진입 로드맵 — 기초에서 실전 태도까지 여덟 단계. Applied AI Engineer 트랙을
 * 중심축으로 두되, FDE와 Software Engineer 요건까지 함께 녹였다.
 */
export const roadmapStages: readonly RoadmapStage[] = [
  {
    id: "foundations",
    order: 0,
    icon: "🧱",
    title: "CS 기초와 문제 정의",
    subtitle: "탐구 습관과 사고의 근육 만들기",
    rationale:
      "채널톡은 스택보다 기초와 태도를 봅니다. 여기서 흔들리면 뒤 단계가 모두 흔들리므로 가장 먼저 다집니다.",
    evidence:
      "기초를 탄탄히 다지고 싶거나, 그걸 쌓아가고 싶은 분을 원합니다.",
    evidenceSource: "CTO 인터뷰",
    skills: [
      { title: "자료구조와 알고리즘의 기본기 (배열, 해시, 트리, 그래프, 복잡도)" },
      { title: "시스템이 어떻게 도는지 왜 이렇게 되어 있는지 파고드는 습관" },
      { title: "큰 문제를 작은 문제로 정의하고 구조화하는 연습" },
      { title: "코드 리뷰를 주고받으며 근거로 설득하기" },
    ],
  },
  {
    id: "python-eng",
    order: 1,
    icon: "🐍",
    title: "Python과 엔지니어링 기본기",
    subtitle: "빠르게 만들고 빠르게 디버깅하기",
    rationale:
      "Applied AI Engineer 필수 자격에 Python 프로그래밍 능력이 명시돼 있습니다. AI 실험도 결국 탄탄한 코드 위에서 돌아갑니다.",
    evidence: "Python 프로그래밍 능력",
    evidenceSource: "Applied AI Engineer 필수 자격",
    skills: [
      { title: "Python 실무 (타입 힌트, 비동기, 패키지와 가상환경)" },
      { title: "Git 협업 흐름과 작은 단위 커밋" },
      { title: "테스트 작성과 빠른 디버깅" },
      { title: "간단한 API 서버와 데이터 처리 스크립트 만들기" },
    ],
  },
  {
    id: "llm-core",
    order: 2,
    icon: "🧠",
    title: "LLM의 본질 이해",
    subtitle: "토큰, 컨텍스트, 컨텍스트 엔지니어링",
    rationale:
      "채널톡 AI팀은 모델을 깊이 이해하고 상황에 맞게 갈아끼웁니다. 원리를 알아야 왜 이 모델인지, 왜 이 프롬프트인지 설명할 수 있습니다.",
    evidence:
      "공개 벤치마크 1위 모델이 아닌, 리더보드에도 없는 모델을 선택했습니다.",
    evidenceSource: "기술블로그, 상담 Agent 모델 교체기",
    skills: [
      { title: "토큰, 임베딩, 컨텍스트 윈도우가 실제로 무엇인지" },
      { title: "프롬프트와 컨텍스트 엔지니어링 (필요한 정보를 필요한 만큼만)" },
      { title: "모델별 특성 비교와 선택 기준" },
      { title: "LLM API를 직접 호출하며 감 잡기" },
    ],
    internalLink: { label: "사이트의 AI 뜯어보기로 개념 다지기", href: "/concepts" },
  },
  {
    id: "rag",
    order: 3,
    icon: "🔎",
    title: "RAG와 정보 검색 시스템",
    subtitle: "지식을 AI가 진짜 이해하게 만들기",
    rationale:
      "이 트랙의 심장입니다. Applied AI Engineer의 필수 역량이자 상담 에이전트 ALF의 핵심 기술입니다.",
    evidence:
      "고객 상담 에이전트(ALF)의 RAG 성능 고도화, 멀티모달 지식 검색 시스템 설계.",
    evidenceSource: "Applied AI Engineer 주요 업무",
    skills: [
      { title: "임베딩과 벡터 검색, 유사도의 원리" },
      { title: "RAG 파이프라인을 직접 만들고 성능 높이기" },
      { title: "원천 데이터(PDF, 스프레드시트, 웹페이지)를 지식으로 바꾸는 전처리 파이프라인" },
      { title: "텍스트와 이미지를 아우르는 멀티모달 지식 검색 감각" },
    ],
  },
  {
    id: "agents",
    order: 4,
    icon: "🤖",
    title: "AI 에이전트와 Agentic Workflow",
    subtitle: "답하는 AI에서 행동하는 AI로",
    rationale:
      "ALF v2는 안내를 넘어 직접 행동합니다. 채널톡은 상담과 마케팅을 아우르는 대고객 에이전트를 설계하는 팀입니다.",
    evidence:
      "회원 정보 조회 후 이메일 수신 차단 해제까지 처리해줍니다.",
    evidenceSource: "ALF v2 해결률 80% 사례",
    skills: [
      { title: "툴 호출(function calling)과 에이전트 루프의 구조" },
      { title: "에이전틱 서치 (스스로 정보를 찾아 판단하기)" },
      { title: "실제 시스템과 연동해 행동을 수행하는 task execution" },
      { title: "멀티 에이전트 설계와 MCP 같은 도구 생태계" },
    ],
  },
  {
    id: "evals",
    order: 5,
    icon: "📏",
    title: "평가와 벤치마크 (Evals)",
    subtitle: "감이 아니라 숫자로 좋아지기",
    rationale:
      "채널톡은 해결률을 52%에서 80%로 올렸습니다. 무엇이 나아졌는지 측정하지 못하면 개선도 없습니다.",
    evidence:
      "AI 상담 평가와 개선 자동화 시스템 설계, 벤치마크 구축.",
    evidenceSource: "Applied AI Engineer 주요 업무",
    skills: [
      { title: "상담 해결률처럼 프로덕트에 직결되는 지표 정의" },
      { title: "오프라인 평가셋과 온라인 지표를 나눠 보기" },
      { title: "할루시네이션과 품질 저하를 잡는 평가 루프" },
      { title: "평가를 자동화해 개선 사이클을 빠르게 돌리기" },
    ],
  },
  {
    id: "production",
    order: 6,
    icon: "⚙️",
    title: "프로덕션과 비용 최적화",
    subtitle: "수만 건 상담을 안정적으로, 그리고 싸게",
    rationale:
      "매일 수만 건을 응대하는 규모에서는 서빙 안정성과 비용이 곧 실력입니다.",
    evidence:
      "상담과 마케팅을 아우르는 대고객 에이전트 설계, 멀티 LLM 인프라 비용 최적화.",
    evidenceSource: "Applied AI Engineer 주요 업무",
    skills: [
      { title: "멀티 LLM 인프라와 모델 서빙의 기본" },
      { title: "컨텍스트 비용을 줄이는 설계 패턴" },
      { title: "모델을 갈아끼울 때의 벤치마킹과 의사결정" },
      { title: "모니터링과 장애 알림" },
    ],
  },
  {
    id: "mindset",
    order: 7,
    icon: "🧭",
    title: "실전 감각과 Forward Deployed 태도",
    subtitle: "0에서 1을 직접 만들어 본 사람",
    rationale:
      "결국 채널톡이 보는 것은 태도입니다. 작더라도 내 손으로 끝까지 만들어 본 경험이 가장 강한 이력입니다.",
    evidence:
      "업무와 프로세스를 AI로 재설계해 본 경험을 우대합니다.",
    evidenceSource: "Forward Deployed Engineer 우대 사항",
    skills: [
      { title: "모호한 문제를 AI 문제로 바꾸고 빠르게 가설 검증하기" },
      { title: "작은 AI 프로젝트를 0에서 1까지 직접 출시해 시행착오 쌓기" },
      { title: "내 업무와 공부를 실제로 AI로 재설계해 보기" },
      { title: "개발자와 비개발자를 오가며 문제를 함께 정의하는 연습" },
    ],
  },
] as const;

/**
 * 채용 절차 개요 — Software Engineer 기준. 직군에 따라 단계는 달라질 수 있다.
 */
export const hiringProcess: readonly string[] = [
  "서류 지원",
  "온라인 사전 기술 인터뷰",
  "인터뷰 1 (코딩)",
  "인터뷰 2 (기술 심화)",
  "인터뷰 3 (컬처 핏)",
  "최종 합격",
] as const;

/**
 * 로드맵의 근거가 된 채용 공고와 기술블로그 자료.
 */
export const roadmapSources: readonly RoadmapSource[] = [
  {
    label: "채널톡 채용 (AI 시대의 개척자를 찾습니다)",
    href: "https://channel.io/ko/careers",
  },
  {
    label: "Applied AI Engineer 공고",
    href: "https://channel.io/kr/careers/9ae3038a-70e9-40da-85dd-c7c854bb4527",
  },
  {
    label: "Forward Deployed Engineer 공고",
    href: "https://demoday.co.kr/recruits/6021",
  },
  {
    label: "CTO가 말하는 함께 하고 싶은 개발자",
    href: "https://channel.io/ko/team/blog/articles/%EC%B1%84%EB%84%90%ED%86%A1-CTO%EA%B0%80-%EB%A7%90%ED%95%98%EB%8A%94-%ED%95%A8%EA%BB%98-%ED%95%98%EA%B3%A0-%EC%8B%B6%EC%9D%80-%EA%B0%9C%EB%B0%9C%EC%9E%90-1194dd7a",
  },
  {
    label: "채널톡 기술블로그",
    href: "https://tech.channel.io/ko",
  },
  {
    label: "ALF v2 해결률 80% 사례",
    href: "https://channel.io/ko/blog/articles/alfv2-cx-case-02942123",
  },
] as const;
