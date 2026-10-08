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
  text: "나 아는 분인데 금융 쪽 오래 일한 분이야.\n보험이나 대출, 연금, 퇴직연금, 투자 같은 거 뭐부터 봐야 할지 정리해주는 페이지인데 한번 봐봐 :)\n상품부터 권하는 스타일은 아니더라.",
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
  /*
   * ⚠️ 모집인·상담사·투자권유 관련 법적·회사별 표시 의무는 공개 전 최종 컴플라이언스 검토가 필요하다.
   */
  pageNotice: [
    "본 페이지는 개인의 금융상황을 간단히 정리해보기 위한 안내 페이지입니다.",
    "1분 금융점검 결과는 개별 금융상품의 추천, 투자·보험 적합성 판단, 수익 또는 보험금 지급을 보장하지 않습니다.",
    "개별 금융상품의 계약 및 거래는 해당 금융회사의 설명서, 약관, 필수 고지사항 등을 확인한 뒤 본인이 결정하시기 바랍니다.",
  ],
  resultNotice:
    "이 결과는 개인의 금융상황을 간단히 돌아보기 위한 참고용 안내이며, 개별 금융상품 추천이나 투자·보험 적합성 판단을 의미하지 않습니다.",
};

/**
 * 황진 실제 사진 3장 + (선택) 영상 1개. 스톡 사진은 쓰지 않는다.
 *
 * 사용법: public/images/ 에 원본 사진(jpg·png, 가로 1600px 이상 권장)을 넣고 src 에 경로를 적는다.
 *   예) src: "/images/hwangjin-01.jpg"
 *   Next/Image 가 기기 크기에 맞춰 AVIF/WebP 로 자동 변환·축소한다(next.config.ts images).
 * focus: 사진을 자를 때 남길 위치(CSS object-position). 얼굴이 위쪽에 있으면 "50% 25%" 처럼 둔다.
 * src 가 비어 있으면: 배포 화면에서는 사진 자리를 그리지 않거나 대체 그래픽을 보여주고,
 *   개발 화면(npm run dev)이나 NEXT_PUBLIC_SHOW_PHOTO_SLOTS=1 일 때는 '사진 자리' 표시가 나온다.
 */
export const photos = {
  /** PHOTO 01 — HERO: 자연스러운 캐주얼 업무사진 (네이비 셔츠·재킷, 정장 팔짱·정면 광고컷 금지) */
  hero: {
    src: "",
    alt: "책상에서 자료를 보며 일하는 황진",
    focus: "50% 30%",
    guide: "자연스러운 캐주얼 업무사진 · 네이비 셔츠/재킷",
  },
  /** PHOTO 02 — 왜 황진인가: 신뢰감 있는 캐주얼 프로필 또는 업무 중 반신 */
  about: {
    src: "",
    alt: "황진 프로필 사진",
    focus: "50% 25%",
    guide: "신뢰감 있는 캐주얼 프로필 · 반신",
  },
  /** PHOTO 03 — 상담 방식: 자료 보기·노트북·메모·이동하는 모습 */
  work: {
    src: "",
    alt: "노트에 메모하며 상담을 준비하는 황진",
    focus: "50% 45%",
    guide: "자료를 보거나 메모하는 모습 · 노트북 앞 · 걷는 모습",
  },
} as const;

/**
 * (선택) 8~12초 B-roll 영상 1개 — '상품보다 상황을 먼저 봅니다' 섹션에 들어간다.
 * src(mp4, H.264, 720p, 2~4MB 이하 권장)와 poster(첫 장면 jpg) 둘 다 있어야 표시된다.
 * 소리 없이, 화면에 보일 때만 재생하고, '움직임 줄이기' 설정 사용자에게는 자동재생하지 않는다.
 */
export const brollVideo = {
  src: "",
  poster: "",
  caption: ["금융 현장 13년.", "상품보다 상황을 먼저 봅니다."],
};

export const showPhotoSlots =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_PHOTO_SLOTS === "1";
