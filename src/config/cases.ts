/**
 * 상담 방식 / 사례.
 *
 * 결과 숫자를 자랑하는 곳이 아니라 '어떻게 생각하고 상담하는지'를 보여주는 곳이다.
 *
 * - 지금은 이해를 돕기 위한 SAMPLE(예시) 데이터다. sample: true 인 사례에는 '예시' 표시가 붙는다.
 * - 실제 사례로 바꿀 때: 본인 동의를 받고, 이름·직장·지역·금액 등 알아볼 수 있는 정보를 빼고,
 *   sample 을 false 로 바꾼다. 수익률·절감액 같은 성과 숫자는 쓰지 않는다(금융광고 규제).
 */

export type ConsultCase = {
  id: string;
  /** 탭에 보이는 짧은 이름 */
  tab: string;
  /** 누구의 이야기인지 — 알아볼 수 없을 정도로만 */
  who: string;
  /** 처음 들은 질문 (고객의 말 그대로) */
  question: string;
  /** 먼저 본 것 */
  looked: string;
  /** 정리한 방향 */
  direction: { keep: string; check: string; next: string };
  sample: boolean;
};

export const consultCases: ConsultCase[] = [
  {
    id: "insurance",
    tab: "보험료 고민",
    who: "30대 후반 · 외벌이 · 아이 둘",
    question: "보험료가 너무 많이 나가는 것 같아요.",
    looked: "보험만 보지 않고 월 지출, 기존 대출 상환액, 비상자금까지 함께 확인했습니다.",
    direction: {
      keep: "실손과 큰 병에 대비한 핵심 보장",
      check: "겹치는 특약, 대출 상환액과 보험료를 합친 월 고정지출",
      next: "생활비 3개월치 비상자금부터 따로 모으기",
    },
    sample: true,
  },
  {
    id: "loan",
    tab: "대출 고민",
    who: "40대 초반 · 맞벌이 · 이사 예정",
    question: "대출을 하나 더 받아야 할 것 같아요.",
    looked: "새 대출보다 먼저 지금 대출들의 금리, 만기, 월 상환 부담과 돈이 필요한 시기를 확인했습니다.",
    direction: {
      keep: "금리가 낮은 기존 대출",
      check: "만기가 가까운 대출의 조건과 다른 선택지",
      next: "상환 일정에 맞춘 지출 계획",
    },
    sample: true,
  },
  {
    id: "retirement",
    tab: "노후 준비",
    who: "50대 초반 · 직장인",
    question: "퇴직연금을 어떻게 해야 할지 모르겠어요.",
    looked: "퇴직연금 유형(DB·DC), 국민연금과 개인연금 예상액, 은퇴 후 한 달 생활비를 함께 확인했습니다.",
    direction: {
      keep: "꾸준히 넣고 있던 개인연금",
      check: "DC 계좌 안에 무엇이 담겨 있는지",
      next: "은퇴 시점부터 연도별 현금흐름 정리",
    },
    sample: true,
  },
];
