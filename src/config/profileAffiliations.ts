/**
 * 황진의 업무 기반 (회사 · 등록 정보)
 *
 * ⚠️ 공개 전 운영자 최종 검수 필수
 * - 각 회사와 황진의 실제 관계(위촉·소속·등록·제휴 등)를 확인한 뒤 relationshipLabel 을 채운다.
 *   확정되지 않은 관계를 '공식 파트너', '제휴회사', '소속', '전담' 같은 말로 임의 표기하지 않는다.
 * - 보험모집인, 투자권유대행인, 대출모집인 등은 각 회사 및 관련 협회의 표시 기준(회사명, 등록번호,
 *   '○○ 소속 ○○' 형식 등)이 있으므로 그 기준에 맞춰 문구를 확정한다.
 * - [대괄호] 로 된 값은 아직 채워지지 않은 자리표시(placeholder)다.
 *   배포 화면에서는 자리표시가 남아 있는 줄은 자동으로 숨겨지고, `npm run check:launch` 로 목록을 볼 수 있다.
 * - 법적·회사별 표시 의무(모집인·상담사·투자권유 관련)는 공개 전 컴플라이언스 검토가 필요하다.
 */

export type Affiliation = {
  id: string;
  /** 업무 영역 (화면 왼쪽 작은 글씨) */
  category: string;
  /** 회사명. 회사 없이 자격만 표기할 때는 빈 문자열 */
  companyName: string;
  /** 회사와의 관계 또는 자격 (예: "위촉", "소속", "등록 대출상담사"). 확인 전에는 비워둔다 */
  relationshipLabel: string;
  /** 등록번호 라벨과 값 */
  registrationLabel?: string;
  registrationNumber?: string;
  /** 줄 아래 작은 안내 문구 (회사별 필수 고지 등) */
  disclaimer?: string;
  /** personal: 개인 금융 / business: 사업자 영역(별도 문단으로 표시) */
  audience: "personal" | "business";
};

export const profileAffiliations: Affiliation[] = [
  // 운영자 제공 정보 (2026-10). 화면에는 "회사명 + 관계" 순서로 붙여서 보인다. 예) 키움에셋플래너 소속 보험설계사
  {
    id: "kiwoom-ap",
    category: "보험 · 절세",
    companyName: "키움에셋플래너",
    relationshipLabel: "소속 보험설계사",
    disclaimer: "",
    audience: "personal",
  },
  {
    id: "kis",
    category: "증권 · 퇴직연금",
    companyName: "한국투자증권",
    relationshipLabel: "소속 투자권유대행인 · 퇴직연금모집인",
    disclaimer: "",
    audience: "personal",
  },
  {
    id: "loan",
    category: "대출",
    companyName: "C&U파트너스",
    relationshipLabel: "소속 대출상담사",
    registrationLabel: "등록번호",
    registrationNumber: "10-00054890",
    disclaimer: "",
    audience: "personal",
  },
  {
    id: "harang-partners",
    category: "사업자 정책자금",
    companyName: "하랑파트너스",
    relationshipLabel: "대표",
    disclaimer: "",
    audience: "business",
  },
];

/** "[LOAN_REGISTRATION_NUMBER]" 처럼 아직 채워지지 않은 값인지 */
export function isPlaceholder(value: string | undefined) {
  return !!value && /^\[[A-Z0-9_]+\]$/.test(value.trim());
}

/**
 * 화면에 보여줄 값. 개발 중에는 자리표시를 그대로 보여 눈에 띄게 하고,
 * 배포 빌드에서는 자리표시가 남은 값은 숨긴다(빈 문자열).
 */
export function displayValue(value: string | undefined) {
  if (!value) return "";
  if (isPlaceholder(value)) return process.env.NODE_ENV === "production" ? "" : value;
  return value;
}
