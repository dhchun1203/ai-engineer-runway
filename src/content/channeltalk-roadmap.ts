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

/**
 * 이 역량이 기존 AI Engineer 교육과정과 어떤 관계인가.
 * - reinforce: 교육과정에 이미 있는 내용. 과정을 들으며 채널톡 수준으로 더 깊게 강화한다.
 * - separate: 교육과정에 없거나 얕게 다뤄서, 따로 챙겨 학습해야 한다.
 * 분류 근거는 실제 교육과정(Step 1 개발 기반, Step 2 풀스택·LLM, Step 3 RAG·에이전트·LLMOps,
 * Step 4 기업 프로젝트)을 직접 확인해 매핑한 것이다. 공개 문구에는 기관명을 쓰지 않는다.
 */
export type SkillCoverage = "reinforce" | "separate";

export type RoadmapSkill = {
  /** 익혀야 할 역량 한 줄 */
  title: string;
  /** 교육과정과의 관계 라벨 */
  coverage: SkillCoverage;
  /**
   * reinforce면 교육과정 어디서 다루는지(예: "Step 3 RAG 파이프라인 설계"),
   * separate면 왜 따로 학습해야 하는지 짧은 이유.
   */
  where: string;
  /** 이 역량을 다루는 별도 심화 레슨의 slug(roadmapLessons). 있으면 로드맵에서 링크한다. */
  lessonSlug?: string;
  /** 사용자가 나중에 자료 링크나 메모를 붙일 자리(선택) */
  note?: string;
};

