import type { Metadata } from "next";
import { ContactPanel } from "@/components/contact/contact-panel";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "황진에게 한번 물어보기",
  description: "카카오톡, 연락처 남기기, 전화 중 편한 방법으로 물어보세요. 가입 권유부터 하지 않습니다.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="bg-ivory pb-24 pt-24 sm:pt-32">
      <Container className="max-w-[40rem]">
        <p className="text-base font-semibold text-green">물어보기</p>
        <h1 className="mt-4 text-[1.875rem] font-extrabold leading-[1.35] tracking-[-0.04em] text-navy sm:text-[2.5rem]">
          황진에게 한번 물어보기
        </h1>
        <p className="mt-4 text-muted">
          대출이든 보험이든 연금이든, 정리된 질문이 없어도 괜찮습니다. 지금 상황을 듣고 무엇부터 보면 좋을지 같이 이야기합니다. 가입 권유부터 하지 않습니다.
        </p>
        <ContactPanel />
      </Container>
    </div>
  );
}
