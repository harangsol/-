"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ContactOptions } from "@/components/contact/contact-options";
import { OPEN_CONTACT_EVENT } from "@/components/layout/sticky-cta";
import { Modal } from "@/components/ui/modal";
import { Arrow, buttonClass, Container, cx } from "@/components/ui/primitives";
import { compliance } from "@/config/site";
import { track } from "@/lib/analytics";
import {
  interestLabels,
  priorityDescriptions,
  priorityLabels,
  resultCopy,
} from "@/lib/diagnostic/questions";
import { clearProgress, clearResult } from "@/lib/diagnostic/storage";
import { useStoredResult } from "@/lib/diagnostic/use-stored-result";

const ORDER_LABELS = ["지금", "다음", "나중"] as const;

export function ResultView() {
  const result = useStoredResult();
  const [open, setOpen] = useState(false);
  const viewed = useRef<number | null>(null);

  useEffect(() => {
    const r = result;
    if (r && viewed.current !== r.completedAt) {
      viewed.current = r.completedAt;
      track("result_view", {
        result_type: r.type,
        total_score: r.total,
        interest_area: r.interest,
        priority_tags: r.tags.join(","),
      });
    }
  }, [result]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_CONTACT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONTACT_EVENT, onOpen);
  }, []);

  if (result === undefined) {
    return <div className="min-h-dvh bg-ivory" aria-busy="true" />;
  }

  if (result === null) {
    return (
      <Container className="flex min-h-[80dvh] max-w-[36rem] flex-col justify-center pb-20 pt-28">
        <h1 className="text-[1.75rem] font-bold text-navy">아직 점검 결과가 없어요.</h1>
        <p className="mt-4 text-muted">
          결과는 이 브라우저 탭에만 잠시 저장되기 때문에, 탭을 닫았거나 다른 기기에서 열면 보이지 않습니다. 1분이면 다시 확인할 수
          있어요.
        </p>
        <Link href="/check" className={buttonClass("primary", "mt-8 w-full sm:w-auto sm:px-8")}>
          1분 개인금융 점검하기
          <Arrow />
        </Link>
      </Container>
    );
  }

  const copy = resultCopy[result.type];
  const order = result.tags.slice(0, 3);

  const openContact = (location: string) => {
    track("result_cta_click", { location, result_type: result.type });
    setOpen(true);
  };

  const restart = () => {
    clearResult();
    clearProgress();
  };

  return (
    <>
      <section aria-labelledby="result-title" className="bg-ivory pb-16 pt-24 sm:pb-24 sm:pt-32">
        <Container className="max-w-[44rem]">
          <p className="text-base font-semibold text-green">1분 점검 결과</p>
          <h1 id="result-title" className="pre-line mt-4 text-[1.875rem] font-extrabold leading-[1.35] tracking-[-0.04em] text-navy sm:text-[2.5rem]">
            {copy.title}
          </h1>
          <div className="mt-6 space-y-3 text-[1.0625rem] text-ink/90 sm:text-[1.1875rem]">
            {copy.body.map((b) => (
              <p key={b}>{b}</p>
            ))}
          </div>

          <div className="mt-10">
            <button
              id="hero-cta"
              type="button"
              onClick={() => openContact("result_main")}
              className={buttonClass("primary", "w-full text-[1.125rem] sm:w-auto sm:px-8")}
            >
              {copy.cta}
              <Arrow />
            </button>
            <p className="mt-3 text-base text-muted">가입 권유 없이, 지금 상황부터 같이 봅니다.</p>
          </div>
          <p className="mt-10 rounded-[8px] border border-line bg-white px-5 py-4 text-base leading-relaxed text-muted">
            {compliance.resultNotice}
          </p>
        </Container>
      </section>

      <section aria-labelledby="tags-title" className="border-t border-line bg-paper py-14 sm:py-20">
        <Container className="max-w-[44rem]">
          <h2 id="tags-title" className="text-[1.375rem] font-bold text-navy sm:text-[1.625rem]">
            지금 먼저 확인해볼 영역
          </h2>
          {result.tags.length > 0 ? (
            <>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="먼저 확인해볼 영역">
                {result.tags.map((t) => (
                  <li key={t} className="rounded-full border border-green/30 bg-white px-4 py-1.5 text-base font-semibold text-green-deep">
                    {priorityLabels[t]}
                  </li>
                ))}
              </ul>
              <dl className="mt-8 border-t border-navy/15">
                {result.tags.map((t) => (
                  <div key={t} className="border-b border-navy/15 py-4">
                    <dt className="font-semibold text-navy">{priorityLabels[t]}</dt>
                    <dd className="mt-1 text-muted">{priorityDescriptions[t]}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="mt-4 text-muted">
              특별히 먼저 볼 곳은 보이지 않았어요. 1년에 한 번쯤, 각각의 돈이 같은 방향을 보고 있는지만 확인해보세요.
            </p>
          )}

          <p className="mt-8 text-ink/90">
            가장 궁금하다고 하신 영역은 <strong className="font-semibold text-navy">‘{interestLabels[result.interest]}’</strong>
            입니다. 상담을 신청하시면 이 부분부터 이야기할 수 있어요.
          </p>
        </Container>
      </section>

      {order.length >= 2 && (
        <section aria-labelledby="order-title" className="bg-ivory py-14 sm:py-20">
          <Container className="max-w-[44rem]">
            <h2 id="order-title" className="text-[1.375rem] font-bold text-navy sm:text-[1.625rem]">
              이런 순서로 볼 수 있어요
            </h2>
            <p className="mt-2 text-muted">기초가 되는 영역부터 차례로 놓아본 예시입니다.</p>
            <ol className="mt-6 overflow-hidden rounded-[8px] border border-line bg-white">
              {order.map((t, i) => (
                <li key={t} className="flex items-center gap-5 border-b border-dashed border-line px-5 py-4 last:border-0">
                  <span className={cx("w-10 shrink-0 font-bold", i === 0 ? "text-green" : "text-navy/70")}>{ORDER_LABELS[i]}</span>
                  <span className="font-medium text-ink">{priorityLabels[t]}</span>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      )}

      <section id="final-cta" aria-labelledby="next-title" className="on-navy bg-navy py-16 text-on-navy sm:py-20">
        <Container className="max-w-[44rem]">
          <h2 id="next-title" className="text-[1.5rem] font-bold sm:text-[1.875rem]">
            혼자 정리하기 어렵다면
          </h2>
          <p className="mt-4 text-on-navy-muted">
            지금 가진 것 중 유지할 것부터 함께 찾아봅니다. 무엇을 바꿀지는 그다음이고, 최종 결정은 언제나 본인의 몫입니다.
          </p>
          <button type="button" onClick={() => openContact("result_bottom")} className={buttonClass("light", "mt-8 w-full sm:w-auto sm:px-8")}>
            황진에게 한번 물어보기
            <Arrow />
          </button>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-base">
            <Link href="/check" onClick={restart} className="flex min-h-11 items-center text-on-navy underline underline-offset-4">
              다시 점검하기
            </Link>
            <Link href="/" className="flex min-h-11 items-center text-on-navy underline underline-offset-4">
              황진 소개 보기
            </Link>
          </div>
        </Container>
      </section>


      <Modal open={open} onClose={() => setOpen(false)} title="황진에게 한번 물어보기" labelId="contact-dialog-title">
        <p className="mb-5 text-muted">편한 방법을 골라주세요. 어떤 방법이든 가입 권유부터 하지 않습니다.</p>
        <ContactOptions location="result_dialog" resultType={result.type} />
      </Modal>
    </>
  );
}
