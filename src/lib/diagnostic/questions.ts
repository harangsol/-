import type { PriorityTag, QuestionId, ResultType, Score } from "./scoring";

/**
 * 1분 점검 질문 정의.
 * 문구를 바꾸려면 여기서 수정한다. 점수(score)와 answer_bucket 은 분석 이벤트에 그대로 쓰인다.
 * 화면의 질문 순서는 이 배열 순서다. (id 는 분석·점수 규칙용이라 순서와 무관하게 유지한다)
 */

export type AnswerBucket = "yes" | "partial" | "no" | "none";

export type ScoredQuestion = {
  id: QuestionId;
  title: string;
  hint?: string;
  options: { label: string; bucket: AnswerBucket; score: Score }[];
};

export type InterestArea =
  | "loan"
  | "insurance"
  | "pension"
  | "retirement_pension"
  | "investment"
  | "overall"
  | "unsure";

export const scoredQuestions: ScoredQuestion[] = [
  {
    id: "q1",
    title: "현재 월 소득과 지출을\n대략적으로라도 알고 있나요?",
    options: [
      { label: "네, 대부분 알고 있다", bucket: "yes", score: 2 },
      { label: "대충 알고 있다", bucket: "partial", score: 1 },
      { label: "잘 모르겠다", bucket: "no", score: 0 },
    ],
  },
  {
    id: "q2",
    title: "갑자기 소득이 끊겨도 쓸 수 있는\n비상자금이 있나요?",
    hint: "생활비 3~6개월 정도를 기준으로 생각해 보세요.",
    options: [
      { label: "충분히 있다", bucket: "yes", score: 2 },
      { label: "조금 있다", bucket: "partial", score: 1 },
      { label: "거의 없다", bucket: "no", score: 0 },
    ],
  },
  {
    id: "debt",
    title: "현재 가지고 있는 대출의\n금리 · 월 상환액 · 만기를 알고 있나요?",
    hint: "주택담보대출, 신용대출, 카드론 등을 모두 떠올려 보세요.",
    options: [
      { label: "대부분 알고 있다", bucket: "yes", score: 2 },
      { label: "대략 알고 있다", bucket: "partial", score: 1 },
      { label: "잘 모르겠다", bucket: "no", score: 0 },
      { label: "지금은 대출이 없다", bucket: "none", score: 2 },
    ],
  },
  {
    id: "q3",
    title: "지금 가입한 보험이\n왜 필요한지 설명할 수 있나요?",
    options: [
      { label: "대부분 설명할 수 있다", bucket: "yes", score: 2 },
      { label: "일부만 알고 있다", bucket: "partial", score: 1 },
      { label: "잘 모르겠다", bucket: "no", score: 0 },
    ],
  },
  {
    id: "q4",
    title: "은퇴 후 필요한 월 생활비를\n계산해본 적이 있나요?",
    options: [
      { label: "계산해봤다", bucket: "yes", score: 2 },
      { label: "대략 생각만 해봤다", bucket: "partial", score: 1 },
      { label: "해본 적 없다", bucket: "no", score: 0 },
    ],
  },
  {
    id: "q5",
    title: "국민연금, 퇴직연금, 개인연금에서\n나중에 얼마를 받을지 알고 있나요?",
    options: [
      { label: "대부분 알고 있다", bucket: "yes", score: 2 },
      { label: "일부만 알고 있다", bucket: "partial", score: 1 },
      { label: "잘 모른다", bucket: "no", score: 0 },
    ],
  },
  {
    id: "q6",
    title: "지금 투자하는 돈의\n목적과 기간이 정해져 있나요?",
    hint: "투자를 하고 있지 않다면 ‘정해져 있지 않다’를 골라주세요.",
    options: [
      { label: "명확하다", bucket: "yes", score: 2 },
      { label: "조금 애매하다", bucket: "partial", score: 1 },
      { label: "정해져 있지 않다", bucket: "no", score: 0 },
    ],
  },
  {
    id: "q7",
    title: "앞으로 큰돈이 필요한 시기를\n예상하고 있나요?",
    hint: "주택, 자녀교육, 부모님, 은퇴 같은 일들이요.",
    options: [
      { label: "어느 정도 정리되어 있다", bucket: "yes", score: 2 },
      { label: "일부만 생각해봤다", bucket: "partial", score: 1 },
      { label: "정리해본 적 없다", bucket: "no", score: 0 },
    ],
  },
];

