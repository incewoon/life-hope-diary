/**
 * LH 업무수첩 고정 콘텐츠 (관리자 갱신 지점)
 * ------------------------------------------------------------------
 * 경영전략 체계도 / 8대 경영목표 / 부패방지 방침 / 지역본부 정보 등
 * 앱 내에서 편집하지 않는 모든 고정 텍스트는 이 파일에만 존재합니다.
 * 매년 내용이 바뀌면 이 파일만 수정한 뒤 앱을 재배포하세요.
 */

export const BRAND = {
  slogan: "Life with Hope",
  orgKo: "한국토지주택공사",
  orgEn: "KOREA LAND & HOUSING CORPORATION",
  bookTitle: "work plan",
  mainTel: "1600-1004",
} as const;

export interface StrategyValue {
  ko: string;
  en: string;
}

export interface StrategyGoal {
  title: string;
  tasks: string[];
}

export const STRATEGY = {
  mission:
    "국민주거안정의 실현과 국토의 효율적 이용으로 삶의 질 향상과 국민경제 발전 선도",
  vision: "살고 싶은 집과 도시로 국민의 희망을 가꾸는 기업",
  slogan: "희망을 위한 LH의 약속, Life with Hope",
  values: [
    { ko: "국민중심", en: "Together" },
    { ko: "미래혁신", en: "Revolution" },
    { ko: "소통화합", en: "Unification" },
    { ko: "안전품질", en: "Safety & Quality" },
    { ko: "청렴공정", en: "Transparency" },
  ] as StrategyValue[],
  goals: [
    {
      title: "국민주거 생활 향상",
      tasks: [
        "국민주거 안정을 위한 주택공급 확대",
        "저출생·고령화 등 대응을 위한 맞춤형 주거지원 강화",
        "국민 삶의 질을 높이는 주거복지 구현",
      ],
    },
    {
      title: "효율과 균형의 국토·도시 조성",
      tasks: [
        "지역 성장거점 조성으로 국토경쟁력 향상",
        "도시·주택 재정비 등 도시관리 기능 강화",
        "편리하고 쾌적한 친환경 도시 조성",
      ],
    },
    {
      title: "건설산업 미래변화 선도",
      tasks: [
        "국민이 체감하는 고품질 주택건설 기술 선도",
        "품질과 안전 중심의 건설관리 강화",
        "공정한 건설환경 조성 및 민간성장 지원",
      ],
    },
    {
      title: "지속가능경영 기반 확립",
      tasks: [
        "국민중심 경영체계 및 소통강화로 기관신뢰회복",
        "디지털 기반 대국민서비스 질 제고",
        "조직역량 제고 및 재무개선으로 경영효율성 강화",
      ],
    },
  ] as StrategyGoal[],
} as const;

export interface ManagementGoal {
  label: string;
  value: string;
  details: string[];
}

export const MANAGEMENT_INTRO =
  "LH는 정책목표와 일치된 중기 경영목표를 수립하고, 이를 단계별로 추진하고 있습니다. 국민의 주거안정과 국토 및 도시공간의 효율화, 미래 기술·환경 변화에 선제적으로 대응함과 동시에 지속가능경영을 추구하고 있습니다.";

export const MANAGEMENT_GOALS: ManagementGoal[] = [
  {
    label: "주택공급",
    value: "100만호",
    details: ["공공주택 승인(누적 100만)", "주택착공 호수(연평균 5만)"],
  },
  {
    label: "도시조성",
    value: "250km²",
    details: [
      "도시개발 면적(누적 250km²)",
      "도시정비 사업(누적 200곳)",
      "도시관리·운영 기능 고도화",
    ],
  },
  {
    label: "품질목표",
    value: "100% 달성",
    details: ["층간소음 설계등급(1등급)", "장수명 주택 인증(양호 100%)"],
  },
  {
    label: "부채비율",
    value: "232% 이하",
    details: ["부채비율 232% 이하 관리"],
  },
  {
    label: "주거복지",
    value: "200만호",
    details: [
      "주거복지 관리호수(200만)",
      "주거서비스 품질평가(S등급)",
      "주택 수선·유지 서비스 확장",
    ],
  },
  {
    label: "산업거점",
    value: "50km²",
    details: ["국가첨단산업단지 등", "산업단지 착공 50km²"],
  },
  {
    label: "중대재해",
    value: "ZERO",
    details: [
      "산업재해 사망자 수(0명)",
      "안전관리등급(1등급)",
      "건설현장 불법행위 근절",
    ],
  },
  {
    label: "고객만족",
    value: "BEST",
    details: ["고객만족도 우수등급", "청렴도 1등급"],
  },
];