export type RoadmapStage = {
  /** 라우트/앵커에 쓰는 안정적 식별자 */
  id: string;
  /** 표시 순서(0부터) */
  order: number;
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
    body: "채널톡에서 AI는 실험 도구가 아니라 매일 쓰는 개발 환경입니다. Codex, Claude Code 같은 코딩 에이전트로 구현, 테스트, 디버깅, 리뷰를 하고, 테스트와 리뷰와 관측으로 결과가 맞는지 검증하는 구조까지 직접 설계합니다. 반복 구현은 AI에 맡기고 사람은 문제 정의와 설계에 집중합니다.",
    source: "Software Engineer 공고 (2026-10 확인)",
  },
  {
    title: "깊게 파고, 빠르게 실행하고, 배움을 나눈다",
    body: "엔지니어링팀의 일하는 방식은 Move Fast, Deep Dive, Share Out 세 가지이고, 방향은 Customer Driven입니다. 완벽한 계획보다 먼저 시도하되 끝까지 완주하고, 문제의 근본 원인과 기술의 원리까지 파고들며, 그 과정의 배움을 글과 발표로 팀의 자산으로 남깁니다.",
    source: "기술블로그, 엔지니어링 코어 밸류 (2026-10-14)",
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
    title: "CS 기초와 문제 정의",
    subtitle: "탐구 습관과 사고의 근육 만들기",
    rationale:
      "채널톡은 스택보다 기초와 태도를 봅니다. 여기서 흔들리면 뒤 단계가 모두 흔들리므로 가장 먼저 다집니다.",
    evidence:
      "기초를 탄탄히 다지고 싶거나, 그걸 쌓아가고 싶은 분을 원합니다.",
    evidenceSource: "CTO 인터뷰",
    skills: [
      {
        title: "자료구조와 알고리즘의 기본기 (배열, 해시, 트리, 그래프, 복잡도)",
        coverage: "separate",
        where: "교육과정 Python은 문법 중심이라 자료구조와 알고리즘은 따로 판다",
        lessonSlug: "cs-foundations",
      },
      {
        title: "시스템이 어떻게 도는지 왜 이렇게 되어 있는지 파고드는 습관",
        coverage: "separate",
        where: "모듈이 아니라 태도라, 스스로 훈련해야 한다",
        lessonSlug: "curiosity-systems",
      },
      {
        title: "큰 문제를 작은 문제로 정의하고 구조화하는 연습",
        coverage: "reinforce",
        where: "Step 2, 3 실무 프로젝트에서 반복 훈련",
      },
      {
        title: "코드 리뷰를 주고받으며 근거로 설득하기",
        coverage: "reinforce",
        where: "Step 1 개발 협업 및 Git PR 흐름",
      },
    ],
  },
  {
    id: "python-eng",
    order: 1,
    title: "Python과 엔지니어링 기본기",
    subtitle: "빠르게 만들고 빠르게 디버깅하기",
    rationale:
      "Applied AI Engineer 필수 자격에 Python 프로그래밍 능력이 명시돼 있습니다. AI 실험도 결국 탄탄한 코드 위에서 돌아갑니다.",
    evidence: "Python 프로그래밍 능력",
    evidenceSource: "Applied AI Engineer 필수 자격",
    skills: [
      {
        title: "Python 실무 (타입 힌트, 비동기, 패키지와 가상환경)",
        coverage: "reinforce",
        where: "Step 1 Python 프로그래밍 기초 (타입 힌트와 비동기는 심화가 필요)",
      },
      {
        title: "Git 협업 흐름과 작은 단위 커밋",
        coverage: "reinforce",
        where: "Step 1 개발 협업 및 생성형 AI 이해",
      },
      {
        title: "테스트 작성과 빠른 디버깅",
        coverage: "separate",
        where: "자동화 테스트는 교육과정에 별도 모듈이 없어 스스로 챙긴다",
        lessonSlug: "automated-testing",
      },
      {
        title: "간단한 API 서버와 데이터 처리 스크립트 만들기",
        coverage: "reinforce",
        where: "Step 2 백엔드 아키텍처 및 API 설계",
      },
      {
        title: "Go 맛보기 (우대 사항, Python 다음 순서)",
        coverage: "separate",
        where: "Applied AI Engineer 우대 사항이고, 채널톡은 새 백엔드 서비스를 Go로 만든다(Software Engineer 공고). 교육과정에 없으니 Python이 단단해진 뒤 여유 있을 때",
      },
    ],
  },
  {
    id: "llm-core",
    order: 2,
    title: "LLM의 본질 이해",
    subtitle: "토큰, 컨텍스트, 컨텍스트 엔지니어링",
    rationale:
      "채널톡 AI팀은 모델을 깊이 이해하고 상황에 맞게 갈아끼웁니다. 원리를 알아야 왜 이 모델인지, 왜 이 프롬프트인지 설명할 수 있습니다.",
    evidence:
      "공개 벤치마크 1위 모델이 아닌, 리더보드에도 없는 모델을 선택했습니다.",
    evidenceSource: "기술블로그, 상담 Agent 모델 교체기",
    skills: [
      {
        title: "토큰, 임베딩, 컨텍스트 윈도우가 실제로 무엇인지",
        coverage: "reinforce",
        where: "Step 2 LLM 프롬프트 엔지니어링, 임베딩은 Step 3 RAG",
      },
      {
        title: "프롬프트와 컨텍스트 엔지니어링 (필요한 정보를 필요한 만큼만)",
        coverage: "reinforce",
        where: "Step 2 프롬프트 엔지니어링 및 PromptOps",
      },
      {
        title: "모델별 특성 비교와 선택 기준",
        coverage: "separate",
        where: "교육과정은 튜닝 중심이라, 모델 선택과 교체 판단은 따로 익힌다",
        lessonSlug: "model-selection",
      },
      {
        title: "LLM API를 직접 호출하며 감 잡기",
        coverage: "reinforce",
        where: "Step 2 Project 1, 2에서 GPT와 Anthropic API 연동",
      },
      {
        title: "ML 개발 라이브러리 다뤄 보기 (PyTorch, Hugging Face, wandb)",
        coverage: "separate",
        where: "Applied AI Engineer 필수 자격에 명시(2026-10 공고). API 호출을 넘어 오픈 모델을 직접 불러 돌려 보고, 실험 기록을 wandb로 남겨 본다. 채널톡은 상담 분석을 직접 학습한 자체 모델로 바꿨다(기술블로그 2026-10-19)",
      },
    ],
    internalLink: { label: "사이트의 AI 뜯어보기로 개념 다지기", href: "/concepts" },
  },
  {
    id: "rag",
    order: 3,
    title: "RAG와 정보 검색 시스템",
    subtitle: "지식을 AI가 진짜 이해하게 만들기",
    rationale:
      "이 트랙의 심장입니다. Applied AI Engineer의 필수 역량이자 상담 에이전트 ALF의 핵심 기술입니다.",
    evidence:
      "고객 상담 에이전트(ALF)의 RAG 성능 고도화, 멀티모달 지식 검색 시스템 설계.",
    evidenceSource: "Applied AI Engineer 주요 업무",
    skills: [
      {
        title: "임베딩과 벡터 검색, 유사도의 원리",
        coverage: "reinforce",
        where: "Step 3 RAG 파이프라인 설계 (벡터 검색, 메타데이터)",
      },
      {
        title: "RAG 파이프라인을 직접 만들고 성능 높이기",
        coverage: "reinforce",
        where: "Step 3 RAG 파이프라인 및 Project 3 (하이브리드 검색, re-ranking)",
      },
      {
        title: "원천 데이터(PDF, 스프레드시트, 웹페이지)를 지식으로 바꾸는 전처리 파이프라인",
        coverage: "separate",
        where: "교육과정 RAG는 검색과 랭킹 중심이라, 다양한 원천 문서 전처리는 따로 심화",
        lessonSlug: "rag-ingestion",
      },
      {
        title: "텍스트와 이미지를 아우르는 멀티모달 지식 검색 감각",
        coverage: "separate",
        where: "멀티모달 검색은 교육과정에 없어 따로 학습",
        lessonSlug: "multimodal-search",
      },
    ],
  },
  {
    id: "agents",
    order: 4,
    title: "AI 에이전트와 Agentic Workflow",
    subtitle: "답하는 AI에서 행동하는 AI로",
    rationale:
      "ALF v2는 안내를 넘어 직접 행동합니다. 채널톡은 상담과 마케팅을 아우르는 대고객 에이전트를 설계하는 팀입니다.",
    evidence:
      "회원 정보 조회 후 이메일 수신 차단 해제까지 처리해줍니다.",
    evidenceSource: "ALF v2 해결률 80% 사례",
    skills: [
      {
        title: "툴 호출(function calling)과 에이전트 루프의 구조",
        coverage: "reinforce",
        where: "Step 3 Project 3 RAG Agent 및 오케스트레이션",
      },
      {
        title: "에이전틱 서치 (스스로 정보를 찾아 판단하기)",
        coverage: "reinforce",
        where: "Step 3 RAG Agent와 오케스트레이션의 연장선 (심화 영역)",
      },
      {
        title: "실제 시스템과 연동해 행동을 수행하는 task execution",
        coverage: "reinforce",
        where: "Step 3 워크플로우 오케스트레이션 (Webhook, 외부 툴 연동, HITL)",
      },
      {
        title: "멀티 에이전트 설계와 MCP 같은 도구 생태계",
        coverage: "reinforce",
        where: "Step 3 오케스트레이션 (LangGraph, MCP)",
      },
      {
        title: "내가 설계한 에이전트 워크플로 하나를 결과물로 남기고, 왜 그렇게 나눴는지 설명하기",
        coverage: "reinforce",
        where: "Step 3 Project 3 RAG Agent에서 내가 설계한 부분을 분명히 해 둔다 (10/16 튜터링: 신입 면접에서 워크플로 설계 경험을 본다)",
      },
    ],
  },
  {
    id: "evals",
    order: 5,
    title: "평가와 벤치마크 (Evals)",
    subtitle: "감이 아니라 숫자로 좋아지기",
    rationale:
      "채널톡은 해결률을 52%에서 80%로 올렸습니다. 무엇이 나아졌는지 측정하지 못하면 개선도 없습니다.",
    evidence:
      "AI 상담 평가와 개선 자동화 시스템 설계, 벤치마크 구축.",
    evidenceSource: "Applied AI Engineer 주요 업무",
    skills: [
      {
        title: "상담 해결률처럼 프로덕트에 직결되는 지표 정의",
        coverage: "reinforce",
        where: "Step 3 LLMOps (성공률, 비용, 지연 지표)",
      },
      {
        title: "오프라인 평가셋과 온라인 지표를 나눠 보기",
        coverage: "reinforce",
        where: "Step 3 Project 3 (질문-정답-근거 평가셋) 및 LLMOps",
      },
      {
        title: "할루시네이션과 품질 저하를 잡는 평가 루프",
        coverage: "separate",
        where: "교육과정은 평가 자동화까지, 할루시네이션 특화 평가는 따로 심화. LLM-as-a-judge 같은 평가 체계 설계는 Applied AI Engineer 우대 사항이고, 채널톡은 모든 상담을 AI가 읽고 평가한다(CX Score)",
        lessonSlug: "evals-hallucination",
      },
      {
        title: "평가를 자동화해 개선 사이클을 빠르게 돌리기",
        coverage: "reinforce",
        where: "Step 3 LLMOps (프롬프트 버전관리, 평가 자동화)",
      },
      {
        title: "내 서비스에 평가를 붙여 실제로 고쳐 본 사례 하나 만들기",
        coverage: "separate",
        where: "공부로 끝내지 않고 DailyAiThread 같은 내 서비스에서 재고, 고치고, 다시 잰 기록을 남긴다 (10/16 튜터링: 평가하고 고친 경험을 본다)",
      },
    ],
  },
  {
    id: "production",
    order: 6,
    title: "프로덕션과 비용 최적화",
    subtitle: "수만 건 상담을 안정적으로, 그리고 싸게",
    rationale:
      "매일 수만 건을 응대하는 규모에서는 서빙 안정성과 비용이 곧 실력입니다.",
    evidence:
      "상담과 마케팅을 아우르는 대고객 에이전트 설계, 멀티 LLM 인프라 비용 최적화.",
    evidenceSource: "Applied AI Engineer 주요 업무",
    skills: [
      {
        title: "멀티 LLM 인프라와 모델 서빙의 기본",
        coverage: "reinforce",
        where: "Step 3 LLMOps 및 Project 5 배포 (Vercel, Cloud Run)",
      },
      {
        title: "컨텍스트 비용을 줄이는 설계 패턴",
        coverage: "separate",
        where: "교육과정은 비용 지표 관측까지, 컨텍스트 비용 절감 설계는 따로 심화",
        lessonSlug: "context-cost",
      },
      {
        title: "모델을 갈아끼울 때의 벤치마킹과 의사결정",
        coverage: "separate",
        where: "모델 선택과 교체 판단은 교육과정 밖이라 따로 익힌다",
        lessonSlug: "model-selection",
      },
      {
        title: "모니터링과 장애 알림",
        coverage: "reinforce",
        where: "Step 3 LLMOps (모니터링, 알림, 보안 거버넌스)",
      },
    ],
  },
  {
    id: "mindset",
    order: 7,
    title: "실전 감각과 Forward Deployed 태도",
    subtitle: "0에서 1을 직접 만들어 본 사람",
    rationale:
      "결국 채널톡이 보는 것은 태도입니다. 작더라도 내 손으로 끝까지 만들어 본 경험이 가장 강한 이력입니다.",
    evidence:
      "AI를 활용해 비즈니스 문제를 해결해본 경험을 서술해주세요.",
    evidenceSource: "Forward Deployed Engineer 지원서 필수 항목 (2026-10 확인)",
    skills: [
      {
        title: "모호한 문제를 AI 문제로 바꾸고 빠르게 가설 검증하기",
        coverage: "reinforce",
        where: "Step 3 Project 4, 5 (실무형 AX) 및 Step 4 기업 연계 프로젝트",
      },
      {
        title: "작은 AI 프로젝트를 0에서 1까지 직접 출시해 시행착오 쌓기",
        coverage: "separate",
        where: "교육과정 프로젝트는 가이드형 팀 과제라, 내 손으로 여는 사이드 프로젝트는 따로",
        lessonSlug: "build-01-project",
      },
      {
        title: "내 업무와 공부를 실제로 AI로 재설계해 보기",
        coverage: "separate",
        where: "개인의 실천 영역이라 스스로 만든다",
        lessonSlug: "redesign-work-ai",
      },
      {
        title: "개발자와 비개발자를 오가며 문제를 함께 정의하는 연습",
        coverage: "reinforce",
        where: "Step 2, 3 팀 프로젝트와 Step 4 기업 발표",
      },
      {
        title: "운영 이야기를 숫자로 말하기 (무엇을, 왜, 얼마나 개선했나)",
        coverage: "separate",
        where: "\"운영 중\"에서 멈추지 않게 DailyAiThread의 개선 기록을 꾸준히 모은다 (10/16 튜터링: 신입 면접에서 운영을 어디까지 해 봤는지 본다)",
      },
      {
        title: "포트폴리오 원칙: 내 담당 파트 명시, 필수 요건 중심, 이전 경험은 도메인으로",
        coverage: "separate",
        where: "영업과 구축 4년은 고객 문제를 아는 무기로 말한다. 자격증보다 무엇을 왜 만들어 무엇을 해결했는지를 본다 (10/16 튜터링)",
      },
    ],
  },
] as const;

