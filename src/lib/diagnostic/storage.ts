import { interestQuestion, scoredQuestions, type InterestArea } from "./questions";
import {
  classify,
  priorityTags,
  type PriorityTag,
  type ResultType,
  type Score,
  type Scores,
} from "./scoring";

/**
 * 1분 점검 상태는 서버에 저장하지 않고 이 브라우저 탭의 sessionStorage 에만 둔다.
 * 탭을 닫으면 사라진다. 상담 신청 시 본인이 선택한 경우에만 결과 요약이 함께 전송된다.
 */

const PROGRESS_KEY = "hj:check:progress:v1";
const RESULT_KEY = "hj:check:result:v1";
const ATTRIBUTION_KEY = "hj:attribution:v1";

export type Progress = {
  /** 질문 id → 선택한 보기 index */
  answers: Partial<Record<ScoredQuestionKey, number>>;
  step: number;
  startedAt: number;
};
type ScoredQuestionKey = (typeof scoredQuestions)[number]["id"] | "q8";

export type StoredResult = {
  type: ResultType;
  total: number;
  scores: Scores;
  tags: PriorityTag[];
  interest: InterestArea;
  completedAt: number;
};

function read<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function write(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 시크릿 모드 등에서 저장이 막혀도 점검은 계속 진행된다.
  }
  notify();
}

function remove(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {}
  notify();
}

export const loadProgress = () => read<Progress>(PROGRESS_KEY);
export const saveProgress = (p: Progress) => write(PROGRESS_KEY, p);
export const clearProgress = () => remove(PROGRESS_KEY);

export function loadResult(): StoredResult | null {
  const r = read<StoredResult>(RESULT_KEY);
  if (!r || !["A", "B", "C", "D"].includes(r.type)) return null;
  return r;
}
export const clearResult = () => remove(RESULT_KEY);

/* ---------- React 구독용 (useSyncExternalStore) ---------- */

export function subscribeStorage(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let cachedRaw: string | null | undefined;
let cachedResult: StoredResult | null = null;

/** 같은 값이면 같은 객체를 돌려줘야 하므로 원문 문자열 기준으로 캐시한다. */
export function getResultSnapshot(): StoredResult | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(RESULT_KEY);
  } catch {}
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedResult = loadResult();
  }
  return cachedResult;
}

/** 모든 답이 채워졌을 때 결과를 계산·저장해 반환한다. */
export function finalize(answers: Progress["answers"]): StoredResult | null {
  const scores = {} as Scores;
  for (const q of scoredQuestions) {
    const idx = answers[q.id];
    if (idx === undefined || !q.options[idx]) return null;
    scores[q.id] = q.options[idx].score as Score;
  }
  const interestIdx = answers.q8;
  if (interestIdx === undefined || !interestQuestion.options[interestIdx]) return null;

  const { total, type } = classify(scores);
  const result: StoredResult = {
    type,
    total,
    scores,
    tags: priorityTags(scores, interestQuestion.options[interestIdx].value),
    interest: interestQuestion.options[interestIdx].value,
    completedAt: Date.now(),
  };
  write(RESULT_KEY, result);
  return result;
}

/* ---------- 유입 경로(UTM) — 개인정보가 아닌 캠페인 구분값만 저장 ---------- */

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_path?: string;
};

export function captureAttribution() {
  if (read<Attribution>(ATTRIBUTION_KEY)) return;
  const params = new URLSearchParams(window.location.search);
  const clean = (v: string | null) => (v ? v.slice(0, 80).replace(/[^\w\-.가-힣]/g, "") : undefined);
  write(ATTRIBUTION_KEY, {
    utm_source: clean(params.get("utm_source")),
    utm_medium: clean(params.get("utm_medium")),
    utm_campaign: clean(params.get("utm_campaign")),
    landing_path: window.location.pathname.slice(0, 80),
  } satisfies Attribution);
}

export const loadAttribution = () => read<Attribution>(ATTRIBUTION_KEY) ?? {};
