import type { Metadata } from "next";
import { Diagnostic } from "@/components/diagnostic/diagnostic";

export const metadata: Metadata = {
  title: "1분 개인금융 점검",
  description:
    "질문 8개, 약 1분. 이름이나 연락처 없이 지금 내 돈에서 무엇을 먼저 봐야 할지 확인해보세요. 보험, 연금, 퇴직연금, 투자까지.",
  alternates: { canonical: "/check" },
};

export default function CheckPage() {
  return <Diagnostic />;
}