export type HiringStep = {
  /** 공고에 적힌 단계 이름 */
  title: string;
  /** 이 단계에서 무엇을 하는지(공고의 설명을 우리 말로 옮김) */
  focus: string;
  /** 이 로드맵에서 준비하는 곳: roadmapStages의 id, "talent"(채널톡이 찾는 사람), "doc-strategy"(비전공자 서류 대비 전략) */
  prep: readonly string[];
};

/**
 * 채용 절차 — Applied AI Engineer 공고 기준(2026-10-23 채널톡 채용 페이지에서 확인).
 * focus는 공고의 단계 설명을 옮긴 것이고, prep은 "우리 로드맵의 어느 단계로 준비하나"라는
 * 우리 매핑이다. 직군마다 절차가 다르다(Software Engineer는 1차가 라이브 코딩, FDE는 과제 전형 추가).
 */
export const hiringProcess: readonly HiringStep[] = [
  {
    title: "서류 제출",
    focus: "팀에 필요한 기본적인 문제 해결 역량을 봐요. 지금까지 한 프로젝트와 도전 과제, 그리고 그걸 어떻게 풀었는지 구체적으로 쓰면 도움이 된다고 해요.",
    prep: ["doc-strategy", "mindset"],
  },
  {
    title: "사전 기술 인터뷰 (온라인)",
    focus: "ML과 AI 기술 중심의 질문과 답변으로 30분 동안 진행해요.",
    prep: ["llm-core", "rag", "evals"],
  },
  {
    title: "1차 인터뷰",
    focus: "1시간. 라이브로 주어진 상황에서 AI를 활용한 해결 방안을 찾는 문제를 풀어요. 결과보다 접근 방식과 사고 과정, 창의적인 아이디어를 봐요.",
    prep: ["foundations", "agents", "mindset"],
  },
  {
    title: "2차 인터뷰",
    focus: "1시간 30분. 내가 한 프로젝트를 설명하고 질문에 답해요. 배경, 기술적 선택의 이유, 문제를 풀어 간 과정을 봐요.",
    prep: ["mindset", "evals", "production"],
  },
  {
    title: "3차 인터뷰 (컬처핏)",
    focus: "채널과 잘 맞는지 알기 위해 편하게 서로 질문을 주고받아요.",
    prep: ["talent"],
  },
  {
    title: "최종 합격",
    focus: "모든 인터뷰를 마치면 합격 소식을 받아요. 이번 공고의 채용 규모는 신입부터 경력까지 총 2명이에요.",
    prep: [],
  },
] as const;