/** Q8 — 점수에 포함하지 않는 관심 영역 질문. */
export const interestQuestion = {
  id: "q8" as const,
  title: "지금 가장 궁금한 영역은\n무엇인가요?",
  options: [
    { label: "대출", value: "loan" },
    { label: "보험", value: "insurance" },
    { label: "연금", value: "pension" },
    { label: "퇴직연금", value: "retirement_pension" },
    { label: "투자", value: "investment" },
    { label: "전체적인 돈 관리", value: "overall" },
    { label: "무엇부터 봐야 할지 모르겠다", value: "unsure" },
  ] as { label: string; value: InterestArea }[],
};

export const TOTAL_STEPS = scoredQuestions.length + 1;

export const interestLabels: Record<InterestArea, string> = Object.fromEntries(
  interestQuestion.options.map((o) => [o.value, o.label]),
) as Record<InterestArea, string>;

export const priorityLabels: Record<PriorityTag, string> = {
  cashflow: "현금흐름 / 비상자금",
  debt: "대출 / 부채",
  insurance: "보험",
  pension: "연금 / 노후",
  retirement: "퇴직연금",
  investment: "투자 방향",
  lifeplan: "생애자금 계획",
};

export const priorityDescriptions: Record<PriorityTag, string> = {
  cashflow: "매달 들어오고 나가는 돈, 그리고 갑자기 필요한 순간을 버틸 돈.",
  debt: "금리, 월 상환 부담, 만기 — 더 받기 전에 지금 구조부터.",
  insurance: "지금 보험이 어떤 위험을 막고 있는지, 겹치거나 빈 곳은 없는지.",
  pension: "은퇴 후 필요한 생활비와 받게 될 연금 사이의 거리.",
  retirement: "회사에서 만들어준 계좌가 어떤 유형이고, 지금 무엇에 담겨 있는지.",
  investment: "이 돈은 언제, 무엇을 위해 쓸 돈인지.",
  lifeplan: "집, 아이, 부모님, 은퇴 — 큰돈이 필요한 시기의 순서.",
};

/**
 * 결과 화면 '이번 주에 해볼 간단한 행동'. 먼저 확인할 영역 순서대로 최대 3개를 보여준다.
 * 혼자서 10~20분 안에 해볼 수 있는 일만 적는다. 상품 가입·해지 같은 행동은 넣지 않는다.
 */
export const priorityActions: Record<PriorityTag, string> = {
  cashflow: "지난달 카드·계좌 내역에서 매달 나가는 고정지출만 따로 적어보기",
  debt: "가진 대출마다 금리, 월 상환액, 만기를 한 장에 적어보기",
  insurance: "‘내보험다보여’나 보험사 앱에서 가입한 보험 목록과 월 보험료 확인하기",
  pension: "‘내 곁에 국민연금’ 앱에서 예상 수령액 한 번 확인하기",
  retirement: "회사 퇴직연금이 DB형인지 DC형인지, 계좌에 무엇이 담겨 있는지 확인하기",
  investment: "투자 중인 돈마다 ‘언제, 무엇에 쓸 돈인지’ 한 줄씩 메모해보기",
  lifeplan: "앞으로 10년 안에 큰돈이 필요한 일을 연도별로 적어보기",
};

/** 먼저 확인할 영역이 없을 때 */
export const defaultAction = "1년에 한 번, 대출·보험·연금·투자가 같은 방향을 보는지 점검할 날짜를 달력에 적어두기";

export type ResultCopy = {
  title: string;
  body: string[];
};

/** 결과 타입별 문구. 결과 화면 문구는 여기서만 수정한다. */
export const resultCopy: Record<ResultType, ResultCopy> = {
  A: {
    title: "기본 구조가\n비교적 잘 잡혀 있습니다.",
    body: [
      "새로운 상품을 찾기보다 현재 보험, 연금, 투자, 현금이 같은 방향을 보고 있는지 정기적으로 확인해보는 것이 좋습니다.",
    ],
  },
  B: {
    title: "돈은 관리하고 있지만\n연결이 필요합니다.",
    body: [
      "보험은 보험대로, 투자는 투자대로, 연금은 연금대로 준비되어 있을 가능성이 있습니다.",
      "전체 그림을 한번 연결해보세요.",
    ],
  },
  C: {
    title: "먼저 기초부터\n정리할 필요가 있습니다.",
    body: [
      "새로운 상품을 알아보기 전에 현금흐름, 비상자금, 대출, 보험, 노후 준비 중 무엇이 먼저인지 정리하는 것이 도움이 될 수 있습니다.",
    ],
  },
  D: {
    title: "지금은 무엇부터 할지\n순서를 정하는 게 먼저입니다.",
    body: [
      "이것저것 하나씩 가입하거나 투자하기보다 ‘지금 · 다음 · 나중’ 순서를 한번 정해보세요.",
    ],
  },
};
