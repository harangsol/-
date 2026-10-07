import type { Metadata } from "next";
import { ResultView } from "@/components/diagnostic/result-view";

export const metadata: Metadata = {
  title: "1분 점검 결과",
  description: "지금 먼저 확인해볼 영역을 정리했습니다.",
  alternates: { canonical: "/check/result" },
  // 개인별 결과 화면이므로 검색에 노출하지 않는다.
  robots: { index: false, follow: true },
};

export default function ResultPage() {
  return <ResultView />;
}