export type RequirementEvidence = {
  /** 공고의 필수 자격 한 줄(원문을 줄여 옮김) */
  requirement: string;
  /** 지금 이미 가진 증거 */
  have: readonly string[];
  /** 지원 전까지 만들 증거 */
  make: readonly string[];
  /** 이 로드맵에서 준비하는 곳(roadmapStages의 id) */
  prep: readonly string[];
};

export type DocPrinciple = { title: string; body: string };

/**
 * 비전공자 서류 대비 전략(2026-10-23). Applied AI Engineer 필수 자격에 "관련 전공 학사 이상"이
 * 있어, 학위 줄 하나를 나머지 증거로 덮는 전략을 필수 자격 단위로 정리했다. 근거는 공고의 서류
 * 설명(프로젝트와 도전 과제를 어떻게 풀었는지 구체적으로)과 10/16 튜터링 조언이다. have에는
 * 사용자에 대해 확인된 사실만 쓰고, 숫자는 지어내지 않는다(모으라고만 적는다).
 */
export const docStrategyIntro =
  "필수 자격에 관련 전공 학사가 있어서, 비전공이면 이 줄 하나로 서류에서 걸러질 수 있어요. 그래서 나머지 필수 자격을 하나도 빈칸 없이 증거로 채우고, 전공 줄은 대체 증거로 받쳐야 해요. 공고도 서류에서 \"지금까지 한 프로젝트와 도전 과제를 어떻게 풀었는지\"를 구체적으로 보겠다고 했어요.";

