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
  /** 먼저 본 것 */
  looked: string[];
  /** 정리한 방향 (한 문장) */
  direction: string;
  /** 정리한 방향을 단계로 나눠 보여줄 때 (선택) */
  steps?: string[];
  sample: boolean;
};

export const consultCases: ConsultCase[] = [
  {
    id: "case-01",
    tab: "CASE 01",
    question: "보험료가 너무 많이 나가는 것 같아요.",
    looked: ["보험만 보지 않고 월 지출", "기존 대출 상환액", "비상자금까지 함께 확인"],
    direction: "유지할 것, 확인할 것, 다음에 준비할 것으로 구분했습니다.",
    steps: ["유지할 것", "확인할 것", "다음에 준비할 것"],
    sample: true,
  },
  {
    id: "case-02",
    tab: "CASE 02",
    question: "투자를 시작하고 싶어요.",
    looked: ["보유 현금", "대출", "앞으로 필요한 큰돈의 시기 확인"],
    direction: "투자할 돈과 가까운 시기에 사용할 돈을 먼저 분리했습니다.",
    steps: ["가까운 시기에 쓸 돈", "투자할 돈"],
    sample: true,
  },
  {
    id: "case-03",
    tab: "CASE 03",
    question: "퇴직연금 그냥 두고 있는데 괜찮나요?",
    looked: ["현재 제도(DB·DC)", "운용 상태", "은퇴까지 남은 시간"],
    direction: "무엇부터 확인해야 할지 순서부터 정리했습니다.",
    sample: true,
  },
];
