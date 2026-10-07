import type { Metadata } from "next";
import { Bullets, LegalPage, LegalSection } from "@/components/ui/legal";
import { compliance } from "@/config/site";

export const metadata: Metadata = {
  title: "이용안내",
  description: "황진 개인금융 안내 페이지와 1분 금융점검의 성격, 이용 시 유의사항입니다.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="이용안내" intro={<p>이 페이지를 이용하시기 전에 아래 내용을 한 번 읽어주세요.</p>}>
      <LegalSection title="1. 이 페이지의 성격">
        <p>{compliance.pageNotice}</p>
        <p>개별 금융상품의 안내·판매가 필요한 경우에는 이 페이지와 분리된 별도의 절차와 법령상 필요한 고지를 거칩니다.</p>
      </LegalSection>
      <LegalSection title="2. 1분 금융점검">
        <p>{compliance.resultNotice}</p>
        <Bullets
          items={[
            "점검 답변과 결과는 이용자의 브라우저 탭(sessionStorage)에만 잠시 저장되며 서버로 전송되지 않습니다.",
            "상담을 신청하면서 ‘점검 결과 함께 보내기’를 선택한 경우에만 결과 유형과 관심 영역이 상담 정보와 함께 전달됩니다.",
            "결과는 질문 7개의 응답을 단순 합산한 참고 정보이며 재무건전성, 투자성향, 적합성을 판단하지 않습니다.",
          ]}
        />
      </LegalSection>
      <LegalSection title="3. 상담">
        <p>상담 과정에서 어떤 상품을 바꾸거나 새로 가입하도록 요구하지 않습니다. 최종 결정은 언제나 본인의 몫입니다.</p>
        <p>금융상품에 가입하시기 전에는 상품설명서와 약관을 꼭 확인하시기 바랍니다.</p>
      </LegalSection>
      {compliance.affiliation && (
        <LegalSection title="4. 소속 안내">
          <p>{compliance.affiliation}</p>
        </LegalSection>
      )}
    </LegalPage>
  );
}