export const requirementEvidence: readonly RequirementEvidence[] = [
  {
    requirement: "모호한 비즈니스 문제를 AI/ML 문제로 바꾸고, 빠른 가설 검증을 반복하며 풀어 본 경험",
    have: [
      "직접 기획해 배포하고 운영 중인 서비스(DailyAiThread)",
      "B2B 솔루션 영업과 구축 4년: 고객사 문제를 듣고 구현으로 옮긴 경험",
    ],
    make: [
      "서비스에서 가설 하나를 세우고, 바꾸고, 숫자로 확인한 기록 2~3건",
      "교육과정 AX 프로젝트에서 문제 정의를 내가 맡은 기록",
    ],
    prep: ["mindset", "foundations"],
  },
  {
    requirement: "대규모 언어 모델의 동작 원리에 대한 높은 이해와 활용 능력",
    have: [
      "LLM API를 쓰는 서비스를 직접 운영한 경험",
      "토큰, 임베딩, 어텐션을 내 말로 정리한 학습 기록",
    ],
    make: ["모델 여러 개를 같은 일에 돌려 비교하고, 왜 이 모델인지 설명한 글 하나"],
    prep: ["llm-core"],
  },
  {
    requirement: "RAG, 벡터 검색 같은 정보 검색 시스템을 설계하거나 고도화한 경험",
    have: ["베이스캠프 STEP 3 Q&A 챗봇(검색해서 근거로 답하는 작은 RAG)"],
    make: ["원천 데이터 정리부터 검색 품질 평가까지 한 RAG 프로젝트, 고도화 전후 숫자 포함"],
    prep: ["rag", "evals"],
  },
  {
    requirement: "Python 프로그래밍 능력",
    have: ["베이스캠프 STEP 1~5 과제(엑셀 자동화, Pandas 번역까지)"],
    make: ["테스트까지 갖춘 Python 프로젝트 저장소 하나"],
    prep: ["python-eng"],
  },
  {
    requirement: "ML 개발 라이브러리 활용 능력 (PyTorch, Hugging Face, wandb)",
    have: [],
    make: ["Hugging Face 오픈 모델로 작은 분류나 요약 실험을 돌리고, 실험 기록을 wandb에 남기기"],
    prep: ["llm-core"],
  },
  {
    requirement: "컴퓨터공학, 전자공학, 수학, 통계학 등 관련 전공 학사 이상",
    have: ["AI Engineer 교육과정(프로젝트와 기업 연계 프로젝트 포함) 진행 중"],
    make: [
      "CS 기초(자료구조, 네트워크, DB)를 내 말로 설명한 학습 기록 묶음",
      "장기 옵션으로 방송통신대 컴퓨터과학과나 학점은행제 같은 학위 보완 경로를 알아 두기",
    ],
    prep: ["foundations"],
  },
];

