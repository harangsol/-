"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ContactOptions } from "@/components/contact/contact-options";
import { OPEN_CONTACT_EVENT } from "@/components/layout/sticky-cta";
import { Modal } from "@/components/ui/modal";
import { ShareButton } from "@/components/ui/share-button";
import { Arrow, buttonClass, Container } from "@/components/ui/primitives";
import { compliance } from "@/config/site";
import { track } from "@/lib/analytics";
import {
  defaultActions,
  interestLabels,
  priorityActions,
  priorityDescriptions,
  priorityLabels,
  resultCopy,
} from "@/lib/diagnostic/questions";
import { clearProgress, clearResult } from "@/lib/diagnostic/storage";
import { useStoredResult } from "@/lib/diagnostic/use-stored-result";


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
          1분 금융점검 하기
          <Arrow />
        </Link>
      </Container>
    );
  }

  const copy = resultCopy[result.type];
  const focusTag = result.tags[0];
  const actions = focusTag ? priorityActions[focusTag] : defaultActions;

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
      {/* 1. 결과 유형 */}
      <section aria-labelledby="result-title" className="bg-ivory pb-14 pt-24 sm:pb-20 sm:pt-32">
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
          <p className="mt-8 rounded-[8px] border border-line bg-white px-5 py-4 text-base leading-relaxed text-muted">
            {compliance.resultNotice}
          </p>
        </Container>
      </section>

      {/* 2. 지금 먼저 확인해볼 영역 */}
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
        </Container>
      </section>

      {/* 3. 이번 주에 해볼 것 — 가장 먼저 볼 영역 하나에 대해 2~3단계 */}
      <section aria-labelledby="actions-title" className="bg-ivory py-14 sm:py-20">
        <Container className="max-w-[44rem]">
          <h2 id="actions-title" className="text-[1.375rem] font-bold text-navy sm:text-[1.625rem]">
            이번 주에 해볼 것
          </h2>
          <p className="mt-2 text-muted">
            {focusTag ? (
              <>
                <strong className="font-semibold text-green">{priorityLabels[focusTag]}</strong>부터, 혼자서 10~20분이면 됩니다.
              </>
            ) : (
              "혼자서 10~20분이면 할 수 있는 것들입니다."
            )}
          </p>
          <ol className="mt-6 overflow-hidden rounded-[8px] border border-line bg-white">
            {actions.map((a, i) => (
              <li key={a} className="flex items-center gap-4 border-b border-dashed border-line px-5 py-4 last:border-0">
                <span className="w-7 shrink-0 font-bold tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-navy">{a}</span>
              </li>
            ))}
          </ol>
          {result.tags.length > 1 && (
            <p className="mt-4 text-base text-muted">나머지 영역은 이야기하면서 순서를 함께 정해도 됩니다.</p>
          )}
        </Container>
      </section>

      {/* 4. 황진에게 한번 물어보기 */}
      <section id="final-cta" aria-labelledby="next-title" className="on-navy bg-navy py-16 text-on-navy sm:py-20">
        <Container className="max-w-[44rem]">
          <h2 id="next-title" className="text-[1.5rem] font-bold leading-[1.45] sm:text-[1.875rem]">
            혼자 정리해봐도 괜찮고,
            <br />
            지금 상황을 편하게 이야기해도 됩니다.
          </h2>
          <p className="mt-4 text-on-navy-muted">
            가장 궁금하다고 하신 <strong className="font-semibold text-on-navy">‘{interestLabels[result.interest]}’</strong>부터 이야기할 수
            있어요. 가입 권유부터 하지 않고, 최종 결정은 언제나 본인의 몫입니다.
          </p>
          {/* 결과 화면에서는 하단 고정 버튼이 처음부터 보이고, 이 구역이 보이면 숨는다(sticky-cta.tsx). */}
          <button
            id="result-cta"
            type="button"
            onClick={() => openContact("result_main")}
            className={buttonClass("primary", "mt-8 w-full text-[1.125rem] sm:w-auto sm:px-8")}
          >
            내 상황 편하게 이야기해보기
            <Arrow />
          </button>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-base">
            <Link href="/check" onClick={restart} className="flex min-h-11 items-center text-on-navy underline underline-offset-4">
              다시 점검하기
            </Link>
            <Link href="/#about" className="flex min-h-11 items-center text-on-navy underline underline-offset-4">
              황진 소개 보기
            </Link>
          </div>
        </Container>
      </section>

      <section aria-labelledby="share-title" className="bg-paper py-14 sm:py-16">
        <Container className="max-w-[44rem]">
          <h2 id="share-title" className="text-[1.375rem] font-bold text-navy sm:text-[1.625rem]">
            주변에도 한번 해보라고 보내주세요
          </h2>
          <p className="mt-3 text-muted">상품을 권하려고 보내지 않으셔도 됩니다. ‘한번 정리해봐’ 한마디면 충분해요.</p>
          <ShareButton location="result" variant="outline" label="필요한 분께 이 페이지 보내기" className="mt-6 w-full sm:w-auto sm:px-8" />
        </Container>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="황진에게 한번 물어보기" labelId="contact-dialog-title">
        <p className="mb-5 text-muted">편한 방법을 골라주세요. 어떤 방법이든 가입 권유부터 하지 않습니다.</p>
        <ContactOptions location="result_dialog" resultType={result.type} />
      </Modal>
    </>
  );
}
