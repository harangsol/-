/**
 * GA4 / Meta Pixel 이벤트 전송.
 *
 * 원칙: 이름·연락처·고민 내용·구체적 금융정보 등 개인정보/민감정보는 절대 보내지 않는다.
 * 그래서 아래 ALLOWED_PARAMS 에 있는 키만, 짧은 값만 통과시킨다.
 * 새 파라미터가 필요하면 여기 화이트리스트에 추가해야 전송된다.
 */

export type AnalyticsEvent =
  | "page_view"
  | "hero_cta_click"
  | "diagnostic_start"
  | "diagnostic_question_view"
  | "diagnostic_answer"
  | "diagnostic_complete"
  | "result_view"
  | "result_cta_click"
  | "kakao_contact_click"
  | "phone_contact_click"
  | "consultation_form_view"
  | "consultation_submit"
  | "scroll_50"
  | "scroll_90"
  | "referral_share_click"
  | "referral_url_copy"
  | "referral_section_view"
  | "profile_affiliation_view"
  | "loan_section_view"
  | "contact_option_click";

const ALLOWED_PARAMS = [
  "location",
  "question_id",
  "answer_bucket",
  "score",
  "step",
  "total_steps",
  "result_type",
  "total_score",
  "interest_area",
  "priority_tags",
  "page_path",
  "page_title",
  "method",
] as const;

type ParamKey = (typeof ALLOWED_PARAMS)[number];
export type EventParams = Partial<Record<ParamKey, string | number>>;

/** Meta 표준 이벤트로도 함께 보낼 이벤트. 나머지는 trackCustom 으로 같은 이름 그대로 보낸다. */
const META_STANDARD: Partial<Record<AnalyticsEvent, string>> = {
  consultation_submit: "Lead",
  kakao_contact_click: "Contact",
  phone_contact_click: "Contact",
};

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
    fbq?: Fbq;
    dataLayer?: unknown[];
  }
}

const GA_ID = /^G-[A-Z0-9]{4,20}$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "")
  ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!
  : "";
const PIXEL_ID = /^\d{6,20}$/.test(process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "")
  ? process.env.NEXT_PUBLIC_META_PIXEL_ID!
  : "";

export const analyticsConfig = { gaId: GA_ID, pixelId: PIXEL_ID };

/**
 * 공식 스니펫과 같은 대기열(stub)을 모듈 로드 시점에 만든다.
 * 외부 스크립트가 늦게 로드돼도 그 전에 발생한 이벤트가 유실되지 않는다.
 */
function installStubs() {
  if (typeof window === "undefined") return;
  const w = window as Window & { _fbq?: unknown };

  if (GA_ID && !w.gtag) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // gtag.js 는 배열이 아닌 arguments 객체를 기대한다.
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag("js", new Date());
    w.gtag("config", GA_ID, {
      send_page_view: false, // 라우트 변경마다 직접 보낸다.
      allow_google_signals: false,
    });
  }

  if (PIXEL_ID && !w.fbq) {
    type Stub = Fbq & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; push: Stub; loaded: boolean; version: string };
    const n = function () {
      // eslint-disable-next-line prefer-rest-params
      const args = arguments;
      // fbevents.js 는 this 가 fbq 인 상태로 호출되기를 기대한다.
      // eslint-disable-next-line prefer-spread
      if (n.callMethod) n.callMethod.apply(n, Array.from(args));
      else n.queue.push(args);
    } as unknown as Stub;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    w.fbq = n;
    if (!w._fbq) w._fbq = n;
    // 자동 이벤트 수집(버튼 텍스트·폼 값 추정 등)을 끈다. 개인정보가 섞이지 않게 하기 위함.
    w.fbq("set", "autoConfig", false, PIXEL_ID);
    w.fbq("init", PIXEL_ID);
  }
}

installStubs();

export function sanitize(params: EventParams = {}): EventParams {
  const out: EventParams = {};
  for (const key of ALLOWED_PARAMS) {
    const v = params[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
    else if (typeof v === "string") out[key] = v.slice(0, 100);
  }
  return out;
}

export function track(event: AnalyticsEvent, params?: EventParams) {
  if (typeof window === "undefined") return;
  const safe = sanitize(params);

  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event, safe);
  }

  try {
    window.gtag?.("event", event, safe);
  } catch {}

  try {
    if (!window.fbq) return;
    if (event === "page_view") {
      window.fbq("track", "PageView");
      return;
    }
    const standard = META_STANDARD[event];
    if (standard) window.fbq("track", standard, safe);
    window.fbq("trackCustom", event, safe);
  } catch {}
}