export const docPrinciples: readonly DocPrinciple[] = [
  {
    title: "프로젝트마다 문제, 내 역할, 선택의 이유, 결과 숫자",
    body: "공고는 서류에서 프로젝트와 도전 과제를 어떻게 풀었는지 구체적으로 보겠다고 했고, 2차 인터뷰도 배경, 기술 선택의 이유, 문제를 풀어 간 과정을 물어요. 서류가 곧 2차 인터뷰의 대본이에요.",
  },
  {
    title: "필수 요건을 먼저 다 채우고, 우대는 그다음",
    body: "필수 요건 중 빈칸이 하나라도 있으면 그게 먼저예요. 우대 사항은 에이전트 운영, 평가 체계(LLM-as-a-judge), 비용 최적화처럼 지금 서비스로 손이 닿는 두세 개만 골라 깊게 보여 줘요(10/16 튜터링).",
  },
  {
    title: "영업과 구축 4년은 약점이 아니라 도메인",
    body: "채널톡은 2,000개가 넘는 고객사를 둔 B2B 회사예요. 고객사 문제를 직접 듣고 구축까지 해 본 경험은 \"개발 경력이 빈 기간\"이 아니라 \"고객 문제를 아는 엔지니어\"의 근거로 써요.",
  },
  {
    title: "데모가 아니라 운영 기록과 글로 증명",
    body: "만들어 본 것보다 운영해 본 것이 강해요. 사용자 수, 실패를 잡은 사례, 비용처럼 운영하며 모은 숫자와, 그 과정을 정리한 기술 글을 함께 내요. 채널톡이 말하는 Share Out과도 맞닿아요.",
  },
  {
    title: "학위 칸 대신 대체 증거가 먼저 보이게",
    body: "학위 줄은 지울 수 없으니 이력서 앞쪽에 대체 증거를 먼저 놓아요. 교육과정 수료, 대표 프로젝트, 운영 숫자, CS 기초 학습 기록이 첫 화면에서 보이게 해요.",
  },
];

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
    href: "https://channel.io/kr/careers/905bc3bd-d788-4d17-b463-ae23b6a910b2",
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
  {
    label: "Software Engineer 공고 (AI와 함께 일하는 방식)",
    href: "https://channel.io/kr/careers/fbe11a2f-63e3-4cae-b2e5-68f94886cb06",
  },
  {
    label: "엔지니어링 코어 밸류: Move Fast, Deep Dive, Share Out",
    href: "https://tech.channel.io/kr/articles/channel-eng-core-value-v2-e190d6d0",
  },
  {
    label: "상담 분석을 자체 모델로 바꾼 이야기 (비용 99.4% 절감)",
    href: "https://tech.channel.io/kr/articles/small-model-beats-llm-f70a8f22",
  },
] as const;
