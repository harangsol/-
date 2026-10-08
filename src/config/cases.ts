/**
 * 실제 상담은 이렇게 생각합니다 — 상담 사례.
 *
 * 결과 숫자를 자랑하는 곳이 아니라 '어떻게 생각하고 상담하는지'를 보여주는 곳이다.
 *
 * - 지금은 상담 방식을 이해하기 위한 SAMPLE(예시) 데이터다. sample: true 인 사례에는 '예시' 표시가 붙는다.
 * - 실제 사례로 바꿀 때: 본인 동의를 받고, 이름·직장·지역·금액 등 알아볼 수 있는 정보를 빼고,
 *   sample 을 false 로 바꾼다. 수익률·절감액 같은 성과 숫자는 쓰지 않는다(금융광고 규제).
 * - 사례 수는 2~4개를 권장한다. 배열에 추가·삭제하면 탭이 자동으로 바뀐다.
 */

export type ConsultCase = {
  id: string;
  /** 탭 이름 */
  tab: string;
  /** 처음 들은 질문 (고객의 말 그대로) */
  question: string;
  /** 먼저 본 것 — 앞 문장(선택) + 짧은 키워드 2~4개 */
  lookedLead?: string;
  looked: string[];
  /** 정리 — 짧은 키워드 2~3개 + 한 줄 설명 */
  steps: string[];
  direction: string;
  sample: boolean;
};

export const consultCases: ConsultCase[] = [
  {
    id: "case-01",
    tab: "CASE 01",
    question: "보험료가 너무 많이 나가는 것 같아요.",
    lookedLead: "보험만 보지 않고",
    looked: ["월 지출", "대출 상환", "비상자금"],
    steps: ["유지할 것", "확인할 것", "다음에 준비할 것"],
    direction: "세 가지로 나눠 순서를 정했습니다.",
    sample: true,
  },
  {
    id: "case-02",
    tab: "CASE 02",
    question: "투자를 시작하고 싶어요.",
    lookedLead: "투자 상품보다 먼저",
    looked: ["보유 현금", "대출", "큰돈이 필요한 시기"],
    steps: ["가까이 쓸 돈", "투자할 돈"],
    direction: "가까운 시기에 쓸 돈과 투자할 돈을 먼저 나눴습니다.",
    sample: true,
  },
  {
    id: "case-03",
    tab: "CASE 03",
    question: "퇴직연금 그냥 두고 있는데 괜찮나요?",
    lookedLead: "바꾸기 전에",
    looked: ["현재 제도 (DB·DC)", "운용 상태", "은퇴까지 남은 시간"],
    steps: ["제도 확인", "운용 상태 점검", "은퇴 시기에 맞추기"],
    direction: "무엇부터 확인할지 순서부터 정리했습니다.",
    sample: true,
  },
];
