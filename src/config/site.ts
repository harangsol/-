/**
 * 사이트 전역 설정.
 *
 * - 도메인, 연락처, 분석 ID는 하드코딩하지 않고 환경변수(.env)로 받는다.
 * - 문구 중 운영 정책에 따라 바뀔 수 있는 것(소속 고지, 연락 안내 등)은 여기서 고친다.
 */

function trimSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export const siteUrl = trimSlash(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
);

/**
 * 황진 프로필 — 신뢰 근거로만 쓴다. 숫자를 부풀리거나 성과를 자랑하지 않는다.
 * ⚠️ 경력 연수·자격 등은 운영 전 실제 사실과 맞는지 반드시 확인한다.
 */
export const profile = {
  careerYears: 13,
  /** 실제로 다뤄온 영역 */
  areas: ["대출", "보험", "연금", "퇴직연금", "투자"],
  /**
   * 보유 자격·등록 사항. 실제 보유한 것만 적는다. 비어 있으면 화면에 표시하지 않는다.
   * 예: "AFPK", "투자권유대행인", "보험설계사(생명·손해)"
   */
  credentials: [] as string[],
};

export const site = {
  /** 화면 표기 이름. 별도 브랜드명을 만들지 않고 이름 그대로 쓴다. */
  name: "황진",
  /** 이름 옆 작은 보조 문구 (헤더·푸터) */
  areasLabel: "대출 · 보험 · 연금 · 퇴직연금 · 투자",
  person: "황진",
  /** 검색결과·탭 제목용. 화면에는 그대로 노출하지 않는다. */
  title: "황진 | 대출·보험·연금·퇴직연금·투자 금융가이드",
  description:
    `대출, 보험, 연금, 퇴직연금, 투자. 상품부터 고르기 전에 지금 내 돈에서 무엇을 먼저 봐야 할지 금융 현장 ${profile.careerYears}년의 황진과 함께 정리해보세요.`,
  tagline: "잘 벌고, 잘 쓰고, 오래 잘 살기.",
  subTagline: "돈과 사람 사이에서 깨지고 배우며 컸습니다.",
  locale: "ko_KR",
  keywords: [
    "대출 상담",
    "부채 관리",
    "보험 점검",
    "연금",
    "퇴직연금",
    "투자",
    "돈 관리",
    "자산관리",
    "노후 준비",
    "재무 점검",
  ],
} as const;

/**
 * '지인에게 이 페이지 보내기' 공유 문구.
 * 보험 권유·상품 광고처럼 들리지 않게, 친구가 보내는 말투로 쓴다.
 */
export const share = {
  title: "황진 — 돈 문제, 뭐부터 볼지 정리해주는 사람",
  text: "나 아는 분인데 금융 쪽 오래 일한 분이야.\n보험이나 대출, 연금, 투자 같은 거 뭐부터 봐야 할지 정리해주는 페이지인데 한번 해봐 :)",
  /** 공유 링크에 붙는 유입 구분값 (GA·상담 신청 데이터에서 '지인 소개'로 집계) */
  utm: "utm_source=referral&utm_medium=share&utm_campaign=friend",
};

/** 상담 채널. 값이 비어 있으면 해당 버튼은 화면에서 자동으로 숨겨진다. */
export const contact = {
  kakaoUrl: process.env.NEXT_PUBLIC_KAKAO_CONTACT_URL || "",
  phone: process.env.NEXT_PUBLIC_PHONE || "",
  /** 상담 신청 후 안내 문구. 실제 운영 방식에 맞게 수정한다. */
  responseNote: "남겨주신 편한 시간에 맞춰 황진이 직접 연락드립니다.",
};

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

export const social = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  threads: process.env.NEXT_PUBLIC_THREADS_URL || "",
};

export const analyticsIds = {
  ga4: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  metaPixel: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
};

/**
 * 금융 관련 고지.
 * 실제 운영 전 소속 회사·등록번호 등 법령(금융소비자보호법 광고 규제 등)과
 * 소속사 내부 기준이 요구하는 표기를 컴플라이언스 검토 후 채워 넣는다.
 * 빈 문자열이면 표시하지 않는다.
 */
export const compliance = {
  /** 예: "OO보험대리점 소속 · 등록번호 0000000000" */
  affiliation: process.env.NEXT_PUBLIC_AFFILIATION || "",
  pageNotice:
    "이 페이지는 개인의 금융 상황을 정리하도록 돕는 안내 페이지이며, 개별 금융상품의 권유·추천이나 수익·보장을 약속하지 않습니다.",
  resultNotice:
    "이 결과는 개인의 금융상황을 간단히 돌아보기 위한 참고용 안내이며, 개별 금융상품 추천이나 투자·보험 적합성 판단을 의미하지 않습니다.",
};

/**
 * 사진 슬롯. public/images 에 사진을 넣고 src 를 채우면 자동으로 교체된다.
 * src 가 비어 있으면 절제된 그래픽 패널이 대신 표시된다.
 * 정장·팔짱 사진은 HERO에 쓰지 않는다. 캐주얼/일하는 모습/걷는 장면 권장.
 */
export const photos = {
  hero: {
    src: "",
    alt: "노트를 펼쳐 놓고 이야기를 듣는 황진",
    width: 1200,
    height: 1500,
  },
  about: {
    src: "",
    alt: "아침 산책길을 걷는 황진",
    width: 1200,
    height: 1500,
  },
} as const;
