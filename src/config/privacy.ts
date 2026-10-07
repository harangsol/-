/**
 * 개인정보 처리 관련 설정.
 *
 * ⚠️ 아래 문구는 초안이다. 실제 운영 전 반드시 운영자가 법률/컴플라이언스 검토를
 * 거쳐 최종 확정해야 한다. (개인정보 보호법, 정보통신망법, 금융소비자보호법 등)
 *
 * - 보유기간은 retentionDays 하나만 바꾸면 화면 문구와 동의 안내에 함께 반영된다.
 *   DB 자동 파기 주기(supabase/migrations)도 같은 값으로 맞춘다.
 */

export const privacyConfig = {
  /** 개인정보 처리방침 버전. 문구를 바꾸면 날짜를 갱신한다. 상담 신청 시 함께 저장된다. */
  version: "2026-10-07",
  effectiveDate: "2026년 10월 7일",

  controller: {
    name: "황진",
    /** 개인정보 관련 문의처. 운영 전 실제 연락처로 교체한다. */
    contactEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || "",
    contactPhone: process.env.NEXT_PUBLIC_PHONE || "",
  },

  /** 상담 신청 정보 보유 기간(일). */
  retentionDays: 365,

  requiredItems: ["이름", "연락처(휴대전화번호)", "가장 궁금한 영역"],
  optionalItems: [
    "연령대",
    "편한 연락 시간",
    "간단한 고민(200자 이내)",
    "1분 점검 결과 요약(결과 유형, 관심 영역, 먼저 확인할 영역) — 본인이 함께 보내기를 선택한 경우",
  ],
  autoItems: ["신청 일시", "유입 경로(광고·SNS 캠페인 구분값)"],

  purposes: [
    "상담 신청에 대한 연락 및 상담 일정 조율",
    "요청하신 영역에 대한 상담 준비",
    "상담 이력 관리 및 문의 응대",
  ],
  marketingPurposes: [
    "금융 관련 정보성 콘텐츠, 세미나·이벤트 안내 발송(문자·카카오톡)",
  ],

  neverCollected: [
    "주민등록번호",
    "계좌번호",
    "보험증권번호",
    "카드정보",
    "상세 자산·부채 금액",
  ],

  destruction:
    "보유 기간이 지나거나 처리 목적이 달성되면 지체 없이 파기합니다. 전자적 파일은 복구할 수 없는 방법으로 삭제합니다.",

  thirdParty:
    "수집한 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 따라 요구되는 경우는 예외로 합니다.",

  /** 처리 위탁. 실제 사용하는 서비스에 맞게 수정한다. */
  processors: [
    { name: "Supabase Inc.", task: "상담 신청 정보 저장(데이터베이스)" },
    { name: "Vercel Inc.", task: "웹사이트 호스팅" },
  ],

  /**
   * 국외 이전. Supabase/Vercel 리전이 국외일 경우 개인정보 보호법에 따라 고지가 필요하다.
   * 실제 리전·이전 방법을 확인한 후 수정한다.
   */
  overseasTransfer:
    "상담 신청 정보는 위 수탁사의 클라우드 서버(국외 리전일 수 있음)에 암호화된 통신으로 저장됩니다. 이전 국가, 일시, 방법 등 상세 내용은 문의처로 요청하시면 안내드립니다.",

  analyticsNotice:
    "방문 통계를 위해 Google Analytics와 Meta Pixel을 사용합니다. 이름·연락처·고민 내용 등 개인을 알아볼 수 있는 정보와 구체적 금융정보는 분석 도구에 전송하지 않습니다.",

  rights:
    "언제든지 개인정보 열람·정정·삭제·처리정지 및 마케팅 수신 동의 철회를 요청할 수 있으며, 아래 문의처로 연락하시면 지체 없이 처리합니다.",
} as const;

export function retentionLabel(days: number = privacyConfig.retentionDays) {
  if (days % 365 === 0) return `${days / 365}년`;
  if (days % 30 === 0) return `${days / 30}개월`;
  return `${days}일`;
}
