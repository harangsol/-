"use client";

import { ContactOptions } from "./contact-options";
import { ConsultationForm } from "./consultation-form";

export function ContactPanel() {
  const toForm = () => {
    const el = document.getElementById("form");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => el?.querySelector<HTMLInputElement>("input[name='name']")?.focus({ preventScroll: true }), 400);
  };
  return (
    <>
      <section aria-labelledby="channels-title" className="mt-10">
        <h2 id="channels-title" className="sr-only">
          연락 방법
        </h2>
        <ContactOptions location="contact_page" onFormSelect={toForm} />
      </section>

      <section id="form" aria-labelledby="form-title" className="mt-16 scroll-mt-24 border-t border-line pt-12">
        <h2 id="form-title" className="text-[1.5rem] font-bold text-navy sm:text-[1.75rem]">
          내 상황 한번 얘기해보기
        </h2>
        <p className="mb-8 mt-3 text-muted">이름과 연락처, 궁금한 영역만 있으면 됩니다. 정리된 질문이 없어도 괜찮아요.</p>
        <ConsultationForm />
      </section>
    </>
  );
}