export const COMPLIANCE_INTRO =
  "국민주거안정의 실현과 국토의 효율적 이용으로 삶의 질 향상과 국민경제 발전을 선도하는 미션과 살고 싶은 집과 도시로 국민의 희망을 가꾸는 기업이라는 비전을 달성하기 위해 높은 청렴·윤리 의식을 가지고 청렴윤리경영을 실행하는 한국토지주택공사, LH는 아래와 같이 부패방지 및 규범준수 방침을 정하고 이를 실천합니다.";

export const COMPLIANCE_ITEMS: string[] = [
  "LH는 임직원의 부패행위에 대하여 무관용의 원칙을 적용하며, 금품·향응·편의 등 부정청탁, 뇌물수수, 공금횡령, 이해충돌 등을 포함한 모든 부패행위를 금지한다.",
  "LH와 임직원은 국내외의 부패방지 관련 법령을 포함하여 적용 가능한 모든 규범준수 의무사항과 내부 규정 등을 준수하고, 이에 위반되거나 위반되는 것으로 의심받는 행위에 관여하지 않는다.",
  "LH의 임직원은 부패를 포함한 규범 위반이나 윤리 위반행위를 인지할 경우 즉시 청렴윤리경영 책임자에게 알릴 의무가 있다.",
  "LH는 신고 접수되거나 파악된 모든 위반행위를 관련 법령이나 내부 규정을 준수하여 처리하고 제보자에게 어떠한 불이익이 없도록 철저히 보호한다.",
  "LH는 청렴윤리경영의 목표를 달성하기 위해서 부패방지 및 규범준수 경영시스템을 포함한 청렴윤리경영 체계를 구축·운영하고 지속적으로 개선한다.",
  "LH는 청렴윤리경영 책임자에게 청렴윤리경영에 필요한 권한을 부여하고 독립성을 보장한다.",
  "LH는 임직원이 본 방침을 위반하는 경우, 관련 법령과 내부 규정에 따라 적절한 조치를 한다.",
];

export interface LinkItem {
  group: string;
  items: { name: string; note: string }[];
}

/** 오프라인 앱이므로 실제 링크는 연결하지 않고 안내만 표시합니다. */
export const LINK_GROUPS: LinkItem[] = [
  {
    group: "한국토지주택공사의 다양한 소식",
    items: [
      { name: "LH 공식 홈페이지", note: "www.lh.or.kr" },
      { name: "LH 블로그", note: "blog.naver.com/bloglh" },
      { name: "LH 유튜브", note: "youtube.com/@LHkorea" },
      { name: "LH 인스타그램", note: "@lh_love_house" },
    ],
  },
  {
    group: "토지·주택 분양 및 주거복지 정보",
    items: [
      { name: "LH청약플러스", note: "apply.lh.or.kr" },
      { name: "LH 온통청약", note: "모바일 앱" },
      { name: "마이홈 포털", note: "www.myhome.go.kr" },
      { name: "토지청약시스템", note: "분양·임대 공고" },
    ],
  },
  {
    group: "업무 수행에 필요한 정보",
    items: [
      { name: "국가법령정보센터", note: "law.go.kr" },
      { name: "나라장터", note: "g2b.go.kr" },
      { name: "온나라 문서", note: "행정업무 시스템" },
      { name: "LH 인트라넷", note: "사내망 전용" },
    ],
  },
];

export interface RegionalOffice {
  name: string;
  address: string;
}

export const REGIONAL_OFFICES: RegionalOffice[] = [
  { name: "서울지역본부", address: "서울시 강남구 선릉로 121길 12" },
  { name: "인천지역본부", address: "인천시 남동구 논현로 46번길 23" },
  { name: "경기남부지역본부", address: "경기도 성남시 분당구 성남대로54번길 3" },
  { name: "경기북부지역본부", address: "경기도 고양시 일산동구 중앙로 1206" },
  { name: "강원지역본부", address: "강원도 춘천시 중앙로 74" },
  { name: "세종지역본부", address: "세종시 가름로 238-3" },
  { name: "대전충남지역본부", address: "대전시 서구 청사로 189" },
  { name: "충북지역본부", address: "충청북도 청주시 흥덕구 풍산로 50" },
  { name: "전북지역본부", address: "전라북도 전주시 완산구 홍산로 158" },
  { name: "광주전남지역본부", address: "광주시 서구 상무중앙로 84" },
  { name: "대구경북지역본부", address: "대구시 동구 첨단로 53" },
  { name: "부산울산지역본부", address: "부산시 부산진구 신천대로 156" },
  { name: "경남지역본부", address: "경상남도 창원시 의창구 원이대로 450" },
  { name: "제주지역본부", address: "제주시 연북로 33" },
];
