/**
 * 상담 신청 입력값 정의와 검증. 클라이언트와 서버(api/consultation)가 같은 규칙을 쓴다.
 * 주민등록번호, 계좌번호, 보험증권번호, 상세 자산금액, 카드정보는 받지 않는다.
 */

export const INTEREST_OPTIONS = [
  { value: "loan", label: "대출" },
  { value: "insurance", label: "보험" },
  { value: "pension", label: "연금" },
  { value: "retirement_pension", label: "퇴직연금" },
  { value: "investment", label: "투자" },
  { value: "overall", label: "전체적인 돈 관리" },
  { value: "unsure", label: "무엇부터 봐야 할지 모르겠다" },
] as const;

export const AGE_OPTIONS = ["20대", "30대", "40대", "50대", "60대 이상"] as const;
export const TIME_OPTIONS = ["평일 오전", "평일 오후", "평일 저녁", "주말", "언제든 괜찮아요"] as const;

export const CONCERN_MAX = 200;

const RESULT_TYPES = ["A", "B", "C", "D"] as const;
const PRIORITY_TAGS = ["cashflow", "debt", "insurance", "pension", "investment", "lifeplan"] as const;
type PriorityTagValue = (typeof PRIORITY_TAGS)[number];

export type ConsultationInput = {
  name: string;
  phone: string;
  interest: (typeof INTEREST_OPTIONS)[number]["value"] | "";
  ageRange: string;
  contactTime: string;
  concern: string;
  privacyConsent: boolean;
  marketingConsent: boolean;
  /** 본인이 '점검 결과 함께 보내기'를 선택한 경우에만 채워진다. */
  result?: {
    type: (typeof RESULT_TYPES)[number];
    interest: string;
    tags: PriorityTagValue[];
  } | null;
  attribution?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    landing_path?: string;
  };
  /** 스팸 방지용 숨김 필드. 사람이 채우지 않는다. */
  website?: string;
};

export type FieldErrors = Partial<Record<"name" | "phone" | "interest" | "concern" | "privacyConsent", string>>;

export function normalizePhone(raw: string) {
  return raw.replace(/[^0-9]/g, "");
}

export function formatPhone(raw: string) {
  const d = normalizePhone(raw).slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/** 이 사이트 안내와 연락 목적상 국내 휴대전화번호만 받는다. */
export function isValidMobile(raw: string) {
  return /^01[016789]\d{7,8}$/.test(normalizePhone(raw));
}

const NAME_RE = /^[가-힣a-zA-Z\s.·-]{2,20}$/;

export function validate(input: ConsultationInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  if (!name) errors.name = "이름을 적어주세요.";
  else if (!NAME_RE.test(name)) errors.name = "이름은 한글 또는 영문 2~20자로 적어주세요.";

  if (!input.phone.trim()) errors.phone = "연락받으실 번호를 적어주세요.";
  else if (!isValidMobile(input.phone)) errors.phone = "휴대전화번호 형식을 확인해주세요. (예: 010-1234-5678)";

  if (!INTEREST_OPTIONS.some((o) => o.value === input.interest)) errors.interest = "가장 궁금한 영역을 하나 골라주세요.";

  if (input.concern.length > CONCERN_MAX) errors.concern = `${CONCERN_MAX}자 이내로 적어주세요.`;

  if (!input.privacyConsent) errors.privacyConsent = "상담 연락을 위해 개인정보 수집·이용 동의가 필요합니다.";
  return errors;
}

/** 서버에서 받은 임의의 JSON을 안전한 형태로 정리한다. 모르는 값은 버린다. */
export function coerce(body: unknown): ConsultationInput {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const pick = <T extends string>(v: unknown, allowed: readonly T[]): T | "" =>
    typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : "";

  let result: ConsultationInput["result"] = null;
  if (b.result && typeof b.result === "object") {
    const r = b.result as Record<string, unknown>;
    const type = pick(r.type, RESULT_TYPES);
    if (type) {
      result = {
        type,
        interest: pick(r.interest, INTEREST_OPTIONS.map((o) => o.value)),
        tags: Array.isArray(r.tags)
          ? (r.tags.filter((t) => (PRIORITY_TAGS as readonly unknown[]).includes(t)) as PriorityTagValue[])
          : [],
      };
    }
  }

  const a = (b.attribution && typeof b.attribution === "object" ? b.attribution : {}) as Record<string, unknown>;

  return {
    name: str(b.name, 40),
    phone: str(b.phone, 20),
    interest: pick(b.interest, INTEREST_OPTIONS.map((o) => o.value)),
    ageRange: pick(b.ageRange, AGE_OPTIONS),
    contactTime: pick(b.contactTime, TIME_OPTIONS),
    concern: str(b.concern, CONCERN_MAX + 50),
    privacyConsent: b.privacyConsent === true,
    marketingConsent: b.marketingConsent === true,
    result,
    attribution: {
      utm_source: str(a.utm_source, 80) || undefined,
      utm_medium: str(a.utm_medium, 80) || undefined,
      utm_campaign: str(a.utm_campaign, 80) || undefined,
      landing_path: str(a.landing_path, 80) || undefined,
    },
    website: str(b.website, 200),
  };
}
