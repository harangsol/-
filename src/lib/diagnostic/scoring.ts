/**
 * 1분 개인금융 점검 — 점수 계산 로직.
 *
 * 이 파일은 의존성이 없는 순수 함수만 담는다. (tests/scoring.test.mjs 에서 직접 실행)
 * 결과 타입 경계나 보정 규칙을 바꾸려면 아래 상수와 classify() 만 수정하면 된다.
 */

export type ScoredQuestionId = "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7";
export type Score = 0 | 1 | 2;
export type Scores = Record<ScoredQuestionId, Score>;
export type ResultType = "A" | "B" | "C" | "D";

export const SCORED_IDS: ScoredQuestionId[] = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"];
export const MAX_SCORE = SCORED_IDS.length * 2;

/** 총점 → 기본 타입. 위에서부터 순서대로 비교한다. */
export const TYPE_THRESHOLDS: { min: number; type: ResultType }[] = [
  { min: 11, type: "A" },
  { min: 8, type: "B" },
  { min: 4, type: "C" },
  { min: 0, type: "D" },
];

const ORDER: ResultType[] = ["A", "B", "C", "D"];

/** 둘 중 '먼저 정리가 필요한 쪽'(뒤 순서)을 고른다. */
function atLeast(current: ResultType, floor: ResultType): ResultType {
  return ORDER.indexOf(current) >= ORDER.indexOf(floor) ? current : floor;
}

export function totalScore(scores: Scores) {
  return SCORED_IDS.reduce((sum, id) => sum + scores[id], 0);
}

export function baseType(total: number): ResultType {
  return TYPE_THRESHOLDS.find((t) => total >= t.min)!.type;
}

export function classify(scores: Scores): { total: number; type: ResultType } {
  const total = totalScore(scores);
  let type = baseType(total);

  // 보정 1. 현금흐름(Q1) 또는 비상자금(Q2) 중 하나라도 0점이면 A가 될 수 없다.
  if (scores.q1 === 0 || scores.q2 === 0) type = atLeast(type, "B");

  // 보정 2. Q1과 Q2가 모두 0점이면 최소 C.
  if (scores.q1 === 0 && scores.q2 === 0) type = atLeast(type, "C");

  // 보정 3. Q1·Q2·Q3 중 2개 이상이 0점이면 D.
  const basicsZero = [scores.q1, scores.q2, scores.q3].filter((s) => s === 0).length;
  if (basicsZero >= 2) type = atLeast(type, "D");

  return { total, type };
}

export type PriorityTag = "cashflow" | "insurance" | "pension" | "investment" | "lifeplan";

/** 결과 화면의 '지금 먼저 확인해볼 영역' 칩. 배열 순서대로 표시된다. */
export function priorityTags(scores: Scores): PriorityTag[] {
  const tags: PriorityTag[] = [];
  if (scores.q1 < 2 || scores.q2 < 2) tags.push("cashflow");
  if (scores.q3 < 2) tags.push("insurance");
  if (scores.q4 < 2 || scores.q5 < 2) tags.push("pension");
  if (scores.q6 < 2) tags.push("investment");
  if (scores.q7 < 2) tags.push("lifeplan");
  return tags;
}
